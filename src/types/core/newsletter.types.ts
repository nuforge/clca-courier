/**
 * Newsletter and Publication Types
 * Consolidated from newsletter-interfaces.ts and related files
 */

import type { BaseContentDocument, BaseContentHistory } from './versioning.types';

/**
 * Unified Newsletter Interface
 * Consolidates LightweightNewsletter and NewsletterMetadata into single consistent interface
 * This is the primary newsletter type used throughout the application
 */
export interface Newsletter {
  // Core identification
  id: number;
  title: string;
  filename: string;
  date: string;

  // Basic metadata
  pages: number;
  url: string;
  fileSize?: string;

  // Source information
  source: 'local' | 'drive' | 'hybrid';
  localFile?: string;
  driveId?: string;
  driveUrl?: string;

  // Visual assets
  thumbnailUrl?: string;
  thumbnailPath?: string;

  // Content classification
  topics?: string[];
  tags?: string[];
  contentType?: 'newsletter' | 'special' | 'annual';

  // Processing status (for async loading)
  isProcessed?: boolean;
  isProcessing?: boolean;

  // Extended metadata (optional)
  publishDate?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  quality?: 'web' | 'print';
}

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
 * @deprecated Use Newsletter interface instead
 */
export type UnifiedNewsletter = Newsletter;

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
