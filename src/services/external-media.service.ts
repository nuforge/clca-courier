/**
 * External Media Service
 * Handles validation and processing of external image URLs and media
 */

import { logger } from '../utils/logger';
import type { ContentAttachment } from '../types/core/content.types';

/**
 * Validation result for external media
 */
interface MediaValidationResult {
  isValid: boolean;
  url: string;
  type: 'image' | 'video' | 'unknown';
  provider?: 'imgur' | 'flickr' | 'dropbox' | 'google_drive' | 'google_photos' | 'instagram' | 'facebook' | 'generic';
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Image proxy configuration for external images
 */
interface ImageProxyConfig {
  enabled: boolean;
  proxyUrl: string;
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

class ExternalMediaService {
  private readonly imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  private readonly videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv'];

  private readonly proxyConfig: ImageProxyConfig = {
    enabled: false, // Disabled for cost efficiency
    proxyUrl: '',
    maxWidth: 800,
    maxHeight: 600,
    quality: 85,
  };

  /**
   * Validate external media URL
   */
  async validateMediaUrl(url: string): Promise<MediaValidationResult> {
    try {
      if (!url || !this.isValidUrl(url)) {
        return {
          isValid: false,
          url,
          type: 'unknown',
          error: 'Invalid URL format',
        };
      }

      const normalizedUrl = this.normalizeUrl(url);
      const provider = this.detectProvider(normalizedUrl);
      const type = this.detectMediaType(normalizedUrl);

      // For Google Photos and Drive, convert to direct link if possible
      const processedUrl = this.processProviderUrl(normalizedUrl, provider);

      // Test if URL is accessible (basic check)
      const isAccessible = await this.testUrlAccessibility(processedUrl);

      if (!isAccessible) {
        return {
          isValid: false,
          url: processedUrl,
          type,
          ...(provider && { provider }),
          error: 'URL is not publicly accessible',
        };
      }

      return {
        isValid: true,
        url: processedUrl,
        type,
        ...(provider && { provider }),
      };
    } catch (error) {
      logger.error('Media validation failed', { url, error });
      return {
        isValid: false,
        url,
        type: 'unknown',
        error: 'Validation failed',
      };
    }
  }

  /**
   * Create content attachment from external URL
   */
  async createAttachmentFromUrl(
    url: string,
    caption?: string,
    alt?: string,
  ): Promise<ContentAttachment | null> {
    try {
      const validation = await this.validateMediaUrl(url);

      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid media URL');
      }

      const attachment: ContentAttachment = {
        id: `external_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: validation.type === 'image' ? 'external_image' : 'external_video',
        externalUrl: validation.url,
        ...(validation.provider && { hostingProvider: validation.provider }),
        ...(caption && { caption }),
        ...(alt && { alt }),
        isUserHosted: true,
      };

      return attachment;
    } catch (error) {
      logger.error('Failed to create attachment from URL', { url, error });
      return null;
    }
  }

  /**
   * Batch validate multiple URLs
   */
  async validateMultipleUrls(urls: string[]): Promise<MediaValidationResult[]> {
    const promises = urls.map((url) => this.validateMediaUrl(url));
    return Promise.all(promises);
  }

  /**
   * Get suggestions for improving external URLs
   */
  getUrlSuggestions(url: string): string[] {
    const suggestions: string[] = [];

    if (url.includes('drive.google.com')) {
      suggestions.push('Make sure the Google Drive file is set to "Anyone with the link can view"');
      suggestions.push('Try using the direct download link format');
    }

    if (url.includes('photos.google.com')) {
      suggestions.push('Use the direct image link from Google Photos');
      suggestions.push('Ensure the photo album is publicly shared');
    }

    if (url.includes('facebook.com') || url.includes('instagram.com')) {
      suggestions.push('Social media links may not work reliably for embedding');
      suggestions.push('Consider uploading to Google Photos or Google Drive instead');
    }

    if (!url.includes('http')) {
      suggestions.push('URL must start with http:// or https://');
    }

    return suggestions;
  }

  /**
   * Check if URL format is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalize URL (handle redirects, clean parameters)
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);

      // Handle Google Drive sharing URLs
      if (urlObj.hostname.includes('drive.google.com') && url.includes('/file/d/')) {
        const fileId = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)?.[1];
        if (fileId) {
          return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
      }

      // Handle Google Photos URLs
      if (urlObj.hostname.includes('photos.google.com')) {
        // Keep original for now - Google Photos embedding is complex
        return url;
      }

      // Remove tracking parameters
      const cleanParams = new URLSearchParams();
      urlObj.searchParams.forEach((value, key) => {
        if (!key.startsWith('utm_') && !key.startsWith('fb') && key !== 'ref') {
          cleanParams.set(key, value);
        }
      });

      urlObj.search = cleanParams.toString();
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Detect hosting provider from URL
   */
  private detectProvider(url: string): ContentAttachment['hostingProvider'] {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('drive.google.com') || hostname.includes('dropbox.com')) return 'dropbox';
    if (hostname.includes('imgur.com')) return 'imgur';
    if (hostname.includes('flickr.com')) return 'flickr';
    if (hostname.includes('drive.google.com')) return 'google_drive';

    return 'generic';
  }

  /**
   * Detect media type from URL
   */
  private detectMediaType(url: string): 'image' | 'video' | 'unknown' {
    const pathname = new URL(url).pathname.toLowerCase();

    if (this.imageExtensions.some((ext) => pathname.includes(ext))) {
      return 'image';
    }

    if (this.videoExtensions.some((ext) => pathname.includes(ext))) {
      return 'video';
    }

    return 'unknown';
  }

  /**
   * Process provider-specific URLs
   */
  private processProviderUrl(url: string, provider?: ContentAttachment['hostingProvider']): string {
    switch (provider) {
      case 'google_drive':
        // Already normalized in normalizeUrl
        return url;

      case 'imgur':
      case 'flickr':
      case 'dropbox':
        // Return URL as-is for these providers
        return url;

      default:
        return url;
    }
  }

  /**
   * Test if URL is publicly accessible
   */
  private async testUrlAccessibility(url: string): Promise<boolean> {
    try {
      // Use HEAD request to check if URL exists without downloading content
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors', // Allow cross-origin requests
      });

      // For no-cors mode, we can't check status, so assume it's accessible
      // if the request doesn't fail
      return true;
    } catch {
      // If HEAD fails, try a simple GET with very short timeout
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000); // 3 second timeout

        await fetch(url, {
          method: 'GET',
          mode: 'no-cors',
          signal: controller.signal,
        });

        return true;
      } catch {
        logger.warn('URL accessibility test failed', { url });
        return false;
      }
    }
  }

  /**
   * Generate thumbnail URL (placeholder for now)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generateThumbnailUrl(url: string): string | undefined {
    // For now, return undefined - thumbnails could be generated
    // with a service like Cloudinary or similar, but we're keeping costs low
    return undefined;
  }

  /**
   * Get optimal image URL for display
   */
  getOptimalImageUrl(attachment: ContentAttachment, maxWidth?: number, maxHeight?: number): string {
    if (!attachment.externalUrl) {
      return '';
    }

    // If proxy is enabled, use it for optimization
    if (this.proxyConfig.enabled && attachment.type === 'external_image') {
      const params = new URLSearchParams({
        url: attachment.externalUrl,
        w: String(maxWidth || this.proxyConfig.maxWidth),
        h: String(maxHeight || this.proxyConfig.maxHeight),
        q: String(this.proxyConfig.quality),
      });

      return `${this.proxyConfig.proxyUrl}?${params.toString()}`;
    }

    // Return original URL
    return attachment.externalUrl;
  }

  /**
   * Get hosting instructions for users
   */
  getHostingInstructions(): Record<string, string[]> {
    return {
      google_photos: [
        '1. Upload your photos to Google Photos',
        '2. Create a shared album or make individual photos public',
        '3. Right-click the photo and select "Copy image address"',
        '4. Paste the URL here',
      ],
      google_drive: [
        '1. Upload your image to Google Drive',
        '2. Right-click the file and select "Get link"',
        '3. Change permissions to "Anyone with the link can view"',
        '4. Paste the sharing URL here',
      ],
      general: [
        '1. Upload your image to any public hosting service',
        '2. Make sure the image is publicly accessible',
        '3. Copy the direct image URL',
        '4. Test the URL in a new browser tab to ensure it works',
      ],
    };
  }
}

export const externalMediaService = new ExternalMediaService();
