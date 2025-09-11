/**
 * Canva Export Management Composable
 *
 * Handles Canva design export workflow for admin/editor interfaces.
 * Provides status tracking, polling, and real-time updates following
 * established CLCA Courier patterns.
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { canvaApiService } from '../services/canva-api.service';
import { firestoreService } from '../services/firebase-firestore.service';
import type { UserContent } from '../services/firebase-firestore.service';
import type { CanvaDesign } from '../services/canva/types';
import { logger } from '../utils/logger';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';

interface ExportState {
  contentId: string;
  designId: string;
  isExporting: boolean;
  pollCount: number;
  maxPollAttempts: number;
}

export function useCanvaExport() {
  const $q = useQuasar();
  const { t } = useI18n();

  // State management
  const exportStates = ref<Map<string, ExportState>>(new Map());
  const pollIntervals = ref<Map<string, number>>(new Map());

  // Constants for polling configuration
  const POLL_INTERVAL_MS = 3000; // 3 seconds
  const MAX_POLL_ATTEMPTS = 40; // 2 minutes total (40 * 3 seconds)

  /**
   * Check if a content item is currently being exported
   */
  const isExporting = computed(() => (contentId: string): boolean => {
    return exportStates.value.get(contentId)?.isExporting ?? false;
  });

  /**
   * Get export progress for a content item
   */
  const getExportProgress = computed(() => (contentId: string): number => {
    const state = exportStates.value.get(contentId);
    if (!state) return 0;
    return Math.round((state.pollCount / state.maxPollAttempts) * 100);
  });

  /**
   * Start the export process for a Canva design
   */
  async function exportDesignForPrint(content: UserContent): Promise<void> {
    if (!content.canvaDesign) {
      logger.error('Cannot export: No Canva design attached to content', { contentId: content.id });
      $q.notify({
        type: 'negative',
        message: t(TRANSLATION_KEYS.CANVA.EXPORT_FAILED)
      });
      return;
    }

    const { id: contentId } = content;
    const { id: designId } = content.canvaDesign;

    logger.info('Starting Canva export for print', { contentId, designId });

    try {
      // Initialize export state
      exportStates.value.set(contentId, {
        contentId,
        designId,
        isExporting: true,
        pollCount: 0,
        maxPollAttempts: MAX_POLL_ATTEMPTS
      });

      // Update UI immediately with pending status
      $q.notify({
        type: 'info',
        message: t(TRANSLATION_KEYS.CANVA.EXPORT_PENDING),
        timeout: 2000
      });

      // Immediately update Firestore to set status to pending_export
      const updatedDesign: CanvaDesign = {
        ...content.canvaDesign,
        status: 'pending_export'
      };

      await firestoreService.updateUserContent(contentId, {
        canvaDesign: updatedDesign
      });

      logger.debug('Updated design status to pending_export', { contentId, designId });

      // Start the export via Canva API
      await canvaApiService.exportDesign(designId);

      // Start polling for completion
      startExportPolling(contentId, designId);

    } catch (error) {
      logger.error('Failed to start Canva export', { contentId, designId, error });

      // Clean up export state
      exportStates.value.delete(contentId);

      // Update design status to failed
      if (content.canvaDesign) {
        const failedDesign: CanvaDesign = {
          ...content.canvaDesign,
          status: 'failed'
        };

        try {
          await firestoreService.updateUserContent(contentId, {
            canvaDesign: failedDesign
          });
        } catch (updateError) {
          logger.error('Failed to update design status to failed', { contentId, updateError });
        }
      }

      $q.notify({
        type: 'negative',
        message: t(TRANSLATION_KEYS.CANVA.EXPORT_FAILED)
      });
    }
  }

  /**
   * Start polling for export completion
   */
  function startExportPolling(contentId: string, designId: string): void {
    const state = exportStates.value.get(contentId);
    if (!state) {
      logger.warn('Export state not found for polling', { contentId });
      return;
    }

    const intervalId = window.setInterval(() => {
      void pollExportStatus(contentId, designId).catch((error) => {
        logger.error('Error during export polling', { contentId, designId, error });
        stopExportPolling(contentId);
      });
    }, POLL_INTERVAL_MS);

    pollIntervals.value.set(contentId, intervalId);
    logger.debug('Started export polling', { contentId, designId, intervalMs: POLL_INTERVAL_MS });
  }

  /**
   * Poll the Canva API to check export status
   */
  async function pollExportStatus(contentId: string, designId: string): Promise<void> {
    const state = exportStates.value.get(contentId);
    if (!state) {
      stopExportPolling(contentId);
      return;
    }

    state.pollCount++;
    logger.debug('Polling export status', {
      contentId,
      designId,
      pollCount: state.pollCount,
      maxAttempts: state.maxPollAttempts
    });

    try {
      // Get the latest design status from Canva API
      const design = await canvaApiService.getDesign(designId);

      if (design.status === 'exported' && design.exportUrl) {
        // Export completed successfully
        await handleExportComplete(contentId, design);
        stopExportPolling(contentId);

      } else if (design.status === 'failed') {
        // Export failed
        await handleExportFailed(contentId, design);
        stopExportPolling(contentId);

      } else if (state.pollCount >= state.maxPollAttempts) {
        // Polling timeout
        logger.warn('Export polling timeout reached', { contentId, designId, pollCount: state.pollCount });
        handleExportTimeout(contentId);
        stopExportPolling(contentId);
      }
      // Continue polling if status is still 'pending_export'

    } catch (error) {
      logger.error('Error polling export status', { contentId, designId, error });

      if (state.pollCount >= state.maxPollAttempts) {
        handleExportTimeout(contentId);
        stopExportPolling(contentId);
      }
      // Continue polling on API errors unless max attempts reached
    }
  }

  /**
   * Handle successful export completion
   */
  async function handleExportComplete(contentId: string, design: CanvaDesign): Promise<void> {
    logger.success('Canva export completed', { contentId, designId: design.id });

    try {
      // Update Firestore with the completed export
      await firestoreService.updateUserContent(contentId, {
        canvaDesign: design
      });

      // Clean up export state
      exportStates.value.delete(contentId);

      // Show success notification with download option
      $q.notify({
        type: 'positive',
        message: t(TRANSLATION_KEYS.CANVA.EXPORT_COMPLETE),
        actions: [
          {
            label: t(TRANSLATION_KEYS.COMMON.DOWNLOAD),
            color: 'white',
            handler: () => {
              if (design.exportUrl) {
                downloadDesign(design.exportUrl, `canva-design-${design.id}.pdf`);
              }
            }
          }
        ],
        timeout: 10000 // 10 seconds to allow download action
      });

    } catch (error) {
      logger.error('Failed to update content with completed export', { contentId, error });

      $q.notify({
        type: 'warning',
        message: 'Export completed but failed to update record. Please refresh the page.'
      });
    }
  }

  /**
   * Handle export failure
   */
  async function handleExportFailed(contentId: string, design: CanvaDesign): Promise<void> {
    logger.error('Canva export failed', { contentId, designId: design.id });

    try {
      // Update Firestore with failed status
      await firestoreService.updateUserContent(contentId, {
        canvaDesign: design
      });

      // Clean up export state
      exportStates.value.delete(contentId);

      $q.notify({
        type: 'negative',
        message: t(TRANSLATION_KEYS.CANVA.EXPORT_FAILED)
      });

    } catch (error) {
      logger.error('Failed to update content with failed export status', { contentId, error });
    }
  }

  /**
   * Handle export timeout
   */
  function handleExportTimeout(contentId: string): void {
    logger.warn('Canva export polling timeout', { contentId });

    // Clean up export state
    exportStates.value.delete(contentId);

    $q.notify({
      type: 'warning',
      message: 'Export is taking longer than expected. Please check back later or try again.',
      timeout: 5000
    });
  }

  /**
   * Stop polling for a specific content item
   */
  function stopExportPolling(contentId: string): void {
    const intervalId = pollIntervals.value.get(contentId);
    if (intervalId) {
      clearInterval(intervalId);
      pollIntervals.value.delete(contentId);
      logger.debug('Stopped export polling', { contentId });
    }

    // Clean up export state
    exportStates.value.delete(contentId);
  }

  /**
   * Download a design file
   */
  function downloadDesign(exportUrl: string, filename: string): void {
    try {
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logger.info('Design download initiated', { exportUrl, filename });
    } catch (error) {
      logger.error('Failed to download design', { exportUrl, filename, error });

      $q.notify({
        type: 'negative',
        message: 'Failed to download design. Please try the download link manually.'
      });
    }
  }

  /**
   * Clean up all polling intervals (for component unmount)
   */
  function cleanup(): void {
    for (const [contentId] of pollIntervals.value) {
      stopExportPolling(contentId);
    }
    exportStates.value.clear();
    pollIntervals.value.clear();
    logger.debug('Canva export composable cleanup completed');
  }

  return {
    // State
    isExporting,
    getExportProgress,

    // Actions
    exportDesignForPrint,
    downloadDesign,
    cleanup
  };
}
