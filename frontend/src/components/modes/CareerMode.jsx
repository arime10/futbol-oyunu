import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, HelpCircle, BellRing, Search, ArrowRight, Eye, CheckCircle2 } from 'lucide-react';
import socket from '../../services/socket.js';

export default function CareerMode({ gameState, currentUser, isHost, onBackToLobby }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [guessFeedback, setGuessFeedback] = useState(null);

  if (!gameState || !gameState.question) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center">
        <p className="text-slate-400">Kariyer sorusu yükleniyor...</p>
      </div>
    );
  }

  const { question, revealedCountByPlayer = {}, buzzedUser, buzzedAt, solved } = gameState;
  const isMyBuzz = buzzedUser === currentUser?.username;

  // Private count of revealed clubs for current user
  const myRevealedCount = revealedCountByPlayer[currentUser?.username] || 1;
  const careerClubs = question.careerClubs || [];

  // Potential points: 1 club = 3 pts, 2 clubs = 2 pts, 3+ clubs = 1 pt
  let myCurrentPoints = 1;
  if (myRevealedCount === 1) myCurrentPoints = 3;
  else if (myRevealedCount === 2) myCurrentPoints = 2;

  // 15 seconds buzzer countdown
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
            socket.emit('career-timeout');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [buzzedUser, buzzedAt, solved, isMyBuzz]);

  const handleRevealNext = () => {
    socket.emit('career-reveal-hint', { username: currentUser?.username });
  };

  const handleBuzz = () => {
    if (buzzedUser || solved) return;
    socket.emit('career-buzz', { username: currentUser?.username });
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
      'career-guess',
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
        <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold font-mono flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Senin Tahmin Değerin: {myCurrentPoints} Puan</span>
        </div>
      </div>

      {/* Main Career Guesser Arena */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Mystery Player Card */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="relative mb-4">
            <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center overflow-hidden bg-slate-900 ${
              solved ? 'border-emerald-400 fut-glow-emerald' : 'border-purple-500/50 fut-glow-blue'
            }`}>
              {solved ? (
                <img
                  src={question.photo}
                  alt={question.playerName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://cdn-icons-png.flaticon.com/512/861/861512.png';
                  }}
                />
              ) : (
                <HelpCircle className="w-14 h-14 text-purple-400 animate-pulse" />
              )}
            </div>
          </div>

          <h3 className="text-2xl font-black text-white">
            {solved ? question.playerName : '??? Gizemli Futbolcu ???'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Milliyet: <span className="text-slate-200 font-bold">{question.nationality}</span>
          </p>

          {solved && gameState.skipped && (
            <div className="text-xs font-bold text-rose-400 mt-2 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 inline-block">
              Kimse bulamadı! Doğru cevap: <span className="text-white font-black">{question.playerName}</span>
            </div>
          )}

          {!solved && isHost && (
            <button
              onClick={() => socket.emit('career-skip', { hostUsername: currentUser?.username })}
              className="mt-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs transition-all shadow-md"
            >
              Kimse Bulamadı / Soruyu Atla ⏩
            </button>
          )}

          {solved && isHost && (
            <button
              onClick={() => socket.emit('next-career-question')}
              className="mt-3 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs shadow-lg transition-all transform active:scale-95"
            >
              Sonraki Kariyer Sorusuna Geç ➡️
            </button>
          )}
        </div>


        {/* Private Revealed Clubs for Current User */}
        <div className="mb-8">
          <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Senin Ekranındaki Kulüpler ({myRevealedCount} / {careerClubs.length})
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            {careerClubs.map((club, idx) => {
              const isRevealed = idx < myRevealedCount || solved;
              return (
                <div key={idx} className="flex items-center space-x-2">
                  <div
                    className={`px-4 py-2.5 rounded-2xl border text-xs font-black transition-all ${
                      isRevealed
                        ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-200 border-purple-500/40 shadow-lg'
                        : 'bg-slate-900/60 text-slate-600 border-slate-800'
                    }`}
                  >
                    {isRevealed ? club : `Kulüp #${idx + 1}`}
                  </div>
                  {idx < careerClubs.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Private Reveal Next Button (Only affects me) */}
          {!solved && myRevealedCount < careerClubs.length && (
            <div className="text-center">
              <button
                onClick={handleRevealNext}
                className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all transform active:scale-95 inline-flex items-center space-x-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Sonraki Kulübü Aç (Sadece Sana Gözükür)</span>
              </button>
            </div>
          )}
        </div>

        {/* Buzzer Button Section */}
        {!solved && (
          <div className="text-center mb-6">
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
                className="px-8 py-4 rounded-3xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-lg shadow-xl shadow-rose-500/30 transition-all transform active:scale-95 flex items-center justify-center space-x-2 mx-auto"
              >
                <BellRing className="w-6 h-6 animate-bounce" />
                <span>BUZZER'A BAS! (15 Saniye)</span>
              </button>
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
                placeholder="Örn: Cristiano Ronaldo, Haaland..."
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
