/**
 * Simplified PDF Processing Service
 * Firebase-first approach for MVP
 */

import { firestoreService } from './firebase-firestore.service';
import { dateManagementService } from './date-management.service';
import type { NewsletterMetadata } from './firebase-firestore.service';
import { logger } from '../utils/logger';

export interface PdfProcessingResult {
  filename: string;
  success: boolean;
  firebaseId?: string;
  error?: string;
  metadata?: NewsletterMetadata;
}

export interface PdfProcessingProgress {
  total: number;
  processed: number;
  current: string;
  results: PdfProcessingResult[];
}

class PdfProcessingService {
  /**
   * Process a single local PDF and upload metadata to Firebase
   * Simplified version that works with existing APIs
   */
  async processPdfToFirebase(
    filename: string,
    userId: string,
    options: {
      forceReprocess?: boolean;
      isPublished?: boolean;
      featured?: boolean;
    } = {},
  ): Promise<PdfProcessingResult> {
    try {
      logger.info(`Processing PDF: ${filename}`);

      // Parse date information
      const dateInfo = dateManagementService.parseFilenameDate(filename);
      if (!dateInfo) {
        throw new Error(`Failed to parse date from filename: ${filename}`);
      }

      // Create Firebase metadata with minimal required fields
      const firebaseMetadata: Omit<NewsletterMetadata, 'id'> = {
        filename,
        title: `Conashaugh Courier - ${dateInfo.displayDate}`,
        description: `Newsletter from ${dateInfo.displayDate}`,
        publicationDate: dateInfo.publicationDate,
        year: dateInfo.year,
        ...(dateInfo.month && { month: dateInfo.month }),
        ...(dateInfo.season && { season: dateInfo.season }),
        displayDate: dateInfo.displayDate,
        sortValue: dateInfo.sortValue,

        // Default PDF properties - will be updated by separate processing
        pageCount: 0,
        fileSize: 0,

        // Default empty content - will be updated by separate processing
        searchableText: '',
        tags: [],

        // Storage URLs - will be updated when PDFs are uploaded to Firebase Storage
        downloadUrl: `/issues/${filename}`, // Local URL for now
        storageRef: `newsletters/${filename}`,

        // Publication status
        isPublished: options.isPublished || false,
        featured: options.featured || false,

        // System fields
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId,
        updatedBy: userId,

        // Actions
        actions: {
          canView: true,
          canDownload: true,
          canSearch: false, // Will be updated when text is extracted
          hasThumbnail: false, // Will be updated when thumbnail is generated
        },
      };

      // Save to Firebase
      const firebaseId = await firestoreService.saveNewsletterMetadata(firebaseMetadata);

      logger.info(`Successfully processed ${filename} to Firebase with ID: ${firebaseId}`);

      return {
        filename,
        success: true,
        firebaseId,
        metadata: { ...firebaseMetadata, id: firebaseId },
      };
    } catch (error) {
      logger.error(`Failed to process ${filename}:`, error);
      return {
        filename,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process multiple PDFs in batch
   */
  async processBatchToFirebase(
    filenames: string[],
    userId: string,
    options: {
      forceReprocess?: boolean;
      onProgress?: (progress: PdfProcessingProgress) => void;
    } = {},
  ): Promise<PdfProcessingResult[]> {
    const results: PdfProcessingResult[] = [];
    const total = filenames.length;

    logger.info(`Starting batch processing of ${total} PDFs`);

    for (let i = 0; i < filenames.length; i++) {
      const filename = filenames[i];

      if (!filename) {
        continue; // Skip undefined filenames
      }

      // Report progress
      if (options.onProgress) {
        options.onProgress({
          total,
          processed: i,
          current: filename,
          results: [...results],
        });
      }

      // Process individual PDF
      const result = await this.processPdfToFirebase(filename, userId, {
        ...(options.forceReprocess !== undefined && { forceReprocess: options.forceReprocess }),
      });

      results.push(result);

      // Add small delay to prevent overwhelming Firebase
      if (i < filenames.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Final progress report
    if (options.onProgress) {
      options.onProgress({
        total,
        processed: total,
        current: '',
        results,
      });
    }

    const successCount = results.filter((r) => r.success).length;
    logger.info(`Batch processing complete: ${successCount}/${total} successful`);

    return results;
  }

  /**
   * Update existing Firebase newsletter metadata
   */
  async updateNewsletterMetadata(
    newsletterId: string,
    updates: Partial<NewsletterMetadata>,
    userId: string,
  ): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      };

      await firestoreService.updateNewsletterMetadata(newsletterId, updateData);
      logger.info(`Updated newsletter metadata for ID: ${newsletterId}`);
    } catch (error) {
      logger.error(`Failed to update newsletter ${newsletterId}:`, error);
      throw error;
    }
  }

  /**
   * Delete newsletter from Firebase
   */
  async deleteNewsletter(newsletterId: string): Promise<void> {
    try {
      await firestoreService.deleteNewsletterMetadata(newsletterId);
      logger.info(`Deleted newsletter: ${newsletterId}`);
    } catch (error) {
      logger.error(`Failed to delete newsletter ${newsletterId}:`, error);
      throw error;
    }
  }

  /**
   * Get all newsletters from Firebase
   */
  async getAllNewsletters(): Promise<NewsletterMetadata[]> {
    try {
      return await firestoreService.getAllNewsletterMetadata();
    } catch (error) {
      logger.error('Failed to get newsletters from Firebase:', error);
      throw error;
    }
  }

  /**
   * Get all newsletters for admin (including unpublished)
   */
  async getAllNewslettersForAdmin(): Promise<NewsletterMetadata[]> {
    try {
      return await firestoreService.getAllNewslettersForAdmin();
    } catch (error) {
      logger.error('Failed to get admin newsletters from Firebase:', error);
      throw error;
    }
  }

  /**
   * Extract keywords from text content
   */
  private extractKeywords(text: string): string[] {
    if (!text) return [];

    // Simple keyword extraction
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .filter((word) => !this.isStopWord(word));

    // Get word frequency
    const frequency: Record<string, number> = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Return top keywords
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the',
      'and',
      'for',
      'are',
      'but',
      'not',
      'you',
      'all',
      'can',
      'had',
      'her',
      'was',
      'one',
      'our',
      'out',
      'day',
      'get',
      'has',
      'him',
      'his',
      'how',
      'man',
      'new',
      'now',
      'old',
      'see',
      'two',
      'way',
      'who',
      'boy',
      'did',
      'its',
      'let',
      'put',
      'say',
      'she',
      'too',
      'use',
      'that',
      'with',
      'have',
      'this',
      'will',
      'your',
      'from',
      'they',
      'know',
      'want',
      'been',
      'good',
      'much',
      'some',
      'time',
      'very',
      'when',
      'come',
      'here',
      'just',
      'like',
      'long',
      'make',
      'many',
      'over',
      'such',
      'take',
      'than',
      'them',
      'well',
      'were',
    ]);
    return stopWords.has(word);
  }
}

export const pdfProcessingService = new PdfProcessingService();
