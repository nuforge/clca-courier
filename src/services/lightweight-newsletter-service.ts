/**
 * Lightweight Newsletter Service
 * Fast loading with smart PDF metadata caching
 */

import { getPublicPath } from '../utils/path-utils';
import { logger } from '../utils/logger';
import { pdfMetadataStorageService } from './pdf-metadata-storage-service';
import type { UnifiedNewsletter } from '../types/core/newsletter.types';

class LightweightNewsletterService {
  private cache = new Map<string, UnifiedNewsletter[]>();
  private localBasePath = getPublicPath('issues/');

  // Static flag to control PDF processing during sync operations
  private static shouldProcessPDFs = true;

  constructor() {
    this.initializeService();
  }

  // Control PDF processing globally
  static setPDFProcessing(enable: boolean): void {
    LightweightNewsletterService.shouldProcessPDFs = enable;
  }

  private initializeService() {
    logger.info('Initializing lightweight newsletter service');
  }

  /**
   * Get newsletters with instant loading (cached metadata when available)
   */
  async getNewsletters(): Promise<UnifiedNewsletter[]> {
    const cacheKey = 'newsletters';

    // Check cache first
    if (this.cache.has(cacheKey)) {
      logger.debug('Returning cached newsletter data');
      return this.cache.get(cacheKey)!;
    }

    logger.info('Loading newsletters with lightweight approach...');

    try {
      // Step 1: Fast discovery of actual PDF files
      const discoveredPDFs = await this.discoverLocalPDFs();
      logger.success(`Discovered ${discoveredPDFs.length} PDF files`);

      // Step 2: Create base newsletter objects (instant)
      const newsletters = this.createBaseNewsletters(discoveredPDFs);

      // Step 3: Enhance with cached metadata (instant if available)
      this.enhanceWithCachedMetadata(newsletters);

      // Step 4: Queue remaining PDFs for background processing (if enabled)
      if (LightweightNewsletterService.shouldProcessPDFs) {
        this.queueUnprocessedPDFs(newsletters);
      } else {
        logger.info('PDF processing disabled - skipping background processing');
      }

      // Sort by date (newest first)
      newsletters.sort(
        (a, b) =>
          new Date(b.publicationDate || '1900-01-01').getTime() -
          new Date(a.publicationDate || '1900-01-01').getTime(),
      );

      // Cache the results
      this.cache.set(cacheKey, newsletters);

      logger.success(
        `Loaded ${newsletters.length} newsletters (${newsletters.filter((n) => n.isProcessed).length} with rich metadata)`,
      );
      return newsletters;
    } catch (error) {
      logger.error('Failed to load newsletters:', error);
      return [];
    }
  }

  /**
   * Discover local PDF files from /public/issues/ folder
   * Uses pre-generated manifest to avoid hardcoded filename lists
   */
  private async discoverLocalPDFs(): Promise<Array<{ url: string; filename: string }>> {
    logger.info('🔍 Loading actual PDF files from manifest...');

    try {
      // Load the pre-generated manifest of actual files
      const manifestResponse = await fetch('/data/pdf-manifest.json');
      if (!manifestResponse.ok) {
        throw new Error(`Failed to load PDF manifest: ${manifestResponse.status}`);
      }

      const manifest = await manifestResponse.json();
      const validFiles = manifest.files.map((file: { filename: string; path: string }) => ({
        url: `${this.localBasePath}${file.filename}`,
        filename: file.filename,
      }));

      logger.success(
        `📰 Loaded ${validFiles.length} PDF files from manifest (generated: ${manifest.generated})`,
      );
      return validFiles;
    } catch (error) {
      logger.error('Failed to load PDF manifest:', error);
      // Fallback to empty array rather than hardcoded list
      return [];
    }
  } /**
   * Create base newsletter objects with minimal metadata
   */
  private createBaseNewsletters(
    pdfs: Array<{ url: string; filename: string }>,
  ): UnifiedNewsletter[] {
    return pdfs.map((pdf) => ({
      id: this.generateStringId(pdf.filename),
      filename: pdf.filename,
      title: this.extractTitleFromFilename(pdf.filename),
      downloadUrl: pdf.url,
      fileSize: 0, // Will be filled from cache or processing
      pageCount: 0, // Will be filled from cache or processing
      isPublished: true, // Default for discovered PDFs
      featured: false,
      year: this.extractYearFromFilename(pdf.filename),
      publicationDate: this.parsePublishDateFromFilename(pdf.filename),
      tags: [],
      // Required audit fields
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      updatedBy: 'system',
      // Optional processing status
      isProcessed: false,
      isProcessing: false,
    }));
  }

  /**
   * Enhance newsletters with cached metadata (instant)
   */
  private enhanceWithCachedMetadata(newsletters: UnifiedNewsletter[]): void {
    let enhancedCount = 0;

    for (const newsletter of newsletters) {
      const cachedMetadata = pdfMetadataStorageService.getQuickMetadata(newsletter.filename);

      if (cachedMetadata) {
        newsletter.pageCount = cachedMetadata.pages;
        newsletter.fileSize = parseInt(String(cachedMetadata.fileSize), 10) || 0;
        newsletter.tags = cachedMetadata.topics || [];
        if (cachedMetadata.thumbnailDataUrl) {
          newsletter.thumbnailUrl = cachedMetadata.thumbnailDataUrl;
        }
        newsletter.isProcessed = true;
        enhancedCount++;
      }
    }

    if (enhancedCount > 0) {
      logger.info(
        `Enhanced ${enhancedCount}/${newsletters.length} newsletters with cached metadata`,
      );
    }
  }

  /**
   * Queue unprocessed PDFs for background processing
   */
  private queueUnprocessedPDFs(newsletters: UnifiedNewsletter[]): void {
    const unprocessed = newsletters.filter((n) => !n.isProcessed);

    if (unprocessed.length === 0) {
      logger.info('All newsletters already have cached metadata');
      return;
    }

    // Assign priorities (recent = higher priority)
    const queueItems = unprocessed.map((newsletter) => {
      const year = parseInt(newsletter.filename.substring(0, 4));
      const currentYear = new Date().getFullYear();
      const priority = Math.max(1, 10 - (currentYear - year)); // Recent files get higher priority

      newsletter.isProcessing = true;

      return {
        filename: newsletter.filename,
        url: newsletter.downloadUrl,
        priority,
      };
    });

    pdfMetadataStorageService.bulkAddToQueue(queueItems);

    logger.info(`Queued ${unprocessed.length} newsletters for background processing`);
  }

  /**
   * Extract title from filename with better formatting
   */
  private extractTitleFromFilename(filename: string): string {
    const nameWithoutExt = filename.replace(/\.pdf$/i, '');

    // Parse patterns like "2024.02-conashaugh-courier"
    const monthMatch = nameWithoutExt.match(/^(\d{4})\.(\d{2})-(.+)$/);
    if (monthMatch) {
      const [, year, month] = monthMatch;
      const monthNames = [
        '',
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const monthIndex = parseInt(month!, 10);
      return `${monthNames[monthIndex]} ${year}`;
    }

    // Parse seasonal patterns like "2024.summer-conashaugh-courier"
    const seasonMatch = nameWithoutExt.match(/^(\d{4})\.(summer|winter|spring|fall)-(.+)$/);
    if (seasonMatch) {
      const [, year, season] = seasonMatch;
      const seasonTitles = {
        summer: 'Summer',
        winter: 'Winter',
        spring: 'Spring',
        fall: 'Fall',
      };
      return `${seasonTitles[season as keyof typeof seasonTitles]} ${year}`;
    }

    // Special issues
    if (nameWithoutExt.includes('special')) {
      const year = nameWithoutExt.match(/(\d{4})/)?.[1];
      return year ? `Special Edition ${year}` : 'Special Edition';
    }

    if (nameWithoutExt.includes('annual')) {
      const year = nameWithoutExt.match(/(\d{4})/)?.[1];
      return year ? `Annual Report ${year}` : 'Annual Report';
    }

    // Fallback: clean up filename
    return nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Parse publish date from filename
   */
  private parsePublishDateFromFilename(filename: string): string {
    const monthMatch = filename.match(/^(\d{4})\.(\d{2})-/);
    if (monthMatch) {
      const [, year, month] = monthMatch;
      return `${year}-${month}-01`;
    }

    const seasonMatch = filename.match(/^(\d{4})\.(summer|winter|spring|fall)-/);
    if (seasonMatch) {
      const [, year, season] = seasonMatch;
      const seasonMonths = {
        winter: '12',
        spring: '03',
        summer: '06',
        fall: '09',
      };
      return `${year}-${seasonMonths[season as keyof typeof seasonMonths]}-01`;
    }

    const yearMatch = filename.match(/(\d{4})/);
    if (yearMatch) {
      return `${yearMatch[1]}-06-01`; // Default to June
    }

    return new Date().toISOString().split('T')[0] || '2024-01-01';
  }

  /**
   * Generate unique string ID from filename
   */
  private generateStringId(filename: string): string {
    let hash = 0;
    for (let i = 0; i < filename.length; i++) {
      const char = filename.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString();
  }

  /**
   * Generate unique numeric ID from filename
   */
  private generateNumericId(filename: string): number {
    let hash = 0;
    for (let i = 0; i < filename.length; i++) {
      const char = filename.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Extract year from filename
   */
  private extractYearFromFilename(filename: string): number {
    const yearMatch = filename.match(/(\d{4})/);
    return yearMatch?.[1] ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
  }

  /**
   * Get newsletter by filename (with up-to-date processing status)
   */
  async getNewsletterByFilename(filename: string): Promise<UnifiedNewsletter | null> {
    const newsletters = await this.getNewsletters();
    return newsletters.find((n) => n.filename === filename) || null;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    total: number;
    processed: number;
    processing: number;
    pending: number;
  } {
    const newsletters = this.cache.get('newsletters') || [];

    return {
      total: newsletters.length,
      processed: newsletters.filter((n) => n.isProcessed).length,
      processing: newsletters.filter((n) => n.isProcessing).length,
      pending: newsletters.filter((n) => !n.isProcessed && !n.isProcessing).length,
    };
  }

  /**
   * Force refresh cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Newsletter cache cleared');
  }

  /**
   * Search newsletters (uses cached metadata when available)
   */
  async searchNewsletters(query: string): Promise<UnifiedNewsletter[]> {
    const newsletters = await this.getNewsletters();
    const queryLower = query.toLowerCase();

    // Use metadata storage service for enhanced search
    const cachedResults = pdfMetadataStorageService.searchCachedContent(query);
    const cachedFilenames = new Set(cachedResults.map((r) => r.filename));

    return newsletters
      .filter((newsletter) => {
        // Basic search in title and filename
        if (
          newsletter.title.toLowerCase().includes(queryLower) ||
          newsletter.filename.toLowerCase().includes(queryLower)
        ) {
          return true;
        }

        // Enhanced search if processed
        if (newsletter.isProcessed && cachedFilenames.has(newsletter.filename)) {
          return true;
        }

        // Search in topics if available
        if (newsletter.topics?.some((topic) => topic.toLowerCase().includes(queryLower))) {
          return true;
        }

        return false;
      })
      .sort((a, b) => {
        // Boost processed newsletters with rich metadata
        if (a.isProcessed && !b.isProcessed) return -1;
        if (!a.isProcessed && b.isProcessed) return 1;

        // Then by date
        return (
          new Date(b.publicationDate || '1900-01-01').getTime() -
          new Date(a.publicationDate || '1900-01-01').getTime()
        );
      });
  }
}

// Export singleton instance
export const lightweightNewsletterService = new LightweightNewsletterService();

// Export PDF processing control with proper binding
export const setPDFProcessing = (enable: boolean): void => {
  LightweightNewsletterService.setPDFProcessing(enable);
};
