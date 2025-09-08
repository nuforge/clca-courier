<!--
  Combined Newsletter Management Page (Refactored)
  Clean, modular architecture with separated concerns
-->
<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12">
          <!-- Header -->
          <q-card flat class="q-mb-lg">
            <q-card-section>
              <div class="text-h4 text-center q-mb-md">
                <q-icon name="mdi-database-edit" class="q-mr-sm" />
                Newsletter Content Management
              </div>
              <p class="text-center text-body1">
                Comprehensive PDF metadata extraction, text processing, and content management
              </p>
            </q-card-section>
          </q-card>

          <!-- Statistics Cards -->
          <StatisticsCards :total-newsletters="totalNewsletters" :newsletters-with-text="newslettersWithText"
            :newsletters-with-thumbnails="newslettersWithThumbnails" :total-file-size="totalFileSize" />

          <!-- Workflow Toolbar -->
          <WorkflowToolbar :processing-states="workflowProcessingStatesExtended" :has-drafts="hasDrafts"
            :draft-count="draftNewsletters.length" :newsletters-needing-extraction="newslettersNeedingExtraction"
            @import-data="showImportDialog" @upload-drafts="uploadDraftsToCloud" @clear-drafts="clearLocalDrafts"
            @create-records="createMissingDatabaseRecords" @clear-cache="clearAllCaches" @fix-urls="fixLocalFileUrls"
            @rebuild-database="rebuildDatabaseWithVersioning" @enhance-dates="enhanceAllNewsletterDates"
            @generate-thumbnails="generateAllThumbnails" @extract-text="extractAllTextToFirebase"
            @extract-metadata="extractAllMetadata" @extract-page-count="extractPageCountForSelected"
            @extract-file-size="extractFileSizeForSelected" @extract-dates="extractDatesForSelected"
            @generate-keywords="generateKeywordsForSelected" @generate-descriptions="generateDescriptionsForSelected"
            @generate-titles="generateTitlesForSelected" />

          <!-- Filters -->
          <NewsletterFilters v-model:filters="filters" :newsletters="newsletters" />

          <!-- Bulk Operations Toolbar -->
          <BulkOperationsToolbar :selected-newsletters="selectedNewsletters" :processing-states="bulkProcessingStates"
            @extract-selected-text="handleExtractSelectedText"
            @generate-selected-thumbnails="generateSelectedThumbnails" @sync-selected="handleSyncSelected"
            @bulk-toggle-published="handleBulkTogglePublished" @bulk-toggle-featured="handleBulkToggleFeatured"
            @bulk-delete="handleBulkDelete" @clear-selection="clearSelection" />

          <!-- Newsletter Management Table -->
          <NewsletterManagementTable :newsletters="newsletters" v-model:selected-newsletters="selectedNewsletters"
            v-model:pagination="pagination" :processing-states="workflowProcessingStatesExtended"
            :extracting-text="extractingText" :generating-thumb="thumbnailIndividualStates"
            :syncing-individual="syncingIndividual" :publishing-states="publishingStates"
            :featured-states="featuredStates" @extract-selected-text="handleExtractSelectedText"
            @generate-selected-thumbnails="generateSelectedThumbnails" @sync-selected="handleSyncSelected"
            @bulk-toggle-featured="handleBulkToggleFeatured" @bulk-toggle-published="handleBulkTogglePublished"
            @toggle-featured="toggleNewsletterFeatured" @toggle-published="toggleNewsletterPublished"
            @open-pdf="openPdf" @edit-newsletter="editNewsletter" @extract-text="extractText"
            @generate-thumbnail="generateThumbnail" @sync-single="syncSingleNewsletter"
            @show-extracted-content="showExtractedContent" @delete-newsletter="deleteNewsletter"
            @bulk-delete="handleBulkDelete" @re-import-file="handleReImportFile" />

          <!-- Edit Dialog -->
          <NewsletterEditDialog v-model="editDialog.showDialog" :newsletter="editDialog.editingNewsletter"
            :extracting-text="editDialog.editingNewsletter ? (extractingText[editDialog.editingNewsletter.id] || false) : false"
            :generating-thumbnail="editDialog.editingNewsletter ? (thumbnailIndividualStates[editDialog.editingNewsletter.id] || false) : false"
            :syncing="editDialog.editingNewsletter ? (syncingIndividual[editDialog.editingNewsletter.id] || false) : false"
            :saving="false" @save-newsletter="saveMetadata" @extract-text="extractText"
            @generate-thumbnail="generateThumbnail" @sync-newsletter="syncSingleNewsletter"
            @apply-extracted-metadata="applyExtractedMetadata" @version-restored="handleVersionRestored" />

          <!-- Text Extraction Dialog -->
          <TextExtractionDialog v-model="textExtractionDialog.showDialog"
            :newsletter="textExtractionDialog.currentFile" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { logger } from '../utils/logger';

// Import composables
import { useContentManagement } from '../composables/useContentManagement';
import { useThumbnailManagement } from '../composables/useThumbnailManagement';
import { useNewsletterWorkflow } from '../composables/useNewsletterWorkflow';

// Import components
import StatisticsCards from '../components/content-management/StatisticsCards.vue';
import NewsletterManagementTable from '../components/content-management/NewsletterManagementTable.vue';
import NewsletterFilters from '../components/content-management/NewsletterFilters.vue';
import WorkflowToolbar from '../components/content-management/WorkflowToolbar.vue';
import BulkOperationsToolbar from '../components/content-management/BulkOperationsToolbar.vue';
import NewsletterEditDialog from '../components/content-management/NewsletterEditDialog.vue';
import TextExtractionDialog from '../components/content-management/TextExtractionDialog.vue';

// Import types
import type { ContentManagementNewsletter } from '../types';

const $q = useQuasar();

// Use composables
const {
  newsletters,
  processingStates: baseProcessingStates,
  filters,
  textExtractionDialog,
  editDialog,
  totalNewsletters,
  newslettersWithText,
  newslettersWithThumbnails,
  totalFileSize,
  loadNewsletters
} = useContentManagement();

// Workflow management
const {
  processingStates: workflowProcessingStates,
  draftNewsletters,
  hasDrafts,
  showImportDialog,
  uploadDraftsToCloud,
  clearLocalDrafts,
  loadDraftsFromStorage,
} = useNewsletterWorkflow();

// Thumbnail management
const {
  isGenerating: isGeneratingThumbnails,
  individualStates: thumbnailIndividualStates
} = useThumbnailManagement();

// Firebase authentication
// const { auth } = useFirebase(); // Removed unused

// Local state for table management
const selectedNewsletters = ref<ContentManagementNewsletter[]>([]);
const extractingText = ref<Record<string, boolean>>({});
const syncingIndividual = ref<Record<string, boolean>>({});
const publishingStates = ref<Record<string, boolean>>({});
const featuredStates = ref<Record<string, boolean>>({});

// Table configuration
const pagination = ref({
  sortBy: 'year',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

// Count newsletters that need Firebase text extraction
const newslettersNeedingExtraction = computed(() => {
  return newsletters.value.filter(n => {
    return !n.searchableText || !n.wordCount || n.wordCount === 0;
  }).length;
});

// Processing states for different component sections
const bulkProcessingStates = computed(() => ({
  isExtracting: baseProcessingStates.value.isExtracting,
  isGeneratingThumbs: isGeneratingThumbnails.value,
  isSyncing: baseProcessingStates.value.isSyncing,
  isToggling: false, // Add these states as needed
  isDeleting: false,
}));

const workflowProcessingStatesExtended = computed(() => ({
  ...baseProcessingStates.value,
  ...workflowProcessingStates.value,
  isGeneratingThumbs: isGeneratingThumbnails.value,
}));

// Utility functions
function clearSelection(): void {
  selectedNewsletters.value = [];
}

function openPdf(newsletter: ContentManagementNewsletter): void {
  if (newsletter.downloadUrl) {
    window.open(newsletter.downloadUrl, '_blank');
  } else {
    $q.notify({
      type: 'warning',
      message: 'PDF URL not available',
      caption: 'This newsletter may not be uploaded to cloud storage yet'
    });
  }
}

function editNewsletter(newsletter: ContentManagementNewsletter): void {
  editDialog.value.editingNewsletter = { ...newsletter };
  editDialog.value.showDialog = true;
}

function showExtractedContent(newsletter: ContentManagementNewsletter): void {
  textExtractionDialog.value.currentFile = newsletter;
  textExtractionDialog.value.showDialog = true;
}

// Placeholder functions for operations that need to be implemented
function handleExtractSelectedText(): void {
  logger.info('Extract selected text operation triggered');
  // Implementation would go here
}

function generateSelectedThumbnails(): void {
  logger.info('Generate selected thumbnails operation triggered');
  // Implementation would go here
}

function handleSyncSelected(): void {
  logger.info('Sync selected operation triggered');
  // Implementation would go here
}

function handleBulkTogglePublished(published: boolean): void {
  logger.info(`Bulk toggle published to ${published} operation triggered`);
  // Implementation would go here
}

function handleBulkToggleFeatured(featured: boolean): void {
  logger.info(`Bulk toggle featured to ${featured} operation triggered`);
  // Implementation would go here
}

function handleBulkDelete(): void {
  logger.info('Bulk delete operation triggered');
  // Implementation would go here
}

function extractText(newsletter: ContentManagementNewsletter): void {
  logger.info(`Extract text for ${newsletter.filename}`);
  // Implementation would go here
}

function generateThumbnail(newsletter: ContentManagementNewsletter): void {
  logger.info(`Generate thumbnail for ${newsletter.filename}`);
  // Implementation would go here
}

function syncSingleNewsletter(newsletter: ContentManagementNewsletter): void {
  logger.info(`Sync newsletter ${newsletter.filename}`);
  // Implementation would go here
}

function toggleNewsletterPublished(newsletter: ContentManagementNewsletter): void {
  logger.info(`Toggle published status for ${newsletter.filename}`);
  // Implementation would go here
}

function toggleNewsletterFeatured(newsletter: ContentManagementNewsletter): void {
  logger.info(`Toggle featured status for ${newsletter.filename}`);
  // Implementation would go here
}

function deleteNewsletter(newsletter: ContentManagementNewsletter): void {
  logger.info(`Delete newsletter ${newsletter.filename}`);
  // Implementation would go here
}

function handleReImportFile(newsletter: ContentManagementNewsletter): void {
  logger.info(`Re-import file for ${newsletter.filename}`);
  // Implementation would go here
}

function saveMetadata(): void {
  logger.info('Save metadata operation triggered');
  // Implementation would go here
}

function applyExtractedMetadata(): void {
  logger.info('Apply extracted metadata operation triggered');
  // Implementation would go here
}

async function handleVersionRestored(newsletterId: string): Promise<void> {
  logger.info(`Version restored for newsletter ${newsletterId}`);
  await loadNewsletters();
}

// Workflow operations
function createMissingDatabaseRecords(): void {
  logger.info('Create missing database records operation triggered');
  // Implementation would go here
}

function clearAllCaches(): void {
  logger.info('Clear all caches operation triggered');
  // Implementation would go here
}

function fixLocalFileUrls(): void {
  logger.info('Fix local file URLs operation triggered');
  // Implementation would go here
}

function rebuildDatabaseWithVersioning(): void {
  logger.info('Rebuild database with versioning operation triggered');
  // Implementation would go here
}

function enhanceAllNewsletterDates(): void {
  logger.info('Enhance all newsletter dates operation triggered');
  // Implementation would go here
}

function generateAllThumbnails(): void {
  logger.info('Generate all thumbnails operation triggered');
  // Implementation would go here
}

function extractAllTextToFirebase(): void {
  logger.info('Extract all text to Firebase operation triggered');
  // Implementation would go here
}

function extractAllMetadata(): void {
  logger.info('Extract all metadata operation triggered');
  // Implementation would go here
}

function extractPageCountForSelected(): void {
  logger.info('Extract page count for selected operation triggered');
  // Implementation would go here
}

function extractFileSizeForSelected(): void {
  logger.info('Extract file size for selected operation triggered');
  // Implementation would go here
}

function extractDatesForSelected(): void {
  logger.info('Extract dates for selected operation triggered');
  // Implementation would go here
}

function generateKeywordsForSelected(): void {
  logger.info('Generate keywords for selected operation triggered');
  // Implementation would go here
}

function generateDescriptionsForSelected(): void {
  logger.info('Generate descriptions for selected operation triggered');
  // Implementation would go here
}

function generateTitlesForSelected(): void {
  logger.info('Generate titles for selected operation triggered');
  // Implementation would go here
}

// Initialize
onMounted(async () => {
  logger.info('🚀 [INIT] Initializing Combined Newsletter Management Page...');

  try {
    // Load newsletters from Firebase
    await loadNewsletters();

    // Load any existing drafts from localStorage
    loadDraftsFromStorage();

    logger.success('🚀 [INIT] Newsletter Management Page initialized successfully');
  } catch (error) {
    logger.error('🚀 [INIT] Failed to initialize Newsletter Management Page:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to initialize page',
      caption: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
</script>
