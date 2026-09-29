import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

async function testIngestion() {
  console.log('Loading existing players...');
  const playersPath = path.join(DATA_DIR, 'players.json');
  const players = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  const playerById = new Map();
  const playerByName = new Map();

  players.forEach(p => {
    playerById.set(String(p.id), p);
    const norm = p.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normSearch = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    playerByName.set(norm, p);
    if (!playerByName.has(normSearch)) playerByName.set(normSearch, p);
  });

  console.log(`Indexed ${players.length} players.`);

  // 1. Career path enrichment via historical FIFA editions
  const versions = [
    'fifa_15', 'fifa_16', 'fifa_17', 'fifa_18', 'fifa_19',
    'fifa_20', 'fifa_21', 'fifa_22', 'fifa_23',
    'ea_fc_24', 'ea_fc_25', 'ea_fc_26'
  ];

  const careerHistoryById = new Map();
  // Initialize with empty array
  players.forEach(p => careerHistoryById.set(String(p.id), []));

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
          // Only add if different from last recorded club
          if (list.length === 0 || list[list.length - 1] !== club) {
            list.push(club);
          }
        }
      }
      console.log(`Processed ${v}.`);
    } catch (e) {
      console.error(`Error fetching ${v}:`, e.message);
    }
  }

  // Count players with >= 3 clubs
  let playersWith3Plus = 0;
  players.forEach(p => {
    const history = careerHistoryById.get(String(p.id)) || [];
    // Ensure current club is included at the end if not present
    if (p.club && (history.length === 0 || history[history.length - 1] !== p.club)) {
      history.push(p.club);
    }
    // Deduplicate consecutive
    const deduped = [];
    for (const c of history) {
      if (deduped.length === 0 || deduped[deduped.length - 1] !== c) {
        deduped.push(c);
      }
    }
    if (deduped.length >= 3) {
      playersWith3Plus++;
    }
  });

  console.log(`===============================================`);
  console.log(`Total players with >= 3 career clubs: ${playersWith3Plus}`);
  console.log(`===============================================`);
}

testIngestion();
