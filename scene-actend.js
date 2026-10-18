/* =========================================================================
   scene-actend.js — end-of-act card with a short credits roll.
   ========================================================================= */
(function () {
  'use strict';
  G.scenes.register('actEnd', {
    t: 0,
    enter(p) {
      this.t = 0;
      G.audio.music('epilogue');
      const L = document.getElementById('layer-screen');
      L.innerHTML = `
        <div class="actend">
          <div class="roll">
            <p class="ae-sub">The End</p>
            <h1>Key of the Fading Current</h1>
            <h2>The lanterns are lit</h2>
            <p class="ae-line">The Current flows again, slowly, the way a tide comes in.<br>Somebody always lights the next lantern.</p>
            <p class="ae-credit">Wren Ashgrove · Pip Quillfeather · Cog<br>Vesper Nyx · Brother Hollis<br><small>and everyone who held a lantern for someone else</small></p>
            <p class="ae-credit"><small>Thank you for playing.</small></p>
            <p class="ae-credit"><small>Your progress has been saved. Choose Continue on the title screen to walk the harbor again.</small></p>
          </div>
          <button class="ae-btn tap">Return to Title</button>
        </div>`;
      G.ui.onTap(L.querySelector('.ae-btn'), () => G.scenes.go('title', {}, { fadeMs: 800 }));
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
