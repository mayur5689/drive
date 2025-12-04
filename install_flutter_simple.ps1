# Simple Flutter Installation - Step by Step
Write-Host "=== Flutter Installation Helper ===" -ForegroundColor Cyan
Write-Host ""

# Check if Flutter already exists
$flutterPaths = @("C:\src\flutter", "C:\flutter", "$env:USERPROFILE\flutter")
$flutterFound = $null

foreach ($path in $flutterPaths) {
    if (Test-Path "$path\bin\flutter.bat") {
        $flutterFound = $path
        break
    }
}

if ($flutterFound) {
    Write-Host "Flutter found at: $flutterFound" -ForegroundColor Green
    $flutterBin = Join-Path $flutterFound "bin"
    
    # Add to PATH
    $currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if ($currentPath -notlike "*$flutterBin*") {
        [Environment]::SetEnvironmentVariable('Path', "$currentPath;$flutterBin", 'User')
        Write-Host "Added to PATH. Please restart PowerShell!" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Testing Flutter..." -ForegroundColor Yellow
    & "$flutterBin\flutter.bat" --version
    exit 0
}

Write-Host "Flutter not found. Here are your options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "OPTION 1: Use Winget (Windows Package Manager) - EASIEST" -ForegroundColor Green
Write-Host "Run this command:" -ForegroundColor White
Write-Host "  winget install --id=Google.Flutter -e" -ForegroundColor Cyan
Write-Host ""

Write-Host "OPTION 2: Manual Download (Recommended if winget fails)" -ForegroundColor Green
Write-Host "1. Open browser and go to:" -ForegroundColor White
Write-Host "   https://docs.flutter.dev/get-started/install/windows" -ForegroundColor Cyan
Write-Host "2. Click 'Download Flutter SDK'" -ForegroundColor White
Write-Host "3. Extract zip to C:\src\flutter" -ForegroundColor White
Write-Host "4. Run this script again to add to PATH" -ForegroundColor White
Write-Host ""

Write-Host "OPTION 3: Try automatic download (may take 5-10 minutes)" -ForegroundColor Green
$response = Read-Host "Do you want to try automatic download? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "Starting download..." -ForegroundColor Yellow
    Write-Host "This will take several minutes. Please wait..." -ForegroundColor Yellow
    
    $extractPath = "C:\src"
    $downloadPath = "$env:TEMP\flutter.zip"
    
    # Create directory
    New-Item -ItemType Directory -Force -Path $extractPath | Out-Null
    
    # Download with progress
    $flutterUrl = "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.24.0-stable.zip"
    
    Write-Host "Downloading from: $flutterUrl" -ForegroundColor Gray
    Write-Host "This is a large file (~1GB), please be patient..." -ForegroundColor Yellow
    
    try {
        # Use BITS for better download reliability
        Start-BitsTransfer -Source $flutterUrl -Destination $downloadPath -DisplayName "Flutter SDK"
        
        Write-Host "Download complete! Extracting..." -ForegroundColor Green
        
        # Extract
        Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
        
        # Clean up
        Remove-Item $downloadPath -Force
        
        Write-Host "Installation complete!" -ForegroundColor Green
        
        # Add to PATH
        $flutterBin = "C:\src\flutter\bin"
        $currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
        if ($currentPath -notlike "*$flutterBin*") {
            [Environment]::SetEnvironmentVariable('Path', "$currentPath;$flutterBin", 'User')
            Write-Host "Added to PATH!" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "IMPORTANT: Restart PowerShell, then run: flutter doctor" -ForegroundColor Yellow
        
    } catch {
        Write-Host "Download failed: $_" -ForegroundColor Red
        Write-Host "Please use OPTION 2 (Manual Download) instead" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Please choose one of the options above." -ForegroundColor Yellow
}

