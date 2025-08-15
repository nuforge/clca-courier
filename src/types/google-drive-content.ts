// src/types/google-drive-content.ts
export interface GoogleDriveContentConfig {
  // API credentials
  apiKey: string;
  clientId: string;

  // Folder IDs for different content types
  contentFolderId: string; // Main content folder
  issuesFolderId: string; // PDF issues folder
  imagesFolderId: string; // Images folder
  templatesFolderId: string; // Templates for Canva
}

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
}

export interface ContentPreview {
  id: string;
  title: string;
  content?: string;
  type: 'article' | 'event' | 'news' | 'issue';
}

export interface SearchResult {
  id: string;
  title: string;
  content?: string;
  filename?: string;
  contentType: 'article' | 'event' | 'news' | 'issue';
}

export interface GoogleDocsContent {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  etag: string;
  type: 'article' | 'event' | 'news';
  status: 'draft' | 'published' | 'archived';
  metadata?: {
    author?: string;
    category?: string;
    tags?: string[];
    publishDate?: string;
    featuredImage?: string; // Google Drive file ID
  };
}

export interface GoogleSheetsData {
  id: string;
  title: string;
  lastModified: string;
  etag: string;
  data: Record<string, unknown>[]; // Parsed sheet data
  type: 'classifieds' | 'events' | 'community-stats';
}

export interface IssueWithGoogleDrive {
  id: number;
  title: string;
  date: string;
  pages: number;
  filename: string;
  // Enhanced with Google Drive support
  googleDriveFileId?: string;
  localUrl?: string; // Fallback to local file
  url?: string; // Original URL for backward compatibility
  googleDriveUrl?: string;
  thumbnailUrl?: string;
  cacheThumbnailUrl?: string;
  lastModified?: string;
  etag?: string;
  canvaTemplateId?: string; // Link to Canva template
  contentDocId?: string; // Link to Google Doc with content
  status: 'local' | 'google-drive' | 'hybrid';
  syncStatus: 'synced' | 'outdated' | 'error' | 'syncing';
  // Additional metadata
  fileSize?: string;
  description?: string;
  tags?: string[];
  author?: string;
  category?: string;
}

export interface ContentSyncStatus {
  lastSync: string;
  contentEtags: Record<string, string>; // Doc/Sheet ID -> etag
  fileEtags: Record<string, string>; // File ID -> etag
  errors: string[];
  syncInProgress: boolean;
}
