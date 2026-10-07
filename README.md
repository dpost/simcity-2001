# 🏙️ Mayor Nelly's City Builder

A cozy isometric city builder made just for Nelly (a.k.a. Nellbo, a.k.a. Snorty).
It runs in any web browser, needs no installs, and draws every building, car, rocket and
cat in code, so there are no image files.

## How to play

| | |
|---|---|
| 🛣️ **Roads first** | Drag to build. Everything needs a road within 2 tiles. Roads over water become bridges. |
| 🏠 🍦 🏭 **Zones** | Paint Homes, Shops and Factories. Buildings appear on their own and grow from cottages into skyscrapers. |
| ⚡ **Power** | Put a power plant next to a road. Power flows along roads and buildings. |
| 📊 **R C I bars** | The bars in the top bar show what the city wants next. A tall bar means build more of that. |
| 🏗️ **Growth map** | The map button (bottom right) shows why buildings are or aren't growing. Purple means skyscraper, green means ready to grow, orange means the spot needs to be nicer. |
| 😊 **Niceness** | Parks, trees, water, schools, police and landmarks make land nicer. Factory smoke makes it worse. |
| ⭐ 🎡 **Landmarks & Fun** | These unlock as the city grows: Village → Town → City → Big City → Metropolis → Megalopolis. Tourists pay to visit them. |
| 🚶 **Walk** (`G`) | Walk around as Nelly, with Moe following. Use the arrow keys or WASD, and press `E` at a shop or house. You can swim in lakes and rivers (Moe paddles too). Stay away from radiation and fires! You get a Mayor's salary every month, can pick up coins on the sidewalk, and can buy treats, clothes, things for Moe, and a home. Then you decorate the home with furniture. |
| 🌪️ **Disasters** (`X`) | Fire, tornado, tsunami and nuclear meltdown. Surprise disasters start once the city is a Town and can be turned off. Fire stations fight fires, and rubble clears itself (or you can build over it). |
| 🎵 **Jukebox** | Four original songs. Pick one or shuffle. |
| ❄️🌸☀️🍂 **Seasons** | Each season lasts 5 minutes of play: snow in winter, blossoms in spring, falling leaves in autumn. |
| 👻 **See-through** (`H`) | Makes buildings see-through so you can see the roads. While walking, buildings in front of you fade automatically. |
| 🍫 **Chocolate Factory** | Under 🎡 Fun. Has a chocolate waterfall, creates factory jobs, and you can take the tour and buy Nana's cookies. |
| 🐕 **Moe** | The Chief Advisor teaches the basics, then hands out quests with cash rewards. |

**Controls:** drag with 👆 Look (or right-drag with any tool) to move around. Scroll or pinch to zoom, or use WASD / arrow keys.
Keys `1`–`0` pick tools, `Q` opens Fun, `G` walks, `X` opens Disasters, `H` toggles see-through, `Space` pauses, `Esc` cancels.
Building over houses, zones, trees and small parks clears them automatically, so no bulldozing is needed.

**Modes:** 🏆 *Career* comes in 🌱 Easy, ⭐ Normal (money is tight) and 🔥 Hard. 🎨 *Creative* gives unlimited money with everything unlocked.
There are 3 save slots, and the game autosaves every 30 seconds.

**Moving to another computer:** in ☰ Menu, choose 📥 *Download city file*. On the other computer, go to *Load a city* → *📤 Open a city file…*.

## Running it

- **Easiest:** double-click `index.html`. It works offline in Chrome, Edge, Firefox or Safari.
- **GitHub Pages (a link she can bookmark):**
  1. Merge this branch into `main`.
  2. Go to repo **Settings → Pages**. Under *Build and deployment*, choose *Deploy from a branch*, then `main`, then `/ (root)`, then **Save**.
  3. After about a minute the game is live at `https://dpost.github.io/simcity-2001/`.

  Note: this repo is **private**. Pages on a private repo requires GitHub Pro, Team or Enterprise. Otherwise, make the repo public first.

Saves live in the browser (`localStorage`), so they belong to that browser on that computer.

## Make it personal ✏️

The first lines of [`js/config.js`](js/config.js) control all the personal touches:

```js
const PERSONAL = {
  mayor: 'Nelly',
  nicknames: ['Nellbo', 'Snorty'],
  dad: 'David',
  dog: 'Moe',
  cat: 'Jason',
  grandma: 'Nana',
  defaultCityName: 'Snortopolis',
  dogColors: { fur: '#f8f5ee', ears: '#ece2d0', muzzle: '#ffffff', nose: '#2b1d14', outline: '#cfc6b6', collar: '#ff6fa5' }, // Moe: white Pyrador
  catColors: { fur: '#f2a54a', stripes: '#c46f1c', eyes: '#62c050' }, // ...and Jason like Jason
};
```

Balance knobs (costs, how fast months pass, tier sizes) live in the same file.

## Code map

| File | What it does |
|---|---|
| `js/config.js` | Names, buildings, zones, tiers, costs |
| `js/world.js` | Map generation, placing and bulldozing |
| `js/sim.js` | Power grid, land value, demand, growth, budget, tiers |
| `js/sprites2.js` | v2 buildings: parks, services, Fun places |
| `js/disasters.js` | Fire, tornado, tsunami, meltdown, rubble and radiation |
| `js/life.js` / `js/home.js` | Walk mode, wallet, shops and items, buying and furnishing a home |
| `js/quests.js` / `js/news.js` | Moe's tutorial and quests, and the news ticker jokes |
| `js/sprites.js` | All the procedural art, plus the animated bits (spinning donut, cat tail, rockets...) |
| `js/render.js` | Isometric renderer, day and night, floating-island diorama |
| `js/entities.js` | Cars, people walking dogs, boats, balloons, blimp, rockets, fireworks, smoke |
| `js/ui.js` / `js/input.js` | HUD, menus, title screen; mouse and keyboard |
| `js/audio.js` | Sound effects and four original songs (WebAudio) |
| `js/save.js` | 3 save slots and autosave |

## Roadmap ideas

- 👀 A first-person "through your own eyes" street view while walking
- Jobs and mini-games to earn money in Life mode, and visiting neighbors
- Trains and a subway, plus an achievements sticker book
- Whatever Nelly asks for next!
