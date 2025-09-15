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
          <q-btn-group>
          <q-btn
            color="secondary"
            icon="mdi-palette"
              label="Templates"
            @click="showTemplateDialog = true"
            />
            <q-btn
              color="info"
              icon="mdi-refresh"
              label="Refresh"
              @click="loadData"
              :loading="isLoading"
          />
          <q-btn
            color="primary"
            icon="add"
              label="New Issue"
            @click="showCreateDialog = true"
            />
          </q-btn-group>
        </div>
      </div>

      <!-- Statistics Overview -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-2">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-newspaper-variant" color="primary" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ issues.length }}</div>
              <div class="text-caption text-grey-6">Total</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-content-save-edit" color="orange" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ draftIssues.length }}</div>
              <div class="text-caption text-grey-6">Draft</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-cog" color="blue" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ generatingIssues.length }}</div>
              <div class="text-caption text-grey-6">Generating</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-check-circle" color="positive" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ readyIssues.length }}</div>
              <div class="text-caption text-grey-6">Ready</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-publish" color="info" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ publishedIssues.length }}</div>
              <div class="text-caption text-grey-6">Published</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="mdi-archive" color="grey" size="2rem" />
              <div class="text-h5 q-mt-sm">{{ archivedIssues.length }}</div>
              <div class="text-caption text-grey-6">Archived</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Workflow Guide -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="mdi-help-circle" class="q-mr-sm" />
            Newsletter Workflow Guide
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <q-icon name="mdi-plus-circle" color="primary" size="2rem" class="q-mb-sm" />
                  <div class="text-subtitle2">1. Create Issue</div>
                  <div class="text-caption text-grey-6">Click "New Issue" to create a newsletter issue</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <q-icon name="mdi-format-list-bulleted" color="orange" size="2rem" class="q-mb-sm" />
                  <div class="text-subtitle2">2. Add Content</div>
                  <div class="text-caption text-grey-6">Click "Manage Content" to add approved submissions</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <q-icon name="mdi-file-pdf-box" color="positive" size="2rem" class="q-mb-sm" />
                  <div class="text-subtitle2">3. Generate PDF</div>
                  <div class="text-caption text-grey-6">Click "Generate PDF" to create the newsletter</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <q-icon name="mdi-publish" color="info" size="2rem" class="q-mb-sm" />
                  <div class="text-subtitle2">4. Publish</div>
                  <div class="text-caption text-grey-6">Change status to "Published" when ready</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Action Toolbar -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="row items-center q-col-gutter-md">
            <div class="col-auto">
              <q-btn color="primary" icon="mdi-refresh" label="Refresh" @click="loadData"
                :loading="isLoading" />
            </div>
            <div class="col-auto">
              <q-btn color="positive" icon="mdi-check-all" label="Bulk Publish" @click="showBulkPublishDialog"
                :disable="selectedIssues.length === 0" />
            </div>
            <div class="col-auto">
              <q-btn color="warning" icon="mdi-archive" label="Bulk Archive"
                @click="showBulkArchiveDialog" :disable="selectedIssues.length === 0" outline />
            </div>
            <div class="col">
              <q-space />
            </div>
            <div class="col-auto">
              <q-toggle v-model="autoRefresh" label="Auto-refresh" />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Issues List -->
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="mdi-format-list-bulleted" class="q-mr-sm" />
            Newsletter Issues
          </div>

          <!-- Content Tabs -->
          <q-tabs v-model="activeTab" dense class="text-grey" active-color="primary" indicator-color="primary"
            align="justify" narrow-indicator>
            <q-tab name="all">
              <q-icon name="mdi-newspaper-variant" color="primary" class="q-mr-sm" />
              All ({{ issues.length }})
            </q-tab>
            <q-tab name="draft">
              <q-icon name="mdi-content-save-edit" color="orange" class="q-mr-sm" />
              Draft ({{ draftIssues.length }})
            </q-tab>
            <q-tab name="generating">
              <q-icon name="mdi-cog" color="blue" class="q-mr-sm" />
              Generating ({{ generatingIssues.length }})
            </q-tab>
            <q-tab name="ready">
              <q-icon name="mdi-check-circle" color="positive" class="q-mr-sm" />
              Ready ({{ readyIssues.length }})
            </q-tab>
            <q-tab name="published">
              <q-icon name="mdi-publish" color="info" class="q-mr-sm" />
              Published ({{ publishedIssues.length }})
            </q-tab>
            <q-tab name="archived">
              <q-icon name="mdi-archive" color="grey" class="q-mr-sm" />
              Archived ({{ archivedIssues.length }})
            </q-tab>
            <q-tab name="new-issues">
              <q-icon name="mdi-plus-circle" color="primary" class="q-mr-sm" />
              New Issues ({{ newIssues.length }})
            </q-tab>
            <q-tab name="existing">
              <q-icon name="mdi-newspaper-variant" color="secondary" class="q-mr-sm" />
              Existing ({{ existingNewsletters.length }})
            </q-tab>
          </q-tabs>

          <q-separator />

          <q-table
            :rows="filteredIssues"
            :columns="issueColumns"
            row-key="id"
            :loading="isLoading"
            :pagination="{ rowsPerPage: 10 }"
            :selected="selectedIssues"
            @update:selected="selectedIssues = $event as string[]"
            selection="multiple"
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
                <div class="column items-center q-gutter-xs">
                  <q-badge
                    :color="props.value.length > 0 ? 'positive' : 'grey'"
                    :label="`${props.value.length} items`"
                  />
                  <div v-if="props.row.type === 'issue'" class="text-caption text-grey-6">
                    {{ props.value.length === 0 ? 'No content' :
                       props.row.finalPdfUrl ? 'PDF ready' :
                       props.row.status === 'generating' ? 'Generating...' : 'Ready for PDF' }}
                  </div>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <div class="row q-gutter-xs">
                  <!-- Manage Content - for new issues -->
                  <q-btn
                    v-if="props.row.type === 'issue'"
                    flat
                    dense
                    size="sm"
                    icon="mdi-format-list-bulleted"
                    color="primary"
                    @click="viewIssue(props.row)"
                  >
                    <q-tooltip>Manage Content ({{ props.row.submissions.length }} items)</q-tooltip>
                  </q-btn>

                  <!-- Layout Pages - for issues with content -->
                  <q-btn
                    v-if="props.row.type === 'issue' && props.row.submissions.length > 0"
                    flat
                    dense
                    size="sm"
                    icon="mdi-view-dashboard"
                    color="info"
                    @click="layoutPages(props.row)"
                  >
                    <q-tooltip>Layout Pages</q-tooltip>
                  </q-btn>

                  <!-- Edit Issue - for all issues -->
                  <q-btn
                    flat
                    dense
                    size="sm"
                    icon="mdi-cog"
                    color="secondary"
                    @click="editIssue(props.row)"
                  >
                    <q-tooltip>{{ props.row.type === 'issue' ? 'Edit Issue' : 'Edit Newsletter' }}</q-tooltip>
                  </q-btn>

                  <!-- Unpublish - for published issues -->
                  <q-btn
                    v-if="props.row.status === 'published'"
                    flat
                    dense
                    size="sm"
                    icon="mdi-publish-off"
                    color="warning"
                    @click="unpublishIssue(props.row)"
                  >
                    <q-tooltip>Unpublish Newsletter</q-tooltip>
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
                    <q-tooltip>
                      {{ props.row.submissions.length === 0 ? 'Add content first' :
                         props.row.status === 'generating' ? 'Generating PDF...' :
                         props.row.finalPdfUrl ? 'Regenerate PDF' : 'Generate PDF' }}
                    </q-tooltip>
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

                  <!-- Duplicate Issue - for new issues -->
                  <q-btn
                    v-if="props.row.type === 'issue'"
                    flat
                    dense
                    size="sm"
                    icon="mdi-content-duplicate"
                    color="info"
                    @click="duplicateIssue(props.row)"
                  >
                    <q-tooltip>Duplicate Issue</q-tooltip>
                  </q-btn>

                  <!-- Delete Issue - for new issues -->
                  <q-btn
                    v-if="props.row.type === 'issue'"
                    flat
                    dense
                    size="sm"
                    icon="mdi-delete"
                    color="negative"
                    @click="deleteIssue(props.row)"
                  >
                    <q-tooltip>Delete Issue</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>

      <!-- Create Issue Dialog -->
      <CreateIssueDialog
        v-model="showCreateDialog"
        @issue-created="loadData"
      />

      <!-- Edit Issue Dialog -->
      <EditIssueDialog
        v-model="showEditDialog"
        :selected-issue="selectedIssue"
        @issue-updated="loadData"
        @preview-template="previewTemplate"
      />

      <!-- Issue Content Dialog -->
      <IssueContentDialog
        v-model="showContentDialog"
        :selected-issue="selectedIssue"
        :approved-submissions="approvedSubmissions"
        @content-updated="loadData"
      />

      <!-- Template Management Dialog -->
      <TemplateManagementDialog
        v-model="showTemplateDialog"
      />

      <!-- Page Layout Management Dialog -->
      <PageLayoutDialog
        v-model="showLayoutDialog"
        :selected-issue="selectedIssue"
        :approved-submissions="approvedSubmissions"
        @preview-newsletter="previewNewsletter"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { logger } from '../utils/logger';
// import { UI_ICONS } from '../constants/ui-icons';
import { newsletterGenerationService } from '../services/newsletter-generation.service';
import { normalizeDate, formatDate, sortByDateDesc } from '../utils/date-formatter';
import type { UnifiedNewsletter } from '../types/core/newsletter.types';
import type { ContentDoc } from '../types/core/content.types';

// Dialog components
import CreateIssueDialog from '../components/newsletter-management/CreateIssueDialog.vue';
import EditIssueDialog from '../components/newsletter-management/EditIssueDialog.vue';
import IssueContentDialog from '../components/newsletter-management/IssueContentDialog.vue';
import TemplateManagementDialog from '../components/newsletter-management/TemplateManagementDialog.vue';
import PageLayoutDialog from '../components/newsletter-management/PageLayoutDialog.vue';

const $q = useQuasar();

// Extended UnifiedNewsletter to support draft issues
interface NewsletterIssue extends UnifiedNewsletter {
  status: 'draft' | 'generating' | 'ready' | 'published' | 'archived';
  submissions: string[]; // Array of content IDs for new issues
  finalPdfPath?: string; // Path to generated PDF
  type?: 'issue' | 'newsletter'; // Distinguish between new issues and existing newsletters
}

// State
const isLoading = ref(false);
const issues = ref<NewsletterIssue[]>([]);
const approvedSubmissions = ref<ContentDoc[]>([]);
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showContentDialog = ref(false);
const showLayoutDialog = ref(false);
const selectedIssue = ref<NewsletterIssue | null>(null);

// Filtering and tabs state
const activeTab = ref('all');
const selectedIssues = ref<string[]>([]);
const autoRefresh = ref(false);
let refreshInterval: number | null = null;

// Template management state
const showTemplateDialog = ref(false);


// Computed
const draftIssues = computed(() =>
  issues.value.filter(issue => issue.status === 'draft')
);

const readyIssues = computed(() =>
  issues.value.filter(issue => issue.status === 'ready')
);

const publishedIssues = computed(() =>
  issues.value.filter(issue => issue.status === 'published')
);

const archivedIssues = computed(() =>
  issues.value.filter(issue => issue.status === 'archived')
);

const generatingIssues = computed(() =>
  issues.value.filter(issue => issue.status === 'generating')
);

const newIssues = computed(() =>
  issues.value.filter(issue => issue.type === 'issue')
);

const existingNewsletters = computed(() =>
  issues.value.filter(issue => issue.type === 'newsletter')
);


// Filtered issues based on active tab
const filteredIssues = computed(() => {
  switch (activeTab.value) {
    case 'draft':
      return draftIssues.value;
    case 'published':
      return publishedIssues.value;
    case 'archived':
      return archivedIssues.value;
    case 'generating':
      return generatingIssues.value;
    case 'new-issues':
      return newIssues.value;
    case 'existing':
      return existingNewsletters.value;
    case 'all':
    default:
      return issues.value;
  }
});

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
    case 'archived': return 'grey';
    default: return 'grey';
  }
};


const loadData = async () => {
  isLoading.value = true;
  try {
    // Now we only need to load from the unified newsletters collection
    const [newslettersData, submissionsData] = await Promise.all([
      newsletterGenerationService.getIssues(), // This now returns all newsletters (existing + new issues)
      newsletterGenerationService.getApprovedSubmissions()
    ]);

    // All newsletters are now in the same collection with consistent structure
    issues.value = newslettersData.map((newsletter: NewsletterIssue) => {
      // Use centralized date formatter to handle all date types safely
      const publicationDate = normalizeDate(newsletter.publicationDate) || new Date();

      return {
        ...newsletter,
        publicationDate: publicationDate.toISOString(), // Convert to ISO string for consistency
        type: newsletter.isPublished ? 'newsletter' as const : 'issue' as const
      } as NewsletterIssue;
    }).sort(
      (a, b) => sortByDateDesc(new Date(a.publicationDate), new Date(b.publicationDate))
    );

    approvedSubmissions.value = submissionsData;

    // Debug logging
    logger.info('Newsletter data loaded', {
      newslettersCount: newslettersData.length,
      submissionsCount: submissionsData.length,
      availableContentCount: approvedSubmissions.value.filter(submission =>
        !selectedIssue.value?.submissions.includes(submission.id)
      ).length
    });
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


const viewIssue = (issue: NewsletterIssue) => {
  selectedIssue.value = issue;
  showContentDialog.value = true;
};

const layoutPages = (issue: NewsletterIssue) => {
  selectedIssue.value = issue;
  showLayoutDialog.value = true;
};

const viewNewsletter = (newsletter: NewsletterIssue) => {
  // For existing newsletters, open the PDF directly
  if (newsletter.downloadUrl) {
    window.open(newsletter.downloadUrl, '_blank');
  } else {
  $q.notify({
      type: 'warning',
      message: 'No PDF available for this newsletter'
    });
  }
};

const editIssue = (issue?: NewsletterIssue) => {
  if (issue) {
    selectedIssue.value = issue;
  }

  if (!selectedIssue.value) {
    $q.notify({
      type: 'warning',
      message: 'Please select an issue to edit'
    });
    return;
  }

  showEditDialog.value = true;
};

const unpublishIssue = (issue: NewsletterIssue) => {
  if (issue.status !== 'published') {
    $q.notify({
      type: 'warning',
      message: 'Only published newsletters can be unpublished'
    });
    return;
  }

  $q.dialog({
    title: 'Unpublish Newsletter',
    message: `Are you sure you want to unpublish "${issue.title}"? This will change its status to draft.`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Unpublish',
      color: 'warning'
    }
  }).onOk(() => {
    void (async () => {
      try {
        if (issue.type === 'issue') {
          // Unpublish new issue using newsletter generation service
          await newsletterGenerationService.updateIssue(issue.id, {
            status: 'draft'
          });
        } else {
          // For existing newsletters, we can't change their published status
          // as they don't have the same status system
          $q.notify({
            type: 'warning',
            message: 'Existing newsletters cannot be unpublished through this interface'
          });
          return;
        }

        $q.notify({
          type: 'positive',
          message: 'Newsletter unpublished successfully!',
          caption: 'Status changed to draft'
        });

        await loadData();
      } catch (error) {
        logger.error('Failed to unpublish newsletter:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to unpublish newsletter'
        });
      }
    })();
  });
};

const duplicateIssue = async (issue: NewsletterIssue) => {
  if (issue.type !== 'issue') {
    $q.notify({
      type: 'warning',
      message: 'Only new issues can be duplicated'
    });
    return;
  }

  try {
    const duplicatedTitle = `${issue.title} (Copy)`;
    const duplicatedIssueNumber = `${issue.issueNumber}-copy`;
    const duplicatedDate = new Date();
    duplicatedDate.setDate(duplicatedDate.getDate() + 7); // One week from now

    await newsletterGenerationService.createIssue(
      duplicatedTitle,
      duplicatedIssueNumber,
      duplicatedDate
    );

    $q.notify({
      type: 'positive',
      message: 'Issue duplicated successfully!'
    });

    await loadData();
  } catch (error) {
    logger.error('Failed to duplicate issue:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to duplicate issue'
    });
  }
};

const deleteIssue = (issue: NewsletterIssue) => {
  if (issue.type !== 'issue') {
    $q.notify({
      type: 'warning',
      message: 'Only new issues can be deleted'
    });
    return;
  }

  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete "${issue.title}"? This action cannot be undone.`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative'
    }
  }).onOk(() => {
    void (async () => {
      try {
        await newsletterGenerationService.deleteIssue(issue.id);

        $q.notify({
          type: 'positive',
          message: 'Issue deleted successfully!'
        });

        await loadData();
      } catch (error) {
        logger.error('Failed to delete issue:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to delete issue'
        });
      }
    })();
  });
};


const generatePdf = (issue: NewsletterIssue) => {
  if (issue.type !== 'issue') {
    $q.notify({
      type: 'warning',
      message: 'PDF generation is only available for new issues'
    });
    return;
  }

  if (issue.submissions.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Please add content to the issue before generating PDF'
    });
    return;
  }

  // Show confirmation dialog
  $q.dialog({
    title: 'Generate PDF',
    message: `Generate PDF for "${issue.title}" with ${issue.submissions.length} content items?`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Generate PDF',
      color: 'positive'
    }
  }).onOk(() => {
    void (async () => {
      try {
        // Show loading notification
        const loadingNotification = $q.notify({
          type: 'ongoing',
          message: 'Starting PDF generation...',
          caption: 'This may take a few minutes',
          timeout: 0,
          spinner: true
        });

    await newsletterGenerationService.generateNewsletterPdf(issue.id);

        // Update notification to success
        loadingNotification();
    $q.notify({
      type: 'positive',
          message: 'PDF generation started successfully!',
          caption: 'Check back in a few minutes for completion',
          timeout: 5000
    });

    // Reload data to show updated status
    await loadData();

        // Start polling for completion
        startProgressPolling(issue.id);

  } catch (error) {
    logger.error('Failed to generate PDF:', error);
    $q.notify({
      type: 'negative',
          message: 'Failed to start PDF generation',
          caption: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    })();
  });
};

const startProgressPolling = (issueId: string) => {
  const pollInterval = setInterval(() => {
    void (async () => {
      try {
        const progress = await newsletterGenerationService.getGenerationProgress(issueId);

        if (progress) {
          if (progress.status === 'complete') {
            clearInterval(pollInterval);
            $q.notify({
              type: 'positive',
              message: 'PDF generation completed!',
              caption: 'Your newsletter is ready for download',
              timeout: 5000
            });
            await loadData();
          } else if (progress.status === 'error') {
            clearInterval(pollInterval);
            $q.notify({
              type: 'negative',
              message: 'PDF generation failed',
              caption: progress.error || 'Unknown error occurred'
            });
            await loadData();
          }
          // Continue polling for other statuses
        }
      } catch (error) {
        logger.error('Error polling generation progress:', error);
      }
    })();
  }, 10000); // Poll every 10 seconds

  // Stop polling after 10 minutes
  setTimeout(() => {
    clearInterval(pollInterval);
  }, 600000);
};


const previewNewsletter = () => {
  if (!selectedIssue.value) {
    $q.notify({
      type: 'warning',
      message: 'No issue selected for preview'
    });
    return;
  }

  if (selectedIssue.value.downloadUrl) {
    // Open the PDF in a new tab
    window.open(selectedIssue.value.downloadUrl, '_blank');
    $q.notify({
      type: 'positive',
      message: 'Newsletter preview opened in new tab'
    });
  } else {
    $q.notify({
      type: 'warning',
      message: 'No PDF available for preview. Generate PDF first.',
      caption: 'Use the "Generate PDF" button to create a preview'
    });
  }
};


const downloadPdf = (item: NewsletterIssue) => {
  if (item.downloadUrl) {
    window.open(item.downloadUrl, '_blank');
  } else {
    $q.notify({
      type: 'warning',
      message: 'No PDF available for download'
    });
  }
};


const previewTemplate = (templateName: string) => {
  // This method is now handled by the TemplateManagementDialog component
  // but we keep it here for compatibility with the EditIssueDialog
  logger.info('Template preview requested', { templateName });
};

// Bulk action methods
const showBulkPublishDialog = () => {
  $q.dialog({
    title: 'Bulk Publish',
    message: `Are you sure you want to publish ${selectedIssues.value.length} selected issues?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    void Promise.all(selectedIssues.value.map(issueId => {
      const issue = issues.value.find(i => i.id === issueId);
      if (issue && issue.type === 'issue') {
        return newsletterGenerationService.updateIssue(issueId, { status: 'published' });
      }
      return Promise.resolve();
    }))
      .then(() => {
        selectedIssues.value = [];
        void loadData();
        $q.notify({
          type: 'positive',
          message: 'Issues published successfully!'
        });
      })
      .catch((error) => {
        logger.error('Failed to bulk publish issues:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to publish some issues'
        });
      });
  });
};

const showBulkArchiveDialog = () => {
  $q.dialog({
    title: 'Bulk Archive',
    message: `Are you sure you want to archive ${selectedIssues.value.length} selected issues?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    void Promise.all(selectedIssues.value.map(issueId => {
      const issue = issues.value.find(i => i.id === issueId);
      if (issue && issue.type === 'issue') {
        return newsletterGenerationService.updateIssue(issueId, { status: 'archived' });
      }
      return Promise.resolve();
    }))
      .then(() => {
        selectedIssues.value = [];
        void loadData();
        $q.notify({
          type: 'positive',
          message: 'Issues archived successfully!'
        });
      })
      .catch((error) => {
        logger.error('Failed to bulk archive issues:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to archive some issues'
        });
      });
  });
};

// Auto-refresh functionality
watch(autoRefresh, (newValue) => {
  if (newValue) {
    refreshInterval = window.setInterval(() => {
      void loadData();
    }, 30000); // Refresh every 30 seconds
  } else if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
});

// Lifecycle
onMounted(() => {
  void loadData();
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
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

</style>
