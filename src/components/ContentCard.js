import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isTV = Platform.isTV;

export default function ContentCard({ item, size = 'medium' }) {
  const navigation = useNavigation();
  const [isFocused, setIsFocused] = useState(false);

  // TV: Use larger cards for better visibility
  const baseWidth = isTV ? (size === 'large' ? 280 : 200) : (size === 'large' ? width * 0.45 : width * 0.35);

  return (
    <TouchableOpacity
      style={[
        styles.card, 
        { width: baseWidth },
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
      <View style={styles.overlay}>
        <Text style={[styles.title, isTV && styles.titleTV]} numberOfLines={2}>{item.title}</Text>
        <View style={styles.meta}>
          {item.year && <Text style={[styles.year, isTV && styles.yearTV]}>{item.year}</Text>}
          {item.rating && (
            <View style={styles.rating}>
              <Ionicons name="star" size={isTV ? 14 : 10} color="#F59E0B" />
              <Text style={[styles.ratingText, isTV && styles.ratingTextTV]}>{item.rating?.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
      {/* Focus indicator overlay */}
      {isFocused && (
        <View style={styles.focusOverlay}>
          <View style={styles.focusBorder} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(5,5,5,0.85)',
  },
  title: {
    color: '#E5E5E5',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  titleTV: {
    fontSize: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  year: {
    color: '#A1A1AA',
    fontSize: 10,
  },
  yearTV: {
    fontSize: 14,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '600',
  },
  ratingTextTV: {
    fontSize: 14,
  },
  focusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  focusBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderColor: '#D4AF37',
    borderRadius: 8,
  },
});
