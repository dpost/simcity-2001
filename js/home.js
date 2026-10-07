'use strict';
// =====================================================================
//  YOUR HOME: an isometric room where you place the furniture you bought
// =====================================================================
const ROOM = 8, WALL_H = 120;
const FLOORS = ['#d9a46b', '#ecd9bf', '#c9d6e3', '#f2c6d4', '#b8d8b0', '#f4f4f4'];
const WALLS = ['#fff4e6', '#ffe1ee', '#e1f0ff', '#e8ffe1', '#f1e6ff', '#fff6c2', '#d6f5f0', '#ffd9c2'];

// F = furniture painter: local axes a (width) and b (depth); rotation swaps them
function furnPainter(P, x, y, rot) {
  const m = (a, b) => (rot ? [x + b, y + a] : [x + a, y + b]);
  return {
    P, g: P.g, rot,
    pt(a, b, z = 0) { const [u, v] = m(a, b); return P.iso(u, v, z); },
    box(a0, b0, a1, b1, z0, z1, col, o) { const [u0, v0] = m(a0, b0), [u1, v1] = m(a1, b1); P.box(Math.min(u0, u1), Math.min(v0, v1), Math.max(u0, u1), Math.max(v0, v1), z0, z1, col, o); },
    // a rectangle drawn on the "front" face of the item (b = b1 plane)
    front(a0, a1, b, z0, z1, col) { if (rot) { const [u, v0] = m(b, a0), [, v1] = m(b, a1); P.poly(P.qR(Math.min(v0, v1), Math.max(v0, v1), u, z0, z1), col, 'rgba(0,0,0,0.2)', 0.5); } else { const [u0, v] = m(a0, b), [u1] = m(a1, b); P.poly(P.qL(Math.min(u0, u1), Math.max(u0, u1), v, z0, z1), col, 'rgba(0,0,0,0.2)', 0.5); } },
  };
}
const FURN = {
  bed(F) { F.box(0.05, 0, 0.95, 0.12, 0, 26, '#8a5a3c'); F.box(0.05, 0.1, 0.95, 1.95, 0, 8, '#a0663c'); F.box(0.1, 0.12, 0.9, 1.9, 8, 12, '#ffffff'); F.box(0.2, 0.18, 0.8, 0.55, 12, 15, '#f4f4f4'); F.box(0.08, 0.7, 0.92, 1.92, 12, 13.5, '#ff8fbd'); },
  bunk(F) { for (const z of [0, 26]) { F.box(0.08, 0.1, 0.92, 1.9, z + 6, z + 10, '#ffffff'); F.box(0.06, 0.7, 0.94, 1.92, z + 10, z + 11.5, z ? '#9b6bff' : '#5ce1e6'); F.box(0.2, 0.15, 0.8, 0.5, z + 10, z + 13, '#f4f4f4'); }
    for (const [a, b] of [[0.05, 0.05], [0.85, 0.05], [0.05, 1.85], [0.85, 1.85]]) F.box(a, b, a + 0.1, b + 0.1, 0, 50, '#c08a4a'); F.box(0.05, 0.1, 0.95, 1.9, 26, 30, '#a0663c'); },
  sofa(F) { const c = '#ff8fbd'; F.box(0.05, 0.05, 1.95, 0.32, 0, 22, shade(c, -0.1)); F.box(0.05, 0.25, 1.95, 0.95, 0, 9, c); F.box(0.15, 0.3, 0.95, 0.9, 9, 12, shade(c, 0.15)); F.box(1.05, 0.3, 1.85, 0.9, 9, 12, shade(c, 0.15)); F.box(0.02, 0.25, 0.22, 0.95, 0, 15, c); F.box(1.78, 0.25, 1.98, 0.95, 0, 15, c); },
  armchair(F) { const c = '#5ce1e6'; F.box(0.1, 0.08, 0.9, 0.32, 0, 22, shade(c, -0.1)); F.box(0.1, 0.25, 0.9, 0.92, 0, 9, c); F.box(0.05, 0.25, 0.25, 0.92, 0, 15, c); F.box(0.75, 0.25, 0.95, 0.92, 0, 15, c); },
  beanbag(F) { const [x, y] = F.pt(0.5, 0.5, 0); F.g.save(); const g = F.g, gr = g.createRadialGradient(x - 6, y - 14, 2, x, y - 8, 22); gr.addColorStop(0, '#d9b8ff'); gr.addColorStop(1, '#8a5bd9'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y - 7, 20, 13, 0, 0, 7); g.fill(); g.restore(); },
  table(F) { for (const [a, b] of [[0.15, 0.15], [0.75, 0.15], [0.15, 0.75], [0.75, 0.75]]) F.box(a, b, a + 0.08, b + 0.08, 0, 15, '#8a5a3c'); F.box(0.08, 0.08, 0.92, 0.92, 15, 17.5, '#c08a4a'); const [x, y] = F.pt(0.5, 0.5, 17.5); F.P.ellipse(x, y - 1, 5, 2.5, '#ffffff'); F.P.ball(x, y - 3, 2.5, '#e8283c'); },
  chair(F) { for (const [a, b] of [[0.25, 0.25], [0.68, 0.25], [0.25, 0.68], [0.68, 0.68]]) F.box(a, b, a + 0.07, b + 0.07, 0, 10, '#8a5a3c'); F.box(0.22, 0.22, 0.78, 0.78, 10, 12, '#c08a4a'); F.box(0.22, 0.2, 0.78, 0.28, 12, 26, '#c08a4a'); },
  desk(F) { F.box(0.05, 0.1, 0.3, 0.9, 0, 15, '#e8e8f0'); F.box(1.7, 0.1, 1.95, 0.9, 0, 15, '#e8e8f0'); F.box(0.02, 0.05, 1.98, 0.95, 15, 17, '#ffffff'); F.front(0.1, 0.25, 0.9, 4, 12, '#d0d0dc'); const [x, y] = F.pt(1.3, 0.4, 17); F.P.circle(x, y - 3, 3, '#ffd23f'); },
  lamp(F, t, night) { const [x, y] = F.pt(0.5, 0.5, 0), g = F.g; F.P.ellipse(x, y, 6, 3, '#555'); F.P.line([x, y], [x, y - 34], '#555', 1.5); g.fillStyle = '#fff3c4'; g.beginPath(); g.moveTo(x - 6, y - 32); g.lineTo(x + 6, y - 32); g.lineTo(x + 4, y - 42); g.lineTo(x - 4, y - 42); g.fill(); if (night > 0.2) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6; g.drawImage(GLOW, x - 30, y - 60, 60, 60); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } },
  plant(F) { F.box(0.3, 0.3, 0.7, 0.7, 0, 10, '#d9784a'); const [x, y] = F.pt(0.5, 0.5, 10); F.P.ball(x - 5, y - 6, 6, '#3fa56b'); F.P.ball(x + 5, y - 7, 6, '#4caf50'); F.P.ball(x, y - 13, 7, '#5cc060'); },
  flowers(F) { F.box(0.35, 0.35, 0.65, 0.65, 0, 9, '#9fd8ff'); const [x, y] = F.pt(0.5, 0.5, 9); for (let k = 0; k < 5; k++) { const a = k * 1.3; F.P.line([x, y], [x + Math.cos(a) * 5, y - 10 - Math.sin(a) * 3], '#3a8a3a', 1); F.P.circle(x + Math.cos(a) * 5, y - 11 - Math.sin(a) * 3, 2.2, PAL.flowers[k]); } },
  rug(F) { const [x, y] = F.pt(1, 1, 0.3), g = F.g; g.fillStyle = '#ff9fc4'; g.beginPath(); g.ellipse(x, y, 52, 26, 0, 0, 7); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 40, 20, 0, 0, 7); g.stroke(); g.fillStyle = '#ffd1e6'; g.beginPath(); g.ellipse(x, y, 22, 11, 0, 0, 7); g.fill(); },
  bookshelf(F) { F.box(0.1, 0.25, 0.9, 0.95, 0, 50, '#a0663c'); const cols = ['#e8283c', '#3f6fd8', '#ffd23f', '#3fb067', '#9b6bff', '#ff8c42']; for (let s = 0; s < 4; s++) { const z = 4 + s * 12; for (let k = 0; k < 6; k++) F.front(0.15 + k * 0.12, 0.24 + k * 0.12, 0.95, z, z + 8 + (k % 2), cols[(k + s) % 6]); } },
  wardrobe(F) { F.box(0.08, 0.25, 0.92, 0.95, 0, 56, '#f2e6d8'); F.front(0.12, 0.49, 0.95, 4, 52, '#ead9c6'); F.front(0.51, 0.88, 0.95, 4, 52, '#ead9c6'); F.front(0.45, 0.48, 0.95, 26, 32, '#c9a227'); F.front(0.52, 0.55, 0.95, 26, 32, '#c9a227'); },
  tv(F, t) { F.box(0.1, 0.4, 0.9, 0.9, 0, 10, '#5a5a66'); F.box(0.08, 0.5, 0.92, 0.6, 10, 34, '#222'); F.front(0.12, 0.88, 0.6, 12, 32, `hsl(${(t * 40) % 360},70%,65%)`); },
  console(F) { F.box(0.1, 0.4, 0.9, 0.9, 0, 10, '#5a5a66'); F.box(0.25, 0.5, 0.75, 0.8, 10, 14, '#ffffff'); const [x, y] = F.pt(0.5, 0.95, 0); F.P.ellipse(x, y - 2, 4, 2, '#e8283c'); },
  computer(F, t) { F.box(0.05, 0.1, 0.95, 0.9, 0, 15, '#ffffff'); F.box(0.2, 0.3, 0.8, 0.4, 15, 33, '#333'); F.front(0.24, 0.76, 0.4, 18, 31, Math.sin(t * 2) > 0 ? '#7fd3ff' : '#9fe0ff'); F.box(0.3, 0.55, 0.7, 0.75, 15, 16, '#ddd'); },
  fridge(F) { F.box(0.1, 0.15, 0.9, 0.9, 0, 52, '#f6f8fb'); F.front(0.75, 0.8, 0.9, 30, 46, '#999'); F.front(0.75, 0.8, 0.9, 8, 24, '#999'); F.front(0.12, 0.88, 0.9, 27, 28, '#ccc'); F.front(0.25, 0.4, 0.9, 38, 44, '#ff8fbd'); },
  piano(F) { F.box(0.05, 0.05, 1.95, 0.55, 0, 34, '#1d1d24'); F.box(0.05, 0.55, 1.95, 0.8, 14, 17, '#1d1d24'); F.box(0.1, 0.56, 1.9, 0.78, 17, 18, '#ffffff'); for (let k = 0; k < 14; k++) if (k % 7 !== 2 && k % 7 !== 6) { const a = 0.15 + k * 0.125; F.box(a, 0.56, a + 0.05, 0.68, 18, 19, '#111'); } F.box(0.6, 0.85, 1.4, 1.0, 0, 9, '#1d1d24'); },
  aquarium(F, t) { F.box(0.05, 0.2, 1.95, 0.9, 0, 12, '#5a5a66'); F.box(0.08, 0.25, 1.92, 0.85, 12, 36, 'rgba(100,190,240,0.55)', { top: 'rgba(160,220,250,0.6)' }); for (let k = 0; k < 4; k++) { const a = 0.3 + ((t * 0.15 + k * 0.4) % 1.4), [x, y] = F.pt(a, 0.85, 18 + k * 4); F.P.ellipse(x, y, 3, 1.8, ['#ff8c42', '#ffd23f', '#ff5d8f', '#5ce1e6'][k]); } const [bx, by] = F.pt(1.6, 0.7, 13); F.P.ball(bx, by - 2, 3, '#3fa56b'); },
  fireplace(F, t) { F.box(0.05, 0.3, 1.95, 0.9, 0, 40, '#c96f53'); F.box(0.0, 0.25, 2.0, 0.95, 40, 43, '#e8e1d0'); F.front(0.5, 1.5, 0.9, 2, 24, '#2a1a14'); for (let k = 0; k < 4; k++) { const [x, y] = F.pt(0.65 + k * 0.23, 0.9, 4); const h = 8 + Math.sin(t * 9 + k * 2) * 3; F.g.fillStyle = k % 2 ? '#ffd23f' : '#ff8c42'; F.g.beginPath(); F.g.moveTo(x - 3, y); F.g.quadraticCurveTo(x, y - h * 1.6, x + 3, y); F.g.fill(); } },
  dogbed(F) { const [x, y] = F.pt(0.5, 0.5, 0); F.P.ellipse(x, y - 2, 22, 11, '#7fa7d9'); F.P.ellipse(x, y - 3, 16, 8, '#bcd6f5'); },
  cattower(F) { F.box(0.4, 0.4, 0.6, 0.6, 0, 46, '#e6d4b8'); F.box(0.1, 0.1, 0.9, 0.9, 0, 4, '#b48cff'); F.box(0.15, 0.2, 0.7, 0.75, 22, 25, '#b48cff'); F.box(0.25, 0.25, 0.85, 0.85, 46, 49, '#b48cff'); },
  telescope(F) { const [x, y] = F.pt(0.5, 0.5, 0), g = F.g; F.P.line([x, y - 22], [x - 8, y], '#555', 1.5); F.P.line([x, y - 22], [x + 8, y], '#555', 1.5); F.P.line([x, y - 22], [x, y + 3], '#555', 1.5); g.save(); g.translate(x, y - 24); g.rotate(-0.6); g.fillStyle = '#f2f2f2'; g.fillRect(-14, -3.5, 28, 7); g.fillStyle = '#3f6fd8'; g.fillRect(10, -4, 4, 8); g.restore(); },
  robot(F, t) { const [x, y0] = F.pt(0.5, 0.5, 0), y = y0 - Math.abs(Math.sin(t * 3)) * 3, g = F.g; g.fillStyle = '#c9ced6'; g.fillRect(x - 7, y - 18, 14, 14); g.fillStyle = '#e8ecf2'; g.fillRect(x - 6, y - 30, 12, 11); g.fillStyle = '#5ce1e6'; g.fillRect(x - 4, y - 27, 3, 3); g.fillRect(x + 1, y - 27, 3, 3); F.P.line([x, y - 30], [x, y - 36], '#888', 1); F.P.circle(x, y - 37, 1.6, Math.sin(t * 5) > 0 ? '#ff3030' : '#ffd23f'); g.fillStyle = '#7d8590'; g.fillRect(x - 6, y - 4, 4, 4); g.fillRect(x + 2, y - 4, 4, 4); },
  disco(F, t) { const [x, y] = F.pt(0.5, 0.5, 105), g = F.g; F.P.line([x, y - 20], [x, y - 8], '#999', 1); const gr = g.createRadialGradient(x - 3, y - 3, 1, x, y, 9); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#9aa3ad'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { const a = t * 1.5 + k; const [fx, fy] = F.pt(0.5 + Math.cos(a) * 2.5, 0.5 + Math.sin(a) * 2.5, 0); g.fillStyle = `hsla(${k * 60},90%,65%,0.35)`; g.beginPath(); g.ellipse(fx, fy, 9, 4.5, 0, 0, 7); g.fill(); } g.globalCompositeOperation = 'source-over'; },
};

const Home = {
  isOpen: false, holding: null, rot: 0, hover: null, cv: null, g: null, t: 0, msg: '',
  open() {
    if (!Life.home()) { UI.toast('You need a home first!'); return; }
    UI.closeModal();
    this.isOpen = true; this.holding = null; this.rot = 0;
    this.cv = $('homeCanvas'); this.g = this.cv.getContext('2d');
    $('homeView').classList.remove('hidden');
    this.resize(); this.renderPanel();
    if (!W.flags.homeHelp) { W.flags.homeHelp = true; this.tip('Welcome home! Click furniture on the left, then click the floor to place it. Click placed furniture to move it. Press R to turn it.'); }
    Sound.play('select');
  },
  close() { this.isOpen = false; this.holding = null; $('homeView').classList.add('hidden'); Sound.play('click'); Save.save(); },
  tip(t) { $('homeTip').textContent = t; },
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
    this.cv.width = w * dpr; this.cv.height = h * dpr; this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px'; this.dpr = dpr;
    this.scale = Math.min((w - 340) / (ROOM * 64 + 40), (h - 120) / (ROOM * 32 + WALL_H + 40)); this.ox = 300 + (w - 300) / 2; this.oy = (h - ROOM * 32 * this.scale) / 2 + WALL_H * this.scale * 0.45;
  },
  toRoom(sx, sy) { const X = (sx - this.ox) / this.scale, Y = (sy - this.oy) / this.scale; return [(X / 32 + Y / 16) / 2, (Y / 16 - X / 32) / 2]; },
  dims(it, rot) { const I = ITEMS[it]; return rot ? [I.d, I.w] : [I.w, I.d]; },
  fits(id, x, y, rot, ignore) {
    const [w, d] = this.dims(id, rot), flat = !!ITEMS[id].flat;
    if (x < 0 || y < 0 || x + w > ROOM || y + d > ROOM) return false;
    for (const o of Life.room.items) {
      if (o === ignore || !!ITEMS[o.id].flat !== flat) continue;
      const [ow, od] = this.dims(o.id, o.rot);
      if (x < o.x + ow && x + w > o.x && y < o.y + od && y + d > o.y) return false;
    }
    return true;
  },
  itemAt(u, v) {
    const list = [...Life.room.items].sort((a, b) => (ITEMS[a.id].flat ? 1 : 0) - (ITEMS[b.id].flat ? 1 : 0));
    for (const o of list) { const [w, d] = this.dims(o.id, o.rot); if (u >= o.x && u < o.x + w && v >= o.y && v < o.y + d) return o; }
    return null;
  },
  pointer(e, type) {
    if (!this.isOpen) return;
    const [u, v] = this.toRoom(e.clientX, e.clientY);
    if (type === 'move') { this.hover = [u, v]; return; }
    if (type === 'down') {
      if (e.button === 2) { this.holding = null; this.renderPanel(); return; }
      if (this.holding) {
        const [w, d] = this.dims(this.holding, this.rot), x = Math.round(u - w / 2), y = Math.round(v - d / 2);
        if (!this.fits(this.holding, x, y, this.rot)) { Sound.play('error'); this.tip("That doesn't fit there. Try another spot!"); return; }
        Life.room.items.push({ id: this.holding, x, y, rot: this.rot });
        Life.inv[this.holding]--; if (!Life.inv[this.holding]) delete Life.inv[this.holding];
        Sound.play('place');
        if (!Life.inv[this.holding]) this.holding = null;
        this.renderPanel();
        return;
      }
      const o = this.itemAt(u, v);
      if (o) { Life.room.items.splice(Life.room.items.indexOf(o), 1); Life.inv[o.id] = (Life.inv[o.id] || 0) + 1; this.holding = o.id; this.rot = o.rot; Sound.play('click'); this.renderPanel(); this.tip('Moving it! Click the floor to put it down, R to turn it, right-click to put it in storage.'); }
    }
  },
  key(k) {
    if (k === 'r' && this.holding) { this.rot ^= 1; Sound.play('click'); }
    if (k === 'escape') { if (this.holding) { this.holding = null; this.renderPanel(); } else this.close(); }
  },
  renderPanel() {
    const inv = Object.entries(Life.inv).filter(([, n]) => n > 0);
    $('homePanel').innerHTML = `<h3>🏠 My Home</h3>
      <div class="section">My furniture</div>
      <div class="home-inv">${inv.length ? inv.map(([k, n]) => `<button class="chip${this.holding === k ? ' on' : ''}" data-hold="${k}">${ITEMS[k].icon} ${escapeHtml(ITEMS[k].name)} ×${n}</button>`).join('') : '<p style="font-size:13px;color:#8a7a99">No furniture in storage. Buy some at Snack Marts, Shopping Plazas, Malls and Pet Shops!</p>'}</div>
      ${this.holding ? '<button class="btn" id="hRot" style="margin-top:6px">🔄 Turn (R)</button>' : ''}
      <div class="section">Walls</div><div class="swatches">${WALLS.map((c, i) => `<button class="swatch${Life.room.wall === i ? ' on' : ''}" data-wall="${i}" style="background:${c}"></button>`).join('')}</div>
      <div class="section">Floor</div><div class="swatches">${FLOORS.map((c, i) => `<button class="swatch${Life.room.floor === i ? ' on' : ''}" data-floor="${i}" style="background:${c}"></button>`).join('')}</div>
      <p id="homeTip" class="tip"></p>
      <button class="btn primary" id="hExit" style="width:100%;margin-top:8px">🚪 Go back outside</button>`;
    $('homePanel').querySelectorAll('[data-hold]').forEach((b) => b.onclick = () => { this.holding = this.holding === b.dataset.hold ? null : b.dataset.hold; this.rot = 0; Sound.play('select'); this.renderPanel(); });
    $('homePanel').querySelectorAll('[data-wall]').forEach((b) => b.onclick = () => { Life.room.wall = +b.dataset.wall; Sound.play('click'); this.renderPanel(); });
    $('homePanel').querySelectorAll('[data-floor]').forEach((b) => b.onclick = () => { Life.room.floor = +b.dataset.floor; Sound.play('click'); this.renderPanel(); });
    $('hExit').onclick = () => this.close();
    if ($('hRot')) $('hRot').onclick = () => this.key('r');
  },
  draw(dt) {
    if (!this.isOpen) return;
    this.t += dt;
    const g = this.g, s = this.scale, t = this.t, night = nightFactor();
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const bg = g.createLinearGradient(0, 0, 0, innerHeight); bg.addColorStop(0, '#ffe9f3'); bg.addColorStop(1, '#e6dcff');
    g.fillStyle = bg; g.fillRect(0, 0, innerWidth, innerHeight);
    g.setTransform(this.dpr * s, 0, 0, this.dpr * s, this.dpr * this.ox, this.dpr * this.oy);
    const P = new Painter(g, 1); P.season = 'summer';
    const wall = WALLS[Life.room.wall], floor = FLOORS[Life.room.floor];
    // walls
    P.poly([P.iso(0, 0, 0), P.iso(ROOM, 0, 0), P.iso(ROOM, 0, WALL_H), P.iso(0, 0, WALL_H)], shade(wall, -0.06));
    P.poly([P.iso(0, 0, 0), P.iso(0, ROOM, 0), P.iso(0, ROOM, WALL_H), P.iso(0, 0, WALL_H)], wall);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (let k = 1; k < 8; k++) { const a = P.iso(k, 0, 6), b = P.iso(k, 0, WALL_H - 6); P.line(a, b, 'rgba(255,255,255,0.35)', 2); const c = P.iso(0, k, 6), d = P.iso(0, k, WALL_H - 6); P.line(c, d, 'rgba(0,0,0,0.04)', 2); }
    // window (sky color follows the time of day)
    const sky = mix(mix('#9fd8ff', '#ffb38a', duskFactor()), '#1a2456', night);
    P.poly([P.iso(2.5, 0, 45), P.iso(5.5, 0, 45), P.iso(5.5, 0, 100), P.iso(2.5, 0, 100)], sky, '#ffffff', 4);
    P.line(P.iso(4, 0, 45), P.iso(4, 0, 100), '#ffffff', 3);
    if (night > 0.4) for (let k = 0; k < 6; k++) { const [x, y] = P.iso(2.8 + k * 0.45, 0, 60 + (k * 13) % 35); P.circle(x, y, 1, '#fff'); }
    P.poly(P.qR(2.2, 4.2, 0, 0, 70), '#a0663c', 'rgba(0,0,0,0.3)'); // door (u = 0 wall)
    P.poly([P.iso(0, 2.2, 0), P.iso(0, 4.2, 0), P.iso(0, 4.2, 70), P.iso(0, 2.2, 70)], '#a0663c', 'rgba(0,0,0,0.3)');
    const [kx, ky] = P.iso(0, 3.9, 34); P.circle(kx, ky, 2, '#f5c518');
    // floor
    P.poly([P.iso(0, 0), P.iso(ROOM, 0), P.iso(ROOM, ROOM), P.iso(0, ROOM)], floor);
    for (let k = 1; k < ROOM; k++) { P.line(P.iso(k, 0), P.iso(k, ROOM), 'rgba(0,0,0,0.06)', 1); P.line(P.iso(0, k), P.iso(ROOM, k), 'rgba(0,0,0,0.06)', 1); }
    // furniture, back to front (rugs first)
    const items = [...Life.room.items].sort((a, b) => (ITEMS[b.id].flat ? 1 : 0) - (ITEMS[a.id].flat ? 1 : 0) || (a.x + a.y + this.dims(a.id, a.rot).reduce((p, q) => p + q)) - (b.x + b.y + this.dims(b.id, b.rot).reduce((p, q) => p + q)));
    const drawFurn = (o, ghost) => { const fn = FURN[o.id]; if (!fn) return; if (ghost) g.globalAlpha = ghost; fn(furnPainter(P, o.x, o.y, o.rot), t, night); g.globalAlpha = 1; };
    for (const o of items) drawFurn(o);
    // pets & me
    const dogbed = Life.room.items.find((o) => o.id === 'dogbed'), tower = Life.room.items.find((o) => o.id === 'cattower');
    if (dogbed) { const [x, y] = P.iso(dogbed.x + 0.5, dogbed.y + 0.5, 4); P.ellipse(x, y - 4, 13, 7, PERSONAL.dogColors.fur, 'rgba(0,0,0,0.25)'); P.circle(x + 9, y - 8, 6, PERSONAL.dogColors.fur, 'rgba(0,0,0,0.25)'); P.ellipse(x + 8, y - 8, 2.5, 4.5, PERSONAL.dogColors.ears); g.fillStyle = '#333'; g.font = '8px sans-serif'; g.fillText('z', x + 14, y - 18 - Math.sin(t * 2) * 3); }
    else drawMoe(P, ...P.iso(6.2, 6.8), 2.4, true, 0, Life.moeLook);
    if (tower) { const [x, y] = P.iso(tower.x + 0.55, tower.y + 0.55, 49); P.cat(x, y, 1.4); }
    drawAvatar(g, ...P.iso(6.8, 6.2), Life.look, 0, 'down', 2.6);
    // ghost of what you're holding
    if (this.holding && this.hover) {
      const [w, d] = this.dims(this.holding, this.rot), x = Math.round(this.hover[0] - w / 2), y = Math.round(this.hover[1] - d / 2), ok = this.fits(this.holding, x, y, this.rot);
      P.poly([P.iso(x, y), P.iso(x + w, y), P.iso(x + w, y + d), P.iso(x, y + d)], ok ? 'rgba(80,220,120,0.35)' : 'rgba(255,70,70,0.4)', '#fff', 1.5);
      drawFurn({ id: this.holding, x, y, rot: this.rot }, 0.7);
    }
  },
};
