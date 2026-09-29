import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const transfersPath = path.join(__dirname, '..', 'data', 'transfers.json');

let transfersList = [];
if (fs.existsSync(transfersPath)) {
  try {
    transfersList = JSON.parse(fs.readFileSync(transfersPath, 'utf-8'));
    console.log(`Loaded ${transfersList.length} transfers into Transfer Detective engine.`);
  } catch (e) {
    console.error('Failed to parse transfers.json:', e);
  }
}

export function getRandomTransferQuestion() {
  if (transfersList.length === 0) {
    return {
      id: 't-1',
      year: 2024,
      feeEur: '180 Milyon €',
      fromClub: 'Paris Saint-Germain',
      toClub: 'Real Madrid',
      playerName: 'Kylian Mbappé',
      position: 'ST / Forvet',
      nationality: 'Fransa',
      playerId: '231747'
    };
  }

  const t = transfersList[Math.floor(Math.random() * transfersList.length)];
  return { ...t };
}
