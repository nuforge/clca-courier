/**
 * Lightweight Newsletter Service
 * Fast loading with smart PDF metadata caching
 */

import { getPublicPath } from '../utils/path-utils';
import { logger } from '../utils/logger';
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
      this.enhanceWithCachedMetadata();

      // Step 4: Queue remaining PDFs for background processing (if enabled)
      if (LightweightNewsletterService.shouldProcessPDFs) {
        this.queueUnprocessedPDFs();
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
  private enhanceWithCachedMetadata(): void {
    // Metadata enhancement removed - no PDF processing
    logger.debug('Metadata enhancement skipped - PDF processing removed');
  }

  /**
   * Queue unprocessed PDFs for background processing
   */
  private queueUnprocessedPDFs(): void {
    // Background processing removed - no PDF processing
    logger.debug('Background processing skipped - PDF processing removed');
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

    // Simple search without PDF metadata processing
    return newsletters
      .filter((newsletter) => {
        // Basic search in title and filename
        if (
          newsletter.title.toLowerCase().includes(queryLower) ||
          newsletter.filename.toLowerCase().includes(queryLower)
        ) {
          return true;
        }

        // Search in tags if available
        if (newsletter.tags?.some((tag) => tag.toLowerCase().includes(queryLower))) {
          return true;
        }

        return false;
      })
      .sort((a, b) => {
        // Sort by date
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
