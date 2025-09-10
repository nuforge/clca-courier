# CLCA Courier - Quick Deployment Setup Script (PowerShell)
# This script helps prepare the project for GitHub Pages deployment

Write-Host "🚀 CLCA Courier - GitHub Pages Deployment Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: This must be run in a git repository" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Checking project structure..." -ForegroundColor Green

# Verify required files exist
$requiredFiles = @("quasar.config.ts", ".github/workflows/deploy.yml", "src/App.vue")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Missing required file: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Required files found" -ForegroundColor Green

# Check if .env.example exists
if (-not (Test-Path ".env.example")) {
    Write-Host "❌ Missing .env.example file" -ForegroundColor Red
    exit 1
}

# Create .env if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file - please edit with your Firebase credentials" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env file already exists" -ForegroundColor Blue
}

# Check Node.js version
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18 or higher" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
try {
    npm ci
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Test build
Write-Host ""
Write-Host "🔨 Testing production build..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Production build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Production build failed" -ForegroundColor Red
    exit 1
}

# Get current repository info
$remoteUrl = git config --get remote.origin.url
$currentBranch = git branch --show-current

Write-Host ""
Write-Host "📋 Deployment Summary" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "Repository: $remoteUrl"
Write-Host "Current branch: $currentBranch"
Write-Host ""

# Check if we're on main branch
if ($currentBranch -ne "main") {
    Write-Host "⚠️  Warning: Not on 'main' branch. GitHub Pages deployment is configured for 'main' branch." -ForegroundColor Yellow
    Write-Host "   Consider switching to 'main' branch or updating the workflow file."
}

Write-Host "🎯 Next Steps:" -ForegroundColor Green
Write-Host "1. Set up GitHub Pages in repository settings:"
Write-Host "   Settings → Pages → Source: GitHub Actions"
Write-Host ""
Write-Host "2. Add Firebase secrets to repository:"
Write-Host "   Settings → Secrets and variables → Actions"
Write-Host ""
Write-Host "3. Required secrets:" -ForegroundColor Yellow
Write-Host "   - VITE_FIREBASE_API_KEY"
Write-Host "   - VITE_FIREBASE_AUTH_DOMAIN"
Write-Host "   - VITE_FIREBASE_PROJECT_ID"
Write-Host "   - VITE_FIREBASE_STORAGE_BUCKET"
Write-Host "   - VITE_FIREBASE_MESSAGING_SENDER_ID"
Write-Host "   - VITE_FIREBASE_APP_ID"
Write-Host "   - VITE_FIREBASE_MEASUREMENT_ID (optional)"
Write-Host "   - VITE_PDFTRON_LICENSE_KEY (optional)"
Write-Host ""
Write-Host "4. Update repository name in quasar.config.ts if needed"
Write-Host ""
Write-Host "5. Push to main branch to trigger deployment"
Write-Host ""
Write-Host "📚 See DEPLOYMENT_CHECKLIST.md for complete setup guide" -ForegroundColor Blue
Write-Host ""
Write-Host "🎉 Setup complete! Ready for GitHub Pages deployment." -ForegroundColor Green
