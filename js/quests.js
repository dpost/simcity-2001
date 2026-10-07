'use strict';
// =====================================================================
//  Quests from Moe, the Chief Advisor
// =====================================================================
const D_ = PERSONAL.dog, M_ = PERSONAL.mayor;
const TUTORIAL = [
  { id: 't_road', title: 'Build a road', kind: 'roads', goal: 10, reward: 500, tool: 'road',
    text: `Hi Mayor ${M_}! I'm ${D_}, your Chief Advisor (and a very good boy). Every city starts with roads! Pick 🛣️ Road and drag on the map to build 10 road tiles.` },
  { id: 't_homes', title: 'Zone some homes', kind: 'zoneR', goal: 8, reward: 500, tool: 'zoneR',
    text: 'People need places to live! Pick 🏠 Homes and drag to paint at least 8 home zones right next to your road.' },
  { id: 't_power', title: 'Power it up!', kind: 'plants', goal: 1, reward: 1000, tool: 'power',
    text: "Nobody will move in without electricity! Open ⚡ Power and build a Wind Turbine or Coal Plant touching your road. Power flows along roads and buildings!" },
  { id: 't_people', title: 'Welcome, neighbors!', kind: 'pop', goal: 40, reward: 500,
    text: 'Now watch the houses pop up! Tip: press ⏩ in the top bar to speed up time. Reach 40 residents.' },
  { id: 't_jobs', title: 'Shops and jobs', kind: 'zoneCI', goal: 8, reward: 800, tool: 'zoneC',
    text: 'Everyone needs jobs and snacks! Zone at least 4 🍦 Shops and 4 🏭 Factories. Keep factories a little away from homes, because they are smoky!' },
  { id: 't_park', title: 'Make it pretty', kind: 'parks', goal: 2, reward: 500, tool: 'parks',
    text: 'Happy people build BIGGER homes! Open 🌳 Parks and build 2 parks or gardens next to your houses.' },
  { id: 't_150', title: 'Growing up', kind: 'pop', goal: 150, reward: 1000,
    text: 'Look at the R C I bars at the top: tall green bars show what your city wants more of. Reach 150 people!' },
  { id: 't_town', title: 'Become a Town!', kind: 'pop', goal: 400, reward: 2500,
    text: 'Reach 400 people and your village becomes a Town, and you unlock new buildings like my very own Dog Park! Tip: if houses stop appearing, zone more land. If they stop growing, add parks and trees nearby.' },
];

const Quests = {
  value(q) {
    const c = S.counts || {};
    switch (q.kind) {
      case 'roads': return c.roads || 0;
      case 'zoneR': return c.zoneR || 0;
      case 'zoneCI': return Math.min(c.zoneC || 0, 4) + Math.min(c.zoneI || 0, 4);
      case 'plants': return c.plants || 0;
      case 'pop': return S.pop;
      case 'parks': return c.parks || 0;
      case 'trees': return c.trees || 0;
      case 'shops': return c.C || 0;
      case 'lvl3': return c.lvl3 || 0;
      case 'happy': return S.happiness;
      case 'income': return S.net;
      case 'build': return (c.types || {})[q.type] || 0;
    }
    return 0;
  },
  progress(q) { return clamp(this.value(q) - (q.base || 0), 0, q.goal); },

  ensure() {
    const Q = W.quest;
    if (Q.tut < TUTORIAL.length) {
      if (!Q.active.length) { const t = TUTORIAL[Q.tut]; Q.active.push({ ...t, tut: true }); UI.say(t.text, 'dog', t.id); UI.renderQuests(); }
      return;
    }
    let tries = 0;
    while (Q.active.length < 2 && tries++ < 20) {
      const q = this.generate();
      if (q && !Q.active.some((a) => a.id === q.id)) { Q.active.push(q); UI.renderQuests(); }
    }
  },

  generate() {
    const c = S.counts || {}, tier = W.tier, recent = W.quest.history.slice(-3);
    const rew = (m) => Math.round((400 + tier * 600) * m / 50) * 50;
    const gens = [
      () => { const g = niceRound(Math.max(S.pop * 1.3, S.pop + 150)); return { id: 'pop', kind: 'pop', goal: g, title: `Reach ${fmtNum(g)} people`, text: `${W.cityName} is getting popular! Let's grow to ${fmtNum(g)} people. Zone more land where the demand bars are tall.`, reward: rew(1.5) }; },
      () => ({ id: 'parks', kind: 'parks', goal: 3, base: c.parks || 0, rel: true, title: 'Build 3 more parks', text: 'Parks make people happy, and happy people build taller buildings. Build 3 more parks or gardens!', reward: rew(0.8), tool: 'parks' }),
      () => ({ id: 'trees', kind: 'trees', goal: 12, base: c.trees || 0, rel: true, title: 'Plant 12 trees', text: 'I LOVE trees (for many reasons). Plant 12 more trees! Tip: you can drag with the Tree tool.', reward: rew(0.6), tool: 'parks' }),
      () => ({ id: 'shops', kind: 'shops', goal: 5, base: c.C || 0, rel: true, title: 'Open 5 new shops', text: 'Residents want more places to buy ice cream. Get 5 more shops in your city!', reward: rew(0.8), tool: 'zoneC' }),
      () => tier >= 1 ? { id: 'lvl3', kind: 'lvl3', goal: 3, base: c.lvl3 || 0, rel: true, title: 'Grow 3 skyscrapers', text: 'Buildings grow to the max level when the area is really nice. Add parks, schools and services near busy zones to grow 3 more skyscrapers!', reward: rew(1.4) } : null,
      () => { if (S.happiness >= 88) return null; const g = Math.min(90, Math.max(60, Math.ceil((S.happiness + 8) / 5) * 5)); return { id: 'happy', kind: 'happy', goal: g, title: `Happiness to ${g}%`, text: `Let's make everyone smile! Get happiness up to ${g}%. Parks, schools, police and lower taxes all help.`, reward: rew(1.2) }; },
      () => {
        const lm = TOOLBAR.find((t) => t.id === 'landmarks').group.find((k) => isUnlocked(k) && !hasLandmark(k));
        if (!lm) return null;
        return { id: 'lm_' + lm, kind: 'build', type: lm, goal: 1, title: `Build ${BT[lm].name}`, text: `${BT[lm].name} is unlocked! Landmarks bring tourists (and tourists bring money). Open ⭐ Landmarks to build it.`, reward: rew(1), tool: 'landmarks' };
      },
      () => {
        const svc = ['police', 'fire', 'school', 'hospital'].find((k) => isUnlocked(k) && !((c.types || {})[k]));
        if (!svc) return null;
        return { id: 'svc_' + svc, kind: 'build', type: svc, goal: 1, title: `Build a ${BT[svc].name}`, text: `Every good city needs a ${BT[svc].name}. Build one near your homes!`, reward: rew(0.8), tool: 'services' };
      },
      () => { if (W.mode === 'creative') return null; const g = niceRound(Math.max(500, S.net * 1.4 + 200)); return { id: 'income', kind: 'income', goal: g, title: `Earn ${fmtMoney(g)} a month`, text: `Let's grow the treasury! Get your monthly profit to ${fmtMoney(g)}. More people and businesses mean more taxes.`, reward: rew(1) }; },
    ];
    const order = gens.map((g, i) => i).sort(() => Math.random() - 0.5);
    for (const i of order) {
      const q = gens[i]();
      if (!q || recent.includes(q.id)) continue;
      if (this.value(q) - (q.base || 0) >= q.goal) continue;
      return q;
    }
    return null;
  },

  check() {
    if (!W.quest) return;
    this.ensure();
    const Q = W.quest;
    for (const q of [...Q.active]) {
      if (this.progress(q) < q.goal) continue;
      Q.active.splice(Q.active.indexOf(q), 1);
      Q.done++; Q.history.push(q.id); if (Q.history.length > 10) Q.history.shift();
      if (q.tut) Q.tut++;
      const reward = q.reward || 0;
      if (W.mode !== 'creative') W.money += reward;
      Sound.play('quest');
      FX.confetti(60);
      const msg = q.tut && Q.tut >= TUTORIAL.length
        ? `You did it! You finished my training, Mayor ${M_}! From now on I'll give you new challenges. Here's ${fmtMoney(reward)}!`
        : `Great job! "${q.title}" done. ${W.mode !== 'creative' ? `Here's ${fmtMoney(reward)} for the city!` : 'Woof!'}`;
      if (!q.tut || Q.tut >= TUTORIAL.length) UI.say(msg, 'dog');
      else UI.toast(`✅ ${q.title}: +${fmtMoney(reward)}`);
      UI.renderQuests();
    }
    this.ensure();
    UI.updateQuestProgress();
  },
};
