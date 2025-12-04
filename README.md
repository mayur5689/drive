# Drive Clone - Flutter App

A Google Drive clone built with Flutter and Supabase, featuring file storage, folder management, sharing, and search functionality.

## Features

- ✅ User Authentication (Email/Password)
- ✅ File Upload & Download
- ✅ File Preview (Images, PDFs, etc.)
- ✅ Folder Management
- ✅ File Sharing with Permissions
- ✅ Search Functionality
- ✅ Grid/List View Toggle
- ✅ Dark/Light Theme Support

## Setup

### Prerequisites

- Flutter SDK (3.0.0 or higher)
- Android Studio / VS Code
- Supabase Account

### Configuration

1. Update `lib/config/supabase_config.dart` with your Supabase credentials:
   ```dart
   static const String url = 'YOUR_SUPABASE_URL';
   static const String anonKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Run the app:
   ```bash
   flutter run
   ```

## Building APK

### Debug APK
```bash
flutter build apk --debug
```

### Release APK
```bash
flutter build apk --release
```

The APK will be generated at: `build/app/outputs/flutter-apk/app-release.apk`

### App Bundle (for Play Store)
```bash
flutter build appbundle --release
```

## Sharing the APK

1. **Direct Transfer**: Copy the APK file to another device via USB, Bluetooth, or file sharing apps.

2. **Cloud Storage**: Upload the APK to Google Drive, Dropbox, or any cloud storage and share the link.

3. **Email**: Send the APK as an email attachment.

4. **QR Code**: Generate a QR code for the download link and share it.

## Supabase Setup

The app uses Supabase for:
- Authentication
- Database (PostgreSQL)
- File Storage

Make sure you have:
- Created the necessary tables (files, folders, shared_files)
- Set up the storage bucket named "files"
- Configured RLS policies

## Project Structure

```
lib/
├── config/          # Configuration files
├── models/          # Data models
├── providers/       # State management
├── screens/         # UI screens
├── services/        # Business logic
└── widgets/         # Reusable widgets
```

## License

Free to use and modify.

