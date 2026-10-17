/* =========================================================================
   scene-intro.js — the opening cutscene.
   Five painted panels with captions: the world, the Current, the fading,
   the child in the light, and Wren. Tap "Skip" to jump to the title.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;

  const PANELS = [
    { dur: 7000, text: 'This is Orrenth — a world of islands, held aloft by the Current.' },
    { dur: 7000, text: 'We learned to harness it. Lanterns. Bridges. Ferries across the sky.' },
    { dur: 7500, text: 'But the Current is fading. Lantern by lantern, island by island, the world is sinking toward the deep.' },
    { dur: 7500, text: 'Nineteen years ago, a child was found alone, wrapped in a field of light. Around her neck: a plain brass pendant.' },
    { dur: 6500, text: 'She doesn\'t know what she is.\nNot yet.' },
  ];
  const ISLES = [
    { fx: 0.18, fy: 0.42, w: 64, seed: 11, houses: 3, lanterns: 2 },
    { fx: 0.72, fy: 0.30, w: 80, seed: 22, houses: 4, lanterns: 3 },
    { fx: 0.55, fy: 0.62, w: 56, seed: 33, houses: 2, lanterns: 2 },
    { fx: 0.92, fy: 0.70, w: 44, seed: 44, houses: 1, lanterns: 1 },
    { fx: 0.05, fy: 0.75, w: 40, seed: 55, houses: 1, lanterns: 1 },
    { fx: 0.40, fy: 0.20, w: 36, seed: 66, tower: true },
  ];

  G.scenes.register('intro', {
    t: 0, idx: -1,
    enter() {
      this.t = 0; this.idx = -1; this.done = false;
      const L = document.getElementById('layer-screen');
      L.innerHTML = `<div class="intro"><div class="caption"></div><button class="skip tap">Skip ▸</button></div>`;
      L.querySelector('.skip').addEventListener('click', (e) => { e.stopPropagation(); this.finish(); });
      this.h = G.input.push((b) => { if (b === 'b' || b === 'menu') this.finish(); return true; });
      G.audio.music('intro');
    },
    exit() { G.input.pop(this.h); document.getElementById('layer-screen').innerHTML = ''; },
    finish() {
      if (this.done) return;
      this.done = true;
      G.gfx.flash('#ffffff', 600);
      G.scenes.go('title', { fromIntro: true }, { fadeMs: 500 });
    },
    update(dt) {
      this.t += dt;
      let acc = 0, idx = PANELS.length;
      for (let i = 0; i < PANELS.length; i++) { if (this.t < acc + PANELS[i].dur) { idx = i; break; } acc += PANELS[i].dur; }
      this.local = this.t - acc;
      if (idx >= PANELS.length) return this.finish();
      if (idx !== this.idx) {
        this.idx = idx;
        const cap = document.querySelector('.intro .caption');
        if (cap) {
          cap.classList.remove('show');
          setTimeout(() => { cap.innerHTML = U.esc(PANELS[idx].text).replace('\n', '<br>'); cap.classList.add('show'); }, 450);
        }
        if (idx === 2) G.audio.sfx('fizzle');
        if (idx === 3) G.audio.sfx('pendant');
      }
    },
    render(ctx) {
      const W = G.gfx.W, H = G.gfx.H, t = this.t, i = this.idx, lt = this.local || 0;
      const p = PANELS[Math.max(0, i)];
      const k = lt / p.dur;
      if (i <= 2) {
        const sky = i === 2 ? (k > 0.5 ? 'dark' : 'night') : i === 1 ? 'night' : 'dusk';
        const pan = (i * 7000 + lt) * 0.004;
        G.sky.draw(ctx, sky, pan * 3, 0, t, { sink: i === 2 ? -lt * 0.01 : 0 });
        if (i === 1) G.sky.ribbons(ctx, t, Math.min(1, k * 2), 0.35);
        // islands with lanterns
        const glows = [];
        ISLES.forEach((s, n) => {
          const isl = G.sky.island(s.seed, s.w, { houses: s.houses, lanterns: s.lanterns, tower: s.tower });
          const sink = i === 2 ? Math.max(0, lt - n * 400) * 0.006 : 0;
          const x = Math.round(s.fx * W - s.w / 2 - pan * (0.5 + n * 0.1));
          const y = Math.round(s.fy * H + Math.sin(t / 1500 + n) * 3 + sink);
          ctx.drawImage(isl.c, x, y);
          isl.lights.forEach((L, j) => {
            const off = i === 2 && lt > 1200 + (n * 3 + j) * 420;
            if (!off) glows.push({ x: x + L.x, y: y + L.y });
          });
          // glowing bridges between islands in panel 2
          if (i === 1 && n < 3) {
            const nx = ISLES[n + 1];
            ctx.globalAlpha = 0.6 * Math.min(1, k * 2);
            ctx.strokeStyle = '#6ff3ff'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + s.w * 0.8, y + isl.top);
            const x2 = Math.round(nx.fx * W - pan * (0.5 + (n + 1) * 0.1)), y2 = Math.round(nx.fy * H + 22);
            ctx.quadraticCurveTo((x + x2) / 2, (y + y2) / 2 + 20, x2, y2);
            ctx.stroke(); ctx.globalAlpha = 1;
          }
        });
        ctx.globalCompositeOperation = 'lighter';
        for (const g of glows) {
          const gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, 10);
          gr.addColorStop(0, 'rgba(255,190,90,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gr; ctx.fillRect(g.x - 10, g.y - 10, 20, 20);
        }
        ctx.globalCompositeOperation = 'source-over';
        // a little sky-ferry crossing in panel 2
        if (i === 1) drawFerry(ctx, Math.round(-40 + k * (W + 80)), Math.round(H * 0.52 + Math.sin(t / 500) * 2));
        if (i === 2) { ctx.fillStyle = `rgba(10,14,30,${k * 0.5})`; ctx.fillRect(0, 0, W, H); }
      } else if (i === 3) {
        ctx.fillStyle = '#04030a'; ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H * 0.45;
        const pulse = 1 + Math.sin(t / 400) * 0.06;
        const r = Math.min(W, H) * 0.32 * pulse * Math.min(1, lt / 1500);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(200,240,255,0.9)'); g.addColorStop(0.4, 'rgba(111,243,255,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        // hexagonal field lines
        ctx.strokeStyle = 'rgba(160,240,255,0.35)';
        for (let a = 0; a < 6; a++) {
          const ang = a / 6 * Math.PI * 2 + t / 3000;
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r * 0.6, cy + Math.sin(ang) * r * 0.6);
          ctx.lineTo(cx + Math.cos(ang + Math.PI / 3) * r * 0.6, cy + Math.sin(ang + Math.PI / 3) * r * 0.6); ctx.stroke();
        }
        // the bundle
        const bx = Math.round(cx - 6), by = Math.round(cy - 4);
        ctx.fillStyle = '#e8eef8'; ctx.fillRect(bx, by, 12, 8); ctx.fillRect(bx + 1, by - 1, 10, 10);
        ctx.fillStyle = '#9ab0d8'; ctx.fillRect(bx + 2, by + 5, 8, 1);
        ctx.fillStyle = '#f2c7a5'; ctx.fillRect(bx + 3, by, 4, 3);
        ctx.fillStyle = '#8f5fe8'; ctx.fillRect(bx + 3, by - 1, 4, 1);
        const pg = 0.6 + 0.4 * Math.sin(t / 250);
        ctx.fillStyle = `rgba(255,214,110,${pg})`; ctx.fillRect(bx + 7, by + 3, 2, 2);
      } else {
        // Wren at the island's edge
        G.sky.draw(ctx, 'night', 0, 0, t);
        G.sky.ribbons(ctx, t, 0.35, 0.3);
        const gy = Math.round(H * 0.72);
        ctx.fillStyle = '#2e4a26'; ctx.fillRect(0, gy, W * 0.62, 3);
        ctx.fillStyle = '#3e2a1e'; ctx.fillRect(0, gy + 3, W * 0.62, H - gy);
        for (let x = 0; x < W * 0.62; x += 3) { ctx.fillStyle = '#4a3222'; ctx.fillRect(x, gy + 6 + (x * 7) % 20, 2, 1); }
        ctx.fillStyle = '#1a1226'; ctx.fillRect(W * 0.62, gy, 2, H - gy);
        const spr = G.sprites.char('wren').up[0];
        const s = 3;
        const wx = Math.round(W * 0.42 - 8 * s), wy = gy - 16 * s + 2 * s;
        // the pendant's glow, spilling around her from the front
        const pg = 0.25 + 0.15 * Math.sin(t / 300);
        const g = ctx.createRadialGradient(wx + 8 * s, wy + 10 * s, 0, wx + 8 * s, wy + 10 * s, 40);
        g.addColorStop(0, `rgba(255,214,110,${pg})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(wx - 40, wy - 40, 16 * s + 80, 16 * s + 80);
        ctx.drawImage(spr, wx, wy, 16 * s, 16 * s);
        // a far island with one lantern left burning
        const isl = G.sky.island(77, 50, { houses: 2, lanterns: 1 });
        ctx.drawImage(isl.c, Math.round(W * 0.78 - 25), Math.round(H * 0.38 + Math.sin(t / 1500) * 2));
      }
      // letterbox bars
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, Math.round(H * 0.08));
      ctx.fillRect(0, Math.round(H * 0.92), W, H);
    },
  });

  function drawFerry(ctx, x, y) {
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(x, y, 24, 4); ctx.fillRect(x + 2, y + 4, 20, 2); ctx.fillRect(x + 5, y + 6, 14, 1);
    ctx.fillStyle = '#a8743e'; ctx.fillRect(x, y, 24, 1);
    ctx.fillStyle = '#2a2230'; ctx.fillRect(x + 11, y - 12, 1, 12);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x + 12, y - 11, 7, 8);
    ctx.fillStyle = '#ffd060'; ctx.fillRect(x + 2, y - 3, 2, 2);
  }
  G.drawFerrySmall = drawFerry;
})();
