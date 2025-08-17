# Google Identity Services (GIS) OAuth Setup Guide

## 📋 **Overview**

This project now uses the modern **Google Identity Services (GIS)** for authentication instead of the deprecated `gapi.auth2` library. This provides better security and compatibility with Google's latest authentication standards.

## 🔧 **Required Configuration**

### **1. Google Cloud Console Setup**

1. **Go to Google Cloud Console:**
   - Visit [console.cloud.google.com](https://console.cloud.google.com/)
   - Select your project: `clca-courier`

2. **Navigate to Credentials:**
   - Left sidebar → **APIs & Services** → **Credentials**
   - Direct link: [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

3. **Configure OAuth 2.0 Client ID:**
   - Find your client ID: `9565062327-rm764o4acko2n3l9sbrs5kudfilp3o5e.apps.googleusercontent.com`
   - Click the **edit/pencil icon** (✏️) next to it
   - Make sure **Application type** is set to **"Web application"**

4. **Add Authorized JavaScript Origins:**

   ```
   http://localhost:9000
   http://localhost:9001
   http://localhost:9002
   http://127.0.0.1:9000
   http://127.0.0.1:9001
   http://127.0.0.1:9002
   ```

5. **Add Authorized Redirect URIs (optional for token flow):**
   ```
   http://localhost:9000
   http://localhost:9001
   http://localhost:9002
   ```

### **2. Enable Required APIs**

Make sure these APIs are enabled in your Google Cloud project:

- **Google Drive API**
- **Google Docs API**
- **Google Sheets API**

## 🚀 **Testing Authentication**

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Navigate to the demo page:**
   - Go to `http://localhost:9001/google-drive-content-demo`

3. **Test the authentication flow:**
   - Click "Initialize Service"
   - Click "Authenticate with Google"
   - Complete the OAuth consent flow

## 🔍 **Troubleshooting**

### **Common Error: "Not a valid origin"**

- **Cause:** Your localhost URL isn't added to the OAuth client's authorized origins
- **Solution:** Add `http://localhost:9001` to the **Authorized JavaScript origins** in Google Cloud Console

### **Error: "idpiframe_initialization_failed"**

- **Cause:** Using deprecated `gapi.auth2` instead of Google Identity Services
- **Solution:** ✅ **Already fixed!** The code now uses the modern GIS library

### **Error: "popup_blocked"**

- **Cause:** Browser is blocking the OAuth popup
- **Solution:** Allow popups for `localhost` in your browser settings

### **Token Client Issues**

- **Cause:** Google Identity Services not properly loaded
- **Solution:** The service now loads both GIS and GAPI scripts in the correct order

## 📚 **Technical Details**

### **What Changed:**

1. **Old Method (Deprecated):**

   ```javascript
   // ❌ Old way - no longer works
   await window.gapi.auth2.init({
     client_id: clientId,
     scope: scope,
   });
   const authInstance = window.gapi.auth2.getAuthInstance();
   const user = await authInstance.signIn();
   ```

2. **New Method (Google Identity Services):**
   ```javascript
   // ✅ New way - current implementation
   const tokenClient = window.google.accounts.oauth2.initTokenClient({
     client_id: clientId,
     scope: scope,
     callback: (response) => {
       // Handle the access token
     },
   });
   tokenClient.requestAccessToken({ prompt: 'consent' });
   ```

### **Benefits of GIS:**

- ✅ Modern security standards
- ✅ Better popup handling
- ✅ Improved user experience
- ✅ Future-proof authentication
- ✅ Better error handling

## 🔄 **Migration Notes**

If you're updating from an existing OAuth client:

1. **Check Application Type:** Must be "Web application"
2. **Update Origins:** Add all localhost ports you use for development
3. **Test Thoroughly:** The new flow requires user consent on first use

## 📞 **Need Help?**

If you're still having issues:

1. **Check Browser Console:** Look for specific error messages
2. **Verify Credentials:** Ensure your `.env` file has the correct client ID
3. **Clear Browser Cache:** Sometimes old auth tokens interfere
4. **Try Incognito Mode:** Eliminates browser extension conflicts

---

**✅ Current Status:** Google Identity Services implementation is complete and ready for testing!
