# GitHub Pages Deployment Guide

## 🚀 Quick Start for GitHub Pages

This project is **ready for immediate deployment** to GitHub Pages with optimized configuration.

### 1. Repository Setup

**Option A: Fork this Repository**
1. Fork this repository to your GitHub account
2. GitHub Pages will be automatically configured

**Option B: Clone and Create New Repository**
1. Clone this repository: `git clone https://github.com/nuforge/clca-courier.git`
2. Create a new repository on GitHub
3. Update the remote origin: `git remote set-url origin https://github.com/yourusername/your-repo-name.git`

### 2. Configure GitHub Pages

1. Go to your repository → **Settings** → **Pages**
2. Source: **GitHub Actions** (recommended)
3. The deployment workflow will run automatically on pushes to `main`

### 3. Add Required Secrets

Add these in **Settings** → **Secrets and variables** → **Actions**:

#### 🔥 Firebase Configuration (Required)
```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com  
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

#### 📄 Optional PDF Features
```bash
VITE_PDFTRON_LICENSE_KEY=your_license_key  # For PDFTron WebViewer
```

### 4. Update Configuration

1. **Update Repository Name** in `quasar.config.ts`:
   ```typescript
   publicPath: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',
   ```

2. **Verify Firebase Project** matches your actual Firebase project

### 5. Deploy

1. Push to `main` branch: `git push origin main`
2. Check **Actions** tab for deployment progress
3. Your site will be live at: `https://yourusername.github.io/your-repo-name`

## 🔧 Advanced Configuration

### Custom Domain Setup

1. Add `CNAME` file to `public/` directory:
   ```
   your-domain.com
   ```

2. Configure DNS with your domain provider:
   ```
   CNAME record: www.your-domain.com → yourusername.github.io
   A records for apex domain (your-domain.com):
   185.199.108.153
   185.199.109.153  
   185.199.110.153
   185.199.111.153
   ```

3. Enable HTTPS in repository settings

### Environment-Specific Builds

The project supports multiple environments via branch-based deployment:

- **Production**: `main` branch → GitHub Pages
- **Staging**: `develop` branch → Custom deployment (optional)
- **Development**: Local development with `npm run dev`

## 📋 Pre-Deployment Checklist

- [ ] ✅ Repository forked/cloned and configured
- [ ] ✅ GitHub Pages enabled with Actions source
- [ ] ✅ Firebase project created and configured  
- [ ] ✅ All required secrets added to GitHub repository
- [ ] ✅ Repository name updated in `quasar.config.ts` if needed
- [ ] ✅ Firebase security rules deployed
- [ ] ✅ Local development tested with `npm run dev`
- [ ] ✅ Production build tested with `npm run build`

## 🛠️ Local Development
## 🛠️ Local Development

### Quick Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your Firebase credentials

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Development server with hot reload
npm run build        # Production build
npm run build:prod   # High-memory production build  
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run test         # Run tests
```

## 🔒 Security & Best Practices

### ✅ Security Features
- **No sensitive data** committed to repository
- **Environment variables** properly configured for GitHub Actions
- **Firebase rules** restrict unauthorized access
- **HTTPS enforced** in production
- **CSP headers** configured for security

### � Performance Optimizations
- **Code splitting** - 74 optimized chunks
- **Tree shaking** - Unused code eliminated
- **Lazy loading** - Routes loaded on demand
- **Asset optimization** - Images and assets optimized
- **CDN integration** - Firebase hosting with global CDN

### 📱 Production Features
- **Progressive Web App** - Offline capability
- **Mobile responsive** - Optimized for all devices
- **SEO optimized** - Meta tags and structured data
- **Analytics ready** - Google Analytics integration
- **Error tracking** - Comprehensive error handling

## 🔧 Troubleshooting

### Build Issues

**TypeScript Compilation Errors**
```bash
# Check for type errors
npm run lint
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Large Bundle Warnings**
- The project uses code splitting to minimize bundle size
- Main bundle is optimized at 2.6MB JS / 552KB CSS
- Large files are chunked for better loading performance

### Deployment Issues

**GitHub Actions Failing**
1. Check all required secrets are added
2. Verify Firebase credentials are correct
3. Check the Actions tab for detailed error logs
4. Ensure the repository has Pages enabled

**Site Not Loading**
1. Verify deployment completed successfully
2. Check GitHub Pages is enabled with Actions source
3. Ensure custom domain (if used) is properly configured
4. Check browser console for JavaScript errors

**Firebase Connection Issues**
1. Verify Firebase project ID matches
2. Check Firestore security rules allow public read access
3. Ensure Storage rules permit file access
4. Verify Firebase hosting is configured (if using Firebase hosting)

### 🔍 Debug Mode

For development debugging:
```bash
# Enable Quasar debug mode
quasar dev --debug

# Check Firebase connection
npm run dev
# Open browser console and look for Firebase initialization logs
```

### 📊 Performance Monitoring

The application includes built-in performance monitoring:
- **Core Web Vitals** tracking
- **Firebase Performance** monitoring
- **Error boundary** components
- **Loading state** management

## 📞 Support

### Documentation
- [Quick Start Guide](./quickstart.md)
- [Architecture Overview](./architecture.md) 
- [Firebase Setup](./firebase-setup.md)
- [Development Guide](./development/README.md)

### Common Issues
- Check [GitHub Issues](https://github.com/nuforge/clca-courier/issues) for known problems
- Review [System Analysis Report](../SYSTEM_ANALYSIS_REPORT.md) for technical details
- See [Troubleshooting Guide](./troubleshooting.md) for solutions

---

**🎉 Congratulations!** Your CLCA Courier platform is now ready for production deployment on GitHub Pages with enterprise-grade features and security.
