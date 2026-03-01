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
  Linking,
  Dimensions,
  Platform,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { sportsApi } from '../services/api';

const { width, height } = Dimensions.get('window');
const isTV = Platform.isTV;

export default function SportsScreen() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [focusedCategory, setFocusedCategory] = useState(null);
  const [focusedStream, setFocusedStream] = useState(null);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [currentStream, setCurrentStream] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await sportsApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Load categories error:', error);
    }
    setLoading(false);
  };

  const selectCategory = async (category) => {
    setSelectedCategory(category);
    setStreamsLoading(true);
    setStreams([]);
    
    try {
      const data = await sportsApi.getStreams(category.id);
      setStreams(data.streams || []);
    } catch (error) {
      console.error('Load streams error:', error);
    }
    setStreamsLoading(false);
  };

  const openStream = async (stream) => {
    try {
      // Get stream links from backend
      const streamData = await sportsApi.getStreamLinks(stream.stream_id);
      
      if (streamData && streamData.streams && streamData.streams.length > 0) {
        // Found direct streams - play first m3u8 in external player
        const m3u8Stream = streamData.streams.find(s => s.type === 'm3u8');
        if (m3u8Stream) {
          // Open in external video player
          Linking.openURL(m3u8Stream.url);
          return;
        }
      }
      
      // Fallback - open in WebView player
      setCurrentStream({
        ...stream,
        playUrl: streamData?.web_fallback || stream.url,
      });
      setPlayerVisible(true);
    } catch (error) {
      console.error('Stream error:', error);
      // Fallback to WebView
      setCurrentStream(stream);
      setPlayerVisible(true);
    }
  };

  const closePlayer = () => {
    setPlayerVisible(false);
    setCurrentStream(null);
  };

  const openInBrowser = () => {
    if (currentStream) {
      Linking.openURL(currentStream.playUrl || currentStream.url);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    if (selectedCategory) {
      await selectCategory(selectedCategory);
    }
    setRefreshing(false);
  };

  const renderCategory = ({ item }) => {
    const isFocused = focusedCategory === item.id;
    const isSelected = selectedCategory?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          isSelected && styles.categoryCardActive,
          isFocused && styles.categoryCardFocused
        ]}
        onPress={() => selectCategory(item)}
        onFocus={() => setFocusedCategory(item.id)}
        onBlur={() => setFocusedCategory(null)}
      >
        <Ionicons name={item.icon} size={isTV ? 32 : 28} color={isSelected ? '#050505' : '#D4AF37'} />
        <Text style={[styles.categoryName, isSelected && styles.categoryNameActive]} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStream = ({ item, index }) => {
    const isFocused = focusedStream === index;
    
    return (
      <TouchableOpacity 
        style={[styles.streamCard, isFocused && styles.streamCardFocused]} 
        onPress={() => openStream(item)}
        onFocus={() => setFocusedStream(index)}
        onBlur={() => setFocusedStream(null)}
      >
        <View style={styles.streamInfo}>
          <View style={styles.streamHeader}>
            {item.is_live && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            {item.time && (
              <Text style={styles.streamTime}>{item.time}</Text>
            )}
          </View>
          <Text style={[styles.streamTitle, isTV && styles.streamTitleTV]} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
        <View style={styles.playButton}>
          <Ionicons name="play" size={isTV ? 28 : 24} color="#D4AF37" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isTV && styles.headerTV]}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={isTV ? 32 : 26} color="#D4AF37" />
        </TouchableOpacity>
        <Image 
          source={require('../../assets/icon.png')} 
          style={[styles.logo, isTV && styles.logoTV]}
          resizeMode="contain"
        />
        <Text style={[styles.headerTitle, isTV && styles.headerTitleTV]}>Live Sports</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
          }
        >
          {/* Categories */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isTV && styles.sectionTitleTV]}>Sports Categories</Text>
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.categoriesRow, isTV && styles.categoriesRowTV]}
            />
          </View>

          {/* Streams */}
          {selectedCategory && (
            <View style={styles.section}>
              <View style={styles.streamsHeader}>
                <Ionicons name={selectedCategory.icon} size={isTV ? 24 : 20} color="#D4AF37" />
                <Text style={[styles.sectionTitle, isTV && styles.sectionTitleTV]}>{selectedCategory.name}</Text>
                <TouchableOpacity onPress={() => { setSelectedCategory(null); setStreams([]); }}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              
              {streamsLoading ? (
                <View style={styles.loadingStreams}>
                  <ActivityIndicator size="small" color="#D4AF37" />
                  <Text style={styles.loadingText}>Loading streams...</Text>
                </View>
              ) : streams.length > 0 ? (
                streams.map((item, index) => (
                  <View key={item.id || index}>
                    {renderStream({ item, index })}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color="#27272A" />
                  <Text style={styles.emptyText}>No live streams right now</Text>
                  <Text style={styles.emptyHint}>Check back closer to game time</Text>
                </View>
              )}
            </View>
          )}

          {/* Default State */}
          {!selectedCategory && (
            <View style={styles.defaultState}>
              <Ionicons name="tv-outline" size={64} color="#27272A" />
              <Text style={[styles.defaultTitle, isTV && styles.defaultTitleTV]}>Select a Sport</Text>
              <Text style={[styles.defaultText, isTV && styles.defaultTextTV]}>
                Choose from the categories above to see live and upcoming streams
              </Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* WebView Player Modal */}
      <Modal
        visible={playerVisible}
        animationType="slide"
        onRequestClose={closePlayer}
      >
        <View style={styles.playerContainer}>
          <View style={styles.playerHeader}>
            <TouchableOpacity style={styles.playerCloseBtn} onPress={closePlayer}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.playerTitle} numberOfLines={1}>
              {currentStream?.title || 'Live Stream'}
            </Text>
            <TouchableOpacity style={styles.playerBrowserBtn} onPress={openInBrowser}>
              <Ionicons name="open-outline" size={24} color="#D4AF37" />
            </TouchableOpacity>
          </View>
          
          {currentStream && (
            <WebView
              source={{ uri: currentStream.playUrl || currentStream.url }}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo={true}
              allowsInlineMediaPlayback={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color="#D4AF37" />
                  <Text style={styles.webviewLoadingText}>Loading stream...</Text>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
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
  headerTV: {
    paddingTop: 24,
    paddingHorizontal: 40,
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
  logoTV: {
    width: 60,
    height: 60,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  headerTitleTV: {
    fontSize: 32,
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
  sectionTitleTV: {
    fontSize: 24,
  },
  categoriesRow: {
    paddingHorizontal: 12,
    gap: 12,
  },
  categoriesRowTV: {
    paddingHorizontal: 36,
    gap: 20,
  },
  categoryCard: {
    width: isTV ? 140 : 100,
    alignItems: 'center',
    padding: isTV ? 20 : 16,
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    marginHorizontal: 4,
    gap: 8,
  },
  categoryCardActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  categoryCardFocused: {
    borderColor: '#D4AF37',
    transform: [{ scale: 1.05 }],
  },
  categoryName: {
    color: '#E5E5E5',
    fontSize: isTV ? 14 : 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryNameActive: {
    color: '#050505',
  },
  streamsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  clearText: {
    color: '#D4AF37',
    fontSize: 14,
    marginLeft: 'auto',
  },
  streamCard: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  streamCardFocused: {
    borderColor: '#D4AF37',
    transform: [{ scale: 1.02 }],
  },
  streamInfo: {
    flex: 1,
    padding: isTV ? 20 : 16,
  },
  streamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  streamTime: {
    color: '#A1A1AA',
    fontSize: isTV ? 14 : 12,
  },
  streamTitle: {
    color: '#E5E5E5',
    fontSize: 15,
    fontWeight: '500',
  },
  streamTitleTV: {
    fontSize: 20,
  },
  playButton: {
    width: isTV ? 80 : 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  loadingStreams: {
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
    fontSize: 16,
  },
  emptyHint: {
    color: '#71717A',
    fontSize: 13,
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
  defaultTitleTV: {
    fontSize: 28,
  },
  defaultText: {
    color: '#71717A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  defaultTextTV: {
    fontSize: 18,
    lineHeight: 28,
  },
  // Player styles
  playerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#121212',
  },
  playerCloseBtn: {
    padding: 8,
  },
  playerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  playerBrowserBtn: {
    padding: 8,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  webviewLoadingText: {
    color: '#A1A1AA',
    marginTop: 16,
    fontSize: 14,
  },
});
