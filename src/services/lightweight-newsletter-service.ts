/**
 * Lightweight Newsletter Service
 * Fast loading with smart PDF metadata caching
 */

import { getPublicPath } from '../utils/path-utils';
import { logger } from '../utils/logger';
import { pdfMetadataStorageService } from './pdf-metadata-storage-service';

export interface LightweightNewsletter {
  id: number;
  title: string;
  filename: string;
  date: string;
  pages: number;
  url: string;

  // Optional metadata (available immediately if cached)
  fileSize?: string;
  thumbnailUrl?: string;
  topics?: string[];
  contentType?: 'newsletter' | 'special' | 'annual';

  // Processing status
  isProcessed: boolean; // Whether we have rich metadata
  isProcessing: boolean; // Currently being processed
}

class LightweightNewsletterService {
  private cache = new Map<string, LightweightNewsletter[]>();
  private localBasePath = getPublicPath('issues/');

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    logger.info('Initializing lightweight newsletter service');
  }

  /**
   * Get newsletters with instant loading (cached metadata when available)
   */
  async getNewsletters(): Promise<LightweightNewsletter[]> {
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

      // Step 4: Queue remaining PDFs for background processing
      this.queueUnprocessedPDFs(newsletters);

      // Sort by date (newest first)
      newsletters.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
   * Fast PDF discovery using newsletters-complete.json data
   */
  private async discoverLocalPDFs(): Promise<Array<{ url: string; filename: string }>> {
    logger.info('Discovering PDF files from newsletters data...');

    try {
      const response = await fetch('/data/newsletters-complete.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch newsletters data: ${response.status}`);
      }

      const newsletters = await response.json();
      const validFiles: Array<{ url: string; filename: string }> = [];

      for (const newsletter of newsletters) {
        if (newsletter.filename) {
          validFiles.push({
            url: `${this.localBasePath}${newsletter.filename}`,
            filename: newsletter.filename,
          });
        }
      }

      logger.success(`Found ${validFiles.length} PDF files from data`);
      return validFiles;
    } catch (error) {
      logger.error('Failed to load newsletters data:', error);
      return [];
    }
  }

  /**
   * Create base newsletter objects with minimal metadata
   */
  private createBaseNewsletters(
    pdfs: Array<{ url: string; filename: string }>,
  ): LightweightNewsletter[] {
    return pdfs.map((pdf) => ({
      id: this.generateNumericId(pdf.filename),
      title: this.extractTitleFromFilename(pdf.filename),
      filename: pdf.filename,
      date: this.parsePublishDateFromFilename(pdf.filename),
      pages: 0, // Will be filled from cache or processing
      url: pdf.url,
      isProcessed: false,
      isProcessing: false,
    }));
  }

  /**
   * Enhance newsletters with cached metadata (instant)
   */
  private enhanceWithCachedMetadata(newsletters: LightweightNewsletter[]): void {
    let enhancedCount = 0;

    for (const newsletter of newsletters) {
      const cachedMetadata = pdfMetadataStorageService.getQuickMetadata(newsletter.filename);

      if (cachedMetadata) {
        newsletter.pages = cachedMetadata.pages;
        newsletter.fileSize = cachedMetadata.fileSize;
        newsletter.topics = cachedMetadata.topics;
        newsletter.contentType = cachedMetadata.contentType;
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
  private queueUnprocessedPDFs(newsletters: LightweightNewsletter[]): void {
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
        url: newsletter.url,
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
   * Get newsletter by filename (with up-to-date processing status)
   */
  async getNewsletterByFilename(filename: string): Promise<LightweightNewsletter | null> {
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
  async searchNewsletters(query: string): Promise<LightweightNewsletter[]> {
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
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }
}

// Export singleton instance
export const lightweightNewsletterService = new LightweightNewsletterService();
