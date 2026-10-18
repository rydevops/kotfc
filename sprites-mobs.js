/* =========================================================================
   sprites-mobs.js — painted monsters, in the manner of 16-bit JRPG foes.

   Each design is an authored MASK (letters = materials) at half size. The
   painter smooths it with Scale2x, builds a height field for every part,
   lights it from the top-left with hue-shifted ramps, carves creases where
   parts overlap, rims the silhouette with a dark selective outline, then
   runs the design's `detail` pass for eyes, rivets, runes and glints.

   Material fields:
     c: base colour          r: roundness radius (px)   z: stacking order
     rough: surface noise    tex: 'scale'|'fur'|'stone'|'metal'|'cloth'
     glow: emissive (0-1)    shine: specular (0-1)       flat: no shading
   Mobs pick a design with `art`, recolour with `pal: { key: '#hex' }`.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const A = G.art;

  /* ---------------- Scale2x (EPX) ---------------- */
  function scale2x(g) {
    const o = A.blank(g.w * 2, g.h * 2);
    const at = (x, y) => A.get(g, x, y);
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const P = at(x, y), Au = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
      let e0 = P, e1 = P, e2 = P, e3 = P;
      if (C === Au && C !== D && Au !== B) e0 = Au;
      if (Au === B && Au !== C && B !== D) e1 = B;
      if (D === C && D !== B && C !== Au) e2 = C;
      if (B === D && B !== Au && D !== C) e3 = D;
      A.set(o, x * 2, y * 2, e0); A.set(o, x * 2 + 1, y * 2, e1);
      A.set(o, x * 2, y * 2 + 1, e2); A.set(o, x * 2 + 1, y * 2 + 1, e3);
    }
    return o;
  }

  /* ---------------- colour ramps ---------------- */
  const rampCache = {};
  function ramp(base, n = 8) {
    const k = base + n;
    if (rampCache[k]) return rampCache[k];
    // dark, cool shadows → warm, bright highlights
    const r = G.pix.ramp(base, n, 0.78, 34);
    return (rampCache[k] = r.map((h) => U.hexToRgb(h)));
  }

  /* ---------------- value noise for textures ---------------- */
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const sm = (t) => t * t * (3 - 2 * t);
    const h = (a, b) => U.hash(a, b, s);
    return U.lerp(U.lerp(h(xi, yi), h(xi + 1, yi), sm(xf)), U.lerp(h(xi, yi + 1), h(xi + 1, yi + 1), sm(xf)), sm(yf));
  }
  const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);

  /* ---------------- the painter ---------------- */
  function paint(def, pal, opts = {}) {
    let g = A.grid(def.mask);
    if (def.mask.some((r) => r.length !== def.mask[0].length)) console.warn('ragged mask', def.mask.map((r) => r.length));
    if (opts.scale !== 1) g = scale2x(g);
    const w = g.w, h = g.h, N = w * h;
    const mats = {};
    for (const k in def.mats) {
      const m = Object.assign({ r: 5, z: 1, rough: 0, glow: 0, shine: 0.25, n: 8 }, def.mats[k]);
      m.color = pal[m.c] || m.c;
      if (m.dark) m.darkColor = pal[m.dark] || m.dark;
      m.ramp = ramp(m.color, m.n);
      mats[k] = m;
    }
    const mat = (i) => mats[g.d[i]];
    const grp = (i) => { const m = mat(i); return m ? (m.group || g.d[i]) : null; };
    // --- distance to the edge of each part (chamfer 3-4) ---
    const dist = new Float32Array(N).fill(1e9);
    for (let i = 0; i < N; i++) {
      if (!mat(i)) { dist[i] = 0; continue; }
      const x = i % w, y = (i / w) | 0, me = grp(i);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h || grp(yy * w + xx) !== me) { dist[i] = 1; break; }
      }
    }
    const relax = (i, j, c) => { if (grp(i) === grp(j) && dist[j] + c < dist[i]) dist[i] = dist[j] + c; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!mat(i)) continue;
      if (x > 0) relax(i, i - 1, 1); if (y > 0) relax(i, i - w, 1);
      if (x > 0 && y > 0) relax(i, i - w - 1, 1.4); if (x < w - 1 && y > 0) relax(i, i - w + 1, 1.4);
    }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x; if (!mat(i)) continue;
      if (x < w - 1) relax(i, i + 1, 1); if (y < h - 1) relax(i, i + w, 1);
      if (x < w - 1 && y < h - 1) relax(i, i + w + 1, 1.4); if (x > 0 && y < h - 1) relax(i, i + w - 1, 1.4);
    }
    // --- distance to the silhouette (the whole creature's volume) ---
    const gd = new Float32Array(N).fill(1e9);
    for (let i = 0; i < N; i++) if (!mat(i)) gd[i] = 0;
    const rel2 = (i, j, c) => { if (gd[j] + c < gd[i]) gd[i] = gd[j] + c; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!mat(i)) continue; if (x > 0) rel2(i, i - 1, 1); else gd[i] = Math.min(gd[i], 1); if (y > 0) rel2(i, i - w, 1); else gd[i] = Math.min(gd[i], 1); if (x > 0 && y > 0) rel2(i, i - w - 1, 1.4); if (x < w - 1 && y > 0) rel2(i, i - w + 1, 1.4); }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (!mat(i)) continue; if (x < w - 1) rel2(i, i + 1, 1); else gd[i] = Math.min(gd[i], 1); if (y < h - 1) rel2(i, i + w, 1); else gd[i] = Math.min(gd[i], 1); if (x < w - 1 && y < h - 1) rel2(i, i + w + 1, 1.4); if (x > 0 && y < h - 1) rel2(i, i + w - 1, 1.4); }
    const GR = def.volume || Math.min(w, h) * 0.3;
    const GH = new Float32Array(N);
    for (let i = 0; i < N; i++) { const d = Math.min(gd[i], GR) / GR; GH[i] = Math.sqrt(1 - (1 - d) * (1 - d)) * GR; }
    // --- height field ---
    const H = new Float32Array(N);
    const seed = def.seed || 7;
    for (let i = 0; i < N; i++) {
      const m = mat(i); if (!m) continue;
      const x = i % w, y = (i / w) | 0;
      const R = m.r, d = Math.min(dist[i], R) / R;
      let z = Math.sqrt(1 - (1 - d) * (1 - d)) * R;
      if (m.rough) z += (vnoise(x / 2.2, y / 2.2, seed) - 0.5) * m.rough * 2 + (U.hash(x, y, seed) - 0.5) * m.rough * 0.6;
      if (m.tex === 'fur') z += (vnoise(x / 1.2, y / 4.5, seed + 3) - 0.5) * 2.6;
      if (m.tex === 'scale') { const sx = x + ((y >> 2) & 1) * 2; z -= ((sx % 4 === 0) || (y % 4 === 0) ? 0.9 : 0); }
      if (m.tex === 'stone') z += (vnoise(x / 3, y / 3, seed + 5) > 0.72 ? -1.5 : 0) + (vnoise(x / 1.5, y / 1.5, seed + 9) - 0.5) * 1.2;
      if (m.tex === 'cloth') z += Math.sin(x * 0.9 + vnoise(x / 4, y / 6, seed) * 6) * 0.5;
      if (m.tex === 'metal') z += 0;
      H[i] = z + m.z * 0.01;
    }
    // --- shade ---
    const L = (() => { const v = def.light || [-0.55, -0.75, 0.62]; const l = Math.hypot(...v); return v.map((a) => a / l); })();
    const out = new Uint8ClampedArray(N * 4);
    const level = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const m = mat(i); if (!m) continue;
      const x = i % w, y = (i / w) | 0, me = grp(i);
      const hAt = (xx, yy) => { if (xx < 0 || yy < 0 || xx >= w || yy >= h) return H[i] - 1.5; const j = yy * w + xx; return grp(j) === me ? H[j] : !mat(j) ? H[i] - 1.5 : H[i]; };
      const gAt = (xx, yy) => (xx < 0 || yy < 0 || xx >= w || yy >= h ? 0 : GH[yy * w + xx]);
      const vol = m.volume != null ? m.volume : 0.7;
      const gx = (hAt(x + 1, y) - hAt(x - 1, y)) / 2 + (gAt(x + 1, y) - gAt(x - 1, y)) / 2 * vol;
      const gy = (hAt(x, y + 1) - hAt(x, y - 1)) / 2 + (gAt(x, y + 1) - gAt(x, y - 1)) / 2 * vol;
      const nl = Math.hypot(gx, gy, 1);
      const nx = -gx / nl, ny = -gy / nl, nz = 1 / nl;
      let diff = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      // half-lambert keeps the shadow side readable
      let v = m.flat ? 0.62 : 0.04 + Math.pow(diff, 1.35) * 1.0;
      // specular
      if (m.shine) { const rz = 2 * diff * nz - L[2]; v += Math.pow(Math.max(0, rz), 12) * m.shine; }
      // soft ambient occlusion: lower parts near higher neighbours get darker
      if (!m.flat) v -= Math.min(0.18, Math.max(0, (m.r - dist[i]) / m.r) * 0.06);
      if (m.glow) v = v * (1 - m.glow) + m.glow * (0.55 + 0.45 * Math.min(1, dist[i] / m.r));
      // a gentle top-to-bottom gradient (light from above)
      v -= (y / h - 0.4) * (m.flat ? 0 : 0.12);
      level[i] = v;
    }
    for (let i = 0; i < N; i++) {
      const m = mat(i); if (!m) continue;
      const x = i % w, y = (i / w) | 0, me = grp(i);
      let v = level[i];
      // crease: darken where a part tucks under a higher one
      let crease = 0, edge = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        const j = yy * w + xx;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h || !mat(j)) { edge = true; continue; }
        if (grp(j) !== me && mat(j).z > m.z && !mat(j).glow) crease = Math.max(crease, mat(j).z - m.z >= 1 ? 1 : 0.5);
      }
      const n = m.ramp.length;
      let idx = v * (n - 1) + BAYER4[(y & 3) * 4 + (x & 3)] * (m.dither != null ? m.dither : m.glow ? 0 : 0.32);
      idx = Math.round(idx - crease * 2.2);
      if (edge && !m.glow) idx = Math.min(idx, 1) - (dist[i] <= 1 && v < 0.5 ? 1 : 0);
      idx = U.clamp(idx, 0, n - 1);
      let col = m.ramp[idx];
      if (edge && !m.glow && idx <= 0) col = m.darkColor ? U.hexToRgb(m.darkColor) : darker(m.ramp[0]);
      out[i * 4] = col[0]; out[i * 4 + 1] = col[1]; out[i * 4 + 2] = col[2]; out[i * 4 + 3] = 255;
    }
    // --- detail pass ---
    const px = {
      w, h, g,
      set(x, y, hex, a = 1) {
        x = Math.round(x); y = Math.round(y);
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const i = (y * w + x) * 4, c = U.hexToRgb(hex);
        if (a >= 1 || out[i + 3] === 0) { out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255; return; }
        out[i] = out[i] * (1 - a) + c[0] * a; out[i + 1] = out[i + 1] * (1 - a) + c[1] * a; out[i + 2] = out[i + 2] * (1 - a) + c[2] * a;
      },
      get(x, y) { const i = (y * w + x) * 4; return out[i + 3] ? [out[i], out[i + 1], out[i + 2]] : null; },
      mat(x, y) { return A.get(g, x, y); },
      tint(x, y, f) { // f > 0 lighten, < 0 darken
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const i = (y * w + x) * 4; if (!out[i + 3]) return;
        for (let k = 0; k < 3; k++) out[i + k] = f > 0 ? out[i + k] + (255 - out[i + k]) * f : out[i + k] * (1 + f);
      },
      ramp: (hex, n) => ramp(pal[hex] || hex, n).map((c) => U.rgbToHex(...c)),
      pal,
      // find mask cells (in output pixels) of a material
      each(ch, fn) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.d[y * w + x] === ch) fn(x, y); },
      bounds(ch) { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; px.each(ch, (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }); return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }; },
      line(x0, y0, x1, y1, hex, a) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) px.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, hex, a); },
      scale: opts.scale === 1 ? 0.5 : 1,
    };
    if (def.detail) def.detail(px, pal);
    return A.canvasFromRGBA(w, h, out);
  }
  function darker(c) { return [c[0] * 0.55, c[1] * 0.5, c[2] * 0.62].map(Math.round); }

  /* ======================= DESIGNS ======================= */
  const ART = {};

  /* ---------------- Rift Wisp: a flame of torn sky with one curious eye ---------------- */
  ART.wisp = {
    pal: { body: '#7a34e0', core: '#ff9ae8', iris: '#ffc830', shard: '#b890ff' },
    mats: {
      f: { c: 'body', r: 7, z: 1, glow: 0.25, shine: 0.4 },
      t: { c: 'body', r: 3, z: 0, glow: 0.15 },
      c: { c: 'core', r: 5, z: 2, glow: 0.65 },
      E: { c: '#f8f0ff', r: 4, z: 3, shine: 0.8, dither: 0.1 },
      s: { c: 'shard', r: 2, z: 1, shine: 1, dither: 0 },
    },
    mask: [
      '........................',
      '...........f............',
      '..........ff.....f......',
      '.....f....fff...ff......',
      '.....ff..ffff..fff......',
      '......fffffffffff...f...',
      '......ffffffffffff.ff...',
      '.....ffffffffffffffff...',
      '....fffffffcccffffff....',
      '...ffffffcccccccfffff...',
      '...fffffcccEEEccccffff..',
      '..ffffffccEEEEEccfffff..',
      '..fffffccEEEEEEEcfffff..',
      '..fffffccEEEEEEEcfffff..',
      '..ffffffccEEEEEccffff...',
      '...fffffcccEEEcccffff...',
      '...ffffffcccccccffff....',
      '....fffffffcccffffff....',
      '.....ffffffffffffff.....',
      '......ffffffffffff......',
      '.......tttfffffff.......',
      '.....tttt...............',
      '....tt..................',
      '...t....................',
    ],
    detail(px) {
      const e = px.bounds('E');
      const cx = e.cx + 1, cy = e.cy + 0.5;
      const iris = px.ramp('iris', 5);
      for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) {
        const d = Math.hypot(x, y * 1.1);
        if (d <= 4.2) px.set(cx + x, cy + y, d > 3.2 ? iris[1] : y < -1 ? iris[4] : iris[3]);
      }
      for (let y = -2; y <= 2; y++) for (let x = -1; x <= 1; x++) if (Math.abs(x) + Math.abs(y) < 3) px.set(cx + x, cy + y, '#1a0626');
      px.set(cx - 2, cy - 3, '#ffffff'); px.set(cx - 3, cy - 2, '#ffffff'); px.set(cx - 2, cy - 2, '#ffffff');
      px.set(cx + 2, cy + 2, '#ffe9a0');
      // eyelid line
      const lid = px.ramp('body', 8)[1];
      for (let x = e.x0 + 1; x <= e.x1 - 1; x++) px.set(x, e.y0, lid);
      // orbiting rift shards
      const sh = px.ramp('shard', 5);
      for (const [x, y, r] of [[3, 14, 3], [42, 9, 2], [43, 33, 3], [5, 34, 2]]) {
        for (let k = -r; k <= r; k++) { const ww = r - Math.abs(k); for (let j = -ww; j <= ww; j++) px.set(x + j, y + k, j < 0 ? sh[3] : j > 0 ? sh[1] : sh[2]); }
        px.set(x, y - r, '#ffffff'); px.set(x - 1, y, sh[4]);
      }
      // flickering sparks inside the flame
      for (let i = 0; i < 14; i++) {
        const x = Math.floor(U.hash(i, 3, 9) * px.w), y = Math.floor(U.hash(i, 4, 9) * px.h * 0.8);
        if (px.mat(x, y) === 'f') px.set(x, y, '#f4d0ff');
      }
    },
  };


  /* mask builder for machine-like designs: primitives on a letter grid */
  function build(w, h, fn) {
    const g = A.blank(w, h);
    const put = (x, y, ch) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) g.d[y * w + x] = ch; };
    const M = {
      ell(cx, cy, rx, ry, ch, clip) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx - 0.5) / rx, dy = (y + 0.5 - cy - 0.5) / ry; if (dx * dx + dy * dy <= 1 && (!clip || clip(x, y))) put(x, y, ch); } },
      rect(x, y, ww, hh, ch) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) put(x + i, y + j, ch); },
      line(x0, y0, x1, y1, ch, th = 1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) || 1; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; M.ell(x, y, th / 2, th / 2, ch); } },
      poly(pts, ch) {
        const ys = pts.map((p) => p[1]);
        for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) for (let x = 0; x < w; x++) {
          let inside = false; const px = x + 0.5, py = y + 0.5;
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside; }
          if (inside) put(x, y, ch);
        }
      },
      stamp(x, y, rows) { rows.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') put(x + i, y + j, c); })); },
    };
    fn(M);
    const rows = [];
    for (let y = 0; y < h; y++) rows.push(g.d.slice(y * w, y * w + w).join(''));
    return rows;
  }

  /* ---------------- Seam Crawler: it crawls along the cracks between worlds ---------------- */
  ART.crawler = {
    pal: { body: '#4a2a6a', seam: '#ff5ad0', leg: '#2e1e40', eye: '#ff4a7a' },
    mats: {
      b: { c: 'body', r: 8, z: 1, shine: 0.7 },
      h: { c: 'body', r: 4, z: 2, shine: 0.6 },
      a: { c: 'leg', r: 2, z: 2, shine: 0.4 },
      p: { c: 'body', r: 3, z: 3, shine: 0.8 },
      l: { c: 'leg', r: 1.5, z: 0, shine: 0.3 },
    },
    mask: [
      '........................',
      '........................',
      '...................pp...',
      '..................pppp..',
      '.................ppp.pp.',
      '.................pp...p.',
      '......bbbbbbb.....aa....',
      '....bbbbbbbbbbb..aa.....',
      '...bbbbbbbbbbbbbaa......',
      '..bbbbbbbbbbbbbbhhh.....',
      '..bbbbbbbbbbbbbhhhhh....',
      '..bbbbbbbbbbbbbhhhhhh...',
      '..bbbbbbbbbbbbbhhhhhh...',
      '...bbbbbbbbbbbbhhhhh.pp.',
      '...bbbbbbbbbbbbbhhh.ppp.',
      '....bbbbbbbbbbbbbaaapp..',
      '.....bbbbbbbbbbbb.......',
      '....l..l..l..l..l.l.....',
      '...l..l...l..l...l.l....',
      '..l..l...l....l...l.l...',
      '..l..l...l....l....l.l..',
      '.l..l...l......l....l..l',
      '.l..l...l......l.....l..',
      '........................',
    ],
    detail(px) {
      const seam = px.ramp('seam', 6);
      // glowing seams split the carapace
      const cracks = [[[8, 16], [14, 20], [20, 18], [26, 24], [30, 22]], [[16, 12], [18, 18]], [[22, 28], [26, 24]], [[10, 26], [16, 24], [20, 30]]];
      for (const c of cracks) for (let k = 0; k < c.length - 1; k++) {
        const [x0, y0] = c[k], [x1, y1] = c[k + 1];
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let i = 0; i <= n; i++) {
          const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
          if (px.mat(x, y) !== 'b') continue;
          px.set(x, y, seam[5]); px.set(x, y + 1, seam[2]); px.set(x + 1, y, seam[3], 0.6); px.set(x, y - 1, seam[1], 0.5);
        }
      }
      // a cluster of eyes on the head
      const h = px.bounds('h');
      const eye = px.ramp('eye', 5);
      for (const [dx, dy, r] of [[7, -2, 1], [8, 2, 1], [4, 0, 1.5], [3, 4, 1]]) {
        const ex = h.cx + dx - 2, ey = h.cy + dy - 1;
        px.set(ex, ey, eye[3]); px.set(ex + 1, ey, eye[2]); px.set(ex, ey + 1, eye[1]); px.set(ex + 1, ey + 1, eye[1]);
        px.set(ex, ey, '#ffffff', 0.85);
      }
      // ridge highlights along the shell
      for (let x = 10; x < 30; x += 3) px.tint(x, 14 + Math.round(Math.sin(x / 3) * 1), 0.35);
    },
  };

  /* ---------------- Stormmoth: drawn to lanterns ---------------- */
  ART.moth = {
    pal: { wing: '#6a7cc8', wing2: '#3e4a90', body: '#d8c8a0', spot: '#ffe040', eye: '#40e0ff' },
    mats: {
      w: { c: 'wing', r: 2.5, z: 1, shine: 0.3, volume: 0.35 },
      W: { c: 'wing2', r: 2.5, z: 0, shine: 0.2, volume: 0.35 },
      b: { c: 'body', r: 3, z: 2, tex: 'fur', shine: 0.1 },
      h: { c: 'body', r: 2.5, z: 3, tex: 'fur' },
      a: { c: 'body', r: 1, z: 1 },
    },
    mask: [
      '........................',
      '..ww.....a....a.....ww..',
      '.wwww.....a..a.....wwww.',
      '.wwwwww....aa....wwwwww.',
      'wwwwwwwww.hhhh.wwwwwwwww',
      'wwwwwwwwwwhhhhwwwwwwwwww',
      '.wwwwwwwwwbbbbwwwwwwwww.',
      '.wwwwwwwwwbbbbwwwwwwwww.',
      '..wwwwwwwwbbbbwwwwwwww..',
      '...wwwwwwwbbbbwwwwwww...',
      '....wwwwwwbbbbwwwwww....',
      '.....WWWWWbbbbWWWWW.....',
      '....WWWWWWbbbbWWWWWW....',
      '...WWWWWWWbbbbWWWWWWW...',
      '...WWWWWWW.bb.WWWWWWW...',
      '....WWWWW..bb..WWWWW....',
      '.....WWW...bb...WWW.....',
      '...........bb...........',
      '...........b............',
      '........................',
    ],
    detail(px) {
      const sp = px.ramp('spot', 5), w = px.ramp('wing', 8), w2 = px.ramp('wing2', 8);
      // dusty bands following the wing edge
      px.each('w', (x, y) => { const d = (x < 24 ? x : 47 - x) + y * 0.5; if (d % 7 < 1.2) px.tint(x, y, 0.18); });
      // eyespots
      for (const cx of [9, 38]) {
        for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) { const d = Math.hypot(x, y); if (d <= 3.4) px.set(cx + x, 12 + y, d > 2.4 ? w[0] : d > 1.3 ? sp[3] : '#1a1030'); }
        px.set(cx - 1, 11, '#ffffff');
      }
      // a bright band on the lower wings
      px.each('W', (x, y) => { if (y === 28 || y === 29) px.set(x, y, sp[2], 0.5); });
      // veins
      for (const [x0, y0, x1, y1] of [[20, 12, 3, 4], [20, 16, 2, 12], [27, 12, 44, 4], [27, 16, 45, 12], [20, 26, 8, 32], [27, 26, 39, 32]]) px.line(x0, y0, x1, y1, w2[2], 0.5);
      const h = px.bounds('h');
      px.set(h.x0 + 1, h.cy, px.pal.eye); px.set(h.x1 - 1, h.cy, px.pal.eye);
      px.set(h.x0 + 1, h.cy - 1, '#ffffff'); px.set(h.x1 - 1, h.cy - 1, '#ffffff');
      for (const [x, y] of [[2, 16], [45, 15], [4, 26], [43, 27]]) { px.set(x, y, '#fff8a0'); px.set(x + 1, y + 1, '#fff8a0', 0.6); }
    },
  };

  /* ---------------- Tap Guardian: the station's runaway automaton (boss) ---------------- */
  ART.guardian = {
    pal: { brass: '#c8963c', lens: '#ff3a2a', core: '#ffae38', iron: '#56566a', pipe: '#a85e38' },
    mats: {
      p: { c: 'pipe', r: 1.6, z: 0, shine: 0.6 },
      k: { c: 'iron', r: 2, z: 0, shine: 0.5 },
      q: { c: 'brass', r: 2.5, z: 0, shine: 0.7 },
      B: { c: 'brass', r: 12, z: 1, shine: 1.1, tex: 'metal' },
      R: { c: 'iron', r: 2, z: 2, shine: 0.6 },
      g: { c: 'core', r: 6, z: 3, glow: 0.75 },
      D: { c: 'iron', r: 2.5, z: 2, shine: 0.6 },
      H: { c: 'brass', r: 7, z: 2, shine: 1.1 },
      L: { c: 'lens', r: 2.5, z: 3, glow: 0.35, shine: 1.2 },
      A: { c: 'iron', r: 2.5, z: 3, shine: 0.6 },
      c: { c: 'brass', r: 3, z: 4, shine: 0.9 },
      F: { c: 'iron', r: 3, z: 0, shine: 0.5 },
    },
    mask: build(40, 40, (M) => {
      M.rect(4, 3, 2, 12, 'p'); M.rect(3, 2, 4, 2, 'p'); M.rect(8, 6, 2, 8, 'p'); M.rect(7, 5, 4, 2, 'p');
      M.line(8, 18, 4, 26, 'k', 2.6); M.ell(3.5, 27.5, 2.6, 2.2, 'q');
      M.rect(12, 30, 5, 6, 'F'); M.rect(23, 30, 5, 6, 'F'); M.ell(14, 36, 4.2, 2, 'F'); M.ell(25, 36, 4.2, 2, 'F');
      M.ell(19.5, 21, 13.5, 11.5, 'B');
      M.ell(21.5, 21, 7.4, 7, 'R'); M.ell(21.5, 21, 6, 5.6, 'g');
      M.ell(19.5, 9, 7.5, 6, 'H', (x, y) => y < 12);
      M.ell(24, 8.5, 2.8, 2.3, 'L');
      M.rect(12, 11, 16, 2, 'D');
      M.ell(31.5, 16, 3.2, 3, 'D');
      M.line(32, 17, 35, 26, 'A', 3);
      M.poly([[33, 26], [39, 25], [39.5, 28], [36, 28]], 'c'); M.poly([[33, 27.5], [37, 29], [38.5, 32], [34, 30.5]], 'c');
    }),
    detail(px) {
      const br = px.ramp('brass', 8), ir = px.ramp('iron', 8), co = px.ramp('core', 6);
      // rivets around the boiler
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 9) {
        const x = Math.round(39 + Math.cos(a) * 22), y = Math.round(42 + Math.sin(a) * 18.5);
        if (px.mat(x, y) === 'B') { px.set(x, y, br[7]); px.set(x + 1, y + 1, br[1]); }
      }
      // the lantern window: grille bars and a flickering flame
      const g = px.bounds('g');
      for (const dx of [-5, 0, 5]) for (let y = g.y0; y <= g.y1; y++) if (px.mat(Math.round(g.cx + dx), y) === 'g') { px.set(g.cx + dx, y, ir[2]); px.set(g.cx + dx + 1, y, ir[4]); }
      for (let y = -6; y <= 4; y++) for (let x = -3; x <= 3; x++) { const f = Math.abs(x) / (3.5 - (y + 6) * 0.15); if (f < 1 && y > -6 + Math.abs(x) * 1.5) px.set(g.cx - 1 + x, g.cy + y + 2, f < 0.4 ? '#fffbe0' : co[4]); }
      // the lens glint
      const L = px.bounds('L');
      px.set(L.x0 + 1, L.y0 + 1, '#ffffff'); px.set(L.x0 + 2, L.y0 + 1, '#ffd0c0'); px.set(L.x0 + 1, L.y0 + 2, '#ffd0c0');
      // panel seams on the body
      for (let y = 18; y < 60; y++) if (px.mat(13, y) === 'B') px.tint(13, y, -0.25);
      for (let x = 10; x < 70; x++) if (px.mat(x, 46) === 'B' && (x < 27 || x > 58)) px.tint(x, 46, -0.25);
      // head band
      for (let x = 24; x < 56; x++) if (px.mat(x, 14) === 'H') px.set(x, 14, br[2]);
      // steam from the pipes
      for (let i = 0; i < 9; i++) px.set(9 + U.hash(i, 1) * 6, 1 + i * 0.6, '#e8eef8', 0.35 + 0.05 * i);
    },
  };

  /* ---------------- Brass Sentry: the Conservatory's night guard ---------------- */
  ART.sentry = {
    pal: { brass: '#c09040', iron: '#4e5068', visor: '#6ff3ff', plume: '#c83a3a', lance: '#d8dce8' },
    mats: {
      P: { c: 'plume', r: 2, z: 0, tex: 'fur', shine: 0.2 },
      O: { c: 'iron', r: 3.5, z: 0, shine: 0.7 },
      F: { c: 'iron', r: 2, z: 0, shine: 0.6 },
      S: { c: 'brass', r: 2, z: 1, shine: 0.8 },
      B: { c: 'brass', r: 6, z: 1.5, shine: 1.1 },
      H: { c: 'brass', r: 4.5, z: 2, shine: 1.1 },
      V: { c: 'visor', r: 1, z: 3, glow: 0.8 },
      D: { c: 'brass', r: 2.5, z: 3, shine: 1 },
      n: { c: 'lance', r: 1, z: 4, shine: 1 },
      t: { c: 'lance', r: 2, z: 4, shine: 1.3 },
      a: { c: 'iron', r: 1.6, z: 5, shine: 0.6 },
    },
    mask: build(26, 30, (M) => {
      M.poly([[9, 0], [14, 0.5], [13, 4], [9, 5]], 'P'); M.poly([[6, 2], [10, 1], [10, 5]], 'P');
      M.ell(5, 16, 4, 5, 'O');
      M.rect(9, 21, 3, 6, 'F'); M.rect(14, 21, 3, 6, 'F'); M.ell(10, 27.5, 2.8, 1.4, 'F'); M.ell(16, 27.5, 2.8, 1.4, 'F');
      M.poly([[7, 18], [18, 18], [19.5, 23], [5.5, 23]], 'S');
      M.ell(12.5, 14, 6.5, 5.5, 'B');
      M.ell(12.5, 7, 4.6, 4.3, 'H');
      M.rect(14, 6, 4, 1, 'V');
      M.ell(7, 10.5, 2.8, 2.2, 'D'); M.ell(18, 10.5, 2.8, 2.2, 'D');
      M.line(21.5, 5, 21.5, 29, 'n', 1.2); M.poly([[21.5, 0], [23.6, 4], [21.5, 5.5], [19.4, 4]], 't');
      M.line(18, 12, 21, 16, 'a', 2);
    }),
    detail(px) {
      const br = px.ramp('brass', 8), ir = px.ramp('iron', 8);
      const cx = 25, cy = 28;
      for (const [dx, dy] of [[0, -2], [0, 2], [-2, 0], [2, 0], [0, 0], [-1, -1], [1, 1], [1, -1], [-1, 1]]) px.set(cx + dx, cy + dy, Math.abs(dx) + Math.abs(dy) === 2 && dx * dy === 0 ? br[7] : br[5]);
      px.set(cx, cy, '#ffffff');
      px.each('V', (x, y) => px.set(x, y, (x + y) % 3 ? '#bff8ff' : '#ffffff'));
      // shield boss and rim
      const o = px.bounds('O');
      for (let a = 0; a < 6.28; a += 0.2) px.set(o.cx + Math.cos(a) * (o.x1 - o.x0) / 2.2, o.cy + Math.sin(a) * (o.y1 - o.y0) / 2.2, br[4]);
      px.set(o.cx, o.cy, br[6]); px.set(o.cx - 1, o.cy - 1, br[7]);
      // lance gleam
      for (let y = 12; y < 56; y += 7) px.set(43, y, '#ffffff', 0.6);
    },
  };

  /* ---------------- Archive Golem: a bookcase that learned to walk (boss) ---------------- */
  ART.golem = {
    pal: { stone: '#7c7290', rune: '#6ff3ff', wood: '#6a3e24' },
    mats: {
      a: { c: 'stone', r: 4, z: 0, tex: 'stone', shine: 0.15 },
      L: { c: 'stone', r: 4, z: 0, tex: 'stone', shine: 0.15 },
      S: { c: 'stone', r: 7, z: 1, tex: 'stone', shine: 0.2 },
      K: { c: 'wood', r: 2, z: 0.5, flat: false, shine: 0.1 },
      h: { c: 'stone', r: 5, z: 2, tex: 'stone', shine: 0.2 },
      e: { c: 'rune', r: 1, z: 3, glow: 0.9 },
      A: { c: 'stone', r: 4.5, z: 3, tex: 'stone', shine: 0.2 },
      f: { c: 'stone', r: 4, z: 4, tex: 'stone', shine: 0.25 },
    },
    mask: build(36, 38, (M) => {
      M.rect(9, 28, 6, 8, 'L'); M.rect(21, 28, 6, 8, 'L'); M.ell(11.5, 36, 4.5, 1.8, 'L'); M.ell(24, 36, 4.5, 1.8, 'L');
      M.line(6, 13, 3, 26, 'a', 5); M.ell(3.5, 28, 3.6, 3.4, 'a');
      M.rect(7, 11, 22, 19, 'S'); M.ell(18, 12, 11, 3, 'S');
      M.rect(10, 15, 16, 5, 'K'); M.rect(10, 22, 16, 5, 'K');
      M.rect(12, 2, 12, 10, 'h'); M.ell(18, 2.5, 6, 2, 'h');
      M.rect(14, 6, 3, 2, 'e'); M.rect(20, 6, 3, 2, 'e');
      M.line(29, 13, 32, 25, 'A', 5); M.ell(32, 28, 4, 3.8, 'f');
    }),
    detail(px) {
      const st = px.ramp('stone', 8), ru = px.ramp('rune', 6);
      const books = ['#a83838', '#3a7a4a', '#3a52a8', '#c89838', '#7a3aa0', '#d8d0c0', '#b8602a'];
      // shelves of books
      for (const sy of [30, 44]) {
        let x = 21, i = 0;
        while (x < 51) {
          const bw = 2 + ((i * 7) % 3 === 0 ? 1 : 0), bh = 7 + ((i * 5) % 3) - (i % 4 === 0 ? 2 : 0);
          const col = books[(i * 3 + sy) % books.length], r = px.ramp(col, 5);
          for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) px.set(x + xx, sy + 9 - bh + yy, xx === 0 ? r[3] : xx === bw - 1 ? r[1] : r[2]);
          px.set(x, sy + 9 - bh, r[4]); if (bh > 6) px.set(x + 1, sy + 9 - bh + 2, '#f0d870');
          x += bw + (i % 5 === 4 ? 1 : 0); i++;
        }
        for (let xx = 20; xx < 52; xx++) { px.set(xx, sy + 9, st[1]); px.set(xx, sy + 10, st[0]); }
      }
      // glowing runes carved into the stone
      const runes = [[18, 26], [55, 26], [30, 60], [8, 40], [62, 40]];
      for (const [x, y] of runes) { px.set(x, y, ru[4]); px.set(x + 1, y, ru[3]); px.set(x, y + 1, ru[3]); px.set(x + 1, y + 2, ru[5]); px.set(x - 1, y + 2, ru[3]); }
      px.each('e', (x, y) => px.set(x, y, (x + y) % 2 ? ru[5] : '#ffffff'));
      // cracks
      for (const [x0, y0, x1, y1] of [[26, 6, 30, 14], [44, 22, 48, 26], [10, 52, 14, 56]]) px.line(x0, y0, x1, y1, st[1]);
      // floating pages
      for (const [x, y] of [[2, 6], [66, 4], [67, 52], [1, 64]]) { for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) px.set(x + i, y + j, j === 0 ? '#ffffff' : '#ece2c8'); px.line(x + 1, y + 2, x + 3, y + 2, '#a09080'); }
    },
  };

  /* ---------------- Gleamfin: a sky-fish (Act II) ---------------- */
  ART.fish = {
    pal: { body: '#3a8ac8', belly: '#d8f4ff', fin: '#7ad8f0' },
    mats: {
      t: { c: 'fin', r: 2, z: 0, tex: 'cloth' },
      b: { c: 'body', r: 6, z: 1, tex: 'scale', shine: 0.9 },
      y: { c: 'belly', r: 3, z: 2, shine: 0.5 },
      f: { c: 'fin', r: 2, z: 3, tex: 'cloth' },
    },
    mask: [
      '........................',
      '...........ff...........',
      '..........fff...........',
      '.........ffff...........',
      '.t.....bbbbbbbbb........',
      '.tt..bbbbbbbbbbbbb......',
      '.ttt.bbbbbbbbbbbbbbb....',
      '..ttbbbbbbbbbbbbbbbbb...',
      '..tttbbbbbbbbbbbbbbbbb..',
      '..ttbbbbbbbbbbbbbbbbbbb.',
      '.tttbbbyyyyyyyyyyyybbb..',
      '.tt..byyyyyyyyyyyyyyb...',
      '.t....yyyyyyyyyyyyy.....',
      '........fff..yyyy.......',
      '.........ff.............',
      '........................',
    ],
    detail(px) {
      const b = px.bounds('b');
      const ex = b.x1 - 7, ey = b.y0 + 9;
      px.set(ex, ey, '#ffffff'); px.set(ex + 1, ey, '#101828'); px.set(ex, ey + 1, '#101828'); px.set(ex + 1, ey + 1, '#101828');
      for (let x = b.x1 - 3; x > b.x1 - 6; x--) px.set(x, ey + 5, '#1a3050');
    },
  };

  /* ---------------- Mistfox: half of it is mist (Act II) ---------------- */
  ART.fox = {
    pal: { body: '#e0e4f0', mist: '#a8b8e0', eye: '#6ff3ff' },
    mats: {
      m: { c: 'mist', r: 5, z: 0, glow: 0.3, tex: 'fur' },
      b: { c: 'body', r: 5, z: 1, tex: 'fur', shine: 0.2 },
      h: { c: 'body', r: 4, z: 2, tex: 'fur' },
      l: { c: 'body', r: 1.5, z: 0.5 },
    },
    mask: [
      '........................',
      '.................h..h...',
      '.................hh.hh..',
      '................hhhhhh..',
      '................hhhhhhh.',
      '...............hhhhhhhhh',
      '.mmm...........hhhhhh...',
      'mmmmm.....bbbbbbhhhh....',
      'mmmmmm..bbbbbbbbbbb.....',
      '.mmmmmmbbbbbbbbbbbb.....',
      '..mmmmmbbbbbbbbbbbb.....',
      '...mmmmbbbbbbbbbbbb.....',
      '....mmmbbbbbbbbbbb......',
      '.......bbbbbbbbbbb......',
      '........l..l...l.l......',
      '........l..l...l.l......',
      '.......ll.ll..ll.ll.....',
      '........................',
    ],
    detail(px) {
      const h = px.bounds('h');
      px.set(h.x1 - 5, h.cy, px.pal.eye); px.set(h.x1 - 6, h.cy, px.pal.eye); px.set(h.x1 - 5, h.cy - 1, '#ffffff');
      px.set(h.x1, h.cy + 1, '#202030');
    },
  };

  /* ======================= public API ======================= */
  const cache = {};
  G.sprites.mob = function (mob) {
    const key = mob.id;
    if (cache[key]) return cache[key];
    let c;
    if (mob.art.startsWith('look:')) {
      const look = mob.art.slice(5);
      const b = G.sprites.battler(look, 'none');
      c = G.gfx.flipH(b.stand);
      if (mob.upscale && mob.upscale > 1) {
        const k = mob.upscale, big = G.gfx.makeCanvas(c.width * k, c.height * k);
        big.x.imageSmoothingEnabled = false;
        big.x.drawImage(c, 0, 0, c.width * k, c.height * k);
        c = big.c;
      }
    } else {
      const a = ART[mob.art] || ART.wisp;
      const natural = a.mask[0].length * 2;
      c = paint(a, Object.assign({}, a.pal, mob.pal || {}), { scale: 2 });
      if (mob.size && mob.size < natural * 0.9) c = resample(c, mob.size / natural);
    }
    return (cache[key] = c);
  };
  // smaller cousins of a design: a soft resample keeps the painted look
  function resample(src, k) {
    const w = Math.max(8, Math.round(src.width * k)), h = Math.max(8, Math.round(src.height * k));
    const t = document.createElement('canvas'); t.width = w; t.height = h;
    const x = t.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(src, 0, 0, w, h);
    const id = x.getImageData(0, 0, w, h);
    for (let i = 3; i < id.data.length; i += 4) id.data[i] = id.data[i] > 110 ? 255 : 0;
    x.putImageData(id, 0, 0);
    return t;
  }
  G.sprites.paintMonster = paint;
  G.sprites.ART = ART;
})();
