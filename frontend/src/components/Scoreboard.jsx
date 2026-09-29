import React, { useState } from 'react';
import { Trophy, Edit3, Plus, Minus, Check, X, Crown, Flag, RotateCcw } from 'lucide-react';

export default function Scoreboard({
  players = [],
  currentUser,
  isHost,
  onUpdateScore,
  onAddPoints,
  onEndGame,
  onResetGame
}) {
  const [editingUser, setEditingUser] = useState(null);
  const [customScore, setCustomScore] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  const handleOpenEdit = (player) => {
    if (!isHost) return;
    setEditingUser(player);
    setCustomScore((player.score || 0).toString());
  };

  const handleSaveScore = () => {
    if (!editingUser) return;
    const scoreNum = parseInt(customScore, 10);
    if (!isNaN(scoreNum)) {
      onUpdateScore(editingUser.username, scoreNum);
    }
    setEditingUser(null);
  };

  const handleQuickDelta = (delta) => {
    if (!editingUser) return;
    onAddPoints(editingUser.username, delta);
    setCustomScore(prev => ((parseInt(prev, 10) || 0) + delta).toString());
  };

  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-800 shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-wide text-white uppercase">
              Canlı Puan Tablosu
            </h3>
            <p className="text-[11px] text-slate-400">
              {isHost ? 'Puanı düzeltmek için oyuncuya tıkla' : 'Masa Sıralaması'}
            </p>
          </div>
        </div>

        {/* Host action buttons: End Game */}
        {isHost && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEndConfirm(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all transform active:scale-95"
              title="Oyunu Bitir ve Kazananı İlan Et"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Oyunu Bitir</span>
            </button>
          </div>
        )}
      </div>

      {/* Players List */}
      <div className="space-y-2">
        {sortedPlayers.map((p, index) => {
          const isTop1 = index === 0;
          const isTop2 = index === 1;
          const isTop3 = index === 2;
          const isMe = p.username === currentUser?.username;

          return (
            <div
              key={p.socketId || p.username}
              onClick={() => isHost && handleOpenEdit(p)}
              className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                isHost ? 'cursor-pointer hover:border-amber-500/40' : ''
              } ${
                isMe
                  ? 'bg-slate-800/80 border border-emerald-500/40'
                  : 'bg-slate-900/50 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Rank Badge */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                    isTop1
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                      : isTop2
                      ? 'bg-slate-300 text-slate-950'
                      : isTop3
                      ? 'bg-amber-700 text-amber-100'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {index + 1}
                </div>

                {/* Name */}
                <div className="flex items-center space-x-1.5">
                  <span className={`text-sm font-bold ${isMe ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {p.username}
                  </span>
                  {p.isHost && (
                    <Crown className="w-3.5 h-3.5 text-amber-400" title="Masa Kurucusu" />
                  )}
                  {isMe && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-semibold">
                      Sen
                    </span>
                  )}
                </div>
              </div>

              {/* Score pill & edit icon */}
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono font-extrabold text-amber-400 flex items-center space-x-1">
                  <span>{p.score || 0}</span>
                  <span className="text-[10px] text-slate-500 font-normal">Puan</span>
                </div>
                {isHost && (
                  <div className="text-slate-500 hover:text-amber-400 p-1">
                    <Edit3 className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Host Score Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-amber-500/40 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-white text-base">Puan Düzelt / Ayarla</h4>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              <span className="font-bold text-amber-300">{editingUser.username}</span> kullanıcısının puanında hata varsa düzeltin:
            </p>

            {/* Quick +/- buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                onClick={() => handleQuickDelta(5)}
                className="py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30"
              >
                +5
              </button>
              <button
                onClick={() => handleQuickDelta(10)}
                className="py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30"
              >
                +10
              </button>
              <button
                onClick={() => handleQuickDelta(-5)}
                className="py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30"
              >
                -5
              </button>
              <button
                onClick={() => handleQuickDelta(-10)}
                className="py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30"
              >
                -10
              </button>
            </div>

            {/* Direct exact score input */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Doğrudan Puan Belirle
              </label>
              <input
                type="number"
                value={customScore}
                onChange={(e) => setCustomScore(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white font-mono font-bold text-lg focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSaveScore}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center justify-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Game Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-rose-500/40 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-3">
              <Flag className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-white text-lg mb-1">Oyunu Bitirmek İstiyor Musunuz?</h4>
            <p className="text-xs text-slate-400 mb-6">
              Mevcut oyun sonlandırılacak ve puan tablosuna göre şampiyonluk podyumu açılacaktır.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  setShowEndConfirm(false);
                  onEndGame();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-black shadow-lg shadow-rose-500/30"
              >
                Evet, Oyunu Bitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
