'use strict';
// =====================================================================
//  The city map: terrain, roads, zones and buildings
// =====================================================================
const W = {};   // saved state
const D = {};   // derived data, recalculated (not saved)
const idx = (x, y) => y * N + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
const DIRS = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]]; // dx, dy, road-mask bit
const T_GRASS = 0, T_WATER = 1, T_SAND = 2;

function newWorld({ seed, mode, cityName, difficulty = 'normal' }) {
  for (const k in W) delete W[k];
  Object.assign(W, {
    version: 2, seed, mode, cityName, difficulty,
    money: mode === 'creative' ? Infinity : DIFFICULTY[difficulty].money,
    taxRate: 7, month: 2, year: 1, tod: 0.3, tier: 0, playTime: 0,
    terrain: new Uint8Array(N * N), tree: new Uint8Array(N * N), road: new Uint8Array(N * N),
    zone: new Uint8Array(N * N), bld: new Int32Array(N * N).fill(-1),
    buildings: new Map(), nextId: 1,
    quest: { tut: 0, active: [], done: 0, history: [] },
    flags: {},
  });
  genTerrain(seed);
  if (typeof Dis !== 'undefined') Dis.reset();
  if (typeof Life !== 'undefined') Life.reset();
  initDerived();
}

function initDerived() {
  const n = N * N;
  D.powered = new Uint8Array(n); D.roadNear = new Uint8Array(n); D.needs = new Uint8Array(n);
  D.lv = new Float32Array(n).fill(30); D.poll = new Float32Array(n);
  D.cov = { police: new Float32Array(n), fire: new Float32Array(n), school: new Float32Array(n), health: new Float32Array(n) };
  D.waterNear = new Uint8Array(n);
  D.strips = new Array(n).fill(null);
  D.roadList = [];
  D.dirty = true; D.lvDirty = true; D.miniDirty = true;
  W.bld.fill(-1);
  markAllGround();
  for (const b of W.buildings.values()) { footprint(b, (x, y, i) => { W.bld[i] = b.id; }); registerStrips(b); }
  computeWaterNear();
  refreshRoadList();
}

// ----------------------------- terrain -------------------------------
function genTerrain(seed, tgt = W) {
  const r = mulberry32(seed), nz = makeNoise(seed * 7 + 1), nz2 = makeNoise(seed * 13 + 5);
  const T = tgt.terrain; T.fill(T_GRASS); tgt.tree.fill(0);
  // a river near one edge
  const horiz = r() < 0.5, side = r() < 0.5;
  let pos = side ? N * (0.74 + r() * 0.1) : N * (0.16 + r() * 0.1), drift = 0;
  for (let t = -2; t < N + 2; t++) {
    drift = clamp(drift + (r() - 0.5) * 0.45, -0.7, 0.7); pos = clamp(pos + drift, 4, N - 5);
    if (side ? pos < N * 0.62 : pos > N * 0.38) drift -= side ? -0.15 : 0.15;
    const w = 1.2 + nz(t / 7, 3.3) * 1.6;
    for (let k = Math.floor(pos - w); k <= Math.ceil(pos + w); k++) {
      const x = horiz ? t : k, y = horiz ? k : t;
      if (inb(x, y)) T[idx(x, y)] = T_WATER;
    }
  }
  // a lake or two
  const lakes = 1 + Math.floor(r() * 2);
  for (let l = 0; l < lakes; l++) {
    let lx, ly;
    do { lx = 6 + r() * (N - 12); ly = 6 + r() * (N - 12); } while (Math.hypot(lx - N / 2, ly - N / 2) < 14);
    const rad = 2.5 + r() * 3.5;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - lx, y - ly) + (fbm(nz2, x / 5, y / 5) - 0.5) * 4;
      if (d < rad) T[idx(x, y)] = T_WATER;
    }
  }
  // sandy shores
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = idx(x, y); if (T[i] !== T_GRASS) continue;
    for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (inb(nx, ny) && T[idx(nx, ny)] === T_WATER && r() < 0.85) { T[i] = T_SAND; break; } }
  }
  // forests
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = idx(x, y); if (T[i] === T_WATER) continue;
    const f = fbm(nz, x / 9 + 10, y / 9 + 10), dc = Math.hypot(x - N / 2, y - N / 2);
    const forest = f > 0.6 && dc > 8 && r() < 0.8, lone = r() < (dc < 10 ? 0.01 : 0.03);
    if (forest || lone) tgt.tree[i] = T[i] === T_SAND ? 2 : 1 + Math.floor(r() * (f > 0.66 ? 2 : 4));
  }
}

function computeWaterNear() {
  D.waterNear.fill(0);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (W.terrain[idx(x, y)] !== T_WATER) continue;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const nx = x + dx, ny = y + dy; if (inb(nx, ny)) D.waterNear[idx(nx, ny)] = 1; }
  }
}

// ----------------------------- buildings -----------------------------
function btInfo(b) { return BT[b.type] || null; }
function bSize(type) { return BT[type] ? BT[type].size : 1; }
function footprint(b, f) { const s = b.size; for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) f(b.x + dx, b.y + dy, idx(b.x + dx, b.y + dy)); }
// big buildings are drawn as vertical strips so that depth-sorting stays correct
function stripTile(b, k) { const s = b.size; return k < s ? idx(b.x + k, b.y + s - 1) : idx(b.x + s - 1, b.y + (2 * s - 1 - k)); }
function registerStrips(b) {
  const add = (i, e) => { (D.strips[i] || (D.strips[i] = [])).push(e); };
  if (b.size === 1) { add(idx(b.x, b.y), { b, k: -1 }); return; }
  for (let k = 0; k < 2 * b.size; k++) add(stripTile(b, k), { b, k });
}
function unregisterStrips(b) {
  const ks = b.size === 1 ? [-1] : [...Array(2 * b.size).keys()];
  for (const k of ks) {
    const i = k < 0 ? idx(b.x, b.y) : stripTile(b, k), arr = D.strips[i];
    if (!arr) continue;
    const j = arr.findIndex((e) => e.b === b);
    if (j >= 0) arr.splice(j, 1);
    if (!arr.length) D.strips[i] = null;
  }
}

function createBuilding(type, x, y, level = 1, variant = Math.floor(Math.random() * 1000)) {
  const b = { id: W.nextId++, type, x, y, size: bSize(type), level, variant, born: performance.now(), powered: false };
  W.buildings.set(b.id, b);
  footprint(b, (fx, fy, i) => { W.bld[i] = b.id; W.tree[i] = 0; if (BT[type]) W.zone[i] = 0; markGround(fx, fy); });
  registerStrips(b);
  D.dirty = D.lvDirty = D.miniDirty = true;
  return b;
}
function removeBuilding(b) {
  unregisterStrips(b);
  footprint(b, (x, y, i) => { W.bld[i] = -1; markGround(x, y); });
  W.buildings.delete(b.id);
  D.dirty = D.lvDirty = D.miniDirty = true;
}
function buildingAt(x, y) { if (!inb(x, y)) return null; const id = W.bld[idx(x, y)]; return id >= 0 ? W.buildings.get(id) : null; }
function hasLandmark(type) { for (const b of W.buildings.values()) if (b.type === type) return true; return false; }
function isUnlocked(type) { return W.mode === 'creative' || !BT[type] || BT[type].tier <= W.tier; }
function diff() { return DIFFICULTY[W.difficulty] || DIFFICULTY.easy; }
function price(c) { return W.mode === 'creative' ? c : Math.round(c * diff().cost); }
// small things that building over automatically clears away (no bulldozing needed)
const radAt = (i) => typeof Dis !== 'undefined' && Dis.rad[i] > 0;
function clearRubble(x, y) { const i = idx(x, y); if (typeof Dis !== 'undefined' && Dis.rubble[i]) { Dis.rubble[i] = 0; markGround(x, y); } }
function replaceable(b) { return !BT[b.type] || (BT[b.type].park && BT[b.type].size === 1); }
function canAfford(c) { return W.mode === 'creative' || W.money >= c; }
function spend(c) { if (W.mode !== 'creative') W.money -= c; }
function roadMask(x, y) {
  let m = 0;
  for (const [dx, dy, bit] of DIRS) { const nx = x + dx, ny = y + dy; if (inb(nx, ny) && W.road[idx(nx, ny)]) m |= bit; }
  return m;
}
function refreshRoadList() {
  D.roadList = [];
  for (let i = 0; i < N * N; i++) if (W.road[i]) D.roadList.push(i);
}

// ----------------------------- tools ---------------------------------
// Each check* returns { ok, cost, msg }
function checkPlace(type, x, y) {
  const t = BT[type], s = t.size;
  if (!isUnlocked(type)) return { ok: false, msg: `Unlocks when your city becomes a ${TIERS[t.tier].name}` };
  if (t.landmark && hasLandmark(type)) return { ok: false, msg: 'You already built this! Only one allowed.' };
  let cost = price(t.cost);
  const replace = new Map();
  for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) {
    const px = x + dx, py = y + dy;
    if (!inb(px, py)) return { ok: false, msg: 'Too close to the edge of the map' };
    const i = idx(px, py);
    if (W.terrain[i] === T_WATER) return { ok: false, msg: "Can't build on water" };
    if (radAt(i)) return { ok: false, msg: '☢️ Radiation! Wait for it to fade away.' };
    if (W.road[i]) return { ok: false, msg: 'A road is in the way' };
    if (t.isTree && (W.tree[i] || W.bld[i] >= 0)) return { ok: false, msg: 'There is already something here' };
    if (W.bld[i] >= 0) {
      const b = W.buildings.get(W.bld[i]);
      if (!replaceable(b)) return { ok: false, msg: `${buildingName(b)} is in the way` };
      if (!replace.has(b.id)) { replace.set(b.id, b); cost += bulldozeCost(b.x, b.y); }
    }
    if (W.tree[i] && !t.isTree) cost += CLEAR_TREE_COST;
  }
  if (!canAfford(cost)) return { ok: false, cost, msg: `Not enough money (needs ${fmtMoney(cost)})` };
  return { ok: true, cost, replace: [...replace.values()] };
}
function placeThing(type, x, y) {
  const c = checkPlace(type, x, y);
  if (!c.ok) return c;
  spend(c.cost);
  for (const old of c.replace) removeBuilding(old);
  for (let dy = 0; dy < BT[type].size; dy++) for (let dx = 0; dx < BT[type].size; dx++) clearRubble(x + dx, y + dy);
  if (BT[type].isTree) { const i = idx(x, y); W.tree[i] = 1 + Math.floor(Math.random() * 4); W.zone[i] = 0; markGround(x, y); D.lvDirty = D.miniDirty = true; return { ok: true, cost: c.cost }; }
  const b = createBuilding(type, x, y);
  return { ok: true, cost: c.cost, b, replaced: c.replace.length };
}

function checkRoad(x, y) {
  if (!inb(x, y)) return { ok: false, msg: 'Off the map' };
  const i = idx(x, y);
  if (W.road[i]) return { ok: true, cost: 0, skip: true };
  if (radAt(i)) return { ok: false, msg: '☢️ Radiation! Wait for it to fade away.' };
  let cost = price(W.terrain[i] === T_WATER ? BRIDGE_COST : ROAD_COST), replace = null;
  if (W.bld[i] >= 0) {
    const b = W.buildings.get(W.bld[i]);
    if (!replaceable(b) || b.size > 1) return { ok: false, msg: `${buildingName(b)} is in the way` };
    replace = b; cost += bulldozeCost(x, y);
  }
  if (W.tree[i]) cost += CLEAR_TREE_COST;
  return { ok: true, cost, replace };
}
function placeRoad(x, y) {
  const c = checkRoad(x, y);
  if (!c.ok || c.skip) return c;
  if (!canAfford(c.cost)) return { ok: false, msg: 'Not enough money!' };
  spend(c.cost);
  if (c.replace) removeBuilding(c.replace);
  clearRubble(x, y);
  const i = idx(x, y); W.road[i] = 1; W.tree[i] = 0; W.zone[i] = 0; markGround(x, y);
  D.dirty = D.lvDirty = D.miniDirty = true;
  return c;
}

function checkZone(z, x, y) {
  if (!inb(x, y)) return { ok: false };
  const i = idx(x, y);
  if (W.terrain[i] === T_WATER || W.road[i] || radAt(i)) return { ok: false };
  let replace = null, cost = price(ZONE_COST) + (W.tree[i] ? CLEAR_TREE_COST : 0);
  if (W.bld[i] >= 0) {
    const b = W.buildings.get(W.bld[i]);
    if (b.type === z) return { ok: true, cost: 0, skip: true };
    if (!replaceable(b) || b.size > 1) return { ok: false };
    replace = b; cost += bulldozeCost(x, y);
  } else if (W.zone[i] === ZONES[z].id) return { ok: true, cost: 0, skip: true };
  return { ok: true, cost, replace };
}
function placeZone(z, x, y) {
  const c = checkZone(z, x, y);
  if (!c.ok || c.skip) return c;
  if (!canAfford(c.cost)) return { ok: false, msg: 'Not enough money!' };
  spend(c.cost);
  if (c.replace) removeBuilding(c.replace);
  const i = idx(x, y); W.zone[i] = ZONES[z].id; W.tree[i] = 0; markGround(x, y);
  D.dirty = D.lvDirty = D.miniDirty = true;
  return c;
}

function bulldozeCost(x, y) {
  if (!inb(x, y)) return 0;
  const i = idx(x, y), b = buildingAt(x, y);
  if (b) return BT[b.type] ? Math.max(5, Math.round(price(BT[b.type].cost) * 0.05)) : 5 * b.level;
  if (W.road[i] || W.tree[i]) return 2;
  return 0;
}
// returns what was removed (or null)
function bulldoze(x, y) {
  if (!inb(x, y)) return null;
  const i = idx(x, y), b = buildingAt(x, y);
  const cost = bulldozeCost(x, y);
  if (cost && !canAfford(cost)) return { fail: true };
  if (b) {
    spend(cost);
    if (!BT[b.type]) footprint(b, (fx, fy, fi) => { W.zone[fi] = 0; });
    removeBuilding(b);
    return { what: 'building', b, cost };
  }
  markGround(x, y);
  if (typeof Dis !== 'undefined' && Dis.rubble[i]) { Dis.rubble[i] = 0; return { what: 'rubble', cost: 0 }; }
  if (W.road[i]) { spend(cost); W.road[i] = 0; D.dirty = D.lvDirty = D.miniDirty = true; return { what: 'road', cost }; }
  if (W.tree[i]) { spend(cost); W.tree[i] = 0; D.lvDirty = D.miniDirty = true; return { what: 'tree', cost }; }
  if (W.zone[i]) { W.zone[i] = 0; D.dirty = D.miniDirty = true; return { what: 'zone', cost: 0 }; }
  return null;
}

// Friendly names for the inspect panel
function buildingName(b) {
  if (BT[b.type]) return BT[b.type].name;
  const designs = ZDESIGNS[b.type][b.level];
  return ZNAMES[b.type][b.level][b.variant % designs];
}
