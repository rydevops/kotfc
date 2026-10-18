/* =========================================================================
   music-more.js — the soundtrack for Acts II-IV.
   Same notation as music.js (chords by bar, lead as "Note-Steps").
   ========================================================================= */
(function () {
  'use strict';
  const S = (id, def) => G.register('songs', id, def);

  // Hullhaven — a rusty shanty with a slow swagger.
  S('hullhaven', {
    bpm: 98, chords: 'Dm|Dm|Bb|C|Dm|Gm|A|Dm',
    lead: 'D5-4 F5-4 A5-4 F5-4  D5-6 E5-2 F5-8  D5-4 F5-4 Bb5-4 A5-4  G5-4 E5-4 C5-8 ' +
          'D5-4 F5-4 A5-4 D6-4  Bb5-6 A5-2 G5-8  A5-4 C#6-4 E6-4 C#6-4  D6-8 A5-4 F5-4',
    transpose: -12, leadWave: 'pulse25', leadVol: 0.1, bass: 'walk', arp: 'stab', arpWave: 'pulse12', arpVol: 0.03, drums: 'march',
  });

  // Tallow Cay — a sly, smoky market tune.
  S('tallow', {
    bpm: 108, chords: 'Am|F|Dm|E|Am|C|Dm E|Am',
    lead: 'E5-2 r-2 A5-2 C6-2 B5-2 A5-2 E5-4  F5-2 r-2 A5-2 C6-2 A5-2 F5-2 C5-4  D5-2 F5-2 A5-4 G5-2 F5-2 E5-2 D5-2  E5-4 G#5-4 B5-4 G#5-2 E5-2 ' +
          'A5-2 C6-2 E6-4 D6-2 C6-2 B5-2 A5-2  C6-4 E6-4 G6-4 E6-2 C6-2  D6-4 C6-2 A5-2 G#5-4 B5-4  A5-8 r-4 E5-2 A5-2',
    transpose: -12, leadWave: 'pulse12', leadVol: 0.1, bass: 'sneak', bassVol: 0.2, arp: 'stab', arpVol: 0.025, drums: 'sneak',
  });

  // Dimmerrow — the island where the Current died first.
  S('dimmerrow', {
    bpm: 64, chords: 'Em|C|Am|B|Em|C|Am B|Em',
    lead: 'B5-8 G5-4 E5-4  G5-12 r-4  E5-8 A5-8  F#5-12 r-4  B5-8 E6-4 D6-4  C6-8 G5-8  A5-8 B5-4 F#5-4  E5-16',
    transpose: -12, leadWave: 'triangle', leadVol: 0.15, bass: 'drone', arp: 'slow', arpWave: 'triangle', arpVol: 0.03,
  });

  // Marn's lullaby — she does not remember where she learned it.
  S('lullaby', {
    bpm: 72, beats: 3, chords: 'C|G|Am|F|C|G|F|C',
    lead: 'E5-4 G5-4 E5-4  D5-4 B4-4 D5-4  C5-4 E5-4 A5-4  A5-8 F5-4  E5-4 G5-4 C6-4  B5-8 G5-4  A5-4 F5-4 A5-4  G5-4 E5-8',
    transpose: -12, leadWave: 'triangle', leadVol: 0.14, bass: 'waltz', bassVol: 0.14, arp: 'waltz', arpWave: 'triangle', arpVol: 0.02,
  });

  // Hushwell Sanctuary — still pools and humming stones.
  S('hushwell', {
    bpm: 78, chords: 'G|Em|C|D|G|Em|Am|D',
    lead: 'B5-8 D6-4 B5-4  G5-8 B5-8  E6-6 D6-2 C6-8  D6-8 A5-8  B5-4 D6-4 G6-8  E6-8 B5-4 G5-4  A5-6 C6-2 E6-8  D6-12 r-4',
    transpose: -12, leadWave: 'triangle', leadVol: 0.15, bass: 'drone', arp: 'pad', arpWave: 'triangle', arpVol: 0.03,
  });

  // The Quiet Heron — a gentle sailing song for the one ship that still flies.
  S('heron', {
    bpm: 92, chords: 'G|Em|C|D|G|Em|C D|G',
    lead: 'D5-4 G5-4 B5-4 D6-4  B5-8 G5-4 E5-4  G5-4 C6-4 E6-4 C6-4  D6-8 A5-4 F#5-4  G5-4 B5-4 D6-4 G6-4  E6-8 B5-4 G5-4  C6-4 E6-4 D6-4 A5-4  G5-12 r-4',
    transpose: -12, leadWave: 'triangle', leadVol: 0.15, bass: 'roll', arp: 'sparkle', arpVol: 0.02, drums: 'ferry',
  });

  // Aurelith — drowned gold and slow motes.
  S('aurelith', {
    bpm: 84, chords: 'Bm|G|D|A|Bm|G|Em A|Bm',
    lead: 'F#5-8 B5-4 D6-4  B5-8 G5-8  A5-4 D6-4 F#6-8  E6-8 C#6-8  D6-8 F#6-4 B5-4  D6-8 B5-8  G5-4 B5-4 E6-4 C#6-4  B5-16',
    transpose: -12, leadWave: 'triangle', leadVol: 0.15, bass: 'roll', arp: 'sparkle', arpVol: 0.025, drums: 'tick',
  });

  // The Foundry — the oldest machines in the world, still running.
  S('foundry', {
    bpm: 126, chords: 'Em|Em|C|D|Em|Em|C D|Em',
    lead: 'E5-2 r-2 E5-2 G5-2 B5-4 A5-2 G5-2  E5-2 r-2 G5-2 B5-2 E6-4 D6-4  C6-2 r-2 C6-2 E6-2 G6-4 E6-2 C6-2  D6-4 F#6-4 A5-4 D6-4 ' +
          'B5-2 r-2 B5-2 E6-2 G6-4 F#6-2 E6-2  E6-2 r-2 D6-2 B5-2 G5-4 B5-4  C6-4 E6-4 D6-4 F#6-4  E6-12 r-4',
    transpose: -12, leadWave: 'pulse25', leadVol: 0.1, bass: 'drive', bassWave: 'sawtooth', bassVol: 0.08, arp: 'stab', arpVol: 0.02, drums: 'boss',
  });

  // The Core — the heart of every tap, vast and bright.
  S('core', {
    bpm: 72, chords: 'Am|F|C|G|Am|F|Dm E|Am',
    lead: 'A5-8 C6-4 E6-4  F6-8 A5-8  G5-4 C6-4 E6-8  D6-8 B5-8  A5-8 E6-4 A6-4  F6-8 C6-8  D6-4 F6-4 A6-4 E6-4  A6-16',
    transpose: -12, leadWave: 'triangle', leadVol: 0.16, bass: 'drone', arp: 'pad', arpWave: 'triangle', arpVol: 0.035,
  });

  // The last fight.
  S('finale', {
    bpm: 172, chords: 'Dm|Bb|Gm|A|Dm|Bb|C|A',
    lead: 'D6-2 F6-2 A6-2 D7-2 C7-4 A6-4  Bb6-2 A6-2 F6-2 D6-2 Bb5-8  G6-2 Bb6-2 D7-2 G7-2 F7-4 D7-4  E7-4 C#7-4 A6-8 ' +
          'D7-2 F7-2 A7-4 G7-2 F7-2 D7-4  Bb6-4 D7-4 F7-4 D7-4  C7-2 E7-2 G7-4 E7-2 C7-2 G6-4  A6-4 C#7-4 E7-4 A7-4',
    transpose: -12, bass: 'drive', bassWave: 'sawtooth', bassVol: 0.09, arp: 'up16', arpVol: 0.02, drums: 'boss', leadVol: 0.11,
  });

  // Goodbyes.
  S('farewell', {
    bpm: 58, chords: 'Am|F|C|G|Am|Dm|E|Am',
    lead: 'E5-8 A5-8  C6-8 A5-4 F5-4  G5-8 E5-8  D5-8 G5-8  E5-8 A5-8  F5-8 D5-8  E5-8 G#5-8  A5-16',
    transpose: -12, leadWave: 'triangle', leadVol: 0.16, bass: 'drone', arp: 'slow', arpWave: 'triangle', arpVol: 0.03,
  });

  // After the storm — the title theme, warmer, with a little more sky in it.
  S('epilogue', Object.assign({}, G.data.songs.title, { bpm: 80, drums: 'none', arp: 'slow', bass: 'root4', leadWave: 'triangle', leadVol: 0.16 }));
})();
