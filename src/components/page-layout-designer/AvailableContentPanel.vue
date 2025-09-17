<!--
  Available Content Panel
  Panel for managing available content and issue content library
-->
<template>
  <div class="available-content-panel">
    <!-- Debug Panel (Development/Troubleshooting) -->
    <!-- <ContentDebugPanel /> -->

    <!-- Available Content Section (Collapsible) -->
    <q-card flat >
      <q-card-section>
        <div class="row items-center">
          <div class="text-h6">
            <q-icon name="mdi-file-document-multiple-outline" class="q-mr-sm" />
            {{ $t('content.availableContent') || 'Available Content' }}
            <q-badge color="info" class="q-ml-sm">
              {{ availableContent.length }}
            </q-badge>
          </div>
          <q-space />
          <q-btn
            flat
            dense
            :icon="availableContentExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            @click="availableContentExpanded = !availableContentExpanded"
            :aria-label="availableContentExpanded ? $t('common.collapse') : $t('common.expand')"
          >
            <q-tooltip>{{ availableContentExpanded ? $t('common.collapse') : $t('common.expand') }}</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <q-slide-transition>
        <div v-show="availableContentExpanded">
          <q-card-section class="q-pt-none">
            <!-- Search and Filter Controls -->
            <div class="row q-col-gutter-xs q-mb-md">
              <div class="col-8">
                <q-input
                  v-model="contentSearchQuery"
                  :placeholder="$t('common.search') || 'Search content...'"
                  dense
                  filled
                  clearable
                >
                  <template v-slot:prepend>
                    <q-icon name="mdi-magnify" />
                  </template>
                </q-input>
              </div>
              <div class="col-4">
                <q-select
                  v-model="selectedContentStatus"
                  :options="contentStatusOptions"
                  dense
                  filled
                  emit-value
                  map-options
                />
              </div>
            </div>

            <div v-if="availableContent.length === 0" class="text-center text-grey-6 q-pa-md">
              <q-icon name="mdi-information" size="2rem" class="q-mb-sm" />
              <div>{{ $t('content.noAvailableContent') || 'No available content matches your search' }}</div>
            </div>
            <!-- Available Content List -->

            <q-list separator>
              <q-item
                v-for="submission in availableContent"
                :key="submission.id"
                class="available-content-item"
                clickable
                @click="handleAddToIssue(submission)"
                :disable="selectedIssue?.type === 'newsletter'"
                draggable="true"
                @dragstart="handleDragStart($event, submission.id, 'available')"
              >
                <q-item-section avatar>
                  <q-avatar :color="getSubmissionIcon(submission.id).color" text-color="white" size="sm">
                    <q-icon :name="getSubmissionIcon(submission.id).icon" />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-body2">{{ submission.title }}</q-item-label>
                  <q-item-label caption>{{ getSubmissionIcon(submission.id).label }}</q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row q-gutter-xs">
                    <q-btn
                      flat
                      dense
                      icon="mdi-plus"
                      color="positive"
                      size="sm"
                      @click.stop="handleAddToIssue(submission)"
                      :disable="selectedIssue?.type === 'newsletter'"
                      :aria-label="$t('actions.addToIssue') || 'Add to Issue'"
                    >
                      <q-tooltip>{{ $t('actions.addToIssue') || 'Add to Issue' }}</q-tooltip>
                    </q-btn>
                    <q-icon name="mdi-drag-horizontal" color="grey-5" size="sm" />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

          </q-card-section>
        </div>
      </q-slide-transition>
    </q-card>

  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { usePageLayoutDesignerStore } from '../../stores/page-layout-designer.store';
import type { ContentDoc } from '../../types/core/content.types';

const {
  selectedIssue,
  availableContentExpanded,
  contentSearchQuery,
  selectedContentStatus,
  contentStatusOptions,
  availableContent,
  getSubmissionIcon,
  addToIssue
} = usePageLayoutDesignerStore();

// Watch for changes to availableContent to ensure reactivity
watch(availableContent, (newContent, oldContent) => {
  console.log('🔧 AvailableContentPanel - availableContent changed:', {
    oldContentLength: oldContent?.length || 0,
    newContentLength: newContent?.length || 0,
    newContentTitles: newContent?.map(c => c.title) || []
  });
}, { deep: true, immediate: true });

// Watch for changes to selectedIssue to ensure reactivity
watch(() => selectedIssue, (newIssue, oldIssue) => {
  console.log('🔧 AvailableContentPanel - selectedIssue changed:', {
    oldIssue: oldIssue ? { id: oldIssue.id, title: oldIssue.title, submissions: oldIssue.submissions } : null,
    newIssue: newIssue ? { id: newIssue.id, title: newIssue.title, submissions: newIssue.submissions } : null
  });
}, { deep: true, immediate: true });

// Watch for changes to search and filter to ensure reactivity
watch([() => contentSearchQuery, () => selectedContentStatus], ([newQuery, newStatus], [oldQuery, oldStatus]) => {
  console.log('🔧 AvailableContentPanel - search/filter changed:', {
    oldQuery,
    newQuery,
    oldStatus,
    newStatus
  });
}, { immediate: true });

// Drag and drop handlers
const handleDragStart = (event: DragEvent, contentId: string, source: 'available' | 'library' = 'library') => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', contentId);
    event.dataTransfer.setData('application/x-source', source);
  }
};

// Content management handlers
const handleAddToIssue = async (submission: ContentDoc) => {
  await addToIssue(submission);
};
</script>

<style scoped>

.available-content-item,
.issue-content-item {
  cursor: grab;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.available-content-item:hover,
.issue-content-item:hover {
  background-color: rgba(25, 118, 210, 0.1);
  transform: translateX(4px);
}

.available-content-item:active,
.issue-content-item:active {
  cursor: grabbing;
}

.available-content-item[aria-disabled="true"],
.issue-content-item[aria-disabled="true"] {
  opacity: 0.6;
  cursor: not-allowed;
}

.available-content-item[aria-disabled="true"]:hover,
.issue-content-item[aria-disabled="true"]:hover {
  background-color: transparent;
  transform: none;
}

/* Layout indicator styles */
.issue-content-item.in-layout {
  background-color: rgba(76, 175, 80, 0.05);
  border-left: 3px solid #4caf50;
}

.layout-badge {
  font-size: 10px;
  font-weight: bold;
  min-width: 16px;
  height: 16px;
}

.layout-status-chip {
  font-size: 10px;
  height: 20px;
  margin-bottom: 2px;
}

.layout-status-chip .q-chip__content {
  padding: 0 6px;
}

/* Enhanced visual feedback for content in layout */
.issue-content-item.in-layout .q-item-section--avatar .q-avatar {
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
}

.issue-content-item.in-layout:hover {
  background-color: rgba(76, 175, 80, 0.1);
  transform: translateX(2px);
}

/* Dark mode adjustments */
.q-dark .available-content-item:hover,
.q-dark .issue-content-item:hover {
  background-color: rgba(100, 181, 246, 0.15);
}

.q-dark .issue-content-item.in-layout:hover {
  background-color: rgba(76, 175, 80, 0.15);
}

.q-dark .issue-content-item.in-layout {
  background-color: rgba(76, 175, 80, 0.08);
  border-left-color: #66bb6a;
}
</style>
