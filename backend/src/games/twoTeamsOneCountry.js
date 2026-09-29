import { normalizeSearchText } from '../scripts/fetch_and_clean.js';
import { POPULAR_CLUBS, POPULAR_COUNTRIES } from './oneTeamOneCountry.js';

export function generateRandomTwoTeamsOneCountry(players) {
  // Find a combo of 2 clubs and 1 country that has at least 1 3-match answer
  for (let attempt = 0; attempt < 80; attempt++) {
    const club1 = POPULAR_CLUBS[Math.floor(Math.random() * POPULAR_CLUBS.length)];
    let club2 = POPULAR_CLUBS[Math.floor(Math.random() * POPULAR_CLUBS.length)];
    while (club2 === club1) {
      club2 = POPULAR_CLUBS[Math.floor(Math.random() * POPULAR_CLUBS.length)];
    }
    const country = POPULAR_COUNTRIES[Math.floor(Math.random() * POPULAR_COUNTRIES.length)];

    const allMatches = players.filter(p => checkPlayerMatchCriteria(p, club1, club2, country).matchCount === 3);
    if (allMatches.length > 0) {
      return {
        club1,
        club2,
        country,
        hasThreeMatchAnswer: true,
        selectionMode: 'random',
        currentTurnIndex: 0
      };
    }
  }

  // Fallback guaranteed 3-way match
  // e.g. Di Maria / Ronaldo / Pepe (Real Madrid + Manchester United + Portekiz -> Cristiano Ronaldo)
  return {
    club1: 'Real Madrid',
    club2: 'Manchester United',
    country: 'Portekiz',
    hasThreeMatchAnswer: true,
    selectionMode: 'random',
    currentTurnIndex: 0
  };
}

export function checkPlayerMatchCriteria(player, targetClub1, targetClub2, targetCountry) {
  if (!player) {
    return { matchCount: 0, matchesClub1: false, matchesClub2: false, matchesCountry: false };
  }

  const pNatNorm = normalizeSearchText(player.nationality);
  const targetNatNorm = normalizeSearchText(targetCountry);
  const matchesCountry = pNatNorm === targetNatNorm;

  const targetClub1Norm = normalizeSearchText(targetClub1);
  const targetClub2Norm = normalizeSearchText(targetClub2);
  const currentClubNorm = normalizeSearchText(player.club);
  const careerClubs = (player.careerClubs || []).map(c => normalizeSearchText(c));

  const allPlayerClubs = [currentClubNorm, ...careerClubs];

  const matchesClub1 = allPlayerClubs.some(c => c === targetClub1Norm || c.includes(targetClub1Norm) || targetClub1Norm.includes(c));
  const matchesClub2 = allPlayerClubs.some(c => c === targetClub2Norm || c.includes(targetClub2Norm) || targetClub2Norm.includes(c));

  let matchCount = 0;
  if (matchesClub1) matchCount++;
  if (matchesClub2) matchCount++;
  if (matchesCountry) matchCount++;

  return {
    matchCount,
    matchesClub1,
    matchesClub2,
    matchesCountry
  };
}
