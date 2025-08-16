// REAL Google Drive API access - NO OAUTH, just API key
import { ref } from 'vue';
import type { IssueWithGoogleDrive } from '../types/google-drive-content';

interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink?: string;
  size?: string;
  modifiedTime?: string;
}

interface GoogleDriveResponse {
  files: GoogleDriveFile[];
}

export function useSimpleGoogleDriveIssues() {
  const issues = ref<IssueWithGoogleDrive[]>([]);
  const loading = ref(false);
  const error = ref('');

  async function loadIssues() {
    loading.value = true;
    error.value = '';

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const folderId = import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID;

      if (!apiKey || !folderId) {
        throw new Error('Missing VITE_GOOGLE_API_KEY or VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID');
      }

      console.log('🔑 Using API Key:', apiKey.substring(0, 10) + '...');
      console.log('📁 Folder ID:', folderId);

      // Direct API call to Google Drive - NO OAUTH
      const url = `https://www.googleapis.com/drive/v3/files?q=parents in '${folderId}' and mimeType='application/pdf'&fields=files(id,name,webViewLink,size,modifiedTime)&orderBy=modifiedTime desc&key=${apiKey}`;

      console.log('🌐 Fetching from:', url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google Drive API Error:', response.status, errorText);
        throw new Error(`Google Drive API failed: ${response.status} - ${errorText}`);
      }

      const data: GoogleDriveResponse = await response.json();
      console.log('📄 Raw API response:', data);

      if (!data.files || data.files.length === 0) {
        throw new Error('No PDF files found in Google Drive folder');
      }

      // Convert Google Drive files to our format
      issues.value = data.files.map((file: GoogleDriveFile, index: number) => ({
        id: index + 1,
        title: file.name.replace('.pdf', '').replace(/[-_]/g, ' '),
        filename: file.name,
        date: file.modifiedTime?.split('T')[0] ?? '2024-01-01',
        url: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        description: `Issue: ${file.name}`,
        pages: 1,
        status: 'google-drive' as const,
        syncStatus: 'synced' as const,
      }));

      console.log('✅ Loaded', issues.value.length, 'real Google Drive files:', issues.value);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error.value = errorMessage;
      console.error('❌ Failed to load Google Drive files:', errorMessage);
      issues.value = []; // Clear any placeholder data
    } finally {
      loading.value = false;
    }
  }

  return {
    issues,
    loading,
    error,
    loadIssues,
  };
}
