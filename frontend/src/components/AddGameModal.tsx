import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Gamepad2, RefreshCw, Save } from 'lucide-react';
import { api } from '../services/api';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameCreated: (gameId: string) => void;
  lang: 'tr' | 'en';
  initialGame?: any | null;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onGameCreated,
  lang,
  initialGame = null,
}) => {
  const isEdit = Boolean(initialGame?.id);

  const [title, setTitle] = useState('');
  const [developer, setDeveloper] = useState('');
  const [genre, setGenre] = useState('Action Roguelike');
  const [steamAppId, setSteamAppId] = useState('');
  const [peakCcu, setPeakCcu] = useState<number>(2500);
  const [steamFollowers, setSteamFollowers] = useState<number>(0);
  const [isTop10, setIsTop10] = useState<boolean>(false);
  const [rankOrder, setRankOrder] = useState<number>(11);
  const [autoSyncSteam, setAutoSyncSteam] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialGame) {
      setTitle(initialGame.title || '');
      setDeveloper(initialGame.developer || '');
      setGenre(initialGame.genre || 'Indie');
      setSteamAppId(initialGame.steam_app_id || '');
      setPeakCcu(Number(initialGame.peak_ccu) || 0);
      setSteamFollowers(Number(initialGame.steam_followers) || 0);
      setIsTop10(Boolean(initialGame.is_top10));
      setRankOrder(Number(initialGame.rank_order) || 10);
      setAutoSyncSteam(false);
    } else {
      setTitle('');
      setDeveloper('');
      setGenre('Action Roguelike');
      setSteamAppId('');
      setPeakCcu(2500);
      setSteamFollowers(0);
      setIsTop10(false);
      setRankOrder(11);
      setAutoSyncSteam(true);
    }
    setError(null);
  }, [initialGame, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(lang === 'tr' ? 'Lütfen oyun adını girin.' : 'Please enter the game title.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        title: title.trim(),
        developer: developer.trim() || 'Indie Studio',
        publisher: initialGame?.publisher || 'Self-Published',
        genre: genre.trim() || 'Indie',
        steam_app_id: steamAppId.trim(),
        peak_ccu: Number(peakCcu) || 0,
        ccu_source: steamAppId.trim() ? 'SteamDB / Steam API' : (initialGame?.ccu_source || 'Manual Entry'),
        ccu_verified: Boolean(steamAppId.trim() || initialGame?.ccu_verified),
        is_top10: isTop10,
        rank_order: isTop10 ? Number(rankOrder) || 10 : null,
        steam_followers: Number(steamFollowers) || 0,
        wishlist_count: initialGame?.wishlist_count || 0,
        wishlist_rank: initialGame?.wishlist_rank || null,
      };

      const saved = isEdit
        ? await api.updateGame(initialGame.id, payload)
        : await api.createGame(payload);

      const targetId = saved?.id || initialGame?.id;

      if (autoSyncSteam && targetId) {
        try {
          await api.syncSteam(targetId);
        } catch {
          // Ignore sync fallback error if offline
        }
      }

      onGameCreated(targetId);
      onClose();
    } catch (err: any) {
      setError(err.message || (lang === 'tr' ? 'Hata oluştu' : 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gamepad2 size={22} color="#38bdf8" />
            <span>
              {isEdit
                ? (lang === 'tr' ? 'Oyun Bilgilerini Düzenle' : 'Edit Game Details')
                : (lang === 'tr' ? 'Yeni Oyun / Demo Ekle' : 'Register New Game / Demo')}
            </span>
          </h2>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.35rem' }} type="button">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="warning-box" style={{ borderColor: '#ef4444', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.12)' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
              {lang === 'tr' ? 'Oyun Adı *' : 'Game Title *'}
            </label>
            <input
              type="text"
              className="input-text"
              style={{ width: '100%' }}
              placeholder="Örn: Hollow Knight: Silksong Demo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid-2col" style={{ marginBottom: 0, gap: '0.8rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
                {lang === 'tr' ? 'Geliştirici Stüdyo' : 'Developer Studio'}
              </label>
              <input
                type="text"
                className="input-text"
                style={{ width: '100%' }}
                placeholder="Örn: Team Cherry"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
                {lang === 'tr' ? 'Oyun Türü (Genre)' : 'Genre'}
              </label>
              <input
                type="text"
                className="input-text"
                style={{ width: '100%' }}
                placeholder="Örn: Metroidvania / Action RPG"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2col" style={{ marginBottom: 0, gap: '0.8rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
                Steam App ID {lang === 'tr' ? '(İsteğe Bağlı)' : '(Optional)'}
              </label>
              <input
                type="text"
                className="input-text"
                style={{ width: '100%' }}
                placeholder="Örn: 1030300"
                value={steamAppId}
                onChange={(e) => setSteamAppId(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
                {lang === 'tr' ? 'Zirve Eşzamanlı Oyuncu (Peak CCU)' : 'Peak CCU'}
              </label>
              <input
                type="number"
                className="input-text"
                style={{ width: '100%' }}
                min={0}
                value={peakCcu}
                onChange={(e) => setPeakCcu(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid-2col" style={{ marginBottom: 0, gap: '0.8rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
                {lang === 'tr' ? 'Steam Takipçi (0 = Otomatik Hesapla)' : 'Steam Followers (0 = Auto)'}
              </label>
              <input
                type="number"
                className="input-text"
                style={{ width: '100%' }}
                min={0}
                value={steamFollowers}
                onChange={(e) => setSteamFollowers(Number(e.target.value))}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.4rem', paddingTop: '1.1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isTop10}
                  onChange={(e) => setIsTop10(e.target.checked)}
                />
                <span>{lang === 'tr' ? 'Top 10 Listesine Dahil Et' : 'Include in Top 10 List'}</span>
              </label>

              {isTop10 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{lang === 'tr' ? 'Sıra:' : 'Rank:'}</span>
                  <input
                    type="number"
                    className="input-text"
                    style={{ width: '75px', padding: '0.25rem 0.5rem' }}
                    min={1}
                    max={50}
                    value={rankOrder}
                    onChange={(e) => setRankOrder(Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: '#38bdf8', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoSyncSteam}
              onChange={(e) => setAutoSyncSteam(e.target.checked)}
            />
            <span>
              {lang === 'tr'
                ? 'Kaydettikten sonra Steam Store & Wishlist verilerini otomatik senkronize et'
                : 'Automatically synchronize Steam Store & Wishlist stats after saving'}
            </span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.6rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {lang === 'tr' ? 'İptal' : 'Cancel'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : isEdit ? (
                <Save size={15} />
              ) : (
                <PlusCircle size={15} />
              )}
              <span>
                {submitting
                  ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...')
                  : isEdit
                  ? (lang === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes')
                  : (lang === 'tr' ? 'Oyunu Ekle' : 'Add Game')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
