'use strict';
// =====================================================================
//  LIFE MODE: walk around as Nelly (with Moe!), earn a mayor's salary,
//  visit shops, buy treats, clothes and furniture, and buy a home.
// =====================================================================

// ---------------- things you can buy ----------------
// kind: food (eat it now) · furn (goes to your home) · outfit / acc (wear it) · moe (for Moe) · fun (an experience)
const ITEMS = {
  // food
  cone: { name: 'Strawberry Cone', icon: '🍦', price: 4, kind: 'food', msg: 'Brain freeze! Totally worth it.' },
  mintcone: { name: 'Mint Chip Cone', icon: '🍨', price: 4, kind: 'food', msg: 'Minty fresh and super yummy!' },
  sundae: { name: 'Giant Sundae', icon: '🍨', price: 8, kind: 'food', msg: 'Three scoops, sprinkles AND a cherry!' },
  cupcake: { name: 'Sprinkle Cupcake', icon: '🧁', price: 3, kind: 'food', msg: 'So many sprinkles!' },
  donut: { name: `${POSS(PERSONAL.dad)} Famous Donut`, icon: '🍩', price: 2, kind: 'food', msg: `${PERSONAL.dad} says it's the best donut in town. He's right!` },
  cookie: { name: `${POSS(PERSONAL.grandma)} Chocolate Chip Cookies`, icon: '🍪', price: 3, kind: 'food', msg: `Warm and gooey, just like ${PERSONAL.grandma} makes! (${PERSONAL.dog} is staring at you. Very hard.)` },
  cake: { name: 'Party Cake', icon: '🎂', price: 15, kind: 'food', msg: 'PARTY TIME! 🎉', party: true },
  lollipop: { name: 'Giant Lollipop', icon: '🍭', price: 1, kind: 'food', msg: 'This will take about a week to finish.' },
  gummies: { name: 'Gummy Bears', icon: '🐻', price: 2, kind: 'food', msg: 'You saved the red ones for last.' },
  choco: { name: 'Chocolate Bar', icon: '🍫', price: 3, kind: 'food', msg: `Mmm. (Don't give any to ${PERSONAL.dog}! Chocolate is bad for dogs.)` },
  pizza: { name: 'Pizza Slice', icon: '🍕', price: 5, kind: 'food', msg: 'Extra cheesy!' },
  cocoa: { name: 'Hot Cocoa', icon: '☕', price: 3, kind: 'food', msg: 'Warm and cozy, with marshmallows!' },
  apple: { name: 'Shiny Apple', icon: '🍎', price: 1, kind: 'food', msg: 'Crunch! Healthy AND tasty.' },
  melon: { name: 'Watermelon Slice', icon: '🍉', price: 3, kind: 'food', msg: 'You spit the seeds really far.' },
  popcorn: { name: 'Popcorn', icon: '🍿', price: 4, kind: 'food', msg: 'Buttery!' },
  snack: { name: 'Bag of Chips', icon: '🥨', price: 2, kind: 'food', msg: 'Crunch crunch crunch.' },
  tour: { name: 'Chocolate Factory Tour', icon: '🏭', price: 6, kind: 'fun', msg: 'You saw the chocolate waterfall, a gummy bear machine, and got a free sample. Best tour ever!' },
  // furniture (w x d tiles in your room)
  bed: { name: 'Cozy Bed', icon: '🛏️', price: 120, kind: 'furn', w: 1, d: 2 },
  bunk: { name: 'Bunk Bed', icon: '🛏️', price: 260, kind: 'furn', w: 1, d: 2 },
  sofa: { name: 'Comfy Sofa', icon: '🛋️', price: 150, kind: 'furn', w: 2, d: 1 },
  armchair: { name: 'Armchair', icon: '💺', price: 60, kind: 'furn', w: 1, d: 1 },
  beanbag: { name: 'Beanbag', icon: '🟣', price: 45, kind: 'furn', w: 1, d: 1 },
  table: { name: 'Table', icon: '🍽️', price: 80, kind: 'furn', w: 1, d: 1 },
  chair: { name: 'Chair', icon: '🪑', price: 25, kind: 'furn', w: 1, d: 1 },
  desk: { name: 'Desk', icon: '🗄️', price: 100, kind: 'furn', w: 2, d: 1 },
  lamp: { name: 'Floor Lamp', icon: '💡', price: 30, kind: 'furn', w: 1, d: 1 },
  plant: { name: 'House Plant', icon: '🪴', price: 20, kind: 'furn', w: 1, d: 1 },
  flowers: { name: 'Flower Vase', icon: '💐', price: 15, kind: 'furn', w: 1, d: 1 },
  rug: { name: 'Round Rug', icon: '⭕', price: 40, kind: 'furn', w: 2, d: 2, flat: true },
  bookshelf: { name: 'Bookshelf', icon: '📚', price: 90, kind: 'furn', w: 1, d: 1 },
  wardrobe: { name: 'Wardrobe', icon: '🚪', price: 110, kind: 'furn', w: 1, d: 1 },
  tv: { name: 'Big TV', icon: '📺', price: 200, kind: 'furn', w: 1, d: 1 },
  console: { name: 'Game Console', icon: '🎮', price: 250, kind: 'furn', w: 1, d: 1 },
  computer: { name: 'Computer', icon: '💻', price: 300, kind: 'furn', w: 1, d: 1 },
  fridge: { name: 'Fridge', icon: '🧊', price: 180, kind: 'furn', w: 1, d: 1 },
  piano: { name: 'Piano', icon: '🎹', price: 500, kind: 'furn', w: 2, d: 1 },
  aquarium: { name: 'Fish Tank', icon: '🐠', price: 250, kind: 'furn', w: 2, d: 1 },
  fireplace: { name: 'Fireplace', icon: '🔥', price: 220, kind: 'furn', w: 2, d: 1 },
  dogbed: { name: `Dog Bed for ${PERSONAL.dog}`, icon: '🐶', price: 60, kind: 'furn', w: 1, d: 1 },
  cattower: { name: `Cat Tower for ${PERSONAL.cat}`, icon: '🐱', price: 70, kind: 'furn', w: 1, d: 1 },
  telescope: { name: 'Telescope', icon: '🔭', price: 400, kind: 'furn', w: 1, d: 1 },
  robot: { name: 'Robot Buddy', icon: '🤖', price: 800, kind: 'furn', w: 1, d: 1 },
  chocofountain: { name: 'Chocolate Fountain', icon: '⛲', price: 160, kind: 'furn', w: 1, d: 1 },
  disco: { name: 'Disco Ball', icon: '🪩', price: 150, kind: 'furn', w: 1, d: 1 },
  // clothes
  tee_pink: { name: 'Pink T-shirt', icon: '👚', price: 15, kind: 'outfit', shirt: '#ff6fa5' },
  tee_blue: { name: 'Blue T-shirt', icon: '👕', price: 15, kind: 'outfit', shirt: '#3fa9f5' },
  tee_purple: { name: 'Purple T-shirt', icon: '👚', price: 15, kind: 'outfit', shirt: '#9b6bff' },
  tee_green: { name: 'Green T-shirt', icon: '👕', price: 15, kind: 'outfit', shirt: '#3fb067' },
  hoodie: { name: 'Cozy Hoodie', icon: '🧥', price: 40, kind: 'outfit', shirt: '#ffb84d', hoodie: true },
  dress: { name: 'Rainbow Dress', icon: '👗', price: 90, kind: 'outfit', shirt: '#ff8fbd', dress: true },
  mayor: { name: 'Mayor Outfit with Sash', icon: '🎖️', price: 100, kind: 'outfit', shirt: '#3b3f6b', sash: true },
  astronaut: { name: 'Astronaut Suit', icon: '🧑‍🚀', price: 0, kind: 'outfit', shirt: '#f2f2f2', astro: true, hidden: true },
  cape: { name: 'Superhero Cape', icon: '🦸', price: 120, kind: 'acc', acc: 'cape' },
  shades: { name: 'Cool Sunglasses', icon: '🕶️', price: 25, kind: 'acc', acc: 'shades' },
  crown: { name: 'Sparkly Crown', icon: '👑', price: 500, kind: 'acc', acc: 'crown' },
  // for Moe
  moe_pink: { name: 'Pink Bandana for Moe', icon: '🩷', price: 15, kind: 'moe', moe: 'bandana', col: '#ff6fa5' },
  moe_blue: { name: 'Blue Bandana for Moe', icon: '💙', price: 15, kind: 'moe', moe: 'bandana', col: '#3fa9f5' },
  moe_flower: { name: 'Flower Crown for Moe', icon: '🌼', price: 25, kind: 'moe', moe: 'flowers' },
  moe_shades: { name: 'Tiny Sunglasses for Moe', icon: '😎', price: 20, kind: 'moe', moe: 'shades' },
  moe_cape: { name: 'Super Cape for Moe', icon: '🦸', price: 40, kind: 'moe', moe: 'cape' },
  toy: { name: 'Squeaky Toy', icon: '🦴', price: 5, kind: 'food', msg: `${PERSONAL.dog} squeaks it 400 times. She is VERY happy.` },
  // experiences
  movie: { name: 'Movie Ticket', icon: '🎟️', price: 8, kind: 'fun', msg: 'The movie was about a dog who becomes mayor. Five stars!' },
  museumtix: { name: 'Museum Ticket', icon: '🦕', price: 5, kind: 'fun', msg: 'Fun fact: a T-rex could eat about 500 pounds of food in one bite!' },
  zootix: { name: 'Zoo Ticket', icon: '🦒', price: 10, kind: 'fun', msg: 'The giraffe licked your hat. The penguins waved. Best day ever!' },
  stars: { name: 'Look Through the Telescope', icon: '🔭', price: 5, kind: 'fun', msg: 'You can see Saturn\'s rings! And maybe a tiny alien waving?' },
  rocket: { name: 'Ride a Rocket to Space!', icon: '🚀', price: 5000, kind: 'fun', msg: 'WHOOOOSH! You floated in space and saw the whole Earth! You got an Astronaut Suit!', rocket: true },
  wheel: { name: 'Ferris Wheel Ride', icon: '🎡', price: 3, kind: 'fun', msg: 'From the top you can see the whole city!', zoomOut: true },
  skyview: { name: 'Elevator to the Top', icon: '🗼', price: 10, kind: 'fun', msg: 'WOW. Everything looks so tiny from up here!', zoomOut: true },
  swim: { name: 'Swim Pass', icon: '🏊', price: 2, kind: 'fun', msg: 'Cannonball! SPLASH!' },
  skate: { name: 'Skate Rental', icon: '⛸️', price: 3, kind: 'fun', msg: 'You did a spin! (And only fell down twice.)' },
  fetch: { name: `Play Fetch with ${PERSONAL.dog}`, icon: '🎾', price: 0, kind: 'fun', msg: `${PERSONAL.dog} brought the ball back 37 times. She could do this all day!` },
  petcat: { name: `Pet ${PERSONAL.cat}`, icon: '🐈', price: 0, kind: 'fun', msg: `${PERSONAL.cat} purrs... then bites your finger gently. Classic ${PERSONAL.cat}.`, meow: true },
  statue: { name: 'Take a Selfie with the Statue', icon: '🤳', price: 0, kind: 'fun', msg: 'Two Mayor Nellys! One is golden.' },
};

const STORES = {
  icecream: { name: 'Ice Cream Shop', icon: '🍦', items: ['cone', 'mintcone', 'sundae'] },
  bakery: { name: 'Bakery', icon: '🧁', items: ['cupcake', 'cookie', 'donut', 'cake'] },
  pets: { name: 'Pet Shop', icon: '🐾', items: ['toy', 'moe_pink', 'moe_blue', 'moe_flower', 'moe_shades', 'moe_cape', 'dogbed', 'cattower', 'aquarium'] },
  candy: { name: 'Candy Shop', icon: '🍭', items: ['lollipop', 'gummies', 'choco'] },
  pizza: { name: 'Pizza Place', icon: '🍕', items: ['pizza', 'melon'] },
  general: { name: 'Snack Mart', icon: '🛒', items: ['snack', 'apple', 'choco', 'plant', 'flowers', 'lamp', 'chair', 'table', 'rug', 'bed', 'fridge'] },
  boutique: { name: 'Shopping Plaza', icon: '🛍️', items: ['tee_pink', 'tee_blue', 'tee_purple', 'tee_green', 'hoodie', 'dress', 'shades', 'cape', 'sofa', 'armchair', 'beanbag', 'wardrobe'] },
  books: { name: 'Book Café', icon: '📚', items: ['cocoa', 'cookie', 'bookshelf', 'desk', 'armchair'] },
  electronics: { name: 'Electronics Store', icon: '📺', items: ['tv', 'console', 'computer', 'disco'] },
  megamall: { name: 'Mega Mall', icon: '🏬', items: ['bunk', 'sofa', 'piano', 'fireplace', 'aquarium', 'dress', 'mayor', 'crown', 'hoodie', 'beanbag'] },
  tech: { name: 'Tech Tower Store', icon: '🤖', items: ['robot', 'computer', 'telescope', 'console'] },
  donut: { name: `${POSS(PERSONAL.dad)} Donut Diner`, icon: '🍩', items: ['donut', 'cocoa', 'cookie'] },
  catcafe: { name: `${POSS(PERSONAL.cat)} Cat Café`, icon: '🐈', items: ['petcat', 'cocoa', 'cupcake', 'cattower'] },
  cupcake: { name: 'Giant Cupcake Tower', icon: '🧁', items: ['cupcake', 'cake', 'sundae'] },
  dogpark: { name: `${POSS(PERSONAL.dog)} Dog Park`, icon: '🐕', items: ['fetch', 'toy', 'moe_pink', 'moe_flower'] },
  zoo: { name: BT.zoo.name, icon: '🦒', items: ['zootix', 'popcorn'] },
  space: { name: BT.space.name, icon: '🚀', items: ['rocket'] },
  observatory: { name: 'Star Observatory', icon: '🔭', items: ['stars', 'telescope'] },
  museum: { name: 'Museum', icon: '🦕', items: ['museumtix'] },
  cinema: { name: 'Movie Theater', icon: '🎬', items: ['movie', 'popcorn'] },
  chocofactory: { name: 'Chocolate Factory', icon: '🍫', items: ['tour', 'choco', 'cookie', 'cocoa', 'chocofountain'] },
  market: { name: 'Farmers Market', icon: '🍎', items: ['apple', 'melon', 'flowers', 'plant'] },
  ferris: { name: 'Ferris Wheel', icon: '🎡', items: ['wheel', 'popcorn'] },
  skytower: { name: BT.skytower.name, icon: '🗼', items: ['skyview'] },
  castle: { name: 'Candy Castle Shop', icon: '🏰', items: ['lollipop', 'gummies', 'crown', 'dress'] },
  statue: { name: BT.statue.name, icon: '🗽', items: ['statue'] },
  pool: { name: 'Swimming Pool', icon: '🏊', items: ['swim'] },
  icerink: { name: 'Ice Rink', icon: '⛸️', items: ['skate', 'cocoa'] },
};
function storeFor(b) {
  if (b.type === 'C') return [null, ['icecream', 'bakery', 'pets', 'candy', 'pizza'], ['general', 'boutique', 'books'], ['electronics', 'megamall', 'tech']][b.level][b.variant % ZDESIGNS.C[b.level]];
  if (b.type === 'I' && b.level === 1 && b.variant % 4 === 3) return 'chocofactory';
  if (b.type === 'I' && b.level === 2 && b.variant % 3 === 1) return 'chocofactory';
  return STORES[b.type] ? b.type : null;
}
function homePrice(b) { return Math.round([0, 800, 2500, 6000][b.level] * (0.8 + D.lv[idx(b.x, b.y)] / 100)); }

const SKINS_L = ['#f6d3b3', '#eab38a', '#c68642', '#8d5524', '#ffdfc4'];
const HAIRS = ['#3b2414', '#6b3e1f', '#c98a3a', '#f2d16b', '#1a1a1a', '#b5452c', '#ff8fc0', '#8a6bff'];
const HAIR_STYLES = ['ponytail', 'long', 'bob', 'buns', 'curly', 'short'];

const Life = {
  wallet: 300, look: { skin: 0, hair: 1, style: 'ponytail', shirt: '#ff6fa5', pants: '#3d4b8a', outfit: null, acc: [] },
  moeLook: null, owned: {}, inv: {}, homeId: null, room: { wall: 0, floor: 0, items: [] }, eaten: 0,
  walking: false, u: 0, v: 0, face: 'down', phase: 0, moving: false, moe: { u: 0, v: 0, trail: [] }, coins: [], near: null, coinT: 0,

  reset() {
    Object.assign(this, { wallet: 300, owned: {}, inv: {}, homeId: null, room: { wall: 0, floor: 0, items: [] }, moeLook: null, eaten: 0, walking: false, coins: [] });
    this.look = { skin: 0, hair: 1, style: 'ponytail', shirt: '#ff6fa5', pants: '#3d4b8a', outfit: null, acc: [] };
  },
  save() { return { wallet: this.wallet, look: this.look, moeLook: this.moeLook, owned: this.owned, inv: this.inv, homeId: this.homeId, room: this.room, eaten: this.eaten }; },
  load(d) {
    this.reset();
    if (!d) return;
    Object.assign(this, { wallet: d.wallet ?? 300, look: { ...this.look, ...(d.look || {}) }, moeLook: d.moeLook || null, owned: d.owned || {}, inv: d.inv || {}, homeId: d.homeId ?? null, room: d.room || this.room, eaten: d.eaten || 0 });
  },
  home() { const b = this.homeId != null ? W.buildings.get(this.homeId) : null; return b && b.type === 'R' ? b : null; },

  payday() {
    const pay = Math.round((60 + S.pop * 0.02 + S.happiness * 1.2) * (W.difficulty === 'hard' ? 0.7 : W.difficulty === 'easy' ? 1.3 : 1));
    this.wallet += pay;
    UI.updateWallet(pay);
    if (this.homeId != null && !this.home()) { // the home was destroyed or bulldozed
      this.homeId = null; for (const it of this.room.items) this.inv[it.id] = (this.inv[it.id] || 0) + 1; this.room.items = [];
      UI.say(`Oh no, your home is gone! Don't worry, all your furniture was saved. Walk to any house to buy a new one.`, 'dog');
    }
  },

  // ---------------- walking ----------------
  toggleWalk(on = !this.walking) {
    if (on) {
      const h = this.home();
      let sx, sy;
      if (h) { sx = h.x + 0.5; sy = h.y + 1.2; }
      else {
        refreshRoadList();
        const [cu, cv] = worldToTile(Cam.x, Cam.y + 40);
        let best = null, bd = 1e9;
        for (const i of D.roadList) { const x = i % N, y = (i / N) | 0, d = Math.hypot(x - cu, y - cv); if (d < bd) { bd = d; best = [x, y]; } }
        if (!best) { UI.toast('🛣️ Build a road first, then you can go for a walk!'); return; }
        [sx, sy] = [best[0] + 0.5, best[1] + 0.5];
      }
      this.u = sx; this.v = sy; this.moe = { u: sx - 0.3, v: sy - 0.3, trail: [] };
      this.walking = true; Input.setTool('inspect'); UI.closeFlyout(); UI.hideInfo();
      Cam.tz = 1.9;
      $('walkHud').classList.remove('hidden'); document.body.classList.add('walking');
      if (!W.flags.walkedOnce) { W.flags.walkedOnce = true; UI.say(`Let's go for a walk, Mayor ${PERSONAL.mayor}! Use the arrow keys (or WASD) to walk. Walk up to a shop or a house and press E to go inside. You get a Mayor's salary every month to spend!`, 'dog'); }
    } else {
      this.walking = false; $('walkHud').classList.add('hidden'); document.body.classList.remove('walking'); $('walkPrompt').classList.add('hidden');
    }
    UI.syncTools();
  },
  walkable(u, v) {
    const x = Math.floor(u), y = Math.floor(v);
    if (!inb(x, y)) return false;
    const i = idx(x, y);
    const b = buildingAt(x, y); // (water is fine: you can swim!)
    if (b && !(BT[b.type] && BT[b.type].park)) return false;
    return true;
  },
  update(dt) {
    if (!this.walking) return;
    const k = Input.keys;
    let du = 0, dv = 0;
    if (k.arrowup || k.w) { du -= 1; dv -= 1; this.face = 'up'; }
    if (k.arrowdown || k.s) { du += 1; dv += 1; this.face = 'down'; }
    if (k.arrowleft || k.a) { du -= 1; dv += 1; this.face = 'left'; }
    if (k.arrowright || k.d) { du += 1; dv -= 1; this.face = 'right'; }
    this.moving = !!(du || dv);
    const ti = idx(clamp(Math.floor(this.u), 0, N - 1), clamp(Math.floor(this.v), 0, N - 1));
    const water = W.terrain[ti] === T_WATER && !W.road[ti], wasIn = this.inWater;
    this.inWater = water && SEASON !== 'winter'; this.onIce = water && SEASON === 'winter';
    if (this.inWater && !wasIn) { Sound.play('splash'); const [sx, sy] = Pw(this.u, this.v); for (let q = 0; q < 14; q++) FX.parts.push({ X: sx, Y: sy - 2, vx: rnd(-25, 25), vy: rnd(-45, -15), r: 1.4, life: 0.7, max: 0.7, col: '#bfe9ff', kind: 'spark', g: 90 }); if (!W.flags.swam) { W.flags.swam = true; UI.toast(`🏊 Splash! You're swimming! (${PERSONAL.dog} is doing the doggy paddle.)`); } }
    if (this.onIce && !this.wasOnIce && !W.flags.iced) { W.flags.iced = true; UI.toast('⛸️ The water is frozen solid! Wheee, slippery!'); }
    this.wasOnIce = this.onIce;
    this.hazards(dt, ti);
    if (this.moving) {
      const len = Math.hypot(du, dv), sp = (this.inWater ? 1.3 : this.onIce ? 3.4 : 2.6) * dt;
      const nu = this.u + (du / len) * sp, nv = this.v + (dv / len) * sp;
      if (this.walkable(nu, nv)) { this.u = nu; this.v = nv; }
      else if (this.walkable(nu, this.v)) this.u = nu;
      else if (this.walkable(this.u, nv)) this.v = nv;
      this.phase += dt * 10;
      this.moe.trail.push([this.u, this.v]); if (this.moe.trail.length > 18) this.moe.trail.shift();
    }
    // Moe follows a few steps behind
    if (this.moe.trail.length > 12) { const [tu, tv] = this.moe.trail[0]; this.moe.u = lerp(this.moe.u, tu, 0.25); this.moe.v = lerp(this.moe.v, tv, 0.25); }
    // camera follows
    const [X, Y] = Pw(this.u, this.v);
    Cam.x = lerp(Cam.x, X, 1 - Math.pow(0.02, dt)); Cam.y = lerp(Cam.y, Y - 20, 1 - Math.pow(0.02, dt)); Cam.anchor = null;
    // coins on the sidewalk
    this.coinT -= dt;
    if (this.coinT < 0) {
      this.coinT = rnd(1.5, 3.5);
      if (this.coins.length < 6) { const x = Math.floor(this.u) + rint(-5, 5), y = Math.floor(this.v) + rint(-5, 5); if (inb(x, y) && W.road[idx(x, y)]) this.coins.push({ u: x + rnd(0.2, 0.8), v: y + rnd(0.2, 0.8), t: 0 }); }
    }
    for (const c of this.coins) {
      c.t += dt;
      if (Math.hypot(c.u - this.u, c.v - this.v) < 0.45) { c.got = true; const amt = rint(2, 8); this.wallet += amt; Sound.play('coin'); const [cx, cy] = Pw(c.u, c.v, 20); FX.coinText(cx, cy, '+$' + amt); UI.updateWallet(); }
      if (Math.hypot(c.u - this.u, c.v - this.v) > 9) c.got = true;
    }
    this.coins = this.coins.filter((c) => !c.got);
    // what's nearby?
    let near = null, nd = 1.2;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const b = buildingAt(Math.floor(this.u) + dx, Math.floor(this.v) + dy);
      if (!b || !(storeFor(b) || b.type === 'R')) continue;
      const cu = clamp(this.u, b.x, b.x + b.size), cv = clamp(this.v, b.y, b.y + b.size), d = Math.hypot(cu - this.u, cv - this.v);
      if (d < nd) { nd = d; near = b; }
    }
    if (near !== this.near) {
      this.near = near;
      const el = $('walkPrompt');
      if (!near) el.classList.add('hidden');
      else {
        const isHome = near.id === this.homeId;
        const label = isHome ? '🏠 Your home!' : near.type === 'R' ? `🏡 ${buildingName(near)} (for sale)` : `${STORES[storeFor(near)].icon} ${STORES[storeFor(near)].name}`;
        el.innerHTML = `<b>${escapeHtml(label)}</b> · press <kbd>E</kbd> to go in`;
        el.classList.remove('hidden');
      }
    }
  },
  interact() {
    const b = this.near; if (!b) return;
    Sound.play('select');
    if (b.type === 'R') { if (b.id === this.homeId) Home.open(); else this.offerHome(b); return; }
    Shop.open(storeFor(b), b);
  },
  offerHome(b) {
    const price = homePrice(b), cur = this.home();
    const pv = `<canvas id="homePv" width="180" height="200" style="float:right;margin-left:10px"></canvas>`;
    UI.modal(`<h2>🏡 ${escapeHtml(buildingName(b))}</h2>${pv}
      <p style="font-size:16px">This home is for sale!<br><b>Price: ${fmtMoney(price)}</b><br>Your wallet: 👛 <b>${fmtMoney(this.wallet)}</b></p>
      <p style="font-size:14px;color:#6d5a7d">${cur ? `You already have a home. If you move here, all your furniture comes too (and you get ${fmtMoney(Math.round(homePrice(cur) * 0.6))} back for the old one).` : 'Buy it and you can decorate it with furniture from the shops!'}</p>
      <div class="acts" style="clear:both"><button class="btn" id="hNo">Maybe later</button><button class="btn go" id="hYes" ${this.wallet + (cur ? Math.round(homePrice(cur) * 0.6) : 0) < price ? 'disabled' : ''}>🔑 Buy this home!</button></div>`);
    const cv = $('homePv'), g = cv.getContext('2d'), spr = spriteFor(b), sc = Math.min(170 / spr.w, 190 / spr.h);
    g.drawImage(spr.cv, (180 - spr.w * sc) / 2, 196 - spr.h * sc, spr.w * sc, spr.h * sc);
    $('hNo').onclick = () => UI.closeModal();
    $('hYes').onclick = () => {
      const refund = cur ? Math.round(homePrice(cur) * 0.6) : 0;
      if (this.wallet + refund < price) { Sound.play('error'); return; }
      this.wallet += refund - price; this.homeId = b.id;
      Sound.play('quest'); FX.confetti(120); UI.closeModal(); UI.updateWallet();
      const [X, Y] = Pw(b.x + 0.5, b.y + 0.5, 30); FX.fireworksShow(5, 2, [X, Y]);
      UI.say(`Congratulations! You bought your very own home! Walk up to it and press E to go inside and decorate. Buy furniture at Snack Marts, Shopping Plazas and Malls!`, 'dog');
      this.near = null;
    };
  },
  buy(id, b) {
    const it = ITEMS[id];
    if (this.wallet < it.price) { Sound.play('error'); UI.toast(`👛 You need ${fmtMoney(it.price - this.wallet)} more. Your salary comes every month!`); return false; }
    this.wallet -= it.price; UI.updateWallet();
    if (it.price) Sound.play('cash');
    let msg = '';
    if (it.kind === 'food') { this.eaten++; msg = it.msg; if (it.party) { FX.fireworksShow(8, 3, Pw(this.u, this.v, 60)); FX.confetti(100); } this.hearts(); }
    else if (it.kind === 'furn') { this.inv[id] = (this.inv[id] || 0) + 1; msg = this.home() ? 'Sent to your home! Go inside to place it.' : "It's waiting in storage until you buy a home!"; }
    else if (it.kind === 'outfit') { this.owned[id] = true; this.look.outfit = id; this.look.shirt = it.shirt; msg = 'Looking great! (Change clothes anytime in 👛 My Stuff.)'; }
    else if (it.kind === 'acc') { this.owned[id] = true; if (!this.look.acc.includes(it.acc)) this.look.acc.push(it.acc); msg = 'So stylish!'; }
    else if (it.kind === 'moe') { this.owned[id] = true; this.moeLook = id; msg = `${PERSONAL.dog} loves it! She's doing a happy dance.`; Sound.play('woof'); }
    else if (it.kind === 'fun') {
      msg = it.msg;
      if (it.meow) Sound.play('meow');
      if (it.rocket) { this.owned.astronaut = true; this.look.outfit = 'astronaut'; this.look.shirt = ITEMS.astronaut.shirt; if (b && b.type === 'space') FX.launchRocket(b); }
      if (it.zoomOut) { UI.closeModal(); Cam.tz = 0.45; setTimeout(() => { Cam.tz = 2.1; }, 4000); }
      this.hearts();
    }
    UI.toast(`${it.icon} ${msg}`);
    return true;
  },
  // radiation makes you sick (and barf!), fire is too hot to touch
  hazards(dt, ti) {
    this.burnT = Math.max(0, (this.burnT || 0) - dt);
    if (Dis.rad[ti]) {
      if (!this.sick) UI.toast('☢️ Ewww, radiation! You feel sick! Get out of the green glow!');
      this.sick = (this.sick || 0) + dt;
      this.barfT = (this.barfT || 0) - dt;
      if (this.barfT <= 0) {
        this.barfT = rnd(0.9, 1.6); Sound.play('barf');
        const [x, y] = Pw(this.u, this.v);
        FX.texts.push({ X: x + 6, Y: y - 24, txt: '🤢', life: 1.2, max: 1.2, col: '#7fd34a' });
        for (let q = 0; q < 12; q++) FX.parts.push({ X: x + 2, Y: y - 13, vx: rnd(5, 30), vy: rnd(-20, 5), r: rnd(1, 2), life: 0.9, max: 0.9, col: pick(['#9fd35a', '#c6e86a', '#7fbf3a']), kind: 'spark', g: 120 });
      }
      if (this.sick > 7) this.faint();
    } else this.sick = Math.max(0, (this.sick || 0) - dt * 0.6);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const b = buildingAt(Math.floor(this.u) + dx, Math.floor(this.v) + dy);
      if (!b || !Dis.fire.has(b.id)) continue;
      const cu = clamp(this.u, b.x, b.x + b.size), cv = clamp(this.v, b.y, b.y + b.size), d = Math.hypot(cu - this.u, cv - this.v);
      if (d < 0.7) {
        const a = Math.atan2(this.v - cv, this.u - cu) || 0, nu = this.u + Math.cos(a) * 0.5, nv = this.v + Math.sin(a) * 0.5;
        if (this.walkable(nu, nv)) { this.u = nu; this.v = nv; }
        if (this.burnT <= 0) { this.burnT = 1.2; Sound.play('ouch'); UI.toast('🔥 OUCH! Too hot! Fires are dangerous. Let the firefighters handle it!'); const [x, y] = Pw(this.u, this.v); FX.texts.push({ X: x, Y: y - 26, txt: 'OUCH!', life: 1, max: 1, col: '#ff5a1f' }); }
      }
    }
  },
  faint() {
    this.sick = 0;
    const hosp = [...W.buildings.values()].filter((b) => b.type === 'hospital' || b.type === 'clinic');
    let spot = null;
    for (const b of hosp.length ? hosp : [this.home()].filter(Boolean)) {
      for (const [ox, oy] of [[0.5, b.size + 0.4], [b.size + 0.4, 0.5], [-0.4, 0.5], [0.5, -0.4]]) if (!spot && this.walkable(b.x + ox, b.y + oy) && !Dis.rad[idx(Math.floor(b.x + ox), Math.floor(b.y + oy))]) spot = [b.x + ox, b.y + oy];
    }
    if (!spot) { for (const i of D.roadList) if (!Dis.rad[i]) { spot = [(i % N) + 0.5, ((i / N) | 0) + 0.5]; if (Math.random() < 0.05) break; } }
    if (spot) { [this.u, this.v] = spot; this.moe = { u: this.u - 0.3, v: this.v - 0.3, trail: [] }; const [X, Y] = Pw(this.u, this.v); Cam.x = X; Cam.y = Y - 20; }
    const fee = Math.min(this.wallet, 100); this.wallet -= fee; UI.updateWallet();
    FX.parts.push({ X: Cam.x, Y: Cam.y, vx: 0, vy: 0, r: 400, life: 0.6, max: 0.6, col: '#ffffff', kind: 'flash' });
    Sound.play('error');
    UI.say(`😵 You fainted from the radiation and woke up ${hosp.length ? 'in the hospital' : 'at home'}! The doctor says: "Stay away from glowing green stuff!" ${fee ? `(The doctor bill was ${fmtMoney(fee)}.)` : ''}`, 'dog');
  },
  goHome() {
    const h = this.home(); if (!h) { UI.toast("You don't have a home yet. Walk up to a house and press E!"); return; }
    if (!this.walking) this.toggleWalk(true);
    this.u = h.x + 0.5; this.v = h.y + 1.3; if (!this.walkable(this.u, this.v)) { this.u = h.x + 1.3; this.v = h.y + 0.5; }
    this.moe = { u: this.u - 0.3, v: this.v - 0.3, trail: [] }; this.near = null;
    const [X, Y] = Pw(this.u, this.v); Cam.x = X; Cam.y = Y - 20;
    for (let k = 0; k < 20; k++) FX.parts.push({ X: X + rnd(-10, 10), Y: Y - rnd(0, 20), vx: rnd(-20, 20), vy: rnd(-30, 0), r: 1.5, life: 0.8, max: 0.8, col: '#ff9fcf', kind: 'spark', g: 30 });
    Sound.play('select'); UI.toast('🏠 Home sweet home!');
  },
  hearts() { const [X, Y] = Pw(this.u, this.v, 30); for (let k = 0; k < 8; k++) FX.texts.push({ X: X + rnd(-12, 12), Y: Y - rnd(0, 10), txt: '♥', life: 1.4, max: 1.4, col: '#ff6fa5' }); },

  // ---------------- drawing in the city ----------------
  drawMe(g, x, y, t) {
    let look = this.look;
    if (this.sick > 0.3) { look = { ...look, skinCol: mix(SKINS_L[look.skin] || SKINS_L[0], '#9fd35a', Math.min(0.8, this.sick / 5)) }; x += Math.sin(t * 12) * Math.min(1.5, this.sick * 0.3); }
    if (this.burnT > 0.6) look = { ...look, skinCol: '#ff9a7a' };
    if (this.inWater) {
      g.save(); g.beginPath(); g.rect(x - 30, y - 80, 60, 79); g.clip();
      drawAvatar(g, x, y + 7, look, this.moving ? this.phase : 0, this.face, 0.6); g.restore();
      this.ripples(g, x, y, t, 7);
    } else drawAvatar(g, x, y, look, this.moving ? this.phase : 0, this.face, 0.6);
  },
  ripples(g, x, y, t, r) {
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(x, y - 0.5, r, r * 0.38, 0, 0, 7); g.stroke();
    const ph = (t * 1.3) % 1; g.globalAlpha = 1 - ph; g.beginPath(); g.ellipse(x, y - 0.5, r + ph * 8, (r + ph * 8) * 0.38, 0, 0, 7); g.stroke(); g.globalAlpha = 1;
  },
  // name tag + bouncing arrow, always on top so you can find yourself
  drawOnTop(g, t) {
    if (!this.walking) return;
    const [x, y] = Pw(this.u, this.v), ty = y - 26 - Math.abs(Math.sin(t * 4)) * 2;
    g.font = `700 5px ${SPRITE_FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.95)';
    g.strokeText(PERSONAL.mayor, x, ty - 4); g.fillStyle = '#e0457b'; g.fillText(PERSONAL.mayor, x, ty - 4);
    g.fillStyle = '#ff6fa5'; g.strokeStyle = '#ffffff'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x - 3, ty - 2); g.lineTo(x + 3, ty - 2); g.lineTo(x, ty + 1.5); g.closePath(); g.fill(); g.stroke();
  },
  bucketize(buckets) {
    const add = (u, v, o) => { const d = Math.floor(u) + Math.floor(v); if (d >= 0 && d < buckets.length) buckets[d].push(o); };
    const hm = this.home(); if (hm) add(hm.x + 0.5, hm.y + 0.5, { life: 'homeflag', h: hm });
    if (!this.walking) return;
    add(this.u, this.v, { life: 'me' });
    add(this.moe.u, this.moe.v, { life: 'moe' });
    for (const c of this.coins) add(c.u, c.v, { life: 'coin', c });
  },
  drawItem(P, it, night, t) {
    const g = P.g;
    if (it.life === 'me') {
      const [x, y] = Pw(this.u, this.v);
      this.drawMe(g, x, y, t);
    } else if (it.life === 'moe') {
      const [x, y] = Pw(this.moe.u, this.moe.v), mi = idx(clamp(Math.floor(this.moe.u), 0, N - 1), clamp(Math.floor(this.moe.v), 0, N - 1));
      const swim = W.terrain[mi] === T_WATER && !W.road[mi] && SEASON !== 'winter';
      if (swim) { g.save(); g.beginPath(); g.rect(x - 30, y - 60, 60, 59); g.clip(); }
      drawMoe(P, x, y + (swim ? 4 : 0), 0.95, this.u < this.moe.u || this.face === 'left', this.moving ? Math.sin(this.phase * 1.3) * 1.5 : 0, this.moeLook);
      if (swim) { g.restore(); this.ripples(g, x, y, t, 5); }
    } else if (it.life === 'coin') {
      const [x, y] = Pw(it.c.u, it.c.v, 5 + Math.sin(t * 4 + it.c.u) * 1.5), w = Math.abs(Math.cos(t * 3 + it.c.v)) * 3 + 0.6;
      g.fillStyle = '#ffd23f'; g.strokeStyle = '#c99a00'; g.lineWidth = 0.7; g.beginPath(); g.ellipse(x, y, w, 3.4, 0, 0, 7); g.fill(); g.stroke();
      if (night > 0.3) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6; g.drawImage(GLOW, x - 6, y - 6, 12, 12); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    } else if (it.life === 'homeflag') {
      const [x, y] = Pw(it.h.x + 0.5, it.h.y + 0.5, ZHEIGHT.R[it.h.level] * 0.55 + 10 + Math.sin(t * 3) * 2);
      g.font = '12px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.fillText('💖', x, y);
    }
  },
};

// ---------------- character drawing (used in the city, the shop and the room) ----------------
function drawAvatar(g, x, y, look, phase, face, s = 1) {
  const L = look, skin = L.skinCol || SKINS_L[L.skin] || SKINS_L[0], hair = HAIRS[L.hair] || HAIRS[0], it = L.outfit ? ITEMS[L.outfit] : null;
  const shirt = L.shirt || '#ff6fa5', back = face === 'up', flip = face === 'left';
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(0, 0, 6, 2.5, 0, 0, 7); g.fill();
  if (L.acc.includes('cape')) { g.fillStyle = '#e8283c'; g.beginPath(); g.moveTo(-4, -19); g.lineTo(4, -19); g.lineTo(6 + Math.sin(phase) * 1.5, -4); g.lineTo(-6 + Math.sin(phase) * 1.5, -4); g.closePath(); g.fill(); }
  const sw = Math.sin(phase) * 2.2;
  g.fillStyle = it && it.astro ? '#e8e8e8' : L.pants; g.fillRect(-3, -9, 2.6, 9 + (phase ? sw * 0.3 : 0)); g.fillRect(0.4, -9, 2.6, 9 - (phase ? sw * 0.3 : 0));
  g.fillStyle = '#4a3a5a'; g.fillRect(-3.4, -1, 3, 1.8); g.fillRect(0.4, -1, 3, 1.8);
  if (it && it.dress) {
    const gr = g.createLinearGradient(-7, 0, 7, 0); ['#ff5d8f', '#ffd23f', '#5ce1e6', '#b48cff'].forEach((c, i) => gr.addColorStop(i / 3, c));
    g.fillStyle = gr; g.beginPath(); g.moveTo(-3.5, -19); g.lineTo(3.5, -19); g.lineTo(6.5, -7); g.lineTo(-6.5, -7); g.closePath(); g.fill();
  } else { g.fillStyle = shirt; g.beginPath(); g.moveTo(-4, -19); g.lineTo(4, -19); g.lineTo(4.4, -8.5); g.lineTo(-4.4, -8.5); g.closePath(); g.fill(); }
  if (it && it.hoodie) { g.fillStyle = shade(shirt, -0.15); g.fillRect(-1, -16, 2, 4); }
  if (it && it.sash) { g.strokeStyle = '#e8283c'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-3.5, -18.5); g.lineTo(3.5, -10); g.stroke(); }
  if (it && it.astro) { g.fillStyle = '#3f6fd8'; g.fillRect(-1.5, -16, 3, 2); }
  g.strokeStyle = it && (it.hoodie || it.astro) ? shirt : skin; g.lineWidth = 1.8; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-4, -17.5); g.lineTo(-5.5 - (phase ? sw * 0.4 : 0), -11); g.moveTo(4, -17.5); g.lineTo(5.5 + (phase ? sw * 0.4 : 0), -11); g.stroke();
  // head & hair
  const hy = -24;
  if (L.style === 'long' || L.style === 'curly') { g.fillStyle = hair; g.beginPath(); g.ellipse(0, hy + 2.5, 6, 7.2, 0, 0, 7); g.fill(); }
  g.fillStyle = skin; g.beginPath(); g.arc(0, hy, 5, 0, 7); g.fill();
  g.fillStyle = hair;
  if (back) { g.beginPath(); g.arc(0, hy, 5.2, 0, 7); g.fill(); }
  else { g.beginPath(); g.arc(0, hy - 1, 5.2, Math.PI * 1.02, Math.PI * 1.98); g.lineTo(3, hy - 2.2); g.quadraticCurveTo(0, hy - 0.5, -4.5, hy - 1.2); g.fill(); }
  if (L.style === 'ponytail') { g.beginPath(); g.ellipse(back ? 0 : -5.5, hy + 1, 2, 4.5, back ? 0 : 0.4, 0, 7); g.fill(); }
  if (L.style === 'buns') { g.beginPath(); g.arc(-4.5, hy - 4, 2.4, 0, 7); g.arc(4.5, hy - 4, 2.4, 0, 7); g.fill(); }
  if (L.style === 'bob') { g.fillRect(-5.4, hy - 1, 2, 5); g.fillRect(3.4, hy - 1, 2, 5); }
  if (L.style === 'curly') for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(Math.cos(k * 0.9) * 5.5, hy - 1 + Math.sin(k * 0.9) * 4, 1.8, 0, 7); g.fill(); }
  if (!back) {
    g.fillStyle = '#2b1d14'; g.fillRect(-2.4, hy + 0.3, 1.2, 1.6); g.fillRect(1.2, hy + 0.3, 1.2, 1.6);
    g.fillStyle = 'rgba(255,120,140,0.5)'; g.beginPath(); g.arc(-3, hy + 2.6, 1, 0, 7); g.arc(3, hy + 2.6, 1, 0, 7); g.fill();
    g.strokeStyle = '#a0522d'; g.lineWidth = 0.6; g.beginPath(); g.arc(0, hy + 2.6, 1.3, 0.2, Math.PI - 0.2); g.stroke();
    if (L.acc.includes('shades')) { g.fillStyle = '#111'; g.fillRect(-3.4, hy, 2.6, 1.8); g.fillRect(0.8, hy, 2.6, 1.8); g.fillRect(-1, hy + 0.4, 2, 0.6); }
  }
  if (it && it.astro) { g.strokeStyle = 'rgba(200,230,255,0.9)'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, hy, 6.8, 0, 7); g.stroke(); g.fillStyle = 'rgba(200,230,255,0.18)'; g.fill(); }
  if (L.acc.includes('crown')) { g.fillStyle = '#f5c518'; g.beginPath(); g.moveTo(-4, hy - 4.5); g.lineTo(-4, hy - 8.5); g.lineTo(-2, hy - 6.3); g.lineTo(0, hy - 9.5); g.lineTo(2, hy - 6.3); g.lineTo(4, hy - 8.5); g.lineTo(4, hy - 4.5); g.closePath(); g.fill(); g.fillStyle = '#ff5d8f'; g.beginPath(); g.arc(0, hy - 6, 0.9, 0, 7); g.fill(); }
  g.restore();
}
function drawMoe(P, x, y, s, flip, leg, acc) {
  const g = P.g;
  if (acc === 'moe_cape') { g.save(); g.translate(x, y); if (flip) g.scale(-1, 1); g.fillStyle = '#e8283c'; g.beginPath(); g.moveTo(-1 * s, -7 * s); g.lineTo(-6 * s, -4 * s); g.lineTo(-5 * s, -2 * s); g.lineTo(2 * s, -6 * s); g.fill(); g.restore(); }
  P.dog(x, y, s, PERSONAL.dogColors.fur, PERSONAL.dogColors.ears, flip, leg);
  g.save(); g.translate(x, y); if (flip) g.scale(-1, 1); g.scale(s, s);
  g.fillStyle = PERSONAL.dogColors.collar; g.fillRect(2.4, -6.3, 2.4, 1.2);
  if (acc === 'moe_pink' || acc === 'moe_blue') { g.fillStyle = ITEMS[acc].col; g.beginPath(); g.moveTo(2, -6); g.lineTo(5.5, -6); g.lineTo(3.6, -3.2); g.fill(); }
  if (acc === 'moe_flower') ['#ff5d8f', '#ffd23f', '#b48cff'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.arc(3.5 + k * 1.5, -11 + (k % 2) * 0.4, 0.9, 0, 7); g.fill(); });
  if (acc === 'moe_shades') { g.fillStyle = '#111'; g.fillRect(5, -9.6, 3, 1.2); }
  g.restore();
}
Save.extras.push({ key: 'life', save: () => Life.save(), load: (d) => Life.load(d) });

// ---------------- shop screen ----------------
const Shop = {
  open(storeId, b) {
    const st = STORES[storeId]; if (!st) return;
    this.store = storeId; this.b = b;
    const render = () => {
      const cards = st.items.filter((id) => !ITEMS[id].hidden).map((id) => {
        const it = ITEMS[id], own = (it.kind === 'outfit' || it.kind === 'acc' || it.kind === 'moe') && Life.owned[id];
        const extra = it.kind === 'furn' ? `<span class="tag">🛋️ furniture${Life.inv[id] ? ` · you have ${Life.inv[id]}` : ''}</span>` : it.kind === 'food' ? '<span class="tag">😋 eat it</span>' : it.kind === 'fun' ? '<span class="tag">🎉 do it</span>' : it.kind === 'moe' ? `<span class="tag">🐶 for ${PERSONAL.dog}</span>` : '<span class="tag">👕 wear it</span>';
        return `<button class="shop-item${own ? ' owned' : ''}" data-buy="${id}"><span class="si-icon">${it.icon}</span><span class="si-name">${escapeHtml(it.name)}</span>${extra}<span class="si-price">${own ? '✅ Owned (wear it)' : it.price ? fmtMoney(it.price) : 'Free!'}</span></button>`;
      }).join('');
      $('modalCard').innerHTML = `<div class="shop-head"><span class="shop-icon">${st.icon}</span><div><h2>${escapeHtml(st.name)}</h2><div class="wallet-line">👛 Your wallet: <b>${fmtMoney(Life.wallet)}</b></div></div></div>
        <div class="shop-grid">${cards}</div>
        <div class="acts"><button class="btn primary" id="shopBye">👋 Leave the shop</button></div>`;
      $('modalCard').querySelectorAll('[data-buy]').forEach((el) => el.onclick = () => {
        const id = el.dataset.buy, it = ITEMS[id];
        if ((it.kind === 'outfit' || it.kind === 'acc' || it.kind === 'moe') && Life.owned[id]) { MyStuff.wear(id); render(); return; }
        if (Life.buy(id, this.b)) render();
      });
      $('shopBye').onclick = () => { Sound.play('click'); UI.closeModal(); };
    };
    $('modal').classList.remove('hidden'); $('modalCard').classList.add('wide'); render();
  },
};

// ---------------- "My Stuff": wallet, clothes, looks ----------------
const MyStuff = {
  wear(id) {
    const it = ITEMS[id];
    if (it.kind === 'outfit') { Life.look.outfit = Life.look.outfit === id ? null : id; Life.look.shirt = Life.look.outfit ? it.shirt : '#ff6fa5'; }
    if (it.kind === 'acc') { const a = Life.look.acc; const k = a.indexOf(it.acc); if (k >= 0) a.splice(k, 1); else a.push(it.acc); }
    if (it.kind === 'moe') Life.moeLook = Life.moeLook === id ? null : id;
    Sound.play('select');
  },
  open() {
    const render = () => {
      const L = Life.look;
      const sw = (arr, key, isIdx) => arr.map((c, i) => `<button class="swatch${(isIdx ? L[key] === i : L[key] === c) ? ' on' : ''}" data-set="${key}" data-val="${isIdx ? i : c}" style="background:${c}"></button>`).join('');
      const owned = Object.keys(Life.owned).filter((k) => Life.owned[k] && ITEMS[k]);
      const furn = Object.entries(Life.inv).filter(([, n]) => n > 0);
      const h = Life.home();
      $('modalCard').innerHTML = `<h2>👛 My Stuff</h2>
        <div class="me-row"><canvas id="mePv" width="140" height="170"></canvas><div style="flex:1">
          <div class="wallet-big">👛 ${fmtMoney(Life.wallet)}</div>
          <p style="margin:4px 0;font-size:14px;color:#6d5a7d">You earn a Mayor's salary every month. A bigger, happier city pays more! Find coins on the sidewalk when you walk around.</p>
          <p style="margin:4px 0;font-size:14px">${h ? `🏠 Your home: <b>${escapeHtml(buildingName(h))}</b>` : '🏠 No home yet: walk to a house and press E to buy one!'}</p>
        </div></div>
        <div class="section">Skin</div><div class="swatches">${sw(SKINS_L, 'skin', true)}</div>
        <div class="section">Hair color</div><div class="swatches">${sw(HAIRS, 'hair', true)}</div>
        <div class="section">Hair style</div><div class="swatches">${HAIR_STYLES.map((s) => `<button class="chip${L.style === s ? ' on' : ''}" data-set="style" data-val="${s}">${s}</button>`).join('')}</div>
        <div class="section">Pants</div><div class="swatches">${sw(['#3d4b8a', '#2b2b38', '#6b4a33', '#ff8fbd', '#3fb067', '#9b6bff'], 'pants')}</div>
        <div class="section">My clothes &amp; things (click to wear)</div><div class="swatches">${owned.length ? owned.map((k) => `<button class="chip${(L.outfit === k || L.acc.includes(ITEMS[k].acc) || Life.moeLook === k) ? ' on' : ''}" data-wear="${k}">${ITEMS[k].icon} ${escapeHtml(ITEMS[k].name)}</button>`).join('') : '<span style="color:#8a7a99;font-size:14px">Buy clothes at the Shopping Plaza or Mega Mall, and things for Moe at the Pet Shop!</span>'}</div>
        <div class="section">Furniture in storage</div><div class="swatches">${furn.length ? furn.map(([k, n]) => `<span class="chip">${ITEMS[k].icon} ${escapeHtml(ITEMS[k].name)} ×${n}</span>`).join('') : '<span style="color:#8a7a99;font-size:14px">Nothing in storage.</span>'}</div>
        <div class="acts">${h ? '<button class="btn" id="msHome">🏠 Go home</button>' : ''}<button class="btn primary" id="msOk">Done</button></div>`;
      const cv = $('mePv'), g = cv.getContext('2d'); g.fillStyle = '#fff3f8'; g.fillRect(0, 0, 140, 170);
      drawAvatar(g, 55, 150, Life.look, 0, 'down', 4.4);
      drawMoe(new Painter(g), 112, 155, 2.6, true, 0, Life.moeLook);
      $('modalCard').querySelectorAll('[data-set]').forEach((b) => b.onclick = () => { const k = b.dataset.set, v = b.dataset.val; Life.look[k] = (k === 'skin' || k === 'hair') ? +v : v; Sound.play('click'); render(); });
      $('modalCard').querySelectorAll('[data-wear]').forEach((b) => b.onclick = () => { this.wear(b.dataset.wear); render(); });
      $('msOk').onclick = () => { Sound.play('click'); UI.closeModal(); };
      if ($('msHome')) $('msHome').onclick = () => { UI.closeModal(); Home.open(); };
    };
    $('modal').classList.remove('hidden'); render();
  },
};
