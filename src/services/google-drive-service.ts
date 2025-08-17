// src/services/google-drive-service.ts
import type { drive_v3 } from 'googleapis';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

export interface GoogleDriveConfig {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  keyFile?: string;
  scopes?: string[];
}

export interface GoogleDriveFile {
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
  fields?: string;
  parents?: string[];
  mimeType?: string;
}

export class GoogleDriveService {
  private static instance: GoogleDriveService;
  private drive: drive_v3.Drive | null = null;
  private auth: GoogleAuth | null = null;
  private initialized = false;
  private config: GoogleDriveConfig = {};

  private constructor() {}

  static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  /**
   * Initialize the Google Drive service with configuration
   */
  initialize(config: GoogleDriveConfig): void {
    this.config = { ...config };

    try {
      // Set up authentication
      if (config.keyFile) {
        // Service account authentication
        this.auth = new GoogleAuth({
          keyFile: config.keyFile,
          scopes: config.scopes || ['https://www.googleapis.com/auth/drive.readonly'],
        });
      } else if (config.clientId && config.clientSecret) {
        // OAuth2 authentication
        this.auth = new GoogleAuth({
          credentials: {
            client_id: config.clientId,
            client_secret: config.clientSecret,
          },
          scopes: config.scopes || ['https://www.googleapis.com/auth/drive.readonly'],
        });
      } else {
        throw new Error('Either keyFile or clientId/clientSecret must be provided');
      }

      // Create Drive API instance
      this.drive = google.drive({
        version: 'v3',
        auth: this.auth,
      });

      this.initialized = true;
      console.log('Google Drive service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error);
      throw error;
    }
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.drive !== null;
  }

  /**
   * Get file metadata by ID
   */
  async getFile(fileId: string, fields?: string): Promise<GoogleDriveFile | null> {
    if (!this.isInitialized()) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const response = await this.drive!.files.get({
        fileId,
        fields:
          fields ||
          'id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,parents',
      });

      return response.data as GoogleDriveFile;
    } catch (error) {
      console.error('Error getting file:', error);
      return null;
    }
  }

  /**
   * Download file content as buffer
   */
  async downloadFile(fileId: string): Promise<Buffer | null> {
    if (!this.isInitialized()) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const response = await this.drive!.files.get(
        {
          fileId,
          alt: 'media',
        },
        { responseType: 'arraybuffer' },
      );

      return Buffer.from(response.data as ArrayBuffer);
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  }

  /**
   * Get file content as stream
   */
  async getFileStream(fileId: string): Promise<NodeJS.ReadableStream | null> {
    if (!this.isInitialized()) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const response = await this.drive!.files.get(
        {
          fileId,
          alt: 'media',
        },
        { responseType: 'stream' },
      );

      return response.data as NodeJS.ReadableStream;
    } catch (error) {
      console.error('Error getting file stream:', error);
      return null;
    }
  }

  /**
   * Search for files in Google Drive
   */
  async searchFiles(options: GoogleDriveSearchOptions = {}): Promise<GoogleDriveFile[]> {
    if (!this.isInitialized()) {
      throw new Error('Google Drive service not initialized');
    }

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

      const response = await this.drive!.files.list({
        q: query,
        pageSize: options.pageSize || 100,
        orderBy: options.orderBy || 'modifiedTime desc',
        fields:
          options.fields ||
          'files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,parents)',
      });

      return (response.data.files || []) as GoogleDriveFile[];
    } catch (error) {
      console.error('Error searching files:', error);
      return [];
    }
  }

  /**
   * Search for images in Google Drive
   */
  async searchImages(folderIds?: string[], query?: string): Promise<GoogleDriveFile[]> {
    const imageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
    ];

    const searchOptions: GoogleDriveSearchOptions = {
      query: query || `(${imageTypes.map((type) => `mimeType='${type}'`).join(' or ')})`,
      orderBy: 'modifiedTime desc',
    };

    if (folderIds) {
      searchOptions.parents = folderIds;
    }

    return this.searchFiles(searchOptions);
  }

  /**
   * Get a direct download URL for a file
   */
  getDirectDownloadUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  /**
   * Get a thumbnail URL for an image file
   */
  getThumbnailUrl(fileId: string, size = 400): string {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
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
   * Get file permissions (if user has access)
   */
  async getFilePermissions(fileId: string): Promise<unknown[]> {
    if (!this.isInitialized()) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const response = await this.drive!.permissions.list({
        fileId,
        fields: 'permissions(id,type,role,emailAddress)',
      });

      return response.data.permissions || [];
    } catch (error) {
      console.error('Error getting file permissions:', error);
      return [];
    }
  }

  /**
   * List files in a specific folder
   */
  async listFilesInFolder(folderId: string, mimeType?: string): Promise<GoogleDriveFile[]> {
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
   * Get folder contents recursively
   */
  async getFolderContentsRecursive(
    folderId: string,
    maxDepth = 3,
    currentDepth = 0,
  ): Promise<GoogleDriveFile[]> {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const files = await this.listFilesInFolder(folderId);
    const allFiles: GoogleDriveFile[] = [...files];

    // Find subfolders and recursively get their contents
    const folders = files.filter((file) => file.mimeType === 'application/vnd.google-apps.folder');

    for (const folder of folders) {
      const subFiles = await this.getFolderContentsRecursive(folder.id, maxDepth, currentDepth + 1);
      allFiles.push(...subFiles);
    }

    return allFiles;
  }

  /**
   * Export a Google Docs/Sheets document in specified format
   */
  async exportDocument(fileId: string, mimeType: string): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const response = await this.drive!.files.export({
        fileId,
        mimeType,
      });

      return response.data as string;
    } catch (error) {
      console.error('Error exporting document:', error);
      throw error;
    }
  }

  /**
   * Get document content as plain text (for Google Docs)
   */
  async getDocumentAsText(fileId: string): Promise<string> {
    return this.exportDocument(fileId, 'text/plain');
  }

  /**
   * Get document content as HTML (for Google Docs)
   */
  async getDocumentAsHtml(fileId: string): Promise<string> {
    return this.exportDocument(fileId, 'text/html');
  }

  /**
   * Get spreadsheet content as CSV (for Google Sheets)
   */
  async getSpreadsheetAsCsv(fileId: string): Promise<string> {
    return this.exportDocument(fileId, 'text/csv');
  }
}

// Export a singleton instance
export const googleDriveService = GoogleDriveService.getInstance();
