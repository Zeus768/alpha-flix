import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function DownloadsScreen() {
  const navigation = useNavigation();
  const { downloads, loadDownloads, deleteDownload } = useApp();

  useEffect(() => {
    loadDownloads();
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const openInVLC = (url) => {
    Linking.openURL(`vlc://${url}`);
  };

  const openInMX = (url) => {
    Linking.openURL(`intent:${url}#Intent;type=video/*;package=com.mxtech.videoplayer.ad;end`);
  };

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
        <Text style={styles.title}>Downloads</Text>
      </View>

      {downloads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="download-outline" size={64} color="#27272A" />
          <Text style={styles.emptyText}>No downloads yet</Text>
          <Text style={styles.emptySubtext}>Your streamed content will appear here</Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {downloads.map((item) => (
            <View key={item.id} style={styles.downloadItem}>
              <View style={[
                styles.statusIcon,
                item.status === 'completed' ? styles.statusCompleted :
                item.status === 'error' ? styles.statusError : styles.statusPending
              ]}>
                <Ionicons 
                  name={
                    item.status === 'completed' ? 'checkmark-circle' :
                    item.status === 'error' ? 'alert-circle' : 'time'
                  } 
                  size={24} 
                  color={
                    item.status === 'completed' ? '#22C55E' :
                    item.status === 'error' ? '#EF4444' : '#D4AF37'
                  }
                />
              </View>
              
              <View style={styles.downloadInfo}>
                <Text style={styles.downloadTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.downloadFilename} numberOfLines={1}>
                  {item.filename || 'Processing...'}
                </Text>
                <View style={styles.downloadMeta}>
                  <Text style={styles.downloadSize}>{formatFileSize(item.filesize)}</Text>
                  <Text style={[
                    styles.downloadStatus,
                    item.status === 'completed' ? styles.statusTextCompleted :
                    item.status === 'error' ? styles.statusTextError : styles.statusTextPending
                  ]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.downloadActions}>
                {item.streaming_link && (
                  <>
                    <TouchableOpacity 
                      style={styles.playerButton}
                      onPress={() => openInVLC(item.streaming_link)}
                    >
                      <Text style={styles.playerButtonText}>VLC</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.playerButton, styles.mxButton]}
                      onPress={() => openInMX(item.streaming_link)}
                    >
                      <Text style={styles.playerButtonText}>MX</Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteDownload(item.id)}
                >
                  <Ionicons name="trash" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#A1A1AA',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#71717A',
    fontSize: 14,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusPending: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  downloadInfo: {
    flex: 1,
  },
  downloadTitle: {
    color: '#E5E5E5',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  downloadFilename: {
    color: '#71717A',
    fontSize: 12,
    marginBottom: 4,
  },
  downloadMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadSize: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  downloadStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusTextCompleted: {
    color: '#22C55E',
  },
  statusTextError: {
    color: '#EF4444',
  },
  statusTextPending: {
    color: '#D4AF37',
  },
  downloadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  playerButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  mxButton: {
    backgroundColor: '#2196F3',
  },
  playerButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
