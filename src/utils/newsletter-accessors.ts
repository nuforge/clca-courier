/**
 * SAFE PROPERTY ACCESSORS
 * Eliminates the 122 unsafe .id access patterns found by the type checker
 */

import type { UnifiedNewsletter } from '../types/core/newsletter.types';

/**
 * Safely get newsletter ID with fallback
 */
export function getNewsletterIdSafe(newsletter: unknown): string {
  if (!newsletter || typeof newsletter !== 'object') {
    return '';
  }

  const n = newsletter as Partial<UnifiedNewsletter>;
  return n.id || n.filename || 'unknown';
}

/**
 * Safely get newsletter title with fallback
 */
export function getNewsletterTitleSafe(newsletter: unknown): string {
  if (!newsletter || typeof newsletter !== 'object') {
    return 'Untitled Newsletter';
  }

  const n = newsletter as Partial<UnifiedNewsletter>;
  return n.title || n.filename || 'Untitled Newsletter';
}

/**
 * Safely get newsletter filename with fallback
 */
export function getNewsletterFilenameSafe(newsletter: unknown): string {
  if (!newsletter || typeof newsletter !== 'object') {
    return '';
  }

  const n = newsletter as Partial<UnifiedNewsletter>;
  return n.filename || '';
}

/**
 * Safely get newsletter download URL with fallback
 */
export function getNewsletterUrlSafe(newsletter: unknown): string {
  if (!newsletter || typeof newsletter !== 'object') {
    return '';
  }

  const n = newsletter as Partial<UnifiedNewsletter>;
  return n.downloadUrl || n.url || '';
}

/**
 * Type guard to check if object is a valid newsletter
 */
export function isValidNewsletter(obj: unknown): obj is UnifiedNewsletter {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const n = obj as Partial<UnifiedNewsletter>;
  return Boolean(n.id && n.filename && n.title && (n.downloadUrl || n.url));
}

/**
 * Normalize any newsletter-like object to UnifiedNewsletter
 */
export function normalizeNewsletter(obj: unknown): UnifiedNewsletter | null {
  if (!isValidNewsletter(obj)) {
    return null;
  }

  const n = obj as Partial<UnifiedNewsletter>;

  // Create a properly typed newsletter with required fields
  return {
    // REQUIRED FIELDS with safe fallbacks
    id: n.id || n.filename || 'unknown',
    filename: n.filename || 'unknown.pdf',
    title: n.title || n.filename || 'Untitled',
    downloadUrl: n.downloadUrl || n.url || '',
    fileSize: n.fileSize || 0,
    pageCount: n.pageCount || n.pages || 0,
    isPublished: n.isPublished ?? true,
    featured: n.featured ?? false,
    year: n.year || new Date().getFullYear(),
    publicationDate: n.publicationDate || new Date().toISOString(),
    tags: n.tags || [],
    createdAt: n.createdAt || new Date().toISOString(),
    updatedAt: n.updatedAt || new Date().toISOString(),
    createdBy: n.createdBy || 'system',
    updatedBy: n.updatedBy || 'system',

    // OPTIONAL FIELDS - only include if they exist
    ...(n.description && { description: n.description }),
    ...(n.summary && { summary: n.summary }),
    ...(n.displayDate && { displayDate: n.displayDate }),
    ...(n.sortValue && { sortValue: n.sortValue }),
    ...(n.season && { season: n.season }),
    ...(n.month && { month: n.month }),
    ...(n.searchableText && { searchableText: n.searchableText }),
    ...(n.categories && { categories: n.categories }),
    ...(n.keyTerms && { keyTerms: n.keyTerms }),
    ...(n.keywordCounts && { keywordCounts: n.keywordCounts }),
    ...(n.thumbnailUrl && { thumbnailUrl: n.thumbnailUrl }),
    ...(n.isProcessed !== undefined && { isProcessed: n.isProcessed }),
    ...(n.isProcessing !== undefined && { isProcessing: n.isProcessing }),
    ...(n.issueNumber && { issueNumber: n.issueNumber }),
    ...(n.volume && { volume: n.volume }),
    ...(n.contributors && { contributors: n.contributors }),
    ...(n.wordCount && { wordCount: n.wordCount }),
    ...(n.readingTimeMinutes && { readingTimeMinutes: n.readingTimeMinutes }),
    ...(n.articleCount && { articleCount: n.articleCount }),
    ...(n.textExtractionVersion && { textExtractionVersion: n.textExtractionVersion }),
    ...(n.textExtractedAt && { textExtractedAt: n.textExtractedAt }),
    ...(n.storageRef && { storageRef: n.storageRef }),
    ...(n.storage && { storage: n.storage }),
  };
}

/**
 * Safely get array of newsletter IDs
 */
export function getNewsletterIdsSafe(newsletters: unknown[]): string[] {
  if (!Array.isArray(newsletters)) {
    return [];
  }

  return newsletters.map(getNewsletterIdSafe).filter((id) => id && id !== 'unknown');
}

/**
 * Find newsletter by ID safely
 */
export function findNewsletterByIdSafe(
  newsletters: unknown[],
  targetId: string,
): UnifiedNewsletter | null {
  if (!Array.isArray(newsletters) || !targetId) {
    return null;
  }

  const found = newsletters.find((n) => getNewsletterIdSafe(n) === targetId);
  return found ? normalizeNewsletter(found) : null;
}
