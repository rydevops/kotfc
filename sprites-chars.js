/* =========================================================================
   sprites-chars.js — procedural pixel-art people.
   One hand-drawn 16x16 body template (down / up / side + walk frames) is
   recoloured per character and decorated with accessories (goggles, beard,
   hat, apron, long hair, robe stars...). Add a new person with G.register('looks', ...).
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;

  // O outline · H hair · h hair shade · S skin · s skin shade · E eye
  // C cloth · c cloth shade · A accent · P pants · B boots
  const DOWN = [
    '................',
    '.....OOOOOO.....',
    '....OHHHHHHO....',
    '...OHHHHHHHHO...',
    '...OHHHHHHHHO...',
    '...OHhSSSShHO...',
    '...OHSESSESHO...',
    '...OsSSSSSSsO...',
    '....OsSSSSsO....',
    '...OCCCAACCCO...',
    '..OCCCCCCCCCCO..',
    '..OCOCCCCCCOCO..',
    '..OSOCCCCCCOSO..',
    '...OccccccccO...',
    '....OPPOOPPO....',
    '....OBBOOBBO....',
  ];
  const UP = DOWN.slice();
  UP[5] = '...OHHHHHHHHO...';
  UP[6] = '...OHHHHHHHHO...';
  UP[7] = '...OhHHHHHHhO...';
  UP[8] = '....OhhhhhhO....';
  UP[9] = '...OCCCCCCCCO...';
  const SIDE = [
    '................',
    '....OOOOOO......',
    '...OHHHHHHO.....',
    '..OHHHHHHHHO....',
    '..OHHHHHHHHO....',
    '..OHHHHSSSSO....',
    '..OHHHSSSESO....',
    '..OhHSSSSSSO....',
    '...OhsSSSSO.....',
    '....OCCCAO......',
    '...OCCCCCCO.....',
    '...OCCCOCCO.....',
    '...OCCCOSO......',
    '...OccccccO.....',
    '....OPPPPO......',
    '....OBBOBBO.....',
  ];
  const LEGS = {
    down: [
      ['....OPPOOPPO....', '....OBBOOBBO....'],
      ['....OPPOOBBO....', '....OBBO.OO.....'],
      ['....OPPOOPPO....', '....OBBOOBBO....'],
      ['....OBBOOPPO....', '.....OO.OBBO....'],
    ],
    side: [
      ['....OPPPPO......', '....OBBOBBO.....'],
      ['...OPPOOPPO.....', '..OBBO..OBBO....'],
      ['....OPPPPO......', '....OBBOBBO.....'],
      ['....OPPPPO......', '.....OBBBO......'],
    ],
  };

  const grid = (rows) => rows.map((r) => r.padEnd(16, '.').split(''));
  const set = (g, x, y, ch) => { if (g[y] && x >= 0 && x < 16) g[y][x] = ch; };
  const hline = (g, y, x0, x1, ch) => { for (let x = x0; x <= x1; x++) set(g, x, y, ch); };

  /* Accessories: fn(grid, dir) where dir is 'down' | 'up' | 'side' (right-facing) */
  const EXTRAS = {
    goggles(g, d) {
      if (d === 'down') { hline(g, 3, 4, 11, 'A'); set(g, 5, 3, 'G'); set(g, 6, 3, 'G'); set(g, 9, 3, 'G'); set(g, 10, 3, 'G'); }
      else if (d === 'up') hline(g, 3, 4, 11, 'A');
      else { hline(g, 3, 3, 10, 'A'); set(g, 8, 3, 'G'); set(g, 9, 3, 'G'); }
    },
    beard(g, d) {
      if (d === 'down') { set(g, 4, 7, 'W'); set(g, 11, 7, 'W'); hline(g, 8, 5, 10, 'W'); hline(g, 9, 6, 9, 'W'); set(g, 7, 7, 'W'); set(g, 8, 7, 'W'); }
      else if (d === 'side') { hline(g, 7, 7, 10, 'W'); hline(g, 8, 6, 9, 'W'); hline(g, 9, 6, 8, 'W'); }
    },
    hat(g, d) {
      if (d === 'side') { hline(g, 0, 4, 9, 'O'); set(g, 3, 1, 'O'); hline(g, 1, 4, 9, 'T'); set(g, 10, 1, 'O'); hline(g, 2, 3, 10, 'T'); set(g, 2, 2, 'O'); set(g, 11, 2, 'O'); hline(g, 3, 2, 12, 't'); set(g, 13, 3, 'O'); set(g, 1, 3, 'O'); }
      else { hline(g, 0, 5, 10, 'O'); set(g, 4, 1, 'O'); hline(g, 1, 5, 10, 'T'); set(g, 11, 1, 'O'); hline(g, 2, 4, 11, 'T'); hline(g, 3, 3, 12, 't'); set(g, 2, 3, 'O'); set(g, 13, 3, 'O'); set(g, 7, 2, 'A'); set(g, 8, 2, 'A'); }
    },
    cap(g, d) {
      if (d === 'side') { hline(g, 2, 4, 9, 'T'); hline(g, 3, 4, 12, 't'); set(g, 13, 3, 'O'); }
      else { hline(g, 2, 5, 10, 'T'); hline(g, 3, 4, 11, 't'); }
    },
    longhair(g, d) {
      if (d === 'side') { for (let y = 5; y <= 11; y++) { set(g, 3, y, 'H'); set(g, 2, y, y > 4 ? 'H' : 'O'); set(g, 1, y, 'O'); } set(g, 2, 12, 'O'); set(g, 3, 12, 'O'); }
      else {
        for (let y = 5; y <= 11; y++) { set(g, 3, y, 'H'); set(g, 12, y, 'H'); set(g, 2, y, 'O'); set(g, 13, y, 'O'); }
        if (d === 'up') for (let y = 9; y <= 11; y++) hline(g, y, 4, 11, y === 11 ? 'h' : 'H');
      }
    },
    bun(g) { set(g, 6, 0, 'O'); set(g, 7, 0, 'H'); set(g, 8, 0, 'H'); set(g, 9, 0, 'O'); },
    apron(g, d) {
      if (d === 'down') { set(g, 5, 9, 'W'); set(g, 10, 9, 'W'); for (let y = 10; y <= 13; y++) hline(g, y, 5, 10, 'W'); }
      else if (d === 'side') { for (let y = 10; y <= 13; y++) hline(g, y, 9, 9, 'W'); }
    },
    belt(g, d) {
      if (d === 'down') { hline(g, 12, 5, 10, 'A'); set(g, 6, 12, 'B'); set(g, 9, 12, 'B'); }
      else if (d === 'up') hline(g, 12, 5, 10, 'A');
      else hline(g, 12, 4, 6, 'A');
    },
    patch(g, d) {
      if (d === 'down') { set(g, 6, 11, 'p'); set(g, 9, 13, 'p'); }
      else if (d === 'up') { set(g, 9, 11, 'p'); set(g, 6, 12, 'p'); }
      else set(g, 5, 11, 'p');
    },
    stars(g, d) {
      const pts = d === 'side' ? [[5, 10], [6, 12], [4, 13]] : [[5, 10], [9, 12], [7, 11], [10, 13], [6, 13]];
      pts.forEach(([x, y]) => set(g, x, y, 'A'));
    },
    cord(g, d) { if (d === 'down') { set(g, 8, 10, 'A'); set(g, 8, 11, 'A'); set(g, 7, 12, 'A'); } },
    scarf(g, d) { if (d === 'side') hline(g, 9, 5, 8, 'X'); else hline(g, 9, 4, 11, 'X'); if (d !== 'side') set(g, 10, 10, 'X'); },
    hollow(g, d) { // blank glowing eyes
      if (d === 'down') { set(g, 6, 6, 'G'); set(g, 9, 6, 'G'); } else if (d === 'side') set(g, 9, 6, 'G');
    },
    robe(g, d) { // long robe covering legs
      if (d === 'side') { g[14] = '....OccccO......'.split(''); }
      else { g[14] = '...OccccccccO...'.split(''); }
    },
  };

  function paletteOf(L) {
    return {
      O: L.outline || '#1a1226',
      H: L.hair, h: U.shade(L.hair, -0.3),
      S: L.skin, s: U.shade(L.skin, -0.15), E: L.eye || '#1a1226',
      C: L.cloth, c: U.shade(L.cloth, -0.25), A: L.accent || '#e8b84a',
      P: L.pants || '#2e2c40', B: L.boots || '#4a3024',
      W: L.white || '#f4f0e6', G: L.glass || '#7ff0ff',
      T: L.hatColor || '#2a2a3a', t: U.shade(L.hatColor || '#2a2a3a', -0.25),
      p: L.patch || U.shade(L.cloth, 0.3), X: L.scarf || '#c04040',
    };
  }

  function buildFrame(L, dir, frame) {
    const base = dir === 'side' ? SIDE : dir === 'up' ? UP : DOWN;
    const g = grid(base);
    const legs = LEGS[dir === 'side' ? 'side' : 'down'][frame];
    g[14] = legs[0].split(''); g[15] = legs[1].split('');
    for (const ex of L.extras || []) EXTRAS[ex] && EXTRAS[ex](g, dir);
    // bob up one pixel on stride frames
    const rows = g.map((r) => r.join(''));
    const pal = paletteOf(L);
    const c = G.gfx.fromRows(rows, pal, 16);
    if (frame === 1 || frame === 3) {
      const { c: c2, x } = G.gfx.makeCanvas(16, 16);
      x.drawImage(c, 0, -1);
      return c2;
    }
    return c;
  }

  const cache = {};
  const sprites = (G.sprites = {
    /* returns { down:[4], up:[4], left:[4], right:[4] } */
    char(lookId) {
      if (cache[lookId]) return cache[lookId];
      const L = G.data.looks[lookId];
      if (!L) throw new Error('unknown look ' + lookId);
      let out;
      if (L.custom) out = L.custom();
      else {
        out = { down: [], up: [], left: [], right: [] };
        for (let f = 0; f < 4; f++) {
          out.down.push(buildFrame(L, 'down', f));
          out.up.push(buildFrame(L, 'up', f));
          const r = buildFrame(L, 'side', f);
          out.right.push(r);
          out.left.push(G.gfx.flipH(r));
        }
      }
      return (cache[lookId] = out);
    },
    portraitCache: {},
    portrait(lookId) {
      if (this.portraitCache[lookId]) return this.portraitCache[lookId];
      const fr = sprites.char(lookId).down[0];
      const { c, x } = G.gfx.makeCanvas(20, 20);
      x.drawImage(fr, 2, 3);
      return (this.portraitCache[lookId] = G.gfx.toDataURL(c, 4));
    },
  });

  /* ---------- Cog: Pip's hovering, sarcastic lantern ---------- */
  const COG = [
    '...OOOO...',
    '..OAAAAO..',
    '.OAggggAO.',
    '.OgYYYYgO.',
    '.OgYEEYgO.',
    '.OgYYYYgO.',
    '.OAggggAO.',
    '..OAAAAO..',
    '...OAAO...',
    '....OO....',
  ];
  const cogPal = { O: '#2a1a10', A: '#d9a441', g: '#f0a040', Y: '#fff2a0', E: '#3a2010' };
  const cogFrame = (dim) => G.gfx.fromRows(COG, dim ? Object.assign({}, cogPal, { Y: '#a08850', g: '#806030' }) : cogPal, 10);

  /* ---------- Looks: every person in Orrenth ---------- */
  const L = (id, def) => G.register('looks', id, def);
  const SK = { light: '#f2c7a5', fair: '#f6d8c0', mid: '#d9a07a', tan: '#b97a56', deep: '#8a5a3c', pale: '#cfd3e0' };

  // party
  L('wren', { hair: '#8f5fe8', skin: SK.light, cloth: '#3b5fc0', accent: '#f0c050', pants: '#2b2f4a', extras: ['patch'] });
  L('pip', { hair: '#e07a3a', skin: SK.fair, cloth: '#7a5a3a', accent: '#d9a441', pants: '#4a4a5a', extras: ['goggles', 'belt'] });
  L('vesper', { hair: '#4a2a5a', skin: SK.mid, cloth: '#33263f', accent: '#b8e060', pants: '#241c2c', extras: ['scarf'], scarf: '#7a3a6a' });
  L('hollis', { hair: '#5a4a3a', skin: SK.tan, cloth: '#8a8a94', accent: '#d0a860', pants: '#6a6a74', extras: ['cord', 'robe'] });
  L('cog', { custom: () => { const f = cogFrame(false); const all = [f, f, f, f]; return { down: all, up: all, left: all, right: all }; } });
  L('cogDim', { custom: () => { const f = cogFrame(true); const all = [f, f, f, f]; return { down: all, up: all, left: all, right: all }; } });

  // the Conservatory
  L('aldrith', { hair: '#d8dce8', skin: SK.light, cloth: '#1e2a6a', accent: '#f0d070', pants: '#1a2050', white: '#e8ecf4', extras: ['longhair', 'beard', 'stars', 'robe'] });
  L('cassian', { hair: '#9a5a2a', skin: SK.mid, cloth: '#3b5fc0', accent: '#e8e8f0' });
  L('idris', { hair: '#16161e', skin: SK.fair, cloth: '#d8dcef', accent: '#3b5fc0', pants: '#3a3f6a' });
  L('neve', { hair: '#c0d8f0', skin: SK.fair, cloth: '#55658a', accent: '#a0c0e0', extras: ['longhair'] });
  L('student1', { hair: '#3a2a1a', skin: SK.deep, cloth: '#3b5fc0', accent: '#e8e8f0' });
  L('student2', { hair: '#e0c070', skin: SK.light, cloth: '#3b5fc0', accent: '#e8e8f0', extras: ['bun'] });
  L('scholar', { hair: '#7a7a8a', skin: SK.tan, cloth: '#4a3a6a', accent: '#f0d070', extras: ['robe', 'beard'], white: '#9a9aa8' });
  L('quartermaster', { hair: '#5a3a2a', skin: SK.mid, cloth: '#6a5a3a', accent: '#d9a441', extras: ['apron'], white: '#d8c8a0' });

  // Pennywhistle Harbor
  L('tilda', { hair: '#f0c860', skin: SK.light, cloth: '#c06048', accent: '#ffe0a0', extras: ['bun', 'apron'] });
  L('isolde', { hair: '#2a2230', skin: SK.mid, cloth: '#8a2a2a', accent: '#d9a441', hatColor: '#2a2a3a', extras: ['hat'] });
  L('fennick', { hair: '#e8e8e8', skin: SK.tan, cloth: '#3a6a4a', hatColor: '#5a4a3a', extras: ['beard', 'cap'] });
  L('innkeep', { hair: '#6a3a2a', skin: SK.light, cloth: '#5a7a3a', extras: ['apron'] });
  L('grocer', { hair: '#2a2a2a', skin: SK.deep, cloth: '#a06a2a', hatColor: '#c08a3a', extras: ['cap', 'apron'] });
  L('lighter', { hair: '#a04a2a', skin: SK.fair, cloth: '#d07a2a', hatColor: '#3a3a4a', extras: ['cap'] });
  L('fisher', { hair: '#3a3a2a', skin: SK.tan, cloth: '#3a5a7a', hatColor: '#d0b040', extras: ['hat'] });
  L('kid', { hair: '#c08040', skin: SK.light, cloth: '#7ab0d0', pants: '#5a4a3a' });
  L('granny', { hair: '#d0d0d8', skin: SK.light, cloth: '#7a4a6a', extras: ['bun'] });
  L('dockhand', { hair: '#1a1a1a', skin: SK.deep, cloth: '#6a4a3a', extras: ['scarf'], scarf: '#d0a040' });
  L('hollowed', { hair: '#9a9aa8', skin: SK.pale, cloth: '#6a6a78', eye: '#9ab', glass: '#bfe8ff', extras: ['hollow'] });

  /* ---------- Speakers (dialog names, portraits, voice pitch) ---------- */
  Object.assign(G.speakers, {
    wren: { name: 'Wren', look: 'wren', pitch: 880 },
    pip: { name: 'Pip', look: 'pip', pitch: 1150 },
    cog: { name: 'Cog', look: 'cog', voice: 'cog' },
    vesper: { name: 'Vesper', look: 'vesper', pitch: 760 },
    hollis: { name: 'Brother Hollis', look: 'hollis', pitch: 520 },
    aldrith: { name: 'Archmage Aldrith', look: 'aldrith', pitch: 420 },
    cassian: { name: 'Cassian', look: 'cassian', pitch: 640 },
    idris: { name: 'Idris', look: 'idris', pitch: 560 },
    neve: { name: 'Neve', look: 'neve', pitch: 980 },
    tilda: { name: 'Tilda', look: 'tilda', pitch: 1000 },
    isolde: { name: 'Captain Isolde', look: 'isolde', pitch: 600 },
    fennick: { name: 'Fennick', look: 'fennick', pitch: 480 },
  });
})();
