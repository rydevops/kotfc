/* =========================================================================
   menu.js — pause menu (party, items, equipment, journal, settings, save),
   shops and inns.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const $ = (sel, root) => root.querySelector(sel);
  const STATS = ['str', 'def', 'res', 'luk', 'spd'];

  function layer() { return document.getElementById('layer-menu'); }
  function frame(title, sub) {
    const L = layer();
    L.innerHTML = `
      <div class="menu win">
        <div class="menu-head"><span class="menu-title">${U.esc(title)}</span><span class="menu-sub">${sub || ''}</span>
          <button class="menu-x tap" aria-label="Close">✕</button></div>
        <div class="menu-tabs list"></div>
        <div class="menu-body scroll"></div>
        <div class="menu-desc"></div>
      </div>`;
    L.classList.add('open');
    const root = $('.menu', L);
    G.ui.onTap($('.menu-x', root), (e) => { e.stopPropagation(); const t = root.querySelector('.list._active') || $('.menu-tabs', root); t._cancel && t._cancel(); });
    return root;
  }
  function close() { const L = layer(); L.innerHTML = ''; L.classList.remove('open'); }
  // run a list inside `el`, marking it as the one the ✕ button cancels
  async function runList(el, items, opts) {
    el.classList.add('_active');
    const v = await G.ui.list(el, items, opts);
    el.classList.remove('_active');
    return v;
  }
  const st = () => G.game.state;

  function memberCard(m, compact) {
    const d = G.data.chars[m.id], s = G.game.stats(m);
    const stats = STATS.map((k) => `<span class="stat"><small>${k.toUpperCase()}</small>${s[k]}</span>`).join('');
    return `<div class="mcard ${compact ? 'compact' : ''}">
      <img class="portrait" src="${G.sprites.portrait(d.look)}" alt="">
      <div class="minfo">
        <div class="mname">${U.esc(d.name)} <small>Lv ${m.lvl} · ${U.esc(d.role)}</small></div>
        <div class="mbars"><span><small>HP</small> ${m.hp}/${s.hp} ${G.ui.bar(m.hp, s.hp, 'hp')}</span><span><small>MP</small> ${m.mp}/${s.mp} ${G.ui.bar(m.mp, s.mp, 'mp')}</span></div>
        ${compact ? '' : `<div class="mstats">${stats}</div><div class="mexp"><small>Next level</small> ${G.game.expToNext(m.lvl) - m.exp} EXP</div>`}
      </div></div>`;
  }

  /* ---------- quantity stepper: [-] 3 [+]   total   [Go] ----------
     Used by the shops (Buy / Sell) and the discard prompt. Press and hold
     to repeat. q.set({min,max,qty,total,ok,goText}) redraws it. */
  function holdTap(el, fn) {
    let t = null, iv = null;
    const stop = () => { clearTimeout(t); clearInterval(iv); t = iv = null; el.classList.remove('press'); };
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); e.preventDefault();
      el.classList.add('press'); fn();
      t = setTimeout(() => { iv = setInterval(fn, 80); }, 380);
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(ev, (e) => { e.stopPropagation(); stop(); });
    el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
  }
  function makeQty(opts = {}) {
    const el = U.el('div', 'qtybar' + (opts.bare ? ' bare' : ''));
    el.innerHTML = `<div class="q-step"><button class="q-btn q-minus" aria-label="Fewer">−</button><span class="q-n">1</span><button class="q-btn q-plus" aria-label="More">+</button></div>` +
      (opts.bare ? '' : `<span class="q-total"></span><button class="q-go tap">${opts.goLabel || 'OK'}</button>`);
    const q = { el, min: 1, max: 1, qty: 1, ok: true };
    const n = $('.q-n', el), minus = $('.q-minus', el), plus = $('.q-plus', el), total = $('.q-total', el), go = $('.q-go', el);
    q.draw = () => {
      n.textContent = q.qty;
      minus.classList.toggle('disabled', q.qty <= q.min);
      plus.classList.toggle('disabled', q.qty >= q.max);
      if (total) { total.textContent = q.total || ''; total.classList.toggle('bad', !q.ok); }
      if (go) { go.classList.toggle('disabled', !q.ok); if (q.goText) go.textContent = q.goText; }
    };
    q.set = (o) => {
      Object.assign(q, o);
      q.max = Math.max(q.min, q.max);
      q.qty = U.clamp(q.qty, q.min, q.max);
      q.draw();
    };
    q.step = (d) => {
      const v = U.clamp(q.qty + d, q.min, q.max);
      if (v === q.qty) { G.audio.sfx('error'); return; }
      q.qty = v; G.audio.sfx('cursor'); q.draw();
    };
    holdTap(minus, () => q.step(-1));
    holdTap(plus, () => q.step(1));
    if (go) G.ui.onTap(go, () => q.onGo && q.onGo());
    return q;
  }

  /* ---------- a small pop-up menu over the pause menu ----------
     popup(root, { title, qty: {max}, options: [{label,value,right,disabled}] })
     resolves { value, qty } — value is null when cancelled. */
  async function popup(root, { title, sub, qty, options, cancelIndex }) {
    const scrim = U.el('div', 'scrim');
    const pop = U.el('div', 'popmenu win');
    pop.innerHTML = `<div class="pm-title">${title}</div>${sub ? `<div class="pm-sub">${sub}</div>` : ''}<div class="pm-qty"></div><div class="pm-list"></div>`;
    scrim.appendChild(pop);
    root.appendChild(scrim);
    let q = null;
    if (qty) {
      q = makeQty({ bare: true });
      q.set({ min: 1, max: qty.max, qty: 1 });
      $('.pm-qty', pop).appendChild(q.el);
    } else $('.pm-qty', pop).remove();
    const listEl = $('.pm-list', pop);
    pop.addEventListener('pointerdown', (e) => e.stopPropagation());
    scrim.addEventListener('pointerdown', (e) => { if (e.target === scrim) { e.stopPropagation(); listEl._cancel && listEl._cancel(); } });
    const v = await runList(listEl, options, {
      cancel: null,
      start: Math.max(0, options.findIndex((o) => !o.disabled)),
      onKey: q ? (b) => { if (b === 'left') { q.step(-1); return true; } if (b === 'right') { q.step(1); return true; } return false; } : null,
    });
    const out = { value: v, qty: q ? q.qty : 1 };
    scrim.remove();
    return out;
  }
  const isGear = (it) => it.type === 'weapon' || it.type === 'armor' || it.type === 'charm';
  const itemStats = (item) => (item.stats ? ' — ' + Object.entries(item.stats).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(' ') + (item.who ? ` (${item.who.map((w) => G.data.chars[w].short).join(', ')})` : '') : '');
  const describe = (id) => { const item = G.data.items[id]; return `<b>${U.esc(item.name)}</b> — ${U.esc(item.desc + itemStats(item))}`; };

  const menu = (G.menu = {
    async open() {
      const w = G.world;
      w.busy++;
      G.audio.sfx('confirm');
      try {
        let tab = 0;
        for (;;) {
          const root = frame('Menu', `◈ ${st().gold} gold · ⧗ ${U.fmtTime(st().playtime)}`);
          const tabs = $('.menu-tabs', root);
          tabs.style.gridTemplateColumns = 'repeat(4, 1fr)';
          const body = $('.menu-body', root);
          body.innerHTML = `<div class="flowcard">${G.ui.flowHTML(st().flow, true)}<p>The party's shared Current. Skills spend it; attacks, Guarding, and taking hits restore it. Resting at an inn settles it back to zero.</p></div>` +
            st().party.map((m) => memberCard(m, true)).join('') +
            `<p class="objective">◆ ${U.esc(st().objective || 'Explore.')}</p>`;
          const choice = await runList(tabs, [
            { label: 'Party', value: 'party' }, { label: 'Items', value: 'items' }, { label: 'Equip', value: 'equip' }, { label: 'Journal', value: 'journal' },
            { label: 'Settings', value: 'settings' }, { label: 'Save', value: 'save' }, { label: 'Title', value: 'title' }, { label: 'Close', value: null },
          ], { cols: 4, cancel: null, start: tab });
          if (!choice) break;
          tab = ['party', 'items', 'equip', 'journal', 'settings', 'save', 'title'].indexOf(choice);
          if (choice === 'party') await menu.partyView();
          else if (choice === 'items') await menu.itemsView();
          else if (choice === 'equip') await menu.equipView();
          else if (choice === 'journal') await menu.journalView();
          else if (choice === 'settings') await menu.settingsView();
          else if (choice === 'save') {
            const ok = G.game.save();
            G.audio.sfx(ok ? 'save' : 'error');
            G.ui.toast(ok ? `Saved to slot ${st().slot}.` : 'Could not save (storage full or private mode).');
          } else if (choice === 'title') {
            close();
            if (await G.ui.confirm('Return to the title screen? Unsaved progress will be lost.', 'Return', 'Stay')) {
              w.busy = 0;
              await G.scenes.go('title');
              return;
            }
          }
        }
      } finally {
        close();
        w.busy = Math.max(0, w.busy - 1);
        w.updateHud(false);
        G.input.clearPresses();
      }
    },

    async partyView() {
      let i = 0;
      for (;;) {
        const root = frame('Party', 'Tap a name to view');
        const m = st().party[i];
        const d = G.data.chars[m.id];
        const body = $('.menu-body', root);
        const eq = ['weapon', 'armor', 'charm'].map((sl) => `<div class="eqrow"><small>${sl}</small> ${m.equip[sl] ? U.esc(G.data.items[m.equip[sl]].name) : '—'}</div>`).join('');
        const skills = G.data.chars[m.id].skills.map((sk) => {
          const s = G.data.skills[sk.id], has = G.game.skillUnlocked(m, sk);
          return `<div class="skrow ${has ? '' : 'locked'}"><b>${has ? U.esc(s.name) : '???'}</b> <small>${has ? `${s.mp}MP ◆${s.flow}` : sk.flag ? 'awakens later' : 'Lv ' + sk.lvl}</small>${has ? `<div>${U.esc(s.desc)}</div>` : ''}</div>`;
        }).join('');
        body.innerHTML = memberCard(m) + `<p class="bio">${U.esc(d.bio)}</p><h4>Equipment</h4>${eq}<h4>Skills</h4>${skills}
          <p class="hint">RES (Resonance) is how deeply someone is attuned to the Current: it powers spells and healing, and softens Surges.</p>`;
        const tabs = $('.menu-tabs', root);
        tabs.style.gridTemplateColumns = `repeat(${Math.min(4, st().party.length)}, 1fr)`;
        const v = await runList(tabs, st().party.map((pm, k) => ({ label: G.data.chars[pm.id].short, value: k })), { cols: Math.min(4, st().party.length), cancel: null, start: i });
        if (v == null) return;
        i = v;
      }
    },

    async itemsView() {
      let start = 0, root, body, desc;
      const build = () => {
        root = frame('Items', `◈ ${st().gold} gold`);
        $('.menu-tabs', root).remove();
        body = $('.menu-body', root); desc = $('.menu-desc', root);
      };
      build();
      for (;;) {
        const ids = Object.keys(st().inv).filter((id) => G.game.count(id) > 0);
        const items = ids.map((id) => {
          const it = G.data.items[id];
          return { label: U.esc(it.name), value: id, right: '×' + G.game.count(id), cls: it.type !== 'use' ? 'gear' : '' };
        });
        st().keyItems.forEach((id) => items.push({ label: '⚿ ' + U.esc(G.data.items[id].name), value: 'key:' + id, cls: 'keyitem' }));
        if (!items.length) { body.innerHTML = '<p class="empty">Your satchel is empty. Well, except for crumbs.</p>'; desc.textContent = ''; await runList(body, [{ label: 'Back', value: null }], { cancel: null }); return; }
        start = U.clamp(start, 0, items.length - 1);
        // tapping an item shows what it is; a second step (the pop-up) decides what to do with it
        const v = await runList(body, items, {
          cancel: null, start,
          onFocus: (it, i) => { start = i; desc.innerHTML = describe(String(it.value).replace('key:', '')); },
          onPick: (it, i) => {
            start = i;
            if (String(it.value).startsWith('key:')) { G.audio.sfx('cursor'); return; } // key items: just read them
            body._end(it.value);
          },
        });
        if (v == null) return;
        const id = v, it = G.data.items[id], n = G.game.count(id);
        const canUse = it.type === 'use' && !it.battleOnly && it.target !== 'none';
        const options = [];
        if (it.type === 'use') options.push({ label: 'Use', value: 'use', disabled: !canUse, right: canUse ? '' : 'battle only' });
        else options.push({ label: 'Equip', value: 'equip', right: 'in Equip menu', disabled: true });
        options.push({ label: 'Discard', value: 'discard' }, { label: 'Cancel', value: null });
        const act = await popup(root, { title: `${U.esc(it.name)} <small>×${n}</small>`, options });
        if (!act.value) continue;
        if (act.value === 'discard') {
          const d = await popup(root, {
            title: `Discard ${U.esc(it.name)}?`, sub: n > 1 ? 'How many?' : 'It will be gone for good.',
            qty: n > 1 ? { max: n } : null,
            options: [{ label: 'Discard', value: 'yes' }, { label: 'Keep it', value: null }],
          });
          if (d.value !== 'yes') continue;
          G.game.removeItem(id, d.qty);
          G.audio.sfx('cancel');
          G.ui.toast(`Discarded ${U.esc(it.name)}${d.qty > 1 ? ' ×' + d.qty : ''}.`);
          build();
          continue;
        }
        // use: choose who
        const r2 = frame('Use ' + it.name, 'On whom?');
        $('.menu-tabs', r2).remove();
        const who = await runList($('.menu-body', r2), st().party.map((m) => ({ label: memberCard(m, true), value: m })), { cancel: null });
        if (who) {
          const s = G.game.stats(who), u = it.use;
          let used = false;
          if (u.revive && who.hp <= 0) { who.hp = Math.max(1, Math.round(s.hp * u.revive)); used = true; }
          else if (who.hp > 0) {
            if (u.heal && who.hp < s.hp) { who.hp = Math.min(s.hp, who.hp + u.heal); used = true; }
            if (u.mp && who.mp < s.mp) { who.mp = Math.min(s.mp, who.mp + u.mp); used = true; }
            if (u.cure) used = true;
          }
          if (used) { G.game.removeItem(id, 1); G.audio.sfx('heal'); G.ui.toast(`${G.data.chars[who.id].short} used ${it.name}.`); }
          else { G.audio.sfx('error'); G.ui.toast('It wouldn\'t do anything right now.'); }
        }
        build();
      }
    },

    async equipView() {
      let mi = 0;
      for (;;) {
        const root = frame('Equip', 'Choose who');
        $('.menu-tabs', root).remove();
        const m = await runList($('.menu-body', root), st().party.map((pm) => ({ label: memberCard(pm, true), value: pm })), { cancel: null, start: mi });
        if (!m) return;
        mi = st().party.indexOf(m);
        for (;;) {
          const r = frame('Equip — ' + G.data.chars[m.id].short, '');
          $('.menu-tabs', r).remove();
          const body = $('.menu-body', r);
          const slot = await runList(body, ['weapon', 'armor', 'charm'].map((sl) => ({ label: `<small class="slot">${sl}</small> ${m.equip[sl] ? U.esc(G.data.items[m.equip[sl]].name) : '—'}`, value: sl })), { cancel: null });
          if (!slot) break;
          const options = Object.keys(st().inv).filter((id) => { const it = G.data.items[id]; return it.type === slot && (!it.who || it.who.includes(m.id)) && G.game.count(id) > 0; });
          const r3 = frame(`${slot[0].toUpperCase() + slot.slice(1)} for ${G.data.chars[m.id].short}`, '');
          $('.menu-tabs', r3).remove();
          const desc = $('.menu-desc', r3);
          const cur = G.game.stats(m);
          const list = options.map((id) => {
            const trial = Object.assign({}, m, { equip: Object.assign({}, m.equip, { [slot]: id }) });
            const ns = G.game.stats(trial);
            const diff = ['hp', 'mp', ...STATS].filter((k) => ns[k] !== cur[k]).map((k) => `<span class="${ns[k] > cur[k] ? 'up' : 'down'}">${k.toUpperCase()}${ns[k] > cur[k] ? '+' : ''}${ns[k] - cur[k]}</span>`).join(' ');
            return { label: U.esc(G.data.items[id].name), value: id, right: diff };
          });
          if (m.equip[slot]) list.push({ label: '(Remove)', value: '__none' });
          if (!list.length) { G.audio.sfx('error'); G.ui.toast('Nothing to equip there yet.'); continue; }
          const pick = await runList($('.menu-body', r3), list, { cancel: null, onFocus: (it) => (desc.textContent = it.value === '__none' ? '' : G.data.items[it.value].desc) });
          if (!pick) continue;
          if (m.equip[slot]) G.game.addItem(m.equip[slot], 1);
          if (pick === '__none') m.equip[slot] = null;
          else { G.game.removeItem(pick, 1); m.equip[slot] = pick; }
          const s2 = G.game.stats(m);
          m.hp = Math.min(m.hp, s2.hp); m.mp = Math.min(m.mp, s2.mp);
          G.audio.sfx('confirm');
        }
      }
    },

    async journalView() {
      const root = frame('Journal', st().chapter);
      $('.menu-tabs', root).remove();
      const body = $('.menu-body', root);
      const entries = (G.data.story.journal || []).filter((j) => st().step >= j.step).reverse();
      body.innerHTML = `<p class="objective">◆ ${U.esc(st().objective || 'Explore.')}</p>` +
        entries.map((j) => `<div class="jentry"><b>${U.esc(j.title)}</b><p>${U.esc(j.text)}</p></div>`).join('') +
        `<h4>How to play</h4>
         <p>Move with the pad (or arrow keys). <b>A</b> talks, opens and confirms. <b>B</b> goes back. ☰ opens this menu.</p>
         <p>The <span class="glow">Flow</span> meter is the Current your party can draw on. Attacks, Guarding and taking hits build it; skills spend it. At 10 it turns <b>Bright</b> — the next skill hits 25% harder. Spend more than you have and you <b>Overdraw</b>, causing a <b>Surge</b> that hurts everyone and tears open a random rift effect.</p>`;
      const tmp = U.el('div', 'list');
      body.appendChild(tmp);
      await runList(tmp, [{ label: 'Back', value: null }], { cancel: null });
    },

    async settingsView() {
      const root = frame('Settings', 'v' + G.VERSION);
      $('.menu-tabs', root).remove();
      const body = $('.menu-body', root);
      const s = G.audio.settings;
      body.innerHTML = `
        <label class="slider">Music <input type="range" min="0" max="1" step="0.05" value="${s.music}" data-k="music"></label>
        <label class="slider">Sound effects <input type="range" min="0" max="1" step="0.05" value="${s.sfx}" data-k="sfx"></label>
        <p class="hint">On iPhone, add this game to your Home Screen (Share → Add to Home Screen) to play full-screen.</p>`;
      body.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => { G.audio.setVolume(inp.dataset.k, parseFloat(inp.value)); G.audio.sfx('cursor'); }));
      const tmp = U.el('div', 'list');
      body.appendChild(tmp);
      await runList(tmp, [{ label: 'Back', value: null }], { cancel: null });
    },

    /* ---------------- shops ---------------- */
    async shop(id) {
      const sh = G.data.shops[id];
      await G.ui.say({ name: sh.name }, sh.greet);
      for (;;) {
        const root = frame(sh.name, `◈ ${st().gold} gold`);
        const tabs = $('.menu-tabs', root);
        tabs.style.gridTemplateColumns = 'repeat(3, 1fr)';
        $('.menu-body', root).innerHTML = '<p class="hint">Buy supplies, or sell what you don\'t need for half price.</p>';
        const mode = await runList(tabs, [{ label: 'Buy', value: 'buy' }, { label: 'Sell', value: 'sell' }, { label: 'Leave', value: null }], { cols: 3, cancel: null });
        if (!mode) break;
        if (mode === 'buy') await menu.buy(sh);
        else await menu.sell(sh);
      }
      close();
    },
    /* Tap an item to read about it, use [-] / [+] to pick how many, then press Buy. */
    async buy(sh) {
      const root = frame(sh.name, `◈ ${st().gold} gold`);
      $('.menu-tabs', root).remove();
      const body = $('.menu-body', root), desc = $('.menu-desc', root), sub = $('.menu-sub', root);
      const q = makeQty({ goLabel: 'Buy' });
      root.insertBefore(q.el, desc);
      let idx = 0, shown = null;
      const cur = () => sh.stock[idx];
      const refreshBar = () => {
        const id = cur(), it = G.data.items[id], gold = st().gold;
        const room = 99 - G.game.count(id);
        const afford = Math.floor(gold / it.price);
        const max = Math.min(isGear(it) ? 1 : 99, room, afford);
        const keep = shown === id ? q.qty : 1;
        shown = id;
        if (max < 1) q.set({ min: 1, max: 1, qty: 1, ok: false, total: room < 1 ? 'You carry the max' : 'Not enough gold', goText: 'Buy' });
        else q.set({ min: 1, max, qty: keep, ok: true, total: `${it.price * Math.min(keep, max)}g`, goText: 'Buy' });
      };
      const totalNow = () => { const it = G.data.items[cur()]; if (q.ok) q.total = `${it.price * q.qty}g`; };
      const origStep = q.step;
      q.step = (d) => { origStep(d); totalNow(); q.draw(); };
      let list;
      const purchase = () => {
        const id = cur(), it = G.data.items[id], n = q.qty, cost = it.price * n;
        if (!q.ok || st().gold < cost) { G.audio.sfx('error'); return; }
        st().gold -= cost;
        G.game.addItem(id, n);
        G.audio.sfx('buy');
        G.ui.toast(`Bought ${U.esc(it.name)}${n > 1 ? ' ×' + n : ''}.`);
        sub.textContent = `◈ ${st().gold} gold`;
        shown = null;
        list._end('refresh');
      };
      q.onGo = purchase;
      for (;;) {
        const keepScroll = body.scrollTop;
        const items = sh.stock.map((id) => {
          const it = G.data.items[id];
          const own = G.game.count(id) + st().party.filter((m) => Object.values(m.equip).includes(id)).length;
          return { label: `${U.esc(it.name)} <small class="own">own ${own}</small>`, value: id, right: it.price + 'g', cls: it.price > st().gold ? 'dim' : '' };
        });
        const p = runList(body, items, {
          cancel: null, start: idx,
          onFocus: (it, i) => { idx = i; desc.innerHTML = describe(it.value); refreshBar(); },
          onPick: () => G.audio.sfx('cursor'),
          onKey: (b) => { if (b === 'left') { q.step(-1); return true; } if (b === 'right') { q.step(1); return true; } if (b === 'a') { purchase(); return true; } return false; },
        });
        list = body;
        body.scrollTop = keepScroll;
        const r = await p;
        if (r !== 'refresh') return;
      }
    },
    async sell() {
      const root = frame('Sell', `◈ ${st().gold} gold`);
      $('.menu-tabs', root).remove();
      const body = $('.menu-body', root), desc = $('.menu-desc', root), sub = $('.menu-sub', root);
      const q = makeQty({ goLabel: 'Sell' });
      root.insertBefore(q.el, desc);
      let id = null, idx = 0, shown = null;
      const price = (i) => Math.floor(G.data.items[i].price / 2);
      const refreshBar = () => {
        const n = G.game.count(id), keep = shown === id ? q.qty : 1;
        shown = id;
        q.set({ min: 1, max: n, qty: keep, ok: n > 0, total: `+${price(id) * Math.min(keep, n)}g`, goText: 'Sell' });
      };
      const origStep = q.step;
      q.step = (d) => { origStep(d); q.total = `+${price(id) * q.qty}g`; q.draw(); };
      const sellNow = () => {
        if (!id || !q.ok) { G.audio.sfx('error'); return; }
        const n = q.qty;
        G.game.removeItem(id, n);
        st().gold += price(id) * n;
        G.audio.sfx('buy');
        G.ui.toast(`Sold ${U.esc(G.data.items[id].name)}${n > 1 ? ' ×' + n : ''}.`);
        sub.textContent = `◈ ${st().gold} gold`;
        shown = null;
        body._end('refresh');
      };
      q.onGo = sellNow;
      for (;;) {
        const ids = Object.keys(st().inv).filter((i) => G.game.count(i) > 0 && G.data.items[i].price > 0);
        if (!ids.length) { G.ui.toast('Nothing to sell.'); return; }
        idx = U.clamp(idx, 0, ids.length - 1);
        const keepScroll = body.scrollTop;
        const p = runList(body, ids.map((i) => ({ label: U.esc(G.data.items[i].name), value: i, right: `×${G.game.count(i)} · ${price(i)}g` })), {
          cancel: null, start: idx,
          onFocus: (it, k) => { idx = k; id = it.value; desc.innerHTML = describe(id) + ` <small class="own">(sells for ${price(id)}g each)</small>`; refreshBar(); },
          onPick: () => G.audio.sfx('cursor'),
          onKey: (b) => { if (b === 'left') { q.step(-1); return true; } if (b === 'right') { q.step(1); return true; } if (b === 'a') { sellNow(); return true; } return false; },
        });
        body.scrollTop = keepScroll;
        const r = await p;
        if (r !== 'refresh') return;
      }
    },

    /* ---------------- inns ---------------- */
    async inn(id) {
      const inn = G.data.shops[id];
      const price = inn.price || 0;
      const yes = await G.ui.choose({ name: inn.name }, inn.greet, [price ? `Rest (${price} gold)` : 'Rest', 'Not now'], { cancel: 1 });
      if (yes !== 0) return false;
      if (st().gold < price) { G.audio.sfx('error'); await G.ui.say({ name: inn.name }, 'Ah, you\'re a little short, love.'); return false; }
      st().gold -= price;
      const prev = G.audio.currentSong;
      await G.gfx.fadeOut(600);
      G.audio.music(null);
      G.audio.sfx('save');
      G.game.healAll();
      st().flow = 0;
      await U.sleep(1300);
      G.audio.music(prev);
      await G.gfx.fadeIn(600);
      G.world.updateHud(false);
      await G.ui.say(null, 'You rest. HP and MP are restored, and the ~Current~ settles back to stillness.');
      if (await G.ui.confirm('Save your journey?', 'Save', 'Not now')) { G.game.save(); G.audio.sfx('save'); G.ui.toast('Game saved.'); }
      return true;
    },
  });
})();
