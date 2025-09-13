/**
 * Batch Import Service
 * Handles importing batch processing data into the content management system
 */

import { logger } from '../utils/logger';
import { firebaseContentService } from './firebase-content.service';
import { 
  BatchContentTransformer, 
  type BatchProcessingItem, 
  type ExtractedArticle 
} from '../utils/batch-content-transformer';
import type { ContentDoc, ContentFeatures } from '../types/core/content.types';
import { getAuth } from 'firebase/auth';

export interface ImportOptions {
  /** Whether to import individual articles or just the newsletter */
  importArticles: boolean;
  /** Whether to import the newsletter as a single content item */
  importNewsletter: boolean;
  /** Author ID to use for imported content */
  authorId?: string;
  /** Author name to use for imported content */
  authorName?: string;
  /** Additional features to add to content */
  features?: Partial<ContentFeatures>;
  /** Whether to skip existing content (based on title matching) */
  skipExisting?: boolean;
}

export interface ImportResult {
  /** Number of articles imported */
  articlesImported: number;
  /** Number of newsletters imported */
  newslettersImported: number;
  /** List of created content IDs */
  createdContentIds: string[];
  /** List of errors encountered */
  errors: string[];
  /** Processing time in milliseconds */
  processingTime: number;
}

export class BatchImportService {
  /**
   * Import batch processing data from JSON file
   */
  static async importFromJson(
    jsonData: BatchProcessingItem[],
    options: ImportOptions = { importArticles: true, importNewsletter: false }
  ): Promise<ImportResult> {
    const startTime = Date.now();
    const result: ImportResult = {
      articlesImported: 0,
      newslettersImported: 0,
      createdContentIds: [],
      errors: [],
      processingTime: 0
    };

    try {
      logger.info('Starting batch import', { 
        itemCount: jsonData.length, 
        options 
      });

      // Get current user for author information
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser && !options.authorId) {
        throw new Error('User must be authenticated or authorId must be provided');
      }

      const authorId = options.authorId || currentUser!.uid;
      const authorName = options.authorName || currentUser?.displayName || 'System Import';

      // Process each batch item
      for (const batchItem of jsonData) {
        try {
          await this.processBatchItem(batchItem, {
            ...options,
            authorId,
            authorName
          }, result);
        } catch (error) {
          const errorMessage = `Failed to process ${batchItem.file_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          logger.error(errorMessage, { batchItem: batchItem.file_name });
          result.errors.push(errorMessage);
        }
      }

      result.processingTime = Date.now() - startTime;
      
      logger.info('Batch import completed', {
        articlesImported: result.articlesImported,
        newslettersImported: result.newslettersImported,
        totalErrors: result.errors.length,
        processingTime: result.processingTime
      });

      return result;
    } catch (error) {
      result.processingTime = Date.now() - startTime;
      const errorMessage = `Batch import failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage);
      result.errors.push(errorMessage);
      return result;
    }
  }

  /**
   * Process a single batch item
   */
  private static async processBatchItem(
    batchItem: BatchProcessingItem,
    options: Required<ImportOptions>,
    result: ImportResult
  ): Promise<void> {
    logger.debug('Processing batch item', { 
      filename: batchItem.file_name,
      hasStructure: !!batchItem.structure?.sections?.length
    });

    // Import newsletter as single content item if requested
    if (options.importNewsletter) {
      const newsletterContent = BatchContentTransformer.transformNewsletterToContentDoc(
        batchItem,
        options.authorId,
        options.authorName,
        options.features
      );

      // Check if content already exists
      if (options.skipExisting) {
        const existing = await this.findExistingContent(newsletterContent.title);
        if (existing) {
          logger.debug('Skipping existing newsletter', { title: newsletterContent.title });
          return;
        }
      }

      const contentId = await firebaseContentService.createContent(newsletterContent);
      result.createdContentIds.push(contentId);
      result.newslettersImported++;
      
      logger.debug('Newsletter imported', { 
        contentId, 
        title: newsletterContent.title 
      });
    }

    // Import individual articles if requested
    if (options.importArticles && batchItem.structure?.sections) {
      const articles = BatchContentTransformer.extractArticles(batchItem);
      
      logger.debug('Extracted articles', { 
        count: articles.length,
        titles: articles.map(a => a.title)
      });

      for (const article of articles) {
        try {
          // Skip very short articles
          if (article.content.length < 100) {
            logger.debug('Skipping short article', { 
              title: article.title, 
              length: article.content.length 
            });
            continue;
          }

          // Check if content already exists
          if (options.skipExisting) {
            const existing = await this.findExistingContent(article.title);
            if (existing) {
              logger.debug('Skipping existing article', { title: article.title });
              continue;
            }
          }

          const contentDoc = BatchContentTransformer.transformToContentDoc(
            article,
            batchItem,
            options.authorId,
            options.authorName,
            options.features
          );

          const contentId = await firebaseContentService.createContent(contentDoc);
          result.createdContentIds.push(contentId);
          result.articlesImported++;
          
          logger.debug('Article imported', { 
            contentId, 
            title: article.title 
          });
        } catch (error) {
          const errorMessage = `Failed to import article "${article.title}": ${error instanceof Error ? error.message : 'Unknown error'}`;
          logger.error(errorMessage);
          result.errors.push(errorMessage);
        }
      }
    }
  }

  /**
   * Find existing content by title
   */
  private static async findExistingContent(title: string): Promise<ContentDoc | null> {
    try {
      const allContent = await firebaseContentService.getPublishedContent();
      return allContent.find(content => 
        content.title.toLowerCase().trim() === title.toLowerCase().trim()
      ) || null;
    } catch (error) {
      logger.warn('Failed to check for existing content', { 
        title, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return null;
    }
  }

  /**
   * Import from file (for use in admin interface)
   */
  static async importFromFile(
    file: File,
    options: ImportOptions = { importArticles: true, importNewsletter: false }
  ): Promise<ImportResult> {
    try {
      const text = await file.text();
      const jsonData: BatchProcessingItem[] = JSON.parse(text);
      
      return await this.importFromJson(jsonData, options);
    } catch (error) {
      const errorMessage = `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage);
      return {
        articlesImported: 0,
        newslettersImported: 0,
        createdContentIds: [],
        errors: [errorMessage],
        processingTime: 0
      };
    }
  }

  /**
   * Get import preview (shows what would be imported without actually importing)
   */
  static async getImportPreview(jsonData: BatchProcessingItem[]): Promise<{
    totalItems: number;
    articlesFound: number;
    newslettersFound: number;
    estimatedProcessingTime: number;
    sampleArticles: Array<{ title: string; contentLength: number; tags: string[] }>;
  }> {
    let articlesFound = 0;
    let newslettersFound = 0;
    const sampleArticles: Array<{ title: string; contentLength: number; tags: string[] }> = [];

    for (const batchItem of jsonData) {
      newslettersFound++;
      
      if (batchItem.structure?.sections) {
        const articles = BatchContentTransformer.extractArticles(batchItem);
        articlesFound += articles.length;
        
        // Add first few articles as samples
        if (sampleArticles.length < 5) {
          for (const article of articles.slice(0, 2)) {
            if (article.content.length >= 100) {
              sampleArticles.push({
                title: article.title,
                contentLength: article.content.length,
                tags: article.tags
              });
            }
          }
        }
      }
    }

    return {
      totalItems: jsonData.length,
      articlesFound,
      newslettersFound,
      estimatedProcessingTime: articlesFound * 100 + newslettersFound * 50, // Rough estimate
      sampleArticles
    };
  }
}
