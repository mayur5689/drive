# Install Android SDK Command Line Tools Only (Much Faster!)
Write-Host "=== Fast SDK Installation (No Android Studio) ===" -ForegroundColor Cyan
Write-Host "This installs only SDK tools (5 minutes vs 20 minutes)" -ForegroundColor Yellow
Write-Host ""

$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$sdkToolsPath = "$sdkRoot\cmdline-tools\latest"

# Check if already installed
if (Test-Path $sdkToolsPath) {
    Write-Host "SDK tools already installed at: $sdkToolsPath" -ForegroundColor Green
    Write-Host "Configuring Flutter..." -ForegroundColor Yellow
    
    $flutterPath = "C:\src\flutter\bin"
    if (Test-Path "$flutterPath\flutter.bat") {
        $env:PATH = "$flutterPath;" + $env:PATH
        & "$flutterPath\flutter.bat" config --android-sdk $sdkRoot
        Write-Host "Done! Run: flutter build apk --release" -ForegroundColor Green
    }
    exit 0
}

Write-Host "Step 1: Creating SDK directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $sdkRoot | Out-Null
New-Item -ItemType Directory -Force -Path "$sdkRoot\cmdline-tools" | Out-Null

Write-Host "Step 2: Downloading SDK Command Line Tools..." -ForegroundColor Yellow
$toolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$downloadPath = "$env:TEMP\commandlinetools.zip"
$extractPath = "$sdkRoot\cmdline-tools"

Write-Host "Downloading (this may take 2-3 minutes)..." -ForegroundColor Gray

try {
    # Download using BITS
    Start-BitsTransfer -Source $toolsUrl -Destination $downloadPath -DisplayName "Android SDK Tools"
    
    Write-Host "Extracting..." -ForegroundColor Yellow
    $tempExtract = "$env:TEMP\sdk-tools-extract"
    Expand-Archive -Path $downloadPath -DestinationPath $tempExtract -Force
    
    # Find the cmdline-tools folder
    $cmdlineFolder = Get-ChildItem $tempExtract -Recurse -Directory -Filter "cmdline-tools" | Select-Object -First 1
    if (-not $cmdlineFolder) {
        # Try finding bin folder with sdkmanager
        $sdkmanagerPath = Get-ChildItem $tempExtract -Recurse -Filter "sdkmanager.bat" | Select-Object -First 1
        if ($sdkmanagerPath) {
            $cmdlineFolder = $sdkmanagerPath.Directory.Parent
        }
    }
    
    if ($cmdlineFolder) {
        # Create latest directory
        New-Item -ItemType Directory -Force -Path "$extractPath\latest" | Out-Null
        # Copy contents
        Copy-Item "$($cmdlineFolder.FullName)\*" "$extractPath\latest\" -Recurse -Force
    } else {
        # Fallback: try to find any bin folder
        $binFolder = Get-ChildItem $tempExtract -Recurse -Directory -Filter "bin" | Where-Object { Test-Path "$($_.FullName)\sdkmanager.bat" } | Select-Object -First 1
        if ($binFolder) {
            New-Item -ItemType Directory -Force -Path "$extractPath\latest" | Out-Null
            Copy-Item "$($binFolder.Parent.FullName)\*" "$extractPath\latest\" -Recurse -Force
        }
    }
    
    Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
    
    Remove-Item $downloadPath -Force
    
    Write-Host "SDK tools installed!" -ForegroundColor Green
    
    # Add to PATH
    $env:PATH += ";$extractPath\latest\bin"
    [Environment]::SetEnvironmentVariable('Path', "$env:PATH;$extractPath\latest\bin", 'User')
    
    Write-Host ""
    Write-Host "Step 3: Installing SDK Platform..." -ForegroundColor Yellow
    Write-Host "This will install Android SDK Platform (required for building)" -ForegroundColor Gray
    
    # Install SDK platform
    & "$extractPath\latest\bin\sdkmanager.bat" "platform-tools" "platforms;android-33" "build-tools;33.0.0" --sdk_root=$sdkRoot
    
    Write-Host ""
    Write-Host "Step 4: Configuring Flutter..." -ForegroundColor Yellow
    $flutterPath = "C:\src\flutter\bin"
    if (Test-Path "$flutterPath\flutter.bat") {
        $env:PATH = "$flutterPath;" + $env:PATH
        & "$flutterPath\flutter.bat" config --android-sdk $sdkRoot
        
        Write-Host ""
        Write-Host "Step 5: Accepting licenses..." -ForegroundColor Yellow
        & "$flutterPath\flutter.bat" doctor --android-licenses
        
        Write-Host ""
        Write-Host "✅ Setup Complete!" -ForegroundColor Green
        Write-Host "Run: .\build_and_share_apk.ps1" -ForegroundColor Cyan
    } else {
        Write-Host "Flutter not found. Install Flutter first." -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual installation:" -ForegroundColor Yellow
    Write-Host "1. Download: https://developer.android.com/studio#command-tools" -ForegroundColor White
    Write-Host "2. Extract to: $sdkRoot\cmdline-tools\latest" -ForegroundColor White
    Write-Host "3. Run: flutter config --android-sdk $sdkRoot" -ForegroundColor White
}

