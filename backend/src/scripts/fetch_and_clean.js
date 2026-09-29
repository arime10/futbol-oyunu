import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Target leagues and keywords/clubs
const TARGET_LEAGUE_KEYWORDS = [
  // Premier League
  'Premier League', 'Manchester City', 'Arsenal', 'Liverpool', 'Aston Villa', 'Tottenham', 'Chelsea', 'Newcastle', 'Manchester United', 'West Ham', 'Brighton', 'Bournemouth', 'Crystal Palace', 'Wolverhampton', 'Fulham', 'Everton', 'Brentford', 'Nottingham Forest', 'Leicester', 'Ipswich', 'Southampton',
  // La Liga
  'LaLiga', 'Real Madrid', 'FC Barcelona', 'Girona', 'Atlético Madrid', 'Athletic Club', 'Real Sociedad', 'Real Betis', 'Villarreal', 'Valencia', 'Sevilla', 'Celta', 'Osasuna', 'Getafe', 'Espanyol', 'Mallorca', 'Rayo Vallecano', 'Las Palmas', 'Alavés', 'Leganés', 'Real Valladolid',
  // Serie A
  'Serie A', 'Inter', 'Milan', 'Juventus', 'Atalanta', 'Bologna', 'Roma', 'Lazio', 'Fiorentina', 'Torino', 'Napoli', 'Genoa', 'Monza', 'Hellas Verona', 'Cagliari', 'Lecce', 'Parma', 'Como', 'Empoli', 'Venezia', 'Udinese',
  // Bundesliga
  'Bundesliga', 'Bayer 04 Leverkusen', 'Bayern München', 'VfB Stuttgart', 'RB Leipzig', 'Borussia Dortmund', 'Eintracht Frankfurt', 'TSG Hoffenheim', '1. FC Heidenheim', 'SV Werder Bremen', 'SC Freiburg', 'FC Augsburg', 'VfL Wolfsburg', '1. FSV Mainz 05', 'Borussia Mönchengladbach', '1. FC Union Berlin', 'VfL Bochum', 'FC St. Pauli', 'Holstein Kiel',
  // Ligue 1
  'Ligue 1', 'Paris Saint-Germain', 'AS Monaco', 'Stade Brestois', 'LOSC Lille', 'OGC Nice', 'Olympique Lyonnais', 'RC Lens', 'Olympique de Marseille', 'Stade de Reims', 'Stade Rennais', 'Toulouse FC', 'Montpellier', 'RC Strasbourg', 'FC Nantes', 'Le Havre AC', 'AJ Auxerre', 'Angers SCO', 'AS Saint-Étienne',
  // Trendyol Süper Lig
  'Süper Lig', 'Galatasaray', 'Fenerbahçe', 'Beşiktaş', 'Trabzonspor', 'Başakşehir', 'Kasımpaşa', 'Sivasspor', 'Alanyaspor', 'Rizespor', 'Antalyaspor', 'Gaziantep', 'Adana Demirspor', 'Samsunspor', 'Kayserispor', 'Konyaspor', 'Hatayspor', 'Eyüpspor', 'Göztepe', 'Bodrum FK',
  // Eredivisie
  'Eredivisie', 'PSV Eindhoven', 'Feyenoord', 'FC Twente', 'AZ Alkmaar', 'Ajax', 'NEC Nijmegen', 'FC Utrecht', 'Sparta Rotterdam', 'Go Ahead Eagles', 'Fortuna Sittard', 'sc Heerenveen', 'PEC Zwolle', 'Almere City', 'Heracles Almelo', 'Willem II', 'FC Groningen', 'NAC Breda',
  // Liga Portugal
  'Liga Portugal', 'Sporting CP', 'SL Benfica', 'FC Porto', 'SC Braga', 'Vitória Guimarães', 'Moreirense FC', 'FC Arouca', 'FC Famalicão', 'Casa Pia AC', 'SC Farense', 'Rio Ave FC', 'Gil Vicente FC', 'GD Estoril Praia', 'CF Estrela da Amadora', 'Boavista FC', 'AVS Futebol SAD', 'CD Nacional', 'CD Santa Clara'
];

// Normalize Turkish & accented characters for fast flexible searching
export function normalizeSearchText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

// 2025-2026 Key Transfers Override Map (Post-2025/2026 season / recent transfers)
const TRANSFERS_OVERRIDE = {
  // Kylian Mbappé
  '231747': { club: 'Real Madrid', league: 'La Liga' },
  // Victor Osimhen
  '232293': { club: 'Galatasaray SK', league: 'Süper Lig' },
  // Michael Olise
  '247631': { club: 'Bayern München', league: 'Bundesliga' },
  // Leny Yoro
  '270830': { club: 'Manchester United', league: 'Premier League' },
  // Dani Olmo
  '222492': { club: 'FC Barcelona', league: 'La Liga' },
  // Julián Álvarez
  '246764': { club: 'Atlético Madrid', league: 'La Liga' },
  // Conor Gallagher
  '237678': { club: 'Atlético Madrid', league: 'La Liga' },
  // Endrick
  '275955': { club: 'Real Madrid', league: 'La Liga' },
  // Youssef En-Nesyri
  '235212': { club: 'Fenerbahçe SK', league: 'Süper Lig' },
  // Sofyan Amrabat
  '222665': { club: 'Fenerbahçe SK', league: 'Süper Lig' },
  // Allan Saint-Maximin
  '222490': { club: 'Fenerbahçe SK', league: 'Süper Lig' },
  // Ciro Immobile
  '192387': { club: 'Beşiktaş JK', league: 'Süper Lig' },
  // Rafa Silva
  '211061': { club: 'Beşiktaş JK', league: 'Süper Lig' },
  // Kerem Aktürkoğlu
  '253149': { club: 'SL Benfica', league: 'Liga Portugal' },
  // Gabriel Sara
  '256630': { club: 'Galatasaray SK', league: 'Süper Lig' },
  // Matthijs de Ligt
  '235243': { club: 'Manchester United', league: 'Premier League' },
  // Noussair Mazraoui
  '243627': { club: 'Manchester United', league: 'Premier League' },
  // Joshua Zirkzee
  '243630': { club: 'Manchester United', league: 'Premier League' },
  // Manuel Ugarte
  '258759': { club: 'Manchester United', league: 'Premier League' },
  // Riccardo Calafiori
  '253002': { club: 'Arsenal FC', league: 'Premier League' },
  // Mikel Merino
  '225193': { club: 'Arsenal FC', league: 'Premier League' },
  // Raheem Sterling
  '202652': { club: 'Arsenal FC', league: 'Premier League' },
  // Federico Chiesa
  '235805': { club: 'Liverpool FC', league: 'Premier League' },
  // İlkay Gündoğan
  '186942': { club: 'Manchester City', league: 'Premier League' },
  // Savinho
  '267862': { club: 'Manchester City', league: 'Premier League' },
  // João Félix
  '242444': { club: 'Chelsea FC', league: 'Premier League' },
  // Pedro Neto
  '238074': { club: 'Chelsea FC', league: 'Premier League' },
  // Jadon Sancho
  '233049': { club: 'Chelsea FC', league: 'Premier League' },
  // Romelu Lukaku
  '192505': { club: 'Napoli', league: 'Serie A' },
  // Scott McTominay
  '237238': { club: 'Napoli', league: 'Serie A' },
  // Teun Koopmeiners
  '241096': { club: 'Juventus', league: 'Serie A' },
  // Douglas Luiz
  '237086': { club: 'Juventus', league: 'Serie A' },
  // Álvaro Morata
  '201153': { club: 'AC Milan', league: 'Serie A' },
  // João Neves
  '271701': { club: 'Paris Saint-Germain', league: 'Ligue 1' },
  // Willian Pacho
  '263622': { club: 'Paris Saint-Germain', league: 'Ligue 1' }
};


// Career clubs dataset for key players (great for Griddy & Career Guessing)
const CAREER_CLUBS_MAP = {
  // Messi
  '158023': ['FC Barcelona', 'Paris Saint-Germain', 'Inter Miami'],
  // Cristiano Ronaldo
  '20801': ['Sporting CP', 'Manchester United', 'Real Madrid', 'Juventus', 'Al Nassr'],
  // Mbappé
  '231747': ['AS Monaco', 'Paris Saint-Germain', 'Real Madrid'],
  // Osimhen
  '232293': ['VfL Wolfsburg', 'RSC Charleroi', 'LOSC Lille', 'Napoli', 'Galatasaray SK'],
  // Lewandowski
  '188545': ['Lech Poznan', 'Borussia Dortmund', 'Bayern München', 'FC Barcelona'],
  // Haaland
  '239085': ['Molde FK', 'RB Salzburg', 'Borussia Dortmund', 'Manchester City'],
  // De Bruyne
  '192985': ['KRC Genk', 'Chelsea FC', 'SV Werder Bremen', 'VfL Wolfsburg', 'Manchester City'],
  // Bellingham
  '252371': ['Birmingham City', 'Borussia Dortmund', 'Real Madrid'],
  // Vinicius Jr
  '238794': ['Flamengo', 'Real Madrid'],
  // Salah
  '209331': ['FC Basel', 'Chelsea FC', 'Fiorentina', 'AS Roma', 'Liverpool FC'],
  // Neymar
  '190871': ['Santos FC', 'FC Barcelona', 'Paris Saint-Germain', 'Al Hilal'],
  // Gündoğan
  '186942': ['1. FC Nürnberg', 'Borussia Dortmund', 'Manchester City', 'FC Barcelona'],
  // Modric
  '177003': ['Dinamo Zagreb', 'Tottenham Hotspur', 'Real Madrid'],
  // Kroos
  '182521': ['Bayer 04 Leverkusen', 'Bayern München', 'Real Madrid'],
  // Benzema
  '165153': ['Olympique Lyonnais', 'Real Madrid', 'Al Ittihad'],
  // Suárez
  '176580': ['Nacional', 'FC Groningen', 'Ajax', 'Liverpool FC', 'FC Barcelona', 'Atlético Madrid', 'Grêmio', 'Inter Miami'],
  // Kane
  '202126': ['Tottenham Hotspur', 'Leicester City', 'Bayern München'],
  // Griezmann
  '194765': ['Real Sociedad', 'Atlético Madrid', 'FC Barcelona'],
  // Di Maria
  '183898': ['Rosario Central', 'SL Benfica', 'Real Madrid', 'Manchester United', 'Paris Saint-Germain', 'Juventus'],
  // Morata
  '201153': ['Real Madrid', 'Juventus', 'Chelsea FC', 'Atlético Madrid', 'AC Milan'],
  // Çalhanoğlu
  '208574': ['Karlsruher SC', 'Hamburger SV', 'Bayer 04 Leverkusen', 'AC Milan', 'Inter Milan'],
  // Arda Güler
  '268421': ['Fenerbahçe SK', 'Real Madrid'],
  // Kerem Aktürkoğlu
  '253149': ['24 Erzincanspor', 'Galatasaray SK', 'SL Benfica'],
  // Icardi
  '201399': ['Sampdoria', 'Inter Milan', 'Paris Saint-Germain', 'Galatasaray SK'],
  // Dzeko
  '180930': ['VfL Wolfsburg', 'Manchester City', 'AS Roma', 'Inter Milan', 'Fenerbahçe SK'],
  // Tadic
  '199434': ['FC Groningen', 'FC Twente', 'Southampton', 'Ajax', 'Fenerbahçe SK'],
  // Immobile
  '192387': ['Juventus', 'Genoa', 'Torino', 'Borussia Dortmund', 'Sevilla', 'Lazio', 'Beşiktaş JK'],
  // Rafa Silva
  '211061': ['SC Braga', 'SL Benfica', 'Beşiktaş JK'],
  // Muslera
  '184484': ['Montevideo Wanderers', 'Nacional', 'Lazio', 'Galatasaray SK'],
  // Fred
  '209297': ['Internacional', 'Shakhtar Donetsk', 'Manchester United', 'Fenerbahçe SK'],
  // Torreira
  '222497': ['Pescara', 'Sampdoria', 'Arsenal FC', 'Atlético Madrid', 'Fiorentina', 'Galatasaray SK'],
  // Zaha
  '198710': ['Crystal Palace', 'Manchester United', 'Galatasaray SK', 'Olympique Lyonnais']
};

// Map club to league
function detectLeague(club) {
  if (!club) return 'Other';
  const c = club.toLowerCase();
  if (c.includes('manchester') || c.includes('arsenal') || c.includes('liverpool') || c.includes('chelsea') || 
      c.includes('tottenham') || c.includes('aston villa') || c.includes('newcastle') || c.includes('brighton') ||
      c.includes('west ham') || c.includes('everton') || c.includes('wolves') || c.includes('brentford') ||
      c.includes('fulham') || c.includes('crystal palace') || c.includes('bournemouth') || c.includes('nottingham') ||
      c.includes('leicester') || c.includes('southampton') || c.includes('ipswich')) {
    return 'Premier League';
  }
  if (c.includes('madrid') || c.includes('barcelona') || c.includes('girona') || c.includes('athletic') ||
      c.includes('sociedad') || c.includes('betis') || c.includes('villarreal') || c.includes('valencia') ||
      c.includes('sevilla') || c.includes('celta') || c.includes('osasuna') || c.includes('getafe') ||
      c.includes('espanyol') || c.includes('mallorca') || c.includes('rayo') || c.includes('alavés') ||
      c.includes('alaves') || c.includes('valladolid') || c.includes('leganes') || c.includes('leganés') || c.includes('palmas')) {
    return 'La Liga';
  }

  if (c.includes('inter') || c.includes('milan') || c.includes('juventus') || c.includes('atalanta') ||
      c.includes('bologna') || c.includes('roma') || c.includes('lazio') || c.includes('fiorentina') ||
      c.includes('torino') || c.includes('napoli') || c.includes('genoa') || c.includes('monza') ||
      c.includes('verona') || c.includes('cagliari') || c.includes('lecce') || c.includes('parma') || c.includes('como') || c.includes('udinese')) {
    return 'Serie A';
  }
  if (c.includes('bayern') || c.includes('leverkusen') || c.includes('stuttgart') || c.includes('leipzig') ||
      c.includes('dortmund') || c.includes('frankfurt') || c.includes('hoffenheim') || c.includes('werder') ||
      c.includes('freiburg') || c.includes('augsburg') || c.includes('wolfsburg') || c.includes('mainz') ||
      c.includes('mönchengladbach') || c.includes('union berlin') || c.includes('bochum') || c.includes('st. pauli')) {
    return 'Bundesliga';
  }
  if (c.includes('paris') || c.includes('monaco') || c.includes('brest') || c.includes('lille') ||
      c.includes('nice') || c.includes('lyon') || c.includes('lens') || c.includes('marseille') ||
      c.includes('reims') || c.includes('rennes') || c.includes('toulouse') || c.includes('montpellier') ||
      c.includes('strasbourg') || c.includes('nantes') || c.includes('auxerre') || c.includes('saint-étienne')) {
    return 'Ligue 1';
  }
  if (c.includes('galatasaray') || c.includes('fenerbahçe') || c.includes('beşiktaş') || c.includes('trabzonspor') ||
      c.includes('başakşehir') || c.includes('kasımpaşa') || c.includes('sivasspor') || c.includes('alanyaspor') ||
      c.includes('rizespor') || c.includes('antalyaspor') || c.includes('gaziantep') || c.includes('adana') ||
      c.includes('samsunspor') || c.includes('kayserispor') || c.includes('konyaspor') || c.includes('hatayspor') ||
      c.includes('eyüpspor') || c.includes('göztepe') || c.includes('bodrum')) {
    return 'Süper Lig';
  }
  if (c.includes('psv') || c.includes('feyenoord') || c.includes('twente') || c.includes('az') ||
      c.includes('ajax') || c.includes('nijmegen') || c.includes('utrecht') || c.includes('sparta') ||
      c.includes('eagles') || c.includes('heerenveen') || c.includes('groningen') || c.includes('breda')) {
    return 'Eredivisie';
  }
  if (c.includes('sporting') || c.includes('benfica') || c.includes('porto') || c.includes('braga') ||
      c.includes('guimarães') || c.includes('famalicão') || c.includes('arouca') || c.includes('estoril') ||
      c.includes('boavista') || c.includes('santa clara')) {
    return 'Liga Portugal';
  }
  return 'Other';
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

export async function processDataset() {
  console.log('Downloading dataset_ea_fc_27.csv (2026-2027 Season) from GitHub...');
  const url = 'https://raw.githubusercontent.com/mzafram2001/ea-fc/main/data/dataset_ea_fc_27.csv';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download dataset: ${response.statusText}`);
  }
  const text = await response.text();
  console.log(`Downloaded ${text.length} characters.`);


  const lines = text.split('\n');
  const headers = parseCSVLine(lines[0]);
  const headerMap = {};
  headers.forEach((h, i) => { headerMap[h] = i; });

  const players = [];
  const clubsSet = new Set();
  const allowedLeagues = new Set([
    'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 
    'Süper Lig', 'Eredivisie', 'Liga Portugal'
  ]);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') continue;
    const cols = parseCSVLine(line);
    const sofifaId = cols[headerMap['sofifa_id']];
    let clubName = cols[headerMap['club_name']] || '';
    const alias = (cols[headerMap['alias']] || '').trim();
    const shortName = (cols[headerMap['short_name']] || alias || '').trim();
    const longName = (cols[headerMap['long_name']] || shortName).trim();
    const displayName = alias || shortName;
    const nationality = cols[headerMap['nationality']] || '';
    const positionsStr = cols[headerMap['positions']] || '';
    const overall = parseInt(cols[headerMap['overall']], 10) || 60;
    const potential = parseInt(cols[headerMap['potential']], 10) || overall;
    const age = parseInt(cols[headerMap['age']], 10) || 25;
    const valueEur = parseInt(cols[headerMap['value_eur']], 10) || 0;
    const pace = parseInt(cols[headerMap['pace']], 10) || 60;
    const shooting = parseInt(cols[headerMap['shooting']], 10) || 60;
    const passing = parseInt(cols[headerMap['passing']], 10) || 60;
    const dribbling = parseInt(cols[headerMap['dribbling']], 10) || 60;
    const defending = parseInt(cols[headerMap['defending']], 10) || 60;
    const physical = parseInt(cols[headerMap['physical']], 10) || 60;

    // Apply 2025-2026 / 2026-2027 recent transfer overrides
    let league = detectLeague(clubName);
    if (TRANSFERS_OVERRIDE[sofifaId]) {
      clubName = TRANSFERS_OVERRIDE[sofifaId].club;
      league = TRANSFERS_OVERRIDE[sofifaId].league;
    }

    // Keep players from the requested leagues or top rated players (overall >= 78)
    if (!allowedLeagues.has(league) && overall < 78) {
      continue;
    }

    // Positions array & primary category
    const positions = positionsStr.split(',').map(p => p.trim()).filter(Boolean);
    const mainPos = positions[0] || 'CM';
    let category = 'MID';
    if (mainPos === 'GK') category = 'GK';
    else if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(mainPos)) category = 'DEF';
    else if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(mainPos)) category = 'MID';
    else if (['ST', 'CF', 'RW', 'LW', 'RF', 'LF'].includes(mainPos)) category = 'ATT';

    // Career clubs
    const careerClubs = Array.from(new Set([
      clubName,
      ...(CAREER_CLUBS_MAP[sofifaId] || [])
    ]));

    // Image URL via CDN SoFIFA headshot
    const photoUrl = `https://cdn.sofifa.net/players/${sofifaId.padStart(6, '0').slice(0, 3)}/${sofifaId.padStart(6, '0').slice(3)}/25_120.png`;

    clubsSet.add(clubName);

    players.push({
      id: sofifaId,
      name: displayName,
      fullName: longName,
      searchName: normalizeSearchText(`${displayName} ${alias} ${shortName} ${longName}`),
      club: clubName,
      league: league,
      careerClubs: careerClubs,
      nationality: nationality,
      searchNationality: normalizeSearchText(nationality),
      positions: positions,
      primaryPosition: mainPos,
      category: category,
      overall: overall,
      potential: potential,
      age: age,
      valueEur: valueEur,
      stats: {
        pace,
        shooting,
        passing,
        dribbling,
        defending,
        physical
      },
      photo: photoUrl
    });

  }

  // Sort by overall descending
  players.sort((a, b) => b.overall - a.overall);

  console.log(`Cleaned and selected ${players.length} players across ${clubsSet.size} clubs.`);

  // Write players.json
  const playersPath = path.join(DATA_DIR, 'players.json');
  fs.writeFileSync(playersPath, JSON.stringify(players, null, 2), 'utf-8');
  console.log(`Saved players to ${playersPath}`);

  // Write clubs.json
  const clubsList = Array.from(clubsSet).map(club => ({
    name: club,
    league: detectLeague(club),
    searchName: normalizeSearchText(club)
  })).sort((a, b) => a.name.localeCompare(b.name));

  const clubsPath = path.join(DATA_DIR, 'clubs.json');
  fs.writeFileSync(clubsPath, JSON.stringify(clubsList, null, 2), 'utf-8');
  console.log(`Saved ${clubsList.length} clubs to ${clubsPath}`);

  return { playersCount: players.length, clubsCount: clubsList.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processDataset().then(res => {
    console.log('Data processing completed successfully!', res);
  }).catch(err => {
    console.error('Data processing failed:', err);
    process.exit(1);
  });
}
