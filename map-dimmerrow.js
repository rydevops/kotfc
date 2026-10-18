/* =========================================================================
   map-dimmerrow.js — Dimmerrow (fringe island, levels 12-15).
   The Current died here first. Grey fields, still windmills, and people
   who stopped talking last winter. A few embers of colour remain.
   ========================================================================= */
(function () {
  'use strict';
  const kit = G.kit;
  const g = kit.grid(40, 40, ' ');
  const R = { roof: 'U', wall: 'z', win: 'z', door: 'D' };

  kit.blob(g, 20, 20, 17, 15, 'l', 4, 0.12);
  // dock
  kit.rect(g, 19, 33, 3, 7, '_');
  kit.vline(g, 18, 34, 39, 'q'); kit.vline(g, 22, 34, 39, 'q');
  // paths
  kit.vline(g, 20, 8, 33, 'A'); kit.vline(g, 21, 8, 33, 'A');
  kit.hline(g, 8, 32, 19, 'A'); kit.hline(g, 8, 32, 20, 'A');
  // houses
  const tend = kit.house(g, 17, 4, 7, Object.assign({}, R, { doorAt: 3 }));     // the Tending House (Hollis)
  const pell = kit.house(g, 25, 13, 5, Object.assign({}, R, { doorAt: 2 }));    // Pell's Shelves
  const h1 = kit.house(g, 9, 13, 5, Object.assign({}, R, { doorAt: 2 }));
  const school = kit.house(g, 9, 24, 6, Object.assign({}, R, { doorAt: 2 }));   // the old schoolhouse
  const h3 = kit.house(g, 27, 24, 5, Object.assign({}, R, { doorAt: 2 }));
  const mill = kit.house(g, 4, 17, 3, Object.assign({}, R, { doorAt: 1 }));
  // the grey tall grass the Hollowed wander through
  kit.blob(g, 8, 31, 5, 3, 'y', 7, 0.3); kit.blob(g, 32, 30, 5, 4, 'y', 8, 0.3); kit.blob(g, 14, 9, 4, 2.5, 'y', 9, 0.3); kit.blob(g, 32, 9, 4, 3, 'y', 10, 0.3);
  // dead trees, wilted flowers, braziers (the village's last warm lights)
  for (const [x, y] of [[6, 14], [13, 28], [30, 17], [34, 14], [15, 22], [26, 28], [5, 27], [35, 25], [12, 7], [28, 7]]) kit.set(g, x, y, 'S');
  for (const [x, y] of [[16, 15], [25, 22], [12, 18], [30, 21], [22, 14], [17, 27], [7, 22], [34, 20]]) if (kit.at(g, x, y) === 'l') kit.set(g, x, y, 'j');
  for (const [x, y] of [[19, 17], [22, 17], [19, 22], [22, 22], [19, 5], [24, 5]]) kit.set(g, x, y, '1');
  const rows = kit.rows(g);

  function drawWindmill(ctx, x, y, t, w) {
    // a still windmill: the blades only twitch, once, now and then
    const twitch = Math.sin(t / 3000) > 0.985 ? 0.08 : 0;
    ctx.fillStyle = '#6a6a72'; for (let i = 0; i < 40; i++) { const hw = 9 - i * 0.12; ctx.fillRect(x + 8 - hw, y + 18 - i, hw * 2, 1); }
    ctx.fillStyle = '#8a8a94'; ctx.fillRect(x - 2, y + 17, 20, 2);
    ctx.fillStyle = '#4a4a54'; ctx.fillRect(x + 6, y + 8, 4, 10);
    ctx.fillStyle = '#9a9aa6'; ctx.fillRect(x + 6, y - 22, 4, 4);
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + 0.4 + twitch;
      ctx.fillStyle = '#7a7a86';
      for (let r = 4; r < 26; r++) ctx.fillRect(Math.round(x + 8 + Math.cos(a) * r - 1), Math.round(y - 20 + Math.sin(a) * r - 1), 2, 2);
      ctx.fillStyle = '#c8c8d4';
      for (let r = 10; r < 24; r++) { const px = x + 8 + Math.cos(a) * r - Math.sin(a) * 3, py = y - 20 + Math.sin(a) * r + Math.cos(a) * 3; ctx.fillRect(Math.round(px), Math.round(py), 2, 2); }
    }
    ctx.fillStyle = '#e0e0f0'; ctx.fillRect(x + 7, y - 21, 2, 2);
  }

  G.register('maps', 'dimmerrow', {
    name: 'Dimmerrow',
    battleBg: 'dimmerrow',
    tiles: rows,
    setup(st, grid) { /* the island does not change; the villagers do */ },
    env(st) {
      const bright = st.flags.mawDown;
      return { sky: 'ash', ambient: bright ? 0.28 : 0.36, ambientColor: '#1a1a24', music: 'dimmerrow', lights: true, weather: bright ? 'motes' : 'ash', travel: 0.008 };
    },
    lights: [{ x: 20, y: 17, r: 44, color: '#ffa850', glow: 0.5 }, { x: 20, y: 8, r: 36, color: '#ffe0a0', glow: 0.4 }],
    chests: [
      { id: 'schoolBox', x: 11, y: 26, item: 'lullabyBox' },
      { id: 'milk', x: 5, y: 20, item: 'hearthStew' },
      { id: 'cliffA', x: 8, y: 30, item: 'moonDew' },
      { id: 'cliffB', x: 33, y: 29, item: 'royalJelly' },
      { id: 'grassC', x: 15, y: 8, gold: 210 },
      { id: 'grassD', x: 33, y: 8, item: 'dawnCrystal' },
    ],
    encounters: {
      cond: (st) => !st.flags.mawDown || true, where: 'grass', rate: 0, grassRate: 0.14, bg: 'dimmerrow',
      troops: [
        { mobs: ['hollowedVillager'], w: 3 }, { mobs: ['hollowedVillager', 'hollowedVillager'], w: 2 }, { mobs: ['greySeam', 'ashWisp'], w: 3 },
        { mobs: ['hollowedScholar', 'ashWisp'], w: 2 }, { mobs: ['hollowedFerryman'], w: 2 }, { mobs: ['emberMoth', 'emberMoth'], w: 2 }, { mobs: ['greySeam', 'greySeam'], w: 2 },
      ],
    },
    triggers: [
      { x: 17, y: 18, w: 7, h: 1, cond: (st) => st.flags.hollisMet && !st.flags.mawDown && st.step >= 16, once: 'mawScene', run: (S) => G.story.mawScene(S) },
    ],
    interact: [
      { x: 3, y: 18, run: (S) => S.narrate('The windmill\'s door is open. Inside, a dusty millstone sits half-turned, as if it forgot which way to go.') },
      { x: 10, y: 26, run: (S) => S.narrate('"DIMMERROW SCHOOL." A slate by the door still has today\'s lesson on it: the date, two years old, and "Remember to listen."') },
      { x: 28, y: 26, run: (S) => S.narrate('A cottage, tidy and swept. The table is set for three. Nobody has eaten at it in a very long time.') },
    ],
    npcs: [
      { id: 'hollis', look: 'hollis', x: tend.doorX, y: tend.frontY, dir: 'down', cond: (st) => !st.flags.hollisJoined, talk: (S) => G.story.hollisMeet(S) },
      { id: 'hollisKeep', look: 'monk', x: tend.doorX + 2, y: tend.frontY, dir: 'down', cond: (st) => !!st.flags.hollisJoined, talk: async (S) => { await S.say({ name: 'Sister Anselm', look: 'sister' }, 'Rest as long as you wish. Hollis would insist. I am only here to say so on his behalf.'); await S.inn('dimmerrowInn'); } },
      { id: 'pell', look: 'pell', x: pell.doorX, y: pell.frontY, dir: 'down', talk: (S) => G.story.pell(S) },
      { id: 'marn', look: 'marn', x: 20, y: 24, dir: 'down', wander: 1, talk: (S) => G.story.marn(S) },
      { id: 'hMother', look: 'hollowedMother', x: 14, y: 21, dir: 'left', talk: (S) => S.narrate('A woman folds a cloth that is not there, again and again. She hums, and does not look up.') },
      { id: 'hFerryman', look: 'hollowedFerryman', x: 20, y: 31, dir: 'down', cond: () => true, talk: (S) => S.narrate('An old ferryman stands at the end of the dock, facing the empty mist. "...dusk," he murmurs. "...ferry comes at dusk..."') },
      { id: 'hScholar', look: 'hollowedScholar', x: 12, y: 27, dir: 'up', talk: (S) => S.narrate('A scholar recites a lecture whose subject he has lost. Every few lines he stops, frowning, and begins again from the top.') },
      { id: 'hWander', look: 'hollowedScholar', x: 8, y: 28, dir: 'down', cond: (st) => !st.flags.wandererHome, talk: (S) => G.story.wanderer(S) },
      { id: 'hKid', look: 'marn', x: 26, y: 20, dir: 'down', wander: 1, talk: (S) => S.narrate('A little boy pats the dusty ground, tapping to a rhythm that no one else can hear.') },
    ],
    onEnter: async (S, st) => { if (st.step === 15 && !st.flags.dimmerrowArrived) await G.story.dimmerrowArrive(S); },
    objects: [
      { x: 5, y: 16, draw: drawWindmill },
      { x: 34, y: 8, draw: drawWindmill },
    ].concat(G.travel.boatObjects('dimmerrow', 20, 35)),
  });
  G.travel.place('dimmerrow', { name: 'Dimmerrow', layer: 'The Fringe', level: '12-15', map: 'dimmerrow', x: 20, y: 32, dir: 'up' });
  G.data.maps.dimmerrow.interact.push(G.travel.boatInteract('dimmerrow', 20, 35));
})();
