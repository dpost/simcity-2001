'use strict';
// =====================================================================
//  More buildings (v2): ponds, pools, fields, library, clinic, market,
//  movie theater, ferris wheel, museum, stadium...
// =====================================================================
Object.assign(ART, {
  pond(p, rr) {
    const [x, y] = p.iso(0.5, 0.5, 0);
    p.ellipse(x, y, 25, 12, '#e8d5a6'); p.ellipse(x, y, 22, 10, '#4fb0e6'); p.ellipse(x - 5, y - 2, 12, 4.5, '#7fcbf0');
    [[-12, 3], [9, -3], [14, 4]].forEach(([a, b]) => p.ellipse(x + a, y + b, 3, 1.5, '#5cb85c'));
    [[-4, 1, '#ffffff'], [6, 2, '#a0662c']].forEach(([a, b, c]) => { p.ellipse(x + a, y + b, 3, 1.8, c); p.circle(x + a + 2.5, y + b - 2, 1.5, c === '#ffffff' ? '#ffffff' : '#2f7d3a'); p.circle(x + a + 3.8, y + b - 2, 0.6, '#ff9900'); });
    for (let i = 0; i < 5; i++) { const [rx, ry] = p.iso(0.12 + i * 0.03, 0.75 + (i % 2) * 0.05, 0); p.line([rx, ry], [rx + (i - 2) * 0.6, ry - 9], '#4f8a3a', 1); p.ellipse(rx + (i - 2) * 0.6, ry - 9, 0.9, 2.2, '#8a5a3c'); }
    p.bush(0.85, 0.2, 0.6); p.flowers(0.6, 0.8, 0.95, 0.95, 5, rr);
  },
  basketball(p) {
    p.flat(0.08, 0.08, 0.92, 0.92, 0.2, '#d9784a', '#ffffff');
    p.line(p.iso(0.5, 0.08, 0.3), p.iso(0.5, 0.92, 0.3), '#ffffff', 0.8);
    const [cx, cy] = p.iso(0.5, 0.5, 0.3); p.g.beginPath(); p.g.ellipse(cx, cy, 6, 3, 0, 0, 7); p.g.strokeStyle = '#fff'; p.g.lineWidth = 0.8; p.g.stroke();
    [[0.15, 0.5], [0.85, 0.5]].forEach(([u, v]) => {
      const b = p.iso(u, v, 0), t = p.iso(u, v, 20); p.line(b, t, '#666', 1.5);
      p.board(t[0], t[1] - 3, 9, 6, '#ffffff', null, null, 0, { border: '#444' });
      p.g.beginPath(); p.g.ellipse(t[0] + (u < 0.5 ? 3 : -3), t[1] + 1, 2.5, 1, 0, 0, 7); p.g.strokeStyle = '#ff5a1f'; p.g.lineWidth = 1; p.g.stroke();
    });
    const [px, py] = p.iso(0.4, 0.6, 0); p.person(px, py, 0.8, '#3fa9f5'); p.circle(px + 2, py - 9, 1.4, '#ff7a1f');
    const [qx, qy] = p.iso(0.62, 0.4, 0); p.person(qx, qy, 0.8, '#ff6fa5');
  },
  icerink(p) {
    p.box(0.06, 0.06, 0.94, 0.94, 0, 2.5, '#ffffff', { top: '#ffffff' });
    p.flat(0.1, 0.1, 0.9, 0.9, 2.6, '#dff4ff');
    const g = p.g, [cx, cy] = p.iso(0.5, 0.5, 2.6);
    g.strokeStyle = 'rgba(120,180,220,0.6)'; g.lineWidth = 0.6;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(cx, cy, 8 + i * 5, 4 + i * 2.5, 0, 0, 7); g.stroke(); }
    [[0.3, 0.4, '#ff6fa5'], [0.65, 0.35, '#ffd23f'], [0.55, 0.7, '#3fa9f5']].forEach(([u, v, c]) => { const [x, y] = p.iso(u, v, 2.6); p.person(x, y, 0.8, c); });
    const [tx, ty] = p.iso(0.95, 0.05, 0); p.tree(0.95, 0.05, 1, 0.6); void tx; void ty;
  },
  field(p) {
    for (let k = 0; k < 6; k++) { const u0 = 0.15 + k * 0.283; p.flat(u0, 0.15, u0 + 0.283, 1.85, 0.1, k % 2 ? '#6cc04a' : '#7cd05a'); }
    p.poly(p.qT(0.15, 0.15, 1.85, 1.85, 0.2), null, '#ffffff', 1.2);
    p.line(p.iso(1, 0.15, 0.2), p.iso(1, 1.85, 0.2), '#ffffff', 1.2);
    const [cx, cy] = p.iso(1, 1, 0.2); p.g.beginPath(); p.g.ellipse(cx, cy, 16, 8, 0, 0, 7); p.g.strokeStyle = '#fff'; p.g.lineWidth = 1.2; p.g.stroke();
    [0.15, 1.85].forEach((u) => { const a = p.iso(u, 0.8, 0), b = p.iso(u, 1.2, 0), a2 = p.iso(u, 0.8, 9), b2 = p.iso(u, 1.2, 9); p.line(a, a2, '#fff', 1.5); p.line(b, b2, '#fff', 1.5); p.line(a2, b2, '#fff', 1.5); });
    [[0.6, 0.7, '#e8283c'], [0.8, 1.3, '#e8283c'], [1.3, 0.9, '#3f6fd8'], [1.5, 1.4, '#3f6fd8']].forEach(([u, v, c]) => { const [x, y] = p.iso(u, v, 0); p.person(x, y, 0.85, c); });
    const [bx, by] = p.iso(1.1, 1.0, 0); p.circle(bx, by - 1.5, 1.6, '#ffffff', '#333', 0.5);
    p.box(0.25, 1.88, 1.75, 1.98, 0, 6, '#9aa3ad');
  },
  pool(p) {
    p.box(0.25, 0.3, 1.75, 1.45, 0, 2, '#e8f0f5', { top: '#f4f8fb' });
    p.flat(0.32, 0.38, 1.68, 1.37, 2.1, '#3fb6ef');
    const g = p.g; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.8;
    for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(...p.iso(0.32, 0.38 + k * 0.25, 2.1)); g.lineTo(...p.iso(1.68, 0.38 + k * 0.25, 2.1)); g.stroke(); }
    for (let i = 0; i < 6; i++) { const [x, y] = p.iso(0.45 + i * 0.2, 0.5 + (i % 3) * 0.28, 2.1); g.beginPath(); g.ellipse(x, y, 3.5, 1.2, 0, 0, 7); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.stroke(); }
    [[0.7, 0.7, '#f1c7a3'], [1.2, 1.0, '#c68642']].forEach(([u, v, c]) => { const [x, y] = p.iso(u, v, 2.1); p.circle(x, y - 1.5, 1.6, c); });
    p.box(1.55, 0.6, 1.9, 0.68, 4, 5, '#ffffff'); p.line(p.iso(1.85, 0.64, 0), p.iso(1.85, 0.64, 4), '#999', 1);
    [[0.3, 1.7, '#ff6fa5'], [0.9, 1.75, '#ffd23f'], [1.5, 1.7, '#5ce1e6']].forEach(([u, v, c]) => {
      const [x, y] = p.iso(u, v, 0); p.line([x, y], [x, y - 12], '#888', 0.8); p.ellipse(x, y - 13, 8, 3.2, c);
      p.box(u + 0.08, v - 0.06, u + 0.3, v + 0.04, 0, 2, '#ffffff');
    });
  },
  busstop(p) {
    p.box(0.2, 0.25, 0.75, 0.45, 0, 1, '#bbbbbb');
    const g = p.g;
    p.poly(p.qR(0.25, 0.45, 0.75, 0, 14), 'rgba(170,220,255,0.55)', '#7d8590');
    p.poly(p.qL(0.2, 0.75, 0.25, 0, 14), 'rgba(170,220,255,0.45)', '#7d8590');
    p.box(0.16, 0.2, 0.8, 0.5, 14, 15.5, '#3f6fd8');
    p.box(0.3, 0.3, 0.65, 0.38, 3, 4.5, '#a0663c');
    const [sx, sy] = p.iso(0.85, 0.75, 0); p.line([sx, sy], [sx, sy - 20], '#666', 1.2);
    p.board(sx, sy - 23, 12, 7, '#3f6fd8', 'BUS', '#ffffff', 4.5);
    const [px, py] = p.iso(0.5, 0.65, 0); p.person(px, py, 0.8, '#b48cff');
    void g;
  },
  library(p) {
    p.box(0.12, 0.2, 0.88, 0.8, 0, 3, '#e3dccd');
    p.box(0.15, 0.25, 0.85, 0.72, 3, 24, '#efe6d2');
    for (let i = 0; i < 5; i++) { const u = 0.2 + i * 0.15; p.box(u, 0.74, u + 0.05, 0.79, 3, 22, '#ffffff', { outline: false }); }
    p.winsR(0.3, 0.68, 0.85, 7, 20, 2, 1, { fh: 0.7 });
    p.poly(p.qL(0.4, 0.6, 0.72, 3, 15), '#7a5236');
    p.poly([p.iso(0.13, 0.8, 24), p.iso(0.87, 0.8, 24), p.iso(0.5, 0.8, 33)], '#f6efe0', 'rgba(0,0,0,0.25)');
    p.box(0.15, 0.25, 0.85, 0.72, 24, 26, '#d8cdb5');
    p.textL('LIBRARY', 0.5, 0.8, 26.5, 3.6, '#7a5236');
  },
  clinic(p) {
    p.box(0.15, 0.2, 0.85, 0.8, 0, 22, '#fbfdff');
    p.winsL(0.18, 0.55, 0.8, 4, 19, 2, 2); p.winsR(0.24, 0.76, 0.85, 4, 19, 3, 2);
    p.doorL(0.7, 0.8, 0.14, 11, '#bfe6ff');
    p.box(0.42, 0.42, 0.58, 0.58, 22, 24, '#ffffff');
    const [x, y] = p.iso(0.5, 0.5, 24); p.g.fillStyle = '#e8283c'; p.g.fillRect(x - 1.5, y - 9, 3, 8); p.g.fillRect(x - 4, y - 6.5, 8, 3);
    p.glowDot(x, y - 5, 3, '#ff5060');
    p.textL('CLINIC', 0.42, 0.8, 20.5, 3.5, '#e8283c');
  },
  market(p, rr) {
    const cols = [['#e8283c', '#ffffff'], ['#3fb067', '#ffffff'], ['#ffb52e', '#ffffff']];
    [[0.15, 0.15], [0.55, 0.15], [0.15, 0.55], [0.55, 0.55]].forEach(([u, v], i) => {
      const c = cols[i % 3];
      p.box(u, v, u + 0.32, v + 0.3, 0, 5, '#a0663c');
      for (let k = 0; k < 8; k++) { const [x, y] = p.iso(u + 0.05 + rr() * 0.22, v + 0.05 + rr() * 0.2, 5); p.circle(x, y - 1, 1.6, pick(['#e8283c', '#ffb52e', '#7cd05a', '#b48cff', '#ffd23f'])); }
      [[u, v + 0.3], [u + 0.32, v + 0.3]].forEach(([a, b]) => p.line(p.iso(a, b, 0), p.iso(a, b, 12), '#777', 0.8));
      awningL(p, u - 0.02, u + 0.34, v + 0.32, 13, 0.0001, 3, c[0], c[1], 4);
      p.poly(p.qT(u - 0.02, v - 0.02, u + 0.34, v + 0.32, 13), alpha(c[0], 0.85), 'rgba(0,0,0,0.2)');
    });
    const [px, py] = p.iso(0.5, 0.95, 0); p.person(px, py, 0.8, '#5ce1e6');
  },
  cinema(p) {
    p.box(0.12, 0.15, 0.88, 0.85, 0, 30, '#7a3a5a');
    p.winsR(0.2, 0.8, 0.88, 6, 26, 3, 2, { col: '#ffd9a8' });
    p.poly(p.qL(0.3, 0.7, 0.85, 0, 10), '#ffd9a8', 'rgba(0,0,0,0.3)'); p.light(p.qL(0.3, 0.7, 0.85, 0, 10));
    p.box(0.1, 0.85, 0.9, 0.97, 10, 15, '#2b1d3a');
    p.textL('MOVIES', 0.5, 0.97, 12.5, 4.2, '#ffe14d'); p.glowPoly(p.qL(0.1, 0.9, 0.97, 10, 15), '#ffd23f');
    for (let i = 0; i < 10; i++) { const [x, y] = p.iso(0.12 + i * 0.085, 0.97, 15.8); p.circle(x, y, 0.8, '#fff6b0'); p.glowDot(x, y, 0.9, '#fff6b0'); }
    [[0.18, '#ff6fa5'], [0.75, '#5ce1e6']].forEach(([u, c]) => { const q = p.qL(u, u + 0.08, 0.85, 14, 26); p.poly(q, c, '#222'); });
    p.box(0.12, 0.15, 0.88, 0.85, 30, 32, '#5a2a42');
  },
  ferris(p) {
    p.flat(0.2, 0.2, 1.8, 1.8, 0.2, '#e8dcc4');
    p.box(0.6, 0.75, 1.4, 1.35, 0, 8, '#ff8fb8');
    const [hx, hy] = p.iso(1, 1, 62), [a1, b1] = p.iso(0.75, 1.05, 0), [a2, b2] = p.iso(1.25, 0.95, 0);
    p.line([a1, b1], [hx, hy], '#d0d6de', 3); p.line([a2, b2], [hx, hy], '#b0b6be', 3);
    p.line([a1 - 10, b1 + 4], [hx - 2, hy], '#d0d6de', 2); p.line([a2 + 10, b2 - 4], [hx + 2, hy], '#b0b6be', 2);
    p.box(1.45, 1.4, 1.8, 1.75, 0, 9, '#ffffff'); p.board(...p.iso(1.62, 1.75, 13), 20, 6, '#ff6fa5', 'RIDES', '#fff', 4, { glow: '#ff9fcf' });
  },
  museum(p) {
    p.box(0.2, 0.2, 1.8, 1.4, 0, 4, '#e3dccd');
    p.box(0.25, 0.25, 1.75, 1.2, 4, 38, '#f2ead8');
    for (let i = 0; i < 8; i++) { const u = 0.35 + i * 0.18; p.box(u, 1.22, u + 0.06, 1.28, 4, 36, '#ffffff', { outline: false }); }
    p.poly([p.iso(0.22, 1.3, 38), p.iso(1.78, 1.3, 38), p.iso(1.0, 1.3, 52)], '#f8f2e4', 'rgba(0,0,0,0.25)');
    p.box(0.25, 0.25, 1.75, 1.3, 38, 40, '#d8cdb5', { noTop: true });
    p.winsR(0.35, 1.1, 1.75, 10, 32, 4, 2, { fh: 0.7 });
    p.dome(1.0, 0.7, 40, 18, '#9fd8d0');
    p.textL('MUSEUM', 1.0, 1.3, 43, 4.5, '#7a5236');
    for (let k = 0; k < 4; k++) p.box(0.6 + k * 0.05, 1.4 + k * 0.1, 1.4 - k * 0.05, 1.5 + k * 0.1, 0, 4 - k, '#e8e1d0');
    // a friendly T-rex out front
    const [x, y] = p.iso(1.7, 1.8, 0), g = p.g, G = '#5cb85c';
    g.fillStyle = G; g.strokeStyle = '#2f7d3a'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(x - 14, y - 10); g.quadraticCurveTo(x - 4, y - 22, x + 4, y - 20); g.lineTo(x + 6, y - 30); g.quadraticCurveTo(x + 14, y - 36, x + 18, y - 30); g.lineTo(x + 17, y - 26); g.lineTo(x + 9, y - 25); g.lineTo(x + 8, y - 14); g.quadraticCurveTo(x + 2, y - 8, x - 14, y - 10); g.fill(); g.stroke();
    g.fillRect(x - 3, y - 12, 3, 12); g.fillRect(x + 3, y - 12, 3, 12); p.circle(x + 13, y - 31, 1, '#222');
    g.strokeStyle = G; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 8, y - 21); g.lineTo(x + 12, y - 19); g.stroke();
  },
  stadium(p) {
    const [cx, cy] = p.iso(1.5, 1.5, 0), g = p.g;
    const ring = (rx, ry, h, col) => { g.beginPath(); g.moveTo(cx - rx, cy - h); g.lineTo(cx - rx, cy); g.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true); g.lineTo(cx + rx, cy - h); g.ellipse(cx, cy - h, rx, ry, 0, 0, Math.PI, false); g.closePath(); g.fillStyle = col; g.fill(); };
    g.beginPath(); g.ellipse(cx, cy - 28, 86, 43, 0, 0, 7); g.fillStyle = '#c9ced6'; g.fill();
    for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(cx, cy - 28 + k * 3, 80 - k * 9, 40 - k * 4.5, 0, 0, 7); g.fillStyle = ['#e8283c', '#3f6fd8', '#ffd23f', '#ffffff'][k]; g.fill(); }
    const dots = mulberry32(5);
    for (let i = 0; i < 160; i++) { const a = dots() * Math.PI * 2, r = 0.62 + dots() * 0.3; g.fillStyle = pick(['#ff6fa5', '#3fa9f5', '#ffd23f', '#ffffff', '#5cd65c']); g.fillRect(cx + Math.cos(a) * 80 * r, cy - 28 + Math.sin(a) * 40 * r, 1.2, 1.2); }
    g.beginPath(); g.ellipse(cx, cy - 18, 44, 22, 0, 0, 7); g.fillStyle = '#6cc04a'; g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, cy - 18, 12, 6, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(cx - 26, cy - 31); g.lineTo(cx + 26, cy - 5); g.stroke();
    ring(88, 44, 28, '#b8bec8');
    for (let k = 0; k < 12; k++) { const a = Math.PI * (k / 11); const x = cx - Math.cos(a) * 86, y = cy + Math.sin(a) * 43 - 16; p.lights.push([[x - 2, y - 3], [x + 2, y - 3], [x + 2, y + 2], [x - 2, y + 2]]); g.fillStyle = '#8fd3f4'; g.fillRect(x - 2, y - 3, 4, 5); }
    [[0.2, 0.2], [2.8, 0.2], [0.2, 2.8], [2.8, 2.8]].forEach(([u, v]) => { const [x, y] = p.iso(u, v, 0); p.line([x, y], [x, y - 70], '#9aa3ad', 2); p.board(x, y - 73, 12, 7, '#fbfbf2', null, null, 0, { border: '#7d8590' }); p.glowDot(x, y - 73, 5, '#fffbe0'); });
  },
});

Object.assign(ANIM, {
  ferris(p, b, t, night) {
    const [hx, hy] = p.iso(1, 1, 62), g = p.g, R = 46, a0 = t * 0.25;
    g.strokeStyle = '#e8eef5'; g.lineWidth = 2.2; g.beginPath(); g.arc(hx, hy, R, 0, 7); g.stroke();
    g.lineWidth = 1; g.strokeStyle = '#ffffff';
    const cols = ['#ff5d8f', '#ffd23f', '#5ce1e6', '#8fe36b', '#b48cff', '#ff8c42'];
    for (let k = 0; k < 12; k++) { const a = a0 + (k / 12) * Math.PI * 2; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(a) * R, hy + Math.sin(a) * R); g.stroke(); }
    for (let k = 0; k < 12; k++) {
      const a = a0 + (k / 12) * Math.PI * 2, x = hx + Math.cos(a) * R, y = hy + Math.sin(a) * R;
      g.fillStyle = cols[k % 6]; g.beginPath(); g.moveTo(x - 4, y + 1); g.lineTo(x + 4, y + 1); g.lineTo(x + 3, y + 7); g.lineTo(x - 3, y + 7); g.closePath(); g.fill();
      if (night > 0.3) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = night * 0.7; g.drawImage(GLOW, x - 6, y - 4, 12, 12); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    }
    p.circle(hx, hy, 4, '#ff6fa5');
  },
  cinema(p, b, t, night) {
    if (night < 0.2) return;
    const g = p.g;
    for (let i = 0; i < 10; i++) { if (Math.floor(t * 4 + i) % 2) continue; const [x, y] = p.iso(0.12 + i * 0.085, 0.97, 15.8); g.globalCompositeOperation = 'lighter'; g.globalAlpha = night; g.drawImage(GLOW, x - 4, y - 4, 8, 8); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  },
  stadium(p, b, t, night) {
    if (night < 0.25) return;
    const g = p.g; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.12 * night;
    const [cx, cy] = p.iso(1.5, 1.5, 18);
    [[0.2, 0.2], [2.8, 0.2], [0.2, 2.8], [2.8, 2.8]].forEach(([u, v]) => { const [x, y] = p.iso(u, v, 74); g.fillStyle = '#fffbe0'; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(cx - 30, cy); g.lineTo(cx + 30, cy); g.lineTo(x + 4, y); g.fill(); });
    g.restore();
  },
});

// ---------------- the big chocolate factory ----------------
ART.chocofactory = (p) => {
  const g = p.g;
  [[0.35, 0.3, 96], [0.7, 0.25, 84]].forEach(([u, v, h]) => { p.cyl(u, v, 0, h, 6.5, '#6b3e22'); for (let z = 16; z < h - 4; z += 20) p.band(u, v, z, z + 6, 6.5, '#ff8fb8'); p.emit(u, v, h + 2); });
  p.box(0.2, 0.5, 1.45, 1.75, 0, 40, '#7a4b2a');
  p.winsL(0.25, 1.4, 1.75, 6, 34, 5, 2, { col: '#ffd9a8' });
  p.winsR(0.55, 1.7, 1.45, 6, 34, 4, 2, { col: '#e6b98a' });
  p.box(0.2, 0.5, 1.45, 1.75, 40, 44, '#5a2f1a');
  // giant chocolate bar on the roof
  p.box(0.45, 0.85, 1.2, 1.3, 44, 52, '#4a2512', { top: '#6b3a1e' });
  for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) p.box(0.5 + k * 0.24, 0.9 + j * 0.2, 0.68 + k * 0.24, 1.06 + j * 0.2, 52, 54, '#5a2f1a', { top: '#7a4428' });
  p.poly([p.iso(0.7, 1.15, 54), p.iso(1.2, 1.15, 54), p.iso(1.2, 1.32, 46), p.iso(0.7, 1.32, 46)], '#e8e8f0');
  // candy pipes
  p.line(p.iso(1.45, 1.0, 30), p.iso(1.8, 1.0, 30), '#ff8fb8', 4); p.line(p.iso(1.8, 1.0, 30), p.iso(1.8, 1.0, 0), '#ff8fb8', 4);
  p.line(p.iso(1.45, 0.7, 22), p.iso(1.75, 0.55, 22), '#5ce1e6', 3);
  // chocolate pool at the bottom of the waterfall
  const [px, py] = p.iso(1.75, 1.6, 0); p.ellipse(px, py, 16, 7, '#5a2f1a', '#e8dcc4'); p.ellipse(px - 3, py - 1, 9, 3, '#7a4b2a');
  p.board(...p.iso(0.85, 1.75, 30), 44, 9, '#ff6fa5', 'CHOCOLATE', '#ffffff', 6, { glow: '#ff9fcf' });
};
ANIM.chocofactory = (p, b, t) => {
  const g = p.g, [x0, y0] = p.iso(1.45, 1.55, 36), [x1, y1] = p.iso(1.72, 1.6, 0);
  g.strokeStyle = '#6b3a1e'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + 10, y0 + 4, x1, y1 - 2); g.stroke();
  g.strokeStyle = '#a0663c'; g.lineWidth = 2; g.setLineDash([3, 5]); g.lineDashOffset = -t * 30;
  g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + 10, y0 + 4, x1, y1 - 2); g.stroke(); g.setLineDash([]);
  for (let k = 0; k < 3; k++) { const ph = (t * 1.2 + k / 3) % 1; g.globalAlpha = 1 - ph; g.strokeStyle = '#a0663c'; g.lineWidth = 1; g.beginPath(); g.ellipse(x1, y1, 4 + ph * 10, 2 + ph * 4, 0, 0, 7); g.stroke(); }
  g.globalAlpha = 1;
};
