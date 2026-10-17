/* =========================================================================
   backdrops.js — painted battle backdrops in the 16-bit manner:
   a banded sky or wall panorama above the horizon, and a floor drawn in
   Mode-7 style perspective below it. Each backdrop is rendered once per
   screen size into a cached canvas; a few things (lamps, motes, ribbons)
   animate on top.

   G.backdrops.draw(ctx, id, W, fieldH, t)
   Add a region: G.backdrops.defs.myPlace = { paint(x, W, H, hy), floor: {...} }
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const H = U.hash;

  /* ---------- helpers ---------- */
  function rect(x, a, b, w, h, c) { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); }
  // sky made of flat colour bands with a checker-dithered seam between each band
  function bands(x, W, y0, y1, cols) {
    const n = cols.length, bh = (y1 - y0) / n;
    for (let i = 0; i < n; i++) {
      const top = Math.round(y0 + i * bh), bot = Math.round(y0 + (i + 1) * bh);
      rect(x, 0, top, W, bot - top, cols[i]);
      if (i < n - 1) { x.fillStyle = cols[i + 1]; for (let px = (bot & 1); px < W; px += 2) x.fillRect(px, bot - 1, 1, 1); }
      if (i > 0) { x.fillStyle = cols[i - 1]; for (let px = ((top + 1) & 1); px < W; px += 2) x.fillRect(px, top, 1, 1); }
    }
  }
  function stars(x, W, y0, y1, n, seed) {
    for (let i = 0; i < n; i++) {
      const sx = Math.floor(H(i, seed, 1) * W), sy = Math.floor(y0 + H(i, seed, 2) * (y1 - y0));
      const b = H(i, seed, 3);
      x.fillStyle = b > 0.9 ? '#ffffff' : b > 0.6 ? '#c8d0ff' : '#7880c0';
      x.fillRect(sx, sy, 1, 1);
      if (b > 0.95) { x.fillStyle = 'rgba(200,210,255,0.6)'; x.fillRect(sx - 1, sy, 3, 1); x.fillRect(sx, sy - 1, 1, 3); }
    }
  }
  // soft pixel clouds: stacked rounded strips with a lit top
  function cloud(x, cx, cy, w, h, light, mid, dark) {
    for (let j = 0; j < h; j++) {
      const k = j / h, half = w / 2 * Math.sqrt(1 - Math.pow(1 - k * 1.6, 2) * (k < 0.6 ? 1 : 0)) || w / 2;
      const ww = Math.round(Math.max(2, half * (0.7 + 0.3 * Math.sin(cx + j))));
      rect(x, cx - ww, cy + j, ww * 2, 1, j < h * 0.35 ? light : j < h * 0.75 ? mid : dark);
    }
  }
  // a distant floating island silhouette
  function islet(x, cx, cy, w, top, under, seed) {
    for (let i = -w; i <= w; i++) {
      const k = Math.abs(i) / w;
      const depth = Math.round((1 - k * k) * w * 0.9 * (0.7 + 0.3 * H(i, seed, 4)));
      rect(x, cx + i, cy, 1, depth, under);
      rect(x, cx + i, cy - 1 - Math.round((1 - k) * 2), 1, 2 + Math.round((1 - k) * 2), top);
    }
  }

  /* ---------- Mode-7 style floor ---------- */
  // tex: { w, h, px(u, v) -> [r,g,b] }; rows from hy to H recede toward the horizon
  function floor(x, W, hy, Hh, tex, o = {}) {
    const img = x.createImageData(W, Hh - hy);
    const camH = o.camH || 15, fog = o.fog || [8, 10, 28], fogAmt = o.fogAmt != null ? o.fogAmt : 0.75;
    for (let y = hy; y < Hh; y++) {
      const d = y - hy + (o.off || 2);
      const z = camH * 32 / d;                // distance of this scanline
      const v = z;
      const f = Math.min(1, Math.max(0, 1 - (y - hy) / ((Hh - hy) * 0.55))) * fogAmt;
      for (let sx = 0; sx < W; sx++) {
        const u = (sx - W / 2) * z / 32 + 1000 + (o.scrollX || 0);
        const c = tex(u, v + (o.scrollY || 0));
        const i = ((y - hy) * W + sx) * 4;
        img.data[i] = c[0] + (fog[0] - c[0]) * f;
        img.data[i + 1] = c[1] + (fog[1] - c[1]) * f;
        img.data[i + 2] = c[2] + (fog[2] - c[2]) * f;
        img.data[i + 3] = 255;
      }
    }
    x.putImageData(img, 0, hy);
  }
  const hex = (h) => U.hexToRgb(h);
  const TEX = {
    cobble: (() => {
      const c = ['#8a7468', '#a08a78', '#b49c84', '#7a6658', '#94806e'].map(hex), mortar = hex('#4a3a34'), hi = hex('#cdb497');
      return (u, v) => {
        const row = Math.floor(v / 6), off = row % 2 ? 4 : 0, col = Math.floor((u + off) / 8);
        const fu = (u + off) - col * 8, fv = v - row * 6;
        if (fu < 1 || fv < 1) return mortar;
        if (fv < 2 && fu < 6) return hi;
        return c[Math.floor(H(col, row, 3) * c.length)];
      };
    })(),
    marble: (() => {
      const a = hex('#c8cce8'), b = hex('#5a66a8'), gold = hex('#e8c860'), line = hex('#2a3070'), aHi = hex('#e8ecff'), bHi = hex('#7480c0');
      return (u, v) => {
        const cu = Math.floor(u / 16), cv = Math.floor(v / 16), fu = u - cu * 16, fv = v - cv * 16;
        if (fu < 1 || fv < 1) return line;
        const light = (cu + cv) % 2 === 0;
        if ((fu < 3 && fv < 3)) return gold;
        const vein = Math.sin(u * 0.4 + Math.sin(v * 0.3) * 2) > 0.92;
        return light ? (vein ? bHi : fv < 3 ? aHi : a) : (vein ? a : fv < 3 ? bHi : b);
      };
    })(),
    planks: (() => {
      const c = ['#6a4028', '#7a4a2e', '#5e3822', '#845232'].map(hex), seam = hex('#2a160c'), hi = hex('#9a6a40');
      return (u, v) => {
        const row = Math.floor(u / 7), fu = u - row * 7;
        const len = 40 + Math.floor(H(row, 1, 5) * 30), off = H(row, 2, 5) * 40;
        const seg = Math.floor((v + off) / len), fv = (v + off) - seg * len;
        if (fu < 1 || fv < 1) return seam;
        if (fu < 2) return hi;
        return c[Math.floor(H(row, seg, 7) * c.length)];
      };
    })(),
    carpetPlanks: null,
  };
  TEX.carpetPlanks = (() => {
    const red = hex('#8a1c2c'), redHi = hex('#b02c3c'), gold = hex('#d8b048'), dk = hex('#5a1020');
    return (u, v) => {
      const cu = u - 1000;
      if (Math.abs(cu) < 22) {
        if (Math.abs(cu) > 19) return gold;
        if (Math.abs(cu) > 17) return dk;
        return (Math.floor(v / 10) + Math.floor((cu + 40) / 10)) % 2 ? red : redHi;
      }
      return TEX.planks(u, v);
    };
  })();

  /* ---------- scenery pieces ---------- */
  function house(x, bx, gy, w, h, o) {
    const wall = o.wall || '#e8d6b0', wallSh = o.wallSh || '#b8a07c', roof = o.roof || '#b0402e', roofHi = o.roofHi || '#d8604a', roofSh = o.roofSh || '#6a2018';
    // walls with timber frame
    rect(x, bx, gy - h, w, h, wall);
    rect(x, bx + w - 3, gy - h, 3, h, wallSh);
    rect(x, bx, gy - h, w, 1, '#5a3a24'); rect(x, bx, gy - 3, w, 3, '#7a7280'); rect(x, bx, gy - 3, w, 1, '#9a92a0');
    for (let i = 0; i < w; i += 9) rect(x, bx + i, gy - h, 1, h - 3, '#6a4428');
    // roof (gable toward us)
    const rh = Math.round(w * 0.42);
    for (let j = 0; j < rh; j++) {
      const half = Math.round((w / 2 + 2) * (j + 1) / rh);
      const cx = bx + w / 2;
      rect(x, cx - half, gy - h - rh + j, half * 2, 1, j % 3 === 0 ? roofSh : roof);
      rect(x, cx - half, gy - h - rh + j, 2, 1, roofHi);
    }
    rect(x, bx - 2, gy - h - 1, w + 4, 2, roofSh);
    // chimney
    if (o.chimney) { rect(x, bx + w * 0.7, gy - h - rh - 4, 4, rh, '#6a5a5a'); rect(x, bx + w * 0.7 - 1, gy - h - rh - 5, 6, 2, '#4a3a3a'); }
    // windows and door
    const lit = o.lit;
    const win = (wx, wy) => {
      rect(x, wx - 1, wy - 1, 8, 9, '#4a2c18');
      rect(x, wx, wy, 6, 7, lit ? '#ffd27a' : '#1c2448');
      if (lit) { rect(x, wx, wy, 3, 3, '#fff0c0'); }
      rect(x, wx + 2, wy, 1, 7, '#4a2c18'); rect(x, wx, wy + 3, 6, 1, '#4a2c18');
      rect(x, wx - 1, wy + 7, 8, 1, '#8a5a30');
    };
    win(bx + 4, gy - h + 4);
    if (w > 26) win(bx + w - 12, gy - h + 4);
    rect(x, bx + w / 2 - 3, gy - 12, 7, 9, '#3a2010'); rect(x, bx + w / 2 - 2, gy - 11, 5, 8, '#7a4a28');
  }
  function lampPost(x, lx, gy, lit) {
    rect(x, lx, gy - 26, 2, 26, '#2a2434'); rect(x, lx - 1, gy - 2, 4, 2, '#2a2434');
    rect(x, lx - 2, gy - 32, 6, 6, lit ? '#ffb850' : '#4a3a40'); rect(x, lx - 3, gy - 33, 8, 1, '#2a2434'); rect(x, lx - 2, gy - 26, 6, 1, '#2a2434');
    if (lit) { rect(x, lx - 1, gy - 31, 2, 2, '#fff0c0'); }
  }

  /* ---------- the regions ---------- */
  const defs = {
    harbor: {
      floor: { tex: 'cobble', fog: [60, 30, 50], fogAmt: 0.55 },
      paint(x, W, Hh, hy, night) {
        const sky = night ? ['#060818', '#0a0e26', '#101634', '#151c40', '#1a224a', '#202a54', '#28305c'] : ['#2a1a50', '#40246a', '#5e2e78', '#82387a', '#a84a6e', '#d06a5a', '#f09a5a', '#f8c070'];
        bands(x, W, 0, hy - 18, sky);
        if (night) stars(x, W, 0, hy - 30, 70, 11);
        else {
          // the setting sun, sliced by bands
          const sx = W * 0.72, sy = hy - 30;
          for (let j = -12; j <= 12; j++) { const ww = Math.round(Math.sqrt(144 - j * j)); if (j > 2 && j % 3 === 0) continue; rect(x, sx - ww, sy + j, ww * 2, 1, j < -4 ? '#fff4c0' : j < 4 ? '#ffd880' : '#ffa850'); }
        }
        // clouds
        const cl = night ? ['#3a4270', '#283058', '#1a2044'] : ['#ffd0a0', '#d07a88', '#7a3a70'];
        cloud(x, W * 0.2, hy * 0.25, 28, 6, ...cl); cloud(x, W * 0.62, hy * 0.12, 22, 5, ...cl); cloud(x, W * 0.9, hy * 0.42, 26, 6, ...cl);
        // far islands over the sea of clouds
        const isl = night ? ['#1c2440', '#121830'] : ['#7a4a78', '#4a2a58'];
        islet(x, W * 0.12, hy - 30, 14, isl[0], isl[1], 3); islet(x, W * 0.5, hy - 36, 9, isl[0], isl[1], 5); islet(x, W * 0.86, hy - 26, 16, isl[0], isl[1], 7);
        bands(x, W, hy - 18, hy, night ? ['#2a3050', '#343a5c', '#3e4466'] : ['#f0b090', '#e89a8a', '#c8828a']);
        // the row of cottages along the quay
        let bx = -8, i = 0;
        while (bx < W) {
          const w = 30 + Math.floor(H(i, 3, 3) * 12), h = 18 + Math.floor(H(i, 4, 3) * 6);
          house(x, bx, hy + 2, w, h, {
            lit: !night && H(i, 5, 3) > 0.2, chimney: H(i, 6, 3) > 0.4,
            roof: ['#b0402e', '#4a5a9a', '#a85a2a', '#6a3a5a'][i % 4], roofHi: ['#d8604a', '#6a7ac0', '#d07a40', '#8a5a7a'][i % 4], roofSh: ['#6a2018', '#2a3260', '#6a3010', '#3a1a30'][i % 4],
            wall: night ? '#7a7a98' : '#ecd8b4', wallSh: night ? '#5a5a78' : '#bca07c',
          });
          bx += w + 3 + Math.floor(H(i, 7, 3) * 6); i++;
        }
        rect(x, 0, hy + 2, W, 1, night ? '#1a1a2a' : '#4a3a34');
      },
      animate(ctx, W, fh, hy, t, night) {
        for (let lx = 14; lx < W; lx += 52) {
          lampPost(ctx, lx, hy + 8, !night);
          if (!night) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45 + Math.sin(t / 140 + lx) * 0.05; ctx.drawImage(G.pix.glow('#ffa040', 22), lx + 1 - 22, hy - 21 - 22); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
        }
      },
    },
    conservatory: {
      floor: { tex: 'marble', fog: [16, 20, 60], fogAmt: 0.7 },
      paint(x, W, Hh, hy) {
        // the great hall's back wall
        bands(x, W, 0, hy, ['#141a40', '#18204c', '#1e2858', '#243064', '#2a3870']);
        // tall arched windows onto the night sky
        const ww = 26, gap = 46;
        for (let wx = 10; wx < W; wx += gap) {
          const top = 8, bot = hy - 10;
          for (let y = top; y < bot; y++) {
            const k = y - top, half = k < ww / 2 ? Math.round(Math.sqrt((ww / 2) ** 2 - (ww / 2 - k) ** 2)) : ww / 2;
            rect(x, wx + ww / 2 - half - 2, y, half * 2 + 4, 1, '#c8a040');
            rect(x, wx + ww / 2 - half, y, half * 2, 1, y < top + (bot - top) * 0.5 ? '#0a1030' : '#121a44');
          }
          stars(x, ww, 0, 0, 0, 0);
          for (let i = 0; i < 14; i++) { const sx = wx + 2 + Math.floor(H(i, wx, 1) * (ww - 4)), sy = top + 6 + Math.floor(H(i, wx, 2) * (bot - top - 8)); x.fillStyle = H(i, wx, 3) > 0.7 ? '#ffffff' : '#8890d0'; x.fillRect(sx, sy, 1, 1); }
          rect(x, wx + ww / 2 - 1, top + 2, 2, bot - top - 2, '#c8a040'); rect(x, wx, top + (bot - top) * 0.55, ww, 2, '#c8a040');
          rect(x, wx - 3, bot, ww + 6, 3, '#e0c060'); rect(x, wx - 3, bot + 3, ww + 6, 1, '#6a5020');
        }
        // marble pillars between the windows
        for (let px = 10 + ww + 4; px < W; px += gap) {
          rect(x, px, 0, 12, hy, '#c8cce0'); rect(x, px, 0, 3, hy, '#eceef8'); rect(x, px + 9, 0, 3, hy, '#8a90b0');
          for (let k = 4; k < 9; k += 2) rect(x, px + k, 0, 1, hy, '#a8acc8');
          rect(x, px - 2, hy - 6, 16, 6, '#e0c060'); rect(x, px - 2, hy - 1, 16, 1, '#6a5020');
          rect(x, px - 2, 0, 16, 4, '#e0c060');
        }
        rect(x, 0, hy - 1, W, 1, '#e8d080');
      },
      animate(ctx, W, fh, hy, t) {
        // aurora ribbons drift through the windows
        G.sky.ribbons(ctx, t, 0.35, 0.1);
      },
    },
    vault: {
      floor: { tex: 'carpetPlanks', fog: [10, 6, 14], fogAmt: 0.85 },
      paint(x, W, Hh, hy) {
        rect(x, 0, 0, W, hy, '#140c14');
        // towering shelves of the Records Vault
        const books = ['#8a2a2a', '#2a6a3a', '#2a3a8a', '#a8802a', '#5a2a7a', '#c8c0b0', '#9a4a1a'];
        for (let sx = 0; sx < W; sx += 40) {
          rect(x, sx, 0, 38, hy, '#3a2214'); rect(x, sx, 0, 2, hy, '#5a3622'); rect(x, sx + 36, 0, 2, hy, '#22140a');
          for (let sy = 4; sy < hy - 8; sy += 14) {
            rect(x, sx + 2, sy + 11, 34, 2, '#5a3622'); rect(x, sx + 2, sy + 13, 34, 1, '#1a0e08');
            let bx = sx + 3, i = 0;
            while (bx < sx + 35) {
              const bw = 2 + Math.floor(H(bx, sy, 1) * 2), bh = 7 + Math.floor(H(bx, sy, 2) * 4), c = books[Math.floor(H(bx, sy, 3) * books.length)];
              if (H(bx, sy, 9) > 0.92) { bx += 3; continue; }
              rect(x, bx, sy + 11 - bh, bw, bh, c); rect(x, bx, sy + 11 - bh, 1, bh, U.shade(c, 0.25)); rect(x, bx, sy + 11 - bh + 2, bw, 1, '#e0c070');
              bx += bw; i++;
            }
          }
        }
        // darkness gathers at the top
        for (let y = 0; y < hy * 0.5; y++) { x.globalAlpha = (1 - y / (hy * 0.5)) * 0.85; rect(x, 0, y, W, 1, '#0a060c'); }
        x.globalAlpha = 1;
        rect(x, 0, hy - 2, W, 2, '#1a0e08');
      },
      animate(ctx, W, fh, hy, t) {
        for (let cx = 20; cx < W; cx += 60) {
          const fl = Math.floor(t / 90 + cx) % 2;
          rect(ctx, cx, hy - 26, 4, 8, '#e8e0d0'); rect(ctx, cx - 2, hy - 18, 8, 2, '#c8a040');
          rect(ctx, cx + 1, hy - 29 - fl, 2, 3, '#ffd060'); rect(ctx, cx + 1, hy - 28, 1, 1, '#fff8c0');
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.05 * fl; ctx.drawImage(G.pix.glow('#ff9a40', 26), cx + 2 - 26, hy - 27 - 26); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
      },
    },
  };
  defs.harborDark = Object.assign({}, defs.harbor, {
    floor: { tex: 'cobble', fog: [6, 8, 24], fogAmt: 0.8 },
    paint: (x, W, Hh, hy) => defs.harbor.paint(x, W, Hh, hy, true),
    animate: (ctx, W, fh, hy, t) => defs.harbor.animate(ctx, W, fh, hy, t, true),
    tint: 'rgba(10,16,48,0.35)',
  });

  const cache = {};
  function build(id, W, fh) {
    const key = id + ':' + W + 'x' + fh;
    if (cache[key]) return cache[key];
    const d = defs[id] || defs.harbor;
    const hy = Math.round(Math.min(fh * 0.42, 110));
    const { c, x } = G.gfx.makeCanvas(W, fh);
    d.paint(x, W, fh, hy);
    const fl = d.floor;
    floor(x, W, hy + 3, fh, TEX[fl.tex], fl);
    // floor shading: darker at the far edge and the front lip
    if (d.tint) { x.fillStyle = d.tint; x.fillRect(0, 0, W, fh); }
    return (cache[key] = { c, hy, d });
  }

  G.backdrops = {
    defs, TEX, floor, bands, stars, cloud, islet,
    horizon(id, W, fh) { return build(id, W, fh).hy; },
    draw(ctx, id, W, fh, t) {
      const bd = build(id, W, fh);
      ctx.drawImage(bd.c, 0, 0);
      if (bd.d.animate) bd.d.animate(ctx, W, fh, bd.hy, t);
    },
  };
})();
