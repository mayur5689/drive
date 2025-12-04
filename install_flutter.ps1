# Flutter Installation Script for Windows
# Run this script as Administrator

Write-Host "=== Flutter Installation Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Warning: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Some steps may require admin rights" -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Check if Flutter already exists
Write-Host "Step 1: Checking for existing Flutter installation..." -ForegroundColor Yellow
$flutterPaths = @(
    "C:\src\flutter",
    "C:\flutter",
    "$env:USERPROFILE\flutter",
    "$env:LOCALAPPDATA\flutter"
)

$flutterFound = $false
foreach ($path in $flutterPaths) {
    $flutterBat = Join-Path $path "bin\flutter.bat"
    if (Test-Path $flutterBat) {
        Write-Host "Found Flutter at: $path" -ForegroundColor Green
        $flutterFound = $true
        $foundPath = $path
        break
    }
}

if ($flutterFound) {
    Write-Host "Flutter is already installed!" -ForegroundColor Green
    Write-Host "Adding to PATH..." -ForegroundColor Yellow
    
    # Add to PATH for current session
    $flutterBin = Join-Path $foundPath "bin"
    if ($env:PATH -notlike "*$flutterBin*") {
        $env:PATH += ";$flutterBin"
    }
    
    # Try to add to user PATH permanently
    try {
        $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
        if ($userPath -notlike "*$flutterBin*") {
            [Environment]::SetEnvironmentVariable('Path', "$userPath;$flutterBin", 'User')
            Write-Host "Added Flutter to PATH permanently" -ForegroundColor Green
        }
    } catch {
        Write-Host "Could not add to PATH automatically. Please add manually:" -ForegroundColor Yellow
        Write-Host "   $flutterBin" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "Testing Flutter..." -ForegroundColor Yellow
    & "$flutterBin\flutter.bat" --version
    exit 0
}

# Step 2: Download Flutter
Write-Host "Step 2: Downloading Flutter SDK..." -ForegroundColor Yellow

$flutterVersion = "3.24.0"
$flutterUrl = "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_${flutterVersion}-stable.zip"
$downloadPath = "$env:TEMP\flutter.zip"
$extractPath = "C:\src"

# Create directory
Write-Host "Creating directory: $extractPath" -ForegroundColor Yellow
try {
    New-Item -ItemType Directory -Force -Path $extractPath | Out-Null
} catch {
    Write-Host "✗ Error creating directory. Trying user directory..." -ForegroundColor Red
    $extractPath = "$env:USERPROFILE\flutter"
    New-Item -ItemType Directory -Force -Path $extractPath | Out-Null
}

# Download Flutter
Write-Host "Downloading Flutter SDK (this may take a few minutes)..." -ForegroundColor Yellow
Write-Host "URL: $flutterUrl" -ForegroundColor Gray

try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $flutterUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Host "✗ Download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download manually from:" -ForegroundColor Yellow
    Write-Host "https://docs.flutter.dev/get-started/install/windows" -ForegroundColor Cyan
    exit 1
}

# Step 3: Extract Flutter
Write-Host ""
Write-Host "Step 3: Extracting Flutter SDK..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
    Write-Host "Extraction complete!" -ForegroundColor Green
    
    # Clean up
    Remove-Item $downloadPath -Force
    
    $flutterPath = "$extractPath\flutter"
    $flutterBin = "$flutterPath\bin"
    
    Write-Host "Flutter installed at: $flutterPath" -ForegroundColor Green
} catch {
    Write-Host "✗ Extraction failed: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Add to PATH
Write-Host ""
Write-Host "Step 4: Adding Flutter to PATH..." -ForegroundColor Yellow

try {
    # Add to current session
    $env:PATH += ";$flutterBin"
    
    # Add to user PATH permanently
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if ($userPath -notlike "*$flutterBin*") {
        [Environment]::SetEnvironmentVariable('Path', "$userPath;$flutterBin", 'User')
        Write-Host "Added Flutter to PATH permanently" -ForegroundColor Green
    } else {
        Write-Host "Flutter already in PATH" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not add to PATH automatically" -ForegroundColor Yellow
    Write-Host "Please add manually to PATH:" -ForegroundColor Yellow
    Write-Host "   $flutterBin" -ForegroundColor White
}

# Step 5: Verify Installation
Write-Host ""
Write-Host "Step 5: Verifying installation..." -ForegroundColor Yellow

# Wait a moment for PATH to update
Start-Sleep -Seconds 2

try {
    $flutterBat = Join-Path $flutterBin "flutter.bat"
    $flutterVersion = & $flutterBat --version
    Write-Host "Flutter installed successfully!" -ForegroundColor Green
    Write-Host $flutterVersion
} catch {
    Write-Host "Flutter installed but not accessible yet" -ForegroundColor Yellow
    Write-Host "Please restart PowerShell and run: flutter doctor" -ForegroundColor Yellow
}

# Step 6: Run Flutter Doctor
Write-Host ""
Write-Host "Step 6: Running Flutter Doctor..." -ForegroundColor Yellow
Write-Host "This will check what else needs to be installed" -ForegroundColor Gray
Write-Host ""

try {
    $flutterBat = Join-Path $flutterBin "flutter.bat"
    & $flutterBat doctor
} catch {
    Write-Host "Please restart PowerShell and run: flutter doctor" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. RESTART PowerShell (important!)" -ForegroundColor White
Write-Host "2. Run: flutter doctor" -ForegroundColor White
Write-Host "3. Install Android Studio if needed" -ForegroundColor White
Write-Host "4. Run: flutter pub get (in your project folder)" -ForegroundColor White
Write-Host "5. Run: flutter build apk --release" -ForegroundColor White
Write-Host ""

