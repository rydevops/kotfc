/* =========================================================================
   battle-ui.js — the DOM side of battle: Flow meter, message line,
   party panel, command menus, target picking (tap sprites or the list),
   victory results and the game-over screen.
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
          <div class="b-party win"></div>
          <div class="b-cmd win">
            <div class="b-desc"></div>
            <div class="b-list scroll"></div>
            <button class="b-back tap hidden">◀ Back</button>
          </div>
        </div>`;
      root.addEventListener('pointerdown', () => { if (skipWait) skipWait(); });
      $('.b-back', root).addEventListener('click', (e) => { e.stopPropagation(); const l = $('.b-list', root); l._cancel && l._cancel(); });
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
      $('.b-flow', root).innerHTML = G.ui.flowHTML(b.st.flow, true);
      const rows = b.party.map((c) => {
        const st = Object.keys(c.status).map((k) => `<span class="st ${G.STATUSES[k].good ? 'good' : ''}" title="${G.STATUSES[k].name}">${G.STATUSES[k].icon}</span>`).join('');
        return `<div class="p-row ${b.active === c ? 'active' : ''} ${c.alive ? '' : 'ko'}">
          <span class="p-name">${U.esc(c.name)}${st}</span>
          <span class="p-hp"><small>HP</small> ${c.hp}<small>/${c.maxhp}</small>${G.ui.bar(c.hp, c.maxhp, 'hp')}</span>
          <span class="p-mp"><small>MP</small> ${c.mp}${G.ui.bar(c.mp, c.maxmp, 'mp')}</span>
        </div>`;
      }).join('');
      $('.b-party', root).innerHTML = rows;
    },

    /* message line; resolves after ms or when the player taps */
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
    hideMsg() { const m = $('.b-msg', root); if (m) m.classList.add('hidden'); },
    tip(text) { return G.ui.say({ name: '✦ How the Current works' }, text); },

    setDesc(html) { $('.b-desc', root).innerHTML = html || ''; },

    async listIn(items, opts = {}) {
      const list = $('.b-list', root);
      const back = $('.b-back', root);
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
      for (;;) {
        ui.setDesc(`<b>${U.esc(actor.name)}</b> — what will you do?`);
        const atkName = (actor.data.attackFlagged && b.st.flags[actor.data.attackFlagged.flag] ? actor.data.attackFlagged : actor.data.attack).name;
        const cmd = await ui.listIn([
          { label: '⚔ ' + atkName, value: 'attack', right: '<span class="flowtag">+1</span>' },
          { label: '✦ Skills', value: 'skills' },
          { label: '◈ Items', value: 'items', disabled: !usableItems().length },
          { label: '◆ Guard', value: 'guard', right: '<span class="flowtag">+1</span>' },
          { label: '➜ Flee', value: 'flee', disabled: boss || b.opts.noFlee },
        ], { cols: 2 });
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
    },

    async skillMenu(actor) {
      const skills = G.game.skillsOf(actor.m);
      const flow = b.st.flow;
      const items = skills.map((sk) => {
        const over = flow < 10 && sk.flow > flow && !sk.noSurge;
        return {
          label: sk.name, value: sk, disabled: actor.mp < sk.mp, cls: over ? 'overdraw' : '',
          right: `<span class="mpc">${sk.mp}MP</span> <span class="flowtag ${over ? 'warn' : ''}">◆${sk.flow}</span>`,
        };
      });
      for (;;) {
        const sk = await ui.listIn(items, {
          cancel: null,
          onFocus: (it) => ui.setDesc(`<b>${U.esc(it.value.name)}</b> — ${U.esc(it.value.desc)}${it.cls ? ' <span class="warn">Overdraw: will cause a Surge!</span>' : flow >= 10 ? ' <span class="glow">Bright: +25% power!</span>' : ''}`),
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
        if (i >= 0) { const btn = list.children[i]; btn && btn.click(); }
      };
      canvas.addEventListener('pointerdown', onTap);
      ui.setDesc('Choose a target — tap it or pick a name.');
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
        let html = `<h3>Victory!</h3><p><b>${exp}</b> EXP · <b>${gold}</b> gold</p>`;
        if (drops.length) html += `<p>Found: ${drops.map(U.esc).join(', ')}</p>`;
        for (const l of level) {
          const nm = G.data.chars[l.m.id].short;
          if (l.learned) html += `<p class="lvl">✦ ${nm} learned <b>${U.esc(l.learned)}</b>!</p>`;
          else html += `<p class="lvl">▲ ${nm} reached <b>Lv ${l.lvl}</b> <small>${l.gains.join(' ')}</small></p>`;
        }
        html += '<p class="tapnext">Tap to continue ▼</p>';
        w.innerHTML = html;
        root.appendChild(w);
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
        { label: '↻ Try the battle again', value: 'retry' },
        { label: '⌂ Load last save', value: 'load' },
        { label: '✕ Return to title', value: 'title' },
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
