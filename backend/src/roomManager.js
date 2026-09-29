import { CONFIG } from './config.js';
import { generateGriddyBoard, validatePlayerForCell, checkTicTacToeWin } from './games/griddy.js';
import { getCareerQuestion } from './games/career.js';
import { getRandomTransferQuestion } from './games/transferDetective.js';
import { getRandomStatChallenge, getPlayerStatValue } from './games/statTarget.js';
import { generateRandomOneTeamOneCountry, isPlayerEligible } from './games/oneTeamOneCountry.js';
import { generateRandomTwoTeamsOneCountry, checkPlayerMatchCriteria } from './games/twoTeamsOneCountry.js';
import { generateCardClashSetup, validatePlayerForGoldRule } from './games/cardClash.js';
import { generateHigherLowerQuestion } from './games/higherLower.js';
import { REBUILD_POSITIONS, generatePositionAuction, initRebuildState } from './games/rebuildAuction.js';

export class RoomManager {
  constructor(players, clubs) {
    this.players = players;
    this.clubs = clubs;
    // Exactly 1 active table on the server
    this.table = null;
  }

  isHost(username) {
    return (username || '').trim().toLowerCase() === CONFIG.HOST_USERNAME.toLowerCase();
  }

  getTableState() {
    if (!this.table) {
      return { exists: false, hostUsername: CONFIG.HOST_USERNAME };
    }
    return {
      exists: true,
      id: this.table.id,
      hostUsername: this.table.hostUsername,
      inviteCode: this.table.inviteCode,
      gameMode: this.table.gameMode,
      gameState: this.table.gameState,
      isFinished: this.table.isFinished,
      podium: this.table.podium,
      players: this.table.players.map(p => ({
        socketId: p.socketId,
        username: p.username,
        isHost: p.isHost,
        score: this.table.scores[p.username] || 0,
        isMuted: !!p.isMuted,
        isSpeaking: !!p.isSpeaking
      }))
    };
  }

  createTable(username, customInviteCode, socketId) {
    if (!this.isHost(username)) {
      throw new Error(`Yalnızca belirlenen özel kurucu (${CONFIG.HOST_USERNAME}) masa kurabilir!`);
    }

    const inviteCode = (customInviteCode || CONFIG.DEFAULT_INVITE_CODE).trim().toUpperCase();

    this.table = {
      id: 'table-1',
      hostUsername: username,
      inviteCode: inviteCode,
      createdAt: new Date().toISOString(),
      players: [
        {
          socketId,
          username,
          isHost: true,
          isMuted: false,
          isSpeaking: false
        }
      ],
      scores: {
        [username]: 0
      },
      gameMode: 'lobby',
      gameState: null,
      isFinished: false,
      podium: null
    };

    return this.getTableState();
  }

  joinTable(username, inviteCode, socketId) {
    if (!this.table) {
      throw new Error('Henüz kurulmuş aktif bir masa yok. Lütfen masa kurucusunun masayı açmasını bekleyin.');
    }

    const code = (inviteCode || '').trim().toUpperCase();
    if (code !== this.table.inviteCode) {
      throw new Error('Geçersiz davet kodu! Lütfen kurucunun verdiği kodu kontrol edin.');
    }

    const isHost = this.isHost(username);

    // Check if player already exists in the table (reconnect scenario)
    const existingIndex = this.table.players.findIndex(p => p.username.toLowerCase() === username.toLowerCase());
    if (existingIndex !== -1) {
      this.table.players[existingIndex].socketId = socketId;
      this.table.players[existingIndex].isHost = isHost;
    } else {
      this.table.players.push({
        socketId,
        username,
        isHost,
        isMuted: false,
        isSpeaking: false
      });
      if (this.table.scores[username] === undefined) {
        this.table.scores[username] = 0;
      }
    }

    return this.getTableState();
  }

  removePlayerBySocketId(socketId) {
    if (!this.table) return null;
    const player = this.table.players.find(p => p.socketId === socketId);
    if (!player) return null;

    this.table.players = this.table.players.filter(p => p.socketId !== socketId);
    return { player, tableState: this.getTableState() };
  }

  // Host Power: Score correction / manual override
  updateScore(username, newScore, hostUsername) {
    if (!this.table) throw new Error('Aktif masa yok.');
    if (!this.isHost(hostUsername)) {
      throw new Error('Sadece masa kurucusu puanları düzenleyebilir!');
    }

    const scoreNum = parseInt(newScore, 10);
    if (isNaN(scoreNum)) throw new Error('Geçersiz puan değeri.');

    this.table.scores[username] = scoreNum;
    return this.getTableState();
  }

  // Host Power: Add delta points
  addPoints(username, delta, hostUsername) {
    if (!this.table) throw new Error('Aktif masa yok.');
    if (!this.isHost(hostUsername)) {
      throw new Error('Sadece masa kurucusu puan ekleyebilir/düzenleyebilir!');
    }

    const deltaNum = parseInt(delta, 10) || 0;
    this.table.scores[username] = (this.table.scores[username] || 0) + deltaNum;
    return this.getTableState();
  }

  // Host Power: End current game / tournament
  endGame(hostUsername) {
    if (!this.table) throw new Error('Aktif masa yok.');
    if (!this.isHost(hostUsername)) {
      throw new Error('Sadece masa kurucusu oyunu bitirebilir!');
    }

    this.table.isFinished = true;

    // Calculate podium (ranked by score descending)
    const ranked = Object.entries(this.table.scores)
      .map(([username, score]) => ({ username, score }))
      .sort((a, b) => b.score - a.score);

    this.table.podium = {
      winner: ranked[0] || null,
      second: ranked[1] || null,
      third: ranked[2] || null,
      allRankings: ranked
    };

    return this.getTableState();
  }

  // Restart / Reset game to lobby
  resetGame(hostUsername) {
    if (!this.table) throw new Error('Aktif masa yok.');
    if (!this.isHost(hostUsername)) {
      throw new Error('Sadece masa kurucusu oyunu sıfırlayabilir!');
    }

    this.table.isFinished = false;
    this.table.podium = null;
    this.table.gameMode = 'lobby';
    this.table.gameState = null;

    return this.getTableState();
  }

  // Host Power: Start a specific game mode
  startMode(mode, hostUsername) {
    if (!this.table) throw new Error('Aktif masa yok.');
    if (!this.isHost(hostUsername)) {
      throw new Error('Sadece masa kurucusu yeni mod başlatabilir!');
    }

    this.table.gameMode = mode;
    this.table.isFinished = false;

    if (mode === 'griddy') {
      this.table.gameState = generateGriddyBoard(this.players, this.clubs, this.table.players);
    } else if (mode === 'career') {
      const q = getCareerQuestion(this.players);
      const revealedMap = {};
      this.table.players.forEach(p => { revealedMap[p.username] = 1; });

      this.table.gameState = {
        question: q,
        revealedCountByPlayer: revealedMap,
        buzzedUser: null,
        buzzedAt: null,
        solved: false
      };
    } else if (mode === 'detective') {
      const t = getRandomTransferQuestion();
      const hintsMap = {};
      this.table.players.forEach(p => {
        hintsMap[p.username] = { position: false, nationality: false };
      });

      this.table.gameState = {
        transfer: t,
        hintsByPlayer: hintsMap,
        buzzedUser: null,
        buzzedAt: null,
        solved: false
      };
    } else if (mode === 'statTarget') {
      const challenge = getRandomStatChallenge();
      const picksMap = {};
      this.table.players.forEach(p => { picksMap[p.username] = []; });

      this.table.gameState = {
        challenge,
        totalTime: 120,
        startTime: Date.now(),
        picks: picksMap,
        claimedPlayerIds: [],
        revealedRound: -1,
        finishedUsers: [],
        results: null
      };
    } else if (mode === 'oneTeamOneCountry') {
      const setup = generateRandomOneTeamOneCountry(this.players);
      this.table.gameState = {
        ...setup,
        buzzedUser: null,
        buzzedAt: null,
        solved: false,
        skipped: false,
        winner: null,
        winningPlayer: null
      };
    } else if (mode === 'twoTeamsOneCountry') {
      const setup = generateRandomTwoTeamsOneCountry(this.players);
      this.table.gameState = {
        ...setup,
        buzzedUser: null,
        buzzedAt: null,
        twoMatchClaimed: false,
        twoMatchWinner: null,
        twoMatchPlayer: null,
        threeMatchWinner: null,
        threeMatchPlayer: null,
        solved: false,
        skipped: false
      };
    } else if (mode === 'cardClash') {
      const setup = generateCardClashSetup();
      this.table.players.forEach(p => {
        setup.drafts[p.username] = Array(7).fill(null);
        setup.readyPlayers[p.username] = false;
        setup.clashScores[p.username] = 0;
      });
      this.table.gameState = setup;
    } else if (mode === 'higherLower') {
      const q = generateHigherLowerQuestion(this.players);
      const pointsMap = {};
      this.table.players.forEach(p => { pointsMap[p.username] = 0; });
      this.table.gameState = {
        question: q,
        roundPoints: pointsMap,
        targetPoints: 5,
        revealed: false,
        roundWinner: null,
        matchWinner: null
      };
    } else if (mode === 'rebuildAuction') {
      const state = initRebuildState(this.table.players.map(p => p.username), 750);
      this.table.gameState = state;
    } else {
      this.table.gameMode = 'lobby';
      this.table.gameState = null;
    }

    return this.getTableState();
  }

  // Turn-based: Pas geç / Sıradakine devret
  passTurn(username, isHost) {
    if (!this.table || !this.table.gameState) return null;
    const state = this.table.gameState;
    if (!state.turnOrder || state.turnOrder.length === 0) return null;

    if (state.currentTurnUsername !== username && !isHost) {
      throw new Error('Sadece kendi sıranızı veya kurucu sırayı devredebilir.');
    }

    state.currentTurnIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
    state.currentTurnUsername = state.turnOrder[state.currentTurnIndex];

    return this.getTableState();
  }

  // Griddy: Hücre doldurma & 3'lü kazanma kontrolü
  submitGriddyCell(cellIndex, playerId, username) {
    if (!this.table || this.table.gameMode !== 'griddy') {
      throw new Error('Griddy modu aktif değil.');
    }
    const state = this.table.gameState;

    if (state.winner) {
      return { success: false, message: 'Bu tur sona erdi, kazanan: ' + state.winner };
    }

    // Turn check
    if (state.currentTurnUsername && state.currentTurnUsername.toLowerCase() !== username.toLowerCase()) {
      return {
        success: false,
        message: `Şu an sıra sizde değil! Hamle sırası: ${state.currentTurnUsername}`
      };
    }

    if (state.grid[cellIndex]) {
      return { success: false, message: 'Bu hücre zaten doldurulmuş!' };
    }

    const rowIdx = Math.floor(cellIndex / 3);
    const colIdx = cellIndex % 3;
    const rowCrit = state.rows[rowIdx];
    const colCrit = state.cols[colIdx];

    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false, message: 'Futbolcu bulunamadı.' };

    const isValid = validatePlayerForCell(rowCrit, colCrit, player);
    if (!isValid) {
      return { success: false, message: `${player.name} bu hücre kriterlerini karşılamıyor.` };
    }

    const playerColor = state.playerColors[username] || '#10b981';

    // Cell is correct!
    state.grid[cellIndex] = {
      player: {
        id: player.id,
        name: player.name,
        photo: player.photo,
        club: player.club,
        nationality: player.nationality
      },
      placedBy: username,
      color: playerColor
    };
    state.completedBy[cellIndex] = username;
    state.moveHistory.push({
      cellIndex,
      playerName: player.name,
      placedBy: username,
      timestamp: Date.now()
    });

    // Check 3-in-a-row Tic Tac Toe Win!
    const winResult = checkTicTacToeWin(state.grid);
    if (winResult) {
      state.winner = winResult.winner;
      state.winningLine = winResult.line;
      // 3'lüyü yapan 1 puan kazanır!
      this.table.scores[winResult.winner] = (this.table.scores[winResult.winner] || 0) + 1;
    } else if (state.grid.every(Boolean)) {
      state.isDraw = true;
    } else {
      // Advance turn to next player
      if (state.turnOrder && state.turnOrder.length > 0) {
        state.currentTurnIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
        state.currentTurnUsername = state.turnOrder[state.currentTurnIndex];
      }
    }

    return {
      success: true,
      tableState: this.getTableState()
    };
  }

  // Career: Kişiye özel sonraki kulübü açma
  revealCareerNextForUser(username) {
    if (!this.table || this.table.gameMode !== 'career') return null;
    const gs = this.table.gameState;
    if (!gs || !gs.question) return null;

    if (!gs.revealedCountByPlayer) gs.revealedCountByPlayer = {};
    const currentCount = gs.revealedCountByPlayer[username] || 1;
    const maxClubs = gs.question.careerClubs.length;

    if (currentCount < maxClubs) {
      gs.revealedCountByPlayer[username] = currentCount + 1;
    }

    return this.getTableState();
  }

  // Transfer Dedektifi: Kişiye özel ipucu açma (mevki / uyruk)
  revealDetectiveHint(username, hintType) {
    if (!this.table || this.table.gameMode !== 'detective') return null;
    const gs = this.table.gameState;
    if (!gs) return null;

    if (!gs.hintsByPlayer) gs.hintsByPlayer = {};
    if (!gs.hintsByPlayer[username]) {
      gs.hintsByPlayer[username] = { position: false, nationality: false };
    }

    if (hintType === 'position' || hintType === 'nationality') {
      gs.hintsByPlayer[username][hintType] = true;
    }

    return this.getTableState();
  }

  // Stat Target: Oyuncu seçme (ortak kilit mekanizması)
  claimStatPlayer(username, playerId) {
    if (!this.table || this.table.gameMode !== 'statTarget') {
      throw new Error('Stat modu aktif değil.');
    }
    const gs = this.table.gameState;

    if (gs.claimedPlayerIds.includes(playerId)) {
      return { success: false, message: 'Bu futbolcu rakip tarafından zaten seçildi!' };
    }

    if (!gs.picks[username]) gs.picks[username] = [];
    if (gs.picks[username].length >= 5) {
      return { success: false, message: '5 futbolcu limitine ulaştınız!' };
    }

    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false, message: 'Futbolcu bulunamadı.' };

    const statVal = getPlayerStatValue(player.id, gs.challenge.statKey, player);

    const pickObj = {
      id: player.id,
      name: player.name,
      photo: player.photo,
      club: player.club,
      nationality: player.nationality,
      statValue: statVal,
      statLabel: `${statVal} ${gs.challenge.unit}`
    };

    gs.picks[username].push(pickObj);
    gs.claimedPlayerIds.push(playerId);

    return { success: true, tableState: this.getTableState() };
  }

  // Stat Target: Sonuç hesaplama (yavaş yavaş sırayla açılma sonrası kazanan)
  finalizeStatResults() {
    if (!this.table || this.table.gameMode !== 'statTarget') return null;
    const gs = this.table.gameState;
    const target = gs.challenge.target;

    const userTotals = {};
    let closestUser = null;
    let minDiff = Infinity;

    for (const [user, picks] of Object.entries(gs.picks)) {
      const sum = picks.reduce((s, p) => s + (p.statValue || 0), 0);
      const diff = Math.abs(target - sum);
      userTotals[user] = { sum, diff };

      if (diff < minDiff) {
        minDiff = diff;
        closestUser = user;
      }
    }

    if (closestUser) {
      // Kazanan 1 puan alır!
      this.table.scores[closestUser] = (this.table.scores[closestUser] || 0) + 1;
    }

    gs.results = {
      userTotals,
      winner: closestUser,
      target
    };

    return this.getTableState();
  }

  // Career: Kimse bulamadı / Soru atla
  skipCareer(hostUsername) {
    if (!this.isHost(hostUsername)) throw new Error('Yetkisiz işlem.');
    if (!this.table || this.table.gameMode !== 'career') return null;
    const gs = this.table.gameState;
    if (!gs) return null;
    gs.solved = true;
    gs.skipped = true;
    return this.getTableState();
  }

  // Transfer Dedektifi: Kimse bulamadı / Soru atla
  skipDetective(hostUsername) {
    if (!this.isHost(hostUsername)) throw new Error('Yetkisiz işlem.');
    if (!this.table || this.table.gameMode !== 'detective') return null;
    const gs = this.table.gameState;
    if (!gs) return null;
    gs.solved = true;
    gs.skipped = true;
    return this.getTableState();
  }

  // 1 Takım 1 Ülke: Tahmin kontrolü
  submitOneTeamOneCountryGuess(username, guessPlayerId) {
    if (!this.table || this.table.gameMode !== 'oneTeamOneCountry') {
      throw new Error('Mod aktif değil.');
    }
    const gs = this.table.gameState;
    if (gs.solved) throw new Error('Bu tur zaten tamamlandı.');

    const player = this.players.find(p => p.id === guessPlayerId);
    if (!player) throw new Error('Futbolcu bulunamadı.');

    const ok = isPlayerEligible(player, gs.club, gs.country);
    if (!ok) {
      return { success: false, reason: `${player.name}, ${gs.club} ve ${gs.country} kriterlerini karşılamıyor.` };
    }

    // 1 Puan kazanır!
    this.table.scores[username] = (this.table.scores[username] || 0) + 1;
    gs.solved = true;
    gs.winner = username;
    gs.winningPlayer = player;

    return {
      success: true,
      points: 1,
      tableState: this.getTableState()
    };
  }

  skipOneTeamOneCountry(hostUsername) {
    if (!this.isHost(hostUsername)) throw new Error('Yetkisiz işlem.');
    if (!this.table || this.table.gameMode !== 'oneTeamOneCountry') return null;
    const gs = this.table.gameState;
    if (!gs) return null;
    gs.solved = true;
    gs.skipped = true;
    const valid = this.players.find(p => isPlayerEligible(p, gs.club, gs.country));
    if (valid) gs.winningPlayer = valid;
    return this.getTableState();
  }

  // 2 Takım 1 Ülke: Tahmin kontrolü (3'lü eşleşme = 2 puan, 2'li = 1 puan)
  submitTwoTeamsOneCountryGuess(username, guessPlayerId) {
    if (!this.table || this.table.gameMode !== 'twoTeamsOneCountry') {
      throw new Error('Mod aktif değil.');
    }
    const gs = this.table.gameState;
    if (gs.solved) throw new Error('Bu tur zaten tamamlandı.');

    const player = this.players.find(p => p.id === guessPlayerId);
    if (!player) throw new Error('Futbolcu bulunamadı.');

    const matchInfo = checkPlayerMatchCriteria(player, gs.club1, gs.club2, gs.country);

    if (matchInfo.matchCount === 3) {
      let pts = 2;
      if (gs.twoMatchWinner === username) {
        pts = 1; // Daha önce 2'liden 1 puan almıştı, +1 daha eklenir (toplam 2)
      }
      this.table.scores[username] = (this.table.scores[username] || 0) + pts;
      gs.threeMatchWinner = username;
      gs.threeMatchPlayer = player;
      gs.solved = true;

      return {
        success: true,
        isThreeMatch: true,
        points: pts,
        totalPointsForUser: gs.twoMatchWinner === username ? 2 : pts,
        tableState: this.getTableState()
      };
    } else if (matchInfo.matchCount === 2) {
      if (gs.twoMatchClaimed) {
        return {
          success: false,
          reason: "2'li eşleşme zaten alındı! Şimdi 3 kriteri de sağlayan futbolcuyu bulmalısın (2 Puan)!"
        };
      }
      this.table.scores[username] = (this.table.scores[username] || 0) + 1;
      gs.twoMatchClaimed = true;
      gs.twoMatchWinner = username;
      gs.twoMatchPlayer = player;

      return {
        success: true,
        isTwoMatch: true,
        points: 1,
        tableState: this.getTableState()
      };
    } else {
      return {
        success: false,
        reason: `${player.name} yeterli kriteri karşılamıyor (En az 2 kriter gerekli).`
      };
    }
  }

  skipTwoTeamsOneCountry(hostUsername) {
    if (!this.isHost(hostUsername)) throw new Error('Yetkisiz işlem.');
    if (!this.table || this.table.gameMode !== 'twoTeamsOneCountry') return null;
    const gs = this.table.gameState;
    if (!gs) return null;
    gs.solved = true;
    gs.skipped = true;
    const sample3 = this.players.find(p => checkPlayerMatchCriteria(p, gs.club1, gs.club2, gs.country).matchCount === 3);
    if (sample3) gs.threeMatchPlayer = sample3;
    return this.getTableState();
  }

  // 7 Kart Futbolcu Düellosu: Slot belirleme
  setCardClashSlot(username, slotIndex, playerId) {
    if (!this.table || this.table.gameMode !== 'cardClash') throw new Error('Mod aktif değil.');
    const gs = this.table.gameState;
    if (gs.stage !== 'draft') throw new Error('Seçim aşaması bitti.');

    const player = this.players.find(p => p.id === playerId);
    if (!player) throw new Error('Oyuncu bulunamadı.');

    if (!gs.drafts[username]) gs.drafts[username] = Array(7).fill(null);

    const isGold = slotIndex < 3;
    if (isGold) {
      const rule = gs.goldRules[slotIndex];
      const valid = validatePlayerForGoldRule(player, rule.id);
      if (!valid) {
        return { success: false, reason: `Bu futbolcu "${rule.title}" kuralına uymuyor!` };
      }
    }

    gs.drafts[username][slotIndex] = {
      slotIndex,
      isGold,
      ruleId: isGold ? gs.goldRules[slotIndex].id : null,
      player
    };

    return { success: true, tableState: this.getTableState() };
  }

  // 7 Kart: Kadroyu Kilitle
  lockCardClashDraft(username) {
    if (!this.table || this.table.gameMode !== 'cardClash') throw new Error('Mod aktif değil.');
    const gs = this.table.gameState;
    const userDraft = gs.drafts[username] || [];
    if (userDraft.filter(Boolean).length < 7) {
      throw new Error('7 kartın tamamını seçmelisin!');
    }

    gs.readyPlayers[username] = true;

    // Masadaki tüm oyuncular kilitledi mi?
    const allReady = this.table.players.every(p => gs.readyPlayers[p.username]);
    if (allReady) {
      gs.stage = 'battle';
      gs.currentRoundIndex = 0;
      gs.currentPlays = {};
    }

    return this.getTableState();
  }

  // 7 Kart: Kart Oynama
  playCardClashCard(username, cardSlotIndex) {
    if (!this.table || this.table.gameMode !== 'cardClash') throw new Error('Mod aktif değil.');
    const gs = this.table.gameState;
    if (gs.stage !== 'battle') throw new Error('Savaş aşamasında değil.');

    const userDraft = gs.drafts[username];
    if (!userDraft || !userDraft[cardSlotIndex]) throw new Error('Geçersiz kart.');
    const card = userDraft[cardSlotIndex];
    if (card.played) throw new Error('Bu kart zaten oynandı.');

    card.played = true;
    gs.currentPlays[username] = card;

    const activeUsers = this.table.players.map(p => p.username);
    const allPlayed = activeUsers.every(u => !!gs.currentPlays[u]);

    if (allPlayed) {
      const rule = gs.duelRules[gs.currentRoundIndex];
      let roundWinner = null;
      let highestVal = -Infinity;
      let isTie = false;

      activeUsers.forEach(u => {
        const playedCard = gs.currentPlays[u];
        const val = rule.getVal(playedCard.player);
        if (val > highestVal) {
          highestVal = val;
          roundWinner = u;
          isTie = false;
        } else if (val === highestVal) {
          isTie = true;
        }
      });

      const roundResult = {
        roundIndex: gs.currentRoundIndex,
        ruleTitle: rule.title,
        plays: { ...gs.currentPlays },
        highestVal,
        winner: isTie ? null : roundWinner,
        isTie
      };

      if (!isTie && roundWinner) {
        const winningCard = gs.currentPlays[roundWinner];
        const clashPts = winningCard.isGold ? 2 : 1;
        gs.clashScores[roundWinner] = (gs.clashScores[roundWinner] || 0) + clashPts;
        roundResult.clashPoints = clashPts;
      }

      gs.roundResults.push(roundResult);

      if (gs.currentRoundIndex < 6) {
        gs.currentRoundIndex++;
        gs.currentPlays = {};
      } else {
        gs.stage = 'ended';
        let gameWinner = null;
        let maxClash = -1;
        for (const [u, pts] of Object.entries(gs.clashScores)) {
          if (pts > maxClash) {
            maxClash = pts;
            gameWinner = u;
          }
        }
        if (gameWinner) {
          // Kazanan genel tabloya 3 puan alır!
          this.table.scores[gameWinner] = (this.table.scores[gameWinner] || 0) + 3;
          gs.finalWinner = gameWinner;
        }
      }
    }

    return this.getTableState();
  }

  // Kim Daha Çok? (Higher or Lower)
  submitHigherLowerAnswer(username, chosenSide) {
    if (!this.table || this.table.gameMode !== 'higherLower') throw new Error('Mod aktif değil.');
    const gs = this.table.gameState;
    if (gs.revealed || gs.matchWinner) return { success: false, reason: 'Tur kapandı.' };

    const isCorrect = chosenSide === gs.question.correctWinner;
    gs.revealed = true;

    if (isCorrect) {
      gs.roundWinner = username;
      gs.roundPoints[username] = (gs.roundPoints[username] || 0) + 1;

      // 5 yapan totale 1 puan eklesin!
      if (gs.roundPoints[username] >= 5) {
        this.table.scores[username] = (this.table.scores[username] || 0) + 1;
        gs.matchWinner = username;
      }
    } else {
      gs.roundWinner = null;
    }

    return {
      success: true,
      correct: isCorrect,
      roundWinner: gs.roundWinner,
      matchWinner: gs.matchWinner,
      tableState: this.getTableState()
    };
  }

  nextHigherLowerQuestion() {
    if (!this.table || this.table.gameMode !== 'higherLower') return null;
    const gs = this.table.gameState;
    if (gs.matchWinner) return this.getTableState();

    gs.question = generateHigherLowerQuestion(this.players);
    gs.revealed = false;
    gs.roundWinner = null;
    return this.getTableState();
  }

  // Kulüp Rebuild & Transfer İhalesi
  setRebuildBudget(budgetM, hostUsername) {
    if (!this.isHost(hostUsername)) throw new Error('Sadece kurucu bütçe seçebilir.');
    if (!this.table || this.table.gameMode !== 'rebuildAuction') throw new Error('Mod aktif değil.');
    const gs = this.table.gameState;

    gs.initialBudgetM = budgetM;
    this.table.players.forEach(p => {
      gs.budgets[p.username] = budgetM;
    });

    gs.stage = 'auction';
    gs.currentPositionIndex = 0;
    gs.currentPositionName = REBUILD_POSITIONS[0].name;
    gs.availableCards = generatePositionAuction(this.players, 0);
    gs.roundTimeLeft = 30;

    return this.getTableState();
  }

  placeRebuildBid(username, cardId, bidAmountM) {
    if (!this.table || this.table.gameMode !== 'rebuildAuction') throw new Error('Mod aktif değil.');
    const gs = this.table.gameState;
    if (gs.stage !== 'auction') throw new Error('İhale aşamasında değil.');

    const userBudget = gs.budgets[username] || 0;
    if (bidAmountM > userBudget) {
      throw new Error(`Bütçeniz yetersiz! Kalan bütçeniz: ${userBudget} Milyon €`);
    }

    const card = gs.availableCards.find(c => c.cardId === cardId);
    if (!card) throw new Error('Kart bulunamadı.');

    const minRequired = card.highBidder ? card.currentBidM + 5 : card.basePriceM;
    if (bidAmountM < minRequired) {
      throw new Error(`Minimum teklif ${minRequired} Milyon € olmalıdır.`);
    }

    // Kullanıcının bu turdaki eski tekliflerini kaldır
    gs.availableCards.forEach(c => {
      if (c.cardId !== cardId && c.highBidder === username) {
        c.highBidder = null;
        c.currentBidM = c.basePriceM;
      }
    });

    card.currentBidM = bidAmountM;
    card.highBidder = username;

    return { success: true, tableState: this.getTableState() };
  }

  finalizeRebuildRound() {
    if (!this.table || this.table.gameMode !== 'rebuildAuction') return null;
    const gs = this.table.gameState;
    if (gs.stage !== 'auction') return null;

    const activeUsers = this.table.players.map(p => p.username);
    const usersWonThisRound = new Set();

    // En yüksek teklif sahiplerine futbolcuları ver
    gs.availableCards.forEach(card => {
      if (card.highBidder) {
        const u = card.highBidder;
        gs.budgets[u] = Math.max(0, (gs.budgets[u] || 0) - card.currentBidM);
        gs.squads[u].push({
          positionName: gs.currentPositionName,
          positionKey: REBUILD_POSITIONS[gs.currentPositionIndex].key,
          ...card
        });
        usersWonThisRound.add(u);
      }
    });

    // İhalede oyuncu alamayan veya teklif vermeyenlere 5M€'luk temel/basic oyuncu ver
    const basicCard = gs.availableCards[3] || gs.availableCards[gs.availableCards.length - 1];
    activeUsers.forEach(u => {
      if (!usersWonThisRound.has(u)) {
        gs.budgets[u] = Math.max(0, (gs.budgets[u] || 0) - (basicCard ? basicCard.basePriceM : 5));
        gs.squads[u].push({
          positionName: gs.currentPositionName,
          positionKey: REBUILD_POSITIONS[gs.currentPositionIndex].key,
          ...basicCard,
          cardId: `basic-${Date.now()}-${Math.random()}`
        });
      }
    });

    // Sonraki mevkiye geç veya oylamayı başlat
    if (gs.currentPositionIndex < REBUILD_POSITIONS.length - 1) {
      gs.currentPositionIndex++;
      gs.currentPositionName = REBUILD_POSITIONS[gs.currentPositionIndex].name;
      gs.availableCards = generatePositionAuction(this.players, gs.currentPositionIndex);
      gs.roundTimeLeft = 30;
    } else {
      // 7 mevki bitti, oylama aşaması!
      gs.stage = 'voting';
      gs.votes = {};
      activeUsers.forEach(u => { gs.votes[u] = null; });
    }

    return this.getTableState();
  }

  submitRebuildVotes(username, votesMap) {
    if (!this.table || this.table.gameMode !== 'rebuildAuction') throw new Error('Mod aktif değil.');
    const gs = this.table.gameState;
    if (gs.stage !== 'voting') throw new Error('Oylama aşamasında değil.');

    // Kendine oy veremez
    if (votesMap[username] && votesMap[username] > 0) {
      throw new Error('Kendi kadronuza oy veremezsiniz!');
    }

    // Toplam 10 puan dağıtılmış olmalı
    const totalAllocated = Object.values(votesMap).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
    if (totalAllocated !== 10) {
      throw new Error(`Tam olarak 10 puan dağıtmalısınız! Dağıtılan: ${totalAllocated}`);
    }

    gs.votes[username] = votesMap;

    // Herkes oy verdi mi kontrol et
    const activeUsers = this.table.players.map(p => p.username);
    const allVoted = activeUsers.every(u => !!gs.votes[u]);

    if (allVoted) {
      // Oyları topla
      const totals = {};
      activeUsers.forEach(u => { totals[u] = 0; });

      Object.values(gs.votes).forEach(voteSheet => {
        for (const [targetUser, pts] of Object.entries(voteSheet)) {
          if (totals[targetUser] !== undefined) {
            totals[targetUser] += (parseInt(pts, 10) || 0);
          }
        }
      });

      const ranking = Object.entries(totals)
        .map(([user, votePts]) => ({ user, votePts }))
        .sort((a, b) => b.votePts - a.votePts);

      // 1. olan 3, 2. olan 1 puan alır!
      if (ranking[0]) {
        this.table.scores[ranking[0].user] = (this.table.scores[ranking[0].user] || 0) + 3;
      }
      if (ranking[1]) {
        this.table.scores[ranking[1].user] = (this.table.scores[ranking[1].user] || 0) + 1;
      }

      gs.voteResults = {
        ranking,
        firstPlace: ranking[0] || null,
        secondPlace: ranking[1] || null
      };
      gs.stage = 'ended';
    }

    return this.getTableState();
  }
}

