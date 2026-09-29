import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Trophy, Zap, AlertCircle, CheckCircle2, XCircle, Timer, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import socket from '../../services/socket';

// Synthetic sound effects using Web Audio API
function playSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch (e) {
    // Ignore audio error
  }
}

export default function HigherLowerMode({ tableState, currentUser, onBackToLobby }) {
  const [timeLeft, setTimeLeft] = useState(10);
  const [myChoice, setMyChoice] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const timerRef = useRef(null);

  const isHost = (currentUser?.username || '').toLowerCase() === (tableState?.hostUsername || '').toLowerCase();
  const gameState = tableState?.gameState;
  const question = gameState?.question;
  const revealed = gameState?.revealed;
  const roundWinner = gameState?.roundWinner;
  const matchWinner = gameState?.matchWinner;
  const roundPoints = gameState?.roundPoints || {};
  const targetPoints = gameState?.targetPoints || 5;

  // Reset timer on new question
  useEffect(() => {
    if (!question) return;
    setMyChoice(null);
    setFeedback(null);
    setTimeLeft(10);

    if (timerRef.current) clearInterval(timerRef.current);

    if (!revealed && !matchWinner) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question?.id, revealed, matchWinner]);

  // Confetti on match win
  useEffect(() => {
    if (matchWinner) {
      playSound('win');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [matchWinner]);

  const handleSelectSide = (side) => {
    if (revealed || matchWinner || myChoice) return;
    setMyChoice(side);

    socket.emit(
      'higher-lower-answer',
      { username: currentUser?.username, chosenSide: side },
      (res) => {
        if (res.success) {
          if (res.correct) {
            playSound('correct');
            setFeedback({ success: true, text: `Doğru cevap! +1 Tur Puanı!` });
          } else {
            playSound('wrong');
            setFeedback({ success: false, text: `Yanlış seçim! Doğru cevap diğeriydi.` });
          }
        } else {
          setFeedback({ success: false, text: res.reason || 'Cevap gönderilemedi.' });
        }
      }
    );
  };

  const handleNextQuestion = () => {
    socket.emit('next-higher-lower');
  };

  const handleRestartGame = () => {
    socket.emit('next-higher-lower-game');
  };

  if (!question) {
    return (
      <div className="p-8 text-center text-slate-400">
        Soru hazırlanıyor...
      </div>
    );
  }

  const pA = question.playerA;
  const pB = question.playerB;

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
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Hedef: 5 Tur Puanı ➔ +1 Genel Masa Puanı</span>
          </div>
        </div>
      </div>

      {/* Duel Scoreboard Bar */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Zap className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Düello Puan Tablosu (İlk 5 Yapan Kazanır)
            </div>
            <div className="flex items-center space-x-3 mt-1">
              {tableState?.players?.map((p) => {
                const pts = roundPoints[p.username] || 0;
                const isLeader = pts >= targetPoints;
                return (
                  <div
                    key={p.username}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                      isLeader
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{p.username}:</span>
                    <span className="text-amber-400 font-mono font-black text-sm">{pts} / {targetPoints}</span>
                    {pts >= targetPoints && <Crown className="w-3.5 h-3.5 text-amber-400 ml-0.5" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 10-Second Timer Bar */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-slate-900 border border-slate-700">
            <Timer className={`w-4 h-4 ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
            <span className={`text-sm font-mono font-black ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      {/* Main Arena */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Question Title */}
        <div className="text-center mb-8">
          <span className="text-[11px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full bg-slate-900 text-amber-400 border border-amber-500/30">
            ⚖️ Kim Daha Çok? (Hızlı Refleks)
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-wide">
            {question.statTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Doğru futbolcunun butonuna ilk basan 1 Tur Puanı kapar!
          </p>
        </div>

        {/* Two Player Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Card A */}
          <div
            onClick={() => !revealed && !matchWinner && handleSelectSide('A')}
            className={`rounded-3xl p-6 border-2 transition-all transform duration-300 relative overflow-hidden flex flex-col items-center text-center cursor-pointer ${
              revealed
                ? question.correctWinner === 'A'
                  ? 'border-emerald-500 bg-emerald-950/40 shadow-2xl shadow-emerald-500/20 scale-[1.02]'
                  : 'border-slate-800/80 bg-slate-950/40 opacity-60'
                : myChoice === 'A'
                ? 'border-amber-500 bg-amber-950/30 shadow-xl shadow-amber-500/10'
                : 'border-slate-800 bg-slate-900/80 hover:border-amber-500/60 hover:shadow-xl hover:scale-[1.01]'
            }`}
          >
            {/* Winner Badge on Reveal */}
            {revealed && question.correctWinner === 'A' && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center space-x-1 shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>DAHA FAZLA</span>
              </div>
            )}

            {/* Player Photo */}
            <div className="relative mb-4 mt-2">
              <div className="w-28 h-28 rounded-full border-4 border-slate-700 overflow-hidden bg-slate-800 shadow-xl">
                <img
                  src={pA.photo}
                  alt={pA.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://cdn-icons-png.flaticon.com/512/861/861512.png';
                  }}
                />
              </div>
            </div>

            {/* Name & Details */}
            <h3 className="text-xl font-black text-white">{pA.name}</h3>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
              <span>{pA.club}</span>
              <span>•</span>
              <span>{pA.nationality}</span>
            </div>

            {/* Revealed Stat Box */}
            {revealed ? (
              <div className="mt-5 p-4 rounded-2xl bg-slate-900/90 border border-slate-700 w-full animate-fadeIn">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  {question.unit}
                </div>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-0.5">
                  {pA.statValue.toLocaleString('tr-TR')} {question.unit}
                </div>
              </div>
            ) : (
              <button
                disabled={revealed || !!myChoice}
                className="mt-6 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <span>{pA.name.toUpperCase()} SEÇ</span>
              </button>
            )}
          </div>

          {/* Card B */}
          <div
            onClick={() => !revealed && !matchWinner && handleSelectSide('B')}
            className={`rounded-3xl p-6 border-2 transition-all transform duration-300 relative overflow-hidden flex flex-col items-center text-center cursor-pointer ${
              revealed
                ? question.correctWinner === 'B'
                  ? 'border-emerald-500 bg-emerald-950/40 shadow-2xl shadow-emerald-500/20 scale-[1.02]'
                  : 'border-slate-800/80 bg-slate-950/40 opacity-60'
                : myChoice === 'B'
                ? 'border-amber-500 bg-amber-950/30 shadow-xl shadow-amber-500/10'
                : 'border-slate-800 bg-slate-900/80 hover:border-amber-500/60 hover:shadow-xl hover:scale-[1.01]'
            }`}
          >
            {/* Winner Badge on Reveal */}
            {revealed && question.correctWinner === 'B' && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center space-x-1 shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>DAHA FAZLA</span>
              </div>
            )}

            {/* Player Photo */}
            <div className="relative mb-4 mt-2">
              <div className="w-28 h-28 rounded-full border-4 border-slate-700 overflow-hidden bg-slate-800 shadow-xl">
                <img
                  src={pB.photo}
                  alt={pB.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://cdn-icons-png.flaticon.com/512/861/861512.png';
                  }}
                />
              </div>
            </div>

            {/* Name & Details */}
            <h3 className="text-xl font-black text-white">{pB.name}</h3>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
              <span>{pB.club}</span>
              <span>•</span>
              <span>{pB.nationality}</span>
            </div>

            {/* Revealed Stat Box */}
            {revealed ? (
              <div className="mt-5 p-4 rounded-2xl bg-slate-900/90 border border-slate-700 w-full animate-fadeIn">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  {question.unit}
                </div>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-0.5">
                  {pB.statValue.toLocaleString('tr-TR')} {question.unit}
                </div>
              </div>
            ) : (
              <button
                disabled={revealed || !!myChoice}
                className="mt-6 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <span>{pB.name.toUpperCase()} SEÇ</span>
              </button>
            )}
          </div>
        </div>

        {/* Round Feedback / Result */}
        {feedback && (
          <div className="mt-6 max-w-md mx-auto">
            <div
              className={`p-3 rounded-2xl border text-xs font-bold text-center flex items-center justify-center space-x-2 ${
                feedback.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {feedback.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{feedback.text}</span>
            </div>
          </div>
        )}

        {/* Revealed Result Banner */}
        {revealed && !matchWinner && (
          <div className="mt-8 text-center space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 max-w-md mx-auto">
              <div className="text-xs text-slate-400">Tur Sonucu:</div>
              <div className="text-base font-extrabold text-white mt-1">
                {roundWinner ? (
                  <span className="text-emerald-400">🎉 {roundWinner} ilk bildi ve +1 Tur Puanı aldı!</span>
                ) : (
                  <span className="text-slate-400">Kimse puan alamadı.</span>
                )}
              </div>
            </div>

            {isHost && (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all inline-flex items-center space-x-2"
              >
                <span>Sonraki Soruya Geç ➔</span>
              </button>
            )}
          </div>
        )}

        {/* Match Champion Banner */}
        {matchWinner && (
          <div className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-500/50 text-center space-y-4 max-w-lg mx-auto shadow-2xl">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-amber-300">
                Düello Tamamlandı!
              </div>
              <h3 className="text-2xl font-black text-white mt-1">
                🏆 ŞAMPİYON: <span className="text-amber-400">{matchWinner}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                5 Tur Puanına ilk ulaşan {matchWinner}, Genel Skor Tablosuna +1 Puan kazandırdı!
              </p>
            </div>

            {isHost && (
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  onClick={handleRestartGame}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all"
                >
                  Yeni Düello Başlat
                </button>
                <button
                  onClick={onBackToLobby}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
                >
                  Lobiye Dön
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
