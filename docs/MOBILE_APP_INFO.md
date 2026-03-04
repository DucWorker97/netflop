# Netflop Mobile App Documentation

## 1. Overview
**Package**: `@netflop/mobile`
**Framework**: [Expo](https://expo.dev) SDK 52 (React Native 0.76)
**Router**: `expo-router` v4 (File-based routing)
**State/Data**: `tanstack-query` + `Context`
**Styling**: `react-native-web` compatible (Standard StyleSheet) + `expo-linear-gradient` + `expo-blur`
**Video**: `react-native-video` (Community) + `expo-av` (Audio)

## 2. Project Structure
```
apps/mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/             # Authentication screens (Login)
│   ├── (tabs)/             # Main Tab Bar Navigation
│   │   ├── index.tsx       # Home Screen (Hero + Rails)
│   │   ├── search.tsx      # Search Screen
│   │   ├── my-list.tsx     # My List / Watchlist
│   │   └── settings.tsx    # User Settings & Debug
│   ├── movie/              # Movie Details Routes
│   ├── player/             # Video Player Routes
│   ├── _layout.tsx         # Root Layout (Providers)
│   ├── login.tsx           # Login Screen entry
│   └── profiles.tsx        # Profile Selection
├── src/
│   ├── components/         # Reusable UI Components
│   │   ├── HeroBanner.tsx  # Featured Movie Banner
│   │   ├── ForYouRail.tsx  # AI Recommendations Rail
│   │   ├── Rail.tsx        # Standard Movie List Rail
│   │   ├── PosterCard.tsx  # Movie Poster Component
│   │   └── SubtitleOverlay.tsx # Video Player Subtitles
│   ├── lib/                # Utilities & Logic
│   │   ├── api.ts          # REST API Client (Fetch wrapper)
│   │   ├── auth.ts         # Token Management (SecureStore)
│   │   ├── analytics.ts    # Telemetry
│   │   └── env.ts          # Environment Config (IP/Host)
│   ├── hooks/              # Custom React Hooks
│   └── context/            # Global State (Auth, Theme)
├── assets/                 # Icons and Splash Screens
└── package.json            # Dependencies & Scripts
```

## 3. Key Dependencies
- **Navigation**: `expo-router` (File-system based, similar to Next.js)
- **Networking**: `whatwg-fetch` + Custom `ApiClient` (Handles 401 refresh automatically)
- **Storage**: `expo-secure-store` (Tokens), `async-storage` (Preferences)
- **Animation**: `react-native-reanimated` (v3)
- **Video**: `react-native-video` (Supports HLS, DRM, Subtitles)

## 4. Configuration

### Centralized Environment (Root `.env`)

The mobile app reads environment from the **root `.env`** file via `EXPO_PUBLIC_*` variables.

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | API endpoint (derived from `DEV_PUBLIC_HOST`) |
| `EXPO_PUBLIC_S3_BASE_URL` | Media storage (HLS streams, posters) |

### How to Switch Hosts

Edit **root `.env`** and change `DEV_PUBLIC_HOST`:

```env
# For Android Emulator
DEV_PUBLIC_HOST=10.0.2.2

# For Physical Device (LAN IP)
DEV_PUBLIC_HOST=192.168.x.x

# For Web/Admin (localhost)
DEV_PUBLIC_HOST=localhost
```

Or override via environment:

```powershell
# PowerShell
$env:DEV_PUBLIC_HOST="10.0.2.2"; pnpm dev
```

```bash
# macOS/Linux
DEV_PUBLIC_HOST=10.0.2.2 pnpm dev
```

## 5. Development Workflow
### Prerequisites
- **Node.js**: LTS
- **Package Manager**: pnpm (`corepack enable`)
- **Emulator**: Android Studio (AVD) or Xcode (Simulator)
- **Physical Device**: Expo Go app installed.

### Commands
Run from root or `apps/mobile`:
```bash
# Start Metro Bundler (Main Dev Server)
pnpm --filter @netflop/mobile start
# Or alias
pnpm mobile:dev

# Run on specific platform
pnpm --filter @netflop/mobile android
pnpm --filter @netflop/mobile ios
```

### Authentication Flow
1.  **Check Tokens**: `_layout.tsx` checks `SecureStore`.
2.  **No Token**: Redirects to `/login`.
3.  **Login**: POST `/api/auth/login` → Store Access/Refresh Tokens.
4.  **Profile**: User selects a profile (Admin vs Viewer).
5.  **Home**: Redirects to `/(tabs)`.

## 6. Known Issues / Tips
- **Video Playback**: If HLS fails on Android, ensure `DEV_PUBLIC_HOST=10.0.2.2` is set before starting services.
- **Expo Go**: Performance is slower than Production Builds. Use Development Builds (`eas build --profile development`) for native modules if needed.
- **Reanimated**: Requires `babel.config.js` plugin (Already configured).

