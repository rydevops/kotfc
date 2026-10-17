/* =========================================================================
   map-vault.js — the Records Vault beneath the Conservatory.
   A maze of shelves, night sentries, Odalys's file — and the Archive Golem
   guarding the back stair.
   ========================================================================= */
(function () {
  'use strict';
  G.register('maps', 'vault', {
    name: 'The Records Vault',
    interior: true,
    battleBg: 'vault',
    tiles: [
      'XXXXXXXXXXXXXXXXXXXXXXXX',
      'XkkkkkkXkkkkkkkkkXkk<kkX',
      'XnnndnnXnnnnnnnnnXnnnnnX',
      'XnnnnnnXnkkknkkknXnnnnnX',
      'XcnnnnnXnnnnnnnnnXnnnnnX',
      'XkknkkkXkkknkkkknXnnnnnX',
      'XnnnnnnnnnnnnnnnnnnnnnnX',
      'XnkkkkknkkkkknkkkkkkknnX',
      'XnnnnnknnnnnknnnnnnnknnX',
      'XkkknnknkkknknkkkknnknnX',
      'XnnnnnnnnknnnnnnknnnnnnX',
      'XnkkkkkkknkkkkknknkkkknX',
      'XnnnnnnnnnnnnnknnnknnnnX',
      'XkkkknkkkkkkknknkkknkkkX',
      'XnnnnnnnnnnnnnnnnnnnnnnX',
      'XnrrrrrrrrrrrrrrrrrrrrnX',
      'XnrnnnnnnnnnnnnnnnnnnrnX',
      'XnrnnnnnnnnnnnnnnnnnnrnX',
      'XkkcnnnnkkkkkkkknnnnckkX',
      'XXXXXXXXXXXnnXXXXXXXXXXX',
    ],
    env(st) {
      return { sky: 'none', ambient: st.step >= 8 ? 0.5 : 0.6, ambientColor: st.step >= 8 ? '#1a0408' : '#05030c', music: 'sneak', lights: true };
    },
    lights: [{ x: 20, y: 1, r: 36, color: '#9ab0ff', glow: 0.4 }, { x: 11, y: 6, r: 30, color: '#ffb050', glow: 0.3 }, { x: 4, y: 12, r: 26, color: '#ffb050', glow: 0.3 }],
    warps: [
      { x: 11, y: 19, to: 'conservatory', tx: 6, ty: 6, dir: 'down', cond: (st) => st.step < 8 },
      { x: 12, y: 19, to: 'conservatory', tx: 6, ty: 6, dir: 'down', cond: (st) => st.step < 8 },
    ],
    triggers: [
      { x: 11, y: 18, w: 2, h: 1, cond: (st) => st.step === 8, run: async (S) => {
        await S.narrate('Brass feet clatter beyond the door. The way you came in is crawling with sentries.');
        await S.say('pip', 'Back stair! Northeast corner! Go go go!');
        await S.move('player', 'U');
      } },
      { x: 18, y: 2, w: 5, h: 3, cond: (st) => st.step === 8, run: (S) => G.story.golem(S) },
    ],
    interact: [
      { x: 4, y: 2, run: (S, st) => (st.step === 7 ? G.story.records(S) : S.narrate('The F drawer hangs open. It is empty now.')) },
      { x: 20, y: 1, run: (S, st) => S.narrate(st.step >= 8 ? 'The back stair. Night air pours down it.' : 'A narrow back stair, curling up into darkness. A draft smells of rain and engine oil.') },
    ],
    chests: [
      { id: 'locket', x: 1, y: 2, item: 'emberLocket' },
      { id: 'feather', x: 16, y: 2, item: 'gullFeather' },
      { id: 'buns', x: 22, y: 8, item: 'honeyBun', qty: 2 },
      { id: 'tonic', x: 22, y: 12, item: 'sparkTonic' },
      { id: 'gold', x: 1, y: 16, gold: 150 },
    ],
    encounters: {
      where: 'all', rate: 0.06, bg: 'vault',
      troops: [{ mobs: ['brassSentry'], w: 3 }, { mobs: ['inkSentinel'], w: 2 }, { mobs: ['brassSentry', 'lanternMite'], w: 2 }, { mobs: ['lanternMite', 'lanternMite'], w: 2 }],
    },
    onEnter: async (S, st) => {
      if (st.step === 7 && !st.flags.vaultIn) {
        S.flag('vaultIn');
        await S.say('pip', 'Miles of shelves. Okay. Odalys would be filed under F. Probably. Unless they filed her under "Problem".');
        await S.say('wren', 'Archive records are in the northwest corner. Stay close — the sentries patrol in here too.');
      }
    },
  });

  G.register('looks', 'golemNpc', {
    custom: () => { const c = G.sprites.mob(G.data.mobs.archiveGolem); const a = [c, c, c, c]; return { down: a, up: a, left: a, right: a }; },
  });
})();
