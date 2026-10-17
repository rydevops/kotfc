/* =========================================================================
   scene-intro.js — the opening cutscene, staged like a 16-bit prologue:
   a Mode 7 flight over the sea of clouds while captions tell the story.
     1. Dusk flight past floating islands          — the world of Orrenth
     2. Night: a sky-ferry sails between lanterns  — the Current harnessed
     3. The lanterns go out, islands sink          — the fading
     4. A child in a field of light                — the mystery
     5. Wren at the island's edge                  — our heroine
   Tap "Skip" to jump to the title.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const M7 = () => G.mode7;

  const PANELS = [
    { dur: 7500, text: 'This is Orrenth, a world of islands held aloft by the Current.' },
    { dur: 7500, text: 'We learned to harness it. Lanterns. Bridges. Ferries across the sky.' },
    { dur: 8000, text: 'But the Current is fading. Lantern by lantern, island by island, the world is sinking toward the deep.' },
    { dur: 7500, text: 'Nineteen years ago, a child was found alone, wrapped in a field of light. Around her neck: a plain brass pendant.' },
    { dur: 7000, text: 'She doesn\'t know what she is.\nNot yet.' },
  ];
  // islands placed in the Mode 7 world (x, y on the cloud plane, z = height above it)
  const ISLES = [
    { x: -60, y: -260, z: 34, w: 64, seed: 11, houses: 3, lanterns: 2 },
    { x: 90, y: -420, z: 50, w: 80, seed: 22, houses: 4, lanterns: 3 },
    { x: -120, y: -600, z: 26, w: 56, seed: 33, houses: 2, lanterns: 2, waterfall: true },
    { x: 40, y: -760, z: 62, w: 44, seed: 44, tower: true },
    { x: 150, y: -900, z: 30, w: 70, seed: 55, houses: 3, lanterns: 2 },
    { x: -40, y: -1060, z: 44, w: 52, seed: 66, houses: 2, lanterns: 1 },
  ];
  const SPEED = 0.07; // world units per ms

  function drawWorld(ctx, W, Hh, t, o) {
    const hz = Math.round(Hh * 0.36);
    const kind = o.kind;
    M7().sky(ctx, kind, W, hz + 1, t, { sun: kind === 'dusk' ? [W * 0.7, hz - 16, 16] : null, moon: kind === 'night' ? [W * 0.78, hz * 0.35] : null });
    if (o.ribbons) G.sky.ribbons(ctx, t, o.ribbons, 0.18);
    // distant flat cloud bank on the horizon
    ctx.fillStyle = { dusk: '#f0a080', night: '#3a4a88', dark: '#2a3240' }[kind] || '#888';
    ctx.fillRect(0, hz - 1, W, 2);
    const fog = { dusk: [248, 176, 140], night: [40, 56, 110], dark: [30, 36, 46] }[kind];
    const camY = -o.travel;
    const v = M7().render(ctx, M7().texture(kind), { W, H: Hh, horizon: hz, x: o.camX || 0, y: camY, angle: -Math.PI / 2 + (o.turn || 0), height: 46, focal: 140, scale: 1.6, fog, fogDist: 700 });
    // islands as scaled billboards, far to near
    const items = [];
    ISLES.forEach((s, n) => {
      // loop the islands so there is always one ahead of the camera
      const per = 1100, rel = (((camY - 20 - s.y) % per) + per) % per, wy = camY - 20 - rel;
      const sink = o.sink ? Math.max(0, o.sink - n * 500) * 0.02 : 0;
      const p = M7().project(v, s.x, wy, s.z - sink);
      if (p) items.push({ p, s, n, sink });
    });
    items.sort((a, b) => b.p.dist - a.p.dist);
    const glows = [];
    for (const { p, s, n } of items) {
      const isl = G.sky.island(s.seed, s.w, { houses: s.houses, lanterns: s.lanterns, tower: s.tower, waterfall: s.waterfall });
      const k = Math.min(3, p.s * 0.9);
      if (k < 0.12) continue;
      const w = Math.round(isl.c.width * k), h = Math.round(isl.c.height * k);
      const x = Math.round(p.x - w / 2), y = Math.round(p.y - isl.top * k);
      ctx.globalAlpha = U.clamp((p.s - 0.1) * 4, 0, 1);
      ctx.drawImage(isl.c, x, y, w, h);
      ctx.globalAlpha = 1;
      isl.lights.forEach((L, j) => {
        const off = o.lightsOut != null && o.lightsOut > (n * 3 + j) * 380;
        if (!off) glows.push({ x: x + L.x * k, y: y + L.y * k, r: 3 + 4 * k, c: L.c || '#ffb050' });
      });
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const g of glows) { ctx.globalAlpha = 0.55; ctx.drawImage(G.pix.glow(g.c, Math.round(g.r)), g.x - g.r, g.y - g.r); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    return v;
  }

  G.scenes.register('intro', {
    t: 0, idx: -1,
    enter() {
      this.t = 0; this.idx = -1; this.done = false;
      const L = document.getElementById('layer-screen');
      L.innerHTML = `<div class="intro"><div class="caption"></div><button class="skip tap win">Skip ▸</button></div>`;
      G.ui.onTap(L.querySelector('.skip'), (e) => { e.stopPropagation(); this.finish(); });
      this.h = G.input.push((b) => { if (b === 'b' || b === 'menu') this.finish(); return true; });
      G.audio.music('intro');
    },
    exit() { G.input.pop(this.h); document.getElementById('layer-screen').innerHTML = ''; },
    finish() {
      if (this.done) return;
      this.done = true;
      G.gfx.flash('#ffffff', 600);
      G.scenes.go('title', { fromIntro: true }, { fadeMs: 500 });
    },
    update(dt) {
      this.t += dt;
      let acc = 0, idx = PANELS.length;
      for (let i = 0; i < PANELS.length; i++) { if (this.t < acc + PANELS[i].dur) { idx = i; break; } acc += PANELS[i].dur; }
      this.local = this.t - acc;
      if (idx >= PANELS.length) return this.finish();
      if (idx !== this.idx) {
        this.idx = idx;
        const cap = document.querySelector('.intro .caption');
        if (cap) {
          cap.classList.remove('show');
          setTimeout(() => { cap.innerHTML = U.esc(PANELS[idx].text).replace('\n', '<br>'); cap.classList.add('show'); }, 500);
        }
        if (idx === 2) G.audio.sfx('fizzle');
        if (idx === 3) G.audio.sfx('pendant');
      }
    },
    render(ctx) {
      const W = G.gfx.W, Hh = G.gfx.H, t = this.t, i = Math.max(0, this.idx), lt = this.local || 0;
      const k = lt / PANELS[i].dur;
      ctx.imageSmoothingEnabled = false;
      if (i <= 2) {
        const kind = i === 0 ? 'dusk' : i === 1 ? 'night' : 'dark';
        const travel = t * SPEED;
        drawWorld(ctx, W, Hh, t, {
          kind, travel, turn: Math.sin(t / 5000) * 0.12, camX: Math.sin(t / 7000) * 40,
          ribbons: i === 1 ? Math.min(0.6, k) : i === 2 ? 0.2 * (1 - k) : 0,
          lightsOut: i === 2 ? lt - 600 : null, sink: i === 2 ? lt : 0,
        });
        // the ferry sails beside us through the night
        if (i >= 1) {
          const f = M7().ferry();
          const fx = Math.round(i === 1 ? W * 0.5 - f.width / 2 + Math.sin(t / 2600) * 18 : W * 0.5 - f.width / 2 - k * 30);
          const fy = Math.round(Hh * 0.56 + Math.sin(t / 700) * 3 + (i === 2 ? k * 26 : 0));
          ctx.drawImage(f, fx, fy);
          // keel crystal glow and lanterns
          ctx.globalCompositeOperation = 'lighter';
          const pulse = i === 2 ? Math.max(0, 0.6 - k * 0.6) : 0.6;
          ctx.globalAlpha = pulse; ctx.drawImage(G.pix.glow('#6ff3ff', 12), fx + 24 - 12, fy + 25 - 12);
          ctx.globalAlpha = 0.7; ctx.drawImage(G.pix.glow('#ffb040', 8), fx + 3 - 8, fy + 14 - 8); ctx.drawImage(G.pix.glow('#ffb040', 8), fx + 38 - 8, fy + 14 - 8);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
        if (i === 2) { ctx.fillStyle = `rgba(4,6,14,${k * 0.45})`; ctx.fillRect(0, 0, W, Hh); }
      } else if (i === 3) {
        // a child in a field of light
        ctx.fillStyle = '#02020a'; ctx.fillRect(0, 0, W, Hh);
        const cx = Math.round(W / 2), cy = Math.round(Hh * 0.45);
        const grow = Math.min(1, lt / 1600);
        const rings = [[52, '#0c2a48'], [40, '#14486a'], [30, '#1e7090'], [21, '#3aa8c8'], [13, '#7ae0f0'], [7, '#d8fcff']];
        for (const [r0, c] of rings) {
          const r = Math.round(r0 * grow * (1 + Math.sin(t / 420 + r0) * 0.04));
          ctx.fillStyle = c;
          for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); ctx.fillRect(cx - w, cy + j, w * 2, 1); }
        }
        // hexagonal field lines and motes
        ctx.fillStyle = '#bff8ff';
        for (let a = 0; a < 6; a++) {
          const ang = a / 6 * Math.PI * 2 + t / 3000;
          for (let s = 0; s < 1; s += 0.08) {
            const a2 = ang + Math.PI / 3, r = 34 * grow;
            const x = cx + U.lerp(Math.cos(ang), Math.cos(a2), s) * r, y = cy + U.lerp(Math.sin(ang), Math.sin(a2), s) * r;
            ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
          }
        }
        for (let m = 0; m < 24; m++) {
          const a = U.hash(m, 1, 2) * 6.28 + t / 2000, r = 20 + ((t / 30 + m * 13) % 50);
          ctx.fillStyle = m % 3 ? '#9af0ff' : '#ffffff';
          ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.8), 1, 1);
        }
        // the bundle, with the pendant glinting
        const bx = cx - 7, by = cy - 5;
        const B = ['..kkkkkkkk....', '.kwwwwwwwwk...', 'kwwsssswwwwk..', 'kwshhhhswwwwk.', 'kwssessswwwwk.', 'kwwssssgwwwwk.', '.kwwwwwwwwwwk.', '..kvvwwwwvvk..', '...kkkkkkkk...'];
        const pg = Math.sin(t / 250) > 0 ? '#ffe070' : '#fff8c0';
        ctx.drawImage(G.art.paint(G.art.grid(B), { k: '#1a2040', w: '#f0f4ff', v: '#a8b8e0', s: '#f4c8a8', h: '#8c5ae6', e: '#2a1a30', g: pg }), bx, by);
      } else {
        // Wren at the island's edge, looking out over the night sky
        const kind = 'night';
        drawWorld(ctx, W, Hh, t, { kind, travel: 300 + t * 0.006, ribbons: 0.35 });
        const gy = Math.round(Hh * 0.7);
        // the cliff she stands on (foreground, left)
        const edge = Math.round(W * 0.66);
        ctx.fillStyle = '#2a5a32'; ctx.fillRect(0, gy, edge, 2);
        ctx.fillStyle = '#4c9442'; ctx.fillRect(0, gy - 2, edge - 2, 3);
        for (let x = 0; x < edge; x += 4) { ctx.fillStyle = '#6cb04e'; ctx.fillRect(x + 1, gy - 3, 1, 1); }
        for (let y = gy + 2; y < Hh; y++) {
          const inset = Math.round(Math.pow((y - gy) / (Hh - gy), 1.4) * 40);
          const band = Math.floor((y - gy) / 7);
          ctx.fillStyle = ['#3a2a30', '#4a3438', '#30222a', '#42303a'][band % 4];
          ctx.fillRect(0, y, edge - inset, 1);
          ctx.fillStyle = '#1a1018'; ctx.fillRect(edge - inset, y, 1, 1);
        }
        const spr = G.sprites.char('wren').up[0];
        const s = 2;
        const wx = Math.round(W * 0.44 - 8 * s), wy = gy - 19 * s;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t / 300);
        ctx.drawImage(G.pix.glow('#ffd27a', 26), wx + 8 * s - 26, wy + 13 * s - 26);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(spr, wx, wy, spr.width * s, spr.height * s);
      }
      // letterbox bars
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, Math.round(Hh * 0.08));
      ctx.fillRect(0, Math.round(Hh * 0.92), W, Hh);
    },
  });

  G.drawFerrySmall = (ctx, x, y) => ctx.drawImage(G.mode7.ferry(), x - 4, y - 14, 24, 14);
  G.intro = { drawWorld };
})();
