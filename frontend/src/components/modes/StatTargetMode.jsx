import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Clock, Target, Search, Lock, CheckCircle2, Trophy, Award } from 'lucide-react';
import socket from '../../services/socket.js';

export default function StatTargetMode({ gameState, currentUser, isHost, onBackToLobby }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [currentRevealStep, setCurrentRevealStep] = useState(0);

  if (!gameState || !gameState.challenge) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center">
        <p className="text-slate-400">Stat Hedefi yükleniyor...</p>
      </div>
    );
  }

  const { challenge, picks, claimedPlayerIds = [], startTime, results } = gameState;
  const myPicks = picks?.[currentUser?.username] || [];

  // Find opponent
  const allUsers = Object.keys(picks || {});
  const opponentUser = allUsers.find(u => u !== currentUser?.username);
  const opponentPicks = opponentUser ? (picks[opponentUser] || []) : [];

  // 120 Seconds Global Timer
  useEffect(() => {
    if (results) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (startTime || Date.now())) / 1000);
      const remaining = Math.max(0, 120 - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0 && isHost) {
        clearInterval(interval);
        handleFinalize();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, results, isHost]);

  // Autocomplete search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search-players?q=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClaim = (player) => {
    if (myPicks.length >= 5) {
      alert('Zaten 5 futbolcu seçtiniz!');
      return;
    }
    if (claimedPlayerIds.includes(player.id)) {
      alert('Bu futbolcu rakip tarafından seçilmiş!');
      return;
    }

    socket.emit(
      'stat-claim-player',
      {
        username: currentUser?.username,
        playerId: player.id
      },
      (res) => {
        if (res.success) {
          setSearchQuery('');
          setSearchResults([]);
        } else {
          alert(res.message);
        }
      }
    );
  };

  const handleFinalize = () => {
    socket.emit('stat-finalize');
  };

  // Automated Sequential Reveal Effect
  useEffect(() => {
    if (results && currentRevealStep < 5) {
      const timer = setTimeout(() => {
        setCurrentRevealStep(prev => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [results, currentRevealStep]);

  // Calculate live revealed sums
  const calculateRevealedSum = (playerPicks) => {
    const revealedSlice = playerPicks.slice(0, currentRevealStep);
    return revealedSlice.reduce((sum, p) => sum + (p.statValue || 0), 0);
  };

  const myRevealedSum = results ? calculateRevealedSum(myPicks) : 0;
  const oppRevealedSum = results ? calculateRevealedSum(opponentPicks) : 0;

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

        {/* 120s Timer Badge */}
        {!results && (
          <div className={`px-4 py-1.5 rounded-2xl border text-xs font-mono font-bold flex items-center space-x-2 shadow-lg ${
            timeLeft < 20
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              : 'bg-slate-900 text-amber-300 border-slate-700'
          }`}>
            <Clock className="w-4 h-4" />
            <span>Kalan Süre: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
        )}
      </div>

      {/* Target Mission Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 shadow-2xl text-center relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
          <Target className="w-4 h-4" />
          <span>Stat Hedefi</span>
        </div>

        <h2 className="text-3xl font-black text-white mb-1">
          {challenge.title}
        </h2>
        <div className="text-sm font-extrabold text-amber-300 font-mono">
          Hedef Sayı: <span className="text-2xl text-emerald-400">{challenge.target}</span> {challenge.unit}
        </div>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          5 futbolcu seçin. İki taraf da aynı oyuncuyu yazamaz. Süre sonunda hedefe en yakın olan <span className="text-amber-400 font-bold">1 Puan</span> kazanır!
        </p>

        {/* Both finished button for host */}
        {isHost && !results && (myPicks.length === 5 || opponentPicks.length === 5) && (
          <button
            onClick={handleFinalize}
            className="mt-4 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition-all"
          >
            Seçimleri Kilitle ve İstatistikleri Aç
          </button>
        )}
      </div>

      {/* Picking Arena (When not finalized) */}
      {!results ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My Team (5 slots) */}
          <div className="glass-panel p-5 rounded-3xl border border-emerald-500/30 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                Senin 5 Futbolcun ({myPicks.length} / 5)
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {[0, 1, 2, 3, 4].map(idx => {
                const pick = myPicks[idx];
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      pick
                        ? 'bg-slate-900/90 border-emerald-500/50 shadow-md'
                        : 'bg-slate-900/40 border-slate-800 border-dashed'
                    }`}
                  >
                    {pick ? (
                      <div className="flex items-center space-x-3">
                        <img
                          src={pick.photo}
                          alt={pick.name}
                          className="w-10 h-10 rounded-full object-cover bg-slate-800 border border-slate-700"
                          onError={(e) => {
                            e.target.src = 'https://cdn-icons-png.flaticon.com/512/861/861512.png';
                          }}
                        />
                        <div>
                          <div className="text-xs font-black text-white">{pick.name}</div>
                          <div className="text-[10px] text-slate-400">{pick.club} • {pick.nationality}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 font-semibold pl-2">
                        {idx + 1}. Futbolcu Bekleniyor...
                      </span>
                    )}

                    {pick && (
                      <div className="text-[11px] text-slate-500 font-bold">
                        🔒 Kilitlendi
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Search Input for picking */}
            {myPicks.length < 5 && (
              <div>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Futbolcu adı yaz (İlk yazan kapar!)..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Autocomplete list */}
                {searchResults.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {searchResults.map(player => {
                      const isClaimed = claimedPlayerIds.includes(player.id);
                      return (
                        <div
                          key={player.id}
                          onClick={() => !isClaimed && handleClaim(player)}
                          className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                            isClaimed
                              ? 'bg-rose-950/20 border-rose-900/40 opacity-50 cursor-not-allowed text-rose-300'
                              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">{player.name}</span>
                            <span className="text-[10px] text-slate-400">{player.club}</span>
                          </div>
                          {isClaimed ? (
                            <span className="text-[10px] font-bold text-rose-400 flex items-center space-x-1">
                              <Lock className="w-3 h-3" />
                              <span>Rakip Seçti</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-bold">+ Seç</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opponent Progress (Hidden identities until reveal) */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Rakip ({opponentUser || 'Rakip Bekleniyor'}): {opponentPicks.length} / 5
              </span>
            </div>

            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map(idx => {
                const pick = opponentPicks[idx];
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      pick
                        ? 'bg-slate-900/80 border-slate-700'
                        : 'bg-slate-900/40 border-slate-800 border-dashed'
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-400">
                      {pick ? `${idx + 1}. Futbolcu Seçildi 🔒` : `${idx + 1}. Bekleniyor...`}
                    </span>
                    {pick && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Sequential Animated Reveal Area */
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/40 shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
              İstatistikler Sırayla Açılıyor... ({currentRevealStep} / 5)
            </span>
            <h3 className="text-2xl font-black text-white">
              Hedef: {challenge.target} {challenge.unit}
            </h3>
          </div>

          {/* Scores comparison */}
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mb-8 text-center">
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40">
              <span className="text-xs text-slate-300 font-bold block">{currentUser?.username} (Sen)</span>
              <span className="text-3xl font-black text-emerald-400 font-mono mt-1 block">
                {myRevealedSum}
              </span>
              <span className="text-[11px] text-slate-400">Fark: {Math.abs(challenge.target - myRevealedSum)}</span>
            </div>

            <div className="p-4 rounded-2xl bg-sky-500/15 border border-sky-500/40">
              <span className="text-xs text-slate-300 font-bold block">{opponentUser || 'Rakip'}</span>
              <span className="text-3xl font-black text-sky-400 font-mono mt-1 block">
                {oppRevealedSum}
              </span>
              <span className="text-[11px] text-slate-400">Fark: {Math.abs(challenge.target - oppRevealedSum)}</span>
            </div>
          </div>

          {/* Winner announcement when all 5 revealed */}
          {currentRevealStep >= 5 && (
            <div className="text-center p-6 rounded-3xl bg-amber-500/20 border border-amber-500/50 max-w-md mx-auto animate-in zoom-in-95">
              <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2 animate-bounce" />
              <h4 className="text-xl font-black text-white uppercase">
                Kazanan: {results.winner || 'Berabere!'} (+1 Puan)
              </h4>
              <p className="text-xs text-amber-200 mt-1">
                Hedefe en yakın toplamı toplayan oyuncu raundu kazandı!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
