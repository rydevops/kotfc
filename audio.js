/* =========================================================================
   audio.js — a tiny chiptune engine built on WebAudio.
   No audio files: every song and sound effect is synthesized live.

   Songs (see music.js) are described by a chord progression and a melody;
   the engine generates bass, arpeggios and drums from named patterns.
   iOS: audio can only start after a user gesture, so the boot screen asks
   the player to tap the lantern, which calls G.audio.unlock().
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;

  const SETTINGS_KEY = 'kfc_settings';
  let settings = { music: 0.6, sfx: 0.8 };
  try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) {}

  let ctx = null, master, musicBus, sfxBus, noiseBuf, waves = {};
  let song = null; // currently playing compiled song
  let timer = null;

  /* ---------- note & chord helpers ---------- */
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function noteToMidi(n) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
    if (!m) return null;
    let s = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 12 * (parseInt(m[3], 10) + 1) + s;
  }
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const QUAL = {
    '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11],
    dim: [0, 3, 6], sus4: [0, 5, 7], sus2: [0, 2, 7], aug: [0, 4, 8], m6: [0, 3, 7, 9], 6: [0, 4, 7, 9],
  };
  function parseChord(sym) {
    const m = /^([A-G])([#b]?)(.*)$/.exec(sym);
    const root = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return { root: (root + 12) % 12, ivs: QUAL[m[3]] || QUAL[''] };
  }

  /* ---------- pattern libraries ----------
     Each returns note events for one chord span: [{s:step, d:dur, m:midi, v:vol}] */
  const tone = (c, deg, oct) => { // deg: index into chord (wraps upward)
    const n = c.ivs.length;
    return 12 * (oct + 1) + c.root + c.ivs[((deg % n) + n) % n] + 12 * Math.floor(deg / n);
  };
  const BASS = {
    none: () => [],
    root4: (c, span) => range(0, span, 4).map((s) => ({ s, d: 3, m: tone(c, 0, 2) })),
    root8: (c, span) => range(0, span, 2).map((s, i) => ({ s, d: 2, m: tone(c, 0, 2) + (i % 2 ? 12 : 0) })),
    walk: (c, span) => range(0, span, 4).map((s, i) => ({ s, d: 3, m: tone(c, [0, 2, 3, 2][i % 4], 2) })),
    drone: (c, span) => [{ s: 0, d: span, m: tone(c, 0, 2) }],
    waltz: (c, span) => range(0, span, 12).map((s) => ({ s, d: 4, m: tone(c, 0, 2) })),
    sneak: (c, span) => [0, 3, 6, 8, 11, 14].filter((s) => s < span).map((s) => ({ s, d: 1, m: tone(c, s === 8 ? 2 : 0, 2) })),
    drive: (c, span) => range(0, span, 2).map((s, i) => ({ s, d: 1.5, m: tone(c, 0, i % 4 === 3 ? 3 : 2) })),
    roll: (c, span) => range(0, span, 2).map((s, i) => ({ s, d: 2, m: tone(c, i % 2 ? 2 : 0, 2) })),
  };
  const ARP = {
    none: () => [],
    up16: (c, span) => range(0, span, 1).map((s, i) => ({ s, d: 1, m: tone(c, i % 4 === 3 ? 1 : i % 4, 4) })),
    up8: (c, span) => range(0, span, 2).map((s, i) => ({ s, d: 2, m: tone(c, [0, 1, 2, 3, 2, 1][i % 6], 4) })),
    sparkle: (c, span) => range(0, span, 1).map((s, i) => ({ s, d: 1, m: tone(c, [0, 1, 2, 3, 4, 3, 2, 1][i % 8], 5), v: 0.7 })),
    slow: (c, span) => range(0, span, 4).map((s, i) => ({ s, d: 6, m: tone(c, i % 3, 4) })),
    pad: (c, span) => [0, 1, 2].map((deg) => ({ s: 0, d: span, m: tone(c, deg, 4), v: 0.55 })),
    waltz: (c, span) => range(0, span, 12).flatMap((b) => [4, 8].flatMap((o) => [0, 1, 2].map((deg) => ({ s: b + o, d: 2, m: tone(c, deg, 4), v: 0.6 })))),
    stab: (c, span) => range(2, span, 4).flatMap((s) => [0, 1, 2].map((deg) => ({ s, d: 1, m: tone(c, deg, 4), v: 0.6 }))),
  };
  const DRUMS = {
    none: '',
    battle: 'k.h.s.h.k.k.s.hh',
    boss: 'k.hkskh.k.hks.sh',
    march: 'k...s...k.k.s...',
    soft: 'k.....h.s.....h.',
    tick: '..h...h...h...h.',
    waltz: 'k...h...h...',
    sneak: 'h..h..h.h..h..h.',
    ferry: 'k...h.h.s...h.h.',
    heart: 'k..k............',
  };
  function range(a, b, step) { const r = []; for (let i = a; i < b; i += step) r.push(i); return r; }

  function parseMelody(str, transpose) {
    const ev = [];
    let s = 0;
    for (const tok of str.trim().split(/\s+/)) {
      if (!tok) continue;
      const [n, d] = tok.split('-');
      const dur = parseFloat(d || '2');
      if (n !== 'r') {
        const m = noteToMidi(n);
        if (m != null) ev.push({ s, d: dur, m: m + transpose });
      }
      s += dur;
    }
    return { ev, len: s };
  }

  /* compile a song definition into per-step event buckets for one loop */
  function compile(def) {
    const beats = def.beats || 4, spb = beats * 4;
    const bars = def.chords.split('|').map((b) => b.trim().split(/\s+/));
    const loopSteps = bars.length * spb;
    const buckets = Array.from({ length: loopSteps }, () => []);
    const add = (voice, e, base) => {
      const st = Math.round(base + e.s);
      if (st < loopSteps) buckets[st].push({ voice, d: e.d, m: e.m, v: e.v == null ? 1 : e.v });
    };
    bars.forEach((chords, bi) => {
      const span = spb / chords.length;
      chords.forEach((sym, ci) => {
        const c = parseChord(sym), base = bi * spb + ci * span;
        (BASS[def.bass || 'root4'] || BASS.root4)(c, span).forEach((e) => add('bass', e, base));
        (ARP[def.arp || 'none'] || ARP.none)(c, span).forEach((e) => add('arp', e, base));
      });
      const dp = DRUMS[def.drums || 'none'] || '';
      if (dp) for (let i = 0; i < spb; i++) {
        const ch = dp[i % dp.length];
        if (ch !== '.') buckets[bi * spb + i].push({ voice: 'drum', k: ch });
      }
    });
    if (def.lead) {
      const mel = parseMelody(def.lead, def.transpose || 0);
      for (let off = 0; off < loopSteps; off += mel.len) mel.ev.forEach((e) => add('lead', e, off));
    }
    if (def.counter) {
      const mel = parseMelody(def.counter, def.transpose || 0);
      for (let off = 0; off < loopSteps; off += mel.len) mel.ev.forEach((e) => add('counter', e, off));
    }
    return { def, buckets, loopSteps, stepDur: 60 / (def.bpm || 100) / 4 };
  }

  /* ---------- synth voices ---------- */
  function pulseWave(duty) {
    if (waves[duty]) return waves[duty];
    const n = 64, real = new Float32Array(n), imag = new Float32Array(n);
    for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return (waves[duty] = ctx.createPeriodicWave(real, imag));
  }
  function osc(type, freq, t, dur, vol, dest, o = {}) {
    const g = ctx.createGain();
    const os = ctx.createOscillator();
    if (type === 'pulse25') os.setPeriodicWave(pulseWave(0.25));
    else if (type === 'pulse12') os.setPeriodicWave(pulseWave(0.125));
    else os.type = type;
    os.frequency.setValueAtTime(freq, t);
    if (o.slide) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + (o.slideT || dur));
    if (o.vib) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = o.vib; lg.gain.value = freq * 0.012;
      lfo.connect(lg); lg.connect(os.frequency);
      lfo.start(t + 0.08); lfo.stop(t + dur + 0.3);
    }
    const a = o.attack || 0.005, r = o.release || 0.06;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    if (o.decay) g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * (o.sustain || 0.3)), t + a + o.decay);
    g.gain.setValueAtTime(o.decay ? Math.max(0.0001, vol * (o.sustain || 0.3)) : vol, t + Math.max(a, dur - 0.001));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + r);
    os.connect(g); g.connect(dest);
    os.start(t); os.stop(t + dur + r + 0.02);
    return os;
  }
  function noise(t, dur, vol, dest, o = {}) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.filter || 'highpass';
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.freqTo) f.frequency.exponentialRampToValueAtTime(o.freqTo, t + dur);
    f.Q.value = o.q || 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  function drum(k, t, dest) {
    if (k === 'k') {
      const g = ctx.createGain(), o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(0.55, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.2);
    } else if (k === 's') {
      noise(t, 0.13, 0.22, dest, { freq: 1200 });
      osc('triangle', 190, t, 0.04, 0.15, dest, { slide: 120 });
    } else if (k === 'h') {
      noise(t, 0.035, 0.07, dest, { freq: 7000 });
    } else if (k === 'o') {
      noise(t, 0.14, 0.06, dest, { freq: 6000 });
    }
  }

  /* ---------- music scheduler ---------- */
  function scheduleLoop() {
    if (!song || !ctx) return;
    while (song.nextTime < ctx.currentTime + 0.15) {
      const step = song.step % song.loopSteps;
      const t = song.nextTime, d = song.def, sd = song.stepDur;
      for (const e of song.buckets[step]) {
        if (e.voice === 'drum') { drum(e.k, t, song.bus); continue; }
        const f = mtof(e.m), dur = e.d * sd;
        if (e.voice === 'lead') osc(d.leadWave || 'pulse25', f, t, dur * 0.92, (d.leadVol || 0.11) * e.v, song.bus, { vib: dur > 0.3 ? 5.5 : 0, release: 0.08 });
        else if (e.voice === 'counter') osc(d.counterWave || 'triangle', f, t, dur * 0.9, (d.counterVol || 0.08) * e.v, song.bus, { release: 0.06 });
        else if (e.voice === 'bass') osc(d.bassWave || 'triangle', f, t, dur * 0.9, (d.bassVol || 0.2) * e.v, song.bus, { release: 0.04 });
        else if (e.voice === 'arp') osc(d.arpWave || 'pulse12', f, t, dur * 0.8, (d.arpVol || 0.035) * e.v, song.bus, { release: d.arp === 'slow' || d.arp === 'pad' ? 0.5 : 0.03, attack: d.arp === 'pad' ? 0.3 : 0.005 });
      }
      song.step++;
      song.nextTime += sd;
      if (song.def.loop === false && song.step >= song.loopSteps) {
        const s = song; song = null; songId = null;
        setTimeout(() => { try { s.bus.disconnect(); } catch (e) {} }, 3000);
        return;
      }
    }
  }

  let songId = null;
  const compiled = {};

  const audio = (G.audio = {
    settings,
    get ready() { return !!ctx && ctx.state === 'running'; },
    unlock() {
      try {
        if (!ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          ctx = new AC();
          if (navigator.audioSession) { try { navigator.audioSession.type = 'playback'; } catch (e) {} }
          master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
          musicBus = ctx.createGain(); musicBus.gain.value = settings.music; musicBus.connect(master);
          sfxBus = ctx.createGain(); sfxBus.gain.value = settings.sfx; sfxBus.connect(master);
          noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
          const d = noiseBuf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
          // iOS: play a silent buffer inside the gesture to fully unlock
          const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0);
          timer = setInterval(scheduleLoop, 25);
          document.addEventListener('visibilitychange', () => {
            if (document.hidden) ctx.suspend(); else ctx.resume();
          });
          if (pendingSong) { const p = pendingSong; pendingSong = null; audio.music(p); }
        }
        if (ctx.state === 'suspended') ctx.resume();
      } catch (e) { console.warn('audio unlock failed', e); }
    },
    setVolume(kind, v) {
      settings[kind] = v;
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
      if (kind === 'music' && musicBus) musicBus.gain.value = v;
      if (kind === 'sfx' && sfxBus) sfxBus.gain.value = v;
    },

    /* play a song by id (crossfades). null stops music. */
    music(id, opts = {}) {
      if (!ctx) { pendingSong = id; return; }
      if (id === songId && song && !opts.restart) return;
      const old = song;
      if (old) {
        old.bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
        setTimeout(() => { try { old.bus.disconnect(); } catch (e) {} }, 1500);
      }
      song = null; songId = id;
      if (!id) return;
      const def = G.data.songs[id];
      if (!def) { console.warn('no song', id); return; }
      const c = compiled[id] || (compiled[id] = compile(def));
      const bus = ctx.createGain();
      bus.gain.setValueAtTime(0.0001, ctx.currentTime);
      bus.gain.linearRampToValueAtTime(def.vol || 1, ctx.currentTime + 0.4);
      bus.connect(musicBus);
      song = Object.assign({}, c, { bus, step: 0, nextTime: ctx.currentTime + 0.08 });
    },
    get currentSong() { return songId; },

    /* ---------- sound effects ---------- */
    sfx(name, opt) {
      if (!ctx || ctx.state !== 'running') return;
      const fn = SFX[name];
      if (fn) fn(ctx.currentTime + 0.005, sfxBus, opt || {});
    },
  });
  let pendingSong = null;

  /* Each SFX is a little recipe. Add your own here. */
  const SFX = {
    cursor: (t, o) => osc('pulse25', 880, t, 0.03, 0.08, o),
    confirm: (t, o) => { osc('pulse25', 660, t, 0.05, 0.1, o); osc('pulse25', 990, t + 0.05, 0.07, 0.1, o); },
    cancel: (t, o) => { osc('pulse25', 440, t, 0.05, 0.1, o); osc('pulse25', 300, t + 0.05, 0.07, 0.1, o); },
    error: (t, o) => osc('square', 110, t, 0.18, 0.1, o),
    blip: (t, o, p) => osc('pulse12', p.pitch || 900, t, 0.018, 0.045, o),
    cog: (t, o) => { for (let i = 0; i < 3; i++) osc('square', U.rand(900, 1900), t + i * 0.05, 0.03, 0.05, o); },
    step: (t, o) => noise(t, 0.03, 0.03, o, { freq: 2500 }),
    hit: (t, o) => { noise(t, 0.12, 0.35, o, { freq: 600 }); osc('square', 220, t, 0.08, 0.15, o, { slide: 60 }); },
    crit: (t, o) => { SFX.hit(t, o); osc('pulse25', 1400, t + 0.04, 0.12, 0.12, o, { slide: 2200 }); },
    miss: (t, o) => noise(t, 0.18, 0.12, o, { filter: 'bandpass', freq: 600, freqTo: 3000, q: 2 }),
    enemyHit: (t, o) => { noise(t, 0.1, 0.25, o, { freq: 900 }); osc('square', 160, t, 0.07, 0.12, o, { slide: 50 }); },
    magic: (t, o) => { [0, 4, 7, 12, 16].forEach((s, i) => osc('triangle', mtof(72 + s), t + i * 0.035, 0.12, 0.12, o)); noise(t, 0.4, 0.06, o, { freq: 5000 }); },
    spark: (t, o) => { osc('sawtooth', 300, t, 0.25, 0.08, o, { slide: 1800 }); noise(t + 0.1, 0.25, 0.15, o, { freq: 2000 }); },
    heal: (t, o) => [523, 659, 784, 1046].forEach((f, i) => osc('sine', f, t + i * 0.07, 0.18, 0.12, o)),
    gadget: (t, o) => { osc('square', 400, t, 0.04, 0.08, o); osc('square', 800, t + 0.05, 0.04, 0.08, o); osc('square', 600, t + 0.1, 0.06, 0.08, o); },
    shield: (t, o) => { osc('triangle', 1200, t, 0.4, 0.1, o, { vib: 9 }); osc('sine', 600, t, 0.4, 0.08, o); },
    status: (t, o) => osc('pulse25', 300, t, 0.25, 0.08, o, { slide: 150, vib: 12 }),
    surge: (t, o) => {
      noise(t, 1.1, 0.35, o, { filter: 'lowpass', freq: 300, freqTo: 4000 });
      osc('sawtooth', 70, t, 0.9, 0.18, o, { slide: 700, slideT: 0.5 });
      osc('sawtooth', 700, t + 0.5, 0.5, 0.12, o, { slide: 40 });
    },
    bright: (t, o) => [0, 4, 7, 11, 14].forEach((s, i) => osc('sine', mtof(76 + s), t + i * 0.03, 0.6, 0.06, o, { vib: 6 })),
    levelup: (t, o) => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => osc('pulse25', f, t + i * 0.08, i === 5 ? 0.35 : 0.07, 0.11, o)),
    lantern: (t, o) => { noise(t, 0.35, 0.12, o, { filter: 'bandpass', freq: 400, freqTo: 1500 }); osc('sine', 880, t + 0.15, 0.6, 0.08, o); osc('sine', 1320, t + 0.22, 0.6, 0.05, o); },
    fizzle: (t, o) => { noise(t, 0.25, 0.1, o, { filter: 'bandpass', freq: 2000, freqTo: 300 }); osc('sine', 700, t, 0.3, 0.06, o, { slide: 120 }); },
    door: (t, o) => { osc('square', 90, t, 0.06, 0.12, o); noise(t, 0.08, 0.1, o, { filter: 'lowpass', freq: 600 }); },
    chest: (t, o) => [784, 988, 1175, 1568].forEach((f, i) => osc('pulse25', f, t + i * 0.06, 0.08, 0.09, o)),
    buy: (t, o) => { osc('pulse25', 988, t, 0.05, 0.1, o); osc('pulse25', 1318, t + 0.06, 0.15, 0.1, o); },
    encounter: (t, o) => { for (let i = 0; i < 6; i++) osc('square', 200 + i * 120, t + i * 0.04, 0.05, 0.08, o); noise(t, 0.5, 0.15, o, { filter: 'bandpass', freq: 400, freqTo: 4000, q: 3 }); },
    enemyDie: (t, o) => { noise(t, 0.45, 0.25, o, { filter: 'lowpass', freq: 3000, freqTo: 100 }); osc('square', 400, t, 0.35, 0.08, o, { slide: 40 }); },
    flee: (t, o) => noise(t, 0.3, 0.15, o, { filter: 'bandpass', freq: 3000, freqTo: 400, q: 2 }),
    ferry: (t, o) => { osc('sawtooth', 147, t, 0.9, 0.1, o, { vib: 4, attack: 0.08 }); osc('sawtooth', 220, t, 0.9, 0.07, o, { vib: 4, attack: 0.08 }); },
    rumble: (t, o) => noise(t, 1.6, 0.4, o, { filter: 'lowpass', freq: 160, freqTo: 60 }),
    save: (t, o) => [659, 880, 1318].forEach((f, i) => osc('sine', f, t + i * 0.1, 0.3, 0.1, o)),
    pendant: (t, o) => { osc('sine', 440, t, 1.2, 0.09, o, { vib: 3, attack: 0.3 }); osc('sine', 660, t + 0.2, 1.0, 0.06, o, { vib: 3, attack: 0.3 }); },
    alarm: (t, o) => { for (let i = 0; i < 4; i++) osc('square', i % 2 ? 660 : 880, t + i * 0.18, 0.16, 0.09, o); },
    thud: (t, o) => { osc('sine', 120, t, 0.15, 0.4, o, { slide: 40 }); noise(t, 0.12, 0.2, o, { filter: 'lowpass', freq: 400 }); },
  };
  G.audio.SFX = SFX;
})();
