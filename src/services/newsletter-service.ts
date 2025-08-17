/**
 * Hybrid Newsletter Service
 * Provides dual-source hosting: local web-optimized PDFs + Google Drive archive
 * Enables JavaScript manipulation while maintaining high-quality archive
 */

import type { PdfDocument } from '../composables/usePdfViewer';
import { pdfMetadataService, type PDFMetadata } from './pdf-metadata-service';
import type { GoogleDriveFile } from '../types/google-drive-content';
import { convertToViewUrl } from '../utils/googleDriveUtils';
import { logger } from '../utils/logger';
import { getDataPath, getPublicPath } from '../utils/path-utils';

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
  private localBasePath = getPublicPath('issues/');
  private driveBaseUrl = 'https://drive.google.com/file/d/';

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    // Load initial newsletter data
    logger.info('Initializing hybrid newsletter service with real Google Drive integration');
    logger.debug('Google Drive Folder IDs:');
    logger.debug('- Issues Folder:', import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID);
    logger.debug('- PDFs Folder:', import.meta.env.VITE_GOOGLE_DRIVE_PDFS_FOLDER_ID);
    logger.debug(
      '- API Key:',
      import.meta.env.VITE_GOOGLE_API_KEY ? 'Configured ✅' : 'Missing ❌',
    );
    logger.debug(
      '- Client ID:',
      import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Configured ✅' : 'Missing ❌',
    );
  }

  /**
   * Get all newsletters with hybrid source information
   * ONLY uses real PDF files - NO JSON EVER
   */
  async getNewsletters(): Promise<NewsletterMetadata[]> {
    const cacheKey = 'newsletters';

    // Check cache first
    if (this.cache.has(cacheKey)) {
      logger.debug('Returning cached newsletter data');
      return this.cache.get(cacheKey)!;
    }

    logger.info('Loading newsletters ONLY from real PDF files...');

    try {
      // Add timeout to prevent hanging
      const discoveryPromise = this.discoverLocalPDFs();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('PDF discovery timeout')), 10000); // 10 second timeout
      });

      // Race between discovery and timeout
      const localPDFs = await Promise.race([discoveryPromise, timeoutPromise]);
      logger.success(`Found ${localPDFs.length} local PDF files`);

      // Process PDFs with metadata extraction
      const pdfMetadataList = await pdfMetadataService.processPDFBatch(localPDFs);
      logger.info(`Successfully processed ${pdfMetadataList.length} PDF files`);

      // Convert to newsletter metadata
      const newsletters = pdfMetadataList.map((meta) => this.convertPDFMetadataToNewsletter(meta));

      // Sort by date (newest first)
      newsletters.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Cache the results
      this.cache.set(cacheKey, newsletters);

      logger.success(`Loaded ${newsletters.length} newsletters from real PDF files`);
      return newsletters;
    } catch (error) {
      logger.error('Failed to load newsletters from PDF files:', error);

      // Return empty array rather than hanging
      return [];
    }
  }

  /**
   * Discover all local PDF files DYNAMICALLY using actual file validation
   * Temporary fast implementation while dynamic discovery is optimized
   */
  private async discoverLocalPDFs(): Promise<Array<{ url: string; filename: string }>> {
    logger.info('Fast-loading PDF files from /public/issues/...');

    // Quick validation of the most recent files first (likely to be accessed)
    const recentFiles = [
      '2025.08-conashaugh-courier.pdf',
      '2025.07-conashaugh-courier.pdf',
      '2025.06-conashaugh-courier.pdf',
      '2025.05-conashaugh-courier.pdf',
      '2025.02-conashaugh-courier.pdf',
      '2024.12-conashaugh-courier.pdf',
      '2024.11-conashaugh-courier.pdf',
      '2024.10-conashaugh-courier.pdf',
    ];

    // Validate these files exist quickly
    const validFiles: Array<{ url: string; filename: string }> = [];

    // Test recent files with fast timeout
    for (const filename of recentFiles) {
      const url = `${this.localBasePath}${filename}`;
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1000); // 1 second timeout

        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
        });

        if (response.ok) {
          validFiles.push({ url, filename });
          logger.debug(`✓ ${filename}`);
        }
      } catch {
        // File doesn't exist, skip
      }
    }

    // If we found some files, return them immediately for fast loading
    if (validFiles.length > 0) {
      logger.success(`Fast-loaded ${validFiles.length} recent PDF files`);

      // Optionally discover more files in the background (don't await)
      void this.discoverMoreFilesInBackground(validFiles);

      return validFiles;
    }

    // Fallback: if no recent files found, try a broader but still limited search
    logger.warn('No recent files found, trying broader search...');
    return this.discoverTargetedFilesOnly();
  }

  /**
   * Discover additional files in background without blocking UI
   */
  private async discoverMoreFilesInBackground(
    existingFiles: Array<{ url: string; filename: string }>,
  ) {
    // This runs in background - expand the file list over time
    const additionalPatterns = this.generateTargetedFilenames().slice(0, 30); // Limit to 30 more

    for (const filename of additionalPatterns) {
      // Skip if we already have this file
      if (existingFiles.some((f) => f.filename === filename)) continue;

      const url = `${this.localBasePath}${filename}`;
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          existingFiles.push({ url, filename });
          logger.debug(`Background found: ${filename}`);
        }
      } catch {
        // Skip silently
      }

      // Small delay to not overwhelm
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    logger.info(`Background discovery completed. Total files: ${existingFiles.length}`);
  }

  /**
   * Fallback method for targeted file discovery
   */
  private async discoverTargetedFilesOnly(): Promise<Array<{ url: string; filename: string }>> {
    const targetFiles = this.generateTargetedFilenames().slice(0, 15); // Only first 15
    const validFiles: Array<{ url: string; filename: string }> = [];

    for (const filename of targetFiles) {
      const url = `${this.localBasePath}${filename}`;
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          validFiles.push({ url, filename });
        }
      } catch {
        // Skip
      }
    }

    return validFiles;
  }

  /**
   * Generate targeted filenames based on known patterns (reduced set)
   */
  private generateTargetedFilenames(): string[] {
    const filenames: string[] = [];
    const currentYear = new Date().getFullYear();

    // Focus on years where we know files exist (2014-2025)
    for (let year = 2014; year <= currentYear; year++) {
      // Monthly issues - only test months that commonly exist
      const commonMonths = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12];
      for (const month of commonMonths) {
        const monthStr = month.toString().padStart(2, '0');
        filenames.push(`${year}.${monthStr}-conashaugh-courier.pdf`);
      }

      // Seasonal issues (most common patterns)
      filenames.push(`${year}.summer-conashaugh-courier.pdf`);
      filenames.push(`${year}.winter-conashaugh-courier.pdf`);
    }

    return filenames;
  } /**
   * Convert PDF metadata to newsletter metadata
   */
  private convertPDFMetadataToNewsletter(pdfMeta: PDFMetadata): NewsletterMetadata {
    const publishDate = this.parsePublishDateFromFilename(pdfMeta.filename);

    return {
      id: this.generateNumericId(pdfMeta.filename),
      title: pdfMeta.title,
      filename: pdfMeta.filename,
      date: publishDate,
      pages: pdfMeta.pages,
      url: `${this.localBasePath}${pdfMeta.filename}`,
      // Hybrid metadata
      localFile: pdfMeta.filename,
      thumbnailPath: pdfMeta.thumbnailDataUrl, // Use generated thumbnail
      fileSize: pdfMeta.fileSize,
      publishDate: new Date(publishDate).toISOString(),
      contentType: 'newsletter' as const,
      quality: 'web' as const,
      // PDF metadata
      ...(pdfMeta.author && { author: pdfMeta.author }),
      ...(pdfMeta.subject && { subject: pdfMeta.subject }),
      ...(pdfMeta.keywords && { keywords: pdfMeta.keywords }),
    };
  }

  /**
   * Parse publish date from filename
   */
  private parsePublishDateFromFilename(filename: string): string {
    const match = filename.match(/^(\d{4})\.(\d{2})-/);
    if (match) {
      const [, year, month] = match;
      return `${year}-${month}-01`; // First day of month
    }
    return new Date().toISOString().split('T')[0] || ''; // Fallback to today
  }

  /**
   * Generate unique numeric ID from filename
   */
  private generateNumericId(filename: string): number {
    // Convert filename to a consistent numeric ID
    let hash = 0;
    for (let i = 0; i < filename.length; i++) {
      const char = filename.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate unique ID from filename
   */
  private generateId(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }

  /**
   * Enhance newsletter metadata that already has most fields populated
   */
  private enhanceNewsletterMetadata(newsletter: NewsletterMetadata): NewsletterMetadata {
    const driveId = newsletter.driveId || this.extractDriveId();
    const driveUrl = newsletter.driveUrl || this.generateDriveUrl();

    return {
      ...newsletter,
      // Add any missing hybrid metadata
      thumbnailPath: newsletter.thumbnailPath || this.generateThumbnailPath(newsletter.filename),
      ...(driveId && { driveId }),
      ...(driveUrl && { driveUrl }),
    };
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

    // Local source (preferred for web features) - only check if localFile exists
    if (newsletter.localFile) {
      const localUrl = `${this.localBasePath}${newsletter.localFile}`;
      const localAvailable = await this.checkLocalAvailability(localUrl);

      if (localAvailable) {
        sources.push({
          type: 'local',
          url: localUrl,
          available: true,
          lastChecked: new Date(),
        });
      }
    }

    // Google Drive source (for high-quality downloads)
    if (newsletter.driveId && newsletter.driveUrl) {
      sources.push({
        type: 'drive',
        url: newsletter.driveUrl,
        available: true, // Assume Drive files are available
        lastChecked: new Date(),
      });
    }

    // No separate hybrid source type - hybrid is determined by having both local and drive

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

    // For Google Drive sources, try to convert to a direct export URL if possible
    const driveSource = sources.find((s) => s.type === 'drive' && s.available);
    if (driveSource) {
      // Use the utility function to convert to view format
      return convertToViewUrl(driveSource.url);
    }

    // Fallback to original URL, but try to convert if it's a Google Drive URL
    if (newsletter.url) {
      return convertToViewUrl(newsletter.url);
    }

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
    return getPublicPath(`thumbnails/${baseName}.jpg`);
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

  /**
   * Discover newsletters from Google Drive using REAL folder IDs from .env
   */
  private async discoverGoogleDriveNewsletters(): Promise<NewsletterMetadata[]> {
    try {
      logger.drive('Discovering Google Drive newsletters from real folders...');

      // Try to fetch from actual Google Drive API first
      const apiData = await this.fetchFromGoogleDriveAPI();
      if (apiData.length > 0) {
        logger.success(`Found ${apiData.length} newsletters from Google Drive API`);
        return apiData;
      }

      // Only fall back to hybrid data if Google Drive API is not available/authenticated
      console.log(
        '[NewsletterService] Google Drive API not available, checking for existing hybrid data...',
      );
      const hybridData = await this.loadGoogleDriveHybridData();
      if (hybridData.length > 0) {
        console.log(
          `[NewsletterService] Found ${hybridData.length} newsletters with Google Drive metadata from hybrid JSON`,
        );
        return hybridData;
      }

      console.log(
        '[NewsletterService] No Google Drive data found - authenticate to load from real folders',
      );
      return [];
    } catch (error) {
      console.error('[NewsletterService] Error discovering Google Drive newsletters:', error);
      return [];
    }
  }

  /**
   * Load Google Drive newsletter data from hybrid JSON file
   */
  private async loadGoogleDriveHybridData(): Promise<NewsletterMetadata[]> {
    try {
      const response = await fetch(getDataPath('newsletters-hybrid.json'));
      const hybridData: { newsletters: Partial<NewsletterMetadata>[] } = await response.json();

      // Filter to only newsletters that have Google Drive information
      const driveNewsletters = hybridData.newsletters
        .filter(
          (newsletter: Partial<NewsletterMetadata>) => newsletter.driveId && newsletter.driveUrl,
        )
        .map(
          (newsletter: Partial<NewsletterMetadata>): NewsletterMetadata => ({
            ...(newsletter as NewsletterMetadata),
            // Ensure proper NewsletterMetadata format
            publishDate: newsletter.publishDate || newsletter.date || new Date().toISOString(),
            quality: newsletter.quality || 'web',
            contentType: newsletter.contentType || 'newsletter',
          }),
        );

      return driveNewsletters;
    } catch (error) {
      console.error('[NewsletterService] Error loading hybrid data:', error);
      return [];
    }
  }

  /**
   * Fetch newsletters from Google Drive API using real folder IDs from .env (no authentication required)
   */
  private async fetchFromGoogleDriveAPI(): Promise<NewsletterMetadata[]> {
    try {
      console.log(
        '[NewsletterService] Fetching newsletters from Google Drive API without authentication...',
      );

      // Get environment variables
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const issuesFolderId = import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID;
      const pdfsFolderId = import.meta.env.VITE_GOOGLE_DRIVE_PDFS_FOLDER_ID;

      if (!apiKey || !issuesFolderId || !pdfsFolderId) {
        console.warn(
          '[NewsletterService] Google Drive API key or folder IDs not found in environment',
        );
        return [];
      }

      console.log(
        `[NewsletterService] Using folders: Issues=${issuesFolderId}, PDFs=${pdfsFolderId}`,
      );

      // Fetch files from both folders using simple API calls (no auth)
      const [issuesFiles, pdfsFiles] = await Promise.all([
        this.fetchFilesFromFolder(issuesFolderId, 'Issues'),
        this.fetchFilesFromFolder(pdfsFolderId, 'PDFs'),
      ]);

      const driveNewsletters: NewsletterMetadata[] = [];

      // Process all files from both folders
      for (const file of [...issuesFiles, ...pdfsFiles]) {
        if (file.mimeType === 'application/pdf' && this.isNewsletterFile(file.name)) {
          const newsletter = this.convertGoogleDriveFileToNewsletter(file);
          driveNewsletters.push(newsletter);
        }
      }

      console.log(
        `[NewsletterService] Found ${driveNewsletters.length} newsletters from Google Drive API`,
      );
      return driveNewsletters;
    } catch (error) {
      console.error('[NewsletterService] Error fetching from Google Drive API:', error);
      return [];
    }
  }

  /**
   * Check if a filename looks like a newsletter
   */
  private isNewsletterFile(filename: string): boolean {
    const lowerName = filename.toLowerCase();
    return (
      lowerName.includes('courier') ||
      lowerName.includes('newsletter') ||
      lowerName.match(/^\d{4}\.\d{2}-/) !== null || // 2025.05- pattern
      lowerName.includes('picnic') ||
      lowerName.includes('conashaugh')
    );
  }

  /**
   * Fetch files from a specific Google Drive folder (no authentication required for public folders)
   */
  private async fetchFilesFromFolder(
    folderId: string,
    folderName: string,
  ): Promise<GoogleDriveFile[]> {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${apiKey}&fields=files(id,name,size,modifiedTime,mimeType,webViewLink,webContentLink)`;

      console.log(`[NewsletterService] Fetching from ${folderName} folder: ${folderId}`);
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[NewsletterService] Failed to fetch from ${folderName} folder: ${response.status} ${response.statusText}`,
          errorText,
        );
        return [];
      }

      const data = await response.json();
      console.log(
        `[NewsletterService] Found ${data.files?.length || 0} files in ${folderName} folder`,
      );
      return data.files || [];
    } catch (error) {
      console.error(`[NewsletterService] Error fetching from ${folderName} folder:`, error);
      return [];
    }
  }

  /**
   * Convert Google Drive file to NewsletterMetadata
   */
  private convertGoogleDriveFileToNewsletter(file: GoogleDriveFile): NewsletterMetadata {
    // Parse date from filename
    const publishDate = this.parsePublishDateFromFilename(file.name);

    // Generate unique ID from Drive file ID
    const id = this.generateNumericId(file.id || file.name);

    // Determine title from filename
    let title = file.name.replace('.pdf', '');

    // Clean up title for better display
    if (title.match(/^\d{4}\.\d{2}-(.+)/)) {
      const match = title.match(/^\d{4}\.\d{2}-(.+)/);
      if (match && match[1]) {
        title = `Conashaugh Courier - ${this.formatDateFromFilename(title)}`;
      }
    }

    return {
      id,
      title,
      filename: file.name,
      date: this.formatDateFromFilename(file.name) || publishDate,
      pages: 0, // Will be determined when file is loaded
      url: file.webViewLink || `https://drive.google.com/file/d/${file.id}`,

      // Google Drive specific metadata
      driveId: file.id,
      driveUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}`,
      fileSize: this.formatFileSize(file.size),
      publishDate: new Date(publishDate).toISOString(),
      contentType: this.determineContentType(title),
      quality: 'print', // Google Drive files are typically high quality

      // Additional metadata from Google Drive
      ...(file.modifiedTime && { lastModified: file.modifiedTime }),
    };
  }

  /**
   * Format file size from bytes to human readable
   */
  private formatFileSize(bytes: number | string | undefined): string {
    if (!bytes || bytes === 0) return 'Unknown';

    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (isNaN(size)) return 'Unknown';

    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Format date from filename for display
   */
  private formatDateFromFilename(filename: string): string {
    const match = filename.match(/^(\d{4})\.(\d{2})-/);
    if (match && match[1] && match[2]) {
      const [, year, month] = match;
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
      const monthIndex = parseInt(month, 10) - 1;
      const monthName = monthNames[monthIndex] || 'Unknown';
      return `${monthName} ${year}`;
    }

    // Handle other date formats in filename
    if (filename.toLowerCase().includes('winter')) return 'Winter';
    if (filename.toLowerCase().includes('summer')) return 'Summer';
    if (filename.toLowerCase().includes('spring')) return 'Spring';
    if (filename.toLowerCase().includes('fall')) return 'Fall';

    return filename.replace('.pdf', '');
  }

  /**
   * Merge local and Google Drive sources, marking hybrid availability
   */
  private mergeLocalAndDriveSources(
    localNewsletters: NewsletterMetadata[],
    driveNewsletters: NewsletterMetadata[],
  ): NewsletterMetadata[] {
    const merged = [...localNewsletters];

    // For each Drive newsletter, check if we have a local version
    for (const driveNewsletter of driveNewsletters) {
      const localMatch = merged.find((local) => this.isSameNewsletter(local, driveNewsletter));

      if (localMatch) {
        // Merge Google Drive metadata into local newsletter
        if (driveNewsletter.driveId) localMatch.driveId = driveNewsletter.driveId;
        if (driveNewsletter.driveUrl) localMatch.driveUrl = driveNewsletter.driveUrl;
        console.log(`[NewsletterService] Found hybrid source for: ${localMatch.filename}`);
      } else {
        // Add Drive-only newsletter
        merged.push(driveNewsletter);
        console.log(`[NewsletterService] Found Drive-only newsletter: ${driveNewsletter.filename}`);
      }
    }

    return merged;
  }

  // REMOVED: All JSON fallback functions - NO JSON REFERENCES ALLOWED

  /**
   * Check if two newsletters represent the same publication
   */
  private isSameNewsletter(a: NewsletterMetadata, b: NewsletterMetadata): boolean {
    // Compare by filename if available
    if (a.filename && b.filename) {
      return a.filename === b.filename;
    }

    // Compare by title and date
    if (a.title === b.title && a.date === b.date) {
      return true;
    }

    // Compare by ID
    return a.id === b.id;
  }
}

// Export singleton instance
export const newsletterService = new NewsletterService();
