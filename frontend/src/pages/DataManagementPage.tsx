import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';
import { 
  Database, 
  Upload, 
  RefreshCw, 
  Trash2, 
  FileText, 
  FileSpreadsheet, 
  FileCode,
  DownloadCloud,
  History,
  XCircle
} from 'lucide-react';

interface DataManagementPageProps {
  lang: 'tr' | 'en';
}

export const DataManagementPage: React.FC<DataManagementPageProps> = ({ lang }) => {
  const t = lang === 'tr' ? tr : en;

  const [sources, setSources] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [testingSource, setTestingSource] = useState<string | null>(null);
  const [fetchingLiveSource, setFetchingLiveSource] = useState<string | null>(null);
  const [selectedLiveSource, setSelectedLiveSource] = useState<'steam' | 'reddit' | 'x'>('steam');
  const [selectedLiveGame, setSelectedLiveGame] = useState<string>('ALL');
  const [liveLimit, setLiveLimit] = useState<number>(25);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([loadSources(), loadStats(), loadGames(), loadJobs()]);
  };

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
      const data = await api.getDataStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadGames = async () => {
    try {
      const g = await api.getGames();
      setGames(g);
    } catch (e) {
      console.error(e);
    }
  };

  const loadJobs = async () => {
    try {
      const j = await api.getJobs();
      setJobs(j);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestConnection = async (sourceName: string) => {
    try {
      setTestingSource(sourceName);
      const res = await api.testConnection(sourceName);
      setUploadStatus(`[${sourceName.toUpperCase()}] ${res.message}`);
      await loadSources();
    } catch (e: any) {
      setUploadStatus(`Hata: ${e.message}`);
    } finally {
      setTestingSource(null);
    }
  };

  const handleLiveFetch = async (overrideSource?: 'steam' | 'reddit' | 'x') => {
    const src = overrideSource || selectedLiveSource;
    try {
      setFetchingLiveSource(src);
      setIsProcessing(true);
      setUploadStatus(
        lang === 'tr'
          ? `${src.toUpperCase()} kaynağından canlı oyuncu geri bildirimleri çekiliyor...`
          : `Fetching live player feedback from ${src.toUpperCase()}...`
      );
      const res = await api.fetchLiveFeedback({
        source_name: src,
        game_id: selectedLiveGame,
        limit: liveLimit,
      });
      const inserted = res.result?.inserted ?? 0;
      const dups = res.result?.duplicates ?? 0;
      setUploadStatus(
        inserted > 0
          ? (lang === 'tr'
              ? `${res.message} (${inserted} yeni kayıt eklendi, ${dups} kopya elendi).`
              : `${res.message} (${inserted} records inserted, ${dups} duplicates skipped).`)
          : res.message
      );
      await Promise.all([loadStats(), loadJobs()]);
    } catch (err: any) {
      setUploadStatus(`Hata: ${err.message}`);
    } finally {
      setFetchingLiveSource(null);
      setIsProcessing(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await api.cancelJob(jobId);
      await loadJobs();
    } catch (e) {
      console.error(e);
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
      await Promise.all([loadStats(), loadJobs()]);
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
      await api.seedSample();
      setUploadStatus(lang === 'tr' ? 'Ekim 2026 örnek verileri başarıyla yüklendi!' : 'Sample dataset seeded successfully!');
      await Promise.all([loadStats(), loadJobs()]);
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
      await Promise.all([loadStats(), loadJobs()]);
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
            <div className="label">{t.data_mgmt.total_records}</div>
            <div className="value">{stats.total_records}</div>
            <div className="sub">
              Actual: {stats.data_origins?.actual || 0} &bull; Imported: {stats.data_origins?.imported || 0} &bull; Sample: {stats.data_origins?.sample || 0}
            </div>
          </div>
          <div className="metric-card">
            <div className="label">{t.data_mgmt.blocked_duplicates}</div>
            <div className="value" style={{ color: '#fbbf24' }}>{stats.duplicate_records}</div>
            <div className="sub">SHA-256 / Simhash ile tekilleştirildi</div>
          </div>
          <div className="metric-card">
            <div className="label">{t.data_mgmt.filtered_spam}</div>
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
              {t.data_mgmt.api_connections_desc}
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{lang === 'tr' ? 'Kaynak' : 'Source'}</th>
                <th>{lang === 'tr' ? 'Erişim Tipi' : 'Auth Type'}</th>
                <th>{lang === 'tr' ? 'Oran Sınırı (RPM)' : 'Rate Limit (RPM)'}</th>
                <th>{lang === 'tr' ? 'Son Durum' : 'Status'}</th>
                <th style={{ textAlign: 'right' }}>{lang === 'tr' ? 'İşlem' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src) => {
                const meta = src.metadata || {};
                const status = meta.last_test_status;
                const isLiveApi = ['steam', 'reddit', 'x'].includes(src.name);

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
                        <span className="badge badge-positive">{lang === 'tr' ? 'Bağlantı Başarılı' : 'Connected'}</span>
                      ) : status === 'warning' ? (
                        <span className="badge badge-minor" style={{ color: '#f59e0b' }}>{lang === 'tr' ? 'Erişim Kısıtlı (Tier)' : 'Tier Restricted'}</span>
                      ) : status === 'failed' ? (
                        <span className="badge badge-negative">{lang === 'tr' ? 'Bağlantı Hatası' : 'Failed'}</span>
                      ) : (
                        <span className="badge badge-neutral">{lang === 'tr' ? 'Yapılandırılmadı' : 'Not Configured'}</span>
                      )}
                      {meta.last_test_message && (
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.2rem', maxWidth: '320px' }}>
                          {meta.last_test_message}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary"
                          disabled={testingSource === src.name || isProcessing}
                          onClick={() => handleTestConnection(src.name)}
                          type="button"
                        >
                          <RefreshCw size={13} className={testingSource === src.name ? 'animate-spin' : ''} />
                          <span>{t.data_mgmt.test_connection}</span>
                        </button>

                        {isLiveApi && (
                          <button
                            className="btn btn-primary"
                            disabled={isProcessing}
                            onClick={() => handleLiveFetch(src.name as 'steam' | 'reddit' | 'x')}
                            type="button"
                          >
                            <DownloadCloud size={13} className={fetchingLiveSource === src.name ? 'animate-spin' : ''} />
                            <span>{lang === 'tr' ? 'Canlı Çek' : 'Fetch Live'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Targeted Live API Fetch Panel */}
      <div className="panel" style={{ borderLeft: '4px solid #38bdf8' }}>
        <div className="panel-header">
          <div>
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DownloadCloud size={20} color="#38bdf8" />
              <span>{lang === 'tr' ? 'Hedefli Canlı Veri Çekme (Steam / Reddit / X)' : 'Targeted Live API Ingestion (Steam / Reddit / X)'}</span>
            </div>
            <div className="panel-desc">
              {lang === 'tr'
                ? 'Belirli bir oyun veya tüm Top 10 listesi için resmi API üzerinden gerçek zamanlı oyuncu incelemelerini çekip NLP motoruyla sınıflandırın.'
                : 'Fetch real-time player reviews via official APIs for a specific game or top games and classify them with the NLP engine.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
              {lang === 'tr' ? 'Veri Kaynağı' : 'Platform Source'}
            </label>
            <select
              className="input-text"
              value={selectedLiveSource}
              onChange={(e) => setSelectedLiveSource(e.target.value as 'steam' | 'reddit' | 'x')}
            >
              <option value="steam">Steam Community Reviews (Genel Erişim)</option>
              <option value="reddit">Reddit Gaming Subreddits (OAuth2)</option>
              <option value="x">X / Twitter API v2 (Bearer Token)</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
              {lang === 'tr' ? 'Hedef Oyun' : 'Target Game'}
            </label>
            <select
              className="input-text"
              style={{ width: '100%' }}
              value={selectedLiveGame}
              onChange={(e) => setSelectedLiveGame(e.target.value)}
            >
              <option value="ALL">{lang === 'tr' ? 'Tüm Öncelikli Oyunlar (İlk 5)' : 'All Top Priority Games (Top 5)'}</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} {g.steam_app_id ? `(AppID: ${g.steam_app_id})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
              {lang === 'tr' ? 'Maks. Kayıt' : 'Max Records'}
            </label>
            <select
              className="input-text"
              value={liveLimit}
              onChange={(e) => setLiveLimit(Number(e.target.value))}
            >
              <option value={15}>15 Yorum</option>
              <option value={25}>25 Yorum</option>
              <option value={50}>50 Yorum</option>
              <option value={100}>100 Yorum</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            disabled={isProcessing}
            onClick={() => handleLiveFetch()}
          >
            <DownloadCloud size={15} className={fetchingLiveSource ? 'animate-spin' : ''} />
            <span>
              {fetchingLiveSource
                ? (lang === 'tr' ? 'Çekiliyor...' : 'Fetching...')
                : (lang === 'tr' ? 'Canlı Yorumları Çek & Analiz Et' : 'Fetch & Analyze Live Reviews')}
            </span>
          </button>
        </div>
      </div>

      {/* 3. File Ingestion and Sample Dataset (Responsive .grid-2col) */}
      <div className="grid-2col">
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">{t.data_mgmt.import_file}</div>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginBottom: '1.2rem' }}>
            {t.data_mgmt.import_file_desc}
          </p>

          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              <Upload size={15} />
              <span>{t.data_mgmt.upload_csv}</span>
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
              <span>{t.data_mgmt.upload_json}</span>
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
            {t.data_mgmt.load_sample_desc}
          </p>

          <button
            className="btn btn-secondary"
            disabled={isProcessing}
            onClick={handleSeedSample}
            type="button"
          >
            <RefreshCw size={15} />
            <span>{t.data_mgmt.load_sample_data}</span>
          </button>
        </div>
      </div>

      {/* 4. Collection Jobs History */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={19} color="#38bdf8" />
              <span>{lang === 'tr' ? 'Veri Toplama ve İşlem Geçmişi (Collection Jobs)' : 'Ingestion & Collection Job History'}</span>
            </div>
            <div className="panel-desc">
              {lang === 'tr'
                ? 'Arka planda çalışan veya tamamlanan dosya aktarım ve canlı API görevleri.'
                : 'Recent file import, sample seeding, and live API collection jobs.'}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={loadJobs} type="button">
            <RefreshCw size={14} />
            <span>{lang === 'tr' ? 'Yenile' : 'Refresh'}</span>
          </button>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>{lang === 'tr' ? 'Kaynak' : 'Source'}</th>
                <th>{lang === 'tr' ? 'Durum' : 'Status'}</th>
                <th>{lang === 'tr' ? 'İlerleme' : 'Progress'}</th>
                <th>{lang === 'tr' ? 'Son Adım' : 'Step'}</th>
                <th style={{ textAlign: 'right' }}>{lang === 'tr' ? 'İşlem' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                    {lang === 'tr' ? 'Henüz kayıtlı bir veri işleme görevi yok.' : 'No collection jobs recorded yet.'}
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#94a3b8' }}>
                      {job.id}
                    </td>
                    <td>
                      <span className="badge badge-minor">{job.source_name}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          job.status === 'completed'
                            ? 'badge-positive'
                            : job.status === 'running'
                            ? 'badge-moderate'
                            : job.status === 'cancelled'
                            ? 'badge-negative'
                            : 'badge-neutral'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '90px', background: '#1e293b', height: '7px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${job.progress_pct || 0}%`,
                              background: job.status === 'completed' ? '#10b981' : '#38bdf8',
                              height: '100%'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                          {job.processed_items}/{job.total_items} (%{Math.round(job.progress_pct || 0)})
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {job.current_step || '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {job.status === 'running' ? (
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => handleCancelJob(job.id)}
                        >
                          <XCircle size={12} />
                          <span>{lang === 'tr' ? 'İptal Et' : 'Cancel'}</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>✓</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Export Reports */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">{t.data_mgmt.export_reports}</div>
            <div className="panel-desc">
              {t.data_mgmt.export_reports_desc}
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
            type="button"
          >
            <Trash2 size={16} />
            <span>{t.data_mgmt.clear_data}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
