/**
 * Hybrid Newsletter Service
 * Provides dual-source hosting: local web-optimized PDFs + Google Drive archive
 * Enables JavaScript manipulation while maintaining high-quality archive
 */

import type { PdfDocument } from '../composables/usePdfViewer';
import { pdfMetadataService, type PDFMetadata } from './pdf-metadata-service';
import type { GoogleDriveFile } from '../types/google-drive-content';
import { convertToViewUrl } from '../utils/googleDriveUtils';

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
    console.log(
      '[NewsletterService] Initializing hybrid newsletter service with REAL Google Drive integration',
    );
    console.log('[NewsletterService] Google Drive Folder IDs:');
    console.log('- Issues Folder:', import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID);
    console.log('- PDFs Folder:', import.meta.env.VITE_GOOGLE_DRIVE_PDFS_FOLDER_ID);
    console.log('- API Key:', import.meta.env.VITE_GOOGLE_API_KEY ? 'Configured ✅' : 'Missing ❌');
    console.log(
      '- Client ID:',
      import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Configured ✅' : 'Missing ❌',
    );
  }

  /**
   * Get all newsletters with hybrid source information
   * Primary data comes from actual files, JSON is fallback only
   */
  async getNewsletters(): Promise<NewsletterMetadata[]> {
    const cacheKey = 'newsletters';

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // PHASE 1: Discover and process local PDF files (primary source)
      const localPDFs = this.discoverLocalPDFs();
      console.log(`[NewsletterService] Found ${localPDFs.length} local PDF files`);

      // Extract PDF metadata for all local files
      const pdfMetadataList = await pdfMetadataService.processPDFBatch(localPDFs);

      // Convert PDF metadata to newsletter metadata
      let enhancedNewsletters = pdfMetadataList.map((pdfMeta) =>
        this.convertPDFMetadataToNewsletter(pdfMeta),
      );

      // PHASE 2: Check for Google Drive sources and merge
      const googleDriveNewsletters = await this.discoverGoogleDriveNewsletters();
      enhancedNewsletters = this.mergeLocalAndDriveSources(
        enhancedNewsletters,
        googleDriveNewsletters,
      );

      // PHASE 3: Load JSON fallback for any missing newsletters
      const jsonFallback = await this.loadFallbackNewsletters();
      enhancedNewsletters = this.mergeFallbackData(enhancedNewsletters, jsonFallback);

      // Sort by date (newest first)
      enhancedNewsletters.sort(
        (a, b) => new Date(b.publishDate || '').getTime() - new Date(a.publishDate || '').getTime(),
      );

      // Cache the results
      this.cache.set(cacheKey, enhancedNewsletters);
      console.log(
        `[NewsletterService] Generated metadata for ${enhancedNewsletters.length} newsletters`,
        `(${enhancedNewsletters.filter((n) => n.localFile).length} local, ` +
          `${enhancedNewsletters.filter((n) => n.driveId).length} drive, ` +
          `${enhancedNewsletters.filter((n) => n.localFile && n.driveId).length} hybrid)`,
      );

      return enhancedNewsletters;
    } catch (error) {
      console.error('[NewsletterService] Error generating newsletters:', error);
      // If all else fails, try loading from JSON
      return await this.loadFallbackNewsletters();
    }
  }

  /**
   * Discover all local PDF files
   */
  private discoverLocalPDFs(): Array<{ url: string; filename: string }> {
    // List of known local PDF files (in production, this could be dynamic)
    const knownPDFs = [
      '2024.02-conashaugh-courier.pdf',
      '2024.03-conashaugh-courier.pdf',
      '2024.04-conashaugh-courier.pdf',
      '2024.05-conashaugh-courier.pdf',
      '2024.06-conashaugh-courier.pdf',
      '2024.08-conashaugh-courier.pdf',
      '2024.09-conashaugh-courier.pdf',
      '2024.10-conashaugh-courier.pdf',
      '2024.11-conashaugh-courier.pdf',
      '2024.12-conashaugh-courier.pdf',
      '2025.02-conashaugh-courier.pdf',
      '2025.05-conashaugh-courier.pdf',
      '2025.06-conashaugh-courier.pdf',
      '2025.07-conashaugh-courier.pdf',
      '2025.08-conashaugh-courier.pdf',
    ];

    return knownPDFs.map((filename) => ({
      url: `${this.localBasePath}${filename}`,
      filename,
    }));
  }

  /**
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

  /**
   * Discover newsletters from Google Drive using REAL folder IDs from .env
   */
  private async discoverGoogleDriveNewsletters(): Promise<NewsletterMetadata[]> {
    try {
      console.log('[NewsletterService] Discovering Google Drive newsletters from REAL folders...');

      // Try to fetch from actual Google Drive API first
      const apiData = await this.fetchFromGoogleDriveAPI();
      if (apiData.length > 0) {
        console.log(
          `[NewsletterService] Found ${apiData.length} newsletters from Google Drive API`,
        );
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
      const response = await fetch('/src/data/newsletters-hybrid.json');
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

  /**
   * Load fallback newsletter data from JSON files
   */
  private async loadFallbackNewsletters(): Promise<NewsletterMetadata[]> {
    try {
      console.log('[NewsletterService] Loading fallback data from issues.json');

      // Load the original issues.json as fallback
      const response = await fetch('/src/data/issues.json');
      const issuesData: PdfDocument[] = await response.json();

      // Convert to NewsletterMetadata format with enhanced date parsing
      return issuesData.map((issue) => this.convertFallbackToNewsletter(issue));
    } catch (error) {
      console.error('[NewsletterService] Failed to load fallback data:', error);
      return [];
    }
  }

  /**
   * Merge fallback data for any newsletters not found in primary sources
   */
  private mergeFallbackData(
    primaryNewsletters: NewsletterMetadata[],
    fallbackNewsletters: NewsletterMetadata[],
  ): NewsletterMetadata[] {
    const merged = [...primaryNewsletters];

    for (const fallback of fallbackNewsletters) {
      const exists = merged.some((primary) => this.isSameNewsletter(primary, fallback));

      if (!exists) {
        console.log(`[NewsletterService] Adding fallback newsletter: ${fallback.filename}`);
        merged.push(fallback);
      }
    }

    return merged;
  }

  /**
   * Convert fallback JSON data to NewsletterMetadata with proper date parsing
   */
  private convertFallbackToNewsletter(issue: PdfDocument): NewsletterMetadata {
    // Parse date from filename if possible, otherwise use provided date
    let publishDate: string;

    const filenameMatch = issue.filename?.match(/^(\d{4})\.(\d{2})-/);
    if (filenameMatch) {
      const [, year, month] = filenameMatch;
      publishDate = `${year}-${month}-01`; // Default to 1st of month
    } else {
      // Try to parse the existing date field, defaulting to 1st of month
      const dateMatch = issue.date.match(/^(\w+)\s+(\d{4})$/);
      if (dateMatch) {
        const [, monthName, year] = dateMatch;
        if (monthName) {
          const monthNumber = this.getMonthNumber(monthName);
          publishDate = `${year}-${monthNumber.toString().padStart(2, '0')}-01`;
        } else {
          publishDate = new Date().toISOString().split('T')[0] || '1970-01-01';
        }
      } else {
        // If all else fails, use current date
        publishDate = new Date().toISOString().split('T')[0] || '1970-01-01';
      }
    }

    return {
      ...issue,
      publishDate: new Date(publishDate).toISOString(),
      contentType: this.determineContentType(issue.title),
      quality: 'web',
      // Do NOT set localFile - let the actual file check determine availability
      fileSize: 'Unknown', // Will be determined if file is accessible
    };
  }

  /**
   * Get month number from month name
   */
  private getMonthNumber(monthName: string): number {
    const months: Record<string, number> = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
      // Handle season names as well
      Spring: 4,
      Summer: 7,
      Fall: 10,
      Autumn: 10,
      Winter: 1,
    };
    return months[monthName] || 1; // Default to January
  }

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
