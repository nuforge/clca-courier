/**
 * Simplified Admin Composable
 * Firebase-first approach for MVP
 */

import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { pdfProcessingService } from '../services/pdf-processing.service';
import { firebaseAuthService } from '../services/firebase-auth.service';
import type { NewsletterMetadata } from '../services/firebase-firestore.service';
import type { PdfProcessingProgress } from '../services/pdf-processing.service';
import { logger } from '../utils/logger';

export function useSimplifiedAdmin() {
  const $q = useQuasar();

  // State
  const newsletters = ref<NewsletterMetadata[]>([]);
  const isLoading = ref(false);
  const isProcessing = ref(false);
  const processingProgress = ref<PdfProcessingProgress>({
    total: 0,
    processed: 0,
    current: '',
    results: [],
  });

  // Get current user
  const getCurrentUser = () => {
    const user = firebaseAuthService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }
    return user;
  };

  /**
   * Load all newsletters from Firebase (admin view)
   */
  const loadNewsletters = async (): Promise<void> => {
    try {
      isLoading.value = true;
      logger.info('Loading newsletters from Firebase...');

      // Clear any browser cache before loading
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
          logger.info('Browser caches cleared');
        } catch (error) {
          logger.warn('Failed to clear browser caches:', error);
        }
      }

      newsletters.value = await pdfProcessingService.getAllNewslettersForAdmin();

      logger.info(`Loaded ${newsletters.value.length} newsletters from Firebase`);

      // Debug: Log first few newsletter filenames
      if (newsletters.value.length > 0) {
        const filenames = newsletters.value.slice(0, 5).map((n) => n.filename);
        logger.info('First few newsletters:', filenames);
      }
    } catch (error) {
      logger.error('Failed to load newsletters:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to load newsletters from Firebase',
        caption: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Process local PDFs to Firebase
   */
  const processLocalPdfsToFirebase = async (filenames: string[]): Promise<void> => {
    try {
      const user = getCurrentUser();
      isProcessing.value = true;

      logger.info(`Starting batch processing of ${filenames.length} PDFs`);

      const results = await pdfProcessingService.processBatchToFirebase(filenames, user.uid, {
        onProgress: (progress) => {
          processingProgress.value = progress;
        },
      });

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      // Show results
      const notificationOptions: Record<string, unknown> = {
        type: 'positive',
        message: `Successfully processed ${successCount} PDFs`,
      };

      if (failureCount > 0) {
        notificationOptions.caption = `${failureCount} failed`;
      }

      if (successCount > 0) {
        $q.notify(notificationOptions);
      }

      if (failureCount > 0) {
        const failures = results.filter((r) => !r.success);
        logger.error('Processing failures:', failures);

        $q.notify({
          type: 'negative',
          message: `${failureCount} PDFs failed to process`,
          caption: 'Check console for details',
        });
      }

      // Reload newsletters to show new data
      await loadNewsletters();
    } catch (error) {
      logger.error('Batch processing failed:', error);
      $q.notify({
        type: 'negative',
        message: 'Batch processing failed',
        caption: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      isProcessing.value = false;
      processingProgress.value = {
        total: 0,
        processed: 0,
        current: '',
        results: [],
      };
    }
  };

  /**
   * Update newsletter metadata
   */
  const updateNewsletter = async (
    newsletterId: string,
    updates: Partial<NewsletterMetadata>,
  ): Promise<void> => {
    try {
      const user = getCurrentUser();

      await pdfProcessingService.updateNewsletterMetadata(newsletterId, updates, user.uid);

      $q.notify({
        type: 'positive',
        message: 'Newsletter updated successfully',
      });

      // Reload newsletters to get fresh data
      await loadNewsletters();
    } catch (error) {
      logger.error('Failed to update newsletter:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to update newsletter',
        caption: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Toggle newsletter published status
   */
  const togglePublished = async (newsletter: NewsletterMetadata): Promise<void> => {
    await updateNewsletter(newsletter.id, {
      isPublished: !newsletter.isPublished,
    });
  };

  /**
   * Toggle newsletter featured status
   */
  const toggleFeatured = async (newsletter: NewsletterMetadata): Promise<void> => {
    await updateNewsletter(newsletter.id, {
      featured: !newsletter.featured,
    });
  };

  /**
   * Delete newsletter
   */
  const deleteNewsletter = async (newsletter: NewsletterMetadata): Promise<void> => {
    try {
      await pdfProcessingService.deleteNewsletter(newsletter.id);

      $q.notify({
        type: 'positive',
        message: 'Newsletter deleted successfully',
      });

      // Remove from local state
      newsletters.value = newsletters.value.filter((n) => n.id !== newsletter.id);
    } catch (error) {
      logger.error('Failed to delete newsletter:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to delete newsletter',
        caption: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get available local PDF filenames
   */
  const getLocalPdfFilenames = async (): Promise<string[]> => {
    try {
      // This would normally come from the manifest or file system
      // For now, return a hardcoded list that can be updated
      const response = await fetch('/data/pdf-manifest.json');
      const manifest = (await response.json()) as { files: Array<{ filename: string }> };
      return manifest.files.map((f) => f.filename);
    } catch (error) {
      logger.error('Failed to get local PDF filenames:', error);
      // Return empty array if manifest doesn't exist
      return [];
    }
  };

  // Computed properties
  const publishedNewsletters = computed(() => newsletters.value.filter((n) => n.isPublished));

  const unpublishedNewsletters = computed(() => newsletters.value.filter((n) => !n.isPublished));

  const featuredNewsletters = computed(() => newsletters.value.filter((n) => n.featured));

  const totalNewsletters = computed(() => newsletters.value.length);

  const processingStatus = computed(() => {
    if (!isProcessing.value) return null;

    const { total, processed, current } = processingProgress.value;
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

    return {
      percentage,
      current,
      processed,
      total,
      message: `Processing ${current} (${processed}/${total})`,
    };
  });

  return {
    // State
    newsletters,
    isLoading,
    isProcessing,
    processingProgress,

    // Computed
    publishedNewsletters,
    unpublishedNewsletters,
    featuredNewsletters,
    totalNewsletters,
    processingStatus,

    // Actions
    loadNewsletters,
    processLocalPdfsToFirebase,
    updateNewsletter,
    togglePublished,
    toggleFeatured,
    deleteNewsletter,
    getLocalPdfFilenames,
  };
}
