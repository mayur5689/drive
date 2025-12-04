# Flutter Installation Check Script
# Run this to check if Flutter is installed and configured

Write-Host "=== Flutter Installation Check ===" -ForegroundColor Cyan
Write-Host ""

# Check if Flutter is in PATH
Write-Host "Checking Flutter installation..." -ForegroundColor Yellow
try {
    $flutterVersion = flutter --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Flutter is installed!" -ForegroundColor Green
        Write-Host $flutterVersion
    }
} catch {
    Write-Host "✗ Flutter is NOT installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install Flutter:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://docs.flutter.dev/get-started/install/windows"
    Write-Host "2. Extract to C:\src\flutter"
    Write-Host "3. Add C:\src\flutter\bin to PATH"
    Write-Host "4. Restart PowerShell"
    exit 1
}

Write-Host ""
Write-Host "Running flutter doctor..." -ForegroundColor Yellow
flutter doctor

Write-Host ""
Write-Host "=== Checking Project ===" -ForegroundColor Cyan

# Check if we're in the project directory
if (Test-Path "pubspec.yaml") {
    Write-Host "✓ Found pubspec.yaml" -ForegroundColor Green
    
    # Check if dependencies are installed
    if (Test-Path ".dart_tool") {
        Write-Host "✓ Dependencies appear to be installed" -ForegroundColor Green
    } else {
        Write-Host "⚠ Dependencies not installed. Run: flutter pub get" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Not in Flutter project directory" -ForegroundColor Red
    Write-Host "Navigate to your project folder first" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. If Flutter is installed, run: flutter pub get" -ForegroundColor White
Write-Host "2. Then build APK: flutter build apk --release" -ForegroundColor White

