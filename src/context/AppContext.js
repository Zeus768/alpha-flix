import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, rdApi, traktApi, premiumizeApi, alldebridApi } from '../services/api';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [rdToken, setRdToken] = useState(null);
  const [rdUser, setRdUser] = useState(null);
  const [premiumizeToken, setPremiumizeToken] = useState(null);
  const [premiumizeUser, setPremiumizeUser] = useState(null);
  const [alldebridToken, setAlldebridToken] = useState(null);
  const [alldebridUser, setAlldebridUser] = useState(null);
  const [traktToken, setTraktToken] = useState(null);
  const [traktUser, setTraktUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const rdTokenStored = await SecureStore.getItemAsync('rd_token');
      const pmTokenStored = await SecureStore.getItemAsync('pm_token');
      const adTokenStored = await SecureStore.getItemAsync('ad_token');
      const traktTokenStored = await SecureStore.getItemAsync('trakt_token');
      
      // Check Real-Debrid
      if (rdTokenStored) {
        setRdToken(rdTokenStored);
        await loadUserInfo(rdTokenStored);
        setIsAuthenticated(true);
      }
      
      // Check Premiumize
      if (pmTokenStored) {
        setPremiumizeToken(pmTokenStored);
        await loadPremiumizeUserInfo(pmTokenStored);
        setIsAuthenticated(true);
      }
      
      // Check AllDebrid
      if (adTokenStored) {
        setAlldebridToken(adTokenStored);
        await loadAlldebridUserInfo(adTokenStored);
        setIsAuthenticated(true);
      }
      
      // Check Trakt
      if (traktTokenStored) {
        setTraktToken(traktTokenStored);
        await loadTraktUserInfo(traktTokenStored);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
    setIsLoading(false);
  };

  const loadUserInfo = async (token) => {
    try {
      const user = await rdApi.getUserInfo(token);
      setRdUser(user);
      await loadFavorites();
      await loadDownloads();
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const loadPremiumizeUserInfo = async (token) => {
    try {
      const data = await premiumizeApi.getUserInfo(token);
      setPremiumizeUser(data);
      await loadFavorites();
      await loadDownloads();
    } catch (error) {
      console.error('Load Premiumize user error:', error);
    }
  };

  const loadAlldebridUserInfo = async (token) => {
    try {
      const data = await alldebridApi.getUserInfo(token);
      setAlldebridUser(data);
      await loadFavorites();
      await loadDownloads();
    } catch (error) {
      console.error('Load AllDebrid user error:', error);
    }
  };

  const loadTraktUserInfo = async (token) => {
    try {
      const user = await traktApi.getUser(token);
      setTraktUser(user);
    } catch (error) {
      console.error('Load Trakt user error:', error);
    }
  };

  const saveToken = async (token) => {
    await SecureStore.setItemAsync('rd_token', token);
    setRdToken(token);
    await loadUserInfo(token);
    setIsAuthenticated(true);
  };

  const savePremiumizeToken = async (token) => {
    await SecureStore.setItemAsync('pm_token', token);
    setPremiumizeToken(token);
    await loadPremiumizeUserInfo(token);
    setIsAuthenticated(true);
  };

  const saveAlldebridToken = async (token) => {
    await SecureStore.setItemAsync('ad_token', token);
    setAlldebridToken(token);
    await loadAlldebridUserInfo(token);
    setIsAuthenticated(true);
  };

  const saveTraktToken = async (token) => {
    await SecureStore.setItemAsync('trakt_token', token);
    setTraktToken(token);
    await loadTraktUserInfo(token);
  };

  const disconnectTrakt = async () => {
    await SecureStore.deleteItemAsync('trakt_token');
    setTraktToken(null);
    setTraktUser(null);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('rd_token');
    await SecureStore.deleteItemAsync('trakt_token');
    setRdToken(null);
    setRdUser(null);
    setTraktToken(null);
    setTraktUser(null);
    setIsAuthenticated(false);
    setFavorites([]);
    setDownloads([]);
  };

  const loadFavorites = async () => {
    try {
      const data = await api.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Load favorites error:', error);
    }
  };

  const loadDownloads = async () => {
    try {
      const data = await api.getDownloads();
      setDownloads(data);
    } catch (error) {
      console.error('Load downloads error:', error);
    }
  };

  const addToFavorites = async (item) => {
    const exists = favorites.some(f => f.title === item.title || f.tmdb_id === item.tmdb_id);
    if (exists) {
      const fav = favorites.find(f => f.title === item.title || f.tmdb_id === item.tmdb_id);
      if (fav) await removeFavorite(fav.id);
      return;
    }

    try {
      const response = await api.addFavorite(item);
      setFavorites([...favorites, response]);
      return true;
    } catch (error) {
      console.error('Add favorite error:', error);
      return false;
    }
  };

  const removeFavorite = async (id) => {
    try {
      await api.removeFavorite(id);
      setFavorites(favorites.filter(f => f.id !== id));
      return true;
    } catch (error) {
      console.error('Remove favorite error:', error);
      return false;
    }
  };

  const isFavorite = (item) => {
    return favorites.some(f => f.title === item.title || f.tmdb_id === item.tmdb_id);
  };

  const playContent = async (item) => {
    try {
      const result = await rdApi.getStreamingLink(rdToken, item.magnet, item.title);
      if (result.download_url) {
        await loadDownloads();
        return result;
      }
      return null;
    } catch (error) {
      console.error('Play content error:', error);
      throw error;
    }
  };

  const deleteDownload = async (id) => {
    try {
      await api.deleteDownload(id);
      setDownloads(downloads.filter(d => d.id !== id));
      return true;
    } catch (error) {
      console.error('Delete download error:', error);
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      rdToken,
      rdUser,
      premiumizeToken,
      premiumizeUser,
      alldebridToken,
      alldebridUser,
      traktToken,
      traktUser,
      isAuthenticated,
      isLoading,
      favorites,
      downloads,
      saveToken,
      savePremiumizeToken,
      saveAlldebridToken,
      saveTraktToken,
      disconnectTrakt,
      logout,
      addToFavorites,
      removeFavorite,
      isFavorite,
      playContent,
      loadFavorites,
      loadDownloads,
      deleteDownload,
    }}>
      {children}
    </AppContext.Provider>
  );
};
