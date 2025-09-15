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
            color="secondary"
            icon="mdi-palette"
            label="Manage Templates"
            @click="showTemplateDialog = true"
            class="q-mr-sm"
          />
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
            <template v-slot:body-cell-type="props">
              <q-td :props="props">
                <q-badge
                  :color="props.value === 'issue' ? 'primary' : 'secondary'"
                  :label="props.value === 'issue' ? 'New Issue' : 'Newsletter'"
                  :icon="props.value === 'issue' ? 'mdi-plus-circle' : 'mdi-newspaper-variant'"
                />
              </q-td>
            </template>

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
                  <!-- View Content - only for new issues with submissions -->
                  <q-btn
                    v-if="props.row.type === 'issue'"
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

                  <!-- Edit Issue - only for new issues -->
                  <q-btn
                    v-if="props.row.type === 'issue'"
                    flat
                    dense
                    size="sm"
                    icon="mdi-cog"
                    color="secondary"
                    @click="editIssue()"
                  >
                    <q-tooltip>Edit Issue</q-tooltip>
                  </q-btn>

                  <!-- Generate PDF - only for new issues -->
                  <q-btn
                    v-if="props.row.type === 'issue'"
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

                  <!-- Download PDF - for both types if PDF exists -->
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

                  <!-- View Newsletter - for existing newsletters -->
                  <q-btn
                    v-if="props.row.type === 'newsletter'"
                    flat
                    dense
                    size="sm"
                    icon="mdi-eye"
                    color="primary"
                    @click="viewNewsletter(props.row)"
                  >
                    <q-tooltip>View Newsletter</q-tooltip>
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
              <q-badge v-if="selectedIssue?.type === 'newsletter'" color="warning" class="q-ml-sm">
                Read-only (Existing Newsletter)
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
                      <q-badge v-if="selectedIssue?.type === 'newsletter'" color="warning" class="q-ml-sm">
                        Not applicable for existing newsletters
                      </q-badge>
                    </div>

                    <q-list separator>
                      <q-item
                        v-for="submission in availableContent"
                        :key="submission.id"
                        clickable
                        @click="addToIssue(submission.id)"
                        :disable="selectedIssue?.submissions.includes(submission.id) || selectedIssue?.type === 'newsletter'"
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
                            :disable="selectedIssue?.submissions.includes(submission.id) || selectedIssue?.type === 'newsletter'"
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
                      <q-badge v-if="selectedIssue?.type === 'newsletter'" color="info" class="q-ml-sm">
                        Existing newsletters don't have selectable content
                      </q-badge>
                    </div>

                    <q-list separator>
                      <q-item
                        v-for="submissionId in selectedIssue?.submissions"
                        :key="submissionId"
                        clickable
                        @click="removeFromIssue(submissionId)"
                        :disable="selectedIssue?.type === 'newsletter'"
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
                            :disable="selectedIssue?.type === 'newsletter'"
                          />
                        </q-item-section>
                      </q-item>
                    </q-list>

                    <!-- Show message for existing newsletters -->
                    <div v-if="selectedIssue?.type === 'newsletter'" class="text-center text-grey-6 q-pa-lg">
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

      <!-- Template Management Dialog -->
      <q-dialog v-model="showTemplateDialog" maximized>
        <q-card>
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">Template Management</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <!-- Available Templates -->
              <div class="col-12 col-md-6">
                <q-card>
                  <q-card-section>
                    <div class="text-h6">Available Templates</div>
                    <div class="text-caption text-grey-6">Click to preview or test templates</div>
                  </q-card-section>

                  <q-card-section>
                    <q-list>
                      <q-item
                        v-for="template in availableTemplates"
                        :key="template"
                        clickable
                        @click="previewTemplate(template)"
                      >
                        <q-item-section>
                          <q-item-label>{{ getTemplateDisplayName(template) }}</q-item-label>
                          <q-item-label caption>{{ getTemplateDescription(template) }}</q-item-label>
                        </q-item-section>

                        <q-item-section side>
                          <q-btn
                            flat
                            icon="preview"
                            @click.stop="previewTemplate(template)"
                            size="sm"
                          />
                          <q-btn
                            flat
                            icon="mdi-test-tube"
                            @click.stop="testTemplate(template)"
                            size="sm"
                          />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Template Preview -->
              <div class="col-12 col-md-6">
                <q-card>
                  <q-card-section>
                    <div class="text-h6">Template Preview</div>
                    <div class="text-caption text-grey-6">Preview of selected template</div>
                  </q-card-section>

                  <q-card-section>
                    <div v-if="selectedTemplatePreview" class="template-preview-container">
                      <iframe
                        :srcdoc="selectedTemplatePreview"
                        class="template-preview-iframe"
                        sandbox="allow-same-origin"
                      />
                    </div>
                    <div v-else class="text-center text-grey-6 q-pa-lg">
                      Select a template to preview
                    </div>
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
import { templateManagementService } from '../services/template-management.service';
import { firestoreService } from '../services/firebase-firestore.service';
import { normalizeDate, formatDate, sortByDateDesc } from '../utils/date-formatter';
import type { NewsletterIssue } from '../services/newsletter-generation.service';
import type { NewsletterMetadata } from '../services/firebase-firestore.service';
import type { ContentDoc } from '../types/core/content.types';

const $q = useQuasar();

// Unified newsletter interface for display
interface UnifiedNewsletterItem {
  id: string;
  title: string;
  issueNumber: string;
  publicationDate: Date;
  status: 'draft' | 'generating' | 'ready' | 'published' | 'archived';
  submissions: string[];
  finalPdfUrl?: string | undefined;
  type: 'issue' | 'newsletter'; // Distinguish between new issues and existing newsletters
  pageCount?: number | undefined;
  filename?: string | undefined;
}

// State
const isLoading = ref(false);
const isCreating = ref(false);
const issues = ref<UnifiedNewsletterItem[]>([]);
const approvedSubmissions = ref<ContentDoc[]>([]);
const showCreateDialog = ref(false);
const showContentDialog = ref(false);
const selectedIssue = ref<UnifiedNewsletterItem | null>(null);

const newIssue = ref({
  title: '',
  issueNumber: '',
  publicationDate: ''
});

// Template management state
const showTemplateDialog = ref(false);
const availableTemplates = ref<string[]>([]);
const selectedTemplatePreview = ref<string>('');

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
    name: 'type',
    label: 'Type',
    align: 'center' as const,
    field: 'type',
    sortable: true,
    format: (val: string) => val === 'issue' ? 'New Issue' : 'Newsletter'
  },
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
    format: (val: Date) => formatDate(val, 'SHORT'),
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
    const [issuesData, newslettersData, submissionsData] = await Promise.all([
      newsletterGenerationService.getIssues(),
      firestoreService.getAllNewslettersForAdmin(),
      newsletterGenerationService.getApprovedSubmissions()
    ]);

    // Convert newsletter issues to unified format
    const unifiedIssues: UnifiedNewsletterItem[] = issuesData.map((issue: NewsletterIssue) => {
      // Use centralized date formatter to handle all date types safely
      const publicationDate = normalizeDate(issue.publicationDate) || new Date();

      return {
        id: issue.id,
        title: issue.title,
        issueNumber: issue.issueNumber,
        publicationDate,
        status: issue.status,
        submissions: issue.submissions,
        finalPdfUrl: issue.finalPdfUrl ?? undefined,
        type: 'issue' as const
      };
    });

    // Convert existing newsletters to unified format
    const unifiedNewsletters: UnifiedNewsletterItem[] = newslettersData.map((newsletter: NewsletterMetadata) => ({
      id: newsletter.id,
      title: newsletter.title,
      issueNumber: newsletter.issueNumber || newsletter.filename || 'Unknown',
      publicationDate: normalizeDate(newsletter.publicationDate) || new Date(),
      status: newsletter.isPublished ? 'published' : 'draft',
      submissions: [], // Existing newsletters don't have submissions
      finalPdfUrl: newsletter.downloadUrl,
      type: 'newsletter' as const,
      pageCount: newsletter.pageCount ?? undefined,
      filename: newsletter.filename ?? undefined
    }));

    // Combine and sort by publication date using centralized date formatter
    issues.value = [...unifiedIssues, ...unifiedNewsletters].sort(
      (a, b) => sortByDateDesc(a.publicationDate, b.publicationDate)
    );

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

const viewIssue = (issue: UnifiedNewsletterItem) => {
  selectedIssue.value = issue;
  showContentDialog.value = true;
};

const viewNewsletter = (newsletter: UnifiedNewsletterItem) => {
  // For existing newsletters, open the PDF directly
  if (newsletter.finalPdfUrl) {
    window.open(newsletter.finalPdfUrl, '_blank');
  } else {
    $q.notify({
      type: 'warning',
      message: 'No PDF available for this newsletter'
    });
  }
};

const editIssue = () => {
  // TODO: Implement issue editing
  $q.notify({
    type: 'info',
    message: 'Issue editing coming soon!'
  });
};

const generatePdf = async (issue: UnifiedNewsletterItem) => {
  if (issue.type !== 'issue') {
    $q.notify({
      type: 'warning',
      message: 'PDF generation is only available for new issues'
    });
    return;
  }

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

const downloadPdf = (item: UnifiedNewsletterItem) => {
  if (item.finalPdfUrl) {
    window.open(item.finalPdfUrl, '_blank');
  } else {
    $q.notify({
      type: 'warning',
      message: 'No PDF available for download'
    });
  }
};

const addToIssue = async (submissionId: string) => {
  if (!selectedIssue.value || selectedIssue.value.type !== 'issue') return;

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
  if (!selectedIssue.value || selectedIssue.value.type !== 'issue') return;

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

// Template management methods
// TODO: Re-enable when CORS issue is fixed
// const loadAvailableTemplates = async () => {
//   try {
//     const result = await templateManagementService.getAvailableTemplates();
//     if (result.success) {
//       availableTemplates.value = result.templates;
//     } else {
//       logger.error('Failed to load templates:', result.error);
//     }
//   } catch (error) {
//     logger.error('Error loading templates:', error);
//   }
// };

const previewTemplate = async (templateName: string) => {
  try {
    const sampleData = templateManagementService.createSampleData('news');
    const result = await templateManagementService.previewTemplate(templateName, sampleData);

    if (result.success && result.html) {
      selectedTemplatePreview.value = result.html;
    } else {
      logger.error('Failed to preview template:', result.error);
      $q.notify({
        type: 'negative',
        message: 'Failed to preview template'
      });
    }
  } catch (error) {
    logger.error('Error previewing template:', error);
    $q.notify({
      type: 'negative',
      message: 'Error previewing template'
    });
  }
};

const testTemplate = async (templateName: string) => {
  try {
    const sampleData = templateManagementService.createSampleData('news');
    const result = await templateManagementService.testTemplate(templateName, sampleData);

    if (result.success && result.downloadUrl) {
      $q.notify({
        type: 'positive',
        message: 'Test PDF generated successfully!',
        caption: 'Click to download',
        actions: [
          {
            label: 'Download',
            color: 'white',
            handler: () => {
              window.open(result.downloadUrl, '_blank');
            }
          }
        ]
      });
    } else {
      logger.error('Failed to test template:', result.error);
      $q.notify({
        type: 'negative',
        message: 'Failed to test template'
      });
    }
  } catch (error) {
    logger.error('Error testing template:', error);
    $q.notify({
      type: 'negative',
      message: 'Error testing template'
    });
  }
};

const getTemplateDisplayName = (templateName: string): string => {
  const info = templateManagementService.getTemplateInfo(templateName);
  return info.displayName;
};

const getTemplateDescription = (templateName: string): string => {
  const info = templateManagementService.getTemplateInfo(templateName);
  return info.description;
};

// Lifecycle
onMounted(() => {
  void loadData();
  // TODO: Fix CORS issue with template management service
  // void loadAvailableTemplates();
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

.template-preview-container {
  width: 100%;
  height: 60vh;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.template-preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.q-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
