// src/composables/useGoogleDrive.ts
// Google Drive composable using GoogleDriveBrowserService

import { ref, readonly } from 'vue';
import { GoogleDriveBrowserService } from 'src/services/google-drive-browser-service';
import type { GoogleDriveFile } from 'src/types/google-drive-content';

export interface GoogleDriveState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  files: GoogleDriveFile[];
  searchResults: GoogleDriveFile[];
}

export interface GoogleDriveConfig {
  apiKey: string;
  clientId: string;
}

export function useGoogleDrive() {
  // Reactive state
  const state = ref<GoogleDriveState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    files: [],
    searchResults: [],
  });

  // Google Drive service instance
  let googleDriveService: GoogleDriveBrowserService | null = null;

  // Initialize Google Drive service
  const initialize = (config: GoogleDriveConfig): void => {
    try {
      if (!config.apiKey || !config.clientId) {
        throw new Error('API key and Client ID are required');
      }

      googleDriveService = new GoogleDriveBrowserService(config.clientId, config.apiKey);
      state.value.error = null;
      console.log('Google Drive service initialized');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to initialize Google Drive service';
      state.value.error = message;
      console.error('Google Drive initialization error:', error);
    }
  };

  // Authenticate with Google Drive
  const authenticate = async (): Promise<boolean> => {
    if (!googleDriveService) {
      state.value.error = 'Google Drive service not initialized';
      return false;
    }

    state.value.isLoading = true;
    state.value.error = null;

    try {
      const success = await googleDriveService.authenticate();
      state.value.isAuthenticated = success;

      if (success) {
        console.log('Google Drive authentication successful');
      }

      return success;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      state.value.error = message;
      state.value.isAuthenticated = false;
      console.error('Google Drive authentication error:', error);
      return false;
    } finally {
      state.value.isLoading = false;
    }
  };

  // Sign out from Google Drive
  const signOut = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      try {
        if (googleDriveService) {
          googleDriveService.signOut();
        }
        state.value.isAuthenticated = false;
        state.value.files = [];
        state.value.searchResults = [];
        resolve();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
        state.value.error = errorMessage;
        reject(new Error(errorMessage));
      }
    });
  }; // Search for images in Google Drive
  const searchImages = async (query?: string, folderIds?: string[]): Promise<GoogleDriveFile[]> => {
    if (!googleDriveService) {
      state.value.error = 'Google Drive service not initialized';
      return [];
    }

    if (!state.value.isAuthenticated) {
      state.value.error = 'Not authenticated with Google Drive';
      return [];
    }

    state.value.isLoading = true;
    state.value.error = null;

    try {
      const images = await googleDriveService.searchImages(folderIds, query);
      state.value.searchResults = images;
      return images;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search images';
      state.value.error = message;
      console.error('Google Drive search error:', error);
      return [];
    } finally {
      state.value.isLoading = false;
    }
  };

  // List files in a folder
  const listFilesInFolder = async (folderId: string): Promise<GoogleDriveFile[]> => {
    if (!googleDriveService) {
      state.value.error = 'Google Drive service not initialized';
      return [];
    }

    if (!state.value.isAuthenticated) {
      state.value.error = 'Not authenticated with Google Drive';
      return [];
    }

    state.value.isLoading = true;
    state.value.error = null;

    try {
      const files = await googleDriveService.listFilesInFolder(folderId);
      state.value.files = files;
      return files;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list folder files';
      state.value.error = message;
      console.error('Google Drive folder listing error:', error);
      return [];
    } finally {
      state.value.isLoading = false;
    }
  };

  // Download file as blob
  const downloadFile = async (fileId: string): Promise<Blob | null> => {
    if (!googleDriveService) {
      state.value.error = 'Google Drive service not initialized';
      return null;
    }

    if (!state.value.isAuthenticated) {
      state.value.error = 'Not authenticated with Google Drive';
      return null;
    }

    state.value.isLoading = true;
    state.value.error = null;

    try {
      const blob = await googleDriveService.downloadFile(fileId);
      return blob;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed';
      state.value.error = message;
      console.error('Google Drive download error:', error);
      return null;
    } finally {
      state.value.isLoading = false;
    }
  };

  // Get file by ID
  const getFile = async (fileId: string): Promise<GoogleDriveFile | null> => {
    if (!googleDriveService) {
      state.value.error = 'Google Drive service not initialized';
      return null;
    }

    if (!state.value.isAuthenticated) {
      state.value.error = 'Not authenticated with Google Drive';
      return null;
    }

    state.value.isLoading = true;
    state.value.error = null;

    try {
      const file = await googleDriveService.getFile(fileId);
      return file;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get file';
      state.value.error = message;
      console.error('Google Drive get file error:', error);
      return null;
    } finally {
      state.value.isLoading = false;
    }
  };

  // Search for files (generic search)
  const searchFiles = async (query: string): Promise<GoogleDriveFile[]> => {
    if (!googleDriveService) {
      state.value.error = 'Google Drive service not initialized';
      return [];
    }

    if (!state.value.isAuthenticated) {
      state.value.error = 'Not authenticated with Google Drive';
      return [];
    }

    state.value.isLoading = true;
    state.value.error = null;

    try {
      const files = await googleDriveService.searchFiles(query);
      state.value.searchResults = files;
      return files;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search files';
      state.value.error = message;
      console.error('Google Drive search files error:', error);
      return [];
    } finally {
      state.value.isLoading = false;
    }
  };

  // Get various URLs for a file
  const getUrls = async (fileId: string) => {
    if (!googleDriveService) {
      return {
        thumbnail: '',
        direct: '',
        authenticated: '',
      };
    }
    try {
      const file = await googleDriveService.getFile(fileId);
      return {
        thumbnail: file.thumbnailLink || '',
        direct: file.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`,
        authenticated: googleDriveService.getImageUrl(file),
      };
    } catch (error) {
      console.error('Failed to get file URLs:', error);
      return {
        thumbnail: '',
        direct: '',
        authenticated: '',
      };
    }
  };

  // Extract file ID from Google Drive URL
  const extractFileIdFromUrl = (url: string): string | null => {
    return GoogleDriveBrowserService.extractFileId(url);
  };

  // Check if URL is a Google Drive URL
  const isGoogleDriveUrl = (url: string): boolean => {
    return GoogleDriveBrowserService.isGoogleDriveUrl(url);
  };

  // Return reactive state and methods
  return {
    // State
    state: readonly(state),
    isAuthenticated: () => state.value.isAuthenticated,
    isLoading: () => state.value.isLoading,
    error: () => state.value.error,
    files: () => state.value.files,
    searchResults: () => state.value.searchResults,

    // Actions
    initialize,
    authenticate,
    signOut,
    getFile,
    searchFiles,
    searchImages,
    listFilesInFolder,
    downloadFile,
    getUrls,
    extractFileIdFromUrl,
    isGoogleDriveUrl,
  };
}
