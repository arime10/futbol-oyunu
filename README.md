# Futbol Çok Oyunculu Masa Oyunu & Sesli Lobi (Griddy, Draft, Rebuild)

Bu platform; gerçek zamanlı futbol bilgi yarışmalarını, takım kurma modlarını, tek masalı özel davet kodlu oda sistemini, WebRTC sesli sohbeti ve masa kurucusu yönetim araçlarını tek bir modern web uygulamasında bir araya getirir.

---

## 🚀 Hızlı Başlangıç

Uygulama hem backend (API + WebSockets + WebRTC Sinyalleşmesi) hem de derlenmiş modern frontend arayüzünü tek bir sunucu üzerinden çalıştırmaktadır:

```bash
# Backend dizininde sunucuyu başlatın:
cd backend
npm start
```

Tarayıcınızda şu adresi açın:
👉 **`http://localhost:4000`**

Geliştirici modunda (Vite Hot-Reload) çalıştırmak isterseniz:
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend (Vite)
cd frontend
npm run dev
```

---

## 👑 Masa Kurucusu & Oyuncu Rolleri

- **Özel Masa Kurucusu Adı:** `yuED10`
  - Giriş ekranında `yuED10` yazıldığında sistem kullanıcıyı otomatik olarak **Masa Kurucusu** olarak tanır.
  - Kurucu; **Masa Kur** butonunu ve **Davet Kodu Belirle** alanını görür. İstediği davet kodunu (örn: `FUT2026`) belirleyerek masayı açar.
  - **Kurucu Yetkileri:**
    1. Canlı puan tablosundaki herhangi bir oyuncunun puanına tıklayarak anında **Puan Düzenleme & Hata Düzeltme** (+5, +10, -5, -10 veya doğrudan sayısal değer) yapabilir.
    2. İstediği zaman **Oyunu Bitir** butonuna basarak mevcut oyunu sonlandırabilir; 1., 2. ve 3. için konfetili şampiyonluk podyumunu açar.
    3. Lobiden dilediği oyun modunu başlatabilir.

- **Diğer Tüm Kullanıcılar:**
  - Farklı bir kullanıcı adı girdiklerinde yalnızca **Davet Kodu Gir** alanını görürler.
  - Kurucunun belirlediği davet kodunu girerek masaya katılırlar.
  - Sistemde her zaman **yalnızca 1 aktif masa** bulunur.

---

## 🎙️ WebRTC Sesli Sohbet

- **P2P Audio Mesh:** Oyuncular masaya katıldığında tarayıcı mikrofonu üzerinden doğrudan sesli iletişim kurulur.
- **Mikrofon Aç/Kapa (Mute/Unmute):** Başlık çubuğundaki mikrofon butonundan tek tıkla ses kapatılıp açılabilir.
- **Konuşma Algılama (VAD):** Biri konuştuğunda ilgili oyuncunun rozeti yeşil dalga efektiyle parlar; kimin konuştuğu anında görülür.

---

## ⚽ Veri Tabanı & Temizlik

- **Kapsam:** Top 5 Lig (Premier League, La Liga, Serie A, Bundesliga, Ligue 1) + Trendyol Süper Lig + Eredivisie + Liga Portugal.
- **2025-2026 Sezonu Transferleri:** Mbappé (Real Madrid), Osimhen (Galatasaray), Olise (Bayern), Yoro (Man United), Dani Olmo (Barcelona), En-Nesyri (Fenerbahçe), Immobile (Beşiktaş) gibi en güncel transfer güncellemeleri işlenmiştir.
- **Normalizasyon:** Arama kolaylığı için tüm aksanlı ve Türkçe karakterler (`ç, ğ, ı, ö, ş, ü, é, è, ñ`) normalize edilmiş, anlık oto-tamamlama (autocomplete) entegre edilmiştir.
- **Veri Yenileme:** İstenildiğinde `node backend/src/scripts/fetch_and_clean.js` komutuyla veri tabanı sıfırdan yeniden çekilip işlenebilir.

---

## 🎮 Mevcut Oyun Modları

1. **Griddy / Footy Tic-Tac-Toe:** 3x3 matriste satır ve sütun kriterlerine uyan futbolcuları bulup yerleştirme (+15 puan).
2. **FUT Squad Draft:** 11 turda mevkine göre 5 kart arasından seçim yapıp kadro kurma ve reyting savaşı.
3. **Kulüp Rebuild Challenge:** Krizdeki takımı bütçeyle transfer pazarından yeniden ayağa kaldırma.
4. **Kariyer Yolu Tahmini:** Sırayla açılan kulüplerden gizemli futbolcuyu buzzer'a basarak ilk tahmin etme oyunu (+25 puan).
