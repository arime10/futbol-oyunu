import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.js';
import { RoomManager } from './roomManager.js';
import { setupVoiceHandlers } from './voiceHandler.js';
import { normalizeSearchText } from './scripts/fetch_and_clean.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files if built
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Load cleaned datasets
const playersPath = path.join(__dirname, 'data', 'players.json');
const clubsPath = path.join(__dirname, 'data', 'clubs.json');

let players = [];
let clubs = [];

if (fs.existsSync(playersPath)) {
  players = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  console.log(`Loaded ${players.length} players into memory.`);
}
if (fs.existsSync(clubsPath)) {
  clubs = JSON.parse(fs.readFileSync(clubsPath, 'utf-8'));
  console.log(`Loaded ${clubs.length} clubs into memory.`);
}

const roomManager = new RoomManager(players, clubs);

// Fast Player Search Autocomplete API
app.get('/api/search-players', (req, res) => {
  const query = req.query.q || '';
  const limit = parseInt(req.query.limit, 10) || 10;
  const normalized = normalizeSearchText(query);

  if (!normalized) {
    return res.json([]);
  }

  const results = [];
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (p.searchName.includes(normalized) || p.searchNationality.includes(normalized)) {
      results.push(p);
      if (results.length >= limit) break;
    }
  }

  res.json(results);
});

// Table Status API
app.get('/api/table', (req, res) => {
  res.json(roomManager.getTableState());
});

// Inactive / Retired Football Legends API (Goals, Assists, Trophies, Leagues)
app.get('/api/legends', (req, res) => {
  const legendsPath = path.join(__dirname, 'data', 'legends_database.json');
  if (fs.existsSync(legendsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(legendsPath, 'utf-8'));
      return res.json(data);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to read legends database' });
    }
  }
  res.json([]);
});

// Network Info API (for phone and other PC connections)
app.get('/api/network-info', (req, res) => {
  const nets = os.networkInterfaces();
  const localIps = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIps.push(net.address);
      }
    }
  }
  res.json({
    port: CONFIG.PORT,
    localIps,
    hostUrl: localIps.length > 0 ? `http://${localIps[0]}:${CONFIG.PORT}` : `http://localhost:${CONFIG.PORT}`
  });
});

// Robust Player Matching Helper
function isPlayerMatch(guessedPlayer, targetPlayerName, targetPlayerId) {
  if (!guessedPlayer) return false;
  if (targetPlayerId && guessedPlayer.id === targetPlayerId) return true;

  const targetNorm = normalizeSearchText(targetPlayerName);
  const nameNorm = normalizeSearchText(guessedPlayer.name);
  const fullNorm = normalizeSearchText(guessedPlayer.fullName);
  const searchNorm = guessedPlayer.searchName || '';

  const targetWords = targetNorm.split(' ').filter(w => w.length > 2);
  const surname = targetWords[targetWords.length - 1];

  if (fullNorm === targetNorm || nameNorm === targetNorm) return true;
  if (fullNorm.includes(targetNorm) || targetNorm.includes(fullNorm)) return true;
  if (surname && (nameNorm.includes(surname) || fullNorm.includes(surname) || searchNorm.includes(surname))) {
    return true;
  }
  return false;
}

// Socket.io Real-time & Voice Connections
io.on('connection', (socket) => {
  // Send current table state upon initial connection
  socket.emit('table-state', roomManager.getTableState());


  // Kurucu: Masa Kurma & Davet Kodu Belirleme
  socket.on('create-table', ({ username, inviteCode }, callback) => {
    try {
      const state = roomManager.createTable(username, inviteCode, socket.id);
      io.emit('table-state', state);
      if (callback) callback({ success: true, state });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Oyuncular: Davet Kodu ile Masaya Katılma
  socket.on('join-table', ({ username, inviteCode }, callback) => {
    try {
      const state = roomManager.joinTable(username, inviteCode, socket.id);
      io.emit('table-state', state);
      if (callback) callback({ success: true, state });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Kurucu Yetkisi: Puan Düzenleme / Düzeltme
  socket.on('host-update-score', ({ targetUsername, newScore, hostUsername }, callback) => {
    try {
      const state = roomManager.updateScore(targetUsername, newScore, hostUsername);
      io.emit('table-state', state);
      if (callback) callback({ success: true, state });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Kurucu Yetkisi: Puan Ekleme (+5, -5 vb.)
  socket.on('host-add-points', ({ targetUsername, delta, hostUsername }, callback) => {
    try {
      const state = roomManager.addPoints(targetUsername, delta, hostUsername);
      io.emit('table-state', state);
      if (callback) callback({ success: true, state });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Kurucu Yetkisi: Oyunu Bitirme & Podyum
  socket.on('host-end-game', ({ hostUsername }, callback) => {
    try {
      const state = roomManager.endGame(hostUsername);
      io.emit('table-state', state);
      io.emit('game-ended', { podium: state.podium });
      if (callback) callback({ success: true, state });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Kurucu Yetkisi: Oyunu Sıfırlama / Lobiye Dönüş
  socket.on('host-reset-game', ({ hostUsername }, callback) => {
    try {
      const state = roomManager.resetGame(hostUsername);
      io.emit('table-state', state);
      if (callback) callback({ success: true, state });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Kurucu Yetkisi: Oyun Modu Seçme & Başlatma
  socket.on('host-start-mode', ({ mode, hostUsername }, callback) => {
    try {
      const state = roomManager.startMode(mode, hostUsername);
      io.emit('table-state', state);
      if (callback) callback({ success: true, state });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Sıra Devretme / Pas Geçme
  socket.on('pass-turn', ({ username, isHost }, callback) => {
    try {
      const state = roomManager.passTurn(username, isHost);
      if (state) {
        io.emit('table-state', state);
      }
      if (callback) callback({ success: true, state });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Griddy: Hücre Cevabı Gönderme (3'lü kontrolüyle)
  socket.on('griddy-submit', ({ cellIndex, playerId, username }, callback) => {
    try {
      const res = roomManager.submitGriddyCell(cellIndex, playerId, username);
      if (res.success) {
        io.emit('table-state', res.tableState);
      }
      if (callback) callback(res);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Kariyer: Kişiye özel sonraki kulübü açma
  socket.on('career-reveal-hint', ({ username }) => {
    const state = roomManager.revealCareerNextForUser(username);
    if (state) io.emit('table-state', state);
  });

  // Kariyer: Buzzer basma (15 saniyelik sayaç başlar)
  socket.on('career-buzz', ({ username }) => {
    if (roomManager.table?.gameState) {
      const gs = roomManager.table.gameState;
      if (!gs.buzzedUser && !gs.solved) {
        gs.buzzedUser = username;
        gs.buzzedAt = Date.now();
        io.emit('table-state', roomManager.getTableState());
        io.emit('career-buzzed', { username, duration: 15 });
      }
    }
  });

  // Kariyer: Tahmin Gönderme
  socket.on('career-guess', ({ username, guessPlayerId }, callback) => {
    try {
      const gs = roomManager.table?.gameState;
      if (!gs || !gs.question) return;

      // Puan hesabı: tekte bilirse 3, 2 kulüple 2, daha çoksa 1
      const count = (gs.revealedCountByPlayer && gs.revealedCountByPlayer[username]) || 1;
      let pointsAward = 1;
      if (count === 1) pointsAward = 3;
      else if (count === 2) pointsAward = 2;

      const guessedPlayer = players.find(p => p.id === guessPlayerId);
      const isCorrect = isPlayerMatch(guessedPlayer, gs.question.playerName, gs.question.playerId);

      if (isCorrect) {
        roomManager.table.scores[username] = (roomManager.table.scores[username] || 0) + pointsAward;
        gs.solved = true;
        io.emit('table-state', roomManager.getTableState());
        io.emit('career-solved', {
          winner: username,
          points: pointsAward,
          player: gs.question
        });
        if (callback) callback({ correct: true, points: pointsAward });
      } else {
        gs.buzzedUser = null;
        gs.buzzedAt = null;
        io.emit('table-state', roomManager.getTableState());
        if (callback) callback({ correct: false });
      }
    } catch (err) {
      if (callback) callback({ error: err.message });
    }
  });

  // Kariyer: Buzzer süresi dolunca sıfırlama
  socket.on('career-timeout', () => {
    if (roomManager.table?.gameState) {
      roomManager.table.gameState.buzzedUser = null;
      roomManager.table.gameState.buzzedAt = null;
      io.emit('table-state', roomManager.getTableState());
    }
  });

  // Transfer Dedektifi: Kişiye özel ipucu açma (mevki / uyruk)
  socket.on('detective-reveal-hint', ({ username, hintType }) => {
    const state = roomManager.revealDetectiveHint(username, hintType);
    if (state) io.emit('table-state', state);
  });

  // Transfer Dedektifi: Buzzer basma (15 saniye)
  socket.on('detective-buzz', ({ username }) => {
    if (roomManager.table?.gameState) {
      const gs = roomManager.table.gameState;
      if (!gs.buzzedUser && !gs.solved) {
        gs.buzzedUser = username;
        gs.buzzedAt = Date.now();
        io.emit('table-state', roomManager.getTableState());
        io.emit('detective-buzzed', { username, duration: 15 });
      }
    }
  });

  // Transfer Dedektifi: Tahmin
  socket.on('detective-guess', ({ username, guessPlayerId }, callback) => {
    try {
      const gs = roomManager.table?.gameState;
      if (!gs || !gs.transfer) return;

      const userHints = gs.hintsByPlayer?.[username] || { position: false, nationality: false };
      const hintsOpened = (userHints.position ? 1 : 0) + (userHints.nationality ? 1 : 0);
      const pointsAward = hintsOpened === 0 ? 3 : 2; // direct = 3, hint opened = min 2

      const guessedPlayer = players.find(p => p.id === guessPlayerId);
      const isCorrect = isPlayerMatch(guessedPlayer, gs.transfer.playerName, gs.transfer.playerId);

      if (isCorrect) {
        roomManager.table.scores[username] = (roomManager.table.scores[username] || 0) + pointsAward;
        gs.solved = true;
        io.emit('table-state', roomManager.getTableState());
        io.emit('detective-solved', {
          winner: username,
          points: pointsAward,
          transfer: gs.transfer
        });
        if (callback) callback({ correct: true, points: pointsAward });
      } else {
        gs.buzzedUser = null;
        gs.buzzedAt = null;
        io.emit('table-state', roomManager.getTableState());
        if (callback) callback({ correct: false });
      }
    } catch (err) {
      if (callback) callback({ error: err.message });
    }
  });


  // Sonraki Soruya Geçme Olayları
  socket.on('next-career-question', () => {
    if (roomManager.table && roomManager.table.gameMode === 'career') {
      const state = roomManager.startMode('career', roomManager.table.hostUsername);
      io.emit('table-state', state);
    }
  });

  // Kariyer: Kimse bulamadı / Soru atla
  socket.on('career-skip', ({ hostUsername }, callback) => {
    try {
      const state = roomManager.skipCareer(hostUsername);
      if (state) {
        io.emit('table-state', state);
        io.emit('career-solved', {
          winner: null,
          skipped: true,
          player: state.gameState?.question
        });
      }
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('next-detective-question', () => {
    if (roomManager.table && roomManager.table.gameMode === 'detective') {
      const state = roomManager.startMode('detective', roomManager.table.hostUsername);
      io.emit('table-state', state);
    }
  });

  // Transfer Dedektifi: Kimse bulamadı / Soru atla
  socket.on('detective-skip', ({ hostUsername }, callback) => {
    try {
      const state = roomManager.skipDetective(hostUsername);
      if (state) {
        io.emit('table-state', state);
        io.emit('detective-solved', {
          winner: null,
          skipped: true,
          transfer: state.gameState?.transfer
        });
      }
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // 1 Takım 1 Ülke Olayları
  socket.on('one-team-guess', ({ username, guessPlayerId }, callback) => {
    try {
      const res = roomManager.submitOneTeamOneCountryGuess(username, guessPlayerId);
      if (res.success) {
        io.emit('table-state', res.tableState);
        io.emit('one-team-solved', {
          winner: username,
          points: res.points,
          player: roomManager.table?.gameState?.winningPlayer
        });
      }
      if (callback) callback(res);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('one-team-skip', ({ hostUsername }, callback) => {
    try {
      const state = roomManager.skipOneTeamOneCountry(hostUsername);
      if (state) {
        io.emit('table-state', state);
        io.emit('one-team-solved', {
          winner: null,
          skipped: true,
          player: state.gameState?.winningPlayer
        });
      }
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('next-one-team-round', () => {
    if (roomManager.table && roomManager.table.gameMode === 'oneTeamOneCountry') {
      const state = roomManager.startMode('oneTeamOneCountry', roomManager.table.hostUsername);
      io.emit('table-state', state);
    }
  });

  // 2 Takım 1 Ülke Olayları
  socket.on('two-teams-guess', ({ username, guessPlayerId }, callback) => {
    try {
      const res = roomManager.submitTwoTeamsOneCountryGuess(username, guessPlayerId);
      if (res.success) {
        io.emit('table-state', res.tableState);
        io.emit('two-teams-update', {
          winner: username,
          isThreeMatch: res.isThreeMatch,
          isTwoMatch: res.isTwoMatch,
          points: res.points
        });
      }
      if (callback) callback(res);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('two-teams-skip', ({ hostUsername }, callback) => {
    try {
      const state = roomManager.skipTwoTeamsOneCountry(hostUsername);
      if (state) {
        io.emit('table-state', state);
        io.emit('two-teams-update', {
          winner: null,
          skipped: true
        });
      }
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('next-two-teams-round', () => {
    if (roomManager.table && roomManager.table.gameMode === 'twoTeamsOneCountry') {
      const state = roomManager.startMode('twoTeamsOneCountry', roomManager.table.hostUsername);
      io.emit('table-state', state);
    }
  });

  // 7 Kart Futbolcu Düellosu Olayları
  socket.on('clash-set-slot', ({ username, slotIndex, playerId }, callback) => {
    try {
      const res = roomManager.setCardClashSlot(username, slotIndex, playerId);
      if (res.success) {
        io.emit('table-state', res.tableState);
      }
      if (callback) callback(res);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('clash-lock-draft', ({ username }, callback) => {
    try {
      const state = roomManager.lockCardClashDraft(username);
      io.emit('table-state', state);
      if (callback) callback({ success: true, state });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('clash-play-card', ({ username, cardSlotIndex }, callback) => {
    try {
      const state = roomManager.playCardClashCard(username, cardSlotIndex);
      io.emit('table-state', state);
      if (callback) callback({ success: true, state });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('next-clash-game', () => {
    if (roomManager.table && roomManager.table.gameMode === 'cardClash') {
      const state = roomManager.startMode('cardClash', roomManager.table.hostUsername);
      io.emit('table-state', state);
    }
  });

  // Stat Target: Futbolcu seçme (ortak kilit)
  socket.on('stat-claim-player', ({ username, playerId }, callback) => {

    try {
      const res = roomManager.claimStatPlayer(username, playerId);
      if (res.success) {
        io.emit('table-state', res.tableState);
      }
      if (callback) callback(res);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Stat Target: Sıralı açılma adımını ilerletme
  socket.on('stat-advance-reveal', ({ roundIndex }) => {
    if (roomManager.table?.gameState) {
      roomManager.table.gameState.revealedRound = roundIndex;
      io.emit('table-state', roomManager.getTableState());
    }
  });

  // Stat Target: Sonucu hesapla ve kazananı ilan et (+1 puan)
  socket.on('stat-finalize', () => {
    const state = roomManager.finalizeStatResults();
    if (state) io.emit('table-state', state);
  });

  // Kim Daha Çok? (Higher or Lower)
  socket.on('higher-lower-answer', ({ username, chosenSide }, callback) => {
    try {
      const res = roomManager.submitHigherLowerAnswer(username, chosenSide);
      if (res.success) {
        io.emit('table-state', res.tableState);
      }
      if (callback) callback(res);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('next-higher-lower', () => {
    const state = roomManager.nextHigherLowerQuestion();
    if (state) io.emit('table-state', state);
  });

  socket.on('next-higher-lower-game', () => {
    if (roomManager.table && roomManager.table.gameMode === 'higherLower') {
      const state = roomManager.startMode('higherLower', roomManager.table.hostUsername);
      io.emit('table-state', state);
    }
  });

  // Kulüp Rebuild & Transfer İhalesi
  socket.on('rebuild-set-budget', ({ budgetM, hostUsername }, callback) => {
    try {
      const state = roomManager.setRebuildBudget(budgetM, hostUsername);
      io.emit('table-state', state);
      if (callback) callback({ success: true, state });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('rebuild-place-bid', ({ username, cardId, bidAmountM }, callback) => {
    try {
      const res = roomManager.placeRebuildBid(username, cardId, bidAmountM);
      if (res.success) {
        io.emit('table-state', res.tableState);
      }
      if (callback) callback(res);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('rebuild-finalize-round', () => {
    const state = roomManager.finalizeRebuildRound();
    if (state) io.emit('table-state', state);
  });

  socket.on('rebuild-submit-votes', ({ username, votesMap }, callback) => {
    try {
      const state = roomManager.submitRebuildVotes(username, votesMap);
      io.emit('table-state', state);
      if (callback) callback({ success: true, state });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('next-rebuild-game', () => {
    if (roomManager.table && roomManager.table.gameMode === 'rebuildAuction') {
      const state = roomManager.startMode('rebuildAuction', roomManager.table.hostUsername);
      io.emit('table-state', state);
    }
  });

  // Setup WebRTC Voice mesh handlers
  setupVoiceHandlers(io, socket, roomManager);

  // Disconnect handling
  socket.on('disconnect', () => {
    const res = roomManager.removePlayerBySocketId(socket.id);
    if (res) {
      io.emit('table-state', res.tableState);
      io.emit('voice-peer-left', { socketId: socket.id });
    }
  });
});

// SPA Fallback
app.get('*', (req, res) => {
  const indexHtml = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.send('Frontend not built. Please run npm run build in frontend.');
  }
});

const PORT = CONFIG.PORT;

// Bind to 0.0.0.0 so other devices on local network / internet tunnels can connect!
server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`⚽ Football Room & Voice Server is ACTIVE!`);
  console.log(`Local Access:   http://localhost:${PORT}`);

  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`Network Access: http://${net.address}:${PORT} (Telefonlar ve diğer PC'ler)`);
      }
    }
  }
  console.log(`İnternet Paylaşımı: npm run share`);
  console.log(`Host Username:  ${CONFIG.HOST_USERNAME}`);
  console.log(`====================================================`);
});
