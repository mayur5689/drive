# Build and Share APK Online - Complete Guide

## ⚠️ You Need Android Studio to Build APK

### Quick Setup (15 minutes):

1. **Download Android Studio**: https://developer.android.com/studio
2. **Install** (default settings are fine)
3. **Open Android Studio** → SDK Manager → Install Android SDK
4. **Accept licenses**: 
   ```powershell
   flutter doctor --android-licenses
   ```
5. **Build APK**:
   ```powershell
   flutter build apk --release
   ```

---

## 📱 Share APK Online (After Building)

### 🥇 Method 1: Google Drive (RECOMMENDED - Easiest)

**Steps:**
1. Build APK: `flutter build apk --release`
2. Go to https://drive.google.com
3. Click "New" → "File upload"
4. Upload `build/app/outputs/flutter-apk/app-release.apk`
5. Right-click uploaded file → "Share" → "Get link"
6. Change to "Anyone with the link"
7. Copy link and send to friend!

**Advantages:**
- ✅ Free
- ✅ Permanent link
- ✅ No file size limit (up to 15GB)
- ✅ Easy to use
- ✅ Works on any device

---

### 🥈 Method 2: WeTransfer (No Account Needed)

**Steps:**
1. Go to https://wetransfer.com
2. Click "Get transfer link"
3. Drag & drop your APK file
4. Click "Get link"
5. Copy and share link (valid 7 days)

**Advantages:**
- ✅ No account needed
- ✅ Simple interface
- ✅ Fast upload

---

### 🥉 Method 3: GitHub Releases (Permanent Link)

**Steps:**
1. Create GitHub account: https://github.com
2. Create new repository
3. Go to "Releases" → "Create a new release"
4. Upload APK file
5. Share release link

**Advantages:**
- ✅ Permanent link
- ✅ Professional
- ✅ Version tracking

---

### Method 4: Firebase App Distribution (Best for Testing)

**Steps:**
1. Go to https://console.firebase.google.com
2. Create project
3. Go to "App Distribution"
4. Upload APK
5. Add tester emails
6. Share invite link

**Advantages:**
- ✅ Built for app distribution
- ✅ Tester management
- ✅ Analytics

---

### Method 5: Direct File Sharing Services

**Send Anywhere**: https://send-anywhere.com
- Upload file, get 6-digit code
- Friend enters code to download

**File.io**: https://www.file.io
- Upload, get link
- One-time download

**Transfer.sh**: https://transfer.sh
- Command line: `curl --upload-file app-release.apk https://transfer.sh/app.apk`
- Get link instantly

---

## 📲 Friend's Installation Steps

Your friend needs to:

1. **Download APK** from the link you shared
2. **Enable Unknown Sources**:
   - Settings → Security → Enable "Install from Unknown Sources"
   - OR Settings → Apps → Special Access → Install Unknown Apps
3. **Open downloaded APK**
4. **Tap "Install"**
5. **Done!** App is installed

---

## 🚀 Quick Build & Share Script

```powershell
# Build APK
flutter build apk --release

# Check if APK exists
if (Test-Path "build/app/outputs/flutter-apk/app-release.apk") {
    Write-Host "APK built successfully!" -ForegroundColor Green
    Write-Host "Location: build/app/outputs/flutter-apk/app-release.apk" -ForegroundColor Cyan
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Upload to Google Drive" -ForegroundColor White
    Write-Host "2. Share link with friend" -ForegroundColor White
} else {
    Write-Host "APK not found. Build failed." -ForegroundColor Red
}
```

---

## 💡 Recommended Approach

**For Quick Sharing**: Use **Google Drive**
- Most reliable
- Permanent link
- Easy for friends to download

**For Testing**: Use **Firebase App Distribution**
- Professional
- Tester management
- Analytics

---

## ⚡ If You Can't Build Locally

### Option 1: Use Codemagic (Free CI/CD)
1. Sign up: https://codemagic.io
2. Connect GitHub repo
3. Build APK in cloud
4. Download and share

### Option 2: Use GitHub Actions
1. Push code to GitHub
2. Set up GitHub Actions workflow
3. Build APK automatically
4. Download from Actions

### Option 3: Ask Friend to Build
- Share the code
- Friend builds APK on their computer
- They install directly

---

## 📋 Checklist

- [ ] Android Studio installed
- [ ] Android SDK installed
- [ ] Licenses accepted
- [ ] APK built successfully
- [ ] APK uploaded to sharing service
- [ ] Link shared with friend
- [ ] Friend knows how to install

---

**Need help? Check `SHARE_APK.md` for more details!**

