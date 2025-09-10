# 🔧 GitHub Pages Environment Variables Setup

## Issue: Firebase Configuration Missing

When deploying to GitHub Pages, you're seeing this error:
```
Missing required Firebase configuration fields: apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId
```

This happens because GitHub Actions doesn't have access to your Firebase credentials.

## ✅ **Solution: Add GitHub Repository Secrets**

### Step 1: Go to Repository Settings
1. Navigate to your GitHub repository: `https://github.com/yourusername/clca-courier`
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**

### Step 2: Add Repository Secrets
Click **"New repository secret"** for each of these:

| Secret Name | Secret Value |
|-------------|--------------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyACwH9AJZlSYVPdA4dNNb8G3iwIiFto9oY` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `clca-courier-27aed.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `clca-courier-27aed` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `clca-courier-27aed.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `1008202516083` |
| `VITE_FIREBASE_APP_ID` | `1:1008202516083:web:8b846c50c0a00c3e198c06` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-ZEE8YT3ZEN` |
| `VITE_PDFTRON_LICENSE_KEY` | `demo:1755018916059:6190cc190300000000802eeb6de57ad467f2a02c3d73841559f864c933` |

### Step 3: Trigger New Deployment
After adding all secrets:
1. Make a small commit to your repository (or re-run the workflow)
2. GitHub Actions will rebuild with the environment variables
3. Your site should work correctly

## 🔍 **Verification**

After deployment, your GitHub Pages site should:
- ✅ Load without Firebase errors
- ✅ Allow user authentication  
- ✅ Display newsletters and content
- ✅ Show proper Firebase connection

## 🚫 **Security Note**

These Firebase credentials are **client-side safe** because:
- They're meant to be public (used in browser)
- Firebase security is handled by Firestore rules
- Domain restrictions can be set in Firebase Console

The **real security** is in your Firestore rules (which are properly configured).

## 🔧 **Troubleshooting**

### If you still see errors:
1. **Check secret names**: Must match exactly (case-sensitive)
2. **Check secret values**: No extra spaces or quotes
3. **Re-run workflow**: Go to Actions tab and re-run the deployment
4. **Check browser console**: Look for more specific Firebase errors

### Common mistakes:
- ❌ Adding quotes around secret values
- ❌ Typos in secret names  
- ❌ Missing required secrets
- ❌ Using wrong Firebase project credentials

---

**After adding secrets, your next deployment should work perfectly! 🚀**
