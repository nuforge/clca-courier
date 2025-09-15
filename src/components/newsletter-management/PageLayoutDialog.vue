<!--
  Page Layout Management Dialog
  Component for managing newsletter page layouts and content arrangement
-->
<template>
  <q-dialog v-model="showDialog" maximized>
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon name="mdi-view-dashboard" class="q-mr-sm" />
          Page Layout Manager - {{ selectedIssue?.title }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="full-height">
        <div class="row q-col-gutter-md full-height">
          <!-- Content Library -->
          <div class="col-12 col-lg-3">
            <q-card flat bordered class="full-height">
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  <q-icon name="mdi-library" class="q-mr-sm" />
                  Content Library
                </div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <q-list>
                  <q-item
                    v-for="submissionId in selectedIssue?.submissions"
                    :key="submissionId"
                    class="content-library-item"
                    draggable="true"
                    @dragstart="handleDragStart($event, submissionId)"
                  >
                    <q-item-section avatar>
                      <q-avatar color="primary" text-color="white" size="sm">
                        {{ getSubmissionTitle(submissionId)?.charAt(0).toUpperCase() }}
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-body2">{{ getSubmissionTitle(submissionId) }}</q-item-label>
                      <q-item-label caption>{{ getSubmissionType(submissionId) }}</q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-icon name="mdi-drag" color="grey-5" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>

          <!-- Page Preview Area -->
          <div class="col-12 col-lg-6">
            <q-card flat bordered class="full-height">
              <q-card-section>
                <div class="row items-center q-mb-md">
                  <div class="text-h6">
                    <q-icon name="mdi-file-document-outline" class="q-mr-sm" />
                    Page Preview
                  </div>
                  <q-space />
                  <q-btn-dropdown
                    color="secondary"
                    icon="mdi-palette"
                    label="Template"
                    no-caps
                  >
                    <q-list>
                      <q-item
                        v-for="template in templateOptions"
                        :key="template.value"
                        clickable
                        @click="changeTemplate(template.value)"
                      >
                        <q-item-section>{{ template.label }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-btn-dropdown>
                </div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <div class="page-preview-container">
                  <div class="page-preview"
                       @drop="handleDrop($event)"
                       @dragover.prevent
                       @dragenter.prevent>

                    <!-- Page Header -->
                    <div class="page-header">
                      <div class="newsletter-title">{{ selectedIssue?.title }}</div>
                      <div class="newsletter-date">{{ formatDate(selectedIssue?.publicationDate || new Date(), 'LONG') }}</div>
                    </div>

                    <!-- Content Areas -->
                    <div class="content-areas">
                      <div
                        v-for="(area, index) in contentAreas"
                        :key="index"
                        class="content-area"
                        :class="{ 'has-content': area.contentId }"
                        @drop="handleAreaDrop($event, index)"
                        @dragover.prevent
                        @dragenter.prevent
                      >
                        <div v-if="area.contentId" class="content-preview">
                          <div class="content-title">{{ getSubmissionTitle(area.contentId) }}</div>
                          <div class="content-type">{{ getSubmissionType(area.contentId) }}</div>
                          <q-btn
                            flat
                            dense
                            icon="mdi-close"
                            size="sm"
                            class="remove-content"
                            @click="removeFromArea(index)"
                          />
                        </div>
                        <div v-else class="drop-zone">
                          <q-icon name="mdi-plus-circle-outline" size="2rem" color="grey-5" />
                          <div class="text-caption text-grey-6">Drop content here</div>
                        </div>
                      </div>
                    </div>

                    <!-- Page Footer -->
                    <div class="page-footer">
                      <div class="page-number">Page 1</div>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Layout Controls -->
          <div class="col-12 col-lg-3">
            <q-card flat bordered class="full-height">
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  <q-icon name="mdi-cog" class="q-mr-sm" />
                  Layout Controls
                </div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <!-- Page Management -->
                <div class="control-group q-mb-lg">
                  <div class="text-subtitle2 q-mb-sm">Pages</div>
                  <q-btn-group class="full-width">
                    <q-btn
                      outline
                      icon="mdi-plus"
                      label="Add Page"
                      @click="addPage"
                      class="col"
                    />
                    <q-btn
                      outline
                      icon="mdi-minus"
                      @click="removePage"
                      :disable="pages.length <= 1"
                    />
                  </q-btn-group>
                  <div class="text-caption text-grey-6 q-mt-xs">
                    {{ pages.length }} page{{ pages.length !== 1 ? 's' : '' }}
                  </div>
                </div>

                <!-- Template Settings -->
                <div class="control-group q-mb-lg">
                  <div class="text-subtitle2 q-mb-sm">Layout</div>
                  <q-select
                    v-model="currentTemplate"
                    :options="templateOptions"
                    label="Template Style"
                    filled
                    dense
                    emit-value
                    map-options
                  />
                </div>

                <!-- Content Flow -->
                <div class="control-group q-mb-lg">
                  <div class="text-subtitle2 q-mb-sm">Content Flow</div>
                  <q-btn
                    outline
                    icon="mdi-auto-fix"
                    label="Auto-arrange Content"
                    @click="autoArrangeContent"
                    class="full-width q-mb-xs"
                  />
                  <q-btn
                    outline
                    icon="mdi-refresh"
                    label="Clear All Pages"
                    @click="clearAllPages"
                    class="full-width"
                  />
                </div>

                <!-- Preview Actions -->
                <div class="control-group">
                  <div class="text-subtitle2 q-mb-sm">Preview</div>
                  <q-btn
                    color="positive"
                    icon="mdi-eye"
                    label="Preview Newsletter"
                    @click="previewNewsletter"
                    class="full-width q-mb-xs"
                  />
                  <q-btn
                    color="primary"
                    icon="mdi-content-save"
                    label="Save Layout"
                    @click="saveLayout"
                    class="full-width"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { logger } from '../../utils/logger';
import { formatDate } from '../../utils/date-formatter';
import type { ContentDoc } from '../../types/core/content.types';

// Extended UnifiedNewsletter to support draft issues
interface NewsletterIssue {
  id: string;
  title: string;
  issueNumber?: string;
  publicationDate: string;
  status: 'draft' | 'generating' | 'ready' | 'published' | 'archived';
  submissions: string[];
  finalPdfPath?: string;
  type?: 'issue' | 'newsletter';
  downloadUrl?: string;
  isPublished?: boolean;
}

interface Props {
  modelValue: boolean;
  selectedIssue: NewsletterIssue | null;
  approvedSubmissions: ContentDoc[];
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'preview-newsletter'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const $q = useQuasar();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

// Page layout state
const currentTemplate = ref('standard');
const pages = ref([{ id: 1, areas: [] }]);
const contentAreas = ref([
  { id: 1, contentId: null as string | null, size: 'large' },
  { id: 2, contentId: null as string | null, size: 'medium' },
  { id: 3, contentId: null as string | null, size: 'medium' },
  { id: 4, contentId: null as string | null, size: 'small' }
]);
const draggedContentId = ref<string | null>(null);

// Template options for newsletter layout
const templateOptions = [
  {
    label: 'Standard Newsletter',
    value: 'standard',
    description: 'Classic two-column layout with header and footer'
  },
  {
    label: 'Modern Article Layout',
    value: 'modern',
    description: 'Clean single-column design with emphasis on readability'
  },
  {
    label: 'Event-Focused',
    value: 'event',
    description: 'Optimized for event announcements and calendars'
  },
  {
    label: 'Announcement Style',
    value: 'announcement',
    description: 'Bold design for important announcements'
  },
  {
    label: 'Community Spotlight',
    value: 'community',
    description: 'Highlights community members and achievements'
  }
];

const getSubmissionTitle = (submissionId: string) => {
  const submission = props.approvedSubmissions.find(s => s.id === submissionId);
  return submission?.title || 'Unknown';
};

const getSubmissionType = (submissionId: string) => {
  const submission = props.approvedSubmissions.find(s => s.id === submissionId);
  if (!submission) return 'Unknown';

  // Extract content type from tags
  const contentType = submission.tags.find((tag: string) => tag.startsWith('content-type:'))?.split(':')[1];
  return contentType ? contentType.charAt(0).toUpperCase() + contentType.slice(1) : 'Article';
};

// Page layout management methods
const handleDragStart = (event: DragEvent, contentId: string) => {
  draggedContentId.value = contentId;
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', contentId);
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  // Handle general drop if needed
};

const handleAreaDrop = (event: DragEvent, areaIndex: number) => {
  event.preventDefault();
  const contentId = event.dataTransfer?.getData('text/plain') || draggedContentId.value;

  if (contentId && contentAreas.value[areaIndex]) {
    contentAreas.value[areaIndex].contentId = contentId;

    $q.notify({
      type: 'positive',
      message: 'Content added to layout area'
    });
  }

  draggedContentId.value = null;
};

const removeFromArea = (areaIndex: number) => {
  if (contentAreas.value[areaIndex]) {
    contentAreas.value[areaIndex].contentId = null;

    $q.notify({
      type: 'info',
      message: 'Content removed from layout area'
    });
  }
};

const addPage = () => {
  const newPageId = pages.value.length + 1;
  pages.value.push({ id: newPageId, areas: [] });

  $q.notify({
    type: 'positive',
    message: `Page ${newPageId} added`
  });
};

const removePage = () => {
  if (pages.value.length > 1) {
    const removedPage = pages.value.pop();
    $q.notify({
      type: 'info',
      message: `Page ${removedPage?.id} removed`
    });
  }
};

const changeTemplate = (templateValue: string) => {
  currentTemplate.value = templateValue;

  // Reset content areas based on template
  switch (templateValue) {
    case 'standard':
      contentAreas.value = [
        { id: 1, contentId: null as string | null, size: 'large' },
        { id: 2, contentId: null as string | null, size: 'medium' },
        { id: 3, contentId: null as string | null, size: 'medium' },
        { id: 4, contentId: null as string | null, size: 'small' }
      ];
      break;
    case 'modern':
      contentAreas.value = [
        { id: 1, contentId: null as string | null, size: 'full' },
        { id: 2, contentId: null as string | null, size: 'large' },
        { id: 3, contentId: null as string | null, size: 'large' }
      ];
      break;
    case 'event':
      contentAreas.value = [
        { id: 1, contentId: null as string | null, size: 'header' },
        { id: 2, contentId: null as string | null, size: 'calendar' },
        { id: 3, contentId: null as string | null, size: 'details' }
      ];
      break;
    default:
      break;
  }

  $q.notify({
    type: 'positive',
    message: `Template changed to ${templateOptions.find(t => t.value === templateValue)?.label}`
  });
};

const autoArrangeContent = () => {
  if (!props.selectedIssue) return;

  // Auto-arrange content in areas
  const submissions = props.selectedIssue.submissions;
  submissions.forEach((submissionId: string, index: number) => {
    if (contentAreas.value[index]) {
      contentAreas.value[index].contentId = submissionId;
    }
  });

  $q.notify({
    type: 'positive',
    message: 'Content auto-arranged in layout areas'
  });
};

const clearAllPages = () => {
  $q.dialog({
    title: 'Clear All Pages',
    message: 'Are you sure you want to clear all content from the layout?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    contentAreas.value.forEach(area => {
      area.contentId = null;
    });

    $q.notify({
      type: 'info',
      message: 'All pages cleared'
    });
  });
};

const previewNewsletter = () => {
  emit('preview-newsletter');
};

const saveLayout = () => {
  if (!props.selectedIssue) return;

  try {
    // TODO: Save layout to newsletter service
    const layoutData = {
      template: currentTemplate.value,
      pages: pages.value,
      contentAreas: contentAreas.value.map(area => ({
        id: area.id,
        contentId: area.contentId,
        size: area.size
      }))
    };

    // For now, just show success message
    $q.notify({
      type: 'positive',
      message: 'Layout saved successfully!'
    });

    logger.info('Layout saved', { issueId: props.selectedIssue.id, layoutData });
  } catch (error) {
    logger.error('Failed to save layout:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to save layout'
    });
  }
};
</script>

<style scoped>
/* Page Layout Management Styles */
.page-preview-container {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  min-height: 600px;
}

.page-preview {
  background: white;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 560px;
  max-width: 400px;
  margin: 0 auto;
  position: relative;
}

.page-header {
  text-align: center;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.newsletter-title {
  font-size: 18px;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 4px;
}

.newsletter-date {
  font-size: 12px;
  color: #666;
}

.content-areas {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.content-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 16px;
  min-height: 80px;
  transition: all 0.3s ease;
  position: relative;
}

.content-area:hover {
  border-color: #1976d2;
  background-color: rgba(25, 118, 210, 0.05);
}

.content-area.has-content {
  border: 2px solid #4caf50;
  background-color: rgba(76, 175, 80, 0.1);
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.content-preview {
  position: relative;
}

.content-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
  color: #333;
}

.content-type {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.remove-content {
  position: absolute;
  top: -8px;
  right: -8px;
  background: white;
  border-radius: 50%;
}

.page-footer {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  text-align: center;
  border-top: 1px solid #e0e0e0;
  padding-top: 8px;
}

.page-number {
  font-size: 12px;
  color: #666;
}

.content-library-item {
  cursor: grab;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.content-library-item:hover {
  background-color: rgba(25, 118, 210, 0.1);
  transform: translateX(4px);
}

.content-library-item:active {
  cursor: grabbing;
}

.control-group {
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  padding: 16px;
}

/* Dark mode adjustments */
.q-dark .page-preview-container {
  background: #2a2a2a;
}

.q-dark .page-preview {
  background: #1e1e1e;
  color: white;
}

.q-dark .content-area {
  border-color: #555;
}

.q-dark .content-area:hover {
  border-color: #64b5f6;
  background-color: rgba(100, 181, 246, 0.1);
}

.q-dark .control-group {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
