# Android Studio Installation Script
Write-Host "=== Android Studio Installation Helper ===" -ForegroundColor Cyan
Write-Host ""

# Check if Android Studio is already installed
$androidStudioPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
)

$sdkFound = $false
foreach ($path in $androidStudioPaths) {
    if (Test-Path $path) {
        Write-Host "Android SDK found at: $path" -ForegroundColor Green
        $sdkFound = $true
        break
    }
}

if ($sdkFound) {
    Write-Host "Android SDK is already installed!" -ForegroundColor Green
    Write-Host "Setting up Flutter to use it..." -ForegroundColor Yellow
    
    # Try to configure Flutter
    $flutterPath = "C:\src\flutter\bin"
    if (Test-Path "$flutterPath\flutter.bat") {
        $env:PATH = "$flutterPath;" + $env:PATH
        & "$flutterPath\flutter.bat" config --android-sdk $path
        Write-Host "Flutter configured!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Next: Run 'flutter doctor --android-licenses' to accept licenses" -ForegroundColor Yellow
    exit 0
}

Write-Host "Android Studio/SDK not found." -ForegroundColor Yellow
Write-Host ""
Write-Host "OPTION 1: Download Android Studio (Recommended)" -ForegroundColor Green
Write-Host "1. Open browser: https://developer.android.com/studio" -ForegroundColor White
Write-Host "2. Click 'Download Android Studio'" -ForegroundColor White
Write-Host "3. Run the installer" -ForegroundColor White
Write-Host "4. During installation, make sure 'Android SDK' is checked" -ForegroundColor White
Write-Host "5. After installation, open Android Studio and complete setup wizard" -ForegroundColor White
Write-Host "6. Go to SDK Manager and install Android SDK" -ForegroundColor White
Write-Host ""

Write-Host "OPTION 2: Command Line SDK Tools Only (Advanced)" -ForegroundColor Green
Write-Host "This installs only SDK tools without full Android Studio IDE" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Do you want to download Android Studio installer? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "Opening download page..." -ForegroundColor Yellow
    Start-Process "https://developer.android.com/studio"
    Write-Host ""
    Write-Host "After downloading and installing:" -ForegroundColor Yellow
    Write-Host "1. Run this script again to configure Flutter" -ForegroundColor White
    Write-Host "2. Or run: flutter doctor --android-licenses" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "You can install Android Studio manually from:" -ForegroundColor Yellow
    Write-Host "https://developer.android.com/studio" -ForegroundColor Cyan
}

