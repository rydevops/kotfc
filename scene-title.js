/* =========================================================================
   scene-title.js — title screen: drifting islands, the Current, the logo
   and "Tap to Start".
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const ISLES = [
    { fx: 0.12, fy: 0.62, w: 54, seed: 101, houses: 2, lanterns: 2, sp: 0.6 },
    { fx: 0.82, fy: 0.55, w: 70, seed: 102, houses: 3, lanterns: 2, sp: 0.4 },
    { fx: 0.5, fy: 0.78, w: 90, seed: 103, houses: 4, lanterns: 3, sp: 0.25 },
    { fx: 0.32, fy: 0.42, w: 34, seed: 104, tower: true, sp: 0.8 },
  ];

  const title = {
    t: 0,
    renderBg(ctx) {
      const W = G.gfx.W, H = G.gfx.H, t = this.t;
      G.sky.draw(ctx, 'night', t * 0.01, 0, t);
      G.sky.ribbons(ctx, t, 0.55, 0.5);
      const glows = [];
      ISLES.forEach((s, n) => {
        const isl = G.sky.island(s.seed, s.w, { houses: s.houses, lanterns: s.lanterns, tower: s.tower });
        const x = Math.round(s.fx * W - s.w / 2 + Math.sin(t / 4000 + n) * 6 * s.sp);
        const y = Math.round(s.fy * H + Math.sin(t / 1800 + n * 2) * 4 * s.sp);
        ctx.drawImage(isl.c, x, y);
        isl.lights.forEach((L) => glows.push({ x: x + L.x, y: y + L.y }));
      });
      ctx.globalCompositeOperation = 'lighter';
      for (const g of glows) {
        const fl = 11 + Math.sin(t / 150 + g.x) * 0.6;
        const gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, fl);
        gr.addColorStop(0, 'rgba(255,190,90,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.fillRect(g.x - fl, g.y - fl, fl * 2, fl * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      // a ferry drifting by
      const fx = ((t * 0.012) % (W + 80)) - 40;
      G.drawFerrySmall(ctx, Math.round(fx), Math.round(H * 0.5 + Math.sin(t / 600) * 2));
    },
    enter(p) {
      this.t = p && p.keepTime ? this.t : 0;
      const L = document.getElementById('layer-screen');
      L.innerHTML = `
        <div class="title tap">
          <div class="logo">
            <div class="logo-small">Key of the</div>
            <div class="logo-big">Fading<br>Current</div>
            <div class="logo-key">⚷</div>
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
      L.querySelector('.title').addEventListener('click', go);
      this.h = G.input.push((b) => { if (b === 'a') go(); return true; });
      G.audio.music('title');
    },
    exit() { G.input.pop(this.h); document.getElementById('layer-screen').innerHTML = ''; },
    update(dt) { this.t += dt; },
    render(ctx) { this.renderBg(ctx); },
  };
  G.scenes.register('title', title);
})();
