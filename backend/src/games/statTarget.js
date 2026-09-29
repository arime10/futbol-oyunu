import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const legendsPath = path.join(__dirname, '..', 'data', 'legends_database.json');

let legendsMap = new Map();
if (fs.existsSync(legendsPath)) {
  try {
    const list = JSON.parse(fs.readFileSync(legendsPath, 'utf-8'));
    list.forEach(l => legendsMap.set(l.id, l));
  } catch (e) {
    console.error('Failed to load legends_database.json:', e);
  }
}

export const STAT_CHALLENGES = [
  // --- GOLLER ---
  {
    id: 'career-goals',
    title: 'Toplam Kariyer Golü',
    description: 'Seçeceğiniz 5 futbolcunun kariyerindeki toplam resmi gol sayısı',
    target: 500,
    unit: 'Gol',
    statKey: 'careerGoals'
  },
  {
    id: 'pl-goals',
    title: 'Premier League Golleri',
    description: 'Seçeceğiniz 5 futbolcunun Premier League kariyerindeki toplam gol sayısı',
    target: 250,
    unit: 'Gol',
    statKey: 'plGoals'
  },
  {
    id: 'la-liga-goals',
    title: 'La Liga Golleri',
    description: 'Seçeceğiniz 5 futbolcunun La Liga kariyerindeki toplam gol sayısı',
    target: 220,
    unit: 'Gol',
    statKey: 'laLigaGoals'
  },
  {
    id: 'serie-a-goals',
    title: 'Serie A Golleri',
    description: 'Seçeceğiniz 5 futbolcunun Serie A kariyerindeki toplam gol sayısı',
    target: 220,
    unit: 'Gol',
    statKey: 'serieAGoals'
  },
  {
    id: 'ucl-goals',
    title: 'Şampiyonlar Ligi Golleri',
    description: 'Seçeceğiniz 5 futbolcunun UEFA Şampiyonlar Ligi toplam gol sayısı',
    target: 120,
    unit: 'Gol',
    statKey: 'uclGoals'
  },
  {
    id: 'super-lig-goals',
    title: 'Trendyol Süper Lig Golleri',
    description: 'Seçeceğiniz 5 futbolcunun Süper Lig kariyerindeki toplam gol sayısı',
    target: 100,
    unit: 'Gol',
    statKey: 'superLigGoals'
  },

  // --- ASİSTLER ---
  {
    id: 'career-assists',
    title: 'Toplam Kariyer Asisti',
    description: 'Seçeceğiniz 5 futbolcunun kariyerindeki toplam asist sayısı',
    target: 250,
    unit: 'Asist',
    statKey: 'careerAssists'
  },
  {
    id: 'pl-assists',
    title: 'Premier League Asistleri',
    description: 'Seçeceğiniz 5 futbolcunun Premier League tarihindeki asist sayısı',
    target: 120,
    unit: 'Asist',
    statKey: 'plAssists'
  },
  {
    id: 'ucl-assists',
    title: 'Şampiyonlar Ligi Asistleri',
    description: 'Seçeceğiniz 5 futbolcunun UEFA Şampiyonlar Ligi toplam asist sayısı',
    target: 60,
    unit: 'Asist',
    statKey: 'uclAssists'
  },
  {
    id: 'super-lig-assists',
    title: 'Trendyol Süper Lig Asistleri',
    description: 'Seçeceğiniz 5 futbolcunun Süper Lig kariyerindeki toplam asist sayısı',
    target: 70,
    unit: 'Asist',
    statKey: 'superLigAssists'
  },

  // --- KARTLAR ---
  {
    id: 'career-yellow-cards',
    title: 'Toplam Sarı Kart Sayısı 🟨',
    description: 'Seçeceğiniz 5 futbolcunun kariyerindeki toplam sarı kart sayısı',
    target: 250,
    unit: 'Sarı Kart',
    statKey: 'careerYellowCards'
  },
  {
    id: 'super-lig-yellow-cards',
    title: 'Süper Lig Sarı Kart Sayısı 🟨',
    description: 'Seçeceğiniz 5 futbolcunun Süper Lig kariyerindeki sarı kart sayısı',
    target: 120,
    unit: 'Sarı Kart',
    statKey: 'superLigYellowCards'
  },
  {
    id: 'career-red-cards',
    title: 'Toplam Kırmızı Kart Sayısı 🟥',
    description: 'Seçeceğiniz 5 futbolcunun kariyerindeki toplam kırmızı kart sayısı',
    target: 20,
    unit: 'Kırmızı Kart',
    statKey: 'careerRedCards'
  },

  // --- TOPLAM MAÇ (APPEARANCES) ---
  {
    id: 'career-matches',
    title: 'Toplam Kariyer Maçı Sayısı',
    description: 'Seçeceğiniz 5 futbolcunun kariyeri boyunca çıktığı toplam resmi maç sayısı',
    target: 1800,
    unit: 'Maç',
    statKey: 'careerMatches'
  },
  {
    id: 'pl-matches',
    title: 'Premier League Toplam Maç',
    description: 'Seçeceğiniz 5 futbolcunun Premier League kariyerindeki maç sayısı',
    target: 800,
    unit: 'Maç',
    statKey: 'plMatches'
  },
  {
    id: 'la-liga-matches',
    title: 'La Liga Toplam Maç',
    description: 'Seçeceğiniz 5 futbolcunun La Liga kariyerindeki maç sayısı',
    target: 700,
    unit: 'Maç',
    statKey: 'laLigaMatches'
  },
  {
    id: 'super-lig-matches',
    title: 'Trendyol Süper Lig Toplam Maç',
    description: 'Seçeceğiniz 5 futbolcunun Süper Lig kariyerindeki maç sayısı',
    target: 500,
    unit: 'Maç',
    statKey: 'superLigMatches'
  },
  {
    id: 'ucl-matches',
    title: 'Şampiyonlar Ligi Toplam Maç',
    description: 'Seçeceğiniz 5 futbolcunun UEFA Şampiyonlar Ligi toplam maç sayısı',
    target: 250,
    unit: 'Maç',
    statKey: 'uclMatches'
  }
];

// Curated top player reference stats
export const PLAYER_STATS_MAP = {
  // Cristiano Ronaldo
  '20801': {
    careerGoals: 910, careerAssists: 256, careerMatches: 1250, careerYellowCards: 128, careerRedCards: 11,
    plGoals: 103, laLigaGoals: 311, serieAGoals: 81, uclGoals: 140, superLigGoals: 0,
    plAssists: 39, uclAssists: 42, superLigAssists: 0,
    plMatches: 236, laLigaMatches: 292, uclMatches: 183, superLigMatches: 0, superLigYellowCards: 0
  },
  // Lionel Messi
  '158023': {
    careerGoals: 850, careerAssists: 378, careerMatches: 1080, careerYellowCards: 92, careerRedCards: 3,
    plGoals: 0, laLigaGoals: 474, serieAGoals: 0, uclGoals: 129, superLigGoals: 0,
    plAssists: 0, uclAssists: 40, superLigAssists: 0,
    plMatches: 0, laLigaMatches: 520, uclMatches: 163, superLigMatches: 0, superLigYellowCards: 0
  },
  // Harry Kane
  '202126': {
    careerGoals: 380, careerAssists: 95, careerMatches: 580, careerYellowCards: 48, careerRedCards: 0,
    plGoals: 213, laLigaGoals: 0, serieAGoals: 0, uclGoals: 33, superLigGoals: 0,
    plAssists: 46, uclAssists: 7, superLigAssists: 0,
    plMatches: 320, laLigaMatches: 0, uclMatches: 45, superLigMatches: 0, superLigYellowCards: 0
  },
  // Erling Haaland
  '239085': {
    careerGoals: 260, careerAssists: 52, careerMatches: 310, careerYellowCards: 22, careerRedCards: 0,
    plGoals: 73, laLigaGoals: 0, serieAGoals: 0, uclGoals: 44, superLigGoals: 0,
    plAssists: 14, uclAssists: 5, superLigAssists: 0,
    plMatches: 75, laLigaMatches: 0, uclMatches: 41, superLigMatches: 0, superLigYellowCards: 0
  },
  // Kevin De Bruyne
  '192985': {
    careerGoals: 152, careerAssists: 260, careerMatches: 620, careerYellowCards: 46, careerRedCards: 1,
    plGoals: 68, laLigaGoals: 0, serieAGoals: 0, uclGoals: 16, superLigGoals: 0,
    plAssists: 112, uclAssists: 26, superLigAssists: 0,
    plMatches: 260, laLigaMatches: 0, uclMatches: 78, superLigMatches: 0, superLigYellowCards: 0
  },
  // Sergio Ramos
  '155862': {
    careerGoals: 138, careerAssists: 42, careerMatches: 998, careerYellowCards: 265, careerRedCards: 29,
    plGoals: 0, laLigaGoals: 74, serieAGoals: 0, uclGoals: 15, superLigGoals: 0,
    plAssists: 0, uclAssists: 9, superLigAssists: 0,
    plMatches: 0, laLigaMatches: 508, uclMatches: 142, superLigMatches: 0, superLigYellowCards: 0
  },
  // Ciro Immobile
  '192387': {
    careerGoals: 335, careerAssists: 74, careerMatches: 610, careerYellowCards: 78, careerRedCards: 4,
    plGoals: 0, laLigaGoals: 2, serieAGoals: 201, uclGoals: 9, superLigGoals: 10,
    plAssists: 0, uclAssists: 2, superLigAssists: 2,
    plMatches: 0, laLigaMatches: 8, uclMatches: 23, superLigMatches: 18, superLigYellowCards: 4
  },
  // Mauro Icardi
  '201399': {
    careerGoals: 250, careerAssists: 48, careerMatches: 440, careerYellowCards: 32, careerRedCards: 2,
    plGoals: 0, laLigaGoals: 0, serieAGoals: 121, uclGoals: 10, superLigGoals: 55,
    plAssists: 0, uclAssists: 4, superLigAssists: 16,
    plMatches: 0, laLigaMatches: 0, uclMatches: 28, superLigMatches: 65, superLigYellowCards: 8
  },
  // Edin Džeko
  '180930': {
    careerGoals: 410, careerAssists: 145, careerMatches: 880, careerYellowCards: 68, careerRedCards: 1,
    plGoals: 50, laLigaGoals: 0, serieAGoals: 107, uclGoals: 29, superLigGoals: 32,
    plAssists: 24, uclAssists: 14, superLigAssists: 12,
    plMatches: 130, laLigaMatches: 0, uclMatches: 75, superLigMatches: 55, superLigYellowCards: 6
  },
  // Fernando Muslera
  '184484': {
    careerGoals: 1, careerAssists: 2, careerMatches: 680, careerYellowCards: 55, careerRedCards: 5,
    plGoals: 0, laLigaGoals: 0, serieAGoals: 0, uclGoals: 0, superLigGoals: 1,
    plAssists: 0, uclAssists: 0, superLigAssists: 1,
    plMatches: 0, laLigaMatches: 0, uclMatches: 53, superLigMatches: 425, superLigYellowCards: 42
  },
  // Florian Wirtz
  '256630': {
    careerGoals: 58, careerAssists: 65, careerMatches: 220, careerYellowCards: 18, careerRedCards: 0,
    plGoals: 0, laLigaGoals: 0, serieAGoals: 0, uclGoals: 4, superLigGoals: 0,
    plAssists: 0, uclAssists: 4, superLigAssists: 0,
    plMatches: 0, laLigaMatches: 0, uclMatches: 8, superLigMatches: 0, superLigYellowCards: 0
  },
  // João Palhinha
  '229391': {
    careerGoals: 24, careerAssists: 14, careerMatches: 410, careerYellowCards: 98, careerRedCards: 3,
    plGoals: 8, laLigaGoals: 0, serieAGoals: 0, uclGoals: 1, superLigGoals: 0,
    plAssists: 1, uclAssists: 0, superLigAssists: 0,
    plMatches: 68, laLigaMatches: 0, uclMatches: 18, superLigMatches: 0, superLigYellowCards: 0
  },
  // Álvaro Morata
  '201153': {
    careerGoals: 218, careerAssists: 82, careerMatches: 604, careerYellowCards: 96, careerRedCards: 4,
    plGoals: 16, laLigaGoals: 73, serieAGoals: 42, uclGoals: 28, superLigGoals: 0,
    plAssists: 6, uclAssists: 9, superLigAssists: 0,
    plMatches: 47, laLigaMatches: 186, uclMatches: 82, superLigMatches: 0, superLigYellowCards: 0
  },
  // Youssef En-Nesyri
  '235410': {
    careerGoals: 112, careerAssists: 20, careerMatches: 330, careerYellowCards: 38, careerRedCards: 2,
    plGoals: 0, laLigaGoals: 68, serieAGoals: 0, uclGoals: 12, superLigGoals: 8,
    plAssists: 0, uclAssists: 3, superLigAssists: 2,
    plMatches: 0, laLigaMatches: 232, uclMatches: 20, superLigMatches: 18, superLigYellowCards: 2
  },
  // Kylian Mbappé
  '231747': {
    careerGoals: 335, careerAssists: 155, careerMatches: 450, careerYellowCards: 48, careerRedCards: 3,
    plGoals: 0, laLigaGoals: 12, serieAGoals: 0, uclGoals: 49, superLigGoals: 0,
    plAssists: 0, uclAssists: 26, superLigAssists: 0,
    plMatches: 0, laLigaMatches: 18, uclMatches: 75, superLigMatches: 0, superLigYellowCards: 0
  },
  // Mohamed Salah
  '209331': {
    careerGoals: 345, careerAssists: 158, careerMatches: 680, careerYellowCards: 30, careerRedCards: 1,
    plGoals: 165, laLigaGoals: 0, serieAGoals: 35, uclGoals: 44, superLigGoals: 0,
    plAssists: 74, uclAssists: 15, superLigAssists: 0,
    plMatches: 275, laLigaMatches: 0, uclMatches: 85, superLigMatches: 0, superLigYellowCards: 0
  },
  // Robert Lewandowski
  '188545': {
    careerGoals: 648, careerAssists: 182, careerMatches: 920, careerYellowCards: 82, careerRedCards: 2,
    plGoals: 0, laLigaGoals: 55, serieAGoals: 0, uclGoals: 96, superLigGoals: 0,
    plAssists: 0, uclAssists: 26, superLigAssists: 0,
    plMatches: 0, laLigaMatches: 78, uclMatches: 125, superLigMatches: 0, superLigYellowCards: 0
  },
  // Luis Suárez
  '176580': {
    careerGoals: 575, careerAssists: 262, careerMatches: 940, careerYellowCards: 168, careerRedCards: 4,
    plGoals: 69, laLigaGoals: 178, serieAGoals: 0, uclGoals: 31, superLigGoals: 0,
    plAssists: 23, uclAssists: 24, superLigAssists: 0,
    plMatches: 110, laLigaMatches: 258, uclMatches: 73, superLigMatches: 0, superLigYellowCards: 0
  },
  // Neymar Jr
  '190871': {
    careerGoals: 438, careerAssists: 275, careerMatches: 715, careerYellowCards: 148, careerRedCards: 8,
    plGoals: 0, laLigaGoals: 68, serieAGoals: 0, uclGoals: 43, superLigGoals: 0,
    plAssists: 0, uclAssists: 36, superLigAssists: 0,
    plMatches: 0, laLigaMatches: 123, uclMatches: 81, superLigMatches: 0, superLigYellowCards: 0
  },
  // Jude Bellingham
  '252371': {
    careerGoals: 62, careerAssists: 50, careerMatches: 260, careerYellowCards: 44, careerRedCards: 1,
    plGoals: 0, laLigaGoals: 25, serieAGoals: 0, uclGoals: 11, superLigGoals: 0,
    plAssists: 0, uclAssists: 10, superLigAssists: 0,
    plMatches: 0, laLigaMatches: 42, uclMatches: 36, superLigMatches: 0, superLigYellowCards: 0
  },
  // Rodri
  '231866': {
    careerGoals: 38, careerAssists: 42, careerMatches: 480, careerYellowCards: 74, careerRedCards: 2,
    plGoals: 22, laLigaGoals: 4, serieAGoals: 0, uclGoals: 5, superLigGoals: 0,
    plAssists: 21, uclAssists: 3, superLigAssists: 0,
    plMatches: 175, laLigaMatches: 84, uclMatches: 54, superLigMatches: 0, superLigYellowCards: 0
  }
};

export function getRandomStatChallenge() {
  const challenge = STAT_CHALLENGES[Math.floor(Math.random() * STAT_CHALLENGES.length)];
  return { ...challenge };
}

export function getPlayerStatValue(playerId, statKey, playerObj) {
  // 1. Check verified curated map
  if (PLAYER_STATS_MAP[playerId] && typeof PLAYER_STATS_MAP[playerId][statKey] === 'number') {
    return PLAYER_STATS_MAP[playerId][statKey];
  }

  // 2. Check if it's a legend from legends_database
  if (legendsMap.has(playerId)) {
    const leg = legendsMap.get(playerId);
    if (statKey === 'careerGoals') return leg.careerGoals || 0;
    if (statKey === 'careerAssists') return leg.careerAssists || 0;
    if (statKey === 'careerMatches') return leg.careerMatches || 0;
    if (statKey === 'careerYellowCards') return leg.yellowCards || 0;
    if (statKey === 'careerRedCards') return leg.redCards || 0;
    if (statKey === 'superLigYellowCards' && (leg.leaguesPlayed || []).includes('Süper Lig')) return Math.round((leg.yellowCards || 20) * 0.4);
    if (statKey === 'superLigGoals' && (leg.leaguesPlayed || []).includes('Süper Lig')) return Math.round((leg.careerGoals || 50) * 0.4);
    if (statKey === 'superLigAssists' && (leg.leaguesPlayed || []).includes('Süper Lig')) return Math.round((leg.careerAssists || 50) * 0.4);
    if (statKey === 'superLigMatches' && (leg.leaguesPlayed || []).includes('Süper Lig')) return Math.round((leg.careerMatches || 200) * 0.35);
    if (statKey === 'plGoals' && (leg.leaguesPlayed || []).includes('Premier League')) return Math.round((leg.careerGoals || 50) * 0.5);
    if (statKey === 'plAssists' && (leg.leaguesPlayed || []).includes('Premier League')) return Math.round((leg.careerAssists || 50) * 0.5);
    if (statKey === 'plMatches' && (leg.leaguesPlayed || []).includes('Premier League')) return Math.round((leg.careerMatches || 200) * 0.45);
    if (statKey === 'laLigaGoals' && (leg.leaguesPlayed || []).includes('La Liga')) return Math.round((leg.careerGoals || 50) * 0.55);
    if (statKey === 'laLigaMatches' && (leg.leaguesPlayed || []).includes('La Liga')) return Math.round((leg.careerMatches || 200) * 0.5);
    if (statKey === 'serieAGoals' && (leg.leaguesPlayed || []).includes('Serie A')) return Math.round((leg.careerGoals || 50) * 0.5);
    if (statKey === 'uclGoals') return Math.round((leg.careerGoals || 30) * 0.2);
    if (statKey === 'uclAssists') return Math.round((leg.careerAssists || 30) * 0.2);
    if (statKey === 'uclMatches') return Math.round((leg.careerMatches || 100) * 0.15);
  }

  // 3. Fallback based on playerObj stats and career history
  if (playerObj) {
    const age = playerObj.age || 26;
    const ovr = playerObj.overall || 75;
    const shooting = playerObj.stats?.shooting || 65;
    const passing = playerObj.stats?.passing || 65;
    const category = playerObj.category || 'MID';
    const league = playerObj.league || 'Other';
    const careerClubs = (playerObj.careerClubs || []).join(' ');

    const seed = parseInt(String(playerObj.id).replace(/\D/g, '').slice(-3) || '123', 10);

    // Matches
    const estMatches = Math.max(80, Math.round((age - 17) * 32 + (seed % 40)));
    if (statKey === 'careerMatches') return playerObj.careerMatches || estMatches;

    // Career goals & assists
    let estGoals = 15;
    if (category === 'ATT') estGoals = Math.round((shooting * 2.2) + (age - 20) * 8 + (seed % 30));
    else if (category === 'MID') estGoals = Math.round((shooting * 0.9) + (age - 20) * 3 + (seed % 15));
    else if (category === 'DEF') estGoals = Math.round((age - 20) * 1.5 + (seed % 8));
    else if (category === 'GK') estGoals = 0;

    let estAssists = 12;
    if (category === 'ATT') estAssists = Math.round((passing * 0.8) + (age - 20) * 4 + (seed % 15));
    else if (category === 'MID') estAssists = Math.round((passing * 1.6) + (age - 20) * 6 + (seed % 20));
    else if (category === 'DEF') estAssists = Math.round((age - 20) * 2 + (seed % 6));

    if (statKey === 'careerGoals') return playerObj.goals || estGoals;
    if (statKey === 'careerAssists') return playerObj.assists || estAssists;

    // Cards
    const estYellow = playerObj.yellowCards || Math.round((age - 18) * 4.5 + (seed % 25));
    const estRed = playerObj.redCards !== undefined ? playerObj.redCards : Math.floor(estYellow / 12);
    if (statKey === 'careerYellowCards') return estYellow;
    if (statKey === 'careerRedCards') return estRed;

    // League specific
    const inPL = league === 'Premier League' || careerClubs.includes('Manchester') || careerClubs.includes('Arsenal') || careerClubs.includes('Chelsea') || careerClubs.includes('Liverpool');
    const inLaLiga = league === 'La Liga' || careerClubs.includes('Madrid') || careerClubs.includes('Barcelona') || careerClubs.includes('Atlético');
    const inSerieA = league === 'Serie A' || careerClubs.includes('Inter') || careerClubs.includes('Milan') || careerClubs.includes('Juventus');
    const inSuperLig = league === 'Süper Lig' || careerClubs.includes('Galatasaray') || careerClubs.includes('Fenerbahçe') || careerClubs.includes('Beşiktaş');

    if (statKey === 'plGoals') return inPL ? Math.round(estGoals * 0.65) : 0;
    if (statKey === 'plAssists') return inPL ? Math.round(estAssists * 0.65) : 0;
    if (statKey === 'plMatches') return inPL ? Math.round(estMatches * 0.6) : 0;

    if (statKey === 'laLigaGoals') return inLaLiga ? Math.round(estGoals * 0.7) : 0;
    if (statKey === 'laLigaMatches') return inLaLiga ? Math.round(estMatches * 0.65) : 0;

    if (statKey === 'serieAGoals') return inSerieA ? Math.round(estGoals * 0.7) : 0;

    if (statKey === 'superLigGoals') return inSuperLig ? Math.round(estGoals * 0.6) : 0;
    if (statKey === 'superLigAssists') return inSuperLig ? Math.round(estAssists * 0.6) : 0;
    if (statKey === 'superLigMatches') return inSuperLig ? Math.round(estMatches * 0.55) : 0;
    if (statKey === 'superLigYellowCards') return inSuperLig ? Math.round(estYellow * 0.55) : 0;

    if (statKey === 'uclGoals') return ovr >= 80 ? Math.round((ovr - 78) * 3.5 + (seed % 10)) : 0;
    if (statKey === 'uclAssists') return ovr >= 80 ? Math.round((ovr - 78) * 2.5 + (seed % 6)) : 0;
    if (statKey === 'uclMatches') return ovr >= 80 ? Math.round((ovr - 76) * 6 + (seed % 15)) : 0;
  }

  return 0;
}
