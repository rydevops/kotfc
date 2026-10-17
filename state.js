/* =========================================================================
   state.js — the live game state, party maths, inventory and save slots.
   Stats: HP, MP, STR (strength), DEF (defense), RES (Resonance — how deeply
   a fighter is attuned to the Current; powers spells and resists Surges),
   LUK (luck: crits, dodges, steals) and SPD (speed: turn order).
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const SLOT_KEY = (n) => 'kfc_slot_' + n;
  const STAT_KEYS = ['hp', 'mp', 'str', 'def', 'res', 'luk', 'spd'];
  G.STAT_NAMES = { hp: 'HP', mp: 'MP', str: 'Strength', def: 'Defense', res: 'Resonance', luk: 'Luck', spd: 'Speed' };

  const game = (G.game = {
    state: null,

    newState(slot) {
      return {
        v: 1, slot, step: 0, flags: {}, objective: '', map: 'ferry', x: 6, y: 5, dir: 'up',
        party: [], inv: {}, keyItems: [], gold: 60, flow: 2, playtime: 0, opened: {}, chapter: 'Act I',
        bridgeCrossings: 0,
      };
    },

    /* ---------- party ---------- */
    makeMember(id, lvl = 1) {
      const def = G.data.chars[id];
      const m = { id, lvl, exp: 0, hp: 1, mp: 1, equip: Object.assign({ weapon: null, armor: null, charm: null }, def.equip || {}) };
      const s = game.stats(m);
      m.hp = s.hp; m.mp = s.mp;
      return m;
    },
    join(id) {
      const st = game.state;
      if (st.party.find((m) => m.id === id)) return;
      const lvl = Math.max(1, st.party.length ? st.party[0].lvl : 1);
      const m = game.makeMember(id, lvl);
      // catch up on experience so levels stay consistent
      m.exp = 0;
      st.party.push(m);
      return m;
    },
    member(id) { return game.state.party.find((m) => m.id === id); },

    baseStats(m) {
      const d = G.data.chars[m.id];
      const out = {};
      for (const k of STAT_KEYS) out[k] = Math.floor(d.base[k] + d.growth[k] * (m.lvl - 1));
      return out;
    },
    stats(m) {
      const s = game.baseStats(m);
      for (const slot of ['weapon', 'armor', 'charm']) {
        const it = m.equip[slot] && G.data.items[m.equip[slot]];
        if (it && it.stats) for (const k in it.stats) s[k] = (s[k] || 0) + it.stats[k];
      }
      return s;
    },
    expToNext: (lvl) => Math.floor(18 * Math.pow(lvl, 1.55) + 6),

    gainExp(m, amount) {
      const msgs = [];
      if (m.hp <= 0) return msgs;
      m.exp += amount;
      while (m.exp >= game.expToNext(m.lvl) && m.lvl < 99) {
        const before = game.stats(m);
        m.exp -= game.expToNext(m.lvl);
        m.lvl++;
        const after = game.stats(m);
        m.hp += after.hp - before.hp;
        m.mp += after.mp - before.mp;
        const gains = STAT_KEYS.filter((k) => after[k] > before[k]).map((k) => `${k.toUpperCase()}+${after[k] - before[k]}`);
        msgs.push({ m, lvl: m.lvl, gains });
        for (const sk of G.data.chars[m.id].skills) {
          if (sk.lvl === m.lvl && game.skillUnlocked(m, sk)) msgs.push({ m, learned: G.data.skills[sk.id].name });
        }
      }
      return msgs;
    },
    skillUnlocked(m, sk) {
      return m.lvl >= sk.lvl && (!sk.flag || game.state.flags[sk.flag]);
    },
    skillsOf(m) {
      return G.data.chars[m.id].skills.filter((sk) => game.skillUnlocked(m, sk)).map((sk) => G.data.skills[sk.id]);
    },
    healAll() {
      for (const m of game.state.party) { const s = game.stats(m); m.hp = s.hp; m.mp = s.mp; }
    },

    /* ---------- inventory ---------- */
    count: (id) => game.state.inv[id] || 0,
    addItem(id, n = 1) {
      const it = G.data.items[id];
      if (it && it.type === 'key') { if (!game.state.keyItems.includes(id)) game.state.keyItems.push(id); return; }
      game.state.inv[id] = (game.state.inv[id] || 0) + n;
    },
    removeItem(id, n = 1) {
      game.state.inv[id] = Math.max(0, (game.state.inv[id] || 0) - n);
      if (!game.state.inv[id]) delete game.state.inv[id];
    },
    hasKey: (id) => game.state.keyItems.includes(id),

    /* ---------- saving ---------- */
    save() {
      const st = game.state;
      if (!st) return false;
      try {
        localStorage.setItem(SLOT_KEY(st.slot), JSON.stringify(st));
        return true;
      } catch (e) { console.warn('save failed', e); return false; }
    },
    load(slot) {
      try {
        const raw = localStorage.getItem(SLOT_KEY(slot));
        if (!raw) return null;
        const st = Object.assign(game.newState(slot), JSON.parse(raw));
        st.slot = slot;
        return st;
      } catch (e) { return null; }
    },
    slotInfo(slot) {
      const st = game.load(slot);
      if (!st) return null;
      const lead = st.party[0];
      const map = G.data.maps[st.map];
      return {
        lvl: lead ? lead.lvl : 1, place: map ? map.name : '???', time: U.fmtTime(st.playtime),
        chapter: st.chapter, party: st.party.map((m) => m.id), gold: st.gold,
      };
    },
    deleteSlot(slot) { localStorage.removeItem(SLOT_KEY(slot)); },
  });
})();
