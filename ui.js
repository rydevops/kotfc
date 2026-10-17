/* =========================================================================
   ui.js — DOM user-interface building blocks:
   dialog boxes with typewriter text + portraits, choices, selectable lists
   (tap or keyboard), toasts, chapter cards and the Flow meter widget.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const $ = (id) => document.getElementById(id);

  /* Speakers: id → { name, look, pitch, voice }. Story files can add more. */
  G.speakers = G.speakers || {};

  function parseMarkup(text) {
    // *word* → emphasis, ~word~ → current-glow
    const segs = [];
    const re = /(\*[^*]+\*|~[^~]+~)/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) segs.push({ t: text.slice(last, m.index) });
      segs.push({ t: m[0].slice(1, -1), cls: m[0][0] === '*' ? 'em' : 'glow' });
      last = re.lastIndex;
    }
    if (last < text.length) segs.push({ t: text.slice(last) });
    return segs;
  }
  function renderSegs(segs, n) {
    let out = '', left = n;
    for (const s of segs) {
      if (left <= 0) break;
      const part = U.esc(s.t.slice(0, left));
      left -= s.t.length;
      out += s.cls ? `<span class="${s.cls}">${part}</span>` : part;
    }
    return out;
  }

  const ui = (G.ui = {
    /* ---- Dialog ----
       await G.ui.say('pip', 'Hello!')  or  G.ui.say(null, 'Narration...') */
    say(who, text, opts = {}) {
      return new Promise((resolve) => {
        const layer = $('layer-dialog');
        const sp = typeof who === 'string' ? G.speakers[who] || { name: who } : who;
        const box = U.el('div', 'dialog win' + (sp ? '' : ' narrate') + (opts.top ? ' top' : ''));
        if (sp && sp.look) {
          const img = U.el('img', 'portrait');
          img.src = G.sprites.portrait(sp.look);
          box.appendChild(img);
        }
        const body = U.el('div', 'dialog-body');
        if (sp && sp.name) body.appendChild(U.el('div', 'dialog-name', U.esc(sp.name)));
        const txt = U.el('div', 'dialog-text');
        body.appendChild(txt);
        box.appendChild(body);
        const more = U.el('div', 'dialog-more', '▼');
        box.appendChild(more);
        layer.innerHTML = '';
        layer.appendChild(box);
        layer.classList.add('catch');

        const segs = parseMarkup(text);
        const total = segs.reduce((s, x) => s + x.t.length, 0);
        let n = 0, done = false, timer;
        const speed = opts.speed || 28;
        const finish = () => {
          done = true; clearInterval(timer); txt.innerHTML = renderSegs(segs, total);
          if (opts.choices) { more.remove(); advance(); return; } // choices appear right away
          more.classList.add('show');
        };
        timer = setInterval(() => {
          n += 1;
          txt.innerHTML = renderSegs(segs, n);
          if (n % 3 === 1) {
            if (sp && sp.voice === 'cog') { if (n % 9 === 1) G.audio.sfx('cog'); }
            else G.audio.sfx('blip', { pitch: (sp && sp.pitch) || 700 });
          }
          if (n >= total) finish();
        }, speed);

        const advance = () => {
          if (!done) return finish();
          G.input.pop(handler);
          box.removeEventListener('pointerdown', onTap);
          layer.removeEventListener('pointerdown', onTap);
          if (!opts.keep) { layer.innerHTML = ''; layer.classList.remove('catch'); }
          G.audio.sfx('cursor');
          resolve();
        };
        const handler = G.input.push((b) => { if (b === 'a' || b === 'b') advance(); return true; });
        handler.modal = true;
        const onTap = (e) => { e.stopPropagation(); advance(); };
        // tapping anywhere advances (the dialog layer catches taps while active)
        layer.addEventListener('pointerdown', onTap);
      });
    },

    /* ---- Choice ---- resolves to the chosen index */
    async choose(who, text, options, opts = {}) {
      if (text) {
        await ui.say(who, text, { keep: true, choices: true });
      }
      const layer = $('layer-dialog');
      const box = U.el('div', 'choice win');
      layer.appendChild(box);
      const lo = {};
      if (opts.cancel !== undefined) lo.cancel = opts.cancel;
      const idx = await ui.list(box, options.map((o, i) => ({ label: o, value: i })), lo);
      layer.innerHTML = '';
      layer.classList.remove('catch');
      return idx == null ? opts.cancel : idx;
    },
    confirm(text, yes = 'Yes', no = 'No') {
      return ui.choose(null, text, [yes, no], { cancel: 1 }).then((i) => i === 0);
    },

    /* ---- Selectable list ----
       items: [{ label, value, right, desc, disabled, cls }]
       opts: { cols, cancel (value returned on B; omit to disallow), onFocus(item), start } */
    list(container, items, opts = {}) {
      return new Promise((resolve) => {
        container.innerHTML = '';
        container.classList.add('list');
        if (opts.cols) container.style.gridTemplateColumns = `repeat(${opts.cols}, 1fr)`;
        const btns = items.map((it, i) => {
          const b = U.el('button', 'item tap' + (it.disabled ? ' disabled' : '') + (it.cls ? ' ' + it.cls : ''));
          b.innerHTML = `<span class="l">${it.label}</span>` + (it.right != null ? `<span class="r">${it.right}</span>` : '');
          // Activate on pointerup (not 'click'): iOS drops or delays synthetic clicks,
          // which made menus feel unresponsive. A small drag still counts as a tap,
          // a real scroll gesture does not.
          let down = null;
          b.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            down = { id: e.pointerId, x: e.clientX, y: e.clientY };
            b.classList.add('press');
          });
          const clear = () => { down = null; b.classList.remove('press'); };
          b.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            const d = down; clear();
            if (!d || d.id !== e.pointerId || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 14) return;
            if (it.disabled) { G.audio.sfx('error'); return; }
            if (focus !== i) setFocus(i, true);
            pick(i);
          });
          b.addEventListener('pointercancel', clear);
          b.addEventListener('pointerleave', clear);
          b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
          b.tabIndex = -1;
          b.tap = () => { if (!it.disabled) { if (focus !== i) setFocus(i, true); pick(i); } };
          container.appendChild(b);
          return b;
        });
        let focus = -1;
        const setFocus = (i, silent) => {
          if (!btns.length) return;
          i = (i + btns.length) % btns.length;
          if (btns[focus]) btns[focus].classList.remove('focus');
          focus = i;
          btns[i].classList.add('focus');
          // keep the focused item visible without scrolling the page itself
          const b = btns[i], sc = b.closest('.scroll') || container;
          if (sc.scrollHeight > sc.clientHeight) {
            const br = b.getBoundingClientRect(), sr = sc.getBoundingClientRect();
            if (br.top < sr.top) sc.scrollTop -= sr.top - br.top;
            else if (br.bottom > sr.bottom) sc.scrollTop += br.bottom - sr.bottom;
          }
          if (!silent) G.audio.sfx('cursor');
          opts.onFocus && opts.onFocus(items[i], i);
        };
        const cols = opts.cols || 1;
        const canCancel = 'cancel' in opts;
        let ended = false;
        const end = (v) => {
          if (ended) return;
          ended = true;
          G.input.pop(handler);
          container._cancel = null;
          resolve(v);
        };
        const pick = (i) => {
          if (items[i].disabled) return G.audio.sfx('error');
          G.audio.sfx('confirm');
          end(items[i].value);
        };
        const handler = G.input.push((b) => {
          if (b === 'up') setFocus(focus - cols);
          else if (b === 'down') setFocus(focus + cols);
          else if (b === 'left' && cols > 1) setFocus(focus - 1);
          else if (b === 'right' && cols > 1) setFocus(focus + 1);
          else if (b === 'a') { if (focus >= 0) pick(focus); }
          else if ((b === 'b' || b === 'menu') && canCancel) { G.audio.sfx('cancel'); end(opts.cancel); }
          return true;
        });
        handler.modal = true;
        // close via external call (e.g. a back button)
        container._cancel = () => { if (canCancel) { G.audio.sfx('cancel'); end(opts.cancel); } };
        const first = items.findIndex((it) => !it.disabled);
        setFocus(opts.start != null ? opts.start : Math.max(0, first), true);
      });
    },

    /* Reliable tap handler for any element (fires on pointerup, ignores drags). */
    onTap(el, fn) {
      let down = null;
      el.addEventListener('pointerdown', (e) => { down = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
      el.addEventListener('pointerup', (e) => {
        const d = down; down = null;
        if (!d || d.id !== e.pointerId || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 14) return;
        e.stopPropagation();
        fn(e);
      });
      el.addEventListener('pointercancel', () => (down = null));
    },

    /* ---- Toast ---- */
    toast(html, ms = 2200) {
      const t = U.el('div', 'toast win', html);
      $('layer-toast').appendChild(t);
      requestAnimationFrame(() => t.classList.add('show'));
      setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, ms);
    },

    /* ---- Chapter card ---- */
    async card(title, sub, ms = 2600) {
      const c = U.el('div', 'card', `<div class="card-sub">${U.esc(sub || '')}</div><div class="card-title">${U.esc(title)}</div><div class="card-line"></div>`);
      $('layer-dialog').appendChild(c);
      requestAnimationFrame(() => c.classList.add('show'));
      await U.sleep(ms);
      c.classList.remove('show');
      await U.sleep(700);
      c.remove();
    },

    /* ---- Flow meter widget (shared by HUD and battle) ---- */
    flowHTML(flow, big) {
      const st = G.flowState(flow);
      let pips = '';
      for (let i = 0; i < 10; i++) pips += `<i class="${i < flow ? 'on' : ''}"></i>`;
      return `<div class="flow ${st.cls}${big ? ' big' : ''}"><span class="flow-label">${big ? 'FLOW · ' : ''}${st.name}</span><span class="pips">${pips}</span></div>`;
    },

    bar(cur, max, cls) {
      const p = max ? U.clamp(cur / max, 0, 1) * 100 : 0;
      return `<span class="bar ${cls}"><span style="width:${p}%"></span></span>`;
    },
  });

  /* The white glove cursor, drawn once and shared with CSS as --cursor */
  ui.cursorCanvas = (function () {
    const rows = [
      '.....kkkkk........',
      '....kwwwwwkkkkkkk.',
      '...kwwwwwwwwwwwwwk',
      '..kwwgwwwwkkkkkkk.',
      '..kwgwwwwwwwwk....',
      '..kwgwwwwkkkk.....',
      '..kwggwwwwwwk.....',
      '..kwgggwwkkk......',
      '...kwgggwwwk......',
      '....kkkkkkk.......'];
    const c = G.art.paint(G.art.grid(rows), { k: '#101018', w: '#f8f8f8', g: '#a8acc8' });
    try { document.documentElement.style.setProperty('--cursor', `url(${G.gfx.toDataURL(c, 3)})`); } catch (e) { /* ignore */ }
    return c;
  })();

  /* Flow meter states from the design doc */
  G.flowState = (f) => {
    if (f >= 10) return { name: 'Bright', cls: 'bright' };
    if (f >= 4) return { name: 'Steady', cls: 'steady' };
    return { name: 'Dim', cls: 'dim' };
  };
})();
