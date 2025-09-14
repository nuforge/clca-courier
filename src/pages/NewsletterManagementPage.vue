<!--
  Newsletter Management Page
  Admin interface for creating and managing newsletter issues
-->
<template>
  <q-page padding>
    <div class="q-pa-md">
      <!-- Header -->
      <div class="row items-center q-mb-lg">
        <div class="col">
          <h4 class="q-my-none">
            <q-icon name="mdi-newspaper-variant" class="q-mr-sm" />
            Newsletter Management
          </h4>
          <p class="text-body2 text-grey-6 q-my-none">
            Create and manage newsletter issues from approved content submissions
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            icon="add"
            label="Create New Issue"
            @click="showCreateDialog = true"
          />
        </div>
      </div>

      <!-- Statistics Overview -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-newspaper-variant" color="primary" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ issues.length }}</div>
              <div class="text-caption text-grey-6">Total Issues</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-content-save-edit" color="orange" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ draftIssues.length }}</div>
              <div class="text-caption text-grey-6">Draft Issues</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-check-circle" color="positive" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ readyIssues.length }}</div>
              <div class="text-caption text-grey-6">Ready Issues</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-file-document" color="info" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ approvedSubmissions.length }}</div>
              <div class="text-caption text-grey-6">Available Content</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Issues List -->
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="mdi-format-list-bulleted" class="q-mr-sm" />
            Newsletter Issues
          </div>

          <q-table
            :rows="issues"
            :columns="issueColumns"
            row-key="id"
            :loading="isLoading"
            :pagination="{ rowsPerPage: 10 }"
            flat
            bordered
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="getStatusColor(props.value)"
                  :label="props.value"
                  class="text-capitalize"
                />
              </q-td>
            </template>

            <template v-slot:body-cell-submissions="props">
              <q-td :props="props">
                <q-badge color="grey" :label="`${props.value.length} items`" />
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <div class="row q-gutter-xs">
                  <q-btn
                    flat
                    dense
                    size="sm"
                    icon="mdi-eye"
                    color="primary"
                    @click="viewIssue(props.row)"
                    :disable="props.row.submissions.length === 0"
                  >
                    <q-tooltip>View Content</q-tooltip>
                  </q-btn>

                  <q-btn
                    flat
                    dense
                    size="sm"
                    icon="mdi-cog"
                    color="secondary"
                    @click="editIssue()"
                  >
                    <q-tooltip>Edit Issue</q-tooltip>
                  </q-btn>

                  <q-btn
                    flat
                    dense
                    size="sm"
                    icon="mdi-file-pdf-box"
                    color="positive"
                    @click="generatePdf(props.row)"
                    :loading="props.row.status === 'generating'"
                    :disable="props.row.submissions.length === 0 || props.row.status === 'generating'"
                  >
                    <q-tooltip>Generate PDF</q-tooltip>
                  </q-btn>

                  <q-btn
                    v-if="props.row.finalPdfUrl"
                    flat
                    dense
                    size="sm"
                    icon="mdi-download"
                    color="info"
                    @click="downloadPdf(props.row)"
                  >
                    <q-tooltip>Download PDF</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>

      <!-- Create Issue Dialog -->
      <q-dialog v-model="showCreateDialog" persistent>
        <q-card style="min-width: 400px">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">Create New Newsletter Issue</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <q-form @submit="createIssue" class="q-gutter-md">
              <q-input
                v-model="newIssue.title"
                label="Issue Title"
                hint="e.g., 'Summer 2025 Newsletter'"
                :rules="[val => !!val || 'Title is required']"
                filled
              />

              <q-input
                v-model="newIssue.issueNumber"
                label="Issue Number"
                hint="e.g., '2025-03' or 'Summer-2025'"
                :rules="[val => !!val || 'Issue number is required']"
                filled
              />

              <q-input
                v-model="newIssue.publicationDate"
                type="date"
                label="Publication Date"
                :rules="[val => !!val || 'Publication date is required']"
                filled
              />

              <div class="row q-gutter-sm">
                <q-btn
                  label="Cancel"
                  color="grey"
                  flat
                  v-close-popup
                />
                <q-btn
                  label="Create Issue"
                  color="primary"
                  type="submit"
                  :loading="isCreating"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Issue Content Dialog -->
      <q-dialog v-model="showContentDialog" maximized>
        <q-card>
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">
              <q-icon name="mdi-newspaper-variant" class="q-mr-sm" />
              {{ selectedIssue?.title }} - Content Management
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
                    </div>

                    <q-list separator>
                      <q-item
                        v-for="submission in availableContent"
                        :key="submission.id"
                        clickable
                        @click="addToIssue(submission.id)"
                        :disable="selectedIssue?.submissions.includes(submission.id)"
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
                            :disable="selectedIssue?.submissions.includes(submission.id)"
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
                      Selected Content ({{ selectedIssue?.submissions.length || 0 }})
                    </div>

                    <q-list separator>
                      <q-item
                        v-for="submissionId in selectedIssue?.submissions"
                        :key="submissionId"
                        clickable
                        @click="removeFromIssue(submissionId)"
                      >
                        <q-item-section avatar>
                          <q-avatar color="positive" text-color="white">
                            {{ getSubmissionTitle(submissionId)?.charAt(0).toUpperCase() }}
                          </q-avatar>
                        </q-item-section>

                        <q-item-section>
                          <q-item-label>{{ getSubmissionTitle(submissionId) }}</q-item-label>
                        </q-item-section>

                        <q-item-section side>
                          <q-btn
                            flat
                            dense
                            icon="mdi-minus"
                            color="negative"
                            @click.stop="removeFromIssue(submissionId)"
                          />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { logger } from '../utils/logger';
// import { UI_ICONS } from '../constants/ui-icons';
import { newsletterGenerationService } from '../services/newsletter-generation.service';
import type { NewsletterIssue } from '../services/newsletter-generation.service';
import type { ContentDoc } from '../types/core/content.types';

const $q = useQuasar();

// State
const isLoading = ref(false);
const isCreating = ref(false);
const issues = ref<NewsletterIssue[]>([]);
const approvedSubmissions = ref<ContentDoc[]>([]);
const showCreateDialog = ref(false);
const showContentDialog = ref(false);
const selectedIssue = ref<NewsletterIssue | null>(null);

const newIssue = ref({
  title: '',
  issueNumber: '',
  publicationDate: ''
});

// Computed
const draftIssues = computed(() =>
  issues.value.filter(issue => issue.status === 'draft')
);

const readyIssues = computed(() =>
  issues.value.filter(issue => issue.status === 'ready')
);

const availableContent = computed(() =>
  approvedSubmissions.value.filter(submission =>
    !selectedIssue.value?.submissions.includes(submission.id)
  )
);

// Table columns
const issueColumns = [
  {
    name: 'title',
    required: true,
    label: 'Title',
    align: 'left' as const,
    field: 'title',
    sortable: true
  },
  {
    name: 'issueNumber',
    label: 'Issue #',
    align: 'left' as const,
    field: 'issueNumber',
    sortable: true
  },
  {
    name: 'publicationDate',
    label: 'Publication Date',
    align: 'left' as const,
    field: 'publicationDate',
    format: (val: Date) => val.toLocaleDateString(),
    sortable: true
  },
  {
    name: 'status',
    label: 'Status',
    align: 'center' as const,
    field: 'status',
    sortable: true
  },
  {
    name: 'submissions',
    label: 'Content',
    align: 'center' as const,
    field: 'submissions',
    sortable: false
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center' as const,
    field: 'actions',
    sortable: false
  }
];

// Methods
const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'orange';
    case 'generating': return 'blue';
    case 'ready': return 'positive';
    case 'published': return 'info';
    default: return 'grey';
  }
};

const getSubmissionTitle = (submissionId: string) => {
  const submission = approvedSubmissions.value.find(s => s.id === submissionId);
  return submission?.title || 'Unknown';
};

const loadData = async () => {
  isLoading.value = true;
  try {
    const [issuesData, submissionsData] = await Promise.all([
      newsletterGenerationService.getIssues(),
      newsletterGenerationService.getApprovedSubmissions()
    ]);

    issues.value = issuesData;
    approvedSubmissions.value = submissionsData;
  } catch (error) {
    logger.error('Failed to load newsletter data:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load newsletter data'
    });
  } finally {
    isLoading.value = false;
  }
};

const createIssue = async () => {
  if (!newIssue.value.title || !newIssue.value.issueNumber || !newIssue.value.publicationDate) {
    return;
  }

  isCreating.value = true;
  try {
    await newsletterGenerationService.createIssue(
      newIssue.value.title,
      newIssue.value.issueNumber,
      new Date(newIssue.value.publicationDate)
    );

    $q.notify({
      type: 'positive',
      message: 'Newsletter issue created successfully!'
    });

    // Reset form and close dialog
    newIssue.value = { title: '', issueNumber: '', publicationDate: '' };
    showCreateDialog.value = false;

    // Reload data
    await loadData();
  } catch (error) {
    logger.error('Failed to create newsletter issue:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to create newsletter issue'
    });
  } finally {
    isCreating.value = false;
  }
};

const viewIssue = (issue: NewsletterIssue) => {
  selectedIssue.value = issue;
  showContentDialog.value = true;
};

const editIssue = () => {
  // TODO: Implement issue editing
  $q.notify({
    type: 'info',
    message: 'Issue editing coming soon!'
  });
};

const generatePdf = async (issue: NewsletterIssue) => {
  try {
    await newsletterGenerationService.generateNewsletterPdf(issue.id);

    $q.notify({
      type: 'positive',
      message: 'PDF generation started! Check back in a few minutes.'
    });

    // Reload data to show updated status
    await loadData();
  } catch (error) {
    logger.error('Failed to generate PDF:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to start PDF generation'
    });
  }
};

const downloadPdf = (issue: NewsletterIssue) => {
  if (issue.finalPdfUrl) {
    window.open(issue.finalPdfUrl, '_blank');
  }
};

const addToIssue = async (submissionId: string) => {
  if (!selectedIssue.value) return;

  try {
    const updatedSubmissions = [...selectedIssue.value.submissions, submissionId];
    await newsletterGenerationService.addSubmissionsToIssue(
      selectedIssue.value.id,
      updatedSubmissions
    );

    selectedIssue.value.submissions = updatedSubmissions;

    $q.notify({
      type: 'positive',
      message: 'Content added to issue'
    });
  } catch (error) {
    logger.error('Failed to add content to issue:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to add content to issue'
    });
  }
};

const removeFromIssue = async (submissionId: string) => {
  if (!selectedIssue.value) return;

  try {
    const updatedSubmissions = selectedIssue.value.submissions.filter(
      id => id !== submissionId
    );
    await newsletterGenerationService.addSubmissionsToIssue(
      selectedIssue.value.id,
      updatedSubmissions
    );

    selectedIssue.value.submissions = updatedSubmissions;

    $q.notify({
      type: 'positive',
      message: 'Content removed from issue'
    });
  } catch (error) {
    logger.error('Failed to remove content from issue:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to remove content from issue'
    });
  }
};

// Lifecycle
onMounted(() => {
  void loadData();
});
</script>

<style scoped>
.q-table {
  font-size: 0.875rem;
}

.q-item {
  border-radius: 4px;
  margin-bottom: 4px;
}

.q-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
