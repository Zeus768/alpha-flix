import React, { useState, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Animated,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

const isTV = Platform.isTV;

/**
 * TV-optimized focusable component with visible focus indicator
 * Shows a gold border and slight scale when focused via D-pad
 */
export default function TVFocusable({ 
  children, 
  onPress, 
  style, 
  focusedStyle,
  disabled = false,
  hasTVPreferredFocus = false,
  testID,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.05,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(borderAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isFocused]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#D4AF37'],
  });

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  if (!isTV) {
    // On mobile, just use regular TouchableOpacity
    return (
      <TouchableOpacity
        onPress={onPress}
        style={style}
        disabled={disabled}
        activeOpacity={0.7}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  // On TV, use animated focus indicator
  return (
    <TouchableOpacity
      onPress={onPress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      hasTVPreferredFocus={hasTVPreferredFocus}
      activeOpacity={1}
      testID={testID}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
            borderWidth: 3,
            borderColor: borderColor,
            borderRadius: 12,
          },
          isFocused && focusedStyle,
        ]}
      >
        {children}
        {isFocused && (
          <View style={styles.focusOverlay} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  focusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 10,
  },
});
