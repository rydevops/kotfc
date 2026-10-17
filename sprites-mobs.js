/* =========================================================================
   sprites-mobs.js — hand-drawn monster pixel art.
   Each entry: rows (ASCII) + palette. Mobs in data-mobs.js reference an
   art id and may override palette colours to make variants.
   ========================================================================= */
(function () {
  'use strict';

  const ART = {
    // ---------------- Rift spawn ----------------
    wisp: {
      pal: { a: '#5a1f8a', b: '#a24cf0', c: '#e7a8ff', w: '#ffffff', e: '#22083a' },
      rows: [
        '................',
        '........a.......',
        '.......aba......',
        '......abba..a...',
        '.....abbbba.ba..',
        '....abbccbbabba.',
        '...abbccccbbbba.',
        '..abbccwwccbbba.',
        '..abccwweecbbba.',
        '..abccwweecbba..',
        '..abbccwwccbba..',
        '...abbccccbba...',
        '....aabbbbaa.a..',
        '..a...abba......',
        '.......aa...a...',
        '................',
      ],
    },
    crawler: {
      pal: { O: '#140a20', a: '#3a2058', b: '#8a4cd0', c: '#ff9af0', w: '#ffffff', e: '#ff4a8a' },
      rows: [
        '................',
        '................',
        '................',
        '......OOOO......',
        '....OOabbaOO....',
        '...OaabwwbaaO...',
        '..OaaabwwbaaaO..',
        '..OaaacbbcaaaO..',
        '.OaeaaacbaaaeaO.',
        '.OaaaaacbaaaaaO.',
        '..OaaaacbaaaaO..',
        '..OOaaaaaaaaOO..',
        '.O.O.OO..OO.O.O.',
        'O..O.O....O.O..O',
        '................',
        '................',
      ],
    },
    // ---------------- Current-twisted wildlife ----------------
    moth: {
      pal: { O: '#1a1430', a: '#3a5a9a', b: '#6aa0e0', c: '#c8f0ff', w: '#ffffff', e: '#ffe060' },
      rows: [
        '................',
        '..aa........aa..',
        '.abba..OO..abba.',
        '.abcba.OO.abcba.',
        'abccbaOeeObaccba',
        'abcwcbOOOObcwcba',
        'abccbaObbOabccba',
        '.abba.ObbO.abba.',
        '..aabaObbOabaa..',
        '...abaObbOaba...',
        '...abaO..Oaba...',
        '....a..OO..a....',
        '................',
      ],
    },
    fox: {
      pal: { O: '#1a1226', a: '#b05a3a', b: '#f09a5a', w: '#fff0e0', E: '#1a1226', n: '#2a1a1a', c: '#bfe8ff' },
      rows: [
        '................',
        '................',
        '..O.O...........',
        '..OaOaO.........',
        '..OabbaO........',
        '.OabEbbaO.......',
        'OnbbbbbbaO......',
        '.OOabbbbbaOOO...',
        '...OabbbbbbaacO.',
        '...Oabbbbbbbaccc',
        '...OabbwwwbbaOcc',
        '...OaabbbbaaO.cc',
        '...OaO.OaO.Oa.c.',
        '...OO..OO..OO...',
      ],
    },
    fish: {
      pal: { O: '#10203a', a: '#2a8aa0', b: '#5ae0e0', c: '#c8fff8', w: '#ffffff', E: '#10203a' },
      rows: [
        '................',
        '................',
        '................',
        '......OOOO......',
        '....OOabbaOO..O.',
        '...ObbbbbbbbaOaO',
        '..ObEbbccbbbbaaO',
        '.Obbbbccccbbbaa.',
        '..ObbwwwwbbbbaaO',
        '...OObbbbbbaOOaO',
        '.....OOOOOO...O.',
        '................',
      ],
    },
    // ---------------- Rogue machines ----------------
    sentry: {
      pal: { O: '#24160a', a: '#8a5a1e', b: '#d9a441', c: '#ffe08a', g: '#6ff3ff', k: '#3a3a4a', l: '#c0c8d8' },
      rows: [
        '................',
        '......OOOO......',
        '.....ObbbbO.....',
        '....ObccccbO....',
        '....ObgggbbO....',
        '....OObbbbOO....',
        '...OaObbbbOaO.l.',
        '..ObaObccbOabOl.',
        '..ObaObbbbOabOl.',
        '..OaaOkbbkOaaOl.',
        '...OOObbbbOOOOl.',
        '....OkkOOkkO..l.',
        '....ObaO.ObaO...',
        '....ObaO.ObaO...',
        '...OaaaO.OaaaO..',
        '................',
      ],
    },
    guardian: {
      pal: { O: '#1c1008', k: '#4a3a3a', a: '#8a5a1e', b: '#d9a441', c: '#ffe08a', r: '#c02020', R: '#ff5a4a', w: '#fff0e0', g: '#6a4a20', Y: '#ffd040' },
      rows: [
        '........................',
        '..........OOOO..........',
        '.........OkkkkO.........',
        '........OkbbbbkO........',
        '.......ObbccccbbO.......',
        '......ObcrrrrrrcbO......',
        '......ObcrRRRRrcbO......',
        '......ObcrRwwRrcbO......',
        '......ObcrrrrrrcbO......',
        '.......ObbccccbbO.......',
        '...OOO..OkbbbbkO..OOO...',
        '..OkbkOOObbbbbbOOOkbkO..',
        '..ObcbkbbbggggbbbkbcbO..',
        '..ObcbOkbggYYggbkObcbO..',
        '..OkbkOkbgYYYYgbkOkbkO..',
        '...OaO.kbggYYggbk.OaO...',
        '..OaaaOkbbggggbbkOaaaO..',
        '..OaOaO.kbbbbbbk.OaOaO..',
        '.........kkkkkk.........',
        '........OkaOOakO........',
        '.......OkaaO.OaakO......',
        '......OOkkO...OkkOO.....',
        '......OaaaO...OaaaO.....',
        '........................',
      ],
    },
    golem: {
      pal: { O: '#14121c', s: '#4a4a5e', S: '#7a7a92', u: '#3a6ad0', U: '#9ae0ff', r: '#a03a3a', g: '#3a8a4a', b: '#3a4aa0' },
      rows: [
        '........................',
        '........OOOOOOOO........',
        '.......OsssssssSO.......',
        '......OsSSSSSSSSsO......',
        '......OsSuuSSuuSsO......',
        '......OsSuUSSUuSsO......',
        '......OsSSSSSSSSsO......',
        '.......OssSSSSssO.......',
        '....OOOOOOOOOOOOOOOO....',
        '...OsSSSSSSSSSSSSSSsO...',
        '..OsSOrgbrObgrbOrgbSsO..',
        '..OsSOrgbrObgrbOrgbSsO..',
        '..OsSOOOOOOOOOOOOOOOSsO.',
        '..OsSObrgOgrbbOgbrbOSsO.',
        '..OsSObrgOgrbbOgbrbOSsO.',
        '..OSSOOOOOOOOOOOOOOOSSO.',
        '..OssO.OsSSSSSSsO..OssO.',
        '..OuuO.OsSSuuSSsO..OuuO.',
        '...OO..OsSSSSSSsO...OO..',
        '.......OsSO..OSsO.......',
        '......OssSO..OSssO......',
        '......OsssO..OsssO......',
        '......OOOOO..OOOOO......',
        '........................',
      ],
    },
  };

  const cache = {};
  /* G.sprites.mob(mobDef) → outlined canvas.
     mobDef.art is an ART key or 'look:<lookId>' for human-shaped foes. */
  G.sprites.mob = function (mob) {
    const key = mob.id;
    if (cache[key]) return cache[key];
    let c;
    if (mob.art.startsWith('look:')) {
      c = G.sprites.char(mob.art.slice(5)).right[0];
    } else {
      const a = ART[mob.art];
      const pal = Object.assign({}, a.pal, mob.pal || {});
      c = G.gfx.fromRows(a.rows, pal);
    }
    c = G.gfx.outline(c, '#0b0712');
    return (cache[key] = c);
  };
  G.sprites.ART = ART;
})();
