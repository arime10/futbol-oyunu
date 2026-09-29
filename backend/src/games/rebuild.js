export const REBUILD_CLUBS = [
  {
    name: 'Beşiktaş JK',
    league: 'Süper Lig',
    budget: 90000000,
    crisis: 'Savunma ve orta saha yaşlandı, şampiyonluk için yeni bir omurga kurulmalı!',
    targetNeeds: ['CB', 'CM', 'LW', 'ST']
  },
  {
    name: 'Chelsea FC',
    league: 'Premier League',
    budget: 150000000,
    crisis: 'Kadro şişkin ve dengesiz. Net bir forvet ve tecrübeli stoper liderine ihtiyaç var.',
    targetNeeds: ['ST', 'CB', 'GK']
  },
  {
    name: 'Olympique Lyonnais',
    league: 'Ligue 1',
    budget: 80000000,
    crisis: 'Finansal sıkıntılardan sonra yeniden doğuş. Akıllı bütçe ve dinamik hücum hattı şart.',
    targetNeeds: ['CAM', 'RW', 'RB']
  },
  {
    name: 'AFC Ajax',
    league: 'Eredivisie',
    budget: 75000000,
    crisis: 'Zirveden uzak kalan Hollanda devi, eski pres futbolunu canlandıracak genç yıldızlar arıyor.',
    targetNeeds: ['CM', 'ST', 'CB', 'LW']
  },
  {
    name: 'Manchester United',
    league: 'Premier League',
    budget: 180000000,
    crisis: 'Yıllardır süren kaos. Modern tempolu bekler ve orta saha dengesi ile yeni bir takım kur.',
    targetNeeds: ['LB', 'CDM', 'ST', 'RW']
  }
];

export function getRebuildScenario(players) {
  const club = REBUILD_CLUBS[Math.floor(Math.random() * REBUILD_CLUBS.length)];
  
  // Provide 3 tiers of transfer targets:
  // 1. Marquee stars (Overall 84+)
  // 2. Rising young talents (Age <= 23, Potential >= 83)
  // 3. Smart bargains (Value < 25M, Overall >= 80)
  const marquee = players.filter(p => p.overall >= 84).sort(() => 0.5 - Math.random()).slice(0, 4);
  const youngsters = players.filter(p => p.age <= 23 && p.potential >= 83).sort(() => 0.5 - Math.random()).slice(0, 4);
  const bargains = players.filter(p => p.overall >= 80 && p.overall <= 83).sort(() => 0.5 - Math.random()).slice(0, 4);

  return {
    club,
    market: {
      marquee,
      youngsters,
      bargains
    }
  };
}
