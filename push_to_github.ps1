# Push Code to GitHub - Automated Script
Write-Host "=== Push Code to GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    Write-Host "Git initialized!" -ForegroundColor Green
}

# Check if .gitignore exists
if (-not (Test-Path ".gitignore")) {
    Write-Host "Creating .gitignore..." -ForegroundColor Yellow
    @"
# Build files
build/
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/

# IDE
.idea/
.vscode/
*.iml

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
}

# Add all files
Write-Host "Adding files..." -ForegroundColor Yellow
git add .

# Check if there are changes
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
} else {
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m "Drive Clone Flutter App"
    Write-Host "Committed!" -ForegroundColor Green
}

# Check if remote exists
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "=== GitHub Repository Setup ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You need to create a GitHub repository first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "2. Repository name: drive-clone" -ForegroundColor White
    Write-Host "3. Choose Public" -ForegroundColor White
    Write-Host "4. DON'T initialize with README" -ForegroundColor White
    Write-Host "5. Click 'Create repository'" -ForegroundColor White
    Write-Host ""
    
    $githubUser = Read-Host "Enter your GitHub username"
    $repoName = Read-Host "Enter repository name (or press Enter for 'drive-clone')"
    if ([string]::IsNullOrWhiteSpace($repoName)) {
        $repoName = "drive-clone"
    }
    
    Write-Host ""
    Write-Host "Adding remote..." -ForegroundColor Yellow
    git remote add origin "https://github.com/$githubUser/$repoName.git"
    
    Write-Host ""
    Write-Host "Creating main branch..." -ForegroundColor Yellow
    git branch -M main
    
    Write-Host ""
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    Write-Host "You may be prompted for GitHub credentials" -ForegroundColor Gray
    
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Code pushed to GitHub!" -ForegroundColor Green
        Write-Host "Repository: https://github.com/$githubUser/$repoName" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Now go to Codemagic and connect this repository!" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "Push failed. You may need to:" -ForegroundColor Yellow
        Write-Host "1. Use GitHub Desktop (easier)" -ForegroundColor White
        Write-Host "2. Or use Personal Access Token" -ForegroundColor White
        Write-Host "3. Or upload ZIP file to GitHub manually" -ForegroundColor White
    }
} else {
    Write-Host "Remote already exists: $remote" -ForegroundColor Green
    Write-Host "Pushing changes..." -ForegroundColor Yellow
    git push
}

