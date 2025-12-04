# Build Instructions for Drive Clone APK

## Prerequisites

1. **Install Flutter**: Make sure Flutter SDK is installed and configured
   ```bash
   flutter doctor
   ```

2. **Install Dependencies**:
   ```bash
   flutter pub get
   ```

## Building the APK

### Debug APK (for testing)
```bash
flutter build apk --debug
```
Location: `build/app/outputs/flutter-apk/app-debug.apk`

### Release APK (for distribution)
```bash
flutter build apk --release
```
Location: `build/app/outputs/flutter-apk/app-release.apk`

### Split APKs (smaller file size)
```bash
flutter build apk --split-per-abi --release
```
This creates separate APKs for:
- `app-armeabi-v7a-release.apk` (32-bit)
- `app-arm64-v8a-release.apk` (64-bit)
- `app-x86_64-release.apk` (x86_64)

## Sharing the APK

### Method 1: Direct File Transfer
1. Copy the APK file to your phone
2. Open the APK file on Android device
3. Allow installation from unknown sources if prompted
4. Install the app

### Method 2: Cloud Storage
1. Upload APK to Google Drive, Dropbox, or any cloud storage
2. Share the download link
3. Recipients download and install

### Method 3: QR Code
1. Upload APK to a file hosting service
2. Generate QR code for the download link
3. Share QR code - users scan and download

### Method 4: Email
1. Attach APK to email
2. Send to recipients
3. They download and install

## Important Notes

- **Unknown Sources**: Users need to enable "Install from Unknown Sources" in Android settings
- **File Size**: Release APK is optimized and smaller than debug APK
- **Permissions**: The app requires storage permissions for file operations
- **Supabase**: Make sure your Supabase project is configured correctly

## Troubleshooting

### Build Errors
- Run `flutter clean` then `flutter pub get`
- Check Android SDK is properly installed
- Verify `android/local.properties` has correct SDK path

### Installation Issues
- Ensure Android device is running Android 5.0 (API 21) or higher
- Check if device has enough storage space
- Verify APK is not corrupted

## Production Release

For production release, consider:
1. **Code Signing**: Set up proper signing keys (see `android/app/build.gradle`)
2. **App Bundle**: Use `flutter build appbundle` for Play Store
3. **Versioning**: Update version in `pubspec.yaml`
4. **Testing**: Thoroughly test on multiple devices

