/**
 * Batch Import Composable
 * Provides reactive state and methods for importing batch processing data
 */

import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { BatchImportService, type ImportOptions, type ImportResult } from '../services/batch-import.service';
import type { BatchProcessingItem } from '../utils/batch-content-transformer';
import { logger } from '../utils/logger';

export function useBatchImport() {
  const $q = useQuasar();
  const { t } = useI18n();

  // Reactive state
  const isImporting = ref(false);
  const importProgress = ref(0);
  const lastImportResult = ref<ImportResult | null>(null);
  const importHistory = ref<ImportResult[]>([]);

  // Computed properties
  const hasImportHistory = computed(() => importHistory.value.length > 0);
  const totalImportedContent = computed(() =>
    importHistory.value.reduce((total, result) =>
      total + result.articlesImported + result.newslettersImported, 0
    )
  );

  /**
   * Import batch processing data from JSON
   */
  const importFromJson = async (
    jsonData: BatchProcessingItem[],
    options: ImportOptions = { importArticles: true, importNewsletter: false }
  ): Promise<ImportResult> => {
    isImporting.value = true;
    importProgress.value = 0;

    try {
      // Show progress notification
      const progressNotification = $q.notify({
        group: false,
        timeout: 0,
        spinner: true,
        message: t('batchImport.processing'),
        caption: t('batchImport.preparing')
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        if (importProgress.value < 90) {
          importProgress.value += Math.random() * 10;
        }
      }, 500);

      const result = await BatchImportService.importFromJson(jsonData, options);

      // Clear progress updates
      clearInterval(progressInterval);
      importProgress.value = 100;

      // Update state
      lastImportResult.value = result;
      importHistory.value.unshift(result);

      // Close progress notification
      progressNotification();

      // Show success notification
      if (result.errors.length === 0) {
        $q.notify({
          type: 'positive',
          message: t('batchImport.success'),
          caption: t('batchImport.successCaption', {
            articles: result.articlesImported,
            newsletters: result.newslettersImported
          }),
          timeout: 5000
        });
      } else {
        $q.notify({
          type: 'warning',
          message: t('batchImport.partialSuccess'),
          caption: t('batchImport.errorCount', { count: result.errors.length }),
          timeout: 7000
        });
      }

      logger.info('Batch import completed', result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      $q.notify({
        type: 'negative',
        message: t('batchImport.error'),
        caption: errorMessage,
        timeout: 10000
      });

      logger.error('Batch import failed', { error: errorMessage });
      throw error;
    } finally {
      isImporting.value = false;
      importProgress.value = 0;
    }
  };

  /**
   * Import from file
   */
  const importFromFile = async (
    file: File,
    options: ImportOptions = { importArticles: true, importNewsletter: false }
  ): Promise<ImportResult> => {
    try {
      const result = await BatchImportService.importFromFile(file, options);

      if (result.errors.length === 0) {
        $q.notify({
          type: 'positive',
          message: t('batchImport.fileSuccess'),
          caption: t('batchImport.fileSuccessCaption', {
            filename: file.name,
            articles: result.articlesImported,
            newsletters: result.newslettersImported
          }),
          timeout: 5000
        });
      } else {
        $q.notify({
          type: 'warning',
          message: t('batchImport.filePartialSuccess'),
          caption: t('batchImport.errorCount', { count: result.errors.length }),
          timeout: 7000
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      $q.notify({
        type: 'negative',
        message: t('batchImport.fileError'),
        caption: errorMessage,
        timeout: 10000
      });

      throw error;
    }
  };

  /**
   * Get import preview
   */
  const getImportPreview = (jsonData: BatchProcessingItem[]) => {
    try {
      return BatchImportService.getImportPreview(jsonData);
    } catch (error) {
      logger.error('Failed to get import preview', { error });
      throw error;
    }
  };

  /**
   * Clear import history
   */
  const clearHistory = () => {
    importHistory.value = [];
    lastImportResult.value = null;
    $q.notify({
      type: 'info',
      message: t('batchImport.historyCleared'),
      timeout: 3000
    });
  };

  /**
   * Show import dialog
   */
  const showImportDialog = () => {
    $q.dialog({
      title: t('batchImport.dialogTitle'),
      message: t('batchImport.dialogMessage'),
      cancel: true,
      persistent: true,
      options: {
        type: 'checkbox',
        model: [],
        items: [
          { label: t('batchImport.importArticles'), value: 'articles' },
          { label: t('batchImport.importNewsletters'), value: 'newsletters' },
          { label: t('batchImport.skipExisting'), value: 'skipExisting' }
        ]
      }
    }).onOk((data) => {
      // Handle dialog result
      const options: ImportOptions = {
        importArticles: data.includes('articles'),
        importNewsletter: data.includes('newsletters'),
        skipExisting: data.includes('skipExisting')
      };

      // Trigger file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          await importFromFile(file, options);
        }
      };
      input.click();
    });
  };

  return {
    // State
    isImporting,
    importProgress,
    lastImportResult,
    importHistory,

    // Computed
    hasImportHistory,
    totalImportedContent,

    // Methods
    importFromJson,
    importFromFile,
    getImportPreview,
    clearHistory,
    showImportDialog
  };
}
