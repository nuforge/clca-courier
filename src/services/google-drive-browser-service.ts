// src/services/google-drive-browser-service.ts
// Browser-compatible Google Drive service with full functionality

import { SimpleGoogleDriveAuth } from './simple-google-auth-test';
import type { GoogleDriveFile } from 'src/types/google-drive-content';

export class GoogleDriveBrowserService extends SimpleGoogleDriveAuth {
  private baseUrl = 'https://www.googleapis.com/drive/v3';

  constructor(clientId: string, apiKey: string) {
    super(clientId, apiKey);
  }

  /**
   * Make authenticated API request to Google Drive
   */
  private async makeApiRequest(
    endpoint: string,
    params: Record<string, string> = {},
  ): Promise<Response> {
    if (!this.isAuthenticated || !this.accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('key', this.apiKey);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}${errorData.error ? ` - ${errorData.error.message}` : ''}`,
      );
    }

    return response;
  }

  /**
   * Get file metadata by ID
   */
  async getFile(fileId: string): Promise<GoogleDriveFile> {
    try {
      const response = await this.makeApiRequest(`/files/${fileId}`, {
        fields:
          'id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,parents',
      });

      const fileData = await response.json();
      return this.convertToGoogleDriveFile(fileData);
    } catch (error) {
      console.error('Error getting file:', error);
      throw new Error(
        `Failed to get file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * List files in a folder
   */
  async listFilesInFolder(folderId: string, pageSize: number = 100): Promise<GoogleDriveFile[]> {
    try {
      const response = await this.makeApiRequest('/files', {
        q: `'${folderId}' in parents and trashed=false`,
        pageSize: pageSize.toString(),
        fields:
          'nextPageToken,files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,parents)',
        orderBy: 'modifiedTime desc',
      });

      const data = await response.json();
      return (data.files || []).map(this.convertToGoogleDriveFile);
    } catch (error) {
      console.error('Error listing folder files:', error);
      throw new Error(
        `Failed to list folder files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Search for files
   */
  async searchFiles(query: string, pageSize: number = 50): Promise<GoogleDriveFile[]> {
    try {
      const response = await this.makeApiRequest('/files', {
        q: `name contains '${query}' and trashed=false`,
        pageSize: pageSize.toString(),
        fields:
          'nextPageToken,files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,parents)',
        orderBy: 'relevance',
      });

      const data = await response.json();
      return (data.files || []).map(this.convertToGoogleDriveFile);
    } catch (error) {
      console.error('Error searching files:', error);
      throw new Error(
        `Failed to search files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Search for images specifically
   */
  async searchImages(query?: string, folderIds?: string[]): Promise<GoogleDriveFile[]> {
    try {
      let searchQuery = "mimeType contains 'image/' and trashed=false";

      if (query) {
        searchQuery += ` and name contains '${query}'`;
      }

      if (folderIds && folderIds.length > 0) {
        const folderQueries = folderIds.map((id) => `'${id}' in parents`);
        searchQuery += ` and (${folderQueries.join(' or ')})`;
      }

      const response = await this.makeApiRequest('/files', {
        q: searchQuery,
        pageSize: '100',
        fields:
          'nextPageToken,files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,parents)',
        orderBy: 'modifiedTime desc',
      });

      const data = await response.json();
      return (data.files || []).map(this.convertToGoogleDriveFile);
    } catch (error) {
      console.error('Error searching images:', error);
      throw new Error(
        `Failed to search images: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Download file as blob
   */
  async downloadFile(fileId: string): Promise<Blob> {
    if (!this.isAuthenticated || !this.accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}?alt=media&key=${this.apiKey}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error(
        `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get authenticated download URL
   */
  getAuthenticatedDownloadUrl(fileId: string): string {
    if (!this.isAuthenticated || !this.accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }
    return `${this.baseUrl}/files/${fileId}?alt=media&key=${this.apiKey}&access_token=${this.accessToken}`;
  }

  /**
   * Get various URLs for a file
   */
  getFileUrls(fileId: string) {
    return {
      thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`,
      direct: `https://drive.google.com/uc?export=view&id=${fileId}`,
      authenticated: this.getAuthenticatedDownloadUrl(fileId),
    };
  }

  /**
   * Convert Google Drive API response to our GoogleDriveFile interface
   */
  private convertToGoogleDriveFile(apiFile: any): GoogleDriveFile {
    return {
      id: apiFile.id,
      name: apiFile.name,
      mimeType: apiFile.mimeType,
      size: apiFile.size,
      webViewLink: apiFile.webViewLink,
      webContentLink: apiFile.webContentLink,
      thumbnailLink: apiFile.thumbnailLink,
      createdTime: apiFile.createdTime,
      modifiedTime: apiFile.modifiedTime,
      parents: apiFile.parents,
    };
  }

  /**
   * Check if URL is a Google Drive URL
   */
  static isGoogleDriveUrl(url: string): boolean {
    return (
      url.includes('drive.google.com') ||
      url.includes('docs.google.com') ||
      url.includes('sheets.google.com') ||
      url.includes('slides.google.com')
    );
  }

  /**
   * Extract file ID from Google Drive URL
   */
  static extractFileId(url: string): string | null {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /[?&]id=([a-zA-Z0-9-_]+)/,
      /\/document\/d\/([a-zA-Z0-9-_]+)/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/presentation\/d\/([a-zA-Z0-9-_]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }
}
