/* =========================================================================
   battle.js — turn-based combat with the Current Flow meter.

   FLOW (0-10, shared by the party, persists between battles)
     +1 for each basic attack, +1 when an enemy hits the party, +1 on Guard
     Skills spend their Flow cost.
     Dim 0-3 · Steady 4-9 · Bright 10 → next skill +25% power, meter drops to 6
     Overdraw (cost > Flow) → SURGE: hurts everyone, triggers a rift effect.

   Boss behaviours live in BOSS_MECHANICS and are keyed by mob.mechanic.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const sleep = U.sleep;

  /* ======================= Boss mechanics ======================= */
  const BOSS_MECHANICS = (G.BOSS_MECHANICS = {
    guardian: {
      async onStart(b, e) {
        if (!b.opts.tutorial) return;
        await b.ui.tip('The ~Flow meter~ at the top is the Current around you — shared by the whole party.');
        await b.ui.tip('Basic attacks and Guarding add Flow. Getting hit adds Flow too. Skills *spend* it.');
        await b.ui.tip('Cast a skill without enough Flow and you *Overdraw*: a ~Surge~ hurts everyone. This guardian feeds on Surges!');
      },
      chooseMove(b, e) { return b.round % 3 === 0 ? e.data.moves[1] : e.data.moves[0]; },
      async onSurge(b, e) {
        e.str += 3;
        await b.ui.msg(`${e.name} drinks the Surge! Its Strength rises!`, 1000);
      },
    },
    golem: {
      async onStart(b, e) {
        e.status.shell = 99;
        await b.ui.msg('A Ward Shell of woven Current shields the golem!', 1000);
        if (!b.st.flags.golemTip) {
          b.st.flags.golemTip = true;
          await b.ui.tip('Cog bleeps: the shell drinks *unspent* Current. Spend ~Flow~ on a skill to shatter it!');
        }
      },
      chooseMove(b, e) { return b.round % 3 === 0 ? e.data.moves[1] : e.data.moves[0]; },
      modifyDamageTaken(b, e, dmg) { return e.status.shell ? Math.max(1, Math.round(dmg * 0.25)) : dmg; },
      async onFlowSpent(b, e, amount) {
        if (amount > 0 && e.status.shell) {
          delete e.status.shell;
          e.shellDown = 2;
          G.audio.sfx('shield');
          b.fx.burst(e.x, e.y, '#9ae0ff', 30);
          await b.ui.msg('The Ward Shell shatters!', 900);
        }
      },
      async onRoundEnd(b, e) {
        if (!e.status.shell && e.alive) {
          e.shellDown--;
          if (e.shellDown <= 0) { e.status.shell = 99; G.audio.sfx('shield'); await b.ui.msg('The golem\'s Ward Shell reforms.', 900); }
        }
      },
    },
  });

  /* ======================= Rift effects (Surge) ======================= */
  const RIFT_EFFECTS = [
    { name: 'Rift Bloom', text: 'Petals of light fall. The party recovers!', async run(b) { for (const c of b.party.filter((c) => c.alive)) b.heal(c, Math.round(c.maxhp * 0.15)); } },
    { name: 'Mirror Rift', text: 'The rift mirrors the pain back... the enemies recover!', async run(b) { for (const c of b.enemies.filter((c) => c.alive)) b.heal(c, Math.round(c.maxhp * 0.1)); } },
    { name: 'Static Rain', text: 'The Flow meter scrambles!', async run(b) { b.setFlow(U.randInt(1, 7)); } },
    { name: 'Starfall', text: 'A shard of sky falls!', async run(b) { const t = U.pick(b.all().filter((c) => c.alive)); if (t) await b.applyDamage(null, t, Math.round(t.maxhp * 0.15), { fx: 'stars' }); } },
    { name: 'Rift Fog', text: 'A fog of torn space blinds everyone!', async run(b) { for (const c of b.all().filter((c) => c.alive)) c.status.blind = 1; } },
  ];

  /* ======================= Particles / FX ======================= */
  function makeFx() {
    const parts = [], nums = [], beams = [];
    return {
      parts, nums, beams,
      burst(x, y, color, n = 16, speed = 1.2) {
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2, s = Math.random() * speed + 0.3;
          parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.3, life: 0, max: 400 + Math.random() * 300, color, g: 0.01 });
        }
      },
      rise(x, y, color, n = 14) {
        for (let i = 0; i < n; i++) parts.push({ x: x + U.rand(-10, 10), y: y + U.rand(-4, 10), vx: U.rand(-0.1, 0.1), vy: -U.rand(0.3, 0.8), life: -i * 25, max: 700, color, g: 0 });
      },
      fall(x, y, color, n = 12) {
        for (let i = 0; i < n; i++) parts.push({ x: x + U.rand(-16, 16), y: y - 40 - U.rand(0, 20), vx: 0.2, vy: U.rand(1.2, 2), life: -i * 30, max: 500, color, g: 0, size: 2 });
      },
      slash(x, y, color = '#ffffff') {
        for (let i = 0; i < 12; i++) parts.push({ x: x - 10 + i * 2, y: y - 10 + i * 2, vx: 0, vy: 0, life: -i * 12, max: 220, color, g: 0, size: 2 });
      },
      smoke(x, y) { for (let i = 0; i < 18; i++) parts.push({ x: x + U.rand(-14, 14), y: y + U.rand(-10, 10), vx: U.rand(-0.3, 0.3), vy: -U.rand(0, 0.3), life: -i * 15, max: 900, color: '#9a98a8', g: 0, size: 3 }); },
      beam(x1, y1, x2, y2, color) { beams.push({ x1, y1, x2, y2, color, life: 0, max: 260 }); },
      num(x, y, text, color) { nums.push({ x, y, text: String(text), color, life: 0, max: 900 }); },
      update(dt) {
        for (const p of parts) { p.life += dt; if (p.life > 0) { p.x += p.vx * dt * 0.06; p.y += p.vy * dt * 0.06; p.vy += p.g * dt * 0.06; } }
        for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life > parts[i].max) parts.splice(i, 1);
        for (const n of nums) n.life += dt;
        for (let i = nums.length - 1; i >= 0; i--) if (nums[i].life > nums[i].max) nums.splice(i, 1);
        for (const bm of beams) bm.life += dt;
        for (let i = beams.length - 1; i >= 0; i--) if (beams[i].life > beams[i].max) beams.splice(i, 1);
      },
      draw(ctx) {
        for (const bm of beams) {
          ctx.globalAlpha = 1 - bm.life / bm.max;
          ctx.strokeStyle = bm.color; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1);
          const steps = 6;
          for (let i = 1; i <= steps; i++) {
            const k = i / steps;
            ctx.lineTo(U.lerp(bm.x1, bm.x2, k) + (i < steps ? U.rand(-4, 4) : 0), U.lerp(bm.y1, bm.y2, k) + (i < steps ? U.rand(-4, 4) : 0));
          }
          ctx.stroke();
        }
        for (const p of parts) {
          if (p.life < 0) continue;
          ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
          ctx.fillStyle = p.color;
          const s = p.size || 1;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
        }
        ctx.globalAlpha = 1;
        for (const n of nums) {
          const k = n.life / n.max;
          const y = n.y - Math.min(10, n.life * 0.04) + (k > 0.15 ? 0 : -Math.sin(k / 0.15 * Math.PI) * 3);
          ctx.globalAlpha = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
          G.font.drawCentered(ctx, n.text, n.x, Math.round(y), n.color, 1);
        }
        ctx.globalAlpha = 1;
      },
    };
  }

  /* ======================= Combatants ======================= */
  function partyCombatant(m) {
    const d = G.data.chars[m.id];
    const c = {
      side: 'party', id: m.id, m, data: d, name: d.short, look: d.look, status: {}, bonus: {},
      get hp() { return m.hp; }, set hp(v) { m.hp = v; },
      get mp() { return m.mp; }, set mp(v) { m.mp = v; },
      get alive() { return m.hp > 0; },
    };
    const s = G.game.stats(m);
    Object.assign(c, { maxhp: s.hp, maxmp: s.mp, str: s.str, def: s.def, res: s.res, luk: s.luk, spd: s.spd });
    c.sprite = G.sprites.char(d.look);
    return c;
  }
  function enemyCombatant(id, suffix) {
    const d = G.data.mobs[id];
    if (!d) throw new Error('Unknown mob ' + id);
    const c = {
      side: 'enemy', id, data: d, name: d.name + (suffix || ''), status: {}, bonus: {},
      hp: d.hp, maxhp: d.hp, mp: d.mp, maxmp: d.mp, str: d.str, def: d.def, res: d.res, luk: d.luk, spd: d.spd,
      sprite: G.sprites.mob(d), scale: d.scale || 2, opacity: 1, deadT: 0,
    };
    Object.defineProperty(c, 'alive', { get() { return c.hp > 0; } });
    return c;
  }

  /* ======================= The battle ======================= */
  const B = (G.battle = {
    active: null,
    BOSS_MECHANICS, RIFT_EFFECTS,

    /* Entry point used by scripts and random encounters. */
    async run(opts) {
      const st = G.game.state;
      const snapshot = U.clone({ party: st.party, inv: st.inv, gold: st.gold, flow: st.flow });
      const prevMusic = G.audio.currentSong;
      G.audio.sfx('encounter');
      await swirl();
      let result;
      for (;;) {
        result = await B.fight(opts);
        if (result !== 'lose') break;
        if (opts.loseOk) { result = 'lose'; break; }
        const choice = await B.ui.gameOver();
        if (choice === 'retry') {
          Object.assign(st, U.clone(snapshot));
          continue;
        }
        B.cleanup();
        if (choice === 'load') {
          const saved = G.game.load(st.slot);
          if (saved) { G.game.state = saved; await G.scenes.go('world', {}); }
          else await G.scenes.go('title');
        } else await G.scenes.go('title');
        return 'quit';
      }
      B.cleanup();
      await G.scenes.go('world', { resume: true }, { fadeMs: 250 });
      if (opts.afterMusic !== false) G.audio.music(G.world.env.music || prevMusic);
      G.world.updateHud(false);
      return result;
    },

    cleanup() {
      document.getElementById('layer-battle').innerHTML = '';
      B.active = null;
    },

    async fight(opts) {
      const st = G.game.state;
      const counts = {};
      opts.mobs.forEach((id) => (counts[id] = (counts[id] || 0) + 1));
      const seen = {};
      const b = {
        opts, st, round: 0, fx: makeFx(), t: 0, listened: false, cursor: null,
        party: st.party.map(partyCombatant),
        enemies: opts.mobs.map((id) => {
          seen[id] = (seen[id] || 0) + 1;
          return enemyCombatant(id, counts[id] > 1 ? ' ' + 'ABCDE'[seen[id] - 1] : '');
        }),
        all() { return [...this.party, ...this.enemies]; },
        ui: null,
      };
      B.active = b;
      b.ui = B.ui;
      Object.assign(b, B.methods);
      // Act I party members heal fully when they first join a fight from 0 HP? No — KO persists. Revive at 1 HP if everyone is down.
      if (!b.party.some((c) => c.alive)) b.party[0].m.hp = 1;

      await G.scenes.go('battle', { b }, { fadeMs: 200 });
      G.audio.music(opts.music || (b.enemies.some((e) => e.data.boss) ? 'boss' : 'battle'));
      B.ui.build(b);
      b.layout();
      const names = [...new Set(b.enemies.map((e) => e.data.name))];
      await b.ui.msg(opts.introText || (b.enemies.some((e) => e.data.boss) ? `${names[0]} blocks the way!` : `${names.join(' and ')} ${b.enemies.length > 1 ? 'appear' : 'appears'}!`), 900);
      for (const e of b.enemies) { const mech = BOSS_MECHANICS[e.data.mechanic]; if (mech && mech.onStart) await mech.onStart(b, e); }
      if (opts.onStart) await opts.onStart(b);

      for (;;) {
        b.round++;
        b.listened = false;
        for (const e of b.enemies) if (e.alive) e.intent = b.chooseMove(e);
        b.ui.refresh();
        const order = b.all().filter((c) => c.alive).map((c) => ({ c, k: c.spd * U.rand(0.85, 1.15) + (c.side === 'party' ? 0.5 : 0) })).sort((a, z) => z.k - a.k).map((o) => o.c);
        for (const actor of order) {
          const out = b.outcome();
          if (out) return b.finish(out);
          if (!actor.alive) continue;
          delete actor.status.guard;
          // turn-skipping statuses
          for (const sk of ['snared', 'frozen', 'calmed']) {
            if (actor.status[sk]) {
              delete actor.status[sk];
              await b.ui.msg(`${actor.name} ${sk === 'snared' ? 'is caught in the snare!' : sk === 'calmed' ? 'is calmed by the Current\'s voice.' : 'is held in Stillness!'}`, 800);
              actor.skip = true;
            }
          }
          if (actor.skip) { actor.skip = false; continue; }
          b.active = actor;
          b.ui.refresh();
          if (actor.side === 'party') {
            const act = await b.ui.command(b, actor);
            if (act.type === 'flee') {
              const ok = await b.tryFlee();
              if (ok) return b.finish('flee');
              continue;
            }
            await b.perform(actor, act);
          } else {
            await b.enemyTurn(actor);
          }
          b.active = null;
          b.ui.refresh();
          if (b.outcome()) return b.finish(b.outcome());
        }
        // end of round
        for (const c of b.all()) for (const k of Object.keys(c.status)) {
          if (['snared', 'frozen', 'calmed', 'guard'].includes(k)) continue;
          c.status[k]--;
          if (c.status[k] <= 0) delete c.status[k];
        }
        for (const e of b.enemies) { const mech = BOSS_MECHANICS[e.data.mechanic]; if (mech && mech.onRoundEnd && e.alive) await mech.onRoundEnd(b, e); }
        if (opts.onRoundEnd) await opts.onRoundEnd(b);
        const out = b.outcome();
        if (out) return b.finish(out);
      }
    },
  });

  /* Methods mixed into the battle object `b` */
  B.methods = {
    layout() {
      const fh = this.ui.fieldHeight();
      const W = G.gfx.W;
      this.fieldH = fh;
      const ne = this.enemies.length;
      this.enemies.forEach((e, i) => {
        const sw = e.sprite.width * e.scale, sh = e.sprite.height * e.scale;
        const cols = ne > 3 ? 2 : 1;
        const col = cols === 2 ? i % 2 : 0, row = cols === 2 ? Math.floor(i / 2) : i;
        const rows = Math.ceil(ne / cols);
        e.w = sw; e.h = sh;
        e.x = Math.round(W * (cols === 2 ? (col ? 0.36 : 0.16) : 0.27));
        e.y = Math.round(fh * 0.22 + ((row + 0.5) / rows) * fh * 0.62);
        if (ne === 1) e.y = Math.round(fh * 0.55);
      });
      const np = this.party.length;
      this.party.forEach((c, i) => {
        c.w = 32; c.h = 32;
        c.x = Math.round(W * 0.76 + (i % 2) * 8);
        c.y = Math.round(fh * 0.24 + ((i + 0.5) / np) * fh * 0.62);
      });
    },
    outcome() {
      if (!this.enemies.some((e) => e.alive)) return 'win';
      if (!this.party.some((c) => c.alive)) return 'lose';
      return null;
    },
    setFlow(v) {
      const before = this.st.flow;
      this.st.flow = U.clamp(Math.round(v), 0, 10);
      if (this.st.flow >= 10 && before < 10) { G.audio.sfx('bright'); this.fx.burst(G.gfx.W / 2, 12, '#ffffff', 20); }
      this.ui.refresh();
    },
    addFlow(n) { this.setFlow(this.st.flow + n); },

    chooseMove(e) {
      const mech = BOSS_MECHANICS[e.data.mechanic];
      if (mech && mech.chooseMove) return mech.chooseMove(this, e);
      return U.weighted(e.data.moves);
    },

    /* --------- damage maths --------- */
    calcPhys(a, t, mult = 1, opts = {}) {
      const hitChance = U.clamp(0.95 + (a.luk - t.luk) * 0.005 - (a.status.blind ? 0.35 : 0), 0.4, 0.99);
      if (!opts.sureHit && Math.random() > hitChance) return { miss: true };
      const critChance = 0.04 + a.luk * 0.006 + (opts.crit || 0) + (t.status.snared ? 0.1 : 0);
      const crit = Math.random() < critChance;
      let def = t.def * (t.status.exposed ? 0.6 : 1);
      let base = Math.max(a.str * 0.5, a.str * 2 - def);
      let dmg = base * U.rand(0.9, 1.1) * mult * (crit ? 1.6 : 1);
      return { dmg: this.finalDamage(a, t, dmg), crit };
    },
    calcMag(a, t, power, mult = 1) {
      let base = Math.max(power * 0.4, power + a.res * 1.6 - t.res * 0.6);
      const crit = Math.random() < a.luk * 0.003;
      const dmg = base * U.rand(0.92, 1.08) * mult * (crit ? 1.5 : 1);
      return { dmg: this.finalDamage(a, t, dmg), crit };
    },
    finalDamage(a, t, dmg) {
      if (t.status.guard) dmg *= 0.5;
      if (t.status.ward) dmg *= 0.5;
      if (t.status.unlocked && a && a.side === 'party') dmg *= 1.35;
      const mech = t.data && BOSS_MECHANICS[t.data.mechanic];
      dmg = Math.max(1, Math.round(dmg));
      if (mech && mech.modifyDamageTaken) dmg = mech.modifyDamageTaken(this, t, dmg);
      return dmg;
    },

    async applyDamage(a, t, dmg, o = {}) {
      t.hp = Math.max(0, t.hp - dmg);
      t.hitT = 300;
      this.fx.num(t.x, t.y - t.h / 2 - 4, dmg, o.crit ? '#ffe060' : t.side === 'party' ? '#ff8080' : '#ffffff');
      G.audio.sfx(o.crit ? 'crit' : t.side === 'party' ? 'hit' : 'enemyHit');
      if (o.crit) G.gfx.shake(3, 200);
      this.ui.refresh();
      if (!t.alive) await this.onDeath(t);
    },
    heal(t, amount) {
      const before = t.hp;
      t.hp = Math.min(t.maxhp, t.hp + amount);
      this.fx.num(t.x, t.y - t.h / 2 - 4, '+' + (t.hp - before), '#80ff9a');
      this.fx.rise(t.x, t.y, '#a0ffb0', 10);
      this.ui.refresh();
    },
    async onDeath(t) {
      if (t.side === 'enemy') {
        G.audio.sfx('enemyDie');
        this.fx.burst(t.x, t.y, t.data.family === 'rift' ? '#c080ff' : '#ffd080', 24);
        t.dying = true;
        await this.ui.msg(t.data.calmable ? `${t.name} falls into a peaceful sleep.` : `${t.name} is defeated!`, 650);
      } else {
        await this.ui.msg(`${t.name} falls!`, 700);
        t.status = {};
      }
    },

    async lunge(a) {
      a.lungeT = 260;
      await sleep(180);
    },

    /* --------- party actions --------- */
    async perform(actor, act) {
      const st = this.st;
      if (act.type === 'guard') {
        actor.status.guard = 1;
        G.audio.sfx('shield');
        this.addFlow(1);
        await this.ui.msg(`${actor.name} braces and gathers the Current. (+1 Flow)`, 800);
        return;
      }
      if (act.type === 'attack') {
        const t = this.retarget(act.target, 'enemies');
        const atk = actor.data.attackFlagged && st.flags[actor.data.attackFlagged.flag] ? actor.data.attackFlagged : actor.data.attack;
        await this.ui.msg(`${actor.name}: ${atk.name}!`, 350);
        await this.lunge(actor);
        this.playFx(atk.fx, actor, t);
        const r = this.calcPhys(actor, t, 1, { crit: atk.crit || 0 });
        if (r.miss) { G.audio.sfx('miss'); this.fx.num(t.x, t.y - t.h / 2, 'MISS', '#c0c0d0'); await sleep(400); }
        else await this.applyDamage(actor, t, r.dmg, { crit: r.crit });
        this.addFlow(1);
        await sleep(250);
        return;
      }
      if (act.type === 'item') {
        const it = G.data.items[act.item];
        G.game.removeItem(act.item, 1);
        await this.ui.msg(`${actor.name} uses ${it.name}.`, 500);
        const t = act.target;
        const u = it.use;
        if (u.flow) { this.addFlow(u.flow); G.audio.sfx('bright'); this.fx.burst(G.gfx.W / 2, 14, '#6ff3ff', 20); await this.ui.msg(`The Flow meter rises by ${u.flow}!`, 700); return; }
        if (u.revive) {
          if (t.alive) { await this.ui.msg('It has no effect.', 600); return; }
          t.hp = 1; this.heal(t, Math.round(t.maxhp * u.revive) - 1); G.audio.sfx('heal');
          await this.ui.msg(`${t.name} is back on their feet!`, 700); return;
        }
        if (u.heal) { this.heal(t, u.heal); G.audio.sfx('heal'); }
        if (u.mp) { t.mp = Math.min(t.maxmp, t.mp + u.mp); this.fx.num(t.x, t.y - 20, '+' + u.mp + 'MP', '#80c0ff'); G.audio.sfx('heal'); }
        if (u.cure) { for (const k of ['blind', 'snared', 'frozen', 'exposed']) delete t.status[k]; G.audio.sfx('heal'); }
        await sleep(500);
        return;
      }
      if (act.type === 'skill') return this.castSkill(actor, act.skill, act.target);
    },

    retarget(t, group) {
      if (t && t.alive) return t;
      const list = (group === 'enemies' ? this.enemies : this.party).filter((c) => c.alive);
      return list[0];
    },

    async castSkill(actor, sk, target) {
      const st = this.st;
      actor.mp -= sk.mp;
      // ---- Flow accounting ----
      let mult = 1, surge = false;
      if (st.flow >= 10 && sk.flow > 0) {
        mult = 1.25;
        this.setFlow(Math.min(6, 10 - sk.flow));
        await this.ui.msg(`BRIGHT! ${actor.name}'s ${sk.name} blazes with power!`, 600);
      } else if (st.flow >= sk.flow) {
        this.setFlow(st.flow - sk.flow);
        await this.ui.msg(`${actor.name}: ${sk.name}!`, 450);
      } else if (sk.noSurge) {
        this.setFlow(0);
        await this.ui.msg(`${actor.name}: ${sk.name}!`, 450);
      } else {
        surge = true;
        this.setFlow(0);
        await this.ui.msg(`${actor.name} overdraws the Current for ${sk.name}!`, 650);
      }
      if (sk.flow > 0) for (const e of this.enemies) { const mech = BOSS_MECHANICS[e.data.mechanic]; if (mech && mech.onFlowSpent && e.alive) await mech.onFlowSpent(this, e, sk.flow); }

      const targets = sk.target === 'enemies' ? this.enemies.filter((e) => e.alive)
        : sk.target === 'allies' ? this.party.filter((c) => c.alive)
        : sk.target === 'self' ? [actor]
        : [sk.target === 'enemy' ? this.retarget(target, 'enemies') : target];

      if (sk.kind === 'phys' || sk.kind === 'mag') await this.lunge(actor);
      for (const t of targets) {
        if (!t) continue;
        this.playFx(sk.fx, actor, t);
        G.audio.sfx(sk.sfx || 'magic');
        if (sk.kind === 'mag') {
          const r = this.calcMag(actor, t, sk.power, mult);
          await sleep(160);
          await this.applyDamage(actor, t, r.dmg, { crit: r.crit });
        } else if (sk.kind === 'phys') {
          let m = (sk.mult || 1) * mult;
          if (sk.snareBonus && t.status.snared) m *= sk.snareBonus;
          const r = this.calcPhys(actor, t, m, { sureHit: true });
          await sleep(160);
          await this.applyDamage(actor, t, r.dmg, { crit: r.crit });
        } else if (sk.kind === 'heal') {
          const amt = Math.round((sk.power + actor.res * 1.4) * U.rand(0.95, 1.05) * mult);
          if (!t.alive) { await this.ui.msg(`${t.name} can't be reached by healing.`, 600); continue; }
          this.heal(t, amt);
        } else if (sk.kind === 'status') {
          const sid = sk.status.id;
          if (t.data && t.data.immune && t.data.immune.includes(sid)) { await this.ui.msg(`${t.name} shrugs it off!`, 700); continue; }
          t.status[sid] = sk.status.turns + (sid === 'ward' ? 1 : 0);
          G.audio.sfx('status');
        }
        if (sk.special) await this.special(sk.special, actor, t);
        await sleep(120);
      }
      if (sk.kind === 'status' && targets.length) {
        const s = G.STATUSES[sk.status.id];
        await this.ui.msg(sk.target === 'allies' ? `The party is shielded by ${s.name}.` : targets.length > 1 ? `Enemies are hit by ${s.name}!` : `${targets[0].name}: ${s.name}!`, 650);
      }
      if (sk.healParty) { for (const c of this.party.filter((c) => c.alive)) this.heal(c, Math.round(c.maxhp * sk.healParty)); G.audio.sfx('heal'); }
      if (sk.selfDamage) {
        const d = Math.min(actor.hp - 1, Math.round(actor.maxhp * sk.selfDamage));
        if (d > 0) { actor.hp -= d; this.fx.num(actor.x, actor.y - 20, d, '#ff8080'); await this.ui.msg(`The crystal bites back at ${actor.name}.`, 600); }
      }
      if (surge) await this.surge();
    },

    async special(id, actor, t) {
      if (id === 'cogsLantern') {
        const quips = [
          'Cog: "It\'s ugly AND squishy. Hit the squishy bit."',
          'Cog: "Weak point located. It\'s the whole thing, honestly."',
          'Cog: "I\'m a lantern, not a miracle. But yes. There."',
          'Cog: "Oh look, a monster. My favourite. Not."',
          'Cog: "Defenses down. You\'re welcome. Tips appreciated."',
        ];
        this.fx.beam(actor.x - 10, actor.y - 10, t.x, t.y, '#ffd060');
        await this.ui.msg(`${t.name} — HP ${t.hp}/${t.maxhp}. ${t.data.desc || ''}`, 1500);
        await this.ui.msg(U.pick(quips), 1300);
      } else if (id === 'pickpocket') {
        if (t.data.steal && !t.stolen && Math.random() < 0.55 + actor.luk * 0.02) {
          t.stolen = true;
          G.game.addItem(t.data.steal, 1);
          G.audio.sfx('buy');
          await this.ui.msg(`Stole ${G.data.items[t.data.steal].name}!`, 800);
        } else {
          this.addFlow(2);
          await this.ui.msg(`Vesper skims a little Current instead. (+2 Flow)`, 800);
        }
      } else if (id === 'listen') {
        this.listened = true;
        const lines = this.enemies.filter((e) => e.alive).map((e) => `${e.name}: ${e.intent ? e.intent.name : '...'}`);
        await this.ui.msg('Hollis listens... ' + lines.join(' · '), 1600);
      } else if (id === 'voice') {
        this.setFlow(5);
        for (const e of this.enemies.filter((e) => e.alive && e.data.family === 'rift')) e.status.calmed = 1;
        await this.ui.msg('The Current settles. Rift spawn fall silent.', 1000);
      }
    },

    playFx(fx, a, t) {
      const f = this.fx;
      switch (fx) {
        case 'slash': f.slash(t.x, t.y); break;
        case 'key': f.slash(t.x, t.y, '#ffe08a'); f.burst(t.x, t.y, '#ffd060', 10); break;
        case 'bolt': f.beam(a.x - 12, a.y - 4, t.x, t.y, '#ffb050'); f.burst(t.x, t.y, '#ffb050', 8); G.audio.sfx('gadget'); break;
        case 'spark': f.beam(a.x - 12, a.y - 8, t.x, t.y, '#6ff3ff'); f.burst(t.x, t.y, '#bff8ff', 16); break;
        case 'heal': f.rise(t.x, t.y, '#ffe9a0', 14); break;
        case 'stars': f.fall(t.x, t.y, '#ffe9a0', 10); break;
        case 'light': G.gfx.flash('#ffffff', 300); f.burst(t.x, t.y, '#ffffff', 24, 2); break;
        case 'smoke': f.smoke(t.x, t.y); break;
        case 'trap': f.burst(t.x, t.y + 10, '#c0c0c0', 12); break;
        case 'ward': f.rise(t.x, t.y, '#9ae0ff', 16); break;
        case 'lantern': f.burst(t.x, t.y, '#ffd060', 14); break;
        case 'crystal': f.burst(t.x, t.y, '#b8f060', 20, 1.6); break;
        default: f.burst(t.x, t.y, '#ffffff', 10);
      }
    },

    /* --------- SURGE --------- */
    async surge() {
      G.audio.sfx('surge');
      G.gfx.shake(5, 700);
      G.gfx.flash('#c060ff', 500);
      this.surgeT = 900;
      await this.ui.msg('SURGE! The Current tears loose!', 900);
      for (const c of this.all().filter((c) => c.alive)) {
        const resist = 1 - Math.min(0.5, c.res / 80);
        const dmg = Math.max(1, Math.round(c.maxhp * 0.12 * resist * (this.listened ? 0.5 : 1)));
        this.fx.burst(c.x, c.y, '#d080ff', 10);
        await this.applyDamage(null, c, dmg, {});
        await sleep(90);
      }
      const eff = U.pick(RIFT_EFFECTS);
      await this.ui.msg(`Rift effect — ${eff.name}: ${eff.text}`, 1200);
      await eff.run(this);
      for (const e of this.enemies) { const mech = BOSS_MECHANICS[e.data.mechanic]; if (mech && mech.onSurge && e.alive) await mech.onSurge(this, e); }
      this.st.surges = (this.st.surges || 0) + 1;
    },

    /* --------- enemies --------- */
    async enemyTurn(e) {
      const mv = e.intent || this.chooseMove(e);
      const alive = this.party.filter((c) => c.alive);
      if (!alive.length) return;
      // lightly prefer wounded targets
      const pickTarget = () => (Math.random() < 0.3 ? alive.slice().sort((a, b) => a.hp / a.maxhp - b.hp / b.maxhp)[0] : U.pick(alive));
      const targets = mv.target === 'all' ? alive : [pickTarget()];
      await this.ui.msg(`${e.name}: ${mv.name}!`, 500);
      e.lungeT = 260;
      await sleep(200);
      let hitAny = false;
      for (const t of targets) {
        if (!t.alive) continue;
        if (mv.kind === 'phys') {
          const r = this.calcPhys(e, t, mv.mult || 1);
          if (r.miss) { G.audio.sfx('miss'); this.fx.num(t.x, t.y - 20, 'MISS', '#c0c0d0'); }
          else { this.fx.slash(t.x, t.y, '#ff9090'); await this.applyDamage(e, t, r.dmg, { crit: r.crit }); hitAny = true; }
        } else if (mv.kind === 'mag') {
          this.fx.burst(t.x, t.y, '#d080ff', 12);
          const r = this.calcMag(e, t, mv.power || 10, 1);
          await this.applyDamage(e, t, r.dmg, { crit: r.crit });
          hitAny = true;
        } else if (mv.kind === 'status') {
          t.status[mv.status.id] = mv.status.turns;
          G.audio.sfx('status');
          await this.ui.msg(`${t.name}: ${G.STATUSES[mv.status.id].name}!`, 600);
        }
        await sleep(110);
      }
      if (hitAny) this.addFlow(1);
      await sleep(200);
    },

    async tryFlee() {
      const avg = (l) => l.reduce((s, c) => s + c.spd, 0) / l.length;
      const p = U.clamp(0.55 + (avg(this.party.filter((c) => c.alive)) - avg(this.enemies.filter((c) => c.alive))) * 0.04, 0.25, 0.95);
      await this.ui.msg('The party tries to run...', 500);
      if (Math.random() < p) { G.audio.sfx('flee'); await this.ui.msg('Got away safely!', 600); return true; }
      await this.ui.msg('Couldn\'t escape!', 700);
      return false;
    },

    /* --------- end of battle --------- */
    async finish(out) {
      const st = this.st;
      this.active = null;
      this.ui.refresh();
      if (out === 'win') {
        G.audio.music('victory');
        const exp = this.enemies.reduce((s, e) => s + e.data.exp, 0);
        const gold = this.enemies.reduce((s, e) => s + e.data.gold, 0);
        st.gold += gold;
        const drops = [];
        for (const e of this.enemies) for (const d of e.data.drops || []) if (Math.random() < d.chance) { G.game.addItem(d.item, 1); drops.push(G.data.items[d.item].name); }
        const level = [];
        for (const c of this.party) if (c.alive) level.push(...G.game.gainExp(c.m, exp));
        // KO'd members get back up with 1 HP after a win
        for (const c of this.party) if (!c.alive) c.m.hp = 1;
        await this.ui.results({ exp, gold, drops, level });
      } else if (out === 'lose') {
        G.audio.music('gameover');
      }
      return out;
    },
  };

  /* ---------- battle transition: a swirl of light ---------- */
  function swirl() {
    return new Promise((res) => {
      const t0 = performance.now();
      const ov = document.getElementById('fade');
      ov.style.transition = 'none';
      ov.style.background = 'radial-gradient(circle, rgba(111,243,255,0.0) 0%, #0d1024 70%)';
      ov.style.pointerEvents = 'auto';
      const tick = () => {
        const k = Math.min(1, (performance.now() - t0) / 420);
        ov.style.opacity = k;
        ov.style.background = `radial-gradient(circle at 50% 45%, rgba(255,255,255,${0.6 * (1 - k)}) 0%, #0d1024 ${Math.round(80 - k * 80)}%)`;
        if (k < 1) requestAnimationFrame(tick); else { ov.style.background = '#000'; res(); }
      };
      tick();
    });
  }

  /* ---------- the battle scene: draws the field ---------- */
  G.scenes.register('battle', {
    b: null,
    enter(p) { this.b = p.b; },
    exit() {},
    update(dt) {
      const b = this.b;
      if (!b) return;
      b.t += dt;
      b.fx.update(dt);
      for (const c of b.all()) {
        if (c.hitT > 0) c.hitT -= dt;
        if (c.lungeT > 0) c.lungeT -= dt;
        if (c.dying) c.opacity = Math.max(0, c.opacity - dt / 500);
      }
      if (b.surgeT > 0) b.surgeT -= dt;
      G.input.takePresses();
    },
    render(ctx) {
      const b = this.b;
      if (!b) return;
      const W = G.gfx.W, Hh = G.gfx.H, fh = b.fieldH || Hh * 0.55;
      drawBackground(ctx, b.opts.bg || 'harbor', W, fh, b.t);
      // dim area below field
      ctx.fillStyle = '#0d1024';
      ctx.fillRect(0, fh, W, Hh - fh);
      // enemies
      for (const e of b.enemies) {
        if (e.opacity <= 0) continue;
        const bob = e.data.family === 'rift' || e.data.art === 'moth' ? Math.sin(b.t / 300 + e.x) * 2 : 0;
        const lunge = e.lungeT > 0 ? Math.sin((1 - e.lungeT / 260) * Math.PI) * 8 : 0;
        const shake = e.hitT > 0 ? U.rand(-2, 2) : 0;
        const x = Math.round(e.x - e.w / 2 + lunge + shake), y = Math.round(e.y - e.h / 2 + bob);
        ctx.globalAlpha = e.opacity;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(Math.round(e.x - e.w * 0.3), Math.round(e.y + e.h / 2 - 2), Math.round(e.w * 0.6), 3);
        ctx.drawImage(e.sprite, x, y, e.w, e.h);
        if (e.hitT > 150) { ctx.globalAlpha = 0.7 * e.opacity; ctx.drawImage(G.gfx.silhouette(e.sprite, '#ffffff'), x, y, e.w, e.h); }
        if (e.status.shell) {
          ctx.globalAlpha = 0.25 + Math.sin(b.t / 200) * 0.1;
          ctx.strokeStyle = '#9ae0ff'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(e.x, e.y, e.w * 0.6, e.h * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#6ff3ff'; ctx.globalAlpha *= 0.4; ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (e.alive) {
          // tiny HP bar
          const bw = Math.min(30, e.w);
          ctx.fillStyle = '#1a1226'; ctx.fillRect(Math.round(e.x - bw / 2) - 1, y - 5, bw + 2, 4);
          ctx.fillStyle = '#ff6a6a'; ctx.fillRect(Math.round(e.x - bw / 2), y - 4, Math.round(bw * e.hp / e.maxhp), 2);
          const tags = Object.keys(e.status).filter((k) => k !== 'shell').map((k) => G.STATUSES[k].name.slice(0, 3));
          if (tags.length) G.font.draw(ctx, tags.join(' '), Math.round(e.x - bw / 2), y - 12, '#ffe08a');
          if (b.listened && e.intent) G.font.drawCentered(ctx, e.intent.name, e.x, Math.round(e.y + e.h / 2 + 3), '#9ae0ff');
        }
        if (b.cursor === e) drawCursor(ctx, e.x, y - 14, b.t);
      }
      // party
      for (const c of b.party) {
        const lunge = c.lungeT > 0 ? -Math.sin((1 - c.lungeT / 260) * Math.PI) * 10 : 0;
        const shake = c.hitT > 0 ? U.rand(-2, 2) : 0;
        const x = Math.round(c.x - 16 + lunge + shake), y = Math.round(c.y - 16);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(c.x - 9, c.y + 13, 18, 3);
        if (!c.alive) {
          ctx.save(); ctx.translate(c.x, c.y + 8); ctx.rotate(-Math.PI / 2); ctx.globalAlpha = 0.6;
          ctx.drawImage(c.sprite.left[0], -16, -16, 32, 32); ctx.restore(); ctx.globalAlpha = 1;
          continue;
        }
        const walking = b.active === c ? Math.floor(b.t / 180) % 4 : 0;
        const img = c.sprite.left[walking];
        if (b.active === c) { ctx.fillStyle = 'rgba(255,224,138,0.25)'; ctx.fillRect(c.x - 13, c.y + 12, 26, 4); }
        ctx.drawImage(img, x, y, 32, 32);
        if (c.hitT > 150) { ctx.globalAlpha = 0.7; ctx.drawImage(G.gfx.silhouette(img, '#ff8080'), x, y, 32, 32); ctx.globalAlpha = 1; }
        if (c.status.ward || c.status.guard) {
          ctx.globalAlpha = 0.3; ctx.strokeStyle = c.status.ward ? '#9ae0ff' : '#ffe08a';
          ctx.beginPath(); ctx.arc(c.x, c.y, 19, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        }
        if (c.id === 'pip') {
          const cog = G.sprites.char('cog').down[0];
          ctx.drawImage(cog, c.x - 26, Math.round(c.y - 22 + Math.sin(b.t / 280) * 2));
        }
        if (b.cursor === c) drawCursor(ctx, c.x, y - 6, b.t);
      }
      b.fx.draw(ctx);
      if (b.surgeT > 0) {
        ctx.globalAlpha = (b.surgeT / 900) * 0.35;
        ctx.fillStyle = '#8a30d0'; ctx.fillRect(0, 0, W, fh);
        G.sky.ribbons(ctx, b.t * 3, b.surgeT / 900, 0.2);
        ctx.globalAlpha = 1;
      }
    },
  });

  function drawCursor(ctx, x, y, t) {
    const o = Math.round(Math.sin(t / 150) * 2);
    ctx.fillStyle = '#1a1226';
    ctx.fillRect(x - 4, y - 6 + o, 9, 2); ctx.fillRect(x - 3, y - 4 + o, 7, 2); ctx.fillRect(x - 2, y - 2 + o, 5, 2); ctx.fillRect(x - 1, y + o, 3, 2);
    ctx.fillStyle = '#ffe08a';
    ctx.fillRect(x - 3, y - 5 + o, 7, 1); ctx.fillRect(x - 2, y - 3 + o, 5, 1); ctx.fillRect(x - 1, y - 1 + o, 3, 1);
  }

  /* backgrounds for each region */
  const BG = {
    harbor: { sky: 'dusk', ground: '=', tint: null },
    harborDark: { sky: 'dark', ground: '=', tint: 'rgba(20,30,60,0.45)' },
    conservatory: { sky: 'night', ground: 'o', tint: null, pillars: true },
    vault: { sky: 'none', ground: 'n', tint: 'rgba(10,6,20,0.35)', shelves: true },
  };
  const groundCache = {};
  function drawBackground(ctx, id, W, fh, t) {
    const bg = BG[id] || BG.harbor;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, fh); ctx.clip();
    if (bg.sky === 'none') { ctx.fillStyle = '#120c1c'; ctx.fillRect(0, 0, W, fh); }
    else G.sky.draw(ctx, bg.sky, 0, 0, t);
    const gy = Math.round(fh * 0.45);
    const key = id + W;
    if (!groundCache[key]) {
      const rows = Math.ceil((fh - gy) / 16) + 1, cols = Math.ceil(W / 16) + 1;
      const { c, x } = G.gfx.makeCanvas(cols * 16, rows * 16);
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) G.TILES[bg.ground].paint(G.makeTileDrawer(x, q * 16, r * 16), q, r, 0);
      groundCache[key] = c;
    }
    if (bg.shelves) for (let q = 0; q < W / 16 + 1; q++) for (let r = 0; r < 3; r++) G.TILES.k.paint(G.makeTileDrawer(ctx, q * 16, gy - 48 + r * 16), q, r, 0);
    ctx.drawImage(groundCache[key], 0, gy);
    if (bg.pillars) for (let q = 0; q < 3; q++) { const px = Math.round(W * (0.1 + q * 0.4)); ctx.fillStyle = '#c8ccdc'; ctx.fillRect(px, gy - 50, 8, 52); ctx.fillStyle = '#f0d070'; ctx.fillRect(px - 1, gy - 52, 10, 3); ctx.fillStyle = '#9aa0b8'; ctx.fillRect(px + 6, gy - 50, 2, 52); }
    // horizon shadow
    const g = ctx.createLinearGradient(0, gy, 0, gy + 30);
    g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, gy, W, 30);
    if (bg.tint) { ctx.fillStyle = bg.tint; ctx.fillRect(0, 0, W, fh); }
    ctx.restore();
  }
})();
