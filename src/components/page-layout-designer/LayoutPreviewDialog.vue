<!--
  Layout Preview Dialog
  Full-screen preview dialog for newsletter layout
-->
<template>
  <q-dialog
    v-model="showLayoutPreview"
    maximized
    no-backdrop-dismiss
    no-esc-dismiss
  >
    <q-card
      role="dialog"
      aria-labelledby="layout-preview-title"
      aria-describedby="layout-preview-description"
    >
      <q-card-section class="row items-center q-pb-none">
        <div id="layout-preview-title" class="text-h6">
          <q-icon name="mdi-eye" class="q-mr-sm" />
          {{ $t('pages.pageLayoutDesigner.layoutPreview') || 'Layout Preview' }} - {{ selectedIssue?.title }}
        </div>
        <q-space />
        <q-btn
          icon="close"
          flat
          round
          dense
          v-close-popup
          :aria-label="$t('common.accessibility.closeDialog')"
        />
      </q-card-section>

      <q-card-section id="layout-preview-description" class="full-height">
        <div class="layout-preview-container">
          <div class="preview-newsletter">
            <!-- Newsletter Header -->
            <div class="preview-header">
              <div class="preview-title">{{ selectedIssue?.title }}</div>
              <div class="preview-date">
                {{ formatDate(selectedIssue?.publicationDate || new Date(), 'LONG') }}
              </div>
            </div>

            <!-- Content Areas Preview -->
            <div class="preview-content-areas">
              <div
                v-for="(area, index) in contentAreas"
                :key="index"
                class="preview-content-area"
                :class="`size-${area.size}`"
              >
                <div v-if="area.contentId" class="preview-content-item">
                  <div class="preview-content-header">
                    <q-icon
                      :name="getSubmissionIcon(area.contentId).icon"
                      :color="getSubmissionIcon(area.contentId).color"
                      size="sm"
                      class="q-mr-xs"
                    />
                    <span class="preview-content-type">{{ getSubmissionIcon(area.contentId).label }}</span>
                  </div>
                  <div class="preview-content-title">{{ getSubmissionTitle(area.contentId) }}</div>
                  <div class="preview-content-preview">
                    {{ getSubmissionPreview(area.contentId) }}
                  </div>
                </div>
                <div v-else class="preview-empty-area">
                  <q-icon name="mdi-plus-circle-outline" size="2rem" color="grey-5" />
                  <div class="text-caption text-grey-6">
                    {{ $t('content.emptyContentArea') || 'Empty content area' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Newsletter Footer -->
            <div class="preview-footer">
              <div class="preview-page-number">{{ $t('common.page') || 'Page' }} 1</div>
              <div class="preview-template-info">
                {{ $t('common.template') || 'Template' }}: {{ getTemplateLabel(currentTemplate) }}
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          :label="$t('common.close') || 'Close'"
          v-close-popup
        />
        <q-btn
          color="primary"
          :label="$t('actions.generatePdf') || 'Generate PDF'"
          icon="mdi-file-pdf-box"
          @click="generatePdfFromLayout"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { usePageLayoutDesigner } from '../../composables/usePageLayoutDesigner';

const $q = useQuasar();
const { t } = useI18n();

const {
  selectedIssue,
  contentAreas,
  currentTemplate,
  templateOptions,
  showLayoutPreview,
  getSubmissionTitle,
  getSubmissionIcon,
  getSubmissionPreview,
  formatDate
} = usePageLayoutDesigner();

// Computed properties
const getTemplateLabel = computed(() => (templateValue: string) => {
  const template = templateOptions.find(t => t.value === templateValue);
  return template?.label || templateValue;
});

// Focus management for accessibility
const focusFirstElement = async () => {
  await nextTick();
  const firstFocusable = document.querySelector('[role="dialog"] button, [role="dialog"] input, [role="dialog"] select, [role="dialog"] textarea, [role="dialog"] [tabindex]:not([tabindex="-1"])') as HTMLElement;
  if (firstFocusable) {
    firstFocusable.focus();
  }
};

// Generate PDF from current layout
const generatePdfFromLayout = () => {
  if (!selectedIssue.value) return;

  // Close the preview dialog
  showLayoutPreview.value = false;

  // Create layout data for PDF generation
  const layoutData = {
    template: currentTemplate.value,
    contentAreas: contentAreas.value.map(area => ({
      id: area.id,
      contentId: area.contentId,
      size: area.size
    }))
  };

  // Here you would typically emit an event to the parent or call a service
  // For now, show a notification
  $q.notify({
    type: 'info',
    message: t('notifications.pdfGenerationInitiated') || 'PDF generation initiated',
    caption: t('notifications.pdfGenerationHint') || 'This will create a PDF from the current layout'
  });

  // Log the layout data for debugging
  console.log('PDF generation requested with layout:', layoutData);
};

// Watch for dialog state changes to manage focus
watch(showLayoutPreview, (newValue) => {
  if (newValue) {
    void focusFirstElement();
  }
});
</script>

<style scoped>
/* Layout Preview Styles */
.layout-preview-container {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  min-height: 600px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.preview-newsletter {
  background: white;
  border-radius: 4px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-height: 700px;
  max-width: 500px;
  width: 100%;
  position: relative;
}

.preview-header {
  text-align: center;
  border-bottom: 3px solid #1976d2;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.preview-title {
  font-size: 24px;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 8px;
}

.preview-date {
  font-size: 14px;
  color: #666;
  font-style: italic;
}

.preview-content-areas {
  display: grid;
  gap: 20px;
  margin-bottom: 30px;
}

.preview-content-area {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  min-height: 120px;
  transition: all 0.3s ease;
}

.preview-content-area.size-large {
  grid-column: 1 / -1;
  min-height: 200px;
}

.preview-content-area.size-medium {
  min-height: 150px;
}

.preview-content-area.size-small {
  min-height: 100px;
}

.preview-content-area.size-full {
  grid-column: 1 / -1;
  min-height: 250px;
}

.preview-content-area.size-header {
  grid-column: 1 / -1;
  min-height: 80px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
}

.preview-content-area.size-calendar {
  min-height: 200px;
  background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%);
}

.preview-content-area.size-details {
  min-height: 150px;
}

.preview-content-item {
  height: 100%;
}

.preview-content-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: bold;
  color: #666;
}

.preview-content-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.3;
}

.preview-content-preview {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.preview-empty-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  border: 2px dashed #ddd;
  border-radius: 8px;
}

.preview-footer {
  position: absolute;
  bottom: 20px;
  left: 30px;
  right: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e0e0e0;
  padding-top: 15px;
}

.preview-page-number {
  font-size: 12px;
  color: #666;
  font-weight: bold;
}

.preview-template-info {
  font-size: 11px;
  color: #999;
  font-style: italic;
}

/* Dark mode adjustments */
.q-dark .layout-preview-container {
  background: #2a2a2a;
}

.q-dark .preview-newsletter {
  background: #1e1e1e;
  color: white;
}

.q-dark .preview-content-area {
  border-color: #555;
}

.q-dark .preview-content-title {
  color: white;
}

.q-dark .preview-content-preview {
  color: #ccc;
}

.q-dark .preview-empty-area {
  border-color: #555;
  color: #999;
}

/* Accessibility improvements */
.q-dialog__backdrop {
  pointer-events: none !important;
}

.q-dialog__backdrop:focus {
  outline: none !important;
}

/* Ensure dialog content is focusable */
[role="dialog"] {
  outline: none;
}

[role="dialog"]:focus-within {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .preview-newsletter {
    padding: 20px;
    margin: 10px;
  }

  .preview-title {
    font-size: 20px;
  }

  .preview-content-areas {
    gap: 15px;
  }

  .preview-content-area {
    padding: 15px;
    min-height: 100px;
  }

  .preview-content-area.size-large {
    min-height: 150px;
  }
}
</style>
