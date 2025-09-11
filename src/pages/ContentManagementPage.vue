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
            <div class="col-12 col-md-3">
              <q-card class="text-center">
                <q-card-section>
                  <q-icon :name="getStatusIcon('pending').icon" :color="getStatusIcon('pending').color" size="md" class="q-mb-sm" />
                  <div class="text-h6 text-orange">{{ pendingContent.length }}</div>
                  <div class="text-caption">{{ t(TRANSLATION_KEYS.CONTENT.STATUS.PENDING) }}</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-3">
              <q-card class="text-center">
                <q-card-section>
                  <q-icon :name="getStatusIcon('approved').icon" :color="getStatusIcon('approved').color" size="md" class="q-mb-sm" />
                  <div class="text-h6 text-green">{{ approvedContent.length }}</div>
                  <div class="text-caption">{{ t(TRANSLATION_KEYS.CONTENT.STATUS.APPROVED) }}</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-3">
              <q-card class="text-center">
                <q-card-section>
                  <q-icon :name="getStatusIcon('published').icon" :color="getStatusIcon('published').color" size="md" class="q-mb-sm" />
                  <div class="text-h6 text-blue">{{ publishedContent.length }}</div>
                  <div class="text-caption">{{ t(TRANSLATION_KEYS.CONTENT.STATUS.PUBLISHED) }}</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-3">
              <q-card class="text-center">
                <q-card-section>
                  <q-icon :name="getStatusIcon('rejected').icon" :color="getStatusIcon('rejected').color" size="md" class="q-mb-sm" />
                  <div class="text-h6 text-red">{{ rejectedContent.length }}</div>
                  <div class="text-caption">Rejected</div>
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
                  <q-btn color="positive" :icon="UI_ICONS.checkAll" label="Bulk Approve" @click="showBulkApproveDialog"
                    :disable="selectedContent.length === 0" />
                </div>
                <div class="col-auto">
                  <q-btn color="negative" :icon="UI_ICONS.rejectAll" label="Bulk Reject"
                    @click="showBulkRejectDialog" :disable="selectedContent.length === 0" outline />
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
              <q-tab name="pending">
                <q-icon :name="getStatusIcon('pending').icon" :color="getStatusIcon('pending').color" class="q-mr-sm" />
                {{ t(TRANSLATION_KEYS.CONTENT.STATUS.PENDING) }} ({{ pendingContent.length }})
              </q-tab>
              <q-tab name="approved">
                <q-icon :name="getStatusIcon('approved').icon" :color="getStatusIcon('approved').color" class="q-mr-sm" />
                {{ t(TRANSLATION_KEYS.CONTENT.STATUS.APPROVED) }} ({{ approvedContent.length }})
              </q-tab>
              <q-tab name="published">
                <q-icon :name="getStatusIcon('published').icon" :color="getStatusIcon('published').color" class="q-mr-sm" />
                {{ t(TRANSLATION_KEYS.CONTENT.STATUS.PUBLISHED) }} ({{ publishedContent.length }})
              </q-tab>
              <q-tab name="rejected">
                <q-icon :name="getStatusIcon('rejected').icon" :color="getStatusIcon('rejected').color" class="q-mr-sm" />
                {{ t(TRANSLATION_KEYS.CONTENT.STATUS.REJECTED) }} ({{ rejectedContent.length }})
              </q-tab>
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="activeTab" animated>
              <!-- Pending Content -->
              <q-tab-panel name="pending">
                <ContentTable :content="pendingContent" :selected="selectedContent"
                  @update:selected="selectedContent = $event" @approve="approveContent" @reject="rejectContent"
                  @view="viewContent" @toggle-featured="toggleFeaturedStatus"
                  :show-canva-export="true" :is-exporting-content="isExporting"
                  @export-for-print="handleExportForPrint" @download-design="handleDownloadDesign"
                  show-actions />
              </q-tab-panel>

              <!-- Approved Content -->
              <q-tab-panel name="approved">
                <ContentTable :content="approvedContent" :selected="selectedContent"
                  @update:selected="selectedContent = $event" @publish="publishContent" @unpublish="unpublishContent"
                  @view="viewContent" @toggle-featured="toggleFeaturedStatus"
                  :show-canva-export="true" :is-exporting-content="isExporting"
                  @export-for-print="handleExportForPrint" @download-design="handleDownloadDesign"
                  show-publish-actions />
              </q-tab-panel>

              <!-- Published Content -->
              <q-tab-panel name="published">
                <ContentTable :content="publishedContent" :selected="selectedContent"
                  @update:selected="selectedContent = $event" @unpublish="unpublishContent" @view="viewContent"
                  @toggle-featured="toggleFeaturedStatus"
                  :show-canva-export="true" :is-exporting-content="isExporting"
                  @export-for-print="handleExportForPrint" @download-design="handleDownloadDesign"
                  show-unpublish-actions />
              </q-tab-panel>

              <!-- Rejected Content -->
              <q-tab-panel name="rejected">
                <ContentTable :content="rejectedContent" :selected="selectedContent"
                  @update:selected="selectedContent = $event" @reconsider="reconsiderContent" @view="viewContent"
                  @toggle-featured="toggleFeaturedStatus"
                  :show-canva-export="true" :is-exporting-content="isExporting"
                  @export-for-print="handleExportForPrint" @download-design="handleDownloadDesign"
                  show-reconsider-actions />
              </q-tab-panel>
            </q-tab-panels>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Content Detail Dialog -->
    <q-dialog v-model="showDetailDialog" position="right" full-height>
      <q-card style="width: 600px; max-width: 90vw;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedContentItem?.title }}</div>
          <q-space />
          <q-btn :icon="UI_ICONS.close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedContentItem">
          <div class="q-mb-md">
            <q-badge :color="getStatusIcon(selectedContentItem.status).color"
              :label="selectedContentItem.status.toUpperCase()" />
            <q-badge color="grey" :label="selectedContentItem.type.toUpperCase()" class="q-ml-sm" />
            <q-badge v-if="selectedContentItem.featured" color="orange" label="FEATURED" class="q-ml-sm" />
          </div>

          <div class="text-body2 q-mb-md">
            <strong>{{ t(TRANSLATION_KEYS.FORMS.AUTHOR) || 'Author' }}:</strong> {{ selectedContentItem.authorName }} ({{
              selectedContentItem.authorEmail }})<br>
            <strong>{{ t(TRANSLATION_KEYS.CONTENT.SUBMITTED) || 'Submitted' }}:</strong> {{ formatDateTime(selectedContentItem.submissionDate, 'LONG_WITH_TIME') }}<br>
            <strong>{{ t(TRANSLATION_KEYS.FORMS.TAGS) }}:</strong> {{ selectedContentItem.tags.join(', ') || t(TRANSLATION_KEYS.COMMON.NONE) || 'None' }}
          </div>

          <q-separator class="q-my-md" />

          <div class="text-h6 q-mb-sm">{{ t(TRANSLATION_KEYS.FORMS.CONTENT) }}</div>
          <div class="text-body1 q-mb-md" style="white-space: pre-line;">{{ selectedContentItem.content }}
          </div>

          <div v-if="selectedContentItem.attachments.length > 0">
            <div class="text-h6 q-mb-sm">{{ t(TRANSLATION_KEYS.CONTENT.ATTACHMENTS) || 'Attachments' }}</div>
            <q-list dense>
              <q-item v-for="attachment in selectedContentItem.attachments" :key="attachment.filename">
                <q-item-section avatar>
                  <q-icon name="attachment" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ attachment.filename }}</q-item-label>
                  <q-item-label caption>{{ formatFileSize(attachment.fileSize) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat round :icon="UI_ICONS.download" @click="downloadAttachment(attachment)" />
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Canva Design Section -->
          <div v-if="selectedContentItem.canvaDesign">
            <q-separator class="q-my-md" />
            <div class="text-h6 q-mb-sm">{{ t(TRANSLATION_KEYS.CANVA.CREATE_DESIGN) || 'Canva Design' }}</div>
            <q-card flat bordered class="q-mb-md">
              <q-card-section>
                <div class="row items-center q-gutter-md">
                  <div class="col-auto">
                    <q-badge
                      :color="getCanvaStatusColor(selectedContentItem.canvaDesign.status)"
                      :label="getCanvaStatusLabel(selectedContentItem.canvaDesign.status)"
                    />
                  </div>
                  <div class="col">
                    <div class="text-body2">
                      <strong>Design ID:</strong> {{ selectedContentItem.canvaDesign.id }}
                    </div>
                    <div v-if="selectedContentItem.canvaDesign.exportUrl" class="text-body2">
                      <strong>Export Ready:</strong> Yes
                    </div>
                  </div>
                  <div class="col-auto">
                    <div class="row q-gutter-xs">
                      <!-- Edit in Canva -->
                      <q-btn
                        v-if="selectedContentItem.canvaDesign.editUrl"
                        flat
                        round
                        icon="edit"
                        color="primary"
                        @click="openCanvaDesign(selectedContentItem.canvaDesign.editUrl)"
                      >
                        <q-tooltip>{{ t(TRANSLATION_KEYS.CANVA.EDIT_IN_CANVA) }}</q-tooltip>
                      </q-btn>

                      <!-- Export for Print -->
                      <q-btn
                        v-if="selectedContentItem.canvaDesign.status === 'draft' || selectedContentItem.canvaDesign.status === 'exported'"
                        flat
                        round
                        icon="print"
                        color="purple"
                        @click="handleExportForPrint(selectedContentItem)"
                        :loading="isExporting(selectedContentItem.id)"
                        :disable="isExporting(selectedContentItem.id)"
                      >
                        <q-tooltip>{{ t(TRANSLATION_KEYS.CANVA.EXPORT_FOR_PRINT) }}</q-tooltip>
                      </q-btn>

                      <!-- Download Design -->
                      <q-btn
                        v-if="selectedContentItem.canvaDesign.status === 'exported' && selectedContentItem.canvaDesign.exportUrl"
                        flat
                        round
                        icon="download"
                        color="green"
                        @click="handleDownloadDesign(selectedContentItem.canvaDesign.exportUrl, `design-${selectedContentItem.canvaDesign.id}.pdf`)"
                      >
                        <q-tooltip>{{ t(TRANSLATION_KEYS.CANVA.DOWNLOAD_DESIGN) }}</q-tooltip>
                      </q-btn>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div v-if="selectedContentItem.reviewNotes">
            <q-separator class="q-my-md" />
            <div class="text-h6 q-mb-sm">{{ t(TRANSLATION_KEYS.CONTENT.REVIEW_NOTES) || 'Review Notes' }}</div>
            <div class="text-body2">{{ selectedContentItem.reviewNotes }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right" v-if="selectedContentItem?.status === 'pending'">
          <q-btn flat :label="t(TRANSLATION_KEYS.CONTENT.ACTIONS.REJECT)" color="negative" @click="rejectContentWithDialog(selectedContentItem)" />
          <q-btn :label="t(TRANSLATION_KEYS.CONTENT.ACTIONS.APPROVE)" color="positive" @click="approveContent(selectedContentItem.id)" />
        </q-card-actions>

        <q-card-actions align="right" v-if="selectedContentItem?.status === 'published'">
          <q-toggle :model-value="selectedContentItem.featured || false"
            @update:model-value="(value: boolean) => selectedContentItem && toggleFeaturedStatus(selectedContentItem.id, value)"
            color="orange" :label="t(TRANSLATION_KEYS.FORMS.FEATURED)" />
          <q-space />
          <q-btn flat :label="t(TRANSLATION_KEYS.CONTENT.ACTIONS.UNPUBLISH)" color="orange"
            @click="selectedContentItem && unpublishContent(selectedContentItem.id)" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Rejection Reason Dialog -->
    <q-dialog v-model="showRejectDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ t(TRANSLATION_KEYS.CONTENT.REJECT_CONTENT) || 'Reject Content' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input v-model="rejectionReason" :label="t(TRANSLATION_KEYS.CONTENT.REJECTION_REASON) || 'Reason for rejection (optional)'" type="textarea" rows="3"
            outlined />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="t(TRANSLATION_KEYS.COMMON.CANCEL)" @click="showRejectDialog = false" />
          <q-btn :label="t(TRANSLATION_KEYS.CONTENT.ACTIONS.REJECT)" color="negative" @click="confirmRejectContent" />
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
import { firestoreService } from '../services/firebase-firestore.service';
import type { UserContent } from '../services/firebase-firestore.service';
import { logger } from '../utils/logger';
import { formatDateTime } from '../utils/date-formatter';
import ContentTable from '../components/content-management/ContentTable.vue';
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
const allContent = ref<UserContent[]>([]);
const selectedContent = ref<string[]>([]);
const activeTab = ref('pending');

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
const selectedContentItem = ref<UserContent | null>(null);
const showRejectDialog = ref(false);
const rejectionReason = ref('');
const contentToReject = ref<UserContent | null>(null);

// Computed
const pendingContent = computed(() =>
  allContent.value.filter(item => item.status === 'pending')
);

const approvedContent = computed(() =>
  allContent.value.filter(item => item.status === 'approved')
);

const publishedContent = computed(() =>
  allContent.value.filter(item => item.status === 'published')
);

const rejectedContent = computed(() =>
  allContent.value.filter(item => item.status === 'rejected')
);

// Methods
const loadAllContent = async () => {
  isLoading.value = true;
  try {
    // Load pending content
    const pending = await firestoreService.getPendingContent();
    // Load approved content
    const approved = await firestoreService.getApprovedContent();

    allContent.value = [...pending, ...approved];
    selectedContent.value = [];

    logger.success(`Loaded ${allContent.value.length} content items`);
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

const approveContent = async (contentId: string) => {
  try {
    await firestoreService.updateContentStatus(contentId, 'approved');

    $q.notify({
      type: 'positive',
      message: 'Content approved successfully'
    });

    await loadAllContent();
  } catch (error) {
    logger.error('Error approving content:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to approve content'
    });
  }
};

const rejectContent = async (contentId: string, reason?: string) => {
  try {
    await firestoreService.updateContentStatus(contentId, 'rejected', reason);

    $q.notify({
      type: 'positive',
      message: 'Content rejected successfully'
    });

    await loadAllContent();
  } catch (error) {
    logger.error('Error rejecting content:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to reject content'
    });
  }
};

const publishContent = async (contentId: string) => {
  try {
    await firestoreService.updateContentStatus(contentId, 'published');

    $q.notify({
      type: 'positive',
      message: 'Content published successfully'
    });

    await loadAllContent();
  } catch (error) {
    logger.error('Error publishing content:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to publish content'
    });
  }
};

const unpublishContent = async (contentId: string) => {
  try {
    await firestoreService.updateContentStatus(contentId, 'approved');

    $q.notify({
      type: 'positive',
      message: 'Content unpublished successfully'
    });

    await loadAllContent();
  } catch (error) {
    logger.error('Error unpublishing content:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to unpublish content'
    });
  }
};

const reconsiderContent = async (contentId: string) => {
  try {
    await firestoreService.updateContentStatus(contentId, 'pending');

    $q.notify({
      type: 'positive',
      message: 'Content moved back to pending for reconsideration'
    });

    await loadAllContent();
  } catch (error) {
    logger.error('Error reconsidering content:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to reconsider content'
    });
  }
};

const toggleFeaturedStatus = async (contentId: string, featured: boolean) => {
  try {
    await firestoreService.updateContentFeaturedStatus(contentId, featured);

    $q.notify({
      type: 'positive',
      message: featured ? 'Content marked as featured' : 'Content unmarked as featured'
    });

    await loadAllContent();
  } catch (error) {
    logger.error('Error toggling featured status:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update featured status'
    });
  }
};

const viewContent = (content: UserContent) => {
  selectedContentItem.value = content;
  showDetailDialog.value = true;
};

const rejectContentWithDialog = (content: UserContent) => {
  contentToReject.value = content;
  rejectionReason.value = '';
  showRejectDialog.value = true;
  showDetailDialog.value = false;
};

const confirmRejectContent = async () => {
  if (contentToReject.value) {
    await rejectContent(contentToReject.value.id, rejectionReason.value || undefined);
    showRejectDialog.value = false;
    contentToReject.value = null;
  }
};

const showBulkApproveDialog = () => {
  $q.dialog({
    title: 'Bulk Approve',
    message: `Are you sure you want to approve ${selectedContent.value.length} selected items?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    void Promise.all(selectedContent.value.map(contentId => approveContent(contentId)))
      .then(() => {
        selectedContent.value = [];
      });
  });
};

const showBulkRejectDialog = () => {
  $q.dialog({
    title: 'Bulk Reject',
    message: `Are you sure you want to reject ${selectedContent.value.length} selected items?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    void Promise.all(selectedContent.value.map(contentId => rejectContent(contentId)))
      .then(() => {
        selectedContent.value = [];
      });
  });
};

// Canva Export Handlers
const handleExportForPrint = async (content: UserContent) => {
  logger.info('Export for print requested', { contentId: content.id, hasCanvaDesign: !!content.canvaDesign });

  if (!content.canvaDesign) {
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

// Canva Status Utility Functions
const getCanvaStatusColor = (status: string): string => {
  switch (status) {
    case 'draft': return 'orange';
    case 'pending_export': return 'blue';
    case 'exported': return 'green';
    case 'failed': return 'red';
    default: return 'grey';
  }
};

const getCanvaStatusLabel = (status: string): string => {
  switch (status) {
    case 'draft': return t(TRANSLATION_KEYS.CANVA.PROCESSING) || 'Draft';
    case 'pending_export': return t(TRANSLATION_KEYS.CANVA.EXPORT_PENDING) || 'Pending Export';
    case 'exported': return t(TRANSLATION_KEYS.CANVA.READY_FOR_DOWNLOAD) || 'Exported';
    case 'failed': return 'Failed';
    default: return status.toUpperCase();
  }
};

const openCanvaDesign = (editUrl: string) => {
  logger.info('Opening Canva design in new tab', { editUrl });
  window.open(editUrl, '_blank', 'noopener,noreferrer');
};

// Utility functions
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const downloadAttachment = (attachment: { downloadUrl: string; filename: string }) => {
  const link = document.createElement('a');
  link.href = attachment.downloadUrl;
  link.download = attachment.filename;
  link.click();
};

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
  // Cleanup Canva export polling
  cleanupCanvaExport();
});
</script>

<style scoped>
.q-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}
</style>
