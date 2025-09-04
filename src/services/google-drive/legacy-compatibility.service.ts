/**
 * Legacy Compatibility Service
 * Provides backward compatibility for existing Google Drive service usage
 * @deprecated - Use the new unified GoogleDriveService instead
 */

import { GoogleDriveService } from './index';
import type { GoogleDriveConfig, GoogleDriveFile } from '../../types';

/**
 * Legacy wrapper for GoogleDriveBrowserService
 * Maintains compatibility while using the new unified service
 */
export class LegacyGoogleDriveBrowserService {
  private unifiedService: GoogleDriveService;

  constructor(clientId: string, apiKey: string) {
    const config: GoogleDriveConfig = {
      clientId,
      apiKey,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    };

    this.unifiedService = new GoogleDriveService(config);
  }

  async authenticate(): Promise<boolean> {
    return this.unifiedService.authenticate();
  }

  get isAuthenticated(): boolean {
    return this.unifiedService.isAuthenticated();
  }

  getStatus() {
    const authState = this.unifiedService.getAuthState();
    return {
      isAuthenticated: authState.isSignedIn,
      hasToken: !!authState.accessToken,
      accessToken: authState.accessToken,
    };
  }

  async initialize(): Promise<void> {
    return this.unifiedService.initialize();
  }

  async getFile(fileId: string): Promise<GoogleDriveFile> {
    const response = await this.unifiedService.getFile(fileId);

    if (response.status === 'error') {
      throw new Error(response.error?.message || 'Failed to get file');
    }

    return response.data!;
  }

  async listFilesInFolder(folderId: string): Promise<GoogleDriveFile[]> {
    // Use the unified service's API service directly
    const response = await this.unifiedService['apiService'].getFolderContents(folderId);

    if (response.status === 'error') {
      throw new Error(response.error?.message || 'Failed to list files');
    }

    return response.data?.files || [];
  }

  async searchFiles(query: string): Promise<GoogleDriveFile[]> {
    const response = await this.unifiedService.searchFiles(query);

    if (response.status === 'error') {
      throw new Error(response.error?.message || 'Failed to search files');
    }

    return response.data?.files || [];
  }

  // Static utility methods from the original service
  static extractFileId(url: string): string | null {
    // Match Google Drive file ID patterns
    const patterns = [/\/file\/d\/([a-zA-Z0-9-_]+)/, /id=([a-zA-Z0-9-_]+)/, /^([a-zA-Z0-9-_]+)$/];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  static isGoogleDriveUrl(url: string): boolean {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  }
}

/**
 * Legacy wrapper for SimpleGoogleDriveAuth
 * Maintains compatibility while using the new unified auth service
 */
export class LegacySimpleGoogleDriveAuth {
  private unifiedService: GoogleDriveService;
  protected apiKey: string;

  constructor(clientId: string, apiKey: string) {
    this.apiKey = apiKey;
    const config: GoogleDriveConfig = {
      clientId,
      apiKey,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    };

    this.unifiedService = new GoogleDriveService(config);
  }

  async authenticate(): Promise<boolean> {
    return this.unifiedService.authenticate();
  }

  get isAuthenticated(): boolean {
    return this.unifiedService.isAuthenticated();
  }

  get accessToken(): string | undefined {
    return this.unifiedService.getAuthState().accessToken;
  }

  getStatus() {
    const authState = this.unifiedService.getAuthState();
    return {
      isAuthenticated: authState.isSignedIn,
      hasToken: !!authState.accessToken,
      accessToken: authState.accessToken,
    };
  }

  async testApiCall(): Promise<unknown> {
    const response = await this.unifiedService.searchFiles('');

    if (response.status === 'error') {
      throw new Error(response.error?.message || 'API call failed');
    }

    return response.data;
  }

  signOut(): void {
    this.unifiedService.signOut();
  }
}
