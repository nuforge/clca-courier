/**
 * Batch Date Processing Script
 * One-time script to process existing PDFs and update their metadata with proper date information
 */

import { dateManagementService } from '../services/date-management.service';
import { firestoreService } from '../services/firebase-firestore.service';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

interface BatchProcessingResult {
  processed: number;
  updated: number;
  errors: number;
  results: Array<{
    filename: string;
    success: boolean;
    error?: string;
    metadata?: any;
  }>;
}

class BatchDateProcessor {
  private readonly PDF_DIRECTORY = path.join(process.cwd(), 'public', 'issues');

  /**
   * Process all PDFs in the issues directory
   */
  async processAllPdfs(): Promise<BatchProcessingResult> {
    const result: BatchProcessingResult = {
      processed: 0,
      updated: 0,
      errors: 0,
      results: [],
    };

    try {
      // Get all PDF files
      const files = fs
        .readdirSync(this.PDF_DIRECTORY)
        .filter((file) => file.toLowerCase().endsWith('.pdf'))
        .sort(); // Process in alphabetical order

      logger.info(`Found ${files.length} PDF files to process`);

      for (const filename of files) {
        result.processed++;

        try {
          const metadata = await this.processIndividualPdf(filename);

          if (metadata) {
            result.updated++;
            result.results.push({
              filename,
              success: true,
              metadata,
            });

            logger.success(`✅ Processed: ${filename} -> ${metadata.displayDate}`);
          } else {
            result.errors++;
            result.results.push({
              filename,
              success: false,
              error: 'Failed to parse date from filename',
            });

            logger.warn(`⚠️ Could not process: ${filename}`);
          }
        } catch (error) {
          result.errors++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';

          result.results.push({
            filename,
            success: false,
            error: errorMsg,
          });

          logger.error(`❌ Error processing ${filename}:`, error);
        }
      }

      // Log summary
      logger.info('\\n📊 Batch Processing Summary:');
      logger.info(`   Total files: ${result.processed}`);
      logger.info(`   Successfully updated: ${result.updated}`);
      logger.info(`   Errors: ${result.errors}`);

      return result;
    } catch (error) {
      logger.error('❌ Batch processing failed:', error);
      throw error;
    }
  }

  /**
   * Process an individual PDF file
   */
  private async processIndividualPdf(filename: string): Promise<any | null> {
    // Parse the filename to get date information
    const parsedDate = dateManagementService.parseFilenameDate(filename);

    if (!parsedDate) {
      return null;
    }

    // Check if this newsletter already exists in Firestore
    const existingNewsletters = await firestoreService.getAllNewslettersForAdmin();
    const existing = existingNewsletters.find((n) => n.filename === filename);

    // Enhance metadata with date information
    const enhancedMetadata = dateManagementService.enhanceNewsletterMetadata(filename, {
      // Keep existing metadata if it exists
      ...existing,
      // Add/update with parsed date information
      filename,
      year: parsedDate.year,
      month: parsedDate.month,
      season: parsedDate.season,
      publicationDate: parsedDate.publicationDate,
      issueNumber: dateManagementService.generateIssueNumber(parsedDate),
      title: existing?.title || `Conashaugh Lakes Courier - ${parsedDate.displayDate}`,

      // File information (would normally come from file system)
      fileSize: this.getFileSize(filename),

      // Default values if not already set
      description: existing?.description || '',
      tags: existing?.tags || [],
      featured: existing?.featured || false,
      isPublished: existing?.isPublished !== undefined ? existing.isPublished : true,

      // Download URL (would normally be Firebase Storage URL)
      downloadUrl: existing?.downloadUrl || `/issues/${filename}`,
      storageRef: existing?.storageRef || `newsletters/${filename}`,

      // Actions and capabilities
      actions: existing?.actions || {
        canView: true,
        canDownload: true,
        canSearch: false,
        hasThumbnail: false,
      },

      // Audit fields
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: existing?.createdBy || '',
      updatedBy: existing?.updatedBy || '',
    });

    // Save or update in Firestore
    if (existing?.id) {
      // Update existing newsletter
      await firestoreService.updateNewsletterMetadata(existing.id, enhancedMetadata);
      logger.info(`Updated existing newsletter: ${filename}`);
    } else {
      // Create new newsletter
      const { id, ...metadataWithoutId } = enhancedMetadata;
      const newId = await firestoreService.saveNewsletterMetadata(metadataWithoutId);
      enhancedMetadata.id = newId;
      logger.info(`Created new newsletter: ${filename} with ID: ${newId}`);
    }

    return {
      ...enhancedMetadata,
      displayDate: parsedDate.displayDate,
      sortValue: parsedDate.sortValue,
    };
  }

  /**
   * Get file size in bytes
   */
  private getFileSize(filename: string): number {
    try {
      const filePath = path.join(this.PDF_DIRECTORY, filename);
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      logger.warn(`Could not get file size for ${filename}:`, error);
      return 0;
    }
  }

  /**
   * Generate a detailed report of the processing results
   */
  generateReport(result: BatchProcessingResult): void {
    logger.info('\\n📋 Detailed Processing Report:');
    logger.info('================================');

    // Group by success/failure
    const successful = result.results.filter((r) => r.success);
    const failed = result.results.filter((r) => !r.success);

    if (successful.length > 0) {
      logger.info('\\n✅ Successfully Processed:');
      successful.forEach((item) => {
        const metadata = item.metadata;
        logger.info(`   ${item.filename} -> ${metadata?.displayDate} (${metadata?.issueNumber})`);
      });
    }

    if (failed.length > 0) {
      logger.info('\\n❌ Failed to Process:');
      failed.forEach((item) => {
        logger.info(`   ${item.filename}: ${item.error}`);
      });
    }

    // Show date distribution
    const dateDistribution = successful.reduce(
      (dist, item) => {
        const year = item.metadata?.year || 'Unknown';
        dist[year] = (dist[year] || 0) + 1;
        return dist;
      },
      {} as Record<string, number>,
    );

    logger.info('\\n📅 Distribution by Year:');
    Object.entries(dateDistribution)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .forEach(([year, count]) => {
        logger.info(`   ${year}: ${count} newsletters`);
      });
  }
}

// Export for use in scripts
export const batchDateProcessor = new BatchDateProcessor();
export default batchDateProcessor;
