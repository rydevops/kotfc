/* =========================================================================
   scene-boot.js — "Tap the lantern."
   iOS only allows sound after the player touches the screen, so the game
   opens on a single unlit lantern. Lighting it unlocks audio and starts
   the intro cutscene.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const LANTERN = [
    '....OOOO....',
    '...O....O...',
    '....OOOO....',
    '..OOOOOOOO..',
    '.OAAAAAAAAO.',
    '.OAYYYYYYAO.',
    '.OAYWWWWYAO.',
    '.OAYWWWWYAO.',
    '.OAYYYYYYAO.',
    '.OAYYYYYYAO.',
    '.OAAAAAAAAO.',
    '..OOOOOOOO..',
    '....OAAO....',
    '....OOOO....',
  ];
  G.lanternSprite = (lit) => G.gfx.fromRows(LANTERN, { O: '#1a1226', A: '#c8903a', Y: lit ? '#ffc850' : '#34344a', W: lit ? '#fff6c8' : '#44445a' });

  G.scenes.register('boot', {
    t: 0, lit: false, litT: 0,
    enter() {
      this.t = 0; this.lit = false;
      const L = document.getElementById('layer-screen');
      L.innerHTML = `
        <div class="boot tap">
          <img class="boot-lantern" alt="A lantern" src="${G.gfx.toDataURL(G.lanternSprite(false), 8)}">
          <div class="boot-text">Tap the lantern<br><small>sound on for the full experience</small></div>
        </div>`;
      const box = L.querySelector('.boot');
      const go = async () => {
        if (this.lit) return;
        this.lit = true;
        G.audio.unlock();
        G.audio.sfx('lantern');
        const img = L.querySelector('.boot-lantern');
        img.src = G.gfx.toDataURL(G.lanternSprite(true), 8);
        img.classList.add('lit');
        L.querySelector('.boot-text').innerHTML = '&nbsp;';
        G.input.pop(h);
        await U.sleep(1100);
        G.scenes.go('intro', {}, { fadeMs: 700 });
      };
      box.addEventListener('click', go);
      const h = G.input.push((b) => { if (b === 'a') go(); return true; });
    },
    exit() { document.getElementById('layer-screen').innerHTML = ''; },
    update(dt) { this.t += dt; },
    render(ctx) {
      const W = G.gfx.W, H = G.gfx.H;
      ctx.fillStyle = '#05040c'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 60; i++) {
        ctx.globalAlpha = 0.2 + 0.3 * Math.abs(Math.sin(this.t / 900 + i));
        ctx.fillStyle = '#c8d0ff';
        ctx.fillRect(Math.floor(U.hash(i, 1) * W), Math.floor(U.hash(i, 2) * H), 1, 1);
      }
      ctx.globalAlpha = 1;
      if (this.lit) {
        const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
        g.addColorStop(0, 'rgba(255,190,90,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
    },
  });
})();
