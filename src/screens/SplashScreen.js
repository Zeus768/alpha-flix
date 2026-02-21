import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const ringScale1 = useRef(new Animated.Value(0.5)).current;
  const ringScale2 = useRef(new Animated.Value(0.5)).current;
  const ringOpacity1 = useRef(new Animated.Value(0.8)).current;
  const ringOpacity2 = useRef(new Animated.Value(0.6)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const flameAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main animation sequence
    Animated.sequence([
      // 1. Fade in logo with scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      
      // 2. Animate glow and rings
      Animated.parallel([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        // Ring 1 expansion
        Animated.timing(ringScale1, {
          toValue: 2.5,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity1, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
        // Ring 2 expansion (delayed)
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.timing(ringScale2, {
              toValue: 2.2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(ringOpacity2, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Flame flicker
        Animated.loop(
          Animated.sequence([
            Animated.timing(flameAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(flameAnim, {
              toValue: 0.7,
              duration: 150,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 5 }
        ),
      ]),
      
      // 3. Show text
      Animated.timing(textFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      
      // 4. Hold for a moment
      Animated.delay(800),
      
      // 5. Fade out everything
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const flameOpacity = flameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0a00', '#050505', '#0a0502']}
        style={styles.gradient}
      >
        {/* Animated Rings */}
        <Animated.View
          style={[
            styles.ring,
            {
              transform: [{ scale: ringScale1 }],
              opacity: ringOpacity1,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            styles.ring2,
            {
              transform: [{ scale: ringScale2 }],
              opacity: ringOpacity2,
            },
          ]}
        />

        {/* Main Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glow effect behind logo */}
          <Animated.View
            style={[
              styles.glow,
              { opacity: glowAnim },
            ]}
          />
          
          {/* Flame effect */}
          <Animated.View
            style={[
              styles.flames,
              { opacity: flameOpacity },
            ]}
          >
            <LinearGradient
              colors={['transparent', '#FF6B00', '#FFB800', '#FF6B00', 'transparent']}
              style={styles.flameGradient}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
            />
          </Animated.View>

          {/* Wolf Logo */}
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text */}
        <Animated.View
          style={[
            styles.textContainer,
            { opacity: textFade },
          ]}
        >
          <Text style={styles.alphaText}>ALPHA</Text>
          <View style={styles.flixBadge}>
            <Text style={styles.flixText}>FLIX</Text>
          </View>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            { opacity: textFade },
          ]}
        >
          Premium Streaming Experience
        </Animated.Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  ring2: {
    borderColor: '#FF6B00',
    borderWidth: 2,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    opacity: 0.3,
  },
  flames: {
    position: 'absolute',
    width: 180,
    height: 220,
    top: -30,
  },
  flameGradient: {
    flex: 1,
    borderRadius: 90,
  },
  logo: {
    width: 150,
    height: 150,
    zIndex: 10,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  alphaText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 12,
    textShadowColor: '#D4AF37',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  flixBadge: {
    backgroundColor: '#C41E3A',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  flixText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 6,
  },
  tagline: {
    color: '#71717A',
    fontSize: 14,
    marginTop: 20,
    letterSpacing: 2,
  },
});
