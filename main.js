/* =========================================================================
   main.js — boot sequence and the main loop.
   ========================================================================= */
(function () {
  'use strict';

  function boot() {
    G.gfx.init();
    G.input.init();
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(50, now - last);
      last = now;
      const sc = G.scenes.current;
      const ctx = G.gfx.ctx;
      if (sc) {
        if (sc.update) sc.update(dt);
        if (G.game.state && (G.scenes.name === 'world' || G.scenes.name === 'battle')) G.game.state.playtime += dt / 1000;
        ctx.save();
        G.gfx.applyShake(ctx, dt);
        if (sc.render) sc.render(ctx);
        ctx.restore();
        G.gfx.drawFlash(ctx, dt);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // Debug shortcuts: open index.html?debug
    if (G.DEBUG) {
      G.debug = {
        step(n) { G.game.state.step = n; },
        warp(map, x, y) { G.script.run((S) => S.warp(map, x, y)); },
        lvl(n) { G.game.state.party.forEach((m) => { m.lvl = n; }); G.game.healAll(); },
        gold(n) { G.game.state.gold += n; },
        noEnc(v = true) { G.DEBUG_NOENC = v; },
      };
    }

    G.scenes.go(G.DEBUG && /skipintro/.test(location.search) ? 'title' : 'boot', {}, { fade: false });

    // Offline support when hosted (GitHub Pages serves over https)
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
