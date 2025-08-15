// Google Drive PDF initialization script
// This should be imported in main.ts or app startup

import { googleDriveContentService } from '../services/google-drive-content-service';
import { googleDriveConfig } from '../config/google-drive-pdf-config';

/**
 * Initialize Google Drive PDF integration
 * This sets up the service with proper configuration
 */
export function initializeGoogleDrivePdf(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      console.log('🚀 Initializing Google Drive PDF integration...');

      // Configure the service with credentials
      if (googleDriveConfig.apiKey && googleDriveConfig.clientId) {
        googleDriveContentService.configure(googleDriveConfig);
        console.log('✅ Google Drive service configured successfully');
        resolve(true);
      } else {
        console.warn('⚠️ Google Drive credentials not found - using local fallback');
        resolve(false);
      }
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive PDF integration:', error);
      resolve(false);
    }
  });
}

/**
 * Clean up old cache entries
 * This should be called periodically to maintain performance
 */
export function cleanupPdfCaches(): void {
  try {
    console.log('🧹 Cleaning up PDF caches...');

    // Clean up thumbnail cache
    const thumbnailCache = localStorage.getItem('google-drive-thumbnail-cache');
    if (thumbnailCache) {
      const cache = JSON.parse(thumbnailCache);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      let cleaned = 0;

      for (const [fileId, entry] of Object.entries(cache)) {
        const entryData = entry as { timestamp: number };
        if (now - entryData.timestamp > maxAge) {
          delete cache[fileId];
          cleaned++;
        }
      }

      if (cleaned > 0) {
        localStorage.setItem('google-drive-thumbnail-cache', JSON.stringify(cache));
        console.log(`🗑️ Cleaned ${cleaned} old thumbnail cache entries`);
      }
    }

    // Clean up metadata cache
    const metadataCache = localStorage.getItem('pdf-metadata-cache');
    if (metadataCache) {
      const cache = JSON.parse(metadataCache);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      let cleaned = 0;

      for (const [fileId, entry] of Object.entries(cache)) {
        const entryData = entry as { timestamp: number };
        if (now - entryData.timestamp > maxAge) {
          delete cache[fileId];
          cleaned++;
        }
      }

      if (cleaned > 0) {
        localStorage.setItem('pdf-metadata-cache', JSON.stringify(cache));
        console.log(`🗑️ Cleaned ${cleaned} old metadata cache entries`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to clean up caches:', error);
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): {
  thumbnailCacheSize: number;
  metadataCacheSize: number;
  totalCacheSize: number;
} {
  try {
    const thumbnailCache = localStorage.getItem('google-drive-thumbnail-cache');
    const metadataCache = localStorage.getItem('pdf-metadata-cache');

    const thumbnailCacheSize = thumbnailCache ? new Blob([thumbnailCache]).size : 0;
    const metadataCacheSize = metadataCache ? new Blob([metadataCache]).size : 0;

    return {
      thumbnailCacheSize,
      metadataCacheSize,
      totalCacheSize: thumbnailCacheSize + metadataCacheSize,
    };
  } catch (error) {
    console.warn('Failed to get cache stats:', error);
    return {
      thumbnailCacheSize: 0,
      metadataCacheSize: 0,
      totalCacheSize: 0,
    };
  }
}

/**
 * Clear all PDF-related caches
 * Use this for troubleshooting or reset
 */
export function clearAllPdfCaches(): void {
  try {
    console.log('🧹 Clearing all PDF caches...');

    // Clear Google Drive thumbnail cache
    localStorage.removeItem('google-drive-thumbnail-cache');

    // Clear metadata cache
    localStorage.removeItem('pdf-metadata-cache');

    // Clear individual PDF thumbnail caches
    const keys = Object.keys(localStorage);
    let cleared = 0;

    keys.forEach((key) => {
      if (key.startsWith('pdf-thumb-')) {
        localStorage.removeItem(key);
        cleared++;
      }
    });

    console.log(`✅ Cleared all PDF caches (${cleared} thumbnail entries)`);
  } catch (error) {
    console.error('❌ Failed to clear caches:', error);
  }
}

// Export for global access
declare global {
  interface Window {
    googleDrivePdfUtils: {
      initializeGoogleDrivePdf: typeof initializeGoogleDrivePdf;
      cleanupPdfCaches: typeof cleanupPdfCaches;
      getCacheStats: typeof getCacheStats;
      clearAllPdfCaches: typeof clearAllPdfCaches;
    };
  }
}

// Attach to window for debugging in development
if (import.meta.env.DEV) {
  window.googleDrivePdfUtils = {
    initializeGoogleDrivePdf,
    cleanupPdfCaches,
    getCacheStats,
    clearAllPdfCaches,
  };
}
