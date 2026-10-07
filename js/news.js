'use strict';
// =====================================================================
//  The news ticker: silly headlines + useful hints about the city
// =====================================================================
const News = {
  queue: [], current: '', timer: 0, recent: [],
  fun: [
    '{cat} the cat was spotted napping on a warm car hood. The car was not consulted.',
    '{dog} has officially sniffed every fire hydrant in {city}. "They are all excellent," he reports.',
    'Survey: 9 out of 10 residents say Mayor {mayor} is the best mayor ever. The 10th was a squirrel.',
    'Local dad {dad} claims his pancakes are the best in {city}. Nobody has dared to disagree.',
    'Scientists confirm: ice cream tastes 47% better on sunny days in {city}.',
    'BREAKING: Lost hamster found safe inside a bakery. Says it "regrets nothing."',
    '{cat} the cat knocked a glass off a table at City Hall. Officials say it was "definitely on purpose."',
    'Mayor {mayor} declares Friday "Wear Your Pajamas to Work Day." Productivity unchanged.',
    'Weather: sunny, with a 30% chance of {dog} stealing your sandwich.',
    'A pigeon has been elected to the Parks Committee. It mostly votes for bread.',
    'Rumor has it {n2} has the best laugh in all of {city}. Scientists are investigating.',
    'Kids of {city} vote to replace broccoli with cupcakes. Parents say they are "thinking about it."',
    'New study: petting dogs makes you 100% happier. {dog} volunteers for more research.',
    'Traffic report: all cars moving smoothly, except one that stopped to look at a cute cat.',
    '{city} Library adds a new section: "Books About Cats Who Ignore You." {cat} approves.',
    'Astronomers spot a new star. They are calling it "{n1}."',
    'Local bakery invents the Sprinkle Volcano Cupcake. Lines go around the block.',
    'Fun fact: {city} has more dogs than parking meters. The dogs are winning.',
    '{dog} has been promoted to Chief Advisor of Treats. Again.',
    'A cat café asked if {cat} could visit. The answer was "only if he is nice." He was not.',
    'Mysterious paw prints found on fresh cement downtown. Main suspect: {dog}. He denies everything.',
    'Local robot learns to dance. Mostly does "the robot."',
    'Breaking: {dad} tells the same joke for the 100th time. Family still laughing (politely).',
    'Residents report the clouds over {city} look extra fluffy today.',
    'The {city} Marching Band has learned a new song. The neighbors have learned earplugs.',
    'Sneaky raccoon caught borrowing donuts. Says it will "definitely bring them back."',
    '{cat} has been named Official Nap Inspector. He takes the job very seriously.',
    'Sports: {city} wins the regional Hide and Seek championship. Team still has not been found.',
  ],
  fill(s) {
    return s.replace(/\{city\}/g, W.cityName || PERSONAL.defaultCityName).replace(/\{mayor\}/g, PERSONAL.mayor).replace(/\{dog\}/g, PERSONAL.dog)
      .replace(/\{cat\}/g, PERSONAL.cat).replace(/\{dad\}/g, PERSONAL.dad).replace(/\{n1\}/g, NICK1).replace(/\{n2\}/g, NICK2);
  },
  hint() {
    const c = S.counts || {};
    const hints = [];
    if (S.shortage) hints.push('⚡ POWER SHORTAGE! Some buildings are in the dark. Build another power plant!');
    if (S.needRoad > 3) hints.push('🚗 Some zones are too far from a road. Buildings need a road within 2 tiles!');
    if (S.needPower > 3 && !S.shortage) hints.push('🔌 Some zones have no power. Connect them to a power plant with roads!');
    if (S.demand.R > 0.6 && S.pop > 30) hints.push('🏠 Everyone wants to move to {city}! Zone more homes!');
    if (S.demand.C > 0.6 && S.pop > 60) hints.push('🍦 Residents are hungry for more shops! Zone some Shops.');
    if (S.demand.I > 0.6 && S.pop > 60) hints.push('🏭 Businesses want more factories! Zone some Factories.');
    if (W.taxRate > 10) hints.push('💸 Residents grumble about high taxes. Some are moving away!');
    if (S.happiness > 80 && S.pop > 200) hints.push('😊 {city} voted "Happiest City in the Region"!');
    if (S.happiness < 40 && S.pop > 100) hints.push('😟 Residents are grumpy. Try more parks, trees and services.');
    let maxP = 0; for (let i = 0; i < N * N; i += 7) if (W.zone[i] === 1 && D.poll[i] > maxP) maxP = D.poll[i];
    if (maxP > 30) hints.push('😷 Homes near the factories say it smells like burnt toast. Move factories away or add trees!');
    if (c.types && c.types.space) hints.push('🚀 Nellbo Space Center: click it with 👆 Look to launch a rocket!'.replace('Nellbo', NICK1));
    if (c.types && c.types.catcafe) hints.push('🐈 {cat} has been sitting on the Cat Café roof for 3 days. Customers love it.');
    if (c.types && c.types.dogpark) hints.push('🐕 {dog} visits the dog park every day "for official advisor business."');
    return hints;
  },
  next() {
    const hints = this.hint().filter((h) => !this.recent.includes(h));
    let s;
    if (hints.length && Math.random() < 0.55) s = pick(hints);
    else { let tries = 0; do { s = pick(this.fun); } while (this.recent.includes(s) && tries++ < 10); }
    this.recent.push(s); if (this.recent.length > 8) this.recent.shift();
    return this.fill(s);
  },
  push(s) { this.queue.push(this.fill(s)); },
  monthly() { /* hints are picked when the ticker rotates */ },
  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.current = this.queue.length ? this.queue.shift() : this.next();
      this.timer = 11;
      UI.setTicker(this.current);
    }
  },
};
