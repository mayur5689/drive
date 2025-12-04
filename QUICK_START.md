# Quick Start Guide - Drive Clone

## Step 1: Configure Supabase

1. Your Supabase project is already configured with:
   - Database tables (files, folders, shared_files)
   - Storage bucket named "files"
   - RLS policies for security

2. Update `lib/config/supabase_config.dart` with your credentials:
   ```dart
   static const String url = 'YOUR_SUPABASE_URL';
   static const String anonKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

## Step 2: Install Dependencies

```bash
flutter pub get
```

## Step 3: Run the App

```bash
flutter run
```

## Step 4: Build APK

### Debug APK (for testing)
```bash
flutter build apk --debug
```

### Release APK (for sharing)
```bash
flutter build apk --release
```

The APK will be at: `build/app/outputs/flutter-apk/app-release.apk`

## Step 5: Share the APK

1. **Copy to Phone**: Transfer APK via USB, Bluetooth, or cloud storage
2. **Install**: Open APK file on Android device
3. **Allow**: Enable "Install from Unknown Sources" if prompted
4. **Done**: App is installed and ready to use!

## Features Available

✅ Sign up / Login with email
✅ Upload files
✅ Create folders
✅ View files (images preview)
✅ Download files
✅ Share files with other users
✅ Search files
✅ Grid/List view toggle
✅ Dark/Light theme

## Troubleshooting

- **Build errors**: Run `flutter clean` then `flutter pub get`
- **Installation fails**: Check Android version (needs Android 5.0+)
- **Supabase errors**: Verify credentials in `supabase_config.dart`

## Need Help?

Check `BUILD_INSTRUCTIONS.md` for detailed build instructions and `README.md` for full documentation.

