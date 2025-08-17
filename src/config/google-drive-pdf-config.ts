// Google Drive configuration for the issue archive
import type { GoogleDriveContentConfig } from '../types/google-drive-content';

// Google Drive configuration for production
// These should be moved to environment variables in production
export const googleDriveConfig: GoogleDriveContentConfig = {
  // API credentials - these should come from environment variables
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',

  // Folder IDs for different content types
  // These should be configured to point to your actual Google Drive folders
  contentFolderId: import.meta.env.VITE_GOOGLE_CONTENT_FOLDER_ID || '',
  issuesFolderId: import.meta.env.VITE_GOOGLE_ISSUES_FOLDER_ID || '',
  imagesFolderId: import.meta.env.VITE_GOOGLE_IMAGES_FOLDER_ID || '',
  templatesFolderId: import.meta.env.VITE_GOOGLE_TEMPLATES_FOLDER_ID || '',
};

// Initialize Google Drive content service with configuration
export async function initializeGoogleDriveConfig() {
  try {
    const { googleDriveContentService } = await import('../services/google-drive-content-service');

    if (googleDriveConfig.apiKey && googleDriveConfig.clientId) {
      console.log('Configuring Google Drive service with provided credentials');
      googleDriveContentService.configure(googleDriveConfig);
    } else {
      console.warn('Google Drive API credentials not found in environment variables');
    }
  } catch (error) {
    console.error('Failed to initialize Google Drive configuration:', error);
  }
}

// Cache configuration
export const cacheConfig = {
  // Thumbnail cache settings
  thumbnailCacheMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  thumbnailCacheMaxSize: 100, // Maximum number of thumbnails to cache

  // Metadata cache settings
  metadataCacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours
  metadataCacheMaxSize: 50, // Maximum number of metadata entries to cache

  // Local storage keys
  thumbnailCacheKey: 'google-drive-thumbnail-cache',
  metadataCacheKey: 'pdf-metadata-cache',
};
