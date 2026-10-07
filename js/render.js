'use strict';
// =====================================================================
//  Drawing the city: sky, floating island, ground, buildings, night
// =====================================================================
const Cam = { x: 0, y: N * 16, zoom: 1, tz: 1, anchor: null };
const R = { cv: null, g: null, dpr: 1, w: 0, h: 0, P: null, AP: null, buckets: [], stars: [], hasFilter: false };

function initRender() {
  R.cv = document.getElementById('view');
  R.g = R.cv.getContext('2d');
  R.P = new Painter(R.g, 1); R.AP = new Painter(R.g, 1);
  R.hasFilter = 'filter' in R.g;
  R.buckets = Array.from({ length: 2 * N }, () => []);
  for (let i = 0; i < 140; i++) R.stars.push([Math.random(), Math.random() * 0.75, Math.random() * 1.3 + 0.3, Math.random() * 6]);
  resize();
  addEventListener('resize', resize);
}
function resize() {
  R.dpr = Math.min(devicePixelRatio || 1, 2); R.w = innerWidth; R.h = innerHeight;
  R.cv.width = Math.round(R.w * R.dpr); R.cv.height = Math.round(R.h * R.dpr);
  R.cv.style.width = R.w + 'px'; R.cv.style.height = R.h + 'px';
}

const screenToWorld = (sx, sy) => [(sx - R.w / 2) / Cam.zoom + Cam.x, (sy - R.h / 2) / Cam.zoom + Cam.y];
const worldToScreen = (X, Y) => [(X - Cam.x) * Cam.zoom + R.w / 2, (Y - Cam.y) * Cam.zoom + R.h / 2];
const worldToTile = (X, Y) => [(X / 32 + Y / 16) / 2, (Y / 16 - X / 32) / 2];
function screenToTile(sx, sy) { const [u, v] = worldToTile(...screenToWorld(sx, sy)); return [Math.floor(u), Math.floor(v)]; }

function clampCamera() {
  // keep the center of the view over the island
  const [u, v] = worldToTile(Cam.x, Cam.y + 40), cu = clamp(u, -1, N + 1), cv = clamp(v, -1, N + 1);
  if (cu !== u || cv !== v) { const [X, Y] = Pw(cu, cv); Cam.x = X; Cam.y = Y - 40; }
}
function updateCamera(dt) {
  if (Math.abs(Cam.zoom - Cam.tz) > 0.0005) {
    Cam.zoom = lerp(Cam.zoom, Cam.tz, 1 - Math.pow(0.00005, dt));
    if (Cam.anchor) { const a = Cam.anchor; Cam.x = a.X - (a.sx - R.w / 2) / Cam.zoom; Cam.y = a.Y - (a.sy - R.h / 2) / Cam.zoom; }
  } else { Cam.zoom = Cam.tz; Cam.anchor = null; }
  clampCamera();
}
function zoomAt(sx, sy, factor) {
  const [X, Y] = screenToWorld(sx, sy);
  Cam.tz = clamp(Cam.tz * factor, 0.35, 2.6);
  Cam.anchor = { sx, sy, X, Y };
}
function centerOnTile(x, y) { const [X, Y] = Pw(x + 0.5, y + 0.5); Cam.x = X; Cam.y = Y; Cam.anchor = null; }

function spriteFor(b) {
  if (!BT[b.type]) return zoneSprite(b.type, b.level, b.variant);
  const t = BT[b.type], key = b.type === 'sign' ? 'sign_' + W.cityName : b.type;
  return makeSprite(key, t.size, t.h || 60, (p, rr) => ART[b.type](p, rr));
}

function groundFor(i, x, y, t) {
  const ter = W.terrain[i];
  if (W.road[i]) return roadTile(roadMask(x, y), ter === T_WATER);
  if (ter === T_WATER) return waterTile((Math.floor(t * 1.6) + x * 7 + y * 13) % 4);
  const bid = W.bld[i];
  if (bid >= 0) {
    const b = W.buildings.get(bid);
    if (BT[b.type]) return lotTile(BT[b.type].ground || 'pave');
    return lotTile(b.type === 'R' ? 'lotR' : b.type === 'C' ? 'pave' : 'dirt');
  }
  if (W.zone[i]) return zoneTile(ZKEY[W.zone[i]]);
  if (ter === T_SAND) return sandTile();
  return grassTile((x * 31 + y * 17 + ((x * y) % 7)) % 4);
}

// ---- ground cache: 16x16-tile chunks, used when zoomed out ----
const GC = { n: N / 16, cv: [], dirty: [] };
function markGround(x, y) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const a = x + dx, b = y + dy;
    if (inb(a, b)) GC.dirty[((b / 16) | 0) * GC.n + ((a / 16) | 0)] = true;
  }
}
function markAllGround() { GC.dirty = new Array(GC.n * GC.n).fill(true); }
function groundChunk(k) {
  const cx = (k % GC.n) * 16, cy = ((k / GC.n) | 0) * 16;
  let cv = GC.cv[k];
  if (!cv) { cv = GC.cv[k] = document.createElement('canvas'); cv.width = 1024; cv.height = 512; GC.dirty[k] = true; }
  const ox = (cx - cy - 15) * 32 - 32, oy = (cx + cy) * 16;
  if (GC.dirty[k]) {
    const g = cv.getContext('2d'); g.clearRect(0, 0, 1024, 512);
    for (let y = cy; y < cy + 16; y++) for (let x = cx; x < cx + 16; x++) g.drawImage(groundFor(idx(x, y), x, y, 0), (x - y) * 32 - 32 - ox, (x + y) * 16 - oy, 64, 32);
    GC.dirty[k] = false;
  }
  return [cv, ox, oy];
}

// emoji icons for "needs power / needs road" bubbles
const ICONS = new Map();
function iconCanvas(ch) {
  let cv = ICONS.get(ch); if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = cv.height = 48;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(24, 22, 19, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,80,80,0.95)'; g.lineWidth = 3; g.stroke();
  g.beginPath(); g.moveTo(18, 38); g.lineTo(24, 46); g.lineTo(30, 38); g.fillStyle = 'rgba(255,255,255,0.95)'; g.fill();
  g.font = '22px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 24, 23);
  ICONS.set(ch, cv); return cv;
}

function bounceScale(b) {
  const age = (performance.now() - b.born) / 1000;
  if (age > 0.7 || age < 0) return null;
  const e = age / 0.7;
  const sy = 1 - Math.pow(1 - e, 3) * Math.cos(e * Math.PI * 3) * 0.75;
  return [1 + (1 - sy) * 0.35, sy];
}

function drawStrip(b, k, night, t) {
  const g = R.g, spr = spriteFor(b), [X0, Y0] = Pw(b.x, b.y), left = X0 - spr.w / 2, top = Y0 - spr.height;
  const bs = bounceScale(b);
  if (bs) { g.save(); const ay = Y0 + b.size * 32; g.translate(X0, ay); g.scale(bs[0], bs[1]); g.translate(-X0, -ay); }
  const ghost = Input.ghostOf === b;
  if (ghost) g.globalAlpha = 0.5;
  const dayImg = night < 0.97, nightImg = night > 0.01;
  if (k < 0) {
    if (dayImg) g.drawImage(spr.cv, left, top, spr.w, spr.h);
    if (nightImg) { g.globalAlpha = (dayImg ? night : 1) * (ghost ? 0.5 : 1); g.drawImage(spr.nv, left, top, spr.w, spr.h); g.globalAlpha = 1; }
  } else {
    const sx = k * 32;
    if (dayImg) g.drawImage(spr.cv, sx * SC, 0, 32 * SC, spr.h * SC, left + sx, top, 32.5, spr.h);
    if (nightImg) { g.globalAlpha = dayImg ? night : 1; g.drawImage(spr.nv, sx * SC, 0, 32 * SC, spr.h * SC, left + sx, top, 32.5, spr.h); g.globalAlpha = 1; }
  }
  if (bs) g.restore();
  g.globalAlpha = 1;
  if ((k === -1 || k === b.size) && ANIM[b.type]) {
    g.save(); g.translate(X0, Y0);
    if (night > 0.1 && R.hasFilter) g.filter = `brightness(${1 - night * 0.5})`;
    ANIM[b.type](R.AP, b, t, night);
    g.restore();
  }
}

function drawSky(g, night, dusk, t) {
  const top = mix(mix('#7ec8f5', '#ff9a8b', dusk * (1 - night)), '#0b1238', night);
  const bot = mix(mix('#d6f0ff', '#ffd59e', dusk), '#2a3470', night);
  if (!R.sky) { R.sky = document.createElement('canvas'); R.sky.width = 1; R.sky.height = 128; }
  const key = top + bot;
  if (R.skyKey !== key) {
    R.skyKey = key; const sg = R.sky.getContext('2d'), gr = sg.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, top); gr.addColorStop(1, bot); sg.fillStyle = gr; sg.fillRect(0, 0, 1, 128);
  }
  g.imageSmoothingEnabled = true; g.drawImage(R.sky, 0, 0, R.w, R.h);
  if (night > 0.15) {
    g.fillStyle = '#ffffff';
    for (const [x, y, r, ph] of R.stars) { g.globalAlpha = night * (0.5 + Math.sin(t * 1.5 + ph) * 0.4); g.beginPath(); g.arc(x * R.w, y * R.h, r, 0, 7); g.fill(); }
    g.globalAlpha = night; const mx = R.w * 0.84, my = R.h * 0.16;
    const mg = g.createRadialGradient(mx, my, 10, mx, my, 70); mg.addColorStop(0, 'rgba(255,250,220,0.35)'); mg.addColorStop(1, 'rgba(255,250,220,0)');
    g.fillStyle = mg; g.fillRect(mx - 70, my - 70, 140, 140);
    g.fillStyle = '#fffbe6'; g.beginPath(); g.arc(mx, my, 18, 0, 7); g.fill();
    g.fillStyle = mix('#0b1238', '#2a3470', 0.2); g.beginPath(); g.arc(mx + 8, my - 5, 15, 0, 7); g.fill();
    g.globalAlpha = 1;
  } else {
    const sx = R.w * 0.14, sy = R.h * (0.12 + dusk * 0.2);
    const sg = g.createRadialGradient(sx, sy, 5, sx, sy, 90); sg.addColorStop(0, 'rgba(255,250,210,0.9)'); sg.addColorStop(0.25, 'rgba(255,240,170,0.35)'); sg.addColorStop(1, 'rgba(255,240,170,0)');
    g.fillStyle = sg; g.fillRect(sx - 90, sy - 90, 180, 180);
  }
}

function drawIsland(g, night) {
  const L = Pw(0, N), B = Pw(N, N), Rr = Pw(N, 0), T = Pw(0, 0), Dp = 70;
  const dk = (c) => mix(c, '#121838', night * 0.6);
  g.fillStyle = 'rgba(0,0,30,0.12)'; g.beginPath(); g.ellipse(B[0], B[1] + Dp + 60, N * 26, 40, 0, 0, 7); g.fill();
  const lf = g.createLinearGradient(0, L[1], 0, B[1] + Dp); lf.addColorStop(0, dk('#a8744a')); lf.addColorStop(1, dk('#6b4428'));
  g.fillStyle = lf; g.beginPath(); g.moveTo(L[0], L[1]); g.lineTo(B[0], B[1]); g.lineTo(B[0], B[1] + Dp); g.lineTo(L[0], L[1] + Dp * 0.6); g.closePath(); g.fill();
  const rf = g.createLinearGradient(0, Rr[1], 0, B[1] + Dp); rf.addColorStop(0, dk('#8f603a')); rf.addColorStop(1, dk('#563620'));
  g.fillStyle = rf; g.beginPath(); g.moveTo(B[0], B[1]); g.lineTo(Rr[0], Rr[1]); g.lineTo(Rr[0], Rr[1] + Dp * 0.6); g.lineTo(B[0], B[1] + Dp); g.closePath(); g.fill();
  g.strokeStyle = dk('#c99a6a'); g.lineWidth = 1.5; g.globalAlpha = 0.5;
  for (const f of [0.35, 0.65]) { g.beginPath(); g.moveTo(L[0], L[1] + Dp * 0.6 * f); g.lineTo(B[0], B[1] + Dp * f); g.lineTo(Rr[0], Rr[1] + Dp * 0.6 * f); g.stroke(); }
  g.globalAlpha = 1;
  g.fillStyle = dk('#6cbf4f'); g.beginPath(); g.moveTo(L[0], L[1]); g.lineTo(B[0], B[1]); g.lineTo(Rr[0], Rr[1]); g.lineTo(Rr[0], Rr[1] + 5); g.lineTo(B[0], B[1] + 6); g.lineTo(L[0], L[1] + 5); g.closePath(); g.fill();
  g.fillStyle = GRASS[0]; g.beginPath(); g.moveTo(T[0], T[1]); g.lineTo(Rr[0], Rr[1]); g.lineTo(B[0], B[1]); g.lineTo(L[0], L[1]); g.closePath(); g.fill();
}

function diamondPath(g, x, y, s = 1) {
  const [ax, ay] = Pw(x, y), [bx, by] = Pw(x + s, y), [cx, cy] = Pw(x + s, y + s), [dx, dy] = Pw(x, y + s);
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(cx, cy); g.lineTo(dx, dy); g.closePath();
}

function overlayColor(mode, i) {
  if (W.terrain[i] === T_WATER && !W.road[i]) return null;
  if (mode === 'power') {
    if (!(W.road[i] || W.zone[i] || W.bld[i] >= 0)) return null;
    return D.powered[i] ? 'rgba(255,225,0,0.5)' : 'rgba(255,50,50,0.5)';
  }
  if (mode === 'happy') {
    const v = D.lv[i] / 100;
    return v < 0.5 ? `rgba(255,${Math.round(80 + v * 2 * 170)},60,0.45)` : `rgba(${Math.round(255 - (v - 0.5) * 2 * 200)},230,70,0.45)`;
  }
  if (mode === 'poll') { const v = D.poll[i]; return v < 3 ? null : `rgba(120,70,40,${clamp(v / 70, 0.1, 0.7)})`; }
  if (mode === 'safety') { const v = D.cov.police[i] + D.cov.fire[i] + D.cov.school[i] + D.cov.health[i]; return v < 0.05 ? 'rgba(0,0,0,0.12)' : `rgba(60,140,255,${clamp(v / 3, 0.15, 0.6)})`; }
  return null;
}

function render(t, dt) {
  const g = R.g, night = nightFactor(), dusk = duskFactor(), z = Cam.zoom;
  g.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  drawSky(g, night, dusk, t);
  if (!W.terrain) return;

  let shx = 0, shy = 0;
  if (Game.shake > 0) { shx = rnd(-1, 1) * Game.shake * 2; shy = rnd(-1, 1) * Game.shake * 2; Game.shake = Math.max(0, Game.shake - dt * 0.6); }
  g.setTransform(R.dpr * z, 0, 0, R.dpr * z, R.dpr * (R.w / 2 - Cam.x * z + shx), R.dpr * (R.h / 2 - Cam.y * z + shy));

  const vx0 = Cam.x - R.w / 2 / z - 40, vx1 = Cam.x + R.w / 2 / z + 40;
  const vy0 = Cam.y - R.h / 2 / z - 40, vy1 = Cam.y + R.h / 2 / z + 40;
  const corners = [[vx0, vy0], [vx1, vy0], [vx0, vy1 + 360], [vx1, vy1 + 360]].map(([X, Y]) => worldToTile(X, Y));
  const u0 = clamp(Math.floor(Math.min(...corners.map((c) => c[0]))) - 1, 0, N - 1), u1 = clamp(Math.ceil(Math.max(...corners.map((c) => c[0]))) + 1, 0, N - 1);
  const v0 = clamp(Math.floor(Math.min(...corners.map((c) => c[1]))) - 1, 0, N - 1), v1 = clamp(Math.ceil(Math.max(...corners.map((c) => c[1]))) + 1, 0, N - 1);

  drawIsland(g, night);

  // ---- ground ----
  const lamps = [], cached = z * R.dpr <= 1.05;
  if (cached) {
    for (let k = 0; k < GC.n * GC.n; k++) {
      const cx = (k % GC.n) * 16, cy = ((k / GC.n) | 0) * 16;
      const ox = (cx - cy - 15) * 32 - 32, oy = (cx + cy) * 16;
      if (ox > vx1 || ox + 1024 < vx0 || oy > vy1 || oy + 512 < vy0) continue;
      const [cv] = groundChunk(k);
      g.drawImage(cv, ox, oy, 1024, 512);
    }
  }
  for (let y = v0; y <= v1; y++) for (let x = u0; x <= u1; x++) {
    const X = (x - y) * 32, Y = (x + y) * 16;
    if (X < vx0 - 32 || X > vx1 + 32 || Y < vy0 - 32 || Y > vy1) continue;
    const i = idx(x, y);
    if (!cached) g.drawImage(groundFor(i, x, y, t), X - 32, Y, 64, 32);
    if (night > 0.01 && W.road[i] && ((x + y) & 1) === 0) lamps.push([X, Y + 16]);
  }
  if (Game.overlay) {
    for (let y = v0; y <= v1; y++) for (let x = u0; x <= u1; x++) {
      const c = overlayColor(Game.overlay, idx(x, y)); if (!c) continue;
      diamondPath(g, x, y); g.fillStyle = c; g.fill();
    }
  }
  if (night > 0.01) {
    g.fillStyle = `rgba(16,22,60,${night * 0.56})`; diamondPath(g, 0, 0, N); g.fill();
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = night * 0.55;
    for (const [X, Y] of lamps) g.drawImage(GLOW, X - 22, Y - 14, 44, 28);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  if (dusk > 0.01) { g.fillStyle = `rgba(255,130,70,${dusk * 0.10})`; diamondPath(g, 0, 0, N); g.fill(); }
  Ents.drawShadows(R.P);
  Input.drawGroundPreview(g, t);

  // ---- objects, back to front ----
  for (const bk of R.buckets) bk.length = 0;
  Ents.bucketize(R.buckets);
  const needs = [];
  const showNeeds = Game.state === 'play' && z > 0.45;
  for (let d = u0 + v0; d <= u1 + v1; d++) {
    const xs = Math.max(u0, d - v1), xe = Math.min(u1, d - v0);
    for (let x = xs; x <= xe; x++) {
      const y = d - x, i = idx(x, y), X = (x - y) * 32, Y = (x + y) * 16;
      if (X < vx0 - 100 || X > vx1 + 100 || Y < vy0 - 64 || Y > vy1 + 360) continue;
      const strips = D.strips[i];
      if (strips) for (const e of strips) drawStrip(e.b, e.k, night, t);
      else if (W.tree[i]) {
        const spr = treeSprite(W.tree[i]);
        if (night < 0.97) g.drawImage(spr.cv, X - 32, Y - spr.height, spr.w, spr.h);
        if (night > 0.01) { g.globalAlpha = night < 0.97 ? night : 1; g.drawImage(spr.nv, X - 32, Y - spr.height, spr.w, spr.h); g.globalAlpha = 1; }
      }
      if (showNeeds && D.needs[i] && ((x * 7 + y * 3) % 4 === 0 || W.bld[i] >= 0)) needs.push([X, Y, D.needs[i]]);
    }
    const bk = R.buckets[d];
    if (bk) for (const it of bk) Ents.drawItem(R.P, it, night, t);
  }

  // ---- effects & sky things ----
  for (const [X, Y, n] of needs) {
    if (Math.sin(t * 3 + X) < -0.6) continue;
    g.drawImage(iconCanvas(n === 1 ? '🚗' : '⚡'), X - 9, Y - 34 + Math.sin(t * 4 + Y) * 2, 18, 18);
  }
  FX.draw(R.P, night);
  Ents.drawFlyers(R.P, t, night);
  Input.drawPreview(g, t, night);
  Ents.drawClouds(R.P, z, night);

  // ---- screen space ----
  g.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
  FX.drawScreen(g);
}
