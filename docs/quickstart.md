# Quick Start Guide

**Get CLCA Courier Running in 10 Minutes**

*Last Updated: September 9, 2025*

## 🚀 Prerequisites

Before starting, ensure you have:
- **Node.js 18+** installed ([download here](https://nodejs.org/))
- **Git** installed for cloning the repository
- **Firebase account** (free tier available)
- **Code editor** (VS Code recommended)

## ⚡ Fast Track Setup

### 1. Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/nuforge/clca-courier.git
cd clca-courier

# Install dependencies
npm install

# Verify installation
npm run dev
```

If successful, you'll see the development server start at `http://localhost:9000`

### 2. Firebase Quick Setup (5 minutes)

#### Create Firebase Project:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" → Enter "clca-courier" → Continue
3. Disable Google Analytics → Create project

#### Enable Required Services:
1. **Authentication**: Go to Authentication → Get started → Sign-in method
   - Enable "Google" provider
   - Add your email as support email
   
2. **Firestore**: Go to Firestore Database → Create database
   - Start in test mode → Select location → Done
   
3. **Storage**: Go to Storage → Get started
   - Start in test mode → Done

#### Get Configuration:
1. Go to Project Settings (gear icon) → General tab
2. Scroll to "Your apps" → Click web icon → Register app
3. Copy the `firebaseConfig` object

### 3. Environment Configuration (1 minute)

Create `.env` file in project root:

```env
# Paste your Firebase config here
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. First Run (1 minute)

```bash
# Start development server
npm run dev

# Open browser to http://localhost:9000
# Try logging in with Google
# Upload a test newsletter (optional)
```

## ✅ Verification Checklist

After setup, verify these features work:

- [ ] **Homepage loads** without errors
- [ ] **Authentication** - Can log in with Google
- [ ] **Newsletter Archive** - Can browse `/archive` page
- [ ] **Community Content** - Can view `/community` page
- [ ] **Admin Access** - Can access `/admin` after login
- [ ] **Content Submission** - Can access `/contribute/submit` after login

## 🎯 Key Pages to Test

| Page | URL | Purpose | Auth Required |
|------|-----|---------|---------------|
| Homepage | `/` | Main landing page | No |
| Newsletter Archive | `/archive` | PDF newsletter browser | No |
| Community Hub | `/community` | Community content | No |
| Content Submission | `/contribute/submit` | Submit content | Yes |
| Admin Dashboard | `/admin` | Administrative tools | Yes |
| Content Management | `/admin/content` | Content review | Yes |

## 🔧 Common Issues & Solutions

### Issue: "Module not found" errors
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Firebase configuration errors
**Solution**: 
- Double-check `.env` file formatting
- Ensure no spaces around `=` signs
- Verify all Firebase services are enabled

### Issue: Build fails
**Solution**: 
```bash
# Check for TypeScript errors
npm run build

# If errors exist, check console output for specific issues
```

### Issue: Authentication not working
**Solution**: 
- Verify Google OAuth is enabled in Firebase Console
- Check authorized domains include `localhost`
- Confirm correct Firebase configuration

## 📚 Next Steps

Once your quick setup is complete:

### Immediate Next Steps:
1. **Read the [Architecture Guide](architecture.md)** to understand the system
2. **Review [Content Management](content-management.md)** to learn content workflows
3. **Configure production security** using [Firebase Setup Guide](firebase-setup.md)

### Content Setup:
1. **Upload Newsletter PDFs**: Use admin interface to add historical newsletters
2. **Create User Content**: Test the content submission and review workflow
3. **Configure Community Map**: Add community property data (optional)

### Production Preparation:
1. **Security Rules**: Update Firebase rules for production (see Firebase Setup Guide)
2. **Domain Configuration**: Set up custom domain and SSL
3. **Performance Optimization**: Enable Firebase Analytics and Performance Monitoring

## 🚀 Development Workflow

### Daily Development:
```bash
# Start development
npm run dev

# In separate terminal - watch for type errors
npm run type-check

# Before committing
npm run lint
npm run format
```

### Building for Production:
```bash
# Test production build
npm run build

# Serve production build locally
npm run preview

# Deploy to Firebase (after production setup)
npm run deploy
```

## 🛠️ Development Tools

### Recommended VS Code Extensions:
- **Vue Language Features (Volar)** - Vue 3 support
- **TypeScript Vue Plugin (Volar)** - TypeScript in Vue files
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Firebase Explorer** - Firebase integration

### Useful Commands:
```bash
# Check bundle size
npm run build && ls -la dist/spa/assets/

# Run linting with fix
npm run lint -- --fix

# Format all files
npm run format

# Clear cache and reinstall
npm run clean && npm install
```

## 📊 Performance Expectations

### Development Performance:
- **Cold Start**: ~10-15 seconds
- **Hot Reload**: ~200-500ms
- **TypeScript Compilation**: ~2-5 seconds

### Production Build:
- **Build Time**: ~30-60 seconds
- **Bundle Size**: ~2.4MB JS, ~540KB CSS
- **First Load**: ~1-3 seconds (depending on network)

## 🆘 Getting Help

### Documentation:
- **[Architecture Guide](architecture.md)** - System design and patterns
- **[Firebase Setup](firebase-setup.md)** - Complete Firebase configuration
- **[Content Management](content-management.md)** - Content workflow guide

### Community Resources:
- **[Vue 3 Documentation](https://v3.vuejs.org/)**
- **[Quasar Framework](https://quasar.dev/)**
- **[Firebase Documentation](https://firebase.google.com/docs)**

### Troubleshooting:
- Check browser console for JavaScript errors
- Verify Firebase Console for backend issues
- Use Vue DevTools for component debugging
- Check Network tab for API request issues

---

**🎉 Congratulations!** You now have a fully functional CLCA Courier development environment. The application is production-ready and can be deployed immediately after security configuration.
