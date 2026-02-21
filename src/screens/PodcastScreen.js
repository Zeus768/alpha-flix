import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  TextInput,
  Linking,
  Dimensions,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { podcastApi } from '../services/api';

const { width } = Dimensions.get('window');

export default function PodcastScreen() {
  const navigation = useNavigation();
  const [podcasters, setPodcasters] = useState([]);
  const [selectedPodcaster, setSelectedPodcaster] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadPodcasters();
  }, []);

  const loadPodcasters = async () => {
    try {
      const data = await podcastApi.getPodcasters();
      setPodcasters(data);
    } catch (error) {
      console.error('Load podcasters error:', error);
    }
    setLoading(false);
  };

  const selectPodcaster = async (podcaster) => {
    setSelectedPodcaster(podcaster);
    setEpisodesLoading(true);
    setEpisodes([]);
    setSearchResults([]);
    setSearchQuery('');
    
    try {
      const data = await podcastApi.getEpisodes(podcaster.id);
      setEpisodes(data.episodes || []);
    } catch (error) {
      console.error('Load episodes error:', error);
    }
    setEpisodesLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setSelectedPodcaster(null);
    setEpisodes([]);
    
    try {
      const results = await podcastApi.search(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
    setSearching(false);
  };

  const openEpisode = (episode) => {
    Linking.openURL(episode.youtube_url);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatViews = (views) => {
    if (!views) return '';
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(0)}K views`;
    }
    return `${views} views`;
  };

  const renderPodcaster = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.podcasterCard,
        selectedPodcaster?.id === item.id && styles.podcasterCardActive
      ]}
      onPress={() => selectPodcaster(item)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.podcasterImage}
      />
      <Text style={styles.podcasterName} numberOfLines={2}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderEpisode = ({ item }) => (
    <TouchableOpacity style={styles.episodeCard} onPress={() => openEpisode(item)}>
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.episodeThumbnail}
      />
      <View style={styles.episodeInfo}>
        <Text style={styles.episodeTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.episodeMeta}>
          {item.duration > 0 && (
            <Text style={styles.episodeMetaText}>{formatDuration(item.duration)}</Text>
          )}
          {item.views > 0 && (
            <Text style={styles.episodeMetaText}>{formatViews(item.views)}</Text>
          )}
        </View>
      </View>
      <View style={styles.playButton}>
        <Ionicons name="play" size={20} color="#D4AF37" />
      </View>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity style={styles.episodeCard} onPress={() => openEpisode(item)}>
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.episodeThumbnail}
      />
      <View style={styles.episodeInfo}>
        <Text style={styles.episodeTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.channelName} numberOfLines={1}>{item.channel}</Text>
        <View style={styles.episodeMeta}>
          {item.duration > 0 && (
            <Text style={styles.episodeMetaText}>{formatDuration(item.duration)}</Text>
          )}
          {item.views > 0 && (
            <Text style={styles.episodeMetaText}>{formatViews(item.views)}</Text>
          )}
        </View>
      </View>
      <View style={styles.playButton}>
        <Ionicons name="play" size={20} color="#D4AF37" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={26} color="#D4AF37" />
        </TouchableOpacity>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>Podcasts</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#71717A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search podcasts..."
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
              <Ionicons name="close-circle" size={20} color="#71717A" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Podcasters Row */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Podcasters</Text>
            <FlatList
              data={podcasters}
              renderItem={renderPodcaster}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.podcastersRow}
            />
          </View>

          {/* Search Results */}
          {searching && (
            <View style={styles.loadingEpisodes}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {searchResults.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              {searchResults.map((item, index) => (
                <View key={item.id || index}>
                  {renderSearchResult({ item })}
                </View>
              ))}
            </View>
          )}

          {/* Episodes */}
          {selectedPodcaster && (
            <View style={styles.section}>
              <View style={styles.episodesHeader}>
                <Text style={styles.sectionTitle}>{selectedPodcaster.name}</Text>
                <TouchableOpacity onPress={() => { setSelectedPodcaster(null); setEpisodes([]); }}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              
              {episodesLoading ? (
                <View style={styles.loadingEpisodes}>
                  <ActivityIndicator size="small" color="#D4AF37" />
                  <Text style={styles.loadingText}>Loading episodes...</Text>
                </View>
              ) : episodes.length > 0 ? (
                episodes.map((item, index) => (
                  <View key={item.id || index}>
                    {renderEpisode({ item })}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="mic-off-outline" size={48} color="#27272A" />
                  <Text style={styles.emptyText}>No episodes found</Text>
                </View>
              )}
            </View>
          )}

          {/* Default State */}
          {!selectedPodcaster && searchResults.length === 0 && !searching && (
            <View style={styles.defaultState}>
              <Ionicons name="mic-outline" size={64} color="#27272A" />
              <Text style={styles.defaultTitle}>Select a Podcaster</Text>
              <Text style={styles.defaultText}>
                Choose from popular podcasters above or search for any podcast episode
              </Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
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
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#27272A',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#E5E5E5',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  podcastersRow: {
    paddingHorizontal: 12,
    gap: 12,
  },
  podcasterCard: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    marginHorizontal: 4,
  },
  podcasterCardActive: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  podcasterImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  podcasterName: {
    color: '#E5E5E5',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  episodesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
  },
  clearText: {
    color: '#D4AF37',
    fontSize: 14,
  },
  episodeCard: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  episodeThumbnail: {
    width: 120,
    height: 80,
  },
  episodeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  episodeTitle: {
    color: '#E5E5E5',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  channelName: {
    color: '#D4AF37',
    fontSize: 11,
    marginBottom: 4,
  },
  episodeMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  episodeMetaText: {
    color: '#71717A',
    fontSize: 11,
  },
  playButton: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  loadingEpisodes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  defaultState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 16,
  },
  defaultTitle: {
    color: '#E5E5E5',
    fontSize: 20,
    fontWeight: '600',
  },
  defaultText: {
    color: '#71717A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
