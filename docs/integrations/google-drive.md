# Google Drive Integration

Complete documentation for Google Drive integration in CLCA Courier.

## ⚠️ CRITICAL CORS LIMITATION

**IMPORTANT:** Google Drive URLs are subject to strict CORS (Cross-Origin Resource Sharing) policies that CANNOT be bypassed through client-side JavaScript.

### What DOESN'T Work:

- ❌ **PDF.js cannot directly access Google Drive URLs** - even with URL conversion
- ❌ **Canvas/image processing fails** due to browser security restrictions
- ❌ **Direct fetch() requests to Drive URLs will always fail** with CORS errors
- ❌ **URL conversion workarounds** (`drive.google.com/uc?export=download&id=ID`) still trigger CORS

### What DOES Work:

- ✅ **Server-side proxy** to fetch and serve Google Drive content
- ✅ **Google Drive API with proper authentication** (server-side)
- ✅ **Download files to local storage** and serve from your domain
- ✅ **Use Google Drive only for storage**, not direct client access

## Setup Instructions

### 1. Google Cloud Console Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable APIs:**
   - Go to "APIs & Services" > "Library"
   - Enable "Google Drive API"
   - Enable "Google Identity Services"

3. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Configure for web application

### 2. OAuth Configuration

**Required Authorized JavaScript Origins:**

```
http://localhost:9000
http://localhost:9001
http://localhost:9002
http://127.0.0.1:9000
https://yourdomain.com
```

**Required Authorized Redirect URIs:**

```
http://localhost:9000/auth/callback
https://yourdomain.com/auth/callback
```

### 3. Environment Variables

Create `.env` file with:

```bash
VITE_GOOGLE_DRIVE_API_KEY=your_api_key_here
VITE_GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_DRIVE_CONTENT_FOLDER_ID=folder_id_here
VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID=folder_id_here
VITE_GOOGLE_DRIVE_IMAGES_FOLDER_ID=folder_id_here
```

## Current Architecture

### Service Layer (Unified)

```
src/services/google-drive/
├── index.ts                     # Main GoogleDriveService facade
├── google-drive-auth.service.ts # Authentication handling
├── google-drive-api.service.ts  # API operations
└── legacy-compatibility.service.ts # Backward compatibility
```

### Legacy Services (For Compatibility)

- `google-drive-content-service.ts` - Content management with caching
- `google-drive-browser-service.ts` - Browser-specific operations
- `google-drive-thumbnail-service.ts` - Thumbnail generation

## Usage Examples

### Basic Authentication

```typescript
import { GoogleDriveService } from '@/services/google-drive';

const config = {
  clientId: process.env.VITE_GOOGLE_DRIVE_CLIENT_ID,
  apiKey: process.env.VITE_GOOGLE_DRIVE_API_KEY,
  scope: 'https://www.googleapis.com/auth/drive.readonly',
};

const driveService = new GoogleDriveService(config);
await driveService.initialize();
const isAuthenticated = await driveService.authenticate();
```

### File Operations

```typescript
// Get PDF files
const pdfFiles = await driveService.getPdfFiles();

// Get file metadata
const file = await driveService.getFile('file_id_here');

// Download file
const blob = await driveService.downloadFile('file_id_here');
```

## Troubleshooting

### Common Errors

**"Not a valid origin for the client"**

- Add your development URLs to authorized origins in Google Cloud Console

**"CORS error when accessing Drive URLs"**

- This is expected behavior; use server-side proxy or local caching

**"Authentication failed"**

- Check API key and client ID are correct
- Verify OAuth scopes are properly configured
- Ensure authorized origins include your development domain

### Debug Mode

Enable debug logging:

```typescript
// In development only
console.log('Drive auth state:', driveService.getAuthState());
```

## Best Practices

1. **Always handle CORS limitations** - don't try to bypass browser security
2. **Cache frequently accessed files** locally to reduce API calls
3. **Use server-side proxy** for production file access
4. **Implement proper error handling** for network failures
5. **Respect Google Drive API quotas** - implement rate limiting

## Migration Notes

The Google Drive integration has been refactored from 7+ overlapping services to a unified architecture. Legacy services are preserved for backward compatibility but new development should use the unified `GoogleDriveService`.
