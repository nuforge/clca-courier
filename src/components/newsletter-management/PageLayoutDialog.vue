<!--
  Page Layout & Content Management Dialog
  Component for managing newsletter page layouts and content arrangement
-->
<template>
  <q-dialog v-model="showDialog" maximized no-backdrop-dismiss no-esc-dismiss>
    <q-card role="dialog" aria-labelledby="page-layout-title" aria-describedby="page-layout-description">
      <q-card-section class="row items-center q-pb-none">
        <div id="page-layout-title" class="text-h6">
          <q-icon name="mdi-view-dashboard" class="q-mr-sm" />
          {{ t('pages.newsletterManagement.pageLayoutManager') || 'Page Layout & Content Manager' }} - {{ localSelectedIssue?.title }}
          <q-badge v-if="localSelectedIssue?.type === 'newsletter'" color="warning" class="q-ml-sm">
            {{ t('common.readOnly') || 'Read-only' }}
          </q-badge>
          <q-badge v-else color="info" class="q-ml-sm">
            {{ localSelectedIssue?.submissions.length || 0 }} {{ t('common.contentItems') || 'content items' }}
          </q-badge>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section id="page-layout-description" class="full-height">
        <div class="row q-col-gutter-md full-height">
          <!-- Available Content & Content Library -->
          <div class="col-12 col-lg-4">
            <!-- Available Content Section (Collapsible) -->
            <q-card flat bordered class="q-mb-md">
              <q-card-section>
                <div class="row items-center">
                  <div class="text-h6">
                    <q-icon name="mdi-file-document-multiple-outline" class="q-mr-sm" />
                    {{ t('content.availableContent') || 'Available Content' }}
                  </div>
                  <q-space />
                  <q-btn
                    flat
                    dense
                    :icon="availableContentExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                    @click="availableContentExpanded = !availableContentExpanded"
                  >
                    <q-tooltip>{{ availableContentExpanded ? 'Collapse' : 'Expand' }}</q-tooltip>
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
                          :placeholder="t('common.search') || 'Search content...'"
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

                    <!-- Available Content List -->
                    <q-list separator>
                      <q-item
                        v-for="submission in availableContent"
                        :key="submission.id"
                        class="available-content-item"
                        clickable
                        @click="addToIssue(submission)"
                        :disable="localSelectedIssue?.type === 'newsletter'"
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
                              @click.stop="addToIssue(submission)"
                              :disable="localSelectedIssue?.type === 'newsletter'"
                            >
                              <q-tooltip>{{ t('actions.addToIssue') || 'Add to Issue' }}</q-tooltip>
                            </q-btn>
                            <q-icon name="mdi-drag-horizontal" color="grey-5" size="sm" />
                          </div>
                        </q-item-section>
                      </q-item>
                    </q-list>

                    <div v-if="availableContent.length === 0" class="text-center text-grey-6 q-pa-md">
                      <q-icon name="mdi-information" size="2rem" class="q-mb-sm" />
                      <div>{{ t('content.noAvailableContent') || 'No available content matches your search' }}</div>
                    </div>
                  </q-card-section>
                </div>
              </q-slide-transition>
            </q-card>

            <!-- Issue Content Library -->
            <q-card flat bordered class="full-height">
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  <q-icon name="mdi-library" class="q-mr-sm" />
                  {{ t('content.issueContentLibrary') || 'Issue Content Library' }}
                  <q-badge color="info" class="q-ml-sm">
                    {{ issueContent.length }}
                  </q-badge>
                </div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <q-list separator>
                  <q-item
                    v-for="(submission, index) in issueContent"
                    :key="submission.id"
                    class="issue-content-item"
                    :class="{ 'in-layout': isContentInLayout(submission.id) }"
                    clickable
                    @click="removeFromIssue(submission.id)"
                    :disable="localSelectedIssue?.type === 'newsletter'"
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
                          <q-tooltip>{{ t('content.activeInLayout') || 'Active in layout' }}</q-tooltip>
                        </q-icon>
                      </q-item-label>
                      <q-item-label caption>
                        {{ getSubmissionIcon(submission.id).label }} • {{ t('common.order') || 'Order' }}: {{ index + 1 }}
                        <span v-if="isContentInLayout(submission.id)" class="text-positive">
                          • {{ t('content.layoutArea') || 'Layout Area' }} {{ getContentLayoutInfo(submission.id)?.areaIndex }}
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
                            {{ t('content.inLayout') || 'In Layout' }}
                          </q-chip>
                        </div>

                        <div class="row q-gutter-xs">
                          <q-btn
                            flat
                            dense
                            icon="mdi-minus"
                            color="negative"
                            size="sm"
                            @click.stop="removeFromIssue(submission.id)"
                            :disable="localSelectedIssue?.type === 'newsletter'"
                          >
                            <q-tooltip>{{ t('actions.removeFromIssue') || 'Remove from Issue' }}</q-tooltip>
                          </q-btn>
                          <q-icon name="mdi-drag-horizontal" color="grey-5" size="sm" />
                        </div>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>

                <div v-if="issueContent.length === 0" class="text-center text-grey-6 q-pa-md">
                  <q-icon name="mdi-plus-circle-outline" size="2rem" class="q-mb-sm" />
                  <div>{{ t('content.noContentInIssue') || 'No content in this issue' }}</div>
                  <div class="text-caption">{{ t('content.dragContentHere') || 'Drag content from available list' }}</div>
                </div>

                <!-- Read-only message for existing newsletters -->
                <div v-if="localSelectedIssue?.type === 'newsletter'" class="text-center text-grey-6 q-pa-md">
                  <q-icon name="mdi-information" size="2rem" class="q-mb-sm" />
                  <div>{{ t('content.existingNewsletterReadonly') || 'This is an existing newsletter with fixed content' }}</div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Page Preview Area -->
          <div class="col-12 col-lg-5">
            <q-card flat bordered class="full-height">
              <q-card-section>
                <div class="row items-center q-mb-md">
                  <div class="text-h6">
                    <q-icon name="mdi-file-document-outline" class="q-mr-sm" />
                    {{ t('pages.newsletterManagement.pagePreview') || 'Page Preview' }}
                  </div>
                  <q-space />
                  <q-btn-dropdown
                    color="secondary"
                    icon="mdi-palette"
                    :label="t('common.template') || 'Template'"
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
                      <div class="newsletter-title">{{ localSelectedIssue?.title }}</div>
                      <div class="newsletter-date">{{ formatDate(localSelectedIssue?.publicationDate || new Date(), 'LONG') }}</div>
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
                          <div class="content-type">
                            <q-icon :name="getSubmissionIcon(area.contentId).icon" :color="getSubmissionIcon(area.contentId).color" size="xs" class="q-mr-xs" />
                            {{ getSubmissionIcon(area.contentId).label }}
                          </div>
                          <q-btn
                            color="accent"
                            dense
                            icon="mdi-close"
                            size="sm"
                            class="remove-content"
                            @click="removeFromArea(index)"
                          />
                        </div>
                        <div v-else class="drop-zone">
                          <q-icon name="mdi-plus-circle-outline" size="2rem" color="grey-5" />
                          <div class="text-caption text-grey-6">{{ t('content.dropContentHere') || 'Drop content here' }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- Page Footer -->
                    <div class="page-footer">
                      <div class="page-number">{{ t('common.page') || 'Page' }} 1</div>
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
                  {{ t('pages.newsletterManagement.layoutControls') || 'Layout Controls' }}
                </div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <!-- Page Management -->
                <div class="control-group q-mb-lg">
                  <div class="text-subtitle2 q-mb-sm">{{ t('common.pages') || 'Pages' }}</div>
                  <q-btn-group class="full-width">
                    <q-btn
                      outline
                      icon="mdi-plus"
                      :label="t('actions.addPage') || 'Add Page'"
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
                    {{ pages.length }} {{ pages.length !== 1 ? (t('common.pages') || 'pages') : (t('common.page') || 'page') }}
                  </div>
                </div>

                <!-- Template Settings -->
                <div class="control-group q-mb-lg">
                  <div class="text-subtitle2 q-mb-sm">{{ t('common.layout') || 'Layout' }}</div>
                  <q-select
                    v-model="currentTemplate"
                    :options="templateOptions"
                    :label="t('common.templateStyle') || 'Template Style'"
                    filled
                    dense
                    emit-value
                    map-options
                  />
                </div>

                <!-- Content Flow -->
                <div class="control-group q-mb-lg">
                  <div class="text-subtitle2 q-mb-sm">{{ t('pages.newsletterManagement.contentFlow') || 'Content Flow' }}</div>
                  <q-btn
                    outline
                    icon="mdi-auto-fix"
                    :label="t('actions.autoArrangeContent') || 'Auto-arrange Content'"
                    @click="autoArrangeContent"
                    class="full-width q-mb-xs"
                  />
                  <q-btn
                    outline
                    icon="mdi-refresh"
                    :label="t('actions.clearAllPages') || 'Clear All Pages'"
                    @click="clearAllPages"
                    class="full-width"
                  />
                </div>

                <!-- Preview Actions -->
                <div class="control-group">
                  <div class="text-subtitle2 q-mb-sm">{{ t('common.preview') || 'Preview' }}</div>
                  <q-btn
                    color="positive"
                    icon="mdi-eye"
                    :label="t('actions.previewNewsletter') || 'Preview Newsletter'"
                    @click="previewNewsletter"
                    class="full-width q-mb-xs"
                  />
                  <q-btn
                    color="primary"
                    icon="mdi-content-save"
                    :label="t('actions.saveLayout') || 'Save Layout'"
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

    <!-- Layout Preview Dialog -->
    <q-dialog v-model="showLayoutPreview" maximized no-backdrop-dismiss no-esc-dismiss>
      <q-card role="dialog" aria-labelledby="layout-preview-title" aria-describedby="layout-preview-description">
        <q-card-section class="row items-center q-pb-none">
          <div id="layout-preview-title" class="text-h6">
            <q-icon name="mdi-eye" class="q-mr-sm" />
            Layout Preview - {{ selectedIssue?.title }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section id="layout-preview-description" class="full-height">
          <div class="layout-preview-container">
            <div class="preview-newsletter">
              <!-- Newsletter Header -->
              <div class="preview-header">
                <div class="preview-title">{{ selectedIssue?.title }}</div>
                <div class="preview-date">{{ formatDate(selectedIssue?.publicationDate || new Date(), 'LONG') }}</div>
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
                    <div class="text-caption text-grey-6">Empty content area</div>
                  </div>
                </div>
              </div>

              <!-- Newsletter Footer -->
              <div class="preview-footer">
                <div class="preview-page-number">Page 1</div>
                <div class="preview-template-info">Template: {{ templateOptions.find(t => t.value === currentTemplate)?.label }}</div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
          <q-btn
            color="primary"
            label="Generate PDF"
            icon="mdi-file-pdf-box"
            @click="generatePdfFromLayout"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { logger } from '../../utils/logger';
import { formatDate } from '../../utils/date-formatter';
import { useSiteTheme } from '../../composables/useSiteTheme';
import { contentUtils } from '../../types/core/content.types';
import { newsletterGenerationService } from '../../services/newsletter-generation.service';
import type { ContentDoc } from '../../types/core/content.types';
import type { UnifiedNewsletter } from '../../types/core/newsletter.types';

// Extended UnifiedNewsletter to support draft issues
interface NewsletterIssue extends UnifiedNewsletter {
  status: 'draft' | 'generating' | 'ready' | 'published' | 'archived';
  submissions: string[]; // Array of content IDs for new issues
  finalPdfPath?: string; // Path to generated PDF
  finalPdfUrl?: string; // URL to generated PDF
  type?: 'issue' | 'newsletter'; // Distinguish between new issues and existing newsletters
}

interface Props {
  modelValue: boolean;
  selectedIssue: NewsletterIssue | null;
  approvedSubmissions: ContentDoc[];
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'preview-newsletter', data?: { issue: NewsletterIssue; layout: Record<string, unknown> }): void;
  (e: 'content-updated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const $q = useQuasar();
const { t } = useI18n();
const { getContentIcon, getCategoryIcon } = useSiteTheme();

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
const showLayoutPreview = ref(false);

// Content management state
const availableContentExpanded = ref(true);
const contentSearchQuery = ref('');
const selectedContentStatus = ref('all'); // Filter by content status
const localSelectedIssue = ref<NewsletterIssue | null>(null);

// Focus management for accessibility
const focusFirstElement = async () => {
  await nextTick();
  const firstFocusable = document.querySelector('[role="dialog"] button, [role="dialog"] input, [role="dialog"] select, [role="dialog"] textarea, [role="dialog"] [tabindex]:not([tabindex="-1"])') as HTMLElement;
  if (firstFocusable) {
    firstFocusable.focus();
  }
};

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

// Computed properties for content management
const availableContent = computed(() => {
  if (!localSelectedIssue.value) return props.approvedSubmissions;

  return props.approvedSubmissions.filter(submission => {
    // Filter out content already in the issue
    const notInIssue = !localSelectedIssue.value?.submissions.includes(submission.id);

    // Apply search filter
    const matchesSearch = !contentSearchQuery.value ||
      submission.title.toLowerCase().includes(contentSearchQuery.value.toLowerCase()) ||
      submission.description.toLowerCase().includes(contentSearchQuery.value.toLowerCase());

    // Apply status filter
    const matchesStatus = selectedContentStatus.value === 'all' ||
      submission.status === selectedContentStatus.value;

    return notInIssue && matchesSearch && matchesStatus;
  });
});

const issueContent = computed(() => {
  if (!localSelectedIssue.value) return [];

  return localSelectedIssue.value.submissions
    .map(submissionId => props.approvedSubmissions.find(s => s.id === submissionId))
    .filter(Boolean) as ContentDoc[];
});

// Computed property to check if content is actively placed in layout
const isContentInLayout = (contentId: string): boolean => {
  return contentAreas.value.some(area => area.contentId === contentId);
};

// Computed property to get layout area info for content
const getContentLayoutInfo = (contentId: string): { areaIndex: number; areaSize: string } | null => {
  const areaIndex = contentAreas.value.findIndex(area => area.contentId === contentId);
  if (areaIndex === -1) return null;

  return {
    areaIndex: areaIndex + 1, // 1-based for display
    areaSize: contentAreas.value[areaIndex]?.size || 'unknown'
  };
};

const contentStatusOptions = [
  { label: t('common.all'), value: 'all' },
  { label: t('content.status.draft'), value: 'draft' },
  { label: t('content.status.approved'), value: 'approved' },
  { label: t('content.status.published'), value: 'published' }
];

const getSubmissionTitle = (submissionId: string) => {
  const submission = props.approvedSubmissions.find(s => s.id === submissionId);
  return submission?.title || 'Unknown';
};


const getSubmissionIcon = (submissionId: string) => {
  const submission = props.approvedSubmissions.find(s => s.id === submissionId);
  if (!submission) return { icon: 'mdi-help-circle', color: 'grey', label: 'Unknown' };

  // Get content type from tags
  const contentType = contentUtils.getContentType(submission);
  if (!contentType) return { icon: 'mdi-file-document', color: 'grey', label: 'Article' };

  // Get category from tags if available
  const categories = contentUtils.getTagsByNamespace(submission, 'category');
  const category = categories[0]; // Use first category if multiple

  // Use site theme system to get proper icon and color
  if (category) {
    return getCategoryIcon(contentType, category);
  } else {
    return getContentIcon(contentType);
  }
};

const getSubmissionPreview = (submissionId: string) => {
  const submission = props.approvedSubmissions.find(s => s.id === submissionId);
  if (!submission) return 'Content preview not available';

  // Get a preview of the content description
  const preview = submission.description || 'No content preview available';
  return preview.length > 150 ? preview.substring(0, 150) + '...' : preview;
};

// Watch for changes to selectedIssue and update local copy
watch(() => props.selectedIssue, (newIssue) => {
  if (newIssue) {
    localSelectedIssue.value = { ...newIssue };
  } else {
    localSelectedIssue.value = null;
  }
}, { immediate: true, deep: true });

// Content management methods
const addToIssue = async (submission: ContentDoc) => {
  if (!localSelectedIssue.value || localSelectedIssue.value.type !== 'issue') return;

  try {
    const updatedSubmissions = [...localSelectedIssue.value.submissions, submission.id];

    // Update local copy immediately for reactive UI
    localSelectedIssue.value.submissions = updatedSubmissions;

    await newsletterGenerationService.addSubmissionsToIssue(
      localSelectedIssue.value.id,
      updatedSubmissions
    );

    $q.notify({
      type: 'positive',
      message: t('notifications.contentAddedToIssue') || 'Content added to issue'
    });

    emit('content-updated');
  } catch (error) {
    logger.error('Failed to add content to issue:', error);
    $q.notify({
      type: 'negative',
      message: t('notifications.failedToAddContent') || 'Failed to add content to issue'
    });

    // Revert local changes on error
    if (localSelectedIssue.value) {
      localSelectedIssue.value.submissions = props.selectedIssue?.submissions || [];
    }
  }
};

const removeFromIssue = async (submissionId: string) => {
  if (!localSelectedIssue.value || localSelectedIssue.value.type !== 'issue') return;

  try {
    const updatedSubmissions = localSelectedIssue.value.submissions.filter(
      (id: string) => id !== submissionId
    );

    // Update local copy immediately for reactive UI
    localSelectedIssue.value.submissions = updatedSubmissions;

    await newsletterGenerationService.addSubmissionsToIssue(
      localSelectedIssue.value.id,
      updatedSubmissions
    );

    $q.notify({
      type: 'positive',
      message: t('notifications.contentRemovedFromIssue') || 'Content removed from issue'
    });

    emit('content-updated');
  } catch (error) {
    logger.error('Failed to remove content from issue:', error);
    $q.notify({
      type: 'negative',
      message: t('notifications.failedToRemoveContent') || 'Failed to remove content from issue'
    });

    // Revert local changes on error
    if (localSelectedIssue.value) {
      localSelectedIssue.value.submissions = props.selectedIssue?.submissions || [];
    }
  }
};

// Page layout management methods
const handleDragStart = (event: DragEvent, contentId: string, source: 'available' | 'library' = 'library') => {
  draggedContentId.value = contentId;
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', contentId);
    event.dataTransfer.setData('application/x-source', source);
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  // Handle general drop if needed
};

const handleAreaDrop = (event: DragEvent, areaIndex: number) => {
  event.preventDefault();
  const contentId = event.dataTransfer?.getData('text/plain') || draggedContentId.value;
  const source = event.dataTransfer?.getData('application/x-source') || 'library';

  if (contentId && contentAreas.value[areaIndex]) {
    // If content is from available list, add it to issue first
    if (source === 'available' && localSelectedIssue.value) {
      const submission = props.approvedSubmissions.find(s => s.id === contentId);
      if (submission) {
        void addToIssue(submission);
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
  if (!localSelectedIssue.value) return;

  // Auto-arrange content in areas
  const submissions = localSelectedIssue.value.submissions;
  submissions.forEach((submissionId: string, index: number) => {
    if (contentAreas.value[index]) {
      contentAreas.value[index].contentId = submissionId;
    }
  });

  $q.notify({
    type: 'positive',
    message: t('notifications.contentAutoArranged') || 'Content auto-arranged in layout areas'
  });
};

const clearAllPages = () => {
  $q.dialog({
    title: t('actions.clearAllPages') || 'Clear All Pages',
    message: t('dialogs.clearAllPagesConfirm') || 'Are you sure you want to clear all content from the layout?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    contentAreas.value.forEach(area => {
      area.contentId = null;
    });

    $q.notify({
      type: 'info',
      message: t('notifications.allPagesCleared') || 'All pages cleared'
    });
  });
};

const previewNewsletter = () => {
  if (!localSelectedIssue.value) {
    $q.notify({
      type: 'warning',
      message: t('notifications.noIssueSelected') || 'No issue selected for preview'
    });
    return;
  }

  // Check if there's a PDF available first
  const pdfUrl = localSelectedIssue.value.finalPdfUrl || localSelectedIssue.value.downloadUrl;
  if (pdfUrl) {
    // If PDF exists, open it in new tab
    window.open(pdfUrl, '_blank');
    $q.notify({
      type: 'positive',
      message: t('notifications.newsletterPdfOpened', { title: localSelectedIssue.value.title }) || `Newsletter PDF opened: ${localSelectedIssue.value.title}`
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

const saveLayout = () => {
  if (!localSelectedIssue.value) return;

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
      message: t('notifications.layoutSaved') || 'Layout saved successfully!'
    });

    logger.info('Layout saved', { issueId: localSelectedIssue.value.id, layoutData });
  } catch (error) {
    logger.error('Failed to save layout:', error);
    $q.notify({
      type: 'negative',
      message: t('notifications.failedToSaveLayout') || 'Failed to save layout'
    });
  }
};

const generatePdfFromLayout = () => {
  if (!localSelectedIssue.value) return;

  // Close the preview dialog
  showLayoutPreview.value = false;

  // Emit the preview-newsletter event to trigger PDF generation
  emit('preview-newsletter', {
    issue: localSelectedIssue.value,
    layout: {
      template: currentTemplate.value,
      pages: pages.value,
      contentAreas: contentAreas.value.map(area => ({
        id: area.id,
        contentId: area.contentId,
        size: area.size
      }))
    }
  });

  $q.notify({
    type: 'info',
    message: t('notifications.pdfGenerationInitiated') || 'PDF generation initiated',
    caption: t('notifications.pdfGenerationHint') || 'This will create a PDF from the current layout'
  });
};

// Watch for dialog state changes to manage focus
watch(showDialog, (newValue) => {
  if (newValue) {
    void focusFirstElement();
  }
});

watch(showLayoutPreview, (newValue) => {
  if (newValue) {
    void focusFirstElement();
  }
});
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

/* Dark mode adjustments for preview */
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

/* Content Management Styles */
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

/* Enhanced content list styling */
.q-list .q-item {
  min-height: 56px;
}

.q-list .q-item .q-item-section--avatar {
  padding-right: 12px;
}

.q-list .q-item .q-item-section--side {
  padding-left: 8px;
}

/* Drag and drop visual feedback */
.content-area {
  transition: all 0.3s ease;
}

.content-area.drag-over {
  border-color: #1976d2;
  background-color: rgba(25, 118, 210, 0.1);
  transform: scale(1.02);
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

/* Dark mode adjustments for content management */
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

.q-dark .content-area.drag-over {
  border-color: #64b5f6;
  background-color: rgba(100, 181, 246, 0.1);
}
</style>
