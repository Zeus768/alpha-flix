import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useApp } from '../context/AppContext';
import { rdApi, premiumizeApi, alldebridApi } from '../services/api';

const isTV = Platform.isTV;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = isTV ? SCREEN_WIDTH * 0.4 : SCREEN_WIDTH * 0.85;

// Debrid service configurations
const DEBRID_SERVICES = [
  {
    id: 'realdebrid',
    name: 'Real-Debrid',
    icon: 'cloud-download',
    color: '#78BB50',
    description: 'Premium torrent caching & streaming',
  },
  {
    id: 'premiumize',
    name: 'Premiumize',
    icon: 'flash',
    color: '#FFD700',
    description: 'All-in-one cloud downloader',
  },
  {
    id: 'alldebrid',
    name: 'AllDebrid',
    icon: 'rocket',
    color: '#E74C3C',
    description: 'Fast unrestricted downloads',
  },
];

export default function AuthScreen() {
  const navigation = useNavigation();
  const { isAuthenticated, saveToken, savePremiumizeToken, saveAlldebridToken } = useApp();
  const flatListRef = useRef(null);
  
  const [selectedService, setSelectedService] = useState(0);
  const [deviceCode, setDeviceCode] = useState(null);
  const [userCode, setUserCode] = useState(null);
  const [verificationUrl, setVerificationUrl] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [checkCode, setCheckCode] = useState(null); // For AllDebrid

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Main');
    }
  }, [isAuthenticated]);

  const resetAuth = () => {
    setDeviceCode(null);
    setUserCode(null);
    setVerificationUrl(null);
    setIsPolling(false);
    setError(null);
    setCheckCode(null);
  };

  const startDeviceAuth = async () => {
    setError(null);
    const service = DEBRID_SERVICES[selectedService];
    
    try {
      if (service.id === 'realdebrid') {
        const response = await rdApi.getDeviceCode();
        setDeviceCode(response.device_code);
        setUserCode(response.user_code);
        setVerificationUrl(response.verification_url);
        await Clipboard.setStringAsync(response.user_code);
        pollForRDAuth(response.device_code, response.interval);
      } else if (service.id === 'premiumize') {
        const response = await premiumizeApi.getDeviceCode();
        if (response.error) {
          setError(response.error);
          return;
        }
        setDeviceCode(response.device_code);
        setUserCode(response.user_code);
        setVerificationUrl(response.verification_uri);
        await Clipboard.setStringAsync(response.user_code);
        pollForPMAuth(response.device_code, response.interval || 5);
      } else if (service.id === 'alldebrid') {
        const response = await alldebridApi.getPin();
        if (response.error) {
          setError(response.error);
          return;
        }
        setUserCode(response.pin);
        setCheckCode(response.check);
        setVerificationUrl(response.verification_uri);
        await Clipboard.setStringAsync(response.pin);
        pollForADAuth(response.pin, response.check);
      }
    } catch (err) {
      setError('Failed to start authorization. Please try again.');
      console.error(err);
    }
  };

  // Real-Debrid polling
  const pollForRDAuth = async (code, interval) => {
    setIsPolling(true);
    const maxAttempts = 60;
    let attempts = 0;
    let pollingActive = true;

    const poll = async () => {
      if (!pollingActive || attempts >= maxAttempts) {
        if (attempts >= maxAttempts) {
          setIsPolling(false);
          setError('Authorization timeout. Please try again.');
        }
        return;
      }

      try {
        const credentials = await rdApi.pollForCredentials(code);
        
        if (credentials && credentials.client_id && credentials.client_secret) {
          pollingActive = false;
          
          try {
            const tokenResponse = await rdApi.getToken(
              credentials.client_id,
              credentials.client_secret,
              code
            );
            
            if (tokenResponse && tokenResponse.access_token) {
              await saveToken(tokenResponse.access_token, tokenResponse.refresh_token);
              setIsPolling(false);
              Alert.alert('Success!', 'Real-Debrid account connected successfully!');
              navigation.replace('Main');
              return;
            }
          } catch (tokenError) {
            console.error('Token error:', tokenError);
          }
        }
      } catch (err) {
        // Continue polling
      }

      attempts++;
      setTimeout(poll, (interval || 5) * 1000);
    };

    poll();
  };

  // Premiumize polling
  const pollForPMAuth = async (code, interval) => {
    setIsPolling(true);
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsPolling(false);
        setError('Authorization timeout. Please try again.');
        return;
      }

      try {
        const response = await premiumizeApi.checkDeviceCode(code);
        
        if (response.status === 'success' && response.access_token) {
          await savePremiumizeToken(response.access_token);
          setIsPolling(false);
          Alert.alert('Success!', 'Premiumize account connected successfully!');
          navigation.replace('Main');
          return;
        }
      } catch (err) {
        // Continue polling
      }

      attempts++;
      setTimeout(poll, interval * 1000);
    };

    poll();
  };

  // AllDebrid polling
  const pollForADAuth = async (pin, check) => {
    setIsPolling(true);
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsPolling(false);
        setError('Authorization timeout. Please try again.');
        return;
      }

      try {
        const response = await alldebridApi.checkPin(pin, check);
        
        if (response.status === 'success' && response.apikey) {
          await saveAlldebridToken(response.apikey);
          setIsPolling(false);
          Alert.alert('Success!', 'AllDebrid account connected successfully!');
          navigation.replace('Main');
          return;
        }
      } catch (err) {
        // Continue polling
      }

      attempts++;
      setTimeout(poll, 5000);
    };

    poll();
  };

  const openVerificationUrl = () => {
    if (verificationUrl) {
      Linking.openURL(verificationUrl);
    }
  };

  const copyCode = async () => {
    const code = userCode;
    if (code) {
      await Clipboard.setStringAsync(code);
      Alert.alert('Copied!', 'Code copied to clipboard');
    }
  };

  const handleServiceChange = (index) => {
    resetAuth();
    setSelectedService(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const renderServiceCard = ({ item, index }) => {
    const isActive = index === selectedService;
    const service = item;
    
    return (
      <TouchableOpacity
        style={[
          styles.serviceCard,
          isActive && styles.serviceCardActive,
          isActive && { borderColor: service.color },
        ]}
        onPress={() => handleServiceChange(index)}
        activeOpacity={0.8}
      >
        <View style={[styles.serviceIconContainer, { backgroundColor: `${service.color}20` }]}>
          <Ionicons name={service.icon} size={32} color={service.color} />
        </View>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.serviceDescription}>{service.description}</Text>
        {isActive && (
          <View style={[styles.activeIndicator, { backgroundColor: service.color }]} />
        )}
      </TouchableOpacity>
    );
  };

  const currentService = DEBRID_SERVICES[selectedService];

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>Welcome to Alpha Flix</Text>
        <Text style={styles.subtitle}>Connect a debrid service to start streaming</Text>

        {/* Service Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={DEBRID_SERVICES}
            renderItem={renderServiceCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 16));
              if (index !== selectedService && index >= 0 && index < DEBRID_SERVICES.length) {
                setSelectedService(index);
                resetAuth();
              }
            }}
          />
          
          {/* Pagination dots */}
          <View style={styles.pagination}>
            {DEBRID_SERVICES.map((service, index) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.paginationDot,
                  index === selectedService && { backgroundColor: currentService.color },
                ]}
                onPress={() => handleServiceChange(index)}
              />
            ))}
          </View>
        </View>

        {/* Auth Section */}
        {!deviceCode && !userCode ? (
          <TouchableOpacity 
            style={[styles.connectButton, { backgroundColor: currentService.color }]}
            onPress={startDeviceAuth}
          >
            <Ionicons name={currentService.icon} size={24} color="#050505" />
            <Text style={styles.connectButtonText}>Connect {currentService.name}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.authContainer}>
            {/* QR Code */}
            {verificationUrl && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={verificationUrl}
                  size={isTV ? 200 : 160}
                  backgroundColor="#18181B"
                  color="#FFFFFF"
                />
                <Text style={styles.qrHint}>Scan with your phone</Text>
              </View>
            )}

            {/* Device Code */}
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Enter this code:</Text>
              <TouchableOpacity onPress={copyCode}>
                <Text style={[styles.userCode, { color: currentService.color }]}>{userCode}</Text>
              </TouchableOpacity>
              <Text style={styles.codeCopied}>Tap to copy • Auto-copied to clipboard</Text>
            </View>

            {/* Verification URL */}
            <TouchableOpacity style={styles.urlButton} onPress={openVerificationUrl}>
              <Ionicons name="open-outline" size={18} color="#D4AF37" />
              <Text style={styles.urlText}>{verificationUrl}</Text>
            </TouchableOpacity>

            {/* Status */}
            {isPolling && (
              <View style={styles.pollingContainer}>
                <ActivityIndicator size="small" color={currentService.color} />
                <Text style={styles.pollingText}>Waiting for authorization...</Text>
              </View>
            )}

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelButton} onPress={resetAuth}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Skip Option */}
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => navigation.replace('Main')}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You need at least one debrid service account to stream content.
          </Text>
          <View style={styles.serviceLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://real-debrid.com')}>
              <Text style={styles.linkText}>Real-Debrid</Text>
            </TouchableOpacity>
            <Text style={styles.separator}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://premiumize.me')}>
              <Text style={styles.linkText}>Premiumize</Text>
            </TouchableOpacity>
            <Text style={styles.separator}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://alldebrid.com')}>
              <Text style={styles.linkText}>AllDebrid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    marginBottom: 30,
    textAlign: 'center',
  },
  carouselContainer: {
    width: '100%',
    marginBottom: 30,
  },
  carouselContent: {
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 - 8,
  },
  serviceCard: {
    width: CARD_WIDTH,
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#27272A',
  },
  serviceCardActive: {
    borderWidth: 2,
  },
  serviceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E5E5E5',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3F3F46',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
    width: '100%',
    maxWidth: 400,
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#050505',
  },
  authContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  qrContainer: {
    backgroundColor: '#18181B',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrHint: {
    color: '#71717A',
    fontSize: 13,
    marginTop: 12,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: {
    color: '#A1A1AA',
    fontSize: 14,
    marginBottom: 8,
  },
  userCode: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  codeCopied: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 8,
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  urlText: {
    color: '#D4AF37',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  pollingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  pollingText: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    color: '#EF4444',
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  skipButton: {
    marginTop: 30,
    paddingVertical: 12,
  },
  skipText: {
    color: '#71717A',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#52525B',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  serviceLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    color: '#D4AF37',
    fontSize: 12,
  },
  separator: {
    color: '#52525B',
  },
});
