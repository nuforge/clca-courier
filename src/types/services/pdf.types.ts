/**
 * PDF Processing and Metadata Types
 * Consolidated from multiple PDF-related files
 */

/**
 * Core PDF document interface
 * Consolidated from usePdfViewer.ts and usePdfViewerEnhanced.ts
 */
export interface PdfDocument {
  id: number;
  title: string;
  date: string;
  pages: number;
  url: string;
  filename: string;
  fileSize?: string;
  thumbnailUrl?: string;
}

/**
 * Comprehensive PDF metadata interface
 * Consolidated from pdf-metadata-service.ts and related files
 */
export interface PdfMetadata {
  filename: string;
  title: string;
  pages: number;
  fileSize: string;
  thumbnailDataUrl?: string;
  thumbnailUrl?: string;
  creationDate?: string;
  modifiedDate?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  producer?: string;
  creator?: string;
  language?: string;
  pageSize?: { width: number; height: number };
  aspectRatio?: number;
  estimatedReadTime?: number;
  contentType?: 'newsletter' | 'special' | 'annual';
  extractedTopics?: string[];
  textContent?: string; // Full text content for search
  searchableText?: string; // Processed/cleaned text for search
}

/**
 * PDF validation result
 */
export interface PdfValidationResult {
  isValid: boolean;
  error?: string;
  fileSize?: number;
  mimeType?: string;
}

/**
 * PDF cache configuration
 */
export interface PdfCacheConfig {
  maxSizeBytes: number;
  maxAgeMs: number;
  compressionQuality: number;
  enablePersistence: boolean;
}

/**
 * Cached PDF data structure
 */
export interface CachedPdf {
  url: string;
  filename: string;
  size: number;
  cachedAt: number;
  expiresAt: number;
  blobUrl?: string;
}

/**
 * PDF processing queue item
 */
export interface PdfProcessingQueueItem {
  filename: string;
  url: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'error';
  timestamp: number;
  retryCount?: number;
}

/**
 * PDF viewer state
 */
export interface PdfViewerState {
  isOpen: boolean;
  isLoading: boolean;
  document: PdfDocument | null;
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  error: string | null;
}

/**
 * PDF viewer configuration
 */
export interface PdfViewerConfig {
  enableToolbar: boolean;
  enableSearch: boolean;
  enableDownload: boolean;
  enablePrint: boolean;
  defaultZoom: number;
  maxZoom: number;
  minZoom: number;
}

/**
 * PDF thumbnail generation options
 */
export interface PdfThumbnailOptions {
  width: number;
  height: number;
  quality: number;
  page: number;
  format: 'jpeg' | 'png' | 'webp';
}

/**
 * PDF text extraction result
 */
export interface PdfTextExtractionResult {
  content: string;
  metadata: {
    pageCount: number;
    wordCount: number;
    characterCount: number;
    language?: string;
  };
  pages: Array<{
    pageNumber: number;
    content: string;
  }>;
}

/**
 * PDF processing status
 */
export type PdfProcessingStatus = 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';

/**
 * PDF quality settings
 */
export type PdfQuality = 'low' | 'medium' | 'high' | 'original';

/**
 * PDF content type classification
 */
export type PdfContentType = 'newsletter' | 'special' | 'annual' | 'document' | 'unknown';
