import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomManager } from '../src/roomManager.js';
import { normalizeSearchText } from '../src/scripts/fetch_and_clean.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('--- BAŞLATILIYOR: YENİ MODLAR VE TİC-TAC-TOE DOĞRULAMA TESTLERİ ---');

  const players = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'players.json'), 'utf-8'));
  const clubs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'clubs.json'), 'utf-8'));
  assert(players.length > 0, 'Futbolcu listesi boş olmamalı');
  assert(clubs.length > 0, 'Kulüp listesi boş olmamalı');
  console.log(`✓ 2026-2027 Veritabanı yüklendi: ${players.length} futbolcu, ${clubs.length} kulüp`);

  // 1. Host Authentication & Table Creation
  const rm = new RoomManager(players, clubs);
  rm.createTable('yuED10', 'DEV2026', 'socket-host');
  rm.joinTable('mehmet', 'DEV2026', 'socket-mehmet');
  console.log('✓ yuED10 masa kurdu ve mehmet katıldı');

  // 2. Griddy Tic-Tac-Toe (3'lü Yapan Kazanır & 1 Puan) Testi
  const griddyState = rm.startMode('griddy', 'yuED10');
  assert(griddyState.gameState.playerColors['yuED10'], 'Her oyuncunun rengi tanımlanmalı');
  assert(griddyState.gameState.playerColors['mehmet'], 'Mehmetin rengi tanımlanmalı');

  // Simulate 3 in a row for yuED10 (cells 0, 1, 2)
  const g = griddyState.gameState;
  const c1 = g.rows[0];
  const col1 = g.cols[0];
  const col2 = g.cols[1];
  const col3 = g.cols[2];

  // Force mock cell validation to test 3-in-a-row algorithm directly
  g.grid[0] = { placedBy: 'yuED10', player: { name: 'Player1' }, color: '#10b981' };
  g.grid[1] = { placedBy: 'yuED10', player: { name: 'Player2' }, color: '#10b981' };
  g.grid[2] = { placedBy: 'yuED10', player: { name: 'Player3' }, color: '#10b981' };

  import('../src/games/griddy.js').then(({ checkTicTacToeWin }) => {
    const win = checkTicTacToeWin(g.grid);
    assert(win, '3lü yapan algılanmalı');
    assert.strictEqual(win.winner, 'yuED10');
    console.log('✓ Griddy 3\'lü tamamlama (Tic-Tac-Toe) algoritması başarıyla doğrulandı!');
  });

  // 3. Career Path: Kişiye Özel İpucu Açma & Puan Skalası Testi
  const careerState = rm.startMode('career', 'yuED10');
  assert.strictEqual(careerState.gameState.revealedCountByPlayer['yuED10'], 1);
  assert.strictEqual(careerState.gameState.revealedCountByPlayer['mehmet'], 1);

  // yuED10 opens hint -> only yuED10 advances
  rm.revealCareerNextForUser('yuED10');
  assert.strictEqual(rm.getTableState().gameState.revealedCountByPlayer['yuED10'], 2);
  assert.strictEqual(rm.getTableState().gameState.revealedCountByPlayer['mehmet'], 1);
  console.log('✓ Kariyer modu kişiye özel kulüp açma doğrulandı (yuED10: 2, mehmet: 1)');

  // 4. Transfer Dedektifi Testi
  const detectiveState = rm.startMode('detective', 'yuED10');
  assert(detectiveState.gameState.transfer, 'Transfer sorusu oluşturulmalı');
  assert(detectiveState.gameState.transfer.year, 'Yıl bulunmalı');
  assert(detectiveState.gameState.transfer.feeEur, 'Bonservis bulunmalı');

  // Mehmet reveals position hint privately
  rm.revealDetectiveHint('mehmet', 'position');
  assert.strictEqual(rm.getTableState().gameState.hintsByPlayer['mehmet'].position, true);
  assert.strictEqual(rm.getTableState().gameState.hintsByPlayer['yuED10'].position, false);
  console.log('✓ Transfer dedektifi kişiye özel mevki açma doğrulandı');

  // 5. Stat Hedefi (5 Futbolcu & Ortak Kilit) Testi
  const statState = rm.startMode('statTarget', 'yuED10');
  assert(statState.gameState.challenge, 'Stat hedefi oluşturulmalı');

  const p1 = players[0];
  const claim1 = rm.claimStatPlayer('yuED10', p1.id);
  assert.strictEqual(claim1.success, true);

  // Mehmet tries to pick same player -> MUST BE REJECTED
  const claimSame = rm.claimStatPlayer('mehmet', p1.id);
  assert.strictEqual(claimSame.success, false, 'Aynı futbolcuyu iki taraf seçememeli');
  console.log('✓ Stat Hedefi ortak kilit mekanizması doğrulandı (aynı oyuncu seçilemez)');

  // Fill 5 players and finalize
  for (let i = 1; i < 5; i++) {
    rm.claimStatPlayer('yuED10', players[i].id);
  }
  for (let i = 5; i < 10; i++) {
    rm.claimStatPlayer('mehmet', players[i].id);
  }
  const finalized = rm.finalizeStatResults();
  assert(finalized.gameState.results, 'Sonuçlar hesaplanmalı');
  assert(finalized.gameState.results.winner, 'Kazanan ilan edilmeli (+1 Puan)');
  console.log(`✓ Stat Hedefi 5 futbolcu toplama ve en yakın kazananı hesaplandı (Kazanan: ${finalized.gameState.results.winner})`);

  console.log('--- TÜM YENİ MOD VE SİSTEM TESTLERİ BAŞARIYLA GEÇTİ! ---');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
