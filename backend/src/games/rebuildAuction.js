export const REBUILD_POSITIONS = [
  { key: 'GK', name: 'Kaleci (GK)', posFilter: ['GK'] },
  { key: 'CB', name: 'Stoper (CB)', posFilter: ['CB'] },
  { key: 'FB', name: 'Sağ/Sol Bek (RB/LB)', posFilter: ['RB', 'LB', 'RWB', 'LWB'] },
  { key: 'CM', name: 'Merkez Orta Saha (CM/CDM)', posFilter: ['CM', 'CDM'] },
  { key: 'CAM', name: 'On Numara (CAM)', posFilter: ['CAM'] },
  { key: 'WING', name: 'Kanat Oyuncusu (LW/RW)', posFilter: ['LW', 'RW', 'LM', 'RM'] },
  { key: 'ST', name: 'Santrafor (ST/CF)', posFilter: ['ST', 'CF'] }
];

export function generatePositionAuction(players, positionIndex) {
  const posConfig = REBUILD_POSITIONS[positionIndex] || REBUILD_POSITIONS[0];
  const eligible = players.filter(p => {
    return posConfig.posFilter.some(pos => p.primaryPosition === pos || (p.positions && p.positions.includes(pos)));
  });

  // Pick 4 tiered players:
  // Tier 1: Superstar (overall >= 86)
  const tier1Pool = eligible.filter(p => p.overall >= 86);
  // Tier 2: Quality Star (overall 82 - 85)
  const tier2Pool = eligible.filter(p => p.overall >= 82 && p.overall <= 85);
  // Tier 3: Solid Starter (overall 78 - 81)
  const tier3Pool = eligible.filter(p => p.overall >= 77 && p.overall <= 81);
  // Tier 4: Basic / Budget (overall 72 - 76)
  const tier4Pool = eligible.filter(p => p.overall <= 76);

  const p1 = getRandomFrom(tier1Pool.length > 0 ? tier1Pool : eligible);
  const p2 = getRandomFrom(tier2Pool.length > 0 ? tier2Pool : eligible, [p1?.id]);
  const p3 = getRandomFrom(tier3Pool.length > 0 ? tier3Pool : eligible, [p1?.id, p2?.id]);
  const p4 = getRandomFrom(tier4Pool.length > 0 ? tier4Pool : eligible, [p1?.id, p2?.id, p3?.id]);

  return [
    createAuctionCard(p1, 60, 'Superstar'),
    createAuctionCard(p2, 40, 'Yıldız'),
    createAuctionCard(p3, 20, 'Fırsat'),
    createAuctionCard(p4, 5, 'Temel / Basic')
  ];
}

function getRandomFrom(array, excludeIds = []) {
  const filtered = array.filter(p => !excludeIds.includes(p.id));
  if (filtered.length === 0) return array[0] || null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function createAuctionCard(player, basePriceM, tierLabel) {
  return {
    cardId: `card-${player?.id || Date.now()}-${Math.floor(Math.random() * 1000)}`,
    playerId: player?.id,
    name: player?.name || 'Futbolcu',
    fullName: player?.fullName || player?.name || 'Futbolcu',
    club: player?.club || 'Serbest',
    league: player?.league || 'Lig',
    nationality: player?.nationality || 'Dünya',
    overall: player?.overall || 75,
    photo: player?.photo || 'https://cdn-icons-png.flaticon.com/512/861/861512.png',
    primaryPosition: player?.primaryPosition || 'CM',
    basePriceM,
    currentBidM: basePriceM,
    highBidder: null,
    tierLabel
  };
}

export function initRebuildState(playerUsernames, initialBudgetM = 750) {
  const budgets = {};
  const squads = {};
  const votes = {};

  playerUsernames.forEach(username => {
    budgets[username] = initialBudgetM;
    squads[username] = [];
    votes[username] = null; // { [targetUser]: points }
  });

  return {
    stage: 'setup', // 'setup' -> 'auction' -> 'voting' -> 'ended'
    initialBudgetM,
    budgets,
    squads,
    currentPositionIndex: 0,
    currentPositionName: REBUILD_POSITIONS[0].name,
    availableCards: [],
    roundTimeLeft: 30,
    roundEnded: false,
    votes,
    voteResults: null,
    votingFinished: false
  };
}
