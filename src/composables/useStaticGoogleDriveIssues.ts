// NO OAUTH - NO API CALLS - NO AUTHENTICATION
// Just static configuration of known Google Drive file IDs
import { ref, computed } from 'vue';
import { knownGoogleDriveIssues, type GoogleDriveIssueConfig } from '../config/google-drive-issues';
import type { IssueWithGoogleDrive } from '../types/google-drive-content';

export function useStaticGoogleDriveIssues() {
  const loading = ref(false);
  const error = ref('');

  // Convert static config to the expected format
  const issues = computed<IssueWithGoogleDrive[]>(() => {
    return knownGoogleDriveIssues.map((config: GoogleDriveIssueConfig, index: number) => ({
      id: index + 1, // Convert string ID to number
      title: config.title,
      date: config.date,
      pages: 1, // Default value since we don't know without API
      filename: config.filename,
      url: config.directLink,
      googleDriveUrl: config.directLink,
      thumbnailUrl: config.thumbnailUrl,
      googleDriveFileId: config.id,
      description: `Issue from ${config.date}`,
      fileSize: 'N/A', // We don't have file size without API
      modifiedTime: config.date,
      status: 'google-drive' as const,
      syncStatus: 'synced' as const,
    }));
  });

  function loadIssues() {
    loading.value = true;
    error.value = '';

    console.log('📁 Loading static Google Drive issues (no API calls)');
    console.log('📋 Found', knownGoogleDriveIssues.length, 'configured issues');

    // Simulate a tiny delay to show loading state
    setTimeout(() => {
      loading.value = false;
      console.log('✅ Static issues loaded successfully');
    }, 100);

    return Promise.resolve();
  }

  return {
    issues,
    loading,
    error,
    loadIssues,
  };
}
