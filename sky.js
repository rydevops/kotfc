/* =========================================================================
   sky.js — painted skies: gradient, sun or moon with glow and light rays,
   twinkling stars, puffy cartoon clouds in parallax layers, the sea of
   clouds below (the Drift), the Current's glowing ribbons, and detailed
   distant floating islands (cottages, trees, crystals, waterfalls).
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const H = U.hash;
  const R = (c, n = 5, s = 0.45) => G.pix.ramp(c, n, s);

  const SKIES = {
    dusk: { stops: ['#2a1c52', '#5a3478', '#b2587a', '#f08a6a', '#ffc27a'], cloud: '#ffd2c0', cloudShade: '#b0688a', sea: '#ffd8c8', seaShade: '#c07890', tint: '#8a4a7a', stars: 0.25, sun: true },
    night: { stops: ['#050a1e', '#0c1638', '#18265a', '#2c3c7a', '#4a5a9a'], cloud: '#8a9ad0', cloudShade: '#3a4680', sea: '#7a8ac8', seaShade: '#2e3a70', tint: '#1a2450', stars: 1, moon: true },
    dark: { stops: ['#06080e', '#10161f', '#1c2430', '#2c3644', '#3e4a5a'], cloud: '#5a6676', cloudShade: '#2a3240', sea: '#4e5a6a', seaShade: '#222a36', tint: '#141a24', stars: 0.12 },
    day: { stops: ['#3a6ad8', '#5a8ae8', '#88b6f4', '#c0dcff', '#e8f4ff'], cloud: '#ffffff', cloudShade: '#a8c4ec', sea: '#ffffff', seaShade: '#b8d0f0', tint: '#7aa0d8', stars: 0, sun: true },
  };

  /* ---------------- clouds ---------------- */
  const cloudCache = {};
  function cloudSprite(seed, top, shade) {
    const key = seed + top + shade;
    if (cloudCache[key]) return cloudCache[key];
    const w = 44 + Math.floor(H(seed, 1) * 46), h = 18 + Math.floor(H(seed, 2) * 10);
    const b = G.pix.buf(w, h + 2);
    b.noDither = true;
    const ramp = [shade, U.mix(shade, top, 0.45), U.mix(shade, top, 0.75), top, U.mix(top, '#ffffff', 0.5)];
    const n = 4 + Math.floor(H(seed, 3) * 3);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const r = (h * 0.42) * (0.65 + Math.sin(t * Math.PI) * 0.55) * (0.85 + H(seed, i + 10) * 0.3);
      b.ellipse(w * (0.12 + t * 0.76), h - r * 0.9, r * 1.15, r, ramp, { amb: 0.35 });
    }
    // flat soft base
    for (let x = 2; x < w - 2; x++) { if (b.get(x, h - 1)) b.set(x, h, shade); }
    cloudCache[key] = b.canvas();
    return cloudCache[key];
  }
  // a continuous strip of cloud tops for the sea of clouds
  const seaCache = {};
  function seaStrip(top, shade, w = 320) {
    const key = top + shade + w;
    if (seaCache[key]) return seaCache[key];
    const h = 46;
    const b = G.pix.buf(w, h);
    b.noDither = true;
    const ramp = [shade, U.mix(shade, top, 0.4), U.mix(shade, top, 0.72), top, U.mix(top, '#ffffff', 0.45)];
    for (let x = 0; x < w; x += 9) {
      const r = 9 + H(x, 4, 7) * 9;
      // wrap so the strip tiles seamlessly
      for (const off of [0, -w, w]) b.ellipse(x + off, 14 + r * 0.4, r * 1.2, r, ramp, { amb: 0.35 });
    }
    for (let y = 22; y < h; y++) for (let x = 0; x < w; x++) if (!b.get(x, y)) b.set(x, y, shade);
    seaCache[key] = b.canvas();
    return seaCache[key];
  }

  /* ---------------- floating islands (for skies, intro, title) ---------------- */
  const isleCache = {};
  const STRATA = ['#9a7048', '#86603e', '#a8845a', '#7a6670', '#8c7680'].map((c) => R(c, 5, 0.48));
  function island(seed, w, opts = {}) {
    const key = seed + ':' + w + ':' + JSON.stringify(opts);
    if (isleCache[key]) return isleCache[key];
    const topH = opts.tower ? 46 : opts.houses ? 24 : opts.trees === false ? 6 : 16;
    const depth = Math.floor(w * (0.55 + H(seed, 5) * 0.3));
    const fall = opts.waterfall ? 40 : 0;
    const Ht = topH + depth + 14 + fall;
    const b = G.pix.buf(w + 4, Ht);
    b.noDither = true;
    const ox = 2, gy = topH; // grass line
    const lights = [];
    // ---- underside ----
    const tipAt = [];
    for (let x = 0; x < w; x++) {
      const u = (x - w / 2) / (w / 2 + 1);
      let d = depth * Math.pow(Math.max(0, 1 - u * u), 0.62) + (H(x >> 2, 3, seed) - 0.5) * 5;
      if (H(x >> 3, 9, seed) > 0.72) d += Math.max(0, 1 - Math.abs((x % 8) - 3.5) / 4) * depth * 0.18;
      tipAt[x] = Math.max(3, Math.round(d));
      for (let y = 0; y <= tipAt[x]; y++) {
        const r = y / tipAt[x], lx = x / w;
        let v = 0.8 - lx * 0.5 - r * 0.3;
        if (y < 4) v -= (4 - y) * 0.07;
        const ramp = y < 3 ? R('#7a5434', 5) : STRATA[Math.floor((y + H(x >> 3, 2, seed) * 5) / 6) % STRATA.length];
        b.set(ox + x, gy + 2 + y, b.pick(ramp, v, x, y));
      }
    }
    // grass cap
    b.ellipse(ox + w / 2, gy + 1.5, w / 2 + 0.5, 3, R('#5aa048', 5, 0.5), { amb: 0.5 });
    b.rect(ox, gy + 1, w, 2, '#4a8a3c');
    for (let x = 0; x < w; x += 3) if (H(x, 6, seed) > 0.4) b.set(ox + x, gy + 3 + Math.floor(H(x, 7, seed) * 3), '#4a8a3c');
    // roots & vines
    for (let i = 0; i < w / 8; i++) {
      const x = Math.floor(w * 0.15 + H(i, 30, seed) * w * 0.7);
      const len = 6 + H(i, 31, seed) * 14;
      b.curve(ox + x, gy + 2 + tipAt[x] - 2, ox + x + 3, gy + tipAt[x] + len / 2, ox + x - 1, gy + 2 + tipAt[x] + len, i % 2 ? '#3e2616' : '#3e7a32');
    }
    // crystals
    if (w > 30) for (let i = 0; i < Math.max(1, w / 40); i++) {
      const x = Math.floor(w * 0.3 + H(i, 40, seed) * w * 0.4), y = gy + 4 + Math.floor(tipAt[x] * (0.35 + H(i, 41, seed) * 0.3));
      const cr = R('#4ad8f0', 4, 0.55);
      for (let j = 0; j < 5; j++) { b.set(ox + x, y + j, cr[3 - Math.min(3, j >> 1)]); b.set(ox + x + 1, y + j, cr[2 - Math.min(2, j >> 1)]); }
      b.set(ox + x, y, '#ffffff');
      lights.push({ x: ox + x, y: y + 2, c: '#6ff3ff' });
    }
    // waterfall pouring off the edge
    if (opts.waterfall) {
      const x = Math.floor(w * 0.7);
      for (let y = gy - 1; y < Ht - 2; y++) for (let k = 0; k < 3; k++) b.set(ox + x + k, y, ['#bfe8ff', '#7ac8f0', '#e8f8ff'][(k + y) % 3]);
      b.ellipse(ox + x + 1, Ht - 4, 4, 2, '#e8f4ff');
    }
    // trees
    if (opts.trees !== false) {
      const nT = Math.max(1, Math.round(w / 22));
      for (let i = 0; i < nT; i++) {
        const x = Math.floor(5 + H(i, 50, seed) * (w - 10)), s = 3 + H(i, 51, seed) * 3;
        b.rect(ox + x, gy - 3, 1, 4, '#5a3a22');
        b.ellipse(ox + x + 0.5, gy - 3 - s * 0.6, s, s * 0.9, R(['#3e8e44', '#4a9a3e', '#2f8a5a'][i % 3], 5, 0.55));
      }
    }
    // cottages
    for (let i = 0; i < (opts.houses || 0); i++) {
      const hw = 9 + Math.floor(H(seed, i + 70) * 5), hh = 7 + Math.floor(H(seed, i + 80) * 6);
      const hx = Math.floor(3 + ((i + 0.5) / opts.houses) * (w - 14) - hw / 2 + H(seed, i + 90) * 4);
      const hy = gy + 1 - hh;
      b.box(ox + hx, hy, hw, hh, R(['#ead8b4', '#e0c8a0', '#d8c0b0'][i % 3], 4, 0.3));
      b.rect(ox + hx, hy, hw, 1, '#6a4024');
      const roof = R(['#c44a38', '#3e4c8a', '#7a5a30'][i % 3], 4, 0.4);
      b.poly([[ox + hx - 2, hy + 1], [ox + hx + hw / 2, hy - 6], [ox + hx + hw + 2, hy + 1]], roof, { dir: 'x' });
      b.rect(ox + hx + hw - 3, hy - 6, 2, 4, '#6a5a5a');
      const wx = ox + hx + 2, wy = hy + 2;
      b.rect(wx, wy, 2, 2, '#ffd27a'); b.set(wx, wy, '#fff4c8');
      lights.push({ x: wx + 1, y: wy + 1, c: '#ffb050' });
      if (hw > 10) { b.rect(ox + hx + hw - 4, wy, 2, 2, '#ffd27a'); lights.push({ x: ox + hx + hw - 3, y: wy + 1, c: '#ffb050' }); }
    }
    // a spire (the Conservatory)
    if (opts.tower) {
      const tx = Math.floor(ox + w / 2 - 4);
      b.box(tx, gy - 34, 9, 35, R('#5a68a8', 5, 0.45));
      b.poly([[tx - 2, gy - 33], [tx + 4.5, gy - 46], [tx + 11, gy - 33]], R('#2e3a78', 4, 0.45), { dir: 'x' });
      b.rect(tx, gy - 33, 9, 1, '#e8c050');
      for (const y of [gy - 28, gy - 18]) { b.rect(tx + 3, y, 3, 4, '#ffe08a'); lights.push({ x: tx + 4, y: y + 2, c: '#ffd27a' }); }
      b.set(tx + 4, gy - 47, '#6ff3ff'); lights.push({ x: tx + 4, y: gy - 46, c: '#6ff3ff' });
    }
    // lanterns
    for (let i = 0; i < (opts.lanterns || 0); i++) {
      const lx = Math.floor(ox + 4 + H(seed, i + 100) * (w - 8));
      b.rect(lx, gy - 6, 1, 7, '#2a2230');
      b.rect(lx, gy - 8, 2, 3, '#ffa848'); b.set(lx, gy - 8, '#fff0c0');
      lights.push({ x: lx + 1, y: gy - 7, c: '#ffa848' });
    }
    b.outline(null, { amt: 0.8 });
    return (isleCache[key] = { c: b.canvas(), lights, top: gy, w: w + 4 });
  }

  // islands softened toward the sky colour for distance
  const tintCache = {};
  function tinted(isl, color, amt) {
    const key = isl.c.width + ':' + isl.c.height + color + amt + isl.top;
    if (tintCache[key]) return tintCache[key];
    const { c, x } = G.gfx.makeCanvas(isl.c.width, isl.c.height);
    x.drawImage(isl.c, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.globalAlpha = amt; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    return (tintCache[key] = c);
  }

  /* ---------------- moon & sun ---------------- */
  const moonImg = (() => {
    let c = null;
    return () => {
      if (c) return c;
      const b = G.pix.buf(22, 22);
      b.ellipse(11, 11, 10, 10, R('#f4ecd0', 5, 0.35), { amb: 0.55 });
      for (const [x, y, r] of [[7, 8, 2], [14, 13, 2.6], [12, 6, 1.4], [6, 14, 1.2]]) b.ellipse(x, y, r, r, '#d8ccac');
      return (c = b.canvas());
    };
  })();

  const sky = (G.sky = {
    SKIES, island, cloudSprite, tinted,
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
        for (let i = 0; i < 110; i++) {
          if (H(i, 3) > S.stars) continue;
          const sx = Math.floor(((H(i, 1) * 640 - camX * 0.02) % 640 + 640) % 640);
          const sy = Math.floor(((H(i, 2) * 420 - camY * 0.02 + sink * 0.05) % 420 + 420) % 420);
          if (sx > W || sy > Hh * 0.8) continue;
          const tw = 0.5 + 0.5 * Math.sin(t / (500 + H(i, 6) * 900) + i);
          ctx.globalAlpha = (0.35 + H(i, 4) * 0.65) * (0.5 + tw * 0.5);
          ctx.fillStyle = H(i, 5) > 0.8 ? '#ffe9a0' : '#ffffff';
          ctx.fillRect(sx, sy, 1, 1);
          if (H(i, 7) > 0.92 && tw > 0.6) { ctx.globalAlpha *= 0.6; ctx.fillRect(sx - 1, sy, 3, 1); ctx.fillRect(sx, sy - 1, 1, 3); }
        }
        ctx.globalAlpha = 1;
      }
      // sun or moon
      if (S.sun || S.moon) {
        const bx = Math.round(W * 0.74 - camX * 0.01), by = Math.round((S.sun ? Hh * 0.56 : Hh * 0.15) - camY * 0.01 + sink * 0.08);
        const r = S.sun ? 26 : 12;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = S.sun ? 0.55 : 0.4;
        ctx.drawImage(G.pix.glow(S.sun ? '#ffb070' : '#a8b8ff', r * 4), bx - r * 4, by - r * 4);
        if (S.sun) { // light rays
          ctx.globalAlpha = 0.07;
          ctx.fillStyle = '#ffd8a0';
          for (let i = 0; i < 7; i++) {
            const a = -2.4 + i * 0.32 + Math.sin(t / 4000 + i) * 0.04;
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * 400, by + Math.sin(a) * 400); ctx.lineTo(bx + Math.cos(a + 0.1) * 400, by + Math.sin(a + 0.1) * 400); ctx.fill();
          }
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        if (S.sun) {
          for (let i = 3; i >= 0; i--) { ctx.fillStyle = ['#ffe8b0', '#ffd890', '#ffc070', '#ffa860'][i]; ctx.beginPath(); ctx.arc(bx, by, r - i * 3, 0, Math.PI * 2); ctx.fill(); }
        } else ctx.drawImage(moonImg(), bx - 11, by - 11);
      }
      // distant islands (softened by the air between)
      for (let i = 0; i < 5; i++) {
        const iw = 34 + Math.floor(H(i, 7) * 40);
        const isl = island(i * 13 + 3, iw, { houses: H(i, 8) > 0.5 ? 2 : 0, waterfall: H(i, 11) > 0.6, trees: true });
        const img = tinted(isl, S.tint, 0.55 - (i % 2) * 0.12);
        const span = W + 220;
        const ix = Math.floor(((H(i, 9) * span - camX * (0.05 + (i % 2) * 0.03) + t * 0.002) % span + span) % span) - 110;
        const iy = Math.floor(Hh * (0.18 + H(i, 10) * 0.45) - camY * 0.04 + sink * 0.15 + Math.sin(t / 2200 + i) * 2);
        ctx.drawImage(img, ix, iy);
      }
      // drifting clouds (two layers)
      for (let layer = 0; layer < 2; layer++) {
        const par = layer ? 0.25 : 0.12, speed = layer ? 0.009 : 0.004;
        for (let i = 0; i < 5; i++) {
          const cl = cloudSprite(i + layer * 10, layer ? S.cloud : U.mix(S.cloud, S.cloudShade, 0.35), S.cloudShade);
          const span = W + 240;
          const cx = Math.floor(((H(i, layer + 20) * span - camX * par + t * speed * (1 + i * 0.2)) % span + span) % span) - 120;
          const cy = Math.floor(((H(i, layer + 30) * (Hh * 0.7 + 160) - camY * par + sink * (layer ? 0.6 : 0.3)) % (Hh * 0.7 + 160) + (Hh * 0.7 + 160)) % (Hh * 0.7 + 160)) - 60;
          ctx.globalAlpha = layer ? 0.9 : 0.7;
          ctx.drawImage(cl, cx, cy);
        }
      }
      ctx.globalAlpha = 1;
      // the sea of clouds below — the Drift
      if (!opts.noSea) {
        for (let layer = 0; layer < 2; layer++) {
          const strip = seaStrip(layer ? S.sea : U.mix(S.sea, S.seaShade, 0.4), S.seaShade);
          const y = Math.round(Hh * (0.8 + layer * 0.07) - camY * (0.08 + layer * 0.06) - sink * (0.25 + layer * 0.2) + Math.sin(t / 3000 + layer) * 2);
          const off = Math.floor(((-camX * (0.1 + layer * 0.1) - t * (0.004 + layer * 0.004)) % 320 + 320) % 320);
          for (let x = -off; x < W; x += 320) ctx.drawImage(strip, x, y);
          ctx.fillStyle = S.seaShade; ctx.fillRect(0, y + strip.height - 1, W, Hh);
        }
      }
    },

    /* the Current: glowing ribbons that flow across the sky */
    ribbons(ctx, t, alpha = 1, y0 = 0.4) {
      const W = G.gfx.W, Hh = G.gfx.H;
      ctx.globalCompositeOperation = 'lighter';
      for (let r = 0; r < 3; r++) {
        for (let x = 0; x < W; x += 1) {
          const y = Hh * (y0 + r * 0.12) + Math.sin(x * 0.03 + t / 900 + r * 2) * 14 + Math.sin(x * 0.011 + t / 1600 + r) * 10;
          const b = (Math.sin(x * 0.08 - t / 200 + r) + 1) / 2;
          ctx.globalAlpha = alpha * (0.25 + b * 0.5);
          ctx.fillStyle = b > 0.85 ? '#ffffff' : b > 0.5 ? '#6ff3ff' : '#2a8ac0';
          ctx.fillRect(x, Math.round(y), 1, b > 0.5 ? 2 : 1);
          if (b > 0.9) { ctx.globalAlpha = alpha * 0.15; ctx.fillRect(x, Math.round(y) - 2, 1, 6); }
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },
  });
})();
