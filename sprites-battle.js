/* =========================================================================
   sprites-battle.js — side-view battle sprites (SNES style, facing left).
   Party members get a full set of poses built from authored parts:
     BHEADS[style]        3/4-view heads (rows 0-9 of the figure)
     BPOSES[type][pose]   bodies: stand walk raise strike cast hurt kneel victory
     BLAYERS[name][pose]  cloak / coat tails drawn behind the body
     WEAPONS[id][orient]  staff, spanner, dagger, keyblade, none
   KO ('dead') is the stand pose laid flat. Colours come from the field
   look (sprites-chars.js), so a palette swap re-skins everything.

   G.sprites.battler(lookId, weaponId) → { stand:canvas, walk, raise, ... }
   ========================================================================= */
(function () {
  'use strict';
  const A = G.art;
  const BW = 26, BH = 28, Y0 = 3; // canvas size; figure row 0 sits at Y0
  const X0 = 1;

  /* ======================= HEADS (rows 0-9) ======================= */
  const BHEADS = {
    short: [
      '.........hhhhh..........',
      '.......hhhhyyyhh........',
      '......hhhhyyhhhhhh......',
      '.....hhhhhhhhhhhhhh.....',
      '.....hhHhhHhhhhhhHH.....',
      '.....hHssHsshhhhHHH.....',
      '.....hsesssesShhHHH.....',
      '.....ssesssesSShHHH.....',
      '......SsssssSSHHHH......',
      '.......SSSSS.HHH........'],
    spiky: [
      '........h...h...........',
      '.......hh..hh..h........',
      '.....h.hhhhhhhhh........',
      '.....hhhhhyyyhhhhh......',
      '....hhhhhyyhhhhhhhh.....',
      '.....hhhhhhhhhhhhhhh....',
      '....hhHhhHhhhhhhhHH.....',
      '.....hHssHsshhhhHHHH....',
      '.....hsesssesShhHHH.....',
      '.....ssesssesSShHHH.....',
      '......SsssssSSHHHH......',
      '.......SSSSS.HHH........'],
    hood: [
      '........ooooo...........',
      '......oooqqqooo.........',
      '.....oooqqoooooo........',
      '....ooHhhhhooooooo......',
      '....oHhhHhhhoooooOO.....',
      '....oHssHsshoooOOOO.....',
      '....osesssesSooOOOO.....',
      '....ssesssesSSoOOOO.....',
      '.....SsssssSSOOOOOO.....',
      '......SSSSSOOOOOOO......'],
    bald: [
      '.........sssss..........',
      '.......ssszzzsss........',
      '......sszzssssssS.......',
      '.....ssssssssssssS......',
      '.....sssssssssssSSS.....',
      '.....sHHssHHssShhSS.....',
      '.....ssesssesShhhSS.....',
      '.....ssesssesSShhSS.....',
      '......SsssssSSShSS......',
      '.......SSSSSSSS.........'],
    long: [
      '.........hhhhh..........',
      '.......hhhhyyyhh........',
      '......hhhhyyhhhhhh......',
      '.....hhhhhhhhhhhhhh.....',
      '.....hhHhhHhhhhhhHHh....',
      '.....hHssHsshhhhHHHh....',
      '.....hsesssesShhHHHhh...',
      '.....ssesssesSShHHHhh...',
      '......SsssssSShHHHHhh...',
      '.......SSSSS.hHHHHHh....',
      '.............hHHHHH.....',
      '..............HHHH......'],
  };
  // heads taller than 10 rows start higher
  const headTop = (style) => (style === 'spiky' ? -2 : 0);

  /* ======================= BODIES (rows 10-23) =======================
     each pose: { rows, at (first row), head: [dx, dy], hand: [x, y], grip: 'up'|'back'|'fwd'|'high', face } */
  const P = (at, head, hand, grip, rows, face) => ({ at, head, hand, grip, rows, face });
  const BPOSES = {
    pants: {
      stand: P(10, [0, 0], [6, 13], 'up', [
        '.......lcuuucCC.........',
        '......lccuuuuCcC........',
        '.....lsccuuuuCccC.......',
        '.....ssAAaaaaACcC.......',
        '......lcppppPCCss.......',
        '......lcpppPPCCss.......',
        '.......pPPpPPP..........',
        '.......pPP.pPP..........',
        '.......pP..pPP..........',
        '.......pP...pP..........',
        '.......pP...pP..........',
        '.......pP...pPP.........',
        '......BBb...BBb.........',
        '.....BBBb..BBBb.........']),
      walk: P(10, [-1, 0], [5, 13], 'up', [
        '......lcuuucCC..........',
        '.....lccuuuuCcC.........',
        '....lsccuuuuCccC........',
        '....ssAAaaaaACcC........',
        '.....lcppppPCCss........',
        '.....lcpppPPCCss........',
        '.....pPPpPPPP...........',
        '....pPP...pPP...........',
        '....pP.....pPP..........',
        '...pP......pPP..........',
        '...pP.......pP..........',
        '..pP........pPP.........',
        '.BBb........BBb.........',
        'BBBb.......BBBb.........']),
      raise: P(10, [1, 0], [15, 3], 'back', [
        '.......lcuuucCClss......',
        '......lccuuuuCcCls......',
        '......sccuuuuCcCC.......',
        '......sAAaaaaACcC.......',
        '.......lcppppPCC........',
        '.......lcpppPPCC........',
        '.......pPPpPPP..........',
        '.......pPP.pPP..........',
        '......pPP..pPP..........',
        '......pP....pP..........',
        '.....pP.....pP..........',
        '.....pP.....pPP.........',
        '....BBb.....BBb.........',
        '...BBBb....BBBb.........']),
      strike: P(11, [-3, 1], [2, 12], 'fwd', [
        '....lcuuucCC............',
        '.sslccuuuuCcC...........',
        '.ssllccuuuCccC..........',
        '...llAAaaaaACcC.........',
        '......lcppppPCss........',
        '.....lcpppPPPCss........',
        '....pPPPpPPPP...........',
        '...pPP....pPP...........',
        '..pPP......pPP..........',
        '.pPP.......pPP..........',
        '.pP.........pPP.........',
        'BBb.........BBb.........',
        'BBBb.......BBBb.........']),
      cast: P(10, [-1, 0], [4, 10], 'up', [
        '...ss.lcuuucCC..........',
        '...sllccuuuuCcC.........',
        '....llccuuuuCccC........',
        '......sAAaaaaACcC.......',
        '.......lcppppPCC........',
        '.......lcpppPPCC........',
        '.......pPPpPPP..........',
        '.......pPP.pPP..........',
        '......pPP..pPP..........',
        '......pP....pP..........',
        '......pP....pP..........',
        '......pP....pPP.........',
        '.....BBb....BBb.........',
        '....BBBb...BBBb.........']),
      hurt: P(10, [2, 1], [18, 12], 'back', [
        '.........lcuuucCC.......',
        '........lccuuuuCcC......',
        '........lccuuuuCccss....',
        '.......ssAAaaaaACcss....',
        '.......sslcppppPCC......',
        '.........lcpppPPCC......',
        '.........pPPpPPP........',
        '........pPP..pPP........',
        '........pP...pPP........',
        '.......pP.....pP........',
        '.......pP.....pP........',
        '......pP......pPP.......',
        '.....BBb......BBb.......',
        '....BBBb.....BBBb.......'], 'pain'),
      kneel: P(14, [-1, 5], [5, 17], 'up', [
        '......lcuuucCC..........',
        '.....lccuuuuCcC.........',
        '....lsccuuuuCccC........',
        '....ssAAaaaaACcCss......',
        '.....lcppppPCCCss.......',
        '....lcpppPPPPPPP........',
        '....pPPPPPPPPPPPP.......',
        '...pPP.....PPpPPB.......',
        '..BBBb.....BBBBBB.......',
        '.BBBBb..................']),
      victory: P(10, [0, 0], [6, 2], 'high', [
        '......slcuuucCC.........',
        '......llccuuuuCcC.......',
        '.......lccuuuuCccC......',
        '.......AAAaaaaACcCs.....',
        '.......lcppppPCCss......',
        '.......lcpppPPCC........',
        '.......pPPpPPP..........',
        '.......pPP.pPP..........',
        '.......pP..pPP..........',
        '.......pP...pP..........',
        '.......pP...pP..........',
        '.......pP...pPP.........',
        '......BBb...BBb.........',
        '.....BBBb..BBBb.........'], 'happy'),
    },
    robe: {
      stand: P(10, [0, 0], [6, 13], 'none', [
        '.......lcuuucCC.........',
        '......lccuuuuCcC........',
        '.....lsccuuuuCccC.......',
        '.....ssAAaaaaACcCs......',
        '......lccaaccCCss.......',
        '......lcccacccCC........',
        '......lcccgcccCC........',
        '......lccccccCCC........',
        '.....lcccccccCCC........',
        '.....lccccccccCC........',
        '.....lccccccccCCC.......',
        '....lcccccccccCCC.......',
        '....CCBbCCCCCCCCC.......',
        '...BBBb.................']),
      walk: P(10, [-1, 0], [5, 13], 'none', [
        '......lcuuucCC..........',
        '.....lccuuuuCcC.........',
        '....lsccuuuuCccC........',
        '....ssAAaaaaACcCs.......',
        '.....lccaaccCCss........',
        '.....lcccacccCC.........',
        '.....lcccgcccCC.........',
        '....lccccccccCC.........',
        '....lccccccccCCC........',
        '...lcccccccccCCC........',
        '...lccccccccccCCC.......',
        '..lcccccccccccCCC.......',
        '.BBbCCCCCCCCCBbC........',
        'BBBb.........BBb........']),
      raise: P(10, [1, 0], [14, 4], 'none', [
        '.......lcuuucCClss......',
        '......lccuuuuCcCls......',
        '......sccuuuuCcCC.......',
        '......sAAaaaaACcC.......',
        '.......lccaaccCC........',
        '.......lcccacccCC.......',
        '.......lcccgcccCC.......',
        '.......lccccccCCC.......',
        '......lcccccccCCC.......',
        '......lccccccccCC.......',
        '.....lccccccccCCC.......',
        '.....lcccccccccCCC......',
        '....CCBbCCCCCCCCCC......',
        '...BBBb.................']),
      strike: P(11, [-3, 1], [1, 11], 'none', [
        '....lcuuucCC............',
        'sslllccuuuCcC...........',
        'ssllccuuuuCccC..........',
        '....sAAaaaaACcC.........',
        '.....lccaaccCCC.........',
        '....lcccacccCCC.........',
        '...lcccgccccCCC.........',
        '..lccccccccCCCC.........',
        '.lccccccccccCCC.........',
        '.lcccccccccccCCC........',
        'lccccccccccccCCC........',
        'CBbCCCCCCCCCBbCC........',
        'BBb.........BBb.........']),
      cast: P(10, [-1, 0], [4, 10], 'none', [
        '...ss.lcuuucCC..........',
        '...sllccuuuuCcC.........',
        '....llccuuuuCccC........',
        '......sAAaaaaACcC.......',
        '.......lccaaccCC........',
        '.......lcccacccCC.......',
        '.......lcccgcccCC.......',
        '.......lccccccCCC.......',
        '......lcccccccCCC.......',
        '......lccccccccCC.......',
        '.....lccccccccCCC.......',
        '.....lcccccccccCCC......',
        '....CCBbCCCCCCCCCC......',
        '...BBBb.................']),
      hurt: P(10, [2, 1], [9, 15], 'none', [
        '.........lcuuucCC.......',
        '........lccuuuuCcC......',
        '........lccuuuuCccss....',
        '.......ssAAaaaaACcss....',
        '.......sslccaaccCC......',
        '.........lcccacccCC.....',
        '.........lcccgcccCC.....',
        '.........lccccccCCC.....',
        '........lcccccccCCC.....',
        '........lccccccccCC.....',
        '.......lccccccccCCC.....',
        '.......lcccccccccCCC....',
        '......CCBbCCCCCCCCCC....',
        '.....BBBb...............'], 'pain'),
      kneel: P(14, [-1, 5], [5, 17], 'none', [
        '......lcuuucCC..........',
        '.....lccuuuuCcC.........',
        '....lsccuuuuCccC........',
        '....ssAAaaaaACcCss......',
        '.....lccaaccCCCss.......',
        '....lcccacccccCCC.......',
        '...lccccgcccccCCCC......',
        '..lcccccccccccCCCC......',
        '.CCCCCCCCCCCCCCCCB......',
        'BBBb....................']),
      victory: P(10, [0, 0], [6, 2], 'none', [
        '......slcuuucCC.........',
        '......llccuuuuCcC.......',
        '.......lccuuuuCccC......',
        '.......AAAaaaaACcCs.....',
        '.......lccaaccCCss......',
        '.......lcccacccCC.......',
        '.......lcccgcccCC.......',
        '.......lccccccCCC.......',
        '......lcccccccCCC.......',
        '......lccccccccCC.......',
        '.....lccccccccCCC.......',
        '.....lcccccccccCCC......',
        '....CCBbCCCCCCCCCC......',
        '...BBBb.................'], 'happy'),
    },
  };

  /* ======================= LAYERS behind the body ======================= */
  const upright = (rows) => ({ stand: rows, walk: rows, raise: rows, strike: rows, cast: rows, hurt: rows, victory: rows });
  const BLAYERS = {
    // the academy cloak: hangs from the shoulders and flares behind
    cloak: Object.assign(upright({ at: 10, dx: 0, rows: [
      '...........CCCCC........',
      '...........CcccCC.......',
      '............ccccCC......',
      '............cccccCC.....',
      '............ccccccC.....',
      '............lccccccC....',
      '.............lcccccC....',
      '.............lccccccC...',
      '..............lcccccC...',
      '..............lccccCC...',
      '...............lcccC....',
      '...............CCCC.....'] }), {
      walk: { at: 10, dx: -1, rows: [
        '...........CCCCC........',
        '...........CcccCC.......',
        '............ccccCCC.....',
        '............ccccccCC....',
        '............lccccccCC...',
        '............lcccccccCC..',
        '.............lcccccccC..',
        '.............lccccccCC..',
        '..............lcccCCC...',
        '..............lCCC......'] },
      strike: { at: 11, dx: -3, rows: [
        '...........CCCCC........',
        '...........CccccCCC.....',
        '............ccccccCCC...',
        '............lccccccccCC.',
        '.............lcccccccCC.',
        '.............lcccccCCC..',
        '..............lccCCC....',
        '..............lCC.......'] },
      kneel: { at: 14, dx: -1, rows: [
        '...........CCCCC........',
        '...........CcccCC.......',
        '............ccccCC......',
        '............cccccCC.....',
        '............lccccccC....',
        '............lcccccccC...',
        '.............lccccccC...',
        '..........CCCCCCCCCC....'] },
    }),
    // a long coat's tails
    coat: Object.assign(upright({ at: 15, dx: 0, rows: [
      '.....lc.......Cc........',
      '.....lcc......CcC.......',
      '.....lcc......CcC.......',
      '......lc.......CcC......',
      '......C........CCC......'] }), {
      walk: { at: 15, dx: -1, rows: ['.....lc.......Cc........', '....lcc.......CcC.......', '...lcc........CccC......', '...CC..........CCC......'] },
      strike: { at: 16, dx: -3, rows: ['.....lc.......CcC.......', '....lcc........CccC.....', '...lCC..........CCC.....'] },
      kneel: null,
    }),
  };

  /* ======================= WEAPONS =======================
     templates are drawn so their grip pixel (marked '+') lands on the hand */
  const WEAPONS = {
    staff: {
      up: ['.g.', 'gyg', '.+.', '.w.', '.w.', '.w.', '.w.', '.w.', '.w.', '.w.', '.w.', '.w.', '.d.'].map((r) => r.replace('+', 'w')), upGrip: [1, 5],
    },
  };
  // simpler: weapons are drawn procedurally along a direction from the hand
  const GRIPS = {
    up: { dx: 0, dy: -1, back: 9, fwd: 5 },
    down: { dx: 0.4, dy: 1, back: 3, fwd: 6 },
    back: { dx: 0.75, dy: -0.75, back: 3, fwd: 9 },
    fwd: { dx: -1, dy: 0.25, back: 2, fwd: 10 },
    high: { dx: 0, dy: -1, back: 2, fwd: 10 },
    low: { dx: -1, dy: 0.6, back: 1, fwd: 5 },
  };
  const WSTYLE = {
    staff: { len: 1, shaft: 'w', tip: 'gem' },
    key: { len: 1, shaft: 'm', tip: 'key' },
    spanner: { len: 0.6, shaft: 'm', tip: 'jaw' },
    dagger: { len: 0.45, shaft: 'm', tip: 'blade' },
  };
  function drawWeapon(g, id, x, y, grip) {
    const ws = WSTYLE[id], gp = GRIPS[grip];
    if (!ws || !gp) return;
    // from (back) behind the hand to (fwd) the business end
    const fwd = id === 'dagger' ? 1 : Math.round(gp.fwd * ws.len + (ws.len < 1 ? 2 : 0)), back = ws.len < 1 ? 1 : Math.round(gp.back);
    const pts = [];
    for (let i = -back; i <= fwd; i++) pts.push([Math.round(x + gp.dx * i), Math.round(y + gp.dy * i)]);
    pts.forEach(([px, py], i) => { if (A.get(g, px, py) === '.' || i < back + 1) A.set(g, px, py, i === back ? 's' : ws.shaft === 'w' ? (i % 3 ? 'w' : 'd') : i === back + 1 ? 'm' : 'M'); });
    const [ex, ey] = pts[pts.length - 1];
    const set = (dx, dy, c) => A.set(g, ex + dx, ey + dy, c);
    if (ws.tip === 'gem') { set(0, 0, 'n'); set(-1, 0, 'g'); set(1, 0, 'g'); set(0, -1, 'g'); set(0, 1, 'g'); set(0, 0, 'n'); }
    else if (ws.tip === 'jaw') { set(0, 0, 'M'); set(-1, 0, 'm'); set(1, 0, 'm'); set(-1, -1, 'm'); set(1, -1, 'm'); }
    else if (ws.tip === 'blade') {
      // a short bright blade continuing past the end
      for (let i = 1; i <= 4; i++) A.set(g, Math.round(ex + gp.dx * i), Math.round(ey + gp.dy * i), i === 4 ? 'n' : i === 1 ? 'M' : 'v');
    } else if (ws.tip === 'key') {
      for (let i = 1; i <= 3; i++) A.set(g, Math.round(ex + gp.dx * i), Math.round(ey + gp.dy * i), 'n');
      set(0, 0, 'g'); set(-1, 0, 'g'); set(1, 0, 'g');
    }
  }

  /* ======================= assembly ======================= */
  const grids = new Map();
  const GR = (rows) => { let g = grids.get(rows); if (!g) { g = A.grid(rows); grids.set(rows, g); } return g; };
  const BODY_OF = { tunic: 'pants', cloak: 'pants', coat: 'pants', robe: 'robe', dress: 'robe' };
  const POSES = ['stand', 'walk', 'raise', 'strike', 'cast', 'hurt', 'kneel', 'victory'];

  function faceVariant(rows, face) {
    if (!face) return rows;
    // eyes are the two rows that contain 'e'
    const eyeRows = rows.map((r, i) => (r.includes('e') ? i : -1)).filter((i) => i >= 0);
    return rows.map((r, i) => {
      if (face === 'pain' && i === eyeRows[0]) return r.replace(/e/g, 's');
      if (face === 'pain' && i === eyeRows[1]) return r.replace(/e/g, 'e');
      if (face === 'happy' && i === eyeRows[1]) return r.replace(/e/g, 's');
      return r;
    });
  }

  function compose(L, weapon, pose) {
    const g = A.blank(BW, BH);
    const type = BODY_OF[L.outfit || 'tunic'] || 'pants';
    const P0 = BPOSES[type][pose];
    const style = BHEADS[L.style] ? L.style : 'short';
    // layers behind
    const layer = L.outfit === 'cloak' ? BLAYERS.cloak : L.outfit === 'coat' ? BLAYERS.coat : null;
    const ly = layer && layer[pose];
    // body
    A.blit(g, GR(P0.rows), X0, Y0 + P0.at);
    if (ly) A.blit(g, GR(ly.rows), X0 + (ly.dx || 0), Y0 + ly.at, { under: true });
    // head
    const hr = faceVariant(BHEADS[style], P0.face);
    A.blit(g, GR(hr), X0 + P0.head[0], Y0 + P0.head[1] + headTop(style));
    // extras that live on the head / body
    const ex = new Set(L.extras || []);
    const hx = X0 + P0.head[0], hy = Y0 + P0.head[1];
    if (ex.has('goggles')) A.blit(g, GR(['aGGaGGGa', 'aGnaGnGa']), hx + 5, hy + 3);
    if (ex.has('scarf')) A.blit(g, GR(['.ffffffF', 'fffffFF.', '....fF..', '.....fF.', '......F.']), hx + 6, hy + 9);
    if (ex.has('pendant') && pose !== 'strike') A.set(g, X0 + P0.head[0] + 10, Y0 + P0.at + 2, 'g');
    if (ex.has('beard')) A.blit(g, GR(['.WWWWW.', 'VWWWWWV', '.VWWWV.', '..VWV..', '...V...']), hx + 5, hy + 7);
    // weapon in the front hand
    if (weapon && weapon !== 'none' && P0.grip !== 'none') {
      const short = WSTYLE[weapon] && WSTYLE[weapon].len < 1;
      const grip = short && (P0.grip === 'up') ? 'low' : P0.grip;
      drawWeapon(g, weapon, X0 + P0.hand[0], Y0 + P0.hand[1], grip);
    }
    A.outline(g);
    return g;
  }

  // lay a figure down (KO): rotate 90° counter-clockwise so the head is on the left
  function layDown(g) {
    const out = A.blank(g.h, g.w);
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) A.set(out, y, g.w - 1 - x, A.get(g, x, y));
    // trim to the bottom of the canvas
    let maxY = 0;
    for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) if (A.get(out, x, y) !== '.') maxY = y;
    const shifted = A.blank(BW + 2, BH);
    A.blit(shifted, out, 0, BH - 1 - maxY);
    return shifted;
  }

  const cache = {};
  G.sprites.battler = function (lookId, weapon) {
    const key = lookId + '|' + weapon;
    if (cache[key]) return cache[key];
    const L = G.data.looks[lookId];
    const pal = Object.assign(G.sprites.charParts.palette(L), {
      w: '#9a6a38', m: '#c8ccd8', M: '#7a7e90', v: '#e8f0ff', n: '#ffffff', d: '#4a2a14',
    });
    const out = { w: BW, h: BH };
    for (const pose of POSES) out[pose] = A.paint(compose(L, weapon, pose), pal);
    // KO: lying down, drawn from the stand pose with eyes shut
    const dead = compose(Object.assign({}, L), null, 'hurt');
    out.dead = A.paint(layDown(dead), pal);
    return (cache[key] = out);
  };
  G.sprites.battleParts = { BHEADS, BPOSES, BLAYERS, POSES };

  /* dialog / menu portraits: head and shoulders of the battle sprite, facing right */
  const pcache = {};
  G.sprites.portrait = function (lookId) {
    if (pcache[lookId]) return pcache[lookId];
    const L = G.data.looks[lookId];
    const { c, x } = G.gfx.makeCanvas(20, 20);
    if (L && L.custom) {
      const f = G.sprites.char(lookId).down[0];
      x.drawImage(f, Math.round((20 - f.width) / 2), Math.round((20 - f.height) / 2));
    } else {
      const st = G.sprites.battler(lookId, 'none').stand;
      x.translate(20, 0); x.scale(-1, 1);
      x.drawImage(st, X0 + 2, 0, 20, 20, 0, 1, 20, 20);
    }
    return (pcache[lookId] = G.gfx.toDataURL(c, 4));
  };
})();
