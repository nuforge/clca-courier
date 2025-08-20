/**
 * Unified Newsletter Interfaces
 * Consolidates LightweightNewsletter and NewsletterMetadata into single consistent interface
 */

export interface UnifiedNewsletter {
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
 * Service statistics for debugging and monitoring
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
 * Service configuration options
 */
export interface NewsletterServiceConfig {
  strategy: 'fast' | 'enhanced' | 'hybrid';
  enableCaching: boolean;
  enableBackgroundProcessing: boolean;
  maxConcurrentRequests: number;
}
