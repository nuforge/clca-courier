/**
 * Main Google Drive Service
 * Unified facade for Google Drive operations
 */

import type { GoogleDriveConfig, GoogleDriveFile, GoogleDriveApiResponse } from '../../types';
import { GoogleDriveAuthService } from './google-drive-auth.service';
import { GoogleDriveApiService } from './google-drive-api.service';

export class GoogleDriveService {
  private authService: GoogleDriveAuthService;
  private apiService: GoogleDriveApiService;
  private config: GoogleDriveConfig;

  constructor(config: GoogleDriveConfig) {
    this.config = config;
    this.authService = new GoogleDriveAuthService(config.clientId, config.apiKey);
    this.apiService = new GoogleDriveApiService(this.authService);
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.authService.initialize();
  }

  /**
   * Authenticate with Google Drive
   */
  async authenticate(): Promise<boolean> {
    return this.authService.authenticate();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authService.getAuthState().isSignedIn;
  }

  /**
   * Sign out
   */
  signOut(): void {
    this.authService.signOut();
  }

  /**
   * Get authentication state
   */
  getAuthState() {
    return this.authService.getAuthState();
  }

  /**
   * Get PDF files from configured folder
   */
  async getPdfFiles(): Promise<GoogleDriveApiResponse<GoogleDriveFile[]>> {
    const response = await this.apiService.searchPdfFiles(
      this.config.issuesFolderId || this.config.pdfsFolderId,
    );

    if (response.status === 'error') {
      return {
        error: response.error || {
          code: 500,
          message: 'Unknown error occurred',
          status: 'UNKNOWN_ERROR',
        },
        status: 'error',
      };
    }

    return {
      data: response.data?.files || [],
      status: 'success',
    };
  }

  /**
   * Get image files from configured folder
   */
  async getImageFiles(): Promise<GoogleDriveApiResponse<GoogleDriveFile[]>> {
    const response = await this.apiService.searchImageFiles(this.config.imagesFolderId);

    if (response.status === 'error') {
      return {
        error: response.error || {
          code: 500,
          message: 'Unknown error occurred',
          status: 'UNKNOWN_ERROR',
        },
        status: 'error',
      };
    }

    return {
      data: response.data?.files || [],
      status: 'success',
    };
  }

  /**
   * Get files from content folder
   */
  async getContentFiles(): Promise<GoogleDriveApiResponse<GoogleDriveFile[]>> {
    if (!this.config.contentFolderId) {
      return {
        error: {
          code: 400,
          message: 'Content folder ID not configured',
          status: 'CONFIG_ERROR',
        },
        status: 'error',
      };
    }

    const response = await this.apiService.getFolderContents(this.config.contentFolderId);

    if (response.status === 'error') {
      return {
        error: response.error || {
          code: 500,
          message: 'Unknown error occurred',
          status: 'UNKNOWN_ERROR',
        },
        status: 'error',
      };
    }

    return {
      data: response.data?.files || [],
      status: 'success',
    };
  }

  /**
   * Get file metadata
   */
  async getFile(fileId: string): Promise<GoogleDriveApiResponse<GoogleDriveFile>> {
    return this.apiService.getFile(fileId);
  }

  /**
   * Download file
   */
  async downloadFile(fileId: string): Promise<GoogleDriveApiResponse<Blob>> {
    return this.apiService.downloadFile(fileId);
  }

  /**
   * Get download URL for a file
   */
  getDownloadUrl(fileId: string): string {
    return this.apiService.getDownloadUrl(fileId);
  }

  /**
   * Get thumbnail URL for a file
   */
  getThumbnailUrl(fileId: string, size = 200): string {
    return this.apiService.getThumbnailUrl(fileId, size);
  }

  /**
   * Search files with custom query
   */
  async searchFiles(query: string) {
    return this.apiService.listFiles({ query });
  }
}
