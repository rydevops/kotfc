/* =========================================================================
   map-ferry.js — the sky ferry deck. Used for the opening, the crossing
   to the Conservatory, and the night escape at the end of Act I.
   ========================================================================= */
(function () {
  'use strict';

  function drawSail(ctx, x, y, t) {
    const sway = Math.sin(t / 900) * 2;
    ctx.fillStyle = '#3a2414'; ctx.fillRect(x + 7, y - 46, 2, 48);
    ctx.fillStyle = '#6a4424'; ctx.fillRect(x - 6, y - 40, 28, 2);
    // billowing sail
    for (let i = 0; i < 26; i++) {
      const bulge = Math.round(Math.sin((i / 26) * Math.PI) * (4 + sway));
      ctx.fillStyle = i % 6 === 0 ? '#d8ccb4' : '#f2e8d4';
      ctx.fillRect(x - 5 + bulge, y - 38 + i, 26, 1);
    }
    ctx.fillStyle = '#c04040'; ctx.fillRect(x + 9, y - 52, 8 + Math.round(Math.sin(t / 200) * 2), 3);
    // the ferry lantern
    ctx.fillStyle = '#2a2230'; ctx.fillRect(x + 4, y - 30, 3, 4);
    ctx.fillStyle = '#ffd060'; ctx.fillRect(x + 4, y - 26, 3, 3);
  }
  function drawHull(ctx, x, y) {
    for (let i = 0; i < 18; i++) {
      const inset = Math.round(Math.pow(i / 18, 1.6) * 60);
      ctx.fillStyle = i % 5 === 0 ? '#3a2214' : i < 3 ? '#7a4a24' : '#5a3418';
      ctx.fillRect(x + inset, y + i, 208 - inset * 2, 1);
    }
    ctx.fillStyle = '#d9a441'; ctx.fillRect(x + 20, y + 4, 168, 1);
    ctx.fillStyle = '#6ff3ff'; ctx.fillRect(x + 100, y + 16, 8, 3);
  }

  G.register('maps', 'ferry', {
    name: 'The Sky Ferry',
    noCliffs: true,
    tiles: [
      '             ',
      '             ',
      '   qqqqqqq   ',
      '  q_______q  ',
      '  q_x_M_b_q  ',
      '  q_______q  ',
      '  q_______q  ',
      '  q_b_____q  ',
      '  q_____x_q  ',
      '   qqqqqqq   ',
      '             ',
      '             ',
    ],
    env(st) {
      const night = st.step >= 4;
      return {
        sky: night ? 'night' : 'dusk', ambient: night ? 0.45 : 0.18, ambientColor: '#0a0c26',
        music: st.step >= 9 ? 'actEnd' : 'ferry', travel: 0.03, weather: night ? 'motes' : 'embers',
      };
    },
    lights: [{ x: 6, y: 2, r: 40, color: '#ffc060', glow: 0.5 }, { x: 6, y: 8, r: 30, color: '#ffc060', glow: 0.4 }],
    objects: [
      { x: 0, y: 9, draw: (ctx, x, y) => drawHull(ctx, x, y + 14) },
      { x: 6, y: 4, over: true, draw: (ctx, x, y, t) => drawSail(ctx, x, y, t) },
    ],
    npcs: [
      { id: 'fennick', look: 'fennick', x: 6, y: 8, dir: 'up', cond: (st) => st.step < 9,
        talk: async (S) => S.say('fennick', S.step() === 0 ? 'Nearly there, Miss Wren!' : 'Steady as she goes. The wind has been thin up here lately.') },
    ],
    interact: [
      { x: 6, y: 8, cond: (st) => st.step >= 10, run: async (S) => S.narrate('The skiff drifts on, down toward the Drift\'s mist. (Act II: The Hunt is coming soon!)') },
    ],
    onEnter: async (S, st) => {
      if (st.step === 0) return G.story.ferryOpening(S);
      if (st.step >= 10) G.ui.toast('Act I complete! Act II is on its way.');
    },
  });
})();
