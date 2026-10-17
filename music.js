/* =========================================================================
   music.js — the soundtrack. Original compositions in a compact notation.

   chords : bars separated by "|"; a bar may hold several chords (split evenly)
   lead   : melody tokens "Note-Steps" (16th-note steps), "r-4" is a rest
   bass / arp / drums : pattern names from audio.js
   beats  : beats per bar (4 = 4/4, 3 = waltz)
   transpose : semitones applied to lead / counter
   ========================================================================= */
(function () {
  'use strict';
  const S = (id, def) => G.register('songs', id, def);

  // "Orrenth" — the intro cutscene. Slow and wistful.
  S('intro', {
    bpm: 70, chords: 'Dm|Bb|F|C|Dm|Bb|C|A',
    lead: 'A4-8 D5-4 E5-4  F5-8 D5-8  C5-4 F5-4 A5-8  G5-12 E5-4  F5-8 E5-4 D5-4  D5-8 F5-4 Bb5-4  A5-8 G5-4 E5-4  E5-8 C#5-4 A4-4',
    leadWave: 'triangle', leadVol: 0.16, bass: 'drone', arp: 'slow', arpWave: 'pulse25', arpVol: 0.04,
  });

  // "Key of the Fading Current" — main theme / title.
  S('title', {
    bpm: 92, chords: 'C|G|Am|F|C|G|F G|C|Am|Em|F|C|Dm|G|Am F|G',
    lead: 'E5-4 G5-4 C6-6 B5-2  D6-4 B5-4 G5-8  A5-4 C6-4 E6-6 D6-2  C6-6 A5-2 F5-8 ' +
          'E5-4 G5-4 C6-4 E6-4  D6-6 C6-2 B5-4 G5-4  A5-4 C6-4 B5-4 D6-4  C6-12 r-4 ' +
          'A5-6 B5-2 C6-4 E6-4  B5-8 G5-4 E5-4  F5-4 A5-4 C6-4 F6-4  E6-8 r-4 C6-4 ' +
          'D6-4 F6-4 A5-4 D6-4  B5-6 D6-2 G6-8  E6-4 C6-4 F6-4 C6-4  D6-8 B5-4 G5-4',
    transpose: -12, bass: 'root8', arp: 'up8', drums: 'soft', leadVol: 0.12,
  });

  // Act end — the theme, slowed down and gentle.
  S('actEnd', Object.assign({}, G.data.songs.title, { bpm: 66, drums: 'none', arp: 'slow', bass: 'drone', leadWave: 'triangle', leadVol: 0.16 }));

  // Pennywhistle Harbor — a warm, lilting waltz.
  S('harbor', {
    bpm: 138, beats: 3, chords: 'F|C|Dm|Bb|F|C|Bb C|F',
    lead: 'A5-4 C6-2 A5-2 F5-4  G5-4 E5-4 C5-4  D5-2 F5-2 A5-4 D6-4  C6-6 Bb5-2 A5-4 ' +
          'A5-4 C6-2 F6-2 E6-4  G6-4 E6-4 C6-4  D6-2 C6-2 Bb5-2 E6-2 D6-2 C6-2  F6-8 r-4',
    transpose: -12, bass: 'waltz', arp: 'waltz', drums: 'waltz', leadVol: 0.11, arpVol: 0.03,
  });

  // Pennywhistle after the failure — the same island, gone cold.
  S('harborDark', {
    bpm: 76, beats: 3, chords: 'Dm|Bb|Gm|A|Dm|Bb|Gm|A',
    lead: 'F5-4 A5-4 F5-4  D5-8 r-4  G5-4 Bb5-4 D6-4  C#6-8 r-4  A5-4 F5-2 E5-2 D5-4  F5-8 D5-4  Bb5-4 A5-4 G5-4  A5-12',
    transpose: -12, leadWave: 'triangle', leadVol: 0.15, bass: 'drone', arp: 'slow', arpVol: 0.03,
  });

  // The Astral Conservatory — starlight and sparkling arpeggios.
  S('conservatory', {
    bpm: 96, chords: 'Em|C|G|D|Em|C|Am B|Em',
    lead: 'B5-6 G5-2 E5-8  E5-4 G5-4 C6-4 B5-4  D6-6 B5-2 G5-8  F#5-4 A5-4 D6-8 ' +
          'G6-6 F#6-2 E6-4 B5-4  C6-4 E6-4 G6-4 E6-4  A5-4 C6-4 B5-4 D#6-4  E6-12 r-4',
    transpose: -12, bass: 'walk', arp: 'sparkle', arpVol: 0.025, drums: 'tick', leadVol: 0.1,
  });

  // Sneaking through the Conservatory at night.
  S('sneak', {
    bpm: 112, chords: 'Am|Am|F|E|Am|Am|Dm|E',
    lead: 'r-4 E5-2 r-2 A5-2 r-2 C6-2 r-2  B5-2 r-2 A5-2 r-2 E5-4 r-4  r-4 F5-2 r-2 A5-2 r-2 C6-2 r-2  B5-4 G#5-4 E5-4 r-4 ' +
          'r-4 E5-2 r-2 A5-2 r-2 C6-2 r-2  E6-2 r-2 D6-2 r-2 C6-4 r-4  D6-2 r-2 F6-2 r-2 A5-4 r-4  G#5-8 B5-8',
    transpose: -12, leadWave: 'pulse12', leadVol: 0.1, bass: 'sneak', bassVol: 0.22, drums: 'sneak',
  });

  // Battle!
  S('battle', {
    bpm: 152, chords: 'Am|F|G|E|Am|F|Dm|E',
    lead: 'A5-2 A5-2 C6-2 E6-4 D6-2 C6-2 B5-2  C6-4 A5-4 F5-4 A5-4  B5-2 B5-2 D6-2 G6-4 F6-2 E6-2 D6-2  E6-6 D6-2 B5-4 G#5-4 ' +
          'A5-2 C6-2 E6-2 A6-6 G6-2 E6-2  F6-4 E6-4 C6-4 A5-4  D6-4 F6-4 A6-4 F6-4  E6-8 G#6-4 B6-4',
    transpose: -12, bass: 'drive', arp: 'up16', arpVol: 0.022, drums: 'battle', leadVol: 0.11,
  });

  // Boss battle — heavier and faster.
  S('boss', {
    bpm: 164, chords: 'Dm|Bb|C|A|Dm|Bb|Gm A|Dm',
    lead: 'D6-2 r-2 D6-2 F6-2 A6-4 G6-2 F6-2  F6-4 D6-4 Bb5-8  C6-2 r-2 C6-2 E6-2 G6-4 F6-2 E6-2  E6-4 C#6-4 A5-8 ' +
          'D6-2 F6-2 A6-2 D7-2 C7-4 A6-4  Bb6-4 A6-4 F6-4 D6-4  G6-4 Bb6-4 A6-4 C#7-4  D7-8 r-8',
    transpose: -12, bass: 'drive', bassWave: 'sawtooth', bassVol: 0.09, arp: 'up16', arpVol: 0.02, drums: 'boss', leadVol: 0.11,
  });

  // Victory fanfare (plays once).
  S('victory', {
    bpm: 150, chords: 'C|F|G|C', loop: false,
    lead: 'G5-2 C6-2 E6-2 G6-6 E6-4  F6-4 A6-4 C7-8  B6-2 A6-2 G6-2 F6-2 D6-4 B5-4  C7-12 r-4',
    transpose: -12, bass: 'root4', arp: 'up8', drums: 'march', leadVol: 0.12,
  });

  // Ferry crossings — gentle sailing across the sky.
  S('ferry', {
    bpm: 100, chords: 'G|D|Em|C|G|D|C D|G',
    lead: 'D5-4 G5-4 B5-6 A5-2  A5-8 F#5-4 D5-4  E5-4 G5-4 B5-4 E6-4  D6-6 C6-2 G5-8 ' +
          'B5-4 D6-4 G6-6 F#6-2  E6-4 D6-4 A5-8  G5-4 E5-4 F#5-4 A5-4  G5-12 r-4',
    transpose: -12, bass: 'roll', arp: 'none', drums: 'ferry', leadWave: 'triangle', leadVol: 0.16,
  });

  // Aldrith — warm on the surface, something wrong underneath.
  S('aldrith', {
    bpm: 80, chords: 'C|Fm|C|Ab G|C|Fm|Ab|G',
    lead: 'G5-8 E5-4 C5-4  Ab5-8 F5-4 C5-4  G5-4 C6-4 B5-4 G5-4  Ab5-8 G5-8  E6-8 D6-4 C6-4  C6-8 Ab5-4 F5-4  Eb5-8 Ab5-8  G5-16',
    transpose: -12, leadWave: 'triangle', leadVol: 0.15, bass: 'drone', arp: 'pad', arpWave: 'triangle', arpVol: 0.03,
  });

  // Game over.
  S('gameover', {
    bpm: 60, chords: 'Am|F|Dm|E',
    lead: 'E5-8 C5-8  A4-16  F5-8 D5-8  E5-16',
    leadWave: 'triangle', leadVol: 0.16, bass: 'drone', arp: 'slow', arpVol: 0.03,
  });
})();
