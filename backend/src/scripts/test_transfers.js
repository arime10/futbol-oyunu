import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  'GK': 'GK / Kaleci'
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
  'Cameroon': 'Kamerun',
  'Algeria': 'Cezayir',
  'Egypt': 'Mısır',
  'Austria': 'Avusturya',
  'Switzerland': 'İsviçre',
  'Japan': 'Japonya',
  'Korea, South': 'Güney Kore',
  'South Korea': 'Güney Kore',
  'United States': 'ABD',
  'Canada': 'Kanada',
  'Chile': 'Şili',
  'Ecuador': 'Ekvador'
};

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

async function testTransfers() {
  const playersPath = path.join(DATA_DIR, 'players.json');
  const players = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  const playerByName = new Map();
  players.forEach(p => {
    const key = p.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const shortKey = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    playerByName.set(key, p);
    if (!playerByName.has(shortKey)) playerByName.set(shortKey, p);
  });

  const leagueFiles = [
    { url: 'https://raw.githubusercontent.com/tim-hy/tmarkt-transfers/master/data/super-lig.csv', league: 'Süper Lig', minFee: 1.5, minYear: 2005 },
    { url: 'https://raw.githubusercontent.com/tim-hy/tmarkt-transfers/master/data/premier-league.csv', league: 'Premier League', minFee: 5.0, minYear: 2008 },
    { url: 'https://raw.githubusercontent.com/tim-hy/tmarkt-transfers/master/data/primera-division.csv', league: 'La Liga', minFee: 5.0, minYear: 2008 },
    { url: 'https://raw.githubusercontent.com/tim-hy/tmarkt-transfers/master/data/serie-a.csv', league: 'Serie A', minFee: 5.0, minYear: 2008 },
    { url: 'https://raw.githubusercontent.com/tim-hy/tmarkt-transfers/master/data/1-bundesliga.csv', league: 'Bundesliga', minFee: 4.0, minYear: 2008 },
    { url: 'https://raw.githubusercontent.com/tim-hy/tmarkt-transfers/master/data/ligue-1.csv', league: 'Ligue 1', minFee: 4.0, minYear: 2008 },
    { url: 'https://raw.githubusercontent.com/tim-hy/tmarkt-transfers/master/data/eredivisie.csv', league: 'Eredivisie', minFee: 3.0, minYear: 2008 },
    { url: 'https://raw.githubusercontent.com/tim-hy/tmarkt-transfers/master/data/liga-nos.csv', league: 'Liga Portugal', minFee: 3.0, minYear: 2008 }
  ];

  const transfers = [];
  const seen = new Set();

  for (const lf of leagueFiles) {
    try {
      console.log(`Downloading ${lf.league}...`);
      const resp = await fetch(lf.url);
      if (!resp.ok) continue;
      const text = await resp.text();
      const lines = text.split('\n');
      console.log(`${lf.league} lines: ${lines.length}`);
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const clubIdx = headers.indexOf('club_name');
      const playerIdx = headers.indexOf('player_name');
      const posIdx = headers.indexOf('position');
      const fromIdx = headers.indexOf('club_involved_name');
      const feeIdx = headers.indexOf('fee');
      const dirIdx = headers.indexOf('transfer_movement');
      const feeCleanIdx = headers.indexOf('fee_cleaned');
      const yearIdx = headers.indexOf('year');
      const countryIdx = headers.indexOf('country');

      let addedForLeague = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const parts = parseCSVLine(line);
        if (parts.length < 10) continue;

        const dir = parts[dirIdx];
        if (dir !== 'in') continue; // only incoming transfers to avoid duplicates

        const feeCleaned = parseFloat(parts[feeCleanIdx]);
        const year = parseInt(parts[yearIdx], 10);
        if (isNaN(year) || year < lf.minYear) continue;

        const rawFee = parts[feeIdx] || '';
        const isFree = rawFee.toLowerCase().includes('free') || rawFee.toLowerCase().includes('bedelsiz');
        
        // Fee threshold
        if (isNaN(feeCleaned) || feeCleaned < lf.minFee) {
          if (!isFree) continue;
          // For free transfers, only take famous players
          const pName = parts[playerIdx];
          const matched = playerByName.get(pName.toLowerCase().replace(/[^a-z0-9]/g, ''));
          if (!matched || matched.overall < 80) continue;
        }

        const playerName = parts[playerIdx]?.trim();
        const toClub = parts[clubIdx]?.trim();
        const fromClub = parts[fromIdx]?.trim();
        if (!playerName || !toClub || !fromClub || fromClub === 'Without Club' || fromClub === 'Unknown') continue;

        const dedupeKey = `${playerName}-${year}-${toClub}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const matched = playerByName.get(playerName.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const rawPos = parts[posIdx] || (matched ? matched.primaryPosition : '');
        const position = POS_MAP[rawPos] || rawPos || (matched ? `${matched.primaryPosition} / Orta Saha` : 'Futbolcu');
        
        const rawNat = matched ? matched.nationality : parts[countryIdx];
        const nationality = NAT_MAP[rawNat] || rawNat || 'Bilinmiyor';

        transfers.push({
          id: `t-${transfers.length + 1}`,
          year: year,
          feeEur: formatFee(feeCleaned, rawFee),
          fromClub: fromClub,
          toClub: toClub,
          playerName: playerName,
          position: position,
          nationality: nationality,
          playerId: matched ? matched.id : null
        });
        addedForLeague++;
      }
      console.log(`Added ${addedForLeague} transfers for ${lf.league}. Total now: ${transfers.length}`);
    } catch (e) {
      console.error(`Error processing ${lf.league}:`, e.message);
    }
  }

  console.log(`===============================================`);
  console.log(`TOTAL TRANSFERS GENERATED: ${transfers.length}`);
  console.log(`Sample 5:`, transfers.slice(0, 5));
  console.log(`===============================================`);
}

testTransfers();
