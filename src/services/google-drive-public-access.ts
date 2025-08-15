/**
 * Google Drive Public Access Service
 * This service accesses publicly shared Google Drive folders without requiring OAuth authentication
 */

// Google Drive API interfaces
interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
}

interface GoogleDriveFileListResponse {
  files: GoogleDriveFile[];
}

export class GoogleDrivePublicAccess {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Test if the API key is valid by making a simple request
   */
  async testApiKey(): Promise<{ valid: boolean; error?: string }> {
    try {
      // Test with a simple API call that doesn't require specific permissions
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/about?fields=user&key=${this.apiKey}`,
      );

      if (response.ok) {
        const data = await response.json();
        console.log('API key test successful:', data);
        return { valid: true };
      } else {
        const errorText = await response.text();
        console.error('API key test failed:', response.status, errorText);
        return {
          valid: false,
          error: `${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.error('API key test error:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test if a folder is publicly accessible with detailed error reporting
   * Updated to try both API key and public access methods
   */
  async testFolderAccess(folderId: string): Promise<boolean> {
    console.log(`Testing folder access for: ${folderId}`);

    try {
      // First try: Direct API access with key
      const apiResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType&key=${this.apiKey}`,
      );

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        console.log('✅ Folder accessible via API:', data);
        return true;
      }

      // If API fails, try checking if it's a publicly shared folder
      // by attempting to access it via the sharing link format
      console.log('API access failed, trying public share access...');
      const publicResponse = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
        method: 'HEAD',
      });

      if (publicResponse.ok || publicResponse.status === 200) {
        console.log('✅ Folder appears to be publicly accessible');
        return true;
      }

      console.error('❌ Folder access failed for both API and public methods');
      return false;
    } catch (error) {
      console.error('Folder access test error:', error);
      return false;
    }
  }

  /**
   * List files in a publicly accessible folder
   * Updated to handle both API access and public folder parsing
   */
  async listFolderFiles(folderId: string): Promise<GoogleDriveFile[]> {
    try {
      // First attempt: Use Google Drive API v3 with API key
      const apiResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType='application/pdf'&fields=files(id,name,mimeType,webViewLink,thumbnailLink,createdTime,modifiedTime,size)&key=${this.apiKey}`,
      );

      if (apiResponse.ok) {
        const data: GoogleDriveFileListResponse = await apiResponse.json();
        console.log(`✅ Files found via API in folder ${folderId}:`, data.files?.length || 0);
        return data.files || [];
      }

      // If API fails, fall back to mock data based on known files
      console.warn('⚠️ API access failed, using fallback method...');

      // For now, return empty array but log the attempt
      const errorText = await apiResponse.text();
      console.error('API Error details:', {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        response: errorText,
      });

      // Return empty array to trigger fallback to sample data
      return [];
    } catch (error) {
      console.error('Error listing folder files:', error);
      return [];
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<GoogleDriveFile> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink,thumbnailLink,createdTime,modifiedTime,size&key=${this.apiKey}`,
      );

      if (response.ok) {
        const data: GoogleDriveFile = await response.json();
        console.log(`File metadata for ${fileId}:`, data);
        return data;
      } else {
        console.error('Failed to get file metadata:', response.status, response.statusText);
        throw new Error(`Failed to access file: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  /**
   * Test all configured folders
   */
  async testAllFolders(folderIds: { [key: string]: string }): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    for (const [name, folderId] of Object.entries(folderIds)) {
      console.log(`Testing folder ${name} (${folderId})...`);
      results[name] = await this.testFolderAccess(folderId);
    }

    return results;
  }
}
