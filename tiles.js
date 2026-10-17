/* =========================================================================
   tiles.js — procedural 16x16 tiles. Maps are ASCII; each character is a
   tile type defined here. Void (' ') is open sky: islands float, and
   cliffs are drawn automatically beneath any land that borders the void.
   Add a tile: TILES['<char>'] = { name, solid, light, anim, paint(d, tx, ty, frame, ctx) }
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const H = U.hash;

  // drawing helper bound to a tile position
  function D(ctx, ox, oy) {
    return {
      ctx, ox, oy,
      p(x, y, c) { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, 1, 1); },
      r(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); },
    };
  }

  /* ---------- ground painters ---------- */
  function grass(d, tx, ty) {
    d.r(0, 0, 16, 16, '#5c9c48');
    for (let i = 0; i < 14; i++) {
      const x = Math.floor(H(tx, ty, i) * 16), y = Math.floor(H(tx, ty, i + 40) * 16);
      d.p(x, y, H(tx, ty, i + 80) > 0.5 ? '#4a8a3a' : '#74b85a');
    }
    if (H(tx, ty, 99) > 0.6) { const x = 3 + Math.floor(H(tx, ty, 98) * 9), y = 4 + Math.floor(H(tx, ty, 97) * 8); d.p(x, y, '#3e7a32'); d.p(x + 2, y, '#3e7a32'); d.p(x + 1, y - 1, '#3e7a32'); }
  }
  function tallgrass(d, tx, ty) {
    d.r(0, 0, 16, 16, '#4c8a3c');
    for (let i = 0; i < 6; i++) {
      const x = (i * 5 + Math.floor(H(tx, ty, i) * 3)) % 15, y = 3 + ((i * 7) % 10);
      d.r(x, y, 1, 4, '#2f6a2a'); d.r(x + 1, y - 2, 1, 6, '#6aac4a'); d.r(x + 2, y + 1, 1, 3, '#2f6a2a');
    }
  }
  function cobble(d, tx, ty) {
    d.r(0, 0, 16, 16, '#6e5442');
    const cols = ['#b49072', '#a88468', '#bf9c7c', '#9e7c62'];
    for (let row = 0; row < 4; row++) {
      const off = (row % 2) * 4;
      for (let c = -1; c < 3; c++) {
        const x = c * 8 + off, y = row * 4;
        const col = cols[Math.floor(H(tx * 4 + c, ty * 4 + row, 3) * 4)];
        const x0 = Math.max(0, x + 1), x1 = Math.min(16, x + 7);
        if (x1 > x0) d.r(x0, y + 1, x1 - x0, 3, col);
      }
    }
  }
  function stone(d, tx, ty) {
    d.r(0, 0, 16, 16, '#2c3458');
    const a = '#4a5684', b = '#55628f';
    d.r(1, 1, 7, 7, H(tx, ty, 1) > 0.5 ? a : b); d.r(9, 1, 6, 7, H(tx, ty, 2) > 0.5 ? a : b);
    d.r(1, 9, 6, 6, H(tx, ty, 3) > 0.5 ? a : b); d.r(8, 9, 7, 6, H(tx, ty, 4) > 0.5 ? a : b);
    if (H(tx, ty, 5) > 0.7) d.p(3 + Math.floor(H(tx, ty, 6) * 10), 3 + Math.floor(H(tx, ty, 7) * 10), '#8a9ad0');
  }
  function dock(d, tx, ty) {
    d.r(0, 0, 16, 16, '#5a3a22');
    for (let i = 0; i < 4; i++) {
      const y = i * 4, col = ['#a8743e', '#9a6a38', '#b07c44', '#9c6c3a'][(i + tx) % 4];
      d.r(0, y, 16, 3, col);
      const seam = (Math.floor(H(tx, ty + i, 7) * 12) + 2);
      d.r(seam, y, 1, 3, '#6a4424');
    }
    d.p(2, 1, '#3a2a1a'); d.p(13, 9, '#3a2a1a');
  }

  /* ---------- the tile table ---------- */
  const T = (G.TILES = {
    ' ': { name: 'void', solid: true, void: true, paint() {} },
    '.': { name: 'grass', paint: grass },
    ',': { name: 'tallgrass', paint: tallgrass, encounter: true },
    '%': {
      name: 'flowers', paint(d, tx, ty) {
        grass(d, tx, ty);
        const cols = ['#ff8aa0', '#ffd060', '#ffffff', '#b08aff'];
        for (let i = 0; i < 5; i++) { const x = 1 + Math.floor(H(tx, ty, i + 5) * 13), y = 1 + Math.floor(H(tx, ty, i + 9) * 13); d.p(x, y, cols[i % 4]); d.p(x, y + 1, '#3e7a32'); }
      },
    },
    '=': { name: 'cobble', paint: cobble },
    '_': { name: 'dock', pier: true, paint: dock },
    'o': { name: 'stone', paint: stone },
    'g': {
      name: 'goldfloor', paint(d, tx, ty) {
        stone(d, tx, ty);
        d.r(0, 7, 16, 2, '#c8a040'); d.r(7, 0, 2, 16, '#c8a040'); d.r(6, 6, 4, 4, '#f0d070'); d.p(7, 7, '#fff6c0');
      },
    },
    'r': {
      name: 'carpet', paint(d, tx, ty) {
        d.r(0, 0, 16, 16, '#1c2468');
        for (let i = 0; i < 3; i++) d.p(Math.floor(H(tx, ty, i) * 16), Math.floor(H(tx, ty, i + 3) * 16), '#f0d070');
        d.r(0, 0, 16, 1, '#2c3688');
      },
    },
    'n': { // interior wooden floor
      name: 'floor', paint(d, tx, ty) {
        d.r(0, 0, 16, 16, '#5a3a2c');
        for (let i = 0; i < 2; i++) { d.r(0, i * 8, 16, 7, ['#7a5038', '#724a34'][(i + ty) % 2]); d.r(Math.floor(H(tx, ty + i, 1) * 14), i * 8, 1, 7, '#4a2e22'); }
      },
    },
    '#': {
      name: 'brickwall', solid: true, paint(d, tx, ty) {
        d.r(0, 0, 16, 16, '#6a3428');
        for (let row = 0; row < 4; row++) {
          const off = (row % 2) * 4;
          for (let c = -1; c < 3; c++) {
            const x = c * 8 + off;
            const col = H(tx * 3 + c, ty * 4 + row, 2) > 0.5 ? '#b0603e' : '#a05436';
            const x0 = Math.max(0, x), x1 = Math.min(16, x + 7);
            if (x1 > x0) d.r(x0, row * 4, x1 - x0, 3, col);
          }
        }
        d.r(0, 15, 16, 1, '#3a1c16');
      },
    },
    'v': {
      name: 'stonewall', solid: true, paint(d, tx, ty) {
        d.r(0, 0, 16, 16, '#1e2444');
        d.r(1, 1, 14, 6, '#3a4676'); d.r(0, 9, 7, 6, '#36426e'); d.r(8, 9, 8, 6, '#3e4a7c');
        d.r(1, 1, 14, 1, '#56649a');
        if (H(tx, ty, 1) > 0.6) d.r(3, 3, 2, 2, '#6ff3ff');
      },
    },
    'X': {
      name: 'innerwall', solid: true, paint(d) {
        d.r(0, 0, 16, 16, '#3a2430');
        for (let x = 0; x < 16; x += 4) d.r(x, 0, 1, 12, '#2a1822');
        d.r(0, 12, 16, 4, '#5a3a2a'); d.r(0, 12, 16, 1, '#c8a040');
      },
    },
    '^': {
      name: 'roof', solid: true, paint(d, tx, ty) {
        d.r(0, 0, 16, 16, '#7a2a24');
        for (let row = 0; row < 4; row++) for (let c = 0; c < 4; c++) {
          const x = c * 4 + (row % 2) * 2, y = row * 4;
          d.r(x, y, 3, 3, H(tx * 4 + c, ty * 4 + row, 1) > 0.5 ? '#c0503e' : '#b24636');
          d.p(x, y + 2, '#8a3028');
        }
      },
    },
    'R': {
      name: 'slateroof', solid: true, paint(d, tx, ty) {
        d.r(0, 0, 16, 16, '#1c2240');
        for (let row = 0; row < 4; row++) for (let c = 0; c < 4; c++) {
          const x = c * 4 + (row % 2) * 2, y = row * 4;
          d.r(x, y, 3, 3, H(tx * 4 + c, ty * 4 + row, 1) > 0.5 ? '#3a4a8a' : '#34427a');
        }
        if (H(tx, ty, 9) > 0.7) d.p(8, 8, '#f0d070');
      },
    },
    'D': {
      name: 'door', solid: true, door: true, paint(d) {
        d.r(0, 0, 16, 16, '#6a3428');
        d.r(3, 2, 10, 14, '#3a2016'); d.r(4, 3, 8, 13, '#8a5230'); d.r(4, 3, 8, 1, '#a86a3e');
        d.r(7, 3, 1, 13, '#6a3e22'); d.p(10, 10, '#f0c050');
      },
    },
    'd2': null,
    'w': {
      name: 'window', solid: true, anim: true, lightKey: true, light: { r: 26, color: '#ffb050', glow: 0.55 },
      paint(d, tx, ty, f, ctx, lit) {
        T['#'].paint(d, tx, ty);
        d.r(3, 3, 10, 9, '#3a1c16');
        const glass = lit ? (H(tx, ty, Math.floor(f / 30)) > 0.08 ? '#ffd27a' : '#ffc060') : '#2a3550';
        d.r(4, 4, 8, 7, glass); d.r(7, 4, 2, 7, '#3a1c16'); d.r(4, 7, 8, 1, '#3a1c16');
        if (lit) { d.r(5, 5, 1, 1, '#fff2c0'); }
        d.r(3, 12, 10, 1, '#d0a070');
      },
    },
    'L': {
      name: 'lantern', solid: true, under: true, anim: true, lightKey: true, light: { r: 46, color: '#ffa848', glow: 0.75 },
      paint(d, tx, ty, f, ctx, lit) {
        d.r(7, 6, 2, 10, '#2a2230'); d.r(5, 14, 6, 2, '#2a2230');
        d.r(4, 0, 8, 1, '#2a2230');
        d.r(5, 1, 6, 6, '#2a2230');
        const flick = lit ? (H(tx, ty, Math.floor(f / 6)) > 0.5 ? '#ffe08a' : '#ffd060') : '#4a4a5a';
        d.r(6, 2, 4, 4, flick);
        if (lit) d.r(7, 3, 2, 2, '#fff8d0');
        d.r(4, 7, 8, 1, '#2a2230');
      },
    },
    'T': {
      name: 'tree', solid: true, paint(d, tx, ty) {
        grass(d, tx, ty);
        d.r(6, 11, 4, 5, '#5a3a22'); d.r(7, 11, 1, 5, '#7a5030');
        d.r(2, 2, 12, 9, '#2e6a34'); d.r(1, 4, 14, 5, '#2e6a34'); d.r(4, 0, 8, 3, '#2e6a34');
        d.r(3, 2, 6, 4, '#4a9a48'); d.r(5, 1, 4, 2, '#5aae54');
        d.p(10, 5, '#5aae54'); d.p(4, 7, '#3e8a40'); d.r(2, 9, 12, 1, '#1e4a24');
        if (H(tx, ty, 4) > 0.5) { d.p(9, 3, '#ff8aa0'); d.p(5, 7, '#ff8aa0'); }
      },
    },
    'h': {
      name: 'hedge', solid: true, paint(d, tx, ty) {
        grass(d, tx, ty);
        d.r(0, 3, 16, 12, '#2e6a34'); d.r(1, 2, 14, 3, '#3e8a40');
        for (let i = 0; i < 6; i++) d.p(Math.floor(H(tx, ty, i) * 16), 3 + Math.floor(H(tx, ty, i + 9) * 10), '#5aae54');
        d.r(0, 14, 16, 1, '#1e4a24');
      },
    },
    'x': {
      name: 'crate', solid: true, under: true, paint(d) {
        d.r(2, 3, 12, 12, '#5a3a1e'); d.r(3, 4, 10, 10, '#b07c44'); d.r(3, 4, 10, 1, '#d09a5a');
        d.r(3, 8, 10, 1, '#7a5030'); d.r(7, 4, 2, 10, '#8a5a30');
        d.r(2, 15, 12, 1, 'rgba(0,0,0,0.3)');
      },
    },
    'b': {
      name: 'barrel', solid: true, under: true, paint(d) {
        d.r(4, 2, 8, 13, '#4a2e18'); d.r(3, 4, 10, 9, '#4a2e18');
        d.r(5, 3, 6, 11, '#9a6a38'); d.r(4, 5, 8, 7, '#9a6a38');
        d.r(4, 5, 8, 1, '#5a5a6a'); d.r(4, 11, 8, 1, '#5a5a6a'); d.r(6, 3, 4, 1, '#b8844a');
      },
    },
    'f': {
      name: 'fence', solid: true, under: true, paint(d) {
        d.r(0, 6, 16, 2, '#8a5a30'); d.r(0, 10, 16, 2, '#8a5a30');
        d.r(1, 4, 3, 11, '#6a4224'); d.r(12, 4, 3, 11, '#6a4224'); d.r(1, 4, 3, 1, '#a87a48'); d.r(12, 4, 3, 1, '#a87a48');
      },
    },
    'q': { // dock railing
      name: 'rail', solid: true, pier: true, paint(d, tx, ty) {
        dock(d, tx, ty);
        d.r(0, 3, 16, 2, '#5a3a22'); d.r(0, 3, 16, 1, '#c08a50');
        d.r(1, 3, 2, 9, '#5a3a22'); d.r(13, 3, 2, 9, '#5a3a22');
      },
    },
    's': {
      name: 'stall', solid: true, under: true, paint(d, tx) {
        const c = ['#d04a4a', '#3a8ad0', '#e0a030'][tx % 3];
        for (let x = 0; x < 16; x += 4) { d.r(x, 0, 2, 5, c); d.r(x + 2, 0, 2, 5, '#f4ece0'); }
        d.r(0, 5, 16, 1, '#5a3a22');
        d.r(1, 8, 14, 7, '#7a5030'); d.r(1, 8, 14, 2, '#b07c44');
        d.r(3, 6, 3, 2, '#e0b060'); d.r(9, 6, 4, 2, '#d07a40');
      },
    },
    'u': {
      name: 'bench', solid: true, under: true, paint(d) {
        d.r(1, 7, 14, 3, '#8a5a30'); d.r(1, 7, 14, 1, '#b07c44'); d.r(2, 10, 2, 4, '#4a2e18'); d.r(12, 10, 2, 4, '#4a2e18');
      },
    },
    '~': {
      name: 'water', solid: true, anim: true, paint(d, tx, ty, f) {
        d.r(0, 0, 16, 16, '#2a6aa0');
        const o = Math.floor(f / 12) % 8;
        for (let i = 0; i < 3; i++) { const y = 3 + i * 5; d.r((o + i * 5 + tx * 3) % 16, y, 4, 1, '#6ab0e0'); }
        if (H(tx, ty, Math.floor(f / 20)) > 0.8) d.p(8, 8, '#e0f4ff');
      },
    },
    'k': {
      name: 'shelf', solid: true, paint(d, tx, ty) {
        d.r(0, 0, 16, 16, '#3a2216'); d.r(1, 1, 14, 14, '#5a3a22');
        const bc = ['#a03a3a', '#3a8a4a', '#3a4aa0', '#c0a040', '#7a3a8a', '#d0d0e0'];
        for (let sh = 0; sh < 3; sh++) {
          const y = 1 + sh * 5;
          d.r(1, y + 4, 14, 1, '#2a160c');
          let x = 2;
          while (x < 14) {
            const w = 1 + Math.floor(H(tx * 7 + x, ty * 3 + sh, 1) * 2);
            const h = 3 + Math.floor(H(tx + x, ty + sh, 2) * 2);
            d.r(x, y + 4 - h, w, h, bc[Math.floor(H(tx + x * 3, ty + sh * 5, 3) * 6)]);
            x += w + (H(tx, x, sh) > 0.85 ? 1 : 0);
          }
        }
      },
    },
    'P': {
      name: 'pillar', solid: true, under: true, paint(d) {
        d.r(4, 0, 8, 16, '#c8ccdc'); d.r(5, 0, 2, 16, '#eef0f8'); d.r(10, 0, 2, 16, '#9aa0b8');
        d.r(3, 0, 10, 2, '#f0d070'); d.r(3, 14, 10, 2, '#f0d070');
      },
    },
    'd': {
      name: 'desk', solid: true, under: true, paint(d) {
        d.r(0, 4, 16, 9, '#4a2a18'); d.r(0, 4, 16, 3, '#8a5a30'); d.r(1, 13, 2, 3, '#3a2010'); d.r(13, 13, 2, 3, '#3a2010');
        d.r(3, 3, 5, 3, '#f0e8d0'); d.r(4, 4, 3, 1, '#a0a0c0'); d.r(10, 2, 2, 3, '#2a2a3a'); d.r(10, 1, 1, 1, '#f0f0f0');
      },
    },
    'm': { // map table (Aldrith's study)
      name: 'maptable', solid: true, under: true, paint(d) {
        d.r(0, 3, 16, 11, '#3a2010'); d.r(1, 4, 14, 8, '#e8dcb8');
        d.r(3, 6, 3, 2, '#7aa0c0'); d.r(9, 5, 4, 3, '#7aa0c0'); d.r(6, 9, 3, 2, '#7aa0c0');
        d.p(4, 6, '#d02020'); d.p(10, 6, '#d02020'); d.p(7, 9, '#d02020');
      },
    },
    'G': {
      name: 'globe', solid: true, under: true, anim: true, light: { r: 18, color: '#6ff3ff', glow: 0.4 }, paint(d, tx, ty, f) {
        d.r(7, 11, 2, 4, '#c8a040'); d.r(5, 14, 6, 2, '#c8a040');
        d.r(4, 2, 8, 9, '#1a2050'); d.r(3, 4, 10, 5, '#1a2050');
        for (let i = 0; i < 5; i++) { const a = (f / 40 + i * 1.3) % 6.28; d.p(8 + Math.round(Math.cos(a) * 4), 6 + Math.round(Math.sin(a * 2) * 2), '#f0d070'); }
        d.p(6, 4, '#9ae0ff');
      },
    },
    'Z': {
      name: 'bed', solid: true, under: true, paint(d) {
        d.r(1, 1, 14, 14, '#4a2a18'); d.r(2, 2, 12, 4, '#f0ecf4'); d.r(2, 6, 12, 8, '#3b5fc0'); d.r(2, 6, 12, 1, '#6f8fe0');
      },
    },
    'c': {
      name: 'candles', solid: true, under: true, anim: true, light: { r: 24, color: '#ffb050', glow: 0.5 }, paint(d, tx, ty, f) {
        d.r(4, 9, 8, 5, '#c8a040'); d.r(5, 6, 2, 4, '#f0ecdc'); d.r(9, 7, 2, 3, '#f0ecdc');
        const fl = Math.floor(f / 5) % 2;
        d.p(5 + fl, 5, '#ffd060'); d.p(9 + (1 - fl), 6, '#ffd060');
      },
    },
    'B': {
      name: 'bridge', anim: true, bridge: true, light: { r: 16, color: '#6ff3ff', glow: 0.35 },
      paint(d, tx, ty, f) {
        const fl = G.world ? G.world.bridgeFlicker(tx, ty, f) : 1;
        const a = 0.35 + 0.65 * fl;
        d.ctx.globalAlpha = a;
        d.r(0, 2, 16, 12, '#1a5a8a');
        for (let i = 0; i < 4; i++) {
          const y = 3 + i * 3;
          for (let x = 0; x < 16; x++) {
            const w = Math.sin((x + f * 0.15 + i * 2 + tx * 16) * 0.5);
            d.p(x, y + (w > 0.3 ? 1 : 0), w > 0 ? '#6ff3ff' : '#3ab0e0');
          }
        }
        d.r(0, 2, 16, 1, '#bff8ff'); d.r(0, 13, 16, 1, '#bff8ff');
        d.ctx.globalAlpha = 1;
      },
    },
    'W': {
      name: 'stonewindow', solid: true, anim: true, lightKey: true, light: { r: 26, color: '#ffd27a', glow: 0.5 },
      paint(d, tx, ty, f, ctx, lit) {
        T.v.paint(d, tx, ty);
        d.r(4, 2, 8, 11, '#141a36'); d.r(5, 1, 6, 1, '#141a36');
        d.r(5, 3, 6, 9, lit ? '#ffd890' : '#24305a'); d.r(6, 2, 4, 1, lit ? '#ffd890' : '#24305a');
        d.r(7, 2, 2, 10, '#141a36');
        if (lit) d.p(5, 4, '#fff6d0');
        d.r(3, 13, 10, 1, '#c8a040');
      },
    },
    'K': {
      name: 'stonedoor', solid: true, door: true, paint(d, tx, ty) {
        T.v.paint(d, tx, ty);
        d.r(3, 3, 10, 13, '#0e1228'); d.r(4, 2, 8, 1, '#0e1228');
        d.r(4, 4, 8, 12, '#3a2a4a'); d.r(5, 3, 6, 1, '#3a2a4a');
        d.r(7, 4, 2, 12, '#2a1e38');
        d.r(3, 2, 10, 1, '#f0d070'); d.p(10, 10, '#f0d070'); d.p(5, 10, '#f0d070');
        d.r(6, 6, 4, 1, '#6ff3ff');
      },
    },
    'M': {
      name: 'mast', solid: true, paint(d, tx, ty) {
        dock(d, tx, ty);
        d.r(6, 0, 4, 14, '#3a2414'); d.r(7, 0, 1, 14, '#6a4424'); d.r(4, 12, 8, 3, '#2a1a10');
      },
    },
    '<': {
      name: 'stairs', paint(d) {
        d.r(0, 0, 16, 16, '#1a1020');
        for (let i = 0; i < 4; i++) { d.r(0, i * 4, 16, 3, ['#4a3a5a', '#5a4a6a', '#6a5a7a', '#7a6a8a'][i]); d.r(0, i * 4 + 3, 16, 1, '#1a1020'); }
        d.r(0, 0, 1, 16, '#2a2030'); d.r(15, 0, 1, 16, '#2a2030');
      },
    },
    'Q': { name: 'station', solid: true, paint: cobble }, // footprint of the tap-station object
    'E': { name: 'exit', paint: stone }, // stone floor that is flagged in maps as a warp
  });
  delete T.d2;

  /* ---------- cliffs under floating islands ---------- */
  G.paintCliff = function (ctx, ox, oy, depth, tx, ty, leftOpen, rightOpen) {
    const d = D(ctx, ox, oy);
    if (depth === 1) {
      d.r(0, 0, 16, 16, '#6a4a32');
      d.r(0, 0, 16, 2, '#3e7a32');
      for (let i = 0; i < 6; i++) d.r(Math.floor(H(tx, ty, i) * 15), 2 + Math.floor(H(tx, ty, i + 9) * 12), 2, 1, '#54382a');
      d.r(0, 6, 16, 1, '#7a5a3a'); d.r(0, 11, 16, 1, '#5a3e2a');
      if (H(tx, ty, 20) > 0.5) d.r(Math.floor(H(tx, ty, 21) * 14), 2, 1, 5, '#2e5a2a');
    } else {
      // tapering rock with hanging roots
      const w = 16;
      for (let y = 0; y < 16; y++) {
        const inset = Math.floor((y / 16) * 7 + H(tx, y, 3) * 2);
        const l = leftOpen ? inset : 0, r = rightOpen ? inset : 0;
        if (l + r < w) d.r(l, y, w - l - r, 1, y % 5 === 0 ? '#4a3222' : '#5a3e2a');
      }
      for (let i = 0; i < 2; i++) {
        const x = 3 + Math.floor(H(tx, ty, i + 40) * 10);
        const len = 4 + Math.floor(H(tx, ty, i + 50) * 10);
        d.r(x, 10, 1, len, '#3a5a2a');
      }
    }
  };

  // invisible glow helper for map-specific lights
  G.tileLight = (ch) => (T[ch] ? T[ch].light : null);
  G.makeTileDrawer = D;
})();
