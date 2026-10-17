/* =========================================================================
   battle-ui.js — the DOM side of battle, laid out like the SNES classics:
   a message window on top, enemy names bottom-left, the party's HP/MP
   bottom-right, and a command window that opens over the enemy list.
   Tap commands, names or the sprites themselves.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const $ = (sel, root = document) => root.querySelector(sel);

  let root, b, skipWait = null;

  const ui = (G.battle.ui = {
    build(battle) {
      b = battle;
      root = document.getElementById('layer-battle');
      root.innerHTML = `
        <div class="b-top"><div class="b-flow"></div></div>
        <div class="b-msg win hidden"></div>
        <div class="b-panel">
          <div class="b-upper">
            <div class="b-enemies win"></div>
            <div class="b-cmd win hidden">
              <div class="b-head"><b></b><span class="b-sub"></span></div>
              <div class="b-desc"></div>
              <div class="b-list scroll"></div>
              <button class="b-back tap hidden">Back</button>
            </div>
          </div>
          <div class="b-party win"></div>
        </div>`;
      root.addEventListener('pointerdown', () => { if (skipWait) skipWait(); });
      G.ui.onTap($('.b-back', root), (e) => { e.stopPropagation(); const l = $('.b-list', root); l._cancel && l._cancel(); });
      ui.refresh();
    },

    fieldHeight() {
      const panel = $('.b-panel', root);
      if (!panel) return G.gfx.H * 0.55;
      const r = panel.getBoundingClientRect();
      const c = G.gfx.canvas.getBoundingClientRect();
      return Math.round((r.top - c.top) / G.gfx.cssScale) - 2;
    },

    refresh() {
      if (!root || !b) return;
      $('.b-flow', root).innerHTML = G.ui.flowHTML(b.st.flow, false);
      $('.b-party', root).innerHTML = b.party.map((c) => {
        const st = Object.keys(c.status).map((k) => `<span class="st ${G.STATUSES[k].good ? 'good' : ''}">${G.STATUSES[k].icon}</span>`).join('');
        const low = c.alive && c.hp <= c.maxhp * 0.25;
        return `<div class="p-row ${b.active === c ? 'active' : ''} ${c.alive ? '' : 'ko'} ${low ? 'low' : ''}">
          <span class="hand"></span>
          <span class="p-name">${U.esc(c.name)}${st}</span>
          <span class="p-hp"><small>HP</small><span class="cur">${c.hp}</span><span class="max">/${String(c.maxhp).padStart(3, ' ')}</span></span>
          <span class="p-mp"><small>MP</small>${c.mp}</span>
        </div>`;
      }).join('');
      // enemy names, grouped like "Rift Wisp  2"
      const groups = [];
      for (const e of b.enemies) {
        if (!e.alive) continue;
        const g = groups.find((x) => x.name === e.data.name);
        if (g) g.n++; else groups.push({ name: e.data.name, n: 1, boss: e.data.boss });
      }
      $('.b-enemies', root).innerHTML = groups.map((g) => `<div class="en ${g.boss ? 'boss' : ''}"><span>${U.esc(g.name)}</span>${g.n > 1 ? `<small>${g.n}</small>` : ''}</div>`).join('');
    },

    /* message window; resolves after ms or when the player taps */
    msg(text, ms = 800) {
      const m = $('.b-msg', root);
      if (!m) return U.sleep(ms);
      m.classList.remove('hidden');
      m.innerHTML = U.esc(text).replace(/~([^~]+)~/g, '<span class="glow">$1</span>').replace(/\*([^*]+)\*/g, '<span class="em">$1</span>');
      return new Promise((res) => {
        const t0 = performance.now();
        const done = () => { clearTimeout(to); skipWait = null; res(); };
        const to = setTimeout(done, ms);
        skipWait = () => { if (performance.now() - t0 > 120) done(); };
      });
    },
    /* the skill's name in a little window at the top of the field */
    spell(name, color, bright) {
      if (!root) return;
      ui.hideMsg();
      const el = U.el('div', 'b-spell' + (bright ? ' bright' : ''), `<span class="win">${U.esc(name)}</span>`);
      root.appendChild(el);
      setTimeout(() => el.remove(), 1300);
    },
    hideMsg() { const m = $('.b-msg', root); if (m) m.classList.add('hidden'); },
    tip(text) { return G.ui.say({ name: '◆ How the Current works' }, text); },

    setDesc(html) { $('.b-desc', root).innerHTML = html || ''; },
    setHead(name, sub) { $('.b-head b', root).textContent = name || ''; $('.b-sub', root).innerHTML = sub || ''; },
    openCmd(open) { $('.b-cmd', root).classList.toggle('hidden', !open); },

    async listIn(items, opts = {}) {
      const list = $('.b-list', root);
      const back = $('.b-back', root);
      ui.openCmd(true);
      back.classList.toggle('hidden', opts.cancel === undefined);
      const v = await G.ui.list(list, items, opts);
      back.classList.add('hidden');
      return v;
    },

    /* returns { type: attack|skill|item|guard|flee, target, skill, item } */
    async command(battle, actor) {
      b = battle;
      ui.hideMsg();
      const boss = b.enemies.some((e) => e.data.boss);
      try {
        for (;;) {
          ui.setHead(actor.name, `<span class="mpc">MP ${actor.mp}</span>`);
          ui.setDesc('');
          const atkName = (actor.data.attackFlagged && b.st.flags[actor.data.attackFlagged.flag] ? actor.data.attackFlagged : actor.data.attack).name;
          const cmd = await ui.listIn([
            { label: 'Attack', value: 'attack', right: '<span class="flowtag">+1</span>' },
            { label: 'Skills', value: 'skills' },
            { label: 'Items', value: 'items', disabled: !usableItems().length },
            { label: 'Guard', value: 'guard', right: '<span class="flowtag">+1</span>' },
            { label: 'Flee', value: 'flee', disabled: boss || b.opts.noFlee },
          ], { cols: 2, onFocus: (it) => ui.setDesc(it.value === 'attack' ? U.esc(atkName) + ' — builds Flow.' : it.value === 'guard' ? 'Halve damage until your next turn and gather Flow.' : it.value === 'skills' ? 'Spend MP and Flow.' : it.value === 'items' ? 'Use something from the satchel.' : 'Try to escape.') });
          if (cmd === 'attack') {
            const t = await ui.pickTarget(b.enemies.filter((e) => e.alive));
            if (t) return { type: 'attack', target: t };
          } else if (cmd === 'guard') return { type: 'guard' };
          else if (cmd === 'flee') return { type: 'flee' };
          else if (cmd === 'skills') {
            const r = await ui.skillMenu(actor);
            if (r) return r;
          } else if (cmd === 'items') {
            const r = await ui.itemMenu(actor);
            if (r) return r;
          }
        }
      } finally {
        ui.openCmd(false);
      }
    },

    async skillMenu(actor) {
      const skills = G.game.skillsOf(actor.m);
      const flow = b.st.flow;
      const items = skills.map((sk) => {
        const over = flow < 10 && sk.flow > flow && !sk.noSurge;
        return {
          label: sk.name, value: sk, disabled: actor.mp < sk.mp, cls: over ? 'overdraw' : '',
          right: `<span class="mpc">${sk.mp}</span> <span class="flowtag ${over ? 'warn' : ''}">◆${sk.flow}</span>`,
        };
      });
      for (;;) {
        ui.setHead('Skills', `<span class="mpc">MP ${actor.mp}</span> <span class="flowtag">◆${flow}</span>`);
        const sk = await ui.listIn(items, {
          cancel: null,
          onFocus: (it) => ui.setDesc(`${U.esc(it.value.desc)}${it.cls ? ' <span class="warn">Overdraw: causes a Surge!</span>' : flow >= 10 ? ' <span class="glow">Bright: +25%!</span>' : ''}`),
        });
        if (!sk) return null;
        if (flow < 10 && sk.flow > flow && !sk.noSurge) {
          const ok = await G.ui.confirm(`Not enough Flow (${flow}/${sk.flow}). Overdraw and cause a SURGE? It will hurt everyone — friend and foe.`, 'Overdraw!', 'Cancel');
          if (!ok) continue;
        }
        let target = null;
        if (sk.target === 'enemy') target = await ui.pickTarget(b.enemies.filter((e) => e.alive));
        else if (sk.target === 'ally') target = await ui.pickTarget(b.party.filter((c) => c.alive));
        else if (sk.target === 'allyDead') target = await ui.pickTarget(b.party.filter((c) => !c.alive));
        else target = true;
        if (!target) continue;
        return { type: 'skill', skill: sk, target: target === true ? null : target };
      }
    },

    async itemMenu(actor) {
      for (;;) {
        ui.setHead('Items', '');
        const its = usableItems();
        const id = await ui.listIn(its.map((id) => ({ label: G.data.items[id].name, value: id, right: '×' + G.game.count(id) })), {
          cancel: null, onFocus: (it) => ui.setDesc(U.esc(G.data.items[it.value].desc)),
        });
        if (!id) return null;
        const it = G.data.items[id];
        let target = null;
        if (it.target === 'ally') target = await ui.pickTarget(b.party.filter((c) => c.alive));
        else if (it.target === 'allyDead') target = await ui.pickTarget(b.party.filter((c) => !c.alive));
        else target = true;
        if (!target) continue;
        return { type: 'item', item: id, target: target === true ? null : target };
      }
    },

    /* pick from a list of combatants: tap the sprite or the name */
    async pickTarget(cands) {
      if (!cands.length) { G.audio.sfx('error'); return null; }
      const canvas = G.gfx.canvas;
      const list = $('.b-list', root);
      const onTap = (e) => {
        const p = G.gfx.toGame(e.clientX, e.clientY);
        const i = cands.findIndex((c) => Math.abs(p.x - c.x) < Math.max(14, c.w / 2) && Math.abs(p.y - c.y) < Math.max(14, c.h / 2));
        if (i >= 0) { const btn = list.children[i]; btn && btn.tap && btn.tap(); }
      };
      canvas.addEventListener('pointerdown', onTap);
      ui.setHead('Target', '');
      ui.setDesc('Tap a target, or choose a name.');
      const t = await ui.listIn(cands.map((c) => ({
        label: U.esc(c.name), value: c, right: c.side === 'party' ? `${c.hp}/${c.maxhp}` : '',
      })), { cancel: null, onFocus: (it) => (b.cursor = it.value) });
      canvas.removeEventListener('pointerdown', onTap);
      b.cursor = null;
      return t;
    },

    results({ exp, gold, drops, level }) {
      return new Promise((resolve) => {
        const w = U.el('div', 'b-results win');
        let html = `<h3>Victory</h3><p>Gained <b>${exp}</b> EXP.</p><p>Found <b>${gold}</b> gold.</p>`;
        if (drops.length) html += `<p>Obtained ${drops.map((d) => '<b>' + U.esc(d) + '</b>').join(', ')}.</p>`;
        for (const l of level) {
          const nm = G.data.chars[l.m.id].short;
          if (l.learned) html += `<p class="lvl">${nm} learned <b>${U.esc(l.learned)}</b>!</p>`;
          else html += `<p class="lvl">${nm} is now level <b>${l.lvl}</b>! <small>${l.gains.join(' ')}</small></p>`;
        }
        html += '<p class="tapnext">Tap to continue</p>';
        w.innerHTML = html;
        $('.b-upper', root).appendChild(w);
        if (level.length) setTimeout(() => G.audio.sfx('levelup'), 400);
        ui.hideMsg();
        let armed = false;
        setTimeout(() => (armed = true), 500);
        const close = () => {
          if (!armed) return;
          G.input.pop(h); w.removeEventListener('pointerdown', close); root.removeEventListener('pointerdown', close);
          G.audio.sfx('confirm');
          resolve();
        };
        const h = G.input.push((btn) => { if (btn === 'a' || btn === 'b') close(); return true; });
        h.modal = true;
        root.addEventListener('pointerdown', close);
      });
    },

    async gameOver() {
      const w = U.el('div', 'b-gameover');
      w.innerHTML = `<div class="go-title">The light goes out...</div><div class="go-sub">But the Current remembers you.</div><div class="go-list win"></div>`;
      root.appendChild(w);
      await U.sleep(600);
      const v = await G.ui.list($('.go-list', w), [
        { label: 'Try the battle again', value: 'retry' },
        { label: 'Load last save', value: 'load' },
        { label: 'Return to title', value: 'title' },
      ]);
      w.remove();
      return v;
    },
  });

  function usableItems() {
    return Object.keys(G.game.state.inv).filter((id) => {
      const it = G.data.items[id];
      return it && it.type === 'use' && G.game.count(id) > 0;
    });
  }
})();
