# Complete Automated Setup - Android Studio + Build APK
Write-Host "=== Automated APK Setup Script ===" -ForegroundColor Cyan
Write-Host "This will guide you through the complete process" -ForegroundColor Gray
Write-Host ""

# Step 1: Check Flutter
Write-Host "Step 1: Checking Flutter..." -ForegroundColor Yellow
$flutterPath = "C:\src\flutter\bin"
if (-not (Test-Path "$flutterPath\flutter.bat")) {
    Write-Host "Flutter not found! Please install Flutter first." -ForegroundColor Red
    Write-Host "Run: .\install_flutter.ps1" -ForegroundColor Cyan
    exit 1
}
$env:PATH = "$flutterPath;" + $env:PATH
Write-Host "Flutter found!" -ForegroundColor Green
Write-Host ""

# Step 2: Check Android SDK
Write-Host "Step 2: Checking Android SDK..." -ForegroundColor Yellow
$sdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk"
)

$sdkFound = $false
$sdkPath = $null
foreach ($path in $sdkPaths) {
    if (Test-Path $path) {
        $sdkFound = $true
        $sdkPath = $path
        Write-Host "Android SDK found at: $path" -ForegroundColor Green
        break
    }
}

if (-not $sdkFound) {
    Write-Host "Android SDK not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to install Android Studio first." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "INSTALLATION STEPS:" -ForegroundColor Cyan
    Write-Host "1. Download Android Studio:" -ForegroundColor White
    Write-Host "   https://developer.android.com/studio" -ForegroundColor Cyan
    Write-Host "2. Install it (takes 15-20 minutes)" -ForegroundColor White
    Write-Host "3. Open Android Studio" -ForegroundColor White
    Write-Host "4. Complete setup wizard" -ForegroundColor White
    Write-Host "5. Go to: Tools → SDK Manager" -ForegroundColor White
    Write-Host "6. Install Android SDK (check latest version)" -ForegroundColor White
    Write-Host "7. Run this script again" -ForegroundColor White
    Write-Host ""
    
    $openBrowser = Read-Host "Open download page now? (y/n)"
    if ($openBrowser -eq 'y' -or $openBrowser -eq 'Y') {
        Start-Process "https://developer.android.com/studio"
    }
    
    exit 0
}

# Step 3: Configure Flutter with Android SDK
Write-Host "Step 3: Configuring Flutter..." -ForegroundColor Yellow
& "$flutterPath\flutter.bat" config --android-sdk $sdkPath | Out-Null
Write-Host "Flutter configured!" -ForegroundColor Green
Write-Host ""

# Step 4: Accept Android licenses
Write-Host "Step 4: Accepting Android licenses..." -ForegroundColor Yellow
Write-Host "You'll need to type 'y' for each license" -ForegroundColor Gray
Write-Host ""

$acceptLicenses = Read-Host "Accept Android licenses now? (y/n)"
if ($acceptLicenses -eq 'y' -or $acceptLicenses -eq 'Y') {
    & "$flutterPath\flutter.bat" doctor --android-licenses
} else {
    Write-Host "Skipping licenses. Run 'flutter doctor --android-licenses' later." -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Verify setup
Write-Host "Step 5: Verifying setup..." -ForegroundColor Yellow
$doctorOutput = & "$flutterPath\flutter.bat" doctor 2>&1 | Out-String

if ($doctorOutput -match "\[√\].*Android toolchain") {
    Write-Host "Setup complete! Ready to build APK!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Run .\build_and_share_apk.ps1 to build and share APK" -ForegroundColor Cyan
} else {
    Write-Host "Setup incomplete. Check output above." -ForegroundColor Yellow
    Write-Host "Run 'flutter doctor' to see what's missing." -ForegroundColor Yellow
}

