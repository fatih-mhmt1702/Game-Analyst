# NextFest Insight — Steam Next Fest Feedback Intelligence Desktop App

[![Platform](https://img.shields.io/badge/Platform-Windows%20Desktop%20(Electron)-blue?logo=windows)](https://electronjs.org)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61dafb?logo=react)](https://react.dev)
[![Backend](https://img.shields.io/badge/Backend-Python%203.13%2B%20FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Database](https://img.shields.io/badge/Database-SQLite%20(Normalized)-003b57?logo=sqlite)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**NextFest Insight**, Steam Next Fest etkinliklerinde (özellikle **19–26 Ekim 2026** ve gelecekteki Next Fest sürümlerinde) sergilenen oyun demolarına ilişkin oyuncu geri bildirimlerini, şikayetlerini, övgülerini ve performans problemlerini toplayıp analiz eden profesyonel bir Windows masaüstü zeka platformudur.

Amacı, bağımsız (indie) bir oyun geliştirici ekibinin gelecekteki Steam Next Fest için **ne inşa etmesi gerektiğini, nelerden kaçınması gerektiğini ve nasıl daha güçlü bir oynanabilir demo sunacağını** somut kanıtlarla belirlemektir.

---

## 1. MİMARİ VE TEKNOLOJİ YIĞINI

NextFest Insight, modern ve modüler bir masaüstü mimarisine sahiptir:

```
[ Electron Desktop Shell (Windows) ]
        │
        ├── [ React + TypeScript UI Dashboard ] (Recharts, Koyu Tema, Çift Dil TR/EN)
        │         ▲
        │         │ REST / JSON (Local Port 8000)
        │         ▼
        └── [ Python 3.13+ FastAPI Local Service ]
                  ├── Veri Toplama Hattı (Reddit OAuth2, X API v2, Steam Community)
                  ├── Dosya İçe Aktarım Motoru (CSV & JSON Şema Doğrulama)
                  ├── Tekilleştirme & Spam Filtresi (SHA-256 + 64-bit Simhash)
                  ├── Kural Tabanlı & Hibrit NLP Motoru (26 Konu, 5 Duygu, Ciddiyet)
                  ├── Analitik & Öneri Motoru (İndie Karar Destek Sistemi)
                  └── SQLite Veritabanı (Normalize Tablolar & İndeksler)
```

- **Masaüstü İskeleti:** Electron (Windows yerel süreç yöneticisi, Python backend servisini otomatik başlatır ve kapatır).
- **Kullanıcı Arayüzü:** React 19 + TypeScript + Vanilla CSS Design System (Tailwind kısıtlamalarından bağımsız, donanım hızlandırmalı zengin koyu tema).
- **Grafikler:** Recharts (Etkileşimli yığılmış çubuk, çizgi, pasta ve duygu-konu ısı haritası matrisi).
- **Yerel Servis:** Python 3.13+, FastAPI, Uvicorn, Pandas.
- **Veritabanı:** Normalize SQLite (`events`, `games`, `data_sources`, `posts_comments`, `sentiment_classifications`, `topic_classifications`, `classification_evidence`, `collection_jobs`, `api_status_metadata`).
- **Çoklu Dil Desteği:** Türkçe ve İngilizce tam arayüz geçişi.

---

## 2. YEDİ TEMEL ARAŞTIRMA SAYFASI

1. **Overview (Genel Bakış):** Analiz edilen oyun sayısı, benzersiz yorum hacmi, kaynak ve duygu dağılımı grafikleri, en çok övülen özellikler, en sık şikayetler, veri tazeliği ve düşük örneklem uyarıları.
2. **Top 10 Games (İlk 10 Oyun):** Zirve eşzamanlı demo oyuncusuna (Peak CCU) göre sıralı doğrulanabilir tablo. SteamDB / Resmi Steam takipçi rozetleri, duygu dağılım çubukları ve "Detayları İncele" bağlantısı.
3. **Game Detail (Oyun Detayı):** Seçilen oyunun 360° derin analizi, Reddit vs X karşılaştırması, zaman serisi, kritik/majör çökme ve hata tablosu, filtrelenebilir doğrulanmış yorumlar ve orijinal kaynak permalinkleri.
4. **Industry-Wide Feedback (Sektör Geneli Geri Bildirim):** Tüm etkinlik geneli makro örüntüler:
   - Sık karşılaşılan demo kullanılabilirlik problemleri (UI, HUD, font boyutu, tuş atama).
   - Performans ve optimizasyon (stuttering, shader derlemesi, Steam Deck FPS düşüşleri).
   - Kontroller, dövüş ve öğretici sorunları (input lag, mermi süngeri düşmanlar, bilgi duvarları).
   - Demoyu "yarım kalmış" hissettiren nedenler (eksik animasyonlar, ses miksajı, hantal tempo).
   - Oyuncuyu oyunda tutan ve tavsiye ettiren faktörler (özgün kanca, sanat kimliği, tekrar oynanabilirlik).
   - Pazarlama (fragman) ile gerçek oynanış arasındaki çelişkiler.
   - Jenerik oyun tasarımına dair oyuncu eleştirileri.
5. **Charts & Comparisons (Grafikler & Kıyaslama):** 6+ interaktif grafik: Oyun bazında duygu dağılımı, platform karşılaştırması, zamansal hacim akışı, ciddiyet dökümü ve Konu x Duygu Isı Haritası (Heatmap).
6. **Demo Development Recommendations (Öneriler):** Kendi indie demomuz için önceliklendirilmiş aksiyon planı:
   - *Must fix before release* (Yayın öncesi çözülmesi zorunlu olanlar)
   - *High priority* (Yüksek öncelikli)
   - *Important improvement* (Önemli iyileştirme)
   - *Optional polish* (İsteğe bağlı cila)
   - *Features worth considering* (Değerlendirilebilecek özellikler)
   - *Design patterns to avoid* (Kaçınılması gereken tasarım kalıpları)
   - *Her öneri için:* Destekleyen oyunlar, ilgili yorum adedi, kanıt alıntıları, tahmini efor ([Tahmini] etiketiyle) ve indie transfer edilebilirlik analizi.
7. **Data Management (Veri Yönetimi):** Reddit, X ve Steam API bağlantı durumu ve canlı "Test Connection" butonu; CSV ve JSON dosya içe aktarma sihirbazı; Ekim 2026 örnek veri setini yükleme; CSV/JSON/HTML rapor dışa aktarımı ve veritabanı temizleme.

---

## 3. KURULUM VE BAŞLATMA (WINDOWS)

### Gereksinimler
- **Windows 10 / 11 (64-bit)**
- **Node.js:** v18+ (v20+ veya v26 önerilir)
- **Python:** 3.12 veya 3.13+ (Sistemde Python Launcher `py` ile)

### Hızlı Kurulum

1. Depoyu klonlayın ve kök dizine geçin:
   ```powershell
   cd "c:\Users\Fatih Albayrak\Desktop\algorithm"
   ```

2. Ortam değişkenlerini hazırlayın:
   ```powershell
   copy .env.example .env
   ```

3. Gerekli Python kütüphanelerini kurun:
   ```powershell
   py -3.13 -m pip install fastapi uvicorn requests python-dotenv pytest python-multipart httpx pandas
   ```

4. Node bağımlılıklarını kurun ve frontend'i derleyin:
   ```powershell
   cmd.exe /c "npm install"
   cmd.exe /c "cd frontend && npm install && npm run build"
   ```

---

## 4. UYGULAMAYI ÇALIŞTIRMA

Uygulamayı masaüstü olarak başlatmanın **iki pratik yolu** vardır:

### A. Masaüstü Modu (Tek Komutla Electron + Backend)
Kök dizinde şu komutu çalıştırın:
```powershell
npm run start
```
Bu komut arka planda FastAPI backend servisini ayağa kaldırır (`http://127.0.0.1:8000`), portun hazır olmasını bekler ve Electron masaüstü penceresini açar.

### B. Bağımsız Servis ve Web Tarayıcısı Modu
İsterseniz backend ve arayüzü doğrudan tarayıcınızda veya ayrı terminallerde çalıştırabilirsiniz:
- **Terminal 1 (Backend Servisi):**
  ```powershell
  py -3.13 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
  ```
- **Terminal 2 (Frontend Arayüzü):**
  ```powershell
  cd frontend
  npm run dev
  ```
  Tarayıcınızda `http://localhost:5173` adresine giderek masaüstü deneyimini tarayıcıda kullanabilirsiniz.

---

## 5. TESTLERİ ÇALIŞTIRMA

Uygulama; veritabanı, içe aktarma, tekilleştirme, NLP duygu & konu sınıflandırması, analitik hesaplamaları ve API uç noktalarını kapsayan 15 otomatik teste sahiptir.

Tüm testleri çalıştırmak için:
```powershell
py -3.13 -m pytest backend/tests -v
```

Test Kapsamı:
- `test_database.py`: Normalize SQLite tablolarının oluşturulması, foreign key kısıtları ve Top 10 tohum verisi.
- `test_importer.py`: Otomatik sütun eşleme (field mapping), CSV ve JSON doğrulama, geçersiz girdi yönetimi.
- `test_deduplicator.py`: SHA-256 tam eşleşme ve 64-bit Simhash yakın benzerlik (near-duplicate) tespiti.
- `test_classifier.py`: 26 konu tespiti, pozitif/negatif/karmaşık duygu analizi, ciddiyet (Critical/Major/Moderate/Minor) ve eyleme geçilebilirlik tespiti.
- `test_analytics.py`: Metrik hesaplamaları, açık paydalar, düşük örneklem uyarısı (<30 yorum) ve öneri motoru çıktısı.
- `test_api.py`: FastAPI `/health`, `/api/overview`, `/api/games`, `/api/recommendations`, `/api/export/csv`, `/api/export/html` uç noktaları.

---

## 6. VERİ KAYNAKLARI VE API YAPILANDIRMASI

Uygulama `.env` dosyası üzerinden yapılandırılır. Asla API anahtarlarınızı versiyon kontrol sistemine göndermeyin.

### Reddit API Yapılandırması
1. [Reddit App Preferences](https://www.reddit.com/prefs/apps) sayfasına gidin.
2. "Create another app" butonuna tıklayın, **script** türünü seçin.
3. `.env` dosyasını düzenleyin:
   ```ini
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USER_AGENT=NextFestInsight:v1.0.0 (by /u/YourUsername)
   ```

### X (Twitter) API v2 Yapılandırması
1. [X Developer Portal](https://developer.x.com) üzerinden bir proje ve uygulama oluşturun.
2. `.env` dosyasını düzenleyin:
   ```ini
   X_BEARER_TOKEN=your_bearer_token
   ```
   *Not:* X API Free katmanı geçmiş arama (`tweets/search/recent`) uç noktasına izin vermez; bu katmanda uygulama arayüzde şeffaf bir biçimde "Tier Kısıtlaması" uyarısı verir.

### Steam Community & Web API
- İsteğe bağlı olarak genel Steam Web API anahtarınızı ekleyebilirsiniz:
  ```ini
  STEAM_WEB_API_KEY=your_steam_key
  ```

### API Anahtarı Olmadan Kullanım (Dosya İçe Aktarım Fallback)
API anahtarlarınız yoksa bile uygulama tam fonksiyonel olarak çalışır:
- **Veri Yönetimi** sekmesinden kendi CSV veya JSON geri bildirim dosyanızı yükleyebilirsiniz.
- Veya tek bir tıklamayla **Ekim 2026 Sentetik Örnek Veri Setini** yükleyerek tüm özellikleri anında deneyimleyebilirsiniz.

---

## 7. CSV / JSON İÇE AKTARIM ŞEMASI

Uygulama, farklı kaynaklardan gelen dosyaları otomatik olarak tanır:

### Desteklenen CSV Sütunları
| Hedef Alan | Desteklenen Sütun İsimleri |
| :--- | :--- |
| **content** | `content`, `text`, `comment`, `review`, `body`, `yorum`, `metin` (Zorunlu) |
| **game_title** | `game_title`, `game`, `title`, `oyun`, `game_name` |
| **source_name**| `source_name`, `source`, `platform`, `kaynak` |
| **published_at**| `published_at`, `date`, `created_at`, `timestamp`, `tarih` |
| **author** | `author`, `user`, `username`, `kullanici` |
| **permalink** | `permalink`, `url`, `link` |
| **score** | `score`, `upvotes`, `likes`, `puan` |

Örnek JSON formatı için `backend/fixtures/oct2026_synthetic_sample.json` ve şema dosyası için `backend/fixtures/sample_schema.json` incelenebilir.

---

## 8. İSTATİSTİKSEL VE ETİK İLKELER

1. **Örneklem Temsiliyeti:** Reddit ve X kullanıcıları kendi kendini seçen kitlelerdir; aşırı beğenen veya öfkeli kullanıcılar orantısız temsil edilebilir.
2. **Düşük Örneklem Uyarısı (<30):** 30 adetten az bağımsız yoruma sahip oyunlar için yüzdelerin tüm oyuncu kitlesine genellenemeyeceği arayüzde sarı uyarı kartıyla gösterilir.
3. **Açık Payda (Denominator):** Tüm istatistikler paydasıyla birlikte verilir (örn: `%48 (22 / 46 Yorum)`).
4. **Veri Kökeni Şeffaflığı:** Veriler açıkça `actual` (resmi API), `imported` (kullanıcı yüklemesi) veya `sample` (sentetik örnek) olarak etiketlenir. Asla sahte oyuncu alıntısı üretilmez.
5. **Popülerliği Kopyalamama İlkesi:** Öneri motoru, büyük bütçeli popüler oyunları körü körüne taklit etmek yerine bağımsız stüdyolar için aktarılabilir oynanış ve cila derslerini ayırt eder.

---

## 9. SORUN GİDERME (TROUBLESHOOTING)

- **Port 8000 Zaten Kullanılıyor:** `.env` dosyasında `PORT=8080` yaparak portu değiştirebilirsiniz.
- **Python Bulunamadı Hatası:** Windows Ayarlarından *Uygulama Yürütme Diğer Adları (App Execution Aliases)* kısmında `python.exe` kapalıysa açın veya `py` komutunun çalıştığından emin olun.
- **PowerShell Script Engelleme Hatası:** `cmd.exe /c "npm run ..."` formatını kullanın veya `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` komutunu uygulayın.
