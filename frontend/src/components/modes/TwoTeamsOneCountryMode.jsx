import React, { useState } from 'react';
import { ArrowLeft, Search, CheckCircle2, Shield, Globe2, Sparkles, Award } from 'lucide-react';
import socket from '../../services/socket';

export default function TwoTeamsOneCountryMode({ tableState, currentUser, onBackToLobby }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isHost = (currentUser?.username || '').toLowerCase() === (tableState?.hostUsername || '').toLowerCase();
  const gameState = tableState?.gameState;
  const club1 = gameState?.club1 || 'Real Madrid';
  const club2 = gameState?.club2 || 'Manchester United';
  const country = gameState?.country || 'Portekiz';

  const twoMatchClaimed = gameState?.twoMatchClaimed;
  const twoMatchWinner = gameState?.twoMatchWinner;
  const twoMatchPlayer = gameState?.twoMatchPlayer;

  const solved = gameState?.solved;
  const skipped = gameState?.skipped;
  const threeMatchWinner = gameState?.threeMatchWinner;
  const threeMatchPlayer = gameState?.threeMatchPlayer;

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
      'two-teams-guess',
      { username: currentUser?.username, guessPlayerId: player.id },
      (res) => {
        if (res.success) {
          if (res.isThreeMatch) {
            setFeedback({
              success: true,
              text: `MUHTEŞEM! 3 kriteri de sağlayan futbolcuyu buldun (${player.name})! +${res.points} Puan!`
            });
          } else if (res.isTwoMatch) {
            setFeedback({
              success: true,
              text: `Harika! 2 kriteri sağlayan futbolcuyu buldun (${player.name})! +1 Puan! Şimdi 3'lü eşleşmeyi bulmaya çalış!`
            });
          }
          setSearchQuery('');
          setSearchResults([]);
        } else {
          setFeedback({ success: false, text: res.reason || 'Kriterleri karşılamıyor!' });
          setTimeout(() => setFeedback(null), 3500);
        }
      }
    );
  };

  const handleSkip = () => {
    socket.emit('two-teams-skip', { hostUsername: currentUser?.username });
  };

  const handleNextRound = () => {
    socket.emit('next-two-teams-round');
    setFeedback(null);
    setSearchQuery('');
    setSearchResults([]);
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

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold font-mono">
            3'lü Eşleşme: 2 Puan
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono">
            2'li Eşleşme: 1 Puan
          </div>
        </div>
      </div>

      {/* Main Arena */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Title */}
        <div className="text-center mb-6">
          <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 text-purple-400 border border-purple-500/30">
            🔥 2 Takım 1 Ülke Modu
          </span>
          <h2 className="text-2xl font-black text-white mt-2">
            3 Kriteri veya 2 Kriteri Sağlayan Futbolcuyu Bul!
          </h2>
        </div>

        {/* 3 Criteria Cards */}
        <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-purple-500/40 text-center shadow-lg">
            <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">1. Takım</span>
            <span className="text-sm font-black text-white line-clamp-1">{club1}</span>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900/90 border border-indigo-500/40 text-center shadow-lg">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-2">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">2. Takım</span>
            <span className="text-sm font-black text-white line-clamp-1">{club2}</span>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900/90 border border-amber-500/40 text-center shadow-lg">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
              <Globe2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Ülke / Milliyet</span>
            <span className="text-sm font-black text-white line-clamp-1">{country}</span>
          </div>
        </div>

        {/* Live Criteria Status Bar */}
        <div className="max-w-xl mx-auto grid grid-cols-2 gap-3 mb-6">
          <div className={`p-3 rounded-2xl border text-center transition-all ${
            twoMatchClaimed
              ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}>
            <span className="text-[10px] font-bold uppercase block">2'li Eşleşme (1 Puan)</span>
            <span className="text-xs font-black">
              {twoMatchClaimed ? `Alındı: ${twoMatchWinner} (${twoMatchPlayer?.name})` : 'Henüz Alınmadı (Açık)'}
            </span>
          </div>

          <div className={`p-3 rounded-2xl border text-center transition-all ${
            solved && threeMatchWinner
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}>
            <span className="text-[10px] font-bold uppercase block">3'lü Eşleşme (2 Puan)</span>
            <span className="text-xs font-black">
              {solved && threeMatchWinner ? `Kazandı: ${threeMatchWinner} (${threeMatchPlayer?.name})` : 'Bekleniyor (Tur Biter)'}
            </span>
          </div>
        </div>

        {/* Solved Card */}
        {solved && (
          <div className={`max-w-md mx-auto p-5 rounded-3xl border text-center mb-6 animate-in zoom-in-95 ${
            skipped ? 'bg-rose-500/15 border-rose-500/40' : 'bg-emerald-500/15 border-emerald-500/40'
          }`}>
            <CheckCircle2 className={`w-10 h-10 mx-auto mb-2 ${skipped ? 'text-rose-400' : 'text-emerald-400'}`} />
            <h3 className="text-xl font-black text-white">
              {skipped ? 'Tur Pas Geçildi' : `${threeMatchWinner || twoMatchWinner} Turu Tamamladı!`}
            </h3>

            {threeMatchPlayer && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3 text-left">
                <img
                  src={threeMatchPlayer.photo || 'https://cdn-icons-png.flaticon.com/512/861/861512.png'}
                  alt={threeMatchPlayer.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700"
                  onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/861/861512.png'; }}
                />
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">3'lü Tam Eşleşme</span>
                  <div className="font-black text-white text-sm mt-0.5">{threeMatchPlayer.name}</div>
                  <div className="text-[11px] text-slate-400">{threeMatchPlayer.club} • {threeMatchPlayer.nationality}</div>
                </div>
              </div>
            )}

            {isHost && (
              <button
                onClick={handleNextRound}
                className="mt-4 px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs shadow-lg transition-all transform active:scale-95"
              >
                Sonraki Soruya Geç ➡️
              </button>
            )}
          </div>
        )}

        {/* Guessing Input Area */}
        {!solved && (
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-900 border border-purple-500/40 shadow-2xl mb-6">
            <div className="text-xs font-bold text-purple-300 mb-2">
              Futbolcunun ismini yaz:
            </div>

            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Örn: Di Maria, Cristiano Ronaldo, Pepe..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                autoFocus
              />
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleGuess(p)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="font-bold text-white">{p.name}</span>
                    <span className="text-[10px] text-slate-400">{p.club} • {p.nationality}</span>
                  </div>
                ))}
              </div>
            )}

            {isHost && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleSkip}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs transition-all shadow-md"
                >
                  Kimse Bulamadı / Atla ⏩
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback message */}
        {feedback && (
          <div className={`p-3 rounded-2xl text-center text-xs font-bold max-w-sm mx-auto ${
            feedback.success
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}>
            {feedback.text}
          </div>
        )}
      </div>
    </div>
  );
}
