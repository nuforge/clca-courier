/**
 * Enhanced Thumbnail Service
 * Generates thumbnails and stores them as base64 in Firestore for remote access
 */

import { usePdfThumbnails } from '../composables/usePdfThumbnails';
import { pdfMetadataStorageService } from './pdf-metadata-storage-service';
import { firestoreService } from './firebase-firestore.service';
import type { ContentManagementNewsletter } from '../types';

export class EnhancedThumbnailService {
  private pdfThumbnails = usePdfThumbnails();

  /**
   * Generate thumbnail for immediate UI update (stores locally, queues Firestore sync)
   */
  async generateNewsletterThumbnailForUI(
    newsletter: ContentManagementNewsletter,
  ): Promise<string | null> {
    try {
      console.log('🖼️ Generating thumbnail for UI update:', newsletter.title);

      // Use your existing PDF.js thumbnail generation
      const thumbnailBase64 = await this.pdfThumbnails.getThumbnail(newsletter.downloadUrl);

      if (thumbnailBase64) {
        // 1. Store locally in IndexedDB immediately (for cache and reactive UI)
        await this.storeInLocalCache(newsletter.filename, thumbnailBase64);

        // 2. Mark for Firestore sync later (don't block UI)
        this.queueFirestoreSync(newsletter, thumbnailBase64);

        console.log('✅ Thumbnail generated and ready for UI update:', newsletter.title);
        return thumbnailBase64;
      } else {
        // Generate a simple placeholder thumbnail for testing reactive updates
        console.log(
          '⚠️ PDF thumbnail generation failed, creating placeholder for:',
          newsletter.title,
        );
        const placeholder = this.generatePlaceholderThumbnail(newsletter.title);

        // Store the placeholder
        await this.storeInLocalCache(newsletter.filename, placeholder);
        this.queueFirestoreSync(newsletter, placeholder);

        console.log('✅ Placeholder thumbnail generated for UI test:', newsletter.title);
        return placeholder;
      }
    } catch (error) {
      console.error('❌ Failed to generate thumbnail for:', newsletter.title, error);

      // Even on error, generate a placeholder for testing
      try {
        const placeholder = this.generatePlaceholderThumbnail(newsletter.title);
        await this.storeInLocalCache(newsletter.filename, placeholder);
        console.log('✅ Error placeholder thumbnail generated:', newsletter.title);
        return placeholder;
      } catch (placeholderError) {
        console.error('❌ Failed to generate placeholder thumbnail:', placeholderError);
        return null;
      }
    }
  }

  /**
   * Regenerate thumbnail (clears cache and generates new one)
   */
  async regenerateNewsletterThumbnailForUI(
    newsletter: ContentManagementNewsletter,
  ): Promise<string | null> {
    try {
      console.log('🔄 Regenerating thumbnail (clearing cache first):', newsletter.title);

      // Use regenerateThumbnail to clear cache and generate new thumbnail
      const thumbnailBase64 = await this.pdfThumbnails.regenerateThumbnail(newsletter.downloadUrl);

      if (thumbnailBase64) {
        // 1. Store locally in IndexedDB immediately (for cache and reactive UI)
        await this.storeInLocalCache(newsletter.filename, thumbnailBase64);

        // 2. Mark for Firestore sync later (don't block UI)
        this.queueFirestoreSync(newsletter, thumbnailBase64);

        console.log('✅ Thumbnail regenerated and ready for UI update:', newsletter.title);
        return thumbnailBase64;
      } else {
        // Generate a simple placeholder thumbnail for testing reactive updates
        console.log(
          '⚠️ PDF thumbnail regeneration failed, creating placeholder for:',
          newsletter.title,
        );
        const placeholder = this.generatePlaceholderThumbnail(newsletter.title);

        // Store the placeholder
        await this.storeInLocalCache(newsletter.filename, placeholder);
        this.queueFirestoreSync(newsletter, placeholder);

        console.log('✅ Placeholder thumbnail generated for UI test:', newsletter.title);
        return placeholder;
      }
    } catch (error) {
      console.error('❌ Failed to regenerate thumbnail for:', newsletter.title, error);

      // Even on error, generate a placeholder for testing
      try {
        const placeholder = this.generatePlaceholderThumbnail(newsletter.title);
        await this.storeInLocalCache(newsletter.filename, placeholder);
        console.log('✅ Error placeholder thumbnail generated:', newsletter.title);
        return placeholder;
      } catch (placeholderError) {
        console.error('❌ Failed to generate placeholder thumbnail:', placeholderError);
        return null;
      }
    }
  }

  /**
   * Generate a simple colored placeholder thumbnail for testing
   */
  private generatePlaceholderThumbnail(title: string): string {
    // Create a simple colored canvas as placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Generate a color based on title hash
      const hash = title.split('').reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);

      const hue = Math.abs(hash) % 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 80%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add border
      ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Add text
      ctx.fillStyle = `hsl(${hue}, 70%, 30%)`;
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PDF', canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillText('Thumbnail', canvas.width / 2, canvas.height / 2 + 10);

      return canvas.toDataURL('image/png');
    }

    // Fallback: simple base64 placeholder
    return (
      'data:image/svg+xml;base64,' +
      btoa(`
      <svg width="150" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="150" height="200" fill="#e0e0e0" stroke="#999" stroke-width="2"/>
        <text x="75" y="95" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">PDF</text>
        <text x="75" y="115" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">Thumbnail</text>
      </svg>
    `)
    );
  }

  /**
   * Generate thumbnail and store both locally (cache) and remotely (Firestore)
   */
  async generateNewsletterThumbnail(
    newsletter: ContentManagementNewsletter,
  ): Promise<string | null> {
    try {
      console.log('🖼️ Generating thumbnail for:', newsletter.title);

      // Use your existing PDF.js thumbnail generation
      const thumbnailBase64 = await this.pdfThumbnails.getThumbnail(newsletter.downloadUrl);

      if (thumbnailBase64) {
        // 1. Store locally in IndexedDB for fast access (cache)
        await this.storeInLocalCache(newsletter.filename, thumbnailBase64);

        // 2. Store remotely in Firestore so users can see thumbnails
        await this.storeInFirestore(newsletter, thumbnailBase64);

        console.log(
          '✅ Thumbnail generated, cached locally, and stored in Firestore for:',
          newsletter.title,
        );
        return thumbnailBase64;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to generate thumbnail for:', newsletter.title, error);
      return null;
    }
  }

  /**
   * Queue Firestore sync for later (non-blocking)
   */
  private queueFirestoreSync(
    newsletter: ContentManagementNewsletter,
    thumbnailBase64: string,
  ): void {
    // Use setTimeout to make this async and non-blocking
    setTimeout(() => {
      void (async () => {
        try {
          await this.storeInFirestore(newsletter, thumbnailBase64);
          console.log('📤 Thumbnail synced to Firestore:', newsletter.title);
        } catch (error) {
          console.error('❌ Failed to sync thumbnail to Firestore:', error);
        }
      })();
    }, 100);
  }

  /**
   * Generate thumbnails for multiple newsletters with progress tracking
   */
  async generateBatchThumbnails(
    newsletters: ContentManagementNewsletter[],
    onProgress?: (completed: number, total: number) => void,
  ): Promise<{ [newsletterId: string]: string | null }> {
    const results: { [newsletterId: string]: string | null } = {};
    let completed = 0;

    for (const newsletter of newsletters) {
      results[newsletter.id] = await this.generateNewsletterThumbnail(newsletter);
      completed++;
      onProgress?.(completed, newsletters.length);

      // Small delay to prevent overwhelming the browser
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Check if newsletter has cached thumbnail (local or remote)
   */
  async hasCachedThumbnail(filename: string): Promise<boolean> {
    try {
      // Check local cache first (fastest)
      const localMetadata = await pdfMetadataStorageService.getFullMetadata(filename);
      if (localMetadata?.thumbnailDataUrl) {
        return true;
      }

      // Check Firestore for remote thumbnail
      const allNewsletters = await firestoreService.getAllNewslettersForAdmin();
      const firestoreNewsletter = allNewsletters.find((n) => n.filename === filename);
      return !!firestoreNewsletter?.thumbnailUrl;
    } catch {
      return false;
    }
  }

  /**
   * Get cached thumbnail from local storage or Firestore
   */
  async getCachedThumbnail(newsletter: ContentManagementNewsletter): Promise<string | null> {
    try {
      // Try local cache first (fastest)
      const localMetadata = await pdfMetadataStorageService.getFullMetadata(newsletter.filename);
      if (localMetadata?.thumbnailDataUrl) {
        return localMetadata.thumbnailDataUrl;
      }

      // Try Firestore if not in local cache
      const allNewsletters = await firestoreService.getAllNewslettersForAdmin();
      const firestoreNewsletter = allNewsletters.find((n) => n.filename === newsletter.filename);
      if (firestoreNewsletter?.thumbnailUrl) {
        // Cache it locally for next time
        await this.storeInLocalCache(newsletter.filename, firestoreNewsletter.thumbnailUrl);
        return firestoreNewsletter.thumbnailUrl;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get cached thumbnail:', error);
      return null;
    }
  }

  /**
   * Get cached thumbnail or generate if missing
   */
  async getThumbnailWithFallback(newsletter: ContentManagementNewsletter): Promise<string | null> {
    // First check if we have it cached (local or remote)
    const cachedThumbnail = await this.getCachedThumbnail(newsletter);

    if (cachedThumbnail) {
      console.log('📋 Using cached thumbnail for:', newsletter.title);
      return cachedThumbnail;
    }

    // Generate if missing
    console.log('🔄 Generating missing thumbnail for:', newsletter.title);
    return await this.generateNewsletterThumbnail(newsletter);
  } /**
   * Store thumbnail as base64 in Firestore for remote access by users
   */
  private async storeInFirestore(
    newsletter: ContentManagementNewsletter,
    thumbnailBase64: string,
  ): Promise<void> {
    try {
      // Get all newsletters and find the one with matching filename
      const allNewsletters = await firestoreService.getAllNewslettersForAdmin();
      const existingNewsletter = allNewsletters.find((n) => n.filename === newsletter.filename);

      if (existingNewsletter) {
        // Update existing newsletter with thumbnail
        await firestoreService.updateNewsletterMetadata(existingNewsletter.id, {
          thumbnailUrl: thumbnailBase64, // Store base64 directly in Firestore
          actions: {
            ...existingNewsletter.actions,
            hasThumbnail: true,
          },
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin', // You might want to get actual admin user ID
        });
        console.log('📤 Thumbnail stored in Firestore for:', newsletter.title);
      } else {
        console.log('⚠️ Newsletter not found in Firestore:', newsletter.filename);
        // Optionally create the newsletter metadata if it doesn't exist
      }
    } catch (error) {
      console.error('❌ Failed to store thumbnail in Firestore:', error);
    }
  }

  /**
   * Store thumbnail in local IndexedDB for fast cache access
   */
  private async storeInLocalCache(filename: string, thumbnailBase64: string): Promise<void> {
    try {
      // Get existing metadata or create new
      let metadata = await pdfMetadataStorageService.getFullMetadata(filename);

      if (!metadata) {
        // Create basic metadata entry
        metadata = {
          filename,
          title: filename.replace('.pdf', '').replace(/[-_]/g, ' '),
          pages: 0,
          fileSize: '0',
          hash: Date.now().toString(),
          lastProcessed: Date.now(),
          searchableTerms: [],
          topics: [],
          contentType: 'newsletter' as const,
          thumbnailDataUrl: thumbnailBase64,
        };
      } else {
        // Update existing metadata with thumbnail
        metadata.thumbnailDataUrl = thumbnailBase64;
        metadata.lastProcessed = Date.now();
      }

      await pdfMetadataStorageService.storeMetadata(metadata);
      console.log('💾 Thumbnail cached locally for:', filename);
    } catch (error) {
      console.error('❌ Failed to cache thumbnail locally:', error);
    }
  }

  /**
   * Cleanup old thumbnails to manage storage space
   */
  async cleanupOldThumbnails(): Promise<void> {
    try {
      await pdfMetadataStorageService.clearAllCaches();
      console.log('🧹 Cleaned up old thumbnail caches');
    } catch (error) {
      console.error('❌ Failed to cleanup thumbnails:', error);
    }
  }
}

export const enhancedThumbnailService = new EnhancedThumbnailService();
