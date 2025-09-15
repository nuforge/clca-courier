<!--
  Edit Issue Dialog
  Component for editing newsletter issues and existing newsletters
-->
<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          {{ selectedIssue?.type === 'issue' ? 'Edit Newsletter Issue' : 'Edit Newsletter' }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="updateIssue" class="q-gutter-md">
          <q-input
            v-model="editForm.title"
            label="Issue Title"
            hint="e.g., 'Summer 2025 Newsletter'"
            :rules="[val => !!val || 'Title is required']"
            filled
          />

          <q-input
            v-model="editForm.issueNumber"
            label="Issue Number"
            hint="e.g., '2025-03' or 'Summer-2025'"
            :rules="[val => !!val || 'Issue number is required']"
            filled
          />

          <q-input
            v-model="editForm.publicationDate"
            type="date"
            label="Publication Date"
            :rules="[val => !!val || 'Publication date is required']"
            filled
          />

          <q-select
            v-if="selectedIssue?.type === 'issue'"
            v-model="editForm.status"
            :options="statusOptions"
            label="Status"
            filled
            emit-value
            map-options
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon :name="getStatusIcon(scope.opt.value)" :color="getStatusColor(scope.opt.value)" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>{{ getStatusDescription(scope.opt.value) }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-select
            v-model="editForm.template"
            :options="templateOptions"
            label="Newsletter Template"
            filled
            emit-value
            map-options
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon name="mdi-file-document-outline" color="secondary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    dense
                    icon="mdi-eye"
                    @click.stop="previewTemplate(scope.opt.value)"
                    size="sm"
                  >
                    <q-tooltip>Preview Template</q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-banner v-if="selectedIssue?.type === 'newsletter'" rounded class="bg-info text-white">
            <template v-slot:avatar>
              <q-icon name="mdi-information" />
            </template>
            You are editing an existing newsletter. Some options like status management are not available for existing newsletters.
          </q-banner>

          <div class="row q-gutter-sm">
            <q-btn
              label="Cancel"
              color="grey"
              flat
              v-close-popup
            />
            <q-btn
              label="Update Issue"
              color="primary"
              type="submit"
              :loading="isEditing"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { logger } from '../../utils/logger';
import { newsletterGenerationService } from '../../services/newsletter-generation.service';
import { firestoreService } from '../../services/firebase-firestore.service';

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
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'issue-updated'): void;
  (e: 'preview-template', templateName: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const $q = useQuasar();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const isEditing = ref(false);
const editForm = ref({
  id: '',
  title: '',
  issueNumber: '',
  publicationDate: '',
  status: 'draft' as 'draft' | 'generating' | 'ready' | 'published' | 'archived',
  template: 'standard' as string
});

// Status options for editing
const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Generating', value: 'generating' },
  { label: 'Ready', value: 'ready' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' }
];

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

// Watch for selectedIssue changes to populate form
watch(() => props.selectedIssue, (newIssue) => {
  if (newIssue) {
    editForm.value = {
      id: newIssue.id,
      title: newIssue.title,
      issueNumber: newIssue.issueNumber || '',
      publicationDate: newIssue.publicationDate.split('T')[0] || '',
      status: newIssue.status || 'draft',
      template: 'standard'
    };
  }
}, { immediate: true });

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'orange';
    case 'generating': return 'blue';
    case 'ready': return 'positive';
    case 'published': return 'info';
    case 'archived': return 'grey';
    default: return 'grey';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'draft': return 'mdi-content-save-edit';
    case 'generating': return 'mdi-cog';
    case 'ready': return 'mdi-check-circle';
    case 'published': return 'mdi-publish';
    case 'archived': return 'mdi-archive';
    default: return 'mdi-help-circle';
  }
};

const getStatusDescription = (status: string) => {
  switch (status) {
    case 'draft': return 'Work in progress, not ready for publication';
    case 'generating': return 'PDF is being generated';
    case 'ready': return 'Ready for publication';
    case 'published': return 'Published and available to public';
    case 'archived': return 'Archived, no longer active';
    default: return 'Unknown status';
  }
};

const previewTemplate = (templateName: string) => {
  emit('preview-template', templateName);
};

const updateIssue = async () => {
  if (!editForm.value.title || !editForm.value.issueNumber || !editForm.value.publicationDate) {
    return;
  }

  if (!props.selectedIssue) {
    $q.notify({
      type: 'warning',
      message: 'No issue selected for editing'
    });
    return;
  }

  isEditing.value = true;
  try {
    if (props.selectedIssue.type === 'issue') {
      // Update new issue using newsletter generation service
      await newsletterGenerationService.updateIssue(
        editForm.value.id,
        {
          title: editForm.value.title,
          issueNumber: editForm.value.issueNumber,
          publicationDate: new Date(editForm.value.publicationDate),
          status: editForm.value.status
        }
      );
    } else {
      // Update existing newsletter using firestore service
      await firestoreService.updateNewsletterMetadata(
        editForm.value.id,
        {
          title: editForm.value.title,
          issueNumber: editForm.value.issueNumber,
          publicationDate: new Date(editForm.value.publicationDate).toISOString()
        }
      );
    }

    $q.notify({
      type: 'positive',
      message: `${props.selectedIssue.type === 'issue' ? 'Newsletter issue' : 'Newsletter'} updated successfully!`
    });

    showDialog.value = false;
    emit('issue-updated');
  } catch (error) {
    logger.error('Failed to update newsletter:', error);
    $q.notify({
      type: 'negative',
      message: `Failed to update ${props.selectedIssue.type === 'issue' ? 'newsletter issue' : 'newsletter'}`
    });
  } finally {
    isEditing.value = false;
  }
};
</script>
