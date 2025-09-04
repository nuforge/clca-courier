/**
 * Unified Google Drive API Service
 * Consolidates file operations from multiple Google Drive services
 */

import type {
  GoogleDriveFile,
  GoogleDriveFileListResponse,
  GoogleDriveSearchOptions,
  GoogleDriveApiResponse,
} from '../../types';
import type { GoogleDriveAuthService } from './google-drive-auth.service';

export class GoogleDriveApiService {
  private authService: GoogleDriveAuthService;
  private baseUrl = 'https://www.googleapis.com/drive/v3';

  constructor(authService: GoogleDriveAuthService) {
    this.authService = authService;
  }

  /**
   * List files in Google Drive
   */
  async listFiles(
    options: GoogleDriveSearchOptions = {},
  ): Promise<GoogleDriveApiResponse<GoogleDriveFileListResponse>> {
    try {
      const accessToken = this.authService.getAccessToken();
      if (!accessToken || !this.authService.isTokenValid()) {
        throw new Error('No valid access token available');
      }

      const params = new URLSearchParams({
        fields:
          options.fields ||
          'files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,modifiedTime,parents)',
        pageSize: (options.pageSize || 100).toString(),
      });

      if (options.query) {
        params.append('q', options.query);
      }

      if (options.orderBy) {
        params.append('orderBy', options.orderBy);
      }

      if (options.pageToken) {
        params.append('pageToken', options.pageToken);
      }

      const response = await fetch(`${this.baseUrl}/files?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        data,
        status: 'success',
      };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 'API_ERROR',
        },
        status: 'error',
      };
    }
  }

  /**
   * Get file metadata
   */
  async getFile(fileId: string, fields?: string): Promise<GoogleDriveApiResponse<GoogleDriveFile>> {
    try {
      const accessToken = this.authService.getAccessToken();
      if (!accessToken || !this.authService.isTokenValid()) {
        throw new Error('No valid access token available');
      }

      const params = new URLSearchParams();
      if (fields) {
        params.append('fields', fields);
      }

      const url = `${this.baseUrl}/files/${fileId}${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        data,
        status: 'success',
      };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 'API_ERROR',
        },
        status: 'error',
      };
    }
  }

  /**
   * Search for PDF files in a specific folder
   */
  async searchPdfFiles(
    folderId?: string,
  ): Promise<GoogleDriveApiResponse<GoogleDriveFileListResponse>> {
    let query = "mimeType='application/pdf'";

    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    return this.listFiles({
      query,
      orderBy: 'modifiedTime desc',
      pageSize: 1000,
    });
  }

  /**
   * Search for image files in a specific folder
   */
  async searchImageFiles(
    folderId?: string,
  ): Promise<GoogleDriveApiResponse<GoogleDriveFileListResponse>> {
    let query = "mimeType contains 'image/'";

    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    return this.listFiles({
      query,
      orderBy: 'modifiedTime desc',
      pageSize: 1000,
    });
  }

  /**
   * Get files in a specific folder
   */
  async getFolderContents(
    folderId: string,
  ): Promise<GoogleDriveApiResponse<GoogleDriveFileListResponse>> {
    return this.listFiles({
      query: `'${folderId}' in parents and trashed=false`,
      orderBy: 'name',
      pageSize: 1000,
    });
  }

  /**
   * Download file content
   */
  async downloadFile(fileId: string): Promise<GoogleDriveApiResponse<Blob>> {
    try {
      const accessToken = this.authService.getAccessToken();
      if (!accessToken || !this.authService.isTokenValid()) {
        throw new Error('No valid access token available');
      }

      const response = await fetch(`${this.baseUrl}/files/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.statusText}`);
      }

      const blob = await response.blob();

      return {
        data: blob,
        status: 'success',
      };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 'API_ERROR',
        },
        status: 'error',
      };
    }
  }

  /**
   * Get download URL for a file
   */
  getDownloadUrl(fileId: string): string {
    return `${this.baseUrl}/files/${fileId}?alt=media`;
  }

  /**
   * Get thumbnail URL for a file
   */
  getThumbnailUrl(fileId: string, size = 200): string {
    return `${this.baseUrl}/files/${fileId}?alt=media&sz=s${size}`;
  }
}
