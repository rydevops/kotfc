/* =========================================================================
   data-shops.js — shop stock and inns. NPCs open these with
   S.shop('harborStore') or S.inn('harborInn') in their talk scripts.
   ========================================================================= */
(function () {
  'use strict';
  const SH = (id, def) => G.register('shops', id, def);

  SH('harborBakery', { name: "Tilda's Bakery", greet: 'Fresh from the oven! Well. Fresh-ish.', stock: ['bread', 'honeyBun'] });
  SH('harborStore', { name: 'Brinemarket Goods', greet: 'Rope, oil, tonics, oddments. Have a look.', stock: ['bread', 'lanternOil', 'calmTea', 'sparkTonic', 'brassBaton', 'springLauncher', 'patchedCoat', 'luckyButton'] });
  SH('quartermaster', { name: 'Conservatory Stores', greet: 'Student requisitions. Sign here, here and... here.', stock: ['honeyBun', 'lanternOil', 'starAnise', 'sparkTonic', 'flowShard', 'calmTea', 'ferryhookSaber', 'sparkWrench', 'sailclothVest', 'gullFeather', 'starPin'] });

  SH('harborInn', { inn: true, name: 'The Bobbing Lantern', price: 20, greet: 'A bed, a bowl of chowder and the creak of the moorings. Twenty gold.' });
  SH('dormBed', { inn: true, name: 'Your old bed', price: 0, greet: 'Your dormitory bed. The blanket still smells like home.' });
})();
