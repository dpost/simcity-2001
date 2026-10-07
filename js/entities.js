'use strict';
// =====================================================================
//  Things that move: cars, people, boats, balloons, rockets, fireworks...
// =====================================================================
const Pw = (u, v, z = 0) => [(u - v) * 32, (u + v) * 16 - z];
const CAR_COLS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#ecf0f1', '#e67e22', '#ff6fa5', '#34495e', '#1abc9c'];
const SHIRTS = ['#ff6fa5', '#3fa9f5', '#ffd23f', '#5cd65c', '#b48cff', '#ff7b5c', '#ffffff', '#2ecc71'];
const SKINS = ['#f1c7a3', '#e0ac7e', '#c68642', '#8d5524', '#ffdbac'];

function roadNeighbors(x, y) {
  const r = [];
  for (const [dx, dy] of DIRS) { const a = x + dx, b = y + dy; if (inb(a, b) && W.road[idx(a, b)]) r.push([a, b]); }
  return r;
}

const Ents = {
  cars: [], peds: [], boats: [], flyers: [], clouds: [], flyerTimer: 20, launchTimer: 60,
  reset() { this.cars = []; this.peds = []; this.boats = []; this.flyers = []; this.flyerTimer = 15; this.launchTimer = 50; this.makeClouds(); },
  makeClouds() {
    this.clouds = [];
    for (let i = 0; i < 9; i++) this.clouds.push({ X: rnd(-N * 32 - 200, N * 32 + 200), Y: rnd(-100, N * 32 + 100), s: rnd(0.7, 1.4), v: rnd(6, 12) });
  },

  spawnMover(list, ped) {
    if (!D.roadList.length) return;
    const i = D.roadList[Math.floor(Math.random() * D.roadList.length)], x = i % N, y = (i / N) | 0;
    const nb = roadNeighbors(x, y); if (!nb.length) return;
    const [nx, ny] = pick(nb);
    const m = { x, y, nx, ny, t: Math.random(), life: rnd(20, 70) };
    if (ped) {
      Object.assign(m, { spd: rnd(0.22, 0.38), shirt: pick(SHIRTS), skin: pick(SKINS), dog: Math.random() < 0.22, side: Math.random() < 0.5 ? 1 : -1, ph: Math.random() * 6 });
    } else {
      const r = Math.random();
      let kind = 'car';
      if (r < 0.06 + Math.min(0.2, ((S.counts.types || {}).busstop || 0) * 0.04) && S.pop > 120) kind = 'bus';
      else if (r < 0.1) kind = 'icecream';
      else if (r < 0.18 && (S.counts.I || 0) > 0) kind = 'truck';
      else if (r < 0.2 && (S.counts.types || {}).police) kind = 'police';
      if (Dis.fire.size && Math.random() < 0.3) kind = 'firetruck';
      Object.assign(m, { spd: kind === 'bus' || kind === 'truck' ? rnd(0.9, 1.1) : rnd(1.1, 1.7), kind, col: pick(CAR_COLS) });
    }
    list.push(m);
  },
  stepMover(m, dt) {
    m.t += m.spd * dt; m.life -= dt;
    if (!W.road[idx(m.nx, m.ny)] || !W.road[idx(m.x, m.y)]) return false;
    while (m.t >= 1) {
      m.t -= 1;
      const px = m.x, py = m.y; m.x = m.nx; m.y = m.ny;
      const nb = roadNeighbors(m.x, m.y).filter(([a, b]) => !(a === px && b === py));
      let ch;
      const sx = m.x * 2 - px, sy = m.y * 2 - py;
      if (nb.some(([a, b]) => a === sx && b === sy) && Math.random() < 0.6) ch = [sx, sy];
      else if (nb.length) ch = pick(nb);
      else if (W.road[idx(px, py)]) ch = [px, py];
      else return false;
      m.nx = ch[0]; m.ny = ch[1];
      if (m.life < 0 && Math.random() < 0.4) return false;
    }
    return true;
  },
  moverPos(m, lane) {
    const dx = m.nx - m.x, dy = m.ny - m.y;
    return [lerp(m.x, m.nx, m.t) + 0.5 - dy * lane, lerp(m.y, m.ny, m.t) + 0.5 + dx * lane, dx, dy];
  },

  update(dt, gdt, night) {
    const roads = D.roadList.length;
    const carTarget = Math.floor(Math.min(240, roads * 0.45, 3 + S.pop / 22) * (1 - night * 0.45));
    const pedTarget = Math.floor(Math.min(180, roads * 0.5, S.pop / 12) * (1 - night * 0.7));
    if (this.cars.length < carTarget && Math.random() < 0.5) this.spawnMover(this.cars, false);
    if (this.peds.length < pedTarget && Math.random() < 0.5) this.spawnMover(this.peds, true);
    this.cars = this.cars.filter((c) => this.stepMover(c, gdt) && !(this.cars.length > carTarget + 5 && c.life < 0));
    this.peds = this.peds.filter((p) => this.stepMover(p, gdt) && !(this.peds.length > pedTarget + 5 && p.life < 0));
    this.updateBoats(gdt);
    this.updateFlyers(dt, gdt);
    for (const c of this.clouds) { c.X += c.v * dt; if (c.X > N * 32 + 400) { c.X = -N * 32 - 400; c.Y = rnd(-100, N * 32 + 100); } }
  },

  updateBoats(dt) {
    if (!this.boats.length && !this._boatsInit) {
      this._boatsInit = true;
      const water = []; for (let i = 0; i < N * N; i++) if (W.terrain[i] === T_WATER) water.push(i);
      const n = Math.min(6, Math.floor(water.length / 45));
      for (let k = 0; k < n; k++) { const i = pick(water); this.boats.push({ u: (i % N) + 0.5, v: ((i / N) | 0) + 0.5, a: Math.random() * 6.28, col: pick(['#ffffff', '#ff6fa5', '#ffd23f', '#3fa9f5']) }); }
    }
    for (const b of this.boats) {
      const nu = b.u + Math.cos(b.a) * dt * 0.35, nv = b.v + Math.sin(b.a) * dt * 0.35;
      const tx = Math.floor(nu), ty = Math.floor(nv);
      if (inb(tx, ty) && W.terrain[idx(tx, ty)] === T_WATER && !W.road[idx(tx, ty)]) { b.u = nu; b.v = nv; if (Math.random() < 0.005) b.a += rnd(-1, 1); }
      else b.a += rnd(1.5, 3.5);
    }
  },

  updateFlyers(dt, gdt) {
    this.flyerTimer -= gdt;
    if (this.flyerTimer < 0 && W.tier >= 1) {
      this.flyerTimer = rnd(35, 70);
      const kinds = ['balloon']; if (W.tier >= 2) kinds.push('balloon', 'blimp'); if (W.tier >= 3) kinds.push('plane');
      const kind = pick(kinds), dir = Math.random() < 0.5 ? 1 : -1;
      this.flyers.push({ kind, X: -dir * (N * 32 + 150), Y: rnd(N * 6, N * 26), dir, z: kind === 'plane' ? 260 : rnd(120, 170), spd: kind === 'plane' ? 110 : kind === 'blimp' ? 22 : 16, col: pick(['#ff5d8f', '#ffd23f', '#5ce1e6', '#8fe36b', '#b48cff']) });
    }
    // rockets from the space center
    const sc = [...W.buildings.values()].find((b) => b.type === 'space');
    if (sc && !sc.launching) { this.launchTimer -= gdt; if (this.launchTimer < 0) { this.launchTimer = rnd(80, 140); FX.launchRocket(sc); } }
    for (const f of this.flyers) {
      if (f.kind === 'rocket') {
        f.t += dt;
        if (f.t > 1.6) { f.vy += (60 + f.t * 40) * dt; f.z += f.vy * dt; FX.smoke(f.X + rnd(-4, 4), f.Y - f.z + 6, 1.4, '#f2f2f2', 0.8); }
        else FX.smoke(f.X + rnd(-26, 26), f.Y + rnd(-4, 6), 1.8, '#e8e8e8', 1.5);
        if (f.z > 1600) { f.dead = true; setTimeout(() => { f.b.launching = false; }, 15000); }
        continue;
      }
      f.X += f.dir * f.spd * dt;
      if (Math.abs(f.X) > N * 32 + 300) f.dead = true;
    }
    this.flyers = this.flyers.filter((f) => !f.dead);
  },

  // ---------------- drawing ----------------
  bucketize(buckets) {
    const add = (d, fn) => { if (d >= 0 && d < buckets.length) buckets[d].push(fn); };
    for (const c of this.cars) { const [u, v, dx, dy] = this.moverPos(c, 0.15); add(Math.floor(u) + Math.floor(v), { car: c, u, v, dx, dy }); }
    for (const p of this.peds) { const [u, v, dx, dy] = this.moverPos(p, 0.38 * p.side); add(Math.floor(u) + Math.floor(v), { ped: p, u, v, dx, dy }); }
    for (const b of this.boats) add(Math.floor(b.u) + Math.floor(b.v), { boat: b });
  },
  drawItem(P, it, night, t) {
    if (it.car) this.drawCar(P, it, night);
    else if (it.ped) this.drawPed(P, it, night, t);
    else if (it.boat) this.drawBoat(P, it.boat, t);
  },
  drawCar(P, it, night) {
    const { car, u, v, dx } = it;
    const along = dx !== 0, L = car.kind === 'bus' ? 0.3 : car.kind === 'truck' ? 0.26 : 0.17, Wd = car.kind === 'bus' ? 0.11 : 0.09;
    const hu = along ? L : Wd, hv = along ? Wd : L;
    let body = car.col, hgt = 5, cab = '#bfe6ff';
    if (car.kind === 'bus') { body = '#ffc61a'; hgt = 9; }
    if (car.kind === 'icecream') { body = '#ffffff'; hgt = 8; }
    if (car.kind === 'truck') { body = '#e8e8e8'; hgt = 9; }
    if (car.kind === 'police') body = '#ffffff';
    if (car.kind === 'firetruck') { body = '#e8283c'; hgt = 8; }
    const dk = night > 0.05 ? (c) => mix(c, '#141a3c', night * 0.55) : (c) => c;
    P.box(u - hu, v - hv, u + hu, v + hv, 0.5, hgt, dk(body), { outline: false, right: dk(shade(body, -0.25)), top: dk(shade(body, 0.15)), left: dk(body) });
    if (car.kind === 'car' || car.kind === 'police') {
      const cu = along ? hu * 0.55 : hu * 0.8, cv = along ? hv * 0.8 : hv * 0.55;
      P.box(u - cu, v - cv, u + cu, v + cv, hgt, hgt + 3, dk(cab), { outline: false, top: dk(car.kind === 'police' ? '#222244' : shade(body, 0.1)) });
      if (car.kind === 'police') { const [x, y] = Pw(u, v, hgt + 4); P.circle(x - 1.5, y, 1.2, '#ff3030'); P.circle(x + 1.5, y, 1.2, '#3060ff'); }
    } else if (car.kind === 'bus') {
      if (along) P.poly(P.qL(u - hu + 0.03, u + hu - 0.03, v + hv, 4, 7), dk(cab)); else P.poly(P.qR(v - hv + 0.03, v + hv - 0.03, u + hu, 4, 7), dk(cab));
    } else if (car.kind === 'firetruck') {
      const [x, y] = Pw(u, v, hgt + 1); P.circle(x, y, 1.6, Math.sin(performance.now() / 90) > 0 ? '#ff3030' : '#3060ff');
    } else if (car.kind === 'icecream') {
      const [x, y] = Pw(u, v, hgt); P.poly([[x - 2, y - 3], [x + 2, y - 3], [x, y + 1]], '#e2a65c'); P.circle(x, y - 4, 2.2, '#ff8fb8');
    }
    if (night > 0.3) {
      const [fx, fy] = Pw(u + it.dx * L, v + it.dy * L, 2), g = P.g;
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = night * 0.7; g.drawImage(GLOW, fx - 6, fy - 6, 12, 12); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
  },
  drawPed(P, it, night, t) {
    const { ped, u, v } = it, [x, y] = Pw(u, v, 0), g = P.g;
    const bob = Math.abs(Math.sin(t * 9 + ped.ph)) * 0.6;
    const dk = (c) => (night > 0.05 ? mix(c, '#141a3c', night * 0.5) : c);
    g.fillStyle = dk('#3d3d5c'); g.fillRect(x - 0.8, y - 2.4, 1.6, 2.4);
    g.fillStyle = dk(ped.shirt); g.fillRect(x - 1.1, y - 4.8 - bob, 2.2, 2.6);
    g.fillStyle = dk(ped.skin); g.beginPath(); g.arc(x, y - 5.8 - bob, 1.1, 0, 7); g.fill();
    if (ped.dog) {
      const [dx, dy] = Pw(u - it.dx * 0.12, v - it.dy * 0.12, 0);
      g.fillStyle = dk(PERSONAL.dogColors.fur); g.beginPath(); g.ellipse(dx, dy - 1.2, 1.6, 1, 0, 0, 7); g.fill(); g.beginPath(); g.arc(dx + (it.dx - it.dy) * 1.4, dy - 2, 0.8, 0, 7); g.fill();
    }
  },
  drawBoat(P, b, t) {
    const [x, y] = Pw(b.u, b.v, 0), g = P.g;
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(x - Math.cos(b.a) * 5, y, 5, 2, 0, 0, 7); g.stroke();
    g.fillStyle = '#8a5a3c'; g.beginPath(); g.ellipse(x, y - 1 + Math.sin(t * 2 + b.u) * 0.5, 4.5, 1.8, 0, 0, Math.PI); g.fill();
    g.fillStyle = b.col; g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x + 4, y - 2); g.lineTo(x, y - 2); g.fill();
    g.strokeStyle = '#5a3a24'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x, y - 1); g.stroke();
  },
  drawShadows(P) {
    const g = P.g;
    g.save(); diamondPath(g, 0, 0, N); g.clip();
    g.fillStyle = 'rgba(20,40,60,0.10)';
    for (const c of this.clouds) { g.beginPath(); g.ellipse(c.X + 40, c.Y + 30, 90 * c.s, 34 * c.s, 0, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(20,40,60,0.18)';
    for (const f of this.flyers) { if (f.kind === 'rocket') continue; g.beginPath(); g.ellipse(f.X, f.Y, f.kind === 'blimp' ? 22 : 8, f.kind === 'blimp' ? 7 : 3.5, 0, 0, 7); g.fill(); }
    g.restore();
  },
  drawFlyers(P, t, night) {
    const g = P.g;
    for (const f of this.flyers) {
      const x = f.X, y = f.Y - f.z;
      if (f.kind === 'rocket') { drawRocket(g, x, y, 1, f.t > 1.2 ? 1 : 0.5); if (night > 0.2) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.8; g.drawImage(GLOW, x - 30, y - 10, 60, 60); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } continue; }
      if (f.kind === 'balloon') {
        const bob = Math.sin(t + f.Y) * 3;
        g.strokeStyle = '#5a3a24'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x - 6, y + 2 + bob); g.lineTo(x - 3, y + 14 + bob); g.moveTo(x + 6, y + 2 + bob); g.lineTo(x + 3, y + 14 + bob); g.stroke();
        g.fillStyle = '#8a5a3c'; g.fillRect(x - 3.5, y + 13 + bob, 7, 5);
        g.fillStyle = f.col; g.beginPath(); g.ellipse(x, y - 8 + bob, 13, 15, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(x, y - 8 + bob, 5, 15, 0, 0, 7); g.fill();
        g.fillStyle = shade(f.col, -0.2); g.beginPath(); g.moveTo(x - 9, y + 2 + bob); g.lineTo(x + 9, y + 2 + bob); g.lineTo(x + 4, y + 7 + bob); g.lineTo(x - 4, y + 7 + bob); g.fill();
      } else if (f.kind === 'blimp') {
        g.save(); g.translate(x, y); g.scale(f.dir, 1);
        g.fillStyle = '#d8dde6'; g.beginPath(); g.ellipse(0, 0, 40, 13, 0, 0, 7); g.fill();
        g.fillStyle = '#b8bec8'; g.beginPath(); g.moveTo(-34, -2); g.lineTo(-48, -12); g.lineTo(-46, 0); g.lineTo(-48, 12); g.lineTo(-34, 2); g.fill();
        g.fillStyle = '#9aa3ad'; g.fillRect(-6, 11, 12, 5);
        g.fillStyle = '#ff6fa5'; g.fillRect(-26, -5, 52, 10);
        g.restore();
        g.font = `700 7px ${SPRITE_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
        g.fillText(`♥ ${W.cityName} ♥`.slice(0, 22), x, y + 0.5);
        if (night > 0.3) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.4 * night; g.drawImage(GLOW, x - 34, y - 14, 68, 28); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
      } else if (f.kind === 'plane') {
        g.save(); g.translate(x, y); g.scale(f.dir, 1);
        g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(0, 0, 16, 3.2, 0, 0, 7); g.fill();
        g.fillStyle = '#e0e4ea'; g.beginPath(); g.moveTo(-3, 0); g.lineTo(-8, 10); g.lineTo(-4, 10); g.lineTo(4, 0); g.fill();
        g.beginPath(); g.moveTo(-12, -1); g.lineTo(-17, -8); g.lineTo(-14, -8); g.lineTo(-9, -1); g.fill();
        g.fillStyle = '#3fa9f5'; g.fillRect(-6, -1, 14, 1.2);
        if (Math.sin(t * 6) > 0) { g.fillStyle = '#ff3030'; g.beginPath(); g.arc(-6, 9, 1.3, 0, 7); g.fill(); }
        g.restore();
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - f.dir * 16, y); g.lineTo(x - f.dir * 120, y); g.stroke();
      }
    }
  },
  drawClouds(P, zoom, night) {
    const g = P.g, a = clamp(1.6 - zoom, 0, 0.55) * (1 - night * 0.6);
    if (a <= 0.01) return;
    g.globalAlpha = a;
    for (const c of this.clouds) g.drawImage(CLOUD, c.X - 110 * c.s, c.Y - 260 - 50 * c.s, 220 * c.s, 100 * c.s);
    g.globalAlpha = 1;
  },
};

const CLOUD = (() => {
  const cv = document.createElement('canvas'); cv.width = 440; cv.height = 200;
  const g = cv.getContext('2d');
  const puffs = [[120, 120, 60], [190, 95, 75], [270, 110, 65], [330, 130, 50], [220, 140, 60], [90, 145, 40]];
  for (const [x, y, r] of puffs) { const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.7, 'rgba(250,252,255,0.95)'); gr.addColorStop(1, 'rgba(230,240,250,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  return cv;
})();

// =====================================================================
//  Particles & effects
// =====================================================================
const FW_COLS = ['#ff5d8f', '#ffd23f', '#5ce1e6', '#8fe36b', '#b48cff', '#ff8c42', '#ffffff'];
const FX = {
  parts: [], texts: [], shells: [], conf: [], showQueue: [], smokeT: 0, wx: [],
  reset() { this.parts = []; this.texts = []; this.shells = []; this.conf = []; this.showQueue = []; },
  smoke(X, Y, r, col, life = 3) {
    if (this.parts.length > 900) return;
    this.parts.push({ X, Y, vx: rnd(-3, 3) + 4, vy: rnd(-14, -9), r, grow: 3.5, life, max: life, col, kind: 'smoke' });
  },
  construct(b, upgrade) {
    if (!Game.visible(b.x, b.y)) return;
    const s = b.size;
    for (let i = 0; i < 10 * s; i++) {
      const [X, Y] = Pw(b.x + rnd(0, s), b.y + rnd(0, s), 0);
      this.parts.push({ X, Y, vx: rnd(-14, 14), vy: rnd(-12, -2), r: rnd(2, 4), grow: 4, life: 0.9, max: 0.9, col: '#e8dcc4', kind: 'smoke' });
    }
    if (upgrade) {
      const [X, Y] = Pw(b.x + 0.5, b.y + 0.5, 30);
      for (let i = 0; i < 14; i++) this.parts.push({ X, Y, vx: rnd(-40, 40), vy: rnd(-60, -10), r: 1.5, life: 1, max: 1, col: pick(['#ffe14d', '#ffffff', '#ff9fcf']), kind: 'spark', g: 60 });
    }
  },
  coinText(X, Y, txt, col = '#ffe14d') { this.texts.push({ X, Y, txt, life: 1.6, max: 1.6, col }); },
  taxCoins(net) {
    const list = [...W.buildings.values()].filter((b) => (b.type === 'C' || b.type === 'R' || (BT[b.type] && BT[b.type].landmark)) && Game.visible(b.x, b.y));
    const n = Math.min(4, list.length);
    for (let k = 0; k < n; k++) {
      const b = list[Math.floor(Math.random() * list.length)];
      const [X, Y] = Pw(b.x + b.size / 2, b.y + b.size / 2, 30 + b.level * 10);
      this.coinText(X, Y, '+' + fmtMoney(Math.max(1, Math.round(net / (n * rnd(1.5, 3))))));
    }
    if (n) Sound.play('coin');
  },
  firework(X, Y) { this.shells.push({ X, Y, vy: -rnd(170, 230), vx: rnd(-15, 15), fuse: rnd(0.85, 1.25), col: pick(FW_COLS), col2: pick(FW_COLS) }); Sound.play('launch'); },
  fireworksShow(n, dur, at) {
    const center = at || cityCenter(), spread = at ? 60 : 260;
    for (let i = 0; i < n; i++) this.showQueue.push({ t: rnd(0, dur), X: center[0] + rnd(-spread, spread), Y: center[1] + rnd(-spread / 3, spread / 3) });
  },
  confetti(n) {
    const w = innerWidth;
    for (let i = 0; i < n; i++) this.conf.push({ x: rnd(0, w), y: rnd(-200, -10), vx: rnd(-40, 40), vy: rnd(60, 160), r: rnd(0, 6), vr: rnd(-6, 6), col: pick(FW_COLS), w: rnd(5, 9), h: rnd(3, 5), life: 5 });
  },
  launchRocket(b) {
    if (b.launching) return;
    b.launching = true;
    const [X, Y] = Pw(b.x + 1.7, b.y + 1.3, 8);
    Ents.flyers.push({ kind: 'rocket', X, Y, z: 0, vy: 0, t: 0, b });
    Sound.play('rocket');
    if (Game.state === 'play') Game.shake = 2.2;
    UI.toast(`🚀 3… 2… 1… LIFTOFF from ${BT.space.name}!`);
  },
  update(dt) {
    for (const q of this.showQueue) { q.t -= dt; if (q.t <= 0) { this.firework(q.X, q.Y); q.done = true; } }
    this.showQueue = this.showQueue.filter((q) => !q.done);
    for (const s of this.shells) {
      s.fuse -= dt; s.X += s.vx * dt; s.Y += s.vy * dt; s.vy += 40 * dt;
      if (Math.random() < 0.6) this.parts.push({ X: s.X, Y: s.Y, vx: rnd(-5, 5), vy: rnd(0, 10), r: 1, life: 0.4, max: 0.4, col: '#ffe9b0', kind: 'spark', g: 20 });
      if (s.fuse <= 0) {
        s.dead = true; Sound.play('boom');
        const n = rint(45, 70), ring = Math.random() < 0.4;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + rnd(-0.05, 0.05), sp = ring ? 95 : rnd(30, 110);
          this.parts.push({ X: s.X, Y: s.Y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.85, r: rnd(1.2, 2), life: rnd(1.2, 1.9), max: 1.8, col: i % 3 ? s.col : s.col2, kind: 'fw', g: 35 });
        }
        this.parts.push({ X: s.X, Y: s.Y, vx: 0, vy: 0, r: 40, life: 0.25, max: 0.25, col: s.col, kind: 'flash' });
      }
    }
    this.shells = this.shells.filter((s) => !s.dead);
    for (const p of this.parts) {
      p.life -= dt; p.X += p.vx * dt; p.Y += p.vy * dt;
      if (p.kind === 'smoke') { p.r += p.grow * dt; p.vx *= 0.99; }
      else { p.vy += (p.g || 0) * dt; p.vx *= 0.985; p.vy *= 0.985; }
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const t of this.texts) { t.life -= dt; t.Y -= 18 * dt; }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const c of this.conf) { c.life -= dt; c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt; c.vx *= 0.99; }
    this.conf = this.conf.filter((c) => c.life > 0 && c.y < innerHeight + 20);
    // seasonal weather: snow, falling leaves, spring petals
    const want = { winter: 140, autumn: 30, spring: 30, summer: 0 }[SEASON] || 0;
    if (this.wx.length < want && Math.random() < 0.6) {
      const kind = SEASON;
      this.wx.push({ kind, x: rnd(-40, innerWidth + 40), y: -10, vy: kind === 'winter' ? rnd(25, 55) : rnd(35, 60), sway: rnd(0.5, 1.5), ph: rnd(0, 6), r: kind === 'winter' ? rnd(1.2, 3) : rnd(3, 5), rot: rnd(0, 6), col: kind === 'autumn' ? pick(['#e8823a', '#d9534f', '#f2b134', '#c9763c']) : kind === 'spring' ? pick(['#ffc6dd', '#ffffff', '#ffd1e6']) : '#ffffff' });
    }
    for (const w of this.wx) { w.ph += dt * w.sway; w.y += w.vy * dt; w.x += Math.sin(w.ph) * 18 * dt + (w.kind === 'winter' ? 6 : 14) * dt; w.rot += dt * 2; }
    this.wx = this.wx.filter((w) => w.y < innerHeight + 10 && (w.kind === SEASON || Math.random() > 0.02));
    // factory & power plant smoke
    this.smokeT -= dt;
    if (this.smokeT <= 0 && Game.state === 'play' || (this.smokeT <= 0 && Game.state === 'title')) {
      this.smokeT = 0.3;
      for (const b of W.buildings.values()) {
        if (!b.powered && !(BT[b.type] && BT[b.type].power)) continue;
        if (!(b.type === 'I' && b.level >= 2) && b.type !== 'coal' && b.type !== 'nuclear') continue;
        if (!Game.visible(b.x, b.y, 4)) continue;
        const spr = spriteFor(b);
        for (const [ex, ey] of spr.emit) { const [X0, Y0] = Pw(b.x, b.y, 0); this.smoke(X0 + ex, Y0 + ey, b.type === 'nuclear' ? 5 : 2.5, b.type === 'coal' ? '#9a9aa2' : b.type === 'nuclear' ? '#f4f6f8' : '#d8d8de', 3.5); }
      }
    }
  },
  draw(P, night) {
    const g = P.g;
    for (const p of this.parts) {
      const a = clamp(p.life / p.max, 0, 1);
      if (p.kind === 'smoke') { g.globalAlpha = a * 0.55 * (1 - night * 0.5); g.fillStyle = p.col; g.beginPath(); g.arc(p.X, p.Y, p.r, 0, 7); g.fill(); }
    }
    g.globalCompositeOperation = 'lighter';
    for (const p of this.parts) {
      const a = clamp(p.life / p.max, 0, 1);
      if (p.kind === 'flash') { g.globalAlpha = a * 0.6; g.drawImage(GLOW, p.X - p.r * 2, p.Y - p.r * 2, p.r * 4, p.r * 4); }
      else if (p.kind !== 'smoke') { g.globalAlpha = a; g.fillStyle = p.col; g.beginPath(); g.arc(p.X, p.Y, p.r, 0, 7); g.fill(); }
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const t of this.texts) {
      const a = clamp(t.life / t.max * 2, 0, 1);
      g.globalAlpha = a; g.font = `700 11px ${SPRITE_FONT}`; g.lineWidth = 3; g.strokeStyle = 'rgba(60,40,0,0.8)'; g.strokeText(t.txt, t.X, t.Y); g.fillStyle = t.col; g.fillText(t.txt, t.X, t.Y);
    }
    g.globalAlpha = 1;
  },
  drawScreen(g) {
    for (const w of this.wx) {
      if (w.kind === 'winter') { g.globalAlpha = 0.85; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(w.x, w.y, w.r, 0, 7); g.fill(); continue; }
      g.save(); g.translate(w.x, w.y); g.rotate(w.rot); g.globalAlpha = 0.9; g.fillStyle = w.col; g.beginPath(); g.ellipse(0, 0, w.r, w.r * 0.5, 0, 0, 7); g.fill(); g.restore();
    }
    g.globalAlpha = 1;
    for (const c of this.conf) { g.save(); g.translate(c.x, c.y); g.rotate(c.r); g.globalAlpha = clamp(c.life, 0, 1); g.fillStyle = c.col; g.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); g.restore(); }
    g.globalAlpha = 1;
  },
};

function cityCenter() {
  let sx = 0, sy = 0, n = 0;
  for (const b of W.buildings.values()) { sx += b.x; sy += b.y; n++; }
  const [X, Y] = n ? Pw(sx / n + 0.5, sy / n + 0.5, 0) : Pw(N / 2, N / 2, 0);
  return [X, Y - 50];
}
