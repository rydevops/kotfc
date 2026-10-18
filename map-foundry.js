/* =========================================================================
   map-foundry.js — The Foundry (levels 22-30).
   Four maps: the upper docks (Cassian), the furnace halls (rune plates),
   the vaults (the key-blade as a literal key), and the Core (Aldrith).
   ========================================================================= */
(function () {
  'use strict';
  const kit = G.kit;
  const FX = (st) => ({ sky: 'dark', ambient: 0.5, ambientColor: '#140806', music: 'foundry', lights: true, weather: 'sparks', travel: 0 });

  // a pool of pale light where the party can rest (inn) — drawn as a glowing ring
  const alcove = (x, y) => ({
    x, y, draw: (ctx, px, py, t) => {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t / 500);
      ctx.drawImage(G.pix.glow('#8ae0ff', 30), px - 16, py - 16);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#6ff3ff'; ctx.fillRect(px + 6, py + 6, 4, 4);
    },
  });

  /* ============================== UPPER DOCKS ============================== */
  const d = kit.grid(30, 30, ' ');
  kit.rect(d, 4, 8, 22, 18, '+');
  kit.rect(d, 13, 26, 4, 3, '_');
  kit.blob(d, 7, 12, 2, 2, '-', 2, 0.1); kit.blob(d, 22, 12, 2, 2, '-', 3, 0.1);
  kit.blob(d, 7, 22, 2, 2, '-', 4, 0.1); kit.blob(d, 22, 22, 2, 2, '-', 5, 0.1);
  kit.set(d, 6, 16, ']'); kit.set(d, 23, 16, ']');
  kit.rail(d, '+', '*');
  kit.rect(d, 14, 7, 2, 1, '/');
  kit.rect(d, 14, 8, 2, 1, '+');
  kit.vline(d, 12, 27, 28, 'q'); kit.vline(d, 17, 27, 28, 'q');
  const drows = kit.rows(d);

  G.register('maps', 'foundryDocks', {
    name: 'The Foundry — Upper Docks',
    noCliffs: true,
    battleBg: 'foundryDocks',
    tiles: drows,
    env: (st) => Object.assign(FX(st), { music: st.flags.cassianDown ? 'farewell' : 'foundry' }),
    lights: [{ x: 15, y: 8, r: 50, color: '#6ff3ff', glow: 0.4 }, { x: 15, y: 17, r: 70, color: '#ff8a30', glow: 0.25 }],
    warps: [
      { x: 14, y: 7, to: 'foundry1', tx: 17, ty: 43, dir: 'up', cond: (st) => st.flags.cassianDown },
      { x: 15, y: 7, to: 'foundry1', tx: 18, ty: 43, dir: 'up', cond: (st) => st.flags.cassianDown },
      { x: 14, y: 28, to: 'crownHall', tx: 11, ty: 5, dir: 'down' },
      { x: 15, y: 28, to: 'crownHall', tx: 11, ty: 5, dir: 'down' },
    ],
    chests: [
      { id: 'dock1', x: 6, y: 9, item: 'foundryBlade' },
      { id: 'dock2', x: 24, y: 9, item: 'foundryPlate' },
      { id: 'dock3', x: 11, y: 23, item: 'royalJelly', qty: 2 },
      { id: 'dock4', x: 24, y: 24, item: 'flowCrystal' },
    ],
    encounters: {
      cond: (st) => st.step >= 25 && !st.flags.cassianScene, where: 'all', rate: 0.04, bg: 'foundryDocks',
      troops: [{ mobs: ['foundryGuardian'], w: 2 }, { mobs: ['furnaceSentry', 'furnaceSentry'], w: 2 }, { mobs: ['cinderMoth', 'cinderMoth', 'voidWisp'], w: 2 }, { mobs: ['voidWisp', 'voidWisp'], w: 2 }],
    },
    triggers: [
      { x: 10, y: 19, w: 10, h: 1, cond: (st) => !st.flags.cassianDown, once: 'cassianScene', run: (S) => G.story.cassianScene(S) },
    ],
    interact: [
      { x: 14, y: 7, cond: (st) => !st.flags.cassianDown, run: (S) => S.narrate('A vault gate, three times your height, sealed with a Founder\'s lock. It hums at the pendant, and then stops, as if waiting for someone to ask permission.') },
      { x: 20, y: 24, run: async (S) => { await S.say('foundryBot', 'REST ALCOVE ACTIVE. THE LIGHT IS LOW-POWER, FOR YOUR COMFORT.'); await S.inn('foundryRest'); } },
    ],
    npcs: [
      { id: 'supplyA', look: 'foundryBot', x: 9, y: 24, dir: 'right', talk: async (S) => { await S.shop('foundrySupply'); } },
      { id: 'cassianStand', look: 'cassian', x: 14, y: 10, dir: 'down', cond: (st) => !st.flags.cassianDown, talk: (S) => G.story.cassianScene(S) },
    ],
    objects: [alcove(20, 24)],
  });

  /* ============================== FURNACE HALLS ============================== */
  const f = kit.grid(36, 46, ' ');
  kit.rect(f, 15, 4, 6, 41, '+');
  kit.rect(f, 4, 14, 12, 11, '+');       // west furnace room
  kit.rect(f, 20, 14, 12, 11, '+');      // east furnace room
  kit.rect(f, 9, 4, 18, 9, '+');         // north chamber
  kit.blob(f, 8, 36, 3, 5, '-', 3, 0.1); kit.blob(f, 28, 36, 3, 5, '-', 4, 0.1);
  kit.blob(f, 9, 30, 2, 2, '-', 5, 0.1); kit.blob(f, 27, 30, 2, 2, '-', 6, 0.1);
  kit.blob(f, 8, 20, 2, 2, '-', 7, 0.1); kit.blob(f, 28, 20, 2, 2, '-', 8, 0.1);
  for (const [x, y] of [[6, 16], [30, 16], [12, 22], [24, 22], [11, 6], [25, 6]]) kit.set(f, x, y, ']');
  kit.rect(f, 16, 45, 4, 1, '_');
  kit.rail(f, '+', '*');
  kit.rect(f, 17, 3, 2, 1, '/');
  kit.rect(f, 17, 4, 2, 1, '+');

  const frows = kit.rows(f);
  const PLATES = [{ k: 'plateW', x: 6, y: 20 }, { k: 'plateE', x: 30, y: 20 }, { k: 'plateN', x: 18, y: 7 }];
  for (const p of PLATES) { const r = frows[p.y].split(''); r[p.x] = ';'; frows[p.y] = r.join(''); }

  G.register('maps', 'foundry1', {
    name: 'The Foundry — Furnace Halls',
    noCliffs: true,
    battleBg: 'foundry',
    tiles: frows,
    env: FX,
    setup(st, grid) { if (st.flags.vault1) { grid[3][17] = '+'; grid[3][18] = '+'; } },
    lights: [{ x: 8, y: 36, r: 50, color: '#ff8a30', glow: 0.5 }, { x: 28, y: 36, r: 50, color: '#ff8a30', glow: 0.5 }, { x: 18, y: 8, r: 50, color: '#6ff3ff', glow: 0.4 }],
    warps: [
      { x: 17, y: 45, to: 'foundryDocks', tx: 14, ty: 8, dir: 'down' },
      { x: 18, y: 45, to: 'foundryDocks', tx: 15, ty: 8, dir: 'down' },
      { x: 17, y: 3, to: 'foundry2', tx: 17, ty: 41, dir: 'up', cond: (st) => st.flags.vault1 },
      { x: 18, y: 3, to: 'foundry2', tx: 18, ty: 41, dir: 'up', cond: (st) => st.flags.vault1 },
    ],
    chests: [
      { id: 'f1a', x: 5, y: 15, item: 'forgeDriver' },
      { id: 'f1b', x: 31, y: 15, item: 'slagFangs' },
      { id: 'f1c', x: 12, y: 8, item: 'founderRod' },
      { id: 'f1d', x: 24, y: 8, item: 'sunCrystal' },
      { id: 'f1e', x: 17, y: 30, item: 'royalJelly', qty: 2 },
      { id: 'f1f', x: 6, y: 23, gold: 600 },
    ],
    encounters: {
      cond: () => true, where: 'all', rate: 0.05, bg: 'foundry',
      troops: [
        { mobs: ['slagGolem'], w: 2 }, { mobs: ['furnaceSentry', 'furnaceSentry'], w: 3 }, { mobs: ['forgeWyrm'], w: 1 },
        { mobs: ['abyssCrawler', 'voidWisp'], w: 2 }, { mobs: ['cinderMoth', 'cinderMoth'], w: 3 }, { mobs: ['foundryGuardian', 'furnaceSentry'], w: 2 },
      ],
    },
    triggers: PLATES.map((p) => ({
      x: p.x, y: p.y, w: 1, h: 1, cond: (st) => !st.flags[p.k],
      run: async (S) => { S.flag(p.k); S.light(p.x + ',' + p.y, true); S.sfx('pendant'); S.shake(1, 300);
        const n = PLATES.filter((q) => S.st.flags[q.k]).length;
        if (n < 3) { G.ui.toast(`A rune plate lights. (${n}/3)`); return; }
        await S.wait(300); S.sfx('rumble'); S.shake(3, 900);
        S.setTile(17, 3, '+'); S.setTile(18, 3, '+');
        S.flag('vault1');
        await S.narrate('Far to the north, a vault gate grinds open, and cold blue light spills out.');
        S.objective('Take the opened vault gate at the north end of the Furnace Halls.');
      } })),
    onEnter: async (S, st) => {
      for (const p of PLATES) if (st.flags[p.k]) S.light(p.x + ',' + p.y, true);
      if (!st.flags.foundry1Seen) {
        S.flag('foundry1Seen'); S.setStep(26);
        await S.wait(400);
        await S.narrate('Beyond the upper docks, the Foundry opens into a long hall of black stone and molten light. Pale blue veins of Current run through the walls like blood through a hand.');
        await S.say('pip', 'It is all still running. After thousands of years. Cog says it is the most beautiful and horrifying machine he has ever heard.');
        await S.say('hollis', 'The first tap-stations. Everything above us was built from these.');
        await S.say('wren', 'There are three rune plates, one in each hall. The pendant is warm.');
        S.objective('Light the three rune plates: the west room, the east room and the north chamber.');
      }
    },
    interact: [
      { x: 17, y: 3, cond: (st) => !st.flags.vault1, run: (S) => S.narrate('A vault gate. Three sockets glow dimly, waiting for the rune plates to be lit.') },
      { x: 17, y: 41, run: async (S) => { await S.say('foundryBot', 'REST ALCOVE ACTIVE.'); await S.inn('foundryRest'); } },
    ],
    npcs: [{ id: 'supplyB', look: 'foundryBot', x: 19, y: 41, dir: 'left', talk: async (S) => { await S.shop('foundrySupply'); } }],
    objects: [alcove(17, 41)],
  });

  /* ============================== THE VAULTS ============================== */
  const v = kit.grid(36, 44, ' ');
  kit.rect(v, 15, 2, 6, 41, '+');
  kit.rect(v, 8, 30, 20, 9, '+');       // chamber I
  kit.rect(v, 8, 14, 20, 10, '+');      // chamber II
  kit.rect(v, 10, 2, 16, 8, '+');       // chamber III
  kit.blob(v, 5, 34, 2, 2, '-', 3, 0.1); kit.blob(v, 31, 34, 2, 2, '-', 4, 0.1);
  kit.blob(v, 5, 18, 2, 2, '-', 5, 0.1); kit.blob(v, 31, 18, 2, 2, '-', 6, 0.1);
  for (const [x, y] of [[10, 32], [25, 32], [10, 36], [25, 36], [11, 5], [24, 5]]) kit.set(v, x, y, ']');
  kit.rect(v, 16, 43, 4, 1, '_');
  kit.rail(v, '+', '*');
  // doors: I -> corridor, II -> corridor, exit at the top
  kit.rect(v, 16, 29, 4, 1, '/');
  kit.rect(v, 16, 13, 4, 1, '/');
  kit.rect(v, 17, 1, 2, 1, '/');
  kit.rect(v, 17, 2, 2, 1, '+');
  const vrows = kit.rows(v);
  const setCh = (x, y, ch) => { const r = vrows[y].split(''); r[x] = ch; vrows[y] = r.join(''); };
  setCh(17, 32, '|');                    // keyhole I
  setCh(11, 17, '|'); setCh(24, 17, '|'); // keyholes II
  setCh(17, 4, '|');                      // the Founder's Cradle

  G.register('maps', 'foundry2', {
    name: 'The Foundry — The Vaults',
    noCliffs: true,
    battleBg: 'foundry',
    tiles: vrows,
    env: FX,
    setup(st, grid) {
      if (st.flags.vaultI) { for (let x = 16; x <= 19; x++) grid[29][x] = '+'; }
      if (st.flags.vaultII) { for (let x = 16; x <= 19; x++) grid[13][x] = '+'; }
      if (st.flags.blade4) { grid[1][17] = '+'; grid[1][18] = '+'; }
    },
    lights: [{ x: 18, y: 33, r: 50, color: '#ffd060', glow: 0.35 }, { x: 18, y: 17, r: 60, color: '#6ff3ff', glow: 0.3 }, { x: 18, y: 5, r: 60, color: '#ffffff', glow: 0.4 }],
    warps: [
      { x: 17, y: 43, to: 'foundry1', tx: 17, ty: 4, dir: 'down' },
      { x: 18, y: 43, to: 'foundry1', tx: 18, ty: 4, dir: 'down' },
      { x: 17, y: 1, to: 'core', tx: 16, ty: 31, dir: 'up', cond: (st) => st.flags.blade4 },
      { x: 18, y: 1, to: 'core', tx: 17, ty: 31, dir: 'up', cond: (st) => st.flags.blade4 },
    ],
    chests: [
      { id: 'v1a', x: 9, y: 31, item: 'royalJelly', qty: 2 },
      { id: 'v1b', x: 26, y: 37, item: 'emberFeather', qty: 2 },
      { id: 'v2a', x: 9, y: 22, item: 'flowCrystal', qty: 2 },
      { id: 'v2b', x: 26, y: 22, gold: 900 },
      { id: 'v3a', x: 12, y: 8, item: 'moonDew', qty: 3 },
    ],
    encounters: {
      cond: () => true, where: 'all', rate: 0.04, bg: 'foundry',
      troops: [
        { mobs: ['slagGolem', 'furnaceSentry'], w: 2 }, { mobs: ['abyssCrawler', 'abyssCrawler'], w: 2 }, { mobs: ['forgeWyrm'], w: 2 },
        { mobs: ['voidWisp', 'voidWisp', 'cinderMoth'], w: 2 }, { mobs: ['foundryGuardian', 'foundryGuardian'], w: 1 },
      ],
    },
    interact: [
      { x: 17, y: 32, run: (S) => G.story.keyhole(S, 'vaultI') },
      { x: 11, y: 17, run: (S) => G.story.keyhole(S, 'vaultII', 'W') },
      { x: 24, y: 17, run: (S) => G.story.keyhole(S, 'vaultII', 'E') },
      { x: 17, y: 4, run: (S) => G.story.cradle(S) },
      { x: 17, y: 39, run: async (S) => { await S.say('foundryBot', 'REST ALCOVE ACTIVE.'); await S.inn('foundryRest'); } },
    ],
    npcs: [{ id: 'supplyC', look: 'foundryBot', x: 19, y: 39, dir: 'left', talk: async (S) => { await S.shop('foundrySupply'); } }],
    objects: [alcove(17, 39)],
    onEnter: async (S, st) => {
      if (!st.flags.vaultsSeen) {
        S.flag('vaultsSeen');
        await S.wait(400);
        await S.narrate('The vaults are sealed rooms, one above the other, each with a keyhole shaped like a lantern.');
        await S.say('wren', 'The keyholes. They are the same shape as my pendant\'s socket.');
        await S.say('pip', 'Cog says it is a key. It is *the* key. It is a very big key, and you are holding it.');
        S.objective('Open the three vaults with the key-blade, to reach the Core.');
      }
    },
  });

  /* ============================== THE CORE ============================== */
  const c = kit.grid(34, 38, ' ');
  kit.blob(c, 17, 20, 14, 15, '>', 3, 0.05);
  kit.rect(c, 15, 30, 4, 8, '+');
  for (const [x, y] of [[7, 12], [27, 12], [5, 20], [29, 20], [7, 28], [27, 28]]) kit.set(c, x, y, ']');
  kit.rect(c, 15, 37, 4, 1, '_');
  kit.rail(c, '>', '*');
  const crows = kit.rows(c);

  function drawCore(ctx, x, y, t, w) {
    const phase = w.st.flags.coreRupture ? 1 : 0;
    const R = 26 + Math.sin(t / 500) * 2 + phase * 6;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.12 + i * 0.07; ctx.drawImage(G.pix.glow(phase ? '#ff9a60' : '#6ff3ff', R + 20 - i * 8), x + 8 - (R + 20 - i * 8), y + 8 - (R + 20 - i * 8)); }
    ctx.globalAlpha = 0.9; ctx.drawImage(G.pix.glow('#ffffff', 14), x - 6, y - 6);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#1a181e';
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + t / 3000; ctx.fillRect(Math.round(x + 8 + Math.cos(a) * 20 - 2), Math.round(y + 8 + Math.sin(a) * 20 - 2), 4, 4); }
  }

  G.register('maps', 'core', {
    name: 'The Core',
    noCliffs: true,
    battleBg: 'core',
    tiles: crows,
    env: (st) => ({ sky: 'dark', ambient: 0.2, ambientColor: '#0a1a28', music: st.flags.coreRupture ? 'finale' : 'core', lights: true, weather: 'motes', travel: 0 }),
    lights: [{ x: 17, y: 10, r: 80, color: '#6ff3ff', glow: 0.6 }],
    warps: [
      { x: 16, y: 37, to: 'foundry2', tx: 17, ty: 3, dir: 'down', cond: (st) => !st.flags.coreRupture },
      { x: 17, y: 37, to: 'foundry2', tx: 18, ty: 3, dir: 'down', cond: (st) => !st.flags.coreRupture },
    ],
    chests: [],
    triggers: [{ x: 13, y: 24, w: 8, h: 1, cond: (st) => !st.flags.aldrithDown, once: 'aldrithMeet', run: (S) => G.story.aldrithMeet(S) }],
    npcs: [{ id: 'aldrith', look: 'aldrith', x: 17, y: 14, dir: 'down', cond: (st) => !st.flags.aldrithDown, talk: (S) => G.story.aldrithMeet(S) }],
    objects: [{ x: 17, y: 8, draw: drawCore }],
    interact: [],
  });
})();
