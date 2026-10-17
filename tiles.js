/* =========================================================================
   tiles.js — 16x16 town, castle and archive tiles in the SNES style:
   flat colour fields, crisp three-tone shapes, dark rims on props, no
   noise. Each tile is drawn once into a small cached canvas (with a few
   variants picked by position) and stamped into the map layer.

   Maps are ASCII; each character is a tile type defined here. A space is
   open sky — terrain.js builds the floating island beneath the land.

   Tile fields: name, solid, light, anim, under (paint ground beneath),
     paint(d, tx, ty, frame, ctx, lit)   — flat 16x16 painting
     tall(ctx, px, py, tx, ty, frame, lit, t) — objects taller than a tile
       (trees, lanterns, pillars) drawn in depth order with characters
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const H = U.hash;

  function D(ctx, ox, oy) {
    return {
      ctx, ox, oy,
      p(x, y, c) { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, 1, 1); },
      r(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); },
      img(c, x = 0, y = 0) { ctx.drawImage(c, ox + x, oy + y); },
    };
  }
  /* cached small canvases */
  const cache = {};
  function make(key, w, h, fn) {
    if (cache[key]) return cache[key];
    const { c, x } = G.gfx.makeCanvas(w, h);
    const P = {
      x, w, h,
      p(a, b, col) { x.fillStyle = col; x.fillRect(a, b, 1, 1); },
      r(a, b, ww, hh, col) { x.fillStyle = col; x.fillRect(a, b, ww, hh); },
      rows(a, b, rows, pal) { rows.forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(a + i, b + j, 1, 1); } })); },
    };
    fn(P);
    return (cache[key] = c);
  }
  // put a dark rim around everything drawn in a canvas
  function rim(c, col = '#1a1018') {
    const x = c.getContext('2d');
    const id = x.getImageData(0, 0, c.width, c.height), d = id.data, w = c.width, h = c.height;
    const add = [];
    for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
      if (d[(y * w + i) * 4 + 3]) continue;
      const nb = (a, b) => a >= 0 && b >= 0 && a < w && b < h && d[(b * w + a) * 4 + 3] > 0;
      if (nb(i - 1, y) || nb(i + 1, y) || nb(i, y - 1) || nb(i, y + 1)) add.push(i, y);
    }
    x.fillStyle = col;
    for (let k = 0; k < add.length; k += 2) x.fillRect(add[k], add[k + 1], 1, 1);
    return c;
  }

  /* ---------------- palettes ---------------- */
  const GRASS = { d: '#2a5a32', s: '#3a7a3c', m: '#4c9442', l: '#6cb04e', h: '#98d06a' };
  const COB = { m: '#5a4a44', a: '#a8988a', b: '#b8a690', c: '#9c8c80', h: '#dccdb4', s: '#7a6a60' };
  const WOOD = { s: '#3a2214', d: '#6a4224', m: '#8a5a30', l: '#a8743e', h: '#c8955a' };

  /* ---------------- ground ---------------- */
  function grassTile(v) {
    return make('grass' + v, 16, 16, (P) => {
      P.r(0, 0, 16, 16, GRASS.m);
      // little SNES tufts: a dark "ʌ" with a lit tip, placed on a jittered grid
      for (let i = 0; i < 4; i++) {
        const x = (i % 2) * 8 + 1 + Math.floor(H(v, i, 1) * 5), y = Math.floor(i / 2) * 8 + 2 + Math.floor(H(v, i, 2) * 4);
        if (H(v, i, 3) < 0.25) continue;
        P.p(x, y + 1, GRASS.s); P.p(x + 1, y, GRASS.s); P.p(x + 2, y + 1, GRASS.s); P.p(x + 1, y + 1, GRASS.d);
        P.p(x + 1, y - 1, GRASS.l);
      }
      if (v % 3 === 0) { const x = 3 + (v * 5) % 9, y = 4 + (v * 3) % 8; P.p(x, y, GRASS.l); P.p(x + 1, y, GRASS.h); }
      if (v === 5) { P.p(10, 11, '#ffffff'); P.p(11, 11, '#f8e070'); P.p(10, 12, GRASS.s); }
    });
  }
  function grass(d, tx, ty) { d.img(grassTile(Math.floor(H(tx, ty, 9) * 8))); }

  const tallTile = make('tallgrass', 16, 16, (P) => {
    P.r(0, 0, 16, 16, GRASS.s);
    // clumps of long blades, darker at the roots
    const clump = (cx, cy) => {
      for (const [dx, h, lean] of [[-2, 5, -1], [-1, 7, 0], [0, 8, 0], [1, 6, 1], [2, 4, 1]]) {
        for (let j = 0; j < h; j++) {
          const x = cx + dx + (j > h - 3 ? lean : 0), y = cy - j;
          P.p(x, y, j > h - 2 ? GRASS.h : j > h / 2 ? GRASS.l : GRASS.m);
        }
      }
      P.r(cx - 2, cy + 1, 5, 1, GRASS.d);
    };
    clump(4, 7); clump(12, 6); clump(8, 14); clump(0, 15); clump(16, 15);
  });

  function cobbleTile(v) {
    return make('cobble' + v, 16, 16, (P) => {
      P.r(0, 0, 16, 16, COB.m);
      const stone = (x, y, w, h, col) => {
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
          if ((i === 0 || i === w - 1) && (j === 0 || j === h - 1)) continue;
          const px = (x + i + 16) % 16, py = y + j;
          if (py < 0 || py > 15) continue;
          P.p(px, py, j === 0 ? COB.h : j === h - 1 || i === w - 1 ? COB.s : col);
        }
      };
      const cols = [COB.a, COB.b, COB.c];
      const off = v % 2 ? 4 : 0;
      for (let row = 0; row < 3; row++) {
        const y = row * 5 + (row ? 1 : 0) - (row === 0 ? 0 : 0);
        const shift = (row % 2 ? 3 : 0) + off;
        for (let k = -1; k < 3; k++) stone(k * 6 + shift, y, 6, row === 2 ? 5 : 5, cols[Math.floor(H(v, row * 4 + k, 7) * 3)]);
      }
    });
  }
  function cobble(d, tx, ty) { d.img(cobbleTile((Math.floor(H(tx, ty, 4) * 4) * 2) + (ty % 2))); }

  const dockTile = make('dock', 16, 16, (P) => {
    P.r(0, 0, 16, 16, WOOD.s);
    for (let i = 0; i < 4; i++) {
      const y = i * 4;
      P.r(0, y, 16, 3, WOOD.m); P.r(0, y, 16, 1, WOOD.l); P.r(0, y + 2, 16, 1, WOOD.d);
      const seam = [5, 12, 2, 9][i];
      P.r(seam, y, 1, 3, WOOD.s);
      P.p(seam + 2, y + 1, WOOD.s); P.p(seam - 2 < 0 ? 14 : seam - 2, y + 1, WOOD.s);
      P.r((seam + 6) % 14, y + 1, 3, 1, WOOD.h);
    }
  });
  function dock(d) { d.img(dockTile); }

  const STONE = { d: '#28306a', m: '#4a58a0', l: '#6a7ac0', h: '#9aa8e0', g: '#e0c050', gd: '#a07820' };
  function stoneTile(v) {
    return make('stone' + v, 16, 16, (P) => {
      P.r(0, 0, 16, 16, v ? STONE.m : '#5060a8');
      P.r(0, 0, 16, 1, STONE.h); P.r(0, 0, 1, 16, STONE.l);
      P.r(0, 15, 16, 1, STONE.d); P.r(15, 0, 1, 16, STONE.d);
      P.r(2, 2, 2, 1, STONE.h); P.p(2, 3, STONE.l);
      P.p(15, 15, STONE.gd); P.p(0, 0, STONE.g);
      if (v === 2) { P.p(8, 7, STONE.h); P.p(7, 8, STONE.l); P.p(9, 8, STONE.l); P.p(8, 9, STONE.l); }
    });
  }
  function stone(d, tx, ty) { d.img(stoneTile((tx + ty) % 2 ? 1 : H(tx, ty, 3) > 0.8 ? 2 : 0)); }

  const woodFloor = make('woodfloor', 16, 16, (P) => {
    P.r(0, 0, 16, 16, WOOD.s);
    for (let i = 0; i < 4; i++) {
      const y = i * 4, c = [WOOD.m, '#7e5230', WOOD.m, '#94623a'][i];
      P.r(0, y, 16, 3, c); P.r(0, y, 16, 1, WOOD.l);
      const s = [3, 11, 7, 14][i]; P.r(s, y, 1, 3, WOOD.s);
    }
  });

  /* ---------------- walls & roofs ---------------- */
  const PL = { w: '#f0e2c4', s: '#d2bc96', t: '#6a4428', th: '#8a5c34', f: '#7e7888', fh: '#a49eae', fs: '#5a5466' };
  function plasterTile(beam) {
    return make('plaster' + beam, 16, 16, (P) => {
      P.r(0, 0, 16, 16, PL.w);
      P.r(0, 0, 16, 2, PL.t); P.r(0, 0, 16, 1, PL.th);
      P.r(0, 2, 16, 1, PL.s);
      if (beam) { P.r(0, 0, 2, 12, PL.t); P.r(0, 0, 1, 12, PL.th); P.r(2, 2, 1, 10, PL.s); }
      // stone footing
      P.r(0, 11, 16, 5, PL.f); P.r(0, 11, 16, 1, '#4a3a2a');
      for (let i = 0; i < 4; i++) { const x = i * 4 + (beam ? 2 : 0); P.r(x % 16, 12, 3, 3, PL.fh); P.p(x % 16, 12, '#c8c2d0'); P.r((x + 2) % 16, 14, 1, 1, PL.fs); }
    });
  }
  function plaster(d, tx) { d.img(plasterTile(tx % 3 === 0 ? 1 : 0)); }

  function roofTile(kind, v) {
    const pal = kind === 'slate' ? ['#1c2450', '#34407a', '#4a5a9a', '#6a7cc0'] : ['#5a1c14', '#9a3424', '#c8503a', '#e87858'];
    return make('roof' + kind + v, 16, 16, (P) => {
      P.r(0, 0, 16, 16, pal[0]);
      // scalloped shingles in staggered rows
      for (let row = 0; row < 4; row++) {
        const off = (row + v) % 2 ? 2 : 0;
        for (let c = -1; c < 5; c++) {
          const x = c * 4 + off, y = row * 4;
          P.r(x, y, 4, 3, pal[2]); P.r(x + 1, y, 2, 1, pal[3]); P.p(x, y + 2, pal[1]); P.p(x + 3, y + 2, pal[1]); P.r(x + 1, y + 3, 2, 1, pal[1]);
        }
      }
    });
  }

  /* ---------------- tall things & props (rimmed sprites) ---------------- */
  function treeSprite(v) {
    if (cache['tree' + v]) return cache['tree' + v];
    const c = make('tree' + v, 30, 34, (P) => {
      const leaf = [['#1e4a2c', '#2e6a36', '#448a40', '#62a84a', '#8ccc66'], ['#1e4a34', '#2a6a44', '#3a8a50', '#58a860', '#88c878'], ['#2a4a1e', '#3e6a2a', '#5a8a34', '#7aa840', '#a8c860']][v];
      const bark = ['#3a2214', '#5a3a22', '#7a5030'];
      // trunk with roots
      P.r(12, 22, 6, 11, bark[1]); P.r(12, 22, 2, 11, bark[2]); P.r(16, 22, 2, 11, bark[0]);
      P.r(10, 31, 3, 2, bark[1]); P.r(17, 31, 3, 2, bark[0]);
      // canopy: overlapping clumps, each lit from the top-left
      const clumps = [[15, 13, 12, 9.5], [8, 12, 6.5, 6], [22, 12, 6.5, 6], [15, 6, 8, 6], [9, 18, 6, 4.5], [21, 18, 6, 4.5], [15, 19, 8, 4.5]];
      for (const [cx, cy, rx, ry] of clumps) {
        for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
          if (d > 1) continue;
          const lit = -dx * 0.6 - dy * 0.8;
          const tone = d > 0.75 && lit < 0 ? 0 : lit > 0.55 ? 3 : lit > 0.05 ? 2 : 1;
          P.p(x, y, leaf[tone]);
        }
      }
      // leaf texture: little bright crescents
      for (let i = 0; i < 16; i++) { const a = H(i, v, 4) * 6.28, r = H(i, v, 5) * 9; const x = Math.round(15 + Math.cos(a) * r - 2), y = Math.round(11 + Math.sin(a) * r * 0.75 - 2); P.p(x, y, leaf[4]); P.p(x + 1, y, leaf[3]); P.p(x, y + 1, leaf[1]); }
      if (v === 1) for (const [x, y] of [[8, 12], [20, 8], [14, 17], [23, 15], [12, 6]]) { P.r(x, y, 2, 2, '#e8483a'); P.p(x, y, '#ffb0a0'); }
      if (v === 2) for (const [x, y] of [[10, 9], [19, 13], [12, 16], [22, 7]]) { P.p(x, y, '#ffe060'); P.p(x + 1, y, '#f8f0b0'); }
    });
    return rim(c, '#14201a');
  }
  function lanternSprite(lit, f) {
    const key = 'lan' + lit + f;
    if (cache[key]) return cache[key];
    const c = make(key, 12, 32, (P) => {
      const ir = ['#1c1824', '#3a3448', '#5a5470'];
      P.r(5, 9, 2, 21, ir[1]); P.p(5, 9, ir[2]); P.r(5, 10, 1, 19, ir[2]);
      P.r(3, 29, 6, 3, ir[1]); P.r(3, 29, 6, 1, ir[2]);
      P.r(4, 2, 4, 1, ir[1]); P.r(3, 3, 6, 1, ir[0]);
      // the glass housing
      const gl = lit ? (f ? ['#c86a20', '#ffb040', '#ffe090', '#fff8e0'] : ['#c87a28', '#ffc050', '#ffe8a0', '#ffffff']) : ['#2a2430', '#3e3644', '#544a58', '#6a6070'];
      P.r(3, 4, 6, 6, gl[1]); P.r(4, 5, 4, 4, gl[2]); P.r(5, 6, 2, 2, gl[3]);
      P.r(3, 4, 1, 6, ir[1]); P.r(8, 4, 1, 6, ir[1]); P.r(3, 9, 6, 1, ir[1]); P.r(5, 4, 2, 6, lit ? gl[2] : gl[0]);
      P.r(4, 1, 4, 1, ir[2]); P.p(5, 0, ir[1]); P.p(6, 0, ir[1]);
      P.r(2, 10, 8, 1, ir[0]);
    });
    return rim(c, '#100c14');
  }
  function pillarSprite() {
    if (cache.pillarR) return cache.pillarR;
    const c = make('pillar', 14, 34, (P) => {
      const m = ['#8a90b0', '#b8bcd4', '#dcdef0', '#f4f6ff'], g = ['#8a6420', '#c8a040', '#f0d070'];
      P.r(3, 5, 8, 25, m[1]); P.r(3, 5, 2, 25, m[3]); P.r(5, 5, 1, 25, m[2]); P.r(9, 5, 2, 25, m[0]);
      P.r(7, 5, 1, 25, m[0]);
      P.r(1, 1, 12, 4, g[1]); P.r(1, 1, 12, 1, g[2]); P.r(1, 4, 12, 1, g[0]);
      P.r(1, 30, 12, 4, g[1]); P.r(1, 30, 12, 1, g[2]); P.r(1, 33, 12, 1, g[0]);
      P.r(2, 0, 10, 1, g[1]);
    });
    return (cache.pillarR = rim(c, '#141228'));
  }
  const prop = (key, w, h, fn, col) => { if (cache[key + 'R']) return cache[key + 'R']; return (cache[key + 'R'] = rim(make(key, w, h, fn), col)); };
  const crate = () => prop('crate', 14, 13, (P) => {
    P.r(0, 0, 14, 13, WOOD.m); P.r(0, 0, 14, 2, WOOD.l); P.r(0, 11, 14, 2, WOOD.d); P.r(0, 0, 2, 13, WOOD.l); P.r(12, 0, 2, 13, WOOD.d);
    for (let i = 0; i < 9; i++) { P.p(3 + i, 2 + i, WOOD.d); P.p(10 - i, 2 + i, WOOD.d); }
    P.r(2, 2, 10, 1, WOOD.h);
  });
  const barrel = () => prop('barrel', 12, 14, (P) => {
    const w = ['#5a3418', '#8a5a30', '#a87440', '#c89458'];
    for (let y = 0; y < 14; y++) { const bulge = y > 2 && y < 11 ? 0 : 1; P.r(bulge, y, 12 - bulge * 2, 1, w[1]); P.r(bulge + 1, y, 3, 1, w[2]); P.r(10 - bulge, y, 2 - bulge, 1, w[0]); }
    P.r(1, 0, 10, 2, w[3]); P.r(2, 1, 8, 1, w[2]);
    for (const y of [3, 10]) { P.r(0, y, 12, 1, '#5a5a6a'); P.r(1, y, 3, 1, '#8a8a9a'); }
  });

  /* ---------------- the tile table ---------------- */
  const T = (G.TILES = {
    ' ': { name: 'void', solid: true, void: true, paint() {} },
    '.': { name: 'grass', paint: grass },
    ',': { name: 'tallgrass', paint: (d) => d.img(tallTile), encounter: true },
    '%': {
      name: 'flowers', paint(d, tx, ty) {
        grass(d, tx, ty);
        const cols = [['#e84a6a', '#ffc0d0'], ['#f0c020', '#fff4a0'], ['#ffffff', '#f8e060'], ['#9a6ae8', '#e0d0ff']];
        for (let i = 0; i < 3; i++) {
          const x = 2 + Math.floor(H(tx, ty, i + 5) * 11), y = 2 + Math.floor(H(tx, ty, i + 9) * 11), c = cols[(i + tx + ty) % 4];
          d.p(x, y + 2, GRASS.d); d.p(x - 1, y, c[0]); d.p(x + 1, y, c[0]); d.p(x, y - 1, c[0]); d.p(x, y + 1, c[0]); d.p(x, y, c[1]);
        }
      },
    },
    '=': { name: 'cobble', paint: cobble },
    '_': { name: 'dock', pier: true, paint: dock },
    'o': { name: 'stone', paint: stone },
    'g': {
      name: 'goldfloor', paint(d, tx, ty) {
        stone(d, tx, ty);
        d.r(0, 7, 16, 2, '#a07820'); d.r(7, 0, 2, 16, '#a07820'); d.r(0, 7, 16, 1, '#f0d070'); d.r(7, 0, 1, 16, '#f0d070');
        d.r(5, 5, 6, 6, '#a07820'); d.r(6, 6, 4, 4, '#f0d070'); d.r(7, 7, 2, 2, '#fff8c8');
      },
    },
    'r': {
      name: 'carpet', paint(d, tx, ty) {
        d.r(0, 0, 16, 16, '#24307a');
        for (let y = 2; y < 16; y += 4) for (let x = (y / 2) % 4 ? 2 : 0; x < 16; x += 4) d.p(x, y, '#3444a0');
        d.p(8, 8, '#c8a040'); d.p(7, 8, '#7a6030'); d.p(9, 8, '#7a6030');
      },
    },
    'n': { name: 'floor', paint: (d) => d.img(woodFloor) },
    '#': { name: 'cottagewall', solid: true, paint: plaster },
    'v': {
      name: 'stonewall', solid: true, paint(d, tx, ty) {
        d.img(make('vwall' + (ty % 2), 16, 16, (P) => {
          P.r(0, 0, 16, 16, '#141a3a');
          const blocks = ty % 2 ? [[0, 0, 7, 7], [7, 0, 9, 7], [0, 8, 10, 7], [10, 8, 6, 7]] : [[0, 0, 10, 7], [10, 0, 6, 7], [0, 8, 5, 7], [5, 8, 11, 7]];
          for (const [x, y, w, h] of blocks) { P.r(x, y, w, h, '#3e4a84'); P.r(x, y, w, 1, '#5a68a8'); P.r(x, y, 1, h, '#4e5a98'); P.r(x, y + h - 1, w, 1, '#2a3264'); }
          P.r(0, 15, 16, 1, '#c8a040');
        }));
        if (H(tx, ty, 1) > 0.8) { d.r(6, 3, 3, 3, '#2a5aa0'); d.p(7, 4, '#9af0ff'); d.p(7, 3, '#ffffff'); }
      },
    },
    'X': {
      name: 'innerwall', solid: true, paint(d, tx) {
        d.img(make('xwall' + (tx % 2), 16, 16, (P) => {
          P.r(0, 0, 16, 10, '#4a2a52');
          for (let y = 1; y < 10; y += 3) for (let x = (y % 2) * 2; x < 16; x += 4) { P.p(x, y, '#6a4472'); P.p(x + 1, y + 1, '#3a2040'); }
          P.r(0, 10, 16, 6, '#6a3e26'); P.r(0, 10, 16, 1, '#e8c060'); P.r(0, 11, 16, 1, '#8a5432'); P.r(0, 15, 16, 1, '#3a2010');
          P.r(tx % 2 ? 2 : 9, 12, 5, 3, '#5a3420'); P.r(tx % 2 ? 2 : 9, 12, 5, 1, '#7a4a2a');
        }));
      },
    },
    '^': { name: 'roof', solid: true, paint(d, tx, ty) { d.img(roofTile('clay', ty % 2)); } },
    'R': { name: 'slateroof', solid: true, paint(d, tx, ty) { d.img(roofTile('slate', ty % 2)); if (H(tx, ty, 9) > 0.75) { d.p(7, 6, '#ffe890'); d.p(6, 6, '#c8a040'); d.p(8, 6, '#c8a040'); } } },
    'D': {
      name: 'door', solid: true, door: true, paint(d, tx, ty) {
        plaster(d, tx, ty);
        d.img(make('door', 16, 16, (P) => {
          P.r(3, 1, 10, 15, '#2a160c'); P.r(5, 0, 6, 1, '#2a160c');
          P.r(4, 2, 8, 14, '#9a6034'); P.r(5, 1, 6, 1, '#9a6034');
          P.r(4, 2, 1, 14, '#c08048'); P.r(7, 2, 2, 14, '#7a4824'); P.r(11, 2, 1, 14, '#6a3c1c');
          P.r(4, 5, 8, 1, '#3a3448'); P.r(4, 12, 8, 1, '#3a3448');
          P.p(10, 9, '#f8d060'); P.p(10, 10, '#a07020');
          P.r(2, 15, 12, 1, '#9a92a0');
        }));
      },
    },
    'w': {
      name: 'window', solid: true, anim: true, lightKey: true, light: { r: 22, color: '#ffb050', glow: 0.6 },
      paint(d, tx, ty, f, ctx, lit) {
        plaster(d, tx, ty);
        d.img(make('win' + (lit ? 1 : 0), 16, 16, (P) => {
          P.r(1, 3, 3, 7, '#3a6a88'); P.r(12, 3, 3, 7, '#3a6a88'); P.r(1, 3, 3, 1, '#5a90b0'); P.r(12, 3, 3, 1, '#5a90b0'); P.r(2, 4, 1, 5, '#2a4a68'); P.r(13, 4, 1, 5, '#2a4a68');
          P.r(4, 2, 8, 9, '#4a2c18');
          P.r(5, 3, 6, 7, lit ? '#ffcc6a' : '#1e2a54');
          if (lit) { P.r(5, 3, 3, 3, '#ffe8a8'); P.p(5, 3, '#fffbe8'); } else { P.p(5, 3, '#4a5a8a'); P.p(6, 3, '#2e3a6a'); }
          P.r(7, 3, 1, 7, '#4a2c18'); P.r(5, 6, 6, 1, '#4a2c18');
          P.r(3, 10, 10, 2, '#7a4a28'); P.r(3, 10, 10, 1, '#a06a3a');
        }));
        const fl = ['#e84a6a', '#f8d040', '#ff90b0', '#ffffff'];
        for (let i = 0; i < 4; i++) { d.p(5 + i * 2, 9, fl[(i + tx) % 4]); d.p(4 + i * 2, 9, '#3a7a3c'); }
        if (lit && H(tx, ty, Math.floor(f / 50)) < 0.06) d.r(5, 3, 6, 7, 'rgba(255,170,80,0.35)');
      },
    },
    'L': {
      name: 'lantern', solid: true, under: true, tall: (ctx, px, py, tx, ty, f, lit) => {
        ctx.drawImage(lanternSprite(lit, Math.floor(f / 14 + tx) % 2), px + 2, py - 16);
      }, lightKey: true, light: { r: 40, color: '#ffa848', glow: 0.85 },
      paint() {},
    },
    'T': {
      name: 'tree', solid: true, under: true, tall: (ctx, px, py, tx, ty) => {
        ctx.drawImage(treeSprite((tx * 7 + ty * 3) % 3), px - 7, py - 18);
      }, paint() {},
    },
    'P': { name: 'pillar', solid: true, under: true, tall: (ctx, px, py) => ctx.drawImage(pillarSprite(), px + 1, py - 17), paint() {} },
    'h': {
      name: 'hedge', solid: true, paint(d, tx, ty) {
        grass(d, tx, ty);
        const v = (tx + ty) % 2;
        d.img(prop('hedge' + v, 16, 14, (P) => {
          const lf = ['#244a2a', '#2e6a36', '#448a40', '#62a84a', '#8ccc66'];
          P.r(0, 3, 16, 11, lf[1]);
          for (const [cx, cy, r] of [[3, 5, 4], [8, 4, 4.5], [13, 5, 4], [5, 9, 4], [11, 9, 4]]) for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) { const dd = (x * x + y * y) / (r * r); if (dd > 1) continue; const lit = -x * 0.6 - y * 0.8; P.p(cx + x, cy + y, lit > 2 ? lf[3] : lit > -1 ? lf[2] : lf[1]); }
          P.r(0, 13, 16, 1, lf[0]);
          if (v) for (const [x, y] of [[4, 6], [11, 8], [8, 3]]) { P.p(x, y, '#ff5a6a'); P.p(x + 1, y, '#ffb0b8'); }
        }, '#14201a'), 0, 1);
      },
    },
    'x': { name: 'crate', solid: true, under: true, paint(d) { d.img(crate(), 1, 2); } },
    'b': { name: 'barrel', solid: true, under: true, paint(d) { d.img(barrel(), 2, 1); } },
    'f': {
      name: 'fence', solid: true, under: true, paint(d) {
        d.img(prop('fence', 16, 13, (P) => {
          P.r(0, 3, 16, 2, WOOD.m); P.r(0, 3, 16, 1, WOOD.l); P.r(0, 8, 16, 2, WOOD.m); P.r(0, 8, 16, 1, WOOD.l);
          for (const x of [2, 11]) { P.r(x, 0, 3, 13, WOOD.d); P.r(x, 0, 1, 13, WOOD.l); P.p(x + 1, 0, WOOD.h); }
        }), 0, 2);
      },
    },
    'q': {
      name: 'rail', solid: true, pier: true, paint(d, tx, ty) {
        dock(d);
        d.img(prop('rail', 16, 12, (P) => {
          P.r(1, 0, 3, 12, WOOD.d); P.r(12, 0, 3, 12, WOOD.d); P.r(1, 0, 1, 12, WOOD.l); P.r(12, 0, 1, 12, WOOD.l);
          P.r(0, 2, 16, 2, WOOD.m); P.r(0, 2, 16, 1, WOOD.h);
          for (let x = 0; x < 16; x += 2) P.p(x, 7 + (x % 4 ? 1 : 0), '#d8c098');
        }), 0, 1);
      },
    },
    's': {
      name: 'stall', solid: true, under: true, paint(d, tx) {
        const c = ['#c83a3a', '#3a7ac8', '#d89a28'][tx % 3];
        d.img(prop('stall' + (tx % 3), 16, 15, (P) => {
          for (let x = 0; x < 16; x += 4) { P.r(x, 0, 2, 5, c); P.r(x + 2, 0, 2, 5, '#f4ece0'); }
          for (let x = 0; x < 16; x += 2) P.p(x, 5, x % 4 ? '#f4ece0' : c);
          P.r(1, 8, 14, 7, WOOD.d); P.r(1, 8, 14, 2, WOOD.l); P.r(1, 10, 14, 1, WOOD.s);
          for (const [x, col] of [[2, '#e0a050'], [6, '#d08a40'], [10, '#e84a3a'], [13, '#f8d040']]) { P.r(x, 6, 3, 2, col); P.p(x, 6, '#fff0c0'); }
          P.r(1, 5, 1, 3, WOOD.d); P.r(14, 5, 1, 3, WOOD.d);
        }), 0, 0);
      },
    },
    'u': {
      name: 'bench', solid: true, under: true, paint(d) {
        d.img(prop('bench', 14, 10, (P) => {
          P.r(0, 0, 14, 3, WOOD.m); P.r(0, 0, 14, 1, WOOD.h); P.r(0, 4, 14, 3, WOOD.m); P.r(0, 4, 14, 1, WOOD.l);
          P.r(1, 7, 2, 3, '#3a3448'); P.r(11, 7, 2, 3, '#3a3448');
        }), 1, 5);
      },
    },
    '~': {
      name: 'water', solid: true, anim: true, paint(d, tx, ty, f) {
        d.r(0, 0, 16, 16, '#2a6aaa');
        const o = Math.floor(f / 12) % 16;
        for (let i = 0; i < 3; i++) { const y = 3 + i * 5; d.r((o + i * 5 + tx * 3) % 16, y, 4, 1, '#7ac0f0'); d.r((o + i * 5 + tx * 3 + 1) % 16, y + 1, 2, 1, '#3a88c8'); }
        if (H(tx, ty, Math.floor(f / 24)) > 0.75) d.p(8, 8, '#ffffff');
      },
    },
    'k': {
      name: 'shelf', solid: true, paint(d, tx, ty) {
        d.img(make('shelf' + ((tx * 3 + ty) % 4), 16, 16, (P) => {
          P.r(0, 0, 16, 16, '#24140a'); P.r(1, 0, 14, 16, '#5a3822'); P.r(1, 0, 1, 16, '#7a5030'); P.r(14, 0, 1, 16, '#3a2414');
          const bc = ['#a83838', '#3a7a4a', '#3a52a8', '#c89838', '#7a3aa0', '#e0dcd0', '#c86a30'];
          for (let sh = 0; sh < 3; sh++) {
            const y = 1 + sh * 5;
            P.r(1, y + 4, 14, 1, '#24140a');
            let x = 2, i = 0;
            while (x < 14) {
              const s = (tx * 3 + ty) % 4;
              const w = 1 + Math.floor(H(s * 7 + x, sh, 1) * 2), h = 3 + Math.floor(H(s + x, sh, 2) * 2);
              const col = bc[Math.floor(H(s + x * 3, sh * 5, 3) * bc.length)];
              P.r(x, y + 4 - h, w, h, col); P.p(x, y + 4 - h, U.shade(col, 0.4));
              if (h > 3) P.p(x, y + 2, '#f0d070');
              x += w + (H(s, x, sh) > 0.85 ? 1 : 0); i++;
            }
          }
        }));
      },
    },
    'd': {
      name: 'desk', solid: true, under: true, paint(d) {
        d.img(prop('desk', 16, 14, (P) => {
          P.r(0, 3, 16, 8, '#5a3418'); P.r(0, 3, 16, 3, WOOD.m); P.r(0, 3, 16, 1, WOOD.h);
          P.r(1, 11, 2, 3, '#2a1a0c'); P.r(13, 11, 2, 3, '#2a1a0c');
          P.r(3, 1, 6, 4, '#f4ecd8'); P.r(4, 2, 4, 1, '#a0a0c0'); P.r(4, 3, 3, 1, '#a0a0c0');
          P.r(11, 0, 2, 4, '#2a2a3a'); P.p(12, 0, '#f0f0f0');
        }), 0, 2);
      },
    },
    'm': {
      name: 'maptable', solid: true, under: true, paint(d) {
        d.img(prop('maptable', 16, 12, (P) => {
          P.r(0, 0, 16, 11, '#3a2010'); P.r(1, 1, 14, 8, '#ece0bc'); P.r(1, 1, 14, 1, '#fff6d8');
          for (const [x, y, w] of [[2, 3, 3], [9, 2, 4], [6, 6, 3], [12, 6, 2]]) { P.r(x, y, w, 2, '#8ab070'); P.r(x, y + 2, w, 1, '#a07850'); }
          for (const [x, y] of [[5, 4], [7, 5], [10, 5], [11, 6]]) P.p(x, y, '#8a7a5a');
          for (const [x, y] of [[3, 3], [10, 2]]) { P.p(x - 1, y, '#d02020'); P.p(x + 1, y + 1, '#d02020'); P.p(x + 2, y, '#d02020'); }
          P.r(1, 9, 14, 1, '#2a1a0c'); P.r(1, 10, 2, 2, '#2a1a0c'); P.r(13, 10, 2, 2, '#2a1a0c');
        }), 0, 3);
      },
    },
    'G': {
      name: 'globe', solid: true, under: true, anim: true, light: { r: 20, color: '#6ff3ff', glow: 0.45 }, paint(d, tx, ty, f) {
        d.r(7, 11, 2, 4, '#c8a040'); d.r(5, 14, 6, 2, '#c8a040'); d.r(5, 14, 6, 1, '#f0d070');
        d.r(4, 2, 8, 9, '#1a2050'); d.r(3, 4, 10, 5, '#1a2050'); d.r(5, 3, 3, 2, '#2a3a80');
        for (let i = 0; i < 5; i++) { const a = (f / 40 + i * 1.3) % 6.28; d.p(8 + Math.round(Math.cos(a) * 4), 6 + Math.round(Math.sin(a * 2) * 2), '#f0d070'); }
        d.p(6, 4, '#9ae0ff');
      },
    },
    'Z': {
      name: 'bed', solid: true, under: true, paint(d) {
        d.img(prop('bed', 14, 15, (P) => {
          P.r(0, 0, 14, 15, '#5a3418'); P.r(1, 1, 12, 4, '#f4f0f8'); P.r(2, 2, 10, 2, '#ffffff');
          P.r(1, 5, 12, 9, '#3460c8'); P.r(1, 5, 12, 1, '#7a9ae8'); P.r(1, 9, 12, 1, '#2a4a9a');
        }), 1, 1);
      },
    },
    'c': {
      name: 'candles', solid: true, under: true, anim: true, light: { r: 26, color: '#ffb050', glow: 0.55 }, paint(d, tx, ty, f) {
        d.r(4, 10, 8, 4, '#c8a040'); d.r(4, 10, 8, 1, '#f0d070'); d.r(3, 14, 10, 1, '#6a4a10');
        d.r(5, 6, 2, 4, '#f4ecdc'); d.r(9, 7, 2, 3, '#f4ecdc'); d.r(7, 8, 2, 2, '#f4ecdc');
        const fl = Math.floor(f / 6) % 2;
        d.p(5 + fl, 5, '#ffd060'); d.p(5 + fl, 4, '#fff0a0'); d.p(9 + (1 - fl), 6, '#ffd060'); d.p(7 + fl, 7, '#ffd060');
      },
    },
    'B': {
      name: 'bridge', anim: true, bridge: true, light: { r: 18, color: '#6ff3ff', glow: 0.4 },
      paint(d, tx, ty, f) {
        const fl = G.world ? G.world.bridgeFlicker(tx, ty, f) : 1;
        d.ctx.globalAlpha = 0.3 + 0.7 * fl;
        d.r(0, 2, 16, 12, 'rgba(26,90,138,0.85)');
        for (let i = 0; i < 4; i++) {
          const y = 3 + i * 3;
          for (let x = 0; x < 16; x++) {
            const w = Math.sin((x + f * 0.15 + i * 2 + tx * 16) * 0.5);
            d.p(x, y + (w > 0.3 ? 1 : 0), w > 0.6 ? '#ffffff' : w > 0 ? '#6ff3ff' : '#3ab0e0');
          }
        }
        d.r(0, 1, 16, 1, '#bff8ff'); d.r(0, 14, 16, 1, '#bff8ff');
        if (H(tx, ty, Math.floor(f / 6)) > 0.8) d.p(Math.floor(H(tx, f, 2) * 16), 1, '#ffffff');
        d.ctx.globalAlpha = 1;
      },
    },
    'W': {
      name: 'stonewindow', solid: true, anim: true, lightKey: true, light: { r: 28, color: '#ffd27a', glow: 0.55 },
      paint(d, tx, ty, f, ctx, lit) {
        T.v.paint(d, tx, ty);
        d.img(make('swin' + (lit ? 1 : 0), 16, 16, (P) => {
          P.r(4, 2, 8, 12, '#c8a040'); P.r(5, 1, 6, 1, '#c8a040');
          P.r(5, 3, 6, 10, lit ? '#ffd890' : '#1c2850'); P.r(6, 2, 4, 1, lit ? '#ffd890' : '#1c2850');
          if (lit) P.r(5, 3, 2, 4, '#fff2c8'); else { P.p(6, 4, '#8890d0'); P.p(9, 8, '#ffffff'); }
          P.r(7, 2, 2, 11, '#8a6a2a'); P.r(5, 7, 6, 1, '#8a6a2a');
          P.r(3, 13, 10, 1, '#f0d070');
        }));
      },
    },
    'K': {
      name: 'stonedoor', solid: true, door: true, paint(d, tx, ty) {
        T.v.paint(d, tx, ty);
        d.img(make('sdoor', 16, 16, (P) => {
          P.r(2, 2, 12, 14, '#c8a040'); P.r(4, 1, 8, 1, '#c8a040');
          P.r(3, 3, 10, 13, '#2a1e40'); P.r(5, 2, 6, 1, '#2a1e40');
          P.r(4, 4, 8, 12, '#4a3466'); P.r(7, 4, 2, 12, '#3a2850'); P.r(4, 4, 1, 12, '#5a447a');
          P.r(5, 6, 6, 1, '#6ff3ff'); P.p(8, 5, '#bff8ff');
          P.p(10, 10, '#f0d070'); P.p(5, 10, '#f0d070');
        }));
      },
    },
    'M': {
      name: 'mast', solid: true, paint(d) {
        dock(d);
        d.r(6, 0, 4, 14, '#3a2414'); d.r(7, 0, 1, 14, '#8a5a30'); d.r(4, 12, 8, 3, '#2a1a10');
      },
    },
    '<': {
      name: 'stairs', paint(d) {
        d.img(make('stairs', 16, 16, (P) => {
          P.r(0, 0, 16, 16, '#1a1020');
          for (let i = 0; i < 4; i++) { P.r(0, i * 4, 16, 3, ['#4a3a5a', '#5a4a6a', '#6a5a7a', '#7a6a8a'][i]); P.r(0, i * 4, 16, 1, ['#6a5a7a', '#7a6a8a', '#8a7a9a', '#9a8aaa'][i]); }
          P.r(0, 0, 1, 16, '#2a2030'); P.r(15, 0, 1, 16, '#2a2030');
        }));
      },
    },
    'Q': { name: 'station', solid: true, paint: cobble },
    'E': { name: 'exit', paint: stone },
  });

  G.tileLight = (ch) => (T[ch] ? T[ch].light : null);
  G.makeTileDrawer = D;
  G.tileSprite = make;
})();
