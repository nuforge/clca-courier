/**
 * Hybrid Newsletter Service
 * Provides dual-source hosting: local web-optimized PDFs + Google Drive archive
 * Enables JavaScript manipulation while maintaining high-quality archive
 */

import type { PdfDocument } from '../composables/usePdfViewer';

export interface NewsletterMetadata extends PdfDocument {
  // Extended properties for hybrid hosting
  localFile?: string; // Local web-optimized filename
  driveId?: string; // Google Drive file ID for archive
  driveUrl?: string; // Google Drive direct URL
  thumbnailPath?: string; // Thumbnail image path
  fileSize?: string; // Display file size
  publishDate?: string; // ISO date string
  topics?: string[]; // Auto-extracted topics
  tags?: string[]; // Manual tags
  contentType?: 'newsletter' | 'special' | 'annual';
  quality?: 'web' | 'print'; // Quality indicator
}

export interface NewsletterSource {
  type: 'local' | 'drive' | 'hybrid';
  url: string;
  available: boolean;
  lastChecked?: Date;
}

class NewsletterService {
  private cache = new Map<string, NewsletterMetadata[]>();
  private localBasePath = '/issues/';
  private driveBaseUrl = 'https://drive.google.com/file/d/';

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    // Load initial newsletter data
    console.log('[NewsletterService] Initializing hybrid newsletter service');
  }

  /**
   * Get all newsletters with hybrid source information
   */
  async getNewsletters(): Promise<NewsletterMetadata[]> {
    const cacheKey = 'newsletters';

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Load enhanced newsletter data with hybrid metadata
      const response = await fetch('/src/data/newsletters-hybrid.json');
      if (response.ok) {
        const data = await response.json();
        const enhancedNewsletters = data.newsletters as NewsletterMetadata[];
        this.cache.set(cacheKey, enhancedNewsletters);
        return enhancedNewsletters;
      }

      // Fallback to original issues.json
      const fallbackResponse = await fetch('/src/data/issues.json');
      const baseNewsletters = (await fallbackResponse.json()) as PdfDocument[];

      // Enhance with hybrid metadata
      const enhancedNewsletters = baseNewsletters.map((newsletter) =>
        this.enhanceWithHybridMetadata(newsletter),
      );

      // Cache the results
      this.cache.set(cacheKey, enhancedNewsletters);

      return enhancedNewsletters;
    } catch (error) {
      console.error('[NewsletterService] Error loading newsletters:', error);
      return [];
    }
  }

  /**
   * Enhance base newsletter data with hybrid hosting metadata
   */
  private enhanceWithHybridMetadata(newsletter: PdfDocument): NewsletterMetadata {
    const driveId = this.extractDriveId();
    const driveUrl = this.generateDriveUrl();

    const enhanced: NewsletterMetadata = {
      ...newsletter,
      localFile: newsletter.filename,
      thumbnailPath: this.generateThumbnailPath(newsletter.filename),
      publishDate: this.parsePublishDate(newsletter.date),
      contentType: this.determineContentType(newsletter.title),
      quality: 'web',
      // Add Google Drive metadata if available
      ...(driveId && { driveId }),
      ...(driveUrl && { driveUrl }),
    };

    return enhanced;
  }

  /**
   * Get the best available source for a newsletter
   */
  async getNewsletterSources(newsletter: NewsletterMetadata): Promise<NewsletterSource[]> {
    const sources: NewsletterSource[] = [];

    // Local source (preferred for web features)
    const localUrl = `${this.localBasePath}${newsletter.localFile}`;
    const localAvailable = await this.checkLocalAvailability(localUrl);

    sources.push({
      type: 'local',
      url: localUrl,
      available: localAvailable,
      lastChecked: new Date(),
    });

    // Google Drive source (for high-quality downloads)
    if (newsletter.driveId && newsletter.driveUrl) {
      sources.push({
        type: 'drive',
        url: newsletter.driveUrl,
        available: true, // Assume Drive files are available
        lastChecked: new Date(),
      });
    }

    // Hybrid source indicator
    if (localAvailable && newsletter.driveUrl) {
      sources.push({
        type: 'hybrid',
        url: localUrl, // Primary URL for hybrid mode
        available: true,
        lastChecked: new Date(),
      });
    }

    return sources;
  }

  /**
   * Get the optimal URL for web viewing (local preferred)
   */
  async getWebViewUrl(newsletter: NewsletterMetadata): Promise<string | null> {
    const sources = await this.getNewsletterSources(newsletter);

    // Prefer local for web viewing
    const localSource = sources.find((s) => s.type === 'local' && s.available);
    if (localSource) {
      return localSource.url;
    }

    // Fallback to original URL
    return newsletter.url;
  }

  /**
   * Get the high-quality download URL (Drive preferred)
   */
  async getDownloadUrl(newsletter: NewsletterMetadata): Promise<string | null> {
    const sources = await this.getNewsletterSources(newsletter);

    // Prefer Google Drive for downloads
    const driveSource = sources.find((s) => s.type === 'drive' && s.available);
    if (driveSource) {
      return `${driveSource.url}/view?usp=sharing`;
    }

    // Fallback to local
    const localSource = sources.find((s) => s.type === 'local' && s.available);
    return localSource?.url || newsletter.url;
  }

  /**
   * Check if a local file is available
   */
  private async checkLocalAvailability(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate thumbnail path from filename
   */
  private generateThumbnailPath(filename: string): string {
    const baseName = filename.replace(/\.pdf$/i, '');
    return `/thumbnails/${baseName}.jpg`;
  }

  /**
   * Parse publish date from date string
   */
  private parsePublishDate(dateStr: string): string {
    try {
      // Handle various date formats
      if (dateStr.includes('2024') || dateStr.includes('2025')) {
        const year = dateStr.match(/\d{4}/)?.[0];
        const month = dateStr.toLowerCase().includes('january')
          ? '01'
          : dateStr.toLowerCase().includes('february')
            ? '02'
            : dateStr.toLowerCase().includes('march')
              ? '03'
              : dateStr.toLowerCase().includes('april')
                ? '04'
                : dateStr.toLowerCase().includes('may')
                  ? '05'
                  : dateStr.toLowerCase().includes('june')
                    ? '06'
                    : dateStr.toLowerCase().includes('july')
                      ? '07'
                      : dateStr.toLowerCase().includes('august')
                        ? '08'
                        : dateStr.toLowerCase().includes('september')
                          ? '09'
                          : dateStr.toLowerCase().includes('october')
                            ? '10'
                            : dateStr.toLowerCase().includes('november')
                              ? '11'
                              : dateStr.toLowerCase().includes('december')
                                ? '12'
                                : '01';

        if (year && month) {
          return `${year}-${month}-01`;
        }
      }

      return new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Determine content type from title
   */
  private determineContentType(title: string): 'newsletter' | 'special' | 'annual' {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('annual') || lowerTitle.includes('picnic')) {
      return 'annual';
    }

    if (
      lowerTitle.includes('special') ||
      (lowerTitle.includes('winter') &&
        !lowerTitle.includes('2024') &&
        !lowerTitle.includes('2025'))
    ) {
      return 'special';
    }

    return 'newsletter';
  }

  /**
   * Extract Google Drive ID from existing data (placeholder)
   */
  private extractDriveId(): string | undefined {
    // This would be populated from external metadata or configuration
    // For now, return undefined - can be enhanced later
    return undefined;
  }

  /**
   * Generate Google Drive URL from newsletter data
   */
  private generateDriveUrl(): string | undefined {
    const driveId = this.extractDriveId();
    return driveId ? `${this.driveBaseUrl}${driveId}` : undefined;
  }

  /**
   * Clear cache (useful for refreshing data)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get service statistics
   */
  async getServiceStats() {
    const newsletters = await this.getNewsletters();
    const sourceCounts = { local: 0, drive: 0, hybrid: 0 };

    for (const newsletter of newsletters) {
      const sources = await this.getNewsletterSources(newsletter);

      if (sources.some((s) => s.type === 'hybrid' && s.available)) {
        sourceCounts.hybrid++;
      } else if (sources.some((s) => s.type === 'local' && s.available)) {
        sourceCounts.local++;
      } else if (sources.some((s) => s.type === 'drive' && s.available)) {
        sourceCounts.drive++;
      }
    }

    return {
      totalNewsletters: newsletters.length,
      sourceCounts,
      cacheSize: this.cache.size,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const newsletterService = new NewsletterService();
