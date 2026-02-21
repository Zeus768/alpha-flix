import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ImageBackground,
  Platform,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { api, traktApi } from '../services/api';
import ContentCard from '../components/ContentCard';
import ContentRow from '../components/ContentRow';

const { width, height } = Dimensions.get('window');
const isTV = Platform.isTV;

// Hero Section Component with TV focus support
function HeroSection({ featured, navigation, isTV }) {
  const [playFocused, setPlayFocused] = useState(false);
  const [infoFocused, setInfoFocused] = useState(false);

  return (
    <View style={[styles.hero, isTV && styles.heroTV]}>
      <ImageBackground 
        source={{ uri: featured.backdrop || featured.poster }}
        style={[styles.heroImage, isTV && styles.heroImageTV]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(5,5,5,0.8)', '#050505']}
          style={styles.heroGradient}
        >
          <View style={[styles.heroContent, isTV && styles.heroContentTV]}>
            <Text style={[styles.heroTitle, isTV && styles.heroTitleTV]}>{featured.title}</Text>
            <View style={styles.heroMeta}>
              {featured.year && <Text style={[styles.heroYear, isTV && styles.heroYearTV]}>{featured.year}</Text>}
              {featured.rating && (
                <View style={styles.heroRating}>
                  <Ionicons name="star" size={isTV ? 18 : 14} color="#F59E0B" />
                  <Text style={[styles.heroRatingText, isTV && styles.heroRatingTextTV]}>{featured.rating?.toFixed(1)}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.heroOverview, isTV && styles.heroOverviewTV]} numberOfLines={2}>
              {featured.overview}
            </Text>
            <View style={styles.heroButtons}>
              <TouchableOpacity 
                style={[styles.playButton, isTV && styles.playButtonTV, playFocused && styles.buttonFocused]}
                onPress={() => navigation.navigate('ContentDetail', { item: featured })}
                onFocus={() => setPlayFocused(true)}
                onBlur={() => setPlayFocused(false)}
              >
                <Ionicons name="play" size={isTV ? 28 : 20} color="#050505" />
                <Text style={[styles.playButtonText, isTV && styles.playButtonTextTV]}>Play</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.infoButton, isTV && styles.infoButtonTV, infoFocused && styles.buttonFocused]}
                onPress={() => navigation.navigate('ContentDetail', { item: featured })}
                onFocus={() => setInfoFocused(true)}
                onBlur={() => setInfoFocused(false)}
              >
                <Ionicons name="information-circle-outline" size={isTV ? 28 : 20} color="#E5E5E5" />
                <Text style={[styles.infoButtonText, isTV && styles.infoButtonTextTV]}>Info</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { rdUser, traktToken } = useApp();
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [newMovies, setNewMovies] = useState([]);
  const [newTV, setNewTV] = useState([]);
  const [inCinema, setInCinema] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuFocused, setMenuFocused] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    if (traktToken) {
      loadContinueWatching();
    }
  }, [traktToken]);

  const loadContinueWatching = async () => {
    if (!traktToken) return;
    try {
      const playbackData = await traktApi.getPlayback(traktToken);
      // Transform Trakt playback data to our format and fetch TMDB info
      const formatted = await Promise.all(
        playbackData.slice(0, 20).map(async (item) => {
          const mediaType = item.type === 'episode' ? 'tv' : 'movie';
          const traktItem = item.movie || item.show;
          const tmdbId = traktItem?.ids?.tmdb;
          
          if (!tmdbId) return null;
          
          try {
            // Get poster from TMDB
            const details = await api.getContentDetails(mediaType, tmdbId);
            return {
              tmdb_id: tmdbId,
              title: traktItem.title,
              year: traktItem.year?.toString(),
              poster: details?.poster,
              backdrop: details?.backdrop,
              overview: details?.overview,
              rating: details?.rating,
              type: mediaType,
              progress: item.progress,
              paused_at: item.paused_at,
            };
          } catch (err) {
            return null;
          }
        })
      );
      setContinueWatching(formatted.filter(Boolean));
    } catch (error) {
      console.error('Load continue watching error:', error);
    }
  };

  const loadContent = async () => {
    try {
      console.log('[HomeScreen] Loading content...');
      const [trendingRes, popMoviesRes, popTVRes, newMoviesRes, newTVRes, inCinemaRes] = await Promise.all([
        api.getTrending('all', 50).catch(e => { console.error('Trending error:', e); return []; }),
        api.getPopular('movie', 50).catch(e => { console.error('Popular movies error:', e); return []; }),
        api.getPopular('tv', 50).catch(e => { console.error('Popular TV error:', e); return []; }),
        api.getNewReleases('movie', 50).catch(e => { console.error('New movies error:', e); return []; }),
        api.getNewReleases('tv', 50).catch(e => { console.error('New TV error:', e); return []; }),
        api.getInCinema(50).catch(e => { console.error('In cinema error:', e); return []; }),
      ]);
      
      console.log('[HomeScreen] Loaded:', {
        trending: trendingRes?.length,
        popMovies: popMoviesRes?.length,
        popTV: popTVRes?.length,
      });
      
      setTrending(trendingRes || []);
      setPopularMovies(popMoviesRes || []);
      setPopularTV(popTVRes || []);
      setNewMovies(newMoviesRes || []);
      setNewTV(newTVRes || []);
      setInCinema(inCinemaRes || []);
    } catch (error) {
      console.error('Load content error:', error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadContent();
    if (traktToken) {
      loadContinueWatching();
    }
  };

  const featured = trending[0];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
      }
    >
      {/* Header */}
      <View style={[styles.header, isTV && styles.headerTV]}>
        <TouchableOpacity 
          style={[styles.menuButton, menuFocused && styles.menuButtonFocused]}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          onFocus={() => setMenuFocused(true)}
          onBlur={() => setMenuFocused(false)}
          hasTVPreferredFocus={isTV}
        >
          <Ionicons name="menu" size={isTV ? 32 : 26} color="#D4AF37" />
        </TouchableOpacity>
        <Image 
          source={require('../../assets/icon.png')} 
          style={[styles.logo, isTV && styles.logoTV]}
          resizeMode="contain"
        />
        <View style={styles.headerRight}>
          <View style={[styles.premiumBadge, isTV && styles.premiumBadgeTV]}>
            <View style={styles.premiumDot} />
            <Text style={[styles.premiumText, isTV && styles.premiumTextTV]}>Premium</Text>
          </View>
        </View>
      </View>

      {/* Hero */}
      {featured && (
        <HeroSection featured={featured} navigation={navigation} isTV={isTV} />
      )}

      {/* Content Rows */}
      {traktToken && continueWatching.length > 0 && (
        <ContentRow title="Continue Watching" icon="play-forward" items={continueWatching} category="continue_watching" showProgress />
      )}
      <ContentRow title="Trending Now" icon="flame" items={trending} category="trending" />
      <ContentRow title="In Cinema" icon="videocam" items={inCinema} category="in_cinema" />
      <ContentRow title="Popular Movies" icon="film" items={popularMovies} category="popular_movies" />
      <ContentRow title="Popular TV Shows" icon="tv" items={popularTV} category="popular_tv" />
      <ContentRow title="Now Playing" icon="play-circle" items={newMovies} category="new_movies" />
      <ContentRow title="Airing Today" icon="today" items={newTV} category="new_tv" />

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    gap: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  premiumDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  premiumText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
  },
  hero: {
    height: 450,
    marginBottom: 16,
  },
  heroImage: {
    flex: 1,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E5E5E5',
    marginBottom: 8,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  heroYear: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  heroRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroRatingText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
  },
  heroOverview: {
    color: '#A1A1AA',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  playButtonText: {
    color: '#050505',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  infoButtonText: {
    color: '#E5E5E5',
    fontWeight: '600',
    fontSize: 16,
  },
  // TV-specific styles
  headerTV: {
    paddingTop: 24,
    paddingHorizontal: 40,
  },
  menuButtonFocused: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  logoTV: {
    width: 60,
    height: 60,
  },
  premiumBadgeTV: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  premiumTextTV: {
    fontSize: 16,
  },
  heroTV: {
    height: 500,
  },
  heroImageTV: {
    flex: 1,
  },
  heroContentTV: {
    padding: 40,
    paddingBottom: 60,
  },
  heroTitleTV: {
    fontSize: 42,
  },
  heroYearTV: {
    fontSize: 18,
  },
  heroRatingTextTV: {
    fontSize: 18,
  },
  heroOverviewTV: {
    fontSize: 18,
    lineHeight: 26,
    maxWidth: 600,
  },
  playButtonTV: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  playButtonTextTV: {
    fontSize: 20,
  },
  infoButtonTV: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  infoButtonTextTV: {
    fontSize: 20,
  },
  buttonFocused: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
});
