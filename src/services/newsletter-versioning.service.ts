/**
 * Newsletter Versioning Service
 * Domain-specific service for newsletter versioning operations
 * Provides type-safe wrapper around the generic content versioning service
 */

import { ContentVersioningService } from './core/content-versioning.service';
import { logger } from '../utils/logger';
import type { NewsletterDocument, NewsletterHistory } from '../types/core/newsletter.types';
import type { VersioningOptions, VersioningConfig } from '../types/core/versioning.types';

/**
 * Newsletter-specific versioning service
 * Typed wrapper around generic content versioning service
 */
export class NewsletterVersioningService {
  private core: ContentVersioningService;
  private readonly COLLECTION = 'newsletters';

  constructor(config?: VersioningConfig) {
    this.core = new ContentVersioningService(config);
  }

  /**
   * Update newsletter with versioning
   * Type-safe wrapper for newsletter updates
   */
  async updateNewsletterWithVersioning(
    id: string,
    updates: Partial<NewsletterDocument>,
    options: VersioningOptions,
  ): Promise<void> {
    try {
      await this.core.updateWithVersioning<NewsletterDocument>(
        this.COLLECTION,
        id,
        updates,
        options,
      );

      logger.info(`Newsletter versioning: Updated newsletter ${id} to new version`);
    } catch (error) {
      logger.error('Newsletter versioning update failed:', error);
      throw error;
    }
  }

  /**
   * Get newsletter history
   * Returns typed newsletter history entries
   */
  async getNewsletterHistory(id: string, limit: number = 50): Promise<NewsletterHistory[]> {
    try {
      const history = await this.core.getHistory<NewsletterDocument>(this.COLLECTION, id, limit);

      // Type assertion is safe because we know this is newsletter history
      return history as NewsletterHistory[];
    } catch (error) {
      logger.error('Failed to get newsletter history:', error);
      throw error;
    }
  }

  /**
   * Restore newsletter to specific version
   * Type-safe wrapper for newsletter version restoration
   */
  async restoreNewsletterVersion(
    id: string,
    version: number,
    userId: string,
    comment: string = '',
  ): Promise<NewsletterDocument> {
    try {
      const restoredNewsletter = await this.core.restoreVersion<NewsletterDocument>(
        this.COLLECTION,
        id,
        version,
        userId,
        comment,
      );

      logger.info(`Newsletter versioning: Restored newsletter ${id} to version ${version}`);
      return restoredNewsletter;
    } catch (error) {
      logger.error('Newsletter version restoration failed:', error);
      throw error;
    }
  }

  /**
   * Get newsletter version count
   * Returns the number of versions for a newsletter
   */
  async getNewsletterVersionCount(id: string): Promise<number> {
    try {
      const history = await this.getNewsletterHistory(id, 1000); // Get all versions
      return history.length;
    } catch (error) {
      logger.error('Failed to get newsletter version count:', error);
      return 0;
    }
  }

  /**
   * Check if newsletter has versioning enabled
   * Returns true if the newsletter has versioning information
   */
  async hasVersioning(id: string): Promise<boolean> {
    try {
      const history = await this.getNewsletterHistory(id, 1);
      return history.length > 0;
    } catch (error) {
      logger.error('Failed to check newsletter versioning status:', error);
      return false;
    }
  }
}

/**
 * Singleton instance for reuse
 */
export const newsletterVersioningService = new NewsletterVersioningService();
