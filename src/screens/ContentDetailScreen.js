import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
  Alert,
  ImageBackground,
  Modal,
  Platform,
  TVFocusGuideView,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { api, rdApi, subtitleApi } from '../services/api';

const { width, height } = Dimensions.get('window');
const isTV = Platform.isTV;

export default function ContentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params;
  const { rdToken, addToFavorites, isFavorite, loadDownloads } = useApp();
  
  const [details, setDetails] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [streamData, setStreamData] = useState(null);
  const [error, setError] = useState(null);
  
  // TV Show state
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  
  // Subtitle state
  const [subtitles, setSubtitles] = useState([]);
  const [subtitlesLoading, setSubtitlesLoading] = useState(false);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);

  const isTVShow = item.type === 'tv';

  useEffect(() => {
    loadDetails();
  }, []);

  useEffect(() => {
    if (details && isTVShow && details.seasons?.length > 0 && !selectedSeason) {
      setSelectedSeason(details.seasons[0]);
    }
  }, [details]);

  useEffect(() => {
    if (selectedSeason && isTVShow) {
      loadEpisodes(selectedSeason.season_number);
    }
  }, [selectedSeason]);

  useEffect(() => {
    if (!isTVShow) {
      loadSources();
    } else if (selectedEpisode) {
      loadEpisodeSources();
    }
  }, [selectedEpisode, isTVShow]);

  const loadDetails = async () => {
    if (item.tmdb_id) {
      try {
        const data = await api.getContentDetails(item.type, item.tmdb_id);
        setDetails(data);
      } catch (err) {
        console.error('Load details error:', err);
      }
    }
    setLoading(false);
  };

  const loadEpisodes = async (seasonNumber) => {
    setEpisodesLoading(true);
    try {
      const data = await api.getSeasonEpisodes(item.tmdb_id, seasonNumber);
      setEpisodes(data);
      if (data.length > 0 && !selectedEpisode) {
        setSelectedEpisode(data[0]);
      }
    } catch (err) {
      console.error('Load episodes error:', err);
    }
    setEpisodesLoading(false);
  };

  const loadSources = async () => {
    setSourcesLoading(true);
    setSources([]);
    setError(null);
    try {
      const data = await api.getTorrentSources(
        item.type || 'movie',
        item.title,
        item.year,
        rdToken,
        item.tmdb_id
      );
      setSources(data || []);
    } catch (err) {
      console.error('Load sources error:', err);
      setError('Failed to load sources');
    }
    setSourcesLoading(false);
  };

  const loadEpisodeSources = async () => {
    if (!selectedEpisode) return;
    setSourcesLoading(true);
    setSources([]);
    try {
      const data = await api.getEpisodeSources(
        item.title,
        item.tmdb_id,
        selectedSeason.season_number,
        selectedEpisode.episode_number,
        item.year,
        rdToken
      );
      setSources(data || []);
    } catch (err) {
      console.error('Load episode sources error:', err);
    }
    setSourcesLoading(false);
  };

  const handlePlaySource = async (source) => {
    if (!rdToken) {
      Alert.alert('Real-Debrid Required', 'Please connect your Real-Debrid account in Settings to stream content.');
      return;
    }
    
    if (!source.magnet) {
      Alert.alert('Error', 'No magnet link available for this source');
      return;
    }
    
    setSelectedSource(source);
    setPlaying(true);
    setError(null);
    setStreamData(null);
    
    try {
      console.log('Getting stream for:', source.title);
      console.log('Magnet:', source.magnet.substring(0, 60) + '...');
      
      const result = await rdApi.getStreamingLink(rdToken, source.magnet, item.title);
      console.log('Stream result:', result);
      
      if (result && result.download_url) {
        setStreamData(result);
        loadDownloads();
        // Auto-show success message
        Alert.alert(
          'Stream Ready!',
          'Choose a player to start watching:',
          [
            { text: 'VLC Player', onPress: () => Linking.openURL(result.vlc_link) },
            { text: 'MX Player', onPress: () => Linking.openURL(result.mx_link) },
            { text: 'Browser', onPress: () => Linking.openURL(result.download_url) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else if (result && result.status === 'processing') {
        setError('Torrent is downloading on Real-Debrid. This may take a few minutes for non-cached content. Try again shortly.');
      } else {
        setError('Failed to get streaming link. Try a different source.');
      }
    } catch (err) {
      console.error('Play error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to get streaming link';
      setError(errorMsg);
      Alert.alert('Playback Error', errorMsg);
    }
    
    setPlaying(false);
  };

  const handleDownload = async (source) => {
    if (!rdToken) {
      Alert.alert('Error', 'Please connect your Real-Debrid account first');
      return;
    }
    
    setDownloading(source.info_hash);
    try {
      const result = await rdApi.getStreamingLink(rdToken, source.magnet, item.title);
      if (result) {
        Alert.alert('Success', 'Added to Real-Debrid downloads');
        loadDownloads();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add download');
    }
    setDownloading(null);
  };

  const openInVLC = () => {
    if (streamData?.vlc_link) {
      Linking.openURL(streamData.vlc_link);
    }
  };

  const openInMX = () => {
    if (streamData?.mx_link) {
      Linking.openURL(streamData.mx_link);
    }
  };

  const openDirectLink = () => {
    if (streamData?.download_url) {
      Linking.openURL(streamData.download_url);
    }
  };

  const loadSubtitles = async (language = 'en') => {
    if (!item.tmdb_id) return;
    
    setSubtitlesLoading(true);
    try {
      const subs = await subtitleApi.search(
        item.tmdb_id,
        language,
        selectedSeason?.season_number,
        selectedEpisode?.episode_number
      );
      setSubtitles(subs);
      setShowSubtitleModal(true);
    } catch (err) {
      console.error('Load subtitles error:', err);
      Alert.alert('Error', 'Failed to load subtitles');
    }
    setSubtitlesLoading(false);
  };

  const downloadSubtitle = async (subtitle) => {
    try {
      const result = await subtitleApi.getDownloadUrl(subtitle.file_id);
      if (result?.download_url) {
        Linking.openURL(result.download_url);
        setSelectedSubtitle(subtitle);
        Alert.alert('Success', 'Subtitle download started');
      } else {
        Alert.alert('Error', 'Could not get download URL');
      }
    } catch (err) {
      console.error('Download subtitle error:', err);
      Alert.alert('Error', 'Failed to download subtitle');
    }
  };

  const displayData = details || item;
  const isItemFavorite = isFavorite(item);

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Backdrop */}
      <ImageBackground
        source={{ uri: displayData.backdrop || displayData.poster }}
        style={styles.backdrop}
      >
        <LinearGradient
          colors={['transparent', 'rgba(5,5,5,0.8)', '#050505']}
          style={styles.backdropGradient}
        />
      </ImageBackground>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.posterRow}>
          <Image
            source={{ uri: displayData.poster || 'https://via.placeholder.com/200x300' }}
            style={styles.poster}
            resizeMode="cover"
          />
          
          <View style={styles.info}>
            <Text style={styles.title}>{displayData.title}</Text>
            
            <View style={styles.metaRow}>
              {displayData.year && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{displayData.year}</Text>
                </View>
              )}
              {displayData.rating && (
                <View style={[styles.badge, styles.ratingBadge]}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>{displayData.rating?.toFixed(1)}</Text>
                </View>
              )}
            </View>

            {displayData.genres?.length > 0 && (
              <View style={styles.genres}>
                {displayData.genres.slice(0, 3).map((genre, i) => (
                  <View key={i} style={styles.genreBadge}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.iconButton, isItemFavorite && styles.favoriteActive]}
            onPress={() => addToFavorites(item)}
            hasTVPreferredFocus={isTV}
          >
            <Ionicons name={isItemFavorite ? "heart" : "heart-outline"} size={24} color={isItemFavorite ? "#EF4444" : "#E5E5E5"} />
          </TouchableOpacity>
          
          {displayData.trailer && (
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => Linking.openURL(displayData.trailer)}
            >
              <Ionicons name="logo-youtube" size={24} color="#FF0000" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => loadSubtitles('en')}
            disabled={subtitlesLoading}
          >
            {subtitlesLoading ? (
              <ActivityIndicator size="small" color="#D4AF37" />
            ) : (
              <Ionicons name="text" size={24} color="#D4AF37" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={isTVShow ? loadEpisodeSources : loadSources}
          >
            <Ionicons name="refresh" size={20} color="#D4AF37" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* TV Show Selector */}
        {isTVShow && details?.seasons?.length > 0 && (
          <View style={styles.tvSelector}>
            <TouchableOpacity style={styles.selectorButton} onPress={() => setShowSeasonModal(true)}>
              <Text style={styles.selectorLabel}>Season</Text>
              <Text style={styles.selectorValue}>{selectedSeason?.season_number || '-'}</Text>
              <Ionicons name="chevron-down" size={16} color="#D4AF37" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.selectorButton} onPress={() => setShowEpisodeModal(true)} disabled={!selectedSeason}>
              <Text style={styles.selectorLabel}>Episode</Text>
              <Text style={styles.selectorValue}>{selectedEpisode?.episode_number || '-'}</Text>
              <Ionicons name="chevron-down" size={16} color="#D4AF37" />
            </TouchableOpacity>
          </View>
        )}

        {/* Stream Ready */}
        {streamData && (
          <View style={styles.streamSection}>
            <View style={styles.streamHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              <Text style={styles.streamTitle}>Stream Ready!</Text>
            </View>
            <Text style={styles.streamFilename} numberOfLines={1}>{streamData.filename}</Text>
            
            <View style={styles.playerButtons}>
              <TouchableOpacity style={styles.vlcBtn} onPress={openInVLC}>
                <Text style={styles.playerBtnText}>VLC Player</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mxBtn} onPress={openInMX}>
                <Text style={styles.playerBtnText}>MX Player</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.directBtn} onPress={openDirectLink}>
              <Ionicons name="open-outline" size={18} color="#D4AF37" />
              <Text style={styles.directBtnText}>Open Direct Link</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Sources */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Real-Debrid Sources</Text>
            <Text style={styles.sourceCount}>{sources.length} found</Text>
          </View>
          
          {sourcesLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text style={styles.loadingText}>Searching torrents...</Text>
            </View>
          ) : sources.length > 0 ? (
            <View style={styles.sourcesList}>
              {sources.map((source, index) => (
                <View
                  key={source.info_hash || index}
                  style={[styles.sourceItem, source.is_cached && styles.sourceItemCached]}
                >
                  <TouchableOpacity
                    style={styles.sourceMain}
                    onPress={() => handlePlaySource(source)}
                    disabled={playing}
                    hasTVPreferredFocus={isTV && index === 0}
                  >
                    <View style={styles.sourceLeft}>
                      <View style={[
                        styles.qualityBadge,
                        source.quality === '4K' && styles.q4K,
                        source.quality === '1080p' && styles.q1080,
                        source.quality === '720p' && styles.q720,
                      ]}>
                        <Text style={styles.qualityText}>{source.quality}</Text>
                      </View>
                      {source.is_cached && (
                        <View style={styles.cachedBadge}>
                          <Ionicons name="flash" size={10} color="#050505" />
                          <Text style={styles.cachedText}>INSTANT</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.sourceMiddle}>
                      <Text style={styles.sourceTitle} numberOfLines={1}>{source.title}</Text>
                      <Text style={styles.sourceMeta}>
                        {source.size} • {source.seeds} seeds • {source.source}
                      </Text>
                    </View>
                    
                    {selectedSource?.info_hash === source.info_hash && playing ? (
                      <ActivityIndicator size="small" color="#D4AF37" />
                    ) : (
                      <Ionicons name="play-circle" size={32} color={source.is_cached ? "#D4AF37" : "#A1A1AA"} />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleDownload(source)}
                    disabled={downloading === source.info_hash}
                  >
                    {downloading === source.info_hash ? (
                      <ActivityIndicator size="small" color="#D4AF37" />
                    ) : (
                      <Ionicons name="download" size={22} color="#D4AF37" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="cloud-offline-outline" size={48} color="#27272A" />
              <Text style={styles.emptyText}>No torrents found</Text>
            </View>
          )}
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overview}>{displayData.overview || 'No description available.'}</Text>
        </View>

        <View style={{ height: 100 }} />
      </View>

      {/* Season Modal */}
      <Modal visible={showSeasonModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Season</Text>
              <TouchableOpacity onPress={() => setShowSeasonModal(false)}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {details?.seasons?.map((s) => (
                <TouchableOpacity
                  key={s.season_number}
                  style={[styles.modalItem, selectedSeason?.season_number === s.season_number && styles.modalItemActive]}
                  onPress={() => { setSelectedSeason(s); setSelectedEpisode(null); setShowSeasonModal(false); }}
                >
                  <Text style={styles.modalItemText}>Season {s.season_number} ({s.episode_count} eps)</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Episode Modal */}
      <Modal visible={showEpisodeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Episode</Text>
              <TouchableOpacity onPress={() => setShowEpisodeModal(false)}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {episodes.map((ep) => (
                <TouchableOpacity
                  key={ep.episode_number}
                  style={[styles.modalItem, selectedEpisode?.episode_number === ep.episode_number && styles.modalItemActive]}
                  onPress={() => { setSelectedEpisode(ep); setShowEpisodeModal(false); }}
                >
                  <Text style={styles.modalItemText}>E{ep.episode_number}: {ep.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subtitle Modal */}
      <Modal visible={showSubtitleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Subtitles</Text>
              <TouchableOpacity onPress={() => setShowSubtitleModal(false)}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.subtitleOptions}>
              <Text style={styles.subtitleLabel}>Choose subtitle source:</Text>
              
              {/* Embedded Subtitles Option */}
              <TouchableOpacity 
                style={styles.subtitleOptionCard}
                onPress={() => {
                  Alert.alert(
                    'Embedded Subtitles',
                    'Most torrents include embedded subtitles. To enable them:\n\n' +
                    'VLC Player:\n• Tap screen > Subtitle icon > Select track\n\n' +
                    'MX Player:\n• Tap screen > Menu > Subtitles > Select\n\n' +
                    'If embedded subs are not available, try OpenSubtitles.',
                    [{ text: 'Got it' }]
                  );
                }}
              >
                <View style={styles.subtitleOptionIcon}>
                  <Ionicons name="film" size={28} color="#D4AF37" />
                </View>
                <View style={styles.subtitleOptionInfo}>
                  <Text style={styles.subtitleOptionTitle}>Embedded Subtitles</Text>
                  <Text style={styles.subtitleOptionDesc}>Use subtitles included in the video file</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#71717A" />
              </TouchableOpacity>

              {/* OpenSubtitles Option */}
              <TouchableOpacity 
                style={styles.subtitleOptionCard}
                onPress={() => {
                  Linking.openURL(`https://www.opensubtitles.org/en/search/sublanguageid-eng/moviename-${encodeURIComponent(item.title || '')}`);
                }}
              >
                <View style={styles.subtitleOptionIcon}>
                  <Ionicons name="cloud-download" size={28} color="#22C55E" />
                </View>
                <View style={styles.subtitleOptionInfo}>
                  <Text style={styles.subtitleOptionTitle}>OpenSubtitles</Text>
                  <Text style={styles.subtitleOptionDesc}>Download from opensubtitles.org</Text>
                </View>
                <Ionicons name="open-outline" size={20} color="#71717A" />
              </TouchableOpacity>

              {/* Subscene Option */}
              <TouchableOpacity 
                style={styles.subtitleOptionCard}
                onPress={() => {
                  Linking.openURL(`https://subscene.com/subtitles/searchbytitle?query=${encodeURIComponent(item.title || '')}`);
                }}
              >
                <View style={styles.subtitleOptionIcon}>
                  <Ionicons name="globe" size={28} color="#3B82F6" />
                </View>
                <View style={styles.subtitleOptionInfo}>
                  <Text style={styles.subtitleOptionTitle}>Subscene</Text>
                  <Text style={styles.subtitleOptionDesc}>Download from subscene.com</Text>
                </View>
                <Ionicons name="open-outline" size={20} color="#71717A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitleTip}>
              Tip: Download .srt files to your device, then load them in your video player
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  backdrop: { width, height: height * 0.35 },
  backdropGradient: { flex: 1 },
  content: { marginTop: -80, padding: 16 },
  posterRow: { flexDirection: 'row', gap: 16 },
  poster: { width: 120, height: 180, borderRadius: 8 },
  info: { flex: 1, justifyContent: 'flex-end' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#E5E5E5', marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4 },
  badgeText: { color: '#A1A1AA', fontSize: 11 },
  ratingBadge: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  ratingText: { color: '#F59E0B', fontSize: 11, fontWeight: '600' },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  genreBadge: { backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  genreText: { color: '#D4AF37', fontSize: 10 },
  actions: { flexDirection: 'row', gap: 12, marginVertical: 16 },
  iconButton: { width: 48, height: 48, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  favoriteActive: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  refreshButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: 8, gap: 8, height: 48 },
  refreshText: { color: '#D4AF37', fontSize: 14, fontWeight: '600' },
  tvSelector: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  selectorButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#121212', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#27272A' },
  selectorLabel: { color: '#71717A', fontSize: 12 },
  selectorValue: { color: '#D4AF37', fontSize: 16, fontWeight: '600' },
  streamSection: { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#22C55E' },
  streamHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  streamTitle: { color: '#22C55E', fontSize: 18, fontWeight: '600' },
  streamFilename: { color: '#A1A1AA', fontSize: 12, marginBottom: 12 },
  playerButtons: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  vlcBtn: { flex: 1, backgroundColor: '#FF5722', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  mxBtn: { flex: 1, backgroundColor: '#2196F3', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  playerBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  directBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  directBtnText: { color: '#D4AF37', fontSize: 14 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, padding: 16, marginBottom: 16, gap: 12 },
  errorText: { flex: 1, color: '#EF4444', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  sourceCount: { color: '#A1A1AA', fontSize: 12 },
  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: '#A1A1AA', fontSize: 14 },
  sourcesList: { gap: 10 },
  sourceItem: { flexDirection: 'row', backgroundColor: '#121212', borderRadius: 10, borderWidth: 1, borderColor: '#27272A', overflow: 'hidden' },
  sourceItemCached: { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: '#D4AF37' },
  sourceMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  sourceLeft: { gap: 4 },
  qualityBadge: { backgroundColor: '#27272A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, minWidth: 50, alignItems: 'center' },
  q4K: { backgroundColor: '#7C3AED' },
  q1080: { backgroundColor: '#2563EB' },
  q720: { backgroundColor: '#059669' },
  qualityText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  cachedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D4AF37', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 2 },
  cachedText: { color: '#050505', fontSize: 8, fontWeight: 'bold' },
  sourceMiddle: { flex: 1 },
  sourceTitle: { color: '#E5E5E5', fontSize: 12, marginBottom: 4 },
  sourceMeta: { color: '#71717A', fontSize: 10 },
  downloadBtn: { width: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderLeftWidth: 1, borderLeftColor: '#27272A' },
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: '#A1A1AA', fontSize: 14 },
  overview: { color: '#A1A1AA', fontSize: 14, lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#121212', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: height * 0.6, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  modalItem: { padding: 16, borderRadius: 8, marginBottom: 4 },
  modalItemActive: { backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  modalItemText: { color: '#E5E5E5', fontSize: 14 },
  // Subtitle styles
  subtitleOptions: { marginBottom: 16 },
  subtitleLabel: { color: '#A1A1AA', fontSize: 14, marginBottom: 12 },
  subtitleOptionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#27272A' },
  subtitleOptionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(212, 175, 55, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  subtitleOptionInfo: { flex: 1 },
  subtitleOptionTitle: { color: '#E5E5E5', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  subtitleOptionDesc: { color: '#71717A', fontSize: 12 },
  subtitleTip: { color: '#71717A', fontSize: 12, textAlign: 'center', marginTop: 8, paddingHorizontal: 16 },
});
