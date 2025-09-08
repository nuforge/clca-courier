/**
 * Content Management Types
 * Types specifically for the newsletter content management system
 * Updated to use unified newsletter type system
 */

import type { UnifiedNewsletter } from './newsletter.types';

// Re-export the unified type for backward compatibility
export type { UnifiedNewsletter as ContentManagementNewsletter } from './newsletter.types';

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
 * Local storage stats for metadata management
 */
export interface LocalStorageStats {
  total: number;
  pending: number;
  synced: number;
  errors: number;
}

/**
 * Filter options for newsletter management
 */
export interface NewsletterFilters {
  searchText: string;
  filterYear: number | null;
  filterSeason: string | null;
  filterMonth: number | null; // 1-12 for monthly filter
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
 * Newsletter article extracted from PDF content
 */
export interface NewsletterArticle {
  title: string;
  content: string;
  pageNumbers: number[];
  wordCount: number;
}

/**
 * Text extraction dialog state
 */
export interface TextExtractionDialogState {
  showDialog: boolean;
  currentFile: UnifiedNewsletter | null;
  extractedContent: ExtractedContent | null;
  extractionProgress: number;
  extractionStatus: string;
}

/**
 * Edit dialog state
 */
export interface EditDialogState {
  showDialog: boolean;
  editingNewsletter: UnifiedNewsletter | null;
}

export interface ContentExtractionOptions {
  extractText: boolean;
  generateSummary: boolean;
  generateTags: boolean;
  generateKeyTerms: boolean;
}
