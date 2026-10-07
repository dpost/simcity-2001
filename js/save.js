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

  save(slot = Game.slot) {
    if (slot == null || Game.state !== 'play') return false;
    const meta = { cityName: W.cityName, pop: S.pop, tier: W.tier, mode: W.mode, date: `${MONTHS[W.month]}, Year ${W.year}`, savedAt: Date.now() };
    const data = {
      v: 1, seed: W.seed, mode: W.mode, cityName: W.cityName, money: W.mode === 'creative' ? null : Math.round(W.money),
      taxRate: W.taxRate, month: W.month, year: W.year, tod: W.tod, tier: W.tier, playTime: W.playTime,
      quest: W.quest, flags: W.flags, nextId: W.nextId,
      terrain: this.enc(W.terrain), tree: this.enc(W.tree), road: this.enc(W.road), zone: this.enc(W.zone),
      buildings: [...W.buildings.values()].map((b) => [b.id, b.type, b.x, b.y, b.level, b.variant]),
    };
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
    if (!data) return false;
    for (const k in W) delete W[k];
    Object.assign(W, {
      version: 1, seed: data.seed, mode: data.mode, cityName: data.cityName,
      money: data.mode === 'creative' ? Infinity : data.money, taxRate: data.taxRate, month: data.month, year: data.year,
      tod: data.tod, tier: data.tier, playTime: data.playTime || 0, quest: data.quest || { tut: 0, active: [], done: 0, history: [] },
      flags: data.flags || {}, nextId: data.nextId,
      terrain: this.dec(data.terrain), tree: this.dec(data.tree), road: this.dec(data.road), zone: this.dec(data.zone),
      bld: new Int32Array(N * N).fill(-1), buildings: new Map(),
    });
    if (!W.quest.history) W.quest.history = [];
    for (const [id, type, x, y, level, variant] of data.buildings) {
      W.buildings.set(id, { id, type, x, y, size: bSize(type), level, variant, born: 0, powered: false });
    }
    initDerived();
    return true;
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
