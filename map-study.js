/* =========================================================================
   map-study.js — Archmage Aldrith's private study.
   ========================================================================= */
(function () {
  'use strict';
  G.register('maps', 'study', {
    name: "Aldrith's Study",
    interior: true,
    tiles: [
      'XXXXXXXXXXXXXXX',
      'XkkkkkcXckkkkGX',
      'XnnnnnnnnnnnnnX',
      'XnnrrrrrrrrrnnX',
      'XcnrnnndnnnrnnX',
      'XnnrnnnnnnnrnnX',
      'XnnrnnmmmnnrnnX',
      'XnnrnnnnnnnrnnX',
      'XnnrrrrrrrrrnnX',
      'XkknnnnnnnnnkkX',
      'XXXXXXnnnXXXXXX',
    ],
    env(st) {
      if (st.step <= 5) return { sky: 'none', ambient: 0.35, ambientColor: '#140818', music: 'aldrith', lights: true };
      return { sky: 'none', ambient: 0.72, ambientColor: '#04030c', music: 'sneak', lights: true };
    },
    warps: [
      { x: 6, y: 10, to: 'conservatory', tx: 20, ty: 5, dir: 'down' },
      { x: 7, y: 10, to: 'conservatory', tx: 20, ty: 5, dir: 'down' },
      { x: 8, y: 10, to: 'conservatory', tx: 20, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: 'aldrith', look: 'aldrith', x: 7, y: 3, dir: 'down', cond: (st) => st.step === 5, talk: async (S) => {
        await S.say('aldrith', 'Rest, Wren. Tomorrow will look kinder. It always does.');
      } },
    ],
    interact: [
      { x: 6, y: 6, run: (S, st) => G.story.mapTable(S, st) },
      { x: 7, y: 6, run: (S, st) => G.story.mapTable(S, st) },
      { x: 8, y: 6, run: (S, st) => G.story.mapTable(S, st) },
      { x: 7, y: 4, cond: (st) => st.step >= 6, run: async (S, st) => {
        await S.narrate('A letter lies on the desk, half-written. The ink is still wet.');
        await S.narrate('"...the girl is nearly ready. The key has begun to wake. It will not be long now."');
        if (!st.flags.readLetter) { S.flag('readLetter'); await S.say('wren', '"The girl." ...He means someone else. He has to mean someone else.'); }
      } },
      { x: 13, y: 1, run: (S) => S.narrate('A star globe. Tiny brass islands orbit a glowing core. One of them — Pennywhistle — has slipped off its wire.') },
      { x: 2, y: 1, run: (S) => S.narrate('"Tap-Station Engineering, Vol. IV". "The Founders: A Lost People". "On the Ascension of Mortal Minds". Well-thumbed, all of them.') },
    ],
    onEnter: async (S, st) => {
      if (st.step === 5 && !st.flags.metAldrith) return G.story.aldrithLie(S);
      if (st.step === 6 && !st.flags.studyNight) {
        S.flag('studyNight');
        await S.say('pip', 'Empty. Where does an Archmage even go at midnight?');
        await S.say('wren', 'The observatory, usually. He says the stars are better company than people.');
        await S.say('wren', 'The map table. Quickly.');
      }
    },
  });
})();
