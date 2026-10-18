/* =========================================================================
   bosses.js — the boss behaviours of Acts II-IV, registered into
   G.BOSS_MECHANICS (keyed by a mob's `mechanic`).

   Hooks (all optional, all async unless noted):
     onStart(b,e)  chooseMove(b,e) [sync]  onRoundStart(b,e)  onAfterAct(b,e,actor)
     onRoundEnd(b,e)  modifyDamageTaken(b,e,dmg) [sync]  onFlowSpent(b,e,n)
     onStatus(b,e,statusId,actor)  onSurge(b,e)
   Custom moves: { name, kind:'custom', chosen: target, run: async (b, e, targets) => {} }
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const BM = G.BOSS_MECHANICS;
  const sleep = U.sleep;
  const say = (who, t) => G.ui.say(who, t);
  const live = (b) => b.party.filter((c) => c.alive);
  const once = (b, flag) => { if (b.st.flags[flag]) return false; b.st.flags[flag] = true; return true; };
  const hasMember = (b, id) => b.party.some((c) => c.id === id && c.alive);

  /* ---------------- Drift Leviathan: a sweep every third turn ---------------- */
  BM.leviathan = {
    async onStart(b, e) {
      if (once(b, 'levTip')) {
        await say('cog', 'Bleep. It does a huge sweep every third round. Hits all of us. I counted. Twice.');
        if (hasMember(b, 'pip')) await say('pip', 'Then we interrupt it! Snare Trap, right before the third round. A snared monster loses its turn!');
      }
    },
    chooseMove(b, e) {
      const m = e.data.moves;
      if (b.round % 3 === 0) return m[2];
      return Math.random() < 0.6 ? m[0] : m[1];
    },
    async onRoundStart(b, e) {
      if (b.round % 3 === 0) {
        G.audio.sfx('alarm');
        await b.ui.msg('The Leviathan rears back. A great sweep is coming!', 1100);
      }
    },
    modifyDamageTaken(b, e, dmg) { return e.status.snared ? Math.round(dmg * 1.3) : dmg; },
  };

  /* ---------------- Idris Vane: Stillness, one of us every round ---------------- */
  BM.stillness = {
    async onStart(b, e) {
      if (once(b, 'idrisTip')) {
        await say('cog', 'Careful. He is aiming Stillness at one of us every round. Whoever it hits loses their next turn.');
        if (hasMember(b, 'pip')) await say('pip', 'Cog, shine on him! If you light him up, you can tell us who he is looking at!');
        await b.ui.tip('A warded or guarding ally ~resists~ Stillness, and *Calm Tea* wakes a frozen friend. Cog\'s Lantern reveals the target.');
      }
    },
    async onRoundStart(b, e) {
      const cands = live(b).filter((c) => !c.status.frozen);
      e.next = cands.length ? U.pick(cands) : null;
      if (e.next && b.round % 3 !== 0) {
        e.intent = {
          name: 'Still Point', kind: 'custom', chosen: e.next,
          run: async (bb, ee) => {
            const t = ee.next && ee.next.alive ? ee.next : U.pick(live(bb).filter((c) => !c.status.frozen));
            if (!t) return;
            bb.fx.ring(t.x, t.y, { r1: 28, color: '#bff8ff', dur: 360 });
            bb.fx.glow(t.x, t.y, { r: 8, r1: 30, color: '#bff8ff' });
            if (t.status.ward || t.status.guard) {
              G.audio.sfx('shield');
              await bb.ui.msg(`${t.name} holds firm against the Stillness!`, 900);
            } else {
              G.audio.sfx('status');
              t.status.frozen = 1;
              await bb.ui.msg(`${t.name} is held in Stillness!`, 900);
            }
            const r = bb.calcMag(ee, t, 14, 1);
            await bb.applyDamage(ee, t, r.dmg, { crit: r.crit });
          },
        };
        if (e.status.exposed) await b.ui.msg(`Cog: "He's looking right at ${e.next.name}."`, 1200);
      }
    },
  };

  /* ---------------- Rift Maw: a swarm that feeds itself ---------------- */
  BM.swarm = {
    async onStart(b, e) {
      for (let i = 0; i < 2; i++) b.addEnemy('riftSpawn', { suffix: ' ' + 'AB'[i] });
      for (const c of live(b)) c.status.ward = 2;
      await b.ui.msg('Wren\'s short blade flares and a shell of light settles over the party!', 1200);
      if (once(b, 'mawTip')) {
        if (hasMember(b, 'hollis')) await say('hollis', 'It is feeding on them. The spawn shelter it. Clear them away first!');
        await b.ui.tip('The Maw takes a fraction of the damage while rift spawn surround it. Defeat the ~spawn~ first.');
      }
    },
    chooseMove(b, e) {
      const m = e.data.moves, spawn = b.enemies.filter((x) => x.alive && x.data.id === 'riftSpawn');
      if (spawn.length && e.hp < e.maxhp * 0.75 && Math.random() < 0.35) {
        return {
          name: 'Devour', kind: 'custom',
          run: async (bb, ee) => {
            const s = bb.enemies.filter((x) => x.alive && x.data.id === 'riftSpawn');
            if (!s.length) return;
            const victim = U.pick(s);
            G.audio.sfx('enemyHit');
            bb.fx.spark(victim.x, victim.y, { n: 16, color: ['#c0a0ff', '#ffffff'], speed: 1.6 });
            victim.hp = 0; victim.dying = true; victim.dieT = 0;
            bb.heal(ee, Math.round(ee.maxhp * 0.06));
            await bb.ui.msg(`${ee.name} devours a rift spawn and recovers!`, 900);
          },
        };
      }
      return b.round % 3 === 0 ? m[2] : Math.random() < 0.6 ? m[0] : m[1];
    },
    modifyDamageTaken(b, e, dmg) {
      return b.enemies.some((x) => x.alive && x.data.id === 'riftSpawn') ? Math.max(1, Math.round(dmg * 0.4)) : dmg;
    },
    async onRoundEnd(b, e) {
      const spawn = b.enemies.filter((x) => x.alive && x.data.id === 'riftSpawn');
      if (b.round % 2 === 0 && spawn.length < 2) {
        G.audio.sfx('encounter');
        b.addEnemy('riftSpawn', { suffix: ' ' + 'CDEF'[(b.round / 2) % 4] });
        await b.ui.msg('The Maw gapes, and another rift spawn crawls out!', 900);
      }
    },
  };

  /* ---------------- Neve Alder: Hunger — don't feed it ---------------- */
  BM.hunger = {
    async onStart(b, e) {
      if (once(b, 'neveTip')) {
        if (hasMember(b, 'hollis')) await say('hollis', 'She is not fighting us. She is *starving*. Every scrap of Current you spend, she drinks.');
        await b.ui.tip('Neve\'s Hunger drains the ~Flow meter~ each turn, and she heals whenever you *spend* Flow on skills. Win with plain attacks and items instead.');
      }
    },
    chooseMove(b, e) { return b.round % 2 === 0 ? e.data.moves[1] : e.data.moves[0]; },
    modifyDamageTaken(b, e, dmg) { return Math.min(dmg, Math.max(0, e.hp - 1)); },
    async onFlowSpent(b, e, amount) {
      if (amount <= 0) return;
      const heal = Math.round(e.maxhp * 0.03 * amount);
      G.audio.sfx('heal');
      b.fx.rise(e.x, e.y, { color: ['#a0ffb0', '#ffffff'], n: 10 });
      b.heal(e, heal);
      await b.ui.msg('Neve drinks the Current you spent!', 700);
    },
    async onSurge(b, e) {
      b.heal(e, Math.round(e.maxhp * 0.08));
      await b.ui.msg('Neve drinks the Surge. She looks hungrier than before.', 900);
    },
    async onAfterAct(b, e, actor) {
      if (actor === e && e.alive && b.st.flow > 0) {
        const n = Math.min(b.st.flow, 2);
        b.setFlow(b.st.flow - n);
        G.audio.sfx('fizzle');
        await b.ui.msg(`Hunger gnaws at the Current. (-${n} Flow)`, 800);
      }
      if (!b.forceEnd && e.alive && e.hp <= e.maxhp * 0.3) {
        G.audio.sfx('shield');
        await b.ui.msg('Neve falters. The Hunger loosens its grip, just for a moment.', 1400);
        await say('wren', 'Neve. Stop. Please. I am not going to hurt you.');
        b.forceEnd = 'win';
      }
    },
  };

  /* ---------------- Drowned Regent: armor in layers; Unlock peels them ---------------- */
  BM.layers = {
    async onStart(b, e) {
      e.layers = 3;
      if (once(b, 'regentTip')) {
        await say('cog', 'Three layers of armor, stacked like a pie. Nothing is getting through that. Not even my sarcasm.');
        await say('wren', 'The key says it can open anything. Maybe that includes armor.');
        await b.ui.tip('Armor layers soak almost all damage. Wren\'s *Unlock* skill opens a seam each time it lands, and peels one layer away.');
      }
    },
    chooseMove(b, e) {
      const m = e.data.moves;
      if (b.round % 4 === 0) return m[1];
      return Math.random() < 0.65 ? m[0] : m[2];
    },
    modifyDamageTaken(b, e, dmg) { return e.layers > 0 ? Math.max(1, Math.round(dmg * 0.15)) : dmg; },
    async onStatus(b, e, sid) {
      if (sid !== 'unlocked' || e.layers <= 0) return;
      e.layers--;
      G.audio.sfx('crit');
      b.fx.burst(e.x, e.y, '#f0d878', 34);
      G.gfx.shake(4, 260);
      await b.ui.msg(e.layers ? `A plate of the Regent\'s armor falls away! (${e.layers} ${e.layers === 1 ? 'layer' : 'layers'} left)` : 'The last plate falls. The Regent is laid bare!', 1100);
    },
    async onRoundEnd(b, e) {
      if (e.layers > 0 && b.round >= 14 && b.round % 3 === 0) {
        e.layers--;
        await b.ui.msg('The old armor cracks under the long fight. A layer falls away!', 1000);
      }
    },
  };

  /* ---------------- Cassian: Echo — find the real one by the joke ---------------- */
  BM.echo = {
    async onStart(b, e) {
      e.real = true;
      const echoes = b.enemies.filter((x) => x.data.id === 'cassianEcho');
      echoes.forEach((x) => (x.echo = true));
      b.enemies.sort(() => Math.random() - 0.5);
      b.enemies.forEach((x, i) => (x.name = 'Cassian ' + 'ABCDE'[i]));
      b.layout();
      if (once(b, 'cassianTip')) {
        await say('cog', 'Three of him. Only one of them is *him*. I can\'t tell. My eye is a lantern, not a detective.');
        if (hasMember(b, 'hollis')) await say('hollis', 'I can hear it. Only one of them is breathing out of rhythm. Let me ~listen~.');
        await b.ui.tip('Echoes die in one hit, and then come back. Wasted blows! *Listen* (Hollis) shows each foe\'s next move, and the real Cassian\'s move has a different name.');
      }
    },
    chooseMove(b, e) {
      const m = e.data.moves;
      if (e.real) {
        if (b.round % 2 === 1) return {
          name: 'Knock knock...', kind: 'custom',
          run: async (bb, ee) => {
            await bb.ui.msg(`${ee.name}: "Knock knock."`, 1100);
            if (!bb.st.flags.cassianJoke) { bb.st.flags.cassianJoke = true; await say('wren', 'That is him. That is *him*.'); }
            else await bb.ui.msg('He waits, as if for an answer that never comes.', 800);
          },
        };
        return Object.assign({}, Math.random() < 0.7 ? m[0] : m[1], { name: Math.random() < 0.5 ? 'True Strike' : 'True Echo' });
      }
      return Math.random() < 0.7 ? m[0] : m[1];
    },
    modifyDamageTaken(b, e, dmg) { return e.echo ? Math.max(dmg, e.maxhp) : dmg; },
    async onAfterAct(b, e, actor) {
      if (!e.real) return;
      // the echoes repeat the real one's blow
      if (actor === e && e.intent && /^True/.test(e.intent.name)) {
        const echoes = b.enemies.filter((x) => x.alive && x.echo);
        for (const x of echoes) {
          const t = U.pick(live(b));
          if (!t) break;
          const r = b.calcPhys(x, t, 0.5);
          if (!r.miss) await b.applyDamage(x, t, r.dmg, {});
        }
        if (echoes.length) await b.ui.msg('The echoes repeat the blow!', 800);
      }
      if (!e.alive) {
        for (const x of b.enemies) if (x.echo && x.alive) b.removeEnemy(x, true);
        await sleep(300);
      }
    },
    async onRoundEnd(b, e) {
      const echoes = b.enemies.filter((x) => x.alive && x.echo);
      for (let n = echoes.length; n < 2; n++) {
        b.addEnemy('cassianEcho', { suffix: '' }).echo = true;
        const all = b.enemies.filter((x) => x.alive);
        all.forEach((x, i) => { if (!/^Cassian [A-E]$/.test(x.name)) x.name = 'Cassian ' + 'ABCDE'[i % 5]; });
        await b.ui.msg('Another echo steps out of the air.', 800);
      }
    },
  };

  /* ---------------- Aldrith: Archmage, Starlit, Ascended ---------------- */
  BM.archmage = {
    async onStart(b, e) {
      e.phase = 1;
      if (once(b, 'aldrithTip')) {
        await say('aldrith', 'Let us begin with the fundamentals, Wren. You always did love a lesson.');
        await b.ui.tip('Aldrith fights in ~three phases~. Watch the Flow meter: he will try to take it from you.');
      }
    },
    chooseMove(b, e) {
      const m = e.data.moves;
      if (e.phase === 1) {
        if (b.round % 3 === 0) return Object.assign({}, m[1], { target: 'all', name: 'Lecture' });
        return Math.random() < 0.7 ? m[0] : m[2];
      }
      if (e.phase === 2) {
        if (b.round % 2 === 0) return Object.assign({}, m[1], { target: 'all', name: 'Constellation', power: 40 });
        return Object.assign({}, m[0], { name: 'Starlit Bolt', power: 46 });
      }
      if (b.round % 2 === 0) return { name: 'Starfall', kind: 'mag', power: 58, target: 'all', w: 1 };
      return { name: 'Ascended Beam', kind: 'mag', power: 54, w: 1 };
    },
    async onRoundStart(b, e) {
      if (e.phase !== 2) return;
      const s = b.st.flow;
      if (s > 0) {
        b.setFlow(0);
        G.audio.sfx('fizzle');
        b.fx.glow(e.x, e.y, { r: 10, r1: 44, color: '#6ff3ff' });
        const heal = Math.round(e.maxhp * 0.012 * s);
        b.heal(e, heal);
        await b.ui.msg(`Aldrith drinks the party\'s Flow! (-${s} Flow, +${heal} HP)`, 1100);
      }
    },
    modifyDamageTaken(b, e, dmg) {
      if (e.phase !== 3) return dmg;
      if (b.curSkill && b.curSkill.id === 'foundersLight') return Math.round(dmg * 3);
      return Math.max(1, Math.round(dmg * 0.2));
    },
    async onAfterAct(b, e, actor) {
      if (!e.alive) return;
      if (e.phase === 1 && e.hp <= e.maxhp * 0.66) {
        e.phase = 2;
        G.audio.sfx('surge'); G.gfx.flash('#ffffff', 500); G.gfx.shake(5, 600);
        e.sprite = G.sprites.mob(G.data.mobs.aldrithStarlit); b.layout();
        e.name = 'Aldrith, Starlit';
        await b.ui.msg('Aldrith\'s robe unravels into starlight!', 1200);
        await say('aldrith', 'Do you feel it? The Current, wide as an ocean, and all of it listening to me.');
        await say('cog', 'He is going to take the Flow meter! Spend it before he drinks it, or there will be nothing left to spend!');
        b.setFlow(Math.min(10, b.st.flow + 2));
      } else if (e.phase === 2 && e.hp <= e.maxhp * 0.33) {
        e.phase = 3;
        G.audio.sfx('surge'); G.gfx.flash('#ffffff', 700); G.gfx.shake(6, 800);
        e.sprite = G.sprites.mob(G.data.mobs.aldrithAscended); b.layout();
        e.name = 'Aldrith, Ascended';
        e.status = {};
        await b.ui.msg('Aldrith rises, a half-god of starlight!', 1300);
        await say('aldrith', 'Ascension, Wren. No more hunger, no more fading, and no more fear. Just *light*.');
        await say('wren', 'Nothing is getting through. Nothing but the key.');
        await b.ui.tip('Ascended Aldrith shrugs off nearly all damage. Only ~Founder\'s Light~ cuts through, and it hits him for triple.');
        b.setFlow(Math.min(10, b.st.flow + 4));
      }
    },
    async onSurge(b, e) {
      b.heal(e, Math.round(e.maxhp * 0.03));
    },
  };

  /* extra forms of Aldrith (sprites only) */
  G.register('looks', 'aldrithStar', { hair: '#ffffff', skin: '#fff4e8', cloth: '#f0e8ff', accent: '#6ff3ff', white: '#ffffff', style: 'long', outfit: 'robe', extras: ['beard', 'stars'] });
  G.register('looks', 'aldrithGod', { hair: '#fff6c0', skin: '#ffffff', cloth: '#ffe890', accent: '#ffffff', white: '#ffffff', style: 'long', outfit: 'robe', extras: ['beard', 'stars'] });
  G.register('mobs', 'aldrithStarlit', { name: 'Aldrith', art: 'look:aldrithStar', upscale: 2, family: 'human', hp: 1, str: 1, def: 1, res: 1, spd: 1, exp: 0, gold: 0, moves: [] });
  G.register('mobs', 'aldrithAscended', { name: 'Aldrith', art: 'look:aldrithGod', upscale: 2, family: 'human', hp: 1, str: 1, def: 1, res: 1, spd: 1, exp: 0, gold: 0, moves: [] });
})();
