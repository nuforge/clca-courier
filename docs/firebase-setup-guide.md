# Firebase Integration Guide

## Overview

This guide will help you set up Firebase for the CLCA Courier project, including Authentication, Firestore Database, and Cloud Storage for PDFs and user-generated content.

## Prerequisites

1. Google Account
2. Firebase project
3. Firebase CLI installed globally: `npm install -g firebase-tools`

## Step 1: Create Firebase Project

### 1.1 Go to Firebase Console

Visit [Firebase Console](https://console.firebase.google.com/)

### 1.2 Create New Project

1. Click "Create a project" or "Add project"
2. Project name: `clca-courier` (or your preferred name)
3. Enable Google Analytics (recommended)
4. Select or create a Google Analytics account
5. Click "Create project"

### 1.3 Project Settings

1. Go to Project Settings (gear icon)
2. In the "General" tab, scroll down to "Your apps"
3. Click "Web" icon (</>) to add a web app
4. App nickname: `CLCA Courier Web`
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"

## Step 2: Configure Firebase Services

### 2.1 Authentication Setup

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable these providers:
   - **Google** (required for Google Drive compatibility)
   - **Email/Password** (for regular users)
   - **Anonymous** (optional, for guest access)

#### Google Sign-in Configuration:

1. Click on "Google" provider
2. Enable it
3. Set support email
4. Add your domain to authorized domains:
   - `localhost` (for development)
   - `your-production-domain.com`

### 2.2 Firestore Database Setup

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select your preferred location (choose closest to your users)
5. Click "Done"

#### Initial Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read published newsletters
    match /newsletters/{document} {
      allow read: if resource.data.isPublished == true;
      allow write: if request.auth != null &&
                   get(/databases/$(database)/documents/userProfiles/$(request.auth.uid)).data.role in ['editor', 'admin'];
    }

    // Allow users to manage their own content submissions
    match /userContent/{document} {
      allow read, write: if request.auth != null &&
                        (resource.data.authorId == request.auth.uid ||
                         get(/databases/$(database)/documents/userProfiles/$(request.auth.uid)).data.role in ['editor', 'admin']);
    }

    // Allow users to read/write their own profile
    match /userProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null &&
                  get(/databases/$(database)/documents/userProfiles/$(request.auth.uid)).data.role in ['editor', 'admin'];
    }

    // Allow editors to manage newsletter issues
    match /newsletterIssues/{document} {
      allow read: if resource.data.status == 'published';
      allow write: if request.auth != null &&
                   get(/databases/$(database)/documents/userProfiles/$(request.auth.uid)).data.role in ['editor', 'admin'];
    }
  }
}
```

### 2.3 Cloud Storage Setup

1. Go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode"
4. Select your preferred location (same as Firestore)
5. Click "Done"

#### Initial Storage Security Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to user-uploads folder
    match /user-uploads/{allPaths=**} {
      allow read, write: if request.auth != null;
    }

    // Allow editors to manage newsletters folder
    match /newsletters/{allPaths=**} {
      allow read: if true; // Public read access to published newsletters
      allow write: if request.auth != null; // Will be refined with role checking
    }

    // Allow public read access to thumbnails
    match /thumbnails/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Temporary folder for processing
    match /temp/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 3: Get Configuration Values

### 3.1 Web App Configuration

1. Go to Project Settings > General tab
2. Scroll down to "Your apps"
3. Find your web app and click the config icon
4. Copy the configuration object:

```javascript
const firebaseConfig = {
  apiKey: 'your-api-key',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456',
};
```

### 3.2 Environment Variables Setup

1. Copy `.env.example` to `.env`
2. Fill in your Firebase configuration:

```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

## Step 4: Google Cloud Console Configuration

### 4.1 Enable APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "APIs & Services" > "Library"
4. Enable these APIs:
   - **Firebase Authentication API**
   - **Cloud Firestore API**
   - **Cloud Storage for Firebase API**
   - **Google Drive API** (for legacy compatibility)

### 4.2 OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required information:
   - App name: "CLCA Courier"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/drive.readonly` (for Google Drive compatibility)

### 4.3 OAuth 2.0 Client IDs

1. Go to "APIs & Services" > "Credentials"
2. The Firebase setup should have created a Web client
3. Edit the Web client and add authorized origins:
   - `http://localhost:9000` (development)
   - `http://localhost:9001` (alternative dev port)
   - `https://your-domain.com` (production)

## Step 5: Testing the Setup

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Verify Firebase Connection

1. Open browser console
2. Look for Firebase initialization messages
3. Try signing in with Google
4. Check Firebase Console for new users

### 5.3 Test File Upload

1. Try uploading a PDF through the interface
2. Check Firebase Storage for the uploaded file
3. Verify metadata in Firestore

## Step 6: Advanced Configuration

### 6.1 Custom User Roles

Create initial admin user in Firestore:

```javascript
// Collection: userProfiles
// Document ID: your-user-uid
{
  uid: "your-user-uid",
  email: "admin@example.com",
  displayName: "Admin User",
  role: "admin",
  permissions: ["read", "write", "admin"],
  isApproved: true,
  createdAt: "2023-XX-XX",
  preferences: {
    emailNotifications: true,
    pushNotifications: false,
    preferredCategories: []
  }
}
```

### 6.2 Content Approval Workflow

The system includes an approval workflow for user-submitted content:

1. Users submit content (status: "pending")
2. Editors review and approve/reject (status: "approved"/"rejected")
3. Approved content can be published (status: "published")

### 6.3 PDF Migration from Google Drive

Use the migration tools to transfer existing PDFs:

```bash
# Run the migration script (to be created)
npm run migrate:pdfs
```

## Step 7: Production Deployment

### 7.1 Update Security Rules

Replace test mode rules with production-ready security rules (see above).

### 7.2 Configure Hosting (Optional)

```bash
firebase init hosting
firebase deploy --only hosting
```

### 7.3 Environment Variables for Production

Update your production environment with the same Firebase configuration values.

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check OAuth consent screen configuration
   - Verify authorized domains
   - Check browser console for errors

2. **Firestore permission denied**
   - Update security rules
   - Check user authentication status
   - Verify user role in userProfiles collection

3. **Storage upload fails**
   - Check storage security rules
   - Verify file size limits
   - Check user authentication

4. **CORS errors**
   - Add your domain to authorized origins
   - Check Firebase project settings

### Getting Help

1. Firebase Console > Support
2. [Firebase Documentation](https://firebase.google.com/docs)
3. [Firebase Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

## Next Steps

1. **Set up Cloud Functions** for advanced server-side processing
2. **Implement push notifications** for content updates
3. **Add analytics** for usage tracking
4. **Set up automated backups** for Firestore data
5. **Implement full-text search** with Algolia or similar service

## Security Considerations

1. **Never expose API keys** in client-side code for server-only operations
2. **Always validate data** on the server side (Cloud Functions)
3. **Use security rules** to restrict data access
4. **Monitor usage** in Firebase Console
5. **Set up billing alerts** to avoid unexpected charges

## Cost Management

1. **Firestore**: Pay per read/write operation
2. **Storage**: Pay per GB stored and transferred
3. **Authentication**: Free up to 50,000 MAU
4. **Functions**: Pay per invocation and compute time

Monitor usage in Firebase Console > Usage and billing.
