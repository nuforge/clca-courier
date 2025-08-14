// src/composables/useGoogleDrive.ts
import { ref, computed } from 'vue';
import {
  googleDriveBrowserService,
  GoogleDriveBrowserService,
  type GoogleDriveAuthConfig,
  type GoogleDriveFileInfo,
} from 'src/services/google-drive-browser-service';

export interface GoogleDriveState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  files: GoogleDriveFileInfo[];
  searchResults: GoogleDriveFileInfo[];
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

  // Computed properties
  const isAuthenticated = computed(() => state.value.isAuthenticated);
  const isLoading = computed(() => state.value.isLoading);
  const error = computed(() => state.value.error);
  const files = computed(() => state.value.files);
  const searchResults = computed(() => state.value.searchResults);

  // Initialize Google Drive service
  const initialize = (config: GoogleDriveAuthConfig): void => {
    try {
      googleDriveBrowserService.initialize(config);
      console.log('Google Drive service initialized');
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to initialize Google Drive';
    }
  };

  // Authenticate with Google Drive
  const authenticate = async (): Promise<boolean> => {
    state.value.isLoading = true;
    state.value.error = null;

    try {
      const success = await googleDriveBrowserService.authenticate();
      state.value.isAuthenticated = success;
      return success;
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Authentication failed';
      state.value.isAuthenticated = false;
      return false;
    } finally {
      state.value.isLoading = false;
    }
  };

  // Sign out from Google Drive
  const signOut = async (): Promise<void> => {
    try {
      await googleDriveBrowserService.signOut();
      state.value.isAuthenticated = false;
      state.value.files = [];
      state.value.searchResults = [];
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Sign out failed';
    }
  };

  // Get file information by ID
  const getFile = async (fileId: string): Promise<GoogleDriveFileInfo | null> => {
    state.value.isLoading = true;
    state.value.error = null;

    try {
      const file = await googleDriveBrowserService.getFile(fileId);
      return file;
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to get file';
      return null;
    } finally {
      state.value.isLoading = false;
    }
  };

  // Search for files
  const searchFiles = async (
    query?: string,
    folderIds?: string[],
  ): Promise<GoogleDriveFileInfo[]> => {
    state.value.isLoading = true;
    state.value.error = null;

    try {
      const searchOptions: Record<string, unknown> = {
        pageSize: 50,
      };

      if (query) {
        searchOptions.query = query;
      }

      if (folderIds) {
        searchOptions.parents = folderIds;
      }

      const results = await googleDriveBrowserService.searchFiles(searchOptions);

      state.value.searchResults = results;
      return results;
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Search failed';
      return [];
    } finally {
      state.value.isLoading = false;
    }
  };

  // Search for images specifically
  const searchImages = async (
    query?: string,
    folderIds?: string[],
  ): Promise<GoogleDriveFileInfo[]> => {
    state.value.isLoading = true;
    state.value.error = null;

    try {
      const results = await googleDriveBrowserService.searchImages(folderIds, query);
      state.value.searchResults = results;
      return results;
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Image search failed';
      return [];
    } finally {
      state.value.isLoading = false;
    }
  };

  // List files in a folder
  const listFolderFiles = async (
    folderId: string,
    mimeType?: string,
  ): Promise<GoogleDriveFileInfo[]> => {
    state.value.isLoading = true;
    state.value.error = null;

    try {
      const results = await googleDriveBrowserService.listFilesInFolder(folderId, mimeType);
      state.value.files = results;
      return results;
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Failed to list folder files';
      return [];
    } finally {
      state.value.isLoading = false;
    }
  };

  // Download file as blob
  const downloadFile = async (fileId: string): Promise<Blob | null> => {
    state.value.isLoading = true;
    state.value.error = null;

    try {
      const blob = await googleDriveBrowserService.downloadFile(fileId);
      return blob;
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Download failed';
      return null;
    } finally {
      state.value.isLoading = false;
    }
  };

  // Get various URLs for a file
  const getFileUrls = (fileId: string) => {
    return {
      thumbnail: googleDriveBrowserService.getThumbnailUrl(fileId),
      direct: googleDriveBrowserService.getPublicDirectUrl(fileId),
      authenticated: googleDriveBrowserService.getAuthenticatedDownloadUrl(fileId),
    };
  };

  // Extract file ID from URL
  const extractFileId = (url: string): string | null => {
    return GoogleDriveBrowserService.extractFileId(url);
  };

  // Check if URL is Google Drive URL
  const isGoogleDriveUrl = (url: string): boolean => {
    return GoogleDriveBrowserService.isGoogleDriveUrl(url);
  };

  // Get authentication status
  const getAuthStatus = () => {
    return googleDriveBrowserService.getAuthStatus();
  };

  // Clear error
  const clearError = () => {
    state.value.error = null;
  };

  // Clear search results
  const clearSearchResults = () => {
    state.value.searchResults = [];
  };

  return {
    // State
    state,
    isAuthenticated,
    isLoading,
    error,
    files,
    searchResults,

    // Methods
    initialize,
    authenticate,
    signOut,
    getFile,
    searchFiles,
    searchImages,
    listFolderFiles,
    downloadFile,
    getFileUrls,
    extractFileId,
    isGoogleDriveUrl,
    getAuthStatus,
    clearError,
    clearSearchResults,
  };
}
