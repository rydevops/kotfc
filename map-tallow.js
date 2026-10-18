/* =========================================================================
   map-tallow.js — Tallow Cay (the Drift, levels 9-12).
   A lawless black-market island: stacked stalls, crane-hung platforms,
   and stolen crystals burning in every lamp.
   ========================================================================= */
(function () {
  'use strict';
  const kit = G.kit;
  const g = kit.grid(44, 40);
  const H = { roof: 'N', wall: 'Y', win: 'Y', door: 'O' };

  kit.blob(g, 22, 21, 10, 8, 'e', 3, 0.14);     // the Plaza
  kit.blob(g, 7, 22, 6, 6, 'e', 6, 0.14);       // Gilded Hook side (west)
  kit.blob(g, 37, 22, 6, 6, 'e', 9, 0.14);      // the stalls (east)
  kit.blob(g, 22, 7, 9, 5, 'e', 12, 0.12);      // the Crane Yard (north)
  kit.blob(g, 22, 33, 6, 3, 'e', 15, 0.1);      // the Landing (south)

  const wick = kit.house(g, 19, 17, 7, Object.assign({ doorAt: 3 }, H));      // Wick's Counter
  const hook = kit.house(g, 3, 19, 5, Object.assign({ doorAt: 2 }, H));       // the Gilded Hook
  kit.house(g, 9, 21, 4, Object.assign({ doorAt: 1 }, H));
  kit.house(g, 34, 19, 5, Object.assign({ doorAt: 2 }, H));
  kit.house(g, 40, 22, 4, Object.assign({ doorAt: 1 }, H));
  kit.house(g, 15, 4, 6, Object.assign({ doorAt: 2 }, H));                    // the Syndicate counting-house (locked)
  kit.house(g, 25, 4, 5, Object.assign({ doorAt: 2 }, H));
  for (const [x, y] of [[14, 21], [30, 21], [22, 25], [8, 26], [37, 26], [17, 10], [27, 10], [20, 30], [24, 30], [22, 14], [5, 24]]) if (kit.at(g, x, y) === 'e') kit.set(g, x, y, 'I');
  for (const [x, y, c] of [[12, 24, 'x'], [13, 24, 'b'], [31, 24, 'x'], [32, 23, 'b'], [26, 15, 'x'], [18, 14, 'b'], [10, 9, 'x'], [34, 9, 'b']]) if (kit.at(g, x, y) === 'e') kit.set(g, x, y, c);
  kit.rail(g, 'e');
  kit.rect(g, 11, 21, 6, 2, '_');
  kit.rect(g, 28, 21, 6, 2, '_');
  kit.rect(g, 21, 11, 3, 7, '_');
  kit.rect(g, 21, 27, 3, 7, '_');
  kit.rect(g, 21, 33, 3, 7, '_');
  kit.vline(g, 20, 34, 39, 'q'); kit.vline(g, 24, 34, 39, 'q');
  const rows = kit.rows(g);

  const gold = (S, n) => S.gold(n);

  G.register('maps', 'tallow', {
    name: 'Tallow Cay',
    noCliffs: true,
    battleBg: 'tallow',
    tiles: rows,
    env(st) {
      return { sky: 'night', ambient: 0.5, ambientColor: '#0a1a14', music: 'tallow', lights: true, weather: 'motes', travel: 0.01 };
    },
    lights: [
      { x: 22, y: 21, r: 70, color: '#58ffaa', glow: 0.35 }, { x: 5, y: 22, r: 40, color: '#ffb050' }, { x: 37, y: 22, r: 44, color: '#58ffaa' },
      { x: 22, y: 7, r: 60, color: '#ffb050', glow: 0.3 }, { x: 22, y: 33, r: 40, color: '#ffc870' },
    ],
    chests: [
      { id: 'crane1', x: 16, y: 9, item: 'flowCrystal' },
      { id: 'crane2', x: 29, y: 8, item: 'emberFeather' },
      { id: 'crane3', x: 22, y: 5, gold: 320 },
      { id: 'stall1', x: 38, y: 24, item: 'moonDew', qty: 2 },
      { id: 'stall2', x: 6, y: 25, item: 'hearthStew', qty: 2 },
      { id: 'stall3', x: 14, y: 24, gold: 160 },
    ],
    encounters: {
      cond: () => true, where: 'all', rate: 0.045, bg: 'tallow',
      troops: [
        { mobs: ['syndicateGuard', 'syndicateGuard'], w: 3 }, { mobs: ['chainSentry'], w: 2 }, { mobs: ['greenWisp', 'greenWisp'], w: 3 },
        { mobs: ['alleyFox', 'alleyFox'], w: 2 }, { mobs: ['craneGolem'], w: 1 }, { mobs: ['syndicateGuard', 'chainSentry'], w: 2 }, { mobs: ['greenWisp', 'alleyFox', 'greenWisp'], w: 1 },
      ],
    },
    triggers: [
      { x: 19, y: 21, w: 6, h: 1, cond: (st) => st.flags.vesperJoined && !st.flags.idrisDown, once: 'crierScene', run: (S) => G.story.crierScene(S) },
    ],
    interact: [
      { x: 22, y: 16, run: (S) => S.narrate('A sign hangs over the counter: "NO REFUNDS. NO QUESTIONS. NO, WE DO NOT KNOW WHERE THAT CAME FROM."') },
      { x: 16, y: 6, run: (S) => S.narrate('"TALLOW CAY SYNDICATE — COUNTING-HOUSE. Door is locked. We have a lot of guards. Please go away."') },
      { x: 34, y: 21, run: (S) => S.narrate('A fortune teller\'s tent. The sign says "ASK ME ANYTHING." Underneath, in smaller letters, "(ANSWERS ARE A GUESS.)"') },
    ],
    npcs: [
      { id: 'wick', look: 'wick', x: wick.doorX, y: wick.frontY, dir: 'down', talk: (S) => G.story.wick(S) },
      { id: 'vesper', look: 'vesper', x: hook.doorX + 2, y: hook.frontY, dir: 'left', cond: (st) => !st.flags.vesperJoined, talk: (S) => G.story.vesperMeet(S) },
      { id: 'hookKeeper', look: 'smuggler', x: hook.doorX, y: hook.frontY, dir: 'down', talk: async (S) => { await S.inn('tallowInn'); } },
      { id: 'gambler', look: 'gambler', x: 36, y: 23, dir: 'down', talk: (S) => G.story.gambler(S) },
      { id: 'rook', look: 'salvager', x: 26, y: 24, dir: 'left', talk: (S) => G.story.rook(S) },
      { id: 'guardA', look: 'syndicate', x: 22, y: 28, dir: 'down', talk: (S) => S.say('guard', 'Docking fee is nothing today. The Syndicate is feeling generous. Ask me again and it will not be.') },
      { id: 'guardB', look: 'syndicate', x: 17, y: 24, dir: 'right', wander: 1, talk: (S, n, st) => S.say('guard', st.step >= 15 ? 'That Conservatory kid in the plaza... that was *you*? Do not tell the boss I watched. I was not paid to watch.' : 'Move along. Nobody is buying, nobody is selling, and the lamps are all legal. Probably.') },
      { id: 'smugglerA', look: 'smuggler', x: 28, y: 24, dir: 'up', talk: (S, n, st) => S.say('smuggler', st.step >= 14 ? 'Hear the archmage\'s crier? Five thousand gold for the Ward. *Five thousand.* I have never wanted to be somebody else so badly.' : 'Psst. Green crystals. Nine-tenths of a charm and a tenth of a curse. Discount for friends. Everyone is a friend.') },
      { id: 'smugglerB', look: 'smuggler', x: 9, y: 25, dir: 'down', talk: (S) => S.say('smuggler', 'The Current is thinner this month. The crystals burn brighter, though. Funny, that. Do not ask where the brightness comes from.') },
      { id: 'fisherC', look: 'fisher', x: 40, y: 25, dir: 'left', talk: (S) => S.say({ name: 'Cloud-fisher', look: 'fisher' }, 'I came here to sell fish. Nobody here buys fish. They buy *crystals*. I have not sold a fish in a week.') },
    ],
    objects: [],
  });
  G.travel.place('tallow', { name: 'Tallow Cay', layer: 'The Drift', level: '9-12', map: 'tallow', x: 22, y: 31, dir: 'up' });
  G.data.maps.tallow.objects = G.travel.boatObjects('tallow', 22, 36);
  G.data.maps.tallow.interact.push(G.travel.boatInteract('tallow', 22, 36));
})();
