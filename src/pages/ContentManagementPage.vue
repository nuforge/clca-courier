<!--
  Content Management Page
  Admin interface for viewing and managing user-submitted content
-->
<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12">
          <!-- Header -->
          <q-card flat class="q-mb-lg">
            <q-card-section>
              <div class="text-h4 text-center q-mb-md">
                <q-icon :name="getContentIcon('announcement').icon" class="q-mr-sm text-primary" />
                {{ t('content.management') || 'Content Management' }}
              </div>
              <p class="text-center text-body1">
                {{ t('content.managementDescription') || 'Review, approve, and manage user-submitted content for publication' }}
              </p>
            </q-card-section>
          </q-card>

          <!-- Statistics Cards -->
          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col">
              <q-card class="text-center">
                <q-card-section>
                  <q-icon :name="getStatusIcon('draft').icon" :color="getStatusIcon('draft').color" size="md" class="q-mb-sm" />
                  <div class="text-h6 text-orange">{{ draftContent.length }}</div>
                  <div class="text-caption">Draft</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col">
              <q-card class="text-center">
                <q-card-section>
                  <q-icon :name="getStatusIcon('published').icon" :color="getStatusIcon('published').color" size="md" class="q-mb-sm" />
                  <div class="text-h6 text-blue">{{ publishedContent.length }}</div>
                  <div class="text-caption">{{ t(TRANSLATION_KEYS.CONTENT.STATUS.PUBLISHED) }}</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col">
              <q-card class="text-center">
                <q-card-section>
                  <q-icon :name="getStatusIcon('archived').icon" :color="getStatusIcon('archived').color" size="md" class="q-mb-sm" />
                  <div class="text-h6 text-grey">{{ archivedContent.length }}</div>
                  <div class="text-caption">Archived</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col">
              <q-card class="text-center">
                <q-card-section>
                  <q-icon :name="getStatusIcon('rejected').icon" :color="getStatusIcon('rejected').color" size="md" class="q-mb-sm" />
                  <div class="text-h6 text-red">{{ rejectedContent.length }}</div>
                  <div class="text-caption">Rejected</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col">
              <q-card class="text-center">
                <q-card-section>
                  <q-icon :name="getStatusIcon('deleted').icon" :color="getStatusIcon('deleted').color" size="md" class="q-mb-sm" />
                  <div class="text-h6 text-grey-8">{{ deletedContent.length }}</div>
                  <div class="text-caption">Deleted</div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Action Toolbar -->
          <q-card class="q-mb-lg">
            <q-card-section>
              <div class="row items-center q-col-gutter-md">
                <div class="col-auto">
                  <q-btn color="primary" :icon="UI_ICONS.refresh" label="Refresh" @click="loadAllContent"
                    :loading="isLoading" />
                </div>
                <div class="col-auto">
                  <q-btn color="positive" :icon="UI_ICONS.checkAll" label="Bulk Publish" @click="showBulkPublishDialog"
                    :disable="selectedContent.length === 0" />
                </div>
                <div class="col-auto">
                  <q-btn color="negative" :icon="UI_ICONS.rejectAll" label="Bulk Archive"
                    @click="showBulkArchiveDialog" :disable="selectedContent.length === 0" outline />
                </div>
                <div class="col">
                  <q-space />
                </div>
                <div class="col-auto">
                  <q-toggle v-model="autoRefresh" :label="t(TRANSLATION_KEYS.COMMON.AUTO_REFRESH) || 'Auto-refresh'" />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Content Tabs -->
          <q-card>
            <q-tabs v-model="activeTab" dense class="text-grey" active-color="primary" indicator-color="primary"
              align="justify" narrow-indicator>
              <q-tab name="draft">
                <q-icon :name="getStatusIcon('draft').icon" :color="getStatusIcon('draft').color" class="q-mr-sm" />
                Draft ({{ draftContent.length }})
              </q-tab>
              <q-tab name="published">
                <q-icon :name="getStatusIcon('published').icon" :color="getStatusIcon('published').color" class="q-mr-sm" />
                {{ t(TRANSLATION_KEYS.CONTENT.STATUS.PUBLISHED) }} ({{ publishedContent.length }})
              </q-tab>
              <q-tab name="archived">
                <q-icon :name="getStatusIcon('archived').icon" :color="getStatusIcon('archived').color" class="q-mr-sm" />
                Archived ({{ archivedContent.length }})
              </q-tab>
              <q-tab name="rejected">
                <q-icon :name="getStatusIcon('rejected').icon" :color="getStatusIcon('rejected').color" class="q-mr-sm" />
                Rejected ({{ rejectedContent.length }})
              </q-tab>
              <q-tab name="deleted">
                <q-icon :name="getStatusIcon('deleted').icon" :color="getStatusIcon('deleted').color" class="q-mr-sm" />
                Deleted ({{ deletedContent.length }})
              </q-tab>
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="activeTab" animated>
              <!-- Draft Content -->
              <q-tab-panel name="draft">
                <ContentDocTable :content="draftContent" :selected="selectedContent"
                  @update:selected="selectedContent = $event" @publish="publishContent" @archive="archiveContent"
                  @reject="rejectContent" @delete="deleteContent" @view="viewContent" @toggle-featured="toggleFeaturedStatus"
                  :show-canva-export="true" :is-exporting-content="isExporting"
                  @export-for-print="handleExportForPrint" @download-design="handleDownloadDesign"
                  show-publish-actions />
              </q-tab-panel>

              <!-- Published Content -->
              <q-tab-panel name="published">
                <ContentDocTable :content="publishedContent" :selected="selectedContent"
                  @update:selected="selectedContent = $event" @unpublish="unpublishContent" @archive="archiveContent" @view="viewContent"
                  @toggle-featured="toggleFeaturedStatus"
                  :show-canva-export="true" :is-exporting-content="isExporting"
                  @export-for-print="handleExportForPrint" @download-design="handleDownloadDesign"
                  show-unpublish-actions />
              </q-tab-panel>

              <!-- Archived Content -->
              <q-tab-panel name="archived">
                <ContentDocTable :content="archivedContent" :selected="selectedContent"
                  @update:selected="selectedContent = $event" @restore="restoreContent" @view="viewContent"
                  @toggle-featured="toggleFeaturedStatus"
                  :show-canva-export="true" :is-exporting-content="isExporting"
                  @export-for-print="handleExportForPrint" @download-design="handleDownloadDesign"
                  show-restore-actions />
              </q-tab-panel>

              <q-tab-panel name="rejected">
                <ContentDocTable :content="rejectedContent" :selected="selectedContent"
                  @update:selected="selectedContent = $event" @restore="restoreContent" @view="viewContent"
                  @toggle-featured="toggleFeaturedStatus"
                  :show-canva-export="true" :is-exporting-content="isExporting"
                  @export-for-print="handleExportForPrint" @download-design="handleDownloadDesign"
                  show-restore-actions />
              </q-tab-panel>

              <q-tab-panel name="deleted">
                <ContentDocTable :content="deletedContent" :selected="selectedContent"
                  @update:selected="selectedContent = $event" @restore="restoreContent" @view="viewContent"
                  @toggle-featured="toggleFeaturedStatus"
                  :show-canva-export="true" :is-exporting-content="isExporting"
                  @export-for-print="handleExportForPrint" @download-design="handleDownloadDesign"
                  show-restore-actions />
              </q-tab-panel>
            </q-tab-panels>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Content Detail Dialog -->
    <ContentDetailDialog
      :content="selectedContentItem"
      v-model:show-dialog="showDetailDialog"
      :is-exporting="isExporting"
      @publish="publishContent"
      @unpublish="unpublishContent"
      @archive="archiveContentWithDialog"
      @restore="restoreContent"
      @toggle-featured="toggleFeaturedStatus"
      @export-for-print="handleExportForPrint"
      @download-design="handleDownloadDesign"
    />

    <!-- Archive Reason Dialog -->
    <q-dialog v-model="showRejectDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Archive Content</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input v-model="rejectionReason" label="Reason for archiving (optional)" type="textarea" rows="3"
            outlined />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="t(TRANSLATION_KEYS.COMMON.CANCEL)" @click="showRejectDialog = false" />
          <q-btn label="Archive" color="negative" @click="confirmArchiveContent" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRoleAuth } from '../composables/useRoleAuth';
import { useCanvaExport } from '../composables/useCanvaExport';
import { firebaseContentService } from '../services/firebase-content.service';
import type { ContentDoc } from '../types/core/content.types';
import { contentUtils } from '../types/core/content.types';
import { logger } from '../utils/logger';
import ContentDocTable from '../components/content-management/ContentDocTable.vue';
import ContentDetailDialog from '../components/content-management/ContentDetailDialog.vue';
import { useSiteTheme } from '../composables/useSiteTheme';
import { UI_ICONS } from '../constants/ui-icons';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';

const $q = useQuasar();
const { t } = useI18n();
const { requireEditor, isAuthReady } = useRoleAuth();
const { getStatusIcon, getContentIcon } = useSiteTheme();
const { exportDesignForPrint, downloadDesign, isExporting, cleanup: cleanupCanvaExport } = useCanvaExport();

// State
const isLoading = ref(false);
const allContent = ref<ContentDoc[]>([]);
const selectedContent = ref<string[]>([]);
const activeTab = ref('draft');

// Watch for authentication readiness and check authorization
watch(isAuthReady, (ready: boolean) => {
  if (ready) {
    if (!requireEditor()) {
      // Redirect handled by useRoleAuth
    }
  }
}, { immediate: true });
const autoRefresh = ref(false);
let refreshInterval: number | null = null;

// Dialog state
const showDetailDialog = ref(false);
const selectedContentItem = ref<ContentDoc | null>(null);
const showRejectDialog = ref(false);
const rejectionReason = ref('');
const contentToReject = ref<ContentDoc | null>(null);

// Computed - Updated for ContentDoc status values
const draftContent = computed(() =>
  allContent.value.filter(item => item.status === 'draft')
);

const publishedContent = computed(() =>
  allContent.value.filter(item => item.status === 'published')
);

const archivedContent = computed(() =>
  allContent.value.filter(item => item.status === 'archived')
);

const rejectedContent = computed(() =>
  allContent.value.filter(item => item.status === 'rejected')
);

const deletedContent = computed(() =>
  allContent.value.filter(item => item.status === 'deleted')
);

// Methods
const loadAllContent = () => {
  isLoading.value = true;
  try {
    // Load all content using the new ContentDoc service
    // Note: This will need to be implemented in firebaseContentService
    // For now, we'll use a subscription to get all content
    const unsubscribe = firebaseContentService.subscribeToAllContent((content) => {
      allContent.value = content;
      selectedContent.value = [];
      logger.success(`Loaded ${content.length} content items`);
    });

    // Store unsubscribe function for cleanup
    if (typeof unsubscribe === 'function') {
      // Store in a way that can be cleaned up later
      (window as { contentManagementUnsubscribe?: () => void }).contentManagementUnsubscribe = unsubscribe;
    }
  } catch (error) {
    logger.error('Error loading content:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load content. Please try again.'
    });
  } finally {
    isLoading.value = false;
  }
};

const publishContent = async (contentId: string) => {
  try {
    // Publish the content using the new ContentDoc service
    await firebaseContentService.updateContentStatus(contentId, 'published');

    // Find the content item to check if it has a Canva design
    const contentItem = allContent.value.find(item => item.id === contentId);

    if (contentItem && contentUtils.hasFeature(contentItem, 'integ:canva')) {
      logger.info(`Content ${contentId} has Canva design, initiating auto-export for print workflow`);

      try {
        // Auto-export the Canva design for print
        await exportDesignForPrint(contentItem);

        $q.notify({
          type: 'positive',
          message: t(TRANSLATION_KEYS.CONTENT.PRINT.AUTO_EXPORT_SUCCESS) || 'Content published and design exported for printing',
          timeout: 5000
        });
      } catch (exportError) {
        logger.warn(`Auto-export failed for content ${contentId}:`, exportError);
        // Still show success for publishing, but note the export issue
        $q.notify({
          type: 'warning',
          message: t(TRANSLATION_KEYS.CONTENT.PRINT.AUTO_EXPORT_FAILED) || 'Content published, but design export failed. You can retry export manually.',
          timeout: 7000
        });
      }
    } else {
      // No Canva design, just show standard publish message
      $q.notify({
        type: 'positive',
        message: t(TRANSLATION_KEYS.CONTENT.ACTIONS.PUBLISH_SUCCESS) || 'Content published successfully'
      });
    }

    // Content will be updated automatically via the subscription
  } catch (error) {
    logger.error('Error publishing content:', error);
    $q.notify({
      type: 'negative',
      message: t(TRANSLATION_KEYS.CONTENT.ACTIONS.PUBLISH_ERROR) || 'Failed to publish content'
    });
  }
};

const archiveContent = async (contentId: string) => {
  try {
    await firebaseContentService.updateContentStatus(contentId, 'archived');

    $q.notify({
      type: 'positive',
      message: 'Content archived successfully'
    });

    // Content will be updated automatically via the subscription
  } catch (error) {
    logger.error('Error archiving content:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to archive content'
    });
  }
};

const unpublishContent = async (contentId: string) => {
  try {
    await firebaseContentService.updateContentStatus(contentId, 'draft');

    $q.notify({
      type: 'positive',
      message: 'Content unpublished successfully'
    });

    // Content will be updated automatically via the subscription
  } catch (error) {
    logger.error('Error unpublishing content:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to unpublish content'
    });
  }
};

const restoreContent = async (contentId: string) => {
  try {
    await firebaseContentService.updateContentStatus(contentId, 'draft');

    $q.notify({
      type: 'positive',
      message: 'Content restored from archive'
    });

    // Content will be updated automatically via the subscription
  } catch (error) {
    logger.error('Error restoring content:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to restore content'
    });
  }
};

const rejectContent = async (contentId: string) => {
  try {
    await firebaseContentService.updateContentStatus(contentId, 'rejected');

    $q.notify({
      type: 'positive',
      message: 'Content rejected successfully'
    });
  } catch (error) {
    logger.error('Error rejecting content:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to reject content'
    });
  }
};

const deleteContent = async (contentId: string) => {
  try {
    await firebaseContentService.updateContentStatus(contentId, 'deleted');

    $q.notify({
      type: 'positive',
      message: 'Content deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting content:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to delete content'
    });
  }
};

// Featured status is now handled through tags in ContentDoc architecture
const toggleFeaturedStatus = async (contentId: string, featured: boolean) => {
  try {
    // Get the current content to access its tags
    const content = allContent.value.find(item => item.id === contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    // Update tags array
    let updatedTags = [...content.tags];

    if (featured) {
      // Add featured tag if not present
      if (!updatedTags.includes('featured')) {
        updatedTags.push('featured');
      }
    } else {
      // Remove featured tag if present
      updatedTags = updatedTags.filter(tag => tag !== 'featured');
    }

    // Update the content tags
    await firebaseContentService.updateContentTags(contentId, updatedTags);

    $q.notify({
      type: 'positive',
      message: featured ? 'Content marked as featured' : 'Content unmarked as featured'
    });

    // Content will be updated automatically via the subscription
  } catch (error) {
    logger.error('Error toggling featured status:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update featured status'
    });
  }
};

const viewContent = (content: ContentDoc) => {
  selectedContentItem.value = content;
  showDetailDialog.value = true;
};

const archiveContentWithDialog = (content: ContentDoc) => {
  contentToReject.value = content;
  rejectionReason.value = '';
  showRejectDialog.value = true;
  showDetailDialog.value = false;
};

const confirmArchiveContent = async () => {
  if (contentToReject.value) {
    await archiveContent(contentToReject.value.id);
    showRejectDialog.value = false;
    contentToReject.value = null;
  }
};

const showBulkPublishDialog = () => {
  $q.dialog({
    title: 'Bulk Publish',
    message: `Are you sure you want to publish ${selectedContent.value.length} selected items?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    void Promise.all(selectedContent.value.map(contentId => publishContent(contentId)))
      .then(() => {
        selectedContent.value = [];
      });
  });
};

const showBulkArchiveDialog = () => {
  $q.dialog({
    title: 'Bulk Archive',
    message: `Are you sure you want to archive ${selectedContent.value.length} selected items?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    void Promise.all(selectedContent.value.map(contentId => archiveContent(contentId)))
      .then(() => {
        selectedContent.value = [];
      });
  });
};

// Canva Export Handlers
const handleExportForPrint = async (content: ContentDoc) => {
  logger.info('Export for print requested', { contentId: content.id, hasCanvaDesign: contentUtils.hasFeature(content, 'integ:canva') });

  if (!contentUtils.hasFeature(content, 'integ:canva')) {
    $q.notify({
      type: 'warning',
      message: t(TRANSLATION_KEYS.CANVA.EXPORT_FAILED) + ' - No Canva design attached'
    });
    return;
  }

  try {
    await exportDesignForPrint(content);
  } catch (error) {
    logger.error('Failed to handle export for print', { contentId: content.id, error });
  }
};

const handleDownloadDesign = (exportUrl: string, filename: string) => {
  logger.info('Design download requested', { exportUrl, filename });
  downloadDesign(exportUrl, filename);
};

// Canva Status Utility Functions (commented out as they're not currently used)
// const getCanvaStatusColor = (status: string): string => {
//   switch (status) {
//     case 'draft': return 'orange';
//     case 'pending_export': return 'blue';
//     case 'exported': return 'green';
//     case 'failed': return 'red';
//     default: return 'grey';
//   }
// };

// const getCanvaStatusLabel = (status: string): string => {
//   switch (status) {
//     case 'draft': return t(TRANSLATION_KEYS.CANVA.PROCESSING) || 'Draft';
//     case 'pending_export': return t(TRANSLATION_KEYS.CANVA.EXPORT_PENDING) || 'Pending Export';
//     case 'exported': return t(TRANSLATION_KEYS.CANVA.READY_FOR_DOWNLOAD) || 'Exported';
//     case 'failed': return 'Failed';
//     default: return status.toUpperCase();
//   }
// };


// Auto-refresh functionality
watch(autoRefresh, (newValue) => {
  if (newValue) {
    refreshInterval = window.setInterval(() => {
      void loadAllContent();
    }, 30000); // Refresh every 30 seconds
  } else if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
});

// Lifecycle
onMounted(() => {
  void loadAllContent();
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  // Cleanup content subscription
  const unsubscribe = (window as { contentManagementUnsubscribe?: () => void }).contentManagementUnsubscribe;
  if (unsubscribe) {
    unsubscribe();
  }
  // Cleanup Canva export polling
  cleanupCanvaExport();
});
</script>

<style scoped>
.q-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}
</style>
