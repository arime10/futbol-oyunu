import React, { useState, useEffect } from 'react';
import { Copy, Check, Play, Grid, Users, HelpCircle, Sparkles, Crown, Search, Target, Globe, Smartphone, Zap, DollarSign } from 'lucide-react';

export default function Lobby({ tableState, isHost, onStartMode, currentUser }) {
  const [copied, setCopied] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    fetch('/api/network-info')
      .then(r => r.json())
      .then(d => setNetworkInfo(d))
      .catch(() => {});
  }, []);

  const handleCopyCode = () => {
    if (tableState?.inviteCode) {
      navigator.clipboard.writeText(tableState.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const MODES = [
    {
      id: 'griddy',
      title: 'Griddy / Renkli Tic-Tac-Toe',
      badge: '3\'lü Yapan 1 Puan Kazanır',
      description: 'Her oyuncu kendi özel rengiyle oynar. Satır ve sütun kriterlerine uyan futbolcuları bul, 3\'lüyü ilk tamamlayan 1 puanı kapar!',
      icon: Grid,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400'
    },
    {
      id: 'career',
      title: 'Kariyer Yolu Tahmini',
      badge: '15sn Buzzer & Gizli Kulüpler',
      description: 'Kulüpler sırayla açılır (açtığın kulübü sadece sen görürsün!). Tekte bil 3 puan, açtıkça 2 ve 1 puan al. 15 saniye süren var!',
      icon: HelpCircle,
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/40 text-purple-400'
    },
    {
      id: 'detective',
      title: 'Transfer Dedektifi',
      badge: 'Yeni Mod • Max 3 Min 2 Puan',
      description: 'Yıl, bonservis ve kulüpler verilir. Direkt bil 3 puan al! İstersen sadece sana gözüken mevki ve uyruk ipuçlarını aç (-1 puan). 15 saniye buzzer süresi!',
      icon: Search,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-400'
    },
    {
      id: 'statTarget',
      title: 'Stat Hedefi (5 Futbolcu)',
      badge: 'Yeni Mod • 120 Saniye',
      description: 'Hedef sayı verilir (Örn: Serie A 250 Gol). 5 futbolcu seç (aynı oyuncuyu yazmak yasak, ilk yazan kapar!). Sırayla açılır, hedefe en yakın 1 puanı alır!',
      icon: Target,
      color: 'from-sky-500/20 to-blue-500/10 border-sky-500/40 text-sky-400'
    },
    {
      id: 'oneTeamOneCountry',
      title: '1 Takım 1 Ülke',
      badge: 'Hızlı Eşleşme • 1 Puan',
      description: 'Ekrana 1 Takım ve 1 Ülke gelir. İkisini de karşılayan futbolcuyu ilk yazan 1 puanı kapar!',
      icon: Globe,
      color: 'from-teal-500/20 to-emerald-500/10 border-teal-500/40 text-teal-400'
    },
    {
      id: 'twoTeamsOneCountry',
      title: '2 Takım 1 Ülke',
      badge: '3\'lü 2 Puan • 2\'li 1 Puan',
      description: '2 Takım ve 1 Ülke gelir. 3 kriteri de sağlayan futbolcuyu bulan 2 puan alır ve tur biter! 2\'sini sağlayan ilk kişi 1 puan kapar!',
      icon: Sparkles,
      color: 'from-violet-500/20 to-purple-500/10 border-violet-500/40 text-violet-400'
    },
    {
      id: 'cardClash',
      title: '7 Kart Futbolcu Düellosu',
      badge: '3 Altın Kart • +3 Puan Ödül',
      description: '7 futbolcu kartı seç (3 tanesi kurallı Altın Kart!). 7 farklı stat düellosunda (sarı kart, gol, reyting vb.) kartlarını çarpıştır, kazanan genel tabloya 3 puan alır!',
      icon: Crown,
      color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-400'
    },
    {
      id: 'higherLower',
      title: 'Kim Daha Çok? (Higher or Lower)',
      badge: 'Hızlı Refleks • 5 Yapan +1 Puan',
      description: 'Ekrana 2 futbolcu ve bir istatistik karşılaştırması gelir (Gol, asist, kart, maç, kupa). 10 saniyelik sayaçta doğru futbolcuya ilk basan tur puanını kapar, 5 yapan genel tabloya +1 puan ekler!',
      icon: Zap,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-400'
    },
    {
      id: 'rebuildAuction',
      title: 'Kulüp Rebuild & Transfer İhalesi',
      badge: '7 Mevki • Oylama 1.ye +3 2.ye +1 Puan',
      description: 'Bütçenizi yönetin, 7 mevkide (GK, CB, FB, CM, CAM, WING, ST) açık artırmaya katılın! Kadrolar bitince 10 puanınızı rakiplere dağıtarak oylayın, en iyi kadroya +3 puan!',
      icon: DollarSign,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Invite Code & Share */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Masa Davet Kodu
            </div>
            <div className="text-2xl font-mono font-black text-white tracking-widest mt-0.5">
              {tableState?.inviteCode || 'YÜKLENİYOR...'}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={handleCopyCode}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-200 transition-all transform active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Kodu Kopyala</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mode Selection Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              Oyun Modları
            </h2>
            <p className="text-xs text-slate-400">
              {isHost
                ? 'Başlatmak istediğiniz oyun moduna tıklayın:'
                : 'Masa kurucusunun (yuED10) modu seçip başlatması bekleniyor...'}
            </p>
          </div>
          {isHost && (
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center space-x-1">
              <Crown className="w-3.5 h-3.5" />
              <span>Kurucu Seçimi</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                onClick={() => isHost && onStartMode(mode.id)}
                className={`glass-panel rounded-3xl p-5 border transition-all relative overflow-hidden group ${
                  isHost
                    ? 'cursor-pointer hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-500/10 active:scale-[0.99]'
                    : 'opacity-90'
                } ${mode.color}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300">
                    {mode.badge}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white mb-1.5 group-hover:text-emerald-300 transition-colors">
                  {mode.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {mode.description}
                </p>

                {isHost ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartMode(mode.id);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Bu Modu Başlat</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-500 font-medium italic">
                    Hazır bekliyor
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
