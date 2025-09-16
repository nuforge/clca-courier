<!--
  Content Debug Panel
  Development tool for debugging content loading and filtering issues
-->
<template>
  <q-card v-if="showDebugPanel" flat bordered class="content-debug-panel q-mb-md">
    <q-card-section>
      <div class="row items-center">
        <div class="text-h6">
          <q-icon name="mdi-bug" class="q-mr-sm" />
          {{ $t('debug.contentDebugging') || 'Content Debugging' }}
        </div>
        <q-space />
        <q-btn
          flat
          dense
          icon="mdi-close"
          @click="showDebugPanel = false"
          :aria-label="$t('common.close')"
        />
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <!-- Content Loading Summary -->
      <div class="debug-section q-mb-md">
        <div class="text-subtitle2 q-mb-sm">
          <q-icon name="mdi-database" class="q-mr-xs" />
          {{ $t('debug.contentLoadingSummary') || 'Content Loading Summary' }}
        </div>
        <div class="debug-stats">
          <q-chip dense color="primary" text-color="white">
            {{ $t('debug.totalLoaded') || 'Total Loaded' }}: {{ approvedSubmissions.length }}
          </q-chip>
          <q-chip dense color="positive" text-color="white">
            {{ $t('debug.availableNow') || 'Available Now' }}: {{ availableContent.length }}
          </q-chip>
          <q-chip dense color="info" text-color="white">
            {{ $t('debug.inIssue') || 'In Issue' }}: {{ issueContent.length }}
          </q-chip>
          <q-chip dense color="warning" text-color="white">
            {{ $t('debug.filtered') || 'Filtered Out' }}: {{ filteredOutCount }}
          </q-chip>
        </div>
      </div>

      <!-- Filter Status -->
      <div class="debug-section q-mb-md">
        <div class="text-subtitle2 q-mb-sm">
          <q-icon name="mdi-filter" class="q-mr-xs" />
          {{ $t('debug.currentFilters') || 'Current Filters' }}
        </div>
        <div class="debug-filters">
          <q-chip
            dense
            :color="selectedContentStatus === 'all' ? 'grey' : 'secondary'"
            text-color="white"
          >
            {{ $t('debug.status') || 'Status' }}: {{ selectedContentStatus }}
          </q-chip>
          <q-chip
            v-if="contentSearchQuery"
            dense
            color="secondary"
            text-color="white"
          >
            {{ $t('debug.search') || 'Search' }}: "{{ contentSearchQuery }}"
          </q-chip>
          <q-chip
            v-if="!contentSearchQuery && selectedContentStatus === 'all'"
            dense
            color="grey"
            text-color="white"
          >
            {{ $t('debug.noFiltersActive') || 'No filters active' }}
          </q-chip>
        </div>
      </div>

      <!-- Content Breakdown by Status -->
      <div class="debug-section q-mb-md">
        <div class="text-subtitle2 q-mb-sm">
          <q-icon name="mdi-chart-bar" class="q-mr-xs" />
          {{ $t('debug.contentByStatus') || 'Content by Status' }}
        </div>
        <div class="status-breakdown">
          <div
            v-for="(count, status) in contentByStatus"
            :key="status"
            class="status-item"
          >
            <q-icon :name="getStatusIcon(status)" :color="getStatusColor(status)" />
            <span class="status-label">{{ status }}</span>
            <q-badge :color="getStatusColor(status)">{{ count }}</q-badge>
          </div>
        </div>
      </div>

      <!-- Sample Content Data -->
      <div class="debug-section">
        <div class="text-subtitle2 q-mb-sm">
          <q-icon name="mdi-code-json" class="q-mr-xs" />
          {{ $t('debug.sampleContent') || 'Sample Content Data' }}
        </div>
        <q-expansion-item
          dense
          header-style="padding: 8px 0"
          :label="`${$t('debug.showSampleData') || 'Show sample data'} (${Math.min(3, approvedSubmissions.length)} items)`"
        >
          <div class="sample-content">
            <pre class="debug-json">{{ sampleContentJson }}</pre>
          </div>
        </q-expansion-item>
      </div>

      <!-- Troubleshooting Tips -->
      <div class="debug-section q-mt-lg">
        <div class="text-subtitle2 q-mb-sm">
          <q-icon name="mdi-lightbulb-on" class="q-mr-xs" />
          {{ $t('debug.troubleshootingTips') || 'Troubleshooting Tips' }}
        </div>
        <q-list dense>
          <q-item v-if="approvedSubmissions.length === 0">
            <q-item-section avatar>
              <q-icon name="mdi-alert" color="warning" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('debug.noContentLoaded') || 'No content loaded' }}</q-item-label>
              <q-item-label caption>
                {{ $t('debug.checkFirestoreRules') || 'Check Firestore security rules and collection names' }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="availableContent.length === 0 && approvedSubmissions.length > 0">
            <q-item-section avatar>
              <q-icon name="mdi-filter-off" color="info" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('debug.allContentFiltered') || 'All content filtered out' }}</q-item-label>
              <q-item-label caption>
                {{ $t('debug.checkFilters') || 'Check status filter and search query' }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="availableContent.length > 0">
            <q-item-section avatar>
              <q-icon name="mdi-check" color="positive" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('debug.contentLoadingWorking') || 'Content loading is working correctly' }}</q-item-label>
              <q-item-label caption>
                {{ $t('debug.contentAvailable') || 'Content is available for newsletter layout' }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePageLayoutDesigner } from '../../composables/usePageLayoutDesigner';

const {
  approvedSubmissions,
  availableContent,
  issueContent,
  selectedContentStatus,
  contentSearchQuery
} = usePageLayoutDesigner();

// Show debug panel (can be toggled via dev tools or URL param)
const showDebugPanel = ref(
  import.meta.env.DEV ||
  new URLSearchParams(window.location.search).has('debug') ||
  localStorage.getItem('pageLayoutDebug') === 'true'
);

// Computed properties for debugging information
const filteredOutCount = computed(() => {
  return approvedSubmissions.value.length - availableContent.value.length - issueContent.value.length;
});

const contentByStatus = computed(() => {
  const statusCounts: Record<string, number> = {};
  approvedSubmissions.value.forEach(content => {
    const status = content.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  return statusCounts;
});

const sampleContentJson = computed(() => {
  const sampleData = approvedSubmissions.value.slice(0, 3).map(content => ({
    id: content.id,
    title: content.title,
    status: content.status,
    tags: content.tags?.slice(0, 3) || [],
    features: Object.keys(content.features || {}),
    authorName: content.authorName
  }));
  return JSON.stringify(sampleData, null, 2);
});

// Helper functions
const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'published': return 'mdi-publish';
    case 'approved': return 'mdi-check';
    case 'draft': return 'mdi-file-document-edit';
    default: return 'mdi-help-circle';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'published': return 'positive';
    case 'approved': return 'info';
    case 'draft': return 'warning';
    default: return 'grey';
  }
};

// Expose debug panel toggle for external access
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).togglePageLayoutDebug = () => {
    showDebugPanel.value = !showDebugPanel.value;
    localStorage.setItem('pageLayoutDebug', showDebugPanel.value.toString());
  };
}
</script>

<style scoped>
.content-debug-panel {
  border: 2px solid var(--q-warning);
  background: rgba(255, 193, 7, 0.05);
}

.debug-section {
  border-left: 3px solid var(--q-info);
  padding-left: 12px;
}

.debug-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.debug-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  font-weight: 500;
  min-width: 80px;
}

.sample-content {
  max-height: 300px;
  overflow-y: auto;
}

.debug-json {
  font-size: 12px;
  color: var(--q-dark);
  background: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 4px;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Dark mode adjustments */
.q-dark .content-debug-panel {
  background: rgba(255, 193, 7, 0.1);
}

.q-dark .debug-json {
  color: var(--q-on-dark);
  background: rgba(255, 255, 255, 0.1);
}
</style>
