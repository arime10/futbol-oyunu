export function getBlindRankSet(players) {
  // Pick 5 distinct players with ratings between 81 and 91
  const pool = players.filter(p => p.overall >= 81 && p.overall <= 91);
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
}
