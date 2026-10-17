/* =========================================================================
   fx.js — the battle effects engine.
   Glowing additive light, lightning, rune circles, pillars of light,
   crescent slashes, shockwave rings, projectiles, falling stars, crystal
   shards, smoke, vortexes and bouncy damage numbers.

   const fx = G.fx.create();
   fx.ring(x, y, { r0: 4, r1: 40, color: '#6ff3ff' });
   fx.update(dt); fx.draw(ctx, 'under' | 'over');
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const TAU = Math.PI * 2;
  const glow = (c, r) => G.pix.glow(c, Math.max(2, Math.round(r)));

  /* FF-style damage digits: 5x7 glyphs with a dark rim */
  const DIG = {
    0: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    2: ['.###.', '#...#', '....#', '..##.', '.#...', '#....', '#####'],
    3: ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
    4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
    7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  };
  const digCache = {};
  function digits(text, color) {
    const key = text + color;
    if (digCache[key]) return digCache[key];
    const chars = String(text).split('');
    const w = chars.length * 6 + 2, h = 9;
    const g = G.art.blank(w, h);
    chars.forEach((ch, i) => { const rows = DIG[ch]; if (rows) G.art.blit(g, G.art.grid(rows.map((r) => r.replace(/#/g, 'w'))), 1 + i * 6, 1); });
    G.art.outline(g, 'k');
    // fill the corners of the rim too, for a chunky outline
    const c = G.art.paint(g, { w: color, k: '#10101c' });
    return (digCache[key] = c);
  }

  function create() {
    const list = [], parts = [], nums = [];
    const add = (e) => { e.t = 0; e.layer = e.layer || 'over'; list.push(e); return e; };

    const fx = {
      list, parts, nums,
      clear() { list.length = 0; parts.length = 0; nums.length = 0; },

      /* ---------- primitives ---------- */
      glow(x, y, o = {}) { return add({ k: 'glow', x, y, r: o.r || 20, r1: o.r1, color: o.color || '#ffffff', dur: o.dur || 400, a: o.a || 1, layer: o.layer }); },
      ring(x, y, o = {}) { return add({ k: 'ring', x, y, r0: o.r0 || 2, r1: o.r1 || 30, color: o.color || '#ffffff', dur: o.dur || 420, w: o.w || 3, sq: o.sq || 1, layer: o.layer }); },
      bolt(x1, y1, x2, y2, o = {}) { return add({ k: 'bolt', x1, y1, x2, y2, color: o.color || '#6ff3ff', dur: o.dur || 320, w: o.w || 3, branches: o.branches ?? 3, seed: Math.random() * 1000 }); },
      beam(x1, y1, x2, y2, o = {}) { return add({ k: 'beam', x1, y1, x2, y2, color: o.color || '#ffd060', dur: o.dur || 400, w: o.w || 6 }); },
      pillar(x, y, o = {}) { return add({ k: 'pillar', x, y, h: o.h || 90, w: o.w || 18, color: o.color || '#ffe9a0', dur: o.dur || 800 }); },
      rune(x, y, o = {}) { return add({ k: 'rune', x, y, r: o.r || 18, color: o.color || '#6ff3ff', dur: o.dur || 900, spin: o.spin || 1, layer: o.layer || 'under', star: o.star ?? 5 }); },
      arc(x, y, o = {}) { return add({ k: 'arc', x, y, r: o.r || 16, a0: o.a0 ?? -2.2, a1: o.a1 ?? 0.9, color: o.color || '#ffffff', dur: o.dur || 260, w: o.w || 4 }); },
      shield(x, y, o = {}) { return add({ k: 'shield', x, y, r: o.r || 20, color: o.color || '#9ae0ff', dur: o.dur || 900 }); },
      cone(x1, y1, x2, y2, o = {}) { return add({ k: 'cone', x1, y1, x2, y2, color: o.color || '#ffd060', dur: o.dur || 700, w: o.w || 14 }); },
      darken(o = {}) { return add({ k: 'darken', a: o.a || 0.45, color: o.color || '#05030c', dur: o.dur || 900, layer: 'bg' }); },
      vortex(x, y, o = {}) { return add({ k: 'vortex', x, y, r: o.r || 60, color: o.color || '#c060ff', dur: o.dur || 1000 }); },
      gear(x, y, o = {}) { return add({ k: 'gear', x, y, r: o.r || 8, color: o.color || '#d9a441', dur: o.dur || 600 }); },

      /* a glowing projectile; resolves when it lands */
      orb(x1, y1, x2, y2, o = {}) {
        return new Promise((res) => add({ k: 'orb', x1, y1, x2, y2, color: o.color || '#ffb050', dur: o.dur || 320, r: o.r || 4, arc: o.arc ?? 14, onDone: res, trail: o.trail ?? true }));
      },
      /* a star that falls onto a point */
      star(x, y, o = {}) {
        return new Promise((res) => add({ k: 'star', x, y, sx: x - 30 - Math.random() * 20, sy: y - 120, color: o.color || '#ffe9a0', dur: o.dur || 380, onDone: res }));
      },

      /* ---------- particles ---------- */
      spark(x, y, o = {}) {
        const n = o.n || 14, sp = o.speed || 1.4;
        for (let i = 0; i < n; i++) {
          const a = (o.a0 != null ? o.a0 + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * TAU), s = (Math.random() * 0.7 + 0.3) * sp;
          parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 0), g: o.g ?? 0.012, life: -(o.delay || 0) - Math.random() * (o.stagger || 0), max: (o.life || 500) * (0.6 + Math.random() * 0.6), color: U.pick([].concat(o.color || '#ffffff')), size: o.size || 1, glow: o.glow ?? true, shrink: true, drag: o.drag ?? 0.985 });
        }
      },
      rise(x, y, o = {}) {
        for (let i = 0; i < (o.n || 16); i++) parts.push({ x: x + U.rand(-(o.w || 12), o.w || 12), y: y + U.rand(-4, 12), vx: U.rand(-0.06, 0.06), vy: -U.rand(0.25, 0.7), g: 0, life: -i * (o.stagger ?? 30), max: o.life || 800, color: U.pick([].concat(o.color || '#ffe9a0')), size: U.pick([1, 1, 2]), glow: true, twinkle: true, drag: 1 });
      },
      smoke(x, y, o = {}) {
        for (let i = 0; i < (o.n || 16); i++) parts.push({ x: x + U.rand(-12, 12), y: y + U.rand(-10, 10), vx: U.rand(-0.25, 0.25), vy: -U.rand(0.05, 0.3), g: 0, life: -i * 18, max: 1000, color: U.pick(['#a8a6b8', '#8a889a', '#c8c6d4']), size: U.pick([3, 4, 5]), puff: true, drag: 0.99 });
      },
      shards(x, y, o = {}) {
        for (let i = 0; i < (o.n || 10); i++) {
          const a = Math.random() * TAU, s = U.rand(0.8, 2.2);
          parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.6, g: 0.03, life: 0, max: 700, color: U.pick([].concat(o.color || ['#b8f060', '#e8ffb0', '#6ac040'])), size: 2, shard: true, rot: Math.random() * TAU, vr: U.rand(-0.2, 0.2), glow: true, drag: 0.98 });
        }
      },
      // back-compat helpers used across battle.js
      burst(x, y, color, n = 16, speed = 1.2) { fx.spark(x, y, { color, n, speed }); },
      slash(x, y, color = '#ffffff') { fx.arc(x, y, { color, r: 14 }); fx.spark(x, y, { color, n: 6, speed: 1 }); },
      fall(x, y, color) { fx.star(x, y, { color }); },
      num(x, y, text, color, big) { nums.push({ x: Math.round(x), y: Math.round(y), text: String(text), color, life: 0, max: 1100, big: !!big }); },
      /* gathering sparkles around a caster */
      chant(x, y, o = {}) {
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * TAU, r = 18 + (i % 3) * 4;
          parts.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.7, orbit: { cx: x, cy: y, a, r, w: 0.008 }, g: 0, life: -i * 20, max: 520, color: i % 2 ? '#ffffff' : (o.color || '#ffffff'), size: 1, glow: true, star: true, drag: 1 });
        }
      },
      /* twinkling four-point stars (Cure-like) */
      sparkles(x, y, o = {}) {
        for (let i = 0; i < (o.n || 12); i++) {
          parts.push({ x: x + U.rand(-(o.w || 14), o.w || 14), y: y + U.rand(-(o.h || 18), 4), vx: 0, vy: o.fall ? U.rand(0.3, 0.6) : -U.rand(0.05, 0.25), g: 0, life: -i * (o.stagger ?? 40), max: o.life || 600, color: U.pick([].concat(o.color || ['#ffffff', '#c8ffd8'])), size: 2, star: true, glow: true, drag: 1 });
        }
      },

      /* ---------- update & draw ---------- */
      update(dt) {
        for (const e of list) {
          e.t += dt;
          if (e.onDone && e.t >= e.dur && !e.done) { e.done = true; e.onDone(); }
          if (e.k === 'orb' && e.trail && Math.random() < 0.8) {
            const k = Math.min(1, e.t / e.dur), x = U.lerp(e.x1, e.x2, k), y = U.lerp(e.y1, e.y2, k) - Math.sin(k * Math.PI) * e.arc;
            parts.push({ x, y, vx: U.rand(-0.1, 0.1), vy: U.rand(-0.1, 0.1), g: 0, life: 0, max: 260, color: e.color, size: 2, glow: true, shrink: true, drag: 1 });
          }
          if (e.k === 'star' && Math.random() < 0.9) {
            const k = Math.min(1, e.t / e.dur), x = U.lerp(e.sx, e.x, k), y = U.lerp(e.sy, e.y, k);
            parts.push({ x, y, vx: 0, vy: 0, g: 0, life: 0, max: 300, color: e.color, size: 2, glow: true, shrink: true, drag: 1 });
          }
          if (e.k === 'vortex' && Math.random() < 0.9) {
            const a = Math.random() * TAU, r = e.r * U.rand(0.6, 1);
            parts.push({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r * 0.6, orbit: { cx: e.x, cy: e.y, a, r, w: 0.006 }, g: 0, life: 0, max: 700, color: U.pick([e.color, '#ffffff', '#ff8ae0']), size: U.pick([1, 2]), glow: true, shrink: true, drag: 1 });
          }
        }
        for (let i = list.length - 1; i >= 0; i--) if (list[i].t > list[i].dur + 30) list.splice(i, 1);
        for (const p of parts) {
          p.life += dt;
          if (p.life <= 0) continue;
          const s = dt * 0.06;
          if (p.orbit) { p.orbit.a += p.orbit.w * dt; p.orbit.r *= 0.985; p.x = p.orbit.cx + Math.cos(p.orbit.a) * p.orbit.r; p.y = p.orbit.cy + Math.sin(p.orbit.a) * p.orbit.r * 0.6; continue; }
          p.x += p.vx * s; p.y += p.vy * s; p.vy += p.g * s; p.vx *= p.drag; p.vy *= p.drag;
          if (p.shard) p.rot += p.vr * s;
        }
        for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life > parts[i].max) parts.splice(i, 1);
        for (const n of nums) n.life += dt;
        for (let i = nums.length - 1; i >= 0; i--) if (nums[i].life > nums[i].max) nums.splice(i, 1);
      },

      draw(ctx, layer) {
        const W = G.gfx.W, Hh = G.gfx.H;
        for (const e of list) {
          if (e.layer !== layer) continue;
          const k = U.clamp(e.t / e.dur, 0, 1);
          const fade = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.6) / 0.4);
          ctx.save();
          switch (e.k) {
            case 'darken': ctx.globalAlpha = e.a * (k < 0.2 ? k / 0.2 : k > 0.75 ? (1 - k) / 0.25 : 1); ctx.fillStyle = e.color; ctx.fillRect(0, 0, W, Hh); break;
            case 'glow': {
              const r = e.r1 ? U.lerp(e.r, e.r1, U.easeOut(k)) : e.r;
              ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = e.a * (1 - k);
              ctx.drawImage(glow(e.color, r), e.x - r, e.y - r); break;
            }
            case 'ring': {
              const r = U.lerp(e.r0, e.r1, U.easeOut(k));
              ctx.globalCompositeOperation = 'lighter';
              ctx.strokeStyle = e.color;
              ctx.globalAlpha = (1 - k) * 0.35; ctx.lineWidth = e.w * 3 * (1 - k) + 1;
              ctx.beginPath(); ctx.ellipse(e.x, e.y, r, r * e.sq, 0, 0, TAU); ctx.stroke();
              ctx.globalAlpha = 1 - k; ctx.lineWidth = Math.max(1, e.w * (1 - k));
              ctx.beginPath(); ctx.ellipse(e.x, e.y, r, r * e.sq, 0, 0, TAU); ctx.stroke(); break;
            }
            case 'bolt': {
              ctx.globalCompositeOperation = 'lighter';
              const seed = e.seed + Math.floor(e.t / 45);
              const path = (x1, y1, x2, y2, segs, jit, sd) => {
                const pts = [[x1, y1]];
                for (let i = 1; i < segs; i++) {
                  const t = i / segs, nx = -(y2 - y1), ny = x2 - x1, l = Math.hypot(nx, ny) || 1;
                  const off = (U.hash(i, sd, seed) - 0.5) * jit;
                  pts.push([U.lerp(x1, x2, t) + (nx / l) * off, U.lerp(y1, y2, t) + (ny / l) * off]);
                }
                pts.push([x2, y2]);
                return pts;
              };
              const stroke = (pts, w, col, a) => { ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
              const main = path(e.x1, e.y1, e.x2, e.y2, 9, 18, 1);
              const a = fade;
              stroke(main, e.w * 3, e.color, 0.25 * a); stroke(main, e.w, e.color, 0.8 * a); stroke(main, 1, '#ffffff', a);
              for (let b = 0; b < e.branches; b++) {
                const from = main[2 + Math.floor(U.hash(b, 4, seed) * 5)];
                const ang = Math.atan2(e.y2 - e.y1, e.x2 - e.x1) + (U.hash(b, 5, seed) - 0.5) * 2.2;
                const len = 10 + U.hash(b, 6, seed) * 18;
                const br = path(from[0], from[1], from[0] + Math.cos(ang) * len, from[1] + Math.sin(ang) * len, 4, 8, b + 7);
                stroke(br, 2, e.color, 0.6 * a); stroke(br, 1, '#ffffff', 0.7 * a);
              }
              ctx.globalAlpha = a; ctx.drawImage(glow(e.color, 18), e.x2 - 18, e.y2 - 18);
              break;
            }
            case 'beam': {
              ctx.globalCompositeOperation = 'lighter';
              const w = e.w * (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8);
              ctx.lineCap = 'round';
              ctx.strokeStyle = e.color; ctx.globalAlpha = 0.35; ctx.lineWidth = w * 2.2;
              ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke();
              ctx.globalAlpha = 0.9; ctx.lineWidth = w;
              ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke();
              ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, w * 0.35);
              ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke(); break;
            }
            case 'pillar': {
              ctx.globalCompositeOperation = 'lighter';
              const w = e.w * (k < 0.25 ? k / 0.25 : 1 - Math.max(0, k - 0.5) * 1.6);
              const top = e.y - e.h;
              const g = ctx.createLinearGradient(0, top, 0, e.y);
              const [r, gg, b] = U.hexToRgb(e.color);
              g.addColorStop(0, `rgba(${r},${gg},${b},0)`); g.addColorStop(0.6, `rgba(${r},${gg},${b},0.55)`); g.addColorStop(1, `rgba(${r},${gg},${b},0.9)`);
              ctx.fillStyle = g; ctx.globalAlpha = 1;
              ctx.fillRect(e.x - w / 2, top, w, e.h);
              ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(e.x - w / 8, top + e.h * 0.35, w / 4, e.h * 0.65);
              ctx.globalAlpha = fade; ctx.drawImage(glow(e.color, 24), e.x - 24, e.y - 18);
              break;
            }
            case 'rune': {
              const sc = k < 0.2 ? U.easeOut(k / 0.2) : 1;
              const r = e.r * sc, rot = e.t * 0.002 * e.spin;
              ctx.globalCompositeOperation = 'lighter';
              ctx.globalAlpha = fade * 0.9; ctx.strokeStyle = e.color; ctx.lineWidth = 1;
              ctx.translate(e.x, e.y); ctx.scale(1, 0.45);
              ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
              ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, TAU); ctx.stroke();
              ctx.beginPath();
              const n = e.star;
              for (let i = 0; i <= n; i++) { const a = rot + (i * 2 * TAU * (n === 6 ? 1 / 6 : 2 / n)) / 2; const px = Math.cos(a) * r * 0.78, py = Math.sin(a) * r * 0.78; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
              ctx.stroke();
              ctx.fillStyle = '#ffffff';
              for (let i = 0; i < 12; i++) { const a = -rot * 1.5 + (i / 12) * TAU; ctx.fillRect(Math.cos(a) * r * 0.89 - 0.5, Math.sin(a) * r * 0.89 - 0.5, 1, 1); }
              ctx.globalAlpha = fade * 0.35; ctx.drawImage(glow(e.color, r), -r, -r);
              break;
            }
            case 'arc': {
              ctx.globalCompositeOperation = 'lighter';
              const head = U.lerp(e.a0, e.a1, U.easeOut(Math.min(1, k * 1.6)));
              const tail = U.lerp(e.a0, e.a1, U.easeOut(Math.max(0, k * 1.6 - 0.6)));
              const steps = 12;
              for (let i = 0; i < steps; i++) {
                const t0 = U.lerp(tail, head, i / steps), t1 = U.lerp(tail, head, (i + 1) / steps);
                const w = e.w * (i / steps);
                ctx.strokeStyle = e.color; ctx.globalAlpha = 0.5 * fade; ctx.lineWidth = w * 2 + 1;
                ctx.beginPath(); ctx.arc(e.x, e.y, e.r, t0, t1); ctx.stroke();
                ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = fade; ctx.lineWidth = Math.max(1, w * 0.6);
                ctx.beginPath(); ctx.arc(e.x, e.y, e.r, t0, t1); ctx.stroke();
              }
              break;
            }
            case 'shield': {
              ctx.globalCompositeOperation = 'lighter';
              const r = e.r * (k < 0.2 ? U.easeOut(k / 0.2) : 1);
              ctx.globalAlpha = fade * 0.25; ctx.fillStyle = e.color;
              ctx.beginPath(); ctx.ellipse(e.x, e.y, r, r * 1.1, 0, 0, TAU); ctx.fill();
              ctx.globalAlpha = fade * 0.8; ctx.strokeStyle = e.color; ctx.lineWidth = 1;
              for (let i = 0; i < 6; i++) { // hexagon lattice
                const a = (i / 6) * TAU + e.t * 0.001;
                ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * 1.1); ctx.stroke();
              }
              ctx.beginPath(); ctx.ellipse(e.x, e.y, r, r * 1.1, 0, 0, TAU); ctx.stroke();
              ctx.beginPath(); ctx.ellipse(e.x, e.y, r * 0.55, r * 0.6, 0, 0, TAU); ctx.stroke();
              break;
            }
            case 'cone': {
              ctx.globalCompositeOperation = 'lighter';
              const a = Math.atan2(e.y2 - e.y1, e.x2 - e.x1), nx = -Math.sin(a), ny = Math.cos(a);
              const g = ctx.createLinearGradient(e.x1, e.y1, e.x2, e.y2);
              const [r, gg, b] = U.hexToRgb(e.color);
              g.addColorStop(0, `rgba(${r},${gg},${b},0.8)`); g.addColorStop(1, `rgba(${r},${gg},${b},0.15)`);
              ctx.globalAlpha = fade; ctx.fillStyle = g;
              ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2 + nx * e.w, e.y2 + ny * e.w); ctx.lineTo(e.x2 - nx * e.w, e.y2 - ny * e.w); ctx.closePath(); ctx.fill();
              ctx.drawImage(glow(e.color, e.w * 1.6), e.x2 - e.w * 1.6, e.y2 - e.w * 1.6);
              break;
            }
            case 'orb': {
              const kk = U.easeInOut(k), x = U.lerp(e.x1, e.x2, kk), y = U.lerp(e.y1, e.y2, kk) - Math.sin(kk * Math.PI) * e.arc;
              ctx.globalCompositeOperation = 'lighter';
              ctx.drawImage(glow(e.color, e.r * 3), x - e.r * 3, y - e.r * 3);
              ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, e.r * 0.6, 0, TAU); ctx.fill();
              break;
            }
            case 'star': {
              const x = U.lerp(e.sx, e.x, k), y = U.lerp(e.sy, e.y, k);
              ctx.globalCompositeOperation = 'lighter';
              ctx.drawImage(glow(e.color, 10), x - 10, y - 10);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(x - 3, y, 7, 1); ctx.fillRect(x, y - 3, 1, 7); ctx.fillRect(x - 1, y - 1, 3, 3);
              break;
            }
            case 'vortex': {
              ctx.globalCompositeOperation = 'lighter';
              ctx.globalAlpha = fade * 0.6;
              ctx.translate(e.x, e.y); ctx.scale(1, 0.6);
              for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = i ? e.color : '#ffffff'; ctx.lineWidth = 2 - i * 0.5;
                ctx.beginPath();
                for (let a = 0; a < TAU * 1.5; a += 0.2) { const rr = e.r * (1 - a / (TAU * 1.6)) ; const aa = a + e.t * 0.006 + i * 2; ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); }
                ctx.stroke();
              }
              break;
            }
            case 'gear': {
              ctx.translate(e.x, e.y); ctx.rotate(e.t * 0.012);
              ctx.globalAlpha = fade; ctx.fillStyle = e.color;
              for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); ctx.fillRect(-1.5, -e.r - 2, 3, 4); }
              ctx.beginPath(); ctx.arc(0, 0, e.r, 0, TAU); ctx.fill();
              ctx.fillStyle = '#3a2410'; ctx.beginPath(); ctx.arc(0, 0, e.r * 0.4, 0, TAU); ctx.fill();
              break;
            }
          }
          ctx.restore();
        }
        if (layer !== 'over') return;
        // particles
        for (const p of parts) {
          if (p.life <= 0) continue;
          const k = p.life / p.max;
          const a = Math.max(0, 1 - k) * (p.twinkle ? 0.6 + 0.4 * Math.sin(p.life / 40) : 1);
          if (p.puff) {
            ctx.globalAlpha = a * 0.55; ctx.fillStyle = p.color;
            const s = p.size * (1 + k * 1.5);
            ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, TAU); ctx.fill();
            continue;
          }
          const s = p.shrink ? Math.max(1, Math.round(p.size * (1 - k * 0.7))) : p.size;
          if (p.glow) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * 0.5; const gr = 3 + s * 2; ctx.drawImage(glow(p.color, gr), p.x - gr, p.y - gr); }
          ctx.globalAlpha = a; ctx.fillStyle = p.color;
          if (p.star) {
            const px = Math.round(p.x), py = Math.round(p.y), r = k < 0.5 ? 2 : 1;
            ctx.fillRect(px - r, py, r * 2 + 1, 1); ctx.fillRect(px, py - r, 1, r * 2 + 1);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(px, py, 1, 1);
          } else if (p.shard) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-1, -2, 2, 4); ctx.restore(); }
          else ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.globalAlpha = 1;
        // damage numbers bounce like the SNES classics: hop, settle, then vanish
        for (const n of nums) {
          const t = n.life;
          let dy = 0;
          if (t < 300) dy = -Math.sin((t / 300) * Math.PI) * 12;
          else if (t < 450) dy = -Math.sin(((t - 300) / 150) * Math.PI) * 4;
          if (t > n.max - 120 && Math.floor(t / 40) % 2) continue;
          const y = Math.round(n.y + dy);
          if (/^\d+$/.test(n.text)) {
            const img = digits(n.text, n.color || '#ffffff');
            const sc = n.big ? 2 : 1;
            ctx.drawImage(img, Math.round(n.x - (img.width * sc) / 2), y - img.height * sc, img.width * sc, img.height * sc);
          } else {
            G.font.drawCentered(ctx, n.text, n.x, y - 7, n.color || '#ffffff', 1, '#10101c');
          }
        }
        ctx.globalAlpha = 1;
      },
    };
    return fx;
  }

  G.fx = { create };
})();
