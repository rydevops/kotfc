/* =========================================================================
   pix.js — a tiny pixel-art "sculpting" library.
   Draw shapes into a pixel buffer and they are lit from the top-left with
   hue-shifted colour ramps and ordered dithering, then given a soft
   cartoon outline. Characters, monsters and islands are all built with it.

     const b = G.pix.buf(32, 32);
     b.ellipse(16, 16, 10, 8, G.pix.ramp('#8a4cf0'));
     b.outline();
     const canvas = b.canvas();
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  const LIGHT = (() => { const v = [-0.5, -0.65, 0.6]; const l = Math.hypot(...v); return v.map((x) => x / l); })();

  /* ---- colour helpers ---- */
  function hexToHsl(hex) {
    let [r, g, b] = U.hexToRgb(hex).map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360; s = U.clamp(s, 0, 1); l = U.clamp(l, 0, 1);
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
    let r, g, b;
    if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
    return U.rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }
  // rotate hue toward a target angle by up to `amt` degrees
  function hueToward(h, target, amt) {
    let d = ((target - h + 540) % 360) - 180;
    return h + U.clamp(d, -amt, amt);
  }
  const rampCache = {};
  /* A dark→light ramp from one base colour. Shadows drift toward blue-violet,
     highlights toward warm yellow — the classic pixel-art hue shift. */
  function ramp(base, n = 5, spread = 0.42, shift = 22) {
    const key = base + n + spread + shift;
    if (rampCache[key]) return rampCache[key];
    const [h, s, l] = hexToHsl(base);
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) - 0.5; // -0.5 .. 0.5
      const hh = t < 0 ? hueToward(h, 250, -t * 2 * shift) : hueToward(h, 55, t * 2 * shift);
      const ll = U.clamp(l + t * spread * (t < 0 ? 1.15 : 0.95), 0.04, 0.96);
      const ss = U.clamp(s * (t < 0 ? 1 + -t * 0.3 : 1 - t * 0.35), 0, 1);
      out.push(hslToHex(hh, ss, ll));
    }
    return (rampCache[key] = out);
  }

  /* ---- the pixel buffer ---- */
  class Buf {
    constructor(w, h) { this.w = w; this.h = h; this.c = new Array(w * h).fill(null); }
    get(x, y) { x = Math.floor(x); y = Math.floor(y); return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.c[y * this.w + x]; }
    set(x, y, col) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h && col) this.c[y * this.w + x] = col; }
    clear(x, y) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y * this.w + x] = null; }
    pick(rmp, v, x, y, dither = true) {
      const n = rmp.length;
      const f = U.clamp(v, 0, 1) * (n - 1);
      let i = Math.floor(f);
      if (dither && !this.noDither && f - i > BAYER[(y & 3) * 4 + (x & 3)]) i++;
      return rmp[U.clamp(i, 0, n - 1)];
    }
    lambert(nx, ny, nz, amb = 0.28) { return amb + (1 - amb) * Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]); }

    /* shaded ellipsoid. o: { amb, flat, clip(x,y), only(x,y), dither, bias } */
    ellipse(cx, cy, rx, ry, rmp, o = {}) {
      for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) {
        for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d2 = dx * dx + dy * dy;
          if (d2 > 1) continue;
          if (o.clip && !o.clip(x, y)) continue;
          if (typeof rmp === 'string') { this.set(x, y, rmp); continue; }
          const v = o.flat != null ? o.flat : this.lambert(dx, dy, Math.sqrt(1 - d2), o.amb) + (o.bias || 0);
          this.set(x, y, this.pick(rmp, v, x, y, o.dither !== false));
        }
      }
    }
    /* rounded box shaded like a horizontal cylinder (r = corner radius) */
    box(x0, y0, w, h, rmp, o = {}) {
      const r = o.r || 0;
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        if (r) {
          const cx = x < x0 + r ? x0 + r : x >= x0 + w - r ? x0 + w - r - 1 : x;
          const cy = y < y0 + r ? y0 + r : y >= y0 + h - r ? y0 + h - r - 1 : y;
          if (Math.hypot(x - cx, y - cy) > r + 0.2) continue;
        }
        if (o.clip && !o.clip(x, y)) continue;
        if (typeof rmp === 'string') { this.set(x, y, rmp); continue; }
        const nx = ((x + 0.5 - x0) / w) * 2 - 1;
        const ny = o.vy ? (((y + 0.5 - y0) / h) * 2 - 1) * o.vy : 0;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx * 0.85 - ny * ny * 0.5));
        const v = this.lambert(nx * 0.9, ny - (o.top ? 0.3 : 0), nz, o.amb) + (o.bias || 0);
        this.set(x, y, this.pick(rmp, v, x, y, o.dither !== false));
      }
    }
    /* filled polygon (points [[x,y],...]); shaded with a vertical gradient if a ramp */
    poly(pts, rmp, o = {}) {
      const ys = pts.map((p) => p[1]);
      const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
      const xs = pts.map((p) => p[0]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs);
      for (let y = y0; y <= y1; y++) {
        const yy = y + 0.5, hits = [];
        for (let i = 0; i < pts.length; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
          if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) hits.push(ax + ((yy - ay) / (by - ay)) * (bx - ax));
        }
        hits.sort((a, b) => a - b);
        for (let k = 0; k + 1 < hits.length; k += 2) {
          for (let x = Math.round(hits[k]); x < Math.round(hits[k + 1]); x++) {
            if (typeof rmp === 'string') { this.set(x, y, rmp); continue; }
            const vy = 1 - (y - y0) / Math.max(1, y1 - y0);
            const vx = 1 - (x - x0) / Math.max(1, x1 - x0);
            const v = (o.dir === 'x' ? vx : o.dir === 'xy' ? (vx + vy) / 2 : vy) * (o.range || 0.8) + (o.base || 0.15);
            this.set(x, y, this.pick(rmp, v, x, y, o.dither !== false));
          }
        }
      }
    }
    rect(x0, y0, w, h, col) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.set(x, y, col); }
    line(x0, y0, x1, y1, col, th = 1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
        if (th <= 1) this.set(Math.round(x), Math.round(y), col);
        else for (let a = 0; a < th; a++) for (let b = 0; b < th; b++) this.set(Math.round(x - th / 2 + a), Math.round(y - th / 2 + b), col);
      }
    }
    disc(cx, cy, r, col) { this.ellipse(cx, cy, r, r, col); }
    // quadratic-ish curve through control point (for roots, tails, vines)
    curve(x0, y0, cx, cy, x1, y1, col, th = 1) {
      let px = x0, py = y0;
      for (let i = 1; i <= 16; i++) {
        const t = i / 16, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
        const x = a * x0 + b * cx + c * x1, y = a * y0 + b * cy + c * y1;
        this.line(Math.round(px), Math.round(py), Math.round(x), Math.round(y), typeof col === 'function' ? col(t) : col, th);
        px = x; py = y;
      }
    }
    /* outline: every empty pixel touching a filled one becomes a darkened version
       of that neighbour (soft "sel-out"), or a fixed colour */
    outline(col, o = {}) {
      const add = [];
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        const nb = [this.get(x - 1, y), this.get(x + 1, y), this.get(x, y - 1), this.get(x, y + 1)].find(Boolean);
        if (!nb) continue;
        add.push([x, y, col || U.mix(nb, o.ink || '#1a0f24', o.amt || 0.72)]);
      }
      for (const [x, y, c] of add) this.set(x, y, c);
      return this;
    }
    /* darken interior edge pixels that border the void below / right (adds weight) */
    innerShade(amt = 0.25) {
      const upd = [];
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const c = this.get(x, y);
        if (c && (!this.get(x + 1, y) || !this.get(x, y + 1))) upd.push([x, y, U.mix(c, '#1a0f24', amt)]);
      }
      for (const [x, y, c] of upd) this.set(x, y, c);
      return this;
    }
    /* recolour helper: apply fn(col,x,y) to every filled pixel */
    map(fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.get(x, y); if (c) this.c[y * this.w + x] = fn(c, x, y); } return this; }
    flipH() { const b = new Buf(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) b.c[y * this.w + (this.w - 1 - x)] = this.c[y * this.w + x]; return b; }
    shift(dx, dy) { const b = new Buf(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.c[y * this.w + x]; if (c) b.set(x + dx, y + dy, c); } return b; }
    canvas() {
      const { c, x } = G.gfx.makeCanvas(this.w, this.h);
      const img = x.createImageData(this.w, this.h);
      for (let i = 0; i < this.c.length; i++) {
        const col = this.c[i];
        if (!col) continue;
        const n = parseInt(col.slice(1), 16);
        img.data[i * 4] = (n >> 16) & 255; img.data[i * 4 + 1] = (n >> 8) & 255; img.data[i * 4 + 2] = n & 255; img.data[i * 4 + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      return c;
    }
  }

  G.pix = {
    buf: (w, h) => new Buf(w, h),
    ramp, hexToHsl, hslToHex, BAYER,
    // glowing additive sprite (soft radial) — cached
    glowCache: {},
    glow(color, r) {
      const key = color + r;
      if (this.glowCache[key]) return this.glowCache[key];
      const { c, x } = G.gfx.makeCanvas(r * 2, r * 2);
      const [cr, cg, cb] = U.hexToRgb(color);
      const g = x.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},1)`);
      g.addColorStop(0.35, `rgba(${cr},${cg},${cb},0.45)`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2);
      return (this.glowCache[key] = c);
    },
  };
})();
