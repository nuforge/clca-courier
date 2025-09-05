# Firebase Authentication Setup Guide

## Overview

This guide covers the complete Firebase Authentication setup for the CLCA Courier project, including troubleshooting common issues and best practices learned during implementation.

## 🔧 Prerequisites

1. **Firebase Project**: Created at [Firebase Console](https://console.firebase.google.com/)
2. **Firebase CLI**: Installed globally with `npm install -g firebase-tools`
3. **Environment Configuration**: `.env` file with Firebase config variables

## 🚀 Initial Setup

### 1. Firebase Project Configuration

1. Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication service
3. Add a web app to your project
4. Copy the Firebase configuration object

### 2. Environment Variables Setup

Create a `.env` file in your project root with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Firebase Measurement ID for Analytics
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**⚠️ Security Note**: Never commit the actual `.env` file. Use `.env.example` for templates.

### 3. Authentication Providers Setup

Enable the following providers in Firebase Console > Authentication > Sign-in method:

#### Google Sign-in (Primary)

1. Enable Google provider
2. Set project support email
3. Add authorized domains:
   - `localhost` (for development)
   - Your production domain

#### Email/Password (Secondary)

1. Enable Email/Password provider
2. Optionally enable email link sign-in

## 🛠️ Development Configuration

### Quasar Development Server

The most critical lesson learned: **CORS headers in development can break Firebase Authentication popups**.

#### Problem

Firebase Auth popups were failing with "popup-closed-by-user" errors due to restrictive CORS policies.

#### Solution

In `quasar.config.ts`, ensure these headers are **NOT** set in development:

```typescript
// ❌ PROBLEMATIC - These headers break Firebase Auth popups
devServer: {
  headers: {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
  }
}

// ✅ CORRECT - No restrictive CORS headers for Firebase compatibility
devServer: {
  // Clean configuration without CORS restrictions
}
```

### Firebase Service Configuration

The project uses a centralized Firebase configuration in `src/config/firebase.config.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Environment-based configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

## 🔐 Authentication Implementation

### Multi-Provider Authentication Service

The project implements a comprehensive authentication service in `src/services/firebase-auth.service.ts`:

#### Key Features

- **Popup Authentication** with fallback to redirect
- **Multiple OAuth Providers** (Google, Facebook, Twitter, GitHub)
- **Popup Blocking Detection** with automatic fallback
- **Comprehensive Error Handling**
- **User Session Management**

#### Popup vs Redirect Authentication

```typescript
// Primary method: Popup authentication
async signInWithPopup(provider: 'google' | 'facebook' | 'twitter' | 'github') {
  try {
    // Test if popups are allowed
    const canUsePopup = await this.testPopupBlocking();

    if (!canUsePopup) {
      console.warn('Popups blocked, falling back to redirect');
      return this.signInWithRedirect(provider);
    }

    const result = await firebaseSignInWithPopup(auth, authProvider);
    return this.processAuthResult(result);
  } catch (error) {
    // Auto-fallback for popup errors
    if (error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/popup-blocked') {
      return this.signInWithRedirect(provider);
    }
    throw error;
  }
}

// Fallback method: Redirect authentication
async signInWithRedirect(provider: 'google' | 'facebook' | 'twitter' | 'github') {
  const authProvider = this.getAuthProvider(provider);
  await firebaseSignInWithRedirect(auth, authProvider);
  // Result handled by getRedirectResult() on page load
}
```

### Error Handling Patterns

Common Firebase Auth errors and their handling:

```typescript
const errorMessages: Record<string, string> = {
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  'auth/popup-blocked': 'Popup was blocked. Redirecting to sign-in page...',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/account-exists-with-different-credential': 'Account exists with different sign-in method.',
};
```

## 👤 User Profile Management

### Admin User Setup

The project includes a script for creating admin users: `scripts/create-admin-profile.js`

#### Security Challenge

Firestore security rules prevent unauthenticated writes to user profiles, creating a chicken-and-egg problem for admin setup.

#### Solution Pattern

1. **Temporarily modify security rules** to allow initial admin creation
2. **Run admin creation script** with user UID
3. **Restore secure rules** immediately after

```javascript
// Temporary rule for initial admin setup
match /userProfiles/{userId} {
  allow create: if true; // TEMPORARY ONLY!
}

// Secure rule (restored after admin creation)
match /userProfiles/{userId} {
  allow create, update: if isAuthenticated() &&
                           request.auth.uid == userId;
  allow update: if isAdmin() && request.auth.uid != userId;
}
```

#### Admin Creation Process

```bash
# 1. Deploy temporary rules
firebase deploy --only firestore:rules

# 2. Create admin profile
node scripts/create-admin-profile.js USER_UID_HERE

# 3. Restore secure rules
firebase deploy --only firestore:rules
```

## 🧪 Testing & Debugging

### Firebase Demo Page

The project includes a comprehensive testing interface at `/firebase-demo` that provides:

- **Authentication Testing**: All sign-in methods with debug info
- **User Information Display**: UID, email, roles for admin setup
- **Error Simulation**: Test various auth scenarios
- **Popup Blocking Detection**: Real-time popup capability testing

### Key Testing Features

```vue
<!-- Copy UID for admin setup -->
<q-btn @click="copyToClipboard(user.uid)" label="Copy UID for Admin Setup" icon="content_copy" />

<!-- Test popup blocking -->
<q-btn @click="testPopupBlocking" label="Test Popup Blocking" icon="open_in_new" />

<!-- Multiple sign-in methods -->
<q-btn @click="signInWithPopup('google')" label="Sign in with Google (Popup)" icon="login" />
<q-btn
  @click="signInWithRedirect('google')"
  label="Sign in with Google (Redirect)"
  icon="open_in_new"
/>
```

## 🔒 Security Best Practices

### Environment Variable Management

- Use `VITE_` prefix for client-side variables
- Never commit actual `.env` files
- Use different projects for development/production

### Service Account Security

- **Never commit service account keys** to version control
- Store service account keys in secure environment variables
- Use Firebase Admin SDK only in server-side Node.js scripts

### Firestore Security Rules

- Always require authentication for sensitive operations
- Use role-based access control through user profiles
- Test rules thoroughly with Firebase emulator

## 🚨 Common Issues & Solutions

### 1. "popup-closed-by-user" Errors

**Cause**: CORS headers or popup blocking
**Solution**: Remove restrictive CORS headers, implement redirect fallback

### 2. Firebase Config Not Found

**Cause**: Missing or incorrectly named environment variables
**Solution**: Verify `.env` file and `VITE_` prefixes

### 3. Service Account Permission Errors

**Cause**: Firestore security rules blocking admin operations
**Solution**: Use temporary rule modification pattern for initial setup

### 4. Authentication State Persistence

**Cause**: Auth state lost on page refresh
**Solution**: Implement `onAuthStateChanged` listener with persistence

```typescript
onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      user.value = mapFirebaseUser(firebaseUser);
      isAuthenticated.value = true;
    } else {
      user.value = null;
      isAuthenticated.value = false;
    }
    isInitialized.value = true;
  });

  onUnmounted(unsubscribe);
});
```

## 📚 Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin)
- [Quasar Framework](https://quasar.dev/)

## 🎯 Next Steps

After completing authentication setup:

1. Configure Firestore database and security rules
2. Set up Firebase Storage for file uploads
3. Implement user role management
4. Test all authentication flows thoroughly
5. Deploy and configure production Firebase project
