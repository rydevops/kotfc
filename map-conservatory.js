/* =========================================================================
   map-conservatory.js — the Astral Conservatory (Act I, levels 3-6).
   A ring of tower-islands joined by bridges of woven Current that flicker
   a little more every time Wren crosses them.
   ========================================================================= */
(function () {
  'use strict';
  const day = (st) => st.step <= 5;
  const night = (st) => st.step >= 6;

  G.register('maps', 'conservatory', {
    name: 'The Astral Conservatory',
    battleBg: 'conservatory',
    tiles: [
      '                RRRRRRRRR               ',
      '               oRRRRRRRRRo              ',
      '               ovvvvvvvvvo              ',
      '    RRRRR      ovvWvvvWvvo              ',
      '   vvvvvvv    oovvvvKvvvvoo             ',
      '   vvvKvvv    oooooogoooooo             ',
      '   ooooooo    oooLoogooLooo             ',
      '   okoookoBBBBoooooogoooooo             ',
      '   ooooooo    oPoooogooooPo             ',
      '   ocooooo    oooooogoooooo             ',
      '   ooooooo          B                   ',
      '                    B                   ',
      '                    B                   ',
      '                    B                   ',
      '               ooooooooooo              ',
      ' RRRRRR      ooLuooooooouLoo      RRRRRR',
      ' RRRRRR     oPoooooooooooooPo     RRRRRR',
      ' WvKvWv    ooooorrrrrrrrrooooo    vWKvWv',
      ' oooooo    ooooorooooooorooooo    oooooo',
      ' oooooo    ooooorogggggorooooo    oooooo',
      ' ooooooBBBBoLoooroggGggoroooLoBBBBoooooo',
      ' sooooo    ooooorogggggorooooo    oooooo',
      ' oooooo    ooooorooooooorooooo    oooook',
      ' oooooo    ooooorrrrrrrrrooooo    oooook',
      ' cooook    ooooooooooooooooooo    uooooo',
      ' oooooo    ooPoooooooooooooPoo    oooooo',
      '            oooLuooooooouLooo           ',
      '              ooooooooooooo             ',
      '                    B                   ',
      '                    B                   ',
      '                    B                   ',
      '                 ooogooo                ',
      '               ooLoogooLoo              ',
      '               ooooogooooo              ',
      '               ooooogooooo              ',
      '               oxooogooobo              ',
      '               ooooogooooo              ',
      '                 ooooooo                ',
      '                  q___q                 ',
      '                  q___q                 ',
      '                  q___q                 ',
      '                                        ',
    ],
    env(st) {
      if (day(st)) return { sky: 'night', ambient: 0.3, ambientColor: '#0a0e2a', music: 'conservatory', lights: true, weather: 'motes', ribbons: 0.25 };
      return { sky: 'night', ambient: 0.64, ambientColor: '#03051a', music: 'sneak', lights: true, weather: 'motes', bridgeFlicker: 0.25 };
    },
    warps: [
      { x: 20, y: 4, to: 'study', tx: 7, ty: 9, dir: 'up' },
      { x: 6, y: 5, to: 'vault', tx: 11, ty: 18, dir: 'up', cond: (st) => st.flags.vaultOpen && st.step < 9 },
    ],
    interact: [
      { x: 6, y: 5, bump: true, cond: (st) => !st.flags.vaultOpen, run: (S) => S.narrate('THE RECORDS VAULT. Sealed. The lock hums with Current and does not care how politely you ask.') },
      { x: 3, y: 17, bump: true, run: async (S, st) => {
        if (st.step >= 8) return S.narrate('Sentries are already searching the dormitories. It would be foolish to go back there tonight.');
        await S.inn('dormBed');
      } },
      { x: 36, y: 17, bump: true, run: (S) => S.narrate('The lecture hall is locked. Through the keyhole: rows of empty desks and a chalkboard that reads "RESONANCE IS LISTENING."') },
      { x: 20, y: 20, run: (S, st) => S.narrate(day(st) ? 'The star globe. It used to spin on its own. Now it wobbles, as if it has forgotten how.' : 'The star globe has stopped turning altogether.') },
      { x: 4, y: 7, run: (S) => S.narrate('"Records Vault: Authorized Archivists Only." Someone has scratched underneath: "...and Cassian."') },
    ],
    chests: [
      { id: 'eastNook', x: 39, y: 18, item: 'lanternOil', qty: 2 },
      { id: 'westNook', x: 1, y: 25, item: 'honeyBun', qty: 2 },
      { id: 'towerGold', x: 26, y: 9, gold: 120 },
    ],
    encounters: {
      cond: (st) => night(st) && st.step < 9, where: 'all', rate: 0.045, bg: 'conservatory',
      troops: [{ mobs: ['brassSentry'], w: 3 }, { mobs: ['lanternMite', 'lanternMite'], w: 2 }, { mobs: ['brassSentry', 'lanternMite'], w: 2 }],
    },
    triggers: [
      { x: 13, y: 6, w: 2, h: 3, cond: (st) => st.step === 7, once: 'cassianVault', run: (S) => G.story.cassianVault(S) },
    ],
    npcs: [
      { id: 'quartermaster', look: 'quartermaster', x: 2, y: 21, dir: 'down', talk: async (S, n, st) => {
        if (night(st)) await S.say({ name: 'Quartermaster Bell', look: 'quartermaster' }, 'The stores are closed—oh. It\'s you. Quick, then, before a sentry sees you.');
        await S.shop('quartermaster');
      } },
      // daytime
      { id: 'cassian', look: 'cassian', x: 18, y: 24, dir: 'down', cond: day, talk: (S) => G.story.cassianDay(S) },
      { id: 'idris', look: 'idris', x: 36, y: 20, dir: 'left', cond: day, talk: async (S) => {
        await S.say('idris', 'Ashgrove. I suppose you\'ll be the one telling the Archmage about the harbor.');
        await S.say('wren', 'That\'s the plan.');
        await S.say('idris', 'Then don\'t waste his time with hysterics. Stations fail. He will fix it. He always does.');
      } },
      { id: 'neve', look: 'neve', x: 38, y: 22, dir: 'left', cond: day, talk: async (S) => {
        await S.say('neve', 'The bridges flicker more every week. Have you noticed? Nobody wants to say it out loud.');
        await S.emote('neve', '...');
        await S.say('neve', 'Be careful what you ask him, Wren.');
      } },
      { id: 'scholar', look: 'scholar', x: 35, y: 24, dir: 'up', cond: day, talk: (S) => S.say({ name: 'Professor Halloway', look: 'scholar' },
        'Resonance, young lady, is not about power. It is about *listening*. The "RES" on your exam sheets measures it: the deeper it runs, the stronger your spells and the less a Surge can hurt you.') },
      { id: 's1', look: 'student1', x: 14, y: 22, dir: 'down', wander: 2, cond: day, talk: (S) => S.say({ name: 'Student', look: 'student1' }, 'Did you hear? Professor Halloway\'s lamp went out in the middle of his lecture. TWICE. He blamed the weather.') },
      { id: 's2', look: 'student2', x: 25, y: 18, dir: 'left', cond: day, talk: (S) => S.say({ name: 'Student', look: 'student2' }, 'The north bridge went see-through for a second this morning. I\'m taking the long way around from now on.') },
      { id: 's3', look: 'student1', x: 22, y: 34, dir: 'down', cond: day, talk: (S) => S.say({ name: 'Ferry clerk', look: 'student1' }, 'That was the last ferry of the night. You\'re lucky. They\'ve canceled half the routes this week.') },
    ],
    onEnter: async (S, st) => {
      if (st.step === 5 && !st.flags.consArrived) {
        S.flag('consArrived');
        await S.wait(300);
        await S.say('pip', 'Whoa. The bridges are *woven* out of actual Current! Odalys used to talk about this place like it was a cathedral.');
        await S.say('wren', 'They used to be as solid as stone. Now look at them. They flicker.');
        await S.say('wren', 'Aldrith\'s tower is across the north bridge. Come on.');
        S.objective('Report to Aldrith in his tower, across the north bridge.');
      }
    },
  });
})();
