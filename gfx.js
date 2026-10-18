/* =========================================================================
   gfx.js — canvas setup with crisp integer pixel scaling (retina aware),
   sprite helpers, screen fade / shake / flash.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;

  const gfx = (G.gfx = {
    canvas: null, ctx: null,
    W: 200, H: 360, scale: 1, cssScale: 1,
    shakeT: 0, shakeMag: 0, flashColor: null, flashT: 0, flashDur: 0,

    init() {
      this.canvas = document.getElementById('screen');
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      // resize can fire in bursts on iOS (toolbars, rotation); coalesce to one per frame
      let queued = false;
      const soon = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; this.pin(); this.resize(); }); };
      window.addEventListener('resize', soon);
      window.addEventListener('orientationchange', () => { soon(); setTimeout(soon, 250); setTimeout(soon, 600); });
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', soon);
        window.visualViewport.addEventListener('scroll', () => this.pin());
      }
      this.guardScroll();
    },

    /* The page must never move. On iPhone (especially in landscape) a stray vertical
       drag or a toolbar change can nudge the whole document up, which slides the game
       off-screen and exposes the black page behind it until the phone is rotated.
       We pin everything back to 0,0 and refuse page-level drags. */
    pin() {
      if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
      const se = document.scrollingElement;
      if (se && (se.scrollTop || se.scrollLeft)) { se.scrollTop = 0; se.scrollLeft = 0; }
      for (const el of [document.body, document.getElementById('game')]) {
        if (el && (el.scrollTop || el.scrollLeft)) { el.scrollTop = 0; el.scrollLeft = 0; }
      }
    },
    guardScroll() {
      const SCROLLERS = '.scroll, .b-list, .menu-body, .b-results';
      window.addEventListener('scroll', () => this.pin(), { passive: true });
      // overflow:hidden boxes can still be scrolled by focus or selection; snap the layers back
      document.addEventListener('scroll', (e) => {
        const t = e.target;
        if (t && t.nodeType === 1 && !t.matches(SCROLLERS)) { t.scrollTop = 0; t.scrollLeft = 0; }
      }, true);
      let y0 = 0;
      document.addEventListener('touchstart', (e) => { if (e.touches[0]) y0 = e.touches[0].clientY; }, { passive: true });
      document.addEventListener('touchmove', (e) => {
        const t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('input[type="range"]')) return;
        const sc = t.closest(SCROLLERS);
        if (sc && sc.scrollHeight > sc.clientHeight + 1) {
          // let real lists scroll, but never hand the drag to the page at either end
          const dy = e.touches[0].clientY - y0;
          const atTop = sc.scrollTop <= 0, atEnd = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1;
          if ((dy > 0 && atTop) || (dy < 0 && atEnd)) e.preventDefault();
          return;
        }
        e.preventDefault();
      }, { passive: false });
    },

    // Target roughly 208 "game pixels" across the shorter screen side.
    resize() {
      const dpr = window.devicePixelRatio || 1;
      const cw = window.innerWidth, ch = window.innerHeight;
      if (cw === this._cw && ch === this._ch && dpr === this._dpr) return; // nothing changed
      this._cw = cw; this._ch = ch; this._dpr = dpr;
      document.documentElement.style.setProperty('--app-h', ch + 'px');
      const devW = Math.round(cw * dpr), devH = Math.round(ch * dpr);
      const short = Math.min(devW, devH);
      const scale = Math.max(1, Math.round(short / 208));
      this.W = Math.ceil(devW / scale);
      this.H = Math.ceil(devH / scale);
      this.scale = scale;
      this.cssScale = scale / dpr;
      this.canvas.width = this.W;
      this.canvas.height = this.H;
      this.canvas.style.width = this.W * this.cssScale + 'px';
      this.canvas.style.height = this.H * this.cssScale + 'px';
      this.ctx.imageSmoothingEnabled = false;
      this.portrait = ch >= cw;
      document.body.classList.toggle('landscape', !this.portrait);
      G.emit('resize');
    },

    // convert CSS client coords → game pixels
    toGame(clientX, clientY) {
      const r = this.canvas.getBoundingClientRect();
      return { x: (clientX - r.left) / this.cssScale, y: (clientY - r.top) / this.cssScale };
    },

    makeCanvas(w, h) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d');
      x.imageSmoothingEnabled = false;
      return { c, x };
    },

    /* Build a sprite from ASCII rows + palette { char: '#hex' }.
       '.' and ' ' are transparent. Rows shorter than `w` are padded. */
    fromRows(rows, palette, w) {
      w = w || Math.max(...rows.map((r) => r.length));
      const h = rows.length;
      const { c, x } = this.makeCanvas(w, h);
      for (let y = 0; y < h; y++) {
        const row = rows[y];
        for (let i = 0; i < w; i++) {
          const ch = row[i];
          if (!ch || ch === '.' || ch === ' ') continue;
          const col = palette[ch];
          if (!col) continue;
          x.fillStyle = col;
          x.fillRect(i, y, 1, 1);
        }
      }
      return c;
    },

    flipH(src) {
      const { c, x } = this.makeCanvas(src.width, src.height);
      x.translate(src.width, 0);
      x.scale(-1, 1);
      x.drawImage(src, 0, 0);
      return c;
    },

    // solid-colour silhouette (used for hit flashes and shadows)
    silhouette(src, color) {
      const { c, x } = this.makeCanvas(src.width, src.height);
      x.drawImage(src, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = color;
      x.fillRect(0, 0, src.width, src.height);
      return c;
    },

    // add a 1px dark outline around a sprite
    outline(src, color = '#0b0712') {
      const { c, x } = this.makeCanvas(src.width + 2, src.height + 2);
      const sil = this.silhouette(src, color);
      for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) x.drawImage(sil, dx, dy);
      x.drawImage(src, 1, 1);
      return c;
    },

    scaled(src, s) {
      const { c, x } = this.makeCanvas(src.width * s, src.height * s);
      x.drawImage(src, 0, 0, src.width * s, src.height * s);
      return c;
    },

    toDataURL(src, s = 1) {
      return (s === 1 ? src : this.scaled(src, s)).toDataURL();
    },

    /* ---- screen effects ---- */
    fadeOut(ms = 350, color = '#000') {
      const f = document.getElementById('fade');
      f.style.background = color;
      f.style.transition = `opacity ${ms}ms`;
      f.style.pointerEvents = 'auto';
      requestAnimationFrame(() => (f.style.opacity = 1));
      return U.sleep(ms + 30);
    },
    fadeIn(ms = 350) {
      const f = document.getElementById('fade');
      f.style.transition = `opacity ${ms}ms`;
      f.style.opacity = 0;
      return U.sleep(ms + 30).then(() => (f.style.pointerEvents = 'none'));
    },
    shake(mag = 3, ms = 400) { this.shakeMag = mag; this.shakeT = ms; },
    flash(color = '#fff', ms = 200) { this.flashColor = color; this.flashT = ms; this.flashDur = ms; },

    // called by main loop
    applyShake(ctx, dt) {
      if (this.shakeT > 0) {
        this.shakeT -= dt;
        const m = this.shakeMag * Math.min(1, this.shakeT / 200);
        ctx.translate(Math.round(U.rand(-m, m)), Math.round(U.rand(-m, m)));
      }
    },
    drawFlash(ctx, dt) {
      if (this.flashT > 0) {
        this.flashT -= dt;
        ctx.globalAlpha = Math.max(0, this.flashT / this.flashDur) * 0.8;
        ctx.fillStyle = this.flashColor;
        ctx.fillRect(0, 0, this.W, this.H);
        ctx.globalAlpha = 1;
      }
    },
  });
})();
