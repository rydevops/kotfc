/* =========================================================================
   tiles-more.js — tiles for Acts II-IV, in the same 16-bit manner as
   tiles.js: flat colour fields, crisp three-tone shapes, dark rims on props.

   Hullhaven    H hull plate · i hull wall · J balloon-canvas roof · O hatch door
   Tallow Cay   e black stone · I crystal lamp · N tar roof · Y shack wall
   Dimmerrow    l grey grass · y grey tall grass · A grey path · j wilted flowers
                z grey wall · U grey roof · S dead tree · 1 ember brazier
   Hushwell     t terrace wall · p garden path · C blossom tree · F still pool
                V humming stone
   Aurelith     $ sunken floor · ! sunken wall · @ broken column · & shallows
                : crown door · ( workbench · ) log terminal
   Foundry      + grating · * foundry wall · - molten channel · ; rune plate
                / sealed vault · | keyhole pedestal · > core glass · ? furnace
                ] great gear
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const H = U.hash;
  const make = G.tileSprite;
  const T = G.TILES;

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
  const pc = {};
  const prop = (key, w, h, fn, col) => pc[key] || (pc[key] = rim(make(key, w, h, fn), col));
  const v4 = (tx, ty, s = 1) => Math.floor(H(tx, ty, s) * 4);

  /* ======================= HULLHAVEN ======================= */
  function hullPlate(v) {
    return make('hullplate' + v, 16, 16, (P) => {
      const base = ['#6a4a38', '#684836', '#704e3a', '#644432'][v];
      P.r(0, 0, 16, 16, base);
      P.r(0, 0, 16, 1, '#2e1c14'); P.r(0, 0, 1, 16, '#2e1c14');
      P.r(1, 1, 15, 1, '#8a6650'); P.r(1, 1, 1, 15, '#7a5844');
      P.r(15, 1, 1, 15, '#4a3024'); P.r(1, 15, 15, 1, '#4a3024');
      for (const [x, y] of [[3, 3], [12, 3], [3, 12], [12, 12]]) { P.p(x, y, '#d8b890'); P.p(x + 1, y + 1, '#2a1a12'); P.p(x, y + 1, '#8a6a50'); }
      if (v === 1) for (let i = 0; i < 9; i++) { const x = 4 + Math.floor(H(i, 1, 21) * 8), y = 4 + Math.floor(H(i, 2, 21) * 8); P.r(x, y, 2, 1, i % 2 ? '#9a5a2e' : '#b0703a'); P.p(x, y + 1, '#5a3420'); }
      if (v === 2) { for (let y = 5; y < 11; y += 2) { P.r(4, y, 8, 1, '#2a1a12'); P.r(4, y + 1, 8, 1, '#8a6650'); } }
      if (v === 3) { for (let i = 0; i < 16; i += 4) { P.p(2 + i % 12, 6, '#8a6650'); P.p(4 + i % 10, 8, '#8a6650'); P.p(3 + i % 11, 10, '#8a6650'); } P.r(6, 5, 4, 1, '#3a2418'); }
    });
  }
  T.H = { name: 'hullplate', paint(d, tx, ty) { d.img(hullPlate(v4(tx, ty, 3))); } };

  T.i = {
    name: 'hullwall', solid: true, paint(d, tx, ty) {
      d.img(make('hullwall' + (tx % 3), 16, 16, (P) => {
        const v = tx % 3;
        P.r(0, 0, 16, 16, '#4a3a38');
        P.r(0, 0, 16, 11, '#7a6a5a'); P.r(0, 0, 16, 1, '#a8987e'); P.r(0, 10, 16, 1, '#2e2420');
        P.r(0, 11, 16, 5, '#3e302c'); P.r(0, 11, 16, 1, '#5a4840');
        for (let x = 1; x < 16; x += 4) { P.p(x, 12, '#b09a80'); P.p(x, 14, '#201814'); }
        P.r(15, 0, 1, 11, '#5a4c40');
        if (v === 0) { // porthole
          P.r(4, 2, 8, 7, '#a07a32'); P.r(5, 1, 6, 9, '#a07a32'); P.r(5, 3, 6, 5, '#14303a'); P.r(6, 2, 4, 7, '#14303a');
          P.r(6, 3, 2, 2, '#58b8c8'); P.p(6, 3, '#d8ffff'); P.r(7, 6, 3, 1, '#2a6a7a');
          P.r(4, 2, 8, 1, '#e0c070');
        } else if (v === 1) { // panel with lashing
          P.r(1, 2, 14, 7, '#6a5c4e'); P.r(1, 2, 14, 1, '#8a7a68');
          P.r(1, 2, 1, 7, '#8a7a68'); P.r(7, 2, 2, 7, '#c8b890'); P.r(7, 2, 1, 7, '#e8d8b0');
          for (let y = 3; y < 9; y += 2) P.r(7, y, 2, 1, '#8a7a58');
        } else { // painted name plate
          P.r(2, 3, 12, 5, '#2a3a50'); P.r(2, 3, 12, 1, '#4a5c78'); P.r(3, 4, 4, 1, '#e8dcc0'); P.r(9, 4, 3, 1, '#e8dcc0'); P.r(3, 6, 8, 1, '#c8b890');
        }
      }));
    },
  };

  T.J = {
    name: 'canvasroof', solid: true, paint(d, tx, ty) {
      d.img(make('canvas' + ((tx + ty) % 4), 16, 16, (P) => {
        const v = (tx + ty) % 4;
        P.r(0, 0, 16, 16, '#d8c8a0');
        for (let x = 0; x < 16; x += 4) { P.r(x, 0, 1, 16, '#b8a678'); P.r(x + 1, 0, 1, 16, '#ece0bc'); }
        const patch = ['#a8583a', '#5a7a88', '#8a8a4a', '#7a5a8a'][v];
        P.r(2 + v, 3, 6, 6, patch); P.r(2 + v, 3, 6, 1, U.shade(patch, 0.3)); P.r(2 + v, 8, 6, 1, U.shade(patch, -0.3));
        for (let i = 0; i < 6; i += 2) { P.p(2 + v + i, 3, '#2a1a12'); P.p(2 + v + i, 8, '#2a1a12'); }
        P.r(0, 13, 16, 1, '#8a7a56'); P.r(0, 14, 16, 2, '#5a4a34'); P.r(0, 14, 16, 1, '#7a6a48');
        if (v % 2) { P.r(10, 0, 1, 14, '#6a5a3e'); P.p(10, 5, '#a89868'); P.p(10, 10, '#a89868'); }
      }));
    },
  };

  T.O = {
    name: 'hatch', solid: true, door: true, paint(d, tx, ty) {
      T.i.paint(d, 2, ty);
      d.img(make('hatch', 16, 16, (P) => {
        P.r(3, 1, 10, 15, '#2a1a12'); P.r(4, 2, 8, 14, '#7a5a3a'); P.r(4, 2, 8, 1, '#a07a4a'); P.r(4, 2, 1, 14, '#9a7444');
        P.r(11, 2, 1, 14, '#4a3420'); P.r(4, 7, 8, 2, '#3a2a1e'); P.r(5, 7, 6, 1, '#6a5640');
        P.r(9, 10, 3, 3, '#b08a38'); P.p(10, 11, '#f0d070'); P.r(2, 15, 12, 1, '#9a8a78');
        for (const [x, y] of [[5, 4], [10, 4], [5, 13], [10, 14]]) P.p(x, y, '#d0b080');
      }));
    },
  };

  /* ======================= TALLOW CAY ======================= */
  T.e = {
    name: 'blackstone', paint(d, tx, ty) {
      d.img(make('blackstone' + v4(tx, ty, 5), 16, 16, (P) => {
        const v = v4(tx, ty, 5);
        P.r(0, 0, 16, 16, '#1e1c2a');
        P.r(0, 0, 16, 1, '#0c0a14'); P.r(0, 0, 1, 16, '#0c0a14'); P.r(8, 0, 1, 16, '#0c0a14'); P.r(0, 8, 16, 1, '#0c0a14');
        for (const [x, y] of [[1, 1], [9, 1], [1, 9], [9, 9]]) { P.r(x, y, 6, 1, '#34304a'); P.r(x, y, 1, 6, '#2c2a40'); P.p(x + 5, y + 5, '#141220'); }
        const vein = ['#3aff9a', '#ffb83a', '#3aff9a', '#8a5aff'][v];
        if (v !== 2) { P.p(3, 4, vein); P.p(4, 5, vein); P.p(5, 5, vein); P.p(11, 12, vein); P.p(12, 12, U.shade(vein, -0.4)); }
        else { P.p(11, 3, vein); P.p(12, 4, vein); P.p(4, 12, '#ffb83a'); }
      }));
    },
  };

  function crystalLampSprite(lit, f) {
    return prop('crylamp' + lit + f, 12, 34, (P) => {
      const ir = ['#14101c', '#34304a', '#58547a'];
      P.r(5, 12, 2, 20, ir[1]); P.r(5, 12, 1, 20, ir[2]);
      P.r(3, 31, 6, 3, ir[1]); P.r(3, 31, 6, 1, ir[2]);
      P.r(3, 11, 6, 2, ir[0]); P.r(4, 10, 4, 1, ir[1]);
      const c = lit ? (f ? ['#18a05a', '#3aff9a', '#b8ffd8', '#ffffff'] : ['#20b868', '#58ffaa', '#d0ffe8', '#ffffff']) : ['#1c2a2a', '#2e4038', '#4a5e56', '#6a8078'];
      // faceted crystal
      P.r(5, 1, 2, 1, c[2]); P.r(4, 2, 4, 2, c[1]); P.r(3, 4, 6, 4, c[1]); P.r(4, 8, 4, 2, c[0]); P.r(5, 10, 2, 1, c[0]);
      P.r(4, 2, 1, 6, c[2]); P.r(5, 3, 1, 4, c[3]); P.r(8, 4, 1, 4, c[0]);
      P.p(2, 5, c[0]); P.p(9, 5, c[0]);
    }, '#0c0a14');
  }
  T.I = {
    name: 'crystallamp', solid: true, under: true, lightKey: true, anim: false,
    light: { r: 38, color: '#58ffaa', glow: 0.8 },
    tall: (ctx, px, py, tx, ty, f, lit) => { ctx.drawImage(crystalLampSprite(lit ? 1 : 0, Math.floor(f / 18 + tx) % 2), px + 2, py - 20); },
    paint() {},
  };

  T.N = {
    name: 'tarroof', solid: true, paint(d, tx, ty) {
      d.img(make('tarroof' + ((tx + ty) % 2), 16, 16, (P) => {
        P.r(0, 0, 16, 16, '#2e2428');
        for (let y = 0; y < 16; y += 4) { P.r(0, y, 16, 3, '#4a3a3a'); P.r(0, y, 16, 1, '#6a5656'); P.r(0, y + 3, 16, 1, '#1a1214'); }
        const s = (tx + ty) % 2 ? 3 : 10;
        for (let y = 0; y < 16; y += 8) { P.r(s, y, 1, 4, '#1a1214'); P.r(15 - s, y + 4, 1, 4, '#1a1214'); }
        P.p(2, 1, '#8a7a6a'); P.p(13, 9, '#8a7a6a');
      }));
    },
  };
  T.Y = {
    name: 'shackwall', solid: true, paint(d, tx, ty) {
      d.img(make('shack' + (tx % 3), 16, 16, (P) => {
        const v = tx % 3;
        P.r(0, 0, 16, 16, '#5a4030');
        for (let x = 0; x < 16; x += 4) { P.r(x, 0, 3, 16, v ? '#6a4c38' : '#654836'); P.r(x, 0, 1, 16, '#8a6648'); P.r(x + 3, 0, 1, 16, '#2e1e14'); }
        P.r(0, 0, 16, 2, '#2a1c14'); P.r(0, 14, 16, 2, '#2a1c14');
        if (v === 0) { P.r(3, 5, 10, 4, '#1a1410'); P.r(4, 6, 8, 2, '#ffb83a'); P.r(4, 6, 8, 1, '#ffe08a'); P.r(7, 5, 2, 4, '#2a1c14'); }
        if (v === 1) { P.r(5, 4, 6, 7, '#e8d8a8'); P.r(5, 4, 6, 1, '#fff4d0'); P.r(6, 6, 4, 1, '#8a5a2a'); P.r(6, 8, 3, 1, '#8a5a2a'); P.p(5, 4, '#2a1c14'); P.p(10, 4, '#2a1c14'); }
        if (v === 2) { P.r(2, 4, 12, 6, '#1a1410'); P.r(3, 5, 4, 4, '#3aff9a'); P.r(9, 5, 4, 4, '#3aff9a'); P.r(3, 5, 4, 1, '#b8ffd8'); P.r(9, 5, 4, 1, '#b8ffd8'); }
      }));
    },
  };

  /* ======================= DIMMERROW ======================= */
  const GR = { d: '#4e5252', s: '#646a68', m: '#7a807c', l: '#949a94', h: '#b0b6ae' };
  function greyGrass(v) {
    return make('greygrass' + v, 16, 16, (P) => {
      P.r(0, 0, 16, 16, GR.m);
      for (let i = 0; i < 4; i++) {
        const x = (i % 2) * 8 + 1 + Math.floor(H(v, i, 31) * 5), y = (i >> 1) * 8 + 2 + Math.floor(H(v, i, 32) * 4);
        if (H(v, i, 33) < 0.3) continue;
        P.p(x, y + 1, GR.s); P.p(x + 1, y, GR.s); P.p(x + 2, y + 1, GR.s); P.p(x + 1, y + 1, GR.d); P.p(x + 1, y - 1, GR.l);
      }
      if (v % 3 === 0) { P.p(3 + v, 11, GR.l); P.p(4 + v, 11, GR.h); }
    });
  }
  T.l = { name: 'greygrass', paint(d, tx, ty) { d.img(greyGrass(Math.floor(H(tx, ty, 41) * 6))); } };
  T.y = {
    name: 'greytall', encounter: true, paint(d) {
      d.img(make('greytall', 16, 16, (P) => {
        P.r(0, 0, 16, 16, GR.s);
        const clump = (cx, cy) => {
          for (const [dx, h, lean] of [[-2, 5, -1], [-1, 7, 0], [0, 8, 0], [1, 6, 1], [2, 4, 1]]) {
            for (let j = 0; j < h; j++) { P.p(cx + dx + (j > h - 3 ? lean : 0), cy - j, j > h - 2 ? GR.h : j > h / 2 ? GR.l : GR.m); }
          }
          P.r(cx - 2, cy + 1, 5, 1, GR.d);
        };
        clump(4, 7); clump(12, 6); clump(8, 14); clump(0, 15); clump(16, 15);
      }));
    },
  };
  T.A = {
    name: 'greypath', paint(d, tx, ty) {
      d.img(make('greypath' + (ty % 2), 16, 16, (P) => {
        P.r(0, 0, 16, 16, '#8a8a84');
        const off = ty % 2 ? 4 : 0;
        for (let row = 0; row < 3; row++) for (let k = -1; k < 3; k++) {
          const x = k * 6 + (row % 2 ? 3 : 0) + off, y = row * 5 + 1;
          const col = ['#a0a09a', '#96968e', '#aaaaa2'][Math.floor(H(k + row * 5, ty, 7) * 3)];
          P.r(x, y, 5, 4, col); P.r(x, y, 5, 1, '#c4c4bc'); P.r(x, y + 3, 5, 1, '#6a6a64');
        }
      }));
    },
  };
  T.j = {
    name: 'wilted', paint(d, tx, ty) {
      T.l.paint(d, tx, ty);
      for (let i = 0; i < 3; i++) {
        const x = 2 + Math.floor(H(tx, ty, i + 5) * 11), y = 3 + Math.floor(H(tx, ty, i + 9) * 9);
        d.p(x, y + 2, GR.d); d.p(x, y + 1, GR.d); d.p(x - 1, y, '#8a8e9a'); d.p(x + 1, y, '#8a8e9a'); d.p(x, y - 1, '#a8acb8'); d.p(x, y, '#c8ccd6');
        if (i === 1 && H(tx, ty, 77) > 0.6) d.p(x + 2, y - 1, '#e0a050'); // one last ember of colour
      }
    },
  };
  T.z = {
    name: 'greywall', solid: true, paint(d, tx, ty) {
      d.img(make('greywall' + (tx % 3), 16, 16, (P) => {
        const v = tx % 3;
        P.r(0, 0, 16, 16, '#aeb0b0');
        P.r(0, 0, 16, 2, '#5a5a5e'); P.r(0, 0, 16, 1, '#7a7a80'); P.r(0, 2, 16, 1, '#8a8c8e');
        P.r(0, 11, 16, 5, '#6a6a70'); P.r(0, 11, 16, 1, '#3e3e44');
        for (let i = 0; i < 4; i++) { const x = i * 4 + (v ? 2 : 0); P.r(x % 16, 12, 3, 3, '#8a8a92'); P.p(x % 16, 12, '#a8a8b0'); }
        if (v === 0) { P.r(4, 4, 8, 6, '#3a3a44'); P.r(5, 5, 6, 4, '#20202a'); P.r(7, 5, 2, 4, '#3a3a44'); P.p(5, 5, '#4a5060'); }
        if (v === 1) { P.r(0, 2, 2, 9, '#5a5a5e'); P.r(0, 2, 1, 9, '#7a7a80'); P.r(10, 5, 2, 1, '#8a8c8e'); P.p(11, 6, '#8a8c8e'); }
        if (v === 2) { for (let i = 0; i < 5; i++) P.p(3 + i * 2, 6 + (i % 2), '#8a8c90'); }
      }));
    },
  };
  T.U = {
    name: 'greyroof', solid: true, paint(d, tx, ty) {
      d.img(make('greyroof' + ((tx + ty) % 2), 16, 16, (P) => {
        P.r(0, 0, 16, 16, '#3e4048');
        for (let row = 0; row < 4; row++) {
          const off = (row + tx) % 2 ? 2 : 0;
          for (let c = -1; c < 5; c++) {
            const x = c * 4 + off, y = row * 4;
            P.r(x, y, 4, 3, '#6a6e78'); P.r(x + 1, y, 2, 1, '#8a8e98'); P.p(x, y + 2, '#50545e'); P.p(x + 3, y + 2, '#50545e');
          }
        }
        if (H(tx, ty, 8) > 0.7) { P.r(5, 5, 4, 3, '#1a1a22'); }
      }));
    },
  };
  function deadTree() {
    return prop('deadtree', 30, 34, (P) => {
      const b = ['#2e2c30', '#4a484e', '#6a6870'];
      P.r(12, 18, 6, 15, b[1]); P.r(12, 18, 2, 15, b[2]); P.r(16, 18, 2, 15, b[0]);
      P.r(9, 31, 4, 2, b[1]); P.r(17, 31, 4, 2, b[0]);
      const br = (x0, y0, x1, y1, w = 2) => {
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); P.r(x, y, w, w, i % 3 ? b[1] : b[2]); }
      };
      br(14, 19, 6, 8); br(6, 8, 2, 4, 1); br(6, 8, 8, 2, 1);
      br(16, 19, 24, 7); br(24, 7, 27, 3, 1); br(22, 10, 27, 12, 1);
      br(15, 19, 15, 4); br(15, 9, 11, 5, 1); br(15, 8, 19, 3, 1);
      P.p(2, 3, b[1]); P.p(27, 2, b[1]);
    }, '#16151a');
  }
  T.S = {
    name: 'deadtree', solid: true, under: true,
    tall: (ctx, px, py) => ctx.drawImage(deadTree(), px - 7, py - 18), paint() {},
  };
  T['1'] = {
    name: 'brazier', solid: true, under: true, anim: true, light: { r: 30, color: '#ffa850', glow: 0.7 },
    paint(d, tx, ty, f) {
      d.img(prop('brazier', 12, 12, (P) => {
        P.r(5, 8, 2, 4, '#2e2c30'); P.r(2, 11, 8, 1, '#2e2c30');
        P.r(1, 5, 10, 3, '#46444c'); P.r(1, 5, 10, 1, '#7a7882'); P.r(2, 8, 8, 1, '#26242a');
      }), 2, 4);
      const fl = Math.floor(f / 5) % 3;
      d.r(5, 1 + (fl === 1 ? 1 : 0), 3, 5, '#ff8a2a'); d.r(6, 0 + (fl === 2 ? 1 : 0), 1, 5, '#ffd060'); d.p(6, 2, '#fff4c0'); d.p(4 + fl, 3, '#ff6a20'); d.p(8, 4 - fl % 2, '#ff6a20');
    },
  };

  /* ======================= HUSHWELL ======================= */
  T.t = {
    name: 'terracewall', solid: true, paint(d, tx, ty) {
      d.img(make('terrace' + (tx % 2), 16, 16, (P) => {
        P.r(0, 0, 16, 16, '#7a8a72');
        const bl = tx % 2 ? [[0, 0, 7, 7], [7, 0, 9, 7], [0, 8, 10, 7], [10, 8, 6, 7]] : [[0, 0, 10, 7], [10, 0, 6, 7], [0, 8, 5, 7], [5, 8, 11, 7]];
        for (const [x, y, w, h] of bl) { P.r(x, y, w, h, '#9aaa8e'); P.r(x, y, w, 1, '#bccaae'); P.r(x, y, 1, h, '#aabc9e'); P.r(x, y + h - 1, w, 1, '#5e6e58'); P.r(x + w - 1, y, 1, h, '#6e7e66'); }
        P.r(0, 0, 16, 3, '#4c8a4a'); P.r(0, 0, 16, 1, '#78bc64');
        for (const x of [2, 5, 9, 13]) { P.r(x, 3, 1, 2 + (x % 3), '#4c8a4a'); }
        P.p(7, 9, '#78bc64'); P.p(8, 10, '#4c8a4a');
      }));
    },
  };
  T.p = {
    name: 'gardenpath', paint(d, tx, ty) {
      d.img(make('gpath' + v4(tx, ty, 2), 16, 16, (P) => {
        const v = v4(tx, ty, 2);
        P.r(0, 0, 16, 16, '#e0d8b8');
        for (let i = 0; i < 18; i++) { const x = Math.floor(H(i, v, 51) * 16), y = Math.floor(H(i, v, 52) * 16); P.p(x, y, i % 3 ? '#cfc6a0' : '#f0e8cc'); }
        for (const [x, y] of [[3, 3], [10, 6], [5, 11], [12, 12]]) { if (H(x, y, v) > 0.4) { P.r(x, y, 2, 1, '#a89e7c'); P.p(x, y - 1, '#f4eed8'); } }
      }));
    },
  };
  function blossomTree() {
    return prop('blossom', 32, 36, (P) => {
      const leaf = ['#c06888', '#e088a8', '#f4a8c0', '#ffcce0', '#fff0f4'];
      P.r(13, 22, 6, 13, '#6a4a3a'); P.r(13, 22, 2, 13, '#8a6a52'); P.r(17, 22, 2, 13, '#4a3226');
      P.r(11, 33, 3, 2, '#6a4a3a'); P.r(18, 33, 3, 2, '#4a3226');
      const clumps = [[16, 13, 13, 10], [8, 13, 7, 6], [24, 13, 7, 6], [16, 6, 9, 6], [9, 19, 6, 4], [23, 19, 6, 4], [16, 20, 9, 4]];
      for (const [cx, cy, rx, ry] of clumps) for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, dd = dx * dx + dy * dy;
        if (dd > 1) continue;
        const lit = -dx * 0.6 - dy * 0.8;
        P.p(x, y, dd > 0.75 && lit < 0 ? leaf[0] : lit > 0.55 ? leaf[3] : lit > 0.05 ? leaf[2] : leaf[1]);
      }
      for (let i = 0; i < 20; i++) { const a = H(i, 1, 61) * 6.28, r = H(i, 2, 61) * 11; const x = Math.round(16 + Math.cos(a) * r), y = Math.round(12 + Math.sin(a) * r * 0.7); P.p(x, y, leaf[4]); P.p(x + 1, y, leaf[3]); }
    }, '#2a1a24');
  }
  T.C = { name: 'blossomtree', solid: true, under: true, tall: (ctx, px, py) => ctx.drawImage(blossomTree(), px - 8, py - 20), paint() {} };
  T.F = {
    name: 'pool', solid: true, anim: true, paint(d, tx, ty, f) {
      d.r(0, 0, 16, 16, '#3a8a8a');
      d.r(0, 0, 16, 2, '#a8b8a0'); d.r(0, 14, 16, 2, '#6a7e68');
      d.r(0, 2, 16, 12, '#2e7a7e');
      const o = Math.floor(f / 18) % 16;
      for (let i = 0; i < 2; i++) { const y = 4 + i * 5; d.r((o + i * 7 + tx * 5) % 14, y, 3, 1, '#7ad0c8'); d.r((o + i * 7 + tx * 5 + 1) % 14, y + 1, 1, 1, '#4aa8a8'); }
      if ((tx + ty) % 3 === 0) { d.r(9, 8, 4, 3, '#4c9a5a'); d.r(10, 7, 2, 1, '#78bc64'); d.p(11, 7, '#ffd0e0'); }
      if (H(tx, ty, Math.floor(f / 30)) > 0.8) d.p(5, 6, '#ffffff');
    },
  };
  T.V = {
    name: 'hummingstone', solid: true, under: true, anim: true, light: { r: 26, color: '#8affd8', glow: 0.5 },
    paint(d, tx, ty, f) {
      d.img(prop('hstone', 12, 18, (P) => {
        P.r(1, 14, 10, 4, '#5e6a62'); P.r(2, 3, 8, 12, '#8a9890'); P.r(3, 1, 6, 3, '#8a9890'); P.r(4, 0, 4, 1, '#8a9890');
        P.r(2, 3, 2, 12, '#aebcb2'); P.r(3, 1, 2, 3, '#aebcb2'); P.r(8, 3, 2, 12, '#667468'); P.r(1, 14, 10, 1, '#aebcb2');
      }), 2, -2);
      const g = 0.5 + 0.5 * Math.sin(f / 18 + tx);
      d.ctx.globalAlpha = 0.5 + g * 0.5;
      d.r(7, 3, 2, 1, '#8affd8'); d.r(7, 3, 1, 5, '#8affd8'); d.r(6, 6, 3, 1, '#8affd8'); d.r(7, 9, 2, 2, '#bfffee'); d.r(5, 11, 4, 1, '#8affd8');
      d.ctx.globalAlpha = 1;
    },
  };

  /* ======================= AURELITH ======================= */
  T.$ = {
    name: 'sunkenfloor', anim: true, paint(d, tx, ty, f) {
      d.img(make('sunk' + ((tx + ty) % 2), 16, 16, (P) => {
        P.r(0, 0, 16, 16, '#3a8a86');
        P.r(0, 0, 16, 1, '#206060'); P.r(0, 0, 1, 16, '#206060'); P.r(8, 0, 1, 16, '#206060'); P.r(0, 8, 16, 1, '#206060');
        for (const [x, y] of [[1, 1], [9, 1], [1, 9], [9, 9]]) { P.r(x, y, 6, 1, '#6ac0b0'); P.r(x, y, 1, 6, '#58b0a4'); }
        P.p(0, 0, '#e8c860'); P.p(8, 8, '#e8c860'); P.p(0, 8, '#c8a840'); P.p(8, 0, '#c8a840');
        if ((tx + ty) % 2) { P.r(3, 3, 2, 2, '#c8a840'); P.p(3, 3, '#f8e890'); }
      }));
      // drifting caustic light
      const a = Math.floor(f / 10);
      for (let i = 0; i < 3; i++) { const x = (a + i * 5 + tx * 3) % 14, y = (i * 5 + Math.floor(a / 3) + ty * 2) % 14; d.r(x, y, 2, 1, 'rgba(200,255,240,0.5)'); }
    },
  };
  T['!'] = {
    name: 'sunkenwall', solid: true, paint(d, tx, ty) {
      d.img(make('swall' + (ty % 2), 16, 16, (P) => {
        P.r(0, 0, 16, 16, '#143a42');
        const bl = ty % 2 ? [[0, 0, 7, 7], [7, 0, 9, 7], [0, 8, 10, 7], [10, 8, 6, 7]] : [[0, 0, 10, 7], [10, 0, 6, 7], [0, 8, 5, 7], [5, 8, 11, 7]];
        for (const [x, y, w, h] of bl) { P.r(x, y, w, h, '#2a6a70'); P.r(x, y, w, 1, '#4a9a94'); P.r(x, y, 1, h, '#3a8084'); P.r(x, y + h - 1, w, 1, '#1a4a52'); }
        P.r(0, 15, 16, 1, '#e8c860'); P.r(0, 14, 16, 1, '#a08830');
        if (H(tx, ty, 3) > 0.6) { P.r(5, 3, 3, 3, '#4a8a5a'); P.p(6, 3, '#78bc78'); }
        if (H(tx, ty, 4) > 0.8) { P.r(10, 9, 2, 2, '#e8c860'); P.p(10, 9, '#fff4b0'); }
      }));
    },
  };
  function sunkenColumn() {
    return prop('scol', 14, 34, (P) => {
      const m = ['#1e5058', '#3a8084', '#6ab4b0', '#a8e0d4'], g = ['#8a6c20', '#c8a840', '#f0d878'];
      P.r(3, 6, 8, 24, m[1]); P.r(3, 6, 2, 24, m[3]); P.r(5, 6, 1, 24, m[2]); P.r(9, 6, 2, 24, m[0]);
      P.r(1, 2, 12, 4, g[1]); P.r(1, 2, 12, 1, g[2]); P.r(1, 5, 12, 1, g[0]);
      P.r(1, 30, 12, 4, g[1]); P.r(1, 30, 12, 1, g[2]); P.r(1, 33, 12, 1, g[0]);
      P.r(2, 1, 10, 1, g[1]);
      P.r(3, 13, 3, 2, '#4a8a5a'); P.p(4, 13, '#78bc78'); P.r(8, 21, 2, 3, '#4a8a5a');
    }, '#0c2a30');
  }
  T['@'] = { name: 'sunkencolumn', solid: true, under: true, tall: (ctx, px, py) => ctx.drawImage(sunkenColumn(), px + 1, py - 18), paint() {} };
  T['&'] = {
    name: 'shallows', anim: true, paint(d, tx, ty, f) {
      T.$.paint(d, tx, ty, f);
      d.ctx.fillStyle = 'rgba(40,140,170,0.55)'; d.ctx.fillRect(d.ox, d.oy, 16, 16);
      const o = Math.floor(f / 12) % 16;
      for (let i = 0; i < 3; i++) { const y = 3 + i * 5; d.r((o + i * 5 + tx * 3) % 15, y, 3, 1, 'rgba(210,255,250,0.8)'); }
      if (H(tx, ty, Math.floor(f / 26)) > 0.8) d.p(8, 8, '#ffffff');
    },
  };
  T[':'] = {
    name: 'crowndoor', solid: true, door: true, anim: true, light: { r: 24, color: '#ffe48a', glow: 0.5 }, paint(d, tx, ty, f) {
      T['!'].paint(d, tx, ty);
      d.img(make('crowndoor', 16, 16, (P) => {
        P.r(2, 1, 12, 15, '#c8a840'); P.r(4, 0, 8, 1, '#c8a840');
        P.r(3, 2, 10, 14, '#0e2a30'); P.r(5, 1, 6, 1, '#0e2a30');
        P.r(4, 3, 8, 13, '#3a6a64'); P.r(7, 3, 2, 13, '#1e4a48'); P.r(4, 3, 1, 13, '#58948a');
        P.r(5, 5, 6, 1, '#f0d878'); P.r(5, 10, 6, 1, '#f0d878'); P.p(10, 8, '#fff4b0'); P.p(5, 8, '#fff4b0');
        P.r(1, 15, 14, 1, '#f0d878');
      }));
      if (Math.floor(f / 20) % 2) d.p(8, 7, '#ffffff');
    },
  };
  T['('] = {
    name: 'workbench', solid: true, under: true, paint(d) {
      d.img(prop('wbench', 16, 14, (P) => {
        P.r(0, 3, 16, 8, '#4a3020'); P.r(0, 3, 16, 3, '#8a6240'); P.r(0, 3, 16, 1, '#b08458');
        P.r(1, 11, 2, 3, '#2a1a10'); P.r(13, 11, 2, 3, '#2a1a10');
        P.r(2, 1, 3, 3, '#7a7e8a'); P.r(2, 1, 3, 1, '#b0b4c0'); P.r(3, 4, 1, 2, '#3a3e4a');
        P.r(7, 2, 5, 2, '#c8a040'); P.r(7, 2, 5, 1, '#f0d070'); P.r(8, 0, 1, 2, '#c8a040');
        P.r(12, 1, 2, 3, '#6ff3ff'); P.p(12, 1, '#ffffff');
      }), 0, 2);
    },
  };
  T[')'] = {
    name: 'logterminal', solid: true, under: true, anim: true, light: { r: 24, color: '#6ff3ff', glow: 0.55 }, paint(d, tx, ty, f) {
      d.img(prop('logterm', 14, 16, (P) => {
        P.r(5, 10, 4, 6, '#3a3e4a'); P.r(2, 14, 10, 2, '#2a2e3a'); P.r(2, 14, 10, 1, '#5a5e6a');
        P.r(1, 0, 12, 11, '#2a2e3a'); P.r(1, 0, 12, 1, '#6a6e7a'); P.r(2, 1, 10, 9, '#08202a');
      }), 1, 0);
      const l = Math.floor(f / 9) % 4;
      for (let i = 0; i < 4; i++) d.r(4, 3 + i * 2, i === l ? 8 : 5 + (i % 2) * 2, 1, i === l ? '#e0ffff' : '#2aa8c0');
    },
  };

  /* ======================= THE FOUNDRY ======================= */
  T['+'] = {
    name: 'grating', anim: true, paint(d, tx, ty, f) {
      d.r(0, 0, 16, 16, '#0e0c10');
      const glow = 0.55 + 0.25 * Math.sin(f / 30 + tx * 0.7 + ty * 0.4);
      d.ctx.fillStyle = `rgba(255,${110 + Math.round(glow * 60)},30,${0.35 + glow * 0.35})`; d.ctx.fillRect(d.ox + 1, d.oy + 1, 14, 14);
      for (let i = 0; i < 4; i++) { d.r(0, i * 4, 16, 2, '#3a3844'); d.r(0, i * 4, 16, 1, '#6a6878'); d.r(0, i * 4 + 2, 16, 1, '#1a181e'); }
      for (let i = 0; i < 4; i++) d.r(2 + i * 4, 0, 1, 16, 'rgba(18,16,22,0.8)');
      d.p(0, 0, '#8a889a');
    },
  };
  T['*'] = {
    name: 'foundrywall', solid: true, anim: true, paint(d, tx, ty, f) {
      d.img(make('fwall' + (tx % 3), 16, 16, (P) => {
        const v = tx % 3;
        P.r(0, 0, 16, 16, '#1c1a22');
        P.r(0, 0, 16, 7, '#34323e'); P.r(0, 0, 16, 1, '#5a586a'); P.r(0, 7, 16, 1, '#0c0a10');
        P.r(0, 8, 16, 7, '#2a2832'); P.r(0, 8, 16, 1, '#4a4858'); P.r(0, 15, 16, 1, '#0c0a10');
        for (const [x, y] of [[2, 2], [13, 2], [2, 10], [13, 10]]) { P.p(x, y, '#7a788a'); P.p(x + 1, y + 1, '#0c0a10'); }
        if (v === 1) { P.r(6, 1, 4, 6, '#14121a'); P.r(7, 2, 2, 4, '#46445a'); }
      }));
      // molten seam between the plates
      const g = 0.5 + 0.5 * Math.sin(f / 22 + tx * 1.3 + ty);
      d.ctx.fillStyle = `rgba(255,${120 + Math.round(g * 80)},40,${0.55 + g * 0.35})`; d.ctx.fillRect(d.ox + 3, d.oy + 7, 10, 1);
      d.ctx.fillStyle = `rgba(255,190,80,${0.2 + g * 0.2})`; d.ctx.fillRect(d.ox + 3, d.oy + 6, 10, 1); d.ctx.fillRect(d.ox + 3, d.oy + 8, 10, 1);
    },
  };
  T['-'] = {
    name: 'lava', solid: true, anim: true, light: { r: 30, color: '#ff8a30', glow: 0.55 }, paint(d, tx, ty, f) {
      d.r(0, 0, 16, 16, '#c8400e');
      const o = Math.floor(f / 10) % 16;
      for (let i = 0; i < 4; i++) { const y = 1 + i * 4; d.r((o + i * 6 + tx * 4) % 13, y, 5, 1, '#ffb030'); d.r((o + i * 6 + tx * 4 + 1) % 13, y + 1, 3, 1, '#ff7a20'); d.r((o + i * 6 + tx * 4 + 2) % 13, y - 1 < 0 ? 0 : y - 1, 1, 1, '#fff0a0'); }
      d.r(0, 0, 16, 1, '#6a1c08'); d.r(0, 15, 16, 1, '#6a1c08');
      if (H(tx, ty, Math.floor(f / 20)) > 0.85) d.p(5 + (tx % 6), 8, '#ffffff');
    },
  };
  T[';'] = {
    name: 'runeplate', anim: true, lightKey: false, paint(d, tx, ty, f, ctx, lit) {
      T['+'].paint(d, tx, ty, f);
      const on = !!(G.world && G.world.lightOverride && G.world.lightOverride[tx + ',' + ty]);
      d.r(2, 2, 12, 12, '#0c0a10'); d.r(3, 3, 10, 10, on ? '#2a8ac8' : '#2a2e46'); d.r(3, 3, 10, 1, on ? '#8ae0ff' : '#44486a');
      const pulse = Math.floor(f / 12) % 2;
      d.r(7, 5, 2, 6, on ? (pulse ? '#ffffff' : '#bff8ff') : '#5a5e84'); d.r(5, 7, 6, 2, on ? (pulse ? '#ffffff' : '#bff8ff') : '#5a5e84');
      if (on) { d.ctx.fillStyle = 'rgba(111,243,255,0.25)'; d.ctx.fillRect(d.ox, d.oy, 16, 16); }
    },
  };
  T['/'] = {
    name: 'vaultdoor', solid: true, door: true, anim: true, light: { r: 20, color: '#6ff3ff', glow: 0.35 }, paint(d, tx, ty, f) {
      T['*'].paint(d, 0, ty, 0);
      d.img(make('vdoor' + (tx % 2), 16, 16, (P) => {
        P.r(0, 1, 16, 15, '#5a586a'); P.r(0, 1, 16, 1, '#a8a6bc'); P.r(0, 1, 1, 15, '#8a889c'); P.r(15, 1, 1, 15, '#34323e');
        P.r(2, 3, 12, 12, '#2a2832'); P.r(3, 4, 10, 10, '#46445a');
        P.r(7, 3, 2, 12, '#1a181e');
        for (const y of [5, 9, 12]) { P.r(3, y, 4, 1, '#8a889c'); P.r(9, y, 4, 1, '#8a889c'); }
        P.r(7, 8, 2, 2, '#c8a040'); P.p(7, 8, '#f0d070');
      }));
      const g = 0.5 + 0.5 * Math.sin(f / 16);
      d.ctx.fillStyle = `rgba(111,243,255,${0.4 + g * 0.5})`; d.ctx.fillRect(d.ox + 7, d.oy + 3, 2, 1); d.ctx.fillRect(d.ox + 7, d.oy + 14, 2, 1);
    },
  };
  T['|'] = {
    name: 'keyhole', solid: true, under: true, anim: true, light: { r: 26, color: '#ffd060', glow: 0.55 }, paint(d, tx, ty, f) {
      d.img(prop('keyped', 14, 18, (P) => {
        P.r(2, 12, 10, 6, '#3a384a'); P.r(2, 12, 10, 1, '#6a687e'); P.r(1, 17, 12, 1, '#1a181e');
        P.r(3, 3, 8, 10, '#5a586e'); P.r(3, 3, 8, 1, '#9896b0'); P.r(3, 3, 1, 10, '#7a788e'); P.r(10, 3, 1, 10, '#34323e');
        P.r(5, 0, 4, 4, '#5a586e'); P.r(5, 0, 4, 1, '#9896b0');
        P.r(6, 5, 2, 2, '#0c0a10'); P.r(6, 7, 2, 4, '#0c0a10'); P.p(6, 5, '#2a2832');
      }), 1, -2);
      const g = 0.5 + 0.5 * Math.sin(f / 14);
      d.ctx.fillStyle = `rgba(255,208,96,${0.35 + g * 0.5})`; d.ctx.fillRect(d.ox + 7, d.oy + 3, 2, 2); d.ctx.fillRect(d.ox + 7, d.oy + 5, 2, 4);
    },
  };
  T['>'] = {
    name: 'coreglass', anim: true, paint(d, tx, ty, f) {
      d.r(0, 0, 16, 16, '#d8e4f4');
      d.r(0, 0, 16, 1, '#ffffff'); d.r(0, 0, 1, 16, '#f4f8ff'); d.r(15, 0, 1, 16, '#9ab0d0'); d.r(0, 15, 16, 1, '#9ab0d0');
      for (let i = 0; i < 3; i++) {
        const g = Math.sin((tx * 16 + f * 0.5 + i * 6) * 0.2 + ty * 2);
        const x = (Math.floor(f / 3) + i * 5 + tx * 7) % 16;
        d.r(x, 3 + i * 4, 3, 1, g > 0.2 ? '#6ff3ff' : '#a8e8ff');
        d.p((x + 1) % 16, 4 + i * 4, '#ffffff');
      }
      d.ctx.fillStyle = 'rgba(255,240,180,0.08)'; d.ctx.fillRect(d.ox, d.oy, 16, 16);
    },
  };
  T['?'] = {
    name: 'furnace', solid: true, anim: true, light: { r: 44, color: '#ff8a30', glow: 0.8 }, paint(d, tx, ty, f) {
      d.img(make('furn' + (tx % 2), 16, 16, (P) => {
        P.r(0, 0, 16, 16, '#26242c');
        P.r(0, 0, 16, 2, '#5a586a'); P.r(0, 14, 16, 2, '#14121a');
        P.r(2, 3, 12, 11, '#14121a'); P.r(2, 3, 12, 1, '#6a687a');
        P.r(1, 2, 1, 12, '#46445a'); P.r(14, 2, 1, 12, '#46445a');
      }));
      const fl = Math.floor(f / 4) % 3;
      d.r(3, 5, 10, 8, '#8a2a08'); d.r(4, 6, 8, 7, '#e0601a'); d.r(5, 8 - (fl === 1 ? 1 : 0), 6, 5, '#ffa030'); d.r(6, 9 - fl % 2, 4, 4, '#ffe080');
      d.r(7, 4 + fl, 2, 3, '#ffd060'); d.p(5 + fl, 5, '#ff7a20'); d.p(10 - fl, 6, '#ff7a20');
    },
  };
  T[']'] = {
    name: 'greatgear', solid: true, anim: true, paint(d, tx, ty, f) {
      d.r(0, 0, 16, 16, '#14121a');
      const cx = 8, cy = 8, a0 = f * 0.02 * (((tx + ty) % 2) ? 1 : -1);
      d.ctx.fillStyle = '#5a586e';
      for (let i = 0; i < 8; i++) {
        const a = a0 + i * Math.PI / 4;
        d.ctx.save(); d.ctx.translate(d.ox + cx, d.oy + cy); d.ctx.rotate(a); d.ctx.fillRect(-1, -8, 3, 4); d.ctx.restore();
      }
      d.ctx.fillStyle = '#46445a'; d.ctx.beginPath(); d.ctx.arc(d.ox + cx, d.oy + cy, 6, 0, 6.3); d.ctx.fill();
      d.ctx.fillStyle = '#7a788e'; d.ctx.beginPath(); d.ctx.arc(d.ox + cx - 1, d.oy + cy - 1, 5, 0, 6.3); d.ctx.fill();
      d.ctx.fillStyle = '#26242c'; d.ctx.beginPath(); d.ctx.arc(d.ox + cx, d.oy + cy, 2.2, 0, 6.3); d.ctx.fill();
      d.ctx.fillStyle = '#ff8a30'; d.ctx.fillRect(d.ox + cx - 1, d.oy + cy - 1, 2, 2);
    },
  };
})();
