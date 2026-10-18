/* =========================================================================
   data-more.js — everything Acts II-IV add to the data tables:
   people (looks, speakers), items, shops, skills, and the mobs of the Drift,
   the fringe, the sanctuary, the Sunken Crown and the Foundry.

   Mobs are generated from a level curve (G.mobBase) with per-creature
   multipliers, so a creature's strength follows from "what level it lives at".
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const SK = { light: '#f4c4a0', fair: '#f8d4bc', mid: '#d89c74', tan: '#b87a54', deep: '#8a5a3e', pale: '#cfd5e4' };
  const L = (id, def) => G.register('looks', id, def);

  /* ======================= LOOKS ======================= */
  // Hullhaven
  L('bilge', { hair: '#9a9aa4', skin: SK.tan, cloth: '#7a4430', accent: '#d9a441', hatColor: '#2a2630', outfit: 'coat', style: 'bun', extras: ['hat', 'belt'] });
  L('salvager', { hair: '#2a1a14', skin: SK.deep, cloth: '#5a6a4a', accent: '#c8a040', hatColor: '#8a6a3a', style: 'short', extras: ['goggles', 'cap', 'belt'] });
  L('fishwife', { hair: '#c07840', skin: SK.light, cloth: '#3a6a7a', style: 'bun', outfit: 'dress', extras: ['scarf', 'apron'], scarf: '#e0c050' });
  L('ropeman', { hair: '#6a6a6a', skin: SK.mid, cloth: '#8a7a5a', style: 'bald', extras: ['beard', 'belt'] });
  L('pipKin', { hair: '#ee7a30', skin: SK.fair, cloth: '#5a8aa0', style: 'spiky', extras: ['goggles'] });
  // Tallow Cay
  L('wick', { hair: '#cfcfd0', skin: SK.mid, cloth: '#3a4a30', white: '#d8d4c4', accent: '#c8a040', style: 'bald', outfit: 'coat', extras: ['beard', 'scarf'], scarf: '#b88030' });
  L('smuggler', { hair: '#1a1a22', skin: SK.mid, cloth: '#2a2a3a', hood: '#3a3a4e', accent: '#58ffaa', style: 'hood', outfit: 'coat', extras: ['scarf'], scarf: '#3a8a6a' });
  L('syndicate', { hair: '#2a1a1a', skin: SK.tan, cloth: '#22222e', accent: '#58ffaa', hatColor: '#14141c', outfit: 'coat', style: 'short', extras: ['hat', 'scarf'], scarf: '#3a8a6a' });
  L('crier', { hair: '#7a3a24', skin: SK.light, cloth: '#3460c8', accent: '#f0d070', white: '#eef0f6', style: 'ponytail', outfit: 'cloak', extras: ['stars'] });
  L('gambler', { hair: '#e8c870', skin: SK.fair, cloth: '#962e5a', accent: '#f0d070', hatColor: '#262436', outfit: 'coat', style: 'long', extras: ['hat'] });
  // Dimmerrow
  L('marn', { hair: '#a8a8b2', skin: SK.pale, cloth: '#7a7a88', pants: '#5a5a64', style: 'spiky', hollowEyes: true });
  L('hollowedScholar', { hair: '#9a9aa8', skin: SK.pale, cloth: '#5a5a70', white: '#b0b0c0', style: 'bald', outfit: 'robe', extras: ['beard'], hollowEyes: true });
  L('hollowedFerryman', { hair: '#b8b8c0', skin: SK.pale, cloth: '#5a6a6a', hatColor: '#6a6a70', style: 'short', extras: ['beard', 'cap'], hollowEyes: true });
  L('hollowedMother', { hair: '#8a8a98', skin: SK.pale, cloth: '#6a5a6a', style: 'bun', outfit: 'dress', extras: ['apron'], hollowEyes: true });
  L('pell', { hair: '#6a6a70', skin: SK.tan, cloth: '#6a6a54', accent: '#b0a070', style: 'short', extras: ['apron', 'beard'] });
  // Hushwell
  L('maribel', { hair: '#ececec', skin: SK.tan, cloth: '#8e9a86', accent: '#d0a860', style: 'bun', outfit: 'robe', extras: ['cord'], hollowEyes: true });
  L('monk', { hair: '#5a4a3a', skin: SK.mid, cloth: '#8e8e9a', accent: '#d0a860', style: 'bald', outfit: 'robe', extras: ['cord'] });
  L('sister', { hair: '#3a2a22', skin: SK.deep, cloth: '#8e9a8a', accent: '#d0a860', style: 'long', outfit: 'robe', extras: ['cord'] });
  L('gardener', { hair: '#a07a3a', skin: SK.light, cloth: '#5a8a4a', hatColor: '#d8c080', style: 'ponytail', extras: ['hat', 'apron'] });
  // Aurelith
  L('tolly', { hair: '#b08838', skin: '#c8a050', cloth: '#6a5a3a', accent: '#f0d070', white: '#d8c890', style: 'bald', outfit: 'robe', extras: ['goggles', 'cord'] });
  L('odalys', { hair: '#6a4a8a', skin: SK.mid, cloth: '#4a7a7a', accent: '#d9a441', pants: '#3a3a4a', style: 'ponytail', outfit: 'coat', extras: ['goggles', 'belt'] });
  // The Foundry
  L('foundryBot', { hair: '#3a3844', skin: '#5a586e', cloth: '#34323e', accent: '#ff8a30', style: 'bald', outfit: 'robe', extras: ['goggles'] });

  G.speakers = G.speakers || {};
  Object.assign(G.speakers, {
    bilge: { name: 'Salvage-Mother Bilge', look: 'bilge', pitch: 460 },
    wick: { name: 'Old Wick', look: 'wick', pitch: 520 },
    marn: { name: 'Marn', look: 'marn', pitch: 1200 },
    maribel: { name: 'Elder Maribel', look: 'maribel', pitch: 600 },
    tolly: { name: 'Tolly', look: 'tolly', pitch: 700 },
    odalys: { name: 'Odalys', look: 'odalys', pitch: 780 },
    pell: { name: 'Pell', look: 'pell', pitch: 500 },
    gardener: { name: 'Gardener', look: 'gardener', pitch: 800 },
    monk: { name: 'Brother', look: 'monk', pitch: 540 },
    sister: { name: 'Sister', look: 'sister', pitch: 680 },
    salvager: { name: 'Salvager', look: 'salvager', pitch: 560 },
    smuggler: { name: 'Smuggler', look: 'smuggler', pitch: 660 },
    guard: { name: 'Syndicate Guard', look: 'syndicate', pitch: 440 },
    crier: { name: 'Conservatory Crier', look: 'crier', pitch: 820 },
  });

  /* ======================= ITEMS ======================= */
  const I = (id, def) => G.register('items', id, def);
  // consumables
  I('hearthStew', { name: 'Hearth Stew', type: 'use', price: 65, target: 'ally', use: { heal: 150 }, desc: 'Salvager\'s stew in a tin. Restores 150 HP.' });
  I('royalJelly', { name: 'Royal Jelly', type: 'use', price: 170, target: 'ally', use: { heal: 400 }, desc: 'A drowned queen\'s honey, still sweet. Restores 400 HP.' });
  I('moonDew', { name: 'Moon Dew', type: 'use', price: 150, target: 'ally', use: { mp: 70 }, desc: 'Collected from the dark side of a cloud. Restores 70 MP.' });
  I('emberFeather', { name: 'Ember Feather', type: 'use', price: 160, target: 'allyDead', use: { revive: 0.6 }, desc: 'A feather that burns without burning. Revives a fallen ally with 60% HP.' });
  I('flowCrystal', { name: 'Flow Crystal', type: 'use', price: 190, target: 'none', battleOnly: true, use: { flow: 6 }, desc: 'A whole crystal of Current, cut and sold by a thief. Adds 6 to the Flow meter in battle.' });
  // weapons
  const W = (id, name, who, price, stats, desc) => I(id, { name, type: 'weapon', who: [who], price, stats, desc });
  W('wreckerSabre', 'Wrecker\'s Sabre', 'wren', 520, { str: 16, res: 3 }, 'Cut from a hull beam and honed on the dock steps.');
  W('tideglassBlade', 'Tideglass Blade', 'wren', 1000, { str: 23, res: 5 }, 'Glass drawn from a sunken lens. It never quite stops humming.');
  W('gardenersEdge', 'Gardener\'s Edge', 'wren', 1700, { str: 30, res: 8 }, 'A pruning blade, blessed by quiet hands. Cuts what needs cutting.');
  W('crownSaber', 'Crown Saber', 'wren', 0, { str: 37, res: 11 }, 'The old royal guard\'s sabre, gold under the green.');
  W('foundryBlade', 'Foundry Blade', 'wren', 0, { str: 46, res: 15 }, 'Forged the day the first tap was lit. Still warm.');
  W('ratchetRepeater', 'Ratchet Repeater', 'pip', 520, { str: 13, res: 6 }, 'Eight shots, three jams, and a lot of character.');
  W('galvanicGun', 'Galvanic Gun', 'pip', 1000, { str: 20, res: 9 }, 'Fires bolts of borrowed lightning. Return policy: none.');
  W('quietCoil', 'Quiet Coil', 'pip', 1700, { str: 27, res: 12 }, 'A coil gun that hums instead of bangs.');
  W('crownCoil', 'Crown Coil', 'pip', 0, { str: 34, res: 15 }, 'Gold-plated, salt-pitted, and still accurate.');
  W('forgeDriver', 'Forge Driver', 'pip', 0, { str: 44, res: 20 }, 'Pip says it is "basically a very polite hammer."');
  W('wreckerKnives', 'Wrecker\'s Knives', 'vesper', 500, { str: 13, luk: 3 }, 'Hull-steel, double-edged, and politely sharp.');
  W('glassFangs', 'Glass Fangs', 'vesper', 980, { str: 20, luk: 4 }, 'Black-market blades with a crystal edge.');
  W('nightsilkDirks', 'Nightsilk Dirks', 'vesper', 1650, { str: 27, luk: 5 }, 'They cut without a sound. Vesper is a little in love.');
  W('crownStilettos', 'Crown Stilettos', 'vesper', 0, { str: 35, luk: 6 }, 'A royal assassin\'s pair. The royals were not nice.');
  W('slagFangs', 'Slag Fangs', 'vesper', 0, { str: 45, luk: 8 }, 'Still cooling. Do not put in a pocket.');
  W('driftwoodRod', 'Driftwood Rod', 'hollis', 500, { str: 3, res: 11 }, 'Worn smooth by a thousand tides.');
  W('quietStaff', 'Quiet Staff', 'hollis', 1000, { str: 4, res: 16 }, 'Ash wood from the sanctuary garden.');
  W('bloomStaff', 'Bloom Staff', 'hollis', 1700, { str: 5, res: 22 }, 'Pale blossoms open along the grain when he walks.');
  W('crownScepter', 'Crown Scepter', 'hollis', 0, { str: 6, res: 28 }, 'It was a scepter once. Now it\'s a good walking stick.');
  W('founderRod', 'Founder\'s Rod', 'hollis', 0, { str: 6, res: 36 }, 'The first tap-builders carried these. It listens to him.');
  // armor
  const A = (id, name, price, stats, desc) => I(id, { name, type: 'armor', price, stats, desc });
  A('hullVest', 'Hull-plate Vest', 480, { def: 12 }, 'Three plates of ship hull, strapped on with rope.');
  A('syndicateCoat', 'Syndicate Coat', 900, { def: 16, luk: 2 }, 'Black wool, hidden pockets, mysterious stains.');
  A('quietRobe', 'Quiet Robe', 1100, { def: 15, res: 10 }, 'Grey linen, woven in the sanctuary. Soothing to wear.');
  A('tideMail', 'Tide Mail', 1800, { def: 22, res: 4 }, 'Scales from a sunken guard\'s coat of mail. Surprisingly light.');
  A('crownMail', 'Crown Mail', 0, { def: 28, res: 6 }, 'Royal green-gold chain mail. The Crown\'s last gift.');
  A('foundryPlate', 'Foundry Plate', 0, { def: 36, res: 8 }, 'Black iron with a seam of orange light.');
  // charms
  const C = (id, name, price, stats, desc) => I(id, { name, type: 'charm', price, stats, desc });
  C('rustBadge', 'Rust Badge', 150, { def: 3 }, 'A salvage-crew badge. Rust is good luck.');
  C('quickWire', 'Quick Wire', 300, { spd: 4 }, 'A thread of live copper that tingles.');
  C('emberCrystal', 'Ember Crystal', 700, { str: 5 }, 'A stolen crystal, red as a coal. Warm to hold.');
  C('tideCrystal', 'Tide Crystal', 700, { res: 6 }, 'A crystal that feels like cool water.');
  C('moonCrystal', 'Moon Crystal', 800, { luk: 8, spd: 2 }, 'A pale crystal. Gamblers swear by it.');
  C('dawnCrystal', 'Dawn Crystal', 900, { hp: 60 }, 'It holds a little morning.');
  C('sunCrystal', 'Sun Crystal', 0, { str: 6, res: 6 }, 'Gold crystal from the Crown\'s treasury.');
  C('hushBead', 'Hush Bead', 0, { res: 5, def: 2 }, 'A bead from the sanctuary. It makes noise feel further away.');
  // key items
  I('skiff', { name: "Bilge's Skiff", type: 'key', desc: 'A patched, rattling, entirely seaworthy skiff. The Drift\'s finest.' });
  I('odalysTag', { name: "Odalys's Dock Tag", type: 'key', desc: 'A brass dock tag stamped "O. FENWICK". The tide-clerk\'s tally says it was left at Tallow Cay.' });
  I('crystalSlip', { name: 'Ledger Slip', type: 'key', desc: 'Old Wick\'s ledger slip: "Green crystal, tap-grade. Sold: V. Nyx."' });
  I('heronKey', { name: "Heron's Whistle", type: 'key', desc: 'A wooden whistle on a cord. The Quiet Heron answers it.' });
  I('odalysLog', { name: "Odalys's Final Log", type: 'key', desc: 'A crystal recording. It has her voice, her handwriting, and her last warning.' });
  I('stationPart', { name: 'Coupling Sleeve', type: 'key', desc: 'A brass part salvaged from a failed tap-station. A cloud-fisher is missing this.' });
  I('lullabyBox', { name: "Marn's Music Box", type: 'key', desc: 'A tin music box. It plays three notes, then forgets the rest.' });
  I('tabletA', { name: 'Archive Tablet I', type: 'key', desc: 'A wet clay tablet from the Crown\'s archive.' });
  I('tabletB', { name: 'Archive Tablet II', type: 'key', desc: 'A wet clay tablet from the Crown\'s archive.' });
  I('tabletC', { name: 'Archive Tablet III', type: 'key', desc: 'A wet clay tablet from the Crown\'s archive.' });

  /* ======================= SHOPS ======================= */
  const SH = (id, def) => G.register('shops', id, def);
  SH('hullhavenSalvage', { name: 'The Salvage Heap', greet: 'Hull plate, rope, tin stew. If it floats, flies or fits, I sell it.', stock: ['bread', 'honeyBun', 'hearthStew', 'lanternOil', 'starAnise', 'sparkTonic', 'calmTea', 'wreckerSabre', 'ratchetRepeater', 'wreckerKnives', 'driftwoodRod', 'hullVest', 'rustBadge', 'quickWire'] });
  SH('hullhavenInn', { inn: true, name: 'The Rusty Gull', price: 35, greet: 'Hammocks, hot stew, and a wall that mostly keeps the wind out. Thirty-five gold.' });
  SH('tallowMarket', { name: 'Wick\'s Counter', greet: 'Everything legal! Everything legal *enough*. Browse.', stock: ['honeyBun', 'hearthStew', 'starAnise', 'moonDew', 'sparkTonic', 'emberFeather', 'flowShard', 'flowCrystal', 'tideglassBlade', 'galvanicGun', 'glassFangs', 'syndicateCoat', 'emberCrystal', 'tideCrystal', 'moonCrystal', 'dawnCrystal'] });
  SH('tallowInn', { inn: true, name: 'The Gilded Hook', price: 50, greet: 'A bed behind a locked door, with the key actually in the lock. Fifty gold.' });
  SH('dimmerrowStore', { name: 'Pell\'s Shelves', greet: 'Not much left on the shelves. Take what helps. Pay what you can.', stock: ['bread', 'hearthStew', 'calmTea', 'lanternOil', 'sparkTonic', 'honeyBun'] });
  SH('dimmerrowInn', { inn: true, name: 'The Tending House', price: 0, greet: 'You may rest here. Hollis would say there is no charge. I say it too.' });
  SH('hushwellStore', { name: 'Garden Stores', greet: 'Honey, herbs, and whatever the garden gave this season.', stock: ['honeyBun', 'hearthStew', 'royalJelly', 'moonDew', 'calmTea', 'emberFeather', 'gardenersEdge', 'quietCoil', 'nightsilkDirks', 'quietStaff', 'bloomStaff', 'quietRobe', 'hushBead'] });
  SH('hushwellInn', { inn: true, name: 'The Pilgrims\' Hall', price: 0, greet: 'The Quiet Hands never charge for a bed. Rest well.' });
  SH('aurelithTolly', { name: 'Tolly\'s Salvage Cart', greet: 'The Crown\'s last stock. All items catalogued. Some items catalogued incorrectly.', stock: ['royalJelly', 'moonDew', 'emberFeather', 'flowCrystal', 'hearthStew', 'tideMail', 'sparkTonic', 'calmTea'] });
  SH('heronBunk', { inn: true, name: 'The Heron\'s Bunks', price: 0, greet: 'The hull hums you a lullaby. It is a good bunk.' });
  SH('foundrySupply', { name: 'Supply Golem', greet: 'RESTOCK COMPLETE. PLEASE DO NOT TOUCH THE MOLTEN PARTS.', stock: ['royalJelly', 'moonDew', 'emberFeather', 'flowCrystal', 'calmTea', 'hearthStew', 'sparkTonic'] });
  SH('foundryRest', { inn: true, name: 'Rest Alcove', price: 0, greet: 'A ring of pale light in the dark. It feels safe here.' });

  /* ======================= SKILLS ======================= */
  const K = (id, def) => G.register('skills', id, def);
  K('stormLance', { name: 'Storm Lance', desc: 'A harder lance of Current at one foe.', mp: 6, flow: 3, target: 'enemy', kind: 'mag', power: 32, fx: 'spark', sfx: 'spark' });
  K('mendingLight', { name: 'Mending Light', desc: 'A warm glow that heals the whole party.', mp: 10, flow: 3, target: 'allies', kind: 'heal', power: 20, fx: 'heal', sfx: 'heal' });
  K('meteorVeil', { name: 'Meteor Veil', desc: 'A heavy curtain of falling stars on every foe.', mp: 15, flow: 5, target: 'enemies', kind: 'mag', power: 40, fx: 'stars', sfx: 'magic' });
  K('scrapShot', { name: 'Scrap Shot', desc: 'Pip fires whatever is in the hopper. It always hits.', mp: 4, flow: 2, target: 'enemy', kind: 'phys', mult: 2.1, fx: 'bolt', sfx: 'gadget' });
  K('fieldRepair', { name: 'Field Repair', desc: 'A cloud of glue, gauze and sparks that heals the whole party.', mp: 9, flow: 3, target: 'allies', kind: 'heal', power: 22, fx: 'heal', sfx: 'gadget' });
  K('arcStorm', { name: 'Arc Storm', desc: 'Pip overloads a coil and sprays the field with lightning.', mp: 11, flow: 4, target: 'enemies', kind: 'mag', power: 28, fx: 'spark', sfx: 'spark' });
  K('netCannon', { name: 'Net Cannon', desc: 'Snares every enemy for a turn.', mp: 12, flow: 4, target: 'enemies', kind: 'status', status: { id: 'snared', turns: 1 }, fx: 'trap', sfx: 'gadget' });
  K('bladeDance', { name: 'Blade Dance', desc: 'A flurry of cuts across every foe.', mp: 5, flow: 2, target: 'enemies', kind: 'phys', mult: 1.25, fx: 'slash', sfx: 'crit' });
  K('highRoller', { name: 'High Roller', desc: 'All in. Enormous damage, enormous bruise.', mp: 6, flow: 3, target: 'enemy', kind: 'phys', mult: 3.6, selfDamage: 0.12, snareBonus: 1.4, fx: 'crystal', sfx: 'crit' });
  K('nightfall', { name: 'Nightfall', desc: 'Vesper vanishes and the whole field is cut at once.', mp: 10, flow: 4, target: 'enemies', kind: 'phys', mult: 2.1, fx: 'claw', sfx: 'crit' });
  K('mendingChant', { name: 'Mending Chant', desc: 'A low chant that heals the whole party.', mp: 8, flow: 3, target: 'allies', kind: 'heal', power: 18, fx: 'heal', sfx: 'heal' });
  K('resonantPalm', { name: 'Resonant Palm', desc: 'A single open palm, and the Current answers. His first strike in anger.', mp: 6, flow: 2, target: 'enemy', kind: 'mag', power: 30, fx: 'light', sfx: 'bright' });
  K('sanctuary', { name: 'Sanctuary', desc: 'A long, steady ward over the whole party.', mp: 14, flow: 4, target: 'allies', kind: 'status', status: { id: 'ward', turns: 2 }, fx: 'ward', sfx: 'shield' });
  K('gentleReturn', { name: 'Gentle Return', desc: 'Calls a fallen friend back from the quiet.', mp: 16, flow: 4, target: 'allyDead', kind: 'heal', power: 0, revive: 0.5, fx: 'heal', sfx: 'heal' });

  const addSkills = (id, list) => { const sk = G.data.chars[id].skills; for (const s of list) if (!sk.find((x) => x.id === s.id)) sk.push(s); };
  addSkills('wren', [{ id: 'stormLance', lvl: 9 }, { id: 'mendingLight', lvl: 12 }, { id: 'meteorVeil', lvl: 19 }]);
  addSkills('pip', [{ id: 'scrapShot', lvl: 7 }, { id: 'fieldRepair', lvl: 10 }, { id: 'arcStorm', lvl: 14 }, { id: 'netCannon', lvl: 18 }]);
  addSkills('vesper', [{ id: 'bladeDance', lvl: 8 }, { id: 'highRoller', lvl: 13 }, { id: 'nightfall', lvl: 20 }]);
  addSkills('hollis', [{ id: 'mendingChant', lvl: 7 }, { id: 'resonantPalm', lvl: 1, flag: 'resolve' }, { id: 'sanctuary', lvl: 12 }, { id: 'gentleReturn', lvl: 16 }]);

  /* ======================= MOBS ======================= */
  // The level curve: what a "typical" creature of that level looks like.
  G.mobBase = (lv) => ({
    hp: Math.round(12 * lv + 10),
    str: Math.round(6 + 1.3 * lv + 0.03 * lv * lv),
    def: Math.round(3 + 1.1 * lv),
    res: Math.round(3 + 0.9 * lv),
    spd: Math.round(4 + 0.45 * lv),
    exp: Math.floor((18 * Math.pow(lv, 1.55) + 6) / 9),
    gold: Math.round(4 + 2.2 * lv),
  });
  /* X(id, level, def) — def may carry multipliers: hpx strx defx resx spdx expx goldx */
  const X = (id, lv, d) => {
    const b = G.mobBase(lv), r = Math.round, m = (v) => (v == null ? 1 : v);
    const out = Object.assign({ mp: 0, luk: 5, drops: [], moves: [] }, d);
    out.lvl = lv;
    out.hp = r(b.hp * m(d.hpx)); out.str = r(b.str * m(d.strx)); out.def = r(b.def * m(d.defx));
    out.res = r(b.res * m(d.resx)); out.spd = r(b.spd * m(d.spdx));
    out.exp = d.boss ? r((18 * Math.pow(lv, 1.55) + 6) * m(d.expx)) : r(b.exp * m(d.expx));
    out.gold = r(b.gold * m(d.goldx));
    for (const k of ['hpx', 'strx', 'defx', 'resx', 'spdx', 'expx', 'goldx']) delete out[k];
    return G.register('mobs', id, out);
  };
  const hit = (name, mult = 1, w = 3) => ({ name, kind: 'phys', mult, w });
  const spell = (name, power, w = 1, all) => Object.assign({ name, kind: 'mag', power, w }, all ? { target: 'all' } : {});
  const fog = (name = 'Fog Veil') => ({ name, kind: 'status', status: { id: 'blind', turns: 2 }, w: 1 });

  /* ---- Hullhaven (Drift, levels 6-9): wildlife and machines ---- */
  X('gleamfin', 7, { name: 'Gleamfin', family: 'wildlife', art: 'fish', size: 44, hpx: 0.9, strx: 1, spdx: 1.3, steal: 'lanternOil', drops: [{ item: 'lanternOil', chance: 0.18 }], moves: [hit('Fin Slice'), spell('Glow Flash', 12)], desc: 'A sky-fish. It glows when it is frightened.' });
  X('mistfox', 8, { name: 'Mistfox', family: 'wildlife', art: 'fox', hpx: 0.95, spdx: 1.3, luk: 12, steal: 'calmTea', drops: [{ item: 'calmTea', chance: 0.2 }], moves: [hit('Snap'), fog()], desc: 'A cloud-fox. Half of it is mist.' });
  X('runawayGolem', 9, { name: 'Runaway Golem', family: 'machine', art: 'golem', pal: { stone: '#a0784a', rune: '#ff6a2a' }, size: 60, hpx: 1.5, defx: 1.2, spdx: 0.6, steal: 'sparkTonic', drops: [{ item: 'hearthStew', chance: 0.2 }], moves: [hit('Haywire Swing', 1.2), spell('Spark Volley', 14, 1, true)], desc: 'Haywire, not evil.', immune: ['snared'] });
  X('rustCrawler', 7, { name: 'Rust Crawler', family: 'machine', art: 'crawler', pal: { body: '#8a5a30', seam: '#ffb030', leg: '#4a3018', eye: '#ff4020' }, hpx: 1.1, defx: 1.2, spdx: 0.8, steal: 'bread', drops: [{ item: 'bread', chance: 0.2 }], moves: [hit('Pinch'), hit('Hull Rend', 1.4, 1)], desc: 'Eats the same rust it hides in.' });
  X('scrapSentry', 8, { name: 'Scrap Sentry', family: 'machine', art: 'sentry', pal: { brass: '#8a6a40', iron: '#5a5048', visor: '#ff8a30', plume: '#6a3a28' }, hpx: 1.1, steal: 'flowShard', drops: [{ item: 'lanternOil', chance: 0.2 }], moves: [hit('Lance Thrust', 1.1), spell('Spark Volley', 12, 1, true)], desc: 'A sentry rebuilt from three wrecks. It does not know who it guards.' });
  X('mistEel', 6, { name: 'Mist Eel', family: 'wildlife', art: 'fish', pal: { body: '#3a8a6a', belly: '#d0ffe0', fin: '#6ad0a0' }, size: 40, hpx: 0.8, spdx: 1.2, steal: 'calmTea', drops: [{ item: 'calmTea', chance: 0.2 }], moves: [hit('Bite'), hit('Coil', 0.9)], desc: 'A small cousin of something very much bigger.' });
  X('wreckMoth', 6, { name: 'Wreck Moth', family: 'wildlife', art: 'moth', pal: { wing: '#a08060', wing2: '#6a4e38', body: '#e0d0b0', spot: '#ff8a30', eye: '#ffe040' }, hpx: 0.8, spdx: 1.4, steal: 'lanternOil', drops: [{ item: 'lanternOil', chance: 0.2 }], moves: [hit('Wingbeat'), spell('Rust Dust', 9, 1, true)], desc: 'It nests in the dead engines. Don\'t knock.' });

  /* ---- Tallow Cay (Drift, levels 9-12): machines, rift spawn, syndicate ---- */
  X('syndicateGuard', 10, { name: 'Syndicate Guard', family: 'human', art: 'look:syndicate', hpx: 1.25, strx: 1.1, steal: 'sparkTonic', drops: [{ item: 'hearthStew', chance: 0.2 }], goldx: 1.6, moves: [hit('Cudgel'), hit('Dirty Trick', 1.3, 1), fog('Pocket Sand')], desc: 'Tallow Cay muscle. The Syndicate pays on time.' });
  X('chainSentry', 10, { name: 'Chain Sentry', family: 'machine', art: 'sentry', pal: { brass: '#4a5a4a', iron: '#2e3a34', visor: '#58ffaa', plume: '#1a4a34', lance: '#a8c8b8' }, defx: 1.15, steal: 'moonDew', drops: [{ item: 'lanternOil', chance: 0.25 }], moves: [hit('Chain Lash', 1.1), spell('Crystal Pulse', 15, 1, true)], desc: 'A market guardbot running on stolen crystal. It knows nothing about shoplifting.' });
  X('greenWisp', 9, { name: 'Glint Wisp', family: 'rift', art: 'wisp', pal: { body: '#1a9a6a', core: '#bfffd8', iris: '#ffe040', shard: '#58ffaa' }, hpx: 0.9, spdx: 1.2, drops: [{ item: 'lanternOil', chance: 0.2 }], steal: 'flowShard', moves: [hit('Flicker'), spell('Rift Spark', 15)], desc: 'A rift spawn drawn to crystal like a moth to a stolen lamp.' });
  X('craneGolem', 11, { name: 'Crane Golem', family: 'machine', art: 'golem', pal: { stone: '#7a5a3a', rune: '#58ffaa' }, size: 60, hpx: 1.6, defx: 1.2, spdx: 0.55, steal: 'hearthStew', drops: [{ item: 'hearthStew', chance: 0.25 }], moves: [hit('Crane Drop', 1.4), spell('Cable Whip', 16, 1, true)], desc: 'A loading golem that stopped taking orders. It still loads. Everything.', immune: ['snared'] });
  X('alleyFox', 10, { name: 'Alley Fox', family: 'wildlife', art: 'fox', pal: { body: '#585870', mist: '#2a2a40', eye: '#58ffaa' }, hpx: 0.9, spdx: 1.3, luk: 14, steal: 'moonDew', drops: [{ item: 'calmTea', chance: 0.2 }], moves: [hit('Snap'), fog('Smoke Pelt')], desc: 'A thief by instinct. It ate the last stall-keeper\'s lunch.' });

  /* ---- Dimmerrow (fringe, levels 12-15): the Hollowed and rift spawn ---- */
  X('hollowedVillager', 12, { name: 'Hollowed Villager', family: 'hollowed', art: 'look:hollowed', calmable: true, hpx: 1.1, strx: 0.8, defx: 0.8, spdx: 0.6, expx: 1, goldx: 0, moves: [spell('Hum', 18), hit('Stumble', 0.8, 1)], desc: 'Pale, still, and humming. Defeating them leaves them asleep, not gone.' });
  X('hollowedScholar', 13, { name: 'Hollowed Scholar', family: 'hollowed', art: 'look:hollowedScholar', calmable: true, hpx: 1.0, strx: 0.7, resx: 1.5, spdx: 0.6, goldx: 0, moves: [spell('Faded Verse', 22), spell('Hum', 18)], desc: 'He keeps reciting a lecture whose subject he has lost.' });
  X('hollowedFerryman', 13, { name: 'Hollowed Ferryman', family: 'hollowed', art: 'look:hollowedFerryman', calmable: true, hpx: 1.2, strx: 0.9, spdx: 0.6, goldx: 0, moves: [hit('Oar Swing', 0.9), spell('Hum', 18)], desc: 'He walks to the dock every morning. There is no ferry.' });
  X('greySeam', 13, { name: 'Grey Seam', family: 'rift', art: 'crawler', pal: { body: '#5a5a66', seam: '#e0e0f0', leg: '#34343e', eye: '#ffffff' }, hpx: 1.05, steal: 'calmTea', drops: [{ item: 'calmTea', chance: 0.2 }], moves: [hit('Pinch'), hit('Seam Rend', 1.4, 1), fog('Grey Veil')], desc: 'A tear in the grey. It doesn\'t drift through the island so much as hum through it.' });
  X('ashWisp', 12, { name: 'Ash Wisp', family: 'rift', art: 'wisp', pal: { body: '#6a6a7a', core: '#e0e0f0', iris: '#ffa850', shard: '#b0b0c0' }, hpx: 0.9, spdx: 1.2, steal: 'lanternOil', drops: [{ item: 'lanternOil', chance: 0.22 }], moves: [hit('Flicker'), spell('Ash Spark', 18)], desc: 'It follows the last warm place on the island.' });
  X('emberMoth', 13, { name: 'Ember Moth', family: 'wildlife', art: 'moth', pal: { wing: '#c86a2a', wing2: '#7a3a1a', body: '#ffe0b0', spot: '#ffd040', eye: '#ff4040' }, hpx: 0.9, spdx: 1.4, steal: 'honeyBun', drops: [{ item: 'honeyBun', chance: 0.2 }], moves: [hit('Wingbeat'), spell('Cinder Dust', 14, 1, true)], desc: 'The only bright thing left on Dimmerrow. It is very protective of that.' });

  /* ---- Hushwell (levels 15-18): a few wanderers ---- */
  X('thornFox', 15, { name: 'Thorn Fox', family: 'wildlife', art: 'fox', pal: { body: '#a8d0a0', mist: '#5a8a6a', eye: '#ffe040' }, hpx: 1.0, spdx: 1.3, luk: 12, steal: 'moonDew', drops: [{ item: 'honeyBun', chance: 0.25 }], moves: [hit('Snap'), fog('Pollen Veil')], desc: 'Drawn here by the last strong Current in the Isles. Hungry, not wicked.' });
  X('bloomMoth', 15, { name: 'Bloom Moth', family: 'wildlife', art: 'moth', pal: { wing: '#e088a8', wing2: '#a85a78', body: '#fff0e0', spot: '#ffe060', eye: '#6a2a4a' }, hpx: 0.9, spdx: 1.4, steal: 'starAnise', drops: [{ item: 'moonDew', chance: 0.12 }], moves: [hit('Wingbeat'), spell('Pollen Burst', 17, 1, true)], desc: 'It has been drinking too deeply from the pools.' });
  X('gardenWarden', 16, { name: 'Garden Warden', family: 'machine', art: 'golem', pal: { stone: '#6a8a62', rune: '#d8ffa0' }, size: 56, hpx: 1.5, defx: 1.15, spdx: 0.6, steal: 'royalJelly', drops: [{ item: 'hearthStew', chance: 0.3 }], moves: [hit('Trowel Slam', 1.3), spell('Seed Barrage', 18, 1, true)], desc: 'A gardening automaton. Neve\'s draining confused its priorities.', immune: ['snared'] });

  /* ---- Aurelith (Drift, levels 18-22): rift, machines, wildlife ---- */
  X('tideWisp', 19, { name: 'Tide Wisp', family: 'rift', art: 'wisp', pal: { body: '#1a8a9a', core: '#c0fff0', iris: '#ffe080', shard: '#58e0d0' }, hpx: 0.9, spdx: 1.2, steal: 'moonDew', drops: [{ item: 'moonDew', chance: 0.12 }], moves: [hit('Flicker'), spell('Drowning Spark', 24)], desc: 'A rift spawn made of the Crown\'s own memory of water.' });
  X('crownSentry', 20, { name: 'Crown Sentry', family: 'machine', art: 'sentry', pal: { brass: '#c8a840', iron: '#2e6a70', visor: '#a0fff0', plume: '#3a8a84', lance: '#f0e8c0' }, hpx: 1.15, defx: 1.15, steal: 'royalJelly', drops: [{ item: 'hearthStew', chance: 0.2 }], goldx: 1.4, moves: [hit('Royal Thrust', 1.2), spell('Crown Volley', 22, 1, true)], desc: 'The royal guard never stopped guarding, even after there was nothing left.' });
  X('sunkenGolem', 21, { name: 'Sunken Golem', family: 'machine', art: 'golem', pal: { stone: '#4a8a8a', rune: '#f0d878' }, size: 62, hpx: 1.7, defx: 1.2, spdx: 0.55, steal: 'royalJelly', drops: [{ item: 'royalJelly', chance: 0.12 }], moves: [hit('Crown Crush', 1.4), spell('Tidal Wave', 22, 1, true)], desc: 'Carved to hold up a dome. It is still trying.', immune: ['snared'] });
  X('abyssFin', 20, { name: 'Abyss Fin', family: 'wildlife', art: 'fish', pal: { body: '#1a3a6a', belly: '#a0e0f0', fin: '#3a8ad0' }, size: 50, hpx: 1.0, strx: 1.1, spdx: 1.3, steal: 'moonDew', drops: [{ item: 'moonDew', chance: 0.12 }], moves: [hit('Fin Slice'), spell('Pressure Wave', 20, 1, true)], desc: 'A deep-water fish forced upward when the Crown sank.' });

  /* ---- The Foundry (levels 22-29): machines, rift, the strongest wildlife ---- */
  X('foundryGuardian', 23, { name: 'Foundry Guardian', family: 'machine', art: 'guardian', pal: { brass: '#5a586e', lens: '#ff8a30', core: '#ffd060', iron: '#2a2832', pipe: '#8a3a1a' }, size: 54, hpx: 1.6, defx: 1.2, spdx: 0.8, steal: 'flowCrystal', drops: [{ item: 'royalJelly', chance: 0.12 }], goldx: 1.4, moves: [hit('Clamp', 1.2), spell('Steam Vent', 24, 1, true)], desc: 'The first tap-guardian. Older than every language still spoken.' });
  X('slagGolem', 25, { name: 'Slag Golem', family: 'machine', art: 'golem', pal: { stone: '#4a3c3c', rune: '#ff8a30' }, size: 66, hpx: 1.8, defx: 1.25, spdx: 0.55, steal: 'royalJelly', drops: [{ item: 'royalJelly', chance: 0.15 }], goldx: 1.4, moves: [hit('Molten Slam', 1.5), spell('Slag Spray', 26, 1, true)], desc: 'It cooled into shape and woke up angry about it.', immune: ['snared'] });
  X('furnaceSentry', 24, { name: 'Furnace Sentry', family: 'machine', art: 'sentry', pal: { brass: '#8a4a2a', iron: '#2a2832', visor: '#ffb040', plume: '#ff5a20', lance: '#ffd8a0' }, hpx: 1.2, defx: 1.1, steal: 'moonDew', drops: [{ item: 'hearthStew', chance: 0.2 }], goldx: 1.4, moves: [hit('Flame Lance', 1.3), spell('Cinder Volley', 26, 1, true)], desc: 'A sentry lit from the inside. The lights are not on for you.' });
  X('voidWisp', 24, { name: 'Void Wisp', family: 'rift', art: 'wisp', pal: { body: '#1a1030', core: '#c8b0ff', iris: '#ffffff', shard: '#6a4ac8' }, hpx: 0.95, spdx: 1.2, steal: 'flowCrystal', drops: [{ item: 'moonDew', chance: 0.15 }], moves: [hit('Flicker'), spell('Void Spark', 30), fog('Dark Veil')], desc: 'A rift spawn so deep it has forgotten there is a sky.' });
  X('abyssCrawler', 26, { name: 'Abyss Crawler', family: 'rift', art: 'crawler', pal: { body: '#241040', seam: '#c8b0ff', leg: '#140a24', eye: '#ffffff' }, hpx: 1.2, defx: 1.1, steal: 'flowCrystal', drops: [{ item: 'royalJelly', chance: 0.1 }], moves: [hit('Pinch'), hit('Seam Rend', 1.5, 1), spell('Void Pulse', 28, 1, true)], desc: 'It lives in the cracks between the first tap and the deep.' });
  X('forgeWyrm', 27, { name: 'Forge Wyrm', family: 'wildlife', art: 'fish', pal: { body: '#c0501a', belly: '#ffd8a0', fin: '#ff9a30' }, size: 60, hpx: 1.5, strx: 1.2, spdx: 1.1, steal: 'royalJelly', drops: [{ item: 'royalJelly', chance: 0.15 }], goldx: 1.5, moves: [hit('Fire Coil', 1.3), spell('Ember Breath', 28, 1, true)], desc: 'The strongest wildlife in the world, swimming in the oldest furnace.' });
  X('cinderMoth', 24, { name: 'Cinder Moth', family: 'wildlife', art: 'moth', pal: { wing: '#3a3040', wing2: '#1a1420', body: '#ffd0a0', spot: '#ff8a30', eye: '#ffe040' }, hpx: 0.95, spdx: 1.4, steal: 'moonDew', drops: [{ item: 'moonDew', chance: 0.12 }], moves: [hit('Wingbeat'), spell('Cinder Dust', 24, 1, true)], desc: 'It flies through the furnace halls like a spark that learned to be afraid.' });

  /* ---- bosses ---- */
  const bossHp = (lv, k) => Math.round((12 * lv + 10) * k);
  X('driftLeviathan', 9, { name: 'Drift Leviathan', family: 'wildlife', art: 'fish', pal: { body: '#2a7a5a', belly: '#d0ffd8', fin: '#6ad0a0' }, size: 64, boss: true, hpx: 8, strx: 1.05, defx: 1, spdx: 0.9, expx: 0.75, goldx: 6, mechanic: 'leviathan', immune: [], moves: [hit('Coil', 1.0, 3), hit('Bite', 1.3, 2), { name: 'Tail Sweep', kind: 'phys', mult: 0.85, target: 'all', w: 0 }], desc: 'A sky-eel grown huge on the Drift\'s wrecked Current.' });
  X('idrisVane', 12, { name: 'Idris Vane', family: 'human', art: 'look:idris', upscale: 2, boss: true, hpx: 8, strx: 0.95, defx: 1, resx: 1.5, spdx: 1.5, expx: 0.7, goldx: 0, mechanic: 'stillness', immune: ['frozen'], moves: [hit('Pale Lance', 1.1), spell('Pale Pulse', 24)], desc: 'Wren\'s old classmate. Stillness follows him like a held breath.' });
  X('riftMaw', 15, { name: 'Rift Maw', family: 'rift', art: 'crawler', pal: { body: '#3a2a44', seam: '#e0e0f0', leg: '#22182c', eye: '#ffffff' }, size: 72, boss: true, hpx: 8, strx: 1.0, defx: 1, spdx: 0.8, expx: 0.7, goldx: 5, mechanic: 'swarm', moves: [hit('Maul', 1.2), hit('Gnash', 1.0, 2), spell('Hollow Howl', 22, 1, true)], desc: 'A hole in the grey that has learned to hunger.' });
  X('neveAlder', 18, { name: 'Neve Alder', family: 'human', art: 'look:neve', upscale: 2, boss: true, hpx: 7, strx: 0.85, resx: 1.4, spdx: 1.4, expx: 0.7, goldx: 0, mechanic: 'hunger', moves: [spell('Hunger', 30), hit('Famished Strike', 1.0)], desc: 'Wren\'s quiet classmate. The Hunger wears her like a coat.' });
  X('drownedRegent', 22, { name: 'Drowned Regent', family: 'machine', art: 'guardian', pal: { brass: '#5aa08a', lens: '#a0fff0', core: '#a0fff0', iron: '#2e6a70', pipe: '#c8a840' }, size: 72, boss: true, hpx: 9, strx: 1.0, defx: 1.05, spdx: 0.8, expx: 0.7, goldx: 5, mechanic: 'layers', immune: ['snared'], moves: [hit('Crown Crush', 1.2, 3), spell('Drowning Pulse', 28, 1, true), hit('Sceptre Strike', 1.0, 2)], desc: 'The Crown\'s last regent, armored in layers of gold and stone.' });
  X('cassianLorne', 24, { name: 'Cassian', family: 'human', art: 'look:cassian', upscale: 2, boss: true, hpx: 5.5, strx: 0.9, resx: 1.3, spdx: 1.6, expx: 0.7, goldx: 0, mechanic: 'echo', moves: [hit('Echo Strike', 1.0), spell('Hollow Echo', 28)], desc: 'Wren\'s childhood friend. Everything he says comes back twice.' });
  X('cassianEcho', 24, { name: 'Cassian', family: 'human', art: 'look:cassian', upscale: 2, hpx: 1.2, strx: 0.75, resx: 1, spdx: 1.5, expx: 0, goldx: 0, moves: [hit('Echo Strike', 1.0), spell('Hollow Echo', 24)], desc: 'An echo of him. It remembers the joke but not the point.' });
  X('aldrithVenmoor', 30, { name: 'Aldrith Venmoor', family: 'human', art: 'look:aldrith', upscale: 2, boss: true, hpx: 16, strx: 0.8, resx: 1.4, defx: 1.0, spdx: 1.0, expx: 0, goldx: 0, mechanic: 'archmage', moves: [spell('Starbolt', 40), spell('Lecture', 34, 1), hit('Staff Strike', 1.0, 1)], desc: 'Grand Archmage of the Astral Conservatory. He is not angry. That is the worst part.' });
  // little ones used by boss mechanics
  X('riftSpawn', 15, { name: 'Rift Spawn', family: 'rift', art: 'wisp', pal: { body: '#5a4a8a', core: '#e8d8ff', iris: '#ffffff', shard: '#a890e0' }, hpx: 0.5, strx: 0.8, spdx: 1.2, expx: 0, goldx: 0, moves: [hit('Flicker'), spell('Rift Spark', 18)], desc: 'It does what the Maw tells it to.' });
  X('hollowedChild', 15, { name: 'Hollowed Villager', family: 'hollowed', art: 'look:hollowed', calmable: true, hpx: 0.8, strx: 0.5, spdx: 0.6, expx: 0, goldx: 0, moves: [spell('Hum', 14)], desc: 'Pale, still, and humming.' });
})();
