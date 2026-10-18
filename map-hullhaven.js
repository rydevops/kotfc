/* =========================================================================
   map-hullhaven.js — Hullhaven (the Drift, levels 6-9) and the Breakers,
   the wreck-forest beneath it where the Drift Leviathan lives.
   ========================================================================= */
(function () {
  'use strict';
  const kit = G.kit;

  /* ============================== HULLHAVEN ============================== */
  const g = kit.grid(40, 38);
  // four lashed-together wrecks, joined by plank walkways
  kit.blob(g, 20, 17, 9, 7, 'H', 3, 0.15);     // the Mother Hull (centre)
  kit.blob(g, 7, 18, 6, 6, 'H', 5, 0.15);      // the Gull (west)
  kit.blob(g, 33, 17, 6, 6, 'H', 8, 0.15);     // the Anchor (east)
  kit.blob(g, 20, 5, 7, 4, 'H', 11, 0.15);     // the Prow (north)
  kit.blob(g, 20, 30, 6, 3, 'H', 13, 0.12);    // the Landing (south)
  // houses on the Mother Hull
  const bilge = kit.house(g, 15, 14, 7, { roof: 'J', wall: 'i', win: 'i', door: 'O', doorAt: 3 });   // Salvage Heap
  const inn = kit.house(g, 23, 14, 5, { roof: 'J', wall: 'i', win: 'i', door: 'O', doorAt: 2 });     // the Rusty Gull
  // the west wreck (Pip's old street)
  const pipHome = kit.house(g, 3, 14, 5, { roof: 'J', wall: 'i', win: 'i', door: 'O', doorAt: 2 });
  kit.house(g, 9, 15, 4, { roof: 'J', wall: 'i', win: 'i', door: 'O', doorAt: 1 });
  // the east wreck (Isolde's recovery bunk, the fish racks)
  const bunk = kit.house(g, 30, 14, 5, { roof: 'J', wall: 'i', win: 'i', door: 'O', doorAt: 2 });
  kit.house(g, 35, 17, 4, { roof: 'J', wall: 'i', win: 'i', door: 'O', doorAt: 2 });
  // the north prow: the Breakers hatch
  kit.rect(g, 18, 2, 5, 1, 'i'); kit.set(g, 20, 2, 'O');
  // dressing
  kit.scatter(g, 'x', 9, 21, 'H');
  kit.scatter(g, 'b', 7, 22, 'H');
  kit.scatter(g, 'L', 0, 1, 'H');
  // lamp posts
  for (const [x, y] of [[14, 19], [26, 19], [20, 20], [8, 13], [33, 13], [18, 28], [22, 28], [20, 7]]) if (kit.at(g, x, y) === 'H') kit.set(g, x, y, 'L');
  kit.rail(g, 'H');
  // walkways and the south dock go in after the rails, overlapping both ends
  kit.rect(g, 11, 17, 6, 2, '_');
  kit.rect(g, 24, 17, 6, 2, '_');
  kit.rect(g, 19, 8, 3, 6, '_');
  kit.rect(g, 19, 23, 3, 7, '_');
  kit.rect(g, 19, 30, 3, 7, '_');
  kit.vline(g, 18, 31, 36, 'q'); kit.vline(g, 22, 31, 36, 'q');
  const rows = kit.rows(g);

  // the part a cloud-fisher lost

  G.register('maps', 'hullhaven', {
    name: 'Hullhaven',
    noCliffs: true,
    battleBg: 'hullhaven',
    tiles: rows,
    env(st) {
      return { sky: 'mist', ambient: 0.4, ambientColor: '#1a1220', music: 'hullhaven', lights: true, weather: 'fog', travel: 0.015, sink: -20 };
    },
    lights: [
      { x: 16, y: 17, r: 40, color: '#ffb050' }, { x: 25, y: 17, r: 36, color: '#ffb050' },
      { x: 4, y: 17, r: 36, color: '#ffb050' }, { x: 33, y: 17, r: 36, color: '#ffb050' },
      { x: 20, y: 31, r: 40, color: '#ffc870' },
    ],
    warps: [
      { x: 20, y: 2, to: 'breakers', tx: 14, ty: 27, dir: 'up' },
    ],
    chests: [
      { id: 'westCrate', x: 4, y: 22, item: 'hearthStew' },
      { id: 'eastCrate', x: 37, y: 20, item: 'sparkTonic', qty: 2 },
      { id: 'hullGold', x: 17, y: 22, gold: 140 },
    ],
    encounters: { cond: (st) => st.step >= 11 && !st.flags.noHullEnc, where: 'all', rate: 0.0, bg: 'hullhaven', troops: [{ mobs: ['mistEel'], w: 1 }] },
    interact: [
      { x: 19, y: 12, run: (S) => S.narrate('A hand-painted sign nailed to a hull plank: "HULLHAVEN — pop. 412, minus one if you touch the rope."') },
      { x: 5, y: 17, run: (S) => S.narrate('A laundry line of sails, rags and one very confused flag.') },
      { x: 33, y: 18, run: (S) => S.narrate('Fish racks. They smell like the Drift: cold, green, and a little bit sorry.') },
    ].concat([]),
    npcs: [
      { id: 'bilge', look: 'bilge', x: bilge.doorX, y: bilge.frontY, dir: 'down', talk: (S) => G.story.bilge(S) },
      { id: 'salvager', look: 'salvager', x: 16, y: 21, dir: 'right', wander: 1, talk: (S, n, st) => S.say('salvager', st.step < 12 ? 'Fresh off the escape, hm? Nobody comes down to the Hull without a reason. Or a debt.' : 'Heard you dealt with the big eel. Drinks are on us. Metaphorically. We\'re broke.') },
      { id: 'ropeman', look: 'ropeman', x: 26, y: 21, dir: 'left', talk: (S) => S.say({ name: 'Rope-man', look: 'ropeman' }, 'The whole town is lashed together with my knots. Every rope on this island has my name on it. Don\'t pull the blue one.') },
      { id: 'fishwife', look: 'fishwife', x: 8, y: 20, dir: 'down', talk: (S) => G.story.fishwife(S) },
      { id: 'innkeepH', look: 'salvager', x: inn.doorX, y: inn.frontY, dir: 'down', talk: async (S, n, st) => { await S.inn('hullhavenInn'); } },
      { id: 'pipKin', look: 'pipKin', x: pipHome.doorX + 1, y: pipHome.frontY, dir: 'down', wander: 1, talk: (S) => G.story.pipKin(S) },
      { id: 'isoldeH', look: 'isolde', x: bunk.doorX, y: bunk.frontY, dir: 'down', cond: (st) => st.step >= 10, talk: (S) => G.story.isoldeHullhaven(S) },
      { id: 'lanternBoy', look: 'kid', x: 22, y: 21, dir: 'down', wander: 1, talk: (S) => G.story.hullLantern(S) },
      { id: 'fisher2', look: 'fisher', x: 30, y: 21, dir: 'left', talk: (S, n, st) => S.say({ name: 'Cloud-fisher', look: 'fisher' }, st.step >= 12 ? 'The public ferries stopped running yesterday. I walked in from the Cay on a plank. A *plank*.' : 'Ferries stopped three days back. Half the town\'s stuck here and the other half\'s stuck elsewhere.') },
    ],
    objects: [
      // the Prow's rusty figurehead (a crashed airship's bow)
      { x: 17, y: 0, draw: (ctx, x, y, t) => { ctx.fillStyle = '#4a3220'; ctx.fillRect(x + 4, y + 2, 56, 18); ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x + 4, y + 2, 56, 2); ctx.fillStyle = '#c8a050'; ctx.fillRect(x + 10, y + 8, 4, 4); ctx.fillRect(x + 28, y + 8, 4, 4); ctx.fillRect(x + 46, y + 8, 4, 4); } },
    ].concat(G.travel.boatObjects('hullhaven', 20, 34)),
  });
  G.travel.place('hullhaven', { name: 'Hullhaven', layer: 'The Drift', level: '6-9', map: 'hullhaven', x: 20, y: 31, dir: 'up' });
  // dock interact for the skiff
  G.data.maps.hullhaven.interact.push(G.travel.boatInteract('hullhaven', 20, 34));

  /* ============================== THE BREAKERS ============================== */
  const b = kit.grid(30, 32);
  // an arena of crashed hulls: a winding path of hull plate with side bays
  kit.rect(b, 11, 25, 7, 6, 'H');              // landing under the hatch
  kit.rect(b, 13, 19, 4, 6, 'H');              // path north
  kit.rect(b, 6, 16, 18, 4, 'H');              // first hold
  kit.rect(b, 3, 10, 5, 7, 'H');               // west bay
  kit.rect(b, 22, 10, 5, 7, 'H');              // east bay
  kit.rect(b, 12, 11, 6, 5, 'H');              // second hold
  kit.rect(b, 13, 5, 4, 7, 'H');               // path to the lair
  kit.blob(b, 15, 3, 7, 3.4, 'H', 4, 0.1);     // the Leviathan's lair
  // hull walls give structure
  for (let y = 0; y < b.length; y++) for (let x = 0; x < b[0].length; x++) {
    if (b[y][x] !== ' ') continue;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => kit.at(b, x + dx, y + dy) === 'H');
    if (near && kit.at(b, x, y + 1) === 'H') b[y][x] = 'i';
  }
  for (const [x, y, c] of [[7, 17, 'x'], [8, 17, 'b'], [23, 18, 'x'], [22, 17, 'b'], [6, 12, 'b'], [25, 12, 'x']]) kit.set(b, x, y, c);
  kit.set(b, 14, 28, 'L'); kit.set(b, 16, 28, 'L');
  kit.rail(b, 'H');
  const brows = kit.rows(b);

  G.register('maps', 'breakers', {
    name: 'The Breakers',
    noCliffs: true,
    battleBg: 'hullhaven',
    tiles: brows,
    env(st) {
      return { sky: 'mist', ambient: 0.55, ambientColor: '#0c0c1c', music: 'hullhaven', lights: true, weather: 'fog', travel: 0.01 };
    },
    lights: [{ x: 15, y: 3, r: 70, color: '#58ffaa', glow: 0.5 }, { x: 5, y: 13, r: 36, color: '#ffb050' }, { x: 24, y: 13, r: 36, color: '#ffb050' }],
    warps: [
      { x: 14, y: 30, to: 'hullhaven', tx: 20, ty: 4, dir: 'down' },
      { x: 15, y: 30, to: 'hullhaven', tx: 20, ty: 4, dir: 'down' },
    ],
    chests: [
      { id: 'westBay', x: 6, y: 11, item: 'royalJelly' },
      { id: 'eastBay', x: 26, y: 13, item: 'moonDew' },
      { id: 'part', x: 5, y: 13, item: 'stationPart' },
      { id: 'hold', x: 9, y: 18, item: 'rustBadge' },
      { id: 'hold2', x: 21, y: 18, gold: 180 },
      { id: 'lair', x: 11, y: 3, item: 'tideglassBlade' },
    ],
    encounters: {
      cond: (st) => true, where: 'all', rate: 0.05, bg: 'hullhaven',
      troops: [
        { mobs: ['gleamfin', 'gleamfin'], w: 3 }, { mobs: ['mistfox'], w: 2 }, { mobs: ['rustCrawler', 'rustCrawler'], w: 3 },
        { mobs: ['scrapSentry'], w: 2 }, { mobs: ['wreckMoth', 'mistEel', 'wreckMoth'], w: 2 }, { mobs: ['runawayGolem'], w: 1 }, { mobs: ['mistfox', 'gleamfin'], w: 2 },
      ],
    },
    triggers: [
      { x: 12, y: 6, w: 6, h: 2, cond: (st) => !st.flags.leviathanDown, once: 'leviathan', run: (S) => G.story.leviathan(S) },
    ],
    npcs: [
      { id: 'leviathan', look: 'leviNpc', x: 15, y: 2, dir: 'down', cond: (st) => !st.flags.leviathanDown, talk: (S) => G.story.leviathan(S) },
    ],
    objects: [],
    interact: [
      { x: 9, y: 15, run: (S) => S.narrate('A cloud-fisher\'s lantern, dark. Scratched on the hull: "If you find my brass sleeve, I will give you my best hat. — Tam."') },
    ],
  });

  // The Leviathan's overworld sprite is just its battle art shrunk
  G.register('looks', 'leviNpc', {
    custom: () => { const c = G.sprites.mob(G.data.mobs.driftLeviathan); const a = [c, c, c, c]; return { down: a, up: a, left: a, right: a }; },
  });
})();
