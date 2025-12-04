# Quick Flutter Runner Script
# This adds Flutter to PATH and runs your command

# Add Flutter to PATH for this session
$flutterPath = "C:\src\flutter\bin"
if ($env:PATH -notlike "*$flutterPath*") {
    $env:PATH = "$flutterPath;" + $env:PATH
}

# Run the command passed as arguments
if ($args.Count -eq 0) {
    Write-Host "Usage: .\run_flutter.ps1 <flutter-command>" -ForegroundColor Yellow
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\run_flutter.ps1 run -d chrome" -ForegroundColor Cyan
    Write-Host "  .\run_flutter.ps1 build apk --release" -ForegroundColor Cyan
    Write-Host "  .\run_flutter.ps1 doctor" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or use Flutter directly:" -ForegroundColor Yellow
    Write-Host "  C:\src\flutter\bin\flutter.bat <command>" -ForegroundColor Cyan
} else {
    & "C:\src\flutter\bin\flutter.bat" $args
}

