'use strict';
// =====================================================================
//  Everything on top of the map: top bar, toolbar, panels, menus, title
// =====================================================================
const $ = (id) => document.getElementById(id);
const CITY_NAMES = [PERSONAL.defaultCityName, `${NICK1} Bay`, `${PERSONAL.dog}ville`, `${PERSONAL.cat}burg`, 'Cupcake Falls', 'Sprinkle City', `New ${PERSONAL.mayor}`, `${NICK2} Springs`, 'Puppy Harbor', 'Starlight Hills', 'Marshmallow Meadows', `Port ${PERSONAL.mayor}`];
const TIER_LINES = [
  '',
  `We're a TOWN now! Skyscrapers can grow now too, if the land is nice enough. My Dog Park, schools and playgrounds are unlocked. Check ⭐ Landmarks!`,
  `A real CITY! Hospitals, big parks, ${POSS(PERSONAL.cat)} Cat Café and the Giant Cupcake Tower are unlocked!`,
  `BIG CITY! The Space Center, the Zoo, the Observatory and Fusion power are ready. ROCKETS!!`,
  `METROPOLIS! You can build the Candy Castle... and a golden Statue of YOU!`,
  `MEGALOPOLIS! The Sky Tower is unlocked. You are officially the greatest mayor in history! 🏆`,
];

const UI = {
  shown: { pop: 0, money: 0 }, flyGroup: null, sayQ: [], sayTimer: 0, saying: false, infoT: 0, miniT: 0, portraits: {},

  init() {
    this.portraits.dog = portrait('dog'); this.portraits.cat = portrait('cat');
    $('questDog').src = this.portraits.dog;
    document.querySelector('.dogname').textContent = PERSONAL.dog;
    const tb = $('toolbar');
    for (const t of TOOLBAR) {
      const b = document.createElement('button');
      b.className = 'tool'; b.dataset.tool = t.id; b.title = t.tip || t.label;
      b.innerHTML = `<span class="ti">${t.icon}</span><span class="tl">${t.label}</span><span class="tk">${t.key}</span>`;
      b.addEventListener('click', () => { Sound.init(); this.clickTool(t.id); });
      tb.appendChild(b);
    }
    document.querySelectorAll('#speedBtns button').forEach((b) => b.addEventListener('click', () => { Sound.init(); Sound.play('click'); this.setSpeed(+b.dataset.speed); }));
    document.querySelectorAll('#overlayBtns button').forEach((b) => b.addEventListener('click', () => { Sound.play('click'); this.setOverlay(b.dataset.ov || null); }));
    $('musicBtn').addEventListener('click', () => { Sound.init(); Sound.play('click'); this.openJukebox(); });
    $('sfxBtn').addEventListener('click', () => { Sound.init(); Sound.setSfx(!Sound.sfxOn); this.syncAudio(); this.savePrefs(); Sound.play('click'); });
    $('menuBtn').addEventListener('click', () => { Sound.play('click'); this.openMenu(); });
    $('moneyBtn').addEventListener('click', () => { Sound.play('click'); this.openBudget(); });
    $('cityBtn').addEventListener('click', () => { Sound.play('click'); this.openRename(); });
    $('walletBtn').addEventListener('click', () => { Sound.play('click'); MyStuff.open(); });
    $('walkStuff').addEventListener('click', () => { Sound.play('click'); MyStuff.open(); });
    $('walkStop').addEventListener('click', () => { Sound.play('click'); Life.toggleWalk(false); });
    const hc = $('homeCanvas');
    hc.addEventListener('pointerdown', (e) => Home.pointer(e, 'down'));
    hc.addEventListener('pointermove', (e) => Home.pointer(e, 'move'));
    hc.addEventListener('contextmenu', (e) => e.preventDefault());
    addEventListener('resize', () => { if (Home.isOpen) Home.resize(); });
    $('advisor').addEventListener('click', () => this.nextSay(true));
    $('minimap').addEventListener('pointerdown', (e) => this.miniClick(e));
    $('minimap').addEventListener('pointermove', (e) => { if (e.buttons) this.miniClick(e); });
    $('modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') this.closeModal(); });
    this.loadPrefs();
    this.syncTools();
  },

  // ---------------- prefs ----------------
  loadPrefs() {
    try { const p = JSON.parse(localStorage.getItem('mayorNelly.prefs') || '{}'); if (p.music === false) Sound.musicOn = false; if (p.sfx === false) Sound.sfxOn = false; } catch (e) { /* ignore */ }
    this.syncAudio();
  },
  savePrefs() { try { localStorage.setItem('mayorNelly.prefs', JSON.stringify({ music: Sound.musicOn, sfx: Sound.sfxOn })); } catch (e) { /* ignore */ } },
  syncAudio() { $('musicBtn').classList.toggle('off', !Sound.musicOn); $('sfxBtn').classList.toggle('off', !Sound.sfxOn); },

  // ---------------- tools ----------------
  clickTool(id) {
    const t = TOOLBAR.find((x) => x.id === id);
    Sound.play('click');
    if (id === 'walk') { Life.toggleWalk(); return; }
    if (Life.walking) Life.toggleWalk(false);
    if (t.special) {
      if (this.flyGroup === id) { this.closeFlyout(); return; }
      this.flyGroup = id; Input.setTool('inspect'); this.renderFlyout(); this.syncTools(); return;
    }
    if (t.group) {
      if (this.flyGroup === id) { this.closeFlyout(); return; }
      this.flyGroup = id; this.renderFlyout();
      const cur = Input.placeType();
      if (!cur || !t.group.includes(cur)) Input.setTool(id, null);
    } else { this.closeFlyout(); Input.setTool(id); }
    this.syncTools();
  },
  syncTools() {
    document.querySelectorAll('.tool').forEach((b) => b.classList.toggle('on', Life.walking ? b.dataset.tool === 'walk' : (b.dataset.tool === Input.tool || b.dataset.tool === this.flyGroup)));
    const q = W.quest && W.quest.active[0];
    document.querySelectorAll('.tool').forEach((b) => b.classList.toggle('hint', !!(q && q.tool === b.dataset.tool && Input.tool !== q.tool && this.flyGroup !== q.tool)));
  },
  closeFlyout() { this.flyGroup = null; $('flyout').classList.add('hidden'); if (Input.tool !== 'inspect' && !Input.placeType() && TOOLBAR.find((t) => t.id === Input.tool && t.group)) Input.setTool('inspect'); this.syncTools(); },
  closeFlyoutIfNoTool() { if (this.flyGroup && !Input.placeType()) this.closeFlyout(); },
  renderFlyout() {
    const id = this.flyGroup, el = $('flyout');
    if (!id) return;
    const t = TOOLBAR.find((x) => x.id === id);
    el.innerHTML = `<h4>${t.icon} ${t.label}</h4>`;
    if (id === 'disasters') { this.renderDisasters(el); return; }
    for (const k of t.group) {
      const bt = BT[k], locked = !isUnlocked(k), built = bt.landmark && hasLandmark(k);
      const c = document.createElement('button');
      c.className = 'card' + (Input.sub === k ? ' on' : '') + (locked ? ' locked' : '') + (built ? ' built' : '');
      c.appendChild(this.thumb(k));
      const info = document.createElement('div');
      info.innerHTML = `<div class="cn">${escapeHtml(bt.name)}</div><div class="cd">${escapeHtml(bt.desc)}</div>` +
        (locked ? `<div class="lk">🔒 Unlocks at ${TIERS[bt.tier].name} (${fmtNum(TIERS[bt.tier].pop)} people)</div>` : built ? '<div class="cc">✅ Built!</div>' :
          `<div class="cc">${fmtMoney(price(bt.cost))}${bt.upkeep ? ` <span style="color:#8a7a99;font-weight:500">· ${fmtMoney(price(bt.upkeep))}/mo</span>` : ''}${bt.power ? ` · ⚡${bt.power}` : ''}${bt.tourism ? ` · 🎟️ +${fmtMoney(bt.tourism)}/mo` : ''}</div>`);
      c.appendChild(info);
      c.addEventListener('click', () => {
        if (locked) { Sound.play('error'); this.toast(`🔒 Grow to a ${TIERS[bt.tier].name} to unlock this!`); return; }
        if (built) { Sound.play('error'); this.toast('You already built this one!'); return; }
        Sound.play('select'); Input.setTool(id, k); this.renderFlyout(); this.syncTools();
      });
      el.appendChild(c);
    }
    el.classList.remove('hidden');
  },
  renderDisasters(el) {
    const tog = document.createElement('button');
    tog.className = 'card'; tog.innerHTML = `<div style="font-size:28px">${Dis.randomOn ? '🎲' : '🚫'}</div><div><div class="cn">Surprise disasters: ${Dis.randomOn ? 'ON' : 'OFF'}</div><div class="cd">${Dis.randomOn ? 'Disasters can happen by surprise once you are a Town.' : 'No surprises. Only the ones you start yourself.'} Click to switch.</div></div>`;
    tog.onclick = () => { Dis.randomOn = !Dis.randomOn; Sound.play('click'); this.renderFlyout(); };
    el.appendChild(tog);
    for (const [k, d] of Object.entries(DISASTERS)) {
      const c = document.createElement('button');
      c.className = 'card' + (Input.tool === 'disaster' && Input.sub === k ? ' on' : '');
      c.innerHTML = `<div style="font-size:34px;width:56px;text-align:center">${d.icon}</div><div><div class="cn">${d.name}</div><div class="cd">${d.desc}</div></div>`;
      c.onclick = () => {
        if (Dis.active() && !d.aim) { this.toast('Wait until the current disaster is over!'); Sound.play('error'); return; }
        if (d.aim) { Input.setTool('disaster', k); Sound.play('select'); this.renderFlyout(); this.toast(`${d.icon} Now click on the map!`); R.cv.style.cursor = 'crosshair'; }
        else if (Dis.start(k, -1, -1)) this.closeFlyout();
      };
      el.appendChild(c);
    }
    const tip = document.createElement('div'); tip.innerHTML = this.moeTip('Fire stations put out fires, and rubble clears by itself after a while. You can also build right over it!'); el.appendChild(tip);
    el.classList.remove('hidden');
  },
  thumb(type) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 112;
    const g = cv.getContext('2d');
    if (type === 'tree') { const s = treeSprite(1); g.drawImage(s.cv, (112 - s.cv.width * 0.8) / 2, 112 - s.cv.height * 0.8, s.cv.width * 0.8, s.cv.height * 0.8); return cv; }
    const bt = BT[type], fake = { type, x: 0, y: 0, size: bt.size, level: 1, variant: 0, id: 1 };
    const spr = spriteFor(fake);
    const sc = Math.min(108 / spr.w, 108 / spr.h);
    const w = spr.w * sc, h = spr.h * sc, ox = (112 - w) / 2, oy = 112 - h - 2;
    g.drawImage(spr.cv, ox, oy, w, h);
    if (ANIM[type]) { g.save(); g.translate(ox + (spr.w / 2) * sc, oy + spr.height * sc); g.scale(sc, sc); ANIM[type](new Painter(g, bt.size), fake, 0.6, 0); g.restore(); }
    return cv;
  },

  updateWallet(pay) {
    $('statWallet').textContent = fmtMoney(Life.wallet);
    if (pay) { const el = $('walletBtn'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  },
  setSpeed(s) {
    if (s > 0) Game.lastSpeed = s;
    Game.speed = s;
    document.querySelectorAll('#speedBtns button').forEach((b) => b.classList.toggle('on', +b.dataset.speed === s));
  },
  setOverlay(o) {
    Game.overlay = o;
    document.querySelectorAll('#overlayBtns button').forEach((b) => b.classList.toggle('on', (b.dataset.ov || null) === o));
    const legend = { growth: '🏗️ Purple = skyscraper! · Green = ready to grow · Orange = needs a nicer spot (parks, trees, school) · Blue = city must grow first · Red = no power/road', power: '⚡ Yellow = has power · Red = no power', happy: '😊 Green = lovely place to live · Red = not nice', poll: '🌫️ Brown = smoky air. Keep homes away!', safety: '🛡️ Blue = near police, fire, school or hospital' };
    $('overlayLegend').textContent = o ? legend[o] : '';
  },

  // ---------------- top bar ----------------
  update(dt) {
    if (Game.state !== 'play') return;
    const ease = 1 - Math.pow(0.002, dt);
    this.shown.pop = Math.abs(this.shown.pop - S.pop) < 1 ? S.pop : lerp(this.shown.pop, S.pop, ease);
    $('statPop').textContent = fmtNum(this.shown.pop);
    if (W.mode === 'creative') $('statMoney').textContent = '∞';
    else { this.shown.money = Math.abs(this.shown.money - W.money) < 1 ? W.money : lerp(this.shown.money, W.money, ease); $('statMoney').textContent = fmtMoney(this.shown.money); }
    const net = $('statNet');
    if (W.mode !== 'creative' && S.income + S.expense > 0) { net.textContent = (S.net >= 0 ? '+' : '') + fmtMoney(S.net) + '/mo'; net.className = S.net >= 0 ? 'pos' : 'neg'; } else net.textContent = '';
    $('statHappy').textContent = S.happiness + '%';
    $('statWallet').textContent = fmtMoney(Life.wallet);
    $('statHappyIco').textContent = S.happiness >= 75 ? '😄' : S.happiness >= 55 ? '🙂' : S.happiness >= 40 ? '😐' : '🙁';
    for (const z of ['R', 'C', 'I']) {
      const f = document.querySelector(`.rci-bar[data-z="${z}"] .fill`), d = S.demand[z];
      f.style.height = Math.abs(d) * 50 + '%'; f.style.bottom = d >= 0 ? '50%' : 50 - Math.abs(d) * 50 + '%'; f.style.opacity = d >= 0 ? 1 : 0.45;
    }
    $('statPower').textContent = `${fmtNum(S.powerUse)}/${fmtNum(S.powerCap)}`;
    $('powerStat').classList.toggle('warn', S.shortage);
    const night = nightFactor();
    $('timeIco').textContent = night > 0.5 ? '🌙' : duskFactor() > 0.4 ? '🌅' : '🌞';
    $('statDate').textContent = `${SEASONS[SEASON].icon} ${MONTHS[W.month]}, Year ${W.year}`;
    $('cityName').textContent = W.cityName;
    $('tierBadge').textContent = `${TIERS[W.tier].icon} ${TIERS[W.tier].name}`;
    this.miniT -= dt;
    if (this.miniT <= 0) { this.miniT = 0.5; this.drawMinimap(); }
    this.infoT -= dt;
    if (this.infoT <= 0 && Input.selected) { this.infoT = 0.5; if (W.buildings.has(Input.selected.id)) this.showInfo(Input.selected); else { Input.selected = null; this.hideInfo(); } }
    if (this.saying) { this.sayTimer -= dt; if (this.sayTimer <= 0 || (this.staleSay(this.current) && this.sayTimer < 9)) this.nextSay(); }
  },

  // ---------------- minimap ----------------
  miniColor(i) {
    if (W.road[i]) return '#6b7280';
    const bid = W.bld[i];
    if (bid >= 0) { const b = W.buildings.get(bid); if (BT[b.type]) return BT[b.type].landmark ? '#ff5d8f' : BT[b.type].park ? '#2fa84f' : '#9b7bd8'; return ZONES[b.type].color; }
    if (W.zone[i]) return alpha(ZONES[ZKEY[W.zone[i]]].color, 0.5);
    if (W.terrain[i] === T_WATER) return '#3d9ad6';
    if (W.tree[i]) return '#4a9e3c';
    return W.terrain[i] === T_SAND ? '#e8d48f' : '#86c860';
  },
  drawMiniInto(cv, colorOf) {
    const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { g.fillStyle = colorOf(idx(x, y)); g.fillRect((x - y) * 1.5 + 96 - 1.5, (x + y) * 0.75 + 2, 3, 1.6); }
  },
  drawMinimap() {
    const cv = $('minimap');
    this.drawMiniInto(cv, (i) => this.miniColor(i));
    const g = cv.getContext('2d');
    const [ax, ay] = screenToWorld(0, 0), [bx, by] = screenToWorld(R.w, R.h);
    const m = (X, Y) => [X / 32 * 1.5 + 96, Y / 16 * 0.75 + 2];
    const [x0, y0] = m(ax, ay), [x1, y1] = m(bx, by);
    g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
  },
  miniClick(e) {
    const r = $('minimap').getBoundingClientRect();
    const mx = (e.clientX - r.left) * (192 / r.width), my = (e.clientY - r.top) * (100 / r.height);
    Cam.x = (mx - 96) / 1.5 * 32; Cam.y = (my - 2) / 0.75 * 16; Cam.anchor = null; clampCamera();
  },

  // ---------------- quests ----------------
  renderQuests() {
    const el = $('questList'); el.innerHTML = '';
    for (const q of W.quest.active) {
      const d = document.createElement('div'); d.className = 'quest';
      d.innerHTML = `<div class="qt"><span>${escapeHtml(q.title)}</span><span class="qr">${W.mode === 'creative' ? '' : '+' + fmtMoney(Quests.rewardOf(q))}</span></div><div class="qbar"><div></div></div><div class="qn"></div>`;
      d.addEventListener('click', () => { Sound.play('click'); this.say(q.text, 'dog'); if (q.tool) this.clickTool(q.tool); });
      d._q = q; el.appendChild(d);
    }
    this.updateQuestProgress(); this.syncTools();
  },
  updateQuestProgress() {
    document.querySelectorAll('#questList .quest').forEach((d) => {
      const q = d._q, p = Quests.progress(q);
      d.querySelector('.qbar div').style.width = (p / q.goal) * 100 + '%';
      d.querySelector('.qn').textContent = q.kind === 'happy' ? `${S.happiness}% / ${q.goal}%` : q.kind === 'income' ? `${fmtMoney(S.net)} / ${fmtMoney(q.goal)}` : `${fmtNum(p)} / ${fmtNum(q.goal)}`;
    });
  },

  // ---------------- advisor ----------------
  say(text, who = 'dog', tag = null) {
    if (Game.state !== 'play') return;
    if (this.sayQ.some((s) => s.text === text)) return;
    this.sayQ.push({ text, who, tag });
    if (!this.saying) this.nextSay();
  },
  staleSay(s) { return s && s.tag && !W.quest.active.some((q) => q.id === s.tag); },
  nextSay(clicked) {
    while (this.staleSay(this.sayQ[0])) this.sayQ.shift();
    const s = this.sayQ.shift();
    if (!s) { this.saying = false; $('advisor').classList.add('hidden'); return; }
    if (clicked && !this.sayQ.length && $('advisor').classList.contains('hidden')) return;
    this.saying = true;
    const el = $('advisor'); el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden');
    $('advisorImg').src = this.portraits[s.who];
    $('advisorName').textContent = s.who === 'cat' ? `${PERSONAL.cat} the Cat` : `${PERSONAL.dog}, Chief Advisor`;
    $('advisorText').textContent = s.text; this.current = s;
    this.sayTimer = s.tag ? 60 : clamp(s.text.split(' ').length * 0.75, 12, 28);
    Sound.play(s.who === 'cat' ? 'meow' : 'woof');
  },

  // ---------------- small stuff ----------------
  toast(text) {
    if (Game.state !== 'play') return;
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = text;
    const box = $('toasts'); box.appendChild(el);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, 3200);
  },
  setTicker(text) { const el = $('tickerText'); el.textContent = text; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; },
  tooltip(html, x, y) {
    const el = $('tooltip');
    if (!html) { el.classList.add('hidden'); return; }
    el.innerHTML = html; el.classList.remove('hidden');
    el.style.left = Math.min(x, innerWidth - el.offsetWidth - 20) + 'px'; el.style.top = Math.min(y, innerHeight - 60) + 'px';
  },

  // ---------------- inspect panel ----------------
  showInfo(b, tx, ty) {
    const el = $('infoPanel');
    const row = (a, c) => `<div class="row"><span>${a}</span><span>${c}</span></div>`;
    let h = '<button class="close" title="Close">✕</button>';
    if (b) {
      const t = BT[b.type], i = idx(b.x, b.y);
      if (!t) {
        const z = ZONES[b.type], cap = Math.round(z.cap[b.level] * (b.powered ? 1 : 0.4));
        h += `<h3>${z.icon} ${escapeHtml(buildingName(b))}</h3>`;
        h += row('Level', `<span class="stars">${'★'.repeat(b.level)}${'☆'.repeat(3 - b.level)}</span>`);
        h += row(b.type === 'R' ? '👥 Residents' : '💼 Jobs', fmtNum(cap));
        h += row('⚡ Power', b.powered ? '✅ Yes' : '❌ No power!');
        h += row('😊 Niceness here', `${Math.round(D.lv[i])} / 100`);
        const p = D.poll[i]; h += row('🌫️ Air', p < 8 ? 'Fresh 🌿' : p < 25 ? 'A bit smoky' : 'Very smoky 😷');
        if (b.level < 3) {
          const L = b.level + 1;
          let tip;
          if (!b.powered) tip = 'This building needs power to grow!';
          else if (W.tier < z.tierReq[L]) tip = `Can grow bigger once your city is a ${TIERS[z.tierReq[L]].name}.`;
          else if (b.type !== 'I' && D.lv[i] < z.lvReq[L]) tip = `To grow to level ${L}, this spot needs niceness ${z.lvReq[L]}+. Add parks, trees, a school or police nearby!`;
          else if (S.demand[b.type] < 0.05) tip = `Ready to grow! It will, once the city wants more ${z.name.toLowerCase()} (see the ${z.icon} bar).`;
          else tip = 'Growing soon! ✨';
          h += `<p class="tip">💡 ${tip}</p>`;
        } else h += '<p class="tip">🏆 Maximum level! This is as big as it gets.</p>';
      } else {
        h += `<h3>${t.icon} ${escapeHtml(t.name)}</h3><p>${escapeHtml(t.desc)}</p>`;
        if (t.power) { h += row('⚡ Makes power for', `${t.power} buildings`); h += row('City power use', `${fmtNum(S.powerUse)} / ${fmtNum(S.powerCap)}`); }
        if (t.tourism) h += row('🎟️ Tourists bring', `+${fmtMoney(t.tourism)}/month`);
        if (t.upkeep) h += row('🔧 Upkeep', `${fmtMoney(t.upkeep)}/month`);
        if (t.lv) h += row('😊 Makes land nicer', `${t.lv.r} tiles around`);
        if (t.poll) h += row('🌫️ Pollution', `${t.poll.r} tiles around`);
        if (!t.power && !t.park) h += row('⚡ Power', b.powered ? '✅ Yes' : '❌ No power!');
      }
      if (Dis.fire.has(b.id)) h += '<p class="tip" style="background:#ffe1e1;color:#c0392b">🔥 ON FIRE! Fire stations nearby help put it out.</p>';
      h += '<div class="acts">';
      if (b.type === 'space') h += `<button class="btn go" data-act="launch" ${b.launching ? 'disabled' : ''}>🚀 ${b.launching ? 'Rocket is flying!' : 'Launch rocket!'}</button>`;
      if (b.type === 'dogpark') h += '<button class="btn" data-act="woof">🐕 Say hi</button>';
      if (b.type === 'catcafe') h += '<button class="btn" data-act="meow">🐈 Pet the cat</button>';
      h += '<button class="btn danger" data-act="doze">🚜 Bulldoze</button></div>';
    } else {
      if (!inb(tx, ty)) return;
      const i = idx(tx, ty);
      if (Dis.rad[i]) h += `<h3>☢️ Radiation zone</h3><p class="tip">Nothing can be built here for about ${Math.ceil(Dis.rad[i] / 12 * 10) / 10} more years. It slowly fades away.</p>`;
      else if (Dis.rubble[i]) h += '<h3>🧱 Rubble</h3><p class="tip">Leftovers from a disaster. It clears by itself in a few months, or build right over it!</p>';
      else if (W.road[i]) h += `<h3>🛣️ ${W.terrain[i] === T_WATER ? 'Bridge' : 'Road'}</h3><p>Cars, buses and ice cream trucks drive here. Roads also carry power!</p>` + row('⚡ Power', D.powered[i] ? '✅ Connected' : '❌ Not connected');
      else if (W.zone[i]) {
        const z = ZONES[ZKEY[W.zone[i]]];
        const why = !D.roadNear[i] ? '🚗 Needs a road within 2 tiles!' : !D.powered[i] ? '⚡ Needs power! Connect it to a power plant.' : S.demand[ZKEY[W.zone[i]]] <= 0 ? `Waiting for the city to want more ${z.name.toLowerCase()}.` : '✨ A building will pop up soon!';
        h += `<h3>${z.icon} Empty ${z.name} zone</h3><p class="tip">${why}</p>`;
      } else if (W.terrain[i] === T_WATER) h += '<h3>💧 Water</h3><p>Homes near water are extra nice. You can build bridges with the Road tool!</p>';
      else if (W.tree[i]) h += '<h3>🌳 Trees</h3><p>Trees make the land around them nicer.</p>';
      else h += `<h3>${W.terrain[i] === T_SAND ? '🏖️ Beach' : '🌱 Grass'}</h3><p>Empty land, ready to build!</p>`;
      h += row('😊 Niceness here', `${Math.round(D.lv[i])} / 100`);
    }
    el.innerHTML = h; el.classList.remove('hidden');
    el.querySelector('.close').onclick = () => { Input.selected = null; this.hideInfo(); };
    el.querySelectorAll('[data-act]').forEach((btn) => btn.onclick = () => {
      const a = btn.dataset.act;
      if (a === 'launch') { FX.launchRocket(b); this.showInfo(b); }
      if (a === 'woof') { Sound.play('woof'); this.say(`That's me! Well, I visit a lot. For official advisor business. 🐾`, 'dog'); }
      if (a === 'meow') { Sound.play('meow'); this.say(pick(['Purrrr. You may continue. 😼', 'Meow. That is enough petting. ...Okay, a little more.', 'I am not cute. I am MAJESTIC.']), 'cat'); }
      if (a === 'doze') {
        if (BT[b.type] && BT[b.type].landmark && Input.confirmB !== b) { Input.confirmB = b; btn.textContent = '❗ Click again to confirm'; return; }
        const r = bulldoze(b.x, b.y); if (r && !r.fail) { Sound.play('bulldoze'); FX.construct(b); Input.selected = null; this.hideInfo(); if (BT[b.type] && BT[b.type].landmark) this.renderFlyout(); }
      }
    });
  },
  hideInfo() { $('infoPanel').classList.add('hidden'); },

  // ---------------- celebrations ----------------
  celebrateTier(t) {
    if (Game.state !== 'play') return;
    const tier = TIERS[t];
    Sound.play('tier'); Game.celebrate = 10; FX.fireworksShow(45, 9); FX.confetti(200);
    const unlocks = Object.entries(BT).filter(([, v]) => v.tier === t).map(([, v]) => `<div>${v.icon} ${escapeHtml(v.name)}</div>`);
    if (t === 1) unlocks.push('<div>🏢 Tall apartments &amp; shops</div>', '<div>🏭 Bigger factories</div>');
    if (t === 2) unlocks.push('<div>🏭 Giant factories</div>', '<div>🎈 Hot-air balloons &amp; blimps</div>');
    if (t === 3) unlocks.push('<div>✈️ Airplanes</div>');
    const el = $('banner');
    el.innerHTML = `<div class="banner-card"><div class="big">${tier.icon}</div><h1>${escapeHtml(W.cityName)} is now a ${tier.name}!</h1>
      <h2>${fmtNum(S.pop)} people live here. Amazing work, Mayor ${escapeHtml(PERSONAL.mayor)}!</h2>
      ${unlocks.length ? `<b>New things unlocked:</b><div class="unlocks">${unlocks.join('')}</div>` : ''}
      <button class="btn primary">Hooray! 🎉</button></div>`;
    el.classList.remove('hidden');
    const close = () => { el.classList.add('hidden'); clearTimeout(this._bt); };
    el.querySelector('button').onclick = () => { Sound.play('click'); close(); };
    el.onclick = (e) => { if (e.target === el) close(); };
    this._bt = setTimeout(close, 12000);
    this.say(TIER_LINES[t], 'dog');
    if (this.flyGroup) this.renderFlyout();
    Save.save();
  },

  // ---------------- modals ----------------
  modal(html) { $('modalCard').classList.remove('wide'); $('modalCard').innerHTML = html; $('modal').classList.remove('hidden'); },
  closeModal() { $('modal').classList.add('hidden'); $('modalCard').classList.remove('wide'); },
  modalOpen() { return !$('modal').classList.contains('hidden'); },
  closeTop() {
    if (Life.walking && !this.modalOpen()) { Life.toggleWalk(false); return true; }
    if (this.modalOpen()) { this.closeModal(); return true; }
    if (!$('banner').classList.contains('hidden')) { $('banner').classList.add('hidden'); return true; }
    if (!$('infoPanel').classList.contains('hidden')) { Input.selected = null; this.hideInfo(); return true; }
    if (this.flyGroup) { this.closeFlyout(); Input.setTool('inspect'); this.syncTools(); return true; }
    return false;
  },
  moeTip(text) { return `<div class="moe-tip"><img src="${this.portraits.dog}" alt=""><span>${text}</span></div>`; },

  openBudget() {
    const render = () => {
      computeBudget();
      const r = (a, b, cls = '') => `<div class="row ${cls}"><span>${a}</span><span>${b}</span></div>`;
      const creative = W.mode === 'creative';
      $('modalCard').innerHTML = `<h2>💰 City Budget</h2>
        ${creative ? '<p>Creative mode: money is unlimited! Taxes still change how happy people are.</p>' : ''}
        <div class="rows">
          <div class="section">Money coming in (every month)</div>
          ${r('🏠 Taxes from homes', '+' + fmtMoney(S.taxR))}${r('🏪 Taxes from businesses', '+' + fmtMoney(S.taxB))}${r('🎟️ Tourists at landmarks', '+' + fmtMoney(S.tourism))}
          <div class="section">Money going out</div>
          ${r('🚒 Services &amp; parks', '-' + fmtMoney(S.upkeepSvc))}${r('⚡ Power plants', '-' + fmtMoney(S.upkeepPower))}${r('🛣️ Fixing roads', '-' + fmtMoney(S.upkeepRoads))}
          ${r('Total per month', `<span class="${S.net >= 0 ? 'pos' : 'neg'}">${S.net >= 0 ? '+' : ''}${fmtMoney(S.net)}</span>`, 'total')}
        </div>
        <div class="section">Tax rate: <b id="taxVal">${W.taxRate}%</b></div>
        <input type="range" id="taxSlider" min="0" max="20" step="1" value="${W.taxRate}">
        ${this.moeTip('Low taxes make people want to move in. High taxes bring more money, but people get grumpy! 7% is just right.')}
        <div class="acts"><button class="btn primary" id="budgetOk">Done</button></div>`;
      $('taxSlider').oninput = (e) => { W.taxRate = +e.target.value; computeStats(); computeDemand(); render(); };
      $('budgetOk').onclick = () => { Sound.play('click'); this.closeModal(); };
    };
    $('modal').classList.remove('hidden'); render();
  },
  openJukebox() {
    const render = () => {
      const rows = SONGS.map((s, i) => `<button class="btn${Music.mode === i ? ' primary' : ''}" data-song="${i}">${['🌞', '🐕', '🏙️', '🌙'][i] || '🎵'} ${escapeHtml(s.name)}${Music.songIdx === i && Sound.musicOn ? ' <small>♪ playing</small>' : ''}</button>`).join('');
      $('modalCard').innerHTML = `<h2>🎶 Jukebox</h2><div class="menu-list">
        <button class="btn${Sound.musicOn ? ' go' : ''}" data-song="toggle">${Sound.musicOn ? '🔊 Music is ON (click to turn off)' : '🔇 Music is OFF (click to turn on)'}</button>
        <button class="btn${Music.mode === 'auto' ? ' primary' : ''}" data-song="auto">🔀 Play them all (shuffle)</button>${rows}</div>
        ${this.moeTip('These songs were made just for this city. My favorite is the one about me. Obviously.')}
        <div class="acts"><button class="btn primary" data-song="close">Done</button></div>`;
      $('modalCard').querySelectorAll('[data-song]').forEach((b) => b.onclick = () => {
        const v = b.dataset.song;
        if (v === 'close') { this.closeModal(); return; }
        if (v === 'toggle') { Sound.setMusic(!Sound.musicOn); this.syncAudio(); this.savePrefs(); }
        else { if (!Sound.musicOn) { Sound.setMusic(true); this.syncAudio(); this.savePrefs(); } Music.pickSong(v === 'auto' ? 'auto' : +v); }
        render();
      });
    };
    $('modal').classList.remove('hidden'); render();
  },
  openRename() {
    this.modal(`<h2>✏️ Rename your city</h2><input type="text" id="renameInput" maxlength="24" value="${escapeHtml(W.cityName)}">
      <div class="acts"><button class="btn" id="rnRandom">🎲 Random</button><button class="btn" id="rnCancel">Cancel</button><button class="btn primary" id="rnOk">Save name</button></div>`);
    const inp = $('renameInput'); inp.focus(); inp.select();
    const ok = () => { const v = inp.value.trim(); if (v) { W.cityName = v; Save.save(); } this.closeModal(); Sound.play('select'); };
    $('rnOk').onclick = ok; $('rnCancel').onclick = () => this.closeModal();
    $('rnRandom').onclick = () => { inp.value = pick(CITY_NAMES.filter((n) => n !== inp.value)); };
    inp.onkeydown = (e) => { if (e.key === 'Enter') ok(); };
  },
  openMenu() {
    this.modal(`<h2>☰ Menu</h2><div class="menu-list">
      <button class="btn" data-m="save">💾 Save city now</button>
      <button class="btn" data-m="download">📥 Download city file (to move to another computer)</button>
      <button class="btn" data-m="budget">💰 Budget &amp; taxes</button>
      <button class="btn" data-m="music">🎶 Jukebox (pick a song)</button>
      <button class="btn" data-m="help">❓ How to play</button>
      <button class="btn" data-m="title">🏠 Save &amp; go to main menu</button>
      </div><div class="acts"><button class="btn primary" data-m="close">Back to building</button></div>`);
    $('modalCard').querySelectorAll('[data-m]').forEach((b) => b.onclick = () => {
      Sound.play('click');
      const m = b.dataset.m;
      if (m === 'save') { if (Save.save()) { this.closeModal(); this.toast('💾 Saved!'); } }
      if (m === 'download') { Save.save(); Save.download(); this.closeModal(); this.toast('📥 City file downloaded! Open it on another computer with "Load a city".'); }
      if (m === 'budget') this.openBudget();
      if (m === 'help') this.openHelp();
      if (m === 'music') this.openJukebox();
      if (m === 'title') { Save.save(); this.closeModal(); showTitle(); }
      if (m === 'close') this.closeModal();
    });
  },
  openHelp() {
    this.modal(`<h2>❓ How to play</h2><ul>
      <li><b>🛣️ Roads first!</b> Drag to build them. Everything needs a road nearby.</li>
      <li><b>Zones:</b> paint 🏠 Homes, 🍦 Shops and 🏭 Factories next to roads. Buildings appear on their own!</li>
      <li><b>⚡ Power:</b> build a power plant touching a road. Power flows along roads and buildings.</li>
      <li><b>R C I bars</b> (top) show what the city wants. Tall bar = build more of that!</li>
      <li><b>😊 Make it nice:</b> parks, trees, schools and police help buildings grow into skyscrapers.</li>
      <li><b>🌫️ Factories are smoky.</b> Keep them away from homes.</li>
      <li><b>⭐ Landmarks</b> unlock as your city grows. Tourists pay to visit them!</li>
      <li><b>Moving around:</b> drag with 👆 Look (or right-drag with any tool), scroll to zoom, or use WASD / arrow keys.</li>
      <li><b>Keys:</b> 1-0 pick tools · Space pauses · Esc cancels.</li>
      </ul>${this.moeTip('If you get stuck, click a quest and I will explain it again. Woof!')}
      <div class="acts"><button class="btn primary" id="helpOk">Got it!</button></div>`);
    $('helpOk').onclick = () => { Sound.play('click'); this.closeModal(); };
  },
};

// =====================================================================
//  Title screen & menus
// =====================================================================
function logoHtml() {
  const letters = [...POSS(PERSONAL.mayor)].map((c, i) => `<span style="animation-delay:${i * 0.12}s">${escapeHtml(c)}</span>`).join('');
  return `<div class="logo"><span class="l1">Mayor</span><span class="l2">${letters}</span><span class="l3">City Builder</span></div>`;
}
function titleMain() {
  const last = Save.last(), m = last != null ? Save.meta(last) : null;
  let anySave = false; for (let i = 0; i < Save.SLOTS; i++) if (Save.meta(i)) anySave = true;
  $('title').innerHTML = `<div class="title-card">${logoHtml()}
    <div class="title-sub">Build the city of your dreams! 🏙️✨</div>
    <div class="title-buttons">
      ${m ? `<button class="btn go" id="tContinue">▶ Continue<small>${escapeHtml(m.cityName)} · ${fmtNum(m.pop)} people · ${m.mode === 'creative' ? 'Creative' : 'Career' + (m.difficulty ? ' · ' + DIFFICULTY[m.difficulty].name : '')}</small></button>` : ''}
      <button class="btn primary" id="tNew">✨ Start a new city</button>
      <button class="btn" id="tLoad">📂 Load a city<small>or open a city file from another computer</small></button>
    </div>
    <div class="credit">Made with ♥ for ${escapeHtml(PERSONAL.mayor)} by Dad</div></div>`;
  const on = (id, f) => { const e = $(id); if (e) e.onclick = () => { Sound.init(); Sound.play('select'); f(); }; };
  on('tContinue', () => continueGame(last));
  on('tNew', titleNew);
  on('tLoad', titleLoad);
}
function titleNew() {
  let seed = Math.floor(Math.random() * 1e9), mode = 'career', slot = null, difficulty = 'normal';
  for (let i = 0; i < Save.SLOTS; i++) if (!Save.meta(i)) { slot = i; break; }
  if (slot == null) slot = 0;
  const preview = { terrain: new Uint8Array(N * N), tree: new Uint8Array(N * N) };
  $('title').innerHTML = `<div class="panel"><h2>✨ New City</h2>
    <label class="lbl">What's your city called?</label>
    <div class="landrow"><input type="text" id="nName" maxlength="24" value="${escapeHtml(PERSONAL.defaultCityName)}"><button class="btn" id="nRand" title="Random name">🎲</button></div>
    <label class="lbl">How do you want to play?</label>
    <div class="modes">
      <button class="mode on" data-mode="career"><b>🏆 Career</b><span>Start small, earn money, finish quests and unlock bigger buildings!</span></button>
      <button class="mode" data-mode="creative"><b>🎨 Creative</b><span>Unlimited money and everything unlocked. Build anything you want!</span></button>
    </div>
    <div id="nDiffBox"><label class="lbl">How hard?</label><div class="slots" id="nDiff">${Object.entries(DIFFICULTY).map(([k, d]) => `<button class="slot${k === 'normal' ? ' on' : ''}" data-diff="${k}"><b>${d.icon} ${d.name}</b>Start with ${fmtMoney(d.money)}<br><span style="color:#6d5a7d">${d.desc}</span></button>`).join('')}</div></div>
    <label class="lbl">Pick your land</label>
    <div class="landrow"><canvas id="nLand" width="192" height="100"></canvas><div><button class="btn" id="nReroll">🎲 Try different land</button><p style="font-size:13px;color:#6d5a7d;margin:6px 0 0">Blue is water: rivers and lakes!</p></div></div>
    <label class="lbl">Save slot</label><div class="slots" id="nSlots"></div>
    <div class="acts" style="display:flex;justify-content:space-between;margin-top:16px"><button class="btn" id="nBack">← Back</button><button class="btn go" id="nGo" style="font-size:20px">Start building! 🚧</button></div></div>`;
  const drawLand = () => {
    genTerrain(seed, preview);
    UI.drawMiniInto($('nLand'), (i) => preview.terrain[i] === T_WATER ? '#3d9ad6' : preview.tree[i] ? '#4a9e3c' : preview.terrain[i] === T_SAND ? '#e8d48f' : '#86c860');
  };
  const drawSlots = () => {
    $('nSlots').innerHTML = '';
    for (let i = 0; i < Save.SLOTS; i++) {
      const m = Save.meta(i), b = document.createElement('button');
      b.className = 'slot' + (i === slot ? ' on' : '');
      b.innerHTML = m ? `<b>Slot ${i + 1}</b>${escapeHtml(m.cityName)}<br><span style="color:#e0457b">${i === slot ? '⚠️ will be replaced' : `${fmtNum(m.pop)} people`}</span>` : `<b>Slot ${i + 1}</b>Empty`;
      b.onclick = () => { Sound.play('click'); slot = i; drawSlots(); };
      $('nSlots').appendChild(b);
    }
  };
  drawLand(); drawSlots();
  document.querySelectorAll('.mode').forEach((b) => b.onclick = () => { Sound.play('click'); mode = b.dataset.mode; document.querySelectorAll('.mode').forEach((x) => x.classList.toggle('on', x === b)); $('nDiffBox').classList.toggle('hidden', mode === 'creative'); });
  document.querySelectorAll('[data-diff]').forEach((b) => b.onclick = () => { Sound.play('click'); difficulty = b.dataset.diff; document.querySelectorAll('[data-diff]').forEach((x) => x.classList.toggle('on', x === b)); });
  $('nRand').onclick = () => { Sound.play('click'); $('nName').value = pick(CITY_NAMES.filter((n) => n !== $('nName').value)); };
  $('nReroll').onclick = () => { Sound.play('click'); seed = Math.floor(Math.random() * 1e9); drawLand(); };
  $('nBack').onclick = () => { Sound.play('click'); titleMain(); };
  $('nGo').onclick = () => { Sound.play('place'); startNewGame({ name: $('nName').value.trim() || PERSONAL.defaultCityName, mode, slot, seed, difficulty }); };
}
function titleLoad() {
  let html = '<div class="panel"><h2>📂 Your cities</h2><div class="saves">';
  for (let i = 0; i < Save.SLOTS; i++) {
    const m = Save.meta(i);
    html += m ? `<div class="save-row"><div class="info"><b>${escapeHtml(m.cityName)}</b><div>${TIERS[m.tier] ? TIERS[m.tier].icon + ' ' + TIERS[m.tier].name : ''} · ${fmtNum(m.pop)} people · ${m.mode === 'creative' ? '🎨 Creative' : '🏆 Career'} · ${escapeHtml(m.date)}</div></div>
      <button class="btn danger" data-del="${i}">🗑️</button><button class="btn go" data-load="${i}">Play</button></div>`
      : `<div class="save-row"><div class="info"><b>Slot ${i + 1}</b><div>Empty</div></div></div>`;
  }
  html += '</div><div class="acts" style="display:flex;justify-content:space-between"><button class="btn" id="lBack">← Back</button><button class="btn primary" id="lUpload">📤 Open a city file…</button></div></div>';
  $('title').innerHTML = html;
  $('lBack').onclick = () => { Sound.play('click'); titleMain(); };
  $('lUpload').onclick = () => {
    Sound.play('click');
    Save.pickFile((data) => {
      if (!data) { alert("Hmm, that doesn't look like a city file."); return; }
      let slot = null; for (let i = 0; i < Save.SLOTS; i++) if (!Save.meta(i)) { slot = i; break; }
      if (slot == null) { const ans = prompt(`All 3 slots are full. Which slot should "${data.cityName}" replace? (1, 2 or 3)`, '1'); slot = parseInt(ans, 10) - 1; if (!(slot >= 0 && slot < Save.SLOTS)) return; }
      if (Save.storeImported(data, slot)) { Sound.play('quest'); continueGame(slot); } else alert('Could not store the city in this browser.');
    });
  };
  document.querySelectorAll('[data-load]').forEach((b) => b.onclick = () => { Sound.play('select'); continueGame(+b.dataset.load); });
  document.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => {
    if (b.dataset.sure) { Save.remove(+b.dataset.del); Sound.play('bulldoze'); titleLoad(); return; }
    b.dataset.sure = '1'; b.textContent = 'Delete?'; Sound.play('error');
  });
}
