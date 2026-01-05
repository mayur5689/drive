# Drive Clone - Expo React Native App

A modern Google Drive clone built with Expo, React Native, TypeScript, and Supabase.

## Features

- 🔐 **Authentication** - Sign up, sign in, and password reset with Supabase Auth
- 📁 **File Management** - Upload, download, delete, and rename files
- 📂 **Folder Organization** - Create and navigate folders
- 🔍 **Search** - Search through your files
- 👥 **File Sharing** - Share files with other users
- 🎨 **Modern UI** - Beautiful Material Design 3 interface with dark mode support
- 📱 **Cross-Platform** - Works on Android and iOS

## Tech Stack

- **Expo** - React Native framework
- **TypeScript** - Type safety
- **React Native Paper** - Material Design components
- **Zustand** - State management
- **Supabase** - Backend (Auth, Database, Storage)
- **EAS Build** - Cloud builds for APK/IPA

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli eas-cli`
- Expo account (for EAS Build)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   - The app is already configured with Supabase credentials in `config/supabase.ts`
   - Database tables are set up via migrations
   - Storage bucket is configured

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Run on device:**
   - Scan QR code with Expo Go app (Android/iOS)
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator

## Building APK with EAS

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure project:**
   ```bash
   eas build:configure
   ```

4. **Build APK:**
   ```bash
   # Preview build (APK for testing)
   eas build --platform android --profile preview

   # Production build (APK for distribution)
   eas build --platform android --profile production
   ```

5. **Download APK:**
   - After build completes, download from Expo dashboard
   - Or use: `eas build:list` to see builds

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   ├── search.tsx         # Search screen
│   └── file-preview/      # File preview screen
├── components/            # Reusable components
├── config/               # Configuration files
├── constants/            # Constants and themes
├── services/             # Business logic services
├── store/                # Zustand state stores
├── types/                # TypeScript type definitions
└── eas.json              # EAS Build configuration
```

## Database Schema

The app uses Supabase with the following tables:

- **files** - File metadata
- **folders** - Folder structure
- **shared_files** - File sharing relationships

All tables have Row Level Security (RLS) enabled for user data isolation.

## Development

- **Start dev server:** `npm start`
- **Clear cache:** `npm start -- --clear`
- **Type checking:** `npx tsc --noEmit`

## Building for Production

### Android APK

```bash
eas build --platform android --profile production
```

### iOS IPA

```bash
eas build --platform ios --profile production
```

## Environment Variables

Supabase configuration is in `config/supabase.ts`. For production, consider using environment variables:

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

## Troubleshooting

- **Build fails:** Check EAS build logs in Expo dashboard
- **Auth issues:** Verify Supabase credentials in `config/supabase.ts`
- **File upload fails:** Check Supabase storage bucket permissions
- **Navigation errors:** Ensure all routes are defined in `app/_layout.tsx`

## License

MIT
