/* =========================================================================
   data-mobs.js — every creature in Orrenth.

   Families: wildlife (Current-twisted), machine (rogue machines),
             rift (rift spawn), hollowed (Hollowed people — never plain
             enemies: defeating them leaves them asleep), human.
   moves: [{ name, kind: phys|mag|status|heal, mult|power, target: one|all, w: weight, status }]
   mechanic: a named boss behaviour implemented in battle.js (BOSS_MECHANICS)
   scale: battle sprite scale (default 2)
   ========================================================================= */
(function () {
  'use strict';
  const M = (id, def) => G.register('mobs', id, Object.assign({ mp: 0, luk: 4, scale: 2, drops: [], moves: [] }, def));

  /* ======================= ACT I ======================= */
  // Pennywhistle Harbor — rift spawn leaking from the failed station
  M('riftWisp', {
    name: 'Rift Wisp', family: 'rift', art: 'wisp', lvl: 1,
    hp: 30, str: 7, def: 3, res: 6, luk: 4, spd: 7, exp: 8, gold: 6,
    drops: [{ item: 'lanternOil', chance: 0.12 }], steal: 'lanternOil',
    moves: [{ name: 'Flicker', kind: 'phys', mult: 1, w: 3 }, { name: 'Rift Spark', kind: 'mag', power: 9, w: 1 }],
    desc: 'A tear in reality given a single, curious eye.',
  });
  M('seamCrawler', {
    name: 'Seam Crawler', family: 'rift', art: 'crawler', lvl: 2,
    hp: 44, str: 9, def: 6, res: 3, luk: 3, spd: 5, exp: 12, gold: 9,
    drops: [{ item: 'bread', chance: 0.15 }], steal: 'calmTea',
    moves: [{ name: 'Pinch', kind: 'phys', mult: 1, w: 3 }, { name: 'Seam Rend', kind: 'phys', mult: 1.4, w: 1 }],
    desc: 'It crawls along the cracks between here and somewhere else.',
  });
  M('stormmoth', {
    name: 'Stormmoth', family: 'wildlife', art: 'moth', lvl: 2,
    hp: 34, str: 8, def: 4, res: 8, luk: 8, spd: 11, exp: 11, gold: 8,
    drops: [{ item: 'calmTea', chance: 0.2 }], steal: 'flowShard',
    moves: [{ name: 'Wingbeat', kind: 'phys', mult: 1, w: 3 }, { name: 'Static Dust', kind: 'mag', power: 7, target: 'all', w: 1 }],
    desc: 'Drawn to lanterns. Lately, there are fewer lanterns.',
  });
  M('tapGuardian', {
    name: 'Runaway Tap Guardian', family: 'machine', art: 'guardian', lvl: 3, boss: true, scale: 3,
    hp: 120, str: 8, def: 5, res: 4, luk: 2, spd: 5, exp: 40, gold: 60, immune: ['snared'],
    moves: [{ name: 'Clamp', kind: 'phys', mult: 1, w: 3 }, { name: 'Steam Vent', kind: 'phys', mult: 0.7, target: 'all', w: 1 }],
    mechanic: 'guardian',
    desc: 'The station\'s maintenance automaton. Every Surge feeds it.',
  });

  // The Astral Conservatory
  M('brassSentry', {
    name: 'Brass Sentry', family: 'machine', art: 'sentry', lvl: 4,
    hp: 64, str: 12, def: 9, res: 4, luk: 5, spd: 8, exp: 22, gold: 16,
    drops: [{ item: 'lanternOil', chance: 0.2 }], steal: 'flowShard',
    moves: [{ name: 'Lance Thrust', kind: 'phys', mult: 1.1, w: 3 }, { name: 'Spark Volley', kind: 'mag', power: 10, target: 'all', w: 1 }],
    desc: 'Conservatory guard. Patrols at night. Does not appreciate students.',
  });
  M('inkSentinel', {
    name: 'Archive Sentinel', family: 'machine', art: 'golem', lvl: 5,
    pal: { S: '#6a6a7e', s: '#3a3a4e', u: '#a03ad0', U: '#f0a0ff' },
    hp: 92, str: 13, def: 12, res: 6, luk: 3, spd: 4, exp: 30, gold: 22,
    drops: [{ item: 'honeyBun', chance: 0.15 }], steal: 'starAnise',
    moves: [{ name: 'Bind', kind: 'phys', mult: 1.1, w: 3 }, { name: 'Footnote', kind: 'mag', power: 12, w: 1 }],
    desc: 'A small archive golem. Shelves books. Shelves intruders.',
  });
  M('lanternMite', {
    name: 'Lantern Mite', family: 'wildlife', art: 'moth', lvl: 4,
    pal: { a: '#9a5a1a', b: '#f0a040', c: '#fff0a0', e: '#ff4040' },
    hp: 48, str: 11, def: 6, res: 10, luk: 10, spd: 13, exp: 18, gold: 12,
    drops: [{ item: 'lanternOil', chance: 0.25 }], steal: 'lanternOil',
    moves: [{ name: 'Bite', kind: 'phys', mult: 1, w: 3 }, { name: 'Drink Light', kind: 'mag', power: 10, w: 1 }],
    desc: 'It eats lantern-light. It has been very hungry lately.',
  });
  M('archiveGolem', {
    name: 'Archive Golem', family: 'machine', art: 'golem', lvl: 7, boss: true, scale: 3,
    hp: 360, str: 15, def: 12, res: 10, luk: 4, spd: 6, exp: 160, gold: 220, immune: ['snared'],
    moves: [{ name: 'Tome Slam', kind: 'phys', mult: 1.1, w: 3 }, { name: 'Page Storm', kind: 'mag', power: 13, target: 'all', w: 1 }],
    mechanic: 'golem',
    desc: 'Guardian of the Records Vault. Its Ward Shell shatters when Flow is spent on a skill.',
  });

  /* ======================= ACT II+ (ready for expansion) ======================= */
  M('gleamfin', { name: 'Gleamfin', family: 'wildlife', art: 'fish', lvl: 7, hp: 90, str: 15, def: 9, res: 10, spd: 12, exp: 34, gold: 20, moves: [{ name: 'Fin Slice', kind: 'phys', mult: 1, w: 1 }], desc: 'Sky-fish. They glow when they are frightened.' });
  M('mistfox', { name: 'Mistfox', family: 'wildlife', art: 'fox', lvl: 8, hp: 100, str: 17, def: 10, res: 8, spd: 15, luk: 12, exp: 38, gold: 24, moves: [{ name: 'Snap', kind: 'phys', mult: 1, w: 3 }, { name: 'Fog Veil', kind: 'status', status: { id: 'blind', turns: 2 }, w: 1 }], desc: 'A cloud-fox. Half of it is mist.' });
  M('runawayGolem', { name: 'Runaway Golem', family: 'machine', art: 'golem', pal: { S: '#a0784a', s: '#6a4a2a', u: '#ff5a2a', U: '#ffd0a0' }, lvl: 9, hp: 160, str: 20, def: 16, res: 6, spd: 5, exp: 50, gold: 40, moves: [{ name: 'Haywire Swing', kind: 'phys', mult: 1.2, w: 1 }], desc: 'Haywire, not evil.' });
  M('hollowedVillager', { name: 'Hollowed Villager', family: 'hollowed', art: 'look:hollowed', lvl: 12, hp: 150, str: 18, def: 12, res: 14, spd: 6, exp: 0, gold: 0, calmable: true, moves: [{ name: 'Hum', kind: 'mag', power: 16, w: 1 }], desc: 'Pale, still, humming. Defeat leaves them asleep, not gone.' });
  M('syndicateGuard', { name: 'Syndicate Guard', family: 'human', art: 'look:dockhand', lvl: 10, hp: 170, str: 22, def: 14, res: 6, spd: 9, exp: 55, gold: 60, moves: [{ name: 'Cudgel', kind: 'phys', mult: 1, w: 1 }], desc: 'Tallow Cay muscle.' });

  // Bosses still to come (mechanics listed for future implementation)
  M('driftLeviathan', { name: 'Drift Leviathan', family: 'wildlife', art: 'fish', pal: { a: '#2a5a3a', b: '#5ab07a', c: '#d0ffd8' }, scale: 4, lvl: 9, boss: true, hp: 900, str: 22, def: 12, res: 10, spd: 7, exp: 300, gold: 300, mechanic: 'leviathan', moves: [{ name: 'Coil', kind: 'phys', mult: 1, w: 1 }] });
  M('idrisVane', { name: 'Idris Vane', family: 'human', art: 'look:idris', scale: 3, lvl: 12, boss: true, hp: 1100, str: 24, def: 16, res: 20, spd: 14, exp: 420, gold: 0, mechanic: 'stillness', moves: [{ name: 'Still Point', kind: 'mag', power: 26, w: 1 }] });
  M('riftMaw', { name: 'Rift Maw', family: 'rift', art: 'crawler', scale: 4, lvl: 15, boss: true, hp: 1500, str: 28, def: 18, res: 18, spd: 8, exp: 560, gold: 400, mechanic: 'swarm', moves: [{ name: 'Devour', kind: 'phys', mult: 1.2, w: 1 }] });
  M('neveAlder', { name: 'Neve Alder', family: 'human', art: 'look:neve', scale: 3, lvl: 18, boss: true, hp: 1600, str: 24, def: 18, res: 30, spd: 16, exp: 700, gold: 0, mechanic: 'hunger', moves: [{ name: 'Hunger', kind: 'mag', power: 30, w: 1 }] });
  M('drownedRegent', { name: 'Drowned Regent', family: 'machine', art: 'guardian', pal: { b: '#5aa08a', c: '#b0f0d0', a: '#2a6a5a', Y: '#a0fff0' }, scale: 4, lvl: 22, boss: true, hp: 2600, str: 36, def: 30, res: 20, spd: 10, exp: 1100, gold: 800, mechanic: 'layers', moves: [{ name: 'Crown Crush', kind: 'phys', mult: 1.2, w: 1 }] });
  M('cassianLorne', { name: 'Cassian Lorne', family: 'human', art: 'look:cassian', scale: 3, lvl: 24, boss: true, hp: 2400, str: 38, def: 24, res: 28, spd: 20, exp: 1400, gold: 0, mechanic: 'echo', moves: [{ name: 'Echo Strike', kind: 'phys', mult: 1, w: 1 }] });
  M('aldrithVenmoor', { name: 'Aldrith Venmoor', family: 'human', art: 'look:aldrith', scale: 3, lvl: 30, boss: true, hp: 6000, str: 44, def: 32, res: 50, spd: 18, exp: 0, gold: 0, mechanic: 'archmage', moves: [{ name: 'Starfall', kind: 'mag', power: 60, target: 'all', w: 1 }] });
})();
