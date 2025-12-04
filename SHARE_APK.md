# How to Share APK Online with Friends

## Step 1: Build the APK

### Option A: If Android Studio is Installed
```powershell
flutter build apk --release
```

### Option B: If Android Studio is NOT Installed
You can still build APK using command line tools, but it's easier to:
1. Install Android Studio (takes 10-15 minutes)
2. Or use online build services (see below)

## Step 2: Find Your APK

After building, the APK will be at:
```
build/app/outputs/flutter-apk/app-release.apk
```

## Step 3: Share APK Online (Choose One Method)

### Method 1: Google Drive (Easiest & Free)
1. Upload APK to your Google Drive
2. Right-click → Share → Get link
3. Set permission to "Anyone with the link"
4. Send link to your friend
5. Friend downloads and installs

### Method 2: Dropbox (Free)
1. Upload APK to Dropbox
2. Right-click → Share → Copy link
3. Send link to friend

### Method 3: WeTransfer (Free, No Account Needed)
1. Go to https://wetransfer.com
2. Upload APK file
3. Enter friend's email or get link
4. Share link (valid for 7 days)

### Method 4: GitHub Releases (Free, Permanent)
1. Create GitHub account (if needed)
2. Create new repository
3. Upload APK as release
4. Share release link (permanent)

### Method 5: Firebase App Distribution (Free, Professional)
1. Create Firebase project
2. Use Firebase App Distribution
3. Upload APK
4. Share invite link

### Method 6: Direct File Sharing Apps
- **Send Anywhere**: https://send-anywhere.com
- **File.io**: https://www.file.io (temporary)
- **Transfer.sh**: https://transfer.sh (command line)

## Step 4: Friend Installs APK

Your friend needs to:
1. Download APK from the link
2. Enable "Install from Unknown Sources" in Android settings
3. Open downloaded APK
4. Tap "Install"
5. Done!

## Quick Commands

```powershell
# Build APK
flutter build apk --release

# APK location
build/app/outputs/flutter-apk/app-release.apk

# Check APK size
Get-Item build/app/outputs/flutter-apk/app-release.apk | Select-Object Name, Length
```

## Recommended: Google Drive
**Best for**: Easy sharing, permanent links, no file size limits (within reason)

1. Upload `app-release.apk` to Google Drive
2. Right-click → Share → Anyone with link
3. Copy link and send to friend
4. Friend downloads and installs

