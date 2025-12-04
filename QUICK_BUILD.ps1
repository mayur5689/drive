# Quick APK Build Script (Run after Android Studio is installed)
param(
    [switch]$SkipSetup
)

Write-Host "=== Quick APK Build ===" -ForegroundColor Cyan
Write-Host ""

# Add Flutter to PATH
$flutterPath = "C:\src\flutter\bin"
if (-not (Test-Path "$flutterPath\flutter.bat")) {
    Write-Host "Flutter not found!" -ForegroundColor Red
    exit 1
}
$env:PATH = "$flutterPath;" + $env:PATH

# Check if setup is needed
if (-not $SkipSetup) {
    $doctorOutput = & "$flutterPath\flutter.bat" doctor 2>&1 | Out-String
    if ($doctorOutput -match "\[X\].*Android toolchain") {
        Write-Host "Android SDK not configured!" -ForegroundColor Yellow
        Write-Host "Running setup first..." -ForegroundColor Yellow
        & .\AUTO_SETUP.ps1
        if ($LASTEXITCODE -ne 0) {
            exit 1
        }
    }
}

# Build APK
Write-Host "Building APK..." -ForegroundColor Yellow
& "$flutterPath\flutter.bat" build apk --release

if ($LASTEXITCODE -eq 0) {
    $apkPath = "build\app\outputs\flutter-apk\app-release.apk"
    if (Test-Path $apkPath) {
        Write-Host ""
        Write-Host "✅ APK Built Successfully!" -ForegroundColor Green
        Write-Host "Location: $apkPath" -ForegroundColor Cyan
        
        # Open folder
        Start-Process explorer.exe -ArgumentList "/select,`"$((Get-Item $apkPath).FullName)`""
        
        Write-Host ""
        Write-Host "Upload to Google Drive and share the link!" -ForegroundColor Yellow
    }
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}

