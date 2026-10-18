/* =========================================================================
   travel.js — getting around Orrenth after the ferries fail.

   Act II: Bilge's skiff — talk to it at any dock and pick a destination.
   Act III on: the Quiet Heron — board her at any dock; her deck (map 'heron')
   has the helm (set course), the bunks (rest, then a bond scene if one is
   waiting) and the crew.

   Maps register their landing with G.travel.place(id, {...}) and include
   G.travel.boatObjects(id, x, y) / boatInteract(id, x, y) for the vessel.
   Also home to G.bonds: short companion scenes that play after resting.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;

  /* ============================ vessels ============================ */
  function px(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function ell(ctx, cx, cy, rx, ry, fn) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
      if (d <= 1) { const c = fn(dx, dy, d); if (c) px(ctx, x, y, 1, 1, c); }
    }
  }
  let skiffC = null, heronC = null;
  function skiffSprite() {
    if (skiffC) return skiffC;
    const { c, x } = G.gfx.makeCanvas(64, 44);
    // sail
    px(x, 31, 2, 2, 28, '#3a2414'); px(x, 31, 2, 1, 28, '#6a4424');
    for (let j = 0; j < 22; j++) {
      const w = 6 + Math.round(Math.sin(j / 22 * Math.PI) * 14);
      px(x, 33, 5 + j, w, 1, j % 6 === 0 ? '#c8b894' : '#ece0c4');
      if (j % 6 === 2) px(x, 33 + w - 1, 5 + j, 1, 1, '#a89870');
    }
    px(x, 36, 10, 6, 6, '#a8583a'); px(x, 36, 10, 6, 1, '#c8785a'); px(x, 40, 18, 5, 5, '#5a7a88');
    px(x, 29, 2, 6, 2, '#c04040');
    // hull
    for (let i = 0; i < 12; i++) {
      const inset = Math.round(Math.pow(i / 12, 1.5) * 16);
      px(x, 6 + inset, 28 + i, 52 - inset * 2, 1, i === 0 ? '#c8985a' : i % 4 === 0 ? '#3a2214' : i < 3 ? '#7a4a24' : '#5a3418');
    }
    px(x, 4, 26, 56, 3, '#8a5a30'); px(x, 4, 26, 56, 1, '#d9a441'); px(x, 5, 28, 54, 1, '#3a2214');
    for (const lx of [10, 20, 40, 50]) px(x, lx, 31, 3, 3, '#14303a');
    px(x, 56, 23, 3, 4, '#ffd060'); px(x, 56, 22, 3, 1, '#2a2230');
    return (skiffC = c);
  }
  function heronSprite() {
    if (heronC) return heronC;
    const W = 132, Hh = 100;
    const { c, x } = G.gfx.makeCanvas(W, Hh);
    // envelope: a long soft balloon in pale blue-grey with glowing veins
    ell(x, 62, 26, 54, 22, (dx, dy, d) => {
      const lit = -dx * 0.5 - dy * 0.8;
      if (d > 0.82 && lit < 0) return '#4a5a7a';
      if (lit > 0.55) return '#e8eefc';
      if (lit > 0.1) return '#c4d2ea';
      return d > 0.6 ? '#7a8ab0' : '#a0b2d0';
    });
    for (let i = -4; i <= 4; i++) { const sx = 62 + i * 11; for (let y = 6; y < 46; y++) { const dx = (sx - 62) / 54, dy = (y - 26) / 22; if (dx * dx + dy * dy < 0.9) px(x, sx, y, 1, 1, '#7a8cb4'); } }
    px(x, 8, 26, 108, 1, '#6a7aa0');
    // rigging
    x.fillStyle = '#2a2434';
    for (const [a, b] of [[26, 66], [44, 62], [62, 60], [80, 62], [98, 66]]) { for (let y = 46; y < b; y++) px(x, a + Math.round((62 - a) * 0.0 + (y - 46) * (a < 62 ? 0.4 : a > 62 ? -0.4 : 0)), y, 1, 1, '#2a2434'); }
    // hull: long and curved, birch wood with teal trim and a gold rail
    for (let i = 0; i < 20; i++) {
      const k = i / 20, inset = Math.round(Math.pow(k, 1.6) * 40), rise = Math.round(Math.pow(k, 2) * 0);
      const y = 62 + i;
      const col = i === 0 ? '#f0d878' : i < 3 ? '#e4d4b0' : i % 5 === 0 ? '#5a4a3a' : i > 15 ? '#6a5a48' : '#c8b896';
      px(x, 10 + inset, y, 108 - inset * 2, 1, col);
      if (i > 2 && i < 18) px(x, 10 + inset, y, 2, 1, '#e8dcc0');
    }
    px(x, 14, 60, 100, 3, '#e8c860'); px(x, 14, 60, 100, 1, '#fff0a0'); px(x, 14, 62, 100, 1, '#8a6c20');
    px(x, 24, 69, 82, 2, '#3a8a8a'); px(x, 24, 69, 82, 1, '#6ac0c0');
    // portholes with a warm light
    for (let i = 0; i < 6; i++) { px(x, 30 + i * 12, 74, 5, 5, '#2a3a44'); px(x, 31 + i * 12, 75, 3, 3, '#ffd27a'); px(x, 31 + i * 12, 75, 1, 1, '#fff6d0'); }
    // the figurehead: a long-necked heron at the prow
    for (let j = 0; j < 22; j++) { const bx = 118 + Math.round(Math.sin(j / 22 * 3.0) * 6), by = 60 - j; px(x, bx, by, 3, 1, '#f4f4f8'); px(x, bx, by, 1, 1, '#cfd6e6'); }
    px(x, 121, 36, 7, 3, '#f4f4f8'); px(x, 127, 37, 5, 1, '#e8a830'); px(x, 123, 36, 1, 1, '#1a1428');
    // wing-sails folded against the hull
    for (let j = 0; j < 22; j++) { const w = Math.round(30 - j * 0.9); px(x, 40, 46 + j, w, 1, j < 3 ? '#ffffff' : '#e8eef8'); px(x, 40 + w - 1, 46 + j, 1, 1, '#a0b2d0'); }
    // stern lantern
    px(x, 6, 50, 3, 10, '#2a2434'); px(x, 3, 46, 8, 6, '#ffd27a'); px(x, 4, 47, 4, 3, '#fff6d0'); px(x, 3, 45, 8, 1, '#2a2434');
    return (heronC = c);
  }
  // the Current "veins" in the Heron's envelope brighten near Wren
  function drawHeron(ctx, ox, oy, t, glow = 0.35) {
    ctx.drawImage(heronSprite(), ox, oy);
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.5 + 0.5 * Math.sin(t / 380);
    ctx.globalAlpha = Math.min(0.9, glow * (0.6 + pulse * 0.5));
    for (let i = -4; i <= 4; i++) {
      const sx = ox + 62 + i * 11;
      ctx.fillStyle = '#6ff3ff';
      for (let y = 8; y < 44; y++) { const dx = (sx - ox - 62) / 54, dy = (y - 26) / 22; if (dx * dx + dy * dy < 0.86 && ((y + Math.floor(t / 50) + i * 3) % 7) < 3) ctx.fillRect(sx, oy + y, 1, 1); }
    }
    ctx.globalAlpha = glow * 0.25;
    ctx.drawImage(G.pix.glow('#6ff3ff', 54), ox + 8, oy - 6);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  /* ============================ destinations ============================ */
  const places = {};
  const travel = (G.travel = {
    places, drawHeron, skiffSprite, heronSprite,
    place(id, def) { places[id] = Object.assign({ id }, def); },
    unlock(id) { G.game.state.flags['dest_' + id] = true; },
    unlocked(id) { return !!G.game.state.flags['dest_' + id]; },
    vehicle(st) { return st.flags.heron ? 'heron' : st.flags.skiff ? 'skiff' : null; },

    /* a vessel drawn at a map's landing */
    boatObjects(id, x, y) {
      return [{
        x, y, cond: (st) => (st.flags.heron ? st.flags.heronAt === id : !!st.flags.skiff),
        draw: (ctx, px_, py_, t, w) => {
          const bob = Math.round(Math.sin(t / 700) * 1.5);
          if (w.st.flags.heron) drawHeron(ctx, px_ - 54, py_ - 76 + bob, t, 0.4 + (w.st.flags.heronGlow || 0));
          else ctx.drawImage(skiffSprite(), px_ - 20, py_ - 10 + bob);
        },
      }];
    },
    boatInteract(id, x, y, extra) {
      return Object.assign({ x, y, bump: true, cond: (st) => (st.flags.heron ? st.flags.heronAt === id : !!st.flags.skiff), run: (S) => travel.dock(S, id) }, extra || {});
    },

    async dock(S, here) {
      const st = S.st, v = travel.vehicle(st);
      if (v === 'heron') {
        if (!await S.confirm('Board the Quiet Heron?', 'Board', 'Not yet')) return;
        st.flags.heronAt = here;
        S.sfx('door');
        await S.warp('heron', 9, 9, 'up');
        return;
      }
      if (v === 'skiff') return travel.chooseCourse(S, here, 'skiff');
      return S.narrate('The ferries are not running. The ferry clerk has chalked "SOON" on the board. It has been "SOON" for weeks.');
    },

    options(here) {
      const st = G.game.state;
      return Object.values(places).filter((p) => p.id !== here && travel.unlocked(p.id) && (!p.avail || p.avail(st)));
    },

    async chooseCourse(S, here, how) {
      const opts = travel.options(here);
      if (!opts.length) return S.narrate('There is nowhere new to sail just yet.');
      const labels = opts.map((p) => `${p.name} — ${p.layer}`).concat(['Stay']);
      const i = await S.choose(how === 'heron' ? { name: 'Helm' } : { name: 'Bilge\'s Skiff' }, how === 'heron' ? 'Set a course?' : 'Where to?', labels, { cancel: labels.length - 1 });
      if (i >= opts.length) return;
      await travel.sail(S, opts[i].id, how);
    },

    async sail(S, destId, how) {
      const st = S.st, dest = places[destId];
      await S.fadeOut(500);
      S.music(how === 'heron' ? 'heron' : 'ferry');
      G.world.hideCog = true;
      await S.wait(250);
      await S.card(dest.name, dest.layer + (dest.level ? ' · Lv ' + dest.level : ''), 2200);
      const banter = travel.banter(st, how);
      if (banter) for (const [who, text] of banter) await S.say(who, text);
      G.world.hideCog = false;
      if (how === 'heron') st.flags.heronAt = destId;
      st.flags.lastDock = destId;
      await S.warp(dest.map, dest.x, dest.y, dest.dir || 'up');
    },

    /* a line or two of company on the way */
    banter(st, how) {
      const inParty = (id) => st.party.some((m) => m.id === id);
      const pool = [];
      const add = (cond, lines) => { if (cond) pool.push(lines); };
      add(inParty('pip'), [['pip', 'Cog says the skiff is "a floating apology." Cog also says it is the best thing we own.']]);
      add(inParty('pip') && how === 'skiff', [['pip', 'Don\'t tell Bilge, but I think I fixed her tiller. It might have been broken on purpose.']]);
      add(inParty('vesper'), [['vesper', 'Nobody is shooting at us. Nobody is chasing us. I find it deeply suspicious.']]);
      add(inParty('vesper') && how === 'heron', [['vesper', 'This ship has no cargo hold, no hidden compartment, and no secret door. I checked three times. How does a ship even *work*?']]);
      add(inParty('hollis'), [['hollis', 'Listen, Wren. The air sings, thinly, but it still sings.'], ['wren', 'I can\'t hear anything.'], ['hollis', 'No. Not yet.']]);
      add(inParty('hollis') && how === 'heron', [['hollis', 'She is a good ship. She hums like a hive.'], ['pip', 'She does *not* hum like a hive. She hums like a very, very polite engine.']]);
      add(st.step >= 14 && inParty('vesper'), [['wren', 'Vesper, do you ever sleep?'], ['vesper', 'Never on a moving boat. The last time, I woke up owning a goat.']]);
      add(st.step >= 20 && how === 'heron', [['pip', 'You all feel that, right? The hull is leaning toward Wren.'], ['cog', 'Bleep.'], ['pip', 'Cog says it is a boat, and boats do not have feelings. He says it very loudly, because he is nervous.']]);
      add(st.step >= 12, [['wren', 'Do you think Aldrith is watching us right now?'], ['pip', 'He\'s a great wizard, Wren. Not a gull.']]);
      add(how === 'skiff', [['wren', 'You can see the whole Drift from here. It is almost pretty, if you ignore the sinking.']]);
      add(how === 'heron', [['wren', 'The Heron is humming a little louder when I stand at the rail. Is it me?'], ['pip', 'It\'s you. It has a *crush*.']]);
      add(true, [['wren', 'Every island we pass sits a little lower. Do you see it?'], ['cog', 'Bleep.'], ['pip', 'Cog says yes. Every single one.']]);
      if (!pool.length) return null;
      return U.pick(pool);
    },
  });

  /* ============================ the Heron's deck ============================ */
  const SPANS = { 1: [5, 14], 2: [3, 17], 3: [2, 19], 4: [1, 20], 5: [1, 21], 6: [1, 20], 7: [1, 19], 8: [2, 17], 9: [3, 14] };
  const HX = { helm: [19, 5], mast: [11, 5], bunkA: [5, 3], bunkB: [5, 7], bench: [8, 2], gang: [9, 10] };
  const drawHull = (ctx, x, y, t) => {
    // the keel, under the deck: a long curved belly of pale birch with a teal band
    for (let i = 0; i < 22; i++) {
      const inset = Math.round(Math.pow(i / 22, 1.3) * 80), w = 19 * 16 - inset * 2;
      ctx.fillStyle = i === 0 ? '#e8c860' : i < 3 ? '#e4d4b0' : i % 5 === 0 ? '#5a4a3a' : i > 16 ? '#8a7a64' : '#c8b896';
      ctx.fillRect(x + 40 + inset, y + i, w, 1);
    }
    ctx.fillStyle = '#3a8a8a'; ctx.fillRect(x + 70, y + 5, 19 * 16 - 140 - 28, 2);
    ctx.fillStyle = '#6ff3ff'; ctx.globalAlpha = 0.45 + 0.35 * Math.sin(t / 400); ctx.fillRect(x + 150, y + 9, 40, 1); ctx.globalAlpha = 1;
  };
  const drawFigurehead = (ctx, x, y, t) => { // a carved heron at the prow
    ctx.fillStyle = '#f4f4f8'; for (let j = 0; j < 16; j++) { const bx = x + Math.round(Math.sin(j / 16 * 2.6) * 5); ctx.fillRect(bx, y + 14 - j, 3, 1); }
    ctx.fillRect(x + 3, y - 3, 7, 3); ctx.fillStyle = '#e8a830'; ctx.fillRect(x + 9, y - 2, 6, 1); ctx.fillStyle = '#1a1428'; ctx.fillRect(x + 5, y - 3, 1, 1);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t / 500); ctx.drawImage(G.pix.glow('#6ff3ff', 22), x - 8, y - 12); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  };
  // an invisible solid tile (the helm and other things drawn by map objects)
  G.TILES['§'] = { name: 'fixture', solid: true, under: true, paint() {} };
  const tilesHeron = (() => {
    const kit = G.kit, g = kit.grid(23, 12, ' ');
    for (const [y, [a, b]] of Object.entries(SPANS)) kit.hline(g, a, b, +y, '_');
    const copy = g.map((r) => r.slice());
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
      if (copy[y][x] !== '_') continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (copy[y + dy] || [])[x + dx] === ' ' || (copy[y + dy] || [])[x + dx] === undefined)) g[y][x] = 'q';
    }
    // gangway: two planks through the rail on the south side
    for (const x of [9, 10]) { kit.set(g, x, 9, '_'); kit.set(g, x, 10, '_'); }
    kit.set(g, 8, 9, 'q'); kit.set(g, 11, 9, 'q'); kit.set(g, 8, 10, 'q'); kit.set(g, 11, 10, 'q');
    kit.set(g, ...HX.mast, 'M'); kit.set(g, ...HX.helm, '§');
    kit.set(g, ...HX.bunkA, 'Z'); kit.set(g, ...HX.bunkB, 'Z');
    kit.set(g, ...HX.bench, '('); kit.set(g, 14, 3, 'b'); kit.set(g, 14, 7, 'b'); kit.set(g, 16, 4, 'x');
    return kit.rows(g);
  })();
  G.register('maps', 'heron', {
    name: 'The Quiet Heron',
    noCliffs: true,
    battleBg: 'heron',
    tiles: tilesHeron,
    env(st) {
      return { sky: st.step >= 20 ? 'dawn' : 'mist', ambient: 0.12, ambientColor: '#0a1a2a', music: 'heron', travel: 0.03, weather: 'motes' };
    },
    lights: [{ x: 11, y: 5, r: 70, color: '#6ff3ff', glow: 0.5 }, { x: 19, y: 5, r: 40, color: '#ffd27a', glow: 0.5 }, { x: 3, y: 5, r: 36, color: '#ffd27a', glow: 0.4 }],
    objects: [
      { x: 1, y: 9, draw: (ctx, x, y, t) => drawHull(ctx, x, y + 16, t) },
      { x: 21, y: 4, draw: (ctx, x, y, t) => drawFigurehead(ctx, x + 6, y + 10, t) },
      { x: 19, y: 5, draw: (ctx, x, y, t) => { // the helm
        ctx.fillStyle = '#3a2414'; ctx.fillRect(x + 4, y + 6, 8, 10); ctx.fillStyle = '#6a4424'; ctx.fillRect(x + 4, y + 6, 8, 2);
        ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.arc(x + 8, y + 5, 7, 0, 6.3); ctx.fill(); ctx.fillStyle = '#3a2414'; ctx.beginPath(); ctx.arc(x + 8, y + 5, 5, 0, 6.3); ctx.fill(); ctx.fillStyle = '#c8a040';
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + t / 4000; ctx.fillRect(Math.round(x + 8 + Math.cos(a) * 7 - 1), Math.round(y + 5 + Math.sin(a) * 7 - 1), 2, 2); }
        ctx.fillRect(x + 7, y + 4, 2, 2);
      } },
    ],
    interact: [
      { x: 19, y: 5, run: async (S) => travel.chooseCourse(S, S.st.flags.heronAt, 'heron') },
      { x: 9, y: 10, bump: true, run: async (S) => { await goAshore(S); } },
      { x: 10, y: 10, bump: true, run: async (S) => { await goAshore(S); } },
      { x: 5, y: 3, run: async (S) => { await S.inn('heronBunk'); } },
      { x: 5, y: 7, run: async (S) => { await S.inn('heronBunk'); } },
      { x: 8, y: 2, run: (S) => S.narrate('Pip\'s workbench. Half-built lanterns, a tin of bolts, and a note: "DO NOT TOUCH. — P. (Cog says: touch it.)"') },
      { x: 11, y: 5, run: (S) => S.narrate('The mast hums faintly. The wood seems to lean toward whoever stands closest.') },
    ],
    onEnter: async (S, st) => {
      if (st.flags.heron && !st.flags.heronBoarded) {
        S.flag('heronBoarded');
        await S.wait(400);
        await S.narrate('The Quiet Heron is built of pale wood and old brass. She hums, very softly, like a held note.');
        await S.say('pip', 'Look at this ship! Look at this *wood*! The grain follows the Current!');
        await S.say('hollis', 'She was built by the first Quiet Hands. She has been waiting a long time for someone to listen.');
        await S.say('wren', 'The hull is warm. It brightens when I touch it.');
        await S.say('cog', 'Bleep.');
        await S.say('pip', 'Cog says she likes you. He finds this concerning.');
        S.objective('Set a course at the helm. The Heron can carry you anywhere the Current still reaches.');
      }
    },
  });
  async function goAshore(S) {
    const here = S.st.flags.heronAt, p = places[here];
    if (!p) return;
    if (!await S.confirm(`Go ashore at ${p.name}?`, 'Go ashore', 'Stay aboard')) { await S.move('wren', 'U', 4); return; }
    await S.warp(p.map, p.x, p.y, p.dir || 'up');
  }

  /* ============================ bonds: camp scenes ============================ */
  G.bonds = {
    list: [],
    add(def) { this.list.push(def); },
    /* play the first scene that is ready and unseen */
    async check(S) {
      const st = S.st;
      for (const b of this.list) {
        if (st.flags['bond_' + b.id]) continue;
        if (st.step < (b.step || 0)) continue;
        if (b.who && !st.party.some((m) => m.id === b.who)) continue;
        if (b.cond && !b.cond(st)) continue;
        S.flag('bond_' + b.id);
        await S.wait(300);
        S.music('farewell');
        await b.run(S);
        S.music(G.world.env.music);
        if (b.reward) { S.sfx('levelup'); G.ui.toast(b.reward); }
        return true;
      }
      return false;
    },
  };
})();
