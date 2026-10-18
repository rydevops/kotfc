/* =========================================================================
   backdrops-more.js — skies and battle backdrops for Acts II-IV.
   Each backdrop is a painted panorama above the horizon and a Mode-7 floor.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const H = U.hash;
  const BD = G.backdrops;
  const { bands, stars, cloud, islet } = BD;
  const hex = (h) => U.hexToRgb(h);
  const rect = (x, a, b, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };

  /* ---------- skies for the overworld ---------- */
  Object.assign(G.sky.SKIES, {
    mist: { stops: ['#161e1c', '#22302c', '#38504a', '#648078', '#a0b8a8'], cloud: '#c0d0c4', cloudShade: '#56706a', sea: '#9cb4a8', seaShade: '#3e5650', tint: '#3e5a52', stars: 0.05 },
    ash: { stops: ['#2c2e36', '#44464e', '#64686e', '#8a8e92', '#b4b8b8'], cloud: '#c4c6c8', cloudShade: '#62666c', sea: '#aaaeb0', seaShade: '#4e5258', tint: '#62666c', stars: 0 },
    dawn: { stops: ['#5c8ccc', '#8cb4d4', '#c4dcd0', '#ecE6bc', '#ffdc9c'], cloud: '#fff8e0', cloudShade: '#b8b098', sea: '#fff2d4', seaShade: '#c4bc9c', tint: '#9cb49c', stars: 0, sun: true },
    deep: { stops: ['#08242c', '#0f3a42', '#18585e', '#287c7e', '#52b0a4'], cloud: '#98d0c4', cloudShade: '#206468', sea: '#74c0b0', seaShade: '#1c5860', tint: '#287878', stars: 0.2 },
  });

  /* ---------- floor textures ---------- */
  const T = BD.TEX;
  T.hull = (() => {
    const c = ['#6a4a38', '#704e3a', '#644432', '#5c4030'].map(hex), seam = hex('#241610'), hi = hex('#9a7458'), rivet = hex('#d8b890'), rust = hex('#9a5a2e');
    return (u, v) => {
      const cu = Math.floor(u / 14), cv = Math.floor(v / 14), fu = u - cu * 14, fv = v - cv * 14;
      if (fu < 1 || fv < 1) return seam;
      if ((fu === 2 || fu === 11) && (fv === 2 || fv === 11)) return rivet;
      if (fu < 2 || fv < 2) return hi;
      if (H(cu, cv, 9) > 0.8 && fu > 4 && fu < 9 && fv > 4 && fv < 9) return rust;
      return c[Math.floor(H(cu, cv, 3) * c.length)];
    };
  })();
  T.blackstone = (() => {
    const a = hex('#1e1c2a'), b = hex('#26243a'), line = hex('#0a0810'), hi = hex('#3a3858'), g = hex('#3aff9a'), am = hex('#ffb83a');
    return (u, v) => {
      const cu = Math.floor(u / 12), cv = Math.floor(v / 12), fu = u - cu * 12, fv = v - cv * 12;
      if (fu < 1 || fv < 1) return line;
      if (fu < 2 || fv < 2) return hi;
      if (H(cu, cv, 5) > 0.88 && fv === 6) return g;
      if (H(cu, cv, 6) > 0.9 && fu === 5) return am;
      return (cu + cv) % 2 ? a : b;
    };
  })();
  T.greygrass = (() => {
    const c = ['#7a807c', '#747a76', '#80867f', '#6e746f'].map(hex), tuft = hex('#949a94'), dk = hex('#4e5252');
    return (u, v) => {
      const i = Math.floor(u / 3), j = Math.floor(v / 3);
      const h = H(i, j, 11);
      if (h > 0.93) return tuft;
      if (h < 0.07) return dk;
      return c[Math.floor(H(i >> 1, j >> 1, 4) * c.length)];
    };
  })();
  T.garden = (() => {
    const a = hex('#6cb04e'), b = hex('#5ca044'), path = hex('#e0d8b8'), pathd = hex('#c8c09a'), fl = [hex('#ffc0d4'), hex('#ffe060'), hex('#ffffff')];
    return (u, v) => {
      const cu = u - 1000;
      if (Math.abs(cu) < 14) return H(Math.floor(u), Math.floor(v), 2) > 0.85 ? pathd : path;
      const i = Math.floor(u / 4), j = Math.floor(v / 4);
      if (H(i, j, 13) > 0.94) return fl[Math.floor(H(i, j, 14) * 3)];
      return (i + j) % 2 ? a : b;
    };
  })();
  T.tealtile = (() => {
    const a = hex('#3a8a86'), b = hex('#2e7a78'), line = hex('#175050'), gold = hex('#e8c860'), hi = hex('#6ac0b0');
    return (u, v) => {
      const cu = Math.floor(u / 16), cv = Math.floor(v / 16), fu = u - cu * 16, fv = v - cv * 16;
      if (fu < 1 || fv < 1) return line;
      if (fu < 3 && fv < 3) return gold;
      if (fv < 2) return hi;
      const wave = Math.sin(u * 0.5 + Math.sin(v * 0.4) * 2) > 0.94;
      return wave ? hi : (cu + cv) % 2 ? a : b;
    };
  })();
  T.grating = (() => {
    const d = hex('#0e0c10'), m = hex('#3a3844'), hi = hex('#6a6878'), hot = hex('#ff8a30'), warm = hex('#c8501a');
    return (u, v) => {
      const cv = Math.floor(v / 6), fv = v - cv * 6, fu = ((u % 8) + 8) % 8;
      if (fv < 3) return fv === 0 ? hi : m;
      if (fu < 2) return d;
      return H(Math.floor(u / 8), cv, 7) > 0.5 ? hot : warm;
    };
  })();
  T.coreglass = (() => {
    const a = hex('#e0e8f6'), b = hex('#c8d8f0'), line = hex('#8aa4d0'), cy = hex('#6ff3ff'), gold = hex('#fff0b0');
    return (u, v) => {
      const cu = Math.floor(u / 20), cv = Math.floor(v / 20), fu = u - cu * 20, fv = v - cv * 20;
      if (fu < 1 || fv < 1) return line;
      if (Math.abs(fu - 10) < 1 && H(cu, cv, 5) > 0.5) return cy;
      if (Math.abs(fv - 10) < 1 && H(cu, cv, 6) > 0.5) return gold;
      return (cu + cv) % 2 ? a : b;
    };
  })();

  /* ---------- scenery ---------- */
  function airship(x, cx, cy, w, hull, trim, balloon, balloonHi, seed) {
    // balloon envelope
    for (let j = 0; j < w * 0.4; j++) {
      const k = j / (w * 0.4), half = Math.round(w * 0.5 * Math.sqrt(1 - Math.pow(1 - k, 2)));
      rect(x, cx - half, cy - w * 0.4 + j, half * 2, 1, j < 3 ? balloonHi : j % 7 === 0 ? trim : balloon);
    }
    for (let i = -3; i <= 3; i++) rect(x, cx + i * (w / 8), cy - w * 0.36, 1, w * 0.4, trim);
    // gondola hull
    for (let j = 0; j < 9; j++) { const inset = Math.round(Math.pow(j / 9, 1.4) * 6); rect(x, cx - w * 0.3 + inset, cy + j, w * 0.6 - inset * 2, 1, j === 0 ? trim : hull); }
    rect(x, cx - w * 0.3, cy, w * 0.6, 1, trim);
    for (let i = 0; i < 4; i++) rect(x, cx - w * 0.24 + i * (w * 0.15), cy + 3, 2, 2, '#ffd27a');
  }
  function crystalGlow(ctx, cx, cy, r, color, a = 0.6) {
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
    ctx.drawImage(G.pix.glow(color, r), cx - r, cy - r);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  function windmill(x, cx, gy, h, col, dark) {
    rect(x, cx - 3, gy - h, 6, h, col); rect(x, cx - 2, gy - h - 3, 4, 3, dark); rect(x, cx - 4, gy - 1, 8, 1, dark);
    rect(x, cx - 1, gy - h - 1, 2, 2, dark);
  }
  function terraceRow(x, W, y, h, top, face, shade) {
    rect(x, 0, y, W, h, face); rect(x, 0, y, W, 2, top); rect(x, 0, y + h - 1, W, 1, shade);
    for (let i = 0; i < W; i += 7) rect(x, i + (y % 5), y + 2, 1, h - 3, shade);
  }

  const D = BD.defs;

  D.hullhaven = {
    floor: { tex: 'hull', fog: [60, 74, 70], fogAmt: 0.7 },
    paint(x, W, Hh, hy) {
      bands(x, W, 0, hy, ['#1c2624', '#26332f', '#33463f', '#455e55', '#5e7a6e', '#7e968a', '#a0b4a4']);
      // fog-soft clouds
      cloud(x, W * 0.2, hy * 0.22, 30, 6, '#8ea49a', '#6a8278', '#4a625a'); cloud(x, W * 0.7, hy * 0.35, 34, 6, '#8ea49a', '#6a8278', '#4a625a');
      // wrecked airships lashed together
      airship(x, W * 0.14, hy - 26, 46, '#3e2e26', '#241810', '#5a4a3a', '#7a6a54', 1);
      airship(x, W * 0.44, hy - 34, 56, '#46342a', '#241810', '#6a4a36', '#8a6a4e', 2);
      airship(x, W * 0.78, hy - 24, 50, '#3a2c24', '#241810', '#4a5a54', '#6a7a72', 3);
      // lashing ropes between the hulls
      x.strokeStyle = '#1a1210'; x.lineWidth = 1;
      for (const [a, b, c, d] of [[W * 0.14, hy - 24, W * 0.44, hy - 30], [W * 0.44, hy - 30, W * 0.78, hy - 22]]) { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo((a + c) / 2, Math.max(b, d) + 8, c, d); x.stroke(); }
      // the hull wall of the town in front
      rect(x, 0, hy - 12, W, 14, '#3a2c24'); rect(x, 0, hy - 12, W, 1, '#7a6048'); rect(x, 0, hy - 1, W, 2, '#1a1210');
      for (let i = 0; i < W; i += 22) { rect(x, i + 4, hy - 9, 8, 6, '#14303a'); rect(x, i + 5, hy - 8, 6, 4, '#58b8c8'); rect(x, i + 5, hy - 8, 2, 2, '#d8ffff'); rect(x, i + 3, hy - 10, 10, 1, '#a07a32'); }
    },
    animate(ctx, W, fh, hy, t) {
      for (let lx = 12; lx < W; lx += 44) {
        const sw = Math.sin(t / 700 + lx) * 2;
        ctx.fillStyle = '#1a1210'; ctx.fillRect(lx + sw * 0.4, hy - 44, 1, 20);
        ctx.fillStyle = '#ffb850'; ctx.fillRect(lx - 2 + sw, hy - 25, 5, 5); ctx.fillStyle = '#fff0c0'; ctx.fillRect(lx - 1 + sw, hy - 24, 2, 2);
        crystalGlow(ctx, lx + sw, hy - 23, 20, '#ffa040', 0.35 + Math.sin(t / 150 + lx) * 0.05);
      }
    },
  };

  D.tallow = {
    floor: { tex: 'blackstone', fog: [8, 10, 20], fogAmt: 0.75 },
    paint(x, W, Hh, hy) {
      bands(x, W, 0, hy, ['#06060e', '#0a0c18', '#10142a', '#181c38', '#202448']);
      stars(x, W, 0, hy * 0.5, 40, 31);
      // cranes
      for (const cx of [W * 0.18, W * 0.62]) {
        rect(x, cx, hy - 60, 3, 60, '#14121c'); rect(x, cx - 22, hy - 62, 56, 3, '#14121c'); rect(x, cx + 28, hy - 62, 1, 26, '#14121c'); rect(x, cx + 24, hy - 38, 9, 6, '#2a2438');
        for (let j = 0; j < 8; j++) rect(x, cx + (j % 2) * 2 - 1, hy - 60 + j * 7, 1, 7, '#2a2438');
      }
      // stacked stalls and platforms
      let bx = -6, i = 0;
      while (bx < W) {
        const w = 26 + Math.floor(H(i, 1, 41) * 16), h = 20 + Math.floor(H(i, 2, 41) * 22);
        rect(x, bx, hy - h, w, h + 2, '#241c26'); rect(x, bx, hy - h, w, 2, '#3a3040'); rect(x, bx + w - 3, hy - h, 3, h + 2, '#16101a');
        for (let wy = hy - h + 5; wy < hy - 5; wy += 8) for (let wx = bx + 4; wx < bx + w - 6; wx += 8) {
          const lit = H(wx, wy, 5) > 0.35;
          rect(x, wx, wy, 4, 4, lit ? (H(wx, wy, 6) > 0.5 ? '#3aff9a' : '#ffb83a') : '#0e0c14');
        }
        rect(x, bx - 2, hy - h - 2, w + 4, 3, i % 2 ? '#4a2a3a' : '#2a3a4a'); // awning
        bx += w + 2 + Math.floor(H(i, 3, 41) * 5); i++;
      }
      rect(x, 0, hy - 1, W, 2, '#0a0810');
    },
    animate(ctx, W, fh, hy, t) {
      for (let lx = 20; lx < W; lx += 58) {
        crystalGlow(ctx, lx, hy - 8, 26, '#58ffaa', 0.35 + Math.sin(t / 220 + lx) * 0.08);
        ctx.fillStyle = '#58ffaa'; ctx.fillRect(lx - 1, hy - 12, 3, 6); ctx.fillStyle = '#d8ffe8'; ctx.fillRect(lx, hy - 12, 1, 3);
      }
    },
  };

  D.dimmerrow = {
    floor: { tex: 'greygrass', fog: [150, 154, 152], fogAmt: 0.55 },
    paint(x, W, Hh, hy) {
      bands(x, W, 0, hy - 8, ['#4a4c54', '#5c5e66', '#70747a', '#868a8e', '#9ea2a2', '#b4b8b6', '#c8cac6']);
      cloud(x, W * 0.25, hy * 0.2, 34, 6, '#c8cacc', '#9a9ea2', '#74787e'); cloud(x, W * 0.75, hy * 0.3, 30, 5, '#c8cacc', '#9a9ea2', '#74787e');
      // rolling grey hills
      for (let xx = 0; xx < W; xx++) { const hh = Math.round(10 + Math.sin(xx * 0.04) * 5 + Math.sin(xx * 0.11) * 2); rect(x, xx, hy - 8 - hh + 8, 1, hh, '#7a807c'); }
      // still windmills
      for (const wx of [W * 0.2, W * 0.58, W * 0.86]) {
        windmill(x, wx, hy - 6, 26, '#8a8e8c', '#4a4c50');
        const cx = wx, cy = hy - 6 - 26 - 1;
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.5; for (let r = 3; r < 15; r++) rect(x, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1, 1, '#4a4c50'); }
      }
      // cottages, grey, windows dark
      let bx = 4, i = 0;
      while (bx < W) {
        const w = 24 + Math.floor(H(i, 1, 51) * 10), h = 12 + Math.floor(H(i, 2, 51) * 6);
        if (H(i, 3, 51) > 0.25) {
          rect(x, bx, hy - h + 2, w, h, '#a6a8a6'); rect(x, bx + w - 3, hy - h + 2, 3, h, '#80827f');
          for (let j = 0; j < 9; j++) rect(x, bx - 1 + j * 0.5, hy - h - 7 + j, w + 2 - j, 1, j % 3 === 0 ? '#3e4048' : '#585c66');
          rect(x, bx + 4, hy - h + 5, 5, 5, '#2a2c34');
          if (H(i, 5, 51) > 0.8) rect(x, bx + w - 10, hy - h + 5, 4, 4, '#ffb850'); // a single lit window
        }
        bx += w + 6 + Math.floor(H(i, 4, 51) * 10); i++;
      }
      rect(x, 0, hy - 1, W, 2, '#5a5e5c');
    },
    animate(ctx, W, fh, hy, t) {
      for (let i = 0; i < 18; i++) {
        const x = ((H(i, 1, 60) * W + t * 0.01 * (1 + i % 3)) % W), y = fh - ((t * 0.012 + H(i, 2, 60) * fh) % fh);
        ctx.fillStyle = '#d8dcdc'; ctx.globalAlpha = 0.4; ctx.fillRect(x, y, 1, 1); ctx.globalAlpha = 1;
      }
    },
  };

  D.hushwell = {
    floor: { tex: 'garden', fog: [200, 230, 200], fogAmt: 0.4 },
    paint(x, W, Hh, hy) {
      bands(x, W, 0, hy - 20, ['#5c8ccc', '#7aa4d4', '#9cc0d8', '#bcd8d8', '#d8e8d0', '#f0eac0', '#ffe4a4']);
      cloud(x, W * 0.22, hy * 0.2, 30, 6, '#fff8e8', '#e0dcc4', '#b8b09c'); cloud(x, W * 0.8, hy * 0.12, 26, 5, '#fff8e8', '#e0dcc4', '#b8b09c');
      islet(x, W * 0.7, hy - 44, 12, '#78bc64', '#7a6a58', 7);
      // terraces stepping down in greens
      terraceRow(x, W, hy - 30, 12, '#6cb04e', '#8a9e82', '#4e6a4a');
      terraceRow(x, W, hy - 20, 12, '#7cc05a', '#9aae90', '#587a54');
      terraceRow(x, W, hy - 10, 12, '#8cd068', '#aabe9e', '#628660');
      // blossom trees and a pavilion
      for (let tx = 14; tx < W; tx += 36) {
        rect(x, tx + 4, hy - 36, 3, 8, '#6a4a3a');
        for (const [dx, dy, r] of [[0, -4, 8], [-6, 0, 6], [7, 0, 6]]) for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) rect(x, tx + 5 + dx + xx, hy - 40 + dy + yy, 1, 1, (xx + yy) % 5 === 0 ? '#ffcce0' : yy < 0 ? '#f4a8c0' : '#e088a8');
      }
      rect(x, W * 0.5 - 18, hy - 46, 36, 3, '#c8a840'); rect(x, W * 0.5 - 16, hy - 43, 4, 14, '#e8e4d0'); rect(x, W * 0.5 + 12, hy - 43, 4, 14, '#e8e4d0'); rect(x, W * 0.5 - 14, hy - 46, 28, 1, '#f0d878');
    },
    animate(ctx, W, fh, hy, t) {
      for (let i = 0; i < 14; i++) {
        const x = ((H(i, 1, 61) * W + t * 0.02 + Math.sin(t / 600 + i) * 8) % W), y = ((t * 0.018 + H(i, 2, 61) * fh) % fh);
        ctx.fillStyle = i % 2 ? '#ffc0d4' : '#fff0f4'; ctx.fillRect(x, y, 2, 1);
      }
    },
  };

  D.aurelith = {
    floor: { tex: 'tealtile', fog: [20, 80, 84], fogAmt: 0.6 },
    paint(x, W, Hh, hy) {
      bands(x, W, 0, hy, ['#06222a', '#0a3038', '#10444c', '#185a60', '#227078', '#2e8a88', '#46a49a']);
      // drowned domes and spires
      for (const [cx, w, h, dome] of [[W * 0.1, 30, 40, true], [W * 0.34, 18, 62, false], [W * 0.56, 40, 38, true], [W * 0.82, 20, 56, false], [W * 0.96, 24, 34, true]]) {
        const base = hy;
        if (dome) { for (let j = 0; j < h * 0.5; j++) { const half = Math.round((w / 2) * Math.sqrt(1 - Math.pow(1 - j / (h * 0.5), 2))); rect(x, cx - half, base - h + j, half * 2, 1, j < 3 ? '#e8c860' : '#1e6870'); } rect(x, cx - w / 2, base - h * 0.5, w, h * 0.5, '#175860'); rect(x, cx - 1, base - h - 6, 2, 8, '#e8c860'); }
        else { for (let j = 0; j < h; j++) { const half = Math.max(1, Math.round((w / 2) * (1 - j / h))); rect(x, cx - half, base - h + j, half * 2, 1, j < 3 ? '#f0d878' : '#1a5e66'); } }
        for (let j = 0; j < h * 0.4; j += 6) rect(x, cx - 2, base - h * 0.45 + j, 3, 3, '#a0fff0');
      }
      // light shafts from the surface
      x.globalAlpha = 0.12; x.fillStyle = '#c8fff0';
      for (let i = 0; i < 6; i++) { const sx = (i + 0.5) * W / 6; x.beginPath(); x.moveTo(sx - 4, 0); x.lineTo(sx + 4, 0); x.lineTo(sx + 30, hy); x.lineTo(sx + 10, hy); x.fill(); }
      x.globalAlpha = 1;
      rect(x, 0, hy - 1, W, 2, '#e8c860');
    },
    animate(ctx, W, fh, hy, t) {
      for (let i = 0; i < 22; i++) {
        const x = ((H(i, 1, 62) * W + Math.sin(t / 700 + i) * 6) % W), y = fh - ((t * (0.01 + H(i, 3, 62) * 0.02) + H(i, 2, 62) * fh) % fh);
        ctx.fillStyle = '#bff8f0'; ctx.globalAlpha = 0.5; ctx.fillRect(x, y, 1, 1); ctx.fillRect(x - 1, y + 1, 1, 1); ctx.fillRect(x + 1, y + 1, 1, 1); ctx.globalAlpha = 1;
      }
    },
  };

  D.foundry = {
    floor: { tex: 'grating', fog: [30, 12, 6], fogAmt: 0.7 },
    paint(x, W, Hh, hy) {
      rect(x, 0, 0, W, hy, '#0e0c12');
      // great gears in the dark
      for (const [cx, cy, r] of [[W * 0.2, hy * 0.5, 36], [W * 0.55, hy * 0.35, 48], [W * 0.88, hy * 0.6, 30]]) {
        x.fillStyle = '#26242e'; x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.fill();
        x.fillStyle = '#34323e'; x.beginPath(); x.arc(cx - 2, cy - 2, r - 4, 0, 6.3); x.fill();
        x.fillStyle = '#16141a'; x.beginPath(); x.arc(cx, cy, r * 0.35, 0, 6.3); x.fill();
        for (let k = 0; k < 14; k++) { const a = k * 6.283 / 14; x.fillStyle = '#26242e'; x.save(); x.translate(cx, cy); x.rotate(a); x.fillRect(-3, -r - 5, 6, 8); x.restore(); }
      }
      // pipes and a furnace glow low on the wall
      for (let i = 0; i < W; i += 30) { rect(x, i + 6, 0, 5, hy, '#1c1a22'); rect(x, i + 6, 0, 1, hy, '#44424e'); rect(x, i + 6, 14 + (i % 3) * 20, 5, 3, '#5a586a'); }
      const g = x.createLinearGradient(0, hy - 40, 0, hy); g.addColorStop(0, 'rgba(255,120,30,0)'); g.addColorStop(1, 'rgba(255,120,30,0.55)');
      x.fillStyle = g; x.fillRect(0, hy - 40, W, 40);
      rect(x, 0, hy - 3, W, 3, '#c8501a'); rect(x, 0, hy - 3, W, 1, '#ffc060');
    },
    animate(ctx, W, fh, hy, t) {
      for (let i = 0; i < 20; i++) {
        const x = ((H(i, 1, 63) * W + Math.sin(t / 300 + i) * 5) % W), y = fh - ((t * (0.02 + H(i, 3, 63) * 0.03) + H(i, 2, 63) * fh) % fh);
        ctx.fillStyle = i % 3 ? '#ff9a30' : '#ffe080'; ctx.globalAlpha = 0.8; ctx.fillRect(x, y, 1, 1); ctx.globalAlpha = 1;
      }
    },
  };

  D.core = {
    floor: { tex: 'coreglass', fog: [255, 248, 220], fogAmt: 0.65 },
    paint(x, W, Hh, hy) {
      bands(x, W, 0, hy, ['#fff8e0', '#ffeec0', '#ffe49c', '#fff0c8', '#e8f4ff', '#c8e8ff', '#a0d8ff']);
      // the Core: a vast ring of light behind everything
      x.globalAlpha = 0.5;
      for (let r = 70; r > 20; r -= 10) { x.strokeStyle = r % 20 ? '#ffffff' : '#6ff3ff'; x.lineWidth = 2; x.beginPath(); x.arc(W / 2, hy * 0.7, r, 0, 6.3); x.stroke(); }
      x.globalAlpha = 1;
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(W / 2, hy * 0.7, 16, 0, 6.3); x.fill();
      for (let i = 0; i < 12; i++) { const a = i * 0.5236; x.strokeStyle = 'rgba(255,255,255,0.3)'; x.lineWidth = 1; x.beginPath(); x.moveTo(W / 2, hy * 0.7); x.lineTo(W / 2 + Math.cos(a) * 200, hy * 0.7 + Math.sin(a) * 200); x.stroke(); }
      rect(x, 0, hy - 2, W, 2, '#ffffff');
    },
    animate(ctx, W, fh, hy, t) { G.sky.ribbons(ctx, t * 2, 0.5, 0.15); },
  };
  D.foundryDocks = Object.assign({}, D.foundry, { floor: { tex: 'blackstone', fog: [30, 12, 6], fogAmt: 0.7 } });
  D.heron = Object.assign({}, D.dimmerrow, { floor: { tex: 'greygrass', fog: [150, 154, 152], fogAmt: 0.55 } });
})();
