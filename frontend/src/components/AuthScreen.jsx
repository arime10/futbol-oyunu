import React, { useState } from 'react';
import { Crown, User, ShieldCheck, ArrowRight, Sparkles, KeyRound } from 'lucide-react';

export default function AuthScreen({ onJoinTable, onCreateTable, tableState, hostUsername = 'yuED10' }) {
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState(tableState?.exists ? tableState.inviteCode : 'FUT2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isHost = (username || '').trim().toLowerCase() === hostUsername.toLowerCase();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Lütfen bir kullanıcı adı girin.');
      return;
    }

    setLoading(true);

    if (isHost) {
      // Masa kurucusu akışı
      onCreateTable(cleanUsername, inviteCode, (res) => {
        setLoading(false);
        if (!res.success) {
          setError(res.error || 'Masa kurulurken bir hata oluştu.');
        }
      });
    } else {
      // Normal oyuncu akışı
      if (!inviteCode.trim()) {
        setLoading(false);
        setError('Lütfen kurucunun belirlediği davet kodunu girin.');
        return;
      }
      onJoinTable(cleanUsername, inviteCode.trim(), (res) => {
        setLoading(false);
        if (!res.success) {
          setError(res.error || 'Masaya katılamadı. Kodu veya masanın durumunu kontrol edin.');
        }
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-radial-gradient">
      {/* Background aesthetic lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-pitch-dark shadow-lg shadow-emerald-500/30 mb-4 animate-bounce">
            <span className="text-3xl">⚽</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            FOOTBALL TRIVIA & LOBBY
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Griddy • Draft • Rebuild • WebRTC Sesli Sohbet
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-800">
          {/* Active Table Status Badge */}
          <div className="mb-6 flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${tableState?.exists ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium">
                {tableState?.exists ? 'Aktif Masa Mevcut' : 'Henüz Masa Açılmadı'}
              </span>
            </div>
            {tableState?.exists && (
              <span className="text-emerald-400 font-mono font-bold">
                {tableState.players?.length || 0} Oyuncu Masada
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {isHost ? <Crown className="w-5 h-5 text-amber-400" /> : <User className="w-5 h-5" />}
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Kullanıcı adınızı girin..."
                  className={`w-full pl-11 pr-4 py-3 bg-slate-900/90 rounded-2xl border text-sm focus:outline-none transition-all ${
                    isHost
                      ? 'border-amber-400/60 ring-2 ring-amber-400/20 text-amber-200'
                      : 'border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white'
                  }`}
                  autoFocus
                />
              </div>
            </div>

            {/* Host Detection Alert / Notice */}
            {isHost ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3">
                <Crown className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-amber-300">Özel Kurucu Tanındı ({hostUsername})</div>
                  <div className="text-amber-200/80 mt-0.5">
                    Masa kurma, davet kodu belirleme, puan düzenleme ve oyunu bitirme yetkisine sahipsiniz.
                  </div>
                </div>
              </div>
            ) : (
              username.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center space-x-2.5 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Masa kurucusunun verdiği davet koduyla tek masaya katılabilirsiniz.</span>
                </div>
              )
            )}

            {/* Invite Code Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                {isHost ? 'Davet Kodu Belirle' : 'Davet Kodu Gir'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder={isHost ? 'Örn: FUT2026' : 'Kurucunun kodunu yazın...'}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/90 rounded-2xl border border-slate-700 text-sm tracking-widest uppercase font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isHost
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {isHost
                      ? (tableState?.exists ? 'Masayı Yönet / Aç' : 'Masa Kur ve Davet Kodu Belirle')
                      : 'Masaya Katıl'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500">
          Sistemde her zaman tek bir aktif masa bulunur.
        </div>
      </div>
    </div>
  );
}
