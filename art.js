/* =========================================================================
   art.js — the hand-pixelled sprite kit.
   Sprites are authored as ASCII "index" grids (one character = one pixel,
   '.' = transparent) and only coloured at the end with a palette, just like
   SNES sprites: the same drawing can be palette-swapped for different people.

     const g = G.art.grid(['.kk.', 'kssk', '.kk.']);
     G.art.blit(dst, g, x, y, { flip: true });
     G.art.outline(dst);              // dark rim around everything
     const canvas = G.art.paint(dst, { k: '#181020', s: '#f0c8a0' });
   ========================================================================= */
(function () {
  'use strict';
  const art = (G.art = {});

  /* A grid is { w, h, d: [char...] } */
  art.grid = function (rows) {
    if (typeof rows === 'string') rows = rows.replace(/^\n+|\s+$/g, '').split('\n').map((r) => r.trim());
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const d = new Array(w * h).fill('.');
    for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) d[y * w + x] = rows[y][x] === ' ' ? '.' : rows[y][x];
    return { w, h, d };
  };
  art.blank = (w, h) => ({ w, h, d: new Array(w * h).fill('.') });
  art.clone = (g) => ({ w: g.w, h: g.h, d: g.d.slice() });
  art.get = (g, x, y) => (x < 0 || y < 0 || x >= g.w || y >= g.h ? '.' : g.d[y * g.w + x]);
  art.set = (g, x, y, c) => { if (x >= 0 && y >= 0 && x < g.w && y < g.h) g.d[y * g.w + x] = c; };

  /* copy src onto dst. opts.flip mirrors; opts.map renames characters;
     opts.under only paints where dst is empty; opts.only limits to chars */
  art.blit = function (dst, src, ox, oy, opts = {}) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      let c = src.d[y * src.w + (opts.flip ? src.w - 1 - x : x)];
      if (c === '.') continue;
      if (opts.map && opts.map[c]) c = opts.map[c];
      if (c === '_') c = '.'; // '_' erases
      const dx = ox + x, dy = oy + y;
      if (opts.under && art.get(dst, dx, dy) !== '.') continue;
      art.set(dst, dx, dy, c);
    }
    return dst;
  };
  art.flip = (g) => art.blit(art.blank(g.w, g.h), g, 0, 0, { flip: true });

  /* dark outline on the outside of the shape (4-neighbour) */
  art.outline = function (g, ch = 'k', opts = {}) {
    const add = [];
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      if (g.d[y * g.w + x] !== '.') continue;
      const n = [art.get(g, x - 1, y), art.get(g, x + 1, y), art.get(g, x, y - 1), art.get(g, x, y + 1)];
      if (n.some((c) => c !== '.' && c !== ch && !(opts.skip && opts.skip.includes(c)))) add.push([x, y]);
    }
    for (const [x, y] of add) art.set(g, x, y, ch);
    return g;
  };

  /* Turn an index grid into a canvas. pal: { char: '#hex' | null } */
  art.paint = function (g, pal, scale = 1) {
    const { c, x } = G.gfx.makeCanvas(g.w * scale, g.h * scale);
    const img = x.createImageData(g.w, g.h);
    const cache = {};
    for (let i = 0; i < g.d.length; i++) {
      const ch = g.d[i];
      if (ch === '.') continue;
      let rgb = cache[ch];
      if (rgb === undefined) { const hex = pal[ch]; rgb = cache[ch] = hex ? G.util.hexToRgb(hex) : null; }
      if (!rgb) continue;
      img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; img.data[i * 4 + 3] = 255;
    }
    if (scale === 1) { x.putImageData(img, 0, 0); return c; }
    const t = G.gfx.makeCanvas(g.w, g.h); t.x.putImageData(img, 0, 0);
    x.drawImage(t.c, 0, 0, g.w * scale, g.h * scale);
    return c;
  };

  /* three-tone SNES ramp: [dark, mid, light] (+ optional extra light) */
  art.tones = function (base, n = 3, spread = 0.34) {
    const r = G.pix.ramp(base, n === 3 ? 5 : n + 1, spread * 1.6, 18);
    return n === 3 ? [r[1], r[2], r[3]] : r.slice(1);
  };
  /* image-data helpers for painterly sprites */
  art.canvasFromRGBA = function (w, h, data) {
    const { c, x } = G.gfx.makeCanvas(w, h);
    const img = x.createImageData(w, h);
    img.data.set(data);
    x.putImageData(img, 0, 0);
    return c;
  };
})();
