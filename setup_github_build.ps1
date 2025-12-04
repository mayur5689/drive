# Setup GitHub Actions for Cloud Build
Write-Host "=== GitHub Actions Cloud Build Setup ===" -ForegroundColor Cyan
Write-Host "This builds APK in the cloud - NO Android Studio needed!" -ForegroundColor Green
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit"
    Write-Host "Git initialized!" -ForegroundColor Green
}

# Create .github/workflows directory
$workflowDir = ".github\workflows"
New-Item -ItemType Directory -Force -Path $workflowDir | Out-Null

# Copy workflow file
Copy-Item "github_actions_build.yml" "$workflowDir\build-apk.yml" -Force

Write-Host "✅ GitHub Actions workflow created!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Create GitHub account: https://github.com" -ForegroundColor White
Write-Host "2. Create new repository" -ForegroundColor White
Write-Host "3. Push your code:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host "4. Go to Actions tab in GitHub" -ForegroundColor White
Write-Host "5. Run workflow manually or it runs on push" -ForegroundColor White
Write-Host "6. Download APK from Actions artifacts" -ForegroundColor White
Write-Host ""
Write-Host "OR use the fast SDK-only install:" -ForegroundColor Yellow
Write-Host "Run: .\install_sdk_only.ps1" -ForegroundColor Cyan

