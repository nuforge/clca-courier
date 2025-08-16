// src/composables/useExternalImageWithGoogleDrive.ts
// Enhanced external image loading with Google Drive fallback capabilities

import { ref, computed } from 'vue';
import { useGoogleDrive } from './useGoogleDrive';
import { useExternalImage } from './useExternalImage';

export interface ImageLoadResult {
  success: boolean;
  url: string | null;
  message: string;
  source: 'direct' | 'google-drive' | 'cache' | 'error';
  metadata?: {
    filename?: string;
    size?: string;
    mimeType?: string;
  };
}

export interface ExternalImageWithGoogleDriveOptions {
  enableGoogleDrive?: boolean;
  googleDriveConfig?: {
    apiKey: string;
    clientId: string;
  };
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  searchQuery?: string;
  folderIds?: string[];
}

export function useExternalImageWithGoogleDrive() {
  const googleDrive = useGoogleDrive();
  const initialized = ref(false);
  const config = ref<ExternalImageWithGoogleDriveOptions>({});

  // Initialize the service
  const initialize = (options: ExternalImageWithGoogleDriveOptions) => {
    config.value = { ...options };

    if (options.enableGoogleDrive && options.googleDriveConfig) {
      googleDrive.initialize(options.googleDriveConfig);
      initialized.value = true;
    }
  };

  // Load image with Google Drive fallback
  const loadImage = async (
    url: string,
    options: Partial<ExternalImageWithGoogleDriveOptions> = {},
  ): Promise<ImageLoadResult> => {
    const mergedOptions = { ...config.value, ...options };

    try {
      // First, try direct loading using the external image service
      const externalImageOptions = {
        lazy: false,
        ...(mergedOptions.maxWidth && { maxWidth: mergedOptions.maxWidth }),
        ...(mergedOptions.maxHeight && { maxHeight: mergedOptions.maxHeight }),
        ...(mergedOptions.quality && { quality: mergedOptions.quality }),
      };

      const externalImageService = useExternalImage(url, externalImageOptions);

      await externalImageService.load();

      if (!externalImageService.hasError.value && externalImageService.imageUrl.value) {
        return {
          success: true,
          url: externalImageService.imageUrl.value,
          message: 'Image loaded successfully',
          source: 'direct',
        };
      }

      // If direct loading failed and Google Drive is enabled, try fallback
      if (mergedOptions.enableGoogleDrive && initialized.value) {
        console.log('Direct image loading failed, trying Google Drive fallback...');

        // Check if the user is authenticated with Google Drive
        if (!googleDrive.isAuthenticated()) {
          return {
            success: false,
            url: null,
            message: 'Direct image loading failed and Google Drive authentication required',
            source: 'error',
          };
        }

        // Extract filename from URL or use search query
        const filename = extractFilenameFromUrl(url) || mergedOptions.searchQuery || 'image';

        // Search Google Drive for similar images
        const searchResults = await googleDrive.searchImages(filename, mergedOptions.folderIds);

        if (searchResults.length > 0) {
          // Use the first matching image
          const firstMatch = searchResults[0];

          if (firstMatch) {
            try {
              // Get the authenticated URL for the image
              const urls = await googleDrive.getUrls(firstMatch.id);

              return {
                success: true,
                url: urls.authenticated || urls.direct,
                message: `Found fallback image: ${firstMatch.name}`,
                source: 'google-drive',
                metadata: {
                  filename: firstMatch.name,
                  ...(firstMatch.size && { size: firstMatch.size }),
                  mimeType: firstMatch.mimeType,
                },
              };
            } catch (error) {
              console.error('Error getting Google Drive image URL:', error);
            }
          }
        }

        return {
          success: false,
          url: null,
          message: 'Image not found in Google Drive',
          source: 'error',
        };
      }

      return {
        success: false,
        url: null,
        message: externalImageService.error.value?.message || 'Image loading failed',
        source: 'error',
      };
    } catch (error) {
      console.error('Error in loadImage:', error);
      return {
        success: false,
        url: null,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        source: 'error',
      };
    }
  };

  // Load multiple images with fallback
  const loadImages = async (
    urls: string[],
    options: Partial<ExternalImageWithGoogleDriveOptions> = {},
  ): Promise<ImageLoadResult[]> => {
    const promises = urls.map((url) => loadImage(url, options));
    return Promise.all(promises);
  };

  // Preload images from a Google Drive folder
  const preloadGoogleDriveFolder = async (folderId: string): Promise<ImageLoadResult[]> => {
    if (!initialized.value || !googleDrive.isAuthenticated()) {
      throw new Error('Google Drive not initialized or not authenticated');
    }

    try {
      const images = await googleDrive.searchImages(undefined, [folderId]);

      const results: ImageLoadResult[] = await Promise.all(
        images.map(async (image) => {
          try {
            const urls = await googleDrive.getUrls(image.id);
            return {
              success: true,
              url: urls.authenticated || urls.direct,
              message: `Preloaded: ${image.name}`,
              source: 'google-drive',
              metadata: {
                filename: image.name,
                ...(image.size && { size: image.size }),
                mimeType: image.mimeType,
              },
            };
          } catch (error) {
            console.error(`Failed to get URLs for image ${image.name}:`, error);
            return {
              success: false,
              url: null,
              message: `Failed to load: ${image.name}`,
              source: 'google-drive',
            };
          }
        }),
      );

      return results;
    } catch (error) {
      console.error('Error preloading Google Drive folder:', error);
      throw error;
    }
  };

  // Authenticate with Google Drive
  const authenticateGoogleDrive = async (): Promise<boolean> => {
    if (!initialized.value) {
      throw new Error('Service not initialized');
    }
    return googleDrive.authenticate();
  };

  // Sign out from Google Drive
  const signOutGoogleDrive = async (): Promise<void> => {
    if (!initialized.value) {
      throw new Error('Service not initialized');
    }
    return googleDrive.signOut();
  };

  // Helper function to extract filename from URL
  const extractFilenameFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();

      if (filename && filename.includes('.')) {
        // Remove extension and clean up the filename for search
        const nameWithoutExt = filename.split('.')[0];
        return nameWithoutExt?.replace(/[-_]/g, ' ') || null;
      }

      return null;
    } catch {
      return null;
    }
  };

  // Check if Google Drive is available and authenticated
  const isGoogleDriveReady = computed(() => {
    return initialized.value && googleDrive.isAuthenticated();
  });

  // Get Google Drive status
  const googleDriveStatus = computed(() => {
    return {
      initialized: initialized.value,
      authenticated: googleDrive.isAuthenticated(),
      loading: googleDrive.isLoading(),
      error: googleDrive.error(),
    };
  });

  return {
    // Methods
    initialize,
    loadImage,
    loadImages,
    preloadGoogleDriveFolder,
    authenticateGoogleDrive,
    signOutGoogleDrive,

    // State
    isGoogleDriveReady,
    googleDriveStatus,

    // Google Drive composable access
    googleDrive,
  };
}
