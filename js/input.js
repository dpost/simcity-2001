'use strict';
// =====================================================================
//  Mouse / keyboard: tools, dragging, previews
// =====================================================================
const LANDMARK_QUIPS = {
  dogpark: ['dog', 'WOOF! My very own dog park?! You are the BEST mayor ever! 🐾'],
  donut: ['dog', `${POSS(PERSONAL.dad)} Donut Diner is open! Look at that donut spin! ${PERSONAL.dad} says the first donut is free. (It is not. It is $2.)`],
  catcafe: ['cat', 'Meow. A café in my honor. I suppose it is... acceptable. 😼'],
  cupcake: ['dog', "A skyscraper made of CUPCAKE?! Please tell me I'm allowed to lick it. (I'm not allowed to lick it.)"],
  observatory: ['dog', 'Now we can see the stars! Come back at night. I hope we find a planet made of bones.'],
  zoo: ['dog', 'A zoo! The giraffe is very tall. I am very jealous.'],
  space: ['dog', 'Ten… nine… I can only count to three. LIFTOFF! Click the Space Center with 👆 Look to launch rockets!'],
  statue: ['dog', `A golden statue of YOU, Mayor ${PERSONAL.mayor}! The whole city is cheering!`],
  castle: ['cat', 'A castle made of candy. Finally, a home fit for royalty. Like me. 😼'],
  skytower: ['dog', 'The tallest tower in the WORLD! Wait until night to see the searchlight!'],
};

const Input = {
  tool: 'inspect', sub: null, down: null, pan: null, hover: null, tiles: [], ghost: null, selected: null,
  keys: {}, ghostOf: null, lastSx: 0, lastSy: 0, confirmB: null, painted: null,

  init() {
    const cv = R.cv;
    cv.addEventListener('pointerdown', (e) => this.onDown(e));
    addEventListener('pointermove', (e) => this.onMove(e));
    addEventListener('pointerup', (e) => this.onUp(e));
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (Game.state !== 'play') return;
      const k = e.deltaMode === 1 ? 33 : 1;
      if (!e.ctrlKey && Math.abs(e.deltaX) > 0.5) { Cam.x += (e.deltaX * k) / Cam.zoom; Cam.y += (e.deltaY * k) / Cam.zoom; Cam.anchor = null; clampCamera(); return; }
      zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * k * (e.ctrlKey ? 0.01 : 0.0015)));
    }, { passive: false });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('pointerleave', () => { this.hover = null; UI.tooltip(null); });
    addEventListener('keydown', (e) => this.onKey(e, true));
    addEventListener('keyup', (e) => this.onKey(e, false));
    addEventListener('blur', () => { this.keys = {}; });
  },

  setTool(tool, sub = null) {
    this.tool = tool; this.sub = sub; this.down = null; this.tiles = []; this.ghost = null;
    if (tool !== 'inspect') { this.selected = null; UI.hideInfo(); }
    R.cv.style.cursor = tool === 'inspect' ? 'grab' : 'crosshair';
  },
  placeType() { return this.sub && BT[this.sub] ? this.sub : null; },

  onDown(e) {
    Sound.init();
    if (Game.state !== 'play') return;
    UI.closeFlyoutIfNoTool();
    this.lastSx = e.clientX; this.lastSy = e.clientY;
    if (e.button === 1 || e.button === 2 || (e.button === 0 && this.tool === 'inspect')) {
      this.pan = { sx: e.clientX, sy: e.clientY, cx: Cam.x, cy: Cam.y, moved: false, click: e.button === 0 };
      R.cv.style.cursor = 'grabbing';
      return;
    }
    if (e.button !== 0) return;
    const [tx, ty] = screenToTile(e.clientX, e.clientY);
    this.down = { tx, ty };
    this.painted = new Set();
    if (this.placeType() === 'tree') this.paintTree(tx, ty);
    this.computePreview(tx, ty);
  },

  onMove(e) {
    this.lastSx = e.clientX; this.lastSy = e.clientY;
    if (Game.state !== 'play') return;
    if (this.pan) {
      const dx = e.clientX - this.pan.sx, dy = e.clientY - this.pan.sy;
      if (Math.abs(dx) + Math.abs(dy) > 4) this.pan.moved = true;
      Cam.x = this.pan.cx - dx / Cam.zoom; Cam.y = this.pan.cy - dy / Cam.zoom; Cam.anchor = null; Cam.tz = Cam.zoom;
      clampCamera();
      return;
    }
    if (e.target !== R.cv && !this.down) { UI.tooltip(null); this.hover = null; return; }
    const [tx, ty] = screenToTile(e.clientX, e.clientY);
    this.hover = inb(tx, ty) ? [tx, ty] : null;
    if (this.down && this.placeType() === 'tree') this.paintTree(tx, ty);
    this.computePreview(tx, ty);
  },

  onUp(e) {
    if (Game.state !== 'play') { this.pan = null; this.down = null; return; }
    if (this.pan) {
      const p = this.pan; this.pan = null;
      R.cv.style.cursor = this.tool === 'inspect' ? 'grab' : 'crosshair';
      if (p.click && !p.moved) this.inspectAt(e.clientX, e.clientY);
      return;
    }
    if (!this.down) return;
    this.apply();
    this.down = null; this.painted = null;
    const [tx, ty] = screenToTile(e.clientX, e.clientY);
    this.computePreview(tx, ty);
  },

  onKey(e, isDown) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const k = e.key.toLowerCase();
    this.keys[k] = isDown;
    if (!isDown || Game.state !== 'play') return;
    if (k === 'escape') { if (!UI.closeTop()) { this.setTool('inspect'); UI.syncTools(); } return; }
    if (!UI.modalOpen()) {
      if (k === ' ') { e.preventDefault(); UI.setSpeed(Game.speed === 0 ? (Game.lastSpeed || 1) : 0); return; }
      const tb = TOOLBAR.find((t) => t.key === k);
      if (tb) { UI.clickTool(tb.id); return; }
      if (k === '+' || k === '=') zoomAt(R.w / 2, R.h / 2, 1.25);
      if (k === '-' || k === '_') zoomAt(R.w / 2, R.h / 2, 0.8);
    }
  },

  updateKeys(dt) {
    if (Game.state !== 'play' || UI.modalOpen()) return;
    const k = this.keys, sp = 650 * dt / Cam.zoom;
    let dx = 0, dy = 0;
    if (k.a || k.arrowleft) dx -= sp; if (k.d || k.arrowright) dx += sp;
    if (k.w || k.arrowup) dy -= sp; if (k.s || k.arrowdown) dy += sp;
    if (dx || dy) { Cam.x += dx; Cam.y += dy; Cam.anchor = null; clampCamera(); }
  },

  // ---------------- previews ----------------
  rectTiles(x0, y0, x1, y1) {
    const r = [];
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) if (inb(x, y)) r.push([x, y]);
    return r;
  },
  pathTiles(x0, y0, x1, y1) {
    const r = [], horizFirst = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
    const sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
    let x = x0, y = y0; r.push([x, y]);
    if (horizFirst) { while (x !== x1) { x += sx; r.push([x, y]); } while (y !== y1) { y += sy; r.push([x, y]); } }
    else { while (y !== y1) { y += sy; r.push([x, y]); } while (x !== x1) { x += sx; r.push([x, y]); } }
    return r.filter(([a, b]) => inb(a, b));
  },
  computePreview(tx, ty) {
    this.tiles = []; this.ghost = null;
    if (!inb(tx, ty) && !this.down) { UI.tooltip(null); return; }
    const d = this.down, t = this.tool, pt = this.placeType();
    let tip = null;
    if (t === 'road') {
      this.tiles = d ? this.pathTiles(d.tx, d.ty, tx, ty) : (inb(tx, ty) ? [[tx, ty]] : []);
      let cost = 0, bad = 0;
      this.tiles = this.tiles.map(([x, y]) => { const c = checkRoad(x, y); if (c.ok) cost += c.cost; else bad++; return [x, y, c.ok]; });
      tip = `🛣️ Road ${d ? `× ${this.tiles.length}` : ''} <b>${fmtMoney(cost)}</b>${bad ? ' <span class="bad">(some blocked)</span>' : ''}`;
      if (!canAfford(cost)) tip += ' <span class="bad">Not enough money!</span>';
    } else if (t === 'zoneR' || t === 'zoneC' || t === 'zoneI') {
      const z = t.slice(4);
      this.tiles = (d ? this.rectTiles(d.tx, d.ty, tx, ty) : (inb(tx, ty) ? [[tx, ty]] : [])).map(([x, y]) => { const c = checkZone(z, x, y); return [x, y, c.ok, c.cost || 0]; });
      const cost = this.tiles.reduce((s, a) => s + (a[2] ? a[3] : 0), 0);
      tip = `${ZONES[z].icon} ${ZONES[z].name} zone <b>${fmtMoney(cost)}</b>`;
      if (!canAfford(cost)) tip += ' <span class="bad">Not enough money!</span>';
    } else if (t === 'bulldoze') {
      this.tiles = (d ? this.rectTiles(d.tx, d.ty, tx, ty) : (inb(tx, ty) ? [[tx, ty]] : [])).map(([x, y]) => [x, y, true]);
      const seen = new Set(); let cost = 0;
      for (const [x, y] of this.tiles) { const b = buildingAt(x, y); if (b) { if (seen.has(b.id)) continue; seen.add(b.id); } cost += bulldozeCost(x, y); }
      tip = `🚜 Bulldoze <b>${fmtMoney(cost)}</b>`;
      if (!d && this.hover) { const b = buildingAt(...this.hover); if (b) tip = `🚜 Bulldoze ${escapeHtml(buildingName(b))} <b>${fmtMoney(cost)}</b>`; }
    } else if (pt) {
      const s = BT[pt].size, ox = tx - Math.floor((s - 1) / 2), oy = ty - Math.floor((s - 1) / 2);
      const c = checkPlace(pt, ox, oy);
      this.ghost = { type: pt, x: ox, y: oy, ok: c.ok };
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) this.tiles.push([ox + x, oy + y, c.ok]);
      tip = `${BT[pt].icon} ${escapeHtml(BT[pt].name)} <b>${fmtMoney(c.cost || price(BT[pt].cost))}</b>` + (c.ok ? (c.replace && c.replace.length ? ` <span class="bad">(replaces ${c.replace.length})</span>` : '') : ` <span class="bad">${escapeHtml(c.msg)}</span>`);
    } else if (t === 'inspect' && this.hover) {
      const b = buildingAt(...this.hover);
      tip = b ? escapeHtml(buildingName(b)) : null;
    }
    UI.tooltip(tip, this.lastSx, this.lastSy);
  },

  drawGroundPreview(g, t) {
    if (Game.state !== 'play') return;
    const zoneCol = { zoneR: ZONES.R.color, zoneC: ZONES.C.color, zoneI: ZONES.I.color };
    for (const [x, y, ok] of this.tiles) {
      diamondPath(g, x, y);
      let col = ok ? 'rgba(80,220,120,0.38)' : 'rgba(255,70,70,0.42)';
      if (this.tool === 'bulldoze') col = 'rgba(255,120,60,0.35)';
      else if (zoneCol[this.tool] && ok) col = alpha(zoneCol[this.tool], 0.5);
      g.fillStyle = col; g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1; g.stroke();
    }
    const gh = this.ghost;
    const radiusOf = (type) => (BT[type] && (BT[type].lv || BT[type].poll) ? (BT[type].lv || BT[type].poll).r : 0);
    let rb = null;
    if (gh && radiusOf(gh.type)) rb = { type: gh.type, x: gh.x, y: gh.y };
    else if (this.selected && radiusOf(this.selected.type)) rb = this.selected;
    if (rb) {
      const s = BT[rb.type].size, r = radiusOf(rb.type), [cx, cy] = Pw(rb.x + s / 2, rb.y + s / 2);
      g.beginPath(); g.ellipse(cx, cy, r * 32 * Math.SQRT2, r * 16 * Math.SQRT2, 0, 0, Math.PI * 2);
      const bad = BT[rb.type].poll; g.fillStyle = bad ? 'rgba(140,80,40,0.12)' : 'rgba(255,230,120,0.16)'; g.fill();
      g.setLineDash([8, 6]); g.lineDashOffset = -t * 20; g.strokeStyle = bad ? 'rgba(140,80,40,0.7)' : 'rgba(255,255,255,0.85)'; g.lineWidth = 2; g.stroke(); g.setLineDash([]);
    }
    if (this.tool === 'inspect' && this.hover && !this.pan) {
      const b = buildingAt(...this.hover);
      if (b) diamondPath(g, b.x, b.y, b.size); else diamondPath(g, this.hover[0], this.hover[1]);
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.5; g.stroke();
    }
    if (this.selected && W.buildings.has(this.selected.id)) {
      const b = this.selected; diamondPath(g, b.x, b.y, b.size);
      g.strokeStyle = `rgba(255,111,165,${0.6 + Math.sin(t * 5) * 0.3})`; g.lineWidth = 3; g.stroke();
    }
  },
  drawPreview(g, t, night) {
    const gh = this.ghost;
    if (!gh || Game.state !== 'play') return;
    g.globalAlpha = gh.ok ? 0.75 : 0.4;
    if (gh.type === 'tree') {
      const spr = treeSprite(1), [X, Y] = Pw(gh.x, gh.y);
      g.drawImage(spr.cv, X - 32, Y - spr.height, spr.w, spr.h);
    } else {
      const fake = { type: gh.type, x: gh.x, y: gh.y, size: BT[gh.type].size, level: 1, variant: 0, id: 0 };
      const spr = spriteFor(fake), [X0, Y0] = Pw(gh.x, gh.y);
      g.drawImage(spr.cv, X0 - spr.w / 2, Y0 - spr.height, spr.w, spr.h);
    }
    g.globalAlpha = 1;
  },

  // ---------------- actions ----------------
  paintTree(x, y) {
    if (!inb(x, y) || this.painted.has(idx(x, y))) return;
    this.painted.add(idx(x, y));
    const r = placeThing('tree', x, y);
    if (r.ok) { Sound.play('click'); const [X, Y] = Pw(x + 0.5, y + 0.5); for (let i = 0; i < 4; i++) FX.parts.push({ X, Y: Y - 8, vx: rnd(-20, 20), vy: rnd(-30, -10), r: 1.5, life: 0.6, max: 0.6, col: '#8fe36b', kind: 'spark', g: 60 }); }
  },
  apply() {
    const t = this.tool, pt = this.placeType();
    if (t === 'road') {
      let n = 0, fail = null;
      for (const [x, y] of this.tiles) { const r = placeRoad(x, y); if (r.ok && !r.skip) n++; else if (!r.ok) { fail = r.msg; if (r.msg === 'Not enough money!') break; } }
      if (n) { Sound.play('road'); this.dust(this.tiles); } else if (fail) { Sound.play('error'); UI.toast(fail); }
    } else if (t.startsWith('zone')) {
      const z = t.slice(4); let n = 0, fail = null;
      for (const [x, y] of this.tiles) { const r = placeZone(z, x, y); if (r.ok && !r.skip) n++; else if (r.msg) { fail = r.msg; break; } }
      if (n) Sound.play('zone'); else if (fail) { Sound.play('error'); UI.toast(fail); }
    } else if (t === 'bulldoze') {
      let n = 0;
      if (this.tiles.length === 1) {
        const b = buildingAt(this.tiles[0][0], this.tiles[0][1]);
        if (b && BT[b.type] && BT[b.type].landmark && this.confirmB !== b) {
          this.confirmB = b; setTimeout(() => { if (this.confirmB === b) this.confirmB = null; }, 3000);
          UI.toast(`Click again to bulldoze ${buildingName(b)}`); Sound.play('error'); return;
        }
      }
      for (const [x, y] of this.tiles) {
        const b = buildingAt(x, y);
        if (b && BT[b.type] && BT[b.type].landmark && this.tiles.length > 1) continue;
        const r = bulldoze(x, y);
        if (r && r.fail) { UI.toast('Not enough money to bulldoze!'); break; }
        if (r) { n++; if (r.b) { if (this.selected === r.b) { this.selected = null; UI.hideInfo(); } FX.construct(r.b); } }
      }
      this.confirmB = null;
      if (n) { Sound.play('bulldoze'); this.dust(this.tiles); }
    } else if (pt && pt !== 'tree' && this.ghost) {
      const r = placeThing(pt, this.ghost.x, this.ghost.y);
      if (!r.ok) { Sound.play('error'); UI.toast(r.msg); return; }
      Sound.play('place'); FX.construct(r.b);
      if (BT[pt].landmark) {
        const [X, Y] = Pw(r.b.x + r.b.size / 2, r.b.y + r.b.size / 2, 0);
        FX.fireworksShow(10, 3, [X, Y - 40]); FX.confetti(80); Sound.play('quest');
        const q = LANDMARK_QUIPS[pt]; if (q) UI.say(q[1], q[0]);
        UI.renderFlyout();
      }
    }
  },
  dust(tiles) {
    for (const [x, y] of tiles.slice(0, 40)) { const [X, Y] = Pw(x + 0.5, y + 0.5); for (let i = 0; i < 2; i++) FX.parts.push({ X: X + rnd(-8, 8), Y, vx: rnd(-10, 10), vy: rnd(-10, -2), r: 2, grow: 5, life: 0.6, max: 0.6, col: '#e0d6c0', kind: 'smoke' }); }
  },
  inspectAt(sx, sy) {
    const [tx, ty] = screenToTile(sx, sy);
    if (!inb(tx, ty)) { this.selected = null; UI.hideInfo(); return; }
    const b = buildingAt(tx, ty);
    Sound.play('select');
    this.selected = b;
    UI.showInfo(b, tx, ty);
    if (b && b.type === 'catcafe') Sound.play('meow');
    if (b && b.type === 'dogpark') Sound.play('woof');
  },
};
