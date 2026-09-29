export const FORMATIONS = [
  {
    name: '4-3-3',
    slots: [
      { id: 0, pos: 'GK', label: 'GK' },
      { id: 1, pos: 'LB', label: 'LB' },
      { id: 2, pos: 'CB', label: 'LCB' },
      { id: 3, pos: 'CB', label: 'RCB' },
      { id: 4, pos: 'RB', label: 'RB' },
      { id: 5, pos: 'CM', label: 'LCM' },
      { id: 6, pos: 'CDM', label: 'CDM' },
      { id: 7, pos: 'CM', label: 'RCM' },
      { id: 8, pos: 'LW', label: 'LW' },
      { id: 9, pos: 'ST', label: 'ST' },
      { id: 10, pos: 'RW', label: 'RW' }
    ]
  },
  {
    name: '4-2-3-1',
    slots: [
      { id: 0, pos: 'GK', label: 'GK' },
      { id: 1, pos: 'LB', label: 'LB' },
      { id: 2, pos: 'CB', label: 'LCB' },
      { id: 3, pos: 'CB', label: 'RCB' },
      { id: 4, pos: 'RB', label: 'RB' },
      { id: 5, pos: 'CDM', label: 'LDM' },
      { id: 6, pos: 'CDM', label: 'RDM' },
      { id: 7, pos: 'CAM', label: 'CAM' },
      { id: 8, pos: 'LM', label: 'LM' },
      { id: 9, pos: 'RM', label: 'RM' },
      { id: 10, pos: 'ST', label: 'ST' }
    ]
  }
];

export function getRandomDraftOptions(players, targetPos, count = 5) {
  // Map targetPos to compatible positions or category
  let category = 'MID';
  if (targetPos === 'GK') category = 'GK';
  else if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(targetPos)) category = 'DEF';
  else if (['ST', 'CF', 'RW', 'LW'].includes(targetPos)) category = 'ATT';

  // Filter candidate players
  const candidates = players.filter(p => {
    return p.positions.includes(targetPos) || p.category === category;
  });

  const pool = candidates.length >= count ? candidates : players;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  
  // Pick top tiers with some probability for excitement
  const selected = [];
  const takenIds = new Set();
  
  for (const p of shuffled) {
    if (!takenIds.has(p.id)) {
      takenIds.add(p.id);
      selected.push(p);
      if (selected.length >= count) break;
    }
  }

  return selected;
}

export function calculateSquadChemistryAndRating(squad) {
  // squad: array of 11 player objects (or null)
  const validPlayers = squad.filter(Boolean);
  if (validPlayers.length === 0) return { overall: 0, chemistry: 0 };

  const totalOvr = validPlayers.reduce((sum, p) => sum + p.overall, 0);
  const avgOvr = Math.round(totalOvr / validPlayers.length);

  // Chemistry calculation based on shared Club, League, Nation
  let chemPoints = 0;
  for (let i = 0; i < validPlayers.length; i++) {
    let pChem = 0;
    for (let j = 0; j < validPlayers.length; j++) {
      if (i === j) continue;
      const p1 = validPlayers[i];
      const p2 = validPlayers[j];
      if (p1.club && p1.club === p2.club) pChem += 2;
      else if (p1.league && p1.league === p2.league) pChem += 1;
      if (p1.nationality && p1.nationality === p2.nationality) pChem += 1;
    }
    // Max 3 chem per player
    chemPoints += Math.min(3, Math.floor(pChem / 2));
  }

  const maxChem = 33; // 11 players * 3
  const chemistry = Math.min(maxChem, chemPoints);

  return {
    overall: avgOvr,
    chemistry: chemistry,
    totalScore: avgOvr + chemistry
  };
}
