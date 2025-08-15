# Google OAuth Setup Guide for Development

## Current Issue

The Google Drive integration is failing with this error:

```
Authentication failed: {error: 'idpiframe_initialization_failed', details: "Not a valid origin for the client: http://localhost... You need to register this origin for your project's client ID."}
```

## Solution: Configure Authorized Origins

### Option 1: Update Existing OAuth Client (Recommended)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to Credentials:**
   - Go to: APIs & Services → Credentials
   - Find OAuth 2.0 Client ID: `9565062327-ijrv4lm9vmtlsbc7pg1ltotdi71g0s62.apps.googleusercontent.com`
   - Click to edit

3. **Add Authorized JavaScript Origins:**

   ```
   http://localhost:9000
   http://localhost:9001
   http://localhost:9002
   http://127.0.0.1:9000
   http://127.0.0.1:9001
   http://127.0.0.1:9002
   ```

4. **Save and Wait:**
   - Click Save
   - Wait 5-10 minutes for changes to propagate

### Option 2: Create New Development OAuth Client

If you can't modify the existing client:

1. **Create New OAuth Client:**
   - In Google Cloud Console → APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "CLCA Courier Development"

2. **Configure Origins:**
   - Authorized JavaScript origins:
     ```
     http://localhost:9000
     http://localhost:9001
     http://localhost:9002
     http://127.0.0.1:9000
     http://127.0.0.1:9001
     http://127.0.0.1:9002
     ```

3. **Update .env file:**
   ```env
   VITE_GOOGLE_CLIENT_ID=your_new_client_id_here
   ```

## Required Google APIs

Make sure these APIs are enabled in your Google Cloud project:

- Google Drive API
- Google Docs API (optional, for document content)
- Google Sheets API (optional, for spreadsheet data)

## Testing the Fix

1. Update the OAuth configuration as described above
2. Restart your development server: `quasar dev`
3. Navigate to `/demo/google-drive-content`
4. Click "Initialize Service"
5. You should see a Google OAuth popup for authentication

## Troubleshooting

- **Still getting origin errors?** Wait longer (up to 30 minutes) for Google's changes to propagate
- **Different port?** Add the actual port your dev server is using to authorized origins
- **HTTPS required?** For production, you'll need to add your HTTPS domain to authorized origins

## Security Note

- Never commit real OAuth client secrets to version control
- Use different OAuth clients for development, staging, and production
- The current setup uses client-side OAuth flow (no client secret needed)
