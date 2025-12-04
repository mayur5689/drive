# Fix: Flutter Not Found in PowerShell

## The Issue:
Flutter was installed and added to PATH, but your current PowerShell session doesn't see it yet.

## Quick Fix (Current Session):

**Option 1: Use the helper script**
```powershell
.\run_flutter.ps1 run -d chrome
.\run_flutter.ps1 build apk --release
.\run_flutter.ps1 doctor
```

**Option 2: Add to PATH manually in this session**
```powershell
$env:PATH = "C:\src\flutter\bin;" + $env:PATH
flutter run -d chrome
```

**Option 3: Use full path**
```powershell
C:\src\flutter\bin\flutter.bat run -d chrome
```

## Permanent Fix:

**Restart PowerShell** - This will load the updated PATH automatically.

After restarting PowerShell, you can use `flutter` commands directly:
```powershell
flutter run -d chrome
flutter build apk --release
flutter doctor
```

## Verify PATH is Set:

After restarting PowerShell, check:
```powershell
$env:PATH -split ';' | Select-String flutter
```

You should see: `C:\src\flutter\bin`

## Quick Commands:

```powershell
# Test in browser (no Android Studio needed)
.\run_flutter.ps1 run -d chrome

# Build APK (after Android Studio installed)
.\run_flutter.ps1 build apk --release

# Check Flutter status
.\run_flutter.ps1 doctor

# Get dependencies
.\run_flutter.ps1 pub get
```

