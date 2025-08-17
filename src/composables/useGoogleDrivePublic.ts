// src/composables/useGoogleDrivePublic.ts
// SIMPLE PUBLIC ACCESS TO GOOGLE DRIVE - NO OAUTH NEEDED!
import { ref } from 'vue';

interface PublicFile {
  id: string;
  name: string;
  webViewLink: string;
  size?: string;
  modifiedTime?: string;
}

export function useGoogleDrivePublic() {
  const files = ref<PublicFile[]>([]);
  const loading = ref(false);
  const error = ref('');

  async function loadPublicFiles() {
    loading.value = true;
    error.value = '';

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const folderId = import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID;

      if (!apiKey || !folderId) {
        throw new Error('Missing API key or folder ID');
      }

      console.log('🌐 Loading public files from Google Drive...');
      console.log('📁 Folder ID:', folderId);
      console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
      console.log('🔗 Testing folder URL: https://drive.google.com/drive/folders/' + folderId);

      // Try alternative approach: Use the folder's public sharing to get file list
      // This uses a different endpoint that might work with public folders
      const publicUrl = `https://drive.google.com/drive/folders/${folderId}`;
      console.log('🔄 Trying alternative: Direct folder access via public URL');
      console.log('📂 Public folder URL:', publicUrl);

      // For now, let's try the files endpoint but handle the specific error
      const url = `https://www.googleapis.com/drive/v3/files?q=parents in '${folderId}' and mimeType='application/pdf'&fields=files(id,name,webViewLink,size,modifiedTime)&orderBy=modifiedTime desc&key=${apiKey}`;

      console.log('🌐 API URL:', url);

      const response = await fetch(url);

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error details:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorText,
          url: url,
        });

        if (response.status === 403) {
          throw new Error(
            'FOLDER_NOT_PUBLIC - The Google Drive folder is not publicly accessible. Ask the folder owner (nuforge@gmail.com) to make it public.',
          );
        }

        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      files.value = data.files || [];

      console.log('✅ Successfully loaded', files.value.length, 'public files');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error.value = errorMessage;
      console.error('❌ Failed to load public files:', errorMessage);
    } finally {
      loading.value = false;
    }
  }

  return {
    files,
    loading,
    error,
    loadPublicFiles,
  };
}
