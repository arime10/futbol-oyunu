import { normalizeSearchText } from '../scripts/fetch_and_clean.js';

export const POPULAR_CLUBS = [
  'Real Madrid', 'FC Barcelona', 'Galatasaray SK', 'Fenerbahçe SK', 'Beşiktaş JK',
  'Manchester City', 'Arsenal FC', 'Liverpool FC', 'Chelsea FC', 'Manchester United',
  'Bayern München', 'Borussia Dortmund', 'Inter Milan', 'AC Milan', 'Juventus',
  'Paris Saint-Germain', 'Atlético Madrid', 'SL Benfica', 'Sporting CP', 'Ajax',
  'Tottenham Hotspur', 'Napoli', 'AS Roma', 'Trabzonspor', 'Sevilla FC'
];

export const POPULAR_COUNTRIES = [
  'Brezilya', 'Fransa', 'Türkiye', 'Almanya', 'İspanya', 'İtalya', 'İngiltere',
  'Portekiz', 'Hollanda', 'Arjantin', 'Belçika', 'Hırvatistan', 'Fas', 'Nijerya',
  'Senegal', 'Uruguay', 'Kolombiya', 'Norveç', 'Danimarka', 'Polonya'
];

export function generateRandomOneTeamOneCountry(players) {
  // Try up to 50 times to find a team + country combo that has at least 1 valid answer
  for (let attempt = 0; attempt < 50; attempt++) {
    const club = POPULAR_CLUBS[Math.floor(Math.random() * POPULAR_CLUBS.length)];
    const country = POPULAR_COUNTRIES[Math.floor(Math.random() * POPULAR_COUNTRIES.length)];

    const matches = players.filter(p => isPlayerEligible(p, club, country));
    if (matches.length > 0) {
      return {
        club,
        country,
        validAnswersCount: matches.length,
        selectionMode: 'random', // 'random' or 'turnBased'
        currentTurnIndex: 0
      };
    }
  }

  // Fallback guaranteed combo
  return {
    club: 'Real Madrid',
    country: 'Brezilya',
    validAnswersCount: 5,
    selectionMode: 'random',
    currentTurnIndex: 0
  };
}

export function isPlayerEligible(player, targetClub, targetCountry) {
  if (!player) return false;

  // Check country
  const pNatNorm = normalizeSearchText(player.nationality);
  const targetNatNorm = normalizeSearchText(targetCountry);
  if (pNatNorm !== targetNatNorm) return false;

  // Check club (current club or career clubs)
  const targetClubNorm = normalizeSearchText(targetClub);
  const currentClubNorm = normalizeSearchText(player.club);
  if (currentClubNorm === targetClubNorm || currentClubNorm.includes(targetClubNorm) || targetClubNorm.includes(currentClubNorm)) {
    return true;
  }

  const careerClubs = player.careerClubs || [];
  for (const c of careerClubs) {
    const cNorm = normalizeSearchText(c);
    if (cNorm === targetClubNorm || cNorm.includes(targetClubNorm) || targetClubNorm.includes(cNorm)) {
      return true;
    }
  }

  return false;
}
