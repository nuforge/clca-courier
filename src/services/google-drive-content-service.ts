// src/services/google-drive-content-service.ts
import { GoogleDriveBrowserService } from './google-drive-browser-service';
import type {
  GoogleDriveContentConfig,
  GoogleDriveFile,
  GoogleDocsContent,
  GoogleSheetsData,
  IssueWithGoogleDrive,
  ContentSyncStatus,
} from '../types/google-drive-content';

export class GoogleDriveContentService {
  private static instance: GoogleDriveContentService;
  private driveService: GoogleDriveBrowserService;
  private config: GoogleDriveContentConfig | null = null;
  private syncStatus: ContentSyncStatus = {
    lastSync: '',
    contentEtags: {},
    fileEtags: {},
    errors: [],
    syncInProgress: false,
  };

  private constructor() {
    this.driveService = GoogleDriveBrowserService.getInstance();
  }

  static getInstance(): GoogleDriveContentService {
    if (!GoogleDriveContentService.instance) {
      GoogleDriveContentService.instance = new GoogleDriveContentService();
    }
    return GoogleDriveContentService.instance;
  }

  configure(config: GoogleDriveContentConfig): void {
    this.config = config;
    console.log('Google Drive Content Service configured:', config);
  }

  // === CONTENT SYNCHRONIZATION ===

  async syncAllContent(): Promise<ContentSyncStatus> {
    if (!this.config) {
      throw new Error('Service not configured. Call configure() first.');
    }

    this.syncStatus.syncInProgress = true;
    this.syncStatus.errors = [];

    try {
      // Sync Google Docs content
      await this.syncGoogleDocsContent();

      // Sync Google Sheets data
      await this.syncGoogleSheetsData();

      // Sync PDF files
      await this.syncPdfFiles();

      // Sync images
      await this.syncImages();

      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.syncInProgress = false;

      // Save sync status to localStorage
      localStorage.setItem('google-drive-sync-status', JSON.stringify(this.syncStatus));

      return this.syncStatus;
    } catch (error) {
      this.syncStatus.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      this.syncStatus.syncInProgress = false;
      throw error;
    }
  }

  // === GOOGLE DOCS INTEGRATION ===

  async syncGoogleDocsContent(): Promise<GoogleDocsContent[]> {
    if (!this.config) throw new Error('Service not configured');

    try {
      // Search for Google Docs in the content folder
      const docs = await this.driveService.searchFiles({
        query: `'${this.config.contentFolderId}' in parents and mimeType='application/vnd.google-apps.document'`,
        fields: 'files(id,name,modifiedTime,mimeType,parents)',
      });

      const docsContent: GoogleDocsContent[] = [];

      for (const doc of docs) {
        // Check if document has changed
        const cachedEtag = this.syncStatus.contentEtags[doc.id];
        if (cachedEtag && cachedEtag === doc.modifiedTime) {
          continue; // Skip unchanged documents
        }

        // Export document as plain text or HTML
        const content = await this.driveService.getDocumentAsText(doc.id);

        // Parse document metadata from content or filename
        const metadata = this.parseDocumentMetadata(doc.name);

        const docContent: GoogleDocsContent = {
          id: doc.id,
          title: doc.name,
          content: content,
          lastModified: doc.modifiedTime || '',
          etag: doc.modifiedTime || '',
          type: metadata.type,
          status: metadata.status,
          metadata: metadata.data,
        };

        docsContent.push(docContent);
        this.syncStatus.contentEtags[doc.id] = doc.modifiedTime || '';
      }

      // Cache the content locally
      localStorage.setItem('google-docs-content', JSON.stringify(docsContent));

      return docsContent;
    } catch (error) {
      console.error('Error syncing Google Docs content:', error);
      throw error;
    }
  }

  // === GOOGLE SHEETS INTEGRATION ===

  async syncGoogleSheetsData(): Promise<GoogleSheetsData[]> {
    if (!this.config) throw new Error('Service not configured');

    try {
      // Search for Google Sheets in the content folder
      const sheets = await this.driveService.searchFiles({
        query: `'${this.config.contentFolderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet'`,
        fields: 'files(id,name,modifiedTime,mimeType,parents)',
      });

      const sheetsData: GoogleSheetsData[] = [];

      for (const sheet of sheets) {
        // Check if sheet has changed
        const cachedEtag = this.syncStatus.contentEtags[sheet.id];
        if (cachedEtag && cachedEtag === sheet.modifiedTime) {
          continue; // Skip unchanged sheets
        }

        // Get sheet data as CSV
        const csvData = await this.driveService.getSpreadsheetAsCsv(sheet.id);
        const parsedData = this.parseCsvData(csvData);

        // Determine sheet type from filename
        const sheetType = this.determineSheetType(sheet.name);

        const sheetData: GoogleSheetsData = {
          id: sheet.id,
          title: sheet.name,
          lastModified: sheet.modifiedTime || '',
          etag: sheet.modifiedTime || '',
          data: parsedData,
          type: sheetType,
        };

        sheetsData.push(sheetData);
        this.syncStatus.contentEtags[sheet.id] = sheet.modifiedTime || '';
      }

      // Cache the data locally
      localStorage.setItem('google-sheets-data', JSON.stringify(sheetsData));

      return sheetsData;
    } catch (error) {
      console.error('Error syncing Google Sheets data:', error);
      throw error;
    }
  }

  // === PDF FILES MANAGEMENT ===

  async syncPdfFiles(): Promise<IssueWithGoogleDrive[]> {
    if (!this.config) throw new Error('Service not configured');

    try {
      // Search for PDF files in the issues folder
      const pdfFiles = await this.driveService.searchFiles({
        query: `'${this.config.issuesFolderId}' in parents and mimeType='application/pdf'`,
        fields: 'files(id,name,size,modifiedTime,webViewLink,webContentLink,thumbnailLink)',
      });

      const issues: IssueWithGoogleDrive[] = [];

      for (const file of pdfFiles) {
        // Parse issue information from filename
        const issueInfo = this.parseIssueFilename(file.name);

        const issue: IssueWithGoogleDrive = {
          id: issues.length,
          title: issueInfo.title,
          date: issueInfo.date,
          pages: issueInfo.pages ?? 0,
          filename: file.name,
          googleDriveFileId: file.id,
          etag: file.modifiedTime || '',
          status: 'google-drive',
          syncStatus: 'synced',
          ...(file.webContentLink && { googleDriveUrl: file.webContentLink }),
          ...(file.thumbnailLink && { thumbnailUrl: file.thumbnailLink }),
          ...(file.modifiedTime && { lastModified: file.modifiedTime }),
        };

        issues.push(issue);
        this.syncStatus.fileEtags[file.id] = file.modifiedTime || '';
      }

      // Merge with local issues data
      const mergedIssues = await this.mergeWithLocalIssues(issues);

      // Cache the issues data
      localStorage.setItem('google-drive-issues', JSON.stringify(mergedIssues));

      return mergedIssues;
    } catch (error) {
      console.error('Error syncing PDF files:', error);
      throw error;
    }
  }

  // === UTILITY METHODS ===

  private parseDocumentMetadata(filename: string): {
    type: 'article' | 'event' | 'news';
    status: 'draft' | 'published' | 'archived';
    data: Record<string, unknown>;
  } {
    // Extract metadata from document name and content
    // This is a simplified version - you can enhance based on your naming conventions

    let type: 'article' | 'event' | 'news' = 'article';
    let status: 'draft' | 'published' | 'archived' = 'draft';

    if (filename.toLowerCase().includes('event')) type = 'event';
    if (filename.toLowerCase().includes('news')) type = 'news';

    if (filename.toLowerCase().includes('published')) status = 'published';
    if (filename.toLowerCase().includes('archived')) status = 'archived';

    return {
      type,
      status,
      data: {
        // You can parse more metadata from the document content
        // For example, look for specific markers in the text
      },
    };
  }

  private parseCsvData(csvData: string): Record<string, unknown>[] {
    // Simple CSV parser - you might want to use a more robust library
    const lines = csvData.split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0]?.split(',') || [];
    if (headers.length === 0) return [];

    return lines
      .slice(1)
      .map((line) => {
        if (!line.trim()) return null;
        const values = line.split(',');
        const row: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        return row;
      })
      .filter(
        (row): row is Record<string, unknown> =>
          row !== null && Object.values(row).some((value) => value !== ''),
      );
  }

  private determineSheetType(filename: string): 'classifieds' | 'events' | 'community-stats' {
    const name = filename.toLowerCase();
    if (name.includes('classified')) return 'classifieds';
    if (name.includes('event')) return 'events';
    return 'community-stats';
  }

  private parseIssueFilename(filename: string): {
    title: string;
    date: string;
    pages?: number;
  } {
    // Parse issue information from filename
    // You can enhance this based on your naming conventions
    const name = filename.replace('.pdf', '');

    return {
      title: name,
      date: this.extractDateFromFilename(name),
    };
  }

  private extractDateFromFilename(filename: string): string {
    // Extract date from various filename formats
    const datePatterns = [
      /(\d{4})\.(\d{2})/, // 2025.06
      /(WINTER|SUMMER|SPRING|FALL)\s+(\d{4})/i, // WINTER 2025
      /(\w+)\s+(\d{4})/, // June 2025
    ];

    for (const pattern of datePatterns) {
      const match = filename.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return 'Unknown';
  }

  private async mergeWithLocalIssues(
    googleDriveIssues: IssueWithGoogleDrive[],
  ): Promise<IssueWithGoogleDrive[]> {
    // Load existing local issues
    try {
      const response = await fetch('/src/data/issues.json');
      const localIssues = await response.json();

      // Create a merged list prioritizing Google Drive files
      const merged: IssueWithGoogleDrive[] = [];
      const processedNames = new Set<string>();

      // Add Google Drive issues first
      for (const gdIssue of googleDriveIssues) {
        merged.push(gdIssue);
        processedNames.add(gdIssue.filename);
      }

      // Add local issues that don't exist in Google Drive
      for (const localIssue of localIssues) {
        if (!processedNames.has(localIssue.filename)) {
          const hybridIssue: IssueWithGoogleDrive = {
            ...localIssue,
            localUrl: localIssue.url,
            status: 'local',
            syncStatus: 'synced',
          };
          merged.push(hybridIssue);
        }
      }

      return merged;
    } catch (error) {
      console.warn('Could not load local issues, using Google Drive only:', error);
      return googleDriveIssues;
    }
  }

  // === IMAGE MANAGEMENT ===

  async syncImages(): Promise<GoogleDriveFile[]> {
    if (!this.config) throw new Error('Service not configured');

    try {
      // Search for images in the images folder
      const images = await this.driveService.searchFiles({
        query: `'${this.config.imagesFolderId}' in parents and (mimeType contains 'image/')`,
        fields: 'files(id,name,size,modifiedTime,webViewLink,webContentLink,thumbnailLink)',
      });

      // Cache image metadata
      localStorage.setItem('google-drive-images', JSON.stringify(images));

      return images;
    } catch (error) {
      console.error('Error syncing images:', error);
      throw error;
    }
  }

  // === CANVA INTEGRATION HELPERS ===

  async getCanvaTemplateData(templateId: string): Promise<{
    templateId: string;
    content: unknown;
    lastModified: string | null;
  }> {
    // Get template data that Canva can consume
    // This would integrate with Canva's API to push content

    try {
      const template = await this.driveService.getFile(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Process template for Canva consumption
      return {
        templateId,
        content: template,
        lastModified: template.modifiedTime || null,
      };
    } catch (error) {
      console.error('Error getting Canva template data:', error);
      throw error;
    }
  }

  // === CACHE MANAGEMENT ===

  clearCache(): void {
    localStorage.removeItem('google-docs-content');
    localStorage.removeItem('google-sheets-data');
    localStorage.removeItem('google-drive-issues');
    localStorage.removeItem('google-drive-images');
    localStorage.removeItem('google-drive-sync-status');

    this.syncStatus = {
      lastSync: '',
      contentEtags: {},
      fileEtags: {},
      errors: [],
      syncInProgress: false,
    };
  }

  getSyncStatus(): ContentSyncStatus {
    return { ...this.syncStatus };
  }

  isContentStale(maxAgeMinutes: number = 30): boolean {
    if (!this.syncStatus.lastSync) return true;

    const lastSync = new Date(this.syncStatus.lastSync);
    const now = new Date();
    const ageMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);

    return ageMinutes > maxAgeMinutes;
  }
}

export const googleDriveContentService = GoogleDriveContentService.getInstance();
