'use strict';
// =====================================================================
//  Game loop, starting / continuing, and the demo city on the title
// =====================================================================
const Game = {
  state: 'title', celebrate: 0, speed: 1, lastSpeed: 1, slot: null, overlay: null, shake: 0, autosaveT: 30, titleT: 0,
  visible(x, y, margin = 2) {
    const [X, Y] = Pw(x + 0.5, y + 0.5), [sx, sy] = worldToScreen(X, Y), m = margin * 64 * Cam.zoom;
    return sx > -m && sx < R.w + m && sy > -m && sy < R.h + m;
  },
};

function resetSimState() {
  Object.assign(S, { pop: 0, jobsC: 0, jobsI: 0, demand: { R: 0.8, C: 0.1, I: 0.3 }, happiness: 60, stepAcc: 0, monthAcc: 0, counts: {}, needRoad: 0, needPower: 0 });
  UI.shown.pop = 0; UI.shown.money = isFinite(W.money) ? W.money : 0;
}
function primeSim() {
  refreshRoadList(); recomputeRoadNear(); recomputePower(); recomputeLandValue(); computeStats(); computeDemand(); computeBudget();
  D.dirty = false; D.lvDirty = false;
  UI.shown.pop = S.pop;
}

function enterPlay() {
  Game.state = 'play';
  $('title').classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('banner').classList.add('hidden');
  Ents.reset(); FX.reset();
  Input.setTool('inspect'); Input.selected = null;
  UI.closeFlyout(); UI.hideInfo(); UI.setOverlay(null); UI.setSpeed(1);
  UI.sayQ = []; UI.saying = false; $('advisor').classList.add('hidden');
  UI.renderQuests();
  News.timer = 0; News.queue = []; News.recent = [];
  setSeason(seasonOf(W.month));
  Game.autosaveT = 30;
}

function startNewGame({ name, mode, slot, seed, difficulty = 'normal' }) {
  newWorld({ seed, mode, cityName: name, difficulty });
  if (mode === 'creative') W.tier = 0;
  resetSimState(); primeSim();
  Game.slot = slot;
  enterPlay();
  Cam.zoom = Cam.tz = 1.1; centerOnTile(N / 2, N / 2);
  Save.save();
  setTimeout(() => {
    if (mode === 'creative') UI.say(`Welcome to Creative mode, Mayor ${PERSONAL.mayor}! Money is unlimited and everything is unlocked. Go wild! (I'll still give you quests if you want them.)`, 'dog');
    Quests.ensure();
  }, 600);
}

function continueGame(slot) {
  if (!Save.load(slot)) { titleMain(); return; }
  resetSimState(); primeSim();
  Game.slot = slot;
  enterPlay();
  let sx = 0, sy = 0, n = 0;
  for (const b of W.buildings.values()) { sx += b.x; sy += b.y; n++; }
  Cam.zoom = Cam.tz = 1; centerOnTile(n ? Math.round(sx / n) : N / 2, n ? Math.round(sy / n) : N / 2);
  try { localStorage.setItem('mayorNelly.last', String(slot)); } catch (e) { /* ignore */ }
  setTimeout(() => { UI.say(`Welcome back, Mayor ${PERSONAL.mayor}! ${W.cityName} missed you. Woof!`, 'dog'); Quests.ensure(); }, 500);
}

function showTitle() {
  Game.state = 'title';
  $('hud').classList.add('hidden');
  $('advisor').classList.add('hidden');
  $('title').classList.remove('hidden');
  UI.tooltip(null);
  buildDemoCity();
  titleMain();
}

// A pre-built showcase city behind the title screen
function buildDemoCity() {
  newWorld({ seed: 20261007, mode: 'creative', cityName: PERSONAL.defaultCityName });
  W.tier = 5;
  const c0 = 17, c1 = 47, step = 5;
  for (let y = c0 - 1; y <= c1 + 1; y++) for (let x = c0 - 1; x <= c1 + 1; x++) { const i = idx(x, y); if (W.terrain[i] !== T_GRASS) W.terrain[i] = T_GRASS; W.tree[i] = 0; }
  computeWaterNear();
  for (let y = c0; y <= c1; y++) for (let x = c0; x <= c1; x++) {
    if ((x - c0) % step === 0 || (y - c0) % step === 0) { const i = idx(x, y); W.road[i] = 1; W.tree[i] = 0; W.zone[i] = 0; }
  }
  const rr = mulberry32(99);
  const special = {
    '0,0': 'zoo', '5,0': 'space', '1,2': 'cupcake', '3,2': 'castle', '2,1': 'skytower', '4,3': 'statue', '0,4': 'dogpark', '2,4': 'catcafe', '5,5': 'fusion', '4,1': 'donut', '1,5': 'observatory', '3,4': 'bigpark',
  };
  for (let by = 0; by < 6; by++) for (let bx = 0; bx < 6; bx++) {
    const x0 = c0 + bx * step + 1, y0 = c0 + by * step + 1;
    const sp = special[`${bx},${by}`];
    if (sp && checkPlace(sp, x0, y0).ok) { createBuilding(sp, x0, y0); if (BT[sp].size === 2) { createBuilding('fountain', x0 + 3, y0 + 3); createBuilding('park', x0 + 2, y0 + 3); createBuilding('garden', x0 + 3, y0 + 2); } continue; }
    const dc = Math.hypot(bx - 2.5, by - 2.5);
    const zk = by >= 5 && bx <= 1 ? 'I' : dc < 1.6 ? 'C' : rr() < 0.25 ? 'C' : 'R';
    for (let y = y0; y < y0 + 4; y++) for (let x = x0; x < x0 + 4; x++) {
      const i = idx(x, y); if (!inb(x, y) || W.terrain[i] === T_WATER || W.road[i] || W.bld[i] >= 0) continue;
      if (rr() < 0.08) { createBuilding(pick(['park', 'garden', 'fountain', 'playground']), x, y); continue; }
      W.zone[i] = ZONES[zk].id;
      const lvl = dc < 1.8 ? (rr() < 0.7 ? 3 : 2) : dc < 3 ? (rr() < 0.5 ? 2 : rr() < 0.5 ? 3 : 1) : (rr() < 0.6 ? 1 : 2);
      createBuilding(zk, x, y, lvl, Math.floor(rr() * 1000));
    }
  }
  for (const b of W.buildings.values()) b.born = 0;
  markAllGround();
  resetSimState(); primeSim();
  Ents.reset(); FX.reset();
  Ents.launchTimer = 8;
  W.tod = 0.62; W.month = 5; setSeason('summer');
  Cam.zoom = Cam.tz = 0.95; centerOnTile(32, 32);
}

// ---------------------------------------------------------------------
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  const t = now / 1000;
  if (Game.state === 'play') {
    const paused = UI.modalOpen();
    const gdt = paused ? 0 : dt * Game.speed;
    simUpdate(gdt);
    Input.updateKeys(dt);
    Ents.update(dt, gdt, nightFactor());
    News.update(dt);
    Game.autosaveT -= dt;
    if (Game.autosaveT <= 0) { Game.autosaveT = 30; Save.save(); }
  } else if (Game.state === 'title') {
    Game.titleT += dt;
    W.tod = (W.tod + dt / 50) % 1;
    const a = Game.titleT * 0.05;
    const [X, Y] = Pw(32 + Math.cos(a) * 6, 32 + Math.sin(a) * 6);
    Cam.x = X; Cam.y = Y - 40;
    Ents.update(dt, dt, nightFactor());
    if (nightFactor() > 0.6 && Math.random() < dt * 0.9) { const [cx, cy] = Pw(rnd(22, 42), rnd(22, 42)); FX.firework(cx, cy - 60); }
  }
  if (Game.celebrate > 0) Game.celebrate = Math.max(0, Game.celebrate - dt);
  FX.update(dt);
  updateCamera(dt);
  render(t, dt);
  UI.update(dt);
  requestAnimationFrame(frame);
}

function boot() {
  initRender();
  UI.init();
  Input.init();
  showTitle();
  addEventListener('visibilitychange', () => { if (document.hidden) Save.save(); });
  addEventListener('beforeunload', () => Save.save());
  addEventListener('pointerdown', () => Sound.init(), { once: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { clearSpriteCache(); });
  requestAnimationFrame(frame);
}
boot();
