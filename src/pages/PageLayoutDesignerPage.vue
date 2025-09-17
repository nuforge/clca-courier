<!--
  Page Layout Designer Page
  Dedicated page for managing newsletter page layouts and content arrangement
-->
<template>
  <q-page padding class="page-layout-designer">
    <!-- Page Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="row items-center">
          <q-btn
            flat
            round
            icon="mdi-arrow-left"
            @click="navigateBack"
            class="q-mr-md"
            :aria-label="$t('common.accessibility.navigateBack')"
          />
          <div>
            <h4 class="q-my-none">
              <q-icon name="mdi-view-dashboard" class="q-mr-sm" />
              {{ $t('pages.pageLayoutDesigner.title') || 'Page Layout Designer' }}
            </h4>
            <div class="text-body2 text-grey-6">
              {{ selectedIssue?.title }}
              <q-badge v-if="selectedIssue?.type === 'newsletter'" color="warning" class="q-ml-sm">
                {{ $t('common.readOnly') || 'Read-only' }}
              </q-badge>
              <q-badge v-else color="info" class="q-ml-sm">
                {{ selectedIssue?.submissions.length || 0 }} {{ $t('common.contentItems') || 'content items' }}
              </q-badge>
            </div>
          </div>
        </div>
      </div>
      <div class="col-auto">
        <q-btn-group>
          <q-btn
            color="positive"
            icon="mdi-eye"
            :label="$t('common.actions.previewNewsletter') || 'Preview Newsletter'"
            @click="previewNewsletter"
          />
          <q-btn
            color="primary"
            icon="mdi-content-save"
            :label="$t('common.actions.saveLayout') || 'Save Layout'"
            @click="handleSaveLayout"
          />
        </q-btn-group>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="row q-col-gutter-md full-height">
      <!-- Available Content & Content Library Panel -->
      <div class="col-12 col-lg-4 q-col-gutter-md">
      <!-- Available Content & Content Library Panel -->


    <IssueContentPanel />
        <AvailableContentPanel />
      </div>

      <!-- Page Preview Panel -->
      <div class="col-12 col-lg-5">
        <PagePreviewPanel />
      </div>

      <!-- Layout Controls Panel -->
      <div class="col-12 col-lg-3">
        <LayoutControlsPanel />
      </div>
    </div>

    <!-- Layout Preview Dialog -->
    <LayoutPreviewDialog />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { logger } from '../utils/logger';
import { usePageLayoutDesignerStore } from '../stores/page-layout-designer.store';
import { newsletterGenerationService } from '../services/newsletter-generation.service';
import type { NewsletterIssue } from '../stores/page-layout-designer.store';

// Component imports
import AvailableContentPanel from '../components/page-layout-designer/AvailableContentPanel.vue';
import IssueContentPanel from '../components/page-layout-designer/IssueContentPanel.vue';
import PagePreviewPanel from '../components/page-layout-designer/PagePreviewPanel.vue';
import LayoutControlsPanel from '../components/page-layout-designer/LayoutControlsPanel.vue';
import LayoutPreviewDialog from '../components/page-layout-designer/LayoutPreviewDialog.vue';

const route = useRoute();
const $q = useQuasar();
const { t } = useI18n();

const {
  selectedIssue,
  initializeWithIssue,
  navigateBack,
  saveLayout
} = usePageLayoutDesignerStore();

// Watch for changes to selectedIssue to ensure reactivity
watch(() => selectedIssue, (newIssue, oldIssue) => {
  console.log('🔧 PageLayoutDesignerPage - selectedIssue changed:', {
    oldIssue: oldIssue ? { id: oldIssue.id, title: oldIssue.title, submissions: oldIssue.submissions } : null,
    newIssue: newIssue ? { id: newIssue.id, title: newIssue.title, submissions: newIssue.submissions } : null
  });

  if (newIssue) {
    logger.info('Selected issue updated in page', {
      issueId: newIssue.id,
      title: newIssue.title,
      submissionsCount: newIssue.submissions.length
    });
  }
}, { deep: true, immediate: true });

// Load issue data and approved submissions
const loadIssueData = async () => {
  console.log('🚀 loadIssueData() called!', { routeParams: route.params });

  try {
    const issueId = route.params.issueId as string;
    logger.debug('[PAGE] Loading issue data', { issueId, routeParams: route.params });
    if (!issueId) {
      $q.notify({
        type: 'negative',
        message: t('errors.noIssueSelected') || 'No issue selected'
      });
      void navigateBack();
      return;
    }

    // Load the specific issue
    const issues = await newsletterGenerationService.getIssues();
    const issue = issues.find(i => i.id === issueId) as NewsletterIssue | undefined;

    if (!issue) {
      $q.notify({
        type: 'negative',
        message: t('errors.issueNotFound') || 'Issue not found'
      });
      void navigateBack();
      return;
    }

    // Load approved submissions
    const submissions = await newsletterGenerationService.getApprovedSubmissions();

    // Initialize the designer with the issue data
    await initializeWithIssue(issue, submissions);

    logger.info('Page layout designer loaded', {
      issueId: issue.id,
      submissionsCount: submissions.length
    });

  } catch (error) {
    logger.error('Failed to load issue data:', error);
    $q.notify({
      type: 'negative',
      message: t('errors.failedToLoadIssue') || 'Failed to load issue data'
    });
    void navigateBack();
  }
};

const previewNewsletter = () => {
  if (!selectedIssue) {
    $q.notify({
      type: 'warning',
      message: t('notifications.noIssueSelected') || 'No issue selected for preview'
    });
    return;
  }

  // Check if there's a PDF available first
  const pdfUrl = selectedIssue.finalPdfUrl || selectedIssue.downloadUrl;
  if (pdfUrl) {
    // If PDF exists, open it in new tab
    window.open(pdfUrl, '_blank');
    $q.notify({
      type: 'positive',
      message: t('notifications.newsletterPdfOpened', { title: selectedIssue.title }) ||
               `Newsletter PDF opened: ${selectedIssue.title}`
    });
  } else {
    // If no PDF, show layout preview dialog
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
    // Layout was saved successfully
    // Could emit event or perform additional actions here
    logger.info('Layout saved from page', { layoutData: result });
  }
};


// Lifecycle
onMounted(() => {
  void loadIssueData();
});

onUnmounted(() => {
  logger.debug('Page layout designer unmounted');
});

// SEO and metadata handled by Quasar routing
</script>

<style scoped>
.page-layout-designer {
  min-height: calc(100vh - 100px);
}


/* Responsive adjustments */
@media (max-width: 1023px) {
  .full-height {
    min-height: auto;
  }
}

/* Focus management for accessibility */
.page-layout-designer:focus-within {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

/* Dark mode adjustments */
.body--dark .page-layout-designer {
  background-color: var(--q-dark-page);
}
</style>
