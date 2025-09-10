#!/bin/bash

# CLCA Courier - Quick Deployment Setup Script
# This script helps prepare the project for GitHub Pages deployment

echo "🚀 CLCA Courier - GitHub Pages Deployment Setup"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: This must be run in a git repository"
    exit 1
fi

echo "✅ Checking project structure..."

# Verify required files exist
required_files=("quasar.config.ts" ".github/workflows/deploy.yml" "src/main.ts")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

echo "✅ Required files found"

# Check if .env.example exists
if [ ! -f ".env.example" ]; then
    echo "❌ Missing .env.example file"
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file - please edit with your Firebase credentials"
else
    echo "ℹ️  .env file already exists"
fi

# Check Node.js version
if command -v node > /dev/null 2>&1; then
    node_version=$(node --version)
    echo "✅ Node.js version: $node_version"
else
    echo "❌ Node.js not found. Please install Node.js 18 or higher"
    exit 1
fi

# Check npm
if command -v npm > /dev/null 2>&1; then
    npm_version=$(npm --version)
    echo "✅ npm version: $npm_version"
else
    echo "❌ npm not found"
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
if npm ci; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Test build
echo ""
echo "🔨 Testing production build..."
if npm run build; then
    echo "✅ Production build successful"
else
    echo "❌ Production build failed"
    exit 1
fi

# Get current repository info
remote_url=$(git config --get remote.origin.url)
current_branch=$(git branch --show-current)

echo ""
echo "📋 Deployment Summary"
echo "===================="
echo "Repository: $remote_url"
echo "Current branch: $current_branch"
echo ""

# Check if we're on main branch
if [ "$current_branch" != "main" ]; then
    echo "⚠️  Warning: Not on 'main' branch. GitHub Pages deployment is configured for 'main' branch."
    echo "   Consider switching to 'main' branch or updating the workflow file."
fi

echo "🎯 Next Steps:"
echo "1. Set up GitHub Pages in repository settings:"
echo "   Settings → Pages → Source: GitHub Actions"
echo ""
echo "2. Add Firebase secrets to repository:"
echo "   Settings → Secrets and variables → Actions"
echo ""
echo "3. Required secrets:"
echo "   - VITE_FIREBASE_API_KEY"
echo "   - VITE_FIREBASE_AUTH_DOMAIN"
echo "   - VITE_FIREBASE_PROJECT_ID"
echo "   - VITE_FIREBASE_STORAGE_BUCKET"
echo "   - VITE_FIREBASE_MESSAGING_SENDER_ID"
echo "   - VITE_FIREBASE_APP_ID"
echo "   - VITE_FIREBASE_MEASUREMENT_ID (optional)"
echo "   - VITE_PDFTRON_LICENSE_KEY (optional)"
echo ""
echo "4. Update repository name in quasar.config.ts if needed"
echo ""
echo "5. Push to main branch to trigger deployment"
echo ""
echo "📚 See DEPLOYMENT_CHECKLIST.md for complete setup guide"
echo ""
echo "🎉 Setup complete! Ready for GitHub Pages deployment."
