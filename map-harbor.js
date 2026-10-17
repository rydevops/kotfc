/* =========================================================================
   map-harbor.js — Pennywhistle Harbor (Act I, levels 1-3).
   Warm and lantern-lit until the tap-station fails (story step 2),
   then blue-grey, sinking, and leaking rift spawn.
   ========================================================================= */
(function () {
  'use strict';
  const dark = (st) => st.step >= 2;

  function drawStation(ctx, x, y, t, w) {
    const broken = w.st.flags.stationBroken;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 2, y + 44, 44, 4);
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x + 2, y + 36, 44, 10);
    ctx.fillStyle = '#7a6a5a'; ctx.fillRect(x + 2, y + 36, 44, 2);
    // pipes
    ctx.fillStyle = '#6a4a22'; ctx.fillRect(x - 4, y + 22, 13, 5); ctx.fillRect(x + 39, y + 16, 13, 5); ctx.fillRect(x - 4, y + 22, 4, 22); ctx.fillRect(x + 48, y + 16, 4, 28);
    ctx.fillStyle = '#a07a3a'; ctx.fillRect(x - 4, y + 22, 13, 1); ctx.fillRect(x + 39, y + 16, 13, 1);
    // housing
    ctx.fillStyle = '#4a2e0e'; ctx.fillRect(x + 7, y + 4, 34, 36);
    ctx.fillStyle = '#b8862e'; ctx.fillRect(x + 8, y + 5, 32, 34);
    ctx.fillStyle = '#e0b050'; ctx.fillRect(x + 8, y + 5, 32, 2); ctx.fillRect(x + 8, y + 5, 2, 34);
    ctx.fillStyle = '#8a5e1e'; ctx.fillRect(x + 38, y + 5, 2, 34);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#f0d070'; ctx.fillRect(x + 11, y + 10 + i * 8, 1, 1); ctx.fillRect(x + 36, y + 10 + i * 8, 1, 1); }
    // dome
    ctx.fillStyle = '#8a5a1e'; ctx.fillRect(x + 11, y, 26, 5); ctx.fillRect(x + 16, y - 3, 16, 3);
    ctx.fillStyle = '#d9a441'; ctx.fillRect(x + 22, y - 6, 4, 3);
    // crystal chamber
    ctx.fillStyle = '#1a1226'; ctx.fillRect(x + 15, y + 10, 18, 22);
    if (!broken) {
      const p = 0.6 + 0.4 * Math.sin(t / 300);
      ctx.fillStyle = '#1a5a8a'; ctx.fillRect(x + 16, y + 11, 16, 20);
      ctx.globalAlpha = p; ctx.fillStyle = '#6ff3ff'; ctx.fillRect(x + 19, y + 13, 10, 16);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 22, y + 16 + Math.round(Math.sin(t / 200) * 3), 4, 6); ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#2a0e1a'; ctx.fillRect(x + 16, y + 11, 16, 20);
      if (Math.sin(t / 90) > 0.6) { ctx.fillStyle = '#c03040'; ctx.fillRect(x + 20, y + 18, 6, 4); }
      ctx.fillStyle = '#6a6a7a'; ctx.fillRect(x + 17, y + 14, 1, 6); ctx.fillRect(x + 18, y + 19, 4, 1); ctx.fillRect(x + 25, y + 12, 1, 10); ctx.fillRect(x + 26, y + 22, 4, 1);
    }
    // gauge
    ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x + 20, y + 33, 8, 4);
    ctx.fillStyle = '#c02020'; ctx.fillRect(x + (broken ? 21 : 26), y + 34, 1, 2);
  }

  function drawFerryBoat(ctx, x, y, t) {
    const bob = Math.round(Math.sin(t / 700) * 1.5);
    y += bob;
    for (let i = 0; i < 16; i++) {
      const inset = Math.round(Math.pow(i / 16, 1.5) * 26);
      ctx.fillStyle = i === 0 ? '#a8743e' : i % 5 === 0 ? '#3a2214' : '#5a3418';
      ctx.fillRect(x + inset, y + 8 + i, 80 - inset * 2, 1);
    }
    ctx.fillStyle = '#9a6a38'; ctx.fillRect(x + 2, y + 4, 76, 5);
    ctx.fillStyle = '#d9a441'; ctx.fillRect(x + 2, y + 4, 76, 1);
    ctx.fillStyle = '#3a2414'; ctx.fillRect(x + 39, y - 30, 2, 34);
    for (let i = 0; i < 20; i++) { const b = Math.round(Math.sin(i / 20 * Math.PI) * 3); ctx.fillStyle = '#f2e8d4'; ctx.fillRect(x + 42 + b, y - 28 + i, 18, 1); }
    ctx.fillStyle = '#ffd060'; ctx.fillRect(x + 6, y - 2, 3, 3);
  }

  const say = (S, who, lines) => lines.reduce((p, l) => p.then(() => S.say(who, l)), Promise.resolve());

  G.register('maps', 'harbor', {
    name: 'Pennywhistle Harbor',
    battleBg: 'harborDark',
    tiles: [
      '                                ',
      '            ........            ',
      '         ..===========.         ',
      '       .T..L===QQQ===L.T.       ',
      '      .....====QQQ====....      ',
      '     ......=u==QQQ==u=.....     ',
      '    ..T....===========...T..    ',
      '   ........L=========L.......   ',
      '   .^^^^^^^...=====..^^^^^^^^   ',
      '   .^^^^^^^..L=====L.^^^^^^^^   ',
      '  ..#w#D#w#...=====..#w#Dw#w#   ',
      '   T.ss.......=====.........T   ',
      '  %....%..%..L=====L..%......   ',
      '   .=========================   ',
      '   .=L=====================L=   ',
      '  .^^^^^^^....=====...^^^^^^^%  ',
      '  %^^^^^^^...L=====L..^^^^^^^.  ',
      '   #ww#D#w....=====...#w#D#w#   ',
      '   Thhhhh.T...=====..s.....s.   ',
      '   ,,,,,,,,T..=====.T,,,,,,,,T  ',
      '   ,,%,,,,,...=====..,,%,,,,,   ',
      '   ,,,,,,,,..L=====L.,,,,,,,,   ',
      '   ,,,,,%,,T..=====.T,,,,,%,,   ',
      '   ,,,,,,,,...=====..,,,,,,,,   ',
      '    ,,,,,,....=====.x.,,,,,     ',
      '       ......L=====L.b...       ',
      '         ..bx.=====.x..         ',
      '           .xb_____x.           ',
      '             q_____q            ',
      '             q_____q            ',
      '             q_____q            ',
      '             q_____q            ',
      '             q_____q            ',
      '                                ',
      '                                ',
      '                                ',
    ],
    env(st) {
      if (!dark(st)) return { sky: 'dusk', ambient: 0.46, ambientColor: '#1c0c34', music: 'harbor', lights: true, weather: 'embers' };
      return { sky: 'dark', ambient: 0.66, ambientColor: '#08102a', music: 'harborDark', lights: false, sink: -160, weather: 'ash' };
    },
    lights: [{ x: 16, y: 4, r: 54, color: '#6ff3ff', glow: 0.6 }],
    objects: [
      { x: 15, y: 3, draw: drawStation },
      { x: 12, y: 32, draw: (ctx, x, y, t) => drawFerryBoat(ctx, x + 32, y + 22, t) },
    ],
    chests: [
      { id: 'gardenW', x: 3, y: 23, item: 'sparkTonic' },
      { id: 'gardenE', x: 28, y: 23, item: 'luckyButton' },
    ],
    encounters: {
      cond: (st) => st.step >= 3, where: 'all', rate: 0.035, grassRate: 0.12, bg: 'harborDark',
      troops: [
        { mobs: ['riftWisp'], w: 3 }, { mobs: ['riftWisp', 'riftWisp'], w: 3 },
        { mobs: ['seamCrawler'], w: 2 }, { mobs: ['riftWisp', 'seamCrawler'], w: 2 }, { mobs: ['stormmoth', 'stormmoth'], w: 2 },
      ],
    },
    triggers: [
      { x: 14, y: 26, w: 5, h: 1, cond: (st) => st.step === 3, run: (S) => G.story.pipMeets(S) },
    ],
    interact: [
      { x: 16, y: 5, cond: (st) => st.step >= 2, run: (S) => S.narrate('The crystal chamber is cracked. Something deep inside still hums — wrong, like a held breath.') },
      { x: 15, y: 5, run: (S) => S.narrate('PENNYWHISTLE TAP-STATION. Draws the Current for 214 households, 9 ovens and 1 very old ferry.') },
      { x: 17, y: 5, run: (S) => S.narrate('A brass plaque: "Built in the Founders\' Age. Do not open. Do not lick."') },
      { x: 5, y: 11, run: (S) => S.narrate('Baskets of bread, wrapped in cloth against the evening chill.') },
    ],
    npcs: [
      // --- before the failure ---
      { id: 'isolde', look: 'isolde', x: 16, y: 6, dir: 'down', cond: (st) => st.step < 2, talk: (S) => G.story.deliverCrate(S) },
      { id: 'tilda', look: 'tilda', x: 7, y: 11, dir: 'down', talk: async (S, n, st) => {
        if (!st.flags.tildaBread) return G.story.tildaFirst(S);
        if (dark(st)) await S.say('tilda', 'The ovens went cold the moment the lights went out. I\'m baking on a candle and spite. Need anything?');
        await S.shop('harborBakery');
      } },
      { id: 'innkeep', look: 'innkeep', x: 25, y: 11, dir: 'down', talk: async (S, n, st) => {
        if (dark(st)) await S.say({ name: 'Marta', look: 'innkeep' }, 'We\'ve still got beds and blankets, even if we\'ve no light. Isolde\'s resting upstairs.');
        await S.inn('harborInn');
      } },
      { id: 'grocer', look: 'grocer', x: 24, y: 18, dir: 'down', talk: (S) => S.shop('harborStore') },
      { id: 'lighter', look: 'lighter', x: 12, y: 8, dir: 'down', wander: 2, talk: (S, n, st) => S.say({ name: 'Lantern-lighter', look: 'lighter' },
        dark(st) ? 'I\'ve lit every wick I own. They won\'t take. It isn\'t the oil, Wren. It\'s the Current. It\'s just... gone.'
          : 'Third time this week I\'ve relit Old Maud\'s lantern. They just gutter out. Like they\'re tired.') },
      { id: 'kid', look: 'kid', x: 9, y: 13, dir: 'down', wander: 3, talk: (S, n, st) => S.say({ name: 'Nettle', look: 'kid' },
        dark(st) ? 'Mum says the island isn\'t sinking. Then why is the mist closer? Why is it CLOSER, Wren?'
          : 'Wanna know a secret? If you lean over the edge you can see the mist moving down there. Mum says don\'t.') },
      { id: 'granny', look: 'granny', x: 21, y: 12, dir: 'left', talk: (S, n, st) => S.say({ name: 'Old Maud', look: 'granny' },
        dark(st) ? 'Eighty-one years on this island, and the lanterns have never gone out. Not once. Not once, dear.'
          : 'The Archmage visited once, when I was a girl. Kindest eyes I ever saw. And you\'re his ward! Lucky, lucky girl.') },
      { id: 'fisher', look: 'fisher', x: 18, y: 29, dir: 'left', talk: (S, n, st) => S.say({ name: 'Cloud-fisher', look: 'fisher' },
        dark(st) ? 'Never seen the Drift this close. Can practically smell the wrecks down there.'
          : 'Hauled up nothing but fog today. The sky-fish are swimming lower. Everything\'s lower, lately.') },
      { id: 'dockhand', look: 'dockhand', x: 20, y: 25, dir: 'down', cond: (st) => st.step < 2, talk: (S) => S.say({ name: 'Dockhand', look: 'dockhand' }, 'Station\'s up top, past the bakery. Can\'t miss it — it\'s the big humming thing.') },
      // --- after the failure ---
      { id: 'isoldeHurt', look: 'isolde', x: 23, y: 11, dir: 'down', cond: (st) => st.step >= 3, talk: async (S) => {
        await S.say('isolde', 'Ribs\'ll mend. Harbor might not.');
        await S.say('isolde', 'Go home if you must, girl. But keep your eyes open. And remember what I told you.');
      } },
      { id: 'fennick', look: 'fennick', x: 16, y: 32, dir: 'up', talk: async (S, n, st) => {
        if (st.step <= 1) return S.say('fennick', 'I\'ll wait right here, Miss Wren. Go do your errand — that crate won\'t deliver itself.');
        if (st.step === 3) return S.say('fennick', 'Whatever happened up there, I\'m taking you home. Just give me the word.');
        return G.story.fennickDepart(S);
      } },
    ],
    onEnter: async (S, st) => {
      if (st.step === 1 && !st.flags.harborArrived) {
        S.flag('harborArrived');
        await S.wait(300);
        await S.say('wren', 'Pennywhistle Harbor. Bread ovens, paper lanterns and the best view in Orrenth.');
        await S.say('fennick', 'I\'ll be right here when you\'re done. Station\'s at the top of the hill — just follow the lanterns.');
      }
    },
  });

  G.register('looks', 'tapguard', {
    custom: () => { const c = G.sprites.mob(G.data.mobs.tapGuardian); const a = [c, c, c, c]; return { down: a, up: a, left: a, right: a }; },
  });
  G._say = say;
})();
