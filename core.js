/* =========================================================================
   core.js — global namespace, utilities, event bus, content registry,
   and the scene manager. Everything else hangs off window.G.
   ========================================================================= */
(function () {
  'use strict';
  const G = (window.G = window.G || {});
  G.VERSION = '1.3.1';
  G.TILE = 16;
  G.DEBUG = /[?&]debug/.test(location.search);

  /* ---------- Utilities ---------- */
  const U = (G.util = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a = 0, b = 1) => a + Math.random() * (b - a),
    randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    chance: (p) => Math.random() < p,
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    weighted(list) { // [{w:3, ...}, ...]
      const total = list.reduce((s, e) => s + (e.w || 1), 0);
      let r = Math.random() * total;
      for (const e of list) { r -= e.w || 1; if (r <= 0) return e; }
      return list[list.length - 1];
    },
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    easeOut: (t) => 1 - Math.pow(1 - t, 3),
    // deterministic 0..1 noise for procedural art
    hash(x, y, s = 0) {
      let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
      h = (h ^ (h >>> 13)) * 1274126177;
      h = h ^ (h >>> 16);
      return ((h >>> 0) % 10000) / 10000;
    },
    clone: (o) => JSON.parse(JSON.stringify(o)),
    fmtTime(sec) {
      sec = Math.floor(sec);
      const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
      return h + ':' + String(m).padStart(2, '0');
    },
    // colour helpers (#rrggbb)
    hexToRgb(hex) {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    },
    rgbToHex(r, g, b) {
      const c = (v) => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
      return '#' + c(r) + c(g) + c(b);
    },
    shade(hex, amt) { // amt -1..1 (negative darkens)
      const [r, g, b] = U.hexToRgb(hex);
      const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
      return U.rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
    },
    mix(a, b, t) {
      const A = U.hexToRgb(a), B = U.hexToRgb(b);
      return U.rgbToHex(U.lerp(A[0], B[0], t), U.lerp(A[1], B[1], t), U.lerp(A[2], B[2], t));
    },
    el(tag, cls, html) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (html != null) e.innerHTML = html;
      return e;
    },
    esc: (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
  });

  /* ---------- Event bus ---------- */
  const listeners = {};
  G.on = (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); return fn; };
  G.off = (ev, fn) => { listeners[ev] = (listeners[ev] || []).filter((f) => f !== fn); };
  G.emit = (ev, ...args) => (listeners[ev] || []).slice().forEach((f) => f(...args));

  /* ---------- Content registry ----------
     Data files call G.register('mobs', 'riftWisp', {...}). Adding content
     to the game is a matter of adding a file that registers more entries. */
  G.data = { chars: {}, skills: {}, mobs: {}, items: {}, maps: {}, songs: {}, shops: {}, looks: {}, story: {} };
  G.register = (kind, id, def) => {
    if (!G.data[kind]) G.data[kind] = {};
    def.id = id;
    G.data[kind][id] = def;
    return def;
  };

  /* ---------- Scene manager ----------
     A scene is { enter(params), exit(), update(dt), render(ctx) }. */
  const scenes = {};
  G.scenes = {
    current: null,
    name: null,
    register(name, scene) { scenes[name] = scene; scene.name = name; },
    get: (name) => scenes[name],
    async go(name, params = {}, opts = {}) {
      const fade = opts.fade !== false;
      if (fade) await G.gfx.fadeOut(opts.fadeMs || 350);
      if (this.current && this.current.exit) this.current.exit(params);
      this.current = scenes[name];
      this.name = name;
      if (!this.current) throw new Error('No scene ' + name);
      if (this.current.enter) await this.current.enter(params);
      if (fade) G.gfx.fadeIn(opts.fadeMs || 350);
    },
  };
})();
