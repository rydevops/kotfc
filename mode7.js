/* =========================================================================
   mode7.js — a Super Famicom "Mode 7" floor: a flat texture rendered in
   perspective, one scanline at a time, with a camera that can fly, turn
   and climb. Used for the flight over the sea of clouds in the intro and
   on the title screen. Billboards (islands, ships) can be projected into
   the same space so they grow as the camera approaches.

     const tex = G.mode7.texture('dusk');
     G.mode7.render(ctx, tex, { W, H, horizon: 90, x, y, angle, height: 40 });
     const p = G.mode7.project(view, wx, wy);   // { x, y, s } or null
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;

  /* ---------- tileable value noise ---------- */
  function tnoise(x, y, period, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const s = (t) => t * t * (3 - 2 * t);
    const h = (a, b) => U.hash(((a % period) + period) % period, ((b % period) + period) % period, seed);
    return U.lerp(U.lerp(h(xi, yi), h(xi + 1, yi), s(xf)), U.lerp(h(xi, yi + 1), h(xi + 1, yi + 1), s(xf)), s(yf));
  }
  function fbm(x, y, size, seed) {
    let v = 0, amp = 0.55, f = 1 / 32, tot = 0;
    for (let o = 0; o < 4; o++) { v += tnoise(x * f, y * f, size * f, seed + o) * amp; tot += amp; amp *= 0.5; f *= 2; }
    return v / tot;
  }

  /* ---------- the sea of clouds, seen from above ---------- */
  const PALS = {
    dusk: { gap: ['#2a1640', '#40205a'], cloud: ['#7a3a70', '#b0587a', '#e08a7a', '#f8c09a', '#fff0d0'] },
    night: { gap: ['#040818', '#08102a'], cloud: ['#16224c', '#22346c', '#34508e', '#5470b0', '#8aa0d8'] },
    dark: { gap: ['#05070c', '#0a0e16'], cloud: ['#1a2028', '#28303c', '#3a4452', '#566070', '#7a8494'] },
    day: { gap: ['#2a5ab8', '#3a70d0'], cloud: ['#8aa8d8', '#b0c8ec', '#d8e4f8', '#f0f6ff', '#ffffff'] },
  };
  const texCache = {};
  function texture(kind = 'dusk', size = 256) {
    const key = kind + size;
    if (texCache[key]) return texCache[key];
    const P = PALS[kind] || PALS.dusk;
    const cols = [...P.gap, ...P.cloud].map((h) => U.hexToRgb(h));
    const data = new Uint8ClampedArray(size * size * 3);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let v = fbm(x * 0.5, y * 0.5, size * 0.5, 17) * 0.75 + fbm(x * 1.5, y * 1.5, size * 1.5, 23) * 0.25;
      // cloud tops are lit from one side: compare with a nudged sample
      const v2 = fbm(x * 0.5 + 1.5, y * 0.5 + 1.5, size * 0.5, 17) * 0.75 + fbm(x * 1.5 + 3, y * 1.5 + 3, size * 1.5, 23) * 0.25;
      const lit = (v - v2) * 6;
      let idx;
      if (v < 0.42) idx = v < 0.36 ? 0 : 1;
      else {
        const k = U.clamp((v - 0.42) / 0.3 + lit * 0.5, 0, 0.999);
        idx = 2 + Math.floor(k * 5);
      }
      // ordered dither between neighbouring bands for the SNES look
      const c = cols[U.clamp(idx, 0, cols.length - 1)];
      const i = (y * size + x) * 3;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2];
    }
    return (texCache[key] = { size, data, kind });
  }

  /* ---------- the renderer ---------- */
  const imgCache = {};
  function view(o) {
    const f = [Math.cos(o.angle || 0), Math.sin(o.angle || 0)];
    return Object.assign({ focal: 120, height: 40, scale: 1 }, o, { fwd: f, right: [-f[1], f[0]] });
  }
  function render(ctx, tex, o) {
    const v = view(o);
    const W = v.W, top = Math.max(0, Math.floor(v.horizon) + 1), bot = v.H;
    const rows = bot - top;
    if (rows <= 0) return v;
    const key = W + 'x' + rows;
    let img = imgCache[key];
    if (!img) img = imgCache[key] = ctx.createImageData(W, rows);
    const d = img.data, T = tex.data, S = tex.size;
    const fog = v.fog || [0, 0, 0], fogDist = v.fogDist || 900;
    for (let y = top; y < bot; y++) {
      const dy = y - v.horizon;
      const dist = (v.height * v.focal) / dy;
      const fg = U.clamp(dist / fogDist, 0, 1);
      const fgk = fg * fg;
      const bx = v.x + v.fwd[0] * dist, by = v.y + v.fwd[1] * dist;
      const step = dist / v.focal;
      let wx = bx + v.right[0] * (-W / 2) * step, wy = by + v.right[1] * (-W / 2) * step;
      const sx = v.right[0] * step, sy = v.right[1] * step;
      let i = (y - top) * W * 4;
      for (let x = 0; x < W; x++) {
        const tx = ((Math.floor(wx * v.scale) % S) + S) % S, ty = ((Math.floor(wy * v.scale) % S) + S) % S;
        const j = (ty * S + tx) * 3;
        d[i] = T[j] + (fog[0] - T[j]) * fgk;
        d[i + 1] = T[j + 1] + (fog[1] - T[j + 1]) * fgk;
        d[i + 2] = T[j + 2] + (fog[2] - T[j + 2]) * fgk;
        d[i + 3] = 255;
        i += 4; wx += sx; wy += sy;
      }
    }
    ctx.putImageData(img, 0, top);
    return v;
  }
  /* screen position and scale of a world point (for billboards) */
  function project(v, wx, wy, wz = 0) {
    const rx = wx - v.x, ry = wy - v.y;
    const f = rx * v.fwd[0] + ry * v.fwd[1];
    if (f < 4) return null;
    const l = rx * v.right[0] + ry * v.right[1];
    const s = v.focal / f;
    return { x: v.W / 2 + l * s, y: v.horizon + (v.height - wz) * s, s, dist: f };
  }

  /* ---------- the sky above the horizon: flat bands, as on the SNES ---------- */
  const SKY = {
    dusk: ['#1c1240', '#2a1a52', '#3e2264', '#5a2c74', '#7c3878', '#a24a74', '#c8606a', '#e88068', '#f8a870', '#ffd090'],
    night: ['#02040e', '#040818', '#081024', '#0c1832', '#122040', '#1a2a50', '#243660', '#304472'],
    dark: ['#020304', '#05070c', '#0a0e16', '#10161f', '#182030', '#222c3c'],
    day: ['#2850b8', '#3462c8', '#4074d8', '#5288e4', '#6aa0ee', '#88b8f6', '#a8d0fc'],
  };
  function sky(ctx, kind, W, horizon, t = 0, o = {}) {
    const cols = SKY[kind] || SKY.dusk;
    const n = cols.length, bh = horizon / n;
    for (let i = 0; i < n; i++) {
      const y0 = Math.round(i * bh), y1 = Math.round((i + 1) * bh);
      ctx.fillStyle = cols[i]; ctx.fillRect(0, y0, W, y1 - y0 + 1);
      if (i < n - 1) { ctx.fillStyle = cols[i + 1]; for (let x = y1 & 1; x < W; x += 2) ctx.fillRect(x, y1 - 1, 1, 1); }
    }
    if (kind !== 'dusk' || o.stars) {
      for (let i = 0; i < 60; i++) {
        const x = Math.floor(U.hash(i, 1, 3) * W), y = Math.floor(U.hash(i, 2, 3) * horizon * 0.8);
        const tw = Math.sin(t / 300 + i * 2) > 0.6;
        ctx.fillStyle = U.hash(i, 3, 3) > 0.8 || tw ? '#ffffff' : '#8890c8';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    if (o.sun) {
      const sx = o.sun[0], sy = o.sun[1], r = o.sun[2] || 14;
      for (let j = -r; j <= r; j++) {
        if (j > r * 0.2 && (j % 3 === 0)) continue;
        const w = Math.round(Math.sqrt(r * r - j * j));
        ctx.fillStyle = j < -r * 0.3 ? '#fff6d0' : j < r * 0.3 ? '#ffe090' : '#ffb060';
        ctx.fillRect(Math.round(sx - w), Math.round(sy + j), w * 2, 1);
      }
    }
    if (o.moon) {
      const [mx, my] = o.moon;
      for (let j = -7; j <= 7; j++) { const w = Math.round(Math.sqrt(49 - j * j)); ctx.fillStyle = '#e8ecff'; ctx.fillRect(mx - w, my + j, w * 2, 1); }
      ctx.fillStyle = '#b8c0e0'; ctx.fillRect(mx - 3, my - 2, 2, 2); ctx.fillRect(mx + 2, my + 2, 3, 2); ctx.fillRect(mx - 1, my + 4, 2, 1);
    }
  }

  /* ---------- the sky-ferry, hand-pixelled (facing right) ---------- */
  const FERRY = [
    '...................kk...........................',
    '..................kSSk..........................',
    '.................kSssSk.........................',
    '................kSsssSSk........................',
    '...............kSsssssSSk.......................',
    '..............kSssssssSSSk......................',
    '.............kSsssssssSSSSk.....................',
    '............kSsssssssssSSSSk....................',
    '...........kSsssssssssssSSSSk...................',
    '..........kSssssssssssssSSSSSk..................',
    '.........kSssssssssssssssSSSSSk.................',
    '........kkkkkkkkkkkkkkkkkkkkkkkk................',
    '...................km...........................',
    '..ff...............km................ll.........',
    '.fFFf..............km...............lLLl........',
    '..ff.kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk....',
    '.....kggggggggggggggggggggggggggggggggggggggk...',
    '....kwhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhk..',
    '....kwhhhohhhhhhohhhhhhohhhhhhohhhhhhohhhhhhhhk.',
    '.....kwhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhk..',
    '.....kdddddddddddddddddddddddddddddddddddddddk..',
    '......kwhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhk...',
    '.......kdddddddddddddddddddddddddddddddddddk....',
    '........kkddddddddddddddddddddddddddddddkkk.....',
    '..........kkkkkkkkkkkkkcCcckkkkkkkkkkkkk........',
    '......................kcCCck....................',
    '.......................kcck.....................',
    '........................kk......................',
  ];
  let ferryC = null;
  function ferry() {
    if (ferryC) return ferryC;
    ferryC = G.art.paint(G.art.grid(FERRY), {
      k: '#1a1016', S: '#c8bca8', s: '#f4ecdc', m: '#4a2c18', g: '#e8b850', w: '#c08a4a', h: '#8a5a30', d: '#5a3418', o: '#ffd27a',
      f: '#fff4c0', F: '#ffb040', l: '#fff4c0', L: '#ffb040', c: '#6ff3ff', C: '#e8ffff',
    });
    return ferryC;
  }

  G.mode7 = { texture, render, project, sky, ferry, view, PALS };
})();
