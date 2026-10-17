/* =========================================================================
   scene-title.js — the title screen: the logo over a slow Mode 7 drift
   across the night sea of clouds, islands on the horizon, a ferry passing,
   and "Tap to Start".
   ========================================================================= */
(function () {
  'use strict';

  // the key emblem above the logo, hand-pixelled
  const KEY = [
    '......kkkkk......',
    '....kkyyyyykk....',
    '...kyyGGGGGyyk...',
    '..kyGGkkkkkGGyk..',
    '..kyGk.....kGyk..',
    '..kyGk.....kGyk..',
    '..kyGGkkkkkGGyk..',
    '...kyyGGGGGyyk...',
    '....kkyyGyykk....',
    '.......kGk.......',
    '.......kGk.......',
    '.......kGkkkk....',
    '.......kGyyyk....',
    '.......kGkkkk....',
    '.......kGk.......',
    '.......kGkkk.....',
    '.......kGyyk.....',
    '.......kGkkk.....',
    '.......kcck......',
    '........kk.......'];
  let keyImg = null;
  const keySprite = () => keyImg || (keyImg = G.art.paint(G.art.grid(KEY), { k: '#2a1a08', y: '#ffe08a', G: '#d9a441', c: '#6ff3ff' }));

  const title = {
    t: 0,
    renderBg(ctx) {
      const W = G.gfx.W, Hh = G.gfx.H, t = this.t;
      G.intro.drawWorld(ctx, W, Hh, t, { kind: 'night', travel: 200 + t * 0.012, turn: Math.sin(t / 9000) * 0.25, ribbons: 0.45 });
      const f = G.mode7.ferry();
      const fx = Math.round(((t * 0.014) % (W + 120)) - 60), fy = Math.round(Hh * 0.62 + Math.sin(t / 700) * 2);
      ctx.drawImage(f, fx, fy);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.6; ctx.drawImage(G.pix.glow('#6ff3ff', 10), fx + 24 - 10, fy + 25 - 10);
      ctx.drawImage(G.pix.glow('#ffb040', 7), fx + 3 - 7, fy + 14 - 7); ctx.drawImage(G.pix.glow('#ffb040', 7), fx + 38 - 7, fy + 14 - 7);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      // the key emblem, softly glowing
      const k = keySprite(), kx = Math.round(W / 2 - k.width / 2), ky = Math.round(Hh * 0.1);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + Math.sin(t / 600) * 0.15;
      ctx.drawImage(G.pix.glow('#6ff3ff', 22), W / 2 - 22, ky + 8 - 22);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(k, kx, ky);
    },
    enter(p) {
      this.t = p && p.keepTime ? this.t : 0;
      const L = document.getElementById('layer-screen');
      L.innerHTML = `
        <div class="title tap">
          <div class="logo">
            <div class="logo-small">Key of the</div>
            <div class="logo-big">Fading Current</div>
          </div>
          <div class="tap-start">Tap to Start</div>
          <div class="title-foot">A tale of Orrenth · v${G.VERSION}</div>
        </div>`;
      const go = () => {
        if (this.leaving) return;
        this.leaving = true;
        G.audio.unlock();
        G.audio.sfx('confirm');
        G.scenes.go('slots', {}, { fadeMs: 250 });
      };
      this.leaving = false;
      G.ui.onTap(L.querySelector('.title'), go);
      this.h = G.input.push((b) => { if (b === 'a') go(); return true; });
      G.audio.music('title');
    },
    exit() { G.input.pop(this.h); document.getElementById('layer-screen').innerHTML = ''; },
    update(dt) { this.t += dt; },
    render(ctx) { this.renderBg(ctx); },
  };
  G.scenes.register('title', title);
})();
