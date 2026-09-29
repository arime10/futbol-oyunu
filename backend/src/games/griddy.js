export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export const PLAYER_COLORS = [
  '#10b981', // Emerald
  '#38bdf8', // Sky
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#06b6d4'  // Cyan
];

export function checkTicTacToeWin(grid) {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (
      grid[a] &&
      grid[b] &&
      grid[c] &&
      grid[a].placedBy &&
      grid[a].placedBy === grid[b].placedBy &&
      grid[a].placedBy === grid[c].placedBy
    ) {
      return { winner: grid[a].placedBy, line };
    }
  }
  return null;
}

export function generateGriddyBoard(players, clubs, playersList = []) {
  // Select popular clubs and nations for the 3x3 grid
  const popularClubs = [
    'Real Madrid', 'FC Barcelona', 'Manchester City', 'Liverpool FC',
    'Bayern München', 'Arsenal FC', 'Galatasaray SK', 'Fenerbahçe SK',
    'Beşiktaş JK', 'Inter Milan', 'Paris Saint-Germain', 'Chelsea FC',
    'Juventus', 'Atlético Madrid', 'Borussia Dortmund', 'SL Benfica',
    'Sporting CP', 'Ajax'
  ].filter(c => clubs.some(club => club.name === c));

  const popularNations = [
    'France', 'Brazil', 'Spain', 'Germany', 'England', 
    'Argentina', 'Portugal', 'Netherlands', 'Turkey', 'Italy', 'Belgium'
  ];

  // Pick 3 row criteria and 3 col criteria ensuring no duplicate between row and col
  const shuffledClubs = [...popularClubs].sort(() => 0.5 - Math.random());
  const shuffledNations = [...popularNations].sort(() => 0.5 - Math.random());

  const rowCriteria = [
    { type: 'club', value: shuffledClubs[0], label: shuffledClubs[0] },
    { type: 'club', value: shuffledClubs[1], label: shuffledClubs[1] },
    { type: 'nation', value: shuffledNations[0], label: shuffledNations[0] }
  ];

  const colCriteria = [
    { type: 'club', value: shuffledClubs[2], label: shuffledClubs[2] },
    { type: 'club', value: shuffledClubs[3], label: shuffledClubs[3] },
    { type: 'nation', value: shuffledNations[1], label: shuffledNations[1] }
  ];

  // Assign a color to each joined player
  const playerColorsMap = {};
  (playersList || []).forEach((p, idx) => {
    playerColorsMap[p.username] = PLAYER_COLORS[idx % PLAYER_COLORS.length];
  });

  return {
    rows: rowCriteria,
    cols: colCriteria,
    grid: Array(9).fill(null), // 0 to 8
    completedBy: Array(9).fill(null),
    turnOrder: (playersList || []).map(p => p.username),
    currentTurnIndex: 0,
    currentTurnUsername: playersList[0]?.username || null,
    playerColors: playerColorsMap,
    winningLine: null,
    winner: null,
    isDraw: false,
    moveHistory: []
  };
}

export function validatePlayerForCell(rowCrit, colCrit, player) {
  if (!player) return false;

  const matchesCriterion = (crit) => {
    if (crit.type === 'club') {
      const pClub = player.club || '';
      const career = player.careerClubs || [];
      return pClub.toLowerCase() === crit.value.toLowerCase() ||
             career.some(c => c.toLowerCase() === crit.value.toLowerCase());
    }
    if (crit.type === 'nation') {
      return (player.nationality || '').toLowerCase() === crit.value.toLowerCase();
    }
    if (crit.type === 'league') {
      return (player.league || '').toLowerCase() === crit.value.toLowerCase();
    }
    return false;
  };

  return matchesCriterion(rowCrit) && matchesCriterion(colCrit);
}
