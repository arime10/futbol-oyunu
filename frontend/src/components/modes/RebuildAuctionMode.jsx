import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Trophy, DollarSign, Users, Shield, Clock, CheckCircle2, AlertCircle, Crown, ChevronRight, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import socket from '../../services/socket';

export default function RebuildAuctionMode({ tableState, currentUser, onBackToLobby }) {
  const [selectedBudget, setSelectedBudget] = useState(750);
  const [customBids, setCustomBids] = useState({});
  const [votes, setVotes] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);

  const isHost = (currentUser?.username || '').toLowerCase() === (tableState?.hostUsername || '').toLowerCase();
  const gameState = tableState?.gameState;
  const stage = gameState?.stage || 'setup'; // 'setup', 'auction', 'voting', 'ended'
  const budgets = gameState?.budgets || {};
  const squads = gameState?.squads || {};
  const currentPosIndex = gameState?.currentPositionIndex || 0;
  const currentPosName = gameState?.currentPositionName || 'Mevki';
  const availableCards = gameState?.availableCards || [];
  const myBudget = budgets[currentUser?.username] || 0;
  const mySquad = squads[currentUser?.username] || [];
  const voteResults = gameState?.voteResults;
  const voteStatus = gameState?.votes || {};

  const myVoteSubmitted = !!voteStatus[currentUser?.username];

  // Positions list for progress bar
  const POSITIONS = [
    'Kaleci (GK)',
    'Stoper (CB)',
    'Sağ/Sol Bek (FB)',
    'Merkez OS (CM)',
    'On Numara (CAM)',
    'Kanat (WING)',
    'Santrafor (ST)'
  ];

  // Timer for auction round
  useEffect(() => {
    if (stage === 'auction') {
      setTimeLeft(30);
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Host triggers finalize on timeout
            if (isHost) {
              socket.emit('rebuild-finalize-round');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, currentPosIndex, isHost]);

  // Confetti on results
  useEffect(() => {
    if (stage === 'ended' && voteResults) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    }
  }, [stage, voteResults]);

  // Initialize voting distribution map
  useEffect(() => {
    if (stage === 'voting') {
      const initial = {};
      tableState?.players?.forEach((p) => {
        if (p.username !== currentUser?.username) {
          initial[p.username] = 0;
        }
      });
      setVotes(initial);
    }
  }, [stage, tableState?.players, currentUser?.username]);

  const handleStartAuction = () => {
    socket.emit('rebuild-set-budget', {
      budgetM: selectedBudget,
      hostUsername: currentUser?.username
    });
  };

  const handlePlaceBid = (cardId, amount) => {
    setFeedback(null);
    socket.emit(
      'rebuild-place-bid',
      {
        username: currentUser?.username,
        cardId,
        bidAmountM: amount
      },
      (res) => {
        if (!res.success) {
          setFeedback({ error: res.error || 'Teklif verilemedi.' });
          setTimeout(() => setFeedback(null), 3000);
        }
      }
    );
  };

  const handleFinalizeRound = () => {
    socket.emit('rebuild-finalize-round');
  };

  const handleVoteChange = (targetUser, delta) => {
    const current = votes[targetUser] || 0;
    const next = Math.max(0, current + delta);
    const otherSum = Object.entries(votes)
      .filter(([u]) => u !== targetUser)
      .reduce((sum, [, val]) => sum + val, 0);

    if (otherSum + next <= 10) {
      setVotes({ ...votes, [targetUser]: next });
    }
  };

  const totalAllocatedVotes = Object.values(votes).reduce((s, v) => s + (v || 0), 0);

  const handleSubmitVotes = () => {
    if (totalAllocatedVotes !== 10) {
      alert('Tam olarak 10 puan dağıtmalısınız!');
      return;
    }

    socket.emit(
      'rebuild-submit-votes',
      {
        username: currentUser?.username,
        votesMap: votes
      },
      (res) => {
        if (!res.success) {
          alert(res.error || 'Oy gönderilemedi.');
        }
      }
    );
  };

  const handleRestartGame = () => {
    socket.emit('next-rebuild-game');
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
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono flex items-center space-x-1.5">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span>Oylama Ödülü: 1.ye +3 Puan, 2.ye +1 Puan</span>
          </div>
        </div>
      </div>

      {/* STAGE 1: SETUP (BUDGET SELECTION) */}
      {stage === 'setup' && (
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg">
            <DollarSign className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full bg-slate-900 text-emerald-400 border border-emerald-500/30">
              Kulüp Rebuild & Transfer İhalesi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">
              Kulüp Başlangıç Bütçesini Belirleyin
            </h2>
            <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
              Her oyuncu aynı bütçeyle başlar. 7 mevki boyunca (GK, CB, FB, CM, CAM, WING, ST) açık artırmaya katılacaksınız. Teklif vermeyenlere 5M€'luk temel oyuncular verilir!
            </p>
          </div>

          {isHost ? (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 500, label: '500 Milyon €', desc: 'Zorlu & Taktiksel Rebuild' },
                  { value: 750, label: '750 Milyon €', desc: 'Dengeli & İdeal (Önerilen)' },
                  { value: 1000, label: '1000 Milyon €', desc: 'Galácticos Lüks Bütçe' }
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => setSelectedBudget(opt.value)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedBudget === opt.value
                        ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-lg'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-base font-black text-white">{opt.label}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{opt.desc}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleStartAuction}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <span>İhaleyi Başlat ({selectedBudget} M€)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs font-medium italic">
              Masa kurucusu ({tableState?.hostUsername || 'yuED10'}) bütçeyi seçip ihaleyi başlatıyor...
            </div>
          )}
        </div>
      )}

      {/* STAGE 2: AUCTION DRAFT */}
      {stage === 'auction' && (
        <div className="space-y-6">
          {/* Auction Progress & Budgets Bar */}
          <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            {/* 7 Positions Progress */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
              <span>Mevki İhalesi: {currentPosIndex + 1} / 7</span>
              <div className="flex items-center space-x-2">
                <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
                <span className={`font-mono text-sm font-black ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {POSITIONS.map((pos, idx) => (
                <div
                  key={pos}
                  className={`py-1.5 px-1 text-center rounded-xl text-[10px] font-bold transition-all truncate ${
                    idx < currentPosIndex
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : idx === currentPosIndex
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/60 ring-2 ring-amber-500/30'
                      : 'bg-slate-900 text-slate-600 border border-slate-800'
                  }`}
                >
                  {pos.split(' ')[0]}
                </div>
              ))}
            </div>

            {/* Players Budget Ribbon */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Bütçeniz:</span>
                <span className="text-emerald-400 font-mono font-black text-sm bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                  {myBudget} Milyon €
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {tableState?.players?.map((p) => (
                  <div
                    key={p.username}
                    className={`text-[11px] px-2.5 py-0.5 rounded-lg border ${
                      p.username === currentUser?.username
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span>{p.username}: </span>
                    <span className="font-mono text-white font-bold">{budgets[p.username] ?? 0} M€</span>
                  </div>
                ))}
              </div>

              {isHost && (
                <button
                  onClick={handleFinalizeRound}
                  className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors ml-auto"
                >
                  Turu Şimdi Tamamla ➔
                </button>
              )}
            </div>
          </div>

          {/* Current Position Title */}
          <div className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 text-sky-400 border border-sky-500/30">
              Açık Artırma Mevkisi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1.5">
              {currentPosName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              İstediğiniz futbolcuya teklif verin. Tur bittiğinde en yüksek teklifi veren oyuncuyu alır!
            </p>
          </div>

          {feedback?.error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold text-center max-w-md mx-auto">
              {feedback.error}
            </div>
          )}

          {/* 4 Auction Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableCards.map((card) => {
              const isHighBidder = card.highBidder === currentUser?.username;
              const nextMinBid = card.highBidder ? card.currentBidM + 5 : card.basePriceM;
              const canAfford = myBudget >= nextMinBid;

              return (
                <div
                  key={card.cardId}
                  className={`rounded-3xl p-5 border-2 transition-all flex flex-col justify-between relative overflow-hidden ${
                    isHighBidder
                      ? 'border-emerald-500 bg-emerald-950/40 shadow-xl shadow-emerald-500/10'
                      : card.highBidder
                      ? 'border-amber-500/60 bg-slate-900/90'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  {/* Tier Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        card.tierLabel === 'Superstar'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : card.tierLabel === 'Yıldız'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : card.tierLabel === 'Fırsat'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {card.tierLabel}
                    </span>
                    <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-slate-800 text-white">
                      {card.overall} OVR
                    </span>
                  </div>

                  {/* Player Image & Info */}
                  <div className="text-center my-2">
                    <div className="w-20 h-20 rounded-full border-2 border-slate-700 overflow-hidden mx-auto bg-slate-800 mb-3 shadow-md">
                      <img
                        src={card.photo}
                        alt={card.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://cdn-icons-png.flaticon.com/512/861/861512.png';
                        }}
                      />
                    </div>
                    <h3 className="text-base font-extrabold text-white truncate">{card.name}</h3>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {card.club} • {card.nationality}
                    </div>
                  </div>

                  {/* Bid Info */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Güncel Teklif:</span>
                      <span className="font-mono font-black text-amber-400 text-sm">
                        {card.currentBidM} M€
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Lider Teklifçi:</span>
                      {card.highBidder ? (
                        <span className={`font-bold ${isHighBidder ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {isHighBidder ? '👑 Sizdesiniz' : card.highBidder}
                        </span>
                      ) : (
                        <span className="italic text-slate-500">Henüz teklif yok</span>
                      )}
                    </div>

                    {/* Quick Bid Button */}
                    <button
                      onClick={() => handlePlaceBid(card.cardId, nextMinBid)}
                      disabled={!canAfford || isHighBidder}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                        isHighBidder
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : canAfford
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      {isHighBidder ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Lider Teklif Sizde</span>
                        </>
                      ) : canAfford ? (
                        <span>{nextMinBid} M€ Teklif Ver</span>
                      ) : (
                        <span>Bütçe Yetersiz ({nextMinBid} M€)</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Acquired Squad Drawer */}
          {mySquad.length > 0 && (
            <div className="glass-panel p-4 rounded-3xl border border-slate-800 mt-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Alınan Futbolcularım ({mySquad.length} / 7)</span>
                <span className="text-emerald-400 font-mono">
                  Kalan: {myBudget} M€
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {mySquad.map((player, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center"
                  >
                    <div className="text-[10px] text-slate-400 font-bold uppercase truncate">{player.positionName?.split(' ')[0]}</div>
                    <div className="text-xs font-black text-white truncate mt-0.5">{player.name}</div>
                    <div className="text-[10px] text-emerald-400 font-mono font-bold mt-0.5">{player.overall} OVR</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: VOTING */}
      {stage === 'voting' && (
        <div className="space-y-6">
          <div className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full bg-slate-900 text-amber-400 border border-amber-500/30">
              ⭐ 3. Aşama: Kadro Oylaması
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              Rakiplerinizin Kadrolarını Oylayın
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
              Toplam <span className="text-amber-400 font-bold">10 puanınız</span> var. Rakiplerinizin 7 kişilik kadrolarını inceleyin ve puanlarınızı paylaştırın!
            </p>
          </div>

          {/* Vote Pool Status */}
          <div className="glass-panel p-4 rounded-3xl border border-slate-800 flex items-center justify-between max-w-xl mx-auto shadow-xl">
            <div className="text-xs font-bold text-slate-300">
              Dağıtılan Toplam Puan:
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-lg font-mono font-black px-3 py-1 rounded-xl border ${
                  totalAllocatedVotes === 10
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}
              >
                {totalAllocatedVotes} / 10 Puan
              </span>
            </div>
          </div>

          {/* Opponent Squads Display & Point Allocator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tableState?.players
              ?.filter((p) => p.username !== currentUser?.username)
              .map((opponent) => {
                const oppSquad = squads[opponent.username] || [];
                const oppAvgOvr = oppSquad.length > 0
                  ? Math.round(oppSquad.reduce((sum, p) => sum + (p.overall || 75), 0) / oppSquad.length)
                  : 0;
                const allocated = votes[opponent.username] || 0;

                return (
                  <div
                    key={opponent.username}
                    className="glass-panel p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <div className="text-base font-black text-white flex items-center space-x-2">
                          <span>{opponent.username}</span>
                          <span className="text-xs text-slate-400 font-normal">kadrosu</span>
                        </div>
                        <div className="text-xs text-amber-400 font-mono font-bold mt-0.5">
                          Ortalama Reyting: {oppAvgOvr} OVR
                        </div>
                      </div>

                      {/* Vote Buttons */}
                      {!myVoteSubmitted ? (
                        <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
                          <button
                            onClick={() => handleVoteChange(opponent.username, -1)}
                            disabled={allocated <= 0}
                            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-black flex items-center justify-center text-sm"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-mono font-black text-amber-400 text-base">
                            {allocated}
                          </span>
                          <button
                            onClick={() => handleVoteChange(opponent.username, 1)}
                            disabled={totalAllocatedVotes >= 10}
                            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-black flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-xl bg-slate-900 text-amber-400 font-mono font-black text-sm border border-slate-800">
                          {allocated} Puan Verildi
                        </div>
                      )}
                    </div>

                    {/* Squad Players Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {oppSquad.map((player, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center space-x-2"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 flex-shrink-0">
                            <img
                              src={player.photo}
                              alt={player.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://cdn-icons-png.flaticon.com/512/861/861512.png';
                              }}
                            />
                          </div>
                          <div className="truncate">
                            <div className="text-[10px] text-slate-400 font-bold truncate">{player.positionName?.split(' ')[0]}</div>
                            <div className="text-xs font-bold text-white truncate">{player.name}</div>
                            <div className="text-[10px] text-emerald-400 font-mono font-bold">{player.overall}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Submit Votes Section */}
          <div className="text-center pt-2">
            {!myVoteSubmitted ? (
              <button
                onClick={handleSubmitVotes}
                disabled={totalAllocatedVotes !== 10}
                className={`px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl transition-all ${
                  totalAllocatedVotes === 10
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {totalAllocatedVotes === 10
                  ? 'Oylarımı Onayla ve Gönder (10/10)'
                  : `Kalan ${10 - totalAllocatedVotes} Puanı Dağıtmalısınız`}
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium inline-flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Oylarınız başarıyla iletildi! Diğer oyuncuların oyları bekleniyor...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 4: ENDED & RESULTS */}
      {stage === 'ended' && voteResults && (
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl text-center max-w-2xl mx-auto space-y-6">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />

          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full bg-slate-900 text-amber-400 border border-amber-500/30">
              Rebuild Oylama Sonuçları
            </span>
            <h2 className="text-3xl font-black text-white mt-2">
              🏆 Rebuild Şampiyonu: <span className="text-amber-400">{voteResults.firstPlace?.user}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Toplanan oylara göre Genel Skor Tablosuna puanlar aktarıldı!
            </p>
          </div>

          {/* Ranking Cards */}
          <div className="space-y-3 pt-2">
            {voteResults.ranking?.map((r, idx) => (
              <div
                key={r.user}
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  idx === 0
                    ? 'bg-amber-500/20 border-amber-500/50 text-white shadow-lg'
                    : idx === 1
                    ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                      idx === 0
                        ? 'bg-amber-500 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div className="text-left">
                    <div className="font-extrabold text-sm text-white">{r.user}</div>
                    <div className="text-xs text-slate-400">{r.votePts} Oy Puanı Aldı</div>
                  </div>
                </div>

                <div className="text-right">
                  {idx === 0 && (
                    <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs">
                      +3 Genel Puan
                    </span>
                  )}
                  {idx === 1 && (
                    <span className="px-3 py-1 rounded-xl bg-slate-700 text-white font-black text-xs">
                      +1 Genel Puan
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="flex items-center justify-center space-x-3 pt-4">
              <button
                onClick={handleRestartGame}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                Yeni Rebuild Başlat
              </button>
              <button
                onClick={onBackToLobby}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
              >
                Lobiye Dön
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
