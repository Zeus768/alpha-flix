import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOVIE_GENRES, TV_GENRES } from '../services/api';
import { useApp } from '../context/AppContext';

const isTV = Platform.isTV;

// Focusable Menu Item for TV
function FocusableMenuItem({ icon, text, onPress, isActive, hasTVPreferredFocus }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TouchableOpacity 
      style={[
        styles.menuItem, 
        isActive && styles.menuItemActive,
        isFocused && styles.menuItemFocused
      ]}
      onPress={onPress}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
    >
      <Ionicons name={icon} size={isTV ? 26 : 22} color="#D4AF37" />
      <Text style={[styles.menuText, isTV && styles.menuTextTV]}>{text}</Text>
    </TouchableOpacity>
  );
}

export default function CustomDrawer(props) {
  const { rdUser, traktToken, traktUser } = useApp();
  const [moviesExpanded, setMoviesExpanded] = useState(false);
  const [tvExpanded, setTvExpanded] = useState(false);
  const [libraryExpanded, setLibraryExpanded] = useState(false);

  const navigateToGenre = (genre, mediaType) => {
    props.navigation.navigate('Category', {
      genreId: genre.id,
      mediaType: mediaType,
      title: `${genre.name} ${mediaType === 'movie' ? 'Movies' : 'TV Shows'}`,
    });
    props.navigation.closeDrawer();
  };

  const navigateToScreen = (screenName) => {
    props.navigation.navigate(screenName);
    props.navigation.closeDrawer();
  };

  const navigateToTraktLibrary = (type, title) => {
    props.navigation.navigate('Category', {
      traktLibrary: type,
      title: title,
    });
    props.navigation.closeDrawer();
  };

  return (
    <View style={[styles.container, isTV && styles.containerTV]}>
      {/* Header */}
      <View style={[styles.header, isTV && styles.headerTV]}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={[styles.logo, isTV && styles.logoTV]}
          resizeMode="contain"
        />
        <View style={styles.headerText}>
          <Text style={[styles.appName, isTV && styles.appNameTV]}>ALPHA FLIX</Text>
          <Text style={[styles.userName, isTV && styles.userNameTV]}>{rdUser?.username || 'Premium'}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Home */}
        <FocusableMenuItem 
          icon="home" 
          text="Home" 
          onPress={() => navigateToScreen('HomeTab')}
          hasTVPreferredFocus={isTV}
        />

        {/* Trakt Library Section - Only show if Trakt is connected */}
        {traktToken && (
          <>
            <View style={styles.divider} />
            <Text style={[styles.sectionTitle, isTV && styles.sectionTitleTV]}>TRAKT LIBRARY</Text>

            <FocusableMenuItem 
              icon="library" 
              text="My Library" 
              onPress={() => setLibraryExpanded(!libraryExpanded)}
            />

            {libraryExpanded && (
              <View style={styles.subMenu}>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => navigateToTraktLibrary('watchlist_movies', 'Watchlist - Movies')}
                >
                  <View style={styles.genreDot} />
                  <Text style={styles.subMenuText}>Watchlist - Movies</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => navigateToTraktLibrary('watchlist_shows', 'Watchlist - TV Shows')}
                >
                  <View style={styles.genreDot} />
                  <Text style={styles.subMenuText}>Watchlist - TV Shows</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => navigateToTraktLibrary('collection_movies', 'Collection - Movies')}
                >
                  <View style={styles.genreDot} />
                  <Text style={styles.subMenuText}>Collection - Movies</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => navigateToTraktLibrary('collection_shows', 'Collection - TV Shows')}
                >
                  <View style={styles.genreDot} />
                  <Text style={styles.subMenuText}>Collection - TV Shows</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => navigateToTraktLibrary('watched_movies', 'Watched - Movies')}
                >
                  <View style={styles.genreDot} />
                  <Text style={styles.subMenuText}>Watched - Movies</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => navigateToTraktLibrary('watched_shows', 'Watched - TV Shows')}
                >
                  <View style={styles.genreDot} />
                  <Text style={styles.subMenuText}>Watched - TV Shows</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => navigateToTraktLibrary('recommendations_movies', 'Recommended - Movies')}
                >
                  <View style={styles.genreDot} />
                  <Text style={styles.subMenuText}>Recommended - Movies</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => navigateToTraktLibrary('recommendations_shows', 'Recommended - TV Shows')}
                >
                  <View style={styles.genreDot} />
                  <Text style={styles.subMenuText}>Recommended - TV Shows</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Divider */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>GENRES</Text>

        {/* Movies Section */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => setMoviesExpanded(!moviesExpanded)}
        >
          <Ionicons name="film" size={22} color="#D4AF37" />
          <Text style={styles.menuText}>Movies</Text>
          <Ionicons 
            name={moviesExpanded ? "chevron-up" : "chevron-down"} 
            size={18} 
            color="#A1A1AA" 
          />
        </TouchableOpacity>

        {moviesExpanded && (
          <View style={styles.subMenu}>
            {MOVIE_GENRES.map((genre) => (
              <TouchableOpacity
                key={genre.id}
                style={styles.subMenuItem}
                onPress={() => navigateToGenre(genre, 'movie')}
              >
                <View style={styles.genreDot} />
                <Text style={styles.subMenuText}>{genre.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* TV Shows Section */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => setTvExpanded(!tvExpanded)}
        >
          <Ionicons name="tv" size={22} color="#D4AF37" />
          <Text style={styles.menuText}>TV Shows</Text>
          <Ionicons 
            name={tvExpanded ? "chevron-up" : "chevron-down"} 
            size={18} 
            color="#A1A1AA" 
          />
        </TouchableOpacity>

        {tvExpanded && (
          <View style={styles.subMenu}>
            {TV_GENRES.map((genre) => (
              <TouchableOpacity
                key={genre.id}
                style={styles.subMenuItem}
                onPress={() => navigateToGenre(genre, 'tv')}
              >
                <View style={styles.genreDot} />
                <Text style={styles.subMenuText}>{genre.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Podcasts */}
        <FocusableMenuItem 
          icon="mic" 
          text="Podcasts" 
          onPress={() => navigateToScreen('PodcastTab')}
        />

        {/* Live Sports */}
        <FocusableMenuItem 
          icon="tv" 
          text="Live Sports" 
          onPress={() => navigateToScreen('SportsTab')}
        />

        {/* Search */}
        <FocusableMenuItem 
          icon="search" 
          text="Search" 
          onPress={() => navigateToScreen('SearchTab')}
        />

        {/* Favorites */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigateToScreen('FavoritesTab')}
        >
          <Ionicons name="heart" size={22} color="#D4AF37" />
          <Text style={styles.menuText}>Favorites</Text>
        </TouchableOpacity>

        {/* Downloads */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigateToScreen('DownloadsTab')}
        >
          <Ionicons name="download" size={22} color="#D4AF37" />
          <Text style={styles.menuText}>Downloads</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Settings */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigateToScreen('SettingsTab')}
        >
          <Ionicons name="settings" size={22} color="#D4AF37" />
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#050505',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 2,
  },
  userName: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#E5E5E5',
    fontWeight: '500',
  },
  subMenu: {
    backgroundColor: 'rgba(39, 39, 42, 0.3)',
    marginLeft: 20,
    marginRight: 10,
    borderRadius: 8,
    paddingVertical: 4,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  genreDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
  },
  subMenuText: {
    fontSize: 13,
    color: '#A1A1AA',
  },
  divider: {
    height: 1,
    backgroundColor: '#27272A',
    marginVertical: 12,
    marginHorizontal: 20,
  },
  // TV-specific styles
  containerTV: {
    width: 350,
  },
  headerTV: {
    padding: 24,
    paddingTop: 32,
  },
  logoTV: {
    width: 60,
    height: 60,
  },
  appNameTV: {
    fontSize: 24,
  },
  userNameTV: {
    fontSize: 16,
  },
  sectionTitleTV: {
    fontSize: 14,
  },
  menuItemFocused: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
  },
  menuItemActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  menuTextTV: {
    fontSize: 18,
  },
});
