# Firebase Setup Guide

**Complete Firebase Configuration for CLCA Courier**

*Last Updated: September 9, 2025*

## 🎯 Overview

This guide provides step-by-step instructions for setting up Firebase services required for the CLCA Courier application, including Authentication, Firestore, Storage, and Hosting.

## 📋 Prerequisites

- Google account with Firebase access
- Node.js 18+ installed
- Firebase CLI installed: `npm install -g firebase-tools`
- CLCA Courier project cloned locally

## 🚀 Firebase Project Setup

### Step 1: Create Firebase Project

1. Visit [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `clca-courier` (or your preferred name)
4. Disable Google Analytics (unless specifically needed)
5. Click "Create project"

### Step 2: Add Web App

1. In Firebase Console, click "Add app" → Web icon
2. Enter app nickname: "CLCA Courier Web"
3. Check "Set up Firebase Hosting" if using Firebase Hosting
4. Click "Register app"
5. **Copy the Firebase configuration** - you'll need this for `.env` file

## 🔐 Authentication Setup

### Step 1: Enable Authentication

1. In Firebase Console, go to "Authentication" → "Get started"
2. Go to "Sign-in method" tab
3. Enable the following providers:

#### Google (Primary Provider)
1. Click "Google" → "Enable"
2. Select support email
3. Add your domain to authorized domains
4. Click "Save"

#### Facebook
1. Click "Facebook" → "Enable"
2. Enter Facebook App ID and App Secret
3. Copy the OAuth redirect URI
4. Configure in Facebook Developer Console
5. Click "Save"

#### Twitter
1. Click "Twitter" → "Enable"
2. Enter Twitter API Key and API Secret
3. Copy the OAuth redirect URI
4. Configure in Twitter Developer Portal
5. Click "Save"

#### GitHub
1. Click "GitHub" → "Enable"
2. Enter GitHub Client ID and Client Secret
3. Copy the OAuth redirect URI
4. Configure in GitHub Developer Settings
5. Click "Save"

### Step 2: Configure Authorized Domains

Add your domains to the authorized list:
- `localhost` (for development)
- Your production domain (e.g., `clca-courier.web.app`)
- Custom domain if applicable

## 📊 Firestore Database Setup

### Step 1: Create Database

1. Go to "Firestore Database" → "Create database"
2. Select "Start in test mode" initially
3. Choose location (us-central1 recommended for North America)
4. Click "Done"

### Step 2: Configure Security Rules

Replace the default rules with production-ready rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to published content
    match /userContent/{document} {
      allow read: if resource.data.status == 'published';
      allow read, write: if isAuthenticated();
      allow create: if isAuthenticated() && 
        request.auth.uid == request.resource.data.authorId;
    }
    
    // Newsletter collection - public read, authenticated write
    match /newsletters/{document} {
      allow read: if true; // Public newsletter access
      allow write: if isAuthenticated();
    }
    
    // User profiles - owner access only
    match /userProfiles/{userId} {
      allow read, write: if isAuthenticated() && 
        request.auth.uid == userId;
    }
    
    // Admin-only collections
    match /systemSettings/{document} {
      allow read, write: if isAdmin();
    }
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/userProfiles/$(request.auth.uid))
        .data.role == 'admin';
    }
  }
}
```

### Step 3: Create Indexes

Create composite indexes for optimal query performance:

```json
{
  "indexes": [
    {
      "collectionGroup": "userContent",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "newsletters",
      "queryScope": "COLLECTION", 
      "fields": [
        { "fieldPath": "published", "order": "ASCENDING" },
        { "fieldPath": "publicationDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "userContent",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "featured", "order": "ASCENDING" },
        { "fieldPath": "publishedAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Save this as `firestore.indexes.json` in your project root.

## 🗄️ Storage Setup

### Step 1: Enable Storage

1. Go to "Storage" → "Get started"
2. Start in test mode initially
3. Choose same location as Firestore
4. Click "Done"

### Step 2: Configure Storage Rules

Replace default rules with secure production rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Newsletter PDFs - public read, authenticated write
    match /newsletters/{allPaths=**} {
      allow read: if true; // Public access to newsletters
      allow write: if request.auth != null;
    }
    
    // User uploads - authenticated access only
    match /uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Thumbnails - public read, authenticated write
    match /thumbnails/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // User avatars - public read, owner write
    match /avatars/{userId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

### Step 3: Create Storage Buckets

Organize storage with folder structure:
```
/newsletters/
  ├── pdfs/           # Newsletter PDF files
  └── thumbnails/     # Auto-generated thumbnails

/uploads/
  └── {userId}/       # User-specific uploads
    ├── images/       # User uploaded images
    └── documents/    # User uploaded documents

/avatars/             # User profile pictures
/system/              # System assets and backups
```

## 🌐 Hosting Setup (Optional)

### Step 1: Initialize Firebase Hosting

```bash
# In your project directory
firebase login
firebase init hosting

# Select:
# - Use existing project
# - Select your Firebase project
# - Public directory: dist/spa
# - Single page app: Yes
# - Set up automatic builds: No (we'll use manual deployment)
```

### Step 2: Configure firebase.json

```json
{
  "hosting": {
    "public": "dist/spa",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

## 🔧 Environment Configuration

### Step 1: Create Environment File

Create `.env` file in project root:

```env
# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Firebase Measurement ID (if Analytics enabled)
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Optional: PDFTron WebViewer License
VITE_PDFTRON_LICENSE_KEY=your_pdftron_license

# Optional: Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

### Step 2: Firebase Configuration File

The app will automatically use environment variables. Verify in `src/config/firebase.config.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

## 🧪 Testing & Verification

### Step 1: Test Firebase Connection

```bash
# Start development server
npm run dev

# Visit application in browser
# Navigate to /firebase-demo (if available) to test all Firebase features
```

### Step 2: Verify Authentication

1. Try logging in with each configured provider
2. Check that user profiles are created in Firestore
3. Verify role assignment works correctly

### Step 3: Test Database Operations

1. Submit test content through the application
2. Verify content appears in Firestore Console
3. Test content approval workflow
4. Confirm public access to published content

### Step 4: Test File Uploads

1. Upload newsletter PDFs through admin interface
2. Verify files appear in Storage Console
3. Test PDF viewing functionality
4. Confirm thumbnail generation (if implemented)

## 🔒 Production Security Checklist

### Before Going Live:

- [ ] **Security Rules**: Change from test mode to production rules
- [ ] **API Keys**: Restrict API keys to specific domains
- [ ] **Authorized Domains**: Remove localhost, add production domains
- [ ] **User Roles**: Set up admin users with appropriate roles
- [ ] **Backup Strategy**: Configure automated Firestore backups
- [ ] **Monitoring**: Enable Firebase Performance Monitoring
- [ ] **Analytics**: Configure Firebase Analytics (if desired)
- [ ] **Budget Alerts**: Set up billing alerts and usage quotas

### Security Rules Verification:

```bash
# Test security rules with Firebase emulator
firebase emulators:start --only firestore,storage
# Run your application against emulator to verify rules
```

## 🚀 Deployment

### Deploy to Firebase Hosting

```bash
# Build production version
npm run build

# Deploy to Firebase
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### Custom Domain (Optional)

1. In Firebase Console, go to Hosting
2. Click "Add custom domain"
3. Follow DNS configuration instructions
4. Wait for SSL certificate provision (up to 24 hours)

## 📊 Monitoring & Maintenance

### Firebase Console Monitoring

- **Authentication**: Monitor user sign-ins and providers
- **Firestore**: Watch for query performance and usage
- **Storage**: Track file uploads and bandwidth usage
- **Hosting**: Monitor page views and performance

### Performance Optimization

- **Database**: Monitor slow queries in Firestore Console
- **Storage**: Optimize large file uploads with resumable uploads
- **Hosting**: Use Firebase Performance Monitoring for web vitals

### Backup & Recovery

- **Firestore**: Set up automated daily backups
- **Storage**: Consider cloud-to-cloud backup solutions
- **Configuration**: Keep environment files backed up securely

## 🆘 Troubleshooting

### Common Issues:

**Authentication Not Working:**
- Check OAuth provider configuration
- Verify authorized domains include your domain
- Confirm API keys are correct and unrestricted

**Database Permission Errors:**
- Verify security rules are deployed
- Check user role assignments in userProfiles collection
- Confirm authentication state in application

**File Upload Failures:**
- Check storage rules allow writes for authenticated users
- Verify storage bucket configuration
- Monitor Firebase Console for detailed error messages

**Build/Deploy Issues:**
- Confirm all environment variables are set
- Check Firebase CLI is logged in: `firebase login`
- Verify project selection: `firebase use --add`

### Getting Help:

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow - Firebase](https://stackoverflow.com/questions/tagged/firebase)

---

**🎉 Congratulations!** Your Firebase backend is now configured and ready for the CLCA Courier application. The system provides authentication, real-time database, file storage, and hosting all optimized for production use.
