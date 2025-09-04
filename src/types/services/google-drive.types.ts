/**
 * Google Drive Integration Types
 * Consolidated from multiple Google Drive service files
 */

/**
 * Google Drive API configuration
 */
export interface GoogleDriveConfig {
  // API credentials
  apiKey: string;
  clientId: string;

  // OAuth2 configuration
  scope: string;
  discoveryDocs: string[];

  // Folder IDs for different content types
  contentFolderId?: string; // Main content folder
  issuesFolderId?: string; // PDF issues folder
  imagesFolderId?: string; // Images folder
  templatesFolderId?: string; // Templates for Canva
  pdfsFolderId?: string; // Additional PDF folder
}

/**
 * Unified Google Drive File interface
 * Consolidates variations from google-drive-service.ts, google-drive-content.ts, etc.
 */
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  downloadUrl?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
  etag?: string; // For change detection
  description?: string;
  starred?: boolean;
  trashed?: boolean;
}

/**
 * Google Drive API response for file listings
 */
export interface GoogleDriveFileListResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string;
  incompleteSearch?: boolean;
}

/**
 * Google Drive search and query options
 */
export interface GoogleDriveSearchOptions {
  query?: string;
  pageSize?: number;
  orderBy?: string;
  pageToken?: string;
  fields?: string;
}

/**
 * Google Drive authentication state
 */
export interface GoogleDriveAuthState {
  isSignedIn: boolean;
  isLoading: boolean;
  accessToken?: string;
  expiresAt?: number;
  email?: string;
  name?: string;
}

/**
 * Google Drive upload options
 */
export interface GoogleDriveUploadOptions {
  name: string;
  parents?: string[];
  description?: string;
  mimeType?: string;
}

/**
 * Google Drive folder information
 */
export interface GoogleDriveFolder {
  id: string;
  name: string;
  description?: string;
  fileCount?: number;
  totalSize?: string;
}

/**
 * Google Drive error response
 */
export interface GoogleDriveError {
  code: number;
  message: string;
  status: string;
  details?: unknown;
}

/**
 * Google Drive sync status
 */
export type GoogleDriveSyncStatus = 'synced' | 'outdated' | 'error' | 'syncing' | 'pending';

/**
 * Google Drive content types for filtering
 */
export type GoogleDriveContentType =
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'image'
  | 'folder'
  | 'other';

/**
 * Google Drive API response wrapper
 */
export interface GoogleDriveApiResponse<T = unknown> {
  data?: T;
  error?: GoogleDriveError;
  status: 'success' | 'error';
}
