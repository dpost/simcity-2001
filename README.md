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
| 😊 **Niceness** | Parks, trees, water, schools, police and landmarks make land nicer. Nicer land grows taller buildings. Factory smoke makes it worse. |
| ⭐ **Landmarks** | These unlock as the city grows: Village → Town → City → Big City → Metropolis → Megalopolis. Tourists pay to visit them. |
| 🐕 **Moe** | The Chief Advisor teaches the basics, then hands out quests with cash rewards. |

**Controls:** drag with 👆 Look (or right-drag with any tool) to move around. Scroll or pinch to zoom, or use WASD / arrow keys.
Keys `1`–`0` pick tools, `Space` pauses, `Esc` cancels.

**Modes:** 🏆 *Career* starts with $25,000 and unlocks things as the city grows. 🎨 *Creative* gives unlimited money with everything unlocked.
There are 3 save slots, and the game autosaves every 30 seconds in the browser.

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
| `js/quests.js` / `js/news.js` | Moe's tutorial and quests, and the news ticker jokes |
| `js/sprites.js` | All the procedural art, plus the animated bits (spinning donut, cat tail, rockets...) |
| `js/render.js` | Isometric renderer, day and night, floating-island diorama |
| `js/entities.js` | Cars, people walking dogs, boats, balloons, blimp, rockets, fireworks, smoke |
| `js/ui.js` / `js/input.js` | HUD, menus, title screen; mouse and keyboard |
| `js/audio.js` | Generated sound effects and music (WebAudio) |
| `js/save.js` | 3 save slots and autosave |

## Roadmap (v2 ideas)

- 🔥 **Disasters** (Dad's favorite part of SimCity 2000): fires that spread and are put out by fire-station coverage, tornadoes, floods along the river, a meteor, and maybe a giant Jason the cat stomping through town. Fire and police coverage is already simulated (`D.cov`), so disasters can plug straight in.
- Seasons with snow, trains or a subway, an achievements sticker book, and photo mode.
- Whatever Nelly asks for next!
