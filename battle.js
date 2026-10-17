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
  // animate o[k] to v over ms
  function tween(o, k, v, ms) {
    const from = o[k], t0 = performance.now();
    return new Promise((res) => {
      const step = () => {
        const p = Math.min(1, (performance.now() - t0) / ms);
        o[k] = from + (v - from) * p;
        if (p < 1) setTimeout(step, 16); else res();
      };
      step();
    });
  }

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

  const SPELL_COLORS = { spark: '#6ff3ff', heal: '#ffe08a', stars: '#ffe9a0', light: '#fff4c0', key: '#ffd060', lantern: '#ffd060', trap: '#d9a441', smoke: '#c8c6d4', ward: '#9ae0ff', crystal: '#b8f060' };

  /* ======================= Rift effects (Surge) ======================= */
  const RIFT_EFFECTS = [
    { name: 'Rift Bloom', text: 'Petals of light fall. The party recovers!', async run(b) { for (const c of b.party.filter((c) => c.alive)) b.heal(c, Math.round(c.maxhp * 0.15)); } },
    { name: 'Mirror Rift', text: 'The rift mirrors the pain back... the enemies recover!', async run(b) { for (const c of b.enemies.filter((c) => c.alive)) b.heal(c, Math.round(c.maxhp * 0.1)); } },
    { name: 'Static Rain', text: 'The Flow meter scrambles!', async run(b) { b.setFlow(U.randInt(1, 7)); } },
    { name: 'Starfall', text: 'A shard of sky falls!', async run(b) { const t = U.pick(b.all().filter((c) => c.alive)); if (t) await b.applyDamage(null, t, Math.round(t.maxhp * 0.15), { fx: 'stars' }); } },
    { name: 'Rift Fog', text: 'A fog of torn space blinds everyone!', async run(b) { for (const c of b.all().filter((c) => c.alive)) c.status.blind = 1; } },
  ];

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
    c.bs = G.sprites.battler(d.look, B.weaponOf(m.id));
    c.adv = 0; c.pose = null; c.hurtT = 0;
    return c;
  }
  function enemyCombatant(id, suffix) {
    const d = G.data.mobs[id];
    if (!d) throw new Error('Unknown mob ' + id);
    const c = {
      side: 'enemy', id, data: d, name: d.name + (suffix || ''), status: {}, bonus: {},
      hp: d.hp, maxhp: d.hp, mp: d.mp, maxmp: d.mp, str: d.str, def: d.def, res: d.res, luk: d.luk, spd: d.spd,
      sprite: G.sprites.mob(d), scale: 1, opacity: 1, deadT: 0, blinkT: 0,
    };
    Object.defineProperty(c, 'alive', { get() { return c.hp > 0; } });
    return c;
  }

  /* ======================= The battle ======================= */
  const B = (G.battle = {
    active: null,
    BOSS_MECHANICS, RIFT_EFFECTS,
    // which weapon each hero swings (drawn into their battle sprite)
    weaponOf(id) {
      const f = (G.game.state && G.game.state.flags) || {};
      return { wren: f.blade2 ? 'key' : 'staff', pip: 'spanner', vesper: 'dagger', hollis: 'none' }[id] || 'none';
    },

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
        opts, st, round: 0, fx: G.fx.create(), t: 0, listened: false, cursor: null,
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
            await b.stepOut(actor);
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
      const hy = G.backdrops.horizon(this.opts.bg || 'harbor', W, fh);
      this.horizon = hy;
      const floorTop = hy + 14, floorH = Math.max(40, fh - floorTop - 6);
      const ne = this.enemies.length;
      // staggered formations (x as a fraction of the width, feet as a fraction of the floor)
      const SLOTS = {
        1: [[0.33, 0.62]],
        2: [[0.22, 0.4], [0.45, 0.8]],
        3: [[0.2, 0.3], [0.46, 0.55], [0.22, 0.88]],
        4: [[0.17, 0.26], [0.44, 0.4], [0.2, 0.7], [0.47, 0.88]],
        5: [[0.16, 0.22], [0.43, 0.32], [0.17, 0.58], [0.45, 0.72], [0.22, 0.95]],
      };
      const slots = SLOTS[Math.min(5, ne)] || SLOTS[5];
      this.enemies.forEach((e, i) => {
        e.w = e.sprite.width; e.h = e.sprite.height;
        let [sx, sy] = slots[i % slots.length];
        if (e.data.boss) { sx = 0.34; sy = 0.78; }
        const feet = floorTop + sy * floorH;
        e.x = Math.round(Math.max(e.w / 2 + 2, W * sx));
        e.feet = Math.round(Math.min(fh - 4, feet));
        e.y = Math.round(e.feet - e.h / 2);
      });
      this.drawOrder = this.enemies.slice().sort((a, b) => a.feet - b.feet);
      const np = this.party.length;
      this.party.forEach((c, i) => {
        c.w = 20; c.h = 26;
        c.x = Math.round(W * 0.83 + (i % 2 ? 7 : 0) - (np < 3 ? 3 : 0));
        c.feet = Math.round(floorTop + 22 + (np > 1 ? i / (np - 1) : 0.5) * Math.min(floorH - 34, np * 30));
        c.y = c.feet - 13;
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
      if (t.side === 'party') t.hurtT = 420;
      this.fx.num(t.x, t.y - 4, dmg, o.crit ? '#ffe060' : '#ffffff', o.crit);
      G.audio.sfx(o.crit ? 'crit' : t.side === 'party' ? 'hit' : 'enemyHit');
      if (o.crit) G.gfx.shake(3, 200);
      this.ui.refresh();
      if (!t.alive) await this.onDeath(t);
    },
    heal(t, amount) {
      const before = t.hp;
      t.hp = Math.min(t.maxhp, t.hp + amount);
      this.fx.num(t.x, t.y - 4, t.hp - before, '#80ff9a');
      this.fx.rise(t.x, t.y, { color: ['#a0ffb0', '#ffffff'], n: 10, stagger: 15 });
      this.ui.refresh();
    },
    async onDeath(t) {
      if (t.side === 'enemy') {
        G.audio.sfx('enemyDie');
        t.dying = true; t.dieT = 0;
        await sleep(200);
        await this.ui.msg(t.data.calmable ? `${t.name} falls into a peaceful sleep.` : `${t.name} is defeated!`, 650);
      } else {
        await this.ui.msg(`${t.name} falls!`, 700);
        t.status = {};
      }
    },

    /* --------- choreography ---------
       heroes walk forward a few steps to act, then return; foes flash white */
    async stepIn(a, pose = 'stand') {
      if (a.side !== 'party') { a.blinkT = 300; await sleep(300); return; }
      if (a.adv < 1) { a.pose = 'walk'; await tween(a, 'adv', 1, 150); }
      a.pose = pose;
    },
    async stepOut(a) {
      if (!a || a.side !== 'party' || !a.adv) return;
      a.pose = 'walk';
      await tween(a, 'adv', 0, 150);
      a.pose = null;
    },
    async lunge(a, pose) { return this.stepIn(a, pose || 'strike'); },
    async chant(a, color) {
      if (a.side !== 'party') return this.stepIn(a);
      await this.stepIn(a, 'cast');
      a.chantT = 520; a.chantColor = color;
      this.fx.chant(a.x - 12, a.y, { color });
      G.audio.sfx('magic');
      await sleep(480);
    },

    /* --------- party actions --------- */
    async perform(actor, act) {
      const st = this.st;
      if (act.type === 'guard') {
        actor.status.guard = 1;
        actor.guardT = 500;
        G.audio.sfx('shield');
        this.addFlow(1);
        await this.ui.msg(`${actor.name} braces and gathers the Current. (+1 Flow)`, 800);
        return;
      }
      if (act.type === 'attack') {
        const t = this.retarget(act.target, 'enemies');
        const atk = actor.data.attackFlagged && st.flags[actor.data.attackFlagged.flag] ? actor.data.attackFlagged : actor.data.attack;
        await this.ui.msg(`${actor.name}: ${atk.name}!`, 350);
        await this.stepIn(actor, 'raise');
        await sleep(140);
        actor.pose = 'strike';
        await this.playFx(atk.fx, actor, t);
        const r = this.calcPhys(actor, t, 1, { crit: atk.crit || 0 });
        if (r.miss) { G.audio.sfx('miss'); this.fx.num(t.x, t.y - 4, 'Miss', '#ffffff'); await sleep(400); }
        else await this.applyDamage(actor, t, r.dmg, { crit: r.crit });
        this.addFlow(1);
        await sleep(250);
        return;
      }
      if (act.type === 'item') {
        const it = G.data.items[act.item];
        G.game.removeItem(act.item, 1);
        await this.stepIn(actor, 'cast');
        await this.ui.msg(`${actor.name} uses ${it.name}.`, 500);
        const t = act.target;
        const u = it.use;
        if (u.flow) { this.addFlow(u.flow); G.audio.sfx('bright'); this.fx.spark(actor.x, actor.y, { color: ['#6ff3ff', '#ffffff'], n: 24, speed: 1.8 }); this.fx.ring(actor.x, actor.y, { r1: 30, color: '#6ff3ff' }); await this.ui.msg(`The Flow meter rises by ${u.flow}!`, 700); return; }
        if (u.revive) {
          if (t.alive) { await this.ui.msg('It has no effect.', 600); return; }
          t.hp = 1; await this.playFx('heal', actor, t); this.heal(t, Math.round(t.maxhp * u.revive) - 1); G.audio.sfx('heal');
          await this.ui.msg(`${t.name} is back on their feet!`, 700); return;
        }
        if (u.heal || u.mp || u.cure) { this.fx.rise(t.x, t.y, { color: u.mp ? ['#80c0ff', '#ffffff'] : ['#ffe9a0', '#a0ffb0'], n: 14 }); this.fx.ring(t.x, t.y + 16, { r1: 18, sq: 0.45, color: u.mp ? '#80c0ff' : '#ffe9a0' }); }
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

      this.ui.spell(sk.name, SPELL_COLORS[sk.fx] || '#ffffff', mult > 1);
      if (sk.kind === 'phys') { await this.stepIn(actor, 'raise'); await sleep(140); actor.pose = 'strike'; }
      else await this.chant(actor, SPELL_COLORS[sk.fx] || '#ffffff');
      const multi = targets.length > 1 && (sk.kind === 'mag' || sk.kind === 'phys');
      const hits = [];
      for (let ti = 0; ti < targets.length; ti++) {
        const t = targets[ti];
        if (!t) continue;
        G.audio.sfx(sk.sfx || 'magic');
        const fxp = this.playFx(sk.fx, actor, t, { idx: ti, first: ti === 0, count: targets.length });
        if (multi) { hits.push(fxp.then(() => this.skillHit(actor, sk, t, mult))); continue; }
        await fxp;
        if (sk.kind === 'mag' || sk.kind === 'phys') {
          await this.skillHit(actor, sk, t, mult);
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
      if (hits.length) { await Promise.all(hits); await sleep(150); }
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

    async skillHit(actor, sk, t, mult) {
      if (sk.kind === 'mag') {
        const r = this.calcMag(actor, t, sk.power, mult);
        await this.applyDamage(actor, t, r.dmg, { crit: r.crit });
      } else {
        let m = (sk.mult || 1) * mult;
        if (sk.snareBonus && t.status.snared) m *= sk.snareBonus;
        const r = this.calcPhys(actor, t, m, { sureHit: true });
        await this.applyDamage(actor, t, r.dmg, { crit: r.crit });
      }
    },

    /* Spell & attack choreography. Resolves at the moment of impact. */
    async playFx(fx, a, t, o = {}) {
      const f = this.fx, sfx = G.audio.sfx;
      const dirx = a.side === 'party' ? -1 : 1;
      const ax = a.x + dirx * 12, ay = a.y - 4;
      const tx = t.x, ty = t.y;
      const feet = (c) => (c.feet || c.y + c.h / 2) - 1;
      switch (fx) {
        case 'slash':
          f.arc(tx, ty, { r: 15, color: '#ffffff', a0: -2.6, a1: 0.5, w: 4 });
          await sleep(110);
          f.spark(tx, ty, { n: 10, color: ['#ffffff', '#ffe9a0'], speed: 1.4 });
          f.ring(tx, ty, { r1: 18, dur: 260, w: 2 });
          return;
        case 'key':
          f.arc(tx, ty, { r: 19, color: '#ffd060', w: 6, dur: 300 });
          f.arc(tx, ty, { r: 12, color: '#fff0a0', a0: 0.8, a1: -2.4, dur: 320 });
          await sleep(130);
          f.glow(tx, ty, { r: 16, r1: 34, color: '#ffd060' });
          f.spark(tx, ty, { n: 22, color: ['#ffd060', '#ffffff'], speed: 2 });
          f.ring(tx, ty, { r1: 30, color: '#ffd060' });
          G.gfx.shake(3, 160);
          return;
        case 'bolt':
          f.glow(ax, ay, { r: 8, color: '#ffb050', dur: 200 });
          await f.orb(ax, ay, tx, ty, { color: '#ffb050', dur: 260, arc: 12 });
          f.spark(tx, ty, { n: 14, color: ['#ffb050', '#fff0c0'], speed: 1.6 });
          f.ring(tx, ty, { r1: 18, color: '#ffb050', dur: 260 });
          return;
        case 'spark':
          f.rune(a.x, feet(a), { color: '#6ff3ff', r: 22, dur: 1100 });
          f.glow(ax, ay, { r: 4, r1: 18, color: '#6ff3ff', dur: 520 });
          f.ring(ax, ay, { r0: 26, r1: 2, color: '#bff8ff', dur: 420 });
          f.spark(ax, ay, { n: 10, color: ['#6ff3ff', '#ffffff'], speed: 0.8, life: 400 });
          await sleep(420);
          f.bolt(ax, ay, tx, ty, { color: '#6ff3ff', w: 3, dur: 360 });
          f.beam(ax, ay, tx, ty, { color: '#6ff3ff', w: 5, dur: 260 });
          G.gfx.flash('#bff8ff', 120);
          await sleep(90);
          f.glow(tx, ty, { r: 14, r1: 36, color: '#6ff3ff' });
          f.ring(tx, ty, { r1: 36, color: '#6ff3ff' });
          f.spark(tx, ty, { n: 26, color: ['#6ff3ff', '#ffffff', '#bff8ff'], speed: 2.2 });
          G.gfx.shake(3, 220);
          return;
        case 'heal':
          f.rune(tx, feet(t), { color: '#ffe08a', r: 22, star: 6, dur: 1200 });
          f.pillar(tx, feet(t), { color: '#ffe9a0', h: 110, w: 22, dur: 1000 });
          await sleep(300);
          f.sparkles(tx, ty - 6, { color: ['#ffffff', '#c8ffd8', '#fff0a0'], n: 18, w: 12, h: 20, fall: true, stagger: 30 });
          f.ring(tx, feet(t), { r1: 24, color: '#ffe08a', sq: 0.45 });
          return;
        case 'stars':
          if (o.first) f.darken({ a: 0.5, dur: 1300 + (o.count || 1) * 150, color: '#0a0620' });
          await sleep((o.idx || 0) * 160 + 120);
          await f.star(tx + U.rand(-6, 6), ty + U.rand(-8, 4), { color: '#ffe9a0' });
          f.glow(tx, ty, { r: 10, r1: 28, color: '#ffe9a0' });
          f.spark(tx, ty, { n: 14, color: ['#ffe9a0', '#ffffff', '#b0a0ff'], speed: 1.8 });
          f.ring(tx, ty, { r1: 24, color: '#ffe9a0', dur: 320 });
          G.gfx.shake(2, 120);
          return;
        case 'light':
          f.darken({ a: 0.6, dur: 1500, color: '#000010' });
          f.rune(t.x, feet(t), { color: '#fff4c0', r: 34, star: 8, dur: 1500 });
          await sleep(300);
          G.gfx.flash('#ffffff', 450);
          f.glow(t.x, t.y, { r: 20, r1: 120, color: '#fff4c0', dur: 1000 });
          f.pillar(t.x, feet(t), { h: 200, w: 36, color: '#fff4c0', dur: 1100 });
          f.ring(t.x, t.y, { r1: 70, color: '#ffffff', w: 4, dur: 700 });
          f.spark(t.x, t.y, { n: 40, color: ['#ffffff', '#fff4c0', '#6ff3ff'], speed: 3 });
          G.gfx.shake(4, 400);
          await sleep(200);
          return;
        case 'lantern': {
          const cx = a.x - 26, cy = a.y - 18;
          f.glow(cx + 6, cy + 6, { r: 8, r1: 20, color: '#ffd060', dur: 700 });
          await sleep(150);
          f.cone(cx + 6, cy + 7, tx, ty, { color: '#ffd060', dur: 900, w: 16 });
          await sleep(320);
          f.ring(tx, ty, { r0: 26, r1: 8, color: '#fff0a0', dur: 400, w: 1 });
          f.spark(tx, ty, { n: 10, color: ['#fff0a0', '#ffffff'], speed: 0.8 });
          return;
        }
        case 'trap':
          f.gear(tx, feet(t) - 4, { dur: 800, r: 7 });
          f.arc(tx - 6, feet(t) - 6, { r: 9, color: '#c8c8d8', a0: -1.6, a1: 0.3, dur: 220 });
          f.arc(tx + 6, feet(t) - 6, { r: 9, color: '#c8c8d8', a0: -1.5, a1: -3.3, dur: 220 });
          await sleep(200);
          f.spark(tx, feet(t) - 4, { n: 14, color: ['#ffd060', '#ffffff'], speed: 1.4 });
          G.gfx.shake(2, 120);
          return;
        case 'smoke':
          f.smoke(tx, ty, { n: 18 });
          await sleep(220);
          return;
        case 'ward':
          f.shield(tx, ty, { r: 20, color: '#9ae0ff', dur: 1000 });
          f.ring(tx, ty, { r1: 28, color: '#9ae0ff' });
          f.sparkles(tx, ty, { color: ['#9ae0ff', '#ffffff'], n: 12 });
          await sleep(260);
          return;
        case 'crystal':
          f.shards(ax, ay, { n: 8 });
          f.glow(ax, ay, { r: 6, r1: 16, color: '#b8f060', dur: 300 });
          await sleep(150);
          await f.orb(ax, ay, tx, ty, { color: '#b8f060', dur: 220, arc: 6, r: 5 });
          f.shards(tx, ty, { n: 22 });
          f.glow(tx, ty, { r: 12, r1: 34, color: '#b8f060' });
          f.ring(tx, ty, { r1: 32, color: '#b8f060' });
          G.gfx.shake(4, 240);
          return;
        case 'claw':
          for (let i = 0; i < 3; i++) f.arc(tx - 5 + i * 5, ty - 2, { r: 12, color: '#ff6a6a', a0: -2.2, a1: -0.4, w: 3, dur: 220 });
          await sleep(120);
          f.spark(tx, ty, { n: 10, color: ['#ff6a6a', '#ffffff'], speed: 1.3 });
          return;
        case 'curse':
          f.glow(ax, ay, { r: 6, r1: 16, color: '#c060ff', dur: 300 });
          await sleep(120);
          await f.orb(ax, ay, tx, ty, { color: '#c060ff', dur: 300, arc: 18, r: 5 });
          f.glow(tx, ty, { r: 10, r1: 26, color: '#c060ff' });
          f.spark(tx, ty, { n: 14, color: ['#c060ff', '#ff8ae0', '#ffffff'], speed: 1.6 });
          f.ring(tx, ty, { r1: 22, color: '#c060ff' });
          return;
        default:
          f.spark(tx, ty, { n: 10 });
      }
    },

    /* --------- SURGE --------- */
    async surge() {
      G.audio.sfx('surge');
      G.gfx.shake(5, 900);
      G.gfx.flash('#c060ff', 500);
      this.surgeT = 1200;
      const W = G.gfx.W, fh = this.fieldH || G.gfx.H * 0.5;
      this.fx.darken({ a: 0.55, color: '#1a0430', dur: 1800 });
      this.fx.vortex(W / 2, fh * 0.55, { r: 70, color: '#c060ff', dur: 1600 });
      for (let i = 0; i < 5; i++) setTimeout(() => this.fx.bolt(U.rand(0, W), 0, U.rand(W * 0.2, W * 0.8), fh * U.rand(0.4, 0.8), { color: '#d080ff', dur: 260, branches: 2 }), i * 160);
      await this.ui.msg('SURGE! The Current tears loose!', 900);
      for (const c of this.all().filter((c) => c.alive)) {
        const resist = 1 - Math.min(0.5, c.res / 80);
        const dmg = Math.max(1, Math.round(c.maxhp * 0.12 * resist * (this.listened ? 0.5 : 1)));
        this.fx.spark(c.x, c.y, { color: ['#d080ff', '#ffffff'], n: 12, speed: 1.6 });
        this.fx.ring(c.x, c.y, { r1: 22, color: '#d080ff', dur: 300 });
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
      this.ui.spell(mv.name, '#ffffff', false);
      await this.stepIn(e);
      let hitAny = false;
      for (const t of targets) {
        if (!t.alive) continue;
        if (mv.kind === 'phys') {
          const r = this.calcPhys(e, t, mv.mult || 1);
          if (r.miss) { G.audio.sfx('miss'); this.fx.arc(t.x, t.y, { r: 12, color: '#a0a0b0', dur: 200 }); this.fx.num(t.x, t.y - 4, 'Miss', '#ffffff'); }
          else { await this.playFx('claw', e, t); await this.applyDamage(e, t, r.dmg, { crit: r.crit }); hitAny = true; }
        } else if (mv.kind === 'mag') {
          await this.playFx('curse', e, t);
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
        for (const c of this.party) { c.adv = 0; c.pose = c.alive ? 'victory' : null; }
        this.victory = true;
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

  /* ---------- battle transition: the screen spins apart into the fight ---------- */
  function swirl() {
    return new Promise((res) => {
      const src = G.gfx.canvas;
      const snap = G.gfx.makeCanvas(src.width, src.height);
      snap.x.drawImage(src, 0, 0);
      const ov = document.createElement('canvas');
      ov.width = src.width; ov.height = src.height;
      ov.style.cssText = `position:absolute;left:0;top:0;width:${src.style.width};height:${src.style.height};z-index:19;image-rendering:pixelated;pointer-events:none`;
      document.getElementById('game').appendChild(ov);
      const x = ov.getContext('2d'); x.imageSmoothingEnabled = false;
      const W = ov.width, Hh = ov.height, t0 = performance.now(), DUR = 560;
      const tick = () => {
        const k = Math.min(1, (performance.now() - t0) / DUR);
        x.fillStyle = '#000'; x.fillRect(0, 0, W, Hh);
        // wavy horizontal slices that twist and zoom into the centre
        x.save();
        x.translate(W / 2, Hh / 2); x.rotate(k * k * 2.2); x.scale(1 + k * 1.8, 1 + k * 1.8); x.translate(-W / 2, -Hh / 2);
        for (let y = 0; y < Hh; y += 3) {
          const off = Math.sin(y * 0.09 + k * 18) * k * W * 0.35 * (y % 6 ? 1 : -1);
          x.globalAlpha = 1 - k * 0.6;
          x.drawImage(snap.c, 0, y, W, 3, off, y, W, 3);
        }
        x.restore();
        x.globalAlpha = Math.pow(k, 3) * 0.9; x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, Hh); x.globalAlpha = 1;
        if (k < 1) requestAnimationFrame(tick);
        else {
          const f = document.getElementById('fade');
          f.style.transition = 'none'; f.style.background = '#000'; f.style.opacity = 1; f.style.pointerEvents = 'auto';
          ov.remove(); res();
        }
      };
      tick();
    });
  }

  /* ---------- the battle scene: draws the field ---------- */
  const TAU = Math.PI * 2;
  function shadow(ctx, x, y, w) {
    ctx.fillStyle = 'rgba(0,0,10,0.35)';
    const hw = Math.round(w / 2), hh = Math.max(2, Math.round(w / 8));
    for (let j = -hh; j <= hh; j++) { const ww = Math.round(hw * Math.sqrt(1 - (j / (hh + 0.5)) ** 2)); ctx.fillRect(Math.round(x) - ww, Math.round(y) + j, ww * 2, 1); }
  }
  const tmp = { c: null, x: null };
  function scratch(w, h) {
    if (!tmp.c || tmp.c.width < w || tmp.c.height < h) { const m = G.gfx.makeCanvas(Math.max(w, 96), Math.max(h, 96)); tmp.c = m.c; tmp.x = m.x; }
    tmp.x.clearRect(0, 0, tmp.c.width, tmp.c.height);
    return tmp;
  }
  // FF-style disintegration: pixels vanish in a scattered order, the rest tinted crimson-violet
  const dissolveCache = new WeakMap();
  function drawDissolve(ctx, img, x, y, p) {
    let src = dissolveCache.get(img);
    if (!src) { const m = G.gfx.makeCanvas(img.width, img.height); m.x.drawImage(img, 0, 0); src = m.x.getImageData(0, 0, img.width, img.height); dissolveCache.set(img, src); }
    const w = img.width, h = img.height, s = scratch(w, h);
    const out = s.x.createImageData(w, h);
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const i = (yy * w + xx) * 4;
      if (!src.data[i + 3]) continue;
      const order = U.hash(xx >> 1, yy >> 1, 5) * 0.75 + (yy / h) * 0.25;
      if (order < p * 1.3 - 0.15) continue;
      const tint = Math.min(1, p * 2.2);
      out.data[i] = src.data[i] + (230 - src.data[i]) * tint;
      out.data[i + 1] = src.data[i + 1] + (60 - src.data[i + 1]) * tint;
      out.data[i + 2] = src.data[i + 2] + (170 - src.data[i + 2]) * tint;
      out.data[i + 3] = 255;
    }
    s.x.putImageData(out, 0, 0);
    ctx.drawImage(s.c, 0, 0, w, h, x, y, w, h);
  }
  const silCache = new WeakMap();
  function white(img) { let c = silCache.get(img); if (!c) { c = G.gfx.silhouette(img, '#ffffff'); silCache.set(img, c); } return c; }

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
        if (c.blinkT > 0) c.blinkT -= dt;
        if (c.hurtT > 0) c.hurtT -= dt;
        if (c.guardT > 0) c.guardT -= dt;
        if (c.chantT > 0) c.chantT -= dt;
        if (c.dying) { c.dieT = (c.dieT || 0) + dt; c.opacity = c.dieT > 750 ? 0 : 1; }
      }
      if (b.surgeT > 0) b.surgeT -= dt;
      G.input.takePresses();
    },
    render(ctx) {
      const b = this.b;
      if (!b) return;
      const W = G.gfx.W, Hh = G.gfx.H, fh = b.fieldH || Hh * 0.55;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, Hh);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, fh); ctx.clip();
      G.backdrops.draw(ctx, b.opts.bg || 'harbor', W, Math.round(fh), b.t);
      b.fx.draw(ctx, 'bg');
      for (const c of b.all()) if (c.opacity !== 0 && !(c.dying && c.dieT > 200)) shadow(ctx, c.x - (c.adv || 0) * 14, c.feet + 1, c.side === 'party' ? 16 : Math.min(c.w * 0.75, 60));
      b.fx.draw(ctx, 'under');
      /* ---- enemies, back to front ---- */
      for (const e of b.drawOrder || b.enemies) {
        if (e.opacity <= 0) continue;
        const floaty = e.data.family === 'rift' || e.data.art === 'moth' || e.data.art === 'fish';
        const bob = floaty ? Math.round(Math.sin(b.t / 320 + e.x) * 2) - 3 : 0;
        const shake = e.hitT > 160 ? (Math.floor(e.hitT / 40) % 2 ? 2 : -2) : 0;
        const x = Math.round(e.x - e.w / 2 + shake), y = Math.round(e.feet - e.h + bob);
        if (e.dying) { drawDissolve(ctx, e.sprite, x, y, Math.min(1, e.dieT / 700)); continue; }
        ctx.drawImage(e.sprite, x, y);
        if (e.blinkT > 0 && Math.floor(e.blinkT / 70) % 2 === 0) ctx.drawImage(white(e.sprite), x, y);
        if (e.hitT > 220) { ctx.globalAlpha = 0.6; ctx.drawImage(white(e.sprite), x, y); ctx.globalAlpha = 1; }
        if (e.status.shell) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.22 + Math.sin(b.t / 200) * 0.08;
          ctx.strokeStyle = '#9ae0ff'; ctx.lineWidth = 1;
          for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + b.t / 1500; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * e.w * 0.55, e.y + Math.sin(a) * e.h * 0.55); ctx.stroke(); }
          ctx.beginPath(); ctx.ellipse(e.x, e.y, e.w * 0.55, e.h * 0.55, 0, 0, TAU); ctx.stroke();
          ctx.fillStyle = '#6ff3ff'; ctx.globalAlpha *= 0.3; ctx.fill();
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        }
        if (e.alive) {
          const tags = Object.keys(e.status).filter((k) => k !== 'shell').map((k) => G.STATUSES[k].name.slice(0, 3));
          if (tags.length) G.font.draw(ctx, tags.join(' '), Math.round(e.x - e.w / 2), y - 7, '#ffe08a');
          if (b.listened && e.intent) G.font.drawCentered(ctx, e.intent.name, e.x, Math.round(e.feet + 3), '#9ae0ff');
        }
      }
      /* ---- the party ---- */
      for (const c of b.party) {
        const bs = c.bs;
        let pose = c.pose;
        if (!c.alive) pose = 'dead';
        else if (b.victory) pose = Math.floor(b.t / 260) % 2 ? 'victory' : 'stand';
        else if (c.hurtT > 0) pose = 'hurt';
        else if (!pose) pose = c.guardT > 0 ? 'cast' : c.hp <= c.maxhp * 0.25 || c.status.snared ? 'kneel' : 'stand';
        if (pose === 'walk' && Math.floor(b.t / 90) % 2) pose = 'stand';
        const img = bs[pose] || bs.stand;
        const shake = c.hurtT > 250 ? (Math.floor(c.hurtT / 40) % 2 ? 2 : 0) : 0;
        const x = Math.round(c.x - 13 - (c.adv || 0) * 14 + shake), y = Math.round(c.feet - img.height + 1);
        ctx.drawImage(img, x, y);
        // casting: the hero glows in the spell's colour
        if (c.chantT > 0 && Math.floor(c.chantT / 60) % 2 === 0) {
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55;
          ctx.drawImage(G.gfx.silhouette(img, c.chantColor || '#ffffff'), x, y);
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        }
        if (c.alive && (c.status.ward || c.status.guard)) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.25 + Math.sin(b.t / 250) * 0.08;
          ctx.drawImage(G.pix.glow(c.status.ward ? '#9ae0ff' : '#ffe08a', 16), c.x - (c.adv || 0) * 14 - 16, c.y - 16);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
        if (c.id === 'pip' && c.alive) {
          const cog = G.sprites.char('cog').down[Math.floor(b.t / 900) % 4 === 3 ? 3 : 0];
          const cx = Math.round(x + 20), cy = Math.round(c.y - 26 + Math.sin(b.t / 280) * 2);
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35;
          ctx.drawImage(G.pix.glow('#ffc050', 12), cx + 6 - 12, cy + 7 - 12);
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
          ctx.drawImage(cog, cx, cy);
        }
      }
      // the glove cursor points at the chosen target
      if (b.cursor) {
        const t = b.cursor, gl = G.ui.cursorCanvas;
        const cx = Math.round(t.x - (t.adv || 0) * 14 - t.w / 2 - gl.width - 1 + (Math.floor(b.t / 250) % 2)), cy = Math.round(t.y - gl.height / 2);
        ctx.drawImage(gl, cx, cy);
      }
      b.fx.draw(ctx, 'over');
      if (b.surgeT > 0) {
        ctx.globalAlpha = (b.surgeT / 1200) * 0.3;
        ctx.fillStyle = '#8a30d0'; ctx.fillRect(0, 0, W, fh);
        G.sky.ribbons(ctx, b.t * 3, b.surgeT / 1200, 0.25);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    },
  });
})();
