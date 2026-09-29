import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Award, Crown, RotateCcw, ArrowRight } from 'lucide-react';

export default function PodiumModal({ podium, isHost, onResetToLobby }) {
  if (!podium) return null;

  useEffect(() => {
    // Launch celebratory confetti burst
    const end = Date.now() + 3 * 1000;
    const colors = ['#f59e0b', '#10b981', '#38bdf8', '#ef4444'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const winner = podium.winner;
  const second = podium.second;
  const third = podium.third;
  const allRankings = podium.allRankings || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-amber-500/50 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Title */}
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 mb-3 shadow-lg shadow-amber-500/20">
            <Trophy className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">
            Oyun Sona Erdi!
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Masa kurucusu tarafından oyun bitirildi. İşte final sıralaması:
          </p>
        </div>

        {/* 3D-Style Podium Step Layout */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end mb-8 relative z-10">
          {/* 2nd Place */}
          <div className="text-center">
            {second ? (
              <>
                <div className="mb-2">
                  <span className="text-xs font-bold text-slate-300 truncate block max-w-full">
                    {second.username}
                  </span>
                  <span className="text-[11px] font-mono text-amber-400 font-bold">
                    {second.score} Puan
                  </span>
                </div>
                <div className="h-28 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-700/80 border-t-2 border-slate-400 p-2 flex flex-col items-center justify-center shadow-lg">
                  <Medal className="w-7 h-7 text-slate-300 mb-1" />
                  <span className="text-xl font-black text-slate-200">2.</span>
                </div>
              </>
            ) : (
              <div className="h-20 bg-slate-900/50 rounded-t-2xl border-t border-slate-800" />
            )}
          </div>

          {/* 1st Place (Winner) */}
          <div className="text-center">
            {winner && (
              <>
                <div className="mb-2">
                  <div className="flex items-center justify-center space-x-1 text-amber-400 font-black text-sm">
                    <Crown className="w-4 h-4 fill-amber-400" />
                    <span>ŞAMPİYON</span>
                  </div>
                  <span className="text-base font-extrabold text-white truncate block max-w-full">
                    {winner.username}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {winner.score} Puan
                  </span>
                </div>
                <div className="h-36 rounded-t-2xl bg-gradient-to-t from-amber-600/40 via-amber-500/30 to-amber-400/50 border-t-4 border-amber-400 p-2 flex flex-col items-center justify-center shadow-2xl fut-glow-gold">
                  <Trophy className="w-10 h-10 text-amber-300 mb-1" />
                  <span className="text-3xl font-black text-amber-200">1.</span>
                </div>
              </>
            )}
          </div>

          {/* 3rd Place */}
          <div className="text-center">
            {third ? (
              <>
                <div className="mb-2">
                  <span className="text-xs font-bold text-slate-300 truncate block max-w-full">
                    {third.username}
                  </span>
                  <span className="text-[11px] font-mono text-amber-400 font-bold">
                    {third.score} Puan
                  </span>
                </div>
                <div className="h-24 rounded-t-2xl bg-gradient-to-t from-amber-950 to-amber-900/60 border-t-2 border-amber-700 p-2 flex flex-col items-center justify-center shadow-lg">
                  <Award className="w-6 h-6 text-amber-600 mb-1" />
                  <span className="text-lg font-black text-amber-500">3.</span>
                </div>
              </>
            ) : (
              <div className="h-16 bg-slate-900/50 rounded-t-2xl border-t border-slate-800" />
            )}
          </div>
        </div>

        {/* Full Rankings list */}
        <div className="max-h-36 overflow-y-auto space-y-1.5 mb-6 pr-1">
          {allRankings.map((r, i) => (
            <div
              key={r.username}
              className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs"
            >
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-mono w-4">{i + 1}.</span>
                <span className="font-semibold text-slate-200">{r.username}</span>
              </div>
              <span className="font-mono font-bold text-amber-400">{r.score} Puan</span>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="text-center relative z-10">
          {isHost ? (
            <button
              onClick={onResetToLobby}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm flex items-center justify-center space-x-2 mx-auto shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Lobiye Dön & Yeni Tur Başlat</span>
            </button>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Masa kurucusunun ({podium.winner ? 'yuED10' : 'Kurucu'}) yeni turu başlatması bekleniyor...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
