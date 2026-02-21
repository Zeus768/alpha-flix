import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useApp } from '../context/AppContext';
import { traktApi } from '../services/api';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { 
    rdUser, 
    traktToken, 
    traktUser, 
    saveTraktToken, 
    disconnectTrakt, 
    logout 
  } = useApp();
  
  const [showTraktAuth, setShowTraktAuth] = useState(false);
  const [deviceCode, setDeviceCode] = useState(null);
  const [userCode, setUserCode] = useState(null);
  const [verificationUrl, setVerificationUrl] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);

  const startTraktAuth = async () => {
    setError(null);
    setShowTraktAuth(true);
    
    try {
      console.log('[Trakt] Getting device code...');
      const response = await traktApi.getDeviceCode();
      console.log('[Trakt] Device code response:', response);
      
      setDeviceCode(response.device_code);
      setUserCode(response.user_code);
      setVerificationUrl(response.verification_url);
      
      // Auto-copy code to clipboard
      await Clipboard.setStringAsync(response.user_code);
      
      // Start polling
      pollForAuth(response.device_code, response.interval || 5, response.expires_in || 600);
    } catch (err) {
      setError('Failed to start Trakt authorization. Please try again.');
      console.error('[Trakt] Auth error:', err);
    }
  };

  const pollForAuth = async (code, interval = 5, expiresIn = 600) => {
    setIsPolling(true);
    const maxAttempts = Math.floor(expiresIn / interval);
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
        console.log(`[Trakt] Poll attempt ${attempts + 1}/${maxAttempts}`);
        const result = await traktApi.pollForToken(code);
        console.log('[Trakt] Poll result:', result);
        
        if (result && result.access_token) {
          console.log('[Trakt] Got access token!');
          pollingActive = false;
          await saveTraktToken(result.access_token);
          setIsPolling(false);
          setShowTraktAuth(false);
          Alert.alert('Success', 'Trakt.tv account connected successfully!');
          return;
        }
        
        // Result is pending, continue polling
        if (result && result.status === 'pending') {
          attempts++;
          setTimeout(poll, interval * 1000);
          return;
        }
      } catch (err) {
        console.error('[Trakt] Poll error:', err.message);
        // Only stop on fatal errors
        if (err.message.includes('expired') || err.message.includes('denied')) {
          pollingActive = false;
          setIsPolling(false);
          setError(err.message);
          return;
        }
      }

      if (pollingActive) {
        attempts++;
        setTimeout(poll, interval * 1000);
      }
    };

    poll();
  };

  const handleDisconnectTrakt = () => {
    Alert.alert(
      'Disconnect Trakt',
      'Are you sure you want to disconnect your Trakt.tv account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: disconnectTrakt 
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout 
        },
      ]
    );
  };

  const copyCode = async () => {
    if (userCode) {
      await Clipboard.setStringAsync(userCode);
      Alert.alert('Copied', 'Code copied to clipboard!');
    }
  };

  const closeTraktAuth = () => {
    setShowTraktAuth(false);
    setIsPolling(false);
    setDeviceCode(null);
    setUserCode(null);
    setError(null);
  };

  // Generate QR code URL for Trakt
  const traktQrUrl = userCode ? `https://trakt.tv/activate/${userCode}` : '';

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
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Real-Debrid Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Real-Debrid Account</Text>
          <View style={styles.accountCard}>
            <View style={styles.accountInfo}>
              <View style={styles.accountIcon}>
                <Ionicons name="cloud" size={24} color="#D4AF37" />
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>{rdUser?.username || 'Connected'}</Text>
                <Text style={styles.accountStatus}>
                  Premium until {new Date(rdUser?.expiration).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          </View>
        </View>

        {/* Trakt Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trakt.tv Account</Text>
          {traktToken ? (
            <View style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <View style={[styles.accountIcon, { backgroundColor: 'rgba(237, 28, 36, 0.1)' }]}>
                  <Ionicons name="analytics" size={24} color="#ED1C24" />
                </View>
                <View style={styles.accountDetails}>
                  <Text style={styles.accountName}>{traktUser?.username || 'Connected'}</Text>
                  <Text style={styles.accountStatus}>Sync watch history & lists</Text>
                </View>
              </View>
              <View style={styles.connectedBadge}>
                <View style={styles.connectedDot} />
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.connectButton} onPress={startTraktAuth}>
              <View style={[styles.accountIcon, { backgroundColor: 'rgba(237, 28, 36, 0.1)' }]}>
                <Ionicons name="analytics" size={24} color="#ED1C24" />
              </View>
              <View style={styles.connectDetails}>
                <Text style={styles.connectTitle}>Connect Trakt.tv</Text>
                <Text style={styles.connectSubtitle}>Sync your watch history and lists</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#A1A1AA" />
            </TouchableOpacity>
          )}
          
          {traktToken && (
            <TouchableOpacity 
              style={styles.disconnectButton} 
              onPress={handleDisconnectTrakt}
            >
              <Ionicons name="unlink" size={18} color="#EF4444" />
              <Text style={styles.disconnectText}>Disconnect Trakt</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Features Section */}
        {traktToken && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trakt Features</Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                <Text style={styles.featureText}>Watch history sync</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                <Text style={styles.featureText}>Watchlist integration</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                <Text style={styles.featureText}>Personalized recommendations</Text>
              </View>
            </View>
          </View>
        )}

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>The Alpha Flix v1.3.0</Text>
          <Text style={styles.footerSubtext}>Developed by The Alpha with AI code clean up</Text>
        </View>
      </ScrollView>

      {/* Trakt Auth Modal */}
      <Modal
        visible={showTraktAuth}
        animationType="slide"
        transparent={true}
        onRequestClose={closeTraktAuth}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeTraktAuth}>
              <Ionicons name="close" size={24} color="#A1A1AA" />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <Ionicons name="analytics" size={48} color="#ED1C24" />
              <Text style={styles.modalTitle}>Connect Trakt.tv</Text>
            </View>

            {userCode ? (
              <View style={styles.codeContainer}>
                {/* QR Code for TV/easier login */}
                <View style={styles.qrContainer}>
                  <Text style={styles.qrLabel}>Scan with your phone:</Text>
                  <View style={styles.qrBox}>
                    <QRCode
                      value={traktQrUrl}
                      size={160}
                      color="#050505"
                      backgroundColor="#FFFFFF"
                    />
                  </View>
                </View>

                <Text style={styles.orText}>— OR —</Text>

                <Text style={styles.codeLabel}>Go to:</Text>
                <TouchableOpacity onPress={() => Linking.openURL(verificationUrl || 'https://trakt.tv/activate')}>
                  <Text style={styles.codeUrl}>trakt.tv/activate</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.codeBox} onPress={copyCode}>
                  <Text style={styles.code}>{userCode}</Text>
                  <View style={styles.copyHint}>
                    <Ionicons name="copy-outline" size={16} color="#A1A1AA" />
                    <Text style={styles.copyHintText}>Tap to copy</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.autoCopied}>
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                  <Text style={styles.autoCopiedText}>Code auto-copied to clipboard!</Text>
                </View>

                {isPolling && (
                  <View style={styles.waitingContainer}>
                    <ActivityIndicator size="small" color="#ED1C24" />
                    <Text style={styles.waitingText}>Waiting for authorization...</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ED1C24" />
                <Text style={styles.loadingText}>Generating code...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.modalFooter}>
              Don't have Trakt?{' '}
              <Text 
                style={styles.link}
                onPress={() => Linking.openURL('https://trakt.tv/auth/join')}
              >
                Sign up free
              </Text>
            </Text>
          </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  accountCard: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E5E5',
    marginBottom: 2,
  },
  accountStatus: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  connectedText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  connectDetails: {
    flex: 1,
    marginLeft: 12,
  },
  connectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E5E5',
    marginBottom: 2,
  },
  connectSubtitle: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  disconnectText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  featureList: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    color: '#E5E5E5',
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    gap: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 50,
  },
  footerText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },
  footerSubtext: {
    color: '#52525B',
    fontSize: 12,
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E5E5E5',
    marginTop: 16,
  },
  codeContainer: {
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  qrLabel: {
    color: '#A1A1AA',
    fontSize: 14,
    marginBottom: 12,
  },
  qrBox: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  orText: {
    color: '#71717A',
    fontSize: 12,
    marginVertical: 12,
  },
  autoCopied: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  autoCopiedText: {
    color: '#22C55E',
    fontSize: 12,
  },
  codeLabel: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 8,
  },
  codeUrl: {
    fontSize: 18,
    color: '#ED1C24',
    textDecorationLine: 'underline',
    marginBottom: 16,
  },
  codeBox: {
    backgroundColor: '#050505',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ED1C24',
    marginBottom: 24,
    alignItems: 'center',
  },
  code: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ED1C24',
    letterSpacing: 4,
    marginBottom: 8,
  },
  copyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyHintText: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waitingText: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  loadingText: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    flex: 1,
  },
  modalFooter: {
    textAlign: 'center',
    color: '#A1A1AA',
    fontSize: 14,
    marginTop: 24,
  },
  link: {
    color: '#ED1C24',
    textDecorationLine: 'underline',
  },
});
