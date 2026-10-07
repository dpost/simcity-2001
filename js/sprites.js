'use strict';
// =====================================================================
//  Procedural art: every building is drawn with code (no image files!)
//  Sprites are drawn once into cached canvases (a day and a night version).
// =====================================================================
const SC = 2; // sprites are drawn at 2x so they stay crisp when zoomed in
const SPRITE_FONT = '"Fredoka", "Arial Rounded MT Bold", Arial, sans-serif';

const PAL = {
  walls: ['#ffd6e0', '#ffe9a8', '#c9f2c7', '#cde7ff', '#e6d4ff', '#ffd8b0', '#f4efe4', '#b9ecec'],
  roofs: ['#e0565b', '#5b7be0', '#8a5a44', '#3fa56b', '#9b59b6', '#e08a3c', '#d94f8a'],
  tower: ['#f7c6d9', '#c6e2f7', '#d9f7c6', '#f7ecc6', '#e0d0f7', '#f0f0f0', '#ffd9b8', '#c8f0ec'],
  flowers: ['#ff5d8f', '#ffd23f', '#ff8c42', '#b388ff', '#ffffff', '#ff4d4d'],
};

class Painter {
  constructor(g, size = 1) { this.g = g; this.size = size; this.lights = []; this.glows = []; this.emitters = []; }
  iso(u, v, z = 0) { return [(u - v) * 32, (u + v) * 16 - z]; }
  path(pts) { const g = this.g; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
  poly(pts, fill, stroke, lw = 0.6) {
    this.path(pts); const g = this.g;
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  }
  line(a, b, col, lw = 1) { const g = this.g; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.stroke(); }
  qL(u0, u1, v, z0, z1) { return [this.iso(u0, v, z0), this.iso(u1, v, z0), this.iso(u1, v, z1), this.iso(u0, v, z1)]; }
  qR(v0, v1, u, z0, z1) { return [this.iso(u, v1, z0), this.iso(u, v0, z0), this.iso(u, v0, z1), this.iso(u, v1, z1)]; }
  qT(u0, v0, u1, v1, z) { return [this.iso(u0, v0, z), this.iso(u1, v0, z), this.iso(u1, v1, z), this.iso(u0, v1, z)]; }
  box(u0, v0, u1, v1, z0, z1, col, o = {}) {
    const ol = o.outline === false ? null : 'rgba(40,30,60,0.25)';
    this.poly(this.qL(u0, u1, v1, z0, z1), o.left || col, ol);
    this.poly(this.qR(v0, v1, u1, z0, z1), o.right || shade(col, -0.2), ol);
    if (!o.noTop) this.poly(this.qT(u0, v0, u1, v1, z1), o.top || shade(col, 0.25), ol);
  }
  flat(u0, v0, u1, v1, z, col, stroke) { this.poly(this.qT(u0, v0, u1, v1, z), col, stroke); }
  winsL(u0, u1, v, z0, z1, cols, rows, o = {}) {
    const cw = (u1 - u0) / cols, rh = (z1 - z0) / rows, fw = o.fw ?? 0.55, fh = o.fh ?? 0.55;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const ua = u0 + c * cw + (cw * (1 - fw)) / 2, za = z0 + r * rh + (rh * (1 - fh)) / 2;
      const q = this.qL(ua, ua + cw * fw, v, za, za + rh * fh);
      this.poly(q, o.col || '#a9dcff', 'rgba(30,40,70,0.35)', 0.5);
      if (o.light !== false) this.lights.push(q);
    }
  }
  winsR(v0, v1, u, z0, z1, cols, rows, o = {}) {
    const cw = (v1 - v0) / cols, rh = (z1 - z0) / rows, fw = o.fw ?? 0.55, fh = o.fh ?? 0.55;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const va = v0 + c * cw + (cw * (1 - fw)) / 2, za = z0 + r * rh + (rh * (1 - fh)) / 2;
      const q = this.qR(va, va + cw * fw, u, za, za + rh * fh);
      this.poly(q, o.col || '#86bde0', 'rgba(30,40,70,0.35)', 0.5);
      if (o.light !== false) this.lights.push(q);
    }
  }
  doorL(uc, v, w, h, col) { this.poly(this.qL(uc - w / 2, uc + w / 2, v, 0, h), col, 'rgba(0,0,0,0.35)'); }
  doorR(vc, u, w, h, col) { this.poly(this.qR(vc - w / 2, vc + w / 2, u, 0, h), col, 'rgba(0,0,0,0.35)'); }
  gable(u0, v0, u1, v1, z, h, roof, wall, axis = 'u') {
    const s = 'rgba(40,30,60,0.3)', e = 0.05;
    if (axis === 'u') {
      const vm = (v0 + v1) / 2;
      this.poly([this.iso(u0, v0 - e, z - 2), this.iso(u1, v0 - e, z - 2), this.iso(u1, vm, z + h), this.iso(u0, vm, z + h)], shade(roof, 0.18), s);
      this.poly([this.iso(u1, v0, z), this.iso(u1, v1, z), this.iso(u1, vm, z + h)], shade(wall, -0.2), s);
      this.poly([this.iso(u0, v1 + e, z - 2), this.iso(u1, v1 + e, z - 2), this.iso(u1, vm, z + h), this.iso(u0, vm, z + h)], roof, s);
    } else {
      const um = (u0 + u1) / 2;
      this.poly([this.iso(u0 - e, v0, z - 2), this.iso(u0 - e, v1, z - 2), this.iso(um, v1, z + h), this.iso(um, v0, z + h)], shade(roof, 0.18), s);
      this.poly([this.iso(u0, v1, z), this.iso(u1, v1, z), this.iso(um, v1, z + h)], wall, s);
      this.poly([this.iso(u1 + e, v0, z - 2), this.iso(u1 + e, v1, z - 2), this.iso(um, v1, z + h), this.iso(um, v0, z + h)], shade(roof, -0.15), s);
    }
  }
  hip(u0, v0, u1, v1, z, h, roof) {
    const a = this.iso((u0 + u1) / 2, (v0 + v1) / 2, z + h), s = 'rgba(40,30,60,0.3)';
    this.poly([this.iso(u0, v0, z), this.iso(u1, v0, z), a], shade(roof, 0.12), s);
    this.poly([this.iso(u0, v0, z), this.iso(u0, v1, z), a], shade(roof, 0.25), s);
    this.poly([this.iso(u0, v1, z), this.iso(u1, v1, z), a], roof, s);
    this.poly([this.iso(u1, v0, z), this.iso(u1, v1, z), a], shade(roof, -0.18), s);
  }
  cylPath(cx, cyb, cyt, r) {
    const g = this.g;
    g.beginPath(); g.moveTo(cx - r, cyt); g.lineTo(cx - r, cyb);
    g.ellipse(cx, cyb, r, r / 2, 0, Math.PI, 0, true);
    g.lineTo(cx + r, cyt); g.closePath();
  }
  cyl(u, v, z0, z1, r, col, o = {}) {
    const [cx, cyb] = this.iso(u, v, z0), cyt = cyb - (z1 - z0), g = this.g;
    const grad = g.createLinearGradient(cx - r, 0, cx + r, 0);
    grad.addColorStop(0, shade(col, 0.2)); grad.addColorStop(0.4, col); grad.addColorStop(1, shade(col, -0.32));
    this.cylPath(cx, cyb, cyt, r); g.fillStyle = grad; g.fill();
    g.strokeStyle = 'rgba(40,30,60,0.25)'; g.lineWidth = 0.6; g.stroke();
    if (o.top !== false) { g.beginPath(); g.ellipse(cx, cyt, r, r / 2, 0, 0, Math.PI * 2); g.fillStyle = o.topCol || shade(col, 0.25); g.fill(); g.stroke(); }
    return [cx, cyt];
  }
  // a horizontal band around a cylinder (for stripes)
  band(u, v, z0, z1, r, col) {
    const [cx, cyb] = this.iso(u, v, z0), cyt = cyb - (z1 - z0), g = this.g;
    g.beginPath(); g.moveTo(cx - r, cyt); g.lineTo(cx - r, cyb);
    g.ellipse(cx, cyb, r, r / 2, 0, Math.PI, 0, true); g.lineTo(cx + r, cyt);
    g.ellipse(cx, cyt, r, r / 2, 0, 0, Math.PI, false); g.closePath();
    g.fillStyle = col; g.fill();
  }
  cone(u, v, z, h, r, col) {
    const [cx, cy] = this.iso(u, v, z), g = this.g;
    const grad = g.createLinearGradient(cx - r, 0, cx + r, 0);
    grad.addColorStop(0, shade(col, 0.25)); grad.addColorStop(0.45, col); grad.addColorStop(1, shade(col, -0.3));
    g.beginPath(); g.moveTo(cx - r, cy); g.lineTo(cx, cy - h); g.lineTo(cx + r, cy);
    g.ellipse(cx, cy, r, r / 2, 0, 0, Math.PI, false); g.closePath();
    g.fillStyle = grad; g.fill(); g.strokeStyle = 'rgba(40,30,60,0.25)'; g.lineWidth = 0.6; g.stroke();
    return [cx, cy - h];
  }
  disc(u, v, z, r, col, stroke) {
    const [cx, cy] = this.iso(u, v, z), g = this.g;
    g.beginPath(); g.ellipse(cx, cy, r, r / 2, 0, 0, Math.PI * 2);
    if (col) { g.fillStyle = col; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); }
  }
  dome(u, v, z, r, col, hscale = 1) {
    const [cx, cy] = this.iso(u, v, z), g = this.g;
    const grad = g.createRadialGradient(cx - r * 0.35, cy - r * 0.6 * hscale, r * 0.1, cx, cy, r * 1.1);
    grad.addColorStop(0, shade(col, 0.5)); grad.addColorStop(0.5, col); grad.addColorStop(1, shade(col, -0.3));
    g.beginPath(); g.ellipse(cx, cy, r, r / 2, 0, 0, Math.PI, false);
    g.ellipse(cx, cy, r, r * hscale, 0, Math.PI, Math.PI * 2, false); g.closePath();
    g.fillStyle = grad; g.fill(); g.strokeStyle = 'rgba(40,30,60,0.25)'; g.lineWidth = 0.6; g.stroke();
    return [cx, cy - r * hscale];
  }
  ball(x, y, r, col) {
    const g = this.g, grad = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    grad.addColorStop(0, shade(col, 0.45)); grad.addColorStop(0.6, col); grad.addColorStop(1, shade(col, -0.25));
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = grad; g.fill();
  }
  circle(x, y, r, fill, stroke, lw = 1) {
    const g = this.g; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  }
  ellipse(x, y, rx, ry, fill, stroke) {
    const g = this.g; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = 0.8; g.stroke(); }
  }
  // text drawn flat on the left face (plane v = const) or right face (u = const)
  textL(str, u, v, z, size, col) { this._skewText(str, this.iso(u, v, z), 0.5, size, col); }
  textR(str, u, v, z, size, col) { this._skewText(str, this.iso(u, v, z), -0.5, size, col); }
  _skewText(str, [x, y], k, size, col) {
    const g = this.g; g.save(); g.translate(x, y); g.transform(1, k, 0, 1, 0, 0);
    g.font = `700 ${size}px ${SPRITE_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = col; g.fillText(str, 0, 0); g.restore();
  }
  // a camera-facing sign board with text
  board(x, y, w, h, bg, text, col, size, o = {}) {
    const g = this.g;
    g.fillStyle = o.border || 'rgba(60,40,70,0.9)'; this.rrect(x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2, 3); g.fill();
    g.fillStyle = bg; this.rrect(x - w / 2, y - h / 2, w, h, 2.5); g.fill();
    if (text) {
      let s = size; g.font = `700 ${s}px ${SPRITE_FONT}`;
      while (g.measureText(text).width > w - 4 && s > 3) { s -= 0.5; g.font = `700 ${s}px ${SPRITE_FONT}`; }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(text, x, y + 0.5);
    }
    if (o.glow) this.glows.push({ rect: [x - w / 2, y - h / 2, w, h], col: o.glow });
  }
  rrect(x, y, w, h, r) { const g = this.g; g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  emit(u, v, z) { this.emitters.push(this.iso(u, v, z)); }
  light(q) { this.lights.push(q); }
  glowPoly(q, col) { this.glows.push({ q, col }); }
  glowDot(x, y, r, col) { this.glows.push({ c: [x, y, r], col }); }

  tree(u, v, kind = 0, s = 1, z = 0) {
    const [x, y] = this.iso(u, v, z), g = this.g;
    g.fillStyle = 'rgba(20,40,10,0.18)'; g.beginPath(); g.ellipse(x + 2 * s, y, 9 * s, 4.5 * s, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8a5a3c'; g.fillRect(x - 1.5 * s, y - 12 * s, 3 * s, 12 * s);
    if (kind === 1) { // pine
      const cols = ['#2f8f4e', '#38a55a', '#46b866'];
      for (let i = 0; i < 3; i++) {
        const yy = y - 8 * s - i * 8 * s, w = (11 - i * 2.5) * s;
        this.poly([[x - w, yy], [x + w, yy], [x, yy - 13 * s]], cols[i], 'rgba(20,60,30,0.4)');
      }
      return;
    }
    const col = ['#4caf50', '#4caf50', '#ff9fcf', '#ff9f43', '#6cc04a'][kind] || '#4caf50';
    this.ball(x - 5 * s, y - 15 * s, 7 * s, shade(col, -0.08));
    this.ball(x + 5 * s, y - 16 * s, 7 * s, shade(col, -0.04));
    this.ball(x, y - 22 * s, 9 * s, col);
    if (kind === 2) for (let i = 0; i < 6; i++) this.circle(x + Math.sin(i * 2.3) * 7 * s, y - 20 * s + Math.cos(i * 1.7) * 6 * s, 1.1 * s, '#ffffff');
  }
  bush(u, v, s = 1, col = '#5cb85c') { const [x, y] = this.iso(u, v, 0); this.ball(x - 3 * s, y - 3 * s, 4 * s, col); this.ball(x + 3 * s, y - 3 * s, 4 * s, shade(col, -0.05)); this.ball(x, y - 5 * s, 4.5 * s, shade(col, 0.05)); }
  flowers(u0, v0, u1, v1, n, rr) {
    for (let i = 0; i < n; i++) { const [x, y] = this.iso(lerp(u0, u1, rr()), lerp(v0, v1, rr()), 0); this.circle(x, y - 1, 1.3, PAL.flowers[Math.floor(rr() * PAL.flowers.length)]); }
  }
  fenceL(u0, u1, v, h, col, n = 6) {
    for (let i = 0; i <= n; i++) { const u = lerp(u0, u1, i / n); this.line(this.iso(u, v, 0), this.iso(u, v, h), col, 1.2); }
    this.line(this.iso(u0, v, h * 0.75), this.iso(u1, v, h * 0.75), col, 1); this.line(this.iso(u0, v, h * 0.35), this.iso(u1, v, h * 0.35), col, 1);
  }
  fenceR(v0, v1, u, h, col, n = 6) {
    for (let i = 0; i <= n; i++) { const v = lerp(v0, v1, i / n); this.line(this.iso(u, v, 0), this.iso(u, v, h), col, 1.2); }
    this.line(this.iso(u, v0, h * 0.75), this.iso(u, v1, h * 0.75), col, 1); this.line(this.iso(u, v0, h * 0.35), this.iso(u, v1, h * 0.35), col, 1);
  }
  // little animals (camera-facing), x,y = feet position
  dog(x, y, s = 1, fur = PERSONAL.dogColors.fur, ears = PERSONAL.dogColors.ears, flip = false, leg = 0) {
    const g = this.g; g.save(); g.translate(x, y); if (flip) g.scale(-1, 1); g.scale(s, s);
    g.strokeStyle = shade(fur, -0.35); g.lineWidth = 1.3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-3, -3); g.lineTo(-3 - leg, 0); g.moveTo(3, -3); g.lineTo(3 + leg, 0); g.stroke();
    const ol = 'rgba(70,60,50,0.35)';
    g.beginPath(); g.moveTo(-4.5, -5); g.quadraticCurveTo(-8, -9, -7, -10); g.strokeStyle = ol; g.lineWidth = 2.2; g.stroke(); g.strokeStyle = fur; g.lineWidth = 1.4; g.stroke();
    this.ellipse(0, -4.5, 5, 3, fur, ol);
    this.circle(5, -8, 3.2, fur, ol, 0.6); this.ellipse(4, -8, 1.3, 2.4, ears); this.circle(8, -7.5, 0.9, PERSONAL.dogColors.nose); this.circle(5.8, -9, 0.6, '#222');
    g.restore();
  }
  cat(x, y, s = 1, fur = PERSONAL.catColors.fur) {
    const g = this.g; g.save(); g.translate(x, y); g.scale(s, s);
    this.ellipse(0, -4, 3.5, 4, fur); this.circle(0, -9.5, 3, fur);
    this.poly([[-2.8, -11], [-2, -14.5], [-0.6, -12]], fur); this.poly([[2.8, -11], [2, -14.5], [0.6, -12]], fur);
    g.beginPath(); g.moveTo(3, -2); g.quadraticCurveTo(7, -3, 6, -8); g.strokeStyle = fur; g.lineWidth = 1.3; g.stroke();
    g.restore();
  }
  person(x, y, s, shirt, skin = '#f1c7a3') {
    const g = this.g; g.fillStyle = '#3d3d5c'; g.fillRect(x - 1.2 * s, y - 3 * s, 2.4 * s, 3 * s);
    g.fillStyle = shirt; g.fillRect(x - 1.6 * s, y - 6.5 * s, 3.2 * s, 3.8 * s);
    this.circle(x, y - 8 * s, 1.6 * s, skin);
  }
}

// ---------------------------------------------------------------------
//  Sprite cache
// ---------------------------------------------------------------------
const SPR = new Map();
function makeSprite(key, size, height, fn) {
  let spr = SPR.get(key);
  if (spr) return spr;
  const w = size * TW, h = size * TH + height;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w * SC); cv.height = Math.ceil(h * SC);
  const g = cv.getContext('2d'); g.setTransform(SC, 0, 0, SC, (w / 2) * SC, height * SC); g.lineJoin = 'round';
  const p = new Painter(g, size);
  fn(p, mulberry32(hashStr(key)));
  // night version: darken everything, then light up windows and signs
  const nv = document.createElement('canvas'); nv.width = cv.width; nv.height = cv.height;
  const n = nv.getContext('2d'); n.drawImage(cv, 0, 0);
  n.globalCompositeOperation = 'source-atop'; n.fillStyle = 'rgba(16,22,60,0.6)'; n.fillRect(0, 0, nv.width, nv.height);
  n.globalCompositeOperation = 'source-over';
  n.setTransform(SC, 0, 0, SC, (w / 2) * SC, height * SC);
  const pn = new Painter(n, size), rr = mulberry32(hashStr(key) ^ 0x5bd1e995);
  n.shadowColor = 'rgba(255,200,90,0.9)'; n.shadowBlur = 5;
  for (const q of p.lights) if (rr() < 0.7) pn.poly(q, rr() < 0.25 ? '#fff4c8' : '#ffd36b');
  for (const gl of p.glows) {
    n.shadowColor = gl.col;
    if (gl.q) pn.poly(gl.q, gl.col);
    else if (gl.c) pn.circle(gl.c[0], gl.c[1], gl.c[2], gl.col);
    else if (gl.rect) { // lit signs: copy the daytime sign back on top, with a glow
      const [x, y, rw, rh] = gl.rect, px = Math.floor((x + w / 2 - 1) * SC), py = Math.floor((y + height - 1) * SC), pw = Math.ceil((rw + 2) * SC), ph = Math.ceil((rh + 2) * SC);
      n.save(); n.setTransform(1, 0, 0, 1, 0, 0); n.shadowColor = gl.col; n.shadowBlur = 10; n.drawImage(cv, px, py, pw, ph, px, py, pw, ph); n.restore();
    }
  }
  spr = { cv, nv, w, h, size, height, emit: p.emitters };
  SPR.set(key, spr);
  return spr;
}
function clearSpriteCache() { SPR.clear(); TILES.clear(); if (typeof markAllGround === 'function') markAllGround(); }

// ---------------------------------------------------------------------
//  Zone buildings
// ---------------------------------------------------------------------
function awningL(p, u0, u1, v, z, depth, drop, c1, c2, n = 8) {
  for (let k = 0; k < n; k++) {
    const ua = lerp(u0, u1, k / n), ub = lerp(u0, u1, (k + 1) / n);
    p.poly([p.iso(ua, v, z), p.iso(ub, v, z), p.iso(ub, v + depth, z - drop), p.iso(ua, v + depth, z - drop)], k % 2 ? c2 : c1, 'rgba(0,0,0,0.15)');
  }
}
function shopShell(p, wall, a1, a2) {
  p.box(0.14, 0.18, 0.86, 0.82, 0, 20, wall);
  const q = p.qL(0.2, 0.6, 0.82, 3, 12); p.poly(q, '#c4e9ff', 'rgba(0,0,0,0.3)'); p.light(q);
  p.doorL(0.72, 0.82, 0.1, 11, '#7a5236');
  p.winsR(0.24, 0.76, 0.86, 6, 15, 2, 1);
  awningL(p, 0.16, 0.84, 0.82, 15, 0.1, 4, a1, a2);
  p.box(0.12, 0.16, 0.88, 0.84, 20, 22, shade(wall, -0.1));
}

const ZART = {
  R: [null,
    (p, d, c, rr) => {
      const wall = PAL.walls[c], roof = PAL.roofs[(c + d * 2) % PAL.roofs.length];
      if (d === 0) {
        p.bush(0.12, 0.86, 0.8);
        p.box(0.22, 0.28, 0.8, 0.74, 0, 15, wall);
        p.doorL(0.64, 0.74, 0.1, 10, '#8a5a3c');
        p.winsL(0.26, 0.52, 0.74, 4, 12, 1, 1, { fw: 0.55, fh: 0.7 });
        p.winsR(0.3, 0.7, 0.8, 4, 12, 2, 1, { fw: 0.55, fh: 0.7 });
        p.box(0.58, 0.36, 0.66, 0.44, 19, 30, '#b5654a');
        p.gable(0.22, 0.28, 0.8, 0.74, 15, 13, roof, wall, 'u');
        p.flowers(0.2, 0.78, 0.6, 0.9, 6, rr);
      } else if (d === 1) {
        p.box(0.2, 0.2, 0.78, 0.78, 0, 16, wall);
        p.winsL(0.24, 0.74, 0.78, 5, 13, 2, 1, { fw: 0.5, fh: 0.6 });
        p.winsR(0.24, 0.74, 0.78, 5, 13, 2, 1, { fw: 0.5, fh: 0.6 });
        p.hip(0.16, 0.16, 0.82, 0.82, 16, 14, roof);
        p.box(0.25, 0.84, 0.75, 0.9, 0, 3, '#6cbf4f');
        p.tree(0.88, 0.2, 0, 0.6);
      } else if (d === 2) {
        p.box(0.12, 0.12, 0.6, 0.6, 0, 15, wall);
        p.doorL(0.47, 0.6, 0.1, 10, '#6b4a33');
        p.winsL(0.16, 0.36, 0.6, 4, 12, 1, 1, { fw: 0.6, fh: 0.7 });
        p.winsR(0.16, 0.56, 0.6, 4, 12, 2, 1, { fw: 0.55, fh: 0.7 });
        p.gable(0.12, 0.12, 0.6, 0.6, 15, 12, roof, wall, 'v');
        p.box(0.66, 0.62, 0.84, 0.8, 0, 6, '#d0503d');
        p.poly(p.qL(0.71, 0.79, 0.8, 0, 4), '#3a2016');
        p.gable(0.66, 0.62, 0.84, 0.8, 6, 5, '#7f2a1f', '#d0503d', 'u');
        const [dx, dy] = p.iso(0.7, 0.92, 0); p.dog(dx, dy, 0.9);
        p.fenceL(0.04, 0.96, 0.97, 5, '#ffffff', 8); p.fenceR(0.04, 0.96, 0.97, 5, '#ffffff', 8);
      } else {
        p.tree(0.15, 0.25, 1, 0.75);
        p.box(0.3, 0.3, 0.75, 0.75, 0, 26, wall);
        p.doorL(0.62, 0.75, 0.1, 10, '#6b4a33');
        p.winsL(0.33, 0.52, 0.75, 3, 12, 1, 1, { fw: 0.6, fh: 0.7 }); p.winsL(0.33, 0.72, 0.75, 15, 24, 2, 1, { fw: 0.55, fh: 0.7 });
        p.winsR(0.34, 0.72, 0.75, 3, 24, 2, 2, { fw: 0.55, fh: 0.6 });
        p.box(0.28, 0.75, 0.77, 0.8, 12, 13.5, '#ffffff');
        p.hip(0.26, 0.26, 0.79, 0.79, 26, 16, roof);
        p.bush(0.12, 0.85, 0.7, '#4fa84f'); p.flowers(0.3, 0.82, 0.8, 0.95, 6, rr);
      }
    },
    (p, d, c, rr) => {
      const wall = PAL.walls[c], wall2 = PAL.walls[(c + 3) % 8], roof = PAL.roofs[(c + 3) % 7];
      if (d === 0) {
        p.box(0.1, 0.18, 0.5, 0.86, 0, 36, wall); p.winsL(0.13, 0.47, 0.86, 4, 34, 2, 3);
        p.box(0.5, 0.18, 0.9, 0.86, 0, 30, wall2); p.winsL(0.53, 0.87, 0.86, 4, 28, 2, 3); p.winsR(0.22, 0.82, 0.9, 4, 28, 3, 3);
        p.box(0.16, 0.26, 0.42, 0.52, 36, 39, '#6fbf4f'); p.box(0.62, 0.3, 0.74, 0.42, 30, 35, '#b8bcc6');
      } else if (d === 1) {
        p.box(0.12, 0.16, 0.88, 0.84, 0, 32, wall);
        p.winsL(0.15, 0.85, 0.84, 3, 30, 3, 3); p.winsR(0.19, 0.81, 0.88, 3, 30, 3, 3);
        p.gable(0.12, 0.16, 0.88, 0.84, 32, 16, roof, wall, 'u');
      } else {
        p.box(0.15, 0.15, 0.85, 0.85, 0, 42, wall);
        p.winsL(0.18, 0.82, 0.85, 3, 40, 3, 4); p.winsR(0.18, 0.82, 0.85, 3, 40, 3, 4);
        for (let k = 1; k <= 3; k++) {
          const z = k * 10.2;
          p.box(0.2, 0.85, 0.8, 0.93, z, z + 1.5, '#ffffff');
          for (let i = 0; i < 7; i++) { const [x, y] = p.iso(0.23 + i * 0.09, 0.93, z + 3); p.circle(x, y, 1.3, PAL.flowers[(i + k) % 6]); }
        }
        p.box(0.13, 0.13, 0.87, 0.87, 42, 45, shade(wall, -0.1));
      }
    },
    (p, d, c) => {
      const wall = PAL.tower[c % 8], wall2 = PAL.tower[(c + 3) % 8];
      if (d === 0) {
        p.box(0.18, 0.18, 0.82, 0.82, 0, 112, wall);
        p.winsL(0.2, 0.8, 0.82, 6, 108, 4, 10); p.winsR(0.2, 0.8, 0.82, 6, 108, 4, 10);
        p.box(0.15, 0.15, 0.85, 0.85, 112, 116, '#ffffff');
        p.line(p.iso(0.38, 0.4, 116), p.iso(0.38, 0.4, 124), '#7a5236', 1.2); p.line(p.iso(0.46, 0.4, 116), p.iso(0.46, 0.4, 124), '#7a5236', 1.2);
        p.cyl(0.42, 0.4, 124, 134, 6, '#b07a50'); p.cone(0.42, 0.4, 134, 6, 7, '#8a5a3c');
      } else if (d === 1) {
        p.box(0.1, 0.1, 0.9, 0.9, 0, 52, wall);
        p.winsL(0.13, 0.87, 0.9, 6, 50, 5, 5); p.winsR(0.13, 0.87, 0.9, 6, 50, 5, 5);
        p.box(0.26, 0.26, 0.74, 0.74, 52, 126, wall2);
        p.winsL(0.28, 0.72, 0.74, 54, 122, 3, 7); p.winsR(0.28, 0.72, 0.74, 54, 122, 3, 7);
        p.tree(0.82, 0.5, 0, 0.45, 52); p.tree(0.5, 0.82, 2, 0.45, 52); p.tree(0.82, 0.82, 0, 0.5, 52);
        p.box(0.4, 0.4, 0.6, 0.6, 126, 134, '#dddddd');
      } else {
        const glass = ['#8fd3f4', '#b4a7f5', '#9be8c8', '#f5b4d0'][c % 4];
        const [cx, top] = p.cyl(0.5, 0.5, 0, 128, 21, glass);
        for (let z = 8; z < 128; z += 10) {
          const [, y] = p.iso(0.5, 0.5, z), g = p.g;
          g.beginPath(); g.ellipse(cx, y, 21, 10.5, 0, 0, Math.PI, false); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1; g.stroke();
          for (let a = -2; a <= 2; a++) { const x = cx + Math.sin(a * 0.55) * 19, yy = y + Math.cos(a * 0.55) * 9.5 - 6; p.lights.push([[x - 2, yy], [x + 2, yy], [x + 2, yy + 4], [x - 2, yy + 4]]); }
        }
        p.cyl(0.5, 0.5, 128, 134, 23, '#ffffff'); p.cone(0.5, 0.5, 134, 18, 10, PAL.roofs[c % 7]);
        void top;
      }
    },
  ],
  C: [null,
    (p, d, c, rr) => {
      const g = p.g;
      if (d === 0) { // ice cream shop
        shopShell(p, '#ffd1e8', '#ff6fa5', '#ffffff');
        const [x, y] = p.iso(0.5, 0.5, 22);
        p.poly([[x - 6, y - 16], [x + 6, y - 16], [x, y]], '#e2a65c', 'rgba(120,70,20,0.6)');
        g.strokeStyle = 'rgba(150,90,30,0.5)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x - 4, y - 13); g.lineTo(x + 2, y - 4); g.moveTo(x + 4, y - 13); g.lineTo(x - 2, y - 4); g.stroke();
        p.ball(x, y - 19, 6.5, '#ff8fb8'); p.ball(x, y - 27, 5.5, '#9ff0c8'); p.ball(x + 1, y - 33.5, 2.3, '#e8283c');
      } else if (d === 1) { // bakery
        shopShell(p, '#fff0d0', '#9b6a43', '#fff6e8');
        const [x, y] = p.iso(0.5, 0.5, 22);
        p.poly([[x - 7, y - 10], [x + 7, y - 10], [x + 5, y], [x - 5, y]], '#7fd3f5', 'rgba(0,0,0,0.3)');
        p.ball(x - 4, y - 13, 4.5, '#ffb3d1'); p.ball(x + 4, y - 13, 4.5, '#ffb3d1'); p.ball(x, y - 17, 5.5, '#ffc6de');
        p.ball(x, y - 23, 2.2, '#e8283c');
        p.board(...p.iso(0.5, 0.82, 26), 26, 7, '#7a4b2a', 'BAKERY', '#fff6e0', 5.5);
      } else if (d === 2) { // pet shop
        shopShell(p, '#d6f5d6', '#3fb067', '#ffffff');
        const [x, y] = p.iso(0.5, 0.5, 22);
        p.line([x, y], [x, y - 8], '#666', 1.5);
        p.board(x, y - 16, 28, 16, '#ffffff', null);
        p.ellipse(x, y - 13, 4, 3.2, '#8a5a3c'); [[-4.5, -18], [-1.5, -20.5], [1.5, -20.5], [4.5, -18]].forEach(([a, b]) => p.circle(x + a, y + b, 1.6, '#8a5a3c'));
        p.board(...p.iso(0.5, 0.82, 26), 20, 7, '#3fb067', 'PETS', '#ffffff', 5.5);
      } else if (d === 3) { // candy shop
        shopShell(p, '#e6d4ff', '#a066ff', '#ffffff');
        const [x, y] = p.iso(0.5, 0.5, 22);
        p.line([x, y], [x, y - 14], '#ffffff', 2);
        p.circle(x, y - 20, 8, '#ff5d8f'); g.strokeStyle = '#ffffff'; g.lineWidth = 1.6; g.beginPath();
        for (let a = 0; a < 12; a += 0.3) { const r = a * 0.6; g.lineTo(x + Math.cos(a) * r, y - 20 + Math.sin(a) * r); } g.stroke();
        p.board(...p.iso(0.5, 0.82, 26), 24, 7, '#ff5d8f', 'CANDY', '#ffffff', 5.5);
      } else { // pizza
        shopShell(p, '#fff4e0', '#e0453a', '#ffffff');
        const [x, y] = p.iso(0.5, 0.5, 22);
        p.line([x - 6, y], [x - 6, y - 8], '#666', 1.2); p.line([x + 6, y], [x + 6, y - 8], '#666', 1.2);
        p.poly([[x - 10, y - 22], [x + 10, y - 22], [x, y - 6]], '#ffcf4a', 'rgba(150,80,0,0.6)');
        p.poly([[x - 11, y - 24], [x + 11, y - 24], [x + 10, y - 21], [x - 10, y - 21]], '#d9933f');
        [[-4, -18], [3, -17], [0, -12]].forEach(([a, b]) => p.circle(x + a, y + b, 1.8, '#d9332b'));
      }
    },
    (p, d, c) => {
      if (d === 0) {
        const brand = ['#ff6f61', '#3fa9f5', '#3fb067'][c % 3];
        p.box(0.08, 0.12, 0.92, 0.88, 0, 28, '#f6f6f6');
        p.poly(p.qL(0.08, 0.92, 0.88, 20, 25), brand); p.poly(p.qR(0.12, 0.88, 0.92, 20, 25), shade(brand, -0.2));
        const q = p.qL(0.14, 0.7, 0.88, 3, 16); p.poly(q, '#c4e9ff', 'rgba(0,0,0,0.3)'); p.light(q);
        p.doorL(0.8, 0.88, 0.12, 13, '#9fd5f5');
        p.winsR(0.16, 0.84, 0.92, 4, 16, 3, 1, { fw: 0.7 });
        p.box(0.25, 0.42, 0.75, 0.48, 28, 44, brand);
        p.textL('SNACKS', 0.5, 0.48, 36, 6.5, '#ffffff'); p.glowPoly(p.qL(0.25, 0.75, 0.48, 30, 42), alpha(brand, 0.85));
      } else if (d === 1) {
        p.box(0.08, 0.08, 0.92, 0.92, 0, 20, PAL.walls[c]);
        const q = p.qL(0.12, 0.88, 0.92, 2, 12); p.poly(q, '#c4e9ff', 'rgba(0,0,0,0.3)'); p.light(q);
        awningL(p, 0.1, 0.9, 0.92, 15, 0.08, 3, '#ffb84d', '#ffffff', 10);
        p.winsR(0.12, 0.88, 0.92, 4, 15, 4, 1);
        p.box(0.3, 0.1, 0.9, 0.62, 20, 40, '#9fd8ff', { top: '#d9f1ff' });
        p.winsL(0.33, 0.87, 0.62, 22, 38, 5, 2, { col: '#e3f6ff' }); p.winsR(0.13, 0.6, 0.9, 22, 38, 4, 2, { col: '#c7ecff' });
        p.board(...p.iso(0.3, 0.92, 25), 26, 7, '#ff6fa5', 'PLAZA', '#ffffff', 5.5, { glow: '#ff9fcf' });
      } else {
        p.box(0.15, 0.15, 0.85, 0.85, 0, 32, '#d27a5e');
        p.winsL(0.18, 0.82, 0.85, 14, 30, 3, 1, { col: '#ffeccc' }); p.winsR(0.18, 0.82, 0.85, 4, 30, 3, 2);
        const q = p.qL(0.18, 0.6, 0.85, 2, 11); p.poly(q, '#ffe2b0', 'rgba(0,0,0,0.3)'); p.light(q);
        p.doorL(0.72, 0.85, 0.1, 11, '#5a3a24');
        awningL(p, 0.16, 0.84, 0.85, 12, 0.09, 3, '#2f7d5b', '#f5ead0');
        p.box(0.13, 0.13, 0.87, 0.87, 32, 34, '#b8654c');
        p.board(...p.iso(0.5, 0.85, 40), 30, 8, '#2f7d5b', 'BOOK CAFÉ', '#fff6e0', 5.5, { glow: '#7fffc0' });
      }
    },
    (p, d, c) => {
      if (d === 0) {
        p.box(0.16, 0.16, 0.84, 0.84, 0, 140, '#7cc0ea');
        p.winsL(0.18, 0.82, 0.84, 4, 136, 5, 14, { col: '#d6f0ff', fw: 0.75, fh: 0.6 });
        p.winsR(0.18, 0.82, 0.84, 4, 136, 5, 14, { col: '#b3dcf5', fw: 0.75, fh: 0.6 });
        p.box(0.3, 0.3, 0.7, 0.7, 140, 148, '#e8f4fb');
        const top = p.iso(0.5, 0.5, 168); p.line(p.iso(0.5, 0.5, 148), top, '#cccccc', 1.5); p.glowDot(top[0], top[1], 1.8, '#ff4444'); p.circle(top[0], top[1], 1.6, '#ff4444');
      } else if (d === 1) {
        p.box(0.05, 0.05, 0.95, 0.95, 0, 28, PAL.walls[(c + 2) % 8]);
        const q = p.qL(0.1, 0.9, 0.95, 3, 16); p.poly(q, '#c4e9ff', 'rgba(0,0,0,0.3)'); p.light(q);
        p.winsR(0.1, 0.9, 0.95, 5, 20, 4, 1);
        p.box(0.25, 0.25, 0.75, 0.75, 28, 122, '#f7d6e6');
        p.winsL(0.27, 0.73, 0.75, 32, 118, 3, 9); p.winsR(0.27, 0.73, 0.75, 32, 118, 3, 9);
        p.box(0.22, 0.22, 0.78, 0.78, 122, 126, '#ffffff');
        const [x, y] = p.iso(0.5, 0.5, 126); p.line([x, y], [x, y - 8], '#999', 1.4);
        p.g.save(); p.g.translate(x, y - 15); p.g.fillStyle = '#ff3d7f'; p.g.beginPath(); p.g.moveTo(0, 6); p.g.bezierCurveTo(-11, -2, -5, -10, 0, -4); p.g.bezierCurveTo(5, -10, 11, -2, 0, 6); p.g.fill(); p.g.restore();
        p.glowDot(x, y - 14, 5, '#ff6fa5');
      } else {
        p.box(0.2, 0.2, 0.8, 0.8, 0, 126, '#3c4a6e');
        for (let z = 6; z < 124; z += 8) { const a = p.qL(0.22, 0.78, 0.8, z, z + 3), b = p.qR(0.22, 0.78, 0.8, z, z + 3); p.poly(a, '#5fe0ff'); p.poly(b, '#3fb0d0'); p.lights.push(a, b); }
        p.box(0.3, 0.3, 0.7, 0.7, 126, 132, '#2b3550');
        const [x, y] = p.iso(0.5, 0.5, 132); p.line([x, y], [x, y - 26], '#bbbbbb', 1.3); p.glowDot(x, y - 26, 1.8, '#ff4444'); p.circle(x, y - 26, 1.5, '#ff4444');
        const [dx, dy] = p.iso(0.62, 0.38, 132); p.ellipse(dx, dy - 5, 4.5, 3, '#e8e8e8', '#999');
      }
    },
  ],
  I: [null,
    (p, d, c, rr) => {
      if (d === 0) {
        p.box(0.1, 0.18, 0.9, 0.82, 0, 14, '#cbb89c');
        p.poly(p.qL(0.35, 0.65, 0.82, 0, 10), '#8d939c', 'rgba(0,0,0,0.3)');
        for (let k = 0; k < 3; k++) { const u0 = 0.1 + k * 0.267; p.gable(u0, 0.18, u0 + 0.267, 0.82, 14, 8, '#9aa0a8', '#cbb89c', 'v'); }
        p.box(0.02, 0.86, 0.12, 0.96, 0, 5, '#c08a4a'); p.box(0.14, 0.88, 0.22, 0.96, 0, 4, '#b07a40');
      } else if (d === 1) {
        p.box(0.15, 0.15, 0.85, 0.85, 0, 20, '#7fa7d9');
        p.winsL(0.2, 0.8, 0.85, 4, 16, 3, 1); p.poly(p.qR(0.3, 0.7, 0.85, 0, 13), '#56708f', 'rgba(0,0,0,0.3)');
        const [x, y] = p.iso(0.5, 0.5, 20), g = p.g;
        g.save(); g.translate(x, y - 12); g.fillStyle = '#c9ced6'; g.beginPath();
        for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 8 : 10; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.strokeStyle = '#7d8590'; g.stroke();
        g.fillStyle = '#7fa7d9'; g.beginPath(); g.arc(0, 0, 3.5, 0, 7); g.fill(); g.restore();
      } else {
        p.box(0.1, 0.18, 0.62, 0.3, 0, 6, '#c08a4a'); p.box(0.66, 0.18, 0.8, 0.3, 0, 8, '#b07a40');
        p.box(0.08, 0.32, 0.92, 0.88, 0, 18, '#b8a48a');
        for (let k = 0; k < 3; k++) { const u = 0.16 + k * 0.26; p.poly(p.qL(u, u + 0.18, 0.88, 0, 12), '#d9d9d9', 'rgba(0,0,0,0.3)'); for (let z = 2; z < 12; z += 2.5) p.line(p.iso(u, 0.88, z), p.iso(u + 0.18, 0.88, z), 'rgba(0,0,0,0.2)', 0.6); }
        p.flat(0.08, 0.32, 0.92, 0.88, 18.5, '#a8957c');
      }
    },
    (p, d, c) => {
      if (d === 0) {
        p.cyl(0.3, 0.28, 0, 62, 5, '#eeeeee'); for (let z = 10; z < 60; z += 14) p.band(0.3, 0.28, z, z + 5, 5, '#ff6fa5'); p.emit(0.3, 0.28, 64);
        p.box(0.1, 0.42, 0.72, 0.92, 0, 26, '#ffc7dd');
        p.winsL(0.14, 0.68, 0.92, 4, 22, 4, 2);
        p.cyl(0.84, 0.3, 0, 30, 8, '#ff8fb8'); p.cyl(0.84, 0.62, 0, 30, 8, '#ffb3d1');
        p.textL('CANDY', 0.41, 0.92, 29, 6, '#e0457b');
      } else if (d === 1) {
        p.cyl(0.8, 0.22, 0, 70, 6, '#7a4b2a'); p.emit(0.8, 0.22, 72);
        p.box(0.1, 0.2, 0.7, 0.85, 0, 28, '#8b5a3c');
        p.winsL(0.14, 0.66, 0.85, 4, 24, 4, 2, { col: '#ffd9a8' }); p.winsR(0.24, 0.8, 0.7, 4, 24, 3, 2, { col: '#e6b98a' });
        p.cyl(0.84, 0.72, 0, 22, 9, '#c9a27a'); p.line(p.iso(0.7, 0.6, 18), p.iso(0.8, 0.68, 18), '#999', 2);
        p.textL('CHOCOLATE', 0.4, 0.85, 31, 5, '#ffd9a8');
      } else {
        p.box(0.1, 0.1, 0.9, 0.75, 0, 24, '#9aa3ad');
        p.cyl(0.3, 0.35, 24, 74, 5, '#d0d0d0'); p.band(0.3, 0.35, 64, 70, 5, '#e05050'); p.emit(0.3, 0.35, 76);
        p.cyl(0.6, 0.35, 24, 64, 5, '#d0d0d0'); p.band(0.6, 0.35, 54, 60, 5, '#e05050'); p.emit(0.6, 0.35, 66);
        p.winsL(0.14, 0.86, 0.75, 4, 20, 5, 2); p.winsR(0.14, 0.7, 0.9, 4, 20, 3, 2);
        p.box(0.2, 0.8, 0.5, 0.95, 0, 6, '#c08a4a');
      }
    },
    (p, d, c) => {
      if (d === 0) {
        p.box(0.06, 0.08, 0.68, 0.92, 0, 34, '#c9ced6');
        p.gable(0.06, 0.08, 0.68, 0.92, 34, 12, '#9aa3ad', '#c9ced6', 'u');
        p.poly(p.qR(0.25, 0.75, 0.68, 0, 26), '#6d7580', 'rgba(0,0,0,0.3)');
        p.winsL(0.1, 0.64, 0.92, 22, 32, 5, 1, { col: '#ffe9a8' });
        p.cyl(0.84, 0.5, 0, 58, 6.5, '#ffffff'); p.band(0.84, 0.5, 40, 44, 6.5, '#3f6fd8');
        p.cone(0.84, 0.5, 58, 16, 6.5, '#e0453a');
        const [x, y] = p.iso(0.84, 0.5, 4); p.poly([[x - 6, y], [x - 11, y + 3], [x - 6, y - 12]], '#e0453a'); p.poly([[x + 6, y], [x + 11, y + 3], [x + 6, y - 12]], '#c0352a');
      } else if (d === 1) {
        [[0.2, 0.18], [0.5, 0.18], [0.8, 0.18]].forEach(([u, v], i) => { p.cyl(u, v, 0, 80 + i * 6, 6, '#d6d6d6'); p.band(u, v, 66 + i * 6, 72 + i * 6, 6, '#e05050'); p.emit(u, v, 82 + i * 6); });
        p.box(0.05, 0.32, 0.95, 0.95, 0, 32, '#a0a8b0');
        p.winsL(0.1, 0.9, 0.95, 6, 28, 6, 2); p.winsR(0.36, 0.9, 0.95, 6, 28, 4, 2);
        p.box(0.1, 0.38, 0.4, 0.6, 32, 40, '#8a929c');
      } else {
        p.box(0.08, 0.08, 0.92, 0.6, 0, 26, '#e8ecf2');
        p.winsL(0.12, 0.88, 0.6, 6, 22, 6, 2, { col: '#9ff0ff' });
        p.dome(0.35, 0.34, 26, 16, '#d4f4ff'); p.dome(0.72, 0.3, 26, 11, '#c5f0d8');
        p.cyl(0.3, 0.8, 0, 26, 8, '#b0f0c8'); p.cyl(0.7, 0.8, 0, 32, 8, '#b8d8ff');
        const [x, y] = p.iso(0.35, 0.34, 42); p.glowDot(x, y, 2, '#7fffe0');
      }
    },
  ],
};

function zoneSprite(type, level, variant) {
  const designs = ZDESIGNS[type][level], d = variant % designs, c = Math.floor(variant / designs) % 8;
  return makeSprite(`${type}${level}_${d}_${c}`, 1, ZHEIGHT[type][level], (p, rr) => ZART[type][level](p, d, c, rr));
}
function treeSprite(kind) {
  return makeSprite('tree' + kind, 1, 50, (p, rr) => {
    p.tree(0.5, 0.5, [0, 1, 2, 3, 4][kind - 1] ?? 0, 1);
    if (rr() < 0.5) p.bush(0.8, 0.8, 0.5);
  });
}

// ---------------------------------------------------------------------
//  Placed buildings: power, parks, services, landmarks
// ---------------------------------------------------------------------
function drawRocket(g, x, y, s, flame) {
  g.save(); g.translate(x, y); g.scale(s, s);
  if (flame > 0) {
    const fl = 14 + Math.random() * 10 * flame + 10 * flame;
    const grad = g.createLinearGradient(0, 0, 0, fl);
    grad.addColorStop(0, '#fffbe0'); grad.addColorStop(0.3, '#ffd23f'); grad.addColorStop(0.7, '#ff7b25'); grad.addColorStop(1, 'rgba(255,60,0,0)');
    g.fillStyle = grad; g.beginPath(); g.moveTo(-5, 0); g.quadraticCurveTo(0, fl * 1.2, 5, 0); g.fill();
  }
  g.fillStyle = '#d63a2f'; g.beginPath(); g.moveTo(-6, -2); g.lineTo(-12, 4); g.lineTo(-11, -12); g.lineTo(-6, -16); g.fill();
  g.beginPath(); g.moveTo(6, -2); g.lineTo(12, 4); g.lineTo(11, -12); g.lineTo(6, -16); g.fill();
  const body = g.createLinearGradient(-7, 0, 7, 0); body.addColorStop(0, '#ffffff'); body.addColorStop(0.6, '#e8eaef'); body.addColorStop(1, '#a8adb8');
  g.fillStyle = body; g.beginPath(); g.moveTo(-7, 0); g.lineTo(-7, -46); g.quadraticCurveTo(-7, -62, 0, -72); g.quadraticCurveTo(7, -62, 7, -46); g.lineTo(7, 0); g.closePath(); g.fill();
  g.fillStyle = '#d63a2f'; g.beginPath(); g.moveTo(-6.4, -54); g.quadraticCurveTo(-5, -64, 0, -72); g.quadraticCurveTo(5, -64, 6.4, -54); g.closePath(); g.fill();
  g.fillStyle = '#3f6fd8'; g.fillRect(-7, -12, 14, 3);
  g.fillStyle = '#7fd3ff'; g.strokeStyle = '#555'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, -36, 3.6, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#2a2a3a'; g.fillRect(-4, -1, 8, 3);
  g.restore();
}
function catFigure(p, x, y, blink, tailA) {
  const F = PERSONAL.catColors, g = p.g;
  if (tailA !== undefined) {
    g.save(); g.lineCap = 'round'; g.strokeStyle = F.fur; g.lineWidth = 4.5; g.beginPath(); g.moveTo(x + 10, y - 6);
    g.quadraticCurveTo(x + 24, y - 8, x + 20 + Math.sin(tailA) * 6, y - 26); g.stroke();
    g.strokeStyle = F.stripes; g.lineWidth = 4.5; g.setLineDash([3, 4]); g.stroke(); g.restore();
    return;
  }
  p.ellipse(x, y - 13, 14, 13, F.fur, 'rgba(0,0,0,0.25)');
  p.ellipse(x, y - 9, 8, 8, '#fff2e0');
  p.circle(x, y - 33, 12, F.fur, 'rgba(0,0,0,0.25)');
  p.poly([[x - 11, y - 38], [x - 9, y - 50], [x - 2, y - 43]], F.fur, 'rgba(0,0,0,0.25)'); p.poly([[x + 11, y - 38], [x + 9, y - 50], [x + 2, y - 43]], F.fur, 'rgba(0,0,0,0.25)');
  p.poly([[x - 9, y - 40], [x - 8.5, y - 47], [x - 4, y - 43]], '#ffb3c6'); p.poly([[x + 9, y - 40], [x + 8.5, y - 47], [x + 4, y - 43]], '#ffb3c6');
  g.strokeStyle = F.stripes; g.lineWidth = 2; g.lineCap = 'round';
  [[-3, -44, -2, -40], [0, -45, 0, -40], [3, -44, 2, -40], [-12, -16, -7, -15], [-13, -11, -8, -10], [12, -16, 7, -15]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(x + a, y + b); g.lineTo(x + c2, y + d); g.stroke(); });
  if (blink) { g.strokeStyle = '#333'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 7, y - 34); g.lineTo(x - 3, y - 34); g.moveTo(x + 3, y - 34); g.lineTo(x + 7, y - 34); g.stroke(); }
  else { p.ellipse(x - 5, y - 34, 2.8, 3.2, F.eyes); p.ellipse(x + 5, y - 34, 2.8, 3.2, F.eyes); p.ellipse(x - 5, y - 34, 0.9, 2.6, '#111'); p.ellipse(x + 5, y - 34, 0.9, 2.6, '#111'); }
  p.poly([[x - 1.6, y - 29.5], [x + 1.6, y - 29.5], [x, y - 28]], '#ff8fa8');
  g.strokeStyle = 'rgba(80,60,40,0.7)'; g.lineWidth = 0.6;
  [[-1, -28, -12, -30], [-1, -27.5, -12, -26], [1, -28, 12, -30], [1, -27.5, 12, -26]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(x + a, y + b); g.lineTo(x + c2, y + d); g.stroke(); });
}
function donutFigure(g, x, y, R, sx) {
  g.save(); g.translate(x, y); g.scale(sx, 1);
  g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.arc(0, 0, R * 0.36, 0, Math.PI * 2, true);
  g.fillStyle = '#e0a55e'; g.fill('evenodd');
  g.beginPath();
  for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2, r = R * 0.88 + Math.sin(i * 1.7) * R * 0.05; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.arc(0, 0, R * 0.42, 0, Math.PI * 2, true); g.fillStyle = '#ff8fc0'; g.fill('evenodd');
  const sprinkle = ['#ffffff', '#ffe14d', '#5ce1e6', '#8fe36b', '#b48cff'];
  for (let i = 0; i < 18; i++) { const a = i * 2.4, r = R * (0.55 + (i % 3) * 0.1); g.save(); g.translate(Math.cos(a) * r, Math.sin(a) * r); g.rotate(a * 3); g.fillStyle = sprinkle[i % 5]; g.fillRect(-1.6, -0.5, 3.2, 1.1); g.restore(); }
  g.restore();
}
function statueFigure(p, x, y) {
  const g = p.g, gold = (x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(0.45, '#f5c518'); gr.addColorStop(1, '#b8860b'); return gr; };
  g.save(); g.fillStyle = gold(x - 10, y - 50, x + 10, y);
  g.fillRect(x - 3.5, y - 12, 2.6, 12); g.fillRect(x + 1, y - 12, 2.6, 12);
  g.beginPath(); g.moveTo(x - 4, y - 30); g.lineTo(x + 4, y - 30); g.lineTo(x + 9, y - 11); g.lineTo(x - 9, y - 11); g.closePath(); g.fill();
  g.lineCap = 'round'; g.strokeStyle = gold(x - 10, y - 50, x + 10, y); g.lineWidth = 2.6;
  g.beginPath(); g.moveTo(x + 3, y - 28); g.lineTo(x + 9, y - 38); g.lineTo(x + 10, y - 46); g.stroke();
  g.beginPath(); g.moveTo(x - 3, y - 28); g.lineTo(x - 8, y - 22); g.lineTo(x - 4, y - 18); g.stroke();
  g.beginPath(); g.arc(x, y - 35, 5.2, 0, 7); g.fill();
  g.beginPath(); g.ellipse(x - 6, y - 33, 2.2, 5, 0.5, 0, 7); g.fill();
  g.strokeStyle = 'rgba(190,40,60,0.9)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x - 4, y - 29); g.lineTo(x + 6, y - 16); g.stroke();
  g.fillStyle = gold(x + 6, y - 56, x + 14, y - 44);
  g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 2.8 : 6.5; g.lineTo(x + 10 + Math.cos(a) * r, y - 51 + Math.sin(a) * r); } g.closePath(); g.fill();
  g.restore();
  p.glowDot(x + 10, y - 51, 4, '#fff3a0');
}

const ART = {
  wind(p) {
    p.box(0.4, 0.4, 0.6, 0.6, 0, 4, '#d9dde3');
    const [x, y] = p.iso(0.5, 0.5, 4);
    const g = p.g, gr = g.createLinearGradient(x - 3, 0, x + 3, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#c8ccd4');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x - 1.3, y - 80); g.lineTo(x + 1.3, y - 80); g.lineTo(x + 3, y); g.fill();
    p.ellipse(x + 1, y - 82, 5, 3, '#f0f0f0', '#aaa');
  },
  coal(p) {
    p.cyl(0.45, 0.42, 0, 100, 7, '#dedede'); [20, 50, 80].forEach((z) => p.band(0.45, 0.42, z, z + 7, 7, '#e05050')); p.emit(0.45, 0.42, 102);
    p.cyl(0.42, 0.98, 0, 92, 7, '#dedede'); [18, 46, 74].forEach((z) => p.band(0.42, 0.98, z, z + 7, 7, '#e05050')); p.emit(0.42, 0.98, 94);
    const [x, y] = p.iso(1.25, 0.35, 0); p.ellipse(x, y - 3, 18, 7, '#2d2d33'); p.ellipse(x - 2, y - 6, 11, 5, '#3d3d45');
    p.box(0.85, 0.7, 1.85, 1.85, 0, 36, '#8d939c');
    p.winsL(0.9, 1.8, 1.85, 6, 30, 5, 2, { col: '#ffe9a8' }); p.winsR(0.75, 1.8, 1.85, 6, 30, 5, 2, { col: '#e6d090' });
    p.box(1.0, 0.85, 1.4, 1.25, 36, 46, '#7b828c');
    p.textL('POWER', 1.35, 1.85, 33, 6, '#ffe14d');
  },
  solar(p) {
    for (let s = 0; s < 6; s++) for (let i = 0; i < 3; i++) { const j = s - i; if (j < 0 || j > 2) continue;
      const u = 0.36 + i * 0.64, v = 0.36 + j * 0.64;
      p.line(p.iso(u, v + 0.1, 0), p.iso(u, v + 0.1, 5), '#777', 1);
      const q = [p.iso(u - 0.27, v + 0.18, 3), p.iso(u + 0.27, v + 0.18, 3), p.iso(u + 0.27, v - 0.18, 13), p.iso(u - 0.27, v - 0.18, 13)];
      p.poly(q, '#2c4a8a', '#d8dde6', 1);
      for (let k = 1; k < 4; k++) p.line(p.iso(u - 0.27 + k * 0.135, v + 0.18, 3), p.iso(u - 0.27 + k * 0.135, v - 0.18, 13), 'rgba(160,200,255,0.5)', 0.5);
      p.line(p.iso(u - 0.27, v, 8), p.iso(u + 0.27, v, 8), 'rgba(160,200,255,0.5)', 0.5);
    }
  },
  fusion(p) {
    p.box(0.2, 0.2, 1.8, 1.8, 0, 12, '#d9dde6');
    p.winsL(0.3, 1.7, 1.8, 3, 10, 7, 1, { col: '#9ff0ff' });
    p.dome(1, 1, 12, 36, '#e8f4ff', 1.05);
    const [x, y] = p.iso(1, 1, 30), g = p.g;
    g.beginPath(); g.ellipse(x, y, 50, 18, 0, 0, Math.PI * 2); g.strokeStyle = '#5ce1e6'; g.lineWidth = 3; g.stroke();
    p.glowDot(x, y - 34, 4, '#7fffff');
  },
  park(p, rr) {
    p.flat(0.42, 0, 0.58, 1, 0.1, '#e8d5a6');
    p.tree(0.24, 0.25, 0, 0.9); p.tree(0.78, 0.22, 2, 0.75);
    p.bush(0.2, 0.75, 0.7); p.flowers(0.62, 0.62, 0.95, 0.95, 10, rr);
    p.box(0.62, 0.42, 0.68, 0.62, 3, 4, '#a0663c'); p.box(0.66, 0.42, 0.7, 0.62, 4, 8, '#a0663c');
    const [x, y] = p.iso(0.4, 0.95, 0); p.line([x, y], [x, y - 18], '#555', 1.2); p.circle(x, y - 19, 2, '#fff7c2'); p.glowDot(x, y - 19, 2.2, '#fff2a0');
  },
  garden(p, rr) {
    p.flat(0.45, 0, 0.55, 1, 0.1, '#e8d5a6');
    [[0.08, 0.1, 0.4, 0.45], [0.6, 0.1, 0.92, 0.45], [0.08, 0.55, 0.4, 0.9], [0.6, 0.55, 0.92, 0.9]].forEach(([a, b, c, d], i) => {
      p.box(a, b, c, d, 0, 3, '#a0663c', { top: '#6b4a33' });
      for (let k = 0; k < 9; k++) { const [x, y] = p.iso(lerp(a + 0.04, c - 0.04, rr()), lerp(b + 0.04, d - 0.04, rr()), 3); p.line([x, y], [x, y - 3], '#3a8a3a', 0.8); p.circle(x, y - 4, 1.7, PAL.flowers[(i * 2 + k) % 6]); }
    });
  },
  playground(p) {
    const [sx, sy] = p.iso(0.5, 0.5, 0); p.ellipse(sx, sy, 26, 12, '#f1dc9a');
    p.line(p.iso(0.15, 0.3, 0), p.iso(0.15, 0.3, 18), '#4a90d9', 1.4); p.line(p.iso(0.25, 0.3, 0), p.iso(0.25, 0.3, 18), '#4a90d9', 1.4);
    p.flat(0.12, 0.25, 0.28, 0.35, 18, '#ffd23f', '#c9a000');
    p.poly([p.iso(0.28, 0.25, 18), p.iso(0.28, 0.35, 18), p.iso(0.62, 0.35, 0), p.iso(0.62, 0.25, 0)], '#ff5d5d', 'rgba(0,0,0,0.3)');
    const a = p.iso(0.62, 0.62, 0), b = p.iso(0.62, 0.62, 20), c = p.iso(0.88, 0.62, 20), d = p.iso(0.88, 0.62, 0);
    p.line(a, b, '#e07b39', 1.4); p.line(d, c, '#e07b39', 1.4); p.line(b, c, '#e07b39', 1.6);
    [0.7, 0.8].forEach((u) => { const top = p.iso(u, 0.62, 20), bot = p.iso(u, 0.62, 6); p.line(top, bot, '#666', 0.6); p.g.fillStyle = '#3f6fd8'; p.g.fillRect(bot[0] - 2, bot[1], 4, 1.5); });
    const [x, y] = p.iso(0.3, 0.8, 0); p.person(x, y, 0.8, '#ff6fa5'); const [x2, y2] = p.iso(0.45, 0.7, 0); p.person(x2, y2, 0.7, '#3fa9f5');
  },
  fountain(p) {
    p.cyl(0.5, 0.5, 0, 6, 22, '#d8dde3', { topCol: '#6cc6f0' });
    const [x, y] = p.iso(0.5, 0.5, 6); p.ellipse(x, y, 17, 8.5, '#58b9e8');
    p.cyl(0.5, 0.5, 6, 18, 3, '#eeeeee'); p.disc(0.5, 0.5, 18, 8, '#e3e3e3', '#bbb');
    [[0.08, 0.5], [0.92, 0.5], [0.5, 0.08], [0.5, 0.92]].forEach(([u, v]) => p.bush(u, v, 0.45, '#5cb85c'));
  },
  bigpark(p, rr) {
    const [px, py] = p.iso(1.25, 0.75, 0); p.ellipse(px, py, 30, 14, '#5fb8e8', '#e8d5a6');
    p.ellipse(px - 4, py - 2, 18, 7, '#7fcbf0');
    const [dx, dy] = p.iso(1.3, 0.7, 0); p.ellipse(dx, dy - 1, 3, 1.8, '#ffffff'); p.circle(dx + 2.5, dy - 3, 1.5, '#ffffff'); p.circle(dx + 3.8, dy - 3, 0.6, '#ff9900');
    p.flat(0.1, 1.42, 1.9, 1.58, 0.1, '#e8d5a6'); p.flat(0.32, 0.1, 0.48, 1.9, 0.1, '#e8d5a6');
    p.tree(0.2, 0.2, 0, 1); p.tree(0.7, 0.25, 2, 0.9); p.tree(1.8, 0.2, 1, 0.9); p.tree(0.2, 0.9, 3, 0.9);
    p.cyl(0.75, 1.15, 0, 3, 14, '#ffffff'); [0, 1, 2, 3, 4, 5].forEach((i) => { const a = (i / 6) * Math.PI * 2, [cx, cy] = p.iso(0.75, 1.15, 3); p.line([cx + Math.cos(a) * 11, cy + Math.sin(a) * 5.5], [cx + Math.cos(a) * 11, cy + Math.sin(a) * 5.5 - 14], '#ffffff', 1.4); });
    p.cone(0.75, 1.15, 17, 12, 16, '#ff8fb8');
    p.tree(1.8, 1.25, 0, 0.9); p.flowers(1.0, 1.65, 1.9, 1.95, 14, rr); p.tree(1.3, 1.85, 2, 0.8); p.tree(0.25, 1.8, 0, 0.9);
  },
  sign(p) {
    const [x, y] = p.iso(0.5, 0.5, 0);
    p.line([x - 16, y + 2], [x - 16, y - 16], '#7a5236', 2); p.line([x + 16, y + 2], [x + 16, y - 16], '#7a5236', 2);
    p.board(x, y - 26, 58, 22, '#fff7e6', null, null, 0, { border: '#7a5236' });
    const g = p.g; g.textAlign = 'center'; g.fillStyle = '#7a5236'; g.font = `600 5px ${SPRITE_FONT}`; g.fillText('WELCOME TO', x, y - 31);
    let s = 9; g.font = `700 ${s}px ${SPRITE_FONT}`; while (g.measureText(W.cityName || '').width > 54 && s > 4) { s -= 0.5; g.font = `700 ${s}px ${SPRITE_FONT}`; }
    g.fillStyle = '#e0457b'; g.fillText(W.cityName || '', x, y - 21);
    p.glows.push({ rect: [x - 29, y - 37, 58, 22], col: '#fff2c0' });
    p.flowers(0.15, 0.55, 0.85, 0.95, 10, Math.random);
  },
  police(p) {
    p.box(0.15, 0.2, 0.85, 0.8, 0, 24, '#eef3fb');
    p.poly(p.qL(0.15, 0.85, 0.8, 15, 18), '#2f5fd0'); p.poly(p.qR(0.2, 0.8, 0.85, 15, 18), '#244aa6');
    p.winsL(0.18, 0.55, 0.8, 4, 13, 2, 1); p.doorL(0.7, 0.8, 0.14, 11, '#9fd5f5'); p.winsR(0.22, 0.78, 0.85, 4, 13, 3, 1); p.winsR(0.22, 0.78, 0.85, 19, 24, 3, 1, { fh: 0.7 });
    p.textL('POLICE', 0.5, 0.8, 21, 5.5, '#2f5fd0');
    p.box(0.42, 0.42, 0.5, 0.5, 24, 27, '#ff3b3b'); p.box(0.5, 0.5, 0.58, 0.58, 24, 27, '#3b6bff');
    const r = p.iso(0.46, 0.46, 27), b = p.iso(0.54, 0.54, 27); p.glowDot(r[0], r[1] - 1, 2, '#ff4040'); p.glowDot(b[0], b[1] - 1, 2, '#4070ff');
    const [fx, fy] = p.iso(0.2, 0.25, 24); p.line([fx, fy], [fx, fy - 16], '#999', 0.8); p.poly([[fx, fy - 16], [fx + 7, fy - 13.5], [fx, fy - 11]], '#3b6bff');
  },
  fire(p) {
    p.box(0.12, 0.18, 0.72, 0.85, 0, 24, '#d4513f');
    [0.18, 0.44].forEach((u) => { p.poly(p.qL(u, u + 0.22, 0.85, 0, 15), '#f2f2f2', 'rgba(0,0,0,0.35)'); for (let z = 3; z < 15; z += 3) p.line(p.iso(u, 0.85, z), p.iso(u + 0.22, 0.85, z), 'rgba(0,0,0,0.15)', 0.6); });
    p.textL('FIRE', 0.42, 0.85, 19.5, 5.5, '#ffffff');
    p.winsR(0.24, 0.8, 0.72, 6, 20, 3, 1);
    p.box(0.72, 0.18, 0.9, 0.42, 0, 42, '#c44535'); p.winsL(0.74, 0.88, 0.42, 30, 38, 1, 1);
    p.hip(0.7, 0.16, 0.92, 0.44, 42, 9, '#5a5a66');
    const [x, y] = p.iso(0.81, 0.3, 46); p.circle(x, y, 2, '#f5c518');
  },
  school(p, rr) {
    p.box(0.2, 0.22, 1.8, 0.95, 0, 26, '#e8a066');
    p.winsL(0.25, 1.75, 0.95, 4, 24, 8, 2); p.winsR(0.25, 0.9, 1.8, 4, 24, 3, 2);
    p.doorL(1.0, 0.95, 0.16, 13, '#7a4a2a');
    p.box(0.88, 0.42, 1.12, 0.66, 26, 46, '#f6d39a'); p.hip(0.86, 0.4, 1.14, 0.68, 46, 10, '#c0392b');
    const [cx, cy] = p.iso(1.0, 0.66, 38); p.circle(cx, cy, 4, '#ffffff', '#555'); p.line([cx, cy], [cx, cy - 3], '#333', 0.8); p.line([cx, cy], [cx + 2.2, cy], '#333', 0.8);
    p.textL('SCHOOL', 0.5, 0.95, 22, 5, '#ffffff');
    const [tx, ty] = p.iso(1.4, 1.42, 0); p.ellipse(tx, ty, 26, 11, '#d96a4a'); p.ellipse(tx, ty, 19, 7.5, '#7ccf5a');
    p.line(p.iso(0.3, 1.1, 0), p.iso(0.3, 1.1, 30), '#aaa', 0.9);
    const [fx, fy] = p.iso(0.3, 1.1, 30); p.poly([[fx, fy], [fx + 8, fy + 2.5], [fx, fy + 5]], '#3f6fd8');
    p.box(0.45, 1.25, 0.95, 1.45, 0, 9, '#ffc61a'); p.winsL(0.48, 0.92, 1.45, 4.5, 8, 4, 1, { fw: 0.7, light: false });
    p.flowers(1.0, 1.75, 1.9, 1.95, 8, rr);
  },
  hospital(p) {
    p.box(0.2, 0.2, 1.55, 1.5, 0, 60, '#f5f8fc');
    p.winsL(0.25, 1.5, 1.5, 4, 56, 6, 5); p.winsR(0.25, 1.45, 1.55, 4, 56, 6, 5);
    p.poly(p.qL(0.82, 0.94, 1.5, 38, 56), '#e8283c'); p.poly(p.qL(0.72, 1.04, 1.5, 43, 51), '#e8283c'); p.glowPoly(p.qL(0.82, 0.94, 1.5, 38, 56), '#ff5060');
    const [hx, hy] = p.iso(0.85, 0.85, 60); p.ellipse(hx, hy, 18, 9, '#5d6370', '#ffffff');
    p.g.save(); p.g.translate(hx, hy); p.g.transform(1, 0, 0, 0.5, 0, 0); p.g.font = `700 12px ${SPRITE_FONT}`; p.g.textAlign = 'center'; p.g.textBaseline = 'middle'; p.g.fillStyle = '#fff'; p.g.fillText('H', 0, 1); p.g.restore();
    p.box(0.3, 1.5, 1.5, 1.85, 0, 16, '#e3ecf5'); p.poly(p.qL(0.6, 1.2, 1.85, 0, 11), '#bfe6ff', 'rgba(0,0,0,0.3)');
    p.box(1.6, 1.2, 1.92, 1.42, 0, 9, '#ffffff'); p.poly(p.qL(1.6, 1.92, 1.42, 4, 6), '#e8283c');
    const [lx, ly] = p.iso(1.76, 1.31, 9); p.glowDot(lx, ly - 1, 1.6, '#ff3030');
  },
  // ---------------- landmarks ----------------
  dogpark(p, rr) {
    p.fenceL(0.05, 1.95, 0.05, 6, '#c8a06a', 12); p.fenceR(0.05, 1.95, 0.05, 6, '#c8a06a', 12);
    p.tree(0.3, 0.25, 0, 1); p.tree(1.75, 0.3, 2, 0.9);
    p.box(0.25, 0.65, 0.6, 1.0, 0, 10, '#d0503d'); p.poly(p.qL(0.35, 0.5, 1.0, 0, 7), '#3a2016');
    p.gable(0.25, 0.65, 0.6, 1.0, 10, 8, '#7f2a1f', '#d0503d', 'u');
    p.textL(PERSONAL.dog.toUpperCase(), 0.43, 1.0, 11.5, 3.5, '#fff');
    const [hx, hy] = p.iso(1.2, 0.6, 0); p.line([hx - 7, hy], [hx - 7, hy - 14], '#666', 1); p.line([hx + 7, hy], [hx + 7, hy - 14], '#666', 1);
    p.g.beginPath(); p.g.arc(hx, hy - 20, 7, 0, 7); p.g.strokeStyle = '#ff5d5d'; p.g.lineWidth = 2.2; p.g.stroke();
    p.poly([p.iso(1.2, 1.2, 0), p.iso(1.6, 1.2, 0), p.iso(1.6, 1.2, 0), p.iso(1.2, 1.2, 8)], '#3fa9f5');
    p.poly([p.iso(1.1, 1.15, 0), p.iso(1.1, 1.35, 0), p.iso(1.5, 1.35, 8), p.iso(1.5, 1.15, 8)], '#ffd23f', 'rgba(0,0,0,0.3)');
    p.poly([p.iso(1.5, 1.15, 8), p.iso(1.5, 1.35, 8), p.iso(1.9, 1.35, 0), p.iso(1.9, 1.15, 0)], '#ffb800', 'rgba(0,0,0,0.3)');
    p.cyl(0.4, 1.6, 0, 7, 2.5, '#e8283c');
    const [bx, by] = p.iso(0.9, 1.9, 0); p.circle(bx, by - 2, 2.2, '#c6ff3d');
    p.fenceL(0.05, 1.95, 1.95, 6, '#c8a06a', 12); p.fenceR(0.05, 1.95, 1.95, 6, '#c8a06a', 12);
    const [sx, sy] = p.iso(1.95, 1.95, 0);
    p.line([sx, sy], [sx, sy - 12], '#7a5236', 1.5);
    p.board(sx, sy - 18, 44, 10, '#ffe7b0', `${POSS(PERSONAL.dog).toUpperCase()} DOG PARK`, '#7a4b26', 5, { border: '#7a5236', glow: '#fff2c0' });
    void rr;
  },
  donut(p) {
    p.box(0.3, 0.35, 1.75, 1.65, 0, 24, '#fff1f6');
    p.poly(p.qL(0.3, 1.75, 1.65, 16, 19), '#c9d3dc'); p.poly(p.qR(0.35, 1.65, 1.75, 16, 19), '#a9b3bc');
    const q = p.qL(0.38, 1.4, 1.65, 4, 14); p.poly(q, '#c4e9ff', 'rgba(0,0,0,0.3)'); p.light(q);
    p.doorL(1.55, 1.65, 0.14, 13, '#ff8fc0');
    p.winsR(0.45, 1.55, 1.75, 4, 14, 4, 1, { fw: 0.8 });
    p.poly(p.qL(0.3, 1.75, 1.65, 19, 24), '#ff8fc0'); p.poly(p.qR(0.35, 1.65, 1.75, 19, 24), '#e070a0');
    const [x, y] = p.iso(1.0, 1.0, 24); p.line([x, y], [x, y - 22], '#9aa3ad', 2.5);
    p.board(...p.iso(1.05, 1.65, 31), 54, 9, '#5a2a52', `${POSS(PERSONAL.dad).toUpperCase()} DONUTS`, '#ffd1e8', 5.5, { glow: '#ff6fd0' });
    [[1.85, 0.5], [1.85, 1.0]].forEach(([u, v]) => { const [ux, uy] = p.iso(u, v, 0); p.line([ux, uy], [ux, uy - 12], '#777', 0.8); p.ellipse(ux, uy - 13, 7, 3, '#ff6fa5'); p.ellipse(ux, uy - 2, 4, 2, '#ffffff'); });
  },
  catcafe(p) {
    p.box(0.25, 0.3, 1.7, 1.7, 0, 26, '#ffe8cc');
    p.winsL(0.3, 1.25, 1.7, 4, 16, 4, 1, { fw: 0.7, fh: 0.8, col: '#ffe9c2' }); p.doorL(1.5, 1.7, 0.14, 13, '#8a5a3c');
    p.winsR(0.35, 1.6, 1.7, 4, 16, 4, 1, { fw: 0.7, fh: 0.8, col: '#f0d4a8' });
    awningL(p, 0.28, 1.68, 1.7, 18, 0.1, 4, '#f2a54a', '#ffffff', 12);
    p.box(0.22, 0.27, 1.73, 1.73, 26, 28, '#e8b98a');
    const [x, y] = p.iso(0.95, 0.95, 28); catFigure(p, x, y);
    p.board(...p.iso(1.05, 1.7, 33), 50, 9, '#7a4b26', `${POSS(PERSONAL.cat).toUpperCase()} CAT CAFÉ`, '#ffe8cc', 5.2, { glow: '#ffb060' });
    [[1.88, 0.55], [1.88, 1.2]].forEach(([u, v]) => { const [ux, uy] = p.iso(u, v, 0); p.line([ux, uy], [ux, uy - 12], '#777', 0.8); p.ellipse(ux, uy - 13, 7, 3, '#3fb067'); p.ellipse(ux, uy - 2, 4, 2, '#ffffff'); });
  },
  cupcake(p) {
    const [cx, cy] = p.iso(1, 1, 0), g = p.g;
    const r0 = 30, r1 = 38, hgt = 48, top = cy - hgt;
    g.beginPath(); g.moveTo(cx - r1, top); g.lineTo(cx - r0, cy); g.ellipse(cx, cy, r0, r0 / 2, 0, Math.PI, 0, true); g.lineTo(cx + r1, top); g.ellipse(cx, top, r1, r1 / 2, 0, 0, Math.PI, false); g.closePath();
    g.fillStyle = '#ff8fb8'; g.fill();
    for (let k = -6; k <= 6; k += 2) { const a = (k / 7) * (Math.PI / 2), b = ((k + 1) / 7) * (Math.PI / 2);
      g.beginPath(); g.moveTo(cx + Math.sin(a) * r0, cy + Math.cos(a) * r0 / 2); g.lineTo(cx + Math.sin(a) * r1, top + Math.cos(a) * r1 / 2); g.lineTo(cx + Math.sin(b) * r1, top + Math.cos(b) * r1 / 2); g.lineTo(cx + Math.sin(b) * r0, cy + Math.cos(b) * r0 / 2); g.closePath(); g.fillStyle = '#ff6fa0'; g.fill(); }
    const sh = g.createLinearGradient(cx - r1, 0, cx + r1, 0); sh.addColorStop(0, 'rgba(255,255,255,0.25)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(60,0,40,0.3)');
    g.beginPath(); g.moveTo(cx - r1, top); g.lineTo(cx - r0, cy); g.ellipse(cx, cy, r0, r0 / 2, 0, Math.PI, 0, true); g.lineTo(cx + r1, top); g.ellipse(cx, top, r1, r1 / 2, 0, 0, Math.PI, false); g.fillStyle = sh; g.fill();
    for (let row = 0; row < 3; row++) for (let k = -2; k <= 2; k++) { const a = k * 0.5, rr2 = lerp(r0, r1, (row * 14 + 10) / hgt), wy = cy - row * 14 - 12;
      const x = cx + Math.sin(a) * rr2 * 0.85, yy = wy + Math.cos(a) * rr2 * 0.42; const q = [[x - 2.5, yy - 3], [x + 2.5, yy - 3], [x + 2.5, yy + 3], [x - 2.5, yy + 3]]; p.poly(q, '#ffe3f0', 'rgba(0,0,0,0.25)'); p.light(q); }
    g.fillStyle = '#7a3a5a'; g.beginPath(); g.moveTo(cx - 5, cy + r0 / 2); g.lineTo(cx - 5, cy + r0 / 2 - 12); g.arc(cx, cy + r0 / 2 - 12, 5, Math.PI, 0); g.lineTo(cx + 5, cy + r0 / 2); g.fill();
    const tiers = [[0, 44, 16, '#fff0f6'], [16, 36, 14, '#ffe0ee'], [30, 26, 12, '#fff0f6'], [42, 15, 10, '#ffe0ee']];
    for (const [dz, r, hh, col] of tiers) {
      const by = top - dz; const gr = g.createRadialGradient(cx - r * 0.4, by - hh, 2, cx, by, r * 1.1); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, col); gr.addColorStop(1, '#f2b8d0');
      g.beginPath(); g.ellipse(cx, by, r, r / 2, 0, 0, Math.PI, false); g.ellipse(cx, by, r, hh, 0, Math.PI, Math.PI * 2, false); g.closePath(); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(200,120,160,0.4)'; g.stroke();
    }
    const rr = mulberry32(7), sprinkle = ['#ff4d6d', '#ffd23f', '#3fa9f5', '#5cd65c', '#b48cff'];
    for (let i = 0; i < 40; i++) { const a = rr() * Math.PI * 2, t = rr(), r = 8 + t * 34, x = cx + Math.cos(a) * r, y = top - 6 - (1 - t) * 40 + Math.sin(a) * r * 0.3; g.save(); g.translate(x, y); g.rotate(rr() * 3); g.fillStyle = sprinkle[i % 5]; g.fillRect(-1.6, -0.5, 3.2, 1.1); g.restore(); }
    g.strokeStyle = '#3a8a3a'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(cx, top - 58); g.quadraticCurveTo(cx + 3, top - 70, cx + 8, top - 72); g.stroke();
    p.ball(cx, top - 58, 8, '#e8283c'); p.glowDot(cx - 2, top - 61, 2, '#ff8080');
  },
  observatory(p) {
    p.cyl(1, 1, 0, 30, 42, '#e8e8f0');
    const [cx, cy] = p.iso(1, 1, 0);
    for (let a = -3; a <= 3; a++) { const x = cx + Math.sin(a * 0.4) * 38, y = cy + Math.cos(a * 0.4) * 19 - 18; const q = [[x - 2.5, y - 4], [x + 2.5, y - 4], [x + 2.5, y + 4], [x - 2.5, y + 4]]; p.poly(q, '#a9dcff', 'rgba(0,0,0,0.3)'); p.light(q); }
    const [dx, dy] = p.dome(1, 1, 30, 36, '#cfd6e3', 0.95);
    const g = p.g; g.save(); g.beginPath(); g.moveTo(dx - 5, dy + 1); g.lineTo(dx + 3, dy); g.lineTo(dx + 11, cy - 30); g.lineTo(dx + 2, cy - 30); g.closePath(); g.fillStyle = '#2b3550'; g.fill(); g.restore();
    g.save(); g.translate(dx + 4, dy + 8); g.rotate(-0.8); g.fillStyle = '#7d8590'; g.fillRect(-3.5, -24, 7, 26); g.fillStyle = '#444'; g.fillRect(-4, -26, 8, 3); g.restore();
    p.board(...p.iso(1.2, 1.9, 8), 46, 8, '#2b3550', 'OBSERVATORY', '#ffe14d', 5, { glow: '#9fb8ff' });
  },
  zoo(p, rr) {
    const g = p.g;
    p.fenceL(0.15, 1.45, 0.15, 6, '#8a5a3c', 8); p.fenceR(0.15, 1.45, 0.15, 6, '#8a5a3c', 8);
    p.tree(0.3, 0.3, 4, 1.0); p.tree(2.6, 0.3, 4, 1.1);
    const [gx, gy] = p.iso(0.85, 0.85, 0);
    g.fillStyle = '#e2b13c';
    [[-7, 0], [-3, 0], [5, 0], [9, 0]].forEach(([a]) => g.fillRect(gx + a, gy - 14, 2, 14));
    p.ellipse(gx + 2, gy - 17, 10, 5, '#f2c14e');
    g.beginPath(); g.moveTo(gx + 7, gy - 20); g.lineTo(gx + 12, gy - 46); g.lineTo(gx + 16, gy - 46); g.lineTo(gx + 12, gy - 18); g.fill();
    p.ellipse(gx + 16, gy - 48, 5.5, 3.2, '#f2c14e'); g.fillStyle = '#8a5a3c'; g.fillRect(gx + 13, gy - 55, 1.2, 4); g.fillRect(gx + 16, gy - 55, 1.2, 4); p.circle(gx + 18, gy - 49, 0.8, '#222');
    for (let i = 0; i < 9; i++) p.circle(gx - 6 + rr() * 16, gy - 20 + rr() * 6, 1.2, '#a0662c');
    for (let i = 0; i < 5; i++) p.circle(gx + 9 + rr() * 4, gy - 40 + i * 4.5, 1, '#a0662c');
    p.fenceL(0.15, 1.45, 1.45, 6, '#8a5a3c', 8); p.fenceR(0.15, 1.45, 1.45, 6, '#8a5a3c', 8);
    const [px, py] = p.iso(2.2, 0.9, 0); p.ellipse(px + 14, py + 4, 16, 7, '#6cc6f0');
    p.ellipse(px, py - 12, 13, 9, '#9aa3ad'); g.fillStyle = '#8a929c'; [[-9], [-4], [4], [8]].forEach(([a]) => g.fillRect(px + a, py - 7, 3.5, 7));
    p.circle(px - 12, py - 15, 6.5, '#9aa3ad'); p.ellipse(px - 9, py - 15, 4.5, 6, '#b0b8c2');
    g.strokeStyle = '#9aa3ad'; g.lineWidth = 2.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(px - 16, py - 13); g.quadraticCurveTo(px - 21, py - 6, px - 18, py - 2); g.stroke(); p.circle(px - 13.5, py - 17, 0.8, '#222');
    const [qx, qy] = p.iso(1.9, 2.2, 0); p.ellipse(qx, qy, 26, 12, '#6cc6f0', '#ffffff'); p.ellipse(qx - 10, qy - 2, 7, 3, '#ffffff');
    [[-9, -4], [-5, -1], [8, -3]].forEach(([a, b]) => { p.ellipse(qx + a, qy + b - 4, 2.6, 4, '#222'); p.ellipse(qx + a + 0.5, qy + b - 3.5, 1.6, 3, '#ffffff'); p.poly([[qx + a + 1, qy + b - 7], [qx + a + 3.5, qy + b - 6.5], [qx + a + 1, qy + b - 6]], '#ff9900'); });
    p.tree(2.8, 1.6, 4, 1.0); p.tree(0.4, 2.6, 0, 1.0); p.tree(1.3, 2.75, 4, 0.9); p.flowers(2.2, 2.4, 2.9, 2.9, 12, rr);
    const [ax, ay] = p.iso(0.95, 2.9, 0);
    p.line([ax - 22, ay], [ax - 22, ay - 26], '#8a5a3c', 3); p.line([ax + 22, ay], [ax + 22, ay - 26], '#8a5a3c', 3);
    p.board(ax, ay - 30, 54, 11, '#3fb067', `${NICK2.toUpperCase()} SAFARI ZOO`, '#ffffff', 6, { border: '#8a5a3c', glow: '#9fffb0' });
  },
  space(p) {
    p.flat(0.9, 0.5, 2.5, 2.1, 0.5, '#bfc5cc');
    p.box(1.15, 0.85, 2.25, 1.75, 0, 8, '#9aa0a8');
    p.flat(1.45, 1.05, 1.95, 1.55, 8.2, '#3a3d44');
    const T = (u, v, z0, z1) => { p.line(p.iso(u, v, z0), p.iso(u, v, z1), '#d63a2f', 1.6); };
    const u0 = 2.0, v0 = 0.7, u1 = 2.3, v1 = 1.0, H = 120;
    T(u0, v0, 8, H); T(u1, v0, 8, H); T(u0, v1, 8, H); T(u1, v1, 8, H);
    for (let z = 8; z < H; z += 14) { p.line(p.iso(u0, v1, z), p.iso(u1, v1, z + 14), '#d63a2f', 0.8); p.line(p.iso(u1, v1, z), p.iso(u0, v1, z + 14), '#d63a2f', 0.8); p.line(p.iso(u1, v0, z), p.iso(u1, v1, z + 14), '#b02a20', 0.8); }
    p.box(u0, v0, u1, v1, H, H + 4, '#d63a2f');
    p.line(p.iso(2.0, 1.0, 90), p.iso(1.78, 1.25, 90), '#d63a2f', 2); p.line(p.iso(2.0, 1.0, 60), p.iso(1.78, 1.25, 60), '#d63a2f', 2);
    p.box(0.2, 1.75, 1.15, 2.75, 0, 24, '#e6eef7');
    p.winsL(0.25, 1.1, 2.75, 6, 20, 5, 2, { col: '#9ff0ff' }); p.winsR(1.8, 2.7, 1.15, 6, 20, 4, 2, { col: '#7fd8ef' });
    const [dx, dy] = p.iso(0.6, 2.15, 24); p.line([dx, dy], [dx, dy - 10], '#999', 1.5);
    p.g.save(); p.g.translate(dx, dy - 14); p.g.rotate(-0.5); p.ellipse(0, 0, 10, 5, '#f4f4f4', '#999'); p.g.restore();
    p.board(...p.iso(1.8, 2.95, 10), 62, 11, '#0b1638', `${NICK1.toUpperCase()} SPACE CENTER`, '#ffe14d', 6, { glow: '#7fa8ff' });
  },
  statue(p, rr) {
    p.box(0.3, 0.3, 1.7, 1.7, 0, 8, '#e9e4da');
    p.box(0.55, 0.55, 1.45, 1.45, 8, 20, '#f3eee6');
    p.box(0.75, 0.75, 1.25, 1.25, 20, 42, '#ede6d8');
    p.poly(p.qL(0.82, 1.18, 1.25, 26, 36), '#d4a017'); p.textL('MAYOR', 1.0, 1.25, 33.5, 3.4, '#5a3a00'); p.textL(PERSONAL.mayor.toUpperCase(), 1.0, 1.25, 29, 3.4, '#5a3a00');
    const [x, y] = p.iso(1, 1, 42); statueFigure(p, x, y);
    p.flowers(0.3, 1.72, 1.9, 1.95, 14, rr); p.flowers(1.72, 0.3, 1.95, 1.9, 14, rr);
    [[0.15, 0.15], [1.85, 0.15], [0.15, 1.85], [1.85, 1.85]].forEach(([u, v]) => p.bush(u, v, 0.6, '#4fa84f'));
  },
  castle(p) {
    const tower = (u, v, h, r, roof) => {
      p.cyl(u, v, 0, h, r, '#fff0f7');
      const g = p.g, [cx, cy] = p.iso(u, v, 0); g.save(); this._clipCyl(p, cx, cy, cy - h, r); g.strokeStyle = '#ff6fa5'; g.lineWidth = 3;
      for (let k = -40; k < h + 40; k += 10) { g.beginPath(); g.moveTo(cx - r, cy - k); g.lineTo(cx + r, cy - k - 14); g.stroke(); }
      g.restore();
      const [tx, ty] = p.cone(u, v, h, 30, r + 3, roof);
      p.winsL(u - 0.05, u + 0.05, v + r / 45, h * 0.55, h * 0.75, 1, 1, { col: '#ffe9a8' });
      return [tx, ty];
    };
    tower(0.45, 0.45, 62, 13, '#b48cff');
    p.box(0.45, 0.45, 2.55, 2.55, 0, 30, '#ffc6e0');
    for (let i = 0; i < 9; i++) { const u = 0.5 + i * 0.23; p.box(u, 2.48, u + 0.11, 2.55, 30, 35, '#ffc6e0'); const v = 0.5 + i * 0.23; p.box(2.48, v, 2.55, v + 0.11, 30, 35, '#ffb0d4'); }
    p.winsL(0.6, 2.4, 2.55, 14, 24, 6, 1, { col: '#ffe9a8' }); p.winsR(0.6, 2.4, 2.55, 14, 24, 6, 1, { col: '#ffe9a8' });
    const g = p.g; const [ax, ay] = p.iso(1.5, 2.55, 0);
    g.save(); g.translate(ax, ay); g.transform(1, 0.5, 0, 1, 0, 0); g.fillStyle = '#7a3a5a'; g.beginPath(); g.moveTo(-9, 0); g.lineTo(-9, -12); g.arc(0, -12, 9, Math.PI, 0); g.lineTo(9, 0); g.fill();
    g.strokeStyle = '#ffd23f'; g.lineWidth = 1; for (let k = -6; k <= 6; k += 4) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, -18); g.stroke(); } g.restore();
    p.box(1.05, 1.05, 1.95, 1.95, 30, 70, '#ffd9ec');
    p.winsL(1.15, 1.85, 1.95, 40, 64, 3, 2, { col: '#ffe9a8' }); p.winsR(1.15, 1.85, 1.95, 40, 64, 3, 2, { col: '#ffe9a8' });
    tower(1.5, 1.5, 100, 16, '#ff6fa5');
    tower(2.55, 0.45, 62, 13, '#7fe0c8');
    tower(0.45, 2.55, 62, 13, '#7fe0c8');
    tower(2.55, 2.55, 66, 14, '#b48cff');
    [[2.9, 1.5], [1.5, 2.9]].forEach(([u, v], i) => { const [x, y] = p.iso(u, v, 0); p.line([x, y], [x, y - 16], '#ffffff', 2); p.circle(x, y - 21, 6, i ? '#5ce1e6' : '#ffd23f'); g.strokeStyle = '#ffffff'; g.lineWidth = 1.3; g.beginPath(); for (let a = 0; a < 10; a += 0.35) g.lineTo(x + Math.cos(a) * a * 0.55, y - 21 + Math.sin(a) * a * 0.55); g.stroke(); });
  },
  _clipCyl(p, cx, cyb, cyt, r) { p.cylPath(cx, cyb, cyt, r); p.g.clip(); },
  skytower(p) {
    p.box(0.25, 0.25, 1.75, 1.75, 0, 30, '#d9d0f7');
    p.winsL(0.3, 1.7, 1.75, 4, 26, 7, 2); p.winsR(0.3, 1.7, 1.75, 4, 26, 7, 2);
    p.box(0.55, 0.55, 1.45, 1.45, 30, 160, '#c6b5f2');
    p.winsL(0.58, 1.42, 1.45, 34, 156, 4, 14, { col: '#e6dcff' }); p.winsR(0.58, 1.42, 1.45, 34, 156, 4, 14, { col: '#cfc0f5' });
    p.box(0.72, 0.72, 1.28, 1.28, 160, 238, '#b39ae8');
    p.winsL(0.74, 1.26, 1.28, 164, 234, 3, 8, { col: '#e6dcff' }); p.winsR(0.74, 1.26, 1.28, 164, 234, 3, 8, { col: '#cfc0f5' });
    p.cyl(1, 1, 238, 256, 30, '#ff9ccf');
    const [cx, cy] = p.iso(1, 1, 238);
    for (let a = -4; a <= 4; a++) { const x = cx + Math.sin(a * 0.33) * 28, y = cy + Math.cos(a * 0.33) * 14 - 11; const q = [[x - 2.6, y - 4], [x + 2.6, y - 4], [x + 2.6, y + 3], [x - 2.6, y + 3]]; p.poly(q, '#ffe3f2', 'rgba(0,0,0,0.25)'); p.glowPoly(q, '#ff9ff0'); }
    p.cyl(1, 1, 256, 262, 22, '#ffffff');
    p.cyl(1, 1, 262, 312, 2.5, '#eeeeee');
  },
};

// ---------------------------------------------------------------------
//  Animated parts, drawn every frame on top of the sprites
//  p = Painter on the main canvas, already moved to the building's corner
// ---------------------------------------------------------------------
const ANIM = {
  wind(p, b, t) {
    const [x, y] = p.iso(0.5, 0.5, 4), g = p.g, hx = x + 3, hy = y - 82;
    const a0 = t * (b.powered === false ? 0.6 : 2.6) + b.id;
    g.fillStyle = '#ffffff'; g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.5;
    for (let k = 0; k < 3; k++) {
      const a = a0 + (k * Math.PI * 2) / 3;
      g.save(); g.translate(hx, hy); g.rotate(a); g.beginPath(); g.moveTo(-1.6, 0); g.quadraticCurveTo(-2.5, -14, 0, -28); g.quadraticCurveTo(1.8, -12, 1.6, 0); g.closePath(); g.fill(); g.stroke(); g.restore();
    }
    p.circle(hx, hy, 2, '#dddddd');
  },
  fountain(p, b, t) {
    const [cx, cy] = p.iso(0.5, 0.5, 18), g = p.g;
    g.fillStyle = 'rgba(190,235,255,0.9)';
    for (let i = 0; i < 16; i++) {
      const ph = (t * 0.9 + i / 16) % 1, a = (i / 16) * Math.PI * 2;
      const x = cx + Math.cos(a) * ph * 15, y = cy - ph * (1 - ph) * 4 * 12 + Math.sin(a) * ph * 7.5 + ph * 10;
      g.globalAlpha = 1 - ph * 0.7; g.beginPath(); g.arc(x, y, 1.1, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    const h = 8 + Math.sin(t * 6) * 1.5; g.fillStyle = 'rgba(210,245,255,0.95)'; g.beginPath(); g.ellipse(cx, cy - h / 2, 1.4, h / 2, 0, 0, 7); g.fill();
  },
  dogpark(p, b, t) {
    const [cx, cy] = p.iso(0.82, 0.82, 0);
    const dogs = [[PERSONAL.dogColors.fur, PERSONAL.dogColors.ears, 1.6, 0], ['#e0b46c', '#b8863f', 1.25, 2.1], ['#4a4a4a', '#2a2a2a', 1.4, 4.2]];
    for (const [fur, ears, sp, ph] of dogs) {
      const a = t * sp + ph, x = cx + Math.cos(a) * 26, y = cy + Math.sin(a) * 10 + 2;
      p.dog(x, y, 1.05, fur, ears, Math.sin(a) > 0, Math.sin(t * 14 + ph) * 1.5);
    }
  },
  donut(p, b, t) {
    const [x, y] = p.iso(1.0, 1.0, 24);
    donutFigure(p.g, x, y - 38, 17, Math.cos(t * 1.4));
  },
  catcafe(p, b, t) {
    const [x, y] = p.iso(0.95, 0.95, 28);
    catFigure(p, x, y, undefined, Math.sin(t * 2.2) * 0.9);
    if ((t + b.id) % 4.2 < 0.16) catFigure(p, x, y, true);
  },
  space(p, b, t) {
    const [x, y] = p.iso(1.7, 1.3, 8);
    if (!b.launching) drawRocket(p.g, x, y, 1, 0);
    const [lx, ly] = p.iso(2.15, 0.85, 124);
    if (Math.sin(t * 4) > 0) { p.circle(lx, ly - 3, 2, '#ff3030'); p.g.globalAlpha = 0.35; p.circle(lx, ly - 3, 5, '#ff3030'); p.g.globalAlpha = 1; }
  },
  statue(p, b, t) {
    const [x, y] = p.iso(1, 1, 42), g = p.g;
    for (let i = 0; i < 4; i++) {
      const ph = (t * 0.6 + i * 0.25) % 1, a = i * 1.7 + t * 0.3;
      const sx = x + Math.cos(a) * 16, sy = y - 30 + Math.sin(a * 1.3) * 18, s = Math.sin(ph * Math.PI) * 3.5;
      g.fillStyle = '#fffbe0'; g.beginPath(); g.moveTo(sx, sy - s); g.lineTo(sx + s * 0.3, sy - s * 0.3); g.lineTo(sx + s, sy); g.lineTo(sx + s * 0.3, sy + s * 0.3); g.lineTo(sx, sy + s); g.lineTo(sx - s * 0.3, sy + s * 0.3); g.lineTo(sx - s, sy); g.lineTo(sx - s * 0.3, sy - s * 0.3); g.fill();
    }
  },
  castle(p, b, t) {
    const tips = [[0.45, 0.45, 92], [1.5, 1.5, 130], [2.55, 0.45, 92], [0.45, 2.55, 92], [2.55, 2.55, 96]];
    const cols = ['#ff5d8f', '#ffd23f', '#5ce1e6', '#8fe36b', '#ff5d8f'], g = p.g;
    tips.forEach(([u, v, z], i) => {
      const [x, y] = p.iso(u, v, z); p.line([x, y], [x, y - 10], '#888', 0.8);
      const w = Math.sin(t * 5 + i) * 1.5;
      g.fillStyle = cols[i]; g.beginPath(); g.moveTo(x, y - 10); g.quadraticCurveTo(x + 4, y - 10 + w, x + 8, y - 8 + w); g.lineTo(x, y - 5); g.fill();
    });
  },
  skytower(p, b, t, night) {
    const [x, y] = p.iso(1, 1, 312), g = p.g;
    if (Math.sin(t * 3) > 0.2) { p.circle(x, y, 2.2, '#ff3030'); g.globalAlpha = 0.3; p.circle(x, y, 6, '#ff3030'); g.globalAlpha = 1; }
    if (night > 0.25) {
      const [bx, by] = p.iso(1, 1, 258), a = t * 0.7;
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.22 * night;
      const ex = bx + Math.cos(a) * 260, ey = by - 220 + Math.sin(a) * 40;
      const gr = g.createLinearGradient(bx, by, ex, ey); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(1, 'rgba(255,246,192,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(bx, by); g.lineTo(ex - 30, ey - 12); g.lineTo(ex + 30, ey + 12); g.fill(); g.restore();
    }
  },
  fusion(p, b, t) {
    const [x, y] = p.iso(1, 1, 30), g = p.g;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + Math.sin(t * 3) * 0.2;
    g.beginPath(); g.ellipse(x, y, 50, 18, 0, 0, Math.PI * 2); g.strokeStyle = '#7fffff'; g.lineWidth = 5; g.stroke();
    const a = t * 2; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + Math.cos(a) * 50, y + Math.sin(a) * 18, 3, 0, 7); g.fill();
    g.restore();
  },
  observatory(p, b, t, night) {
    if (night < 0.3) return;
    const [x, y] = p.iso(1, 1, 30), g = p.g;
    for (let i = 0; i < 5; i++) { const tw = Math.sin(t * 2 + i * 1.3); if (tw < 0) continue; g.globalAlpha = tw * night; p.circle(x + 20 + i * 9, y - 50 - (i % 2) * 14 - i * 6, 1.3, '#fffbe0'); }
    g.globalAlpha = 1;
  },
};

// ---------------------------------------------------------------------
//  Ground tiles (grass, water, roads, zones...)
// ---------------------------------------------------------------------
const TILES = new Map();
function tileCanvas(key, fn) {
  let cv = TILES.get(key);
  if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = TW * SC; cv.height = TH * SC;
  const g = cv.getContext('2d'); g.setTransform(SC, 0, 0, SC, (TW / 2) * SC, 0);
  fn(new Painter(g, 1), g, mulberry32(hashStr(key)));
  TILES.set(key, cv);
  return cv;
}
const DIAMOND = (grow = 0.6) => [[0, -grow], [TW / 2 + grow * 2, TH / 2], [0, TH + grow], [-TW / 2 - grow * 2, TH / 2]];
const GRASS = ['#8cd068', '#93d46e', '#88cb64', '#90cf6a'];
function grassTile(v) {
  return tileCanvas('grass' + v, (p, g, rr) => {
    p.poly(DIAMOND(), GRASS[v]);
    for (let i = 0; i < 7; i++) { const u = 0.1 + rr() * 0.8, w = 0.1 + rr() * 0.8, [x, y] = p.iso(u, w, 0); g.strokeStyle = 'rgba(60,130,40,0.35)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1, y - 2.5); g.moveTo(x + 1, y); g.lineTo(x + 1.5, y - 2); g.stroke(); }
    if (v === 3) for (let i = 0; i < 3; i++) { const [x, y] = p.iso(0.15 + rr() * 0.7, 0.15 + rr() * 0.7, 0); p.circle(x, y, 0.9, PAL.flowers[i * 2]); }
  });
}
function plainTile(key, col, detail) {
  return tileCanvas(key, (p, g, rr) => { p.poly(DIAMOND(), col); if (detail) detail(p, g, rr); });
}
function sandTile() { return plainTile('sand', '#f1dc9a', (p, g, rr) => { for (let i = 0; i < 8; i++) { const [x, y] = p.iso(rr(), rr(), 0); p.circle(x, y, 0.5, '#d8bf7c'); } }); }
function waterTile(f) {
  return tileCanvas('water' + f, (p, g, rr) => {
    p.poly(DIAMOND(), '#4aa8e0');
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 0.9;
    for (let i = 0; i < 3; i++) {
      const u = (rr() + f * 0.08) % 1, v = rr(); const [x, y] = p.iso(0.15 + u * 0.7, 0.15 + v * 0.7, 0);
      const s = 3 + Math.sin(f * 1.57 + i) * 1.5; g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x, y - 1.5, x + s, y); g.stroke();
    }
  });
}
function lotTile(kind) {
  const cols = { pave: '#d9d4cc', dirt: '#cdb88f', grass: '#93d46e', lotR: '#a3dc7f' };
  return plainTile('lot_' + kind, cols[kind] || '#93d46e', (p, g) => {
    if (kind === 'pave') { g.strokeStyle = 'rgba(0,0,0,0.06)'; g.lineWidth = 0.5; for (let k = 1; k < 4; k++) { p.line(p.iso(k / 4, 0, 0), p.iso(k / 4, 1, 0), 'rgba(0,0,0,0.06)', 0.5); p.line(p.iso(0, k / 4, 0), p.iso(1, k / 4, 0), 'rgba(0,0,0,0.06)', 0.5); } }
    if (kind === 'lotR') p.poly(p.qT(0.04, 0.04, 0.96, 0.96, 0), null, 'rgba(60,120,40,0.25)', 0.8);
  });
}
function zoneTile(z) {
  return tileCanvas('zone' + z, (p, g) => {
    p.poly(DIAMOND(), GRASS[0]);
    const col = ZONES[z].color;
    p.poly(p.qT(0.06, 0.06, 0.94, 0.94, 0), alpha(col, 0.32));
    g.setLineDash([3, 2]); p.poly(p.qT(0.1, 0.1, 0.9, 0.9, 0), null, alpha(col, 0.95), 1.1); g.setLineDash([]);
  });
}
function roadTile(mask, bridge) {
  return tileCanvas(`road${mask}_${bridge ? 1 : 0}`, (p, g) => {
    p.poly(DIAMOND(), bridge ? '#4aa8e0' : GRASS[0]);
    const shapes = (w) => {
      const r = [[0.5 - w, 0.5 - w, 0.5 + w, 0.5 + w]];
      if (mask & 1) r.push([0.5 - w, -0.03, 0.5 + w, 0.5]);
      if (mask & 2) r.push([0.5, 0.5 - w, 1.03, 0.5 + w]);
      if (mask & 4) r.push([0.5 - w, 0.5, 0.5 + w, 1.03]);
      if (mask & 8) r.push([-0.03, 0.5 - w, 0.5, 0.5 + w]);
      return r;
    };
    if (bridge) {
      for (const s of shapes(0.37)) p.poly(p.qT(s[0], s[1], s[2], s[3], 0), '#b0896a');
      for (const s of shapes(0.37)) p.poly(p.qT(s[0], s[1], s[2], s[3], 0), null, 'rgba(255,255,255,0.8)', 1);
    } else for (const s of shapes(0.41)) p.poly(p.qT(s[0], s[1], s[2], s[3], 0), '#d7d2c8');
    for (const s of shapes(0.29)) p.poly(p.qT(s[0], s[1], s[2], s[3], 0), '#5d6370');
    const conns = [1, 2, 4, 8].filter((b) => mask & b), ends = { 1: [0.5, 0], 2: [1, 0.5], 4: [0.5, 1], 8: [0, 0.5] };
    g.setLineDash([2.5, 2.5]); g.lineWidth = 0.9; g.strokeStyle = 'rgba(255,235,140,0.95)';
    if (conns.length <= 2) {
      for (const b of conns) { const [u, v] = ends[b]; g.beginPath(); g.moveTo(...p.iso(0.5, 0.5, 0)); g.lineTo(...p.iso(u, v, 0)); g.stroke(); }
    } else {
      g.setLineDash([]); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.2;
      for (const b of conns) { const [u, v] = ends[b], du = (u - 0.5) * 0.62 + 0.5, dv = (v - 0.5) * 0.62 + 0.5;
        for (let k = -2; k <= 2; k++) { const o = k * 0.1; const a = b & 5 ? [du + o, dv] : [du, dv + o]; const c = b & 5 ? [du + o, dv + (b === 1 ? -0.1 : 0.1)] : [du + (b === 8 ? -0.1 : 0.1), dv + o]; g.beginPath(); g.moveTo(...p.iso(a[0], a[1], 0)); g.lineTo(...p.iso(c[0], c[1], 0)); g.stroke(); } }
    }
    g.setLineDash([]);
  });
}

// glow sprite for streetlights/headlights
const GLOW = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,220,140,0.9)'); gr.addColorStop(0.35, 'rgba(255,200,110,0.35)'); gr.addColorStop(1, 'rgba(255,190,100,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return cv;
})();

// Moe & Jason portraits for the advisor bubble (drawn once into images)
function portrait(kind) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d'), p = new Painter(g);
  const bg = g.createRadialGradient(64, 50, 10, 64, 64, 70); bg.addColorStop(0, kind === 'dog' ? '#fff3d6' : '#ffe3f0'); bg.addColorStop(1, kind === 'dog' ? '#ffd27f' : '#ffb3d1');
  g.fillStyle = bg; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill();
  if (kind === 'dog') {
    const F = PERSONAL.dogColors;
    g.lineWidth = 2.5; g.strokeStyle = F.outline;
    g.fillStyle = F.ears; g.beginPath(); g.ellipse(30, 60, 14, 28, 0.35, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.ellipse(98, 60, 14, 28, -0.35, 0, 7); g.fill(); g.stroke();
    for (let i = 0; i < 14; i++) { const a = Math.PI * 0.15 + (i / 13) * Math.PI * 0.7; p.circle(64 + Math.cos(a) * 34, 74 + Math.sin(a) * 34, 7, F.fur); }
    g.beginPath(); g.ellipse(64, 66, 36, 38, 0, 0, 7); g.fillStyle = F.fur; g.fill(); g.stroke();
    const sh = g.createRadialGradient(56, 50, 8, 64, 66, 40); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(200,185,160,0.35)');
    g.fillStyle = sh; g.beginPath(); g.ellipse(64, 66, 36, 38, 0, 0, 7); g.fill();
    p.ellipse(64, 86, 22, 17, F.muzzle, F.outline);
    p.ellipse(50, 58, 6, 7, '#2b1d14'); p.ellipse(78, 58, 6, 7, '#2b1d14'); p.circle(52, 55, 2, '#fff'); p.circle(80, 55, 2, '#fff');
    p.ellipse(64, 78, 9, 6.5, F.nose); p.circle(61, 76, 2, 'rgba(255,255,255,0.5)');
    g.strokeStyle = '#2b1d14'; g.lineWidth = 2.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(64, 84); g.lineTo(64, 90); g.quadraticCurveTo(56, 96, 50, 91); g.moveTo(64, 90); g.quadraticCurveTo(72, 96, 78, 91); g.stroke();
    g.fillStyle = '#ff7a9a'; g.beginPath(); g.ellipse(64, 99, 6, 7, 0, 0, Math.PI); g.fill();
    g.fillStyle = F.collar; g.fillRect(38, 104, 52, 7); p.circle(64, 115, 5.5, '#f5c518');
  } else {
    const F = PERSONAL.catColors;
    p.poly([[30, 55], [34, 14], [58, 38]], F.fur); p.poly([[98, 55], [94, 14], [70, 38]], F.fur);
    p.poly([[36, 48], [37, 24], [52, 38]], '#ffb3c6'); p.poly([[92, 48], [91, 24], [76, 38]], '#ffb3c6');
    p.ellipse(64, 70, 40, 36, F.fur);
    g.strokeStyle = F.stripes; g.lineWidth = 5; g.lineCap = 'round';
    [[56, 36, 58, 50], [64, 34, 64, 50], [72, 36, 70, 50]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
    p.ellipse(64, 86, 18, 13, '#fff2e0');
    p.ellipse(48, 66, 8, 9, F.eyes); p.ellipse(80, 66, 8, 9, F.eyes); p.ellipse(48, 66, 2.5, 8, '#111'); p.ellipse(80, 66, 2.5, 8, '#111');
    g.strokeStyle = shade(F.fur, -0.3); g.lineWidth = 3; g.beginPath(); g.moveTo(40, 58); g.lineTo(56, 60); g.moveTo(88, 58); g.lineTo(72, 60); g.stroke();
    p.poly([[59, 78], [69, 78], [64, 84]], '#ff8fa8');
    g.strokeStyle = 'rgba(80,60,40,0.7)'; g.lineWidth = 1.5;
    [[54, 82, 22, 76], [54, 86, 22, 90], [74, 82, 106, 76], [74, 86, 106, 90]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
  }
  return cv.toDataURL();
}
