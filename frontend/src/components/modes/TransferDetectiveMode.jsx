import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, HelpCircle, BellRing, Search, Eye, AlertCircle, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import socket from '../../services/socket.js';

export default function TransferDetectiveMode({ gameState, currentUser, isHost, onBackToLobby }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [guessFeedback, setGuessFeedback] = useState(null);

  if (!gameState || !gameState.transfer) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center">
        <p className="text-slate-400">Transfer sorusu yükleniyor...</p>
      </div>
    );
  }

  const { transfer, hintsByPlayer, buzzedUser, buzzedAt, solved } = gameState;
  const isMyBuzz = buzzedUser === currentUser?.username;
  const myHints = hintsByPlayer?.[currentUser?.username] || { position: false, nationality: false };

  // Calculate my potential points: 3 if no hints opened, 2 if hints opened
  const hintsCount = (myHints.position ? 1 : 0) + (myHints.nationality ? 1 : 0);
  const currentPointsReward = hintsCount === 0 ? 3 : 2;

  // 15 seconds buzzer countdown timer
  useEffect(() => {
    if (!buzzedUser || solved) {
      setTimeLeft(15);
      return;
    }

    const elapsed = Math.floor((Date.now() - (buzzedAt || Date.now())) / 1000);
    const initial = Math.max(0, 15 - elapsed);
    setTimeLeft(initial);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isMyBuzz) {
            socket.emit('detective-timeout');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [buzzedUser, buzzedAt, solved, isMyBuzz]);

  const handleRevealHint = (hintType) => {
    socket.emit('detective-reveal-hint', {
      username: currentUser?.username,
      hintType
    });
  };

  const handleBuzz = () => {
    if (buzzedUser || solved) return;
    socket.emit('detective-buzz', { username: currentUser?.username });
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search-players?q=${encodeURIComponent(query)}&limit=6`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGuess = (player) => {
    socket.emit(
      'detective-guess',
      {
        username: currentUser?.username,
        guessPlayerId: player.id
      },
      (res) => {
        if (res.correct) {
          setGuessFeedback({ success: true, text: `Doğru bildin! +${res.points} Puan!` });
        } else {
          setGuessFeedback({ success: false, text: 'Yanlış tahmin! Sıra başkasına geçebilir.' });
          setTimeout(() => setGuessFeedback(null), 3000);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToLobby}
          className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Lobiye Dön</span>
        </button>

        {/* Live Potential Score Badge */}
        <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Senin Tahmin Değerin: {currentPointsReward} Puan</span>
        </div>
      </div>

      {/* Main Detective Case Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Badge */}
        <div className="text-center mb-6">
          <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 text-sky-400 border border-sky-500/30">
            🔍 Transfer Dosyası
          </span>
          <h2 className="text-2xl font-black text-white mt-2">
            Bu Transfer Kimin?
          </h2>
        </div>

        {/* Transfer Clues Board */}
        <div className="max-w-xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Transfer Yılı</span>
            <span className="text-lg font-black text-white font-mono">{transfer.year}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Bonservis Bedeli</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{transfer.feeEur}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Eski Kulüp</span>
            <span className="text-xs font-black text-slate-200 line-clamp-1">{transfer.fromClub}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Yeni Kulüp</span>
            <span className="text-xs font-black text-amber-300 line-clamp-1">{transfer.toClub}</span>
          </div>
        </div>

        {/* Private Hints Unlock Buttons (Only Visible to Me) */}
        {!solved && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-xs text-slate-400 mb-3 font-semibold">
              Kişiye Özel İpuçları (Sadece siz görürsünüz, -1 Puan):
            </div>

            <div className="flex items-center justify-center gap-3">
              {/* Position Hint */}
              {myHints.position ? (
                <div className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
                  Mevki: {transfer.position}
                </div>
              ) : (
                <button
                  onClick={() => handleRevealHint('position')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all transform active:scale-95"
                >
                  Mevkiyi Aç (-1 Puan)
                </button>
              )}

              {/* Nationality Hint */}
              {myHints.nationality ? (
                <div className="px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold">
                  Uyruk: {transfer.nationality}
                </div>
              ) : (
                <button
                  onClick={() => handleRevealHint('nationality')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all transform active:scale-95"
                >
                  Uyruğu Aç (-1 Puan)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Solved Card */}
        {solved && (
          <div className={`max-w-sm mx-auto p-4 rounded-2xl border text-center mb-6 animate-in zoom-in-95 ${
            gameState?.skipped
              ? 'bg-rose-500/15 border-rose-500/40'
              : 'bg-emerald-500/15 border-emerald-500/40'
          }`}>
            <CheckCircle2 className={`w-10 h-10 mx-auto mb-2 ${gameState?.skipped ? 'text-rose-400' : 'text-emerald-400'}`} />
            <h3 className="text-xl font-black text-white">{transfer.playerName}</h3>
            <p className={`text-xs mt-0.5 ${gameState?.skipped ? 'text-rose-300' : 'text-emerald-300'}`}>
              {gameState?.skipped ? 'Kimse bulamadı! Transferin sahibi buydu.' : 'Doğru cevaplandı!'}
            </p>
            {isHost && (
              <button
                onClick={() => socket.emit('next-detective-question')}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition-all transform active:scale-95"
              >
                Sonraki Transfer Sorusuna Geç ➡️
              </button>
            )}
          </div>
        )}


        {/* Buzzer Area */}
        {!solved && (
          <div className="text-center mb-6 space-y-3">
            {buzzedUser ? (
              <div className="inline-flex flex-col items-center p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <BellRing className="w-4 h-4 animate-bounce" />
                  <span>{buzzedUser} buzze bastı!</span>
                </div>
                <div className="text-xs font-mono font-black mt-1 text-white">
                  Kalan Süre: <span className="text-amber-400 text-sm">{timeLeft}</span> saniye
                </div>
              </div>
            ) : (
              <button
                onClick={handleBuzz}
                className="px-8 py-4 rounded-3xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-lg shadow-xl shadow-amber-500/25 transition-all transform active:scale-95 flex items-center justify-center space-x-2 mx-auto"
              >
                <BellRing className="w-6 h-6 animate-bounce" />
                <span>BUZZER'A BAS! (15 Saniye)</span>
              </button>
            )}

            {isHost && !buzzedUser && (
              <div>
                <button
                  onClick={() => socket.emit('detective-skip', { hostUsername: currentUser?.username })}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs transition-all shadow-md"
                >
                  Kimse Bulamadı / Soruyu Atla ⏩
                </button>
              </div>
            )}
          </div>
        )}

        {/* Guessing Input Drawer if current user buzzed */}
        {isMyBuzz && !solved && (
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-900 border border-amber-500/60 shadow-2xl mb-4 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-2">
              <span>Futbolcunun ismini yaz:</span>
              <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded-md">
                ⏱️ {timeLeft}s
              </span>
            </div>

            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Örn: Kane, Mbappé, Haaland..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleGuess(p)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="font-bold text-white">{p.name}</span>
                    <span className="text-[10px] text-slate-400">{p.club} • {p.nationality}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedback message */}
        {guessFeedback && (
          <div className={`p-3 rounded-2xl text-center text-xs font-bold max-w-sm mx-auto ${
            guessFeedback.success
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}>
            {guessFeedback.text}
          </div>
        )}
      </div>
    </div>
  );
}
