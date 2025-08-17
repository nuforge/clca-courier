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
        `Google Drive API error: ${response.status} ${response.statusText}. ${
          errorData.error?.message || 'Unknown error'
        }`,
      );
    }

    return response;
  }

  /**
   * Get details of a specific file by ID
   */
  async getFile(fileId: string): Promise<GoogleDriveFile> {
    try {
      const response = await this.makeApiRequest(`/files/${fileId}`, {
        fields:
          'id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,parents,createdTime,modifiedTime',
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
   * List all files in a specific folder
   */
  async listFilesInFolder(folderId: string, pageSize: number = 100): Promise<GoogleDriveFile[]> {
    try {
      const response = await this.makeApiRequest('/files', {
        q: `'${folderId}' in parents and trashed=false`,
        pageSize: pageSize.toString(),
        fields:
          'files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,parents,createdTime,modifiedTime)',
        orderBy: 'modifiedTime desc',
      });

      const data = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data.files || []).map((file: any) => this.convertToGoogleDriveFile(file));
    } catch (error) {
      console.error('Error listing folder files:', error);
      throw new Error(
        `Failed to list folder files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Search for files by name or content
   */
  async searchFiles(query: string, pageSize: number = 50): Promise<GoogleDriveFile[]> {
    try {
      const response = await this.makeApiRequest('/files', {
        q: `name contains '${query}' and trashed=false`,
        pageSize: pageSize.toString(),
        fields:
          'files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,parents,createdTime,modifiedTime)',
        orderBy: 'modifiedTime desc',
      });

      const data = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data.files || []).map((file: any) => this.convertToGoogleDriveFile(file));
    } catch (error) {
      console.error('Error searching files:', error);
      throw new Error(
        `Failed to search files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Search specifically for images in given folder IDs
   */
  async searchImages(folderIds: string[] = [], query: string = ''): Promise<GoogleDriveFile[]> {
    try {
      let searchQuery = "mimeType contains 'image/' and trashed=false";

      if (folderIds.length > 0) {
        const folderQuery = folderIds.map((id) => `'${id}' in parents`).join(' or ');
        searchQuery += ` and (${folderQuery})`;
      }

      if (query.trim()) {
        searchQuery += ` and name contains '${query.trim()}'`;
      }

      const response = await this.makeApiRequest('/files', {
        q: searchQuery,
        pageSize: '100',
        fields:
          'files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,parents,createdTime,modifiedTime)',
        orderBy: 'modifiedTime desc',
      });

      const data = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data.files || []).map((file: any) => this.convertToGoogleDriveFile(file));
    } catch (error) {
      console.error('Error searching images:', error);
      throw new Error(
        `Failed to search images: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Download file content as blob
   */
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      const response = await this.makeApiRequest(`/files/${fileId}`, {
        alt: 'media',
      });

      return await response.blob();
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error(
        `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get image URL for display (uses thumbnail if available, otherwise download URL)
   */
  getImageUrl(file: GoogleDriveFile): string {
    if (file.thumbnailLink) {
      return file.thumbnailLink;
    }

    if (file.webContentLink) {
      return file.webContentLink;
    }

    // Fallback to direct download URL
    return `https://drive.google.com/uc?id=${file.id}&export=download`;
  }

  /**
   * Convert Google Drive API response to our GoogleDriveFile interface
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertToGoogleDriveFile(apiFile: any): GoogleDriveFile {
    return {
      id: apiFile.id,
      name: apiFile.name,
      mimeType: apiFile.mimeType,
      size: apiFile.size,
      webViewLink: apiFile.webViewLink,
      webContentLink: apiFile.webContentLink,
      thumbnailLink: apiFile.thumbnailLink,
      parents: apiFile.parents || [],
      createdTime: apiFile.createdTime,
      modifiedTime: apiFile.modifiedTime,
    };
  }

  /**
   * Check if a URL is a Google Drive URL
   */
  static isGoogleDriveUrl(url: string): boolean {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  }

  /**
   * Extract Google Drive file ID from various URL formats
   */
  static extractFileId(url: string): string | null {
    // Handle different Google Drive URL formats
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/,
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
