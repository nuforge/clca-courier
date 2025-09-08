/**
 * Newsletter and Publication Types
 * UNIFIED TYPE SYSTEM - Consolidates all newsletter interfaces into one canonical type
 */

import type { BaseContentDocument, BaseContentHistory } from './versioning.types';

// Import NewsletterArticle from content management types
interface NewsletterArticle {
  title: string;
  content: string;
  pageNumbers: number[];
  wordCount: number;
}

// File location tracking - where does this file actually exist?
interface FileLocationStatus {
  localFile: boolean; // Exists in public/issues/
  firebaseStorage: boolean; // Exists in Firebase Storage
  firebaseMetadata: boolean; // Has metadata in Firestore
  draftData: boolean; // Has draft in localStorage
  processedMetadata: boolean; // Has extracted metadata locally
}

// Data source object returned by getDataSource function
export interface DataSourceInfo {
  source: 'draft' | 'saved' | 'remote' | 'local' | 'metadata-only';
  color: string;
  icon: string;
  status: 'complete' | 'metadata-only' | 'file-only' | 'synced';
  description: string;
  locationStatus: FileLocationStatus;
  syncActions: {
    canUpload: boolean;
    canDownload: boolean;
    canSyncMetadata: boolean;
    needsUpload: boolean;
    needsDownload: boolean;
    status:
      | 'synced'
      | 'needs-upload'
      | 'needs-download'
      | 'needs-sync'
      | 'local-only'
      | 'remote-only'
      | 'unknown';
  };
  locations: string[]; // Human-readable list of where file exists
}

/**
 * CANONICAL NEWSLETTER TYPE
 * This is THE ONLY newsletter type that should be used throughout the application
 * Consolidates: Newsletter, LightweightNewsletter, ContentManagementNewsletter, NewsletterMetadata
 */
export interface UnifiedNewsletter {
  // CORE IDENTIFICATION - Required fields
  id: string; // Firebase document ID or hash-based ID
  filename: string; // PDF filename
  title: string; // Display title

  // BASIC METADATA - Essential properties
  downloadUrl: string; // Where to download/view the PDF
  fileSize: number; // File size in bytes
  pageCount: number; // Number of pages
  isPublished: boolean; // Publication status
  featured: boolean; // Featured status

  // DATE INFORMATION - Normalized date handling
  year: number; // Publication year (required)
  publicationDate: string; // ISO date string
  displayDate?: string; // Human-readable date ("August 2025")
  sortValue?: number; // Numeric sort value (YYYYMM)
  season?: 'spring' | 'summer' | 'fall' | 'winter' | undefined;
  month?: number; // 1-12 for monthly newsletters

  // CONTENT METADATA - Rich content information
  description?: string; // Brief description
  summary?: string; // Longer summary
  searchableText?: string; // Full text content
  tags: string[]; // Content tags
  categories?: string[]; // Content categories
  keyTerms?: string[]; // Extracted key terms
  keywordCounts?: Record<string, number>; // Word frequency

  // VISUAL ASSETS
  thumbnailUrl?: string; // Thumbnail image URL

  // PROCESSING STATUS
  isProcessed?: boolean; // Has rich metadata
  isProcessing?: boolean; // Currently being processed

  // PUBLICATION METADATA
  issueNumber?: string; // Issue identifier
  issue?: number; // Issue number (numeric)
  volume?: number; // Volume number
  contributors?: string[] | string; // Authors/contributors

  // CONTENT ANALYSIS
  wordCount?: number; // Total word count
  readingTimeMinutes?: number; // Estimated reading time
  articleCount?: number; // Number of articles
  articles?: NewsletterArticle[]; // Extracted articles

  // VERSION CONTROL
  version?: number; // Version number for tracking changes

  // MANAGEMENT SPECIFIC PROPERTIES
  syncStatus?: string; // Sync status for management UI
  dataSource?: DataSourceInfo; // Data source information object
  extractedText?: string; // Extracted text for management
  actions?: string[] | Record<string, unknown>; // Available actions
  isDraft?: boolean; // Draft status

  // AUDIT FIELDS
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  createdBy: string; // User ID
  updatedBy: string; // User ID

  // TEXT EXTRACTION METADATA
  textExtractionVersion?: string; // Version of extraction algorithm
  textExtractedAt?: string; // When text was extracted

  // STORAGE CONFIGURATION
  storageRef?: string; // Firebase Storage path
  storage?: {
    primary: {
      provider: 'firebase';
      downloadUrl: string;
      storageRef: string;
      fileSize: number;
    };
    thumbnail?: {
      provider: 'firebase';
      downloadUrl: string;
      storageRef: string;
    };
    archive?: {
      provider: 'b2' | 'r2' | 'spaces' | 'wasabi';
      downloadUrl: string;
      storageRef: string;
      fileSize: number;
    };
  };

  // LEGACY COMPATIBILITY - Will be phased out
  date?: string; // Legacy date field
  pages?: number; // Legacy pages field
  url?: string; // Legacy URL field
  topics?: string[]; // Legacy topics field
  contentType?: 'newsletter' | 'special' | 'annual';
  source?: 'local' | 'drive' | 'hybrid';
  localFile?: string;
  driveId?: string;
  driveUrl?: string;
  thumbnailPath?: string;
  publishDate?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  quality?: 'web' | 'print';
}

/**
 * TYPE ALIASES - For backward compatibility during migration
 * @deprecated Use UnifiedNewsletter instead
 */
export type Newsletter = UnifiedNewsletter;
export type LightweightNewsletter = UnifiedNewsletter;
export type ContentManagementNewsletter = UnifiedNewsletter;
export type NewsletterMetadata = UnifiedNewsletter;

/**
 * Newsletter Document for versioning system
 * Extends BaseContentDocument with newsletter-specific fields
 */
export interface NewsletterDocument extends BaseContentDocument {
  // Newsletter-specific fields from existing NewsletterMetadata
  filename: string;
  description?: string;
  publicationDate: string;
  issueNumber?: string;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  year: number;
  month?: number; // 1-12 for monthly newsletters
  fileSize: number;
  pageCount?: number;

  // Enhanced date fields for better sorting and display
  displayDate?: string; // Human-readable date (e.g., "August 2025", "Winter 2023")
  sortValue?: number; // Numeric value for sorting (YYYYMM format)

  // Firebase Storage implementation
  downloadUrl: string; // Firebase Storage download URL
  storageRef: string; // Firebase Storage path reference
  thumbnailUrl?: string; // Optional thumbnail URL

  // Content classification
  tags: string[];
  featured: boolean;
  isPublished: boolean;
  searchableText?: string; // Extracted PDF text for search

  // Action availability
  actions: {
    canView: boolean; // PDF available for viewing
    canDownload: boolean; // PDF available for download
    canSearch: boolean; // Text extracted and searchable
    hasThumbnail: boolean; // Preview thumbnail available
  };
}

/**
 * Newsletter History entry
 * Typed wrapper around BaseContentHistory for newsletters
 */
export interface NewsletterHistory extends BaseContentHistory<NewsletterDocument> {
  // Newsletter-specific history fields can be added here if needed
  readonly __newsletterHistory: true; // Brand to distinguish from BaseContentHistory
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use UnifiedNewsletter interface instead
 */

/**
 * Newsletter service statistics for debugging and monitoring
 */
export interface NewsletterServiceStats {
  totalNewsletters: number;
  sourceCounts: {
    local: number;
    drive: number;
    hybrid: number;
  };
  processingStats: {
    processed: number;
    processing: number;
    pending: number;
  };
  cacheSize: number;
  lastUpdated: string;
}

/**
 * Newsletter service configuration options
 */
export interface NewsletterServiceConfig {
  strategy: 'fast' | 'enhanced' | 'hybrid';
  enableCaching: boolean;
  enableBackgroundProcessing: boolean;
  maxConcurrentRequests: number;
}

/**
 * Newsletter search and filtering
 */
export interface NewsletterSearchCriteria {
  query?: string;
  contentType?: Newsletter['contentType'];
  source?: Newsletter['source'];
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  topics?: string[];
}

/**
 * Newsletter sorting options
 */
export type NewsletterSortField = 'date' | 'title' | 'pages' | 'fileSize';
export type NewsletterSortOrder = 'asc' | 'desc';

export interface NewsletterSortOptions {
  field: NewsletterSortField;
  order: NewsletterSortOrder;
}

/**
 * Newsletter processing states
 */
export type NewsletterProcessingState = 'pending' | 'processing' | 'processed' | 'error';

/**
 * Newsletter quality settings for different use cases
 */
export type NewsletterQuality = 'web' | 'print' | 'thumbnail';
