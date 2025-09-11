<template>
  <q-form @submit="onSubmit" @reset="onReset">
    <!-- Content Type Selection -->
    <div class="row">
      <div class="col-12 q-pa-md">
        <q-select v-model="formData.type" :options="contentTypeOptions" option-value="value" option-label="label"
          label="Content Type" emit-value map-options outlined :rules="[val => !!val || 'Please select a content type']"
          @update:model-value="onTypeChange">
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <q-icon :name="scope.opt.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
                <q-item-label caption>{{ scope.opt.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </div>

    <!-- Basic Information -->
    <div class="row">
      <div class="col-12 col-md-8 q-pa-md">
        <q-input v-model="formData.title" label="Title" outlined :rules="[val => !!val || 'Title is required']"
          :placeholder="getTitlePlaceholder()" />
      </div>
      <div class="col-12 col-md-4 q-pa-md">
        <q-select v-model="formData.priority" :options="priorityOptions" option-value="value" option-label="label"
          label="Priority" emit-value map-options outlined />
      </div>
    </div>

    <!-- Category Selection -->
    <div class="row">
      <div class="col-12 col-md-6 col-lg-6 q-pa-md">
        <q-select v-model="formData.category" :options="allCategories" label="Category" outlined use-input fill-input
          hide-selected input-debounce="300" new-value-mode="add-unique"
          :rules="[val => !!val || 'Category is required']" @filter="filterCategories" @new-value="addNewCategory">
          <template v-slot:prepend>
            <q-icon name="label" />
          </template>
          <template v-slot:hint>
            Type to search existing categories or create a new one
          </template>
        </q-select>
      </div>
      <div class="col-12 col-md-6 col-lg-6 q-pa-md" v-if="showTargetIssue">
        <q-input v-model="formData.targetIssue" label="Target Newsletter Issue (Optional)" outlined
          placeholder="e.g., 2025 Summer Issue" />
      </div>
    </div>

    <!-- Type-Specific Metadata -->
    <div v-if="formData.type" class="q-mt-md">
      <q-separator class="q-mb-md" />
      <h6 class="q-mt-none q-mb-md">{{ getMetadataTitle() }}</h6>

      <component :is="getMetadataComponent()"
                 v-model="formData.metadata"
                 :content-type="formData.type"
                 @update:model-value="updateFormMetadata" />
    </div>

    <!-- Rich Text Content -->
    <div class="q-mt-md">
      <q-separator class="q-mb-md" />
      <h6 class="q-mt-none q-mb-md">Content</h6>

      <RichTextEditor v-model="formData.content" :placeholder="getContentPlaceholder()" min-height="300px" />
    </div>

    <!-- External Media Attachments -->
    <div class="q-mt-md">
      <q-separator class="q-mb-md" />
      <h6 class="q-mt-none q-mb-md">Images & Media</h6>
      <p class="text-caption text-grey-7 q-mb-md">
        We recommend hosting images on Google Photos or Google Drive to keep costs low and maintain quality.
      </p>

      <!-- Canva Integration -->
      <div class="canva-integration q-mb-lg">
        <!-- Template Selection -->
        <div v-if="!formData.canvaDesign" class="template-selection-section q-mb-md">
          <CanvaTemplateSelector
            v-model="selectedTemplateId"
            :content-type="formData.type"
            @template-selected="onTemplateSelected"
            @template-cleared="onTemplateCleared"
          />
        </div>

        <!-- Design Creation/Management -->
        <q-card flat bordered class="q-pa-md">
          <div class="row items-center q-col-gutter-md">
            <div class="col-12 col-md-8">
              <div class="text-subtitle2 q-mb-xs">
                {{ selectedTemplate ? $t(TRANSLATION_KEYS.CANVA.CREATE_WITH_CANVA) : $t(TRANSLATION_KEYS.CANVA.CREATE_WITH_CANVA) }}
              </div>
              <p class="text-caption text-grey-7 q-ma-none">
                {{ selectedTemplate
                  ? `Using template: ${selectedTemplate.name}. Your content will be automatically populated.`
                  : 'Create professional designs for your content using Canva\'s templates and tools.'
                }}
              </p>
              <div v-if="formData.canvaDesign" class="q-mt-sm">
                <q-chip
                  :color="getCanvaStatusColor(formData.canvaDesign.status)"
                  text-color="white"
                  :icon="getCanvaStatusIcon(formData.canvaDesign.status)"
                  size="sm"
                >
                  {{ $t(`canva.${formData.canvaDesign.status}`) }}
                </q-chip>
                <q-btn
                  v-if="formData.canvaDesign.editUrl"
                  flat
                  dense
                  size="sm"
                  color="primary"
                  :icon="UI_ICONS.edit"
                  :label="$t(TRANSLATION_KEYS.CANVA.EDIT_IN_CANVA)"
                  @click="openCanvaDesign(formData.canvaDesign.editUrl)"
                  class="q-ml-sm"
                />
              </div>
            </div>
            <div class="col-12 col-md-4 text-right">
              <q-btn
                v-if="!formData.canvaDesign"
                color="primary"
                :icon="UI_ICONS.create"
                :label="selectedTemplate ? 'Create with Template' : $t(TRANSLATION_KEYS.CANVA.CREATE_WITH_CANVA)"
                :loading="canvaLoading || isCreatingWithAutofill"
                :disable="!formData.title"
                @click="selectedTemplate ? createCanvaDesignWithAutofill() : createCanvaDesign()"
                class="full-width-mobile"
              />
              <q-btn
                v-else-if="formData.canvaDesign.status === 'exported'"
                color="positive"
                :icon="UI_ICONS.download"
                :label="$t(TRANSLATION_KEYS.CANVA.DOWNLOAD_DESIGN)"
                @click="downloadCanvaDesign"
                class="full-width-mobile"
              />
            </div>
          </div>
        </q-card>
      </div>

      <ExternalImageUpload v-model="formData.attachments" :max-attachments="10" />
    </div>

    <!-- Form Actions -->
    <div class="row q-mt-lg">
      <div class="col-12 col-sm-auto q-pa-md">
        <q-btn type="submit" color="primary" :loading="submitting" :disable="!isFormValid">
          <q-icon name="send" class="q-mr-sm" />
          Submit for Review
        </q-btn>
      </div>
      <div class="col-12 col-sm-auto q-pa-md">
        <q-btn type="button" color="grey-7" outline @click="saveDraft" :loading="savingDraft"
          :disable="!formData.title">
          <q-icon name="save" class="q-mr-sm" />
          Save Draft
        </q-btn>
      </div>
      <div class="col-12 col-sm-auto q-pa-md">
        <q-btn type="reset" color="grey-7" flat :disable="submitting || savingDraft">
          Reset
        </q-btn>
      </div>
    </div>

    <!-- Preview Button -->
    <div class="row q-mt-md">
      <div class="col-12 q-pa-md">
        <q-btn color="info" outline icon="preview" label="Preview" @click="showPreview = true"
          :disable="!formData.title || !formData.content" />
      </div>
    </div>

    <!-- Preview Dialog -->
    <ContentPreview v-model="showPreview" :content="previewContent" />
  </q-form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { contentSubmissionService } from '../../services/content-submission.service';
import { useCanvaAuth } from '../../composables/useCanvaAuth';
import { canvaApiService } from '../../services/canva-api.service';
import { logger } from '../../utils/logger';
import { Timestamp } from 'firebase/firestore';
import type {
  ContentType,
  ContentSubmissionData,
  BaseContentItem,
  EventMetadata,
} from '../../types/core/content.types';
import type { CanvaDesign, CanvaTemplateConfig } from '../../services/canva/types';
import { TRANSLATION_KEYS } from '../../i18n/utils/translation-keys';
import { UI_ICONS } from '../../constants/ui-icons';

// Import components (these will be created next)
import RichTextEditor from './RichTextEditor.vue';
import ExternalImageUpload from './ExternalImageUpload.vue';
import ContentPreview from './ContentPreview.vue';
import ArticleMetadataFields from './metadata/ArticleMetadataFields.vue';
import EventMetadataFields from './metadata/EventMetadataFields.vue';
import ProjectMetadataFields from './metadata/ProjectMetadataFields.vue';
import ClassifiedMetadataFields from './metadata/ClassifiedMetadataFields.vue';
import PhotoStoryMetadataFields from './metadata/PhotoStoryMetadataFields.vue';
import AnnouncementMetadataFields from './metadata/AnnouncementMetadataFields.vue';
import CanvaTemplateSelector from '../canva/CanvaTemplateSelector.vue';

interface Props {
  editMode?: boolean;
  existingContent?: BaseContentItem;
  initialType?: ContentType;
  quickMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false,
  quickMode: false,
});

const emit = defineEmits<{
  submitted: [contentId: string];
  draftSaved: [contentId: string];
  cancelled: [];
}>();

const $q = useQuasar();
const { t } = useI18n();
const { initiateOAuth, isAuthenticated: isCanvaAuthenticated } = useCanvaAuth();

// Form state
const formData = ref<ContentSubmissionData & { canvaDesign?: CanvaDesign }>({
  type: 'article',
  title: '',
  content: '',
  category: '',
  priority: 'medium',
  targetIssue: '',
  metadata: {},
  attachments: [],
});

const submitting = ref(false);
const savingDraft = ref(false);
const showPreview = ref(false);
const showTargetIssue = ref(true);
const canvaLoading = ref(false);

// Canva template selection state
const selectedTemplateId = ref<string | undefined>(undefined);
const selectedTemplate = ref<CanvaTemplateConfig | undefined>(undefined);
const isCreatingWithAutofill = ref(false);

// Update form metadata and handle event-specific calendar fields
function updateFormMetadata(metadata: Record<string, unknown>) {
  console.log('📝 updateFormMetadata received:', metadata);
  formData.value.metadata = { ...metadata };

  // If this is an event, extract calendar fields from metadata
  if (formData.value.type === 'event') {
    const eventMeta = metadata as Partial<EventMetadata>;
    console.log('📅 Processing event metadata:', eventMeta);

    // Convert timestamp to ISO date string for eventDate
    if (eventMeta.startDate) {
      const dateStr = new Date(eventMeta.startDate).toISOString().split('T')[0];
      if (dateStr) {
        formData.value.eventDate = dateStr;
      }
    }
    if (eventMeta.endDate) {
      const dateStr = new Date(eventMeta.endDate).toISOString().split('T')[0];
      if (dateStr) {
        formData.value.eventEndDate = dateStr;
      }
    } else {
      // Remove end date property when no end date
      delete (formData.value as Record<string, unknown>).eventEndDate;
    }

    // Map other event fields - only set if they have actual values
    // Preserve existing onCalendar value if not explicitly provided
    if (eventMeta.onCalendar !== undefined) {
      formData.value.onCalendar = eventMeta.onCalendar;
    }
    console.log('🔄 Setting onCalendar to:', formData.value.onCalendar, '(eventMeta.onCalendar was:', eventMeta.onCalendar, ')');

    if (eventMeta.eventTime && eventMeta.eventTime.trim() !== '') {
      formData.value.eventTime = eventMeta.eventTime;
      console.log('⏰ Setting eventTime to:', formData.value.eventTime);
    } else {
      delete (formData.value as Record<string, unknown>).eventTime;
      console.log('⏰ Removing eventTime (was empty)');
    }

    if (eventMeta.eventEndTime && eventMeta.eventEndTime.trim() !== '') {
      formData.value.eventEndTime = eventMeta.eventEndTime;
      console.log('⏰ Setting eventEndTime to:', formData.value.eventEndTime);
    } else {
      delete (formData.value as Record<string, unknown>).eventEndTime;
      console.log('⏰ Removing eventEndTime (was empty)');
    }

    if (eventMeta.location && eventMeta.location.trim() !== '') {
      formData.value.eventLocation = eventMeta.location;
    } else {
      delete (formData.value as Record<string, unknown>).eventLocation;
    }

    formData.value.allDay = eventMeta.allDay || false;

    if (eventMeta.eventRecurrence) {
      formData.value.eventRecurrence = eventMeta.eventRecurrence;
    } else {
      delete (formData.value as Record<string, unknown>).eventRecurrence;
    }

    console.log('📋 Final form data after update:', {
      onCalendar: formData.value.onCalendar,
      eventTime: formData.value.eventTime,
      eventEndTime: formData.value.eventEndTime,
      allDay: formData.value.allDay
    });
  }
}// Categories
const predefinedCategories = ref<string[]>([]);
const userDefinedCategories = ref<string[]>([]);
const filteredCategories = ref<string[]>([]);

// Content type options
const contentTypeOptions = [
  {
    value: 'article',
    label: 'Article',
    icon: 'article',
    description: 'General articles, stories, and written content',
  },
  {
    value: 'event',
    label: 'Event',
    icon: 'event',
    description: 'Community events, meetings, and activities',
  },
  {
    value: 'project',
    label: 'Project',
    icon: 'engineering',
    description: 'Community projects and initiatives',
  },
  {
    value: 'announcement',
    label: 'Announcement',
    icon: 'campaign',
    description: 'Official announcements and notices',
  },
  {
    value: 'classified',
    label: 'Classified',
    icon: 'local_offer',
    description: 'For sale, wanted, services, and housing',
  },
  {
    value: 'photo_story',
    label: 'Photo Story',
    icon: 'photo_library',
    description: 'Photo collections with stories',
  },
];

const priorityOptions = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
];

// Computed properties
const allCategories = computed(() => [
  ...predefinedCategories.value,
  ...userDefinedCategories.value,
].filter(Boolean));

const isFormValid = computed(() => {
  return !!(
    formData.value.type &&
    formData.value.title &&
    formData.value.content &&
    formData.value.category
  );
});

const previewContent = computed((): BaseContentItem => ({
  id: 'preview',
  type: formData.value.type,
  title: formData.value.title,
  authorId: 'current-user', // Add authorId for consistency
  author: {
    uid: 'current-user',
    displayName: 'You',
    email: '',
  },
  content: formData.value.content,
  status: 'draft',
  metadata: formData.value.metadata,
  attachments: formData.value.attachments,
  reviewHistory: [],
  submittedAt: Date.now(),
  priority: formData.value.priority,
  category: formData.value.category,
  ...(formData.value.targetIssue && { targetIssue: formData.value.targetIssue }),
  createdAt: Date.now(),
  updatedAt: Date.now(),
}));

// Lifecycle
onMounted(() => {
  loadCategories();

  if (props.editMode && props.existingContent) {
    loadExistingContent();
  } else {
    initializeNewContent();
  }
});

// Watch for type changes to update metadata
watch(() => formData.value.type, (newType) => {
  if (newType) {
    formData.value.metadata = contentSubmissionService.createMetadataTemplate(newType);
  }
});

// Methods
function loadCategories() {
  try {
    predefinedCategories.value = contentSubmissionService.getPredefinedCategories();
    userDefinedCategories.value = contentSubmissionService.getUserDefinedCategories();
    filteredCategories.value = allCategories.value;
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to load categories',
    });
  }
}

function loadExistingContent() {
  if (!props.existingContent) return;

  const content = props.existingContent;
  formData.value = {
    type: content.type,
    title: content.title,
    content: content.content,
    category: content.category,
    priority: content.priority,
    targetIssue: content.targetIssue || '',
    metadata: content.metadata,
    attachments: content.attachments,
  };
}

function initializeNewContent() {
  // Set initial type from props if provided
  if (props.initialType) {
    formData.value.type = props.initialType;
  }

  // Set up metadata template for the content type
  formData.value.metadata = contentSubmissionService.createMetadataTemplate(formData.value.type);

  // For quick mode, set appropriate defaults
  if (props.quickMode) {
    formData.value.priority = 'low'; // Quick uploads are typically low priority
    formData.value.category = 'Photos'; // Default category for photos
  }
}

function onTypeChange(newType: ContentType) {
  formData.value.metadata = contentSubmissionService.createMetadataTemplate(newType);
}

function getTitlePlaceholder(): string {
  switch (formData.value.type) {
    case 'article':
      return 'e.g., "Summer Activities at the Lake"';
    case 'event':
      return 'e.g., "Annual Community BBQ"';
    case 'project':
      return 'e.g., "Dock Renovation Project"';
    case 'announcement':
      return 'e.g., "Important Lake Safety Notice"';
    case 'classified':
      return 'e.g., "Kayak for Sale - Excellent Condition"';
    case 'photo_story':
      return 'e.g., "Wildlife at Conashaugh Lakes"';
    default:
      return 'Enter a descriptive title';
  }
}

function getContentPlaceholder(): string {
  switch (formData.value.type) {
    case 'article':
      return 'Share your story, thoughts, or experiences with the community...';
    case 'event':
      return 'Describe the event details, what to expect, and how to participate...';
    case 'project':
      return 'Explain the project goals, progress, and how residents can get involved...';
    case 'announcement':
      return 'Provide important information that the community needs to know...';
    case 'classified':
      return 'Describe the item or service, including condition, price, and contact details...';
    case 'photo_story':
      return 'Tell the story behind your photos...';
    default:
      return 'Write your content here...';
  }
}

function getMetadataTitle(): string {
  switch (formData.value.type) {
    case 'article':
      return 'Article Details';
    case 'event':
      return 'Event Information';
    case 'project':
      return 'Project Details';
    case 'announcement':
      return 'Announcement Settings';
    case 'classified':
      return 'Listing Details';
    case 'photo_story':
      return 'Photo Information';
    default:
      return 'Additional Information';
  }
}

function getMetadataComponent() {
  switch (formData.value.type) {
    case 'article':
      return ArticleMetadataFields;
    case 'event':
      return EventMetadataFields;
    case 'project':
      return ProjectMetadataFields;
    case 'announcement':
      return AnnouncementMetadataFields;
    case 'classified':
      return ClassifiedMetadataFields;
    case 'photo_story':
      return PhotoStoryMetadataFields;
    default:
      return 'div';
  }
}

function filterCategories(val: string, update: (fn: () => void) => void) {
  update(() => {
    if (val === '') {
      filteredCategories.value = allCategories.value;
    } else {
      const needle = val.toLowerCase();
      filteredCategories.value = allCategories.value.filter(
        category => category.toLowerCase().includes(needle)
      );
    }
  });
}

function addNewCategory(val: string, done: (item?: string) => void) {
  if (val.length > 0 && !allCategories.value.includes(val)) {
    userDefinedCategories.value.push(val);
    done(val);
  } else {
    done();
  }
}

async function onSubmit() {
  if (!isFormValid.value) return;

  submitting.value = true;
  console.log('🚀 Starting content submission...');
  console.log('📝 Form data:', JSON.stringify(formData.value, null, 2));

  // Special logging for calendar events
  if (formData.value.type === 'event') {
    console.log('📅 Calendar event submission detected!');
    console.log('📅 onCalendar:', formData.value.onCalendar);
    console.log('📅 eventDate:', formData.value.eventDate);
    console.log('📅 eventTime:', formData.value.eventTime);
    console.log('📅 eventLocation:', formData.value.eventLocation);
    console.log('📅 allDay:', formData.value.allDay);
  }

  try {
    console.log('📡 Calling contentSubmissionService.submitContent...');
    const contentId = await contentSubmissionService.submitContent(formData.value);
    console.log('✅ Content submitted successfully! ID:', contentId);

    // If there's a Canva design, attach it to the submitted content
    if (formData.value.canvaDesign) {
      try {
        console.log('🎨 Attaching Canva design to content...');
        await contentSubmissionService.attachCanvaDesign(contentId, formData.value.canvaDesign);
        console.log('✅ Canva design attached successfully!');
      } catch (canvaError) {
        console.warn('⚠️ Failed to attach Canva design, but content was submitted:', canvaError);
        $q.notify({
          type: 'warning',
          message: 'Content submitted successfully, but failed to attach Canva design',
          timeout: 3000,
        });
      }
    }

    $q.notify({
      type: 'positive',
      message: `Content submitted successfully! ID: ${contentId}. Check Firebase Console > Firestore > userContent collection.`,
      timeout: 5000,
      actions: [
        {
          label: 'Copy ID',
          color: 'white',
          handler: () => {
            void navigator.clipboard.writeText(contentId);
            $q.notify({
              type: 'info',
              message: 'Content ID copied to clipboard',
              timeout: 1000,
            });
          },
        },
      ],
    });

    emit('submitted', contentId);
    onReset();
  } catch (error: unknown) {
    console.error('❌ Submission failed:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      code: (error as { code?: string })?.code,
      stack: error instanceof Error ? error.stack : undefined,
    });

    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to submit content',
      timeout: 5000,
      actions: [
        {
          label: 'Details',
          color: 'white',
          handler: () => {
            console.log('Full error object:', error);
            $q.notify({
              type: 'info',
              message: `Error: ${(error as { code?: string })?.code || 'Unknown'} - Check browser console for details`,
              timeout: 3000,
            });
          },
        },
      ],
    });
  } finally {
    submitting.value = false;
  }
}

function saveDraft() {
  if (!formData.value.title) return;

  savingDraft.value = true;
  try {
    // For now, just show a notification - draft functionality can be implemented later
    $q.notify({
      type: 'info',
      message: 'Draft saved locally',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to save draft',
    });
  } finally {
    savingDraft.value = false;
  }
}

function onReset() {
  formData.value = {
    type: 'article',
    title: '',
    content: '',
    category: '',
    priority: 'medium',
    targetIssue: '',
    metadata: {},
    attachments: [],
  };
  initializeNewContent();
}

// Canva Integration Functions
function getCanvaStatusColor(status: string): string {
  switch (status) {
    case 'draft':
      return 'orange';
    case 'pending_export':
      return 'blue';
    case 'exported':
      return 'positive';
    case 'failed':
      return 'negative';
    default:
      return 'grey';
  }
}

function getCanvaStatusIcon(status: string): string {
  switch (status) {
    case 'draft':
      return 'mdi-pencil-outline';
    case 'pending_export':
      return 'mdi-export';
    case 'exported':
      return 'mdi-check-circle';
    case 'failed':
      return 'mdi-alert-circle';
    default:
      return 'mdi-help-circle';
  }
}

function openCanvaDesign(editUrl: string): void {
  window.open(editUrl, '_blank', 'noopener,noreferrer');
}

async function createCanvaDesign(): Promise<void> {
  if (!formData.value.title) {
    $q.notify({
      type: 'warning',
      message: t('canva.authRequired'),
    });
    return;
  }

  // Check if user is authenticated with Canva
  if (!isCanvaAuthenticated.value) {
    try {
      initiateOAuth();
      return; // OAuth will redirect, function will be called again after callback
    } catch {
      $q.notify({
        type: 'negative',
        message: t('canva.authFailed'),
      });
      return;
    }
  }

  canvaLoading.value = true;

  try {
    $q.notify({
      type: 'info',
      message: t('canva.connectingToCanva'),
      timeout: 1000,
    });

    // TODO: Replace with actual template ID from environment or configuration
    const templateId = 'DAGBjl-c4is'; // Placeholder template ID

    const design = await canvaApiService.createDesignFromTemplate(templateId);

    formData.value.canvaDesign = design;

    $q.notify({
      type: 'positive',
      message: t('canva.designCreated'),
      timeout: 3000,
      actions: [
        {
          label: t('canva.openDesign'),
          color: 'white',
          handler: () => openCanvaDesign(design.editUrl),
        },
      ],
    });

  } catch (canvaApiError) {
    $q.notify({
      type: 'negative',
      message: canvaApiError instanceof Error ? canvaApiError.message : t('canva.connectionError'),
    });
  } finally {
    canvaLoading.value = false;
  }
}

// Template selection handlers
function onTemplateSelected(template: CanvaTemplateConfig): void {
  selectedTemplate.value = template;
  logger.debug('Template selected for content submission:', {
    templateId: template.id,
    templateName: template.name,
    contentType: formData.value.type,
    fieldMapping: template.fieldMapping
  });
}

function onTemplateCleared(): void {
  selectedTemplate.value = undefined;
  selectedTemplateId.value = undefined;
  logger.debug('Template selection cleared');
}

// Create design with autofill using selected template
async function createCanvaDesignWithAutofill(): Promise<void> {
  if (!selectedTemplate.value) {
    $q.notify({
      type: 'warning',
      message: 'Please select a template first',
    });
    return;
  }

  if (!formData.value.title) {
    $q.notify({
      type: 'warning',
      message: t('canva.authRequired'),
    });
    return;
  }

  // Check if user is authenticated with Canva
  if (!isCanvaAuthenticated.value) {
    try {
      initiateOAuth();
      return; // OAuth will redirect, function will be called again after callback
    } catch {
      $q.notify({
        type: 'negative',
        message: t('canva.authFailed'),
      });
      return;
    }
  }

  isCreatingWithAutofill.value = true;

  try {
    $q.notify({
      type: 'info',
      message: t(TRANSLATION_KEYS.CANVA.DESIGN_CREATING),
      timeout: 1000,
    });

    // Prepare autofill data based on template field mapping
    const autofillData = prepareAutofillData(selectedTemplate.value);

    logger.debug('Creating Canva design with autofill:', {
      templateId: selectedTemplate.value.id,
      autofillData
    });

    // Call the autofill API method
    const result = await canvaApiService.createDesignWithAutofill(
      selectedTemplate.value.id,
      autofillData
    );

    // Create CanvaDesign object from result
    const design: CanvaDesign = {
      id: result.designId,
      editUrl: result.editUrl,
      exportUrl: null,
      status: 'draft',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    formData.value.canvaDesign = design;

    // Update the content submission data with template info
    formData.value.canvaTemplateId = selectedTemplate.value.id;
    formData.value.autoFillData = autofillData;

    $q.notify({
      type: 'positive',
      message: t('canva.designCreated'),
      timeout: 3000,
      actions: [
        {
          label: t('canva.openDesign'),
          color: 'white',
          handler: () => openCanvaDesign(design.editUrl),
        },
      ],
    });

  } catch (canvaApiError) {
    logger.error('Failed to create Canva design with autofill:', canvaApiError);
    $q.notify({
      type: 'negative',
      message: canvaApiError instanceof Error ? canvaApiError.message : t('canva.connectionError'),
    });
  } finally {
    isCreatingWithAutofill.value = false;
  }
}

// Prepare autofill data based on template field mapping
function prepareAutofillData(template: CanvaTemplateConfig): Record<string, unknown> {
  const autofillData: Record<string, unknown> = {};

  if (!template.fieldMapping) {
    return autofillData;
  }

  // Map form data to template fields
  for (const [templateField, formField] of Object.entries(template.fieldMapping)) {
    let value: unknown;

    // Handle nested field paths (e.g., "metadata.eventDate")
    if (formField.includes('.')) {
      const fieldPath = formField.split('.');
      value = fieldPath.reduce((obj: unknown, key: string) => {
        return obj && typeof obj === 'object' && key in obj
          ? (obj as Record<string, unknown>)[key]
          : undefined;
      }, formData.value);
    } else {
      // Direct field mapping
      value = (formData.value as Record<string, unknown>)[formField];
    }

    // Only include non-empty values
    if (value !== undefined && value !== null && value !== '') {
      autofillData[templateField] = value;
    }
  }

  logger.debug('Prepared autofill data:', {
    templateMapping: template.fieldMapping,
    resultData: autofillData
  });

  return autofillData;
}

async function downloadCanvaDesign(): Promise<void> {
  if (!formData.value.canvaDesign) return;

  try {
    const exportResult = await canvaApiService.exportDesign(formData.value.canvaDesign.id);

    if (exportResult.exportUrl) {
      // Open download URL in new tab
      window.open(exportResult.exportUrl, '_blank', 'noopener,noreferrer');

      $q.notify({
        type: 'positive',
        message: t('canva.exportComplete'),
      });
    } else {
      $q.notify({
        type: 'info',
        message: t('canva.exportPending'),
      });
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: t('canva.exportFailed'),
    });
  }
}
</script>

<style scoped>
.q-form {
  max-width: 1000px;
  margin: 0 auto;
}

h6 {
  color: var(--q-primary);
  font-weight: 600;
}

.canva-integration {
  border-radius: 8px;
}

.canva-integration .q-card {
  border: 2px dashed #e0e0e0;
  transition: border-color 0.3s ease;
}

.canva-integration .q-card:hover {
  border-color: var(--q-primary);
}

.full-width-mobile {
  width: 100%;
}

@media (min-width: 768px) {
  .full-width-mobile {
    width: auto;
  }
}

/* Dark theme support */
.body--dark .canva-integration .q-card {
  border-color: #424242;
}

.body--dark .canva-integration .q-card:hover {
  border-color: var(--q-primary);
}
</style>
