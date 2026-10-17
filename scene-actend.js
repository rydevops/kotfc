/* =========================================================================
   scene-actend.js — end-of-act card with a short credits roll.
   ========================================================================= */
(function () {
  'use strict';
  G.scenes.register('actEnd', {
    t: 0,
    enter(p) {
      this.t = 0;
      G.audio.music('actEnd');
      const L = document.getElementById('layer-screen');
      L.innerHTML = `
        <div class="actend">
          <div class="roll">
            <p class="ae-sub">End of</p>
            <h1>Act I</h1>
            <h2>The Lantern Falls</h2>
            <p class="ae-line">Behind them, the Conservatory's bridges flicker.<br>Ahead, the Drift — fog, salvage, and the first real losses.</p>
            <p class="ae-next">Act II · <b>The Hunt</b><br><small>Hullhaven · Tallow Cay · Dimmerrow</small></p>
            <p class="ae-credit">Key of the Fading Current<br><small>Story by @Russell</small></p>
            <p class="ae-credit"><small>Your progress has been saved.</small></p>
          </div>
          <button class="ae-btn tap">Return to Title</button>
        </div>`;
      L.querySelector('.ae-btn').addEventListener('click', () => G.scenes.go('title', {}, { fadeMs: 800 }));
      G.game.save();
    },
    exit() { document.getElementById('layer-screen').innerHTML = ''; },
    update(dt) { this.t += dt; G.scenes.get('title').t += dt; },
    render(ctx) {
      G.scenes.get('title').renderBg(ctx);
      ctx.fillStyle = 'rgba(5,4,12,0.55)';
      ctx.fillRect(0, 0, G.gfx.W, G.gfx.H);
    },
  });
})();
