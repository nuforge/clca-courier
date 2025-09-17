<!--
  Page Preview Panel
  Panel for previewing and managing page layout with drag-and-drop functionality
-->
<template>
  <div class="page-preview-panel">
    <q-card flat bordered class="full-height">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="text-h6">
            <q-icon name="mdi-file-document-outline" class="q-mr-sm" />
            {{ $t('pages.newsletterManagement.pagePreview') || 'Page Preview' }}
          </div>
          <q-space />
          <q-btn-dropdown
            color="secondary"
            icon="mdi-palette"
            :label="$t('common.template') || 'Template'"
            no-caps
          >
            <q-list>
              <q-item
                v-for="template in templateOptions"
                :key="template.value"
                clickable
                @click="changeTemplate(template.value)"
              >
                <q-item-section>
                  <q-item-label>{{ template.label }}</q-item-label>
                  <q-item-label caption>{{ template.description }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="page-preview-container">
          <div
            class="page-preview"
            @drop="handleDrop($event)"
            @dragover.prevent
            @dragenter.prevent
          >
            <!-- Page Header -->
            <div class="page-header">
              <div class="newsletter-title">{{ selectedIssue?.title }}</div>
              <div class="newsletter-date">
                {{ formatDate(selectedIssue?.publicationDate || new Date(), 'LONG') }}
              </div>
            </div>

            <!-- Content Areas -->
            <div class="content-areas">
              <div
                v-for="(area, index) in contentAreas"
                :key="index"
                class="content-area"
                :class="{ 'has-content': area.contentId, 'drag-over': dragOverArea === index }"
                @drop="handleAreaDrop($event, index)"
                @dragover.prevent="handleDragOver($event, index)"
                @dragenter.prevent="handleDragEnter($event, index)"
                @dragleave.prevent="handleDragLeave($event)"
              >
                <div v-if="area.contentId" class="content-preview">
                  <div class="content-title">{{ getSubmissionTitle(area.contentId) }}</div>
                  <div class="content-type">
                    <q-icon
                      :name="getSubmissionIcon(area.contentId).icon"
                      :color="getSubmissionIcon(area.contentId).color"
                      size="xs"
                      class="q-mr-xs"
                    />
                    {{ getSubmissionIcon(area.contentId).label }}
                  </div>
                  <q-btn
                    color="accent"
                    dense
                    icon="mdi-close"
                    size="sm"
                    class="remove-content"
                    @click="removeFromArea(index)"
                    :aria-label="$t('actions.removeContent') || 'Remove content'"
                  />
                </div>
                <div v-else class="drop-zone">
                  <q-icon name="mdi-plus-circle-outline" size="2rem" color="grey-5" />
                  <div class="text-caption text-grey-6">
                    {{ $t('content.dropContentHere') || 'Drop content here' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Page Footer -->
            <div class="page-footer">
              <div class="page-number">{{ $t('common.page') || 'Page' }} 1</div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { usePageLayoutDesignerStore } from '../../stores/page-layout-designer.store';

const $q = useQuasar();
const { t } = useI18n();

const {
  selectedIssue,
  contentAreas,
  draggedContentId,
  dragOverArea,
  templateOptions,
  getSubmissionTitle,
  getSubmissionIcon,
  removeFromArea,
  changeTemplate,
  formatDate,
  addToIssue,
  approvedSubmissions
} = usePageLayoutDesignerStore();

// Drag and drop handlers
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  // Handle general drop if needed
};

const handleDragOver = (event: DragEvent, areaIndex: number) => {
  event.preventDefault();
  dragOverArea.value = areaIndex;
};

const handleDragEnter = (event: DragEvent, areaIndex: number) => {
  event.preventDefault();
  dragOverArea.value = areaIndex;
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  // Only clear if leaving the area completely (not a child element)
  const currentTarget = event.currentTarget as HTMLElement;
  const relatedTarget = event.relatedTarget as Node;
  if (currentTarget && !currentTarget.contains(relatedTarget)) {
    dragOverArea.value = null;
  }
};

const handleAreaDrop = async (event: DragEvent, areaIndex: number) => {
  event.preventDefault();
  dragOverArea.value = null; // Clear drag over state

  const contentId = event.dataTransfer?.getData('text/plain') || draggedContentId.value;
  const source = event.dataTransfer?.getData('application/x-source') || 'library';

  if (contentId && contentAreas.value[areaIndex]) {
    // If content is from available list, add it to issue first
    if (source === 'available' && selectedIssue.value) {
      const submission = approvedSubmissions.value.find(s => s.id === contentId);
      if (submission) {
        const success = await addToIssue(submission);
        if (!success) return; // Don't add to layout if adding to issue failed
      }
    }

    contentAreas.value[areaIndex].contentId = contentId;

    $q.notify({
      type: 'positive',
      message: t('notifications.contentAddedToLayoutArea') || 'Content added to layout area'
    });
  }

  draggedContentId.value = null;
};
</script>

<style scoped>
.page-preview-panel {
  height: 100%;
}

/* Page Preview Styles */
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

.content-area.drag-over {
  border-color: #1976d2;
  background-color: rgba(25, 118, 210, 0.1);
  transform: scale(1.02);
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
}

.content-type {
  font-size: 12px;
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

.q-dark .content-area.drag-over {
  border-color: #64b5f6;
  background-color: rgba(100, 181, 246, 0.1);
}
</style>
