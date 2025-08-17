/**
 * RADICAL APPROACH: No authentication needed for PUBLIC folders
 * Use only API key to access public Google Drive folders
 */

import { computed, reactive } from 'vue';
import type { IssueWithGoogleDrive } from '../types/google-drive-content';

interface GoogleDriveFile {
  id: string;
  name: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

interface GoogleDriveResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

const state = reactive({
  isLoading: false,
  isInitialized: false,
  error: null as string | null,
  issues: [] as IssueWithGoogleDrive[],
  thumbnails: {} as Record<string, string>,
  loadingThumbnails: new Set<string>(),
});

export function usePublicGoogleDrive() {
  // Direct API call to public folder using only API key
  const loadPublicFolderContents = async (folderId: string): Promise<GoogleDriveFile[]> => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    console.log('🔑 Using API key for public folder access');

    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    const query = `'${folderId}' in parents and trashed=false`;
    const fields = 'files(id,name,size,modifiedTime,webViewLink)';

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&key=${apiKey}`;

    console.log('🌐 Making direct API call to:', url);

    try {
      const response = await fetch(url);
      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Google Drive API error: ${response.status} ${errorText}`);
      }

      const data: GoogleDriveResponse = await response.json();
      console.log('📁 API Response:', data);

      return data.files || [];
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  };

  // Convert Google Drive files to issues
  const convertFilesToIssues = (files: GoogleDriveFile[]): IssueWithGoogleDrive[] => {
    console.log('🔄 Converting files to issues:', files.length);

    return files
      .filter((file) => file.name.toLowerCase().endsWith('.pdf'))
      .map((file, index) => {
        const issue: IssueWithGoogleDrive = {
          id: index + 1,
          title: file.name.replace('.pdf', ''),
          date: file.modifiedTime || new Date().toISOString(),
          pages: 0,
          filename: file.name,
          url: `https://drive.google.com/file/d/${file.id}/view`,
          googleDriveUrl: `https://drive.google.com/file/d/${file.id}/preview`,
          googleDriveFileId: file.id,
          category: 'Newsletter',
          description: `PDF document: ${file.name}`,
          status: 'google-drive',
          syncStatus: 'synced',
        };

        return issue;
      });
  };

  // Initialize and load PDFs
  const initialize = async (): Promise<void> => {
    if (state.isInitialized) {
      console.log('✅ Already initialized');
      return;
    }

    try {
      state.isLoading = true;
      state.error = null;

      console.log('🚀 DIRECT API APPROACH: Loading public folder contents...');

      const folderId = import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID;
      console.log('📁 Target folder ID:', folderId);

      const files = await loadPublicFolderContents(folderId);
      console.log('📄 Files found:', files.length);

      const issues = convertFilesToIssues(files);
      console.log('📋 Issues created:', issues.length);

      state.issues = issues;
      state.isInitialized = true;
      state.error = null;

      console.log('✅ SUCCESS! Direct API approach worked!');
      console.log('📊 Final results:', {
        filesFound: files.length,
        issuesCreated: issues.length,
        firstIssue: issues[0]?.title,
      });
    } catch (error) {
      console.error('❌ Direct API approach failed:', error);
      state.error = error instanceof Error ? error.message : 'Failed to load public folder';
      throw error;
    } finally {
      state.isLoading = false;
    }
  };

  // Computed values
  const archivedIssues = computed(() =>
    state.issues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  );

  const latestIssue = computed(() => archivedIssues.value[0] || null);

  return {
    // State
    state: computed(() => state),
    archivedIssues,
    latestIssue,

    // Methods
    initialize,
  };
}
