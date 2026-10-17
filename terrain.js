/* =========================================================================
   terrain.js — turns a flat tile map into floating islands.
   For every connected piece of land it sculpts a rocky underside that
   tapers to a point: layered strata, top-left lighting, cracks, a grassy
   overhang, hanging roots and vines, glowing Current crystals (which act
   as light sources and dim when the Current fails), plus little rocks
   drifting in the air nearby. Also rounds and outlines the island edges.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util, TS = G.TILE, H = U.hash;

  function noise(x, s) {
    const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f);
    return U.lerp(H(i, 7, s), H(i + 1, 7, s), t);
  }
  const STRATA = ['#94704c', '#7c6050', '#a08060', '#76687a', '#887080', '#7a5c44'].map((c) => G.pix.ramp(c, 5, 0.5, 24));
  const SOIL = G.pix.ramp('#6a4a30', 5, 0.42);
  const CRYSTAL = G.pix.ramp('#4ad8f0', 5, 0.55);
  const BAYER = G.pix.BAYER;

  function isLand(ch) {
    const t = G.TILES[ch];
    return !!t && !t.void && !t.bridge && !t.pier;
  }

  function components(world) {
    const seen = new Set(), comps = [];
    for (let y = 0; y < world.H; y++) for (let x = 0; x < world.W; x++) {
      const k = x + ',' + y;
      if (seen.has(k) || !isLand(world.tileAt(x, y))) continue;
      const q = [[x, y]], tiles = [];
      seen.add(k);
      while (q.length) {
        const [cx, cy] = q.pop();
        tiles.push([cx, cy]);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy, nk = nx + ',' + ny;
          if (!seen.has(nk) && isLand(world.tileAt(nx, ny))) { seen.add(nk); q.push([nx, ny]); }
        }
      }
      comps.push(tiles);
    }
    return comps;
  }

  const terrain = (G.terrain = {
    EXTRA: 260, // pixels of space below the map for undersides

    /* Paint undersides into a canvas the size of the map layer. Returns
       { canvas, lights, debris }. */
    build(world, seed = 1) {
      const Wp = world.W * TS, Hp = world.H * TS + terrain.EXTRA;
      const { c, x: ctx } = G.gfx.makeCanvas(Wp, Hp);
      const img = ctx.createImageData(Wp, Hp);
      const D = img.data;
      const put = (x, y, hex) => {
        if (x < 0 || y < 0 || x >= Wp || y >= Hp) return;
        if (decorating && !voidAt(x, y)) return;
        const n = parseInt(hex.slice(1), 16), i = (y * Wp + x) * 4;
        D[i] = (n >> 16) & 255; D[i + 1] = (n >> 8) & 255; D[i + 2] = n & 255; D[i + 3] = 255;
      };
      const has = (x, y) => x >= 0 && y >= 0 && x < Wp && y < Hp && D[(y * Wp + x) * 4 + 3] > 0;
      const voidAt = (px, py) => { const ty = Math.floor(py / TS); return ty >= world.H || !isLand(world.tileAt(Math.floor(px / TS), ty)) && !(G.TILES[world.tileAt(Math.floor(px / TS), ty)] || {}).pier && !(G.TILES[world.tileAt(Math.floor(px / TS), ty)] || {}).bridge; };
      const lights = [], debris = [], decor = [];
      let decorating = false;

      for (const tiles of components(world)) {
        if (tiles.length < 2) continue;
        const minX = Math.min(...tiles.map((t) => t[0])), maxX = Math.max(...tiles.map((t) => t[0]));
        const x0 = minX * TS, x1 = (maxX + 1) * TS - 1, cx = (x0 + x1) / 2, half = (x1 - x0) / 2;
        const colBottom = {};
        for (const [tx, ty] of tiles) colBottom[tx] = Math.max(colBottom[tx] ?? -1, ty);
        const compBottom = (Math.max(...Object.values(colBottom)) + 1) * TS;
        const depthMax = U.clamp(half * 1.05, 36, 230);
        const s = seed + minX * 13 + compBottom;
        const top = new Array(x1 - x0 + 1), tip = new Array(x1 - x0 + 1);
        for (let X = x0; X <= x1; X++) {
          const tb = colBottom[Math.floor(X / TS)];
          if (tb == null) { top[X - x0] = null; continue; }
          const yb = (tb + 1) * TS;
          const u = (X - cx) / (half + 3);
          let prof = depthMax * Math.pow(Math.max(0, 1 - u * u), 0.62);
          prof += (noise(X / 9, s) - 0.5) * 10 + (noise(X / 3.5, s + 3) - 0.5) * 4;
          // rocky spikes hanging from the bottom
          const sp = Math.floor(X / 9);
          if (H(sp, 3, s) > 0.7) prof += Math.max(0, 1 - Math.abs((X % 9) - 4) / 4.5) * (8 + H(sp, 5, s) * 18) * Math.pow(Math.max(0, 1 - u * u), 0.3);
          top[X - x0] = yb;
          tip[X - x0] = Math.max(yb + 7, Math.round(compBottom + prof - (compBottom - yb) * 0.15));
        }
        // ---- rock body ----
        for (let X = x0; X <= x1; X++) {
          const yb = top[X - x0];
          if (yb == null) continue;
          const yt = tip[X - x0];
          const lx = (X - x0) / Math.max(1, x1 - x0);
          for (let Y = yb; Y <= yt; Y++) {
            if (!voidAt(X, Y)) continue;
            const d = Y - yb, r = (Y - yb) / Math.max(1, yt - yb);
            // distance to silhouette edges (left/right) for rim light & shadow
            const lt = tip[X - x0 - 1], rt = tip[X - x0 + 1];
            const edgeL = lt == null || Y > lt - 1 || top[X - x0 - 1] == null;
            const edgeR = rt == null || Y > rt - 1 || top[X - x0 + 1] == null;
            let col;
            if (d < 2) col = d === 0 ? '#4c9442' : '#2a5a32';
            else {
              // clean SNES strata: each band has a lit ledge, a body lit from the left and a dark underside
              let shade = 0.75 - lx * 0.45 - r * 0.25;
              if (edgeL) shade += 0.3;
              if (edgeR) shade -= 0.25;
              const warp = Math.round((noise(X / 14, s + 9) - 0.5) * 10);
              const soil = d < 8 + Math.round(noise(X / 6, s) * 4);
              const yy = Y + warp, bandH = 9;
              const band = Math.floor(yy / bandH), pb = ((yy % bandH) + bandH) % bandH;
              const ramp = soil ? SOIL : STRATA[((band % STRATA.length) + STRATA.length) % STRATA.length];
              let i = shade > 0.62 ? 3 : shade > 0.32 ? 2 : 1;
              if (!soil && pb === 0) i = Math.min(4, i + 1);
              if (!soil && pb === bandH - 1) i = 0;
              if (soil && d < 4) i = 0;
              if (Y >= yt - 1) i = 0;
              col = ramp[i];
              // vertical fissures
              const fx = Math.floor((X + band * 7) / 11), fo = (X + band * 7) % 11, fl = 3 + Math.floor(H(fx, band, s + 2) * 5);
              if (!soil && fo === 0 && H(fx, band, s) > 0.6 && pb > bandH - 1 - fl && pb < bandH - 1) col = ramp[0];
              else if (!soil && fo === 1 && H(fx, band, s) > 0.6 && pb > bandH - 1 - fl && pb < bandH - 1) col = ramp[Math.min(4, i + 1)];
              else if (!soil && H(Math.floor(X / 3), Math.floor(yy / 3), s + 5) > 0.93 && pb > 1) col = ramp[Math.min(4, i + 1)];
            }
            put(X, Y, col);
          }
        }
        // ---- outline the silhouette ----
        const minTop = Math.min(...top.filter((v) => v != null));
        const edge = [];
        for (let X = x0 - 1; X <= x1 + 1; X++) for (let Y = Math.max(0, minTop - 2); Y <= compBottom + depthMax + 50; Y++) {
          if (has(X, Y) || !voidAt(X, Y)) continue;
          if (has(X - 1, Y) || has(X + 1, Y) || has(X, Y - 1)) edge.push([X, Y]);
        }
        for (const [X, Y] of edge) put(X, Y, '#1c1220');
        // ---- crystals of the Current ----
        const nCrys = Math.max(1, Math.round(half / 34));
        for (let k = 0; k < nCrys; k++) {
          const X = Math.round(cx + (H(k, 11, s) - 0.5) * half * 1.1);
          const yb = top[X - x0], yt = tip[X - x0];
          if (yb == null) continue;
          const Y = Math.round(yb + (yt - yb) * (0.3 + H(k, 12, s) * 0.4));
          const hgt = 6 + Math.round(H(k, 13, s) * 7), lean = H(k, 14, s) > 0.5 ? 1 : -1;
          if (!voidAt(X, Y) || !voidAt(X, Y + hgt)) continue;
          decor.push(() => {
            for (let j = 0; j < 3; j++) {
              const ox = X + (j - 1) * 3, hh = hgt - Math.abs(j - 1) * 3;
              for (let yy = 0; yy < hh; yy++) {
                const w = yy > hh - 3 ? 1 : 2;
                for (let xx = 0; xx < w; xx++) put(ox + xx + Math.round((yy / hh) * lean * 2), Y + yy, CRYSTAL[U.clamp(4 - Math.floor((yy / hh) * 3) - xx, 0, 4)]);
              }
              put(ox, Y, '#ffffff');
            }
          });
          lights.push({ key: 'crys' + X + ',' + Y, x: X, y: Y + 4, r: 26, color: '#6ff3ff', glow: 0.55, lamp: true, crystal: true });
        }
        // ---- hanging roots ----
        const nRoots = Math.round(half / 7);
        for (let k = 0; k < nRoots; k++) {
          const X = Math.round(x0 + H(k, 21, s) * (x1 - x0));
          const yb = top[X - x0], yt = tip[X - x0];
          if (yb == null) continue;
          const startY = H(k, 22, s) > 0.45 ? yt - 1 : yb + 2;
          const len = 8 + H(k, 23, s) * (startY === yb + 2 ? 26 : 34);
          const sway = (H(k, 24, s) - 0.5) * 8;
          const green = startY === yb + 2;
          decor.push(() => {
            for (let i = 0; i < len; i++) {
              const xx = Math.round(X + Math.sin(i / 6 + k) * sway * (i / len));
              const yy = startY + i;
              if (!voidAt(xx, yy) && i > 2) continue;
              if (!green && has(xx, yy) && i < 2) continue;
              put(xx, yy, green ? (i % 5 === 0 ? '#6aac4a' : '#3e7a32') : i % 4 === 0 ? '#5a3a22' : '#3e2616');
              if (green && i % 4 === 2) put(xx + (i % 8 === 2 ? 1 : -1), yy, '#5aa04a');
              if (!green && i === Math.floor(len) - 1) put(xx, yy + 1, '#6aac4a');
            }
          });
        }
        // grass tufts hanging over the lip
        for (let X = x0; X <= x1; X++) {
          const yb = top[X - x0];
          if (yb == null || H(X, 31, s) < 0.6) continue;
          const l = 1 + Math.floor(H(X, 32, s) * 3);
          decor.push(() => { for (let i = 0; i < l; i++) put(X, yb + 2 + i, i === l - 1 ? '#2e5e2c' : '#4a8a3a'); });
        }
        // drifting rocks near the island
        const nDeb = 2 + Math.round(H(1, 41, s) * 3);
        for (let k = 0; k < nDeb; k++) {
          const side = H(k, 42, s) > 0.5 ? 1 : -1;
          const dx = cx + side * (half * (0.75 + H(k, 43, s) * 0.5) + 10);
          const dy = compBottom + 10 + H(k, 44, s) * depthMax * 0.6;
          debris.push({ img: rock(6 + Math.round(H(k, 45, s) * 10), s + k), x: Math.round(dx), y: Math.round(dy), ph: H(k, 46, s) * 6 });
        }
      }
      decorating = true;
      for (const f of decor) f();
      ctx.putImageData(img, 0, 0);
      return { canvas: c, lights, debris };
    },

    /* round + outline the top face where land meets open sky */
    edges(world, ctx) {
      const land = (x, y) => isLand(world.tileAt(x, y)) || !!(G.TILES[world.tileAt(x, y)] || {}).pier;
      ctx.save();
      for (let ty = 0; ty < world.H; ty++) for (let tx = 0; tx < world.W; tx++) {
        if (!isLand(world.tileAt(tx, ty))) continue;
        const px = tx * TS, py = ty * TS;
        const up = !land(tx, ty - 1) && !(G.TILES[world.tileAt(tx, ty - 1)] || {}).bridge;
        const lf = !land(tx - 1, ty) && !(G.TILES[world.tileAt(tx - 1, ty)] || {}).bridge;
        const rt = !land(tx + 1, ty) && !(G.TILES[world.tileAt(tx + 1, ty)] || {}).bridge;
        const dn = !land(tx, ty + 1) && !(G.TILES[world.tileAt(tx, ty + 1)] || {}).bridge;
        // round outer corners
        ctx.globalCompositeOperation = 'destination-out';
        const cut = (cx, cy, sx, sy) => { ctx.fillRect(cx, cy, 3 * sx, 1 * sy); ctx.fillRect(cx, cy, 1 * sx, 3 * sy); ctx.fillRect(cx, cy, 2 * sx, 2 * sy); };
        if (up && lf) cut(px, py, 1, 1);
        if (up && rt) cut(px + 16, py, -1, 1);
        if (dn && lf) cut(px, py + 16, 1, -1);
        if (dn && rt) cut(px + 16, py + 16, -1, -1);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#1c1220';
        if (up) ctx.fillRect(px + (lf ? 2 : 0), py, 16 - (lf ? 2 : 0) - (rt ? 2 : 0), 1);
        if (lf) ctx.fillRect(px, py + (up ? 2 : 0), 1, 16 - (up ? 2 : 0) - (dn ? 2 : 0));
        if (rt) ctx.fillRect(px + 15, py + (up ? 2 : 0), 1, 16 - (up ? 2 : 0) - (dn ? 2 : 0));
        if (up && lf) { ctx.fillRect(px + 1, py + 1, 1, 1); }
        if (up && rt) { ctx.fillRect(px + 14, py + 1, 1, 1); }
        if (dn && lf) ctx.fillRect(px + 1, py + 14, 1, 1);
        if (dn && rt) ctx.fillRect(px + 14, py + 14, 1, 1);
        ctx.fillStyle = 'rgba(255,255,220,0.22)';
        if (up) ctx.fillRect(px + (lf ? 2 : 1), py + 1, 14 - (lf ? 2 : 0) - (rt ? 1 : 0), 1);
        if (lf) ctx.fillRect(px + 1, py + 2, 1, 12);
      }
      ctx.restore();
    },
  });

  /* a small floating rock with a tuft of grass */
  const rockCache = {};
  function rock(w, s) {
    const key = w + ':' + (s % 97);
    if (rockCache[key]) return rockCache[key];
    const h = Math.round(w * 1.1) + 3;
    const b = G.pix.buf(w + 2, h + 2);
    b.poly([[1, 3], [w + 1, 3], [w * 0.7 + 1, h * 0.7], [w / 2 + 1, h], [w * 0.3 + 1, h * 0.75]], G.pix.ramp('#7a5e48', 5, 0.45), { dir: 'xy', range: 0.9, base: 0.1 });
    b.ellipse(w / 2 + 1, 3.2, w / 2, 2.2, G.pix.ramp('#5aa048', 4, 0.4));
    if (w > 9) { b.set(Math.round(w / 2), Math.round(h * 0.5), '#6ff3ff'); b.set(Math.round(w / 2) + 1, Math.round(h * 0.5) + 1, '#bff8ff'); }
    b.outline('#1c1220');
    return (rockCache[key] = b.canvas());
  }
  terrain.rock = rock;
})();
