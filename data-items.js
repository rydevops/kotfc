/* =========================================================================
   data-items.js — consumables, equipment and key items.
   type: use | weapon | armor | charm | key
   use : { heal, mp, revive (fraction of max HP), cure, flow }
   who : which characters may equip (omit = anyone)
   ========================================================================= */
(function () {
  'use strict';
  const I = (id, def) => G.register('items', id, def);

  // Consumables
  I('bread', { name: 'Harbor Bread', type: 'use', price: 12, target: 'ally', use: { heal: 30 }, desc: 'Tilda\'s bread, still warm somehow. Restores 30 HP.' });
  I('honeyBun', { name: 'Honey Bun', type: 'use', price: 35, target: 'ally', use: { heal: 80 }, desc: 'Sticky, golden, restorative. Restores 80 HP.' });
  I('lanternOil', { name: 'Lantern Oil', type: 'use', price: 30, target: 'ally', use: { mp: 15 }, desc: 'Drinkable, apparently. Restores 15 MP.' });
  I('starAnise', { name: 'Star Anise Tea', type: 'use', price: 80, target: 'ally', use: { mp: 40 }, desc: 'Brewed under starlight. Restores 40 MP.' });
  I('sparkTonic', { name: 'Spark Tonic', type: 'use', price: 60, target: 'allyDead', use: { revive: 0.35 }, desc: 'A jolt of Current. Revives a fallen ally with 35% HP.' });
  I('calmTea', { name: 'Calm Tea', type: 'use', price: 15, target: 'ally', use: { cure: true }, desc: 'Clears Smoke, Snares and Stillness.' });
  I('flowShard', { name: 'Flow Shard', type: 'use', price: 50, target: 'none', battleOnly: true, use: { flow: 3 }, desc: 'A sliver of crystal Current. Adds 3 to the Flow meter in battle.' });

  // Weapons
  I('practiceStaff', { name: 'Practice Staff', type: 'weapon', who: ['wren'], price: 0, stats: { str: 3, res: 1 }, desc: 'Academy issue. Dented from enthusiastic practice.' });
  I('brassBaton', { name: 'Brass Baton', type: 'weapon', who: ['wren'], price: 120, stats: { str: 6, res: 1 }, desc: 'A lantern-lighter\'s baton, weighted with brass.' });
  I('ferryhookSaber', { name: 'Ferryhook Saber', type: 'weapon', who: ['wren'], price: 320, stats: { str: 10, res: 2 }, desc: 'Curved like a mooring hook. Balanced like a blade.' });
  I('spanner', { name: 'Trusty Spanner', type: 'weapon', who: ['pip'], price: 0, stats: { str: 2, res: 1 }, desc: 'Fits every bolt in Orrenth. Pip says so, anyway.' });
  I('springLauncher', { name: 'Spring Launcher', type: 'weapon', who: ['pip'], price: 140, stats: { str: 5, res: 2 }, desc: 'Fires bolts, nuts and occasionally sandwiches.' });
  I('sparkWrench', { name: 'Spark Wrench', type: 'weapon', who: ['pip'], price: 340, stats: { str: 8, res: 4 }, desc: 'Hums when it touches anything with Current in it.' });
  I('twinDirks', { name: 'Twin Dirks', type: 'weapon', who: ['vesper'], price: 200, stats: { str: 7, luk: 2 }, desc: 'Stolen, naturally.' });
  I('prayerBeads', { name: 'Prayer Beads', type: 'weapon', who: ['hollis'], price: 200, stats: { str: 2, res: 6 }, desc: 'Worn smooth by quiet hands.' });

  // Armor
  I('academyCloak', { name: 'Academy Cloak', type: 'armor', price: 0, stats: { def: 2, res: 1 }, desc: 'Patched blue wool. Smells faintly of library.' });
  I('workApron', { name: 'Work Apron', type: 'armor', price: 0, stats: { def: 2 }, desc: 'Fourteen pockets. Pip has filled all of them.' });
  I('patchedCoat', { name: 'Patched Coat', type: 'armor', price: 90, stats: { def: 4 }, desc: 'Sailcloth patches over sailcloth patches.' });
  I('sailclothVest', { name: 'Sailcloth Vest', type: 'armor', price: 180, stats: { def: 6, spd: 1 }, desc: 'Light, tough, wind-tested.' });
  I('wovenMantle', { name: 'Woven Mantle', type: 'armor', price: 400, stats: { def: 9, res: 3 }, desc: 'Threaded with strands of woven Current.' });

  // Charms
  I('luckyButton', { name: 'Lucky Button', type: 'charm', price: 80, stats: { luk: 4 }, desc: 'Off a famous captain\'s coat. Allegedly.' });
  I('gullFeather', { name: 'Gull Feather', type: 'charm', price: 120, stats: { spd: 3 }, desc: 'Sky-gulls never fall. Maybe it rubs off.' });
  I('starPin', { name: 'Star Pin', type: 'charm', price: 150, stats: { res: 4 }, desc: 'Awarded for excellence in Resonance studies.' });
  I('emberLocket', { name: 'Ember Locket', type: 'charm', price: 0, stats: { hp: 20, res: 2 }, desc: 'Found in the Records Vault. Warm to the touch.' });

  // Key items
  I('crate', { name: "Aldrith's Crate", type: 'key', desc: 'Sealed with the Archmage\'s star. A "maintenance part" for the harbor tap-station.' });
  I('crateShard', { name: 'Crate Shard', type: 'key', desc: 'A piece of the crate\'s casing, still faintly warm. You haven\'t told anyone you kept it.' });
  I('stationMap', { name: 'Station Map', type: 'key', desc: 'Aldrith\'s map of the tap-stations. The failing ones are circled — before they failed.' });
  I('odalysNote', { name: "Odalys's File", type: 'key', desc: '"O.F. has seen the taps\' true draw. She cannot be allowed to publish."' });
})();
