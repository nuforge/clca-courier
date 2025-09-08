/**
 * PDF Extraction Firebase Integration Service
 * Connects advanced PDF text extraction to Firebase storage
 */

import { firestoreService, type NewsletterMetadata } from './firebase-firestore.service';
import {
  advancedPdfTextExtractionService,
  type AdvancedPdfExtraction,
} from './advanced-pdf-text-extraction-service';
import { logger } from '../utils/logger';

export interface PdfExtractionResult {
  success: boolean;
  filename: string;
  extractedData?: AdvancedPdfExtraction;
  error?: string;
  firestoreUpdated: boolean;
}

export class PdfExtractionFirebaseIntegration {
  /**
   * Extract PDF text and store in Firebase
   */
  async extractAndStoreInFirebase(
    pdfUrl: string,
    filename: string,
    existingMetadata?: NewsletterMetadata,
  ): Promise<PdfExtractionResult> {
    try {
      logger.info(`[PDF→Firebase] Starting extraction for ${filename}`);

      // Extract PDF text using the advanced service
      const extractedData = await advancedPdfTextExtractionService.extractAdvancedPdfData(
        pdfUrl,
        filename,
        {
          extractText: true,
          extractArticles: true,
          extractTopics: true,
          extractImages: false, // Skip images for now to speed up processing
        },
      );

      // Prepare Firebase metadata update
      const updateData: Record<string, unknown> = {
        // Use searchableText field that exists in NewsletterMetadata
        searchableText: extractedData.cleanedText,

        // Store additional extracted data in a structured way
        extractionData: {
          rawText: extractedData.rawText,
          searchableTerms: extractedData.searchableTerms,
          keyPhrases: extractedData.keyPhrases,
          topics: extractedData.topics,
          articles: extractedData.articles.map(
            (article: {
              title: string;
              content: string;
              wordCount: number;
              significance?: number;
              type?: string;
            }) => ({
              title: article.title,
              content: article.content,
              wordCount: article.wordCount,
              significance: article.significance || 0,
              type: article.type || 'article',
            }),
          ),
          totalWords: extractedData.totalWords,
          totalCharacters: extractedData.totalCharacters,
          readingTimeMinutes: extractedData.readingTimeMinutes,
          processingTimeMs: extractedData.processingTimeMs,
          extractedAt: new Date().toISOString(),
          extractionVersion: extractedData.extractionVersion,
        },

        // Update actions to indicate text is available
        'actions.canSearch': true,

        // Update timestamp
        updatedAt: new Date().toISOString(),
      };

      // Update Firebase with extracted data
      if (existingMetadata?.id) {
        await firestoreService.updateNewsletterMetadata(existingMetadata.id, updateData);
        logger.info(
          `[PDF→Firebase] Updated existing record ${existingMetadata.id} for ${filename}`,
        );
      } else {
        logger.warn(`[PDF→Firebase] No existing metadata found for ${filename}, skipping update`);
      }

      return {
        success: true,
        filename,
        extractedData,
        firestoreUpdated: true,
      };
    } catch (error) {
      logger.error(`[PDF→Firebase] Failed to extract/store ${filename}:`, error);
      return {
        success: false,
        filename,
        error: error instanceof Error ? error.message : 'Unknown error',
        firestoreUpdated: false,
      };
    }
  }

  /**
   * Batch process multiple PDFs for text extraction
   */
  async batchExtractAndStore(
    pdfs: Array<{ url: string; filename: string; metadata?: NewsletterMetadata }>,
  ): Promise<PdfExtractionResult[]> {
    const results: PdfExtractionResult[] = [];

    logger.info(`[PDF→Firebase] Starting batch extraction for ${pdfs.length} PDFs`);

    for (const pdf of pdfs) {
      const result = await this.extractAndStoreInFirebase(pdf.url, pdf.filename, pdf.metadata);
      results.push(result);

      // Add small delay to prevent overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const successful = results.filter((r) => r.success).length;
    logger.info(`[PDF→Firebase] Batch complete: ${successful}/${pdfs.length} successful`);

    return results;
  }

  /**
   * Check if PDF needs text extraction
   */
  needsTextExtraction(metadata: NewsletterMetadata): boolean {
    return (
      !metadata.searchableText ||
      !metadata.actions.canSearch ||
      (typeof metadata.searchableText === 'string' && metadata.searchableText.length < 100)
    );
  }

  /**
   * Get extraction progress for UI
   */
  getExtractionProgress(results: PdfExtractionResult[]): {
    total: number;
    completed: number;
    successful: number;
    failed: number;
    percentage: number;
  } {
    const total = results.length;
    const completed = results.filter((r) => r.success || r.error).length;
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => r.error).length;

    return {
      total,
      completed,
      successful,
      failed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}

export const pdfExtractionFirebaseIntegration = new PdfExtractionFirebaseIntegration();
