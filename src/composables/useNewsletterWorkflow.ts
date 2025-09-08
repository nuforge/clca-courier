/**
 * Newsletter Workflow Composable
 * Handles complex workflow operations like import, processing, and batch operations
 */

import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { logger } from '../utils/logger';
import type { NewsletterMetadata } from '../types';
import { firebaseNewsletterService } from '../services/firebase-newsletter.service';

export function useNewsletterWorkflow() {
  const $q = useQuasar();

  // Processing states
  const isEnhancingDates = ref(false);
  const isCreatingRecords = ref(false);
  const isRebuildingDatabase = ref(false);
  const isFixingUrls = ref(false);
  const isClearingCache = ref(false);
  const isImporting = ref(false);
  const isExtractingPageCount = ref(false);
  const isExtractingFileSize = ref(false);
  const isExtractingDates = ref(false);
  const isGeneratingKeywords = ref(false);
  const isGeneratingDescriptions = ref(false);
  const isGeneratingTitles = ref(false);

  // Draft storage for imported metadata (not synced to cloud until explicitly uploaded)
  const draftNewsletters = ref<NewsletterMetadata[]>([]);
  const draftFileMap = ref<Map<string, File>>(new Map()); // Map draft ID to File object for thumbnail generation

  // Computed properties
  const hasDrafts = computed(() => draftNewsletters.value.length > 0);

  const processingStates = computed(() => ({
    isEnhancingDates: isEnhancingDates.value,
    isCreatingRecords: isCreatingRecords.value,
    isRebuildingDatabase: isRebuildingDatabase.value,
    isFixingUrls: isFixingUrls.value,
    isClearingCache: isClearingCache.value,
    isImporting: isImporting.value,
    isExtractingPageCount: isExtractingPageCount.value,
    isExtractingFileSize: isExtractingFileSize.value,
    isExtractingDates: isExtractingDates.value,
    isGeneratingKeywords: isGeneratingKeywords.value,
    isGeneratingDescriptions: isGeneratingDescriptions.value,
    isGeneratingTitles: isGeneratingTitles.value,
  }));

  // Import Data functionality
  const showImportDialog = async (): Promise<void> => {
    logger.info('📁 [IMPORT] Starting import dialog...');

    const action = await new Promise<'files' | 'folder' | 'cancel'>((resolve) => {
      $q.dialog({
        title: 'Import Newsletter Files',
        message: 'How would you like to import PDFs?',
        options: {
          type: 'radio',
          model: 'files',
          items: [
            { label: 'Select individual PDF files', value: 'files' },
            { label: 'Select entire folder', value: 'folder' },
          ],
        },
        cancel: true,
        persistent: true,
      })
        .onOk((data: string) => {
          resolve(data as 'files' | 'folder');
        })
        .onCancel(() => {
          resolve('cancel');
        });
    });

    logger.info(`📁 [IMPORT] User selected: ${action}`);

    if (action === 'cancel') {
      return;
    }

    try {
      isImporting.value = true;
      if (action === 'files') {
        await importSelectedFiles();
      } else {
        await importSelectedFolder();
      }
      logger.success('📁 [IMPORT] Import process completed successfully');
    } catch (error) {
      logger.error('📁 [IMPORT] Import failed:', error);
      $q.notify({
        type: 'negative',
        message: 'Import failed',
        caption: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      isImporting.value = false;
    }
  };

  const importSelectedFiles = async (): Promise<void> => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf';

    return new Promise((resolve, reject) => {
      input.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          logger.info(`📁 [IMPORT] Processing ${files.length} selected files`);
          Array.from(files).forEach((file) => createDraftRecord(file));
          $q.notify({
            type: 'positive',
            message: `${files.length} files imported as drafts`,
            caption: 'Use "Upload Drafts to Cloud" to sync them to Firebase',
          });
          resolve();
        } else {
          reject(new Error('No files selected'));
        }
      };
      input.click();
    });
  };

  const importSelectedFolder = async (): Promise<void> => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;
    input.accept = '.pdf';

    return new Promise((resolve, reject) => {
      input.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          const pdfFiles = Array.from(files).filter((file) =>
            file.name.toLowerCase().endsWith('.pdf'),
          );
          logger.info(`📁 [IMPORT] Processing ${pdfFiles.length} PDF files from folder`);
          pdfFiles.forEach((file) => createDraftRecord(file));
          $q.notify({
            type: 'positive',
            message: `${pdfFiles.length} PDF files imported as drafts`,
            caption: 'Use "Upload Drafts to Cloud" to sync them to Firebase',
          });
          resolve();
        } else {
          reject(new Error('No files selected'));
        }
      };
      input.click();
    });
  };

  const createDraftRecord = (file: File): void => {
    logger.debug(`📝 [DRAFT] Creating local draft for: ${file.name}`);

    const draftMetadata: NewsletterMetadata = {
      id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: file.name,
      title: file.name.replace('.pdf', '').replace(/[_-]/g, ' '),
      downloadUrl: '',
      publicationDate: new Date().toISOString(),
      year: new Date().getFullYear(),
      tags: [],
      pageCount: 0,
      fileSize: file.size,
      isPublished: false,
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      updatedBy: 'system',
    };

    // Store locally in draft array (NOT in Firebase)
    draftNewsletters.value.push(draftMetadata);
    logger.debug(
      `📝 [DRAFT] Stored locally: ${file.name} (Total drafts: ${draftNewsletters.value.length})`,
    );

    // Store the File object for thumbnail generation (in memory only)
    draftFileMap.value.set(draftMetadata.id, file);
    logger.debug(`📝 [DRAFT] Stored File object for thumbnail generation: ${draftMetadata.id}`);

    // Also store in localStorage for persistence across sessions
    localStorage.setItem('newsletter-drafts', JSON.stringify(draftNewsletters.value));
    logger.debug('📝 [DRAFT] Persisted to localStorage');
  };

  // Load drafts from localStorage on component mount
  const loadDraftsFromStorage = (): void => {
    logger.debug('📝 [DRAFT] Loading drafts from localStorage...');
    try {
      const stored = localStorage.getItem('newsletter-drafts');
      if (stored) {
        draftNewsletters.value = JSON.parse(stored);
        logger.info(`📝 [DRAFT] Loaded ${draftNewsletters.value.length} drafts from localStorage`);
      }
    } catch (error) {
      logger.error('📝 [DRAFT] Failed to load drafts from localStorage:', error);
    }
  };

  // Sync all drafts to Firebase
  const uploadDraftsToCloud = async (): Promise<void> => {
    const actionId = 'SYNC-DRAFTS-' + Date.now();
    logger.info(
      `☁️ [${actionId}] Starting sync of ${draftNewsletters.value.length} drafts to Firebase...`,
    );

    if (draftNewsletters.value.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'No drafts to upload',
        caption: 'Import some files first',
      });
      return;
    }

    try {
      isImporting.value = true;
      let successCount = 0;
      const errors: string[] = [];

      for (const draft of draftNewsletters.value) {
        try {
          // Get the original File object
          const originalFile = draftFileMap.value.get(draft.id);
          if (!originalFile) {
            throw new Error('Original file not found in memory');
          }

          // Upload to Firebase and create record
          logger.debug(`☁️ [${actionId}] Uploading ${draft.filename}...`);

          // Create the metadata object that the service expects
          const uploadMetadata = {
            title: draft.title,
            publicationDate: draft.publicationDate,
            year: draft.year,
            tags: draft.tags,
            featured: draft.featured,
          };

          await firebaseNewsletterService.uploadNewsletter(originalFile, uploadMetadata);
          successCount++;
          logger.debug(`☁️ [${actionId}] Successfully uploaded ${draft.filename}`);
        } catch (error) {
          const errorMsg = `Failed to upload ${draft.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.error(`☁️ [${actionId}] ${errorMsg}`);
        }
      }

      // Clear drafts after successful upload
      if (successCount > 0) {
        draftNewsletters.value = [];
        draftFileMap.value.clear();
        localStorage.removeItem('newsletter-drafts');
        logger.success(`☁️ [${actionId}] Cleared local drafts after successful upload`);
      }

      // Show results
      const notificationOptions: Record<string, unknown> = {
        type: successCount > 0 ? 'positive' : 'negative',
        message: `Upload completed: ${successCount} successful, ${errors.length} failed`,
        timeout: 5000,
      };

      if (errors.length > 0) {
        notificationOptions.caption = 'Check console for error details';
      }

      $q.notify(notificationOptions);

      logger.info(
        `☁️ [${actionId}] Upload completed: ${successCount} successful, ${errors.length} failed`,
      );
    } catch (error) {
      logger.error(`☁️ [${actionId}] Batch upload failed:`, error);
      $q.notify({
        type: 'negative',
        message: 'Batch upload failed',
        caption: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      isImporting.value = false;
    }
  };

  // Clear local drafts without uploading
  const clearLocalDrafts = async (): Promise<void> => {
    logger.info('🗑️ [DRAFT] Clearing local drafts...');

    const confirmed = await new Promise<boolean>((resolve) => {
      $q.dialog({
        title: 'Clear Local Drafts',
        message: `Are you sure you want to clear all ${draftNewsletters.value.length} local drafts? This cannot be undone.`,
        cancel: true,
        persistent: true,
      })
        .onOk(() => {
          resolve(true);
        })
        .onCancel(() => {
          resolve(false);
        });
    });

    if (confirmed) {
      draftNewsletters.value = [];
      draftFileMap.value.clear();
      localStorage.removeItem('newsletter-drafts');
      logger.success('🗑️ [DRAFT] Local drafts cleared');
      $q.notify({
        type: 'positive',
        message: 'Local drafts cleared',
        caption: 'All draft data has been removed',
      });
    }
  };

  return {
    // State
    processingStates,
    draftNewsletters,
    draftFileMap,
    hasDrafts,

    // Import functions
    showImportDialog,
    importSelectedFiles,
    importSelectedFolder,
    createDraftRecord,
    loadDraftsFromStorage,
    uploadDraftsToCloud,
    clearLocalDrafts,

    // Processing states (individual)
    isEnhancingDates,
    isCreatingRecords,
    isRebuildingDatabase,
    isFixingUrls,
    isClearingCache,
    isImporting,
    isExtractingPageCount,
    isExtractingFileSize,
    isExtractingDates,
    isGeneratingKeywords,
    isGeneratingDescriptions,
    isGeneratingTitles,
  };
}
