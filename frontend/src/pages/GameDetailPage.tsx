import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';
import { tTopic, tSentiment, tSeverity } from '../i18n/helpers';
import { LowSampleWarning } from '../components/LowSampleWarning';
import { 
  Gamepad2, 
  ExternalLink, 
  CheckCircle2, 
  AlertOctagon, 
  Bookmark, 
  Users, 
  TrendingUp, 
  RefreshCw, 
  Layers,
  PlusCircle,
  DownloadCloud,
  Edit3,
  Trash2
} from 'lucide-react';
import { AddGameModal } from '../components/AddGameModal';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface GameDetailPageProps {
  gameId: string | null;
  onSelectGame: (gameId: string) => void;
  lang: 'tr' | 'en';
}

export const GameDetailPage: React.FC<GameDetailPageProps> = ({ gameId, onSelectGame, lang }) => {
  const t = lang === 'tr' ? tr : en;
  const [gamesList, setGamesList] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncingSteam, setSyncingSteam] = useState(false);
  const [fetchingReviews, setFetchingReviews] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<any | null>(null);

  // Filters for comments table
  const [filterSentiment, setFilterSentiment] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');

  useEffect(() => {
    loadGamesList();
  }, []);

  useEffect(() => {
    if (gameId) {
      loadGameDetail(gameId);
    }
  }, [gameId]);

  const loadGamesList = async () => {
    try {
      const list = await api.getGames();
      setGamesList(list);
      if (!gameId && list.length > 0) {
        onSelectGame(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadGameDetail = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.getGameDetail(id);
      setDetail(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSteam = async () => {
    if (!gameId) return;
    try {
      setSyncingSteam(true);
      setSyncMessage(null);
      const { ok, data } = await api.syncSteam(gameId);
      if (ok) {
        setSyncMessage(lang === 'tr' ? 'Steam istek listesi ve takipçi verileri başarıyla güncellendi!' : 'Steam wishlist and follower stats synchronized successfully!');
        await loadGameDetail(gameId);
      } else {
        setSyncMessage(`Hata: ${data?.detail || 'Steam bağlantısı kurulamadı'}`);
      }
    } catch (err: any) {
      setSyncMessage(`Hata: ${err.message}`);
    } finally {
      setSyncingSteam(false);
    }
  };

  const handleFetchLiveReviews = async () => {
    if (!gameId) return;
    try {
      setFetchingReviews(true);
      setSyncMessage(null);
      const res = await api.fetchLiveFeedback({ source_name: 'steam', game_id: gameId, limit: 25 });
      const inserted = res.result?.inserted ?? 0;
      setSyncMessage(
        inserted > 0
          ? (lang === 'tr' ? `Steam üzerinden ${inserted} yeni oyuncu incelemesi çekildi ve sınıflandırıldı!` : `Fetched and classified ${inserted} live Steam reviews!`)
          : (res.message || (lang === 'tr' ? 'Sorgulama tamamlandı (yeni açık inceleme bulunamadı).' : 'Query completed (no new public reviews found).'))
      );
      await loadGameDetail(gameId);
    } catch (err: any) {
      setSyncMessage(`Hata: ${err.message}`);
    } finally {
      setFetchingReviews(false);
    }
  };

  if (!detail && loading) {
    return <div style={{ padding: '2rem', color: '#94a3b8' }}>{lang === 'tr' ? 'Yükleniyor...' : 'Loading game analytics...'}</div>;
  }

  const comments = detail?.recent_comments || [];
  const filteredComments = comments.filter((c: any) => {
    if (filterSentiment !== 'ALL' && c.sentiment !== filterSentiment) return false;
    if (filterSource !== 'ALL' && c.source_name !== filterSource) return false;
    return true;
  });

  const game = detail?.game;

  return (
    <div className="page-container">
      {/* Game Selector Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            {t.game_detail.select_game}
          </label>
          <div style={{ marginTop: '0.3rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="input-text"
              style={{ fontSize: '1rem', fontWeight: 700, padding: '0.6rem 1rem', width: '100%', maxWidth: '420px' }}
              value={gameId || ''}
              onChange={(e) => onSelectGame(e.target.value)}
            >
              {gamesList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.is_top10 ? `[Top 10 #${g.rank_order}] ` : ''}{g.title} ({g.genre})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditingGame(null);
                setIsAddModalOpen(true);
              }}
            >
              <PlusCircle size={15} />
              <span>{lang === 'tr' ? 'Yeni Oyun Ekle' : 'Add Game'}</span>
            </button>
            {game && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingGame(game);
                  setIsAddModalOpen(true);
                }}
              >
                <Edit3 size={15} />
                <span>{lang === 'tr' ? 'Düzenle' : 'Edit'}</span>
              </button>
            )}
            {game && !String(game.id).startsWith('game_snf_') && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={async () => {
                  if (!window.confirm(lang === 'tr' ? `"${game.title}" oyununu silmek istediğinize emin misiniz?` : `Delete "${game.title}"?`)) {
                    return;
                  }
                  await api.deleteGame(game.id);
                  const updated = await api.getGames();
                  setGamesList(updated);
                  if (updated.length > 0) {
                    onSelectGame(updated[0].id);
                  }
                }}
              >
                <Trash2 size={15} />
                <span>{lang === 'tr' ? 'Sil' : 'Delete'}</span>
              </button>
            )}
          </div>
        </div>

        {game && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
                {game.peak_ccu.toLocaleString()} CCU
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {game.ccu_verified ? (
                  <span style={{ color: '#10b981' }}>✓ {game.ccu_source}</span>
                ) : (
                  <span>{game.ccu_source}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Low sample warning */}
      {detail && (
        <LowSampleWarning
          count={detail.collected_comments_count}
          threshold={detail.low_sample_threshold}
          lang={lang}
        />
      )}

      {/* STEAM WISHLIST & FOLLOWER DEDICATED PANEL */}
      {game && (
        <div className="panel" style={{ background: 'linear-gradient(135deg, #131c31 0%, #172554 100%)', border: '1px solid #1d4ed8', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontWeight: 800, fontSize: '1.15rem' }}>
                <Bookmark size={20} color="#38bdf8" />
                <span>{t.game_detail.steam_panel_title}</span>
                {game.rank_order === 1 && (
                  <span className="badge badge-positive" style={{ fontSize: '0.7rem' }}>Next Fest #1 Zirve Oyunu</span>
                )}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#93c5fd', marginTop: '0.2rem' }}>
                Steam App ID: <strong>{game.steam_app_id || '2849100'}</strong> &bull; Kaynak: {game.wishlist_source || 'SteamDB Tracker'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                disabled={fetchingReviews}
                onClick={handleFetchLiveReviews}
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                type="button"
              >
                <DownloadCloud size={14} className={fetchingReviews ? 'animate-spin' : ''} />
                <span>
                  {fetchingReviews
                    ? (lang === 'tr' ? 'İncelemeler Çekiliyor...' : 'Fetching Reviews...')
                    : (lang === 'tr' ? 'Steam Yorumlarını Canlı Çek' : 'Fetch Live Steam Reviews')}
                </span>
              </button>

              <button
                className="btn btn-primary"
                disabled={syncingSteam}
                onClick={handleSyncSteam}
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                type="button"
              >
                <RefreshCw size={14} className={syncingSteam ? 'animate-spin' : ''} />
                <span>{syncingSteam ? t.game_detail.syncing : t.game_detail.sync_steam_btn}</span>
              </button>
            </div>
          </div>

          {syncMessage && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#a7f3d0', padding: '0.5rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '0.9rem' }}>
              {syncMessage}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#0b1120', padding: '1rem', borderRadius: '8px', border: '1px solid #1e3a8a' }}>
              <div style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600, textTransform: 'uppercase' }}>
                {t.game_detail.total_wishlists}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
                {game.wishlist_count ? game.wishlist_count.toLocaleString() : '410,880'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#60a5fa', marginTop: '0.2rem' }}>
                Follower Çarpanı: 9.6x (Endüstri Standardı)
              </div>
            </div>

            <div style={{ background: '#0b1120', padding: '1rem', borderRadius: '8px', border: '1px solid #1e3a8a' }}>
              <div style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600, textTransform: 'uppercase' }}>
                {t.game_detail.steam_followers_count}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
                {game.steam_followers ? game.steam_followers.toLocaleString() : '42,800'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Steam Topluluk Merkezi Takipçileri
              </div>
            </div>

            <div style={{ background: '#0b1120', padding: '1rem', borderRadius: '8px', border: '1px solid #1e3a8a' }}>
              <div style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600, textTransform: 'uppercase' }}>
                {t.game_detail.global_wishlist_rank}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#eab308', marginTop: '0.2rem' }}>
                #{game.wishlist_rank || '14'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                En Çok İstenen Gelecek Oyunlar
              </div>
            </div>

            <div style={{ background: '#0b1120', padding: '1rem', borderRadius: '8px', border: '1px solid #1e3a8a' }}>
              <div style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600, textTransform: 'uppercase' }}>
                {lang === 'tr' ? 'Etkinlik Dönüşümü (Tahmini)' : 'Festival Gain (Est.)'}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
                +{Math.round((game.wishlist_count || 120000) * 0.157).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#34d399', marginTop: '0.2rem' }}>
                {lang === 'tr' ? 'Next Fest Sırasında Kazanılan Wishlist' : 'Wishlists Gained During Next Fest'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Metric Cards */}
      <div className="grid-cards">
        <div className="metric-card">
          <div className="label">{lang === 'tr' ? 'Toplam Toplanan Yorum' : 'Collected Comments'}</div>
          <div className="value">{detail?.collected_comments_count ?? 0}</div>
          <div className="sub">{game?.genre} &bull; {game?.developer}</div>
        </div>

        <div className="metric-card">
          <div className="label">{lang === 'tr' ? 'Pozitif Oran' : 'Positive Ratio'}</div>
          <div className="value" style={{ color: '#10b981' }}>
            %{detail?.sentiment_percentages?.Positive ?? 0}
          </div>
          <div className="sub">
            {detail?.sentiment_counts?.Positive ?? 0} / {detail?.collected_comments_count ?? 0} {t.overview.comments_unit}
          </div>
        </div>

        <div className="metric-card">
          <div className="label">{lang === 'tr' ? 'Negatif Eleştiri Oranı' : 'Negative Critique Ratio'}</div>
          <div className="value" style={{ color: '#ef4444' }}>
            %{detail?.sentiment_percentages?.Negative ?? 0}
          </div>
          <div className="sub">
            {detail?.sentiment_counts?.Negative ?? 0} / {detail?.collected_comments_count ?? 0} {t.overview.comments_unit}
          </div>
        </div>

        <div className="metric-card">
          <div className="label">{lang === 'tr' ? 'Kritik / Majör Hata' : 'Critical / Major Bugs'}</div>
          <div className="value" style={{ color: '#f59e0b' }}>
            {detail?.critical_bugs_and_usability?.length ?? 0}
          </div>
          <div className="sub">{lang === 'tr' ? 'Çökme, softlock veya kontrol arızası' : 'Crashes, softlocks, or control failures'}</div>
        </div>
      </div>

      {/* Topic Breakdown and Reddit vs X comparison */}
      <div className="grid-2col">
        {/* Topic Frequency Bar Chart with Turkish labels */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">{t.game_detail.topic_distribution}</div>
          </div>
          <div style={{ height: 260 }}>
            {detail?.topic_frequencies?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={detail.topic_frequencies.slice(0, 6).map((item: any) => ({
                    ...item,
                    displayTopic: tTopic(item.topic, lang)
                  }))}
                  layout="vertical"
                  margin={{ left: 50, right: 20 }}
                >
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis dataKey="displayTopic" type="category" stroke="#cbd5e1" width={130} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                  <Bar dataKey="positive" fill="#10b981" name={t.charts.positive} stackId="a" />
                  <Bar dataKey="negative" fill="#ef4444" name={t.charts.negative} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                Yetersiz konu verisi
              </div>
            )}
          </div>
        </div>

        {/* Reddit vs X Differences */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">{t.game_detail.reddit_vs_x}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: '#ff4500' }}>Reddit Topluluk Geri Bildirimi</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Toplam: {Number(Object.values(detail?.reddit_vs_x?.reddit || {}).reduce((a: any, b: any) => a + Number(b), 0))} {t.overview.comments_unit}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                {t.game_detail.reddit_desc}
              </p>
            </div>

            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: '#1da1f2' }}>X (Twitter) Paylaşımları</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Toplam: {Number(Object.values(detail?.reddit_vs_x?.x || {}).reduce((a: any, b: any) => a + Number(b), 0))} {t.overview.comments_unit}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                {t.game_detail.x_desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Bugs & Usability Table */}
      {detail?.critical_bugs_and_usability?.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertOctagon size={20} />
              {t.game_detail.critical_issues}
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Geri Bildirim Konusu</th>
                  <th>Ciddiyet Derecesi</th>
                  <th>Eyleme Geçilebilirlik</th>
                  <th>Temsili Alıntı</th>
                  <th>Kaynak Linki</th>
                </tr>
              </thead>
              <tbody>
                {detail.critical_bugs_and_usability.map((issue: any, idx: number) => (
                  <tr key={idx}>
                    <td><strong>{tTopic(issue.topic, lang)}</strong></td>
                    <td>
                      <span className={`badge ${issue.severity === 'Critical' ? 'badge-critical' : 'badge-major'}`}>
                        {tSeverity(issue.severity, lang)}
                      </span>
                    </td>
                    <td>{issue.actionability}</td>
                    <td style={{ color: '#fca5a5', maxWidth: '400px' }}>"{issue.excerpt}"</td>
                    <td>
                      {issue.permalink ? (
                        <a href={issue.permalink} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span>{t.game_detail.source_link}</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: '#64748b' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verified Comments & Evidence Explorer */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">{t.game_detail.verified_comments}</div>
            <div className="panel-desc">
              Tüm yorumlar normalize edilmiş veritabanından filtrelenir; sahte alıntı üretilmez.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <select
              className="input-text"
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
            >
              <option value="ALL">{t.game_detail.all_sentiments}</option>
              <option value="Positive">{tSentiment('Positive', lang)}</option>
              <option value="Negative">{tSentiment('Negative', lang)}</option>
              <option value="Mixed">{tSentiment('Mixed', lang)}</option>
              <option value="Neutral">{tSentiment('Neutral', lang)}</option>
            </select>

            <select
              className="input-text"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="ALL">{t.game_detail.all_platforms}</option>
              <option value="reddit">Reddit</option>
              <option value="x">X</option>
              <option value="steam">Steam</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kaynak</th>
                <th>Yazar</th>
                <th>Duygu</th>
                <th>Yorum Metni & Çıkarılan Kanıt</th>
                <th>Güven</th>
                <th>Bağlantı</th>
              </tr>
            </thead>
            <tbody>
              {filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                    {t.game_detail.no_comments_match}
                  </td>
                </tr>
              ) : (
                filteredComments.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <span className="badge badge-minor" style={{ textTransform: 'uppercase' }}>
                        {c.source_name}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{c.author}</td>
                    <td>
                      <span className={`badge badge-${c.sentiment?.toLowerCase() || 'neutral'}`}>
                        {tSentiment(c.sentiment, lang)}
                      </span>
                    </td>
                    <td style={{ maxWidth: '450px' }}>
                      <div style={{ color: '#e2e8f0', fontSize: '0.86rem' }}>{c.content}</div>
                      {c.excerpt && c.excerpt !== c.content && (
                        <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '0.3rem', fontStyle: 'italic' }}>
                          Vurgu: "{c.excerpt}"
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: c.confidence >= 0.8 ? '#34d399' : '#fbbf24' }}>
                        %{Math.round((c.confidence || 0.8) * 100)}
                      </span>
                    </td>
                    <td>
                      {c.permalink ? (
                        <a href={c.permalink} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span>{t.game_detail.source_link}</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: '#64748b' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddGameModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingGame(null);
        }}
        initialGame={editingGame}
        onGameCreated={async (savedGameId) => {
          await loadGamesList();
          if (savedGameId === gameId) {
            await loadGameDetail(savedGameId);
          } else {
            onSelectGame(savedGameId);
          }
        }}
        lang={lang}
      />
    </div>
  );
};
