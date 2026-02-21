import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api, traktApi } from '../services/api';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 3;
const ITEMS_PER_PAGE = 60;

export default function CategoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { category, title, genreId, mediaType, traktLibrary } = route.params;
  const { traktToken } = useApp();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadContent(1, true);
  }, [category, genreId, traktLibrary]);

  const loadTraktLibrary = async () => {
    if (!traktToken) return [];
    
    try {
      let data = [];
      const [libraryType, contentType] = traktLibrary.split('_');
      const type = contentType === 'movies' ? 'movies' : 'shows';
      
      switch (libraryType) {
        case 'watchlist':
          data = await traktApi.getWatchlist(traktToken, type);
          break;
        case 'collection':
          data = await traktApi.getCollection(traktToken, type);
          break;
        case 'watched':
          data = await traktApi.getWatched(traktToken, type);
          break;
        case 'recommendations':
          data = await traktApi.getRecommendations(traktToken, type);
          break;
      }
      
      // Transform Trakt data to our format and fetch TMDB info
      const formatted = await Promise.all(
        data.slice(0, 60).map(async (item) => {
          const traktItem = item.movie || item.show || item;
          const tmdbId = traktItem?.ids?.tmdb;
          const itemType = contentType === 'movies' ? 'movie' : 'tv';
          
          if (!tmdbId) return null;
          
          try {
            const details = await api.getContentDetails(itemType, tmdbId);
            return {
              tmdb_id: tmdbId,
              title: traktItem.title,
              year: traktItem.year?.toString(),
              poster: details?.poster,
              backdrop: details?.backdrop,
              overview: details?.overview,
              rating: details?.rating,
              type: itemType,
            };
          } catch (err) {
            return {
              tmdb_id: tmdbId,
              title: traktItem.title,
              year: traktItem.year?.toString(),
              type: itemType,
            };
          }
        })
      );
      
      return formatted.filter(Boolean);
    } catch (error) {
      console.error('Load Trakt library error:', error);
      return [];
    }
  };

  const loadContent = async (pageNum = 1, reset = false) => {
    if (reset) {
      setLoading(true);
      setItems([]);
    } else {
      setLoadingMore(true);
    }
    
    try {
      let data = [];
      
      if (traktLibrary) {
        // Load Trakt library content
        data = await loadTraktLibrary();
        setHasMore(false); // Trakt doesn't paginate the same way
      } else if (genreId) {
        // Load by genre with pagination
        data = await api.getByGenre(mediaType, genreId, pageNum);
      } else {
        // Load by category
        const limit = ITEMS_PER_PAGE;
        switch (category) {
          case 'trending':
            data = await api.getTrending('all', limit);
            break;
          case 'popular_movies':
            data = await api.getPopular('movie', limit, pageNum);
            break;
          case 'popular_tv':
            data = await api.getPopular('tv', limit, pageNum);
            break;
          case 'new_movies':
            data = await api.getNewReleases('movie', limit);
            break;
          case 'new_tv':
            data = await api.getNewReleases('tv', limit);
            break;
          case 'in_cinema':
            data = await api.getInCinema(limit);
            break;
          default:
            data = await api.getTrending('all', limit);
        }
      }
      
      if (reset) {
        setItems(data);
      } else {
        setItems(prev => [...prev, ...data]);
      }
      
      if (!traktLibrary) {
        setHasMore(data.length >= 20);
      }
      setPage(pageNum);
    } catch (error) {
      console.error('Load content error:', error);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadContent(page + 1, false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ContentDetail', { item })}
    >
      <Image
        source={{ 
          uri: item.poster || 'https://via.placeholder.com/200x300' 
        }}
        style={styles.poster}
        resizeMode="cover"
      />
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardMeta}>
          {item.year && <Text style={styles.cardYear}>{item.year}</Text>}
          {item.rating && (
            <View style={styles.cardRating}>
              <Ionicons name="star" size={10} color="#F59E0B" />
              <Text style={styles.cardRatingText}>{item.rating?.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#D4AF37" />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#D4AF37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.itemCount}>{items.length} items</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.tmdb_id || item.title}-${index}`}
          numColumns={3}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemCount: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    padding: 12,
  },
  card: {
    width: CARD_WIDTH,
    aspectRatio: 2/3,
    margin: 6,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#121212',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    backgroundColor: 'rgba(5,5,5,0.85)',
  },
  cardTitle: {
    color: '#E5E5E5',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardYear: {
    color: '#A1A1AA',
    fontSize: 9,
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cardRatingText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '600',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    color: '#A1A1AA',
    fontSize: 12,
  },
});
