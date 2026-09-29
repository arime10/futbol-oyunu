import React, { useState } from 'react';
import { ArrowLeft, Search, Sparkles, Trophy, Flame, Crown, Swords, ShieldAlert, CheckCircle2, Star, Zap } from 'lucide-react';
import socket from '../../services/socket';

export default function CardClashMode({ tableState, currentUser, onBackToLobby }) {
  const [activeSlotModal, setActiveSlotModal] = useState(null); // slotIndex (0-6)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const isHost = (currentUser?.username || '').toLowerCase() === (tableState?.hostUsername || '').toLowerCase();
  const gameState = tableState?.gameState;

  const stage = gameState?.stage || 'draft'; // 'draft', 'battle', 'ended'
  const goldRules = gameState?.goldRules || [];
  const duelRules = gameState?.duelRules || [];
  const currentRoundIndex = gameState?.currentRoundIndex || 0;
  const currentRule = duelRules[currentRoundIndex];
  const roundResults = gameState?.roundResults || [];
  const lastRound = roundResults.length > 0 ? roundResults[roundResults.length - 1] : null;

  const myDraft = gameState?.drafts?.[currentUser?.username] || Array(7).fill(null);
  const myReady = !!gameState?.readyPlayers?.[currentUser?.username];
  const clashScores = gameState?.clashScores || {};
  const currentPlays = gameState?.currentPlays || {};
  const haveIPlayed = !!currentPlays[currentUser?.username];

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

  const handleSelectPlayerForSlot = (player) => {
    if (activeSlotModal === null) return;
    setErrorMsg(null);

    socket.emit(
      'clash-set-slot',
      {
        username: currentUser?.username,
        slotIndex: activeSlotModal,
        playerId: player.id
      },
      (res) => {
        if (res.success) {
          setActiveSlotModal(null);
          setSearchQuery('');
          setSearchResults([]);
        } else {
          setErrorMsg(res.reason || 'Kurala uymuyor!');
          setTimeout(() => setErrorMsg(null), 3500);
        }
      }
    );
  };

  const handleLockDraft = () => {
    socket.emit('clash-lock-draft', { username: currentUser?.username }, (res) => {
      if (!res.success) {
        alert(res.error || '7 kartın tamamını seçmelisin!');
      }
    });
  };

  const handlePlayCard = (slotIndex) => {
    if (haveIPlayed) return;
    socket.emit('clash-play-card', {
      username: currentUser?.username,
      cardSlotIndex: slotIndex
    });
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
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono flex items-center space-x-1.5">
            <Crown className="w-3.5 h-3.5" />
            <span>Maç Sonu Ödülü: +3 Puan</span>
          </div>
        </div>
      </div>

      {/* STAGE 1: DRAFT PHASE */}
      {stage === 'draft' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
          <div className="text-center mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 text-amber-400 border border-amber-500/30">
              ⚔️ 1. Aşama: 7 Kartını Hazırla
            </span>
            <h2 className="text-2xl font-black text-white mt-2">
              3 Altın Kart Kuralına Göre Seçim Yap!
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              İlk 3 kart Altın (Gold) karttır ve kurallara uymak zorundadır. Son 4 kart istediğin herhangi bir futbolcu olabilir.
            </p>
          </div>

          {/* 7 Card Slots Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-8">
            {Array.from({ length: 7 }).map((_, idx) => {
              const card = myDraft[idx];
              const isGold = idx < 3;
              const rule = isGold ? goldRules[idx] : null;

              return (
                <div
                  key={idx}
                  onClick={() => !myReady && setActiveSlotModal(idx)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[170px] ${
                    isGold
                      ? 'bg-gradient-to-b from-amber-500/15 to-slate-900 border-amber-500/40 hover:border-amber-400 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  } ${myReady ? 'opacity-80 cursor-default' : 'hover:scale-[1.02]'}`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between text-[10px] font-black uppercase">
                    <span className={isGold ? 'text-amber-400 flex items-center space-x-1' : 'text-slate-400'}>
                      {isGold && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                      <span>{isGold ? `Altın #${idx + 1}` : `Düz #${idx - 2}`}</span>
                    </span>
                    {card && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>

                  {/* Body Content */}
                  <div className="my-auto py-2 text-center">
                    {card ? (
                      <div>
                        <img
                          src={card.player.photo || 'https://cdn-icons-png.flaticon.com/512/861/861512.png'}
                          alt={card.player.name}
                          className="w-12 h-12 rounded-full object-cover mx-auto mb-1.5 border border-slate-700 bg-slate-800"
                          onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/861/861512.png'; }}
                        />
                        <div className="text-xs font-black text-white line-clamp-1">{card.player.name}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{card.player.club}</div>
                      </div>
                    ) : (
                      <div className="text-slate-500 hover:text-slate-300">
                        <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center mx-auto mb-1 text-slate-400">
                          +
                        </div>
                        <span className="text-[11px] font-bold">Kart Seç</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Rule footer */}
                  <div className="text-[9px] font-bold text-center pt-1 border-t border-slate-800/60 line-clamp-2">
                    {isGold ? (
                      <span className="text-amber-300">{rule?.title}</span>
                    ) : (
                      <span className="text-slate-500">Serbest Seçim</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ready Button & Status */}
          <div className="max-w-md mx-auto text-center space-y-4">
            {!myReady ? (
              <button
                onClick={handleLockDraft}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all transform active:scale-95"
              >
                7 KARTIMI ONAYLA VE KİLİTLE 🔒
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Kadron kilitlendi! Diğer oyuncuların seçimi bekleniyor...</span>
              </div>
            )}

            {/* Players ready status */}
            <div className="flex items-center justify-center space-x-3 text-xs text-slate-400">
              {tableState?.players?.map(p => (
                <div key={p.username} className="flex items-center space-x-1.5 font-mono">
                  <div className={`w-2 h-2 rounded-full ${gameState?.readyPlayers?.[p.username] ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className={gameState?.readyPlayers?.[p.username] ? 'text-emerald-300' : 'text-slate-500'}>
                    {p.username}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: BATTLE ARENA (7 ROUNDS) */}
      {stage === 'battle' && (
        <div className="space-y-6">
          {/* Arena Header */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl text-center relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 text-purple-400 border border-purple-500/30">
                Tur {currentRoundIndex + 1} / 7
              </span>

              {/* Live Clash Scores */}
              <div className="flex items-center space-x-3">
                {Object.entries(clashScores).map(([user, pts]) => (
                  <div key={user} className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-white">
                    {user}: <span className="text-amber-400">{pts} Düello Puanı</span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="text-3xl font-black text-white">
              {currentRule?.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {currentRule?.desc}
            </p>
          </div>

          {/* Last Round Result Banner if exists */}
          {lastRound && lastRound.roundIndex === currentRoundIndex - 1 && (
            <div className="p-4 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 text-center animate-in fade-in">
              <span className="text-xs font-bold text-indigo-300 block mb-2">
                Önceki Tur Sonucu: {lastRound.ruleTitle}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {Object.entries(lastRound.plays).map(([u, c]) => (
                  <div key={u} className={`p-2.5 rounded-xl border text-xs flex items-center space-x-2 ${
                    lastRound.winner === u ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-black' : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}>
                    <span>{u}:</span>
                    <span className="font-bold">{c.player.name}</span>
                    <span className="font-mono text-amber-400">({currentRule?.getVal ? c.player[currentRule.statKey] || '-' : '-'})</span>
                    {lastRound.winner === u && <span className="text-emerald-400 text-[10px]">(+{lastRound.clashPoints} P)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Hand: Choose a Card to play */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl">
            <div className="text-center mb-4">
              <h3 className="text-lg font-black text-white">
                {haveIPlayed ? 'Kartını Oynadın! Diğer oyuncu bekleniyor...' : 'Bu Tur İçin Bir Kart Oyna:'}
              </h3>
              <p className="text-xs text-slate-400">
                Altın kart ile kazanırsan <span className="text-amber-400 font-bold">2 Düello Puanı</span>, Düz kart ile kazanırsan <span className="text-sky-400 font-bold">1 Düello Puanı</span> alırsın!
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {myDraft.map((card, idx) => {
                if (!card) return null;
                const isPlayed = card.played;
                const isGold = card.isGold;
                const statVal = card.player[currentRule?.statKey] ?? (card.player.stats?.[currentRule?.statKey] || '-');

                return (
                  <div
                    key={idx}
                    onClick={() => !haveIPlayed && !isPlayed && handlePlayCard(idx)}
                    className={`p-3 rounded-2xl border transition-all flex flex-col justify-between min-h-[160px] text-center ${
                      isPlayed
                        ? 'opacity-30 bg-slate-950 border-slate-900 cursor-not-allowed'
                        : isGold
                        ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-500/40 hover:border-amber-400 cursor-pointer hover:scale-105 shadow-lg'
                        : 'bg-slate-900/90 border-slate-800 hover:border-sky-500/50 cursor-pointer hover:scale-105'
                    }`}
                  >
                    <div className="text-[10px] font-black uppercase flex items-center justify-center space-x-1">
                      {isGold && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                      <span className={isGold ? 'text-amber-400' : 'text-slate-400'}>
                        {isGold ? 'Altın (2P)' : 'Düz (1P)'}
                      </span>
                    </div>

                    <div className="my-auto py-2">
                      <img
                        src={card.player.photo || 'https://cdn-icons-png.flaticon.com/512/861/861512.png'}
                        alt={card.player.name}
                        className="w-12 h-12 rounded-full object-cover mx-auto mb-1 border border-slate-700 bg-slate-800"
                        onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/861/861512.png'; }}
                      />
                      <div className="text-xs font-black text-white line-clamp-1">{card.player.name}</div>
                      <div className="text-[11px] font-mono font-bold text-amber-300 mt-1">
                        {currentRule?.title.split(' ')[0]}: {statVal}
                      </div>
                    </div>

                    <div className="text-[9px] font-bold text-slate-500 pt-1 border-t border-slate-800/60">
                      {isPlayed ? 'Kullanıldı' : 'Kartı Oyna ⚔️'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: GAME ENDED & CHAMPION */}
      {stage === 'ended' && (
        <div className="glass-panel p-8 rounded-3xl border border-amber-500/40 shadow-2xl text-center max-w-lg mx-auto animate-in zoom-in-95">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-bounce" />
          <h2 className="text-3xl font-black text-white">
            Düello Şampiyonu: {gameState?.finalWinner}!
          </h2>
          <p className="text-sm font-bold text-amber-300 mt-1">
            Genel Masa Sıralamasına +3 Puan Eklendi! 🎉
          </p>

          <div className="my-6 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 block mb-2">Final Düello Skorları:</span>
            {Object.entries(clashScores).map(([user, pts]) => (
              <div key={user} className="flex items-center justify-between text-sm px-3 py-1.5 rounded-xl bg-slate-800/60 font-mono">
                <span className="text-white font-bold">{user}</span>
                <span className="text-amber-400 font-black">{pts} Düello Puanı</span>
              </div>
            ))}
          </div>

          <button
            onClick={onBackToLobby}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all transform active:scale-95"
          >
            Lobiye Dön 🏠
          </button>
        </div>
      )}

      {/* SELECT PLAYER MODAL FOR SLOT */}
      {activeSlotModal !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white">
                {activeSlotModal < 3 ? `Altın Kart #${activeSlotModal + 1} Seç:` : `Düz Kart #${activeSlotModal - 2} Seç:`}
              </h3>
              <button
                onClick={() => { setActiveSlotModal(null); setSearchQuery(''); setSearchResults([]); }}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800"
              >
                Kapat
              </button>
            </div>

            {activeSlotModal < 3 && (
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-4">
                ⭐ Zorunlu Kural: {goldRules[activeSlotModal]?.title}
              </div>
            )}

            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Örn: Messi, Ronaldo, Arda Güler, Haaland..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold mb-3">
                {errorMsg}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPlayerForSlot(p)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-white block">{p.name}</span>
                      <span className="text-[10px] text-slate-400">{p.club} • {p.nationality}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">{p.overall} OVR</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
