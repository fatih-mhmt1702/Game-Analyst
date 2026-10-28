import React from 'react';
import { X, CheckCircle2, Shield, UploadCloud, Terminal } from 'lucide-react';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'tr' | 'en';
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {lang === 'tr' ? 'NextFest Insight Kurulum ve Metodoloji Rehberi' : 'NextFest Insight Setup & Methodology Guide'}
          </h2>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <h4 style={{ color: '#38bdf8', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={16} /> {lang === 'tr' ? '1. Veri Kaynakları & Yetkilendirme' : '1. Authorized Data Sources'}
            </h4>
            <p>
              {lang === 'tr'
                ? 'Uygulama yalnızca kamuya açık ve yasal olarak izin verilen resmi API arayüzlerini kullanır (Reddit OAuth2, X API v2, Steam Web API). Asla web scraping veya kimlik hilesi yapılmaz. API anahtarlarınızı kök dizindeki .env dosyasına girebilirsiniz.'
                : 'The application strictly utilizes authorized official APIs (Reddit OAuth2, X API v2, Steam Web API). No unauthorized scraping is performed. Configure your keys safely in the local .env file.'}
            </p>
          </div>

          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <h4 style={{ color: '#10b981', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UploadCloud size={16} /> {lang === 'tr' ? '2. Dosya İçe Aktarma (CSV / JSON)' : '2. File Import (CSV / JSON)'}
            </h4>
            <p>
              {lang === 'tr'
                ? 'API anahtarlarınız yoksa veya harici bir veri kümesini analiz etmek istiyorsanız, Veri Yönetimi sekmesinden CSV veya JSON dosyanızı yükleyebilirsiniz. Alan eşleştirmesi (oyun adı, yorum metni, tarih, kaynak) otomatik yapılır.'
                : 'If you lack API credentials or wish to analyze third-party feedback datasets, use the Data Management tab to upload CSV/JSON files. Field mapping is performed automatically.'}
            </p>
          </div>

          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <h4 style={{ color: '#f59e0b', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} /> {lang === 'tr' ? '3. Analiz Prensipleri & Düşük Örneklem' : '3. Statistical Integrity & Denominators'}
            </h4>
            <p>
              {lang === 'tr'
                ? 'Reddit ve X kullanıcıları kendi kendini seçen kitlelerdir. Öfke ve aşırı övgü orantısız temsil edilebilir. 30 adetten az yoruma sahip oyunlarda Düşük Örneklem Uyarısı verilir. Tüm oranlarda payda açıkça belirtilir.'
                : 'Reddit and X users are self-selected cohorts. High-engagement sentiment may be overrepresented. Games with fewer than 30 comments trigger Low Sample Warnings. All ratios explicitly state their denominator.'}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button className="btn btn-primary" onClick={onClose}>
              {lang === 'tr' ? 'Anladım, Analize Başla' : 'Got It, Let\'s Analyze'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
