/* =========================================================================
   map-aurelith.js — Aurelith, the Sunken Crown (the Drift, levels 18-22).
   Three maps: the drowned city, Odalys's workshop, and the Crown Hall,
   where the Founders' memory wall and the Drowned Regent wait.
   ========================================================================= */
(function () {
  'use strict';
  const kit = G.kit;

  /* ============================== THE CITY ============================== */
  const g = kit.grid(44, 46, ' ');
  kit.blob(g, 22, 24, 19, 19, '$', 2, 0.1);
  // water-logged plazas
  kit.blob(g, 22, 28, 6, 4, '&', 3, 0.3);
  kit.blob(g, 10, 36, 4, 3, '&', 4, 0.3); kit.blob(g, 34, 36, 4, 3, '&', 5, 0.3);
  kit.blob(g, 9, 21, 3, 2, '&', 6, 0.3); kit.blob(g, 35, 21, 3, 2, '&', 7, 0.3);
  // the Crown Hall (top centre)
  kit.rect(g, 14, 2, 16, 7, '!');
  kit.rect(g, 15, 3, 14, 5, '!');
  kit.set(g, 21, 8, ':'); kit.set(g, 22, 8, ':');
  // the west archive hall: a ruin with a gap on its east side (tablet A)
  kit.frame(g, 3, 12, 9, 7, '!'); kit.rect(g, 11, 14, 1, 3, '$');
  // the east conservatory ruin (tablet B)
  kit.frame(g, 32, 12, 9, 7, '!'); kit.rect(g, 32, 14, 1, 3, '$');
  // the south-west guardhouse (tablet C) opens north
  kit.frame(g, 3, 28, 8, 6, '!'); kit.rect(g, 5, 28, 3, 1, '$');
  // Odalys's workshop: a plain building with a green door
  kit.frame(g, 33, 28, 8, 6, '!'); kit.rect(g, 36, 33, 2, 1, '$');
  kit.set(g, 36, 33, ':'); kit.set(g, 37, 33, ':');
  // pillars along the avenue
  for (const y of [12, 16, 20, 24, 28, 32]) { kit.set(g, 18, y, '@'); kit.set(g, 26, y, '@'); }
  // the dock
  kit.rect(g, 21, 42, 3, 4, '_');
  kit.vline(g, 20, 43, 45, 'q'); kit.vline(g, 24, 43, 45, 'q');
  kit.rail(g, '$', '!');
  kit.rect(g, 21, 41, 3, 1, '$');
  const rows = kit.rows(g);

  function drawSpire(ctx, x, y, t, w, big) {
    const h = big ? 70 : 48, bw = big ? 22 : 14;
    ctx.fillStyle = '#2e6a70'; ctx.fillRect(x + 8 - bw / 2, y - h + 20, bw, h);
    ctx.fillStyle = '#4a9a98'; ctx.fillRect(x + 8 - bw / 2, y - h + 20, 2, h);
    ctx.fillStyle = '#c8a840'; ctx.fillRect(x + 8 - bw / 2 - 2, y - h + 18, bw + 4, 3);
    for (let i = 0; i < 12; i++) { const k = i / 12; ctx.fillStyle = i % 3 ? '#c8a840' : '#f0e8c0'; const ww = bw * (1 - k); ctx.fillRect(x + 8 - ww / 2, y - h + 18 - i * 3, ww, 3); }
    ctx.fillStyle = '#f0d878'; ctx.fillRect(x + 7, y - h - 22, 2, 8);
    ctx.fillStyle = '#a0fff0'; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t / 600); ctx.fillRect(x + 6, y - h + 28, 4, 5); ctx.globalAlpha = 1;
  }

  G.register('maps', 'aurelith', {
    name: 'Aurelith, the Sunken Crown',
    noCliffs: true,
    battleBg: 'aurelith',
    tiles: rows,
    env(st) {
      return { sky: 'deep', ambient: 0.42, ambientColor: '#04202a', music: 'aurelith', lights: true, weather: 'bubbles', travel: 0.008 };
    },
    lights: [{ x: 22, y: 6, r: 56, color: '#f0d878', glow: 0.45 }, { x: 22, y: 28, r: 50, color: '#a0fff0', glow: 0.3 }, { x: 36, y: 31, r: 30, color: '#58ffaa', glow: 0.45 }],
    chests: [
      { id: 'tabletA', x: 6, y: 15, item: 'tabletA' },
      { id: 'tabletB', x: 38, y: 15, item: 'tabletB' },
      { id: 'tabletC', x: 6, y: 31, item: 'tabletC' },
      { id: 'quay1', x: 10, y: 24, item: 'royalJelly' },
      { id: 'quay2', x: 36, y: 24, item: 'emberFeather' },
      { id: 'quay3', x: 22, y: 36, gold: 520 },
      { id: 'quay4', x: 15, y: 40, item: 'crownSaber' },
      { id: 'quay5', x: 30, y: 40, item: 'crownMail' },
    ],
    warps: [
      { x: 21, y: 8, to: 'crownHall', tx: 10, ty: 21, dir: 'up', cond: (st) => st.flags.workshopDone },
      { x: 22, y: 8, to: 'crownHall', tx: 10, ty: 21, dir: 'up', cond: (st) => st.flags.workshopDone },
      { x: 36, y: 33, to: 'workshop', tx: 8, ty: 11, dir: 'up' },
      { x: 37, y: 33, to: 'workshop', tx: 8, ty: 11, dir: 'up' },
    ],
    encounters: {
      cond: (st) => st.step >= 22, where: 'all', rate: 0.045, bg: 'aurelith',
      troops: [
        { mobs: ['tideWisp', 'tideWisp'], w: 3 }, { mobs: ['crownSentry', 'crownSentry'], w: 2 }, { mobs: ['sunkenGolem'], w: 2 },
        { mobs: ['abyssFin', 'abyssFin'], w: 3 }, { mobs: ['tideWisp', 'crownSentry'], w: 2 }, { mobs: ['abyssFin', 'tideWisp', 'abyssFin'], w: 1 },
      ],
    },
    triggers: [],
    interact: [
      { x: 21, y: 9, run: (S, st) => S.narrate(st.flags.workshopDone ? 'The Crown Hall doors stand open. Beyond them, a long hall of green and gold, and somewhere in it, a faint ticking.' : 'The great doors of the Crown Hall. They are sealed, and a layer of green water slowly washes over the threshold.') },
      { x: 20, y: 8, run: (S) => S.narrate('A plaque in old royal script: "Here sits the Crown of Orrenth. May it never sink." Someone has added, in chalk: "Oops."') },
    ],
    npcs: [
      { id: 'tolly', look: 'tolly', x: 22, y: 39, dir: 'down', talk: (S) => G.story.tolly(S) },
      { id: 'guardGhostA', look: 'foundryBot', x: 17, y: 28, dir: 'right', cond: () => false },
    ],
    onEnter: async (S, st) => { if (st.step === 21 && !st.flags.aurelithArrived) await G.story.aurelithArrive(S); },
    objects: [
      { x: 8, y: 7, draw: (c, x, y, t, w) => drawSpire(c, x, y, t, w, false) },
      { x: 34, y: 6, draw: (c, x, y, t, w) => drawSpire(c, x, y, t, w, true) },
      { x: 1, y: 22, draw: (c, x, y, t, w) => drawSpire(c, x, y, t, w, false) },
      { x: 42, y: 26, draw: (c, x, y, t, w) => drawSpire(c, x, y, t, w, false) },
    ].concat(G.travel.boatObjects('aurelith', 22, 44)),
  });
  G.travel.place('aurelith', { name: 'Aurelith, the Sunken Crown', layer: 'The Drift', level: '18-22', map: 'aurelith', x: 22, y: 41, dir: 'up' });
  G.data.maps.aurelith.interact.push(G.travel.boatInteract('aurelith', 22, 44));

  /* ============================== THE WORKSHOP ============================== */
  const w = kit.grid(18, 14, ' ');
  kit.rect(w, 2, 2, 14, 10, 'n');
  kit.frame(w, 1, 1, 16, 12, '!');
  kit.set(w, 7, 12, ':'); kit.set(w, 8, 12, ':');
  kit.set(w, 8, 11, 'n'); kit.set(w, 7, 11, 'n');
  kit.set(w, 3, 3, '('); kit.set(w, 4, 3, '('); kit.set(w, 5, 3, '(');
  kit.set(w, 13, 3, ')'); kit.set(w, 14, 3, 'x'); kit.set(w, 3, 9, 'x'); kit.set(w, 14, 9, 'b'); kit.set(w, 14, 10, 'x');
  const wrows = kit.rows(w);

  G.register('maps', 'workshop', {
    name: 'Odalys\'s Workshop',
    interior: true,
    battleBg: 'aurelith',
    tiles: wrows,
    env() { return { sky: 'none', ambient: 0.2, ambientColor: '#04202a', music: 'aurelith', lights: true }; },
    lights: [{ x: 4, y: 4, r: 40, color: '#ffd27a', glow: 0.5 }, { x: 13, y: 4, r: 36, color: '#6ff3ff', glow: 0.6 }],
    warps: [
      { x: 7, y: 12, to: 'aurelith', tx: 36, ty: 34, dir: 'down' },
      { x: 8, y: 12, to: 'aurelith', tx: 37, ty: 34, dir: 'down' },
    ],
    chests: [
      { id: 'bench', x: 3, y: 10, item: 'royalJelly', qty: 2 },
      { id: 'drawer', x: 9, y: 3, item: 'flowCrystal' },
    ],
    interact: [
      { x: 13, y: 3, run: (S, st) => G.story.workshopLog(S) },
      { x: 4, y: 3, run: (S) => S.narrate('A workbench in the middle of a project: half a lantern, a hand-crank, and a hundred tiny star-shaped rivets in a dish. A pencil lies across the plans, as if she only stepped out for a moment.') },
      { x: 9, y: 2, run: (S) => S.narrate('A blueprint pinned to the wall: "THE FENWICK LIMITER." A cutaway of a coupling. In the margin, in her slanted hand: "It should never open all the way."') },
    ],
    npcs: [],
    onEnter: async (S, st) => { if (!st.flags.workshopSeen) { S.flag('workshopSeen'); await G.story.workshopEnter(S); } },
  });

  /* ============================== THE CROWN HALL ============================== */
  const c = kit.grid(22, 24, ' ');
  kit.rect(c, 2, 2, 18, 20, '$');
  kit.frame(c, 1, 1, 20, 22, '!');
  // pillars and the memory wall
  for (const y of [5, 9, 13, 17]) { kit.set(c, 5, y, '@'); kit.set(c, 16, y, '@'); }
  kit.rect(c, 7, 2, 8, 1, '!');
  kit.set(c, 9, 2, ')'); kit.set(c, 11, 2, ')'); kit.set(c, 13, 2, ')');
  kit.set(c, 10, 22, ':'); kit.set(c, 11, 22, ':');
  kit.set(c, 10, 21, '$'); kit.set(c, 11, 21, '$');
  // the sluice, behind the throne
  kit.set(c, 11, 4, '/');
  const crows = kit.rows(c);

  G.register('maps', 'crownHall', {
    name: 'The Crown Hall',
    interior: true,
    battleBg: 'aurelith',
    tiles: crows,
    env() { return { sky: 'none', ambient: 0.32, ambientColor: '#04202a', music: 'aurelith', lights: true }; },
    lights: [{ x: 11, y: 5, r: 60, color: '#f0d878', glow: 0.5 }, { x: 11, y: 18, r: 50, color: '#a0fff0', glow: 0.35 }],
    warps: [
      { x: 10, y: 22, to: 'aurelith', tx: 21, ty: 9, dir: 'down' },
      { x: 11, y: 22, to: 'aurelith', tx: 22, ty: 9, dir: 'down' },
      { x: 11, y: 4, to: 'foundryDocks', tx: 14, ty: 25, dir: 'up', cond: (st) => st.flags.regentDown },
    ],
    chests: [
      { id: 'hall1', x: 3, y: 4, item: 'sunCrystal' },
      { id: 'hall2', x: 18, y: 4, item: 'royalJelly', qty: 2 },
    ],
    interact: [
      { x: 9, y: 2, run: (S) => G.story.memoryWall(S) },
      { x: 11, y: 2, run: (S) => G.story.memoryWall(S) },
      { x: 13, y: 2, run: (S) => G.story.memoryWall(S) },
      { x: 11, y: 4, cond: (st) => !st.flags.regentDown, run: (S) => S.narrate('A sluice gate behind the throne, sealed with a Founder\'s lock. It does not respond to anything you have.') },
    ],
    npcs: [],
    encounters: { cond: (st) => !st.flags.regentDown, where: 'all', rate: 0.03, bg: 'aurelith', troops: [{ mobs: ['crownSentry', 'crownSentry'], w: 2 }, { mobs: ['sunkenGolem'], w: 1 }, { mobs: ['tideWisp', 'tideWisp'], w: 2 }] },
    objects: [
      { x: 10, y: 3, draw: (ctx, x, y, t) => { // the empty throne
        ctx.fillStyle = '#2e6a70'; ctx.fillRect(x - 6, y + 4, 28, 14); ctx.fillStyle = '#c8a840'; ctx.fillRect(x - 6, y + 4, 28, 2); ctx.fillRect(x + 2, y - 8, 12, 14);
        ctx.fillStyle = '#a0fff0'; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t / 700); ctx.fillRect(x + 6, y - 2, 4, 4); ctx.globalAlpha = 1;
      } },
    ],
  });
})();
