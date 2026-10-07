'use strict';
// =====================================================================
//  Sound effects + cheerful generated music (WebAudio, no files needed)
// =====================================================================
const Sound = {
  ctx: null, master: null, sfx: null, music: null, noiseBuf: null, last: {},
  musicOn: true, sfxOn: true,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.gain.value = this.sfxOn ? 0.55 : 0; this.sfx.connect(this.master);
    this.music = c.createGain(); this.music.gain.value = this.musicOn ? 0.26 : 0; this.music.connect(this.master);
    const len = c.sampleRate;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    Music.start();
  },

  setMusic(on) { this.musicOn = on; if (this.ctx) this.music.gain.setTargetAtTime(on ? 0.26 : 0, this.ctx.currentTime, 0.3); },
  setSfx(on) { this.sfxOn = on; if (this.ctx) this.sfx.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, 0.05); },

  tone(f, dur, o = {}) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + Math.max(0, o.when || 0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f * o.slide), t + dur);
    const v = o.vol ?? 0.3, a = o.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.dest || this.sfx);
    osc.start(t); osc.stop(t + dur + 0.05);
  },

  noise(dur, o = {}) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + Math.max(0, o.when || 0);
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, t + dur);
    f.Q.value = o.q || 1;
    const g = c.createGain(), v = o.vol ?? 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || this.sfx);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  },

  play(name) {
    if (!this.ctx || !this.sfxOn) return;
    const now = performance.now();
    const gap = { grow: 140, coin: 70, boom: 60, launch: 60, click: 30, road: 40, zone: 40 }[name] || 0;
    if (gap && this.last[name] && now - this.last[name] < gap) return;
    this.last[name] = now;
    const T = (f, d, o) => this.tone(f, d, o), Nz = (d, o) => this.noise(d, o);
    switch (name) {
      case 'click': T(1100, 0.04, { type: 'square', vol: 0.05 }); break;
      case 'select': T(660, 0.06, { type: 'triangle', vol: 0.14 }); T(990, 0.09, { type: 'triangle', vol: 0.12, when: 0.05 }); break;
      case 'place': T(330, 0.14, { type: 'triangle', vol: 0.3, slide: 2 }); Nz(0.12, { freq: 1500, vol: 0.08 }); break;
      case 'road': Nz(0.08, { freq: 700, vol: 0.16 }); T(150, 0.07, { type: 'square', vol: 0.04 }); break;
      case 'zone': Nz(0.14, { filter: 'bandpass', freq: 2500, freqEnd: 5000, vol: 0.09 }); break;
      case 'bulldoze': Nz(0.4, { freq: 500, freqEnd: 120, vol: 0.4 }); T(110, 0.3, { type: 'sawtooth', vol: 0.07, slide: 0.5 }); break;
      case 'grow': T(500 + Math.random() * 300, 0.09, { vol: 0.06, slide: 1.6 }); break;
      case 'levelup': [660, 880, 1320].forEach((f, i) => T(f, 0.14, { type: 'triangle', vol: 0.06, when: i * 0.05 })); break;
      case 'coin': T(1319, 0.07, { type: 'square', vol: 0.05 }); T(1760, 0.22, { type: 'square', vol: 0.05, when: 0.07 }); break;
      case 'error': T(180, 0.12, { type: 'sawtooth', vol: 0.1 }); T(140, 0.18, { type: 'sawtooth', vol: 0.1, when: 0.13 }); break;
      case 'quest':
        [523, 659, 784, 1047].forEach((f, i) => T(f, 0.25, { type: 'triangle', vol: 0.18, when: i * 0.09 }));
        T(1568, 0.6, { vol: 0.08, when: 0.36 }); break;
      case 'tier': {
        const seq = [[523, 0], [523, 0.12], [523, 0.24], [659, 0.36], [784, 0.6], [659, 0.84], [784, 0.96]];
        seq.forEach(([f, w]) => { T(f, 0.2, { type: 'square', vol: 0.09, when: w }); T(f / 2, 0.2, { type: 'triangle', vol: 0.12, when: w }); });
        [523, 659, 784, 1047].forEach((f) => T(f, 1.4, { type: 'triangle', vol: 0.1, when: 1.1, attack: 0.05 }));
        break;
      }
      case 'launch': T(380, 0.7, { vol: 0.035, slide: 4 }); break;
      case 'boom':
        Nz(0.9, { freq: 900, freqEnd: 80, vol: 0.3 });
        for (let i = 0; i < 4; i++) Nz(0.05, { filter: 'highpass', freq: 3000, vol: 0.06, when: 0.15 + Math.random() * 0.5 });
        break;
      case 'rocket': Nz(4.5, { freq: 200, freqEnd: 900, vol: 0.45, attack: 0.6 }); T(55, 4, { type: 'sawtooth', vol: 0.06, attack: 0.5 }); break;
      case 'woof': T(420, 0.09, { type: 'sawtooth', vol: 0.07, slide: 0.55 }); T(380, 0.11, { type: 'sawtooth', vol: 0.07, slide: 0.5, when: 0.16 }); break;
      case 'meow': T(600, 0.18, { type: 'triangle', vol: 0.12, slide: 1.5 }); T(900, 0.3, { type: 'triangle', vol: 0.1, slide: 0.6, when: 0.17 }); break;
      case 'siren': for (let k = 0; k < 3; k++) { T(700, 0.35, { type: 'square', vol: 0.05, slide: 1.4, when: k * 0.7 }); T(980, 0.35, { type: 'square', vol: 0.05, slide: 0.7, when: k * 0.7 + 0.35 }); } break;
      case 'wind': Nz(2.6, { filter: 'bandpass', freq: 300, freqEnd: 900, q: 2, vol: 0.25, attack: 0.6 }); break;
      case 'wave': Nz(5, { freq: 300, freqEnd: 1600, vol: 0.4, attack: 1.5 }); Nz(3, { freq: 2000, freqEnd: 400, vol: 0.15, when: 2.5 }); break;
      case 'crackle': for (let k = 0; k < 4; k++) Nz(0.04, { filter: 'highpass', freq: 2500, vol: 0.05, when: Math.random() * 0.5 }); break;
      case 'alarm': for (let k = 0; k < 4; k++) T(520, 0.3, { type: 'sawtooth', vol: 0.06, when: 0.5 + k * 0.5, slide: 0.8 }); break;
      case 'splash': Nz(0.5, { filter: 'bandpass', freq: 1400, freqEnd: 500, q: 0.7, vol: 0.3 }); T(300, 0.15, { vol: 0.08, slide: 0.5 }); break;
      case 'ouch': T(700, 0.25, { type: 'square', vol: 0.07, slide: 0.5 }); break;
      case 'barf': Nz(0.5, { freq: 500, freqEnd: 150, q: 4, vol: 0.25 }); T(180, 0.45, { type: 'sawtooth', vol: 0.06, slide: 0.5 }); break;
      case 'cash': T(1568, 0.08, { type: 'square', vol: 0.05 }); T(2093, 0.3, { type: 'square', vol: 0.05, when: 0.08 }); break;
    }
  },
};

// =====================================================================
//  The band: four original songs (lead, bass, chords, drums)
//  Melodies use note names and lengths in eighth notes, e.g. "E5:2" = E5 for 2 eighths.
// =====================================================================
const SONGS = [
  {
    name: 'Sunny Side Street', bpm: 128, style: 'bounce', lead: 'square',
    sections: {
      intro: { chords: 'C G Am F', mel: 'r:32' },
      A: { chords: 'C G Am F C G F G', mel: `E5 E5 G5 E5 D5 C5 D5:2 | B4 D5 G5:2 F5 E5 D5:2 | C5 C5 E5 C5 B4 A4 B4:2 | A4 C5 F5:2 E5:2 r:2 |
        E5 E5 G5 E5 D5 C5 D5:2 | B4 D5 G5:2 A5 G5 F5:2 | F5 E5 D5 C5 A4:2 C5:2 | D5:4 r:4` },
      B: { chords: 'F G Em Am F G C C', mel: `A5:2 A5 G5 A5:2 C6:2 | B5:2 G5 G5 D5:2 r:2 | G5:2 G5 F5 G5:2 B5:2 | A5:2 E5 E5 C5:2 r:2 |
        A5:2 A5 G5 A5:2 C6:2 | D6:2 C6 B5 G5:2 B5:2 | C6:3 G5 E5 G5 C6:2 | C6:4 r:4` },
      C: { chords: 'Am F C G', mel: 'E5:2 A5:2 G5:2 E5:2 | F5:2 A5:2 C6:2 A5:2 | G5:2 E5 G5 C6:2 G5:2 | D5 E5 F5 G5 A5 B5 C6 D6' },
    },
    order: ['intro', 'A', 'B', 'A', 'B', 'C', 'B', 'B'],
  },
  {
    name: "Moe's Big Adventure", bpm: 150, style: 'gallop', lead: 'square',
    sections: {
      intro: { chords: 'G C D G', mel: 'r:32' },
      A: { chords: 'G C D G Em C D D', mel: `G4 B4 D5 G5 F#5 G5 D5:2 | E5 G5 E5 C5 E5:2 r:2 | F#5 E5 D5 C5 B4 A4 B4 C5 | D5:4 B4:2 G4:2 |
        E5 E5 F#5 G5 B5:2 G5:2 | E5 G5 E5 C5 A4:2 C5:2 | D5 C5 B4 A4 F#4:2 A4:2 | D5:6 r:2` },
      B: { chords: 'C D Bm Em C D G G', mel: `E5:2 G5:2 C6:2 B5 A5 | A5:2 F#5:2 D5:2 E5 F#5 | G5:2 F#5 E5 D5:2 B4:2 | E5:2 G5:2 B5:4 |
        C6:2 B5 A5 G5:2 E5:2 | A5:2 G5 F#5 D5:2 F#5:2 | G5:8 | r:4 D5 E5 F#5 A5` },
    },
    order: ['intro', 'A', 'B', 'A', 'B', 'B'],
  },
  {
    name: 'Skyscraper Dreams', bpm: 116, style: 'anthem', lead: 'triangle',
    sections: {
      intro: { chords: 'F C Dm Bb', mel: 'r:32' },
      A: { chords: 'F C Dm Bb F C Bb C', mel: `A4 C5 F5:2 E5 F5 G5:2 | E5:2 C5:2 G4:4 | A4 D5 F5:2 E5 D5 C5:2 | D5:4 r:4 |
        A4 C5 F5:2 E5 F5 A5:2 | G5:2 E5:2 C5:4 | D5 D5 F5 D5 Bb4:2 D5:2 | C5:4 r:2 C5 E5` },
      B: { chords: 'Bb F C Dm Bb F C F', mel: `F5:3 G5 A5:2 C6:2 | C6 A5 G5 F5 A5:4 | G5:3 A5 G5:2 E5:2 | D5 E5 F5 G5 A5:4 |
        Bb5:3 A5 G5:2 F5:2 | A5:2 G5 F5 F5:4 | G5:2 A5 G5 E5:2 C5:2 | F5:6 r:2` },
    },
    order: ['intro', 'A', 'B', 'A', 'B', 'B'],
  },
  {
    name: 'Starlight Avenue', bpm: 84, style: 'night', lead: 'sine', night: true,
    sections: {
      A: { chords: 'Am F C G Am F G C', mel: `E5:3 D5 C5:2 A4:2 | C5:3 D5 C5:2 A4:2 | G4:2 C5:2 E5:2 G5:2 | D5:6 r:2 |
        E5:3 D5 C5:2 E5:2 | A5:3 G5 F5:2 C5:2 | D5:2 E5:2 F5:2 B4:2 | C5:6 r:2` },
      B: { chords: 'F G Em Am F G C C', mel: `A5:4 G5:2 F5:2 | G5:4 D5:4 | E5:2 G5:2 B5:2 G5:2 | A5:6 r:2 |
        F5:2 A5:2 C6:2 A5:2 | B5:2 G5:2 D5:4 | E5:2 G5:2 C6:4 | C6:6 r:2` },
    },
    order: ['A', 'B', 'A', 'B'],
  },
];

const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteToMidi(n) { const m = n.match(/^([A-G])([#b]?)(\d)$/); if (!m) return null; return 12 * (+m[3] + 1) + NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); }
function chordNotes(name) {
  const m = name.match(/^([A-G][#b]?)(m?)$/); const root = noteToMidi(m[1] + '3');
  return [root, root + (m[2] ? 3 : 4), root + 7];
}
// turn a song into flat per-eighth arrays
function compileSong(song) {
  const mel = [], chords = [];
  for (const secName of song.order) {
    const sec = song.sections[secName], cs = sec.chords.split(/\s+/);
    const start = mel.length;
    for (const tok of sec.mel.replace(/\|/g, ' ').split(/\s+/).filter(Boolean)) {
      const [n, d] = tok.split(':'), dur = +(d || 1);
      mel.push(n === 'r' ? null : [noteToMidi(n), dur]);
      for (let k = 1; k < dur; k++) mel.push(null);
    }
    const bars = Math.max(cs.length, Math.ceil((mel.length - start) / 8));
    while (mel.length < start + bars * 8) mel.push(null);
    for (let b = 0; b < bars; b++) chords.push(chordNotes(cs[b % cs.length]));
  }
  song.mel = mel; song.chordAt = chords; song.len = mel.length;
  return song;
}
SONGS.forEach(compileSong);

const Music = {
  step: 0, nextTime: 0, timer: null, songIdx: 0, mode: 'auto', // 'auto' = playlist, or a fixed song index
  start() {
    if (this.timer || !Sound.ctx) return;
    try { const m = localStorage.getItem('mayorNelly.song'); if (m != null && m !== 'auto') { this.mode = +m; this.songIdx = +m; } } catch (e) { /* ignore */ }
    this.nextTime = Sound.ctx.currentTime + 0.2;
    this.timer = setInterval(() => this.schedule(), 60);
    this.announce();
  },
  get song() { return SONGS[this.songIdx]; },
  midi: (n) => 440 * Math.pow(2, (n - 69) / 12),
  note(n, when, dur, type, vol, attack = 0.012) {
    Sound.tone(this.midi(n), dur, { type, vol, when: when - Sound.ctx.currentTime, dest: Sound.music, attack });
  },
  drum(kind, when) {
    const w = when - Sound.ctx.currentTime, M = Sound.music;
    if (kind === 'k') Sound.tone(150, 0.18, { vol: 0.55, slide: 0.3, when: w, dest: M });
    if (kind === 's') { Sound.noise(0.12, { filter: 'bandpass', freq: 1800, q: 0.8, vol: 0.18, when: w, dest: M }); Sound.tone(220, 0.08, { type: 'triangle', vol: 0.08, when: w, dest: M }); }
    if (kind === 'h') Sound.noise(0.03, { filter: 'highpass', freq: 7000, vol: 0.05, when: w, dest: M });
  },
  pickSong(i) {
    this.mode = i; if (i !== 'auto') this.songIdx = i;
    this.step = 0; this.nextTime = Sound.ctx ? Sound.ctx.currentTime + 0.15 : 0;
    try { localStorage.setItem('mayorNelly.song', String(i)); } catch (e) { /* ignore */ }
    this.announce();
  },
  nextSong() {
    if (this.mode !== 'auto') { this.step = 0; return; }
    const night = typeof nightFactor === 'function' ? nightFactor() > 0.6 : false;
    const cands = SONGS.map((s, i) => i).filter((i) => i !== this.songIdx && (night ? true : !SONGS[i].night));
    this.songIdx = night && Math.random() < 0.6 ? SONGS.findIndex((s) => s.night) : pick(cands);
    this.step = 0; this.announce();
  },
  announce() { if (Sound.musicOn && typeof UI !== 'undefined' && UI.toast) UI.toast(`🎶 Now playing: ${this.song.name}`); },
  schedule() {
    const c = Sound.ctx;
    if (!c || c.state !== 'running') return;
    if (this.nextTime < c.currentTime - 0.5) this.nextTime = c.currentTime + 0.05;
    while (this.nextTime < c.currentTime + 0.25) {
      const song = this.song, spb = 60 / song.bpm / 2;
      if (this.step >= song.len) { this.nextSong(); continue; }
      if (Sound.musicOn) this.playStep(song, this.step, this.nextTime, spb);
      this.nextTime += spb; this.step++;
    }
  },
  playStep(song, s, t, spb) {
    const beat = s % 8, chord = song.chordAt[Math.floor(s / 8)] || [48, 52, 55], root = chord[0] - 12;
    const st = song.style;
    // melody
    const m = song.mel[s];
    if (m) {
      const d = m[1] * spb * 0.92;
      this.note(m[0], t, d, song.lead, song.lead === 'square' ? 0.06 : 0.13);
      if (song.lead === 'square') this.note(m[0], t, d, 'triangle', 0.07);
    }
    // bass
    if (st === 'bounce' && (beat % 2 === 0)) this.note(beat === 2 || beat === 6 ? root + 7 : root, t, spb * 1.6, 'triangle', 0.3);
    if (st === 'gallop' && [0, 3, 4, 6].includes(beat)) this.note(beat === 6 ? root + 7 : root, t, spb * 1.2, 'triangle', 0.3);
    if (st === 'anthem' && [0, 3, 4, 6].includes(beat)) this.note(root, t, spb * 1.5, 'triangle', 0.32);
    if (st === 'night' && beat === 0) this.note(root, t, spb * 7, 'sine', 0.3, 0.05);
    // chords
    if (st === 'bounce' && beat % 2 === 1) for (const n of chord) this.note(n + 12, t, spb * 0.7, 'triangle', 0.035);
    if (st === 'gallop') this.note(chord[[0, 1, 2, 1][beat % 4]] + 12, t, spb * 0.8, 'sine', 0.08);
    if (st === 'anthem' && (beat === 0 || beat === 4)) for (const n of chord) this.note(n + 12, t, spb * 3.6, 'sawtooth', 0.016, 0.06);
    if (st === 'night' && beat % 2 === 0) this.note(chord[(beat / 2) % 3] + 24, t, spb * 2.5, 'sine', 0.05, 0.03);
    // drums
    if (st !== 'night') {
      if (beat === 0 || beat === 4 || (st !== 'bounce' && beat === 3)) this.drum('k', t);
      if (beat === 2 || beat === 6) this.drum('s', t);
      if (st === 'anthem' ? beat % 2 === 0 : true) this.drum('h', t);
    } else if (beat === 4) this.drum('h', t);
  },
};
