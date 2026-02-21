import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isTV = Platform.isTV;
const CARD_WIDTH = isTV ? 200 : width * 0.35;

// Individual card with focus state
function ContentRowCard({ item, navigation }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.card, 
        { width: isTV ? 200 : CARD_WIDTH },
        isFocused && styles.cardFocused
      ]}
      onPress={() => navigation.navigate('ContentDetail', { item })}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      activeOpacity={isTV ? 1 : 0.7}
    >
      <Image
        source={{ 
          uri: item.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop' 
        }}
        style={styles.poster}
        resizeMode="cover"
      />
      <View style={styles.cardOverlay}>
        <Text style={[styles.cardTitle, isTV && styles.cardTitleTV]} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardMeta}>
          {item.year && <Text style={[styles.cardYear, isTV && styles.cardYearTV]}>{item.year}</Text>}
          {item.rating && (
            <View style={styles.cardRating}>
              <Ionicons name="star" size={isTV ? 14 : 10} color="#F59E0B" />
              <Text style={[styles.cardRatingText, isTV && styles.cardRatingTextTV]}>{item.rating?.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
      {isFocused && <View style={styles.focusOverlay} />}
    </TouchableOpacity>
  );
}

export default function ContentRow({ title, icon, items, category }) {
  const navigation = useNavigation();
  const [seeAllFocused, setSeeAllFocused] = useState(false);

  if (!items || items.length === 0) return null;

  const handleSeeAll = () => {
    navigation.navigate('Category', { 
      category: category,
      title: title 
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.header, seeAllFocused && styles.headerFocused]} 
        onPress={handleSeeAll}
        onFocus={() => setSeeAllFocused(true)}
        onBlur={() => setSeeAllFocused(false)}
      >
        <Ionicons name={icon} size={isTV ? 24 : 20} color="#D4AF37" />
        <Text style={[styles.title, isTV && styles.titleTV]}>{title}</Text>
        <View style={[styles.seeAllBadge, isTV && styles.seeAllBadgeTV, seeAllFocused && styles.seeAllBadgeFocused]}>
          <Text style={[styles.seeAllText, isTV && styles.seeAllTextTV]}>See All</Text>
          <Ionicons name="chevron-forward" size={isTV ? 20 : 16} color="#D4AF37" />
        </View>
      </TouchableOpacity>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, isTV && styles.scrollContentTV]}
      >
        {items.map((item, index) => (
          <ContentRowCard 
            key={`${item.tmdb_id || item.title}-${index}`}
            item={item}
            navigation={navigation}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  headerFocused: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    marginHorizontal: 8,
    borderRadius: 8,
    paddingVertical: 8,
  },
  title: {
    flex: 1,
    color: '#E5E5E5',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleTV: {
    fontSize: 22,
  },
  seeAllBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  seeAllBadgeTV: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  seeAllBadgeFocused: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  seeAllText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '600',
  },
  seeAllTextTV: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  scrollContentTV: {
    paddingHorizontal: 40,
    gap: 20,
  },
  card: {
    aspectRatio: 2/3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#121212',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  cardFocused: {
    borderColor: '#D4AF37',
    transform: [{ scale: 1.05 }],
    zIndex: 10,
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
    padding: 8,
    backgroundColor: 'rgba(5,5,5,0.85)',
  },
  cardTitle: {
    color: '#E5E5E5',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardTitleTV: {
    fontSize: 16,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardYear: {
    color: '#A1A1AA',
    fontSize: 10,
  },
  cardYearTV: {
    fontSize: 14,
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cardRatingText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '600',
  },
  cardRatingTextTV: {
    fontSize: 14,
  },
  focusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 5,
  },
});
