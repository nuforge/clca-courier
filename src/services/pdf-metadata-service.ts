/**
 * PDF Metadata and Thumbnail Service
 * Generates thumbnails from PDF covers and extracts metadata from local PDFs
 */

import { getDocument, type PDFDocumentProxy, GlobalWorkerOptions } from 'pdfjs-dist';

// Configure PDF.js worker with correct base path for GitHub Pages
const getWorkerPath = () => {
  if (typeof window !== 'undefined') {
    const isProduction = import.meta.env.PROD;
    const basePath = isProduction ? '/clca-courier' : '';
    return `${basePath}/pdf.worker.min.js`;
  }
  return '/pdf.worker.min.js';
};

GlobalWorkerOptions.workerSrc = getWorkerPath();

export interface PDFMetadata {
  filename: string;
  title: string;
  pages: number;
  fileSize: string;
  thumbnailDataUrl: string;
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
}

export interface CachedPDFData {
  [filename: string]: {
    metadata: PDFMetadata;
    timestamp: number;
    thumbnailBlob: Blob;
  };
}

class PDFMetadataService {
  private cache = new Map<string, PDFMetadata>();
  private thumbnailCache = new Map<string, string>(); // filename -> dataURL
  private processingQueue = new Set<string>();

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Extract metadata and generate thumbnail from local PDF
   */
  async extractPDFMetadata(pdfUrl: string, filename: string): Promise<PDFMetadata | null> {
    // Check cache first
    const cacheKey = `${filename}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Prevent duplicate processing
    if (this.processingQueue.has(filename)) {
      return null;
    }

    try {
      this.processingQueue.add(filename);
      console.log(`[PDFMetadataService] Processing PDF: ${filename}`);

      // Load PDF document
      const pdf = await getDocument(pdfUrl).promise;

      // Extract basic metadata
      const info = await pdf.getMetadata();
      const numPages = pdf.numPages;

      // Get first page for dimensions and aspect ratio
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      const pageSize = { width: viewport.width, height: viewport.height };
      const aspectRatio = viewport.width / viewport.height;

      // Generate thumbnail from first page (cover-facing)
      const thumbnailDataUrl = await this.generateThumbnailFromPDF(pdf);

      // Get file size (approximate from PDF data)
      const fileSize = await this.estimateFileSize(pdfUrl);

      // Estimate reading time (approximately 2 minutes per page)
      const estimatedReadTime = Math.max(1, Math.round(numPages * 2));

      // Extract content type from filename and metadata
      const contentType = this.determineContentType(filename, info.info as Record<string, unknown>);

      // Extract potential topics from title and subject
      const extractedTopics = this.extractTopicsFromMetadata(
        filename,
        info.info as Record<string, unknown>,
      );

      // Create metadata object
      const pdfInfo = info.info as Record<string, unknown>; // PDF info has dynamic properties
      const metadata: PDFMetadata = {
        filename,
        title: (pdfInfo?.Title as string) || this.extractTitleFromFilename(filename),
        pages: numPages,
        fileSize,
        thumbnailDataUrl,
        creationDate: (pdfInfo?.CreationDate as string)?.toString(),
        modifiedDate: (pdfInfo?.ModDate as string)?.toString(),
        author: (pdfInfo?.Author as string)?.toString(),
        subject: (pdfInfo?.Subject as string)?.toString(),
        producer: (pdfInfo?.Producer as string)?.toString(),
        creator: (pdfInfo?.Creator as string)?.toString(),
        language: (pdfInfo?.Language as string)?.toString(),
        keywords:
          (pdfInfo?.Keywords as string)
            ?.toString()
            ?.split(',')
            .map((k: string) => k.trim()) || [],
        pageSize,
        aspectRatio,
        estimatedReadTime,
        contentType,
        extractedTopics,
      };

      // Cache the result
      this.cache.set(cacheKey, metadata);
      this.thumbnailCache.set(filename, thumbnailDataUrl);
      this.saveCacheToStorage();

      console.log(`[PDFMetadataService] Extracted metadata for: ${filename}`);
      return metadata;
    } catch (error) {
      console.error(`[PDFMetadataService] Error processing ${filename}:`, error);
      return null;
    } finally {
      this.processingQueue.delete(filename);
    }
  }

  /**
   * Generate thumbnail from PDF first page
   */
  private async generateThumbnailFromPDF(pdf: PDFDocumentProxy): Promise<string> {
    try {
      // Get first page
      const page = await pdf.getPage(1);

      // Calculate scale for thumbnail (150px width)
      const viewport = page.getViewport({ scale: 1 });
      const scale = 150 / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      // Render page to canvas
      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      }).promise;

      // Convert to data URL
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('[PDFMetadataService] Error generating thumbnail:', error);
      // Return placeholder thumbnail
      return this.generatePlaceholderThumbnail();
    }
  }

  /**
   * Generate placeholder thumbnail
   */
  private generatePlaceholderThumbnail(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 150;
    canvas.height = 200;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 150, 200);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');

    // Fill background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 150, 200);

    // Add text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('PDF', 75, 100);
    ctx.font = '12px Arial';
    ctx.fillText('Thumbnail', 75, 120);

    return canvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * Extract title from filename
   */
  private extractTitleFromFilename(filename: string): string {
    const nameWithoutExt = filename.replace(/\.pdf$/i, '');

    // Parse patterns like "2024.02-conashaugh-courier"
    const match = nameWithoutExt.match(/^(\d{4})\.(\d{2})-(.+)$/);
    if (match) {
      const [, year, month] = match;
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

    // Fallback: clean up filename
    return nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Estimate file size from PDF URL
   */
  private async estimateFileSize(pdfUrl: string): Promise<string> {
    try {
      const response = await fetch(pdfUrl, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');

      if (contentLength) {
        const bytes = parseInt(contentLength, 10);
        return this.formatFileSize(bytes);
      }

      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Format file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Get cached thumbnail data URL
   */
  getCachedThumbnail(filename: string): string | null {
    return this.thumbnailCache.get(filename) || null;
  }

  /**
   * Process multiple PDFs in batch
   */
  async processPDFBatch(pdfs: Array<{ url: string; filename: string }>): Promise<PDFMetadata[]> {
    console.log(`[PDFMetadataService] Processing batch of ${pdfs.length} PDFs`);

    const results = await Promise.allSettled(
      pdfs.map((pdf) => this.extractPDFMetadata(pdf.url, pdf.filename)),
    );

    const metadata: PDFMetadata[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        metadata.push(result.value);
      } else {
        const pdf = pdfs[index];
        console.warn(`[PDFMetadataService] Failed to process: ${pdf?.filename || 'unknown'}`);
      }
    });

    console.log(
      `[PDFMetadataService] Successfully processed ${metadata.length}/${pdfs.length} PDFs`,
    );
    return metadata;
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      const cacheData: Record<
        string,
        {
          timestamp: number;
          metadata: PDFMetadata;
        }
      > = {};

      this.cache.forEach((metadata, key) => {
        cacheData[key] = {
          metadata,
          timestamp: Date.now(),
        };
      });

      localStorage.setItem('pdf-metadata-cache', JSON.stringify(cacheData));
      localStorage.setItem(
        'pdf-thumbnail-cache',
        JSON.stringify(Object.fromEntries(this.thumbnailCache)),
      );
    } catch (error) {
      console.warn('[PDFMetadataService] Failed to save cache:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const cacheData = localStorage.getItem('pdf-metadata-cache');
      const thumbnailData = localStorage.getItem('pdf-thumbnail-cache');

      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        Object.entries(
          parsed as Record<
            string,
            {
              timestamp: number;
              metadata: PDFMetadata;
            }
          >,
        ).forEach(([key, value]) => {
          // Only load cache entries less than 24 hours old
          if (Date.now() - value.timestamp < 24 * 60 * 60 * 1000) {
            this.cache.set(key, value.metadata);
          }
        });
      }

      if (thumbnailData) {
        const parsed = JSON.parse(thumbnailData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.thumbnailCache.set(key, value as string);
        });
      }

      console.log(`[PDFMetadataService] Loaded ${this.cache.size} cached entries`);
    } catch (error) {
      console.warn('[PDFMetadataService] Failed to load cache:', error);
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.thumbnailCache.clear();
    localStorage.removeItem('pdf-metadata-cache');
    localStorage.removeItem('pdf-thumbnail-cache');
  }

  /**
   * Determine content type from filename and metadata
   */
  private determineContentType(
    filename: string,
    pdfInfo: Record<string, unknown>,
  ): 'newsletter' | 'special' | 'annual' {
    const lowerFilename = filename.toLowerCase();
    const subject = (pdfInfo?.Subject as string)?.toLowerCase() || '';
    const title = (pdfInfo?.Title as string)?.toLowerCase() || '';

    // Check for annual reports
    if (
      lowerFilename.includes('annual') ||
      subject.includes('annual') ||
      title.includes('annual')
    ) {
      return 'annual';
    }

    // Check for special issues
    if (
      lowerFilename.includes('special') ||
      subject.includes('special') ||
      title.includes('special') ||
      lowerFilename.includes('holiday') ||
      lowerFilename.includes('summer') ||
      lowerFilename.includes('winter')
    ) {
      return 'special';
    }

    // Default to newsletter
    return 'newsletter';
  }

  /**
   * Extract topics from filename and PDF metadata
   */
  private extractTopicsFromMetadata(filename: string, pdfInfo: Record<string, unknown>): string[] {
    const topics: string[] = [];
    const subject = (pdfInfo?.Subject as string) || '';
    const title = (pdfInfo?.Title as string) || '';
    const keywords = (pdfInfo?.Keywords as string) || '';
    const lowerFilename = filename.toLowerCase();

    // Extract from filename patterns
    if (lowerFilename.includes('summer')) topics.push('Summer');
    if (lowerFilename.includes('winter')) topics.push('Winter');
    if (lowerFilename.includes('spring')) topics.push('Spring');
    if (lowerFilename.includes('fall') || lowerFilename.includes('autumn')) topics.push('Fall');
    if (lowerFilename.includes('holiday')) topics.push('Holiday');
    if (lowerFilename.includes('annual')) topics.push('Annual');

    // Extract from title content
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('summer')) topics.push('Summer');
    if (lowerTitle.includes('winter')) topics.push('Winter');
    if (lowerTitle.includes('spring')) topics.push('Spring');
    if (lowerTitle.includes('fall') || lowerTitle.includes('autumn')) topics.push('Fall');
    if (lowerTitle.includes('holiday')) topics.push('Holiday');
    if (lowerTitle.includes('annual')) topics.push('Annual');
    if (lowerTitle.includes('special')) topics.push('Special Issue');

    // Extract month/season from date pattern
    const monthMatch = filename.match(/(\d{4})\.(\d{2})-/);
    if (monthMatch && monthMatch[2]) {
      const month = parseInt(monthMatch[2], 10);
      const monthNames = [
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
      if (month >= 1 && month <= 12) {
        const monthName = monthNames[month - 1];
        if (monthName) {
          topics.push(monthName);
        }

        // Add seasonal topics
        if ([12, 1, 2].includes(month)) topics.push('Winter');
        else if ([3, 4, 5].includes(month)) topics.push('Spring');
        else if ([6, 7, 8].includes(month)) topics.push('Summer');
        else if ([9, 10, 11].includes(month)) topics.push('Fall');
      }
    }

    // Extract from subject and keywords
    if (subject) {
      const subjectTopics = subject
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2);
      topics.push(...subjectTopics);
    }

    if (keywords) {
      const keywordTopics = keywords
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2);
      topics.push(...keywordTopics);
    }

    // Remove duplicates and return
    return Array.from(new Set(topics)).slice(0, 10); // Limit to 10 topics
  }
}

// Export singleton instance
export const pdfMetadataService = new PDFMetadataService();
