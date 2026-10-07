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
    this.music = c.createGain(); this.music.gain.value = this.musicOn ? 0.17 : 0; this.music.connect(this.master);
    const len = c.sampleRate;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    Music.start();
  },

  setMusic(on) { this.musicOn = on; if (this.ctx) this.music.gain.setTargetAtTime(on ? 0.17 : 0, this.ctx.currentTime, 0.3); },
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
      case 'cash': T(1568, 0.08, { type: 'square', vol: 0.05 }); T(2093, 0.3, { type: 'square', vol: 0.05, when: 0.08 }); break;
    }
  },
};

// A tiny generative band: bass, marimba arpeggio, melody and soft hi-hats.
const Music = {
  bpm: 98, step: 0, nextTime: 0, timer: null, melody: [],
  prog: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12], [0, 4, 7], [5, 9, 12], [7, 11, 14], [7, 11, 14]],
  start() {
    if (this.timer || !Sound.ctx) return;
    this.nextTime = Sound.ctx.currentTime + 0.2;
    this.makeMelody();
    this.timer = setInterval(() => this.schedule(), 60);
  },
  midi: (n) => 440 * Math.pow(2, (n - 69) / 12),
  note(n, when, dur, type, vol) {
    Sound.tone(this.midi(n), dur, { type, vol, when: when - Sound.ctx.currentTime, dest: Sound.music, attack: 0.012 });
  },
  schedule() {
    const c = Sound.ctx;
    if (!c || c.state !== 'running') return;
    const spb = 60 / this.bpm / 2; // eighth notes
    if (this.nextTime < c.currentTime - 0.5) this.nextTime = c.currentTime + 0.05;
    while (this.nextTime < c.currentTime + 0.25) {
      if (Sound.musicOn) this.playStep(this.step, this.nextTime);
      this.nextTime += spb; this.step++;
      if (this.step % 64 === 0) this.makeMelody();
    }
  },
  playStep(s, t) {
    const beat = s % 8, chord = this.prog[Math.floor(s / 8) % this.prog.length];
    const night = typeof nightFactor === 'function' ? nightFactor() : 0;
    if (beat === 0 || beat === 4 || (beat === 6 && night < 0.5)) this.note(36 + chord[0] + (beat === 6 ? 7 : 0), t, 0.45, 'triangle', 0.32);
    const arp = [0, 1, 2, 1, 0, 1, 2, 1][beat];
    if (night < 0.6 || beat % 2 === 0) this.note(60 + chord[arp] + (beat === 3 || beat === 7 ? 12 : 0), t, 0.3, 'sine', 0.11);
    const m = this.melody[s % 64];
    if (m) this.note(m, t, 0.4, night > 0.5 ? 'sine' : 'triangle', 0.12);
    if (beat % 2 === 1 && night < 0.5) Sound.noise(0.03, { filter: 'highpass', freq: 7000, vol: 0.03, when: t - Sound.ctx.currentTime, dest: Sound.music });
  },
  makeMelody() {
    const scale = [60, 62, 64, 67, 69, 72, 74, 76, 79];
    const phrase = () => { const p = []; let k = rint(2, 5); for (let i = 0; i < 16; i++) { if (Math.random() < (i % 2 === 0 ? 0.6 : 0.25)) { k = clamp(k + rint(-2, 2), 0, scale.length - 1); p.push(scale[k]); } else p.push(null); } return p; };
    const a = phrase(), b = phrase();
    const a2 = a.map((n, i) => (i > 11 ? (b[i] || n) : n));
    this.melody = [...a, ...a2, ...b, ...a];
  },
};
