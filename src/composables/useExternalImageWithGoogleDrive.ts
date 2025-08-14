// src/composables/useExternalImageWithGoogleDrive.ts
import { ref, computed } from 'vue';
import { useGoogleDrive } from './useGoogleDrive';
import { ExternalImageService, type ImageCacheOptions } from 'src/services/external-image-service';
import type { GoogleDriveAuthConfig } from 'src/services/google-drive-browser-service';

export interface ExternalImageWithGoogleDriveOptions extends ImageCacheOptions {
  enableGoogleDrive?: boolean;
  googleDriveConfig?: GoogleDriveAuthConfig;
  preferGoogleDriveCache?: boolean;
}

export interface ImageLoadResult {
  url: string;
  success: boolean;
  cached: boolean;
  source: 'cache' | 'direct' | 'google-drive' | 'fallback';
  error?: string;
}

export function useExternalImageWithGoogleDrive() {
  const externalImageService = ExternalImageService.getInstance();
  const googleDrive = useGoogleDrive();

  // State
  const isInitialized = ref(false);
  const googleDriveEnabled = ref(false);
  const loadingImages = ref(new Set<string>());

  // Computed
  const isLoading = computed(() => loadingImages.value.size > 0);

  // Initialize the service
  const initialize = (options: ExternalImageWithGoogleDriveOptions = {}) => {
    try {
      if (options.enableGoogleDrive && options.googleDriveConfig) {
        googleDrive.initialize(options.googleDriveConfig);
        googleDriveEnabled.value = true;
      }

      isInitialized.value = true;
      console.log('External image service with Google Drive initialized');
    } catch (error) {
      console.error('Failed to initialize external image service:', error);
      throw error;
    }
  };

  // Load image with Google Drive fallback
  const loadImage = async (
    url: string,
    options: ExternalImageWithGoogleDriveOptions = {},
  ): Promise<ImageLoadResult> => {
    const imageId = url;
    loadingImages.value.add(imageId);

    try {
      // Check if it's a Google Drive URL
      if (googleDrive.isGoogleDriveUrl(url)) {
        return await loadGoogleDriveImage(url, options);
      }

      // Try normal external image loading first
      try {
        const cachedUrl = await externalImageService.getImage(url, options);
        if (cachedUrl) {
          return {
            url: cachedUrl,
            success: true,
            cached: true,
            source: 'cache',
          };
        }

        throw new Error('Failed to load image directly');
      } catch (directError) {
        console.warn('Direct image loading failed:', directError);

        // If Google Drive is enabled and authenticated, try to find the image there
        if (googleDriveEnabled.value && googleDrive.isAuthenticated.value) {
          return await searchAndLoadFromGoogleDrive(url);
        }

        throw directError;
      }
    } catch (error) {
      console.error('Failed to load image:', error);
      return {
        url: generateFallbackImage(url),
        success: false,
        cached: false,
        source: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      loadingImages.value.delete(imageId);
    }
  };

  // Load Google Drive image specifically
  const loadGoogleDriveImage = async (
    url: string,
    options: ExternalImageWithGoogleDriveOptions = {},
  ): Promise<ImageLoadResult> => {
    if (!googleDriveEnabled.value) {
      throw new Error('Google Drive not enabled');
    }

    if (!googleDrive.isAuthenticated.value) {
      // Try to authenticate first
      const authSuccess = await googleDrive.authenticate();
      if (!authSuccess) {
        throw new Error('Google Drive authentication failed');
      }
    }

    const fileId = googleDrive.extractFileId(url);
    if (!fileId) {
      throw new Error('Could not extract file ID from Google Drive URL');
    }

    try {
      // Check cache first if enabled
      if (options.preferGoogleDriveCache !== false) {
        const cachedUrl = await externalImageService.getImage(url, options);
        if (cachedUrl) {
          return {
            url: cachedUrl,
            success: true,
            cached: true,
            source: 'cache',
          };
        }
      }

      // Get file info
      const fileInfo = await googleDrive.getFile(fileId);
      if (!fileInfo) {
        throw new Error('File not found in Google Drive');
      }

      // Download the file
      const blob = await googleDrive.downloadFile(fileId);
      if (!blob) {
        throw new Error('Failed to download file from Google Drive');
      }

      // Cache the blob and get object URL
      const objectUrl = cacheGoogleDriveImage(url, blob);

      return {
        url: objectUrl,
        success: true,
        cached: false,
        source: 'google-drive',
      };
    } catch (error) {
      // Fallback to public thumbnail if available
      const thumbnailUrl = googleDrive.getFileUrls(fileId).thumbnail;
      try {
        const loadedUrl = await externalImageService.getImage(thumbnailUrl, options);
        if (loadedUrl) {
          return {
            url: loadedUrl,
            success: true,
            cached: false,
            source: 'google-drive',
          };
        }
        throw new Error('Thumbnail load failed');
      } catch (thumbnailError) {
        console.error('Thumbnail fallback failed:', thumbnailError);
        throw error;
      }
    }
  };

  // Search for image in Google Drive and load it
  const searchAndLoadFromGoogleDrive = async (originalUrl: string): Promise<ImageLoadResult> => {
    if (!googleDriveEnabled.value || !googleDrive.isAuthenticated.value) {
      throw new Error('Google Drive not available');
    }

    try {
      // Extract potential filename from URL
      const urlParts = originalUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (!lastPart) {
        throw new Error('Could not extract filename from URL');
      }
      const filename = lastPart.split('?')[0];

      // Search for images with similar name
      const searchResults = await googleDrive.searchImages(`name contains '${filename}'`);

      if (searchResults.length === 0) {
        throw new Error('No matching images found in Google Drive');
      }

      // Use the first result
      const fileInfo = searchResults[0];
      if (!fileInfo) {
        throw new Error('Invalid search result');
      }

      const blob = await googleDrive.downloadFile(fileInfo.id);

      if (!blob) {
        throw new Error('Failed to download found image from Google Drive');
      }

      const objectUrl = cacheGoogleDriveImage(originalUrl, blob);

      return {
        url: objectUrl,
        success: true,
        cached: false,
        source: 'google-drive',
      };
    } catch (error) {
      throw new Error(
        `Google Drive search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  // Cache Google Drive image blob
  const cacheGoogleDriveImage = (originalUrl: string, blob: Blob): string => {
    // Process the image if needed
    const processedBlob = blob; // You could add image processing here

    // Create object URL
    const objectUrl = URL.createObjectURL(processedBlob);

    // Note: We don't cache it directly since the external image service
    // doesn't expose a blob caching method. The next time this URL is requested,
    // it will go through the normal caching flow.

    return objectUrl;
  };

  // Generate fallback image
  const generateFallbackImage = (originalUrl: string): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = 400;
    canvas.height = 300;

    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 400, 300);

    // Error text
    ctx.fillStyle = '#999';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Image not available', 200, 140);
    ctx.fillText('URL: ' + originalUrl.substring(0, 40) + '...', 200, 160);

    return canvas.toDataURL();
  };

  // Batch load multiple images
  const loadImages = async (
    urls: string[],
    options: ExternalImageWithGoogleDriveOptions = {},
  ): Promise<ImageLoadResult[]> => {
    const promises = urls.map((url) => loadImage(url, options));
    return Promise.all(promises);
  };

  // Preload Google Drive folder
  const preloadGoogleDriveFolder = async (
    folderId: string,
    options: ExternalImageWithGoogleDriveOptions = {},
  ): Promise<ImageLoadResult[]> => {
    if (!googleDriveEnabled.value || !googleDrive.isAuthenticated.value) {
      throw new Error('Google Drive not available');
    }

    const images = await googleDrive.listFolderFiles(folderId, 'image/');
    const imageUrls = images.map((file) => `https://drive.google.com/file/d/${file.id}/view`);

    return loadImages(imageUrls, options);
  };

  // Clear cache
  const clearCache = async (): Promise<void> => {
    await externalImageService.clearCache();
  };

  // Get cache stats
  const getCacheStats = async () => {
    return externalImageService.getCacheStats();
  };

  return {
    // State
    isInitialized,
    googleDriveEnabled,
    isLoading,
    googleDriveState: googleDrive.state,

    // Google Drive specific
    isGoogleDriveAuthenticated: googleDrive.isAuthenticated,
    googleDriveError: googleDrive.error,

    // Methods
    initialize,
    loadImage,
    loadGoogleDriveImage,
    loadImages,
    preloadGoogleDriveFolder,
    clearCache,
    getCacheStats,

    // Google Drive methods
    authenticateGoogleDrive: googleDrive.authenticate,
    signOutGoogleDrive: googleDrive.signOut,
    searchGoogleDriveImages: googleDrive.searchImages,
    listGoogleDriveFolder: googleDrive.listFolderFiles,

    // Utilities
    isGoogleDriveUrl: googleDrive.isGoogleDriveUrl,
    extractGoogleDriveFileId: googleDrive.extractFileId,
  };
}
