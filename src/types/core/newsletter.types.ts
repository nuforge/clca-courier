/**
 * Newsletter and Publication Types
 * Consolidated from newsletter-interfaces.ts and related files
 */

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
