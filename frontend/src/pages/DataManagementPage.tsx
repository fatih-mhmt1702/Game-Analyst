import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';
import { 
  Database, 
  Upload, 
  Download, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  FileSpreadsheet, 
  FileCode 
} from 'lucide-react';

interface DataManagementPageProps {
  lang: 'tr' | 'en';
}

export const DataManagementPage: React.FC<DataManagementPageProps> = ({ lang }) => {
  const t = lang === 'tr' ? tr : en;

  const [sources, setSources] = useState<any[]>([]);
  const [testingSource, setTestingSource] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadSources();
    loadStats();
  }, []);

  const loadSources = async () => {
    try {
      const s = await api.getDataSources();
      setSources(s);
    } catch (e) {
      console.error(e);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/data/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestConnection = async (sourceName: string) => {
    try {
      setTestingSource(sourceName);
      setTestResult(null);
      const res = await api.testConnection(sourceName);
      setTestResult(res);
      await loadSources();
    } catch (e: any) {
      setTestResult({ status: 'failed', message: e.message });
    } finally {
      setTestingSource(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'json') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setUploadStatus(lang === 'tr' ? 'Dosya ayrıştırılıyor ve sınıflandırılıyor...' : 'Parsing and classifying feedback...');
      const res = type === 'csv' ? await api.importCsv(file) : await api.importJson(file);
      setUploadStatus(
        lang === 'tr'
          ? `Başarılı! ${res.result?.inserted || 0} kayıt eklendi (${res.result?.duplicates || 0} kopya elendi).`
          : `Success! ${res.result?.inserted || 0} records inserted (${res.result?.duplicates || 0} duplicates filtered).`
      );
      await loadStats();
    } catch (err: any) {
      setUploadStatus(`Hata: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSeedSample = async () => {
    try {
      setIsProcessing(true);
      setUploadStatus(lang === 'tr' ? 'Örnek Next Fest veri seti yükleniyor...' : 'Seeding Next Fest sample dataset...');
      const res = await api.seedSample();
      setUploadStatus(lang === 'tr' ? 'Ekim 2026 örnek verileri başarıyla yüklendi!' : 'Sample dataset seeded successfully!');
      await loadStats();
    } catch (err: any) {
      setUploadStatus(`Hata: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm(lang === 'tr' ? 'Toplanan ve aktarılan tüm verileri temizlemek istediğinizden emin misiniz?' : 'Are you sure you want to clear all collected feedback data?')) {
      return;
    }

    try {
      await api.clearData();
      setUploadStatus(lang === 'tr' ? 'Veritabanı temizlendi.' : 'All collected data cleared.');
      await loadStats();
    } catch (err: any) {
      setUploadStatus(`Hata: ${err.message}`);
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Database size={28} color="#38bdf8" />
          {t.data_mgmt.title}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginTop: '0.3rem' }}>
          {t.data_mgmt.subtitle}
        </p>
      </div>

      {/* Database Hygiene Statistics */}
      {stats && (
        <div className="grid-cards">
          <div className="metric-card">
            <div className="label">Toplam Kayıt</div>
            <div className="value">{stats.total_records}</div>
            <div className="sub">Normalize Edilmiş Yorum</div>
          </div>
          <div className="metric-card">
            <div className="label">Engellenen Kopyalar</div>
            <div className="value" style={{ color: '#fbbf24' }}>{stats.duplicate_records}</div>
            <div className="sub">SHA-256 / Simhash ile tekilleştirildi</div>
          </div>
          <div className="metric-card">
            <div className="label">Filtrelenen Spam / Bot</div>
            <div className="value" style={{ color: '#f87171' }}>{stats.spam_or_irrelevant}</div>
            <div className="sub">Tanıtım linkleri ve boş yorumlar</div>
          </div>
        </div>
      )}

      {/* Upload & Seed Notification */}
      {uploadStatus && (
        <div className="panel" style={{ background: '#0f172a', borderLeft: '4px solid #38bdf8', padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{uploadStatus}</div>
        </div>
      )}

      {/* 1. API Connections & Test Connection */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">{t.data_mgmt.api_connections}</div>
            <div className="panel-desc">
              Resmi ve izinli API uç noktaları. Asla yetkisiz kazıma (scraping) yapılmaz.
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kaynak</th>
                <th>Erişim Tipi</th>
                <th>Oran Sınırı (RPM)</th>
                <th>Son Durum</th>
                <th style={{ textAlign: 'right' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src) => {
                const meta = src.metadata || {};
                const isConfigured = meta.is_configured === 1;
                const status = meta.last_test_status;

                return (
                  <tr key={src.id}>
                    <td>
                      <strong>{src.display_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{src.name}</div>
                    </td>
                    <td>
                      <span className="badge badge-minor" style={{ textTransform: 'uppercase' }}>
                        {src.auth_type}
                      </span>
                    </td>
                    <td>{src.rate_limit_rpm} istek/dk</td>
                    <td>
                      {status === 'success' ? (
                        <span className="badge badge-positive">Bağlantı Başarılı</span>
                      ) : status === 'warning' ? (
                        <span className="badge badge-minor" style={{ color: '#f59e0b' }}>Erişim Kısıtlı (Tier)</span>
                      ) : status === 'failed' ? (
                        <span className="badge badge-negative">Bağlantı Hatası</span>
                      ) : (
                        <span className="badge badge-neutral">Yapılandırılmadı</span>
                      )}
                      {meta.last_test_message && (
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.2rem', maxWidth: '300px' }}>
                          {meta.last_test_message}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        disabled={testingSource === src.name}
                        onClick={() => handleTestConnection(src.name)}
                      >
                        <RefreshCw size={13} className={testingSource === src.name ? 'animate-spin' : ''} />
                        <span>{t.data_mgmt.test_connection}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. File Ingestion and Sample Dataset */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.8rem' }}>
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">{t.data_mgmt.import_file}</div>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginBottom: '1.2rem' }}>
            Topladığınız CSV veya JSON geri bildirim dosyalarını doğrudan yükleyin. Şema alanları (oyun adı, yorum metni, tarih, puan) otomatik eşlenir.
          </p>

          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              <Upload size={15} />
              <span>CSV Yükle</span>
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                disabled={isProcessing}
                onChange={(e) => handleFileUpload(e, 'csv')}
              />
            </label>

            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={15} />
              <span>JSON Yükle</span>
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                disabled={isProcessing}
                onChange={(e) => handleFileUpload(e, 'json')}
              />
            </label>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">Ekim 2026 Sentetik Örnek Veri Seti</div>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginBottom: '1.2rem' }}>
            Steam Next Fest: 19–26 Ekim 2026 etkinliği için hazırlanmış, Top 10 oyun ve genel geribildirimleri içeren doğrulanabilir örnek veri setini yükleyin.
          </p>

          <button
            className="btn btn-secondary"
            disabled={isProcessing}
            onClick={handleSeedSample}
          >
            <RefreshCw size={15} />
            <span>{t.data_mgmt.load_sample_data}</span>
          </button>
        </div>
      </div>

      {/* 3. Export Reports */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">{t.data_mgmt.export_reports}</div>
            <div className="panel-desc">
              Tüm analiz bulgularını, metodolojiyi, kısıtlamaları ve önerileri dışa aktarın.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a
            href={api.getExportHtmlUrl()}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            <FileText size={16} />
            <span>{t.data_mgmt.export_html}</span>
          </a>

          <a
            href={api.getExportCsvUrl()}
            className="btn btn-secondary"
            download
          >
            <FileSpreadsheet size={16} />
            <span>{t.data_mgmt.export_csv}</span>
          </a>

          <a
            href={api.getExportJsonUrl()}
            className="btn btn-secondary"
            download
          >
            <FileCode size={16} />
            <span>{t.data_mgmt.export_json}</span>
          </a>

          <button
            className="btn btn-danger"
            onClick={handleClearData}
            style={{ marginLeft: 'auto' }}
          >
            <Trash2 size={16} />
            <span>{t.data_mgmt.clear_data}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
