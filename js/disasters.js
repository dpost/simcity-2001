'use strict';
// =====================================================================
//  Disasters! Fire, tornado, tsunami and nuclear meltdown.
//  Fire stations put out fires. Rubble clears by itself after a while
//  (or build right over it), and zones grow back.
// =====================================================================
const DISASTERS = {
  fire: { icon: '🔥', name: 'Fire', desc: 'Click a building to set it on fire. Fire stations nearby put fires out!', aim: true },
  tornado: { icon: '🌪️', name: 'Tornado', desc: 'Click where the tornado should start. It wanders around smashing things!', aim: true },
  tsunami: { icon: '🌊', name: 'Tsunami', desc: 'A giant wave rushes out of the rivers and lakes. Homes by the water beware!' },
  meltdown: { icon: '☢️', name: 'Nuclear Meltdown', desc: 'Your nuclear plant explodes and leaves a glowing radiation zone for years. Needs a Nuclear Plant.' },
};
const RUBBLE_MONTHS = 6, RAD_MONTHS = 30;

const Dis = {
  fire: new Map(), rubble: new Uint8Array(N * N), rad: new Uint8Array(N * N), tornado: null, wave: null, randomOn: true, t: 0, sfxT: 0,

  reset() { this.fire = new Map(); this.rubble = new Uint8Array(N * N); this.rad = new Uint8Array(N * N); this.tornado = null; this.wave = null; this.randomOn = true; },
  save() {
    const pairs = (a) => { const r = []; for (let i = 0; i < a.length; i++) if (a[i]) r.push(i, a[i]); return r; };
    return { rubble: pairs(this.rubble), rad: pairs(this.rad), fire: [...this.fire.entries()], randomOn: this.randomOn };
  },
  load(d) {
    this.reset();
    if (!d) return;
    const unpair = (arr, a) => { for (let k = 0; k + 1 < (arr || []).length; k += 2) a[arr[k]] = arr[k + 1]; };
    unpair(d.rubble, this.rubble); unpair(d.rad, this.rad);
    for (const [id, t] of d.fire || []) if (W.buildings.has(id)) this.fire.set(id, t);
    this.randomOn = d.randomOn !== false;
  },
  active() { return this.fire.size > 0 || !!this.tornado || !!this.wave; },

  // ---------------- helpers ----------------
  canBurn(b) { const t = BT[b.type]; return !(t && (t.landmark || t.isTree)); },
  destroy(b, months = RUBBLE_MONTHS) {
    if (!W.buildings.has(b.id)) return;
    this.fire.delete(b.id);
    if (Input.selected === b) { Input.selected = null; UI.hideInfo(); }
    removeBuilding(b);
    footprint(b, (x, y, i) => { this.rubble[i] = months; markGround(x, y); });
    const [X, Y] = Pw(b.x + b.size / 2, b.y + b.size / 2);
    for (let k = 0; k < 14 * b.size; k++) FX.parts.push({ X: X + rnd(-14, 14) * b.size, Y: Y + rnd(-6, 6), vx: rnd(-18, 18), vy: rnd(-26, -6), r: rnd(2, 5), grow: 5, life: 1.4, max: 1.4, col: '#8d8579', kind: 'smoke' });
  },
  say(text) { UI.say(text, 'dog'); },

  // ---------------- starting disasters ----------------
  start(kind, tx, ty) {
    if (kind === 'fire') {
      let b = inb(tx, ty) ? buildingAt(tx, ty) : null;
      if (!b || !this.canBurn(b)) { const list = [...W.buildings.values()].filter((x) => this.canBurn(x) && !BT[x.type]); if (!list.length) return false; b = pick(list); }
      this.fire.set(b.id, 0);
      Sound.play('siren');
      this.say(`🔥 FIRE at ${buildingName(b)}! Fire stations nearby will help put it out. Build more 🚒 Fire Stations to keep the city safe!`);
      Game.goTo(b.x, b.y);
      return true;
    }
    if (kind === 'tornado') {
      const x = inb(tx, ty) ? tx + 0.5 : rnd(8, N - 8), y = inb(tx, ty) ? ty + 0.5 : rnd(8, N - 8);
      this.tornado = { u: x, v: y, a: Math.random() * Math.PI * 2, life: rnd(16, 24), spin: 0 };
      Sound.play('wind');
      this.say('🌪️ TORNADO! Everyone hide in the basement! It will blow itself out soon.');
      Game.goTo(Math.floor(x), Math.floor(y));
      return true;
    }
    if (kind === 'tsunami') {
      const dist = this.waterDistance(5);
      if (!dist) { UI.toast('🌊 No water nearby, so the tsunami fizzled out!'); return false; }
      this.wave = { t: 0, dur: 12, max: 4.5, dist, hit: false };
      Sound.play('wave');
      this.say('🌊 TSUNAMI! A giant wave is coming out of the water! Homes near the shore are in danger!');
      return true;
    }
    if (kind === 'meltdown') {
      const plant = [...W.buildings.values()].find((b) => b.type === 'nuclear');
      if (!plant) { UI.toast('☢️ A meltdown needs a Nuclear Power Plant first (⚡ Power).'); return false; }
      this.meltdown(plant);
      return true;
    }
    return false;
  },
  meltdown(plant) {
    const cx = plant.x + 1, cy = plant.y + 1;
    Game.goTo(plant.x, plant.y);
    this.destroy(plant, RAD_MONTHS);
    for (let y = cy - 6; y <= cy + 6; y++) for (let x = cx - 6; x <= cx + 6; x++) {
      if (!inb(x, y)) continue;
      const d = Math.hypot(x - cx + 0.5, y - cy + 0.5);
      if (d > 5.5) continue;
      const i = idx(x, y); this.rad[i] = Math.round(RAD_MONTHS * (1 - d / 8)); markGround(x, y);
      const b = buildingAt(x, y);
      if (b && this.canBurn(b) && (d < 3.5 || Math.random() < 0.5)) this.destroy(b);
    }
    D.dirty = D.lvDirty = true;
    const [X, Y] = Pw(cx, cy);
    FX.parts.push({ X, Y: Y - 30, vx: 0, vy: 0, r: 160, life: 0.8, max: 0.8, col: '#d8ff6a', kind: 'flash' });
    for (let k = 0; k < 120; k++) { const a = Math.random() * 6.28, sp = rnd(30, 160); FX.parts.push({ X, Y: Y - 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - 40, r: rnd(3, 8), grow: 8, life: rnd(2, 4), max: 4, col: pick(['#9a9aa2', '#6b6b73', '#ffb84d']), kind: 'smoke' }); }
    Sound.play('boom'); Sound.play('alarm');
    Game.shake = 4;
    this.say(`☢️ MELTDOWN! The nuclear plant exploded! Don't worry, everyone was evacuated safely. The green glowing area is radioactive, so nothing can be built there for a few years.`);
  },
  waterDistance(maxD) {
    const dist = new Uint8Array(N * N).fill(255), q = [];
    for (let i = 0; i < N * N; i++) if (W.terrain[i] === T_WATER) { dist[i] = 0; q.push(i); }
    if (!q.length) return null;
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % N, y = (i / N) | 0;
      if (dist[i] >= maxD) continue;
      for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue; const ni = idx(nx, ny); if (dist[ni] === 255) { dist[ni] = dist[i] + 1; q.push(ni); } }
    }
    return dist;
  },

  // ---------------- every frame ----------------
  update(gdt, dt) {
    this.t += gdt;
    // fire
    if (this.fire.size) {
      for (const [id, t] of [...this.fire]) {
        const b = W.buildings.get(id);
        if (!b) { this.fire.delete(id); continue; }
        const nt = t + gdt; this.fire.set(id, nt);
        const cov = Math.min(1, D.cov.fire[idx(b.x, b.y)]);
        if (Math.random() < gdt * (0.05 + cov * 0.4)) {
          this.fire.delete(id); UI.toast(`🚒 Firefighters put out the fire at ${buildingName(b)}!`); Sound.play('coin');
          const [X, Y] = Pw(b.x + 0.5, b.y + 0.5, 20); for (let k = 0; k < 16; k++) FX.parts.push({ X, Y, vx: rnd(-30, 30), vy: rnd(-40, 0), r: 1.6, life: 0.8, max: 0.8, col: '#9fe8ff', kind: 'spark', g: 60 });
          continue;
        }
        if (nt > 14) { this.destroy(b); continue; }
        if (Math.random() < gdt * 0.16 * (1 - cov * 0.85)) {
          const nx = b.x + rint(-1, b.size), ny = b.y + rint(-1, b.size), nb = buildingAt(nx, ny);
          if (nb && nb !== b && this.canBurn(nb) && !this.fire.has(nb.id)) this.fire.set(nb.id, 0);
        }
        if (Game.visible(b.x, b.y, 3) && Math.random() < dt * 30) {
          const [X, Y] = Pw(b.x + rnd(0.2, b.size - 0.2), b.y + rnd(0.2, b.size - 0.2), rnd(4, 18));
          FX.parts.push({ X, Y, vx: rnd(-6, 6), vy: rnd(-40, -20), r: rnd(2, 4), life: 0.7, max: 0.7, col: pick(['#ffd23f', '#ff8c42', '#ff5a1f']), kind: 'fire', g: -10 });
          if (Math.random() < 0.3) FX.smoke(X, Y - 10, 3, '#5a5560', 3);
        }
      }
      this.sfxT -= dt;
      if (this.sfxT < 0 && this.fire.size) { this.sfxT = 0.6; Sound.play('crackle'); }
      if (!this.fire.size) this.say('Phew! All the fires are out. Great job, firefighters! 🚒');
    }
    // tornado
    const tn = this.tornado;
    if (tn) {
      tn.life -= gdt; tn.spin += dt * 9;
      tn.a += rnd(-1, 1) * gdt * 1.2;
      tn.u += Math.cos(tn.a) * gdt * 1.6; tn.v += Math.sin(tn.a) * gdt * 1.6;
      if (tn.u < 1 || tn.u > N - 1) tn.a = Math.PI - tn.a;
      if (tn.v < 1 || tn.v > N - 1) tn.a = -tn.a;
      tn.u = clamp(tn.u, 0.5, N - 0.5); tn.v = clamp(tn.v, 0.5, N - 0.5);
      const x = Math.floor(tn.u), y = Math.floor(tn.v), i = idx(x, y), b = buildingAt(x, y);
      if (b && this.canBurn(b) && Math.random() < gdt * 3) this.destroy(b);
      if (W.tree[i] && Math.random() < gdt * 4) { W.tree[i] = 0; D.lvDirty = true; }
      for (const c of Ents.cars) { const [cu, cv] = Ents.moverPos(c, 0.15); if (Math.hypot(cu - tn.u, cv - tn.v) < 0.8) c.life = -1; }
      this.sfxT -= dt; if (this.sfxT < 0) { this.sfxT = 2.5; Sound.play('wind'); }
      if (Game.visible(x, y, 3)) for (let k = 0; k < 2; k++) { const [X, Y] = Pw(tn.u, tn.v, 0); FX.parts.push({ X: X + rnd(-20, 20), Y: Y - rnd(0, 10), vx: rnd(-30, 30), vy: rnd(-60, -20), r: rnd(1.5, 3), life: 1, max: 1, col: '#8a7a6a', kind: 'smoke', grow: 2 }); }
      if (tn.life <= 0) { this.tornado = null; this.say('The tornado is gone! Rubble will clear by itself, or you can build right over it.'); }
    }
    // tsunami
    const wv = this.wave;
    if (wv) {
      wv.t += gdt;
      const lvl = this.waveLevel();
      if (!wv.hit && wv.t > wv.dur * 0.45) {
        wv.hit = true;
        for (const b of [...W.buildings.values()]) {
          if (!this.canBurn(b)) continue;
          const d = wv.dist[idx(b.x, b.y)];
          if (d !== 255 && d > 0 && d <= wv.max && Math.random() < (1 - d / (wv.max + 1.5)) * 0.9) this.destroy(b);
        }
        for (let i = 0; i < N * N; i++) if (W.tree[i] && wv.dist[i] <= 2 && wv.dist[i] > 0 && Math.random() < 0.5) W.tree[i] = 0;
        Game.shake = 2; D.lvDirty = true;
      }
      if (wv.t >= wv.dur) { this.wave = null; this.say('The water is going back to normal. Time to rebuild! Tip: parks by the water are safer than houses.'); }
      void lvl;
    }
  },
  waveLevel() { const w = this.wave; if (!w) return 0; const k = w.t / w.dur; return w.max * (k < 0.45 ? smoothstep(0, 0.45, k) : 1 - smoothstep(0.55, 1, k)); },

  monthly() {
    let ch = false;
    for (let i = 0; i < N * N; i++) {
      if (this.rubble[i]) { this.rubble[i]--; if (!this.rubble[i]) { markGround(i % N, (i / N) | 0); ch = true; } }
      if (this.rad[i]) { this.rad[i]--; if (!this.rad[i]) { markGround(i % N, (i / N) | 0); ch = true; } }
    }
    if (ch) D.dirty = true;
    // random disasters (only once the city is a Town)
    if (!this.randomOn || W.tier < 1 || this.active() || Game.state !== 'play') return;
    const chance = { easy: 0.012, normal: 0.02, hard: 0.035 }[W.difficulty] || 0.015;
    if (Math.random() > chance) return;
    const opts = ['fire', 'fire', 'fire', 'tornado'];
    if (W.terrain.some((t) => t === T_WATER)) opts.push('tsunami');
    if ([...W.buildings.values()].some((b) => b.type === 'nuclear')) opts.push('meltdown');
    this.start(pick(opts), -1, -1);
  },

  // ---------------- drawing ----------------
  drawGround(g, t, u0, u1, v0, v1) {
    const lvl = this.waveLevel(), wv = this.wave;
    for (let y = v0; y <= v1; y++) for (let x = u0; x <= u1; x++) {
      const i = idx(x, y);
      if (this.rad[i]) { diamondPath(g, x, y); g.fillStyle = `rgba(120,255,60,${0.18 + Math.sin(t * 2 + x * 0.7 + y) * 0.07 + Math.min(0.2, this.rad[i] / 100)})`; g.fill(); }
      if (wv) {
        const d = wv.dist[i];
        if (d !== 255 && d > 0 && d <= lvl + 0.3) { diamondPath(g, x, y); g.fillStyle = `rgba(60,150,220,${clamp(lvl - d + 0.7, 0.2, 0.8)})`; g.fill(); if (d > lvl - 0.9) { const [fx, fy] = Pw(x + 0.5, y + 0.5); g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(fx + Math.sin(t * 6 + x) * 4, fy, 12, 4, 0, 0, 7); g.fill(); } }
      }
    }
  },
  drawSky(g, t) {
    const tn = this.tornado;
    if (tn) {
      const [X, Y] = Pw(tn.u, tn.v, 0);
      g.save();
      for (let k = 0; k < 16; k++) {
        const h = k * 9, r = 6 + k * k * 0.22, wob = Math.sin(tn.spin + k * 0.6) * (4 + k * 0.8);
        g.globalAlpha = 0.55; g.fillStyle = k % 2 ? '#8f8a94' : '#a7a2ab';
        g.beginPath(); g.ellipse(X + wob, Y - h, r, r * 0.35, 0, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 0.35; g.fillStyle = '#6b6670'; g.beginPath(); g.ellipse(X, Y - 150, 70, 22, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    if (this.rad.some((r) => r > 0) && Math.random() < 0.6) {
      for (let k = 0; k < 2; k++) { const i = Math.floor(Math.random() * N * N); if (!this.rad[i]) continue; const [X, Y] = Pw((i % N) + Math.random(), ((i / N) | 0) + Math.random()); FX.parts.push({ X, Y, vx: 0, vy: -12, r: 1.4, life: 1.2, max: 1.2, col: '#b6ff5a', kind: 'spark' }); }
    }
  },
};

// nuclear power plant: lots of clean power... but risky!
BT.nuclear = { name: 'Nuclear Power Plant', icon: '☢️', cat: 'power', size: 2, cost: 12000, upkeep: 120, tier: 2, power: 900, ground: 'pave', h: 90, desc: 'Huge power with no smoke... but it could have a meltdown! ☢️' };
TOOLBAR.find((t) => t.id === 'power').group.splice(2, 0, 'nuclear');
TOOLBAR.push({ id: 'disasters', icon: '🌪️', label: 'Disasters', key: 'e', special: true });
ART.nuclear = (p) => {
  p.flat(0.15, 0.15, 1.85, 1.85, 0.2, '#d8dce2');
  const tower = (u, v) => {
    const [cx, cy] = p.iso(u, v, 0), g = p.g, H = 70, rb = 22, rm = 14, rt = 16;
    const grad = g.createLinearGradient(cx - rb, 0, cx + rb, 0); grad.addColorStop(0, '#f2f2f2'); grad.addColorStop(0.5, '#d6d6d6'); grad.addColorStop(1, '#9a9aa0');
    g.beginPath(); g.moveTo(cx - rb, cy); g.quadraticCurveTo(cx - rm, cy - H * 0.6, cx - rt, cy - H); g.lineTo(cx + rt, cy - H); g.quadraticCurveTo(cx + rm, cy - H * 0.6, cx + rb, cy);
    g.ellipse(cx, cy, rb, rb / 2, 0, 0, Math.PI, false); g.closePath(); g.fillStyle = grad; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.6; g.stroke();
    g.beginPath(); g.ellipse(cx, cy - H, rt, rt / 2, 0, 0, Math.PI * 2); g.fillStyle = '#7d8590'; g.fill();
    g.fillStyle = 'rgba(220,60,60,0.8)'; g.fillRect(cx - rt + 1, cy - H + 4, rt * 2 - 2, 3);
    p.emitters.push([cx, cy - H - 2]);
  };
  tower(0.55, 0.5); tower(1.0, 0.45);
  p.box(0.9, 1.0, 1.8, 1.8, 0, 22, '#e6e9ee');
  p.dome(1.35, 1.4, 22, 18, '#cfd6e3');
  p.winsL(0.95, 1.75, 1.8, 4, 18, 4, 1, { col: '#ffe9a8' });
  const [sx, sy] = p.iso(0.5, 1.6, 0); p.line([sx, sy], [sx, sy - 14], '#666', 1.2);
  p.board(sx, sy - 19, 13, 11, '#ffd23f', '☢', '#222', 8, { border: '#222' });
};

function rubbleTile() {
  return tileCanvas('rubble', (p, g, rr) => {
    p.poly(DIAMOND(), snowy() ? '#dfe3e8' : '#b9ab98');
    for (let i = 0; i < 14; i++) {
      const [x, y] = p.iso(0.12 + rr() * 0.76, 0.12 + rr() * 0.76, 0), s = 1.5 + rr() * 2.5;
      p.poly([[x - s, y], [x, y - s * 0.8], [x + s, y - s * 0.2], [x + s * 0.4, y + s * 0.5]], pick(['#8d8579', '#a39684', '#6f665c', '#c0b4a2']), 'rgba(0,0,0,0.2)');
    }
    p.line(p.iso(0.3, 0.6, 0), p.iso(0.55, 0.5, 2), '#7a5236', 1.4);
  });
}
Save.extras.push({ key: 'dis', save: () => Dis.save(), load: (d) => Dis.load(d) });
