# apps/mobile – Expo React Native Context

## Purpose
Mobile viewer app for browsing and streaming movies.

## Tech Stack
- **Framework**: Expo (managed workflow)
- **Navigation**: Expo Router
- **Video**: expo-video or react-native-video
- **State**: React Query / TanStack Query

## Screens
1. **Splash** → **Login/Register**
2. **Home**: Hero banner + genre rails + Continue Watching
3. **Search**: Keyword search with results grid
4. **Movie Detail**: Poster, synopsis, Play, My List button
5. **Player**: Full-screen HLS playback with controls
6. **My List**: Saved favorites

## Networking Configuration
```
# Android Emulator → use 10.0.2.2 (maps to host localhost)
# iOS Simulator → use localhost or 127.0.0.1
# Physical Device → use LAN IP (e.g., 192.168.x.x)

EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000  # Android emulator
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000  # iOS simulator
```

## .env Files
- `.env` - Default (check for correct API URL)
- `.env.development` - Development overrides
- Access via `process.env.EXPO_PUBLIC_*`

## Video Playback
- HLS stream via signed URL from API
- Controls: play/pause, seek, quality switch (if available)
- Progress saved every 5s or on pause/exit

## Common Issues
1. **Network error on emulator**: Check API_BASE_URL is 10.0.2.2 not localhost
2. **Video 403**: Check signed URL TTL and MinIO CORS
3. **CORS for HLS**: MinIO must allow `GET` for `.m3u8` and `.ts` files
