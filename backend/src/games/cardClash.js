import { normalizeSearchText } from '../scripts/fetch_and_clean.js';

export const GOLD_RULES = [
  { id: 'g_barca', title: "FC Barcelona'da oynamış", test: (p) => hasClub(p, 'FC Barcelona') },
  { id: 'g_real', title: "Real Madrid'de oynamış", test: (p) => hasClub(p, 'Real Madrid') },
  { id: 'g_gala', title: "Galatasaray'da oynamış", test: (p) => hasClub(p, 'Galatasaray') },
  { id: 'g_fener', title: "Fenerbahçe'de oynamış", test: (p) => hasClub(p, 'Fenerbahçe') },
  { id: 'g_bjk', title: "Beşiktaş'ta oynamış", test: (p) => hasClub(p, 'Beşiktaş') },
  { id: 'g_city', title: "Manchester City'de oynamış", test: (p) => hasClub(p, 'Manchester City') },
  { id: 'g_bayern', title: "Bayern München'de oynamış", test: (p) => hasClub(p, 'Bayern München') },
  { id: 'g_brazil', title: "Brezilyalı futbolcu", test: (p) => hasNat(p, 'Brezilya') },
  { id: 'g_france', title: "Fransız futbolcu", test: (p) => hasNat(p, 'Fransa') },
  { id: 'g_turkey', title: "Türk futbolcu", test: (p) => hasNat(p, 'Türkiye') },
  { id: 'g_spain', title: "İspanyol futbolcu", test: (p) => hasNat(p, 'İspanya') },
  { id: 'g_argentina', title: "Arjantinli futbolcu", test: (p) => hasNat(p, 'Arjantin') },
  { id: 'g_pl', title: "Premier Lig'de oynamış", test: (p) => p.league === 'Premier League' || hasLeague(p, 'Premier League') },
  { id: 'g_superlig', title: "Süper Lig'de oynamış", test: (p) => p.league === 'Süper Lig' || hasLeague(p, 'Süper Lig') },
  { id: 'g_striker', title: "Forvet (ST, CF, LW, RW)", test: (p) => p.category === 'ATT' || ['ST', 'CF', 'LW', 'RW'].includes(p.primaryPosition) },
  { id: 'g_cb', title: "Stoper (CB) oyuncusu", test: (p) => p.primaryPosition === 'CB' || (p.positions && p.positions.includes('CB')) }
];

export const DUEL_RULES = [
  { id: 'yellow_cards', title: 'En Çok Sarı Kart 🟨', statKey: 'yellowCards', getVal: (p) => p.yellowCards || 20, desc: 'Kariyeri boyunca en çok sarı kart gören kazanır!' },
  { id: 'goals', title: 'En Çok Gol ⚽', statKey: 'goals', getVal: (p) => p.goals || (p.stats?.shooting ? p.stats.shooting * 2 : 40), desc: 'En çok kariyer golü atan kazanır!' },
  { id: 'overall', title: 'En Yüksek Overall (Reyting) ⭐', statKey: 'overall', getVal: (p) => p.overall || 75, desc: 'En yüksek genel reytinge sahip olan kazanır!' },
  { id: 'pace', title: 'En Hızlı Futbolcu (Pace) ⚡', statKey: 'pace', getVal: (p) => p.stats?.pace || 70, desc: 'En yüksek hız değerine sahip olan kazanır!' },
  { id: 'shooting', title: 'En Güçlü Şut (Shooting) 🎯', statKey: 'shooting', getVal: (p) => p.stats?.shooting || 65, desc: 'Şut isabeti en yüksek olan kazanır!' },
  { id: 'age', title: 'En Yaşlı Futbolcu (Tecrübe) 👴', statKey: 'age', getVal: (p) => p.age || 26, desc: 'En yüksek yaşa ve tecrübeye sahip olan kazanır!' },
  { id: 'red_cards', title: 'En Çok Kırmızı Kart 🟥', statKey: 'redCards', getVal: (p) => p.redCards !== undefined ? p.redCards : Math.floor((p.yellowCards || 20) / 10), desc: 'Kırmızı kart sayısı en fazla olan agresif oyuncu kazanır!' }
];

function hasClub(player, clubKeyword) {
  const normKw = normalizeSearchText(clubKeyword);
  const currentNorm = normalizeSearchText(player.club);
  if (currentNorm.includes(normKw)) return true;
  return (player.careerClubs || []).some(c => normalizeSearchText(c).includes(normKw));
}

function hasNat(player, natKeyword) {
  const normKw = normalizeSearchText(natKeyword);
  const natNorm = normalizeSearchText(player.nationality);
  return natNorm.includes(normKw) || normKw.includes(natNorm);
}

function hasLeague(player, leagueKeyword) {
  const normKw = normalizeSearchText(leagueKeyword);
  const lNorm = normalizeSearchText(player.league);
  return lNorm.includes(normKw);
}

export function validatePlayerForGoldRule(player, ruleId) {
  const rule = GOLD_RULES.find(r => r.id === ruleId);
  if (!rule) return true;
  return rule.test(player);
}

export function generateCardClashSetup() {
  // Pick 3 distinct random Gold rules
  const shuffledGold = [...GOLD_RULES].sort(() => 0.5 - Math.random());
  const selectedGoldRules = shuffledGold.slice(0, 3).map(r => ({ id: r.id, title: r.title }));

  // Pick 7 distinct Duel Rules in random order
  const shuffledDuel = [...DUEL_RULES].sort(() => 0.5 - Math.random()).slice(0, 7);

  return {
    stage: 'draft', // 'draft' -> 'battle' -> 'ended'
    goldRules: selectedGoldRules,
    duelRules: shuffledDuel,
    currentRoundIndex: 0,
    roundResults: [],
    drafts: {}, // { username: [ { slotIndex, isGold, ruleId, player } ] }
    readyPlayers: {}, // { username: boolean }
    currentPlays: {}, // { username: playedCard }
    clashScores: {} // { username: number }
  };
}
