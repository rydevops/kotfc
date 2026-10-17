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
          body.innerHTML = `<div class="flowcard">${G.ui.flowHTML(st().flow, true)}<p>The party's shared Current. Skills spend it; attacks, Guarding and taking hits restore it. Resting at an inn settles it back to zero.</p></div>` +
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
      for (;;) {
        const root = frame('Items', `◈ ${st().gold} gold`);
        const tabs = $('.menu-tabs', root);
        tabs.remove();
        const body = $('.menu-body', root);
        const desc = $('.menu-desc', root);
        const ids = Object.keys(st().inv).filter((id) => G.game.count(id) > 0);
        const items = ids.map((id) => {
          const it = G.data.items[id];
          return { label: U.esc(it.name), value: id, right: '×' + G.game.count(id), cls: it.type !== 'use' ? 'gear' : '' };
        });
        st().keyItems.forEach((id) => items.push({ label: '⚿ ' + U.esc(G.data.items[id].name), value: 'key:' + id, cls: 'keyitem' }));
        if (!items.length) { body.innerHTML = '<p class="empty">Your satchel is empty. Well — crumbs.</p>'; await runList(body, [{ label: 'Back', value: null }], { cancel: null }); return; }
        const v = await runList(body, items, { cancel: null, onFocus: (it) => (desc.textContent = G.data.items[String(it.value).replace('key:', '')].desc) });
        if (v == null) return;
        if (String(v).startsWith('key:')) continue;
        const it = G.data.items[v];
        if (it.type !== 'use' || it.battleOnly || it.target === 'none') { G.audio.sfx('error'); G.ui.toast(it.type === 'use' ? 'That can only be used in battle.' : 'Equip it from the Equip menu.'); continue; }
        // choose who
        const r2 = frame('Use ' + it.name, 'On whom?');
        $('.menu-tabs', r2).remove();
        const who = await runList($('.menu-body', r2), st().party.map((m) => ({ label: memberCard(m, true), value: m })), { cancel: null });
        if (!who) continue;
        const s = G.game.stats(who), u = it.use;
        let used = false;
        if (u.revive && who.hp <= 0) { who.hp = Math.max(1, Math.round(s.hp * u.revive)); used = true; }
        else if (who.hp > 0) {
          if (u.heal && who.hp < s.hp) { who.hp = Math.min(s.hp, who.hp + u.heal); used = true; }
          if (u.mp && who.mp < s.mp) { who.mp = Math.min(s.mp, who.mp + u.mp); used = true; }
          if (u.cure) used = true;
        }
        if (used) { G.game.removeItem(v, 1); G.audio.sfx('heal'); G.ui.toast(`${G.data.chars[who.id].short} used ${it.name}.`); }
        else { G.audio.sfx('error'); G.ui.toast('It wouldn\'t do anything right now.'); }
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
    async buy(sh) {
      let start = 0;
      for (;;) {
        const root = frame(sh.name + ' — Buy', `◈ ${st().gold} gold`);
        $('.menu-tabs', root).remove();
        const desc = $('.menu-desc', root);
        const items = sh.stock.map((id) => {
          const it = G.data.items[id];
          const own = G.game.count(id) + st().party.filter((m) => Object.values(m.equip).includes(id)).length;
          return { label: `${U.esc(it.name)} <small class="own">own ${own}</small>`, value: id, right: it.price + 'g', disabled: it.price > st().gold };
        });
        const id = await runList($('.menu-body', root), items, {
          cancel: null, start,
          onFocus: (it) => {
            const item = G.data.items[it.value];
            let extra = '';
            if (item.stats) extra = ' — ' + Object.entries(item.stats).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(' ') + (item.who ? ` (${item.who.map((w) => G.data.chars[w].short).join(', ')})` : '');
            desc.textContent = item.desc + extra;
          },
        });
        if (!id) return;
        start = sh.stock.indexOf(id);
        const it = G.data.items[id];
        if (st().gold < it.price) { G.audio.sfx('error'); continue; }
        st().gold -= it.price;
        G.game.addItem(id, 1);
        G.audio.sfx('buy');
        G.ui.toast(`Bought ${U.esc(it.name)}.`);
      }
    },
    async sell() {
      for (;;) {
        const root = frame('Sell', `◈ ${st().gold} gold`);
        $('.menu-tabs', root).remove();
        const ids = Object.keys(st().inv).filter((id) => G.game.count(id) > 0 && G.data.items[id].price > 0);
        if (!ids.length) { G.ui.toast('Nothing to sell.'); return; }
        const id = await runList($('.menu-body', root), ids.map((i) => ({ label: U.esc(G.data.items[i].name), value: i, right: `×${G.game.count(i)} · ${Math.floor(G.data.items[i].price / 2)}g` })), { cancel: null });
        if (!id) return;
        G.game.removeItem(id, 1);
        st().gold += Math.floor(G.data.items[id].price / 2);
        G.audio.sfx('buy');
      }
    },

    /* ---------------- inns ---------------- */
    async inn(id) {
      const inn = G.data.shops[id];
      const price = inn.price || 0;
      const yes = await G.ui.choose({ name: inn.name }, inn.greet, [price ? `Rest (${price} gold)` : 'Rest', 'Not now'], { cancel: 1 });
      if (yes !== 0) return false;
      if (st().gold < price) { G.audio.sfx('error'); await G.ui.say({ name: inn.name }, 'Ah — you\'re a little short, love.'); return false; }
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
