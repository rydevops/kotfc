/* =========================================================================
   sprites-chars.js — hand-pixelled field sprites in the SNES style.
   Every person is 16 px wide, two heads tall, built from authored parts:
     HEADS[style][dir]  — hair style + face   (short, spiky, long, bun,
                          ponytail, hood, bald)
     BODIES[outfit][dir][frame] — tunic, cloak, coat, robe, dress
     EXTRAS[name][dir]  — hats, caps, goggles, beards, scarves, aprons...
   Parts are index grids (letters, not colours). A "look" supplies the
   colours, so the same drawing palette-swaps into many townsfolk.

   Letters:  k outline · H h y hair (dark/mid/light) · S s z skin · e eyes
             C c l cloth · U u inner shirt · P p trousers · B b boots
             A a g accent/gold · T t hat · F f scarf · O o q hood
             X V W white (beard, apron) · G n goggle glass · Q patch
   ========================================================================= */
(function () {
  'use strict';
  const A = G.art;
  const W = 16, H = 20;

  /* ======================= HEADS ======================= */
  const _4 = ['................', '................', '................', '................'];
  const HEADS = {
    short: {
      down: [..._4,
        '....hhhhhhhh....',
        '...hyyhhhhhhh...',
        '..hyyhhhhhhhhH..',
        '..hyhhhhhhhhHH..',
        '..hHhsHhhHshHH..',
        '..HssessssessH..',
        '..HssessssessH..',
        '...SssssssssS...',
        '....SSssssSS....'],
      up: [..._4,
        '....hhhhhhhh....',
        '...hyyhhhhhhh...',
        '..hyyhhhhhhhhH..',
        '..hyhhhhhhhhhH..',
        '..hhhhhhhhhhhH..',
        '..HhhhhhhhhhHH..',
        '..HHhhhhhhhHHH..',
        '...SHHHHHHHHS...',
        '....SSSSSSSS....'],
      side: [..._4,
        '....hhhhhhh.....',
        '...hyyhhhhhhh...',
        '..hyyhhhhhhhhh..',
        '..hyhhhhhhhhHh..',
        '..hhhhhhhHhsHs..',
        '..HhhhhHsssess..',
        '..HHhhHSsssess..',
        '...HHHSsssssS...',
        '....HSssssSS....'],
    },
    spiky: {
      down: ['................',
        '.....y....h.....',
        '..h..yh..hh..h..',
        '..hhhyhhhhhhhh..',
        '...hyyhhhhhhhH..',
        '..hyyhhhhhhhhH..',
        '.hhyhhhhhhhhhHH.',
        '..hyhhhhhhhhHH..',
        '.hhHshhHhhshHHH.',
        '..HssessssessH..',
        '..HssessssessH..',
        '...SssssssssS...',
        '....SSssssSS....'],
      up: ['................',
        '.....h....h.....',
        '..h..hh..hh..h..',
        '..hhhhhhhhhhhh..',
        '...hyyhhhhhhhH..',
        '..hyyhhhhhhhhH..',
        '.hhyhhhhhhhhhHH.',
        '..hhhhhhhhhhhH..',
        '.hHhhhhhhhhhHHH.',
        '..HHhHhhHhHHHH..',
        '..HHHHhHHhHHHH..',
        '...SHHHHHHHHS...',
        '....SSSSSSSS....'],
      side: ['................',
        '....h...h.......',
        '...hh..hh..h....',
        '..hhhhhhhhhh....',
        '.hhhyyhhhhhhh...',
        '..hyyhhhhhhhhh..',
        '.hhyhhhhhhhhhh..',
        '..hhhhhhhhhHhs..',
        '.hhhhhhhHhsHss..',
        '..HhhhhHsssess..',
        '..HHhhHSsssess..',
        '...HHHSsssssS...',
        '....HSssssSS....'],
    },
    long: {
      down: [..._4,
        '....hhhhhhhh....',
        '...hyyhhyyhhh...',
        '..hyyhhHhyhhhH..',
        '..hyhhHsHhhhHH..',
        '.hyhhHsssHhhhHH.',
        '.hyhsessssesHHH.',
        '.hhhsessssesHhH.',
        '.hhHSssssssSHhH.',
        '.hhH.SSssSS.HhH.',
        '.hhH........HhH.',
        '.hH..........HH.',
        '..H..........H..'],
      up: [..._4,
        '....hhhhhhhh....',
        '...hyyhhhhhhh...',
        '..hyyhhhhhhhhH..',
        '..hyhhhhhhhhhH..',
        '.hhhhhhhhhhhhHH.',
        '.hhhhhhhhhhhhHH.',
        '.hhhhhhhhhhhHHH.',
        '.hhhhhhhhhhhHHH.',
        '..hhhhhhhhhhHH..',
        '..hhhhhhhhhHHH..',
        '...hhhhhhhhHH...',
        '...HhhhhhhHHH...',
        '....HHhHHhHH....'],
      side: [..._4,
        '....hhhhhhh.....',
        '...hyyhhhhhhh...',
        '..hyyhhhhhhhhh..',
        '..hyhhhhhhhhHh..',
        '.hhhhhhhhHhsHs..',
        '.hhhhhhHsssess..',
        '.hhhhhHSsssess..',
        '.hhhhHHsssssS...',
        '.hhhhH.SsssS....',
        '.hhhhH..........',
        '..hhhH..........',
        '..hhH...........',
        '...H............'],
    },
    bun: {
      down: ['................',
        '......hhhh......',
        '.....hyyhhh.....',
        '......HhhH......',
        '....hhhhhhhh....',
        '...hyyhhhhhhh...',
        '..hyyhhhhhhhhH..',
        '..hyhHhhhhHhHH..',
        '..hHsssHHsssHH..',
        '..HssessssessH..',
        '..HssessssessH..',
        '...SssssssssS...',
        '....SSssssSS....'],
      up: ['................',
        '......hhhh......',
        '.....hyyhhh.....',
        '......HhhH......',
        '....hhhhhhhh....',
        '...hyyhhhhhhh...',
        '..hyyhhhhhhhhH..',
        '..hyhhhhhhhhhH..',
        '..hhhhHhhHhhhH..',
        '..HhhhhHHhhhHH..',
        '..HHhhhhhhhHHH..',
        '...SHHHHHHHHS...',
        '....SSSSSSSS....'],
      side: ['................',
        '................',
        '..hhh...........',
        '.hyyhh..........',
        '.hhhHhhhhhh.....',
        '..HhhyyhhhhhH...',
        '..hyyhhhhhhhhh..',
        '..hyhhhhhhhhHh..',
        '..hhhhhhhhHssHs.',
        '..HhhhhHsssess..',
        '..HHhhHSsssess..',
        '...HHHSsssssS...',
        '....HSssssSS....'],
    },
    ponytail: {
      down: [..._4,
        '....hhhhhhhh....',
        '...hyyhhhhhhh...',
        '..hyyhhhhhhhhH..',
        '..hyhhhhhhhHHH..',
        '..hhHHsssssHhH..',
        '..HssessssessH..',
        '..HssessssessH..',
        '...SssssssssS...',
        '....SSssssSS....'],
      up: [..._4,
        '....hhhhhhhh....',
        '...hyyhhhhhhh...',
        '..hyyhhhhhhhhH..',
        '..hyhhhhhhhhhH..',
        '..hhhhhhhhhhhH..',
        '..HhhhhaAhhhHH..',
        '..HHhhhhhhhHHH..',
        '...SHHhhhHHHS...',
        '....SSShhSSS....',
        '.......hH.......',
        '.......hH.......',
        '.......HH.......'],
      side: [..._4,
        '....hhhhhhh.....',
        '...hyyhhhhhhh...',
        '..hyyhhhhhhhhh..',
        '.aahyhhhhhhhHh..',
        'hhhhhhhhhHHssHs.',
        'hhhHhhhHsssess..',
        'hhH.HhHSsssess..',
        'hH..HHSsssssS...',
        'H....HSssssSS...'],
    },
    hood: {
      down: ['................', '................', '................',
        '.....oooooo.....',
        '...ooqqoooooo...',
        '..oqqooooooooO..',
        '..oqooooooooOO..',
        '.ooqoHhhhhHoOOO.',
        '.oooHhsHhshHoOO.',
        '.ooOsessssesOOO.',
        '.ooOsessssesOOO.',
        '.ooOSsssssSOOOO.',
        '..ooOSSssSSOOO..',
        '..ooo......OOO..'],
      up: ['................', '................', '................',
        '.....oooooo.....',
        '...ooqqoooooo...',
        '..oqqooooooooO..',
        '..oqooooooooOO..',
        '.ooqooooooooOOO.',
        '.oooooooooooOOO.',
        '.oooooooooooOOO.',
        '.ooooooooooOOOO.',
        '.oooooooooOOOOO.',
        '..ooooooooOOOO..',
        '..ooooOOOOOOOO..',
        '....oOOOOOOO....'],
      side: ['................', '................', '................',
        '....oooooo......',
        '...oqqooooo.....',
        '..oqqoooooooo...',
        '.ooqoooooooooO..',
        '.oooooooooHhhO..',
        '.oooooooOHhsHs..',
        '.ooooooOSsssess.',
        '.ooooooOSsssess.',
        '.oooooOOSssssS..',
        '..ooooOOSsssS...',
        '..oooOO.........'],
    },
    bald: {
      down: [..._4,
        '....ssssssss....',
        '...szzssssssS...',
        '..szzssssssssS..',
        '..szsssssssSSS..',
        '..hsHssssssHSh..',
        '..hssessssesSh..',
        '..hssessssesSh..',
        '...SssssssssS...',
        '....SSssssSS....'],
      up: [..._4,
        '....ssssssss....',
        '...szzsssssSS...',
        '..szzsssssssSS..',
        '..szssssssssSS..',
        '..hssssssssSSh..',
        '..hhssssssssSh..',
        '..hhhhhhhhhhhh..',
        '...HhhhhhhhhH...',
        '....SSSSSSSS....'],
      side: [..._4,
        '....sssssss.....',
        '...szzssssss....',
        '..szzsssssssss..',
        '..szssssssssss..',
        '..szsssssssHss..',
        '..hssssSssssess.',
        '..hhssSSsssess..',
        '...hhSsssssS....',
        '....SSssssSS....'],
    },
  };

  /* ======================= BODIES =======================
     rows 13-19 of the sprite; [stand, stepL, stepR] (side: [stand, step]) */
  const BODIES = {
    tunic: {
      down: [[
        '...lccluucccC...',
        '...lCcclcccCC...',
        '...lCccccccCC...',
        '...sAaaaaaaAs...',
        '....cccccccC....',
        '....ppP..Ppp....',
        '....BBb..bBB....'], [
        '...lccluucccC...',
        '...lCcclcccCC...',
        '...sCccccccCC...',
        '....AaaaaaaAs...',
        '....cccccccC....',
        '....ppP..BBb....',
        '....BBb.........'], [
        '...lccluucccC...',
        '...lCcclcccCC...',
        '...lCccccccCs...',
        '...sAaaaaaaA....',
        '....cccccccC....',
        '....BBb..Ppp....',
        '.........bBB....']],
      up: [[
        '...lcccccccCC...',
        '...lCccccccCC...',
        '...lCccccccCC...',
        '...sAaaaaaaAs...',
        '....cccccccC....',
        '....ppP..Ppp....',
        '....BBb..bBB....'], [
        '...lcccccccCC...',
        '...lCccccccCC...',
        '...sCccccccCC...',
        '....AaaaaaaAs...',
        '....cccccccC....',
        '....ppP..BBb....',
        '....BBb.........'], [
        '...lcccccccCC...',
        '...lCccccccCC...',
        '...lCccccccCs...',
        '...sAaaaaaaA....',
        '....cccccccC....',
        '....BBb..Ppp....',
        '.........bBB....']],
      side: [[
        '.....lcccuC.....',
        '.....lcllcC.....',
        '.....lcllcC.....',
        '.....AAssAA.....',
        '.....cccccC.....',
        '......pPpP......',
        '......BBbbb.....'], [
        '.....lcccuC.....',
        '.....lccllC.....',
        '.....lcccllC....',
        '.....AaaAAss....',
        '.....cccccC.....',
        '.....pP...pP....',
        '....BBb...bBB...']],
    },
    cloak: {
      down: [[
        '..lcccuuuuccCC..',
        '..lccCuuuuCcCC..',
        '..lccCuuuuCcCC..',
        '..lccCAaaACcCC..',
        '..lccCppppCcCC..',
        '..lccCpP.PCcCC..',
        '....BBb..bBB....'], [
        '..lcccuuuuccCC..',
        '..lccCuuuuCcCC..',
        '..lccCuuuuCcCC..',
        '..lccCAaaACcCC..',
        '..lccCppppCcCC..',
        '..lccCpPBbCcCC..',
        '....BBb.........'], [
        '..lcccuuuuccCC..',
        '..lccCuuuuCcCC..',
        '..lccCuuuuCcCC..',
        '..lccCAaaACcCC..',
        '..lccCppppCcCC..',
        '..lccCBbPpCcCC..',
        '.........bBB....']],
      up: [[
        '..llllllllllCC..',
        '..lcccccccccCC..',
        '..lcccccccccCC..',
        '..lccccccccCCC..',
        '..lccccccccCCC..',
        '..lcccccccCCCC..',
        '....BBb..bBB....'], [
        '..llllllllllCC..',
        '..lcccccccccCC..',
        '..lcccccccccCC..',
        '..lccccccccCCC..',
        '..lccccccccCCC..',
        '..lcccccccCCCC..',
        '....BBb.........'], [
        '..llllllllllCC..',
        '..lcccccccccCC..',
        '..lcccccccccCC..',
        '..lccccccccCCC..',
        '..lccccccccCCC..',
        '..lcccccccCCCC..',
        '.........bBB....']],
      side: [[
        '....lcccuC......',
        '...lccccuC......',
        '...lccccuC......',
        '...lccccaA......',
        '...lccccpP......',
        '...lcccCpP......',
        '......BBbbb.....'], [
        '....lcccuC......',
        '...lccccuC......',
        '...lccccuC......',
        '..lcccccaA......',
        '..lccccCpPp.....',
        '..lcccCCpPp.....',
        '.....BB...bBB...']],
    },
    coat: {
      down: [[
        '...lcluuuulcC...',
        '...lCcluulcCC...',
        '...lCcaccacCC...',
        '...sCcaccacCs...',
        '....ccaccacC....',
        '....cccPPcCC....',
        '....BBb..bBB....'], [
        '...lcluuuulcC...',
        '...lCcluulcCC...',
        '...sCcaccacCC...',
        '....CcaccacCs...',
        '....ccaccacC....',
        '....cccPBbCC....',
        '....BBb.........'], [
        '...lcluuuulcC...',
        '...lCcluulcCC...',
        '...lCcaccacCs...',
        '...sCcaccacC....',
        '....ccaccacC....',
        '....ccBbPcCC....',
        '.........bBB....']],
      up: [[
        '...lcccccccCC...',
        '...lCccccccCC...',
        '...lCccccccCC...',
        '...sCAaaaaACs...',
        '....cccCcccC....',
        '....cccCcccC....',
        '....BBb..bBB....'], [
        '...lcccccccCC...',
        '...lCccccccCC...',
        '...sCccccccCC...',
        '....CAaaaaACs...',
        '....cccCcccC....',
        '....cccCBbbC....',
        '....BBb.........'], [
        '...lcccccccCC...',
        '...lCccccccCC...',
        '...lCccccccCs...',
        '...sCAaaaaAC....',
        '....cccCcccC....',
        '....BbbCcccC....',
        '.........bBB....']],
      side: [[
        '.....lcluC......',
        '.....lclcC......',
        '.....lllcC......',
        '.....AssaA......',
        '.....ccccCC.....',
        '.....cccCCC.....',
        '......BBbbb.....'], [
        '.....lcluC......',
        '.....lclcC......',
        '.....lcllCs.....',
        '.....ccaaCs.....',
        '....cccccCC.....',
        '....ccCCCC......',
        '.....BB..bBB....']],
    },
    robe: {
      down: [[
        '...lcluuuulcC...',
        '..lcCcluulcCcC..',
        '..lcCcclccccCC..',
        '..ssCccaacccss..',
        '...lcccaacccC...',
        '...lcccccccCC...',
        '...CCBbCCbBCC...'], [
        '...lcluuuulcC...',
        '..lcCcluulcCcC..',
        '..lcCcclccccCC..',
        '..ssCccaacccss..',
        '...lcccaacccC...',
        '...lcccccccCC...',
        '...CCBbCCCCCC...'], [
        '...lcluuuulcC...',
        '..lcCcluulcCcC..',
        '..lcCcclccccCC..',
        '..ssCccaacccss..',
        '...lcccaacccC...',
        '...lcccccccCC...',
        '...CCCCCCbBCC...']],
      up: [[
        '...lcccccccCC...',
        '..lcccccccccCC..',
        '..lcccccccccCC..',
        '..lccccccccCCC..',
        '...lccccccccC...',
        '...lcccccccCC...',
        '...CCCCCCCCCC...'], [
        '...lcccccccCC...',
        '..lcccccccccCC..',
        '..lcccccccccCC..',
        '..lccccccccCCC..',
        '...lccccccccC...',
        '...lccccccccC...',
        '...CCCCCCCCCC...'], [
        '...lcccccccCC...',
        '..lcccccccccCC..',
        '..lcccccccccCC..',
        '..lccccccccCCC..',
        '...lccccccccC...',
        '...lcccccccCC...',
        '...CCCCCCCCCC...']],
      side: [[
        '.....lccuC......',
        '....lcllcC......',
        '....lcllcCC.....',
        '....lcsscCC.....',
        '....lccccCC.....',
        '....lccccCCC....',
        '....CCCCCBbb....'], [
        '.....lccuC......',
        '....lccllC......',
        '....lcccllC.....',
        '....lcccssC.....',
        '....lccccCC.....',
        '...lccccCCCC....',
        '...CCCCbbCCC....']],
    },
    dress: {
      down: [[
        '...lcluuuulcC...',
        '...lCcccccccC...',
        '...sCcAaaAcCs...',
        '...lcccccccCC...',
        '..lccclcccccCC..',
        '..lccccccccCCC..',
        '....BBb..bBB....'], [
        '...lcluuuulcC...',
        '...lCcccccccC...',
        '...sCcAaaAcCC...',
        '...lcccccccCs...',
        '..lccclcccccCC..',
        '..lccccccccCCC..',
        '....BBb.........'], [
        '...lcluuuulcC...',
        '...lCcccccccC...',
        '...lCcAaaAcCs...',
        '...scccccccCC...',
        '..lccclcccccCC..',
        '..lccccccccCCC..',
        '.........bBB....']],
      up: [[
        '...lcccccccCC...',
        '...lCccccccCC...',
        '...sCAaaaaACs...',
        '...lcccAAccCC...',
        '..lcccccccccCC..',
        '..lccccccccCCC..',
        '....BBb..bBB....'], [
        '...lcccccccCC...',
        '...lCccccccCC...',
        '...sCAaaaaACC...',
        '...lcccAAccCs...',
        '..lcccccccccCC..',
        '..lccccccccCCC..',
        '....BBb.........'], [
        '...lcccccccCC...',
        '...lCccccccCC...',
        '...lCAaaaaACs...',
        '...scccAAccCC...',
        '..lcccccccccCC..',
        '..lccccccccCCC..',
        '.........bBB....']],
      side: [[
        '.....lcuuC......',
        '.....lcllC......',
        '.....AasaA......',
        '.....lcccCC.....',
        '....lccccCCC....',
        '....lcccccCCC...',
        '......BBbbb.....'], [
        '.....lcuuC......',
        '.....lccllC.....',
        '.....AaaAss.....',
        '.....lcccCC.....',
        '....lccccCCC....',
        '...lcccccCCCC...',
        '.....BB..bBB....']],
    },
  };

  /* ======================= EXTRAS =======================
     each: { dir: [rows...], at: firstRow } — drawn over head+body */
  const EXTRAS = {
    beard: {
      down: { at: 11, rows: [
        '...VWWWWWWWWV...',
        '...VWWWWWWWWV...',
        '....VWWWWWWV....',
        '.....VWWWWV.....',
        '......VWWV......'] },
      side: { at: 10, rows: [
        '..........WW....',
        '........VWWWV...',
        '.......VWWWWV...',
        '.......VWWWV....',
        '........VWV.....',
        '.........V......'] },
    },
    hat: {
      down: { at: 2, rows: [
        '.....tttttt.....',
        '....tttttttT....',
        '....tttggttT....',
        '....AaaaaaAA....',
        '.TttttttttttttT.',
        '..TTTTTTTTTTTT..'] },
      up: { at: 2, rows: [
        '.....tttttt.....',
        '....tttttttT....',
        '....ttttttTT....',
        '....AaaaaaAA....',
        '.TttttttttttttT.',
        '..TTTTTTTTTTTT..'] },
      side: { at: 2, rows: [
        '....tttttt......',
        '...tttttttT.....',
        '...ttttttTT.....',
        '...AaaaaaAA.....',
        '.TtttttttttttT..',
        '..TTTTTTTTTTT...'] },
    },
    cap: {
      down: { at: 3, rows: [
        '....tttttttt....',
        '...tggttttttT...',
        '..tttttttttttT..',
        '..TTTTTTTTTTTT..',
        '...TTTTTTTTTT...'] },
      up: { at: 3, rows: [
        '....tttttttt....',
        '...tggttttttT...',
        '..tttttttttttT..',
        '..ttttttttttTT..',
        '..TTTTTTTTTTTT..'] },
      side: { at: 3, rows: [
        '....ttttttt.....',
        '...tggtttttT....',
        '..ttttttttttT...',
        '..TTTTTTTTTTTTTT'] },
    },
    goggles: {
      down: { at: 6, rows: [
        '..aGGGaaaaGGGa..',
        '..aGnGaAAaGnGa..'] },
      up: { at: 7, rows: ['..aaaaaaaaaaaa..'] },
      side: { at: 6, rows: [
        '.........aGGGa..',
        '..aaaaaaaaGnGa..'] },
    },
    scarf: {
      down: { at: 13, rows: [
        '...fffffffffF...',
        '........fF......',
        '........fF......',
        '........FF......'] },
      up: { at: 13, rows: ['...fffffffffF...'] },
      side: { at: 13, rows: [
        '.....fffffF.....',
        '....fF..........',
        '...fF...........'] },
    },
    apron: {
      down: { at: 14, rows: [
        '.....WWWWWW.....',
        '.....WWWWWV.....',
        '.....WWWWWV.....',
        '.....WWWWWV.....',
        '.....VWWWVV.....'] },
      side: { at: 14, rows: [
        '.........W......',
        '.........WW.....',
        '.........WW.....',
        '.........WV.....'] },
    },
    belt: {
      down: { at: 16, rows: ['..........bB....'] },
      side: { at: 16, rows: ['....bB..........'] },
    },
    patch: {
      down: { at: 15, rows: ['....QQ..........', '...........QQ...'] },
      up: { at: 14, rows: ['.........QQ.....', '....QQ..........'] },
      side: { at: 15, rows: ['.......QQ.......'] },
    },
    stars: {
      down: { at: 14, rows: ['....g.....g.....', '..........a.....', '.......a........', '....a......g....', '.........a......'] },
      up: { at: 14, rows: ['...g......a.....', '.......a........', '..........g.....', '....a...........', '........a.......'] },
      side: { at: 14, rows: ['.....g..........', '.......a........', '.....a..........', '........g.......'] },
    },
    cord: {
      down: { at: 16, rows: ['....AaaaaaaA....', '.........a......', '.........g......'] },
      side: { at: 16, rows: ['....AaaaaA......', '......a.........'] },
    },
    pendant: {
      down: { at: 14, rows: ['.......gg.......', '.......aA.......'] },
    },
  };

  /* ======================= assembly ======================= */
  const grids = new Map();
  const G2 = (rows) => { let g = grids.get(rows); if (!g) { g = A.grid(rows); grids.set(rows, g); } return g; };

  function compose(L, dir, frame) {
    const g = A.blank(W, H);
    const side = dir === 'right' || dir === 'left';
    const d = side ? 'side' : dir;
    const body = BODIES[L.outfit || 'tunic'][d];
    const bi = side ? (frame % 2) : frame === 1 ? 1 : frame === 3 ? 2 : 0;
    A.blit(g, G2(body[bi]), 0, 13);
    A.blit(g, G2(HEADS[L.style || 'short'][d]), 0, 0);
    for (const ex of L.extras || []) {
      const e = EXTRAS[ex] && EXTRAS[ex][d];
      if (e) A.blit(g, G2(e.rows), 0, e.at);
    }
    // step frames: the body dips a pixel? (SNES walk cycles keep the head still)
    A.outline(g);
    return dir === 'left' ? A.flip(g) : g;
  }

  function palette(L) {
    const T = (c, n, s) => A.tones(c, n, s);
    const hair = T(L.hair || '#5a4030', 3, 0.36);
    const skin = A.tones(L.skin || '#f0c098', 4, 0.26);
    const cloth = T(L.cloth || '#506080');
    const under = T(L.under || '#e8e4dc', 3, 0.22);
    const pants = T(L.pants || '#3a3550');
    const boots = T(L.boots || '#5a3424');
    const acc = T(L.accent || '#d8a840', 3, 0.3);
    const hat = T(L.hatColor || '#3a3448');
    const scarf = T(L.scarf || '#c04a4a');
    const hood = T(L.hood || L.cloth || '#506080', 3, 0.3);
    const white = T(L.white || '#eeeae2', 3, 0.22);
    const glass = T(L.glass || '#60e0f0', 3, 0.35);
    return {
      k: L.ink || '#180f1c',
      H: hair[0], h: hair[1], y: hair[2],
      S: skin[0], s: skin[1], z: skin[2],
      e: L.hollowEyes ? '#d8f0ff' : '#1c1428',
      C: cloth[0], c: cloth[1], l: cloth[2],
      U: under[0], u: under[2],
      P: pants[0], p: pants[1],
      B: boots[0], b: boots[1],
      A: acc[0], a: acc[1], g: acc[2],
      T: hat[0], t: hat[1],
      F: scarf[0], f: scarf[1],
      O: hood[0], o: hood[1], q: hood[2],
      X: white[0], V: white[1], W: white[2],
      G: glass[1], n: '#f0ffff',
      Q: L.patch || A.tones(L.cloth || '#506080', 3, 0.5)[2],
    };
  }

  /* ======================= public API ======================= */
  const cache = {};
  const sprites = (G.sprites = G.sprites || {});
  sprites.CHAR_W = W; sprites.CHAR_H = H;
  sprites.charParts = { HEADS, BODIES, EXTRAS, palette };
  sprites.char = function (lookId) {
    if (cache[lookId]) return cache[lookId];
    const L = G.data.looks[lookId];
    if (!L) throw new Error('unknown look ' + lookId);
    let out;
    if (L.custom) out = L.custom();
    else {
      const pal = palette(L);
      out = {};
      for (const dir of ['down', 'up', 'left', 'right']) {
        out[dir] = [0, 1, 2, 3].map((f) => A.paint(compose(L, dir, f), pal));
      }
    }
    return (cache[lookId] = out);
  };
  /* dialog portrait: the sprite's head and shoulders, framed */
  sprites.portraitCache = {};
  sprites.portrait = function (lookId) {
    if (this.portraitCache[lookId]) return this.portraitCache[lookId];
    const fr = sprites.char(lookId).down[0];
    const { c, x } = G.gfx.makeCanvas(20, 20);
    x.drawImage(fr, 2, fr.height > 16 ? 20 - fr.height + 3 : 3);
    return (this.portraitCache[lookId] = G.gfx.toDataURL(c, 4));
  };

  /* ---------- Cog: a little brass lantern with one big eye ---------- */
  const COG = [
    '.....kk.....',
    '....kAak....',
    '...kAggak...',
    '..kkkkkkkk..',
    '.kAaaaaaaAk.',
    '.kAoooooqAk.',
    '.kaoeeeooak.',
    '.kaoennoqak.',
    '.kaoeeeooak.',
    '.kAoooooqAk.',
    '.kAaaaaaaAk.',
    '..kkAaaAkk..',
    '....kAAk....',
    '.....kk.....'];
  const COG_BLINK = COG.slice(); COG_BLINK[6] = '.kaoooooqak.'; COG_BLINK[7] = '.kaoeeeooak.'; COG_BLINK[8] = '.kaoooooqak.';
  function cogSprite(dim, blink) {
    const acc = A.tones('#d9a441', 3, 0.3);
    const glass = dim ? ['#6a5030', '#8a6a3a', '#a88a50'] : ['#f0a030', '#ffd060', '#fff2b0'];
    return A.paint(A.grid(blink ? COG_BLINK : COG), { k: '#1c1208', A: acc[0], a: acc[1], g: acc[2], o: glass[1], q: glass[2], e: '#3a1c08', n: dim ? '#c0a070' : '#ffffff' });
  }

  /* ---------- Looks: every person in Orrenth ---------- */
  const L = (id, def) => G.register('looks', id, def);
  const SK = { light: '#f4c4a0', fair: '#f8d4bc', mid: '#d89c74', tan: '#b87a54', deep: '#8a5a3e', pale: '#cfd5e4' };

  // party
  L('wren', { hair: '#8c5ae6', skin: SK.light, cloth: '#3460c8', under: '#e8ecf6', accent: '#f0c050', pants: '#2b2f4a', boots: '#5a3424', outfit: 'cloak', style: 'short', extras: ['patch', 'pendant'], patch: '#6a8ae0' });
  L('pip', { hair: '#ee7a30', skin: SK.fair, cloth: '#8a6440', accent: '#d9a441', pants: '#4a4a5a', boots: '#4a3020', style: 'spiky', extras: ['goggles', 'belt'] });
  L('vesper', { hair: '#3a2048', skin: SK.mid, cloth: '#3a2a4a', hood: '#4a2c5a', accent: '#b8e060', pants: '#241c2c', style: 'hood', outfit: 'coat', extras: ['scarf'], scarf: '#a03a6a' });
  L('hollis', { hair: '#5a4a3a', skin: SK.tan, cloth: '#8e8e9a', accent: '#d0a860', pants: '#6a6a74', style: 'bald', outfit: 'robe', extras: ['cord'] });
  L('cog', { custom: () => { const f = cogSprite(false), bl = cogSprite(false, true); return { down: [f, f, f, bl], up: [f, f, f, f], left: [f, f, f, f], right: [f, f, f, f] }; } });
  L('cogDim', { custom: () => { const f = cogSprite(true); const a = [f, f, f, f]; return { down: a, up: a, left: a, right: a }; } });

  // the Conservatory
  L('aldrith', { hair: '#b8bed4', skin: SK.light, cloth: '#283a90', accent: '#f0d070', white: '#eef0f6', style: 'long', outfit: 'robe', extras: ['beard', 'stars'] });
  L('cassian', { hair: '#a0602c', skin: SK.mid, cloth: '#3460c8', under: '#e8ecf6', accent: '#e8e8f0', outfit: 'cloak', style: 'short' });
  L('idris', { hair: '#22202e', skin: SK.fair, cloth: '#d8dcee', under: '#3a3f6a', accent: '#3460c8', pants: '#3a3f6a', outfit: 'coat', style: 'short' });
  L('neve', { hair: '#c8dcf2', skin: SK.fair, cloth: '#55658a', accent: '#a0c0e0', outfit: 'cloak', under: '#c8d4ea', style: 'long' });
  L('student1', { hair: '#3a2a1a', skin: SK.deep, cloth: '#3460c8', under: '#e8ecf6', outfit: 'cloak', style: 'short' });
  L('student2', { hair: '#e8c870', skin: SK.light, cloth: '#3460c8', under: '#e8ecf6', outfit: 'cloak', style: 'bun' });
  L('scholar', { hair: '#8a8a9a', skin: SK.tan, cloth: '#4a3a6a', accent: '#f0d070', white: '#c0c0cc', style: 'bald', outfit: 'robe', extras: ['beard'] });
  L('quartermaster', { hair: '#5a3a2a', skin: SK.mid, cloth: '#6a5a3a', accent: '#d9a441', white: '#e8dcc0', style: 'ponytail', extras: ['apron'] });

  // Pennywhistle Harbor
  L('tilda', { hair: '#f2c860', skin: SK.light, cloth: '#d06a50', accent: '#ffe0a0', white: '#f8f4ea', style: 'bun', outfit: 'dress', extras: ['apron'] });
  L('isolde', { hair: '#2a2230', skin: SK.mid, cloth: '#962e2e', accent: '#e0b040', hatColor: '#262436', outfit: 'coat', style: 'long', extras: ['hat'] });
  L('fennick', { hair: '#ececec', skin: SK.tan, cloth: '#3a7050', hatColor: '#6a5038', white: '#f4f4f4', style: 'short', extras: ['beard', 'cap'] });
  L('innkeep', { hair: '#7a3a24', skin: SK.light, cloth: '#5a8a3a', style: 'bun', outfit: 'dress', extras: ['apron'] });
  L('grocer', { hair: '#2a2a2a', skin: SK.deep, cloth: '#b0702a', hatColor: '#d09a40', extras: ['cap', 'apron'] });
  L('lighter', { hair: '#b04a24', skin: SK.fair, cloth: '#e08030', hatColor: '#3a3a4a', extras: ['cap', 'belt'] });
  L('fisher', { hair: '#3a3a2a', skin: SK.tan, cloth: '#3a6a8a', hatColor: '#e0c040', outfit: 'coat', extras: ['hat'] });
  L('kid', { hair: '#d08a40', skin: SK.light, cloth: '#7ab8e0', pants: '#5a4a3a', style: 'spiky' });
  L('granny', { hair: '#d8d8e0', skin: SK.light, cloth: '#8a4a7a', style: 'bun', outfit: 'dress', extras: ['scarf'], scarf: '#c0a0d0' });
  L('dockhand', { hair: '#1a1a1a', skin: SK.deep, cloth: '#6a4a3a', style: 'short', extras: ['scarf', 'belt'], scarf: '#d0a040' });
  L('hollowed', { hair: '#9a9aa8', skin: SK.pale, cloth: '#6a6a7a', style: 'long', hollowEyes: true });

  /* ---------- Speakers (dialog names, portraits, voice pitch) ---------- */
  G.speakers = G.speakers || {};
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
