<!--
  Layout Controls Panel
  Panel for managing page layout controls and actions
-->
<template>
  <div class="layout-controls-panel">
    <q-card flat bordered class="full-height">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="mdi-cog" class="q-mr-sm" />
          {{ $t('pages.newsletterManagement.layoutControls') || 'Layout Controls' }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <!-- Page Management -->
        <div class="control-group q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">{{ $t('common.pages') || 'Pages' }}</div>
          <q-btn-group class="full-width">
            <q-btn
              outline
              icon="mdi-plus"
              :label="$t('common.actions.addPage') || 'Add Page'"
              @click="addPage"
              class="col"
            />
            <q-btn
              outline
              icon="mdi-minus"
              @click="removePage"
              :disable="pages.length <= 1"
              :aria-label="$t('actions.removePage') || 'Remove Page'"
            />
          </q-btn-group>
          <div class="text-caption text-grey-6 q-mt-xs">
            {{ pages.length }} {{ pages.length !== 1 ? ($t('common.pages') || 'pages') : ($t('common.page') || 'page') }}
          </div>
        </div>

        <!-- Template Settings -->
        <div class="control-group q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">{{ $t('common.layout') || 'Layout' }}</div>
          <q-select
            v-model="currentTemplate"
            :options="templateOptions"
            :label="$t('common.templateStyle') || 'Template Style'"
            filled
            dense
            emit-value
            map-options
            @update:model-value="changeTemplate"
          />
          <div class="text-caption text-grey-6 q-mt-xs">
            {{ getTemplateDescription(currentTemplate) }}
          </div>
        </div>

        <!-- Content Flow -->
        <div class="control-group q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">
            {{ $t('pages.newsletterManagement.contentFlow') || 'Content Flow' }}
          </div>
          <q-btn
            outline
            icon="mdi-auto-fix"
            :label="$t('common.actions.autoArrangeContent') || 'Auto-arrange Content'"
            @click="autoArrangeContent"
            class="full-width q-mb-xs"
            :disable="!selectedIssue || selectedIssue.submissions.length === 0"
          />
          <q-btn
            outline
            icon="mdi-refresh"
            :label="$t('common.actions.clearAllPages') || 'Clear All Pages'"
            @click="clearAllPages"
            class="full-width"
            color="warning"
          />
        </div>

        <!-- Content Statistics -->
        <div class="control-group q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">{{ $t('content.statistics') || 'Content Statistics' }}</div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ issueContent.length }}</div>
              <div class="stat-label">{{ $t('content.totalContent') || 'Total Content' }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ contentInLayoutCount }}</div>
              <div class="stat-label">{{ $t('content.inLayout') || 'In Layout' }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ availableAreasCount }}</div>
              <div class="stat-label">{{ $t('content.availableAreas') || 'Available Areas' }}</div>
            </div>
          </div>
        </div>

        <!-- Template Preview Actions -->
        <div class="control-group">
          <div class="text-subtitle2 q-mb-sm">{{ $t('common.preview') || 'Preview' }}</div>
          <q-btn
            color="positive"
            icon="mdi-eye"
            :label="$t('common.actions.previewNewsletter') || 'Preview Newsletter'"
            @click="handlePreviewNewsletter"
            class="full-width q-mb-xs"
          />
          <q-btn
            color="primary"
            icon="mdi-content-save"
            :label="$t('common.actions.saveLayout') || 'Save Layout'"
            @click="handleSaveLayout"
            class="full-width"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { usePageLayoutDesigner } from '../../composables/usePageLayoutDesigner';

const $q = useQuasar();
const { t } = useI18n();

const {
  selectedIssue,
  currentTemplate,
  pages,
  contentAreas,
  templateOptions,
  issueContent,
  showLayoutPreview,
  addPage,
  removePage,
  changeTemplate,
  autoArrangeContent,
  clearAllPages,
  saveLayout
} = usePageLayoutDesigner();

// Computed statistics
const contentInLayoutCount = computed(() => {
  return contentAreas.value.filter(area => area.contentId !== null).length;
});

const availableAreasCount = computed(() => {
  return contentAreas.value.filter(area => area.contentId === null).length;
});

// Get template description
const getTemplateDescription = (templateValue: string): string => {
  const template = templateOptions.find(t => t.value === templateValue);
  return template?.description || '';
};

// Event handlers
const handlePreviewNewsletter = () => {
  if (!selectedIssue.value) {
    $q.notify({
      type: 'warning',
      message: t('notifications.noIssueSelected') || 'No issue selected for preview'
    });
    return;
  }

  // Check if there's a PDF available first
  const pdfUrl = selectedIssue.value.finalPdfUrl || selectedIssue.value.downloadUrl;
  if (pdfUrl) {
    // If PDF exists, open it in new tab
    window.open(pdfUrl, '_blank');
    $q.notify({
      type: 'positive',
      message: t('notifications.newsletterPdfOpened', { title: selectedIssue.value.title }) ||
               `Newsletter PDF opened: ${selectedIssue.value.title}`
    });
  } else {
    // If no PDF, show layout preview dialog
    showLayoutPreview.value = true;
    $q.notify({
      type: 'info',
      message: t('notifications.showingLayoutPreview') || 'Showing layout preview (no PDF available yet)',
      caption: t('notifications.generatePdfHint') || 'Generate PDF to create a printable version'
    });
  }
};

const handleSaveLayout = () => {
  const result = saveLayout();
  if (result) {
    // Could emit event for parent component to handle
    // For now, the composable handles the notifications
  }
};
</script>

<style scoped>
.layout-controls-panel {
  height: 100%;
}

.control-group {
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  padding: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(25, 118, 210, 0.05);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--q-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--q-secondary);
  margin-top: 4px;
}

/* Button styling improvements */
.q-btn-group .q-btn {
  font-size: 0.875rem;
}

.q-select {
  margin-bottom: 8px;
}

/* Dark mode adjustments */
.q-dark .control-group {
  background-color: rgba(255, 255, 255, 0.05);
}

.q-dark .stat-item {
  background-color: rgba(100, 181, 246, 0.1);
}

/* Responsive adjustments for smaller screens */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .stat-item {
    padding: 12px;
  }

  .control-group {
    padding: 12px;
    margin-bottom: 1rem;
  }
}

/* Focus and accessibility improvements */
.q-btn:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.q-select:focus-within {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

/* Enhanced button states */
.q-btn[disabled] {
  opacity: 0.6;
}

.q-btn:not([disabled]):hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.q-btn:not([disabled]):active {
  transform: translateY(0);
}
</style>
