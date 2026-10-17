/* =========================================================================
   data-party.js — playable characters and every skill.

   Stats: hp, mp, str, def, res (Resonance), luk, spd
   base   = level 1 values, growth = added per level (fractions accumulate)
   skills = [{ id, lvl, flag }] — learned at lvl, or when a story flag is set

   Skill fields
     mp / flow : costs. MP is personal; Flow is the party's shared Current.
                 Casting with too little Flow is an Overdraw → Surge!
     target    : enemy | enemies | ally | allies | self | allyDead
     kind      : phys (uses STR) | mag (uses RES) | heal | status | special
   ========================================================================= */
(function () {
  'use strict';
  const C = (id, def) => G.register('chars', id, def);
  const K = (id, def) => G.register('skills', id, def);

  C('wren', {
    name: 'Wren Ashgrove', short: 'Wren', role: 'Tap-Key Warrior', look: 'wren',
    base: { hp: 42, mp: 12, str: 9, def: 6, res: 8, luk: 6, spd: 8 },
    growth: { hp: 9, mp: 2.6, str: 2.1, def: 1.6, res: 1.8, luk: 0.9, spd: 1.1 },
    equip: { weapon: 'practiceStaff', armor: 'academyCloak' },
    attack: { name: 'Staff Strike', fx: 'slash' },
    attackFlagged: { flag: 'blade2', name: 'Key Strike', fx: 'key' },
    skills: [
      { id: 'sparkLance', lvl: 1 }, { id: 'lanternMend', lvl: 1 }, { id: 'starVolley', lvl: 5 },
      { id: 'tapSlash', lvl: 1, flag: 'blade2' }, { id: 'unlock', lvl: 1, flag: 'blade3' }, { id: 'foundersLight', lvl: 1, flag: 'blade4' },
    ],
    bio: 'Nineteen. Quick-witted, stubbornly loyal, jokes when scared. Adopted ward of Archmage Aldrith. Wears a plain brass pendant she has had since her tenth birthday.',
  });

  C('pip', {
    name: 'Pip Quillfeather', short: 'Pip', role: 'Tinkerer', look: 'pip',
    base: { hp: 32, mp: 16, str: 6, def: 5, res: 9, luk: 9, spd: 10 },
    growth: { hp: 7, mp: 3.4, str: 1.5, def: 1.3, res: 2, luk: 1.4, spd: 1.4 },
    equip: { weapon: 'spanner', armor: 'workApron' },
    attack: { name: 'Tinker Bolt', fx: 'bolt' },
    skills: [{ id: 'patchKit', lvl: 1 }, { id: 'cogsLantern', lvl: 1 }, { id: 'snareTrap', lvl: 4 }],
    bio: 'Tiny, fast-talking, always tinkering. Travels with Cog, a sarcastic hovering lantern built by Pip\'s lost mentor, Odalys Fenwick.',
  });

  C('vesper', {
    name: 'Vesper Nyx', short: 'Vesper', role: 'Rogue', look: 'vesper',
    base: { hp: 36, mp: 10, str: 10, def: 5, res: 5, luk: 12, spd: 13 },
    growth: { hp: 8, mp: 2, str: 2.4, def: 1.2, res: 1, luk: 2, spd: 2 },
    equip: {},
    attack: { name: 'Quick Stab', fx: 'slash', crit: 0.12 },
    skills: [{ id: 'pickpocket', lvl: 1 }, { id: 'smokeTrick', lvl: 1 }, { id: 'crystalGamble', lvl: 1 }],
    bio: 'Sly and sharp-tongued. Knows the black market for Current crystals better than anyone.',
  });

  C('hollis', {
    name: 'Brother Hollis', short: 'Hollis', role: 'Monk-Mage', look: 'hollis',
    base: { hp: 38, mp: 22, str: 5, def: 7, res: 12, luk: 7, spd: 6 },
    growth: { hp: 8, mp: 4.4, str: 1, def: 1.6, res: 2.4, luk: 1, spd: 0.9 },
    equip: {},
    attack: { name: 'Open Palm', fx: 'slash' },
    skills: [{ id: 'quietHand', lvl: 1 }, { id: 'listen', lvl: 1 }, { id: 'hushWard', lvl: 1 }, { id: 'currentsVoice', lvl: 1, flag: 'voice' }],
    bio: 'Soft-spoken healer of the Quiet Hands, sworn never to use the Current for harm. He can hear it speak.',
  });

  /* ---------------- Wren ---------------- */
  K('sparkLance', { name: 'Spark Lance', desc: 'An academy cantrip: a lance of Current at one foe.', mp: 3, flow: 2, target: 'enemy', kind: 'mag', power: 14, fx: 'spark', sfx: 'spark' });
  K('lanternMend', { name: 'Lantern Mend', desc: 'Warm light that closes wounds on one ally.', mp: 4, flow: 2, target: 'ally', kind: 'heal', power: 18, fx: 'heal', sfx: 'heal' });
  K('starVolley', { name: 'Star Volley', desc: 'A rain of tiny stars on every foe.', mp: 7, flow: 4, target: 'enemies', kind: 'mag', power: 12, fx: 'stars', sfx: 'magic' });
  K('tapSlash', { name: 'Tap Slash', desc: 'Heavy key-blade hit that also restores a little party health.', mp: 4, flow: 2, target: 'enemy', kind: 'phys', mult: 1.8, healParty: 0.1, fx: 'key', sfx: 'crit' });
  K('unlock', { name: 'Unlock', desc: 'Opens a weak point: the whole party hits harder for two turns.', mp: 5, flow: 3, target: 'enemy', kind: 'status', status: { id: 'unlocked', turns: 2 }, fx: 'key', sfx: 'shield' });
  K('foundersLight', { name: "Founder's Light", desc: 'A wide burst of pure light. Wren\'s ultimate.', mp: 14, flow: 6, target: 'enemies', kind: 'mag', power: 60, fx: 'light', sfx: 'bright' });

  /* ---------------- Pip ---------------- */
  K('patchKit', { name: 'Patch Kit', desc: 'Gauze, glue and optimism. Heals one ally.', mp: 3, flow: 2, target: 'ally', kind: 'heal', power: 22, fx: 'heal', sfx: 'gadget' });
  K('cogsLantern', { name: "Cog's Lantern", desc: 'Cog shines on a foe, revealing it and lowering its Defense.', mp: 2, flow: 1, target: 'enemy', kind: 'status', status: { id: 'exposed', turns: 3 }, special: 'cogsLantern', fx: 'lantern', sfx: 'cog' });
  K('snareTrap', { name: 'Snare Trap', desc: 'Holds an enemy in place for a turn.', mp: 4, flow: 2, target: 'enemy', kind: 'status', status: { id: 'snared', turns: 1 }, fx: 'trap', sfx: 'gadget' });

  /* ---------------- Vesper ---------------- */
  K('pickpocket', { name: 'Pickpocket', desc: 'Steals an item, or a bit of an enemy\'s Flow.', mp: 1, flow: 1, target: 'enemy', kind: 'special', special: 'pickpocket', fx: 'slash', sfx: 'buy' });
  K('smokeTrick', { name: 'Smoke Trick', desc: 'Lowers every enemy\'s accuracy for two turns.', mp: 4, flow: 2, target: 'enemies', kind: 'status', status: { id: 'blind', turns: 2 }, fx: 'smoke', sfx: 'flee' });
  K('crystalGamble', { name: 'Crystal Gamble', desc: 'Big damage — more on a snared foe — but costs her some health.', mp: 5, flow: 3, target: 'enemy', kind: 'phys', mult: 2.6, selfDamage: 0.1, snareBonus: 1.5, fx: 'crystal', sfx: 'crit' });

  /* ---------------- Hollis ---------------- */
  K('quietHand', { name: 'Quiet Hand', desc: 'Heals one ally.', mp: 4, flow: 2, target: 'ally', kind: 'heal', power: 24, fx: 'heal', sfx: 'heal' });
  K('listen', { name: 'Listen', desc: 'Hear the Current: reveals each enemy\'s next move and softens Surges this round.', mp: 2, flow: 1, target: 'self', kind: 'special', special: 'listen', fx: 'ward', sfx: 'shield' });
  K('hushWard', { name: 'Hush Ward', desc: 'Shields the whole party for a turn.', mp: 8, flow: 3, target: 'allies', kind: 'status', status: { id: 'ward', turns: 1 }, fx: 'ward', sfx: 'shield' });
  K('currentsVoice', { name: "The Current's Voice", desc: 'Calms Surges and stops rift spawn from acting. Never causes a Surge.', mp: 12, flow: 4, target: 'self', kind: 'special', special: 'voice', noSurge: true, fx: 'light', sfx: 'bright' });

  /* Status effects used in battle */
  G.STATUSES = {
    guard: { name: 'Guard', icon: '◆', good: true },
    ward: { name: 'Ward', icon: '✦', good: true },
    exposed: { name: 'Exposed', icon: '◎' },
    snared: { name: 'Snared', icon: '⌗' },
    blind: { name: 'Smoke', icon: '☁' },
    unlocked: { name: 'Unlocked', icon: '⚷' },
    calmed: { name: 'Calmed', icon: '♪' },
    frozen: { name: 'Stillness', icon: '❄' },
    shell: { name: 'Ward Shell', icon: '▣', good: true },
  };
})();
