// src/services/google-drive-browser-service.ts
export interface GoogleDriveAuthConfig {
  apiKey: string;
  clientId: string;
  scope?: string;
}

export interface GoogleDriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
}

export interface GoogleDriveSearchOptions {
  query?: string;
  pageSize?: number;
  orderBy?: string;
  parents?: string[];
  mimeType?: string;
}

export class GoogleDriveBrowserService {
  private static instance: GoogleDriveBrowserService;
  private apiKey: string = '';
  private clientId: string = '';
  private scope: string = 'https://www.googleapis.com/auth/drive.readonly';
  private accessToken: string = '';
  private isAuthenticated = false;
  private readonly baseUrl = 'https://www.googleapis.com/drive/v3';

  private constructor() {}

  static getInstance(): GoogleDriveBrowserService {
    if (!GoogleDriveBrowserService.instance) {
      GoogleDriveBrowserService.instance = new GoogleDriveBrowserService();
    }
    return GoogleDriveBrowserService.instance;
  }

  /**
   * Initialize the service with API credentials
   */
  initialize(config: GoogleDriveAuthConfig): void {
    this.apiKey = config.apiKey;
    this.clientId = config.clientId;
    this.scope = config.scope || this.scope;
  }

  /**
   * Load Google API client library
   */
  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google API can only be loaded in browser environment'));
        return;
      }

      // Check if already loaded
      if (window.gapi) {
        resolve();
        return;
      }

      // Load the API
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('auth2', () => {
          resolve();
        });
      };
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  /**
   * Authenticate with Google Drive
   */
  async authenticate(): Promise<boolean> {
    try {
      await this.loadGoogleAPI();

      // Initialize the auth2 library
      await window.gapi.auth2.init({
        client_id: this.clientId,
        scope: this.scope,
      });

      const authInstance = window.gapi.auth2.getAuthInstance();

      // Check if already signed in
      if (authInstance.isSignedIn.get()) {
        const user = authInstance.currentUser.get();
        this.accessToken = user.getAuthResponse().access_token;
        this.isAuthenticated = true;
        return true;
      }

      // Sign in
      const user = await authInstance.signIn();
      this.accessToken = user.getAuthResponse().access_token;
      this.isAuthenticated = true;

      console.log('Successfully authenticated with Google Drive');
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Sign out from Google Drive
   */
  async signOut(): Promise<void> {
    if (window.gapi && window.gapi.auth2) {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
    }
    this.accessToken = '';
    this.isAuthenticated = false;
  }

  /**
   * Check if authenticated
   */
  isAuth(): boolean {
    return this.isAuthenticated && this.accessToken !== '';
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(
    endpoint: string,
    params: Record<string, unknown> = {},
  ): Promise<unknown> {
    if (!this.isAuth()) {
      throw new Error('Not authenticated with Google Drive');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add API key and access token
    params.key = this.apiKey;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const stringValue =
          typeof value === 'string'
            ? value
            : typeof value === 'number'
              ? String(value)
              : JSON.stringify(value);
        url.searchParams.set(key, stringValue);
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get file metadata by ID
   */
  async getFile(fileId: string, fields?: string): Promise<GoogleDriveFileInfo | null> {
    try {
      const params = {
        fields:
          fields ||
          'id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,parents',
      };

      const data = await this.makeRequest(`/files/${fileId}`, params);
      return data as GoogleDriveFileInfo;
    } catch (error) {
      console.error('Error getting file:', error);
      return null;
    }
  }

  /**
   * Search for files in Google Drive
   */
  async searchFiles(options: GoogleDriveSearchOptions = {}): Promise<GoogleDriveFileInfo[]> {
    try {
      let query = options.query || '';

      // Add parent folder filter if specified
      if (options.parents && options.parents.length > 0) {
        const parentQuery = options.parents.map((parent) => `'${parent}' in parents`).join(' or ');
        query = query ? `(${query}) and (${parentQuery})` : parentQuery;
      }

      // Add MIME type filter if specified
      if (options.mimeType) {
        const mimeQuery = `mimeType='${options.mimeType}'`;
        query = query ? `(${query}) and ${mimeQuery}` : mimeQuery;
      }

      const params = {
        q: query,
        pageSize: options.pageSize || 100,
        orderBy: options.orderBy || 'modifiedTime desc',
        fields:
          'files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,parents)',
      };

      const data = (await this.makeRequest('/files', params)) as { files?: GoogleDriveFileInfo[] };
      return data.files || [];
    } catch (error) {
      console.error('Error searching files:', error);
      return [];
    }
  }

  /**
   * Search for images in Google Drive
   */
  async searchImages(folderIds?: string[], query?: string): Promise<GoogleDriveFileInfo[]> {
    const imageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
    ];

    const imageQuery = imageTypes.map((type) => `mimeType='${type}'`).join(' or ');
    const searchQuery = query ? `(${query}) and (${imageQuery})` : imageQuery;

    const searchOptions: GoogleDriveSearchOptions = {
      query: searchQuery,
      orderBy: 'modifiedTime desc',
    };

    if (folderIds) {
      searchOptions.parents = folderIds;
    }

    return this.searchFiles(searchOptions);
  }

  /**
   * Download file content as blob
   */
  async downloadFile(fileId: string): Promise<Blob | null> {
    if (!this.isAuth()) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const url = `${this.baseUrl}/files/${fileId}?alt=media&key=${this.apiKey}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      return response.blob();
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  }

  /**
   * Get a direct download URL for a file (requires authentication)
   */
  getAuthenticatedDownloadUrl(fileId: string): string {
    return `${this.baseUrl}/files/${fileId}?alt=media&access_token=${this.accessToken}`;
  }

  /**
   * Get a public thumbnail URL for an image file
   */
  getThumbnailUrl(fileId: string, size = 400): string {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
  }

  /**
   * Get a public direct view URL (may not work for all files)
   */
  getPublicDirectUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  /**
   * List files in a specific folder
   */
  async listFilesInFolder(folderId: string, mimeType?: string): Promise<GoogleDriveFileInfo[]> {
    const searchOptions: GoogleDriveSearchOptions = {
      parents: [folderId],
      orderBy: 'name',
    };

    if (mimeType) {
      searchOptions.mimeType = mimeType;
    }

    return this.searchFiles(searchOptions);
  }

  /**
   * Extract file ID from Google Drive URL
   */
  static extractFileId(url: string): string | null {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9-_]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Check if a URL is a Google Drive URL
   */
  static isGoogleDriveUrl(url: string): boolean {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  }

  /**
   * Get current authentication status
   */
  getAuthStatus(): { isAuthenticated: boolean; hasToken: boolean } {
    return {
      isAuthenticated: this.isAuthenticated,
      hasToken: this.accessToken !== '',
    };
  }
}

// Extend the Window interface to include Google API types
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      auth2: {
        init: (config: { client_id: string; scope: string }) => Promise<unknown>;
        getAuthInstance: () => {
          isSignedIn: { get: () => boolean };
          currentUser: { get: () => { getAuthResponse: () => { access_token: string } } };
          signIn: () => Promise<{ getAuthResponse: () => { access_token: string } }>;
          signOut: () => Promise<void>;
        };
      };
    };
  }
}

// Export a singleton instance
export const googleDriveBrowserService = GoogleDriveBrowserService.getInstance();
