import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useApp } from '../context/AppContext';
import { rdApi } from '../services/api';

const isTV = Platform.isTV;

export default function AuthScreen() {
  const navigation = useNavigation();
  const { isAuthenticated, saveToken } = useApp();
  
  const [deviceCode, setDeviceCode] = useState(null);
  const [userCode, setUserCode] = useState(null);
  const [verificationUrl, setVerificationUrl] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Main');
    }
  }, [isAuthenticated]);

  const startDeviceAuth = async () => {
    setError(null);
    try {
      const response = await rdApi.getDeviceCode();
      setDeviceCode(response.device_code);
      setUserCode(response.user_code);
      setVerificationUrl(response.verification_url);
      
      // Auto-copy code to clipboard
      await Clipboard.setStringAsync(response.user_code);
      
      // Start polling
      pollForAuth(response.device_code, response.interval);
    } catch (err) {
      setError('Failed to start authorization. Please try again.');
      console.error(err);
    }
  };

  const pollForAuth = async (code, interval) => {
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
            
            if (tokenResponse.access_token) {
              await saveToken(tokenResponse.access_token);
              setIsPolling(false);
              return;
            }
          } catch (tokenErr) {
            console.error('Token error:', tokenErr);
            setError('Failed to get access token. Please try again.');
            setIsPolling(false);
            return;
          }
        }
      } catch (err) {
        if (err.response?.status !== 403) {
          console.error('Poll error:', err.message);
        }
      }

      if (pollingActive) {
        attempts++;
        setTimeout(poll, (interval || 5) * 1000);
      }
    };

    poll();
  };

  const copyCode = async () => {
    if (userCode) {
      await Clipboard.setStringAsync(userCode);
      Alert.alert('Copied!', 'Code copied to clipboard. Just paste it on the website.');
    }
  };

  const openAuthUrl = () => {
    if (verificationUrl && userCode) {
      // For Fire TV, just open the URL - user will need to enter code manually
      Linking.openURL(verificationUrl);
    }
  };

  // Generate QR code URL with the code embedded
  const qrCodeUrl = userCode ? `https://real-debrid.com/device?code=${userCode}` : '';

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.background}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.bgLogo}
          resizeMode="contain"
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>THE ALPHA FLIX</Text>
        <Text style={styles.subtitle}>Premium Streaming Experience</Text>

        {!userCode ? (
          <>
            <Text style={styles.description}>
              Connect your Real-Debrid account to unlock unlimited streaming
            </Text>
            
            <TouchableOpacity 
              style={styles.connectButton} 
              onPress={startDeviceAuth}
              hasTVPreferredFocus={isTV}
            >
              <Ionicons name="link" size={24} color="#050505" />
              <Text style={styles.connectButtonText}>Connect Real-Debrid</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.signupButton}
              onPress={() => Linking.openURL('https://real-debrid.com/?id=9472133')}
            >
              <Text style={styles.signupText}>Don't have Real-Debrid?</Text>
              <Text style={styles.signupLink}>Sign up here</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={[styles.codeContainer, isTV && styles.codeContainerTV]}>
            {/* TV Layout: Side by side */}
            {isTV ? (
              <View style={styles.tvAuthLayout}>
                {/* Left side - QR Code */}
                <View style={styles.tvQrSection}>
                  <Text style={styles.qrLabelTV}>Scan with your phone:</Text>
                  <View style={styles.qrBoxTV}>
                    <QRCode
                      value={qrCodeUrl}
                      size={160}
                      color="#050505"
                      backgroundColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.tvDivider}>
                  <View style={styles.tvDividerLine} />
                  <Text style={styles.tvDividerText}>OR</Text>
                  <View style={styles.tvDividerLine} />
                </View>

                {/* Right side - Code */}
                <View style={styles.tvCodeSection}>
                  <Text style={styles.tvCodeLabel}>Go to:</Text>
                  <Text style={styles.tvCodeUrl}>real-debrid.com/device</Text>
                  
                  <Text style={styles.tvCodeLabel}>Enter code:</Text>
                  <View style={styles.tvCodeBox}>
                    <Text style={styles.tvCode}>{userCode}</Text>
                  </View>
                  
                  <View style={styles.tvAutoCopied}>
                    <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                    <Text style={styles.tvAutoCopiedText}>Auto-copied!</Text>
                  </View>
                </View>
              </View>
            ) : (
              /* Mobile Layout: Vertical */
              <>
                <View style={styles.qrContainer}>
                  <Text style={styles.qrLabel}>Scan with your phone:</Text>
                  <View style={styles.qrBox}>
                    <QRCode
                      value={qrCodeUrl}
                      size={180}
                      color="#050505"
                      backgroundColor="#FFFFFF"
                    />
                  </View>
                </View>

                <Text style={styles.orText}>— OR —</Text>

                <Text style={styles.codeLabel}>Go to:</Text>
                <TouchableOpacity onPress={openAuthUrl}>
                  <Text style={styles.codeUrl}>real-debrid.com/device</Text>
                </TouchableOpacity>
                
                <Text style={styles.codeLabel}>Enter this code:</Text>
                <TouchableOpacity style={styles.codeBox} onPress={copyCode}>
                  <Text style={styles.code}>{userCode}</Text>
                  <View style={styles.copiedBadge}>
                    <Ionicons name="copy-outline" size={14} color="#D4AF37" />
                    <Text style={styles.copiedText}>Tap to copy</Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.autoCopied}>
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                  <Text style={styles.autoCopiedText}>Code auto-copied to clipboard!</Text>
                </View>
              </>
            )}

            {isPolling && (
              <View style={styles.waitingContainer}>
                <ActivityIndicator size="small" color="#D4AF37" />
                <Text style={[styles.waitingText, isTV && styles.waitingTextTV]}>Waiting for authorization...</Text>
              </View>
            )}
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Developed by The Alpha with AI code clean up
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.03,
  },
  bgLogo: {
    width: 400,
    height: 400,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: isTV ? 48 : 24,
  },
  logo: {
    width: isTV ? 140 : 100,
    height: isTV ? 140 : 100,
    marginBottom: 16,
  },
  title: {
    fontSize: isTV ? 48 : 32,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isTV ? 20 : 14,
    color: '#A1A1AA',
    marginBottom: 32,
    textAlign: 'center',
  },
  description: {
    fontSize: isTV ? 22 : 16,
    color: '#E5E5E5',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: isTV ? 32 : 24,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: isTV ? 48 : 32,
    paddingVertical: isTV ? 20 : 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  connectButtonText: {
    color: '#050505',
    fontSize: isTV ? 24 : 18,
    fontWeight: 'bold',
  },
  signupButton: {
    alignItems: 'center',
  },
  signupText: {
    color: '#A1A1AA',
    fontSize: 14,
    marginBottom: 4,
  },
  signupLink: {
    color: '#D4AF37',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  codeContainer: {
    alignItems: 'center',
    width: '100%',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrLabel: {
    color: '#A1A1AA',
    fontSize: isTV ? 18 : 14,
    marginBottom: 12,
  },
  qrBox: {
    padding: isTV ? 20 : 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  orText: {
    color: '#71717A',
    fontSize: isTV ? 16 : 12,
    marginVertical: 16,
  },
  codeLabel: {
    color: '#A1A1AA',
    fontSize: isTV ? 18 : 14,
    marginBottom: 8,
  },
  codeUrl: {
    color: '#D4AF37',
    fontSize: isTV ? 28 : 20,
    textDecorationLine: 'underline',
    marginBottom: 16,
  },
  codeBox: {
    backgroundColor: '#121212',
    paddingHorizontal: isTV ? 48 : 32,
    paddingVertical: isTV ? 24 : 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#D4AF37',
    alignItems: 'center',
    marginBottom: 12,
  },
  code: {
    fontSize: isTV ? 48 : 36,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 8,
    marginBottom: 8,
  },
  copiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copiedText: {
    color: '#D4AF37',
    fontSize: 12,
  },
  autoCopied: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 24,
  },
  autoCopiedText: {
    color: '#22C55E',
    fontSize: 12,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  waitingText: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  waitingTextTV: {
    fontSize: 18,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    flex: 1,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#52525B',
    fontSize: 12,
  },
  // TV Layout Styles
  codeContainerTV: {
    width: '100%',
    maxWidth: 800,
  },
  tvAuthLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 20,
  },
  tvQrSection: {
    alignItems: 'center',
  },
  qrLabelTV: {
    color: '#A1A1AA',
    fontSize: 16,
    marginBottom: 12,
  },
  qrBoxTV: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  tvDivider: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tvDividerLine: {
    width: 2,
    height: 60,
    backgroundColor: '#27272A',
  },
  tvDividerText: {
    color: '#71717A',
    fontSize: 14,
    paddingVertical: 12,
  },
  tvCodeSection: {
    alignItems: 'center',
  },
  tvCodeLabel: {
    color: '#A1A1AA',
    fontSize: 16,
    marginBottom: 8,
  },
  tvCodeUrl: {
    color: '#D4AF37',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  tvCodeBox: {
    backgroundColor: '#121212',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#D4AF37',
    marginBottom: 12,
  },
  tvCode: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 8,
  },
  tvAutoCopied: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  tvAutoCopiedText: {
    color: '#22C55E',
    fontSize: 14,
  },
});
