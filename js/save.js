'use strict';
// =====================================================================
//  Saving: 3 city slots in the browser, with autosave
// =====================================================================
const Save = {
  SLOTS: 3,
  key: (s) => `mayorNelly.slot${s}`,
  metaKey: (s) => `mayorNelly.meta${s}`,
  enc: (arr) => Array.prototype.join.call(arr, ''),
  dec: (str) => Uint8Array.from(str, (ch) => ch.charCodeAt(0) - 48),

  serialize() {
    return {
      v: 2, game: 'mayor-nelly-city', seed: W.seed, mode: W.mode, difficulty: W.difficulty, cityName: W.cityName, money: W.mode === 'creative' ? null : Math.round(W.money),
      taxRate: W.taxRate, month: W.month, year: W.year, seasonT: W.seasonT, tod: W.tod, tier: W.tier, playTime: W.playTime,
      quest: W.quest, flags: W.flags, nextId: W.nextId,
      terrain: this.enc(W.terrain), tree: this.enc(W.tree), road: this.enc(W.road), zone: this.enc(W.zone),
      buildings: [...W.buildings.values()].map((b) => [b.id, b.type, b.x, b.y, b.level, b.variant]),
      extra: Save.extraSave(),
    };
  },
  extras: [], // other systems (disasters, life mode...) register {save(), load(data)} here
  extraSave() { const o = {}; for (const e of this.extras) o[e.key] = e.save(); return o; },
  metaOf() { return { cityName: W.cityName, pop: S.pop, tier: W.tier, mode: W.mode, difficulty: W.difficulty, date: `${SEASONS[SEASON].name}, Year ${W.year}`, savedAt: Date.now() }; },

  save(slot = Game.slot) {
    if (slot == null || Game.state !== 'play') return false;
    const meta = this.metaOf(), data = this.serialize();
    try {
      localStorage.setItem(this.key(slot), JSON.stringify(data));
      localStorage.setItem(this.metaKey(slot), JSON.stringify(meta));
      localStorage.setItem('mayorNelly.last', String(slot));
      return true;
    } catch (e) {
      UI.toast('⚠️ Could not save. Is browser storage turned off?');
      return false;
    }
  },

  load(slot) {
    let data;
    try { data = JSON.parse(localStorage.getItem(this.key(slot))); } catch (e) { data = null; }
    return data ? this.apply(data) : false;
  },
  apply(data) {
    if (!data || !data.terrain || !data.buildings) return false;
    for (const k in W) delete W[k];
    Object.assign(W, {
      version: 2, seed: data.seed, mode: data.mode, cityName: data.cityName, difficulty: data.difficulty || 'easy',
      money: data.mode === 'creative' ? Infinity : data.money, taxRate: data.taxRate, month: data.month, year: data.year,
      tod: data.tod, tier: data.tier, playTime: data.playTime || 0, quest: data.quest || { tut: 0, active: [], done: 0, history: [] },
      flags: data.flags || {}, nextId: data.nextId,
      terrain: this.dec(data.terrain), tree: this.dec(data.tree), road: this.dec(data.road), zone: this.dec(data.zone),
      bld: new Int32Array(N * N).fill(-1), buildings: new Map(),
      seasonT: data.seasonT ?? (SEASON_ORDER.indexOf(seasonOf(data.month || 0)) * SEASON_SECONDS + ((data.year || 1) - 1) * SEASON_SECONDS * 4),
    });
    if (!W.quest.history) W.quest.history = [];
    for (const [id, type, x, y, level, variant] of data.buildings) {
      W.buildings.set(id, { id, type, x, y, size: bSize(type), level, variant, born: 0, powered: false });
    }
    initDerived();
    for (const e of this.extras) e.load((data.extra || {})[e.key]);
    return true;
  },

  // ---- moving a city between computers ----
  download() {
    const data = this.serialize();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(W.cityName || 'city').replace(/[^\w\- ]+/g, '').trim() || 'city'}.city.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  pickFile(cb) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { let d = null; try { d = JSON.parse(r.result); } catch (e) { /* bad file */ } cb(d && d.terrain && d.buildings ? d : null); };
      r.readAsText(f);
    };
    inp.click();
  },
  storeImported(data, slot) {
    try {
      localStorage.setItem(this.key(slot), JSON.stringify(data));
      const m = { cityName: data.cityName, pop: 0, tier: data.tier || 0, mode: data.mode, difficulty: data.difficulty, date: `${MONTHS[data.month || 0]}, Year ${data.year || 1}`, savedAt: Date.now() };
      localStorage.setItem(this.metaKey(slot), JSON.stringify(m));
      return true;
    } catch (e) { return false; }
  },

  meta(slot) { try { return JSON.parse(localStorage.getItem(this.metaKey(slot))); } catch (e) { return null; } },
  remove(slot) { try { localStorage.removeItem(this.key(slot)); localStorage.removeItem(this.metaKey(slot)); } catch (e) { /* ignore */ } },
  last() {
    let s = null; try { s = localStorage.getItem('mayorNelly.last'); } catch (e) { /* ignore */ }
    if (s != null && this.meta(+s)) return +s;
    let best = null, t = 0;
    for (let i = 0; i < this.SLOTS; i++) { const m = this.meta(i); if (m && m.savedAt > t) { t = m.savedAt; best = i; } }
    return best;
  },
};
