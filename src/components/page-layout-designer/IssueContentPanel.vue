 <!--
  Available Content Panel
  Panel for managing available content and issue content library
-->
<template>
  <div class="available-content-panel">
    <!-- Issue Content Library -->
    <q-card flat bordered class="full-height">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="mdi-library" class="q-mr-sm" />
          {{ $t('content.issueContentLibrary') || 'Issue Content Library' }}
          <q-badge color="info" class="q-ml-sm">
            {{ localIssueContent.length }}
          </q-badge>
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-list separator>
          <q-item
            v-for="(submission, index) in localIssueContent"
            :key="submission.id"
            class="issue-content-item"
            :class="{ 'in-layout': isContentInLayout(submission.id) }"
            clickable
            @click="handleRemoveFromIssue(submission.id)"
            :disable="selectedIssue?.type === 'newsletter'"
            draggable="true"
            @dragstart="handleDragStart($event, submission.id, 'library')"
          >
            <q-item-section avatar>
              <q-avatar :color="getSubmissionIcon(submission.id).color" text-color="white" size="sm">
                <q-icon :name="getSubmissionIcon(submission.id).icon" />
                <!-- Layout indicator overlay -->
                <q-badge
                  v-if="isContentInLayout(submission.id)"
                  floating
                  color="positive"
                  :label="getContentLayoutInfo(submission.id)?.areaIndex || '?'"
                  class="layout-badge"
                />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-body2">
                {{ submission.title }}
                <q-icon
                  v-if="isContentInLayout(submission.id)"
                  name="mdi-view-dashboard"
                  color="positive"
                  size="xs"
                  class="q-ml-xs"
                >
                  <q-tooltip>{{ $t('content.activeInLayout') || 'Active in layout' }}</q-tooltip>
                </q-icon>
              </q-item-label>
              <q-item-label caption>
                {{ getSubmissionIcon(submission.id).label }} • {{ $t('common.order') || 'Order' }}: {{ index + 1 }}
                <span v-if="isContentInLayout(submission.id)" class="text-positive">
                  • {{ $t('content.layoutArea') || 'Layout Area' }} {{ getContentLayoutInfo(submission.id)?.areaIndex }}
                  ({{ getContentLayoutInfo(submission.id)?.areaSize }})
                </span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="column q-gutter-xs">
                <!-- Layout status indicator -->
                <div v-if="isContentInLayout(submission.id)" class="row items-center">
                  <q-chip
                    dense
                    size="sm"
                    color="positive"
                    text-color="white"
                    icon="mdi-view-dashboard"
                    class="layout-status-chip"
                  >
                    {{ $t('content.inLayout') || 'In Layout' }}
                  </q-chip>
                </div>

                <div class="row q-gutter-xs">
                  <q-btn
                    flat
                    dense
                    icon="mdi-minus"
                    color="negative"
                    size="sm"
                    @click.stop="handleRemoveFromIssue(submission.id)"
                    :disable="selectedIssue?.type === 'newsletter'"
                    :aria-label="$t('actions.removeFromIssue') || 'Remove from Issue'"
                  >
                    <q-tooltip>{{ $t('actions.removeFromIssue') || 'Remove from Issue' }}</q-tooltip>
                  </q-btn>
                  <q-icon name="mdi-drag-horizontal" color="grey-5" size="sm" />
                </div>
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-if="localIssueContent.length === 0" class="text-center text-grey-6 q-pa-md">
          <q-icon name="mdi-plus-circle-outline" size="2rem" class="q-mb-sm" />
          <div>{{ $t('content.noContentInIssue') || 'No content in this issue' }}</div>
          <div class="text-caption">{{ $t('content.dragContentHere') || 'Drag content from available list' }}</div>
        </div>

        <!-- Read-only message for existing newsletters -->
        <div v-if="selectedIssue?.type === 'newsletter'" class="text-center text-grey-6 q-pa-md">
          <q-icon name="mdi-information" size="2rem" class="q-mb-sm" />
          <div>{{ $t('content.existingNewsletterReadonly') || 'This is an existing newsletter with fixed content' }}</div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { watch, computed } from 'vue';
import { usePageLayoutDesignerStore } from '../../stores/page-layout-designer.store';

const {
  selectedIssue,
  issueContent,
  isContentInLayout,
  getContentLayoutInfo,
  getSubmissionIcon,
  removeFromIssue
} = usePageLayoutDesignerStore();

// Create a local computed that forces reactivity
const localIssueContent = computed(() => {
  console.log('🔧 IssueContentPanel - localIssueContent computed called');
  return issueContent;
});

// Watch for changes to issueContent to ensure reactivity
watch(issueContent, (newContent, oldContent) => {
  console.log('🔧 IssueContentPanel - issueContent changed:', {
    oldContentLength: oldContent?.length || 0,
    newContentLength: newContent?.length || 0,
    newContentTitles: newContent?.map(c => c.title) || []
  });
}, { deep: true, immediate: true });

// Watch for changes to selectedIssue to ensure reactivity
watch(() => selectedIssue, (newIssue, oldIssue) => {
  console.log('🔧 IssueContentPanel - selectedIssue changed:', {
    oldIssue: oldIssue ? { id: oldIssue.id, title: oldIssue.title, submissions: oldIssue.submissions } : null,
    newIssue: newIssue ? { id: newIssue.id, title: newIssue.title, submissions: newIssue.submissions } : null
  });
}, { deep: true, immediate: true });

// Drag and drop handlers
const handleDragStart = (event: DragEvent, contentId: string, source: 'available' | 'library' = 'library') => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', contentId);
    event.dataTransfer.setData('application/x-source', source);
  }
};

const handleRemoveFromIssue = async (submissionId: string) => {
  await removeFromIssue(submissionId);
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
