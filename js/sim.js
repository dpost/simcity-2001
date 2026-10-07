'use strict';
// =====================================================================
//  The simulation: power, land value, demand, growth, money, tiers
// =====================================================================
const S = {
  pop: 0, jobsC: 0, jobsI: 0, demand: { R: 0.8, C: 0.1, I: 0.3 }, happiness: 60,
  income: 0, tourism: 0, expense: 0, net: 0, taxR: 0, taxB: 0, upkeepSvc: 0, upkeepPower: 0, upkeepRoads: 0,
  powerCap: 0, powerUse: 0, powerDemand: 0, shortage: false,
  counts: {}, stepAcc: 0, monthAcc: 0, needRoad: 0, needPower: 0,
};

function useOf(b) {
  if (!BT[b.type]) return b.level;
  const t = BT[b.type];
  if (t.power || t.park) return 0;
  return t.landmark ? 3 : 2;
}

function recomputePower() {
  const P = D.powered; P.fill(0);
  const seen = new Uint8Array(N * N);
  S.powerCap = 0; S.powerUse = 0; S.powerDemand = 0;
  const conductive = (i) => W.road[i] || W.bld[i] >= 0 || W.zone[i];
  const queue = new Int32Array(N * N);
  for (const plant of W.buildings.values()) {
    const pt = BT[plant.type];
    if (!pt || !pt.power || seen[idx(plant.x, plant.y)]) continue;
    let qh = 0, qt = 0;
    footprint(plant, (x, y, i) => { seen[i] = 1; queue[qt++] = i; });
    let cap = 0, used = 0, demand = 0;
    const plants = new Set(), consumers = new Set(), tiles = [];
    const order = [];
    while (qh < qt) {
      const i = queue[qh++]; tiles.push(i);
      const bid = W.bld[i];
      if (bid >= 0) {
        const b = W.buildings.get(bid);
        if (BT[b.type] && BT[b.type].power) { if (!plants.has(bid)) { plants.add(bid); cap += BT[b.type].power; } }
        else if (!consumers.has(bid)) { consumers.add(bid); order.push(b); }
      }
      const x = i % N, y = (i / N) | 0;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue;
        const ni = idx(nx, ny); if (seen[ni] || !conductive(ni)) continue;
        seen[ni] = 1; queue[qt++] = ni;
      }
    }
    const on = new Set();
    for (const b of order) { const u = useOf(b); demand += u; if (used + u <= cap) { used += u; on.add(b.id); } }
    for (const i of tiles) {
      const bid = W.bld[i];
      if (bid < 0) P[i] = W.road[i] ? 1 : (cap - used >= 1 ? 1 : 0);
      else P[i] = plants.has(bid) || on.has(bid) ? 1 : 0;
    }
    S.powerCap += cap; S.powerUse += used; S.powerDemand += demand;
  }
  for (const b of W.buildings.values()) b.powered = !!P[idx(b.x, b.y)];
  S.shortage = S.powerDemand > S.powerCap + 0.5;
}

function recomputeRoadNear() {
  const R = D.roadNear; R.fill(0);
  for (const i of D.roadList) {
    const x = i % N, y = (i / N) | 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const nx = x + dx, ny = y + dy; if (inb(nx, ny)) R[idx(nx, ny)] = 1; }
  }
}

function addRadial(arr, cx, cy, r, amt) {
  const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(N - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(N - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d <= r) arr[idx(x, y)] += amt * (1 - d / (r + 1));
  }
}

function recomputeLandValue() {
  const lv = D.lv, poll = D.poll;
  lv.fill(30); poll.fill(0);
  for (const k in D.cov) D.cov[k].fill(0);
  for (let i = 0; i < N * N; i++) {
    if (D.waterNear[i]) lv[i] += 8;
    if (W.tree[i]) addRadial(lv, i % N, (i / N) | 0, 1.6, 4);
  }
  for (const b of W.buildings.values()) {
    const cx = b.x + (b.size - 1) / 2, cy = b.y + (b.size - 1) / 2, t = BT[b.type];
    if (!t) {
      if (b.type === 'I') addRadial(poll, cx, cy, 3 + b.level, 8 + b.level * 6);
      if (b.type === 'C' && b.level === 3) addRadial(lv, cx, cy, 3, 4);
      continue;
    }
    if (t.lv) addRadial(lv, cx, cy, t.lv.r, t.lv.a);
    if (t.poll) addRadial(poll, cx, cy, t.poll.r, t.poll.a);
    if (t.svc) addRadial(D.cov[t.svc], cx, cy, t.lv.r, 1.6);
  }
  for (let i = 0; i < N * N; i++) {
    lv[i] = clamp(lv[i] - poll[i] * 0.8, 0, 100);
    poll[i] = clamp(poll[i], 0, 100);
  }
}

function computeStats() {
  let pop = 0, jC = 0, jI = 0;
  const c = { R: 0, C: 0, I: 0, zoneR: 0, zoneC: 0, zoneI: 0, lvl3: 0, parks: 0, plants: 0, landmarks: 0, trees: 0, roads: D.roadList.length, types: {} };
  for (let i = 0; i < N * N; i++) { const z = W.zone[i]; if (z) c['zone' + ZKEY[z]]++; if (W.tree[i]) c.trees++; }
  let hSum = 0, hW = 0;
  for (const b of W.buildings.values()) {
    c.types[b.type] = (c.types[b.type] || 0) + 1;
    const t = BT[b.type];
    if (t) { if (t.park) c.parks++; if (t.power) c.plants++; if (t.landmark) c.landmarks++; continue; }
    c[b.type]++; if (b.level === 3) c.lvl3++;
    const cap = ZONES[b.type].cap[b.level] * (b.powered ? 1 : 0.4);
    if (b.type === 'R') {
      pop += cap;
      const i = idx(b.x, b.y);
      hSum += (D.lv[i] + (b.powered ? 10 : -25) - D.poll[i] * 0.3) * cap; hW += cap;
    } else if (b.type === 'C') jC += cap; else jI += cap;
  }
  S.pop = Math.round(pop); S.jobsC = jC; S.jobsI = jI; S.counts = c;
  const base = hW ? hSum / hW : 60;
  S.happiness = clamp(Math.round(base + (7 - W.taxRate) * 2.5 + 8), 0, 100);
}

function computeDemand() {
  const jobs = S.jobsC + S.jobsI;
  const taxEff = (W.taxRate - 7) * 0.06;
  const happyEff = (S.happiness - 55) / 140;
  const targetPop = jobs * 2.9 + 80;
  S.demand.R = clamp((targetPop - S.pop) / Math.max(80, targetPop * 0.25) - taxEff + happyEff, -1, 1);
  const tour = Math.min(60, S.tourism * 0.05);
  const wantC = S.pop * 0.16 + 6 + tour;
  S.demand.C = clamp((wantC - S.jobsC) / Math.max(8, wantC * 0.25) - taxEff, -1, 1);
  const wantI = S.pop * 0.22 + 10;
  S.demand.I = clamp((wantI - S.jobsI) / Math.max(10, wantI * 0.25) - taxEff, -1, 1);
}

function canLevelUp(b, i) {
  const z = ZONES[b.type], L = b.level + 1;
  if (L > 3 || W.tier < z.tierReq[L]) return false;
  if (b.type === 'I') return true;
  return D.lv[i] >= z.lvReq[L];
}

function growthStep() {
  let built = 0, upgraded = 0;
  S.needRoad = 0; S.needPower = 0;
  const now = performance.now();
  for (let i = 0; i < N * N; i++) {
    D.needs[i] = 0;
    const z = W.zone[i]; if (!z) continue;
    const zk = ZKEY[z], dem = S.demand[zk], bid = W.bld[i];
    if (bid < 0) {
      if (!D.roadNear[i]) { D.needs[i] = 1; S.needRoad++; continue; }
      if (!D.powered[i]) { D.needs[i] = 2; S.needPower++; continue; }
      if (dem <= 0 || built >= 8) continue;
      if (Math.random() < 0.05 + 0.22 * dem) {
        const b = createBuilding(zk, i % N, (i / N) | 0, 1);
        built++; FX.construct(b);
      }
    } else {
      const b = W.buildings.get(bid);
      if (!b || b.type !== zk) continue;
      if (!b.powered) { D.needs[i] = 2; S.needPower++; continue; }
      if (b.level >= 3 || dem < 0.05 || upgraded >= 5) continue;
      if (canLevelUp(b, i) && Math.random() < 0.015 + 0.05 * dem) {
        b.level++; b.variant = Math.floor(Math.random() * 1000); b.born = now; upgraded++;
        D.dirty = D.lvDirty = true; FX.construct(b, true);
      }
    }
  }
  if (built) Sound.play('grow');
  if (upgraded) Sound.play('levelup');
}

function simStep() {
  if (D.dirty) { refreshRoadList(); recomputeRoadNear(); recomputePower(); D.dirty = false; }
  if (D.lvDirty || Math.random() < 0.2) { recomputeLandValue(); D.lvDirty = false; }
  computeStats();
  computeDemand();
  growthStep();
  Quests.check();
  checkTier();
}

function computeBudget() {
  let svc = 0, pw = 0, tour = 0;
  for (const b of W.buildings.values()) {
    const t = BT[b.type]; if (!t) continue;
    if (t.power) pw += t.upkeep || 0; else svc += t.upkeep || 0;
    if (t.tourism) tour += t.tourism;
  }
  S.taxR = Math.round(S.pop * 0.16 * W.taxRate);
  S.taxB = Math.round((S.jobsC + S.jobsI) * 0.22 * W.taxRate);
  S.tourism = tour; S.upkeepSvc = svc; S.upkeepPower = pw; S.upkeepRoads = Math.round(D.roadList.length * 0.25);
  S.income = S.taxR + S.taxB + S.tourism;
  S.expense = svc + pw + S.upkeepRoads;
  S.net = S.income - S.expense;
}

function monthTick() {
  computeBudget();
  if (W.mode !== 'creative') {
    W.money += S.net;
    if (S.net > 0 && S.pop > 0) FX.taxCoins(S.net);
    if (W.money < 300 && S.net <= 50 && S.pop < 300 && !W.flags.allowanceGiven) {
      W.flags.allowanceGiven = true; W.money += 3000;
      UI.say(`Uh oh, we're almost out of money! Good news: ${PERSONAL.dad} sent an emergency allowance of $3,000. Tip: more homes and shops = more taxes!`, 'dog');
    }
    if (W.money < 0 && !W.flags.brokeWarned) { W.flags.brokeWarned = true; UI.say('We spent more than we have! Try raising taxes a little (💰 Budget) or bulldoze things we do not need.', 'dog'); }
    if (W.money > 0) W.flags.brokeWarned = false;
  }
  W.month++;
  if (W.month >= 12) { W.month = 0; W.year++; UI.toast(`🎆 Happy New Year ${W.year}!`); FX.fireworksShow(6, 4); }
  News.monthly();
}

function simUpdate(dt) {
  W.playTime += dt;
  S.stepAcc += dt;
  let n = 0;
  while (S.stepAcc >= 1 && n < 4) { S.stepAcc -= 1; simStep(); n++; }
  if (S.stepAcc > 4) S.stepAcc = 0;
  S.monthAcc += dt;
  if (S.monthAcc >= MONTH_SECONDS) { S.monthAcc -= MONTH_SECONDS; monthTick(); }
  W.tod = (W.tod + dt / DAY_SECONDS) % 1;
}

function checkTier() {
  let t = 0;
  for (let i = 0; i < TIERS.length; i++) if (S.pop >= TIERS[i].pop) t = i;
  if (t > W.tier) { W.tier = t; UI.celebrateTier(t); }
}

// time of day helpers
function sunHeight() { return -Math.cos(W.tod * Math.PI * 2); }
function nightFactor() {
  if (!W.terrain) return 0;
  const n = smoothstep(0.02, -0.42, sunHeight());
  // during celebrations the sky dims so the fireworks really pop
  const c = typeof Game !== 'undefined' && Game.celebrate > 0 ? clamp(Math.min(Game.celebrate, 10 - Game.celebrate) / 1.5, 0, 1) * 0.72 : 0;
  return Math.max(n, c);
}
function duskFactor() { return W.terrain ? clamp(1 - Math.abs(sunHeight() + 0.12) / 0.32, 0, 1) : 0; }
