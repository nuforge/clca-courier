<!--
  Issue Content Dialog
  Component for managing content within newsletter issues
-->
<template>
  <q-dialog v-model="showDialog" maximized>
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon name="mdi-newspaper-variant" class="q-mr-sm" />
          {{ localSelectedIssue?.title }} - Content Management
          <q-badge v-if="localSelectedIssue?.type === 'newsletter'" color="warning" class="q-ml-sm">
            Read-only (Existing Newsletter)
          </q-badge>
          <q-badge v-else color="info" class="q-ml-sm">
            {{ localSelectedIssue?.submissions.length || 0 }} content items
          </q-badge>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Available Content -->
          <div class="col-12 col-md-6">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  <q-icon name="mdi-file-document-outline" class="q-mr-sm" />
                  Available Content
                  <q-badge v-if="localSelectedIssue?.type === 'newsletter'" color="warning" class="q-ml-sm">
                    Not applicable for existing newsletters
                  </q-badge>
                </div>

                <q-list separator>
                  <q-item
                    v-for="submission in availableContent"
                    :key="submission.id"
                    clickable
                    @click="addToIssue(submission.id)"
                    :disable="localSelectedIssue?.submissions.includes(submission.id) || localSelectedIssue?.type === 'newsletter'"
                  >
                    <q-item-section avatar>
                      <q-avatar color="primary" text-color="white">
                        {{ submission.title.charAt(0).toUpperCase() }}
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>{{ submission.title }}</q-item-label>
                      <q-item-label caption>
                        {{ submission.description?.substring(0, 100) }}...
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-btn
                        flat
                        dense
                        icon="mdi-plus"
                        color="positive"
                        @click.stop="addToIssue(submission.id)"
                        :disable="localSelectedIssue?.submissions.includes(submission.id) || localSelectedIssue?.type === 'newsletter'"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>

          <!-- Selected Content -->
          <div class="col-12 col-md-6">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  <q-icon name="mdi-check-circle" class="q-mr-sm" />
                  Selected Content ({{ localSelectedIssue?.submissions.length || 0 }})
                  <q-badge v-if="localSelectedIssue?.type === 'newsletter'" color="info" class="q-ml-sm">
                    Existing newsletters don't have selectable content
                  </q-badge>
                </div>

                <q-list separator>
                  <q-item
                    v-for="(submissionId, index) in localSelectedIssue?.submissions"
                    :key="submissionId"
                    clickable
                    @click="removeFromIssue(submissionId)"
                    :disable="localSelectedIssue?.type === 'newsletter'"
                    class="content-item"
                  >
                    <q-item-section avatar>
                      <q-avatar color="positive" text-color="white">
                        {{ getSubmissionTitle(submissionId)?.charAt(0).toUpperCase() }}
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>{{ getSubmissionTitle(submissionId) }}</q-item-label>
                      <q-item-label caption>Order: {{ index + 1 }}</q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <div class="row q-gutter-xs">
                        <!-- Move Up -->
                        <q-btn
                          v-if="index > 0"
                          flat
                          dense
                          icon="mdi-arrow-up"
                          color="primary"
                          size="sm"
                          @click.stop="moveContentUp(index)"
                          :disable="localSelectedIssue?.type === 'newsletter'"
                        >
                          <q-tooltip>Move Up</q-tooltip>
                        </q-btn>

                        <!-- Move Down -->
                        <q-btn
                          v-if="index < (localSelectedIssue?.submissions.length || 0) - 1"
                          flat
                          dense
                          icon="mdi-arrow-down"
                          color="primary"
                          size="sm"
                          @click.stop="moveContentDown(index)"
                          :disable="localSelectedIssue?.type === 'newsletter'"
                        >
                          <q-tooltip>Move Down</q-tooltip>
                        </q-btn>

                        <!-- Remove -->
                        <q-btn
                          flat
                          dense
                          icon="mdi-minus"
                          color="negative"
                          size="sm"
                          @click.stop="removeFromIssue(submissionId)"
                          :disable="localSelectedIssue?.type === 'newsletter'"
                        >
                          <q-tooltip>Remove</q-tooltip>
                        </q-btn>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>

                <!-- Show message for existing newsletters -->
                <div v-if="localSelectedIssue?.type === 'newsletter'" class="text-center text-grey-6 q-pa-lg">
                  <q-icon name="mdi-information" size="2rem" class="q-mb-sm" />
                  <div>This is an existing newsletter with fixed content.</div>
                  <div>Use the "View Newsletter" button to open the PDF.</div>
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
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { logger } from '../../utils/logger';
import { newsletterGenerationService } from '../../services/newsletter-generation.service';
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
  (e: 'content-updated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const $q = useQuasar();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const availableContent = computed(() =>
  props.approvedSubmissions.filter(submission =>
    !localSelectedIssue.value?.submissions.includes(submission.id)
  )
);

// Create a local reactive copy of the selected issue to handle immediate UI updates
const localSelectedIssue = ref<NewsletterIssue | null>(null);

// Watch for changes to selectedIssue and update local copy
watch(() => props.selectedIssue, (newIssue) => {
  if (newIssue) {
    localSelectedIssue.value = { ...newIssue };
  } else {
    localSelectedIssue.value = null;
  }
}, { immediate: true, deep: true });

const getSubmissionTitle = (submissionId: string) => {
  const submission = props.approvedSubmissions.find(s => s.id === submissionId);
  return submission?.title || 'Unknown';
};

const addToIssue = async (submissionId: string) => {
  if (!localSelectedIssue.value || localSelectedIssue.value.type !== 'issue') return;

  try {
    const updatedSubmissions = [...localSelectedIssue.value.submissions, submissionId];

    // Update local copy immediately for reactive UI
    localSelectedIssue.value.submissions = updatedSubmissions;

    await newsletterGenerationService.addSubmissionsToIssue(
      localSelectedIssue.value.id,
      updatedSubmissions
    );

    $q.notify({
      type: 'positive',
      message: 'Content added to issue'
    });

    emit('content-updated');
  } catch (error) {
    logger.error('Failed to add content to issue:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to add content to issue'
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
      message: 'Content removed from issue'
    });

    emit('content-updated');
  } catch (error) {
    logger.error('Failed to remove content from issue:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to remove content from issue'
    });

    // Revert local changes on error
    if (localSelectedIssue.value) {
      localSelectedIssue.value.submissions = props.selectedIssue?.submissions || [];
    }
  }
};

const moveContentUp = async (index: number) => {
  if (!localSelectedIssue.value || localSelectedIssue.value.type !== 'issue' || index <= 0) return;

  try {
    const submissions = [...localSelectedIssue.value.submissions];
    const temp = submissions[index - 1]!;
    submissions[index - 1] = submissions[index]!;
    submissions[index] = temp;

    // Update local copy immediately for reactive UI
    localSelectedIssue.value.submissions = submissions;

    await newsletterGenerationService.addSubmissionsToIssue(
      localSelectedIssue.value.id,
      submissions
    );

    $q.notify({
      type: 'positive',
      message: 'Content order updated'
    });

    emit('content-updated');
  } catch (error) {
    logger.error('Failed to move content up:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update content order'
    });

    // Revert local changes on error
    if (localSelectedIssue.value) {
      localSelectedIssue.value.submissions = props.selectedIssue?.submissions || [];
    }
  }
};

const moveContentDown = async (index: number) => {
  if (!localSelectedIssue.value || localSelectedIssue.value.type !== 'issue' || index >= (localSelectedIssue.value.submissions.length - 1)) return;

  try {
    const submissions = [...localSelectedIssue.value.submissions];
    const temp = submissions[index]!;
    submissions[index] = submissions[index + 1]!;
    submissions[index + 1] = temp;

    // Update local copy immediately for reactive UI
    localSelectedIssue.value.submissions = submissions;

    await newsletterGenerationService.addSubmissionsToIssue(
      localSelectedIssue.value.id,
      submissions
    );

    $q.notify({
      type: 'positive',
      message: 'Content order updated'
    });

    emit('content-updated');
  } catch (error) {
    logger.error('Failed to move content down:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update content order'
    });

    // Revert local changes on error
    if (localSelectedIssue.value) {
      localSelectedIssue.value.submissions = props.selectedIssue?.submissions || [];
    }
  }
};
</script>

<style scoped>
.q-item {
  border-radius: 4px;
  margin-bottom: 4px;
}

.q-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.content-item {
  transition: all 0.2s ease;
}

.content-item:hover {
  background-color: rgba(0, 0, 0, 0.06);
  transform: translateX(2px);
}
</style>
