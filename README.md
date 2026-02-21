# Alpha Flix - Android APK

A premium streaming app with Real-Debrid integration for unlimited content streaming.

## Features

- 🎬 **TMDB Integration** - Real movie posters, plots, cast, ratings
- 🔗 **Real-Debrid** - Device pairing via real-debrid.com/device
- 🔍 **Search** - Find any movie or TV show
- ❤️ **Favorites** - Save content for later
- 📥 **Downloads** - Track streamed content
- 📱 **VLC/MX Player** - Open streams in external players

## Building the APK

### Prerequisites

1. Install Node.js (v18+)
2. Install Expo CLI: `npm install -g expo-cli`
3. Install EAS CLI: `npm install -g eas-cli`

### Build Steps

1. **Install dependencies:**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Login to Expo (create free account if needed):**
   ```bash
   eas login
   ```

3. **Build APK:**
   ```bash
   eas build -p android --profile preview
   ```

4. **Download APK** from the Expo dashboard when build completes

### Local Development

```bash
npx expo start
```

Then scan the QR code with Expo Go app on your phone.

## Configuration

### Backend API

Update the API URL in `src/services/api.js`:

```javascript
const API_BASE_URL = 'YOUR_BACKEND_URL/api';
```

### Real-Debrid

The app uses device code authentication. Users:
1. Open the app
2. Click "Connect Real-Debrid"
3. Enter the code at real-debrid.com/device
4. App automatically connects when authorized

## Tech Stack

- React Native / Expo
- Real-Debrid API (OAuth Device Flow)
- TMDB API (Movie/TV data)
- Expo SecureStore (Token storage)

## Color Scheme

- Primary Gold: #D4AF37
- Background: #050505
- Card: #121212
- Text: #E5E5E5
