export function getCareerQuestion(players) {
  // Find players with at least 3 career clubs
  const candidates = players.filter(p => p.careerClubs && p.careerClubs.length >= 3 && p.overall >= 73);
  if (candidates.length === 0) {
    const fallback = players.filter(p => p.careerClubs && p.careerClubs.length >= 3);
    if (fallback.length === 0) return null;
    const player = fallback[Math.floor(Math.random() * fallback.length)];
    return formatCareerQuestion(player);
  }

  // 60% chance to pick higher rated star (overall >= 79), 40% any overall >= 73
  const starCandidates = candidates.filter(p => p.overall >= 79);
  let pool = candidates;
  if (starCandidates.length > 0 && Math.random() < 0.6) {
    pool = starCandidates;
  }

  const player = pool[Math.floor(Math.random() * pool.length)];
  return formatCareerQuestion(player);
}

function formatCareerQuestion(player) {
  return {
    playerId: player.id,
    playerName: player.name,
    fullName: player.fullName,
    nationality: player.nationality,
    careerClubs: player.careerClubs,
    photo: player.photo,
    overall: player.overall,
    currentClub: player.club
  };
}
