# Complete APK Setup Guide - Step by Step

## 🚀 Automated Process

I've created scripts to automate everything. Follow these steps:

---

## Step 1: Install Android Studio (15-20 minutes)

### Automatic Download:
The download page should have opened. If not:
1. Go to: https://developer.android.com/studio
2. Click "Download Android Studio"

### Installation:
1. **Run the installer** (android-studio-*.exe)
2. **Choose "Standard" installation** (recommended)
3. **Wait for download** (this downloads Android SDK too)
4. **Complete installation**

### First Launch Setup:
1. **Open Android Studio**
2. **Complete Setup Wizard**:
   - Choose "Standard" setup
   - Accept license agreements
   - Wait for SDK components to download
3. **Wait for indexing** (may take a few minutes)

---

## Step 2: Verify Installation

After Android Studio is installed, run:

```powershell
.\AUTO_SETUP.ps1
```

This will:
- ✅ Check Flutter
- ✅ Find Android SDK
- ✅ Configure Flutter
- ✅ Accept licenses
- ✅ Verify everything works

---

## Step 3: Build APK (Automatic)

Once setup is complete, run:

```powershell
.\build_and_share_apk.ps1
```

This will:
- ✅ Clean project
- ✅ Get dependencies
- ✅ Build release APK
- ✅ Open APK location
- ✅ Show sharing options

---

## Step 4: Share APK Online

After APK is built, choose one method:

### 🥇 Google Drive (Easiest)
1. Go to https://drive.google.com
2. Upload `app-release.apk` from Explorer window
3. Right-click → Share → Get link
4. Set to "Anyone with the link"
5. Copy and send link to friend!

### 🥈 WeTransfer (Quick)
1. Go to https://wetransfer.com
2. Upload APK
3. Get link (valid 7 days)
4. Share with friend

### 🥉 GitHub Releases (Permanent)
1. Create GitHub account
2. Create repository
3. Upload APK as release
4. Share release link

---

## Quick Commands Summary

```powershell
# Step 1: Setup (after Android Studio installed)
.\AUTO_SETUP.ps1

# Step 2: Build APK
.\build_and_share_apk.ps1

# Or manually:
flutter build apk --release

# APK location:
build\app\outputs\flutter-apk\app-release.apk
```

---

## Troubleshooting

### "Android SDK not found"
- Make sure Android Studio is fully installed
- Open Android Studio → SDK Manager
- Install Android SDK Platform
- Run `.\AUTO_SETUP.ps1` again

### "Licenses not accepted"
```powershell
flutter doctor --android-licenses
```
Type `y` for each license

### "Build failed"
- Check: `flutter doctor` for issues
- Make sure all dependencies installed: `flutter pub get`
- Try: `flutter clean` then rebuild

---

## Current Status

✅ Flutter installed
⏳ Android Studio - **INSTALLING NOW**
⏳ Android SDK - Will install with Android Studio
⏳ APK Build - Ready after setup
⏳ Share APK - Ready after build

---

## Next Steps

1. **Wait for Android Studio to install** (15-20 min)
2. **Complete setup wizard** in Android Studio
3. **Run**: `.\AUTO_SETUP.ps1`
4. **Run**: `.\build_and_share_apk.ps1`
5. **Share APK** via Google Drive

---

**All scripts are ready! Just install Android Studio and run the scripts!** 🎉

