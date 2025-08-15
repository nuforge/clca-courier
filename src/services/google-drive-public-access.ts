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
   */
  async testFolderAccess(folderId: string): Promise<boolean> {
    console.log(`Testing folder access for: ${folderId}`);

    try {
      // First try: Simple file metadata without permissions (less restrictive)
      const simpleResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name&key=${this.apiKey}`,
      );

      console.log('Simple response status:', simpleResponse.status);

      if (simpleResponse.ok) {
        const data = await simpleResponse.json();
        console.log('Folder access test result:', data);
        return true;
      } else {
        // Get detailed error information
        const errorText = await simpleResponse.text();
        console.error('Folder access failed:', {
          status: simpleResponse.status,
          statusText: simpleResponse.statusText,
          response: errorText,
        });

        // Try to parse error details
        try {
          const errorData = JSON.parse(errorText);
          console.error('Detailed error:', errorData);
        } catch {
          console.error('Could not parse error response as JSON');
        }

        return false;
      }
    } catch (error) {
      console.error('Folder access test error:', error);
      return false;
    }
  }

  /**
   * List files in a publicly accessible folder
   */
  async listFolderFiles(folderId: string): Promise<GoogleDriveFile[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,webViewLink,thumbnailLink,createdTime,modifiedTime)&key=${this.apiKey}`,
      );

      if (response.ok) {
        const data: GoogleDriveFileListResponse = await response.json();
        console.log(`Files in folder ${folderId}:`, data.files);
        return data.files || [];
      } else {
        const errorText = await response.text();
        console.error('Failed to list folder files:', response.status, errorText);

        if (response.status === 403) {
          throw new Error(
            `Access denied to folder ${folderId}. The folder may not be publicly accessible.`,
          );
        }

        throw new Error(`Failed to access folder: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error listing folder files:', error);
      throw error;
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
