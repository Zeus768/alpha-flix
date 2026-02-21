import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { View, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import DownloadsScreen from './src/screens/DownloadsScreen';
import AuthScreen from './src/screens/AuthScreen';
import ContentDetailScreen from './src/screens/ContentDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import PodcastScreen from './src/screens/PodcastScreen';
import SportsScreen from './src/screens/SportsScreen';
import SplashScreen from './src/screens/SplashScreen';

// Components
import CustomDrawer from './src/components/CustomDrawer';

// Context
import { AppProvider } from './src/context/AppContext';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Dark theme for navigation
const AlphaFlixTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#D4AF37',
    background: '#050505',
    card: '#0A0A0A',
    text: '#E5E5E5',
    border: '#27272A',
    notification: '#D4AF37',
  },
};

// Drawer Navigator with all main screens
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#0A0A0A',
          width: 280,
        },
        headerStyle: {
          backgroundColor: '#050505',
        },
        headerTintColor: '#D4AF37',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: '#D4AF37',
        drawerInactiveTintColor: '#A1A1AA',
      }}
    >
      <Drawer.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{
          headerShown: false,
          title: 'Home',
        }}
      />
      <Drawer.Screen 
        name="SearchTab" 
        component={SearchScreen}
        options={{
          headerShown: false,
          title: 'Search',
        }}
      />
      <Drawer.Screen 
        name="FavoritesTab" 
        component={FavoritesScreen}
        options={{
          headerShown: false,
          title: 'Favorites',
        }}
      />
      <Drawer.Screen 
        name="DownloadsTab" 
        component={DownloadsScreen}
        options={{
          headerShown: false,
          title: 'Downloads',
        }}
      />
      <Drawer.Screen 
        name="SettingsTab" 
        component={SettingsScreen}
        options={{
          headerShown: false,
          title: 'Settings',
        }}
      />
      <Drawer.Screen 
        name="PodcastTab" 
        component={PodcastScreen}
        options={{
          headerShown: false,
          title: 'Podcasts',
        }}
      />
      <Drawer.Screen 
        name="SportsTab" 
        component={SportsScreen}
        options={{
          headerShown: false,
          title: 'Live Sports',
        }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = async () => {
    try {
      await Font.loadAsync({
        'Cinzel-Regular': require('./assets/fonts/Cinzel-Regular.ttf'),
        'Cinzel-Bold': require('./assets/fonts/Cinzel-Bold.ttf'),
        'Manrope-Regular': require('./assets/fonts/Manrope-Regular.ttf'),
        'Manrope-Bold': require('./assets/fonts/Manrope-Bold.ttf'),
      });
      setFontsLoaded(true);
    } catch (error) {
      console.log('Font loading error:', error);
      setFontsLoaded(true);
    }
    setIsLoading(false);
  };

  const [showSplash, setShowSplash] = useState(true);

  if (isLoading) {
    return null;
  }

  // Show splash animation first
  if (showSplash) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <NavigationContainer theme={AlphaFlixTheme}>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#050505' },
              headerTintColor: '#D4AF37',
              contentStyle: { backgroundColor: '#050505' },
            }}
          >
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Main" 
              component={DrawerNavigator} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ContentDetail" 
              component={ContentDetailScreen}
              options={{ 
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen 
              name="Category" 
              component={CategoryScreen}
              options={{ 
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
