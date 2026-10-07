'use strict';
// Small math / color / formatting helpers shared by every other file.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function parseColor(c) {
  if (c[0] === '#') {
    let h = c.slice(1);
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = c.match(/[\d.]+/g);
  return [+m[0], +m[1], +m[2]];
}
const rgbStr = (r, g, b, a) => (a === undefined ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`);
// f > 0 lightens toward white, f < 0 darkens toward black
function shade(c, f) {
  const [r, g, b] = parseColor(c);
  if (f >= 0) return rgbStr(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
  return rgbStr(r * (1 + f), g * (1 + f), b * (1 + f));
}
function mix(c1, c2, t) {
  const a = parseColor(c1), b = parseColor(c2);
  return rgbStr(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
}
function alpha(c, a) { const [r, g, b] = parseColor(c); return rgbStr(r, g, b, a); }

function fmtMoney(n) {
  if (!isFinite(n)) return '∞';
  const s = '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
  return n < 0 ? '-' + s : s;
}
const fmtNum = (n) => Math.round(n).toLocaleString('en-US');
function niceRound(n) {
  const p = Math.pow(10, Math.max(1, Math.floor(Math.log10(Math.max(n, 1))) - 1));
  return Math.ceil(n / (p * 5)) * p * 5;
}

// Smooth value noise for terrain generation
function makeNoise(seed) {
  const r = mulberry32(seed), S = 17, G = new Float32Array(S * S);
  for (let i = 0; i < G.length; i++) G[i] = r();
  const at = (a, b) => G[(((b % S) + S) % S) * S + (((a % S) + S) % S)];
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(at(xi, yi), at(xi + 1, yi), u), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), u), v);
  };
}
const fbm = (nz, x, y) => nz(x, y) * 0.6 + nz(x * 2 + 5.3, y * 2 + 1.7) * 0.3 + nz(x * 4 + 9.1, y * 4 + 3.3) * 0.1;

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
