# How to Upload Code to Codemagic

## 🚀 Easiest Method: Upload Code Directly

### Option 1: Manual Upload (No Git Needed!)

1. **On Codemagic page**, click **"Add URL manually"**
2. **Or** select **"GitHub"** → Click **"Next: Authorize Codemagic"**
3. **After authorization**, you'll see option to **"Add repository manually"**
4. **Create GitHub repo** (see steps below) and connect it

---

## 📤 Method 1: Create GitHub Repo and Push (Recommended)

### Step 1: Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `drive-clone` (or any name)
3. Choose **Public** (or Private)
4. **Don't** initialize with README
5. Click **"Create repository"**

### Step 2: Push Your Code

Run these commands in PowerShell:

```powershell
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Drive Clone app"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/drive-clone.git

# Push code
git branch -M main
git push -u origin main
```

### Step 3: Connect to Codemagic

1. Go back to Codemagic
2. Select **"GitHub"**
3. Authorize Codemagic
4. Select your `drive-clone` repository
5. Click **"Finish"**

---

## 📦 Method 2: Upload ZIP File (Fastest - No Git!)

### Step 1: Create ZIP of Your Project

Run this in PowerShell:

```powershell
# Create ZIP file
Compress-Archive -Path .\* -DestinationPath drive-clone.zip -Force

Write-Host "ZIP created: drive-clone.zip" -ForegroundColor Green
Write-Host "Upload this to Codemagic!" -ForegroundColor Yellow
```

### Step 2: Upload to Codemagic

1. On Codemagic, look for **"Upload"** or **"Add manually"** option
2. Or create GitHub repo and upload ZIP there
3. Then connect GitHub to Codemagic

---

## 🔧 Method 3: Use GitHub Desktop (Easiest GUI)

1. **Download GitHub Desktop**: https://desktop.github.com
2. **Install** and sign in
3. **File → Add Local Repository**
4. Select your `drive` folder
5. **Publish repository** to GitHub
6. **Connect to Codemagic** using GitHub option

---

## ⚡ Quick Script to Push to GitHub

I'll create a script that does everything for you!

