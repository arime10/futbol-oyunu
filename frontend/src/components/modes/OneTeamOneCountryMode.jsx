import React, { useState } from 'react';
import { ArrowLeft, Search, CheckCircle2, Shield, Globe2, Sparkles, AlertCircle } from 'lucide-react';
import socket from '../../services/socket';

export default function OneTeamOneCountryMode({ tableState, currentUser, onBackToLobby }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isHost = (currentUser?.username || '').toLowerCase() === (tableState?.hostUsername || '').toLowerCase();
  const gameState = tableState?.gameState;
  const club = gameState?.club || 'Real Madrid';
  const country = gameState?.country || 'Brezilya';
  const solved = gameState?.solved;
  const skipped = gameState?.skipped;
  const winningPlayer = gameState?.winningPlayer;
  const winner = gameState?.winner;

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
      'one-team-guess',
      { username: currentUser?.username, guessPlayerId: player.id },
      (res) => {
        if (res.success) {
          setFeedback({ success: true, text: `Tebrikler! ${player.name} doğru cevap! +1 Puan!` });
          setSearchQuery('');
          setSearchResults([]);
        } else {
          setFeedback({ success: false, text: res.reason || 'Kriterleri karşılamıyor!' });
          setTimeout(() => setFeedback(null), 3000);
        }
      }
    );
  };

  const handleSkip = () => {
    socket.emit('one-team-skip', { hostUsername: currentUser?.username });
  };

  const handleNextRound = () => {
    socket.emit('next-one-team-round');
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

        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ödül: 1 Puan</span>
        </div>
      </div>

      {/* Main Arena */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Title */}
        <div className="text-center mb-6">
          <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 text-sky-400 border border-sky-500/30">
            🎯 1 Takım 1 Ülke Modu
          </span>
          <h2 className="text-2xl font-black text-white mt-2">
            Bu İki Kriteri Sağlayan Futbolcuyu İlk Yazan Kazanır!
          </h2>
        </div>

        {/* The 2 Criteria Cards */}
        <div className="max-w-md mx-auto grid grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-sky-500/40 text-center shadow-lg relative overflow-hidden group">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-2">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Takım / Kulüp</span>
            <span className="text-lg font-black text-white line-clamp-1">{club}</span>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-amber-500/40 text-center shadow-lg relative overflow-hidden group">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
              <Globe2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Ülke / Milliyet</span>
            <span className="text-lg font-black text-white line-clamp-1">{country}</span>
          </div>
        </div>

        {/* Solved Card */}
        {solved && (
          <div className={`max-w-md mx-auto p-5 rounded-3xl border text-center mb-6 animate-in zoom-in-95 ${
            skipped ? 'bg-rose-500/15 border-rose-500/40' : 'bg-emerald-500/15 border-emerald-500/40'
          }`}>
            <CheckCircle2 className={`w-10 h-10 mx-auto mb-2 ${skipped ? 'text-rose-400' : 'text-emerald-400'}`} />
            <h3 className="text-xl font-black text-white">
              {skipped ? 'Tur Pas Geçildi' : `${winner} Bildi! (+1 Puan)`}
            </h3>
            {winningPlayer && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3 text-left">
                <img
                  src={winningPlayer.photo || 'https://cdn-icons-png.flaticon.com/512/861/861512.png'}
                  alt={winningPlayer.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700"
                  onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/861/861512.png'; }}
                />
                <div>
                  <div className="font-black text-white text-sm">{winningPlayer.name}</div>
                  <div className="text-[11px] text-slate-400">{winningPlayer.club} • {winningPlayer.nationality}</div>
                </div>
              </div>
            )}
            {isHost && (
              <button
                onClick={handleNextRound}
                className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition-all transform active:scale-95"
              >
                Sonraki Soruya Geç ➡️
              </button>
            )}
          </div>
        )}

        {/* Guessing Input Area */}
        {!solved && (
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-900 border border-sky-500/40 shadow-2xl mb-6">
            <div className="text-xs font-bold text-sky-300 mb-2 flex items-center justify-between">
              <span>Hem {club} hem {country} olan futbolcuyu yaz:</span>
            </div>

            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Örn: Roberto Carlos, Marcelo, Arda Güler..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
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
