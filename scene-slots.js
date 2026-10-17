/* =========================================================================
   scene-slots.js — pick one of three save slots, continue or start anew.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const SLOTS = 3;

  G.newGame = async function (slot) {
    const st = G.game.newState(slot);
    G.game.state = st;
    G.game.join('wren');
    G.game.addItem('crate');
    st.map = 'ferry'; st.x = 6; st.y = 6; st.dir = 'up';
    G.game.save();
    await G.scenes.go('world', {}, { fadeMs: 800 });
  };

  G.scenes.register('slots', {
    enter() {
      this.render = (ctx) => G.scenes.get('title').renderBg(ctx);
      this.show();
    },
    exit() { document.getElementById('layer-screen').innerHTML = ''; },
    update(dt) { G.scenes.get('title').t += dt; },
    async show() {
      const L = document.getElementById('layer-screen');
      L.innerHTML = `<div class="slots"><h2>Choose a Journey</h2><div class="slot-list list"></div></div>`;
      const list = L.querySelector('.slot-list');
      const items = [];
      for (let i = 1; i <= SLOTS; i++) {
        const info = G.game.slotInfo(i);
        const label = info
          ? `<div class="slot-card"><div class="slot-n">${i}</div><div class="slot-info"><b>Wren · Lv ${info.lvl}</b><span>${U.esc(info.place)}</span><small>${U.esc(info.chapter)} · ⧗ ${info.time} · ◈ ${info.gold}</small></div><div class="slot-party">${info.party.map((id) => `<img src="${G.sprites.portrait(G.data.chars[id].look)}" alt="">`).join('')}</div></div>`
          : `<div class="slot-card empty"><div class="slot-n">${i}</div><div class="slot-info"><b>— New Journey —</b><small>Empty slot</small></div></div>`;
        items.push({ label, value: { i, info } });
      }
      items.push({ label: '◀ Back to title', value: 'back' });
      const v = await G.ui.list(list, items, { cancel: 'back' });
      if (v === 'back') return G.scenes.go('title', { keepTime: true }, { fadeMs: 250 });
      if (!v.info) {
        const ok = await G.ui.confirm(`Begin a new journey in slot ${v.i}?`, 'Begin', 'Back');
        if (ok) return G.newGame(v.i);
        return this.show();
      }
      const c = await G.ui.choose(null, `Slot ${v.i} — Wren, Lv ${v.info.lvl}, ${v.info.place}.`, ['Continue', 'Delete', 'Back'], { cancel: 2 });
      if (c === 0) {
        G.game.state = G.game.load(v.i);
        G.audio.sfx('save');
        return G.scenes.go('world', {}, { fadeMs: 700 });
      }
      if (c === 1) {
        if (await G.ui.confirm(`Delete slot ${v.i}? This can't be undone.`, 'Delete', 'Keep')) { G.game.deleteSlot(v.i); G.audio.sfx('fizzle'); }
      }
      return this.show();
    },
  });
})();
