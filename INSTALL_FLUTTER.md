# Install Flutter on Windows - Step by Step Guide

## Quick Installation Steps

### Step 1: Download Flutter SDK

1. Go to: https://docs.flutter.dev/get-started/install/windows
2. Download the Flutter SDK zip file (latest stable version)
3. Extract the zip file to a location like:
   - `C:\src\flutter` (recommended)
   - OR `C:\flutter`
   - OR `C:\Users\YourName\flutter`

**Important**: Don't extract to `C:\Program Files\` (requires admin permissions)

### Step 2: Add Flutter to PATH

1. **Open System Environment Variables**:
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Click "Environment Variables" button
   - Under "User variables", find "Path" and click "Edit"

2. **Add Flutter Path**:
   - Click "New"
   - Add: `C:\src\flutter\bin` (or wherever you extracted Flutter)
   - Click "OK" on all dialogs

3. **Restart PowerShell/Terminal** (important!)

### Step 3: Verify Installation

Open a **NEW** PowerShell window and run:

```powershell
flutter doctor
```

This will check your setup and show what's missing.

### Step 4: Install Required Tools

Flutter doctor will tell you what's missing. Usually you need:

1. **Android Studio** (for Android development):
   - Download: https://developer.android.com/studio
   - Install Android Studio
   - Open it and install Android SDK
   - Accept Android licenses: `flutter doctor --android-licenses`

2. **Android SDK Command-line Tools**:
   - Android Studio → SDK Manager → SDK Tools
   - Check "Android SDK Command-line Tools"
   - Install

### Step 5: Accept Android Licenses

```powershell
flutter doctor --android-licenses
```

Press `y` to accept all licenses.

### Step 6: Verify Everything Works

```powershell
flutter doctor -v
```

You should see checkmarks (✓) for:
- Flutter
- Android toolchain
- Android Studio (optional but recommended)

## Quick Install Script (PowerShell)

Run this in PowerShell (as Administrator):

```powershell
# Download Flutter
$flutterUrl = "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.24.0-stable.zip"
$downloadPath = "$env:TEMP\flutter.zip"
$extractPath = "C:\src"

# Create directory
New-Item -ItemType Directory -Force -Path $extractPath

# Download (requires internet)
Invoke-WebRequest -Uri $flutterUrl -OutFile $downloadPath

# Extract
Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force

# Add to PATH (current session)
$env:PATH += ";C:\src\flutter\bin"

# Verify
flutter doctor
```

**Note**: You still need to add Flutter to PATH permanently (Step 2 above).

## After Installation

Once Flutter is installed:

1. **Navigate to your project**:
   ```powershell
   cd C:\Users\Roger\Desktop\drive
   ```

2. **Get dependencies**:
   ```powershell
   flutter pub get
   ```

3. **Build APK**:
   ```powershell
   flutter build apk --release
   ```

## Troubleshooting

### "flutter: command not found"
- Flutter not in PATH
- Restart PowerShell after adding to PATH
- Check path is correct: `C:\src\flutter\bin`

### "Android licenses not accepted"
```powershell
flutter doctor --android-licenses
```

### "Android SDK not found"
- Install Android Studio
- Install Android SDK via Android Studio
- Set ANDROID_HOME environment variable

### "Java not found"
- Install JDK 17 or higher
- Set JAVA_HOME environment variable

## Alternative: Use Flutter Online

If installation is too complex, you can use:
- **GitHub Codespaces** (free tier available)
- **GitPod** (free tier available)
- **Replit** (has Flutter support)

But for building APK, you need Flutter installed locally.

## Need Help?

- Flutter Docs: https://docs.flutter.dev/get-started/install/windows
- Flutter Community: https://flutter.dev/community

