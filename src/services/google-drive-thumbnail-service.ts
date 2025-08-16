// src/services/google-drive-thumbnail-service.ts
// Enhanced Google Drive thumbnail service based on DeepSeek recommendations
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - pdf-lib has built-in types but may have import issues in some environments
import { PDFDocument } from 'pdf-lib';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

export interface FileMetadata {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded: string;
  tags: string[];
  thumbnail?: string;
  mimeType?: string;
  webViewLink?: string;
  webContentLink?: string;
}

export class GoogleDriveThumbnailService {
  private static instance: GoogleDriveThumbnailService;
  private thumbnailCache = new Map<string, string>();

  private constructor() {}

  static getInstance(): GoogleDriveThumbnailService {
    if (!GoogleDriveThumbnailService.instance) {
      GoogleDriveThumbnailService.instance = new GoogleDriveThumbnailService();
    }
    return GoogleDriveThumbnailService.instance;
  }

  /**
   * Generate Google Drive thumbnail using authenticated API
   * Avoids CORS and COEP issues by using proper authentication
   */
  async generateAuthenticatedDriveThumbnail(
    fileId: string,
    accessToken: string,
    size: number = 300,
  ): Promise<string> {
    try {
      // Use Google Drive API to get file metadata with thumbnail link
      const metadataResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=thumbnailLink,mimeType`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();

        if (metadata.thumbnailLink) {
          // Try to fetch the thumbnail using the authenticated link
          // Use the size parameter to request appropriate thumbnail size
          const sizedThumbnailUrl = metadata.thumbnailLink.replace(/=s\d+/, `=s${size}`);
          const thumbnailResponse = await fetch(sizedThumbnailUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (thumbnailResponse.ok) {
            const blob = await thumbnailResponse.blob();
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        }
      }
    } catch (error) {
      console.warn('Failed to generate authenticated thumbnail:', error);
    }

    // Fallback to default thumbnail
    return this.generateDefaultThumbnail('pdf');
  }

  /**
   * Generate Google Drive thumbnail URL without CORS issues
   * Uses Google's thumbnail service directly
   * NOTE: This method is deprecated - use generateAuthenticatedDriveThumbnail instead
   */
  generateDriveThumbnail(fileId: string, size: number = 300): string {
    // Return a default thumbnail instead of the blocked URL
    // Could use fileId and size for logging or future implementation
    console.log(`Deprecated method called for fileId: ${fileId}, size: ${size}`);
    return this.generateDefaultThumbnail('pdf');
  }

  /**
   * Generate PDF thumbnail client-side using PDF-Lib
   * This avoids CORS and server processing issues
   */
  async generatePdfThumbnail(
    pdfData: ArrayBuffer,
    options: ThumbnailOptions = {},
  ): Promise<string> {
    try {
      const { width = 300, height = 400, format = 'jpeg', quality = 0.8 } = options;

      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfData);
      const pages = pdfDoc.getPages();

      if (pages.length === 0) {
        throw new Error('PDF has no pages');
      }

      const firstPage = pages[0];
      if (!firstPage) {
        throw new Error('First page is undefined');
      }
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();

      // Calculate scaling to fit within desired dimensions
      const scale = Math.min(width / pageWidth, height / pageHeight);
      const scaledWidth = pageWidth * scale;
      const scaledHeight = pageHeight * scale;

      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // For now, we'll create a placeholder thumbnail
      // In a full implementation, you'd use PDF.js or similar for actual rendering
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, scaledWidth, scaledHeight);

      ctx.fillStyle = '#666';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PDF', scaledWidth / 2, scaledHeight / 2);

      ctx.strokeStyle = '#ddd';
      ctx.strokeRect(0, 0, scaledWidth, scaledHeight);

      // Convert to data URL
      return canvas.toDataURL(`image/${format}`, format === 'jpeg' ? quality : undefined);
    } catch (error) {
      console.error('Error generating PDF thumbnail:', error);
      return this.generateDefaultThumbnail('pdf');
    }
  }

  /**
   * Generate default thumbnail for different file types
   */
  generateDefaultThumbnail(fileType: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    // Set background
    ctx.fillStyle = this.getFileTypeColor(fileType);
    ctx.fillRect(0, 0, 300, 400);

    // Add icon
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.getFileTypeIcon(fileType), 150, 200);

    // Add file type label
    ctx.font = '16px Arial';
    ctx.fillText(fileType.toUpperCase(), 150, 250);

    return canvas.toDataURL('image/png');
  }

  /**
   * Get thumbnail for any file type
   * Uses appropriate method based on file type and availability
   */
  async getThumbnail(file: FileMetadata, options: ThumbnailOptions = {}): Promise<string> {
    const cacheKey = `${file.id}-${JSON.stringify(options)}`;

    // Check cache first
    if (this.thumbnailCache.has(cacheKey)) {
      return this.thumbnailCache.get(cacheKey)!;
    }

    let thumbnail: string;

    try {
      // Get access token for authenticated requests
      const accessToken = localStorage.getItem('google_drive_access_token');

      if (file.type === 'pdf') {
        if (accessToken) {
          // Use authenticated API for PDFs
          thumbnail = await this.generateAuthenticatedDriveThumbnail(
            file.id,
            accessToken,
            options.width,
          );
        } else {
          // Generate a simple PDF thumbnail without authentication
          console.info(
            `📄 Generating default PDF thumbnail for ${file.name} - Google Drive authentication not available`,
          );
          thumbnail = this.generateDefaultThumbnail('pdf');
        }
      } else if (this.isImageFile(file.type)) {
        if (accessToken) {
          // Use authenticated API for images
          thumbnail = await this.generateAuthenticatedDriveThumbnail(
            file.id,
            accessToken,
            options.width,
          );
        } else {
          // Fallback to default
          console.info(
            `🖼️ Generating default image thumbnail for ${file.name} - Google Drive authentication not available`,
          );
          thumbnail = this.generateDefaultThumbnail(file.type);
        }
      } else {
        // For other files, generate default thumbnail
        thumbnail = this.generateDefaultThumbnail(file.type);
      }

      // Cache the result
      this.thumbnailCache.set(cacheKey, thumbnail);
      return thumbnail;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return this.generateDefaultThumbnail(file.type);
    }
  }

  /**
   * Preload thumbnails for better performance
   */
  async preloadThumbnails(files: FileMetadata[]): Promise<void> {
    const promises = files.map((file) => this.getThumbnail(file));
    await Promise.allSettled(promises);
  }

  /**
   * Clear thumbnail cache
   */
  clearCache(): void {
    this.thumbnailCache.clear();
  }

  /**
   * Check if Google Drive authentication is available for thumbnail generation
   */
  isAuthenticationAvailable(): boolean {
    return !!localStorage.getItem('google_drive_access_token');
  }

  /**
   * Get authentication status message for user feedback
   */
  getAuthenticationMessage(): string {
    if (this.isAuthenticationAvailable()) {
      return '✅ Connected to Google Drive - High quality thumbnails available';
    } else {
      return '⚠️ Not connected to Google Drive - Using default thumbnails. Sign in for better previews.';
    }
  }

  private getFileTypeColor(fileType: string): string {
    const colors: Record<string, string> = {
      pdf: '#FF6B6B',
      doc: '#4ECDC4',
      docx: '#4ECDC4',
      xls: '#45B7D1',
      xlsx: '#45B7D1',
      ppt: '#FFA07A',
      pptx: '#FFA07A',
      jpg: '#98D8C8',
      jpeg: '#98D8C8',
      png: '#98D8C8',
      gif: '#98D8C8',
      txt: '#95A5A6',
      zip: '#F39C12',
    };
    return colors[fileType] || '#BDC3C7';
  }

  private getFileTypeIcon(fileType: string): string {
    const icons: Record<string, string> = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📺',
      pptx: '📺',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      txt: '📋',
      zip: '📦',
    };
    return icons[fileType] || '📄';
  }

  private isImageFile(fileType: string): boolean {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileType.toLowerCase());
  }
}

export const googleDriveThumbnailService = GoogleDriveThumbnailService.getInstance();
