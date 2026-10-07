'use strict';
// =====================================================================
//  ✏️  PERSONAL SETTINGS: edit these to customize the game!
// =====================================================================
const PERSONAL = {
  mayor: 'Nelly',                    // the player: "Mayor Nelly"
  nicknames: ['Nellbo', 'Snorty'],   // used for landmarks and jokes
  dad: 'David',
  dog: 'Moe',                        // the Chief Advisor! (a white Pyrador)
  cat: 'Jason',
  defaultCityName: 'Snortopolis',
  // Make Moe and Jason look like the real ones:
  dogColors: { fur: '#f8f5ee', ears: '#ece2d0', muzzle: '#ffffff', nose: '#2b1d14', outline: '#cfc6b6', collar: '#ff6fa5' },
  catColors: { fur: '#f2a54a', stripes: '#c46f1c', eyes: '#62c050' },
};
const NICK1 = PERSONAL.nicknames[0] || PERSONAL.mayor;
const NICK2 = PERSONAL.nicknames[1] || PERSONAL.mayor;
const POSS = (name) => name + (/s$/i.test(name) ? "'" : "'s");

// =====================================================================
//  World & balance constants
// =====================================================================
const N = 64;              // the map is N x N tiles
const TW = 64, TH = 32;    // isometric tile size (pixels)
const MONTH_SECONDS = 10;  // real seconds per game month at normal speed (a season = 30s)
const DAY_SECONDS = 150;   // real seconds for one full day + night
const START_MONEY = 25000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TIERS = [
  { name: 'Village', pop: 0, icon: '🏡' },
  { name: 'Town', pop: 400, icon: '🏘️' },
  { name: 'City', pop: 1500, icon: '🏙️' },
  { name: 'Big City', pop: 5000, icon: '🌆' },
  { name: 'Metropolis', pop: 12000, icon: '🌃' },
  { name: 'Megalopolis', pop: 30000, icon: '🚀' },
];

const ROAD_COST = 10, BRIDGE_COST = 60, ZONE_COST = 10, CLEAR_TREE_COST = 5;

// money: starting cash · income: taxes & tourism multiplier · cost: price multiplier
const DIFFICULTY = {
  easy: { name: 'Easy', icon: '🌱', money: 25000, income: 1.8, cost: 1, reward: 1, desc: 'Lots of money. Relaxed building.' },
  normal: { name: 'Normal', icon: '⭐', money: 15000, income: 0.85, cost: 1.3, reward: 0.6, desc: 'Money is tight. Plan carefully!' },
  hard: { name: 'Hard', icon: '🔥', money: 9000, income: 0.6, cost: 1.6, reward: 0.45, desc: 'Every dollar counts. For master mayors.' },
};

// Zones grow buildings by themselves. cap = people (homes) or jobs (shops/factories) per level.
const ZONES = {
  R: { id: 1, name: 'Homes', icon: '🏠', color: '#3ecf5a', cap: [0, 8, 30, 100], lvReq: [0, 0, 35, 50], tierReq: [0, 0, 0, 1] },
  C: { id: 2, name: 'Shops', icon: '🍦', color: '#3fa9f5', cap: [0, 5, 16, 45], lvReq: [0, 0, 33, 48], tierReq: [0, 0, 0, 1] },
  I: { id: 3, name: 'Factories', icon: '🏭', color: '#ffb52e', cap: [0, 8, 20, 40], lvReq: [0, 0, 0, 0], tierReq: [0, 0, 1, 2] },
};
const ZKEY = [null, 'R', 'C', 'I'];
const ZNAMES = {
  R: [null, ['Cozy Cottage', 'Square House', 'House with a Doghouse', 'Tall Skinny House'], ['Townhouses', 'Apartment House', 'Flower Flats'], ['Sky Apartments', 'Terrace Tower', 'Glass Tower Homes']],
  C: [null, ['Ice Cream Shop', 'Bakery', 'Pet Shop', 'Candy Shop', 'Pizza Place'], ['Snack Mart', 'Shopping Plaza', 'Book Café'], ['Glass Office Tower', 'Mega Mall', 'Tech Tower']],
  I: [null, ['Workshop', 'Robot Workshop', 'Warehouse'], ['Candy Factory', 'Chocolate Factory', 'Gadget Factory'], ['Rocket Parts Plant', 'Big Factory', 'Science Lab']],
};
const ZDESIGNS = { R: [0, 4, 3, 3], C: [0, 5, 3, 3], I: [0, 3, 3, 3] };
const ZHEIGHT = { R: [0, 50, 72, 150], C: [0, 62, 72, 175], I: [0, 50, 110, 120] };

// =====================================================================
//  Buildings you place yourself
//  lv = makes nearby land nicer {r: radius, a: amount}; poll = pollution
// =====================================================================
const BT = {
  // ---- power ----
  wind: { name: 'Wind Turbine', icon: '🌬️', cat: 'power', size: 1, cost: 500, upkeep: 10, tier: 0, power: 25, ground: 'grass', h: 110, desc: 'Clean power from the wind. Powers about 25 small buildings.' },
  coal: { name: 'Coal Power Plant', icon: '🏭', cat: 'power', size: 2, cost: 3000, upkeep: 90, tier: 0, power: 300, ground: 'dirt', h: 115, poll: { r: 7, a: 40 }, desc: 'Tons of power, but very smoky! Keep it far away from homes.' },
  solar: { name: 'Solar Farm', icon: '☀️', cat: 'power', size: 2, cost: 6000, upkeep: 40, tier: 1, power: 220, ground: 'grass', h: 30, desc: 'Clean sunshine power. No smoke at all!' },
  fusion: { name: 'Fusion Reactor', icon: '🌀', cat: 'power', size: 2, cost: 20000, upkeep: 150, tier: 3, power: 1200, ground: 'pave', h: 90, desc: 'Space-age super power! Enough for a whole metropolis.' },
  // ---- parks ----
  tree: { name: 'Tree', icon: '🌳', cat: 'parks', size: 1, cost: 10, tier: 0, isTree: true, desc: 'Trees make neighborhoods nicer. Drag to plant lots!' },
  park: { name: 'Small Park', icon: '🌳', cat: 'parks', size: 1, cost: 80, upkeep: 2, tier: 0, ground: 'grass', h: 45, lv: { r: 4, a: 12 }, park: true, desc: 'A little park with a bench. Makes neighbors happier.' },
  garden: { name: 'Flower Garden', icon: '🌷', cat: 'parks', size: 1, cost: 120, upkeep: 2, tier: 0, ground: 'grass', h: 30, lv: { r: 3, a: 11 }, park: true, desc: 'Pretty flowers in every color.' },
  playground: { name: 'Playground', icon: '🛝', cat: 'parks', size: 1, cost: 250, upkeep: 4, tier: 1, ground: 'grass', h: 40, lv: { r: 4, a: 14 }, park: true, desc: 'Slides and swings! Families love living nearby.' },
  fountain: { name: 'Fountain Plaza', icon: '⛲', cat: 'parks', size: 1, cost: 400, upkeep: 5, tier: 1, ground: 'pave', h: 45, lv: { r: 5, a: 16 }, park: true, desc: 'A sparkly fountain. Shops nearby love the visitors.' },
  bigpark: { name: 'Big Park', icon: '🏞️', cat: 'parks', size: 2, cost: 1200, upkeep: 10, tier: 2, ground: 'grass', h: 60, lv: { r: 7, a: 22 }, park: true, desc: 'A huge park with a pond and a gazebo.' },
  sign: { name: 'Welcome Sign', icon: '🪧', cat: 'parks', size: 1, cost: 100, upkeep: 0, tier: 0, ground: 'grass', h: 50, lv: { r: 2, a: 4 }, park: true, desc: 'Welcomes everyone to your city, with its name!' },
  pond: { name: 'Duck Pond', icon: '🦆', cat: 'parks', size: 1, cost: 150, upkeep: 2, tier: 0, ground: 'grass', h: 30, lv: { r: 4, a: 12 }, park: true, desc: 'A little pond with ducks. Quack!' },
  basketball: { name: 'Basketball Court', icon: '🏀', cat: 'parks', size: 1, cost: 300, upkeep: 3, tier: 1, ground: 'pave', h: 40, lv: { r: 4, a: 12 }, park: true, desc: 'Shoot some hoops!' },
  icerink: { name: 'Ice Rink', icon: '⛸️', cat: 'parks', size: 1, cost: 400, upkeep: 5, tier: 1, ground: 'pave', h: 30, lv: { r: 4, a: 14 }, park: true, desc: 'Skate in circles all year long.' },
  field: { name: 'Soccer Field', icon: '⚽', cat: 'parks', size: 2, cost: 1000, upkeep: 8, tier: 1, ground: 'grass', h: 40, lv: { r: 6, a: 16 }, park: true, desc: 'A big field for soccer games.' },
  pool: { name: 'Swimming Pool', icon: '🏊', cat: 'parks', size: 2, cost: 1500, upkeep: 15, tier: 1, ground: 'pave', h: 40, lv: { r: 6, a: 20 }, park: true, desc: 'Splash! Families love living near the pool.' },
  // ---- services ----
  police: { name: 'Police Station', icon: '🚓', cat: 'services', size: 1, cost: 600, upkeep: 35, tier: 0, ground: 'pave', h: 50, svc: 'police', lv: { r: 10, a: 8 }, desc: 'Keeps neighborhoods safe. People like living nearby.' },
  fire: { name: 'Fire Station', icon: '🚒', cat: 'services', size: 1, cost: 600, upkeep: 35, tier: 0, ground: 'pave', h: 60, svc: 'fire', lv: { r: 10, a: 6 }, desc: 'Brave firefighters protect the city. (Very important later!)' },
  busstop: { name: 'Bus Stop', icon: '🚏', cat: 'services', size: 1, cost: 200, upkeep: 5, tier: 0, ground: 'pave', h: 40, lv: { r: 4, a: 5 }, desc: 'More buses drive around the city.' },
  library: { name: 'Library', icon: '📚', cat: 'services', size: 1, cost: 900, upkeep: 25, tier: 1, ground: 'pave', h: 50, svc: 'school', lv: { r: 8, a: 10 }, desc: 'Books! A little school-power for the neighborhood.' },
  clinic: { name: 'Doctor Clinic', icon: '🩺', cat: 'services', size: 1, cost: 1200, upkeep: 30, tier: 1, ground: 'pave', h: 50, svc: 'health', lv: { r: 8, a: 8 }, desc: 'A small doctor office. Keeps the neighbors healthy.' },
  school: { name: 'School', icon: '🏫', cat: 'services', size: 2, cost: 1500, upkeep: 60, tier: 1, ground: 'grass', h: 60, svc: 'school', lv: { r: 12, a: 12 }, desc: 'Smart kids grow up to build taller towers!' },
  hospital: { name: 'Hospital', icon: '🏥', cat: 'services', size: 2, cost: 3000, upkeep: 80, tier: 2, ground: 'pave', h: 80, svc: 'health', lv: { r: 14, a: 12 }, desc: 'Keeps everyone healthy and happy.' },
  // ---- fun places (build as many as you like) ----
  market: { name: 'Farmers Market', icon: '🍎', cat: 'fun', size: 1, cost: 500, upkeep: 0, tier: 1, ground: 'pave', h: 40, tourism: 15, lv: { r: 5, a: 10 }, desc: 'Fresh fruit and veggies. Brings shoppers and visitors.' },
  cinema: { name: 'Movie Theater', icon: '🎬', cat: 'fun', size: 1, cost: 1500, upkeep: 0, tier: 1, ground: 'pave', h: 55, tourism: 40, lv: { r: 6, a: 10 }, desc: 'Popcorn and movies, with blinking lights at night!' },
  ferris: { name: 'Ferris Wheel', icon: '🎡', cat: 'fun', size: 2, cost: 4000, upkeep: 0, tier: 2, ground: 'pave', h: 110, tourism: 70, lv: { r: 7, a: 16 }, desc: 'A giant spinning wheel. The view from the top is amazing!' },
  museum: { name: 'Museum', icon: '🦕', cat: 'fun', size: 2, cost: 7000, upkeep: 0, tier: 2, ground: 'pave', h: 80, tourism: 120, lv: { r: 9, a: 18 }, desc: 'Dinosaurs, art and science. There is a T-rex out front!' },
  stadium: { name: 'Stadium', icon: '🏟️', cat: 'fun', size: 3, cost: 15000, upkeep: 0, tier: 3, ground: 'pave', h: 80, tourism: 300, lv: { r: 10, a: 15 }, desc: 'Big games, cheering crowds and giant lights.' },
  // ---- landmarks (only one of each!) ----
  dogpark: { name: `${POSS(PERSONAL.dog)} Dog Park`, icon: '🐕', cat: 'landmarks', size: 2, cost: 2000, upkeep: 0, tier: 1, ground: 'grass', h: 50, landmark: true, tourism: 60, lv: { r: 8, a: 25 }, desc: `${PERSONAL.dog} personally approved every tree in this park.` },
  donut: { name: `${POSS(PERSONAL.dad)} Donut Diner`, icon: '🍩', cat: 'landmarks', size: 2, cost: 2500, upkeep: 0, tier: 1, ground: 'pave', h: 60, landmark: true, tourism: 80, lv: { r: 8, a: 22 }, desc: `Home of the famous spinning donut! ${PERSONAL.dad} says they're the best in town.` },
  catcafe: { name: `${POSS(PERSONAL.cat)} Cat Café`, icon: '🐈', cat: 'landmarks', size: 2, cost: 4000, upkeep: 0, tier: 2, ground: 'pave', h: 80, landmark: true, tourism: 120, lv: { r: 9, a: 25 }, desc: `Hot cocoa and cats! ${PERSONAL.cat} sits on the roof and judges everyone.` },
  cupcake: { name: 'Giant Cupcake Tower', icon: '🧁', cat: 'landmarks', size: 2, cost: 6000, upkeep: 0, tier: 2, ground: 'pave', h: 140, landmark: true, tourism: 180, lv: { r: 10, a: 28 }, desc: 'A skyscraper shaped like a cupcake, with a cherry on top!' },
  observatory: { name: 'Star Observatory', icon: '🔭', cat: 'landmarks', size: 2, cost: 8000, upkeep: 0, tier: 3, ground: 'pave', h: 90, landmark: true, tourism: 220, lv: { r: 10, a: 25 }, desc: 'Look at planets and stars through a giant telescope.' },
  zoo: { name: `${POSS(NICK2)} Safari Zoo`, icon: '🦒', cat: 'landmarks', size: 3, cost: 12000, upkeep: 0, tier: 3, ground: 'grass', h: 80, landmark: true, tourism: 350, lv: { r: 12, a: 30 }, desc: 'Giraffes, elephants and penguins!' },
  space: { name: `${NICK1} Space Center`, icon: '🚀', cat: 'landmarks', size: 3, cost: 15000, upkeep: 0, tier: 3, ground: 'pave', h: 140, landmark: true, tourism: 450, lv: { r: 12, a: 25 }, desc: 'Real rocket launches! Click it to launch a rocket.' },
  statue: { name: `Statue of Mayor ${PERSONAL.mayor}`, icon: '🗽', cat: 'landmarks', size: 2, cost: 25000, upkeep: 0, tier: 4, ground: 'pave', h: 110, landmark: true, tourism: 700, lv: { r: 14, a: 35 }, desc: `A golden statue of the greatest mayor ever: ${PERSONAL.mayor}!` },
  castle: { name: 'Candy Castle', icon: '🏰', cat: 'landmarks', size: 3, cost: 30000, upkeep: 0, tier: 4, ground: 'grass', h: 150, landmark: true, tourism: 800, lv: { r: 14, a: 35 }, desc: 'A castle made of candy. Please do not lick the walls.' },
  skytower: { name: `${NICK2} Sky Tower`, icon: '🗼', cat: 'landmarks', size: 2, cost: 60000, upkeep: 0, tier: 5, ground: 'pave', h: 330, landmark: true, tourism: 1500, lv: { r: 16, a: 40 }, desc: 'The tallest tower in the world, with a searchlight at night!' },
};

const TOOLBAR = [
  { id: 'walk', icon: '🚶', label: 'Walk', key: 'g', special: true, tip: 'Walk around your city as yourself, with Moe! Visit shops and buy a home.' },
  { id: 'inspect', icon: '👆', label: 'Look', key: '1', tip: 'Look around. Click buildings to learn about them. Drag to move the map.' },
  { id: 'bulldoze', icon: '🚜', label: 'Bulldoze', key: '2', tip: 'Clear things away. Drag to clear an area.' },
  { id: 'road', icon: '🛣️', label: 'Road', key: '3', tip: `Drag to build roads. ${fmtMoney(ROAD_COST)} each (bridges over water cost more).` },
  { id: 'zoneR', icon: '🏠', label: 'Homes', key: '4', tip: 'Drag to zone land for homes. People move in by themselves!' },
  { id: 'zoneC', icon: '🍦', label: 'Shops', key: '5', tip: 'Drag to zone land for shops. They need customers nearby.' },
  { id: 'zoneI', icon: '🏭', label: 'Factories', key: '6', tip: 'Drag to zone land for factories. Lots of jobs, but smoky!' },
  { id: 'power', icon: '⚡', label: 'Power', key: '7', group: ['wind', 'coal', 'solar', 'fusion'] },
  { id: 'parks', icon: '🌳', label: 'Parks', key: '8', group: ['tree', 'park', 'garden', 'pond', 'sign', 'playground', 'fountain', 'basketball', 'icerink', 'field', 'pool', 'bigpark'] },
  { id: 'services', icon: '🚒', label: 'Services', key: '9', group: ['police', 'fire', 'busstop', 'library', 'clinic', 'school', 'hospital'] },
  { id: 'fun', icon: '🎡', label: 'Fun', key: 'q', group: ['market', 'cinema', 'ferris', 'museum', 'stadium'] },
  { id: 'landmarks', icon: '⭐', label: 'Landmarks', key: '0', group: ['dogpark', 'donut', 'catcafe', 'cupcake', 'observatory', 'zoo', 'space', 'statue', 'castle', 'skytower'] },
];
