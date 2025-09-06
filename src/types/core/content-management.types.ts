/**
 * Content Management Types
 * Types specifically for the newsletter content management system
 */

/**
 * Extended Newsletter interface for content management
 * Contains all properties needed for the content management page
 */
export interface ContentManagementNewsletter {
  // Core identification (compatible with Newsletter)
  id: string;
  filename: string;
  title: string;

  // Management-specific properties
  description?: string;
  summary?: string;
  year: number;
  season: string;
  volume?: number;
  issue?: number;
  fileSize: number; // Differs from core Newsletter (string vs number)
  pageCount?: number;
  wordCount?: number;
  downloadUrl: string;
  thumbnailUrl?: string;
  searchableText?: string;
  tags: string[];
  categories?: string[];
  contributors?: string[] | string;
  featured: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;

  // Extended properties for text extraction
  keyTerms?: string[];
  keywordCounts?: Record<string, number>;
  readingTimeMinutes?: number;
  articleCount?: number;
  articles?: NewsletterArticle[];
  textExtractionVersion?: string;
  textExtractedAt?: string;
}

/**
 * Newsletter article extracted from PDF content
 */
export interface NewsletterArticle {
  title: string;
  content: string;
  pageNumbers: number[];
  wordCount: number;
}

/**
 * Extracted content from PDF processing
 */
export interface ExtractedContent {
  textContent: string;
  textPreview: string;
  wordCount: number;
  suggestedTags: string[];
  topics: string[];
  keyTerms: string[];
  keywordCounts?: Record<string, number>;
  articles?: NewsletterArticle[];
}

/**
 * Local storage stats for metadata management
 */
export interface LocalStorageStats {
  total: number;
  pending: number;
  synced: number;
  errors: number;
}

/**
 * Processing states for async operations
 */
export interface ProcessingStates {
  isLoading: boolean;
  isExtracting: boolean;
  isExtractingAllText: boolean;
  isGeneratingThumbs: boolean;
  isSaving: boolean;
  isProcessingText: boolean;
  isApplyingMetadata: boolean;
  isSyncing: boolean;
  extractingText: Record<string, boolean>;
  generatingThumb: Record<string, boolean>;
}

/**
 * Filter options for newsletter management
 */
export interface NewsletterFilters {
  searchText: string;
  filterYear: number | null;
  filterSeason: string | null;
}

/**
 * Text extraction dialog state
 */
export interface TextExtractionDialogState {
  showDialog: boolean;
  currentFile: ContentManagementNewsletter | null;
  extractedContent: ExtractedContent | null;
  extractionProgress: number;
  extractionStatus: string;
}

/**
 * Edit dialog state
 */
export interface EditDialogState {
  showDialog: boolean;
  editingNewsletter: ContentManagementNewsletter | null;
}
