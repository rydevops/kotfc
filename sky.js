/* =========================================================================
   sky.js — skies, drifting clouds, Current ribbons and distant floating
   islands. Used behind every outdoor map, the intro and the title screen.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const H = U.hash;

  const SKIES = {
    dusk: { stops: ['#2a1e4a', '#6a3a6a', '#d0705a', '#f4b070'], cloud: '#f0a0a0', cloud2: '#b06a8a', isle: '#4a2a4a', stars: 0.3 },
    night: { stops: ['#060a1e', '#0e1838', '#1e2a5a', '#34407a'], cloud: '#3a4a7a', cloud2: '#26305a', isle: '#141a36', stars: 1 },
    dark: { stops: ['#0a0e18', '#18202e', '#2a3444', '#3e4a5a'], cloud: '#4a5666', cloud2: '#323c4c', isle: '#1a2028', stars: 0.15 },
    day: { stops: ['#3a6ad0', '#5a8ae0', '#8ab8f0', '#d0e8ff'], cloud: '#ffffff', cloud2: '#c8dcf4', isle: '#5a7ab0', stars: 0 },
    deep: { stops: ['#04040a', '#0a0a18', '#14142a', '#1e1e3a'], cloud: '#2a2a4a', cloud2: '#1a1a30', isle: '#0a0a14', stars: 0.6 },
  };

  const cloudCache = {}, isleCache = {};

  function cloudSprite(seed, col, col2) {
    const key = seed + col;
    if (cloudCache[key]) return cloudCache[key];
    const w = 40 + Math.floor(H(seed, 1) * 50), h = 14 + Math.floor(H(seed, 2) * 8);
    const { c, x } = G.gfx.makeCanvas(w, h);
    const blobs = 4 + Math.floor(H(seed, 3) * 4);
    for (let i = 0; i < blobs; i++) {
      const bx = (i / blobs) * w * 0.8 + w * 0.1, r = 4 + H(seed, i + 10) * (h * 0.45);
      const by = h - r - 1;
      for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
        if (xx * xx + yy * yy <= r * r) {
          x.fillStyle = yy > r * 0.3 ? col2 : col;
          x.fillRect(Math.round(bx + xx), Math.round(by + yy), 1, 1);
        }
      }
    }
    x.fillStyle = col2; x.fillRect(0, h - 2, w, 2);
    return (cloudCache[key] = c);
  }

  /* A floating island: grassy top, earthen underside, optional houses and
     lanterns. Returns { c, lights:[{x,y}] } in local pixel coords. */
  function island(seed, w, opts = {}) {
    const key = seed + ':' + w + ':' + JSON.stringify(opts);
    if (isleCache[key]) return isleCache[key];
    const depth = Math.floor(w * (0.55 + H(seed, 5) * 0.3));
    const top = opts.tower ? 40 : opts.houses ? 22 : 8;
    const hgt = top + depth;
    const { c, x } = G.gfx.makeCanvas(w, hgt);
    const lights = [];
    const sil = opts.silhouette;
    const col = (a) => (sil ? sil : a);
    // body
    for (let yy = 0; yy < depth; yy++) {
      const t = yy / depth;
      const inset = Math.floor(Math.pow(t, 0.8) * w * 0.48 + H(seed, yy) * 3);
      x.fillStyle = col(yy < 3 ? '#4a8a3a' : yy % 6 === 0 ? '#4a3222' : t > 0.6 ? '#3e2a1e' : '#5a3e2a');
      x.fillRect(inset, top + yy, w - inset * 2, 1);
    }
    // roots
    if (!sil) for (let i = 0; i < w / 8; i++) {
      const rx = Math.floor(w * 0.25 + H(seed, i + 30) * w * 0.5);
      x.fillStyle = '#2e4a26';
      x.fillRect(rx, top + depth - 6, 1, 4 + Math.floor(H(seed, i + 60) * 10));
    }
    // grass lip
    x.fillStyle = col('#6aac4a'); x.fillRect(0, top, w, 2);
    // houses
    if (opts.houses) {
      const n = opts.houses;
      for (let i = 0; i < n; i++) {
        const hw = 10 + Math.floor(H(seed, i + 70) * 6), hh = 8 + Math.floor(H(seed, i + 80) * 8);
        const hx = Math.floor(4 + (i / n) * (w - 18) + H(seed, i + 90) * 4);
        const hy = top - hh;
        x.fillStyle = col(['#b0603e', '#c8b090', '#9a6a4a'][i % 3]); x.fillRect(hx, hy, hw, hh);
        x.fillStyle = col(['#7a2a24', '#34427a', '#5a3a2a'][i % 3]);
        for (let r = 0; r < 5; r++) x.fillRect(hx - 1 + r, hy - 5 + r, hw + 2 - r * 2, 1);
        if (!sil) {
          const wx = hx + 3, wy = hy + 3;
          x.fillStyle = '#ffd27a'; x.fillRect(wx, wy, 2, 2);
          lights.push({ x: wx + 1, y: wy + 1 });
        }
      }
    }
    if (opts.tower) {
      const tx = Math.floor(w / 2 - 4);
      x.fillStyle = col('#3a4676'); x.fillRect(tx, top - 30, 8, 30);
      x.fillStyle = col('#1c2240'); for (let r = 0; r < 8; r++) x.fillRect(tx - 1 + Math.floor(r / 2), top - 38 + r, 10 - Math.floor(r / 2) * 2, 1);
      if (!sil) { x.fillStyle = '#ffe08a'; x.fillRect(tx + 3, top - 24, 2, 3); lights.push({ x: tx + 4, y: top - 23 }); }
    }
    if (opts.lanterns && !sil) {
      for (let i = 0; i < opts.lanterns; i++) {
        const lx = Math.floor(6 + H(seed, i + 100) * (w - 12));
        x.fillStyle = '#2a2230'; x.fillRect(lx, top - 6, 1, 6);
        x.fillStyle = '#ffd060'; x.fillRect(lx - 1, top - 8, 3, 2);
        lights.push({ x: lx, y: top - 7 });
      }
    }
    return (isleCache[key] = { c, lights, top });
  }

  const sky = (G.sky = {
    SKIES, island, cloudSprite,
    /* draw a full sky. cam = camera in game px (for parallax), t = ms */
    draw(ctx, type, camX, camY, t, opts = {}) {
      const W = G.gfx.W, Hh = G.gfx.H;
      if (type === 'none') { ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, Hh); return; }
      const S = SKIES[type] || SKIES.dusk;
      const sink = opts.sink || 0;
      const g = ctx.createLinearGradient(0, 0, 0, Hh);
      S.stops.forEach((c, i) => g.addColorStop(i / (S.stops.length - 1), c));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, Hh);
      // stars
      if (S.stars > 0) {
        for (let i = 0; i < 90; i++) {
          const sx = Math.floor(((H(i, 1) * 600 - camX * 0.02) % 600 + 600) % 600);
          const sy = Math.floor(((H(i, 2) * 400 - camY * 0.02 + sink * 0.05) % 400 + 400) % 400);
          if (sx > W || sy > Hh) continue;
          const tw = Math.sin(t / 600 + i) > 0.3 ? 1 : 0.5;
          if (H(i, 3) > S.stars) continue;
          ctx.globalAlpha = tw * (0.4 + H(i, 4) * 0.6);
          ctx.fillStyle = H(i, 5) > 0.8 ? '#ffe9a0' : '#ffffff';
          ctx.fillRect(sx, sy, 1, 1);
        }
        ctx.globalAlpha = 1;
      }
      // distant islands
      for (let i = 0; i < 5; i++) {
        const iw = 30 + Math.floor(H(i, 7) * 40);
        const isl = island(i * 13 + 3, iw, { silhouette: S.isle, houses: H(i, 8) > 0.5 ? 2 : 0 });
        const span = W + 200;
        const ix = Math.floor(((H(i, 9) * span - camX * 0.06 + t * 0.002) % span + span) % span) - 100;
        const iy = Math.floor(Hh * (0.25 + H(i, 10) * 0.5) - camY * 0.04 + sink * 0.15 + Math.sin(t / 2000 + i) * 2);
        ctx.drawImage(isl.c, ix, iy);
      }
      // drifting clouds (two layers)
      for (let layer = 0; layer < 2; layer++) {
        const par = layer ? 0.25 : 0.12, speed = layer ? 0.008 : 0.004;
        for (let i = 0; i < 6; i++) {
          const cl = cloudSprite(i + layer * 10, layer ? S.cloud : S.cloud2, layer ? S.cloud2 : U.shade(S.cloud2, -0.15));
          const span = W + 240;
          const cx = Math.floor(((H(i, layer + 20) * span - camX * par + t * speed * (1 + i * 0.2)) % span + span) % span) - 120;
          const cy = Math.floor(((H(i, layer + 30) * (Hh + 160) - camY * par + sink * (layer ? 0.6 : 0.3)) % (Hh + 160) + (Hh + 160)) % (Hh + 160)) - 60;
          ctx.globalAlpha = layer ? 0.55 : 0.4;
          ctx.drawImage(cl, cx, cy);
        }
      }
      ctx.globalAlpha = 1;
      // mist band at the bottom: the Drift below
      const mg = ctx.createLinearGradient(0, Hh * 0.7, 0, Hh);
      mg.addColorStop(0, 'rgba(255,255,255,0)');
      mg.addColorStop(1, type === 'dusk' ? 'rgba(255,200,180,0.25)' : 'rgba(160,180,220,0.18)');
      ctx.fillStyle = mg; ctx.fillRect(0, Hh * 0.7, W, Hh * 0.3);
    },

    /* the Current: glowing ribbons that flow across the sky */
    ribbons(ctx, t, alpha = 1, y0 = 0.4) {
      const W = G.gfx.W, Hh = G.gfx.H;
      ctx.globalAlpha = alpha;
      for (let r = 0; r < 3; r++) {
        for (let x = 0; x < W; x += 1) {
          const y = Hh * (y0 + r * 0.12) + Math.sin(x * 0.03 + t / 900 + r * 2) * 14 + Math.sin(x * 0.011 + t / 1600 + r) * 10;
          const b = (Math.sin(x * 0.08 - t / 200 + r) + 1) / 2;
          ctx.fillStyle = b > 0.85 ? '#ffffff' : b > 0.5 ? '#6ff3ff' : '#2a8ac0';
          ctx.fillRect(x, Math.round(y), 1, b > 0.5 ? 2 : 1);
        }
      }
      ctx.globalAlpha = 1;
    },
  });
})();
