/* =========================================================================
   map-hushwell.js — Hushwell Sanctuary (the Lantern Isles, levels 15-18).
   Terraced gardens, still pools, humming stones. The last place in the Isles
   where the Current still feels strong. Home of the Quiet Hands.
   ========================================================================= */
(function () {
  'use strict';
  const kit = G.kit;
  const g = kit.grid(40, 48, ' ');
  const Hs = { roof: '^', wall: 't', win: 'w', door: 'D' };

  kit.blob(g, 20, 22, 17, 21, '.', 6, 0.1);
  // terrace walls, each with a 3-wide stair of garden path
  for (const wy of [31, 22, 13]) {
    for (let x = 0; x < 40; x++) if (kit.at(g, x, wy) === '.') kit.set(g, x, wy, 't');
    kit.rect(g, 19, wy, 3, 1, 'p');
  }
  // main path
  kit.rect(g, 19, 5, 3, 37, 'p');
  // houses: the Elder's Hall (top), Pilgrims' Hall (inn), Garden Stores
  const hall = kit.house(g, 16, 4, 9, Object.assign({}, Hs, { doorAt: 4 }));
  const inn = kit.house(g, 7, 24, 6, Object.assign({}, Hs, { doorAt: 2 }));
  const store = kit.house(g, 28, 24, 6, Object.assign({}, Hs, { doorAt: 3 }));
  kit.house(g, 7, 15, 5, Object.assign({}, Hs, { doorAt: 2 }));
  kit.house(g, 29, 15, 5, Object.assign({}, Hs, { doorAt: 2 }));
  // pools
  kit.blob(g, 10, 34, 3, 2, 'F', 3, 0.2); kit.blob(g, 31, 34, 3, 2, 'F', 4, 0.2);
  kit.blob(g, 12, 20, 2, 1.4, 'F', 5, 0.2); kit.blob(g, 28, 20, 2, 1.4, 'F', 6, 0.2);
  kit.blob(g, 14, 9, 2, 1.4, 'F', 7, 0.2); kit.blob(g, 26, 9, 2, 1.4, 'F', 8, 0.2);
  // trees, humming stones, flowers
  for (const [x, y] of [[5, 28], [34, 28], [4, 36], [36, 36], [6, 19], [34, 19], [11, 27], [31, 28], [9, 9], [31, 9], [14, 36], [27, 36], [8, 12], [32, 12]]) if (kit.at(g, x, y) === '.') kit.set(g, x, y, 'C');
  for (const [x, y] of [[17, 9], [23, 9], [17, 17], [23, 17], [17, 27], [23, 27], [17, 36], [23, 36], [16, 40], [24, 40]]) if (kit.at(g, x, y) === '.') kit.set(g, x, y, 'V');
  // dock
  kit.rect(g, 19, 41, 3, 7, '_');
  kit.vline(g, 18, 42, 47, 'q'); kit.vline(g, 22, 42, 47, 'q');
  const rows = kit.rows(g);

  G.register('maps', 'hushwell', {
    name: 'Hushwell Sanctuary',
    battleBg: 'hushwell',
    tiles: rows,
    env(st) {
      const drained = st.flags.neveHere && !st.flags.neveDown;
      return { sky: drained ? 'dusk' : 'day', ambient: drained ? 0.5 : 0.1, ambientColor: drained ? '#1a1a2a' : '#0a2a1a', music: 'hushwell', lights: true, weather: drained ? 'ash' : 'petals', travel: 0.006 };
    },
    lights: [{ x: 20, y: 8, r: 60, color: '#8affd8', glow: 0.4 }, { x: 20, y: 30, r: 50, color: '#fff0b0', glow: 0.3 }],
    chests: [
      { id: 'garden1', x: 11, y: 37, item: 'royalJelly' },
      { id: 'garden2', x: 30, y: 37, item: 'moonDew', qty: 2 },
      { id: 'terrace2a', x: 6, y: 20, item: 'gardenersEdge' },
      { id: 'terrace2b', x: 34, y: 20, item: 'hushBead' },
      { id: 'warden', x: 5, y: 14, item: 'stationPart' },
      { id: 'top1', x: 11, y: 8, gold: 380 },
      { id: 'top2', x: 30, y: 8, item: 'emberFeather' },
    ],
    encounters: {
      cond: (st) => st.flags.neveDown && st.step >= 21, where: 'all', rate: 0.03, bg: 'hushwell',
      troops: [{ mobs: ['thornFox', 'thornFox'], w: 3 }, { mobs: ['bloomMoth', 'bloomMoth'], w: 3 }, { mobs: ['gardenWarden'], w: 2 }, { mobs: ['thornFox', 'bloomMoth'], w: 2 }],
    },
    triggers: [
    ],
    interact: [
      { x: 19, y: 7, run: (S) => S.narrate('A plaque set in the hall wall: "Listen first. Speak second. Strike never."') },
      { x: 29, y: 26, run: (S) => S.narrate('Garden Stores. Shelves of jars, labelled in a very patient hand: HONEY, MORE HONEY, EVEN MORE HONEY.') },
      { x: 8, y: 26, run: (S) => S.narrate('The Pilgrims\' Hall. The door is open. Someone has left a pot of tea steaming by the mat, for whoever turns up.') },
    ],
    npcs: [
      { id: 'maribel', look: 'maribel', x: hall.doorX, y: hall.frontY, dir: 'down', talk: (S) => G.story.maribel(S) },
      { id: 'innSister', look: 'sister', x: inn.doorX, y: inn.frontY, dir: 'down', talk: async (S) => { await S.say('sister', 'The Quiet Hands never charge for a bed. Rest well, and sleep deeply.'); await S.inn('hushwellInn'); } },
      { id: 'storeBrother', look: 'monk', x: store.doorX, y: store.frontY, dir: 'down', talk: async (S) => { await S.say('monk', 'Honey, herbs, and whatever the garden gave this season. Take what you need.'); await S.shop('hushwellStore'); } },
      { id: 'gardenerH', look: 'gardener', x: 14, y: 28, dir: 'right', wander: 1, talk: (S) => G.story.gardener(S) },
      { id: 'monkA', look: 'monk', x: 24, y: 19, dir: 'left', talk: (S, n, st) => S.say('monk', st.step >= 21 ? 'We are mending what Neve took. The Quiet Hands do not hold grudges. We hold gardens.' : 'You walk like someone who has been carrying something very heavy. It is all right to set it down here.') },
      { id: 'sisterB', look: 'sister', x: 12, y: 18, dir: 'down', talk: (S) => S.say('sister', 'Every stone in this garden hums a different note. Hollis could tell you which is which. He never lets on that he can.') },
      { id: 'monkB', look: 'monk', x: 26, y: 33, dir: 'down', wander: 1, talk: (S) => S.say('monk', 'The pools are still because nobody here is in a hurry. It is the best thing about us, and also the worst.') },
      { id: 'sisterC', look: 'sister', x: 14, y: 38, dir: 'up', talk: (S) => G.story.sisterPart(S) },
    ],
    onEnter: async (S, st) => { if (st.step === 19 && !st.flags.hushArrived) await G.story.hushwellArrive(S); },
    objects: [].concat(G.travel.boatObjects('hushwell', 20, 44)),
  });
  G.travel.place('hushwell', { name: 'Hushwell Sanctuary', layer: 'The Lantern Isles', level: '15-18', map: 'hushwell', x: 20, y: 39, dir: 'up' });
  G.data.maps.hushwell.interact.push(G.travel.boatInteract('hushwell', 20, 44));
})();
