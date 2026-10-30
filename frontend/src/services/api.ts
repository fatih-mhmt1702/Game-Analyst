const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    // If running in packaged Electron (file:// protocol)
    if (window.location.protocol === 'file:') {
      return 'http://127.0.0.1:8000';
    }

    // If explicit env var is set
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl) return envUrl;

    // In web browser (localhost, local Wi-Fi IP, Cloudflare Tunnel, Ngrok, or public domain),
    // use relative path "" so requests go through Vite's reverse proxy (/api & /health)
    // without CORS or Mixed-Content (HTTP on HTTPS) issues!
    return '';
  }
  return 'http://127.0.0.1:8000';
};

const API_BASE = getApiBase();

export const api = {
  // Health
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Overview
  async getOverview() {
    const res = await fetch(`${API_BASE}/api/overview`);
    if (!res.ok) throw new Error("Failed to fetch overview metrics");
    return res.json();
  },

  // Games & Top 10
  async getGames(search?: string) {
    const url = search ? `${API_BASE}/api/games?search=${encodeURIComponent(search)}` : `${API_BASE}/api/games`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch games list");
    return res.json();
  },

  async getTop10() {
    const res = await fetch(`${API_BASE}/api/games/top10`);
    if (!res.ok) throw new Error("Failed to fetch top 10 games");
    return res.json();
  },

  async getGameDetail(gameId: string) {
    const res = await fetch(`${API_BASE}/api/games/${gameId}`);
    if (!res.ok) throw new Error("Failed to fetch game details");
    return res.json();
  },

  async syncSteam(gameId: string) {
    const res = await fetch(`${API_BASE}/api/games/${gameId}/sync-steam`, { method: "POST" });
    const data = await res.json();
    return { ok: res.ok, data };
  },

  async createGame(payload: {
    title: string;
    developer?: string;
    publisher?: string;
    steam_app_id?: string;
    genre?: string;
    tags?: string[];
    peak_ccu?: number;
    ccu_source?: string;
    ccu_verified?: boolean;
    rank_order?: number | null;
    is_top10?: boolean;
    wishlist_count?: number;
    wishlist_rank?: number | null;
    steam_followers?: number;
  }) {
    const res = await fetch(`${API_BASE}/api/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || "Oyun kaydedilemedi");
    return data;
  },

  async updateGame(gameId: string, payload: {
    title: string;
    developer?: string;
    publisher?: string;
    steam_app_id?: string;
    genre?: string;
    tags?: string[];
    peak_ccu?: number;
    ccu_source?: string;
    ccu_verified?: boolean;
    rank_order?: number | null;
    is_top10?: boolean;
    wishlist_count?: number;
    wishlist_rank?: number | null;
    steam_followers?: number;
  }) {
    const res = await fetch(`${API_BASE}/api/games/${gameId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || "Oyun güncellenemedi");
    return data;
  },

  async deleteGame(gameId: string) {
    const res = await fetch(`${API_BASE}/api/games/${gameId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || "Oyun silinemedi");
    return data;
  },

  // Industry Macro Patterns
  async getIndustryPatterns() {
    const res = await fetch(`${API_BASE}/api/industry/patterns`);
    if (!res.ok) throw new Error("Failed to fetch industry patterns");
    return res.json();
  },

  // Charts
  async getSentimentByGame() {
    const res = await fetch(`${API_BASE}/api/charts/sentiment-by-game`);
    return res.json();
  },

  async getTopicFrequency() {
    const res = await fetch(`${API_BASE}/api/charts/topic-frequency`);
    return res.json();
  },

  async getPlatformComparison() {
    const res = await fetch(`${API_BASE}/api/charts/platform-comparison`);
    return res.json();
  },

  async getVolumeOverTime() {
    const res = await fetch(`${API_BASE}/api/charts/volume-over-time`);
    return res.json();
  },

  async getSeverityByGame() {
    const res = await fetch(`${API_BASE}/api/charts/severity-by-game`);
    return res.json();
  },

  async getHeatmap() {
    const res = await fetch(`${API_BASE}/api/charts/heatmap`);
    return res.json();
  },

  // Recommendations
  async getRecommendations() {
    const res = await fetch(`${API_BASE}/api/recommendations`);
    if (!res.ok) throw new Error("Failed to fetch recommendations");
    return res.json();
  },

  // Data Management
  async getDataSources() {
    const res = await fetch(`${API_BASE}/api/data/sources`);
    return res.json();
  },

  async getDataStats() {
    const res = await fetch(`${API_BASE}/api/data/stats`);
    if (!res.ok) throw new Error("Failed to fetch data stats");
    return res.json();
  },

  async testConnection(sourceName: string) {
    const res = await fetch(`${API_BASE}/api/data/test-connection/${sourceName}`, { method: "POST" });
    return res.json();
  },

  async fetchLiveFeedback(payload: { source_name: "steam" | "reddit" | "x"; game_id?: string; limit?: number }) {
    const res = await fetch(`${API_BASE}/api/data/fetch-live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || "Canlı veri çekme işlemi başarısız oldu");
    return data;
  },

  async importCsv(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/data/import/csv`, { method: "POST", body: formData });
    return res.json();
  },

  async importJson(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/data/import/json`, { method: "POST", body: formData });
    return res.json();
  },

  async seedSample() {
    const res = await fetch(`${API_BASE}/api/data/seed-sample`, { method: "POST" });
    return res.json();
  },

  async clearData() {
    const res = await fetch(`${API_BASE}/api/data/clear`, { method: "POST" });
    return res.json();
  },

  async getJobs() {
    const res = await fetch(`${API_BASE}/api/jobs`);
    return res.json();
  },

  async cancelJob(jobId: string) {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}/cancel`, { method: "POST" });
    return res.json();
  },

  getExportCsvUrl: () => `${API_BASE}/api/export/csv`,
  getExportJsonUrl: () => `${API_BASE}/api/export/json`,
  getExportHtmlUrl: () => `${API_BASE}/api/export/html`
};
