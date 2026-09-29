import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPlayerStatValue } from './statTarget.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const legendsPath = path.join(__dirname, '..', 'data', 'legends_database.json');

let legendsList = [];
if (fs.existsSync(legendsPath)) {
  try {
    legendsList = JSON.parse(fs.readFileSync(legendsPath, 'utf-8'));
  } catch (e) {
    console.error('Failed to load legends in higherLower.js:', e);
  }
}

export const COMPARISON_METRICS = [
  { key: 'careerGoals', title: 'Kimin kariyer golü daha fazla? ⚽', unit: 'Gol' },
  { key: 'careerAssists', title: 'Kimin kariyer asisti daha fazla? 🎯', unit: 'Asist' },
  { key: 'careerYellowCards', title: 'Kimin kariyer sarı kartı daha çok? 🟨', unit: 'Sarı Kart' },
  { key: 'careerRedCards', title: 'Kimin kariyer kırmızı kartı daha çok? 🟥', unit: 'Kırmızı Kart' },
  { key: 'careerMatches', title: 'Kimin toplam kariyer maçı daha fazla? 🏟️', unit: 'Maç' },
  { key: 'plGoals', title: 'Kimin Premier League golü daha fazla? 🏴󠁧󠁢󠁥󠁮󠁧󠁿', unit: 'Gol' },
  { key: 'laLigaGoals', title: 'Kimin La Liga golü daha fazla? 🇪🇸', unit: 'Gol' },
  { key: 'serieAGoals', title: 'Kimin Serie A golü daha fazla? 🇮🇹', unit: 'Gol' },
  { key: 'superLigGoals', title: 'Kimin Trendyol Süper Lig golü daha fazla? 🇹🇷', unit: 'Gol' },
  { key: 'uclGoals', title: 'Kimin UEFA Şampiyonlar Ligi golü daha fazla? ⭐', unit: 'Gol' },
  { key: 'trophyCount', title: 'Kimin kazandığı toplam kupa sayısı daha fazla? 🏆', unit: 'Kupa' },
  { key: 'overall', title: 'Kimin genel reytingi (Overall) daha yüksek? ⚡', unit: 'OVR' }
];

export function generateHigherLowerQuestion(players) {
  // Combine top active players and legends for recognizable names
  const topActive = players.filter(p => p.overall >= 80);
  const combinedPool = [...legendsList, ...topActive];

  for (let attempt = 0; attempt < 50; attempt++) {
    const metric = COMPARISON_METRICS[Math.floor(Math.random() * COMPARISON_METRICS.length)];

    // Pick 2 random distinct players
    const idxA = Math.floor(Math.random() * combinedPool.length);
    let idxB = Math.floor(Math.random() * combinedPool.length);
    while (idxB === idxA) {
      idxB = Math.floor(Math.random() * combinedPool.length);
    }

    const pA = combinedPool[idxA];
    const pB = combinedPool[idxB];

    let valA = 0;
    let valB = 0;

    if (metric.key === 'overall') {
      valA = pA.overall || 75;
      valB = pB.overall || 75;
    } else if (metric.key === 'trophyCount') {
      valA = pA.trophyCount || (pA.overall >= 88 ? 15 : 8);
      valB = pB.trophyCount || (pB.overall >= 88 ? 15 : 8);
    } else {
      valA = getPlayerStatValue(String(pA.id), metric.key, pA);
      valB = getPlayerStatValue(String(pB.id), metric.key, pB);
    }

    // Must have different values and at least one must have > 0
    if (valA !== valB && (valA > 0 || valB > 0)) {
      const correctWinner = valA > valB ? 'A' : 'B';
      return {
        id: `hl-${Date.now()}-${attempt}`,
        statTitle: metric.title,
        statKey: metric.key,
        unit: metric.unit,
        playerA: {
          id: pA.id,
          name: pA.name,
          fullName: pA.fullName,
          club: pA.club,
          nationality: pA.nationality,
          photo: pA.photo,
          statValue: valA
        },
        playerB: {
          id: pB.id,
          name: pB.name,
          fullName: pB.fullName,
          club: pB.club,
          nationality: pB.nationality,
          photo: pB.photo,
          statValue: valB
        },
        correctWinner
      };
    }
  }

  // Fallback question
  return {
    id: `hl-${Date.now()}-fallback`,
    statTitle: 'Kimin kariyer golü daha fazla? ⚽',
    statKey: 'careerGoals',
    unit: 'Gol',
    playerA: {
      id: 'leg-r9',
      name: 'Ronaldo Nazário',
      club: 'Real Madrid',
      nationality: 'Brezilya',
      photo: 'https://cdn.sofifa.net/players/037/576/21_120.png',
      statValue: 414
    },
    playerB: {
      id: 'leg-maradona',
      name: 'Diego Maradona',
      club: 'SSC Napoli',
      nationality: 'Arjantin',
      photo: 'https://cdn.sofifa.net/players/190/043/21_120.png',
      statValue: 345
    },
    correctWinner: 'A'
  };
}
