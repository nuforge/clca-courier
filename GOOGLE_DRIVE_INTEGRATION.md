# Google Drive Integration Documentation

This document explains how to set up and use the Google Drive integration in the CLCA Courier application.

## Overview

The Google Drive integration allows the application to:

- Access images and files stored in Google Drive
- Search for content across your Google Drive
- Download and cache files locally
- Use Google Drive as a fallback for broken image links
- Provide authenticated access to private Drive content

## Setup Instructions

### 1. Google Cloud Console Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Note down your Project ID

2. **Enable the Google Drive API:**
   - In the Google Cloud Console, go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click on it and press "Enable"

3. **Create API Credentials:**

   **For API Key (Public Access):**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
   - (Optional) Restrict the key to specific APIs and domains for security

   **For OAuth2 Client ID (Authenticated Access):**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add your domain to "Authorized JavaScript origins" (e.g., `http://localhost:9000` for development)
   - Copy the Client ID (and Client Secret if needed)

### 2. Environment Configuration

1. **Copy the environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Fill in your Google credentials:**

   ```bash
   # Required
   VITE_GOOGLE_API_KEY=your_api_key_here
   VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

   # Optional
   VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
   VITE_GOOGLE_PROJECT_ID=your_project_id_here
   ```

### 3. Application Setup

The Google Drive integration is automatically available once the environment variables are configured. No additional setup is required.

## Usage

### Basic Image Loading with Google Drive Fallback

```typescript
import { useExternalImageWithGoogleDrive } from 'src/composables/useExternalImageWithGoogleDrive';

const { loadImage, initialize } = useExternalImageWithGoogleDrive();

// Initialize with Google Drive support
await initialize({
  enableGoogleDrive: true,
  googleDriveConfig: {
    apiKey: 'your_api_key',
    clientId: 'your_client_id',
  },
});

// Load an image with Google Drive fallback
const result = await loadImage('https://example.com/broken-image.jpg');
console.log('Image loaded from:', result.source); // 'cache', 'direct', 'google-drive', or 'fallback'
```

### Direct Google Drive Access

```typescript
import { useGoogleDrive } from 'src/composables/useGoogleDrive';

const googleDrive = useGoogleDrive();

// Initialize
googleDrive.initialize({
  apiKey: 'your_api_key',
  clientId: 'your_client_id',
});

// Authenticate
await googleDrive.authenticate();

// Search for images
const images = await googleDrive.searchImages('vacation photos');

// Download a file
const blob = await googleDrive.downloadFile('file_id_here');
```

### Using the Google Drive Browser Component

```vue
<template>
  <GoogleDriveImageBrowser />
</template>

<script setup>
import GoogleDriveImageBrowser from 'src/components/GoogleDriveImageBrowser.vue';
</script>
```

## API Reference

### GoogleDriveBrowserService

The main service for interacting with Google Drive API.

**Methods:**

- `initialize(config)` - Initialize with API credentials
- `authenticate()` - Authenticate user with Google Drive
- `signOut()` - Sign out from Google Drive
- `getFile(fileId)` - Get file metadata
- `downloadFile(fileId)` - Download file as blob
- `searchFiles(options)` - Search for files
- `searchImages(folderIds?, query?)` - Search for images specifically
- `listFilesInFolder(folderId)` - List files in a folder

### useGoogleDrive Composable

Vue composable for reactive Google Drive integration.

**Properties:**

- `isAuthenticated` - Whether user is authenticated
- `isLoading` - Whether an operation is in progress
- `error` - Current error message
- `files` - Current list of files
- `searchResults` - Results from last search

**Methods:**

- `initialize(config)` - Initialize service
- `authenticate()` - Authenticate with Google Drive
- `signOut()` - Sign out
- `searchImages(query?, folderIds?)` - Search for images
- `downloadFile(fileId)` - Download file

### useExternalImageWithGoogleDrive Composable

Enhanced image loading with Google Drive fallback.

**Methods:**

- `initialize(options)` - Initialize with Google Drive support
- `loadImage(url, options)` - Load image with fallback
- `loadImages(urls, options)` - Batch load multiple images
- `preloadGoogleDriveFolder(folderId)` - Preload all images from a folder

## File URL Formats

### Google Drive URLs

The service can extract file IDs from various Google Drive URL formats:

- `https://drive.google.com/file/d/FILE_ID/view`
- `https://drive.google.com/open?id=FILE_ID`
- `https://docs.google.com/document/d/FILE_ID/edit`

### Generated URLs

- **Thumbnail:** `https://drive.google.com/thumbnail?id=FILE_ID&sz=w400`
- **Direct View:** `https://drive.google.com/uc?export=view&id=FILE_ID`
- **Authenticated Download:** Uses access token for private files

## Caching

The integration includes sophisticated caching:

- **IndexedDB Storage:** Locally caches downloaded images
- **Object URLs:** Creates blob URLs for immediate use
- **Cache Expiration:** Configurable cache duration (default: 7 days)
- **Size Limits:** Prevents excessive storage usage

## Error Handling

The service includes comprehensive error handling:

- **Network Errors:** Graceful fallback for connection issues
- **Authentication Errors:** Clear error messages for auth failures
- **API Limits:** Handles quota exceeded scenarios
- **File Access:** Manages permission denied errors

## Security Considerations

1. **API Key Restrictions:** Restrict your API key to specific domains
2. **OAuth Scopes:** Use minimal required scopes (read-only recommended)
3. **Environment Variables:** Never commit credentials to version control
4. **CORS Configuration:** Configure allowed origins in Google Cloud Console

## Troubleshooting

### Common Issues

1. **"API key not valid" Error:**
   - Check that the API key is correct
   - Ensure Google Drive API is enabled
   - Verify domain restrictions

2. **"OAuth client ID not found" Error:**
   - Check that the client ID is correct
   - Ensure the domain is added to authorized origins
   - Verify OAuth consent screen is configured

3. **"Permission denied" Error:**
   - User needs to grant permissions during OAuth flow
   - Check OAuth scopes are sufficient
   - Verify file/folder sharing permissions

4. **CORS Errors:**
   - Add your domain to authorized JavaScript origins
   - Check that HTTPS is used in production
   - Verify referrer restrictions

### Debug Mode

Enable debug logging by setting:

```javascript
localStorage.setItem('google-drive-debug', 'true');
```

## Best Practices

1. **Lazy Loading:** Only initialize Google Drive when needed
2. **Error Boundaries:** Wrap components in error boundaries
3. **User Feedback:** Show clear loading and error states
4. **Offline Handling:** Gracefully handle offline scenarios
5. **Rate Limiting:** Implement request throttling for large operations

## Examples

See the `GoogleDriveImageBrowser.vue` component for a complete implementation example.

For more information, refer to the [Google Drive API documentation](https://developers.google.com/drive/api/v3/about-sdk).
