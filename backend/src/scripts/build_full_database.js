import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeSearchText } from './fetch_and_clean.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

const POS_MAP = {
  'Centre-Forward': 'ST / Forvet',
  'Second Striker': 'CF / Forvet',
  'Left Winger': 'LW / Sol Kanat',
  'Right Winger': 'RW / Sağ Kanat',
  'Attacking Midfield': 'CAM / On Numara',
  'Central Midfield': 'CM / Orta Saha',
  'Defensive Midfield': 'CDM / Ön Libero',
  'Right-Back': 'RB / Sağ Bek',
  'Left-Back': 'LB / Sol Bek',
  'Centre-Back': 'CB / Stoper',
  'Goalkeeper': 'GK / Kaleci',
  'Midfield': 'Orta Saha',
  'Defender': 'Defans',
  'Forward': 'Forvet',
  'Attack': 'Forvet',
  'CF': 'ST / Forvet',
  'ST': 'ST / Forvet',
  'LW': 'LW / Sol Kanat',
  'RW': 'RW / Sağ Kanat',
  'CAM': 'CAM / On Numara',
  'CM': 'CM / Orta Saha',
  'CDM': 'CDM / Ön Libero',
  'RB': 'RB / Sağ Bek',
  'LB': 'LB / Sol Bek',
  'CB': 'CB / Stoper',
  'GK': 'GK / Kaleci',
  'AM': 'CAM / On Numara',
  'DM': 'CDM / Ön Libero'
};

const NAT_MAP = {
  'Turkey': 'Türkiye',
  'Türkiye': 'Türkiye',
  'France': 'Fransa',
  'Brazil': 'Brezilya',
  'Germany': 'Almanya',
  'Spain': 'İspanya',
  'Italy': 'İtalya',
  'England': 'İngiltere',
  'Portugal': 'Portekiz',
  'Netherlands': 'Hollanda',
  'Argentina': 'Arjantin',
  'Belgium': 'Belçika',
  'Croatia': 'Hırvatistan',
  'Morocco': 'Fas',
  'Nigeria': 'Nijerya',
  'Senegal': 'Senegal',
  'Uruguay': 'Uruguay',
  'Colombia': 'Kolombiya',
  'Norway': 'Norveç',
  'Denmark': 'Danimarka',
  'Sweden': 'İsveç',
  'Poland': 'Polonya',
  'Serbia': 'Sırbistan',
  'Ghana': 'Gana',
  'Ivory Coast': 'Fildişi Sahili',
  'Côte d\'Ivoire': 'Fildişi Sahili',
  'Cameroon': 'Kamerun',
  'Algeria': 'Cezayir',
  'Egypt': 'Mısır',
  'Austria': 'Avusturya',
  'Switzerland': 'İsviçre',
  'Japan': 'Japonya',
  'South Korea': 'Güney Kore',
  'Korea, South': 'Güney Kore',
  'United States': 'ABD',
  'Canada': 'Kanada',
  'Chile': 'Şili',
  'Ecuador': 'Ekvador',
  'Bosnia and Herzegovina': 'Bosna-Hersek',
  'Bosnia-Herzegovina': 'Bosna-Hersek',
  'Czech Republic': 'Çekya',
  'Slovakia': 'Slovakya',
  'Greece': 'Yunanistan',
  'Scotland': 'İskoçya',
  'Wales': 'Galler',
  'Ireland': 'İrlanda'
};

const LEGENDARY_PLAYERS = [
  {
    id: 'leg-1',
    name: 'W. Sneijder',
    fullName: 'Wesley Sneijder',
    club: 'Galatasaray SK',
    league: 'Süper Lig',
    nationality: 'Hollanda',
    positions: ['CAM', 'CM'],
    primaryPosition: 'CAM',
    overall: 88,
    yellowCards: 52,
    goals: 154,
    careerClubs: ['Ajax', 'Real Madrid', 'Inter Milan', 'Galatasaray SK', 'OGC Nice', 'Al-Gharafa'],
    photo: 'https://cdn.sofifa.net/players/045/661/18_120.png'
  },
  {
    id: 'leg-2',
    name: 'D. Drogba',
    fullName: 'Didier Drogba',
    club: 'Chelsea FC',
    league: 'Premier League',
    nationality: 'Fildişi Sahili',
    positions: ['ST'],
    primaryPosition: 'ST',
    overall: 89,
    yellowCards: 48,
    goals: 302,
    careerClubs: ['Le Mans', 'EA Guingamp', 'Olympique de Marseille', 'Chelsea FC', 'Shanghai Shenhua', 'Galatasaray SK', 'Montreal Impact'],
    photo: 'https://cdn.sofifa.net/players/009/676/15_120.png'
  },
  {
    id: 'leg-3',
    name: 'E. Hazard',
    fullName: 'Eden Hazard',
    club: 'Real Madrid',
    league: 'La Liga',
    nationality: 'Belçika',
    positions: ['LW', 'CAM'],
    primaryPosition: 'LW',
    overall: 91,
    yellowCards: 31,
    goals: 167,
    careerClubs: ['LOSC Lille', 'Chelsea FC', 'Real Madrid'],
    photo: 'https://cdn.sofifa.net/players/183/277/22_120.png'
  },
  {
    id: 'leg-4',
    name: 'G. Bale',
    fullName: 'Gareth Bale',
    club: 'Real Madrid',
    league: 'La Liga',
    nationality: 'Galler',
    positions: ['RW', 'ST'],
    primaryPosition: 'RW',
    overall: 90,
    yellowCards: 34,
    goals: 185,
    careerClubs: ['Southampton', 'Tottenham Hotspur', 'Real Madrid', 'Los Angeles FC'],
    photo: 'https://cdn.sofifa.net/players/173/731/22_120.png'
  },
  {
    id: 'leg-5',
    name: 'S. Agüero',
    fullName: 'Sergio Agüero',
    club: 'Manchester City',
    league: 'Premier League',
    nationality: 'Arjantin',
    positions: ['ST'],
    primaryPosition: 'ST',
    overall: 90,
    yellowCards: 55,
    goals: 385,
    careerClubs: ['Independiente', 'Atlético Madrid', 'Manchester City', 'FC Barcelona'],
    photo: 'https://cdn.sofifa.net/players/153/079/22_120.png'
  },
  {
    id: 'leg-6',
    name: 'M. Özil',
    fullName: 'Mesut Özil',
    club: 'Arsenal FC',
    league: 'Premier League',
    nationality: 'Almanya',
    positions: ['CAM'],
    primaryPosition: 'CAM',
    overall: 89,
    yellowCards: 28,
    goals: 114,
    careerClubs: ['Schalke 04', 'SV Werder Bremen', 'Real Madrid', 'Arsenal FC', 'Fenerbahçe SK', 'İstanbul Başakşehir'],
    photo: 'https://cdn.sofifa.net/players/176/635/22_120.png'
  },
  {
    id: 'leg-7',
    name: 'R. van Persie',
    fullName: 'Robin van Persie',
    club: 'Manchester United',
    league: 'Premier League',
    nationality: 'Hollanda',
    positions: ['ST'],
    primaryPosition: 'ST',
    overall: 88,
    yellowCards: 44,
    goals: 274,
    careerClubs: ['Feyenoord', 'Arsenal FC', 'Manchester United', 'Fenerbahçe SK'],
    photo: 'https://cdn.sofifa.net/players/078/264/19_120.png'
  },
  {
    id: 'leg-8',
    name: 'Z. Ibrahimović',
    fullName: 'Zlatan Ibrahimović',
    club: 'AC Milan',
    league: 'Serie A',
    nationality: 'İsveç',
    positions: ['ST'],
    primaryPosition: 'ST',
    overall: 90,
    yellowCards: 112,
    goals: 496,
    careerClubs: ['Malmö FF', 'Ajax', 'Juventus', 'Inter Milan', 'FC Barcelona', 'AC Milan', 'Paris Saint-Germain', 'Manchester United', 'LA Galaxy'],
    photo: 'https://cdn.sofifa.net/players/041/236/23_120.png'
  },
  {
    id: 'leg-9',
    name: 'W. Rooney',
    fullName: 'Wayne Rooney',
    club: 'Manchester United',
    league: 'Premier League',
    nationality: 'İngiltere',
    positions: ['ST', 'CAM'],
    primaryPosition: 'ST',
    overall: 90,
    yellowCards: 101,
    goals: 313,
    careerClubs: ['Everton', 'Manchester United', 'D.C. United', 'Derby County'],
    photo: 'https://cdn.sofifa.net/players/054/050/20_120.png'
  },
  {
    id: 'leg-10',
    name: 'A. Robben',
    fullName: 'Arjen Robben',
    club: 'Bayern München',
    league: 'Bundesliga',
    nationality: 'Hollanda',
    positions: ['RW', 'RM'],
    primaryPosition: 'RW',
    overall: 90,
    yellowCards: 41,
    goals: 209,
    careerClubs: ['FC Groningen', 'PSV Eindhoven', 'Chelsea FC', 'Real Madrid', 'Bayern München'],
    photo: 'https://cdn.sofifa.net/players/009/014/20_120.png'
  },
  {
    id: 'leg-11',
    name: 'F. Ribéry',
    fullName: 'Franck Ribéry',
    club: 'Bayern München',
    league: 'Bundesliga',
    nationality: 'Fransa',
    positions: ['LM', 'LW'],
    primaryPosition: 'LW',
    overall: 89,
    yellowCards: 62,
    goals: 151,
    careerClubs: ['Boulogne', 'Olympique Alès', 'Brest', 'FC Metz', 'Galatasaray SK', 'Olympique de Marseille', 'Bayern München', 'Fiorentina', 'Salernitana'],
    photo: 'https://cdn.sofifa.net/players/156/616/22_120.png'
  },
  {
    id: 'leg-12',
    name: 'A. Iniesta',
    fullName: 'Andrés Iniesta',
    club: 'FC Barcelona',
    league: 'La Liga',
    nationality: 'İspanya',
    positions: ['CM'],
    primaryPosition: 'CM',
    overall: 91,
    yellowCards: 38,
    goals: 89,
    careerClubs: ['FC Barcelona', 'Vissel Kobe', 'Emirates Club'],
    photo: 'https://cdn.sofifa.net/players/044/352/23_120.png'
  },
  {
    id: 'leg-13',
    name: 'Pepe',
    fullName: 'Képler Laveran Lima Ferreira',
    club: 'FC Porto',
    league: 'Liga Portugal',
    nationality: 'Portekiz',
    positions: ['CB'],
    primaryPosition: 'CB',
    overall: 88,
    yellowCards: 165,
    goals: 42,
    careerClubs: ['Marítimo', 'FC Porto', 'Real Madrid', 'Beşiktaş JK'],
    photo: 'https://cdn.sofifa.net/players/120/533/24_120.png'
  },
  {
    id: 'leg-14',
    name: 'R. Quaresma',
    fullName: 'Ricardo Quaresma',
    club: 'Beşiktaş JK',
    league: 'Süper Lig',
    nationality: 'Portekiz',
    positions: ['RW', 'LW'],
    primaryPosition: 'RW',
    overall: 84,
    yellowCards: 88,
    goals: 110,
    careerClubs: ['Sporting CP', 'FC Barcelona', 'FC Porto', 'Inter Milan', 'Chelsea FC', 'Beşiktaş JK', 'Al-Ahli', 'Kasımpaşa', 'Vitória Guimarães'],
    photo: 'https://cdn.sofifa.net/players/053/302/22_120.png'
  },
  {
    id: 'leg-15',
    name: 'Alex',
    fullName: 'Alexsandro de Souza',
    club: 'Fenerbahçe SK',
    league: 'Süper Lig',
    nationality: 'Brezilya',
    positions: ['CAM'],
    primaryPosition: 'CAM',
    overall: 87,
    yellowCards: 45,
    goals: 230,
    careerClubs: ['Coritiba', 'Palmeiras', 'Flamengo', 'Cruzeiro', 'Parma', 'Fenerbahçe SK'],
    photo: 'https://cdn-icons-png.flaticon.com/512/861/861512.png'
  }
];

function formatFee(feeCleaned, feeRaw) {
  if (feeCleaned && !isNaN(feeCleaned)) {
    if (feeCleaned >= 1) {
      return `${feeCleaned.toFixed(feeCleaned % 1 === 0 ? 0 : 1)} Milyon €`;
    } else {
      return `${Math.round(feeCleaned * 1000)} Bin €`;
    }
  }
  if (feeRaw) {
    if (feeRaw.toLowerCase().includes('free') || feeRaw.toLowerCase().includes('bedelsiz')) {
      return 'Bedelsiz';
    }
    return feeRaw;
  }
  return 'Bedelsiz';
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function buildFullDatabase() {
  console.log('--- STARTING COMPREHENSIVE DATABASE BUILD ---');
  const playersPath = path.join(DATA_DIR, 'players.json');
  let players = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  console.log(`Initial active players count: ${players.length}`);

  // 1. Add legendary players if not present
  for (const leg of LEGENDARY_PLAYERS) {
    if (!players.some(p => p.id === leg.id)) {
      players.push({
        ...leg,
        searchName: normalizeSearchText(`${leg.name} ${leg.fullName}`),
        searchNationality: normalizeSearchText(leg.nationality),
        category: 'ATT',
        potential: leg.overall,
        age: 38,
        valueEur: 0,
        stats: {
          pace: 80,
          shooting: 85,
          passing: 85,
          dribbling: 86,
          defending: 50,
          physical: 75
        }
      });
    }
  }

  // 2. Fetch FIFA 15 to 26 historical versions for career clubs
  const versions = [
    'fifa_15', 'fifa_16', 'fifa_17', 'fifa_18', 'fifa_19',
    'fifa_20', 'fifa_21', 'fifa_22', 'fifa_23',
    'ea_fc_24', 'ea_fc_25', 'ea_fc_26'
  ];

  const careerHistoryById = new Map();
  players.forEach(p => {
    // Preserve any existing manually curated clubs first
    careerHistoryById.set(String(p.id), [...(p.careerClubs || [])]);
  });

  console.log('Downloading historical FIFA datasets to map career paths...');
  for (const v of versions) {
    const url = `https://raw.githubusercontent.com/mzafram2001/ea-fc/main/data/dataset_${v}.csv`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const text = await resp.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const idIdx = headers.indexOf('sofifa_id');
      const clubIdx = headers.indexOf('club_name');

      if (idIdx === -1 || clubIdx === -1) continue;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const parts = line.split(',');
        const id = parts[idIdx]?.trim();
        const club = parts[clubIdx]?.trim()?.replace(/^"|"$/g, '');
        if (id && club && careerHistoryById.has(id)) {
          const list = careerHistoryById.get(id);
          if (list.length === 0 || list[list.length - 1] !== club) {
            list.push(club);
          }
        }
      }
      console.log(`Mapped career clubs from ${v}.`);
    } catch (e) {
      console.error(`Error with ${v}:`, e.message);
    }
  }

  // Update players with deduplicated careerClubs and simulated rich stats (yellow cards, goals)
  let playersWith3Plus = 0;
  players = players.map(p => {
    const history = careerHistoryById.get(String(p.id)) || (p.careerClubs || []);
    if (p.club && (history.length === 0 || history[history.length - 1] !== p.club)) {
      history.push(p.club);
    }
    const deduped = [];
    for (const c of history) {
      if (c && (deduped.length === 0 || deduped[deduped.length - 1] !== c)) {
        deduped.push(c);
      }
    }
    if (deduped.length >= 3) playersWith3Plus++;

    // Add card & goal stats if not present (for Card Clash mode)
    const seed = parseInt(String(p.id).replace(/\D/g, '').slice(-4) || '1234', 10);
    const yellowCards = p.yellowCards ?? Math.floor((seed % 65) + 5);
    const redCards = p.redCards ?? Math.floor((seed % 6));
    const goals = p.goals ?? Math.floor(((p.stats?.shooting || 65) * 2.8) + (seed % 40));

    return {
      ...p,
      careerClubs: deduped,
      yellowCards,
      redCards,
      goals
    };
  });

  console.log(`Total players with >= 3 career clubs: ${playersWith3Plus}`);

  // Write updated players.json
  fs.writeFileSync(playersPath, JSON.stringify(players, null, 2), 'utf-8');
  console.log(`Saved enriched players.json (${players.length} players).`);

  // 3. Build transfers.json from d2ski + tim-hy + 2024/2025 modern stars
  console.log('Ingesting Transfer databases...');
  const playerByName = new Map();
  players.forEach(p => {
    playerByName.set(p.fullName.toLowerCase().replace(/[^a-z0-9]/g, ''), p);
    playerByName.set(p.name.toLowerCase().replace(/[^a-z0-9]/g, ''), p);
    const words = p.fullName.toLowerCase().split(' ').filter(w => w.length > 2);
    if (words.length > 1) {
      const surname = words[words.length - 1];
      if (!playerByName.has(surname)) playerByName.set(surname, p);
    }
  });

  const transfers = [];
  const seenTransfers = new Set();

  // A. d2ski transfers (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Liga Portugal)
  try {
    console.log('Downloading d2ski transfers dataset...');
    const d2skiResp = await fetch('https://raw.githubusercontent.com/d2ski/football-transfers-data/master/dataset/transfers.csv');
    if (d2skiResp.ok) {
      const text = await d2skiResp.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      const feeIdx = headers.indexOf('transfer_fee_amnt');
      const dirIdx = headers.indexOf('dir');
      const nameIdx = headers.indexOf('player_name');
      const fromIdx = headers.indexOf('counter_team_name');
      const toIdx = headers.indexOf('team_name');
      const yearIdx = headers.indexOf('season');
      const natIdx = headers.indexOf('player_nation');
      const posIdx = headers.indexOf('player_pos');

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length < feeIdx) continue;
        if (parts[dirIdx] !== 'in') continue;

        const feeEurNum = parseFloat(parts[feeIdx]);
        if (isNaN(feeEurNum) || feeEurNum < 3000000) continue;

        const pName = parts[nameIdx]?.trim();
        const fromClub = parts[fromIdx]?.trim();
        const toClub = parts[toIdx]?.trim();
        const year = parseInt(parts[yearIdx], 10);
        if (!pName || !fromClub || !toClub || fromClub === 'Without Club') continue;

        const key = `${pName.toLowerCase()}-${year}-${toClub.toLowerCase()}`;
        if (seenTransfers.has(key)) continue;
        seenTransfers.add(key);

        const feeM = feeEurNum / 1000000;
        const feeStr = `${feeM >= 1 ? feeM.toFixed(feeM % 1 === 0 ? 0 : 1) : Math.round(feeEurNum / 1000)} ${feeM >= 1 ? 'Milyon €' : 'Bin €'}`;

        const rawNat = parts[natIdx]?.trim();
        const nationality = NAT_MAP[rawNat] || rawNat || 'Bilinmiyor';

        const rawPos = parts[posIdx]?.trim();
        const position = POS_MAP[rawPos] || 'ST / Forvet';

        const matched = playerByName.get(pName.toLowerCase().replace(/[^a-z0-9]/g, ''));

        transfers.push({
          id: `t-${transfers.length + 1}`,
          year,
          feeEur: feeStr,
          fromClub,
          toClub,
          playerName: pName,
          position: matched ? `${matched.primaryPosition} / ${position.split('/')[1] || 'Orta Saha'}` : position,
          nationality: matched ? matched.nationality : nationality,
          playerId: matched ? matched.id : null
        });
      }
      console.log(`Loaded ${transfers.length} transfers from d2ski.`);
    }
  } catch (e) {
    console.error('Error fetching d2ski transfers:', e.message);
  }

  // B. tim-hy Süper Lig transfers
  try {
    console.log('Downloading Süper Lig transfers from tim-hy...');
    const slResp = await fetch('https://raw.githubusercontent.com/tim-hy/tmarkt-transfers/master/data/super-lig.csv');
    if (slResp.ok) {
      const text = await slResp.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const clubIdx = headers.indexOf('club_name');
      const playerIdx = headers.indexOf('player_name');
      const posIdx = headers.indexOf('position');
      const fromIdx = headers.indexOf('club_involved_name');
      const feeIdx = headers.indexOf('fee');
      const feeCleanIdx = headers.indexOf('fee_cleaned');
      const yearIdx = headers.indexOf('year');

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const parts = parseCSVLine(line);
        if (parts.length < 10) continue;
        if (parts[6] !== 'in') continue;

        const feeClean = parseFloat(parts[feeCleanIdx]);
        const year = parseInt(parts[yearIdx], 10);
        if (isNaN(year) || year < 2005) continue;

        const rawFee = parts[feeIdx] || '';
        const isFree = rawFee.toLowerCase().includes('free') || rawFee.toLowerCase().includes('bedelsiz');
        if (isNaN(feeClean) || feeClean < 1.5) {
          if (!isFree) continue;
        }

        const pName = parts[playerIdx]?.trim();
        const toClub = parts[clubIdx]?.trim();
        const fromClub = parts[fromIdx]?.trim();
        if (!pName || !toClub || !fromClub || fromClub === 'Without Club') continue;

        const key = `${pName.toLowerCase()}-${year}-${toClub.toLowerCase()}`;
        if (seenTransfers.has(key)) continue;
        seenTransfers.add(key);

        const matched = playerByName.get(pName.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const rawPos = parts[posIdx];
        const position = POS_MAP[rawPos] || (matched ? `${matched.primaryPosition} / Forvet` : 'Forvet');
        const nationality = matched ? matched.nationality : 'Türkiye';

        transfers.push({
          id: `t-${transfers.length + 1}`,
          year,
          feeEur: formatFee(feeClean, rawFee),
          fromClub,
          toClub,
          playerName: pName,
          position,
          nationality,
          playerId: matched ? matched.id : null
        });
      }
      console.log(`Transfers total after Süper Lig: ${transfers.length}`);
    }
  } catch (e) {
    console.error('Error fetching Süper Lig transfers:', e.message);
  }

  // C. Modern 2023-2025 Transfers
  const MODERN_TRANSFERS = [
    { year: 2024, feeEur: '180 Milyon €', fromClub: 'Paris Saint-Germain', toClub: 'Real Madrid', playerName: 'Kylian Mbappé', position: 'ST / Forvet', nationality: 'Fransa', playerId: '231747' },
    { year: 2024, feeEur: '75 Milyon €', fromClub: 'Napoli', toClub: 'Galatasaray SK', playerName: 'Victor Osimhen', position: 'ST / Forvet', nationality: 'Nijerya', playerId: '232293' },
    { year: 2023, feeEur: '100 Milyon €', fromClub: 'Tottenham Hotspur', toClub: 'Bayern München', playerName: 'Harry Kane', position: 'ST / Forvet', nationality: 'İngiltere', playerId: '202126' },
    { year: 2023, feeEur: '103 Milyon €', fromClub: 'Borussia Dortmund', toClub: 'Real Madrid', playerName: 'Jude Bellingham', position: 'CAM / Orta Saha', nationality: 'İngiltere', playerId: '252371' },
    { year: 2023, feeEur: '20 Milyon €', fromClub: 'Fenerbahçe SK', toClub: 'Real Madrid', playerName: 'Arda Güler', position: 'CAM / Orta Saha', nationality: 'Türkiye', playerId: '264309' },
    { year: 2024, feeEur: '12 Milyon €', fromClub: 'Galatasaray SK', toClub: 'SL Benfica', playerName: 'Kerem Aktürkoğlu', position: 'LW / Sol Kanat', nationality: 'Türkiye', playerId: '253149' },
    { year: 2024, feeEur: '95 Milyon €', fromClub: 'Manchester City', toClub: 'Atlético Madrid', playerName: 'Julián Álvarez', position: 'ST / Forvet', nationality: 'Arjantin', playerId: '246764' },
    { year: 2024, feeEur: '55 Milyon €', fromClub: 'RB Leipzig', toClub: 'FC Barcelona', playerName: 'Dani Olmo', position: 'CAM / Orta Saha', nationality: 'İspanya', playerId: '222492' },
    { year: 2024, feeEur: '53 Milyon €', fromClub: 'Crystal Palace', toClub: 'Bayern München', playerName: 'Michael Olise', position: 'RW / Sağ Kanat', nationality: 'Fransa', playerId: '247631' },
    { year: 2024, feeEur: '62 Milyon €', fromClub: 'LOSC Lille', toClub: 'Manchester United', playerName: 'Leny Yoro', position: 'CB / Stoper', nationality: 'Fransa', playerId: '270830' },
    { year: 2024, feeEur: '19.5 Milyon €', fromClub: 'Sevilla FC', toClub: 'Fenerbahçe SK', playerName: 'Youssef En-Nesyri', position: 'ST / Forvet', nationality: 'Fas', playerId: '235212' },
    { year: 2024, feeEur: 'Bedelsiz', fromClub: 'SS Lazio', toClub: 'Beşiktaş JK', playerName: 'Ciro Immobile', position: 'ST / Forvet', nationality: 'İtalya', playerId: '192387' },
    { year: 2024, feeEur: 'Bedelsiz', fromClub: 'SL Benfica', toClub: 'Beşiktaş JK', playerName: 'Rafa Silva', position: 'CAM / Orta Saha', nationality: 'Portekiz', playerId: '211061' },
    { year: 2024, feeEur: '18 Milyon €', fromClub: 'Norwich City', toClub: 'Galatasaray SK', playerName: 'Gabriel Sara', position: 'CM / Orta Saha', nationality: 'Brezilya', playerId: '256630' },
    { year: 2024, feeEur: '50 Milyon €', fromClub: 'Bologna FC', toClub: 'Arsenal FC', playerName: 'Riccardo Calafiori', position: 'CB / Stoper', nationality: 'İtalya', playerId: '253002' },
    { year: 2023, feeEur: '116 Milyon €', fromClub: 'West Ham United', toClub: 'Arsenal FC', playerName: 'Declan Rice', position: 'CDM / Orta Saha', nationality: 'İngiltere', playerId: '234378' },
    { year: 2023, feeEur: '116 Milyon €', fromClub: 'Brighton & Hove Albion', toClub: 'Chelsea FC', playerName: 'Moisés Caicedo', position: 'CDM / Orta Saha', nationality: 'Ekvador', playerId: '254544' },
    { year: 2024, feeEur: '50 Milyon €', fromClub: 'Paris Saint-Germain', toClub: 'Manchester United', playerName: 'Manuel Ugarte', position: 'CDM / Ön Libero', nationality: 'Uruguay', playerId: '258759' }
  ];

  for (const m of MODERN_TRANSFERS) {
    const key = `${m.playerName.toLowerCase()}-${m.year}-${m.toClub.toLowerCase()}`;
    if (!seenTransfers.has(key)) {
      seenTransfers.add(key);
      transfers.unshift({
        id: `t-${transfers.length + 1}`,
        ...m
      });
    }
  }

  // Shuffle slightly so games are always diverse
  for (let i = transfers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [transfers[i], transfers[j]] = [transfers[j], transfers[i]];
  }

  // Re-id
  transfers.forEach((t, idx) => { t.id = `t-${idx + 1}`; });

  const transfersPath = path.join(DATA_DIR, 'transfers.json');
  fs.writeFileSync(transfersPath, JSON.stringify(transfers, null, 2), 'utf-8');
  console.log(`Saved ${transfers.length} transfers to ${transfersPath}`);

  console.log('--- COMPREHENSIVE DATABASE BUILD FINISHED SUCCESSFULLY ---');
  return {
    playersCount: players.length,
    careerPlayersCount: playersWith3Plus,
    transfersCount: transfers.length
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildFullDatabase().catch(err => {
    console.error('Database build failed:', err);
    process.exit(1);
  });
}
