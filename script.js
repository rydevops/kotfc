/* =========================================================================
   script.js — the cutscene / event scripting API.
   Story files write plain async functions that receive `S`:

     async (S) => {
       await S.say('pip', 'Cog, NO.');
       await S.move('pip', 'LLU');
       await S.battle({ mobs: ['riftWisp', 'riftWisp'] });
       S.setStep(4);
     }
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const W = () => G.world;
  const ABORT = (G.ABORT = { abort: true });

  const ent = (id) => {
    if (id === 'player' || id === 'wren') return W().player;
    return W().npc(id) || W().followers.find((f) => f.member === id || f.id === id);
  };

  const S = (G.S = {
    get st() { return G.game.state; },
    say: (who, text, opts) => G.ui.say(who, text, opts),
    narrate: (text) => G.ui.say(null, text),
    choose: (who, text, options, opts) => G.ui.choose(who, text, options, opts),
    confirm: (text, y, n) => G.ui.confirm(text, y, n),
    wait: (ms) => U.sleep(ms),
    sfx: (id, o) => G.audio.sfx(id, o),
    music: (id) => G.audio.music(id),
    shake: (mag, ms) => G.gfx.shake(mag, ms),
    flash: (color, ms) => G.gfx.flash(color, ms),
    fadeOut: (ms, color) => G.gfx.fadeOut(ms, color),
    fadeIn: (ms) => G.gfx.fadeIn(ms),
    card: (title, sub, ms) => G.ui.card(title, sub, ms),
    toast: (html) => G.ui.toast(html),

    /* --- story state --- */
    setStep(n) { S.st.step = n; },
    step() { return S.st.step; },
    flag(name, v = true) { S.st.flags[name] = v; },
    has(name) { return !!S.st.flags[name]; },
    objective(text) {
      S.st.objective = text;
      W().updateHud(false);
      if (text) G.ui.toast('<b>New objective</b><br>' + U.esc(text), 2600);
    },

    /* --- party & items --- */
    give(id, n = 1, quiet) {
      G.game.addItem(id, n);
      G.audio.sfx('chest');
      if (!quiet) G.ui.toast(`Received <b>${U.esc(G.data.items[id].name)}</b>${n > 1 ? ' ×' + n : ''}`);
    },
    take(id, n = 1) {
      const it = G.data.items[id];
      if (it.type === 'key') S.st.keyItems = S.st.keyItems.filter((k) => k !== id);
      else G.game.removeItem(id, n);
    },
    gold(n) { S.st.gold += n; G.ui.toast(`${n > 0 ? '+' : ''}${n} gold`); },
    join(id) {
      G.game.join(id);
      G.audio.sfx('levelup');
      G.ui.toast(`<b>${U.esc(G.data.chars[id].name)}</b> joined the party!`);
      const w = W();
      const p = w.player;
      const m = G.data.chars[id];
      // spawn follower where the NPC stood (or on the player)
      const npc = w.npc(id);
      const f = { id: 'f_' + id, member: id, look: m.look, x: npc ? npc.x : p.x, y: npc ? npc.y : p.y, px: 0, py: 0, dir: p.dir, moving: false, frame: 0, walkT: 0, solid: false, speed: 165 };
      f.px = f.x * 16; f.py = f.y * 16;
      if (npc) S.removeNpc(id);
      w.followers.push(f);
    },
    healParty() { G.game.healAll(); },

    /* --- actors --- */
    actor: ent,
    face(id, dir) { const e = ent(id); if (e) e.dir = dir; },
    faceEachOther(a, b) {
      const A = ent(a), B = ent(b);
      if (!A || !B) return;
      const dx = B.x - A.x, dy = B.y - A.y;
      A.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      B.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[A.dir];
    },
    move(id, path, speed) {
      const e = ent(id);
      if (!e) return Promise.resolve();
      const p = W().walkPath(e, path, speed);
      return p;
    },
    emote(id, text, ms = 1400, color) {
      const e = ent(id);
      if (e) e.emote = { text, until: W().t + ms, color };
      if (text === '!') G.audio.sfx('cursor');
      return U.sleep(Math.min(ms, 700));
    },
    addNpc(def) {
      const w = W();
      const n = Object.assign({ dir: 'down', solid: true, speed: 165, moving: false, frame: 0, walkT: 0 }, def);
      n.px = n.x * 16; n.py = n.y * 16; n.home = { x: n.x, y: n.y }; n.wanderT = 2000;
      w.npcs.push(n);
      return n;
    },
    removeNpc(id) { const w = W(); w.npcs = w.npcs.filter((n) => n.id !== id); },
    hide(id, v = true) { const e = ent(id); if (e) e.hidden = v; },
    respawnNpcs() { W().spawnNpcs(); },

    /* --- world --- */
    async warp(map, x, y, dir, opts = {}) {
      await G.gfx.fadeOut(opts.fade || 300);
      W().load(map, x, y, dir);
      await U.sleep(60);
      G.gfx.fadeIn(opts.fade || 300);
      const def = W().def;
      if (def.onEnter && !opts.skipEnter) await def.onEnter(S, S.st);
    },
    refreshEnv() { W().refreshEnv(); G.audio.music(W().env.music); },
    env(over) { Object.assign(W().envOverride, over); W().refreshEnv(); },
    light(key, on) { W().lightOverride[key] = on; },
    lightsByDistance(fromX, fromY) {
      return W().lights.filter((l) => l.lamp).sort((a, b) => Math.hypot(a.x - fromX * 16, a.y - fromY * 16) - Math.hypot(b.x - fromX * 16, b.y - fromY * 16));
    },
    setTile(x, y, ch) { W().setTile(x, y, ch); },
        camera(x, y) { W().camTarget = x == null ? null : { x: x * 16 + 8, y: y * 16 + 8 }; },
    async tween(fn, ms) {
      const t0 = performance.now();
      return new Promise((res) => {
        const tick = () => {
          const k = Math.min(1, (performance.now() - t0) / ms);
          fn(k);
          if (k < 1) requestAnimationFrame(tick); else res();
        };
        tick();
      });
    },

    /* --- battle --- */
    async battle(opts) {
      const res = await G.battle.run(opts);
      if (res === 'quit') throw ABORT;
      return res;
    },

    /* --- services --- */
    shop: (id) => G.menu.shop(id),
    async inn(id) {
      const ok = await G.menu.inn(id);
      if (ok && G.bonds) await G.bonds.check(S);
      return ok;
    },
    save() { G.game.save(); G.audio.sfx('save'); G.ui.toast('Game saved.'); },
  });

  G.script = {
    running: 0,
    async run(fn) {
      const w = G.world;
      w.busy++; this.running++;
      G.input.clearPresses();
      try { await fn(S); }
      catch (e) { if (e !== ABORT) { console.error('Script error', e); } }
      finally {
        w.busy = Math.max(0, w.busy - 1); this.running--;
        w.camTarget = null;
        if (w.updateHud && G.game.state) w.updateHud(false);
        G.input.clearPresses();
      }
    },
  };
})();
