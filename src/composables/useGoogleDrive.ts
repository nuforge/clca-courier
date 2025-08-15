// src/composables/useGoogleDrive.ts
// TEMPORARY STUB - GoogleDrive composable is temporarily disabled
// Use SimpleAuthTest.vue for working Google Drive authentication testing

import { ref } from 'vue';
import type { GoogleDriveFile } from 'src/types/google-drive-content';

export interface GoogleDriveState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  files: GoogleDriveFile[];
  searchResults: GoogleDriveFile[];
}

export function useGoogleDrive() {
  // Reactive state
  const state = ref<GoogleDriveState>({
    isAuthenticated: false,
    isLoading: false,
    error: 'GoogleDrive composable is temporarily disabled. Use SimpleAuthTest.vue for testing.',
    files: [],
    searchResults: [],
  });

  // Stub functions that show warning messages
  const initialize = (): void => {
    console.warn(
      'GoogleDrive composable is temporarily disabled. Use SimpleAuthTest.vue for testing.',
    );
  };

  const authenticate = (): Promise<boolean> => {
    console.warn(
      'GoogleDrive composable is temporarily disabled. Use SimpleAuthTest.vue for testing.',
    );
    return Promise.resolve(false);
  };

  const logout = (): Promise<void> => {
    console.warn(
      'GoogleDrive composable is temporarily disabled. Use SimpleAuthTest.vue for testing.',
    );
    return Promise.resolve();
  };

  const getFile = (): Promise<GoogleDriveFile | null> => {
    console.warn(
      'GoogleDrive composable is temporarily disabled. Use SimpleAuthTest.vue for testing.',
    );
    return Promise.resolve(null);
  };

  const searchFiles = (): Promise<GoogleDriveFile[]> => {
    console.warn(
      'GoogleDrive composable is temporarily disabled. Use SimpleAuthTest.vue for testing.',
    );
    return Promise.resolve([]);
  };

  const searchImages = (): Promise<GoogleDriveFile[]> => {
    console.warn(
      'GoogleDrive composable is temporarily disabled. Use SimpleAuthTest.vue for testing.',
    );
    return Promise.resolve([]);
  };

  const listFilesInFolder = (): Promise<GoogleDriveFile[]> => {
    console.warn(
      'GoogleDrive composable is temporarily disabled. Use SimpleAuthTest.vue for testing.',
    );
    return Promise.resolve([]);
  };

  const downloadFile = (): Promise<Blob | null> => {
    console.warn(
      'GoogleDrive composable is temporarily disabled. Use SimpleAuthTest.vue for testing.',
    );
    return Promise.resolve(null);
  };

  const getUrls = () => {
    console.warn(
      'GoogleDrive composable is temporarily disabled. Use SimpleAuthTest.vue for testing.',
    );
    return {
      thumbnail: '',
      direct: '',
      authenticated: '',
    };
  };

  const extractFileIdFromUrl = (): string | null => {
    console.warn(
      'GoogleDrive composable is temporarily disabled. Use SimpleAuthTest.vue for testing.',
    );
    return null;
  };

  const isGoogleDriveUrl = (): boolean => {
    console.warn(
      'GoogleDrive composable is temporarily disabled. Use SimpleAuthTest.vue for testing.',
    );
    return false;
  };

  // Return the composable API
  return {
    // State
    state,
    isAuthenticated: () => state.value.isAuthenticated,
    isLoading: () => state.value.isLoading,
    error: () => state.value.error,
    files: () => state.value.files,
    searchResults: () => state.value.searchResults,

    // Actions
    initialize,
    authenticate,
    logout,
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
