# Complete APK Build and Share Script
Write-Host "=== APK Build and Share Script ===" -ForegroundColor Cyan
Write-Host ""

# Add Flutter to PATH
$flutterPath = "C:\src\flutter\bin"
if (Test-Path "$flutterPath\flutter.bat") {
    $env:PATH = "$flutterPath;" + $env:PATH
} else {
    Write-Host "Flutter not found! Please install Flutter first." -ForegroundColor Red
    exit 1
}

# Step 1: Check Flutter and Android setup
Write-Host "Step 1: Checking Flutter setup..." -ForegroundColor Yellow
$doctorOutput = & "$flutterPath\flutter.bat" doctor 2>&1 | Out-String

if ($doctorOutput -match "Android toolchain.*develop for Android devices") {
    if ($doctorOutput -match "\[X\].*Android toolchain") {
        Write-Host "Android SDK not configured!" -ForegroundColor Red
        Write-Host "Please install Android Studio first:" -ForegroundColor Yellow
        Write-Host "Run: .\install_android_studio.ps1" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host "Flutter setup OK!" -ForegroundColor Green
Write-Host ""

# Step 2: Clean and get dependencies
Write-Host "Step 2: Cleaning and getting dependencies..." -ForegroundColor Yellow
& "$flutterPath\flutter.bat" clean | Out-Null
& "$flutterPath\flutter.bat" pub get | Out-Null
Write-Host "Dependencies ready!" -ForegroundColor Green
Write-Host ""

# Step 3: Build APK
Write-Host "Step 3: Building APK (this may take 5-10 minutes)..." -ForegroundColor Yellow
Write-Host "Please wait..." -ForegroundColor Gray

$buildOutput = & "$flutterPath\flutter.bat" build apk --release 2>&1 | Out-String

if ($LASTEXITCODE -eq 0 -or $buildOutput -match "Built.*apk") {
    Write-Host "APK built successfully!" -ForegroundColor Green
} else {
    Write-Host "Build failed. Check errors above." -ForegroundColor Red
    Write-Host $buildOutput
    exit 1
}

Write-Host ""

# Step 4: Locate APK
$apkPath = "build\app\outputs\flutter-apk\app-release.apk"
if (Test-Path $apkPath) {
    $apkInfo = Get-Item $apkPath
    $apkSizeMB = [math]::Round($apkInfo.Length / 1MB, 2)
    
    Write-Host "=== APK Ready! ===" -ForegroundColor Green
    Write-Host "Location: $apkPath" -ForegroundColor Cyan
    Write-Host "Size: $apkSizeMB MB" -ForegroundColor Cyan
    Write-Host ""
    
    # Step 5: Open folder and provide sharing options
    Write-Host "Step 4: Opening APK location..." -ForegroundColor Yellow
    Start-Process explorer.exe -ArgumentList "/select,`"$((Get-Item $apkPath).FullName)`""
    
    Write-Host ""
    Write-Host "=== How to Share APK Online ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "OPTION 1: Google Drive (Recommended)" -ForegroundColor Green
    Write-Host "1. Go to: https://drive.google.com" -ForegroundColor White
    Write-Host "2. Upload the APK file (shown in Explorer)" -ForegroundColor White
    Write-Host "3. Right-click → Share → Get link" -ForegroundColor White
    Write-Host "4. Set to 'Anyone with the link'" -ForegroundColor White
    Write-Host "5. Copy and share link!" -ForegroundColor White
    Write-Host ""
    
    Write-Host "OPTION 2: WeTransfer (No account needed)" -ForegroundColor Green
    Write-Host "1. Go to: https://wetransfer.com" -ForegroundColor White
    Write-Host "2. Upload APK, get link (valid 7 days)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "OPTION 3: GitHub Releases" -ForegroundColor Green
    Write-Host "1. Create GitHub repo" -ForegroundColor White
    Write-Host "2. Upload APK as release" -ForegroundColor White
    Write-Host "3. Share release link" -ForegroundColor White
    Write-Host ""
    
    Write-Host "APK file is ready in Explorer window!" -ForegroundColor Green
    Write-Host "Choose your sharing method above." -ForegroundColor Yellow
    
} else {
    Write-Host "APK not found at expected location!" -ForegroundColor Red
    Write-Host "Build may have failed. Check errors above." -ForegroundColor Yellow
}

