import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';
import { tTopic, tSentiment } from '../i18n/helpers';
import { Search, Trophy, CheckCircle2, AlertTriangle, ArrowRight, Bookmark, Users } from 'lucide-react';

interface Top10PageProps {
  lang: 'tr' | 'en';
  onInspectGame: (gameId: string) => void;
}

export const Top10Page: React.FC<Top10PageProps> = ({ lang, onInspectGame }) => {
  const t = lang === 'tr' ? tr : en;
  const [games, setGames] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTop10();
  }, []);

  const loadTop10 = async () => {
    try {
      setLoading(true);
      const res = await api.getTop10();
      setGames(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter((g) =>
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    (g.developer && g.developer.toLowerCase().includes(search.toLowerCase())) ||
    (g.genre && g.genre.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-container">
      {/* Title & Methodology Disclaimer */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Trophy size={28} color="#eab308" />
          {t.top10.title}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginTop: '0.3rem' }}>
          {t.top10.subtitle}
        </p>
      </div>

      <div className="warning-box" style={{ background: 'rgba(56, 189, 248, 0.08)', borderColor: '#0284c7', color: '#bae6fd' }}>
        <AlertTriangle size={20} color="#38bdf8" style={{ flexShrink: 0 }} />
        <span>{t.top10.disclaimer}</span>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ position: 'relative', width: '360px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            className="input-text"
            style={{ width: '100%', paddingLeft: '2.3rem' }}
            placeholder={t.top10.search_placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          {filteredGames.length} / 10 {lang === 'tr' ? 'Oyun Listeleniyor' : 'Games Listed'}
        </div>
      </div>

      {/* Top 10 Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>{t.top10.rank}</th>
              <th>{t.top10.game}</th>
              <th>{t.top10.peak_ccu} & {t.top10.ccu_source}</th>
              <th style={{ color: '#38bdf8' }}>{t.top10.wishlists}</th>
              <th>{t.top10.comment_volume}</th>
              <th>{t.top10.sentiment}</th>
              <th>{t.top10.praised}</th>
              <th>{t.top10.complaint}</th>
              <th style={{ textAlign: 'right' }}>{t.top10.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  {lang === 'tr' ? 'Yükleniyor...' : 'Loading Top 10 games...'}
                </td>
              </tr>
            ) : filteredGames.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  {lang === 'tr' ? 'Aramayla eşleşen oyun bulunamadı.' : 'No games match your search query.'}
                </td>
              </tr>
            ) : (
              filteredGames.map((game) => (
                <tr key={game.game_id} style={{ background: game.rank === 1 ? 'rgba(56, 189, 248, 0.04)' : 'transparent' }}>
                  <td>
                    <span style={{ 
                      fontSize: '1rem', 
                      fontWeight: 800, 
                      color: game.rank === 1 ? '#eab308' : game.rank === 2 ? '#cbd5e1' : game.rank === 3 ? '#d97706' : '#94a3b8' 
                    }}>
                      #{game.rank}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {game.title}
                      {game.rank === 1 && (
                        <span className="badge badge-positive" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          Next Fest #1
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {game.developer} &bull; <span style={{ color: '#38bdf8' }}>{game.genre}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                      {game.peak_ccu.toLocaleString()} CCU
                    </div>
                    <div>
                      {game.ccu_verified ? (
                        <span className="badge badge-verified" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                          <CheckCircle2 size={10} /> {game.ccu_source}
                        </span>
                      ) : (
                        <span className="badge badge-unverified" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                          {game.ccu_source}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Wishlist and Followers Column */}
                  <td>
                    <div style={{ fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Bookmark size={13} />
                      {game.wishlist_count ? game.wishlist_count.toLocaleString() : 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Users size={11} />
                      <span>{game.steam_followers ? game.steam_followers.toLocaleString() : 0} {t.top10.followers}</span>
                      {game.wishlist_rank && (
                        <span style={{ color: '#eab308', fontWeight: 600 }}> (Rank #{game.wishlist_rank})</span>
                      )}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{game.collected_comments_count} {t.overview.comments_unit}</div>
                    {game.is_low_sample ? (
                      <span className="badge badge-minor" style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' }}>
                        {t.top10.low_sample}
                      </span>
                    ) : (
                      <span className="badge badge-positive" style={{ fontSize: '0.68rem' }}>{t.top10.adequate}</span>
                    )}
                  </td>
                  <td>
                    <div style={{ width: '120px', background: '#1e293b', height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${game.positive_pct}%`, background: '#10b981' }} title={`%${game.positive_pct} ${tSentiment('Positive', lang)}`} />
                      <div style={{ width: `${game.mixed_pct}%`, background: '#c084fc' }} title={`%${game.mixed_pct} ${tSentiment('Mixed', lang)}`} />
                      <div style={{ width: `${game.negative_pct}%`, background: '#ef4444' }} title={`%${game.negative_pct} ${tSentiment('Negative', lang)}`} />
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      <span style={{ color: '#34d399' }}>%{game.positive_pct}</span> / <span style={{ color: '#f87171' }}>%{game.negative_pct}</span>
                    </div>
                  </td>
                  <td style={{ color: '#34d399', fontSize: '0.85rem' }}>
                    {tTopic(game.most_praised_feature, lang)}
                  </td>
                  <td style={{ color: '#f87171', fontSize: '0.85rem' }}>
                    {tTopic(game.most_common_complaint, lang)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => onInspectGame(game.game_id)}
                    >
                      <span>{t.top10.inspect}</span>
                      <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
