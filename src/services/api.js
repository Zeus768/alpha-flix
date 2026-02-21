import axios from 'axios';

// Backend API URL - Update this when deploying
const API_BASE_URL = 'https://rd-scraper-test.preview.emergentagent.com/api';

// Real-Debrid OAuth endpoints
const RD_OAUTH_URL = 'https://api.real-debrid.com/oauth/v2';
const RD_API_URL = 'https://api.real-debrid.com/rest/1.0';

// Real-Debrid Client ID (public app)
const RD_CLIENT_ID = 'X245A4XAIBGVM';

// TMDB API Key for direct genre calls
const TMDB_API_KEY = 'f15af109700aab95d564acda15bdcd97';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Genre IDs from TMDB
export const MOVIE_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

export const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' },
];

// TMDB API
export const api = {
  // Search
  search: async (query, type = 'all') => {
    const response = await axios.get(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&type=${type}`);
    return response.data;
  },

  // Popular content with pagination
  getPopular: async (type, limit = 50, page = 1) => {
    const response = await axios.get(`${API_BASE_URL}/popular/${type}?limit=${limit}&page=${page}`);
    return response.data;
  },

  // Trending
  getTrending: async (type = 'all', limit = 30) => {
    const response = await axios.get(`${API_BASE_URL}/trending?type=${type}&limit=${limit}`);
    return response.data;
  },

  // New releases
  getNewReleases: async (type, limit = 30) => {
    const response = await axios.get(`${API_BASE_URL}/new-releases/${type}?limit=${limit}`);
    return response.data;
  },

  // In Cinema (currently in theaters)
  getInCinema: async (limit = 30) => {
    const response = await axios.get(`${API_BASE_URL}/in-cinema?limit=${limit}`);
    return response.data;
  },

  // Get content by genre (direct TMDB call)
  getByGenre: async (mediaType, genreId, page = 1) => {
    try {
      const endpoint = mediaType === 'movie' ? 'discover/movie' : 'discover/tv';
      const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}`, {
        params: {
          api_key: TMDB_API_KEY,
          with_genres: genreId,
          sort_by: 'popularity.desc',
          page: page,
        },
      });
      
      // Format results to match our app structure
      return response.data.results.map(item => ({
        tmdb_id: item.id,
        title: item.title || item.name,
        year: (item.release_date || item.first_air_date || '').substring(0, 4),
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        overview: item.overview,
        rating: item.vote_average,
        type: mediaType,
      }));
    } catch (error) {
      console.error('Get by genre error:', error);
      return [];
    }
  },

  // Content details
  getContentDetails: async (type, tmdbId) => {
    const response = await axios.get(`${API_BASE_URL}/content/${type}/${tmdbId}`);
    return response.data;
  },

  // Get TV show season episodes
  getSeasonEpisodes: async (tmdbId, seasonNumber) => {
    const response = await axios.get(`${API_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}/episodes`);
    return response.data;
  },

  // Torrent sources for specific episode
  getEpisodeSources: async (showTitle, tmdbId, season, episode, year, rdToken = null) => {
    const searchTitle = `${showTitle} S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
    let url = `${API_BASE_URL}/sources/tv/${encodeURIComponent(searchTitle)}?year=${year || ''}&tmdb_id=${tmdbId}&season=${season}&episode=${episode}`;
    if (rdToken) {
      url += `&rd_token=${rdToken}`;
    }
    const response = await axios.get(url);
    return response.data;
  },

  // Torrent sources
  getTorrentSources: async (type, title, year, rdToken = null, tmdbId = null) => {
    let url = `${API_BASE_URL}/sources/${type}/${encodeURIComponent(title)}?year=${year || ''}`;
    if (tmdbId) {
      url += `&tmdb_id=${tmdbId}`;
    }
    if (rdToken) {
      url += `&rd_token=${rdToken}`;
    }
    const response = await axios.get(url);
    return response.data;
  },

  // Favorites
  getFavorites: async () => {
    const response = await axios.get(`${API_BASE_URL}/favorites`);
    return response.data;
  },

  addFavorite: async (item) => {
    const params = new URLSearchParams();
    params.append('title', item.title);
    if (item.poster) params.append('poster', item.poster);
    params.append('content_type', item.type);
    if (item.year) params.append('year', item.year);
    if (item.magnet) params.append('magnet', item.magnet);
    if (item.tmdb_id) params.append('tmdb_id', item.tmdb_id);
    if (item.overview) params.append('overview', item.overview);
    if (item.rating) params.append('rating', item.rating);
    if (item.backdrop) params.append('backdrop', item.backdrop);
    
    const response = await axios.post(`${API_BASE_URL}/favorites?${params.toString()}`);
    return response.data;
  },

  removeFavorite: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/favorites/${id}`);
    return response.data;
  },

  // Downloads
  getDownloads: async () => {
    const response = await axios.get(`${API_BASE_URL}/downloads`);
    return response.data;
  },

  deleteDownload: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/downloads/${id}`);
    return response.data;
  },
};

// Real-Debrid API
export const rdApi = {
  // Device code flow - Step 1: Get device code
  getDeviceCode: async () => {
    const response = await axios.get(`${RD_OAUTH_URL}/device/code`, {
      params: {
        client_id: RD_CLIENT_ID,
        new_credentials: 'yes',
      },
    });
    return response.data;
  },

  // Device code flow - Step 2: Poll for credentials
  pollForCredentials: async (deviceCode) => {
    try {
      const response = await axios.get(`${RD_OAUTH_URL}/device/credentials`, {
        params: {
          client_id: RD_CLIENT_ID,
          code: deviceCode,
        },
        timeout: 10000, // 10 second timeout
      });
      console.log('Credentials response:', response.status, response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        // Authorization pending - this is expected
        return null;
      }
      console.error('Poll credentials error:', error.response?.status, error.message);
      throw error;
    }
  },

  // Device code flow - Step 3: Get token from credentials
  getToken: async (clientId, clientSecret, code) => {
    try {
      // Real-Debrid expects form-urlencoded data, not URL params
      const formData = new URLSearchParams();
      formData.append('client_id', clientId);
      formData.append('client_secret', clientSecret);
      formData.append('code', code);
      formData.append('grant_type', 'http://oauth.net/grant_type/device/1.0');
      
      const response = await axios.post(`${RD_OAUTH_URL}/token`, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      });
      console.log('Token response:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('Get token error:', error.response?.status, error.response?.data, error.message);
      throw error;
    }
  },

  // Get user info
  getUserInfo: async (token) => {
    const response = await axios.get(`${RD_API_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Add magnet
  addMagnet: async (token, magnet) => {
    const formData = new FormData();
    formData.append('magnet', magnet);
    
    const response = await axios.post(`${RD_API_URL}/torrents/addMagnet`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get torrent info
  getTorrentInfo: async (token, torrentId) => {
    const response = await axios.get(`${RD_API_URL}/torrents/info/${torrentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Select files
  selectFiles: async (token, torrentId, files = 'all') => {
    const formData = new FormData();
    formData.append('files', files);
    
    const response = await axios.post(`${RD_API_URL}/torrents/selectFiles/${torrentId}`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Unrestrict link
  unrestrictLink: async (token, link) => {
    const formData = new FormData();
    formData.append('link', link);
    
    const response = await axios.post(`${RD_API_URL}/unrestrict/link`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get streaming link (full flow)
  getStreamingLink: async (token, magnet, title) => {
    try {
      console.log('[RD] Starting stream link process for:', title);
      console.log('[RD] Magnet:', magnet.substring(0, 60) + '...');
      
      // Add magnet
      console.log('[RD] Adding magnet to Real-Debrid...');
      const addResult = await rdApi.addMagnet(token, magnet);
      console.log('[RD] Add magnet result:', addResult);
      const torrentId = addResult.id;
      
      if (!torrentId) {
        throw new Error('Failed to add magnet - no torrent ID returned');
      }
      console.log('[RD] Torrent ID:', torrentId);

      // Wait and select files
      console.log('[RD] Waiting 3s before selecting files...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('[RD] Selecting files...');
      try {
        await rdApi.selectFiles(token, torrentId);
        console.log('[RD] Files selected');
      } catch (selectErr) {
        console.log('[RD] Select files response (may be empty):', selectErr.message);
      }

      // Poll for completion
      console.log('[RD] Polling for torrent status...');
      for (let i = 0; i < 20; i++) {
        const info = await rdApi.getTorrentInfo(token, torrentId);
        console.log(`[RD] Poll ${i + 1}/20 - Status: ${info.status}, Progress: ${info.progress}%`);
        
        if (info.status === 'downloaded') {
          const links = info.links || [];
          console.log('[RD] Download complete! Links:', links.length);
          
          if (links.length > 0) {
            console.log('[RD] Unrestricting link:', links[0]);
            const unrestricted = await rdApi.unrestrictLink(token, links[0]);
            console.log('[RD] Unrestricted result:', unrestricted);
            
            return {
              download_url: unrestricted.download,
              filename: unrestricted.filename,
              filesize: unrestricted.filesize,
              vlc_link: `vlc://${unrestricted.download}`,
              mx_link: `intent:${unrestricted.download}#Intent;type=video/*;package=com.mxtech.videoplayer.ad;end`,
            };
          } else {
            throw new Error('Torrent downloaded but no links available');
          }
        } else if (['error', 'virus', 'dead', 'magnet_error'].includes(info.status)) {
          throw new Error(`Torrent error: ${info.status}`);
        } else if (info.status === 'waiting_files_selection') {
          // Need to select files again
          console.log('[RD] Waiting for file selection, selecting all...');
          try {
            await rdApi.selectFiles(token, torrentId);
          } catch (e) {
            console.log('[RD] Re-select files error:', e.message);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Still processing after all polls
      return {
        status: 'processing',
        torrent_id: torrentId,
        message: 'Torrent is still downloading. Try again in a few minutes.',
      };
    } catch (error) {
      console.error('[RD] Streaming link error:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Trakt API
export const traktApi = {
  // Get device code for trakt.tv/activate
  getDeviceCode: async () => {
    const response = await axios.get(`${API_BASE_URL}/trakt/device-code`);
    return response.data;
  },

  // Poll for token after user authorizes
  pollForToken: async (deviceCode) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/trakt/poll-token?device_code=${deviceCode}`);
      return response.data;
    } catch (error) {
      // 400 = invalid/expired code, 410 = expired
      if (error.response?.status === 400 || error.response?.status === 410) {
        throw new Error(error.response?.data?.detail || 'Authorization failed');
      }
      throw error;
    }
  },

  // Get user profile
  getUser: async (token) => {
    const response = await axios.get(`${API_BASE_URL}/trakt/user?trakt_token=${token}`);
    return response.data;
  },

  // Get watchlist
  getWatchlist: async (token, type = 'movies') => {
    const response = await axios.get(`${API_BASE_URL}/trakt/watchlist/${type}?trakt_token=${token}`);
    return response.data;
  },

  // Get watched history
  getWatched: async (token, type = 'movies') => {
    const response = await axios.get(`${API_BASE_URL}/trakt/watched/${type}?trakt_token=${token}`);
    return response.data;
  },

  // Add to watchlist
  addToWatchlist: async (token, tmdbId, type = 'movie') => {
    const response = await axios.post(
      `${API_BASE_URL}/trakt/watchlist/add?tmdb_id=${tmdbId}&content_type=${type}&trakt_token=${token}`
    );
    return response.data;
  },

  // Mark as watched
  markWatched: async (token, tmdbId, type = 'movie') => {
    const response = await axios.post(
      `${API_BASE_URL}/trakt/watched/add?tmdb_id=${tmdbId}&content_type=${type}&trakt_token=${token}`
    );
    return response.data;
  },

  // Get recommendations
  getRecommendations: async (token, type = 'movies') => {
    const response = await axios.get(`${API_BASE_URL}/trakt/recommendations/${type}?trakt_token=${token}`);
    return response.data;
  },

  // Get playback progress (continue watching)
  getPlayback: async (token) => {
    const response = await axios.get(`${API_BASE_URL}/trakt/playback?trakt_token=${token}`);
    return response.data;
  },

  // Get collection (library)
  getCollection: async (token, type = 'movies') => {
    const response = await axios.get(`${API_BASE_URL}/trakt/collection/${type}?trakt_token=${token}`);
    return response.data;
  },
};

// Podcast API
export const podcastApi = {
  // Get all podcasters
  getPodcasters: async () => {
    const response = await axios.get(`${API_BASE_URL}/podcasts`);
    return response.data;
  },

  // Get episodes for a podcaster
  getEpisodes: async (podcasterId, limit = 30) => {
    const response = await axios.get(`${API_BASE_URL}/podcasts/${podcasterId}/episodes?limit=${limit}`);
    return response.data;
  },

  // Search podcasts
  search: async (query, limit = 20) => {
    const response = await axios.get(`${API_BASE_URL}/podcasts/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },
};

// Subtitle API
export const subtitleApi = {
  // Search subtitles
  search: async (tmdbId, language = 'en', season = null, episode = null) => {
    let url = `${API_BASE_URL}/subtitles/search?tmdb_id=${tmdbId}&language=${language}`;
    if (season) url += `&season=${season}`;
    if (episode) url += `&episode=${episode}`;
    const response = await axios.get(url);
    return response.data;
  },

  // Get download URL
  getDownloadUrl: async (fileId) => {
    const response = await axios.get(`${API_BASE_URL}/subtitles/download/${fileId}`);
    return response.data;
  },
};

// Sports API
export const sportsApi = {
  // Get all sports categories
  getCategories: async () => {
    const response = await axios.get(`${API_BASE_URL}/sports/categories`);
    return response.data;
  },

  // Get streams for a category
  getStreams: async (category) => {
    const response = await axios.get(`${API_BASE_URL}/sports/${category}/streams`);
    return response.data;
  },

  // Get stream link
  getStreamLink: async (streamId) => {
    const response = await axios.get(`${API_BASE_URL}/sports/stream/${streamId}`);
    return response.data;
  },
};
