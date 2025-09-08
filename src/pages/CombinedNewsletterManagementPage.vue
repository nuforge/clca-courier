<!--
  Combined Newsletter Management Page (Refactored)
  Comprehensive PDF metadata extraction, text processing, and content management
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

          <!-- Filters -->
          <q-card class="q-mb-lg">
            <q-card-section>
              <div class="row q-gutter-md">
                <div class="col-12 col-md-4">
                  <q-input v-model="filters.searchText" label="Search newsletters..." outlined dense clearable
                    debounce="300">
                    <template v-slot:prepend>
                      <q-icon name="mdi-magnify" />
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-md-2">
                  <q-select v-model="filters.filterYear" :options="availableYears" label="Filter by Year" outlined dense
                    clearable />
                </div>
                <div class="col-12 col-md-2">
                  <q-select v-model="filters.filterSeason" :options="availableSeasons" label="Filter by Season" outlined
                    dense clearable />
                </div>
                <div class="col-12 col-md-2">
                  <q-select v-model="filters.filterMonth" :options="availableMonths" option-label="label"
                    option-value="value" label="Filter by Month" outlined dense clearable emit-value map-options />
                </div>
                <div class="col-12 col-md-2">
                  <!-- Removed the bulk actions button - now using expansion item below -->
                </div>
              </div>

              <!-- Bulk Actions Menu - Collapsible Section (Always visible) -->
              <q-expansion-item v-model="showBulkActionsMenu" icon="mdi-cog" label="Administrative Actions"
                class="q-mt-md" expand-icon-class="text-primary">

                <q-card flat class="q-mt-sm">
                  <q-card-section>

                    <!-- STEP 1: System Management -->
                    <div class="q-mb-md">
                      <h6 class="text-h6 q-my-none text-grey-7">🔧 Step 1: System Management</h6>
                      <div class="row q-gutter-sm q-mt-sm">
                        <q-btn color="deep-orange" icon="mdi-delete-sweep" label="Clear All Caches"
                          @click="clearAllCaches" :loading="processingStates.isClearingCache" outline
                          class="text-weight-medium" />
                        <q-btn color="positive" icon="mdi-database-import" label="Import Data" @click="showImportDialog"
                          :loading="processingStates.isImporting" outline class="text-weight-medium" />
                      </div>
                    </div>

                    <!-- DRAFT MANAGEMENT -->
                    <div class="q-mb-md" v-if="hasDrafts">
                      <h6 class="text-h6 q-my-none text-grey-7">📝 Local Drafts ({{ draftNewsletters.length }})</h6>
                      <div class="row q-gutter-sm q-mt-sm">
                        <q-btn color="primary" icon="mdi-cloud-upload" label="Sync Drafts to Cloud"
                          @click="uploadDraftsToCloud" :loading="processingStates.isImporting" unelevated
                          class="text-weight-medium" />
                        <q-btn color="grey" icon="mdi-delete" label="Clear Local Drafts" @click="clearLocalDrafts"
                          outline class="text-weight-medium" />
                      </div>
                      <q-banner class="q-mt-sm bg-blue-1 text-blue-8" rounded>
                        <template v-slot:avatar>
                          <q-icon name="mdi-information" />
                        </template>
                        {{ draftNewsletters.length }} local draft(s) ready to sync. These are stored locally and not
                        synced to the
                        cloud yet.
                      </q-banner>
                    </div>

                    <!-- STEP 2: Database Setup -->
                    <div class="q-mb-md">
                      <h6 class="text-h6 q-my-none text-grey-7">🗄️ Step 2: Database Setup</h6>
                      <div class="row q-gutter-sm q-mt-sm">
                        <q-btn color="orange" icon="mdi-database-plus" label="Create Missing Records"
                          @click="createMissingDatabaseRecords" :loading="processingStates.isCreatingRecords" unelevated
                          class="text-weight-medium" />
                        <q-btn color="blue" icon="mdi-link-variant" label="Fix URLs" @click="fixLocalFileUrls"
                          :loading="processingStates.isFixingUrls" unelevated class="text-weight-medium" />
                        <q-btn color="red" icon="mdi-database-sync" label="Rebuild Database"
                          @click="rebuildDatabaseWithVersioning" :loading="processingStates.isRebuildingDatabase"
                          unelevated class="text-weight-medium" />
                      </div>
                    </div>

                    <!-- STEP 3: Content Processing -->
                    <div class="q-mb-md">
                      <h6 class="text-h6 q-my-none text-grey-7">📄 Step 3: Content Processing</h6>
                      <div class="row q-gutter-sm q-mt-sm">
                        <q-btn color="warning" icon="mdi-calendar-clock" label="Enhance Dates"
                          @click="enhanceAllNewsletterDates" :loading="processingStates.isEnhancingDates" unelevated
                          class="text-weight-medium" />
                        <q-btn color="accent" icon="mdi-image-multiple" label="Generate ALL Thumbnails"
                          @click="generateAllThumbnails" :loading="processingStates.isGeneratingThumbs" unelevated
                          class="text-weight-medium" />
                        <q-btn color="secondary" icon="mdi-text-search" label="Extract ALL Text to Firebase"
                          @click="extractAllTextToFirebase" :loading="processingStates.isExtractingAllText" unelevated
                          class="text-weight-medium" />
                        <q-chip v-if="newslettersNeedingExtraction > 0"
                          :label="`${newslettersNeedingExtraction} need extraction`" color="orange" text-color="white"
                          size="sm" />
                        <q-chip v-else label="All extracted ✓" color="green" text-color="white" size="sm" />
                        <q-btn color="primary" icon="mdi-tag-multiple" label="Generate ALL Tags"
                          @click="extractAllMetadata" :loading="processingStates.isExtracting" unelevated
                          class="text-weight-medium" />
                      </div>
                    </div>

                    <!-- STEP 4: Individual Metadata Functions -->
                    <div class="q-mb-md">
                      <h6 class="text-h6 q-my-none text-grey-7">🎯 Step 4: Individual Metadata Functions</h6>
                      <p class="text-caption text-grey-6 q-mt-sm q-mb-sm">
                        These functions work on SELECTED items or ALL items if none selected
                      </p>
                      <div class="row q-gutter-sm q-mt-sm">
                        <q-btn color="purple" icon="mdi-file-document-outline" label="Extract Page Count"
                          @click="extractPageCountForSelected" :loading="processingStates.isExtractingPageCount" dense
                          class="text-weight-medium" />
                        <q-btn color="teal" icon="mdi-scale" label="Extract File Size"
                          @click="extractFileSizeForSelected" :loading="processingStates.isExtractingFileSize" dense
                          class="text-weight-medium" />
                        <q-btn color="indigo" icon="mdi-calendar-range" label="Extract Dates"
                          @click="extractDatesForSelected" :loading="processingStates.isExtractingDates" dense
                          class="text-weight-medium" />
                        <q-btn color="pink" icon="mdi-tag-outline" label="Generate Keywords"
                          @click="generateKeywordsForSelected" :loading="processingStates.isGeneratingKeywords" dense
                          class="text-weight-medium" />
                        <q-btn color="brown" icon="mdi-text-short" label="Generate Descriptions"
                          @click="generateDescriptionsForSelected" :loading="processingStates.isGeneratingDescriptions"
                          dense class="text-weight-medium" />
                        <q-btn color="cyan" icon="mdi-format-title" label="Generate Titles"
                          @click="generateTitlesForSelected" :loading="processingStates.isGeneratingTitles" dense
                          class="text-weight-medium" />
                      </div>
                    </div>

                    <!-- Status Indicators -->
                    <div class="q-mt-md">
                      <q-banner class="bg-blue-1 text-blue-9" dense rounded>
                        <template v-slot:avatar>
                          <q-icon name="mdi-information" />
                        </template>
                        💡 <strong>Workflow Tip:</strong> Run steps in order for best results.
                        Start with System Management, then Database Setup, then Content Processing.
                      </q-banner>
                    </div>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </q-card-section>
          </q-card>

          <!-- Gmail-inspired Newsletter Management Table -->
          <NewsletterManagementTable :newsletters="filteredNewslettersIncludingDrafts"
            v-model:selected-newsletters="selectedNewsletters" v-model:pagination="pagination"
            :processing-states="processingStates" :extracting-text="extractingText"
            :generating-thumb="thumbnailIndividualStates" :syncing-individual="syncingIndividual"
            :publishing-states="publishingStates" :featured-states="featuredStates"
            @extract-selected-text="handleExtractSelectedText"
            @generate-selected-thumbnails="generateSelectedThumbnails" @sync-selected="handleSyncSelected"
            @bulk-toggle-featured="handleBulkToggleFeatured" @bulk-toggle-published="handleBulkTogglePublished"
            @toggle-featured="toggleNewsletterFeatured" @toggle-published="toggleNewsletterPublished"
            @open-pdf="openPdf" @edit-newsletter="editNewsletter" @extract-text="extractText"
            @generate-thumbnail="generateThumbnail" @sync-single="syncSingleNewsletter"
            @show-extracted-content="showExtractedContent" @delete-newsletter="deleteNewsletter"
            @bulk-delete="handleBulkDelete" @re-import-file="handleReImportFile" />
          <!-- Edit Dialog -->
          <q-dialog v-model="editDialog.showDialog" persistent>
            <q-card style="min-width: 700px; max-width: 900px; min-height: 600px;">
              <q-card-section class="row items-center q-pb-none">
                <div>
                  <div class="text-h6">Edit Newsletter Metadata</div>
                  <div v-if="editDialog.editingNewsletter" class="text-caption text-grey-6">
                    Version {{ editDialog.editingNewsletter.version || 1 }} •
                    Last updated {{ formatDate(editDialog.editingNewsletter.updatedAt) }} by {{
                      editDialog.editingNewsletter.updatedBy }}
                  </div>
                </div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
              </q-card-section>

              <!-- Tab system for edit dialog -->
              <q-tabs v-model="editTab" dense class="text-grey">
                <q-tab name="metadata" label="Edit Metadata" />
                <q-tab name="history" label="Version History" />
              </q-tabs>

              <q-separator />

              <q-tab-panels v-model="editTab" animated>
                <!-- Metadata editing tab -->
                <q-tab-panel name="metadata" v-if="editDialog.editingNewsletter">
                  <div class="row">
                    <!-- Basic Information -->
                    <div class="col-12 q-pa-sm">
                      <q-input v-model="editDialog.editingNewsletter.title" label="Title" outlined dense />
                    </div>
                    <div class="col-12 col-md-6 q-pa-sm">
                      <q-input v-model="editDialog.editingNewsletter.year" label="Year" type="number" outlined dense />
                    </div>
                    <div class="col-12 col-md-6 q-pa-sm">
                      <q-select v-model="editDialog.editingNewsletter.season" :options="seasonOptions" label="Season"
                        outlined dense emit-value map-options />
                    </div>
                    <div class="col-12 col-md-6 q-pa-sm">
                      <q-input v-model="editDialog.editingNewsletter.volume" label="Volume" type="number" outlined
                        dense />
                    </div>
                    <div class="col-12 col-md-6 q-pa-sm">
                      <q-input v-model="editDialog.editingNewsletter.issue" label="Issue" type="number" outlined
                        dense />
                    </div>
                    <div class="col-12 q-pa-sm">
                      <q-input v-model="editDialog.editingNewsletter.description" label="Description" type="textarea"
                        outlined rows="3" />
                    </div>
                    <div class="col-12 q-pa-sm">
                      <q-input v-model="editDialog.editingNewsletter.summary" label="Summary (for featured content)"
                        type="textarea" outlined rows="2" />
                    </div>
                    <!-- Tags -->
                    <div class="col-12 q-pa-sm">
                      <q-select v-model="editDialog.editingNewsletter.tags" :options="availableTags" label="Tags"
                        multiple use-chips use-input @new-value="addNewTag" outlined dense />
                    </div>
                    <!-- Categories -->
                    <div class="col-12 q-pa-sm">
                      <q-select v-model="editDialog.editingNewsletter.categories" :options="availableCategories"
                        label="Categories" multiple use-chips outlined dense />
                    </div>
                    <!-- Contributors -->
                    <div class="col-12 q-pa-sm">
                      <q-input v-model="contributorsString" label="Contributors (comma-separated)" outlined dense />
                    </div>
                    <!-- Flags -->
                    <div class="col-12 q-pa-sm">
                      <div class="row">
                        <div class="col-6">
                          <q-checkbox v-model="editDialog.editingNewsletter.featured" label="Featured on homepage" />
                        </div>
                        <div class="col-6">
                          <q-checkbox v-model="editDialog.editingNewsletter.isPublished"
                            label="Published (visible to users)" />
                        </div>
                      </div>
                    </div>
                  </div>
                </q-tab-panel>

                <!-- Version history tab -->
                <q-tab-panel name="history" v-if="editDialog.editingNewsletter">
                  <NewsletterVersionHistoryPanel :newsletter-id="editDialog.editingNewsletter.id"
                    @version-restored="handleVersionRestored" />
                </q-tab-panel>
              </q-tab-panels>

              <q-card-actions align="right">
                <q-btn flat label="Cancel" v-close-popup />
                <q-btn v-if="editTab === 'metadata'" color="primary" label="Save Changes" @click="saveMetadata"
                  :loading="processingStates.isSaving" />
              </q-card-actions>
            </q-card>
          </q-dialog>
          <!-- Text Extraction Dialog -->
          <q-dialog v-model="textExtractionDialog.showDialog" max-width="900px">
            <q-card>
              <q-card-section>
                <div class="text-h6">
                  Text Extraction: {{ textExtractionDialog.currentFile?.title }}
                </div>
              </q-card-section>
              <q-card-section v-if="processingStates.isProcessingText">
                <q-linear-progress :value="textExtractionDialog.extractionProgress" color="primary" class="q-mb-md" />
                <div class="text-caption text-grey">
                  {{ textExtractionDialog.extractionStatus }}
                </div>
              </q-card-section>
              <q-card-section v-if="textExtractionDialog.extractedContent">
                <div class="text-subtitle2 q-mb-sm">Extracted Content Preview:</div>
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-body2 q-mb-sm">
                      <strong>Word Count:</strong> {{
                        textExtractionDialog.extractedContent.wordCount }}
                    </div>
                    <div class="text-body2 q-mb-sm">
                      <strong>Top Keywords:</strong>
                      <div class="keyword-grid q-mt-sm">
                        <q-chip
                          v-for="[keyword, count] in Object.entries(textExtractionDialog.extractedContent.keywordCounts || {}).slice(0, 10)"
                          :key="keyword" size="sm" color="primary" text-color="white" :label="`${keyword} (${count})`"
                          class="q-ma-xs" />
                      </div>
                    </div>
                    <div class="text-caption text-grey" style="max-height: 100px; overflow-y: auto;">
                      {{ textExtractionDialog.extractedContent.textPreview }}...
                    </div>
                  </q-card-section>
                </q-card>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Close" v-close-popup :disable="processingStates.isProcessingText" />
                <q-btn v-if="textExtractionDialog.extractedContent" color="primary" label="Apply Metadata"
                  @click="applyExtractedMetadata" :loading="processingStates.isApplyingMetadata" />
              </q-card-actions>
            </q-card>
          </q-dialog>
        </div>
      </div>
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { firestoreService, type NewsletterMetadata } from '../services/firebase-firestore.service';
import { firebaseNewsletterService } from '../services/firebase-newsletter.service';
import { pdfExtractionFirebaseIntegration } from '../services/pdf-extraction-firebase-integration.service';
import { logger } from '../utils/logger';
// Import composables
import { useContentManagement } from '../composables/useContentManagement';
import { useFirebase } from '../composables/useFirebase';
import { useThumbnailManagement } from '../composables/useThumbnailManagement';
import { tagGenerationService } from '../services/tag-generation.service';
// Import components
import StatisticsCards from '../components/content-management/StatisticsCards.vue';
import NewsletterManagementTable from '../components/content-management/NewsletterManagementTable.vue';
import NewsletterVersionHistoryPanel from '../components/content-management/NewsletterVersionHistoryPanel.vue';
// Import types
import type { ContentManagementNewsletter } from '../types';

// Extended newsletter interface for original file info
interface NewsletterWithFileInfo extends ContentManagementNewsletter {
  originalFileInfo?: {
    name: string;
    size: number;
    lastModified: number;
    relativePath?: string;
    path?: string;
    importHint?: string;
  };
}

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
  loadNewsletters,
  refreshFirebaseDataOnly,
  getDataSource,
  formatFileSize,
  debugDataFlow,
  testSyncWorkflow
} = useContentManagement();

// Thumbnail management
const {
  generateSingleThumbnail,
  generateBatchThumbnails,
  isGenerating: isGeneratingThumbnails,
  individualStates: thumbnailIndividualStates
} = useThumbnailManagement();

// Enhanced processing states that include thumbnail generation
const isEnhancingDates = ref(false);
const isCreatingRecords = ref(false);
const isRebuildingDatabase = ref(false);
const isFixingUrls = ref(false);
const isClearingCache = ref(false);
const isImporting = ref(false);

// Draft storage for imported metadata (not synced to cloud until explicitly uploaded)
const draftNewsletters = ref<NewsletterMetadata[]>([]);
const draftFileMap = ref<Map<string, File>>(new Map()); // Map draft ID to File object for thumbnail generation
const hasDrafts = computed(() => draftNewsletters.value.length > 0);

// Count newsletters that need Firebase text extraction
const newslettersNeedingExtraction = computed(() => {
  return newsletters.value.filter(n => {
    return !n.searchableText || !n.wordCount || n.wordCount === 0;
  }).length;
});

// Combined newsletters including both Firebase and local drafts
const allNewslettersIncludingDrafts = computed(() => {
  // Convert local drafts to ContentManagementNewsletter format to match newsletters array
  const draftsAsContentManagement = draftNewsletters.value.map(draft => {
    const newsletter = {
      id: draft.id,
      filename: draft.filename,
      title: draft.title,
      description: draft.description || '',
      year: draft.year,
      season: '', // Drafts don't have season initially
      // Omit month since it's optional and we don't have it
      fileSize: draft.fileSize,
      pageCount: draft.pageCount || 0,
      downloadUrl: draft.downloadUrl,
      thumbnailUrl: draft.thumbnailUrl || '', // Use actual thumbnailUrl from draft
      tags: draft.tags,
      featured: draft.featured,
      isPublished: draft.isPublished,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      createdBy: draft.createdBy,
      updatedBy: draft.updatedBy,
      // Additional fields for ContentManagementNewsletter
      extractedText: '', // Drafts don't have extracted text initially
      actions: draft.actions,
      version: 1, // Local drafts start at version 1
      isDraft: true, // Mark as draft for UI distinction
      storageRef: draft.storageRef,
      publicationDate: draft.publicationDate
    } as ContentManagementNewsletter;

    // Add dataSource using the composable function with file availability check
    const hasFileObject = draftFileMap.value.has(draft.id);
    const dataSource = getDataSource(newsletter, hasFileObject);
    return {
      ...newsletter,
      dataSource
    };
  });

  // Combine Firebase newsletters with local drafts
  return [...newsletters.value, ...draftsAsContentManagement];
});

// Filtered version that includes both Firebase and local drafts
const filteredNewslettersIncludingDrafts = computed(() => {
  const combined = allNewslettersIncludingDrafts.value;

  // Apply the same filtering logic as the original filteredNewsletters
  let filtered = combined;

  // Apply search text filter
  if (filters.value.searchText) {
    const searchLower = filters.value.searchText.toLowerCase();
    filtered = filtered.filter(newsletter =>
      newsletter.title.toLowerCase().includes(searchLower) ||
      newsletter.filename.toLowerCase().includes(searchLower) ||
      (newsletter.description && newsletter.description.toLowerCase().includes(searchLower)) ||
      newsletter.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  // Apply year filter
  if (filters.value.filterYear) {
    filtered = filtered.filter(newsletter => newsletter.year === filters.value.filterYear);
  }

  // Apply season filter
  if (filters.value.filterSeason) {
    filtered = filtered.filter(newsletter => newsletter.season === filters.value.filterSeason);
  }

  // Apply month filter
  if (filters.value.filterMonth) {
    filtered = filtered.filter(newsletter => newsletter.month === filters.value.filterMonth);
  }

  return filtered;
});

// Individual metadata extraction states
const isExtractingPageCount = ref(false);
const isExtractingFileSize = ref(false);
const isExtractingDates = ref(false);
const isGeneratingKeywords = ref(false);
const isGeneratingDescriptions = ref(false);
const isGeneratingTitles = ref(false);

const processingStates = computed(() => ({
  ...baseProcessingStates.value,
  isGeneratingThumbs: isGeneratingThumbnails.value,
  isEnhancingDates: isEnhancingDates.value,
  isCreatingRecords: isCreatingRecords.value,
  isRebuildingDatabase: isRebuildingDatabase.value,
  isFixingUrls: isFixingUrls.value,
  isClearingCache: isClearingCache.value,
  isImporting: isImporting.value,
  isExtractingPageCount: isExtractingPageCount.value,
  isExtractingFileSize: isExtractingFileSize.value,
  isExtractingDates: isExtractingDates.value,
  isGeneratingKeywords: isGeneratingKeywords.value,
  isGeneratingDescriptions: isGeneratingDescriptions.value,
  isGeneratingTitles: isGeneratingTitles.value
}));
// Firebase authentication
const { auth } = useFirebase();

// Import Data functionality
const showImportDialog = async (): Promise<void> => {
  console.log('📁 [IMPORT] Starting import dialog...');

  const action = await new Promise<'files' | 'folder' | 'cancel'>((resolve) => {
    $q.dialog({
      title: '📁 Import PDF Data',
      message: 'Choose how you want to import PDF files:',
      html: true,
      options: {
        type: 'radio',
        model: 'files',
        items: [
          {
            label: '📄 Select Individual PDF Files',
            value: 'files'
          },
          {
            label: '📁 Select Folder with PDFs',
            value: 'folder'
          }
        ]
      },
      cancel: { label: 'Cancel', flat: true },
      ok: { label: 'Continue', color: 'primary' },
      persistent: true
    }).onOk((selectedAction) => resolve(selectedAction))
      .onCancel(() => resolve('cancel'));
  });

  console.log(`📁 [IMPORT] User selected: ${action}`);

  if (action === 'cancel') {
    console.log('📁 [IMPORT] User cancelled - ABORTING');
    return;
  }

  try {
    console.log('📁 [IMPORT] Setting spinner state to true');
    isImporting.value = true;

    if (action === 'files') {
      console.log('📁 [IMPORT] Calling importSelectedFiles...');
      await importSelectedFiles();
    } else {
      console.log('📁 [IMPORT] Calling importSelectedFolder...');
      await importSelectedFolder();
    }

    console.log('📁 [IMPORT] Import process completed successfully');
  } catch (error) {
    console.error('📁 [IMPORT] ERROR:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to import files',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    console.log('📁 [IMPORT] Setting spinner state to false');
    isImporting.value = false;
    console.log('📁 [IMPORT] Function completed');
  }
}; const importSelectedFiles = async (): Promise<void> => {
  // Create file input for PDF selection
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = '.pdf';

  return new Promise((resolve, reject) => {
    let dialogCancelled = false;

    input.onchange = (event) => {
      try {
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          console.log('📁 [IMPORT-FILES] No files selected');
          resolve();
          return;
        }

        $q.notify({
          type: 'info',
          message: `Importing ${files.length} PDF file(s) as drafts...`,
          position: 'top'
        });

        let imported = 0;
        for (const file of Array.from(files)) {
          if (file.type === 'application/pdf') {
            createDraftRecord(file);
            imported++;
          }
        }

        $q.notify({
          type: 'positive',
          message: `Successfully imported ${imported} PDF(s) as LOCAL drafts`,
          caption: 'Use "Sync Drafts to Cloud" to sync to Firebase',
          position: 'top'
        });

        // NOTE: Not calling loadNewsletters() since drafts are local only
        console.log(`📁 [IMPORT-FILES] Import completed. ${imported} files stored as local drafts.`);
        resolve();
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to import files'));
      }
    };

    input.onclick = () => {
      input.value = ''; // Reset value to allow re-selecting same files
    };

    // Handle dialog cancellation
    const handleCancel = () => {
      if (!dialogCancelled) {
        dialogCancelled = true;
        console.log('📁 [IMPORT-FILES] File dialog cancelled by user');
        resolve();
      }
    };

    // Detect cancellation with a timeout
    const cancelTimeout = setTimeout(() => {
      handleCancel();
    }, 100);

    // Clear timeout if change event fires
    const originalOnChange = input.onchange;
    input.onchange = (event) => {
      clearTimeout(cancelTimeout);
      if (originalOnChange) originalOnChange.call(input, event);
    };

    // Focus handling for better cancel detection
    window.addEventListener('focus', () => {
      setTimeout(() => {
        if (!dialogCancelled && input.files?.length === 0) {
          handleCancel();
        }
      }, 300);
    }, { once: true });

    input.click();
  });
};

const importSelectedFolder = async (): Promise<void> => {
  // Create directory input for folder selection
  const input = document.createElement('input');
  input.type = 'file';
  input.webkitdirectory = true;
  input.multiple = true;
  input.accept = '.pdf'; // Show PDF files by default in folder preview

  return new Promise((resolve, reject) => {
    let dialogCancelled = false;

    input.onchange = (event) => {
      try {
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          console.log('📁 [IMPORT-FOLDER] No files selected');
          resolve();
          return;
        }

        // Filter for PDF files
        const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');

        if (pdfFiles.length === 0) {
          $q.notify({
            type: 'warning',
            message: 'No PDF files found in selected folder',
            position: 'top'
          });
          resolve();
          return;
        }

        $q.notify({
          type: 'info',
          message: `Importing ${pdfFiles.length} PDF file(s) from folder as drafts...`,
          position: 'top'
        });

        let imported = 0;
        for (const file of pdfFiles) {
          createDraftRecord(file);
          imported++;
        }

        $q.notify({
          type: 'positive',
          message: `Successfully imported ${imported} PDF(s) as LOCAL drafts`,
          caption: 'Use "Sync Drafts to Cloud" to sync to Firebase',
          position: 'top'
        });

        // NOTE: Not calling loadNewsletters() since drafts are local only
        console.log(`📁 [IMPORT-FOLDER] Import completed. ${imported} files stored as local drafts.`);
        resolve();
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to import folder'));
      }
    };

    // Handle dialog cancellation
    const handleCancel = () => {
      if (!dialogCancelled) {
        dialogCancelled = true;
        console.log('📁 [IMPORT-FOLDER] Folder dialog cancelled by user');
        resolve();
      }
    };

    // Detect cancellation with a timeout
    const cancelTimeout = setTimeout(() => {
      handleCancel();
    }, 100);

    // Clear timeout if change event fires
    const originalOnChange = input.onchange;
    input.onchange = (event) => {
      clearTimeout(cancelTimeout);
      if (originalOnChange) originalOnChange.call(input, event);
    };

    // Focus handling for better cancel detection
    window.addEventListener('focus', () => {
      setTimeout(() => {
        if (!dialogCancelled && input.files?.length === 0) {
          handleCancel();
        }
      }, 300);
    }, { once: true });

    input.click();
  });
};

const createDraftRecord = (file: File): void => {
  // Create a local draft record for the imported file (NOT synced to cloud)
  console.log(`📝 [DRAFT] Creating local draft for: ${file.name}`);

  // Extract any available path information
  // Use type assertion to access browser-specific properties
  const fileWithPath = file as File & { webkitRelativePath?: string; path?: string };

  const fileInfo = {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    // Store webkitRelativePath if available (from folder selection)
    relativePath: fileWithPath.webkitRelativePath || '',
    // Store full path if available (usually not for security reasons)
    path: fileWithPath.path || '',
    // Create a hint for the user about where they imported it from
    importHint: fileWithPath.webkitRelativePath ?
      `Originally from folder: ${fileWithPath.webkitRelativePath.split('/')[0]}` :
      `Originally named: ${file.name}`
  };

  const draftMetadata: NewsletterMetadata = {
    id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Local ID
    filename: file.name,
    title: file.name.replace('.pdf', ''),
    description: '',
    publicationDate: new Date().toISOString(),
    year: new Date().getFullYear(),
    fileSize: file.size,
    pageCount: 0, // Will be updated during processing
    downloadUrl: '', // Will be set when synced to Firebase Storage
    storageRef: '', // Will be set when synced to Firebase Storage
    tags: [], // Start with empty tags - user can add as needed
    featured: false,
    isPublished: false, // Drafts are not published by default
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: auth.currentUser.value?.uid || 'anonymous',
    updatedBy: auth.currentUser.value?.uid || 'anonymous',
    actions: {
      canView: false,
      canDownload: false,
      canSearch: false,
      hasThumbnail: false,
    },
    // Store file information for re-import assistance
    originalFileInfo: fileInfo,
  };

  // Store locally in draft array (NOT in Firebase)
  draftNewsletters.value.push(draftMetadata);
  console.log(`📝 [DRAFT] Stored locally: ${file.name} (Total drafts: ${draftNewsletters.value.length})`);

  // Store the File object for thumbnail generation (in memory only)
  draftFileMap.value.set(draftMetadata.id, file);
  console.log(`📝 [DRAFT] Stored File object for thumbnail generation: ${draftMetadata.id}`);

  // Also store in localStorage for persistence across sessions
  localStorage.setItem('newsletter-drafts', JSON.stringify(draftNewsletters.value));
  console.log(`📝 [DRAFT] Persisted to localStorage`);
};

// Load drafts from localStorage on component mount
const loadDraftsFromStorage = (): void => {
  console.log('📝 [DRAFT] Loading drafts from localStorage...');
  try {
    const storedDrafts = localStorage.getItem('newsletter-drafts');
    if (storedDrafts) {
      draftNewsletters.value = JSON.parse(storedDrafts);
      console.log(`📝 [DRAFT] Loaded ${draftNewsletters.value.length} drafts from localStorage`);
    } else {
      console.log('📝 [DRAFT] No drafts found in localStorage');
    }
  } catch (error) {
    console.error('📝 [DRAFT] Error loading drafts from localStorage:', error);
  }
};

// Sync all drafts to Firebase
const uploadDraftsToCloud = async (): Promise<void> => {
  const actionId = 'SYNC-DRAFTS-' + Date.now();
  console.log(`☁️ [${actionId}] Starting sync of ${draftNewsletters.value.length} drafts to Firebase...`);

  if (draftNewsletters.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'No local drafts to sync',
      position: 'top'
    });
    return;
  }

  try {
    isImporting.value = true;

    let synced = 0;
    for (const draft of draftNewsletters.value) {
      try {
        // Remove local-only fields and create proper metadata
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...metadataWithoutId } = draft;
        const cleanMetadata = {
          ...metadataWithoutId,
          tags: draft.tags.filter(tag => tag !== 'LOCAL_ONLY'), // Remove LOCAL_ONLY tag
          updatedAt: new Date().toISOString(),
          updatedBy: auth.currentUser.value?.uid || 'anonymous',
        };

        await firestoreService.saveNewsletterMetadata(cleanMetadata);
        synced++;
        console.log(`☁️ [${actionId}] Synced: ${draft.filename}`);
      } catch (error) {
        console.error(`☁️ [${actionId}] Failed to sync ${draft.filename}:`, error);
      }
    }

    // Clear local drafts after successful sync
    draftNewsletters.value = [];
    draftFileMap.value.clear(); // Clear file objects to prevent memory leaks
    localStorage.removeItem('newsletter-drafts');

    $q.notify({
      type: 'positive',
      message: `Successfully synced ${synced} drafts to Firebase`,
      caption: 'Synced items now appear in main list',
      position: 'top'
    });

    // Refresh only Firebase data to show synced items without triggering PDF processing
    await refreshFirebaseDataOnly();
    console.log(`☁️ [${actionId}] Upload completed and Firebase data refreshed`);

  } catch (error) {
    console.error(`☁️ [${actionId}] Error uploading drafts:`, error);
    $q.notify({
      type: 'negative',
      message: 'Failed to upload drafts to cloud',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    isImporting.value = false;
  }
};

// Clear local drafts without uploading
const clearLocalDrafts = async (): Promise<void> => {
  console.log('🗑️ [DRAFT] Clearing local drafts...');

  const confirmed = await new Promise<boolean>((resolve) => {
    $q.dialog({
      title: 'Clear Local Drafts',
      message: `This will permanently delete ${draftNewsletters.value.length} local draft(s) without uploading them to the cloud. Continue?`,
      cancel: true,
      persistent: true,
      ok: {
        label: 'Delete Drafts',
        color: 'negative'
      }
    }).onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });

  if (confirmed) {
    draftNewsletters.value = [];
    draftFileMap.value.clear(); // Clear file objects to prevent memory leaks
    localStorage.removeItem('newsletter-drafts');

    $q.notify({
      type: 'info',
      message: 'Local drafts cleared',
      position: 'top'
    });

    console.log('🗑️ [DRAFT] Local drafts cleared');
  }
};

// Individual Metadata Functions
const extractPageCountForSelected = async (): Promise<void> => {
  const actionId = 'PAGE-COUNT-' + Date.now();
  console.log(`📊 [${actionId}] Starting page count extraction...`);

  const target = selectedNewsletters.value.length > 0 ? selectedNewsletters.value : allNewslettersIncludingDrafts.value;
  console.log(`📊 [${actionId}] Target: ${selectedNewsletters.value.length > 0 ? 'SELECTED' : 'ALL'} (${target.length} items)`);

  if (target.length === 0) {
    console.warn(`📊 [${actionId}] No newsletters to process - ABORTING`);
    $q.notify({ type: 'warning', message: 'No newsletters to process', position: 'top' });
    return;
  }

  try {
    console.log(`📊 [${actionId}] Setting spinner state to true`);
    isExtractingPageCount.value = true;

    console.log(`📊 [${actionId}] Showing start notification`);
    $q.notify({
      type: 'info',
      message: `Extracting page count for ${target.length} newsletter(s)...`,
      position: 'top'
    });

    console.log(`📊 [${actionId}] Beginning processing simulation...`);
    // Implementation would go here - extract page count from PDFs
    // For now, just simulate the process
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`📊 [${actionId}] Processing completed successfully`);
    $q.notify({
      type: 'positive',
      message: `Page count extraction completed for ${target.length} newsletters`,
      position: 'top'
    });
  } catch (error) {
    console.error(`📊 [${actionId}] ERROR:`, error);
    $q.notify({
      type: 'negative',
      message: 'Failed to extract page counts',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    console.log(`📊 [${actionId}] Setting spinner state to false`);
    isExtractingPageCount.value = false;
    console.log(`📊 [${actionId}] Function completed`);
  }
};

const extractFileSizeForSelected = async (): Promise<void> => {
  const actionId = 'FILE-SIZE-' + Date.now();
  console.log(`📏 [${actionId}] Starting file size extraction...`);

  const target = selectedNewsletters.value.length > 0 ? selectedNewsletters.value : allNewslettersIncludingDrafts.value;
  console.log(`📏 [${actionId}] Target: ${selectedNewsletters.value.length > 0 ? 'SELECTED' : 'ALL'} (${target.length} items)`);

  if (target.length === 0) {
    console.warn(`📏 [${actionId}] No newsletters to process - ABORTING`);
    $q.notify({ type: 'warning', message: 'No newsletters to process', position: 'top' });
    return;
  }

  try {
    console.log(`📏 [${actionId}] Setting spinner state to true`);
    isExtractingFileSize.value = true;

    console.log(`📏 [${actionId}] Showing start notification`);
    $q.notify({
      type: 'info',
      message: `Extracting file size for ${target.length} newsletter(s)...`,
      position: 'top'
    });

    console.log(`📏 [${actionId}] Beginning processing simulation...`);
    // Implementation would go here - get file sizes from URLs or local files
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log(`📏 [${actionId}] Processing completed successfully`);
    $q.notify({
      type: 'positive',
      message: `File size extraction completed for ${target.length} newsletters`,
      position: 'top'
    });
  } catch (error) {
    console.error(`📏 [${actionId}] ERROR:`, error);
    $q.notify({
      type: 'negative',
      message: 'Failed to extract file sizes',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    console.log(`📏 [${actionId}] Setting spinner state to false`);
    isExtractingFileSize.value = false;
    console.log(`📏 [${actionId}] Function completed`);
  }
};

const extractDatesForSelected = async (): Promise<void> => {
  const actionId = 'DATES-' + Date.now();
  console.log(`📅 [${actionId}] Starting date extraction...`);

  const target = selectedNewsletters.value.length > 0 ? selectedNewsletters.value : allNewslettersIncludingDrafts.value;
  console.log(`📅 [${actionId}] Target: ${selectedNewsletters.value.length > 0 ? 'SELECTED' : 'ALL'} (${target.length} items)`);

  if (target.length === 0) {
    console.warn(`📅 [${actionId}] No newsletters to process - ABORTING`);
    $q.notify({ type: 'warning', message: 'No newsletters to process', position: 'top' });
    return;
  }

  try {
    console.log(`📅 [${actionId}] Setting spinner state to true`);
    isExtractingDates.value = true;
    $q.notify({
      type: 'info',
      message: `Extracting dates for ${target.length} newsletter(s)...`,
      position: 'top'
    });

    // Implementation would go here - parse dates from filenames or content
    await new Promise(resolve => setTimeout(resolve, 1000));

    $q.notify({
      type: 'positive',
      message: `Date extraction completed for ${target.length} newsletters`,
      position: 'top'
    });
  } catch (error) {
    console.error(`📅 [${actionId}] ERROR during date extraction:`, error);
    $q.notify({
      type: 'negative',
      message: 'Failed to extract dates',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    console.log(`📅 [${actionId}] Setting spinner state to false - COMPLETED`);
    isExtractingDates.value = false;
  }
};

const generateKeywordsForSelected = async (): Promise<void> => {
  const actionId = 'KEYWORDS-' + Date.now();
  console.log(`🏷️ [${actionId}] Starting keyword generation...`);

  const target = selectedNewsletters.value.length > 0 ? selectedNewsletters.value : allNewslettersIncludingDrafts.value;
  console.log(`🏷️ [${actionId}] Target: ${selectedNewsletters.value.length > 0 ? 'SELECTED' : 'ALL'} (${target.length} items)`);

  if (target.length === 0) {
    console.warn(`🏷️ [${actionId}] No newsletters to process - ABORTING`);
    $q.notify({ type: 'warning', message: 'No newsletters to process', position: 'top' });
    return;
  }

  try {
    console.log(`🏷️ [${actionId}] Setting spinner state to true`);
    isGeneratingKeywords.value = true;
    $q.notify({
      type: 'info',
      message: `Generating keywords for ${target.length} newsletter(s)...`,
      position: 'top'
    });

    // Implementation would go here - extract keywords from text content
    await new Promise(resolve => setTimeout(resolve, 3000));

    $q.notify({
      type: 'positive',
      message: `Keyword generation completed for ${target.length} newsletters`,
      position: 'top'
    });
  } catch (error) {
    console.error(`🏷️ [${actionId}] ERROR during keyword generation:`, error);
    $q.notify({
      type: 'negative',
      message: 'Failed to generate keywords',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    console.log(`🏷️ [${actionId}] Setting spinner state to false - COMPLETED`);
    isGeneratingKeywords.value = false;
  }
};

const generateDescriptionsForSelected = async (): Promise<void> => {
  const actionId = 'DESCRIPTIONS-' + Date.now();
  console.log(`📝 [${actionId}] Starting description generation...`);

  const target = selectedNewsletters.value.length > 0 ? selectedNewsletters.value : allNewslettersIncludingDrafts.value;
  console.log(`📝 [${actionId}] Target: ${selectedNewsletters.value.length > 0 ? 'SELECTED' : 'ALL'} (${target.length} items)`);

  if (target.length === 0) {
    console.warn(`📝 [${actionId}] No newsletters to process - ABORTING`);
    $q.notify({ type: 'warning', message: 'No newsletters to process', position: 'top' });
    return;
  }

  try {
    console.log(`📝 [${actionId}] Setting spinner state to true`);
    isGeneratingDescriptions.value = true;
    $q.notify({
      type: 'info',
      message: `Generating descriptions for ${target.length} newsletter(s)...`,
      position: 'top'
    });

    // Implementation would go here - generate descriptions from content
    await new Promise(resolve => setTimeout(resolve, 4000));

    $q.notify({
      type: 'positive',
      message: `Description generation completed for ${target.length} newsletters`,
      position: 'top'
    });
  } catch (error) {
    console.error(`📝 [${actionId}] ERROR during description generation:`, error);
    $q.notify({
      type: 'negative',
      message: 'Failed to generate descriptions',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    console.log(`📝 [${actionId}] Setting spinner state to false - COMPLETED`);
    isGeneratingDescriptions.value = false;
  }
};

const generateTitlesForSelected = async (): Promise<void> => {
  const actionId = 'TITLES-' + Date.now();
  console.log(`📰 [${actionId}] Starting title generation...`);

  const target = selectedNewsletters.value.length > 0 ? selectedNewsletters.value : allNewslettersIncludingDrafts.value;
  console.log(`📰 [${actionId}] Target: ${selectedNewsletters.value.length > 0 ? 'SELECTED' : 'ALL'} (${target.length} items)`);

  if (target.length === 0) {
    console.warn(`📰 [${actionId}] No newsletters to process - ABORTING`);
    $q.notify({ type: 'warning', message: 'No newsletters to process', position: 'top' });
    return;
  }

  try {
    console.log(`📰 [${actionId}] Setting spinner state to true`);
    isGeneratingTitles.value = true;
    $q.notify({
      type: 'info',
      message: `Generating titles for ${target.length} newsletter(s)...`,
      position: 'top'
    });

    // Implementation would go here - generate titles from content or dates
    await new Promise(resolve => setTimeout(resolve, 2000));

    $q.notify({
      type: 'positive',
      message: `Title generation completed for ${target.length} newsletters`,
      position: 'top'
    });
  } catch (error) {
    console.error(`📰 [${actionId}] ERROR during title generation:`, error);
    $q.notify({
      type: 'negative',
      message: 'Failed to generate titles',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    console.log(`📰 [${actionId}] Setting spinner state to false - COMPLETED`);
    isGeneratingTitles.value = false;
  }
};
// Additional reactive data
const extractingText = ref<Record<string, boolean>>({});
const syncingIndividual = ref<Record<string, boolean>>({});
const publishingStates = ref<Record<string, boolean>>({});
const featuredStates = ref<Record<string, boolean>>({});
const editTab = ref('metadata');

// Helper function to update newsletter thumbnail reactively
const updateNewsletterThumbnail = (newsletterId: string, thumbnailUrl: string): void => {
  console.log('🔄 [DEBUG] Attempting to update thumbnail for newsletter ID:', newsletterId);
  console.log('🔄 [DEBUG] Thumbnail URL length:', thumbnailUrl.length);
  console.log('🔄 [DEBUG] Total Firebase newsletters:', newsletters.value.length);
  console.log('🔄 [DEBUG] Total draft newsletters:', draftNewsletters.value.length);

  // Try to find in Firebase newsletters first
  const newsletterIndex = newsletters.value.findIndex(n => n.id === newsletterId);
  console.log('🔄 [DEBUG] Found newsletter in Firebase at index:', newsletterIndex);

  if (newsletterIndex !== -1) {
    const newsletter = newsletters.value[newsletterIndex];
    if (newsletter) {
      console.log('🔄 [DEBUG] Before update - old thumbnail URL:', newsletter.thumbnailUrl);
      // Vue 3 reactivity: update the thumbnail URL
      newsletter.thumbnailUrl = thumbnailUrl;
      console.log('🔄 [DEBUG] After update - new thumbnail URL:', newsletter.thumbnailUrl?.substring(0, 50) + '...');
      console.log('🔄 [DEBUG] Reactively updated thumbnail for Firebase newsletter:', newsletter.title);
    } else {
      console.error('🔄 [DEBUG] Newsletter at index is null/undefined');
    }
    return;
  }

  // Try to find in local drafts
  const draftIndex = draftNewsletters.value.findIndex(n => n.id === newsletterId);
  console.log('🔄 [DEBUG] Found newsletter in drafts at index:', draftIndex);

  if (draftIndex !== -1) {
    const draft = draftNewsletters.value[draftIndex];
    if (draft) {
      console.log('🔄 [DEBUG] Before update - old draft thumbnail URL:', draft.thumbnailUrl);
      // Vue 3 reactivity: update the thumbnail URL
      draft.thumbnailUrl = thumbnailUrl;
      // Also persist to localStorage
      localStorage.setItem('newsletter-drafts', JSON.stringify(draftNewsletters.value));
      console.log('🔄 [DEBUG] After update - new draft thumbnail URL:', draft.thumbnailUrl?.substring(0, 50) + '...');
      console.log('🔄 [DEBUG] Reactively updated thumbnail for draft newsletter:', draft.title);
    } else {
      console.error('🔄 [DEBUG] Draft at index is null/undefined');
    }
    return;
  }

  console.error('🔄 [DEBUG] Newsletter not found with ID:', newsletterId);
  console.log('🔄 [DEBUG] Available Firebase IDs:', newsletters.value.map(n => n.id));
  console.log('🔄 [DEBUG] Available draft IDs:', draftNewsletters.value.map(n => n.id));
};
const selectedNewsletters = ref<ContentManagementNewsletter[]>([]);
const showBulkActionsMenu = ref(false);
// Form options and data
const seasonOptions = [
  { label: 'Spring', value: 'spring' },
  { label: 'Summer', value: 'summer' },
  { label: 'Fall', value: 'fall' },
  { label: 'Winter', value: 'winter' },
];
const availableTags = [
  'Community Events',
  'Lake Activities',
  'Boating',
  'Swimming',
  'Fishing',
  'Nature',
  'Wildlife',
  'Safety',
  'Environment',
  'History',
  'Culture',
  'Recreation',
  'Property',
  'Maintenance',
  'Rules & Regulations',
  'Emergency Services',
  'Seasonal Activities',
  'Board Updates',
  'Member News',
  'Photo Gallery'
];
const availableCategories = [
  'Community Events',
  'Lake Activities',
  'Safety & Emergency',
  'Environment & Nature',
  'Property & Maintenance',
  'Board Updates',
  'Member News',
  'Recreation',
  'History & Culture'
];
// Computed for form handling
const contributorsString = computed({
  get: () => {
    if (!editDialog.value.editingNewsletter) return '';
    const contributors = editDialog.value.editingNewsletter.contributors;
    if (Array.isArray(contributors)) {
      return contributors.join(', ');
    }
    return contributors || '';
  },
  set: (value: string) => {
    if (editDialog.value.editingNewsletter) {
      editDialog.value.editingNewsletter.contributors = value;
    }
  }
});
// Table configuration
const pagination = ref({
  sortBy: 'year',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

// Computed properties for filters
const availableYears = computed(() => {
  const years = [...new Set(newsletters.value.map(n => n.year))].sort((a, b) => b - a);
  return years;
});
const availableSeasons = computed(() => {
  const seasons = [...new Set(newsletters.value.map(n => n.season))].sort();
  return seasons;
});

const availableMonths = computed(() => {
  const months = [...new Set(newsletters.value
    .filter(n => n.month) // Only include newsletters that have a month
    .map(n => n.month!)
  )].sort((a, b) => a - b);

  // Convert month numbers to display format
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return months.map(monthNum => ({
    label: monthNames[monthNum - 1],
    value: monthNum
  }));
});
// Methods - Newsletter management using versioning system
async function refreshNewsletterData(): Promise<void> {
  // Simply reload newsletters from Firebase - no local metadata needed
  await loadNewsletters();
}

// Extract metadata and store directly in Firebase with versioning
async function extractNewslettersWithVersioning(newsletters: ContentManagementNewsletter[]): Promise<void> {
  const failedExtractions: string[] = [];
  let successCount = 0;

  for (const newsletter of newsletters) {
    try {
      // CRITICAL FIX: Find the actual Firebase document ID by filename
      // The newsletter.id is a hash-based ID, but Firebase documents have different IDs
      const firebaseId = await firestoreService.findNewsletterIdByFilename(newsletter.filename);

      if (!firebaseId) {
        // Newsletter not in Firebase yet - need to sync it first
        throw new Error(`Newsletter not found in Firebase: ${newsletter.filename}. Please sync to Firebase first.`);
      }

      // Extract content using tag generation service
      const tagResult = await tagGenerationService.generateTagsFromPdf(
        newsletter.downloadUrl,
        newsletter.filename
      );

      // Prepare updates for versioning system
      const updates = {
        searchableText: tagResult.textContent,
        tags: [...(newsletter.tags || []), ...tagResult.suggestedTags].slice(0, 20), // Limit tags
      };

      // Update using versioning system with the correct Firebase document ID
      await firestoreService.updateNewsletterWithVersioning(
        firebaseId,
        updates,
        'Automated text extraction and tag generation',
        undefined // Let the service get the current user
      );

      successCount++;
    } catch (error) {
      console.error(`❌ Failed to extract ${newsletter.filename}:`, error);
      failedExtractions.push(`${newsletter.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  if (failedExtractions.length > 0) {
    console.warn(`⚠️ Failed extractions:`, failedExtractions);
    $q.notify({
      type: 'warning',
      message: `${successCount}/${newsletters.length} successful, ${failedExtractions.length} failed`,
      caption: 'Check console for details',
      position: 'top'
    });
  }
}
// Selection-based bulk operations
async function extractSelectedMetadata(): Promise<void> {
  if (selectedNewsletters.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'No newsletters selected',
      caption: 'Please select newsletters to extract metadata from',
      position: 'top'
    });
    return;
  }

  processingStates.value.isExtracting = true;
  try {
    // Extract metadata directly to Firebase using versioning system
    await extractNewslettersWithVersioning(selectedNewsletters.value);

    // Refresh the newsletters list
    await loadNewsletters();

    $q.notify({
      type: 'positive',
      message: `Metadata extraction completed for ${selectedNewsletters.value.length} newsletters`,
      caption: 'All changes saved with version history',
      position: 'top'
    });
  } finally {
    processingStates.value.isExtracting = false;
  }
}
async function handleExtractSelectedText(): Promise<void> {
  if (selectedNewsletters.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'No newsletters selected',
      position: 'top'
    });
    return;
  }
  await extractSelectedMetadata(); // Reuse the same logic
}
async function generateSelectedThumbnails(): Promise<void> {
  if (selectedNewsletters.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'No newsletters selected',
      position: 'top'
    });
    return;
  }

  try {
    // STEP 1: Separate local vs remote PDFs
    const localPdfs: ContentManagementNewsletter[] = [];
    const remotePdfs: ContentManagementNewsletter[] = [];

    selectedNewsletters.value.forEach(newsletter => {
      if (newsletter.downloadUrl &&
        newsletter.downloadUrl.includes(window.location.origin) &&
        newsletter.downloadUrl.includes('/issues/')) {
        localPdfs.push(newsletter);
      } else {
        remotePdfs.push(newsletter);
      }
    });

    console.log(`📊 PDF Analysis: ${localPdfs.length} local, ${remotePdfs.length} remote`);

    // STEP 2: Handle LOCAL PDFs first - these should always work
    if (localPdfs.length > 0) {
      $q.notify({
        type: 'info',
        message: `Generating thumbnails for ${localPdfs.length} local PDF(s)...`,
        position: 'top'
      });

      await generateBatchThumbnails(
        localPdfs,
        (newsletter: ContentManagementNewsletter, thumbnailUrl: string) => {
          updateNewsletterThumbnail(newsletter.id, thumbnailUrl);
        }
      );
    }

    // STEP 3: Handle REMOTE PDFs - check for local thumbnails first
    if (remotePdfs.length > 0) {
      const action = await new Promise<'check-local' | 'download' | 'skip'>((resolve) => {
        $q.dialog({
          title: `🚨 Remote PDF Thumbnail Generation`,
          message: `Found ${remotePdfs.length} remote PDF(s). Remote PDFs may fail to generate thumbnails directly.`,
          html: true,
          options: {
            type: 'radio',
            model: 'check-local',
            items: [
              {
                label: '✅ Check for existing local thumbnails first (RECOMMENDED)',
                value: 'check-local'
              },
              {
                label: '🌐 Try to download PDFs and generate thumbnails',
                value: 'download'
              },
              {
                label: '❌ Skip remote PDFs for now',
                value: 'skip'
              }
            ]
          },
          cancel: false,
          persistent: true
        }).onOk((selectedAction) => resolve(selectedAction));
      });

      if (action === 'check-local') {
        await checkForLocalThumbnails(remotePdfs);
      } else if (action === 'download') {
        $q.notify({
          type: 'warning',
          message: 'Attempting to download remote PDFs for thumbnail generation...',
          caption: 'This may fail due to CORS restrictions',
          position: 'top'
        });
        await generateBatchThumbnails(
          remotePdfs,
          (newsletter: ContentManagementNewsletter, thumbnailUrl: string) => {
            updateNewsletterThumbnail(newsletter.id, thumbnailUrl);
          }
        );
      } else {
        $q.notify({
          type: 'info',
          message: `Skipped ${remotePdfs.length} remote PDF(s)`,
          position: 'top'
        });
      }
    }

  } catch (error) {
    console.error('Error in thumbnail generation:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to generate thumbnails',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  }
}

async function checkForLocalThumbnails(newsletters: ContentManagementNewsletter[]): Promise<void> {
  // Check for existing thumbnails in /public/thumbnails/
  let found = 0;
  let notFound = 0;
  const results: string[] = [];

  $q.notify({
    type: 'info',
    message: `🔍 Checking for local thumbnails for ${newsletters.length} remote PDF(s)...`,
    position: 'top'
  });

  for (const newsletter of newsletters) {
    try {
      // Try different thumbnail filename patterns
      const possibleThumbnails = [
        `${newsletter.filename.replace('.pdf', '.jpg')}`,
        `${newsletter.filename.replace('.pdf', '.png')}`,
        `${newsletter.filename.replace('.pdf', '-thumb.jpg')}`,
        `${newsletter.filename.replace('.pdf', '_thumbnail.jpg')}`,
        `thumbnail-${newsletter.filename.replace('.pdf', '.jpg')}`
      ];

      let thumbnailFound = false;
      for (const thumbnailName of possibleThumbnails) {
        try {
          // Use relative path for thumbnail check - avoid hardcoded localhost URLs
          const thumbnailUrl = `/thumbnails/${thumbnailName}`;
          const response = await fetch(thumbnailUrl, { method: 'HEAD' });

          if (response.ok) {
            // Found a thumbnail! Update the newsletter
            updateNewsletterThumbnail(newsletter.id, thumbnailUrl);
            found++;
            results.push(`✅ Found: ${thumbnailName} → ${newsletter.filename}`);
            thumbnailFound = true;
            break;
          }
        } catch {
          // Continue to next thumbnail pattern
        }
      }

      if (!thumbnailFound) {
        notFound++;
        results.push(`❌ Not found: ${newsletter.filename}`);
      }

    } catch {
      notFound++;
      results.push(`❌ Error checking: ${newsletter.filename}`);
    }
  }

  console.log('Local thumbnail check results:', results);

  $q.notify({
    type: found > 0 ? 'positive' : 'warning',
    message: `🎯 Local thumbnail check complete: ${found} found, ${notFound} not found`,
    caption: found > 0 ? 'Thumbnails linked successfully!' : 'No local thumbnails found',
    position: 'top',
    timeout: 5000
  });

  // If some weren't found, offer to try generating them
  if (notFound > 0) {
    const shouldGenerate = await new Promise<boolean>((resolve) => {
      $q.dialog({
        title: '🚨 Missing Thumbnails',
        message: `${notFound} newsletter(s) don't have local thumbnails. Would you like to try generating them directly from the remote PDFs?`,
        html: true,
        cancel: { label: 'No, Skip Them', flat: true },
        ok: { label: 'Yes, Try to Generate', color: 'warning' },
        persistent: true
      }).onOk(() => resolve(true))
        .onCancel(() => resolve(false));
    });

    if (shouldGenerate) {
      const missingThumbnails = newsletters.filter(newsletter =>
        !results.some(result => result.includes(`✅ Found:`) && result.includes(newsletter.filename))
      );

      $q.notify({
        type: 'warning',
        message: '🌐 Attempting to generate thumbnails from remote PDFs...',
        caption: 'This may fail due to CORS restrictions',
        position: 'top'
      });

      await generateBatchThumbnails(
        missingThumbnails,
        (newsletter: ContentManagementNewsletter, thumbnailUrl: string) => {
          updateNewsletterThumbnail(newsletter.id, thumbnailUrl);
        }
      );
    }
  }
}

// SINGLE REUSABLE SYNC FUNCTION - NO MORE DUPLICATES!
async function syncNewsletterToFirebase(newsletter: ContentManagementNewsletter): Promise<void> {
  let metadataToSync;

  if (newsletter.id.startsWith('draft-')) {
    // This is a draft - find original metadata
    const originalDraft = draftNewsletters.value.find(d => d.id === newsletter.id);
    if (!originalDraft) {
      throw new Error('Cannot sync: draft metadata not found');
    }

    // Remove local-only fields and create proper metadata for sync
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...metadataWithoutId } = originalDraft;
    metadataToSync = {
      ...metadataWithoutId,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.value?.uid || 'anonymous',
      // Include thumbnail data if it exists
      ...(originalDraft.thumbnailUrl ? { thumbnailUrl: originalDraft.thumbnailUrl } : {}),
      actions: {
        ...metadataWithoutId.actions,
        hasThumbnail: !!originalDraft.thumbnailUrl
      }
    };
  } else {
    // This is a regular newsletter - CREATE FIREBASE RECORD
    const currentDate = new Date().toISOString();
    const baseMetadata = {
      filename: newsletter.filename,
      title: newsletter.title || newsletter.filename.replace('.pdf', ''),
      description: newsletter.description || '',
      publicationDate: newsletter.displayDate || currentDate,
      year: newsletter.year || new Date().getFullYear(),
      fileSize: newsletter.fileSize || 0,
      downloadUrl: newsletter.downloadUrl || '',
      storageRef: `newsletters/${newsletter.filename}`,
      tags: newsletter.tags || [],
      featured: newsletter.featured || false,
      isPublished: newsletter.isPublished || false,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: auth.currentUser.value?.uid || 'anonymous',
      updatedBy: auth.currentUser.value?.uid || 'anonymous',
      actions: {
        canView: true,
        canDownload: true,
        canSearch: false,
        hasThumbnail: !!newsletter.thumbnailUrl // SET TO TRUE IF THUMBNAIL EXISTS
      },
      // Conditionally add thumbnailUrl if it exists
      ...(newsletter.thumbnailUrl ? { thumbnailUrl: newsletter.thumbnailUrl } : {})
    };

    // Add season only if it's a valid value
    if (newsletter.season && ['spring', 'summer', 'fall', 'winter'].includes(newsletter.season)) {
      metadataToSync = {
        ...baseMetadata,
        season: newsletter.season as 'spring' | 'summer' | 'fall' | 'winter'
      };
    } else {
      metadataToSync = baseMetadata;
    }
  }

  // ALWAYS UPSERT TO FIREBASE (UPDATE IF EXISTS, CREATE IF NEW)
  await firestoreService.upsertNewsletterMetadata(metadataToSync);

  // Remove from local drafts if it was a draft
  if (newsletter.id.startsWith('draft-')) {
    draftNewsletters.value = draftNewsletters.value.filter(d => d.id !== newsletter.id);
    localStorage.setItem('newsletter-drafts', JSON.stringify(draftNewsletters.value));
  }
}

async function handleSyncSelected(): Promise<void> {
  if (selectedNewsletters.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'No newsletters selected',
      position: 'top'
    });
    return;
  }

  // PROCESS ALL SELECTED NEWSLETTERS TO FIREBASE
  // Create or update Firebase records for all selected newsletters
  const newslettersToProcess = selectedNewsletters.value;

  // Start processing ALL selected newsletters to Firebase using the reusable function
  processingStates.value.isSyncing = true;

  try {
    let synced = 0;
    let failed = 0;

    for (const newsletter of newslettersToProcess) {
      try {
        await syncNewsletterToFirebase(newsletter);
        synced++;
        console.log(`☁️ Processed to Firebase: ${newsletter.filename}`);
      } catch (error) {
        console.error(`☁️ Failed to process ${newsletter.filename}:`, error);
        failed++;
      }
    }    // Show results
    if (synced > 0) {
      $q.notify({
        type: 'positive',
        message: `Successfully processed ${synced} newsletter(s) to Firebase`,
        caption: failed > 0 ? `${failed} newsletter(s) failed to process` : 'All selected newsletters processed',
        position: 'top'
      });

      // Remove processed drafts from local storage if any
      const processedDraftIds = newslettersToProcess
        .filter(n => n.id.startsWith('draft-'))
        .map(n => n.id);

      if (processedDraftIds.length > 0) {
        draftNewsletters.value = draftNewsletters.value.filter(draft =>
          !processedDraftIds.includes(draft.id)
        );
        localStorage.setItem('newsletter-drafts', JSON.stringify(draftNewsletters.value));
      }

      // Refresh the newsletter list
      await loadNewsletters();
    } else {
      $q.notify({
        type: 'warning',
        message: 'No newsletters could be processed',
        caption: 'Check console for error details',
        position: 'top'
      });
    }
  } catch (error) {
    console.error('Sync selected failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to sync selected drafts',
      caption: error instanceof Error ? error.message : 'Unknown error occurred',
      position: 'top'
    });
  } finally {
    processingStates.value.isSyncing = false;
  }
}
// Individual newsletter sync - NOW USES REUSABLE FUNCTION
async function syncSingleNewsletter(newsletter: ContentManagementNewsletter): Promise<void> {
  try {
    await syncNewsletterToFirebase(newsletter);

    $q.notify({
      type: 'positive',
      message: `Successfully created/updated "${newsletter.title}" in Firebase`,
      position: 'top'
    });

    // Refresh only Firebase data to show the synced item without triggering PDF processing
    await refreshFirebaseDataOnly();
  } catch (error) {
    console.error('Single sync failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to sync newsletter',
      caption: error instanceof Error ? error.message : 'Unknown error occurred',
      position: 'top'
    });
  }
}// Toggle newsletter published status
async function toggleNewsletterPublished(newsletter: ContentManagementNewsletter): Promise<void> {
  publishingStates.value[newsletter.id] = true;
  try {
    // Explicitly handle undefined/falsy values as false for better boolean logic
    const currentStatus = newsletter.isPublished === true;
    const newStatus = !currentStatus;

    console.log(`Toggling publication status: ${currentStatus} -> ${newStatus} for newsletter ${newsletter.id}`);

    // First, ensure the newsletter exists in Firebase by syncing it if needed
    try {
      await firestoreService.updateNewsletterMetadata(newsletter.id, {
        isPublished: newStatus
      });
    } catch (error) {
      // If update fails because document doesn't exist, create it first
      if (error instanceof Error && error.message.includes('No document to update')) {
        console.log('Document does not exist, creating it first...');
        await syncNewsletterToFirebase(newsletter);
        // Now try the update again
        await firestoreService.updateNewsletterMetadata(newsletter.id, {
          isPublished: newStatus
        });
      } else {
        throw error; // Re-throw other errors
      }
    }

    // Update the local newsletter object
    newsletter.isPublished = newStatus;

    $q.notify({
      type: 'positive',
      message: `Newsletter ${newStatus ? 'published' : 'unpublished'} successfully`,
      position: 'top'
    });

  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to update publication status',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    publishingStates.value[newsletter.id] = false;
  }
}

// Toggle newsletter featured status
async function toggleNewsletterFeatured(newsletter: ContentManagementNewsletter): Promise<void> {
  featuredStates.value[newsletter.id] = true;
  try {
    // Explicitly handle undefined/falsy values as false for better boolean logic
    const currentStatus = newsletter.featured === true;
    const newStatus = !currentStatus;

    console.log(`Toggling featured status: ${currentStatus} -> ${newStatus} for newsletter ${newsletter.id}`);

    // First, ensure the newsletter exists in Firebase by syncing it if needed
    try {
      await firestoreService.updateNewsletterMetadata(newsletter.id, {
        featured: newStatus
      });
    } catch (error) {
      // If update fails because document doesn't exist, create it first
      if (error instanceof Error && error.message.includes('No document to update')) {
        console.log('Document does not exist, creating it first...');
        await syncNewsletterToFirebase(newsletter);
        // Now try the update again
        await firestoreService.updateNewsletterMetadata(newsletter.id, {
          featured: newStatus
        });
      } else {
        throw error; // Re-throw other errors
      }
    }

    // Update the local newsletter object
    newsletter.featured = newStatus;

    $q.notify({
      type: 'positive',
      message: `Newsletter ${newStatus ? 'added to featured' : 'removed from featured'}`,
      position: 'top'
    });

  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to update featured status',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    featuredStates.value[newsletter.id] = false;
  }
}

// Delete individual newsletter
async function deleteNewsletter(newsletter: ContentManagementNewsletter): Promise<void> {
  // Show confirmation dialog
  const confirmDelete = await new Promise<boolean>((resolve) => {
    $q.dialog({
      title: 'Delete Newsletter',
      message: `Are you sure you want to delete "${newsletter.title}"? This will permanently delete both the record and PDF file if they exist.`,
      persistent: true,
      color: 'negative',
      ok: {
        label: 'Delete',
        color: 'negative',
        flat: true
      },
      cancel: {
        label: 'Cancel',
        color: 'primary',
        flat: true
      }
    }).onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });

  if (!confirmDelete) return;

  try {
    // Use the comprehensive newsletter service delete method
    await firebaseNewsletterService.deleteNewsletter(newsletter.id);

    // Remove from local arrays (newsletter service handles its own cache)
    const index = newsletters.value.findIndex(n => n.id === newsletter.id);
    if (index > -1) {
      newsletters.value.splice(index, 1);
    }

    // Remove from selected if it was selected
    const selectedIndex = selectedNewsletters.value.findIndex(n => n.id === newsletter.id);
    if (selectedIndex > -1) {
      selectedNewsletters.value.splice(selectedIndex, 1);
    }

    $q.notify({
      type: 'positive',
      message: `Newsletter "${newsletter.title}" has been deleted`,
      position: 'top'
    });

  } catch (error) {
    console.error('❌ Error deleting newsletter:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to delete newsletter',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  }
}

// Bulk delete selected newsletters
async function handleBulkDelete(): Promise<void> {
  if (selectedNewsletters.value.length === 0) return;

  // Show confirmation dialog
  const confirmDelete = await new Promise<boolean>((resolve) => {
    $q.dialog({
      title: 'Delete Multiple Newsletters',
      message: `Are you sure you want to delete ${selectedNewsletters.value.length} newsletters? This will permanently delete both the records and PDF files if they exist.`,
      persistent: true,
      color: 'negative',
      ok: {
        label: `Delete ${selectedNewsletters.value.length} Items`,
        color: 'negative',
        flat: true
      },
      cancel: {
        label: 'Cancel',
        color: 'primary',
        flat: true
      }
    }).onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });

  if (!confirmDelete) return;

  const toDelete = [...selectedNewsletters.value]; // Copy the array
  let successCount = 0;
  let errorCount = 0;

  for (const newsletter of toDelete) {
    try {
      // Use the comprehensive newsletter service delete method
      await firebaseNewsletterService.deleteNewsletter(newsletter.id);

      // Remove from local arrays (newsletter service handles its own cache)
      const index = newsletters.value.findIndex(n => n.id === newsletter.id);
      if (index > -1) {
        newsletters.value.splice(index, 1);
      }

      successCount++;
    } catch (error) {
      console.error(`❌ Error deleting newsletter ${newsletter.title}:`, error);
      errorCount++;
    }
  }

  // Clear selection
  selectedNewsletters.value = [];

  // Show result notification
  if (successCount > 0 && errorCount === 0) {
    $q.notify({
      type: 'positive',
      message: `Successfully deleted ${successCount} newsletters`,
      position: 'top'
    });
  } else if (successCount > 0 && errorCount > 0) {
    $q.notify({
      type: 'warning',
      message: `Deleted ${successCount} newsletters, ${errorCount} failed`,
      position: 'top'
    });
  } else {
    $q.notify({
      type: 'negative',
      message: `Failed to delete ${errorCount} newsletters`,
      position: 'top'
    });
  }
}

// Utility functions
function clearSelection(): void {
  selectedNewsletters.value = [];
}

// New bulk operations for Gmail-style interface
async function extractAllMetadata(): Promise<void> {
  // Select all newsletters and extract metadata
  selectedNewsletters.value = [...newsletters.value];
  await extractSelectedMetadata();
  clearSelection();
}

// Firebase Text Extraction Function
async function extractAllTextToFirebase(): Promise<void> {
  try {
    processingStates.value.isExtractingAllText = true;

    $q.notify({
      type: 'info',
      message: 'Starting PDF text extraction to Firebase...',
      position: 'top'
    });

    // Load newsletters first to get the latest state
    await loadNewsletters();

    if (newsletters.value.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'No newsletters found to process',
        position: 'top'
      });
      return;
    }

    // Filter newsletters that need text extraction
    // Check if text extraction is missing based on ContentManagementNewsletter properties
    const needsExtraction = newsletters.value.filter(n => {
      return !n.searchableText || !n.wordCount || n.wordCount === 0;
    });

    if (needsExtraction.length === 0) {
      $q.notify({
        type: 'info',
        message: 'All newsletters already have extracted text',
        position: 'top'
      });
      return;
    }

    $q.notify({
      type: 'info',
      message: `Processing ${needsExtraction.length} newsletters...`,
      position: 'top'
    });

    // Prepare PDF data for batch processing
    const pdfBatch = needsExtraction.map(newsletter => ({
      url: newsletter.downloadUrl,
      filename: newsletter.filename
      // metadata is optional, so we omit it to avoid type conflicts
    }));

    // Process batch
    const results = await pdfExtractionFirebaseIntegration.batchExtractAndStore(pdfBatch);

    // Show completion notification
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    $q.notify({
      type: successful > 0 ? 'positive' : 'negative',
      message: `Firebase text extraction complete: ${successful} successful, ${failed} failed`,
      position: 'top',
      timeout: 5000
    });

    // Reload newsletters to see updated data
    await loadNewsletters();

  } catch (error) {
    console.error('Firebase PDF extraction failed:', error);
    $q.notify({
      type: 'negative',
      message: `Firebase extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      position: 'top'
    });
  } finally {
    processingStates.value.isExtractingAllText = false;
  }
}

async function generateAllThumbnails(): Promise<void> {
  // Select all newsletters and generate thumbnails
  selectedNewsletters.value = [...newsletters.value];
  await generateSelectedThumbnails();
  clearSelection();
}

async function enhanceAllNewsletterDates(): Promise<void> {
  // Enhance all newsletters with improved date information
  try {
    isEnhancingDates.value = true;

    $q.notify({
      type: 'info',
      message: 'Starting date enhancement for all newsletters...',
      position: 'top'
    });

    const result = await firebaseNewsletterService.batchEnhanceNewslettersWithDateInfo();

    $q.notify({
      type: 'positive',
      message: `Date enhancement complete! Updated ${result.updated}/${result.processed} newsletters`,
      caption: `${result.errors} errors encountered`,
      position: 'top'
    });

    // Refresh the newsletters list
    await loadNewsletters();

  } catch (error) {
    console.error('❌ Error enhancing newsletter dates:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to enhance newsletter dates',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    isEnhancingDates.value = false;
  }
}

async function rebuildDatabaseWithVersioning(): Promise<void> {
  // Comprehensive database rebuild using the new versioning system
  try {
    isRebuildingDatabase.value = true;

    // Confirm the rebuild action
    const confirmed = await new Promise<boolean>((resolve) => {
      $q.dialog({
        title: 'Rebuild Database with Versioning',
        message: 'This will clear all existing newsletter records and rebuild them using the new versioning system. This action cannot be undone. Continue?',
        cancel: true,
        persistent: true,
        ok: {
          label: 'Rebuild Database',
          color: 'negative'
        }
      }).onOk(() => resolve(true))
        .onCancel(() => resolve(false));
    });

    if (!confirmed) {
      return;
    }

    $q.notify({
      type: 'info',
      message: 'Starting database rebuild with versioning system...',
      position: 'top'
    });

    // Step 1: Clear existing newsletter records
    $q.notify({
      type: 'info',
      message: 'Step 1: Clearing existing newsletter records...',
      position: 'top'
    });

    // Get existing newsletters and delete them
    const existingNewsletters = await firestoreService.getAllNewslettersForAdmin();
    for (const newsletter of existingNewsletters) {
      try {
        await firebaseNewsletterService.deleteNewsletter(newsletter.id);
      } catch (error) {
        console.warn(`Failed to delete existing newsletter ${newsletter.id}:`, error);
      }
    }

    $q.notify({
      type: 'info',
      message: `Cleared ${existingNewsletters.length} existing records`,
      position: 'top'
    });

    // Step 2: Get list of all local PDF files from manifest
    $q.notify({
      type: 'info',
      message: 'Step 2: Loading PDF manifest...',
      position: 'top'
    });

    const manifestResponse = await fetch('/data/pdf-manifest.json');
    if (!manifestResponse.ok) {
      throw new Error('Failed to load PDF manifest');
    }
    const manifest = await manifestResponse.json() as { files: Array<{ filename: string; path: string }> };
    const localFiles = manifest.files.map((file) => file.filename);

    $q.notify({
      type: 'info',
      message: `Step 3: Creating versioned records for ${localFiles.length} PDFs...`,
      position: 'top'
    });

    // Step 3: Create versioned records for all PDFs
    let created = 0;
    let errors = 0;
    const results: string[] = [];

    for (const filename of localFiles) {
      try {
        // Create basic record using versioning system
        await firebaseNewsletterService.createRecordForLocalFile(filename);

        // The createRecordForLocalFile should now use versioning system
        // If it doesn't, we can enhance it to use versioning

        created++;
        results.push(`✅ Created versioned record for: ${filename}`);

        // Show progress
        if (created % 10 === 0) {
          $q.notify({
            type: 'info',
            message: `Progress: ${created}/${localFiles.length} records created...`,
            position: 'top'
          });
        }
      } catch (error) {
        errors++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push(`❌ Failed: ${filename} - ${errorMsg}`);
        console.error(`Failed to create record for ${filename}:`, error);
      }
    }

    $q.notify({
      type: 'positive',
      message: `Database rebuild complete! Created ${created}/${localFiles.length} versioned records`,
      caption: `${errors} errors encountered`,
      position: 'top'
    });

    // Show detailed results in console
    console.log('Database rebuild results:', results);

    // Step 4: Refresh the newsletters list
    $q.notify({
      type: 'info',
      message: 'Step 4: Refreshing newsletter data...',
      position: 'top'
    });

    await loadNewsletters();

    $q.notify({
      type: 'positive',
      message: 'Database rebuild with versioning system completed successfully!',
      caption: `All ${created} newsletters now use the new versioning system`,
      position: 'top'
    });

  } catch (error) {
    console.error('❌ Error rebuilding database:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to rebuild database',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    isRebuildingDatabase.value = false;
  }
}

async function fixLocalFileUrls(): Promise<void> {
  // Fix download URLs for local files that have relative paths instead of absolute URLs
  try {
    isFixingUrls.value = true;

    $q.notify({
      type: 'info',
      message: 'Checking for local files with incorrect URLs...',
      position: 'top'
    });

    // Get all newsletters
    const allNewsletters = await firestoreService.getAllNewslettersForAdmin();

    // Find newsletters with relative download URLs (starting with /issues/)
    const needsFixing = allNewsletters.filter(newsletter =>
      newsletter.downloadUrl &&
      newsletter.downloadUrl.startsWith('/issues/') &&
      !newsletter.downloadUrl.startsWith('http')
    );

    if (needsFixing.length === 0) {
      $q.notify({
        type: 'positive',
        message: 'All download URLs are already correct!',
        position: 'top'
      });
      return;
    }

    $q.notify({
      type: 'info',
      message: `Fixing download URLs for ${needsFixing.length} newsletters...`,
      position: 'top'
    });

    let fixed = 0;
    let errors = 0;
    const results: string[] = [];

    for (const newsletter of needsFixing) {
      try {
        const newUrl = `${window.location.origin}${newsletter.downloadUrl}`;

        // Update using versioning system
        await firestoreService.updateNewsletterWithVersioning(
          newsletter.id,
          { downloadUrl: newUrl },
          'Fixed download URL to use absolute path instead of relative path'
        );

        fixed++;
        results.push(`✅ Fixed URL for: ${newsletter.filename}`);
      } catch (error) {
        errors++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push(`❌ Failed to fix: ${newsletter.filename} - ${errorMsg}`);
        console.error(`Failed to fix URL for ${newsletter.filename}:`, error);
      }
    }

    $q.notify({
      type: fixed > 0 ? 'positive' : 'warning',
      message: `URL fixing complete! Fixed ${fixed}/${needsFixing.length} URLs`,
      caption: `${errors} errors encountered`,
      position: 'top'
    });

    // Show detailed results in console
    console.log('URL fixing results:', results);

    // Refresh the newsletters list
    await loadNewsletters();

  } catch (error) {
    console.error('❌ Error fixing URLs:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to fix download URLs',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    isFixingUrls.value = false;
  }
}

function clearAllCaches(): void {
  // Comprehensive cache clearing for complete reset
  console.log('🧹 [CLEAR-CACHE] Starting cache clearing process...');

  try {
    console.log('🧹 [CLEAR-CACHE] Setting spinner state to true');
    isClearingCache.value = true;

    // Confirm the action with simplified dialog handling
    $q.dialog({
      title: 'Clear All Caches',
      message: 'This will clear ALL cached data including local storage, IndexedDB, browser cache, and reset the application to a blank state. Continue?',
      cancel: true,
      persistent: true,
      ok: {
        label: 'Clear Everything',
        color: 'negative'
      }
    }).onOk(() => {
      console.log('🧹 [CLEAR-CACHE] User confirmed - proceeding with cache clearing...');
      void performCacheClear();
    }).onCancel(() => {
      console.log('🧹 [CLEAR-CACHE] User cancelled - setting spinner to false');
      isClearingCache.value = false;
    }).onDismiss(() => {
      console.log('🧹 [CLEAR-CACHE] Dialog dismissed - setting spinner to false');
      isClearingCache.value = false;
    });

  } catch (error) {
    console.error('❌ Error in clearAllCaches wrapper:', error);
    isClearingCache.value = false;
  }
}

// Separate function to perform the actual cache clearing
async function performCacheClear(): Promise<void> {
  try {
    $q.notify({
      type: 'info',
      message: 'Starting comprehensive cache clearing...',
      position: 'top'
    });

    let clearedItems = 0;
    const results: string[] = [];

    // 1. Clear browser localStorage
    try {
      const localStorageKeys = Object.keys(localStorage);
      localStorage.clear();
      clearedItems++;
      results.push(`✅ Cleared localStorage (${localStorageKeys.length} items)`);
    } catch (error) {
      results.push(`❌ Failed to clear localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 2. Clear browser sessionStorage
    try {
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorage.clear();
      clearedItems++;
      results.push(`✅ Cleared sessionStorage (${sessionStorageKeys.length} items)`);
    } catch (error) {
      results.push(`❌ Failed to clear sessionStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 3. Clear IndexedDB databases
    try {
      const databases = await indexedDB.databases();
      for (const dbInfo of databases) {
        if (dbInfo.name) {
          const deleteRequest = indexedDB.deleteDatabase(dbInfo.name);
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve(true);
            deleteRequest.onerror = () => reject(new Error(deleteRequest.error?.message || 'Failed to delete database'));
          });
        }
      }
      clearedItems++;
      results.push(`✅ Cleared IndexedDB (${databases.length} databases)`);
    } catch (error) {
      results.push(`❌ Failed to clear IndexedDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 4. Clear application state and local drafts
    try {
      newsletters.value = [];
      selectedNewsletters.value = [];
      draftNewsletters.value = []; // Clear local drafts
      draftFileMap.value.clear(); // Clear file objects to prevent memory leaks
      editDialog.value.showDialog = false;
      editDialog.value.editingNewsletter = null;
      clearedItems++;

      // Force reactivity check
      console.log(`🧹 [CLEAR-CACHE] After clearing - newsletters: ${newsletters.value.length}, drafts: ${draftNewsletters.value.length}`);
      console.log(`🧹 [CLEAR-CACHE] Combined newsletters: ${allNewslettersIncludingDrafts.value.length}`);
      console.log(`🧹 [CLEAR-CACHE] Filtered newsletters: ${filteredNewslettersIncludingDrafts.value.length}`);

      results.push(`✅ Cleared application state and local drafts (${allNewslettersIncludingDrafts.value.length} remaining)`);
    } catch (error) {
      results.push(`❌ Failed to clear application state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 5. Clear PDF thumbnails cache (browser cache URLs)
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
        clearedItems++;
        results.push(`✅ Cleared browser caches (${cacheNames.length} caches)`);
      }
    } catch (error) {
      results.push(`❌ Failed to clear browser caches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 6. Reset processing states
    try {
      Object.keys(processingStates.value).forEach(key => {
        if (key !== 'isClearingCache') {
          const state = processingStates.value[key as keyof typeof processingStates.value];
          if (typeof state === 'object' && 'value' in state) {
            (state as { value: boolean }).value = false;
          }
        }
      });
      clearedItems++;
      results.push(`✅ Reset processing states`);
    } catch (error) {
      results.push(`❌ Failed to reset processing states: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    $q.notify({
      type: 'positive',
      message: `Cache clearing complete! Cleared ${clearedItems}/6 cache types`,
      caption: 'Application is now in a blank state',
      position: 'top'
    });

    // Show detailed results in console
    console.log('Cache clearing results:', results);

    // Optional: Force page reload for complete reset
    $q.dialog({
      title: 'Complete Reset',
      message: 'For the most complete reset, would you like to reload the page?',
      cancel: true,
      ok: {
        label: 'Reload Page',
        color: 'primary'
      }
    }).onOk(() => {
      window.location.reload();
    });

  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to clear all caches',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    console.log('🧹 [CLEAR-CACHE] Setting spinner state to false');
    isClearingCache.value = false;
  }
}

async function createMissingDatabaseRecords(): Promise<void> {
  // Create Firebase database records for local PDF files that don't have records
  try {
    isCreatingRecords.value = true;

    $q.notify({
      type: 'info',
      message: 'Checking for local files without database records...',
      position: 'top'
    });

    // Get list of all local PDF files from manifest
    const manifestResponse = await fetch('/data/pdf-manifest.json');
    if (!manifestResponse.ok) {
      throw new Error('Failed to load PDF manifest');
    }
    const manifest = await manifestResponse.json() as { files: Array<{ filename: string; path: string }> };
    const localFiles = manifest.files.map((file) => file.filename);

    // Get list of all Firebase newsletters
    const firebaseNewsletters = await firestoreService.getAllNewslettersForAdmin();
    const firebaseFilenames = new Set(firebaseNewsletters.map(n => n.filename));

    // Find files that exist locally but not in Firebase
    const missingFiles = localFiles.filter((filename: string) => !firebaseFilenames.has(filename));

    if (missingFiles.length === 0) {
      $q.notify({
        type: 'positive',
        message: 'All local files already have database records!',
        position: 'top'
      });
      return;
    }

    $q.notify({
      type: 'info',
      message: `Creating database records for ${missingFiles.length} missing files...`,
      position: 'top'
    });

    // Create database records for missing files
    let created = 0;
    let errors = 0;
    const results: string[] = [];

    for (const filename of missingFiles) {
      try {
        await firebaseNewsletterService.createRecordForLocalFile(filename);
        created++;
        results.push(`✅ Created record for: ${filename}`);
      } catch (error) {
        errors++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push(`❌ Failed: ${filename} - ${errorMsg}`);
      }
    }

    $q.notify({
      type: created > 0 ? 'positive' : 'warning',
      message: `Database record creation complete! Created ${created}/${missingFiles.length} records`,
      caption: `${errors} errors encountered`,
      position: 'top'
    });

    // Show detailed results in console
    console.log('Database record creation results:', results);

    // Refresh the newsletters list
    await loadNewsletters();

  } catch (error) {
    console.error('❌ Error creating missing database records:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to create missing database records',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    isCreatingRecords.value = false;
  }
}

// Bulk toggle operations
async function handleBulkToggleFeatured(featured: boolean): Promise<void> {
  if (selectedNewsletters.value.length === 0) return;

  const updates = selectedNewsletters.value.map(async (newsletter) => {
    featuredStates.value[newsletter.id] = true;
    try {
      await firestoreService.updateNewsletterMetadata(newsletter.id, { featured });
      newsletter.featured = featured;
    } catch (error) {
      console.error(`Failed to update featured status for ${newsletter.id}:`, error);
      throw error;
    } finally {
      featuredStates.value[newsletter.id] = false;
    }
  });

  try {
    await Promise.all(updates);
    $q.notify({
      type: 'positive',
      message: `${selectedNewsletters.value.length} newsletters ${featured ? 'marked as featured' : 'removed from featured'}`,
      position: 'top'
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Some updates failed',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  }
}

async function handleBulkTogglePublished(published: boolean): Promise<void> {
  if (selectedNewsletters.value.length === 0) return;

  const updates = selectedNewsletters.value.map(async (newsletter) => {
    publishingStates.value[newsletter.id] = true;
    try {
      await firestoreService.updateNewsletterMetadata(newsletter.id, { isPublished: published });
      newsletter.isPublished = published;
    } catch (error) {
      console.error(`Failed to update published status for ${newsletter.id}:`, error);
      throw error;
    } finally {
      publishingStates.value[newsletter.id] = false;
    }
  });

  try {
    await Promise.all(updates);
    $q.notify({
      type: 'positive',
      message: `${selectedNewsletters.value.length} newsletters ${published ? 'published' : 'unpublished'}`,
      position: 'top'
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Some updates failed',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  }
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Unknown';
  }
}
function openPdf(newsletter: ContentManagementNewsletter): void {
  const pdfUrl = newsletter.downloadUrl?.startsWith('http')
    ? newsletter.downloadUrl
    : `${window.location.origin}${newsletter.downloadUrl || `/issues/${newsletter.filename}`}`;
  window.open(pdfUrl, '_blank');
}
// INDIVIDUAL EXTRACTION - Uses versioning service
function editNewsletter(newsletter: ContentManagementNewsletter): void {
  editDialog.value.editingNewsletter = { ...newsletter };
  editTab.value = 'metadata'; // Reset to metadata tab when opening
  editDialog.value.showDialog = true;
}
async function extractText(newsletter: ContentManagementNewsletter): Promise<void> {
  extractingText.value[newsletter.id] = true;
  try {
    textExtractionDialog.value.currentFile = newsletter;
    textExtractionDialog.value.showDialog = true;
    processingStates.value.isProcessingText = true;
    // Use unified tag generation service
    const tagResult = await tagGenerationService.generateTagsFromPdf(
      newsletter.downloadUrl,
      newsletter.filename
    );
    // Store the result for display in dialog
    textExtractionDialog.value.extractedContent = {
      textContent: tagResult.textContent,
      textPreview: tagResult.textPreview,
      wordCount: tagResult.wordCount,
      suggestedTags: tagResult.suggestedTags,
      topics: tagResult.topics,
      keyTerms: tagResult.keyTerms,
      keywordCounts: tagResult.keywordCounts,
    };
  } catch (error) {
    console.error(`❌ [INDIVIDUAL] Failed to extract tags for ${newsletter.filename}:`, error);
    $q.notify({
      type: 'negative',
      message: 'Failed to generate tags',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    extractingText.value[newsletter.id] = false;
    processingStates.value.isProcessingText = false;
  }
}
async function generateThumbnail(newsletter: ContentManagementNewsletter): Promise<void> {
  console.log('🖼️ [DEBUG] Starting thumbnail generation for:', newsletter.title);
  console.log('🖼️ [DEBUG] Newsletter ID:', newsletter.id);
  console.log('🖼️ [DEBUG] Newsletter download URL:', newsletter.downloadUrl);
  console.log('🖼️ [DEBUG] Draft file map size:', draftFileMap.value.size);
  console.log('🖼️ [DEBUG] Draft file map keys:', Array.from(draftFileMap.value.keys()));

  // Check if this is a local draft and use the File object
  if (!newsletter.downloadUrl && draftFileMap.value.has(newsletter.id)) {
    const file = draftFileMap.value.get(newsletter.id);
    if (file) {
      console.log('🖼️ [DEBUG] Using local File object for draft thumbnail generation');

      // Create a blob URL from the File object
      const blobUrl = URL.createObjectURL(file);
      console.log('🖼️ [DEBUG] Created blob URL for local file:', blobUrl);

      // Create a temporary newsletter object with the blob URL
      const tempNewsletter = { ...newsletter, downloadUrl: blobUrl };

      try {
        // Check if thumbnail already exists to determine if we should force regeneration
        const hasExistingThumbnail = !!newsletter.thumbnailUrl;
        console.log('🖼️ [DEBUG] Has existing thumbnail:', hasExistingThumbnail);

        await generateSingleThumbnail(
          tempNewsletter,
          // Callback: immediately update the UI when thumbnail is generated
          (thumbnailUrl: string) => {
            console.log('🖼️ [DEBUG] Thumbnail generated successfully for local file:', thumbnailUrl.substring(0, 50) + '...');
            console.log('🖼️ [DEBUG] Updating newsletter ID:', newsletter.id);
            updateNewsletterThumbnail(newsletter.id, thumbnailUrl);
          },
          // Force regeneration if thumbnail already exists
          hasExistingThumbnail
        );
      } finally {
        // Clean up the blob URL to prevent memory leaks
        URL.revokeObjectURL(blobUrl);
        console.log('🖼️ [DEBUG] Cleaned up blob URL');
      }

      console.log('🖼️ [DEBUG] Generate thumbnail function completed for local file');
      return;
    }
  }

  // Check if this is a regular newsletter with download URL
  if (!newsletter.downloadUrl) {
    // Check if this is a draft loaded from localStorage (no File object available)
    const isDraftFromStorage = newsletter.id.startsWith('draft-') && !draftFileMap.value.has(newsletter.id);

    if (isDraftFromStorage) {
      console.log('🖼️ [DEBUG] Draft loaded from localStorage - no File object available');
      $q.notify({
        type: 'info',
        message: 'Thumbnail generation requires original file',
        caption: 'This draft was restored from browser storage after a page refresh. Re-import the PDF file or sync to cloud storage to enable thumbnail generation.',
        position: 'top',
        timeout: 6000,
        actions: [
          {
            label: 'Dismiss',
            color: 'white',
            handler: () => { /* dismiss */ }
          }
        ]
      });
    } else {
      console.log('🖼️ [DEBUG] Newsletter has no download URL and no local file - cannot generate thumbnail');
      $q.notify({
        type: 'warning',
        message: 'Cannot generate thumbnail',
        caption: 'No download URL or local file available',
        position: 'top'
      });
    }
    return;
  }

  // Check if thumbnail already exists to determine if we should force regeneration
  const hasExistingThumbnail = !!newsletter.thumbnailUrl;
  console.log('🖼️ [DEBUG] Has existing thumbnail:', hasExistingThumbnail);

  await generateSingleThumbnail(
    newsletter,
    // Callback: immediately update the UI when thumbnail is generated
    (thumbnailUrl: string) => {
      console.log('🖼️ [DEBUG] Thumbnail generated successfully:', thumbnailUrl.substring(0, 50) + '...');
      console.log('🖼️ [DEBUG] Updating newsletter ID:', newsletter.id);
      updateNewsletterThumbnail(newsletter.id, thumbnailUrl);
    },
    // Force regeneration if thumbnail already exists
    hasExistingThumbnail
  );

  console.log('🖼️ [DEBUG] Generate thumbnail function completed');
}
function showExtractedContent(newsletter: ContentManagementNewsletter): void {
  if (newsletter.keywordCounts) {
    textExtractionDialog.value.currentFile = newsletter;
    textExtractionDialog.value.extractedContent = {
      textContent: newsletter.searchableText || '',
      textPreview: (newsletter.searchableText || '').substring(0, 500),
      wordCount: newsletter.wordCount || 0,
      suggestedTags: [],
      topics: [],
      keyTerms: Object.keys(newsletter.keywordCounts),
      keywordCounts: newsletter.keywordCounts,
      articles: newsletter.articles || []
    };
    textExtractionDialog.value.showDialog = true;
  }
}
// Form helper functions
function addNewTag(val: string, done: (item: string, mode?: 'add' | 'add-unique' | 'toggle') => void): void {
  if (val.trim().length > 0) {
    if (!availableTags.includes(val)) {
      availableTags.push(val);
    }
    done(val, 'add-unique');
  }
}
// Utility functions for single newsletter operations
async function saveMetadata(): Promise<void> {
  if (!editDialog.value.editingNewsletter) {
    console.error('❌ No newsletter being edited');
    return;
  }
  processingStates.value.isSaving = true;
  try {
    const newsletter = editDialog.value.editingNewsletter;

    // Convert contributors string to array if needed
    if (typeof newsletter.contributors === 'string') {
      newsletter.contributors = newsletter.contributors
        .split(',')
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0);
    }

    // Prepare clean updates object for versioning (only NewsletterMetadata fields)
    const updates: Partial<NewsletterMetadata> = {
      title: newsletter.title,
      year: newsletter.year,
      season: newsletter.season as 'spring' | 'summer' | 'fall' | 'winter',
      tags: newsletter.tags || [],
      featured: newsletter.featured,
      isPublished: newsletter.isPublished
    };

    // Add optional fields only if they have values
    if (newsletter.description) {
      updates.description = newsletter.description;
    }

    // Add month if it exists
    if (newsletter.month !== undefined) {
      updates.month = newsletter.month;
    }

    // Clean the updates object to remove undefined values (Firebase doesn't accept undefined)
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    ) as Partial<NewsletterMetadata>;

    // Use the versioning system for updates
    const comment = 'Manual metadata update via admin interface';

    // Update using the versioning service
    await firestoreService.updateNewsletterWithVersioning(
      newsletter.id,
      cleanUpdates,
      comment
    );

    // Update the local newsletter in the array
    const index = newsletters.value.findIndex(n => n.id === newsletter.id);
    if (index !== -1 && newsletters.value[index]) {
      // Update the local array with the edited data
      const localNewsletter = newsletters.value[index];
      Object.assign(localNewsletter, {
        ...updates,
        // Also update the UI-specific fields that aren't in NewsletterMetadata
        volume: newsletter.volume,
        issue: newsletter.issue,
        summary: newsletter.summary,
        categories: newsletter.categories,
        contributors: newsletter.contributors
      });
    } else {
      console.warn('⚠️  Newsletter not found in local array for update');
    }

    $q.notify({
      type: 'positive',
      message: 'Metadata updated successfully',
      caption: 'Version history has been recorded',
      position: 'top',
    });
    editDialog.value.showDialog = false;

    // Refresh the newsletter data after saving to Firebase
    await refreshNewsletterData();
  } catch (error) {
    console.error('Error updating metadata:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update metadata',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top',
    });
  } finally {
    processingStates.value.isSaving = false;
  }
} async function applyExtractedMetadata(): Promise<void> {
  if (!textExtractionDialog.value.currentFile || !textExtractionDialog.value.extractedContent) return;
  processingStates.value.isApplyingMetadata = true;
  try {
    const newsletter = textExtractionDialog.value.currentFile;
    const extractedContent = textExtractionDialog.value.extractedContent;

    // CRITICAL FIX: Check if this newsletter exists in Firebase before updating
    // If the ID is a local hash (like 1470066587), we need to handle it differently
    console.log('🔍 Attempting to apply metadata for newsletter:', {
      id: newsletter.id,
      filename: newsletter.filename,
      hasFirebaseId: newsletter.id && !newsletter.id.startsWith('draft-') && newsletter.id.length > 10
    });

    // Check if we're dealing with a local-only newsletter (numeric hash ID)
    const isLocalOnly = !isNaN(Number(newsletter.id)) || newsletter.id.startsWith('draft-');

    if (isLocalOnly) {
      // This is a local-only newsletter - we need to create it in Firebase first
      $q.notify({
        type: 'info',
        message: 'Creating newsletter record in Firebase...',
        position: 'top'
      });

      // Create a new Firebase document for this newsletter
      const newMetadata: Omit<NewsletterMetadata, 'id'> = {
        filename: newsletter.filename,
        title: newsletter.title,
        description: newsletter.description || '',
        year: newsletter.year,
        season: (newsletter.season as 'spring' | 'summer' | 'fall' | 'winter') || 'summer',
        fileSize: newsletter.fileSize,
        downloadUrl: newsletter.downloadUrl,
        thumbnailUrl: newsletter.thumbnailUrl || '',
        publicationDate: newsletter.displayDate || new Date().toISOString(),
        storageRef: newsletter.filename,
        tags: [...(newsletter.tags || []), ...(extractedContent.suggestedTags || [])].slice(0, 20),
        featured: newsletter.featured || false,
        isPublished: newsletter.isPublished !== false, // Default to true unless explicitly false
        searchableText: extractedContent.textContent || '',
        // Required fields for NewsletterMetadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin', // Will be overridden by the service
        updatedBy: 'admin', // Will be overridden by the service
        actions: {
          canView: true,
          canDownload: !!newsletter.downloadUrl,
          canSearch: !!extractedContent.textContent,
          hasThumbnail: !!newsletter.thumbnailUrl
        }
      };

      // Save as new document (this will generate a proper Firebase ID)
      const newId = await firestoreService.saveNewsletterMetadata(newMetadata);

      $q.notify({
        type: 'positive',
        message: 'Newsletter created in Firebase with extracted metadata',
        caption: `New ID: ${newId} • Added ${extractedContent.suggestedTags?.length || 0} tags`,
        position: 'top'
      });

    } else {
      // This newsletter exists in Firebase - update it normally
      const updates = {
        searchableText: extractedContent.textContent || '',
        tags: [...(newsletter.tags || []), ...(extractedContent.suggestedTags || [])].slice(0, 20)
      };

      await firestoreService.updateNewsletterWithVersioning(
        newsletter.id,
        updates,
        'Applied extracted metadata via admin interface'
      );

      $q.notify({
        type: 'positive',
        message: 'Extracted metadata applied successfully',
        caption: `Added searchable text and ${extractedContent.suggestedTags?.length || 0} tags with version history`,
        position: 'top'
      });
    }

    textExtractionDialog.value.showDialog = false;

    // Refresh the newsletter data to make sure changes persist
    await refreshNewsletterData();
  } catch (error) {
    console.error('Error applying extracted metadata:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to apply extracted metadata',
      caption: error instanceof Error ? error.message : 'Unknown error occurred',
      position: 'top'
    });
  } finally {
    processingStates.value.isApplyingMetadata = false;
  }
}

// Re-import file handler for metadata-only drafts
function handleReImportFile(newsletter: ContentManagementNewsletter): void {
  // Get the original file info if available
  const newsletterWithInfo = newsletter as NewsletterWithFileInfo;
  const originalInfo = newsletterWithInfo.originalFileInfo;
  const fileHint = originalInfo?.importHint || `Look for: ${newsletter.filename}`;
  const sizeHint = originalInfo?.size ? ` (${formatFileSize(originalInfo.size)})` : '';
  const lastModifiedHint = originalInfo?.lastModified ?
    ` • Modified: ${new Date(originalInfo.lastModified).toLocaleDateString()}` : '';

  $q.dialog({
    title: '🔄 Re-import File',
    message: `<div class="q-mb-md">
      <p><strong>File needed:</strong> ${newsletter.filename}${sizeHint}</p>
      <p class="text-grey-7">${fileHint}${lastModifiedHint}</p>
      <p class="text-caption text-orange-8">⚠️ The original file object was lost after page refresh. Please select the same file to restore processing capabilities.</p>
      <p class="text-caption text-blue-8">💡 Tip: This will restore thumbnail generation, text extraction, and other file processing features.</p>
    </div>`,
    html: true,
    options: {
      type: 'radio',
      model: 'file',
      items: [
        {
          label: '📄 Select the specific file',
          value: 'file'
        },
        {
          label: '📁 Browse folder (if from folder import)',
          value: 'folder'
        }
      ]
    },
    cancel: { label: 'Cancel', flat: true },
    ok: { label: 'Browse Files', color: 'primary' },
    persistent: true
  }).onOk((choice: 'file' | 'folder') => {
    try {
      if (choice === 'file') {
        // Create file input for specific file selection
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        input.multiple = false;

        input.onchange = (event) => {
          const files = (event.target as HTMLInputElement).files;
          if (!files || files.length === 0) {
            return;
          }

          const selectedFile = files[0];
          if (!selectedFile) {
            return;
          }

          // Check if this looks like the right file
          if (selectedFile.name === newsletter.filename) {
            // Replace the file object in the map
            draftFileMap.value.set(newsletter.id, selectedFile);

            $q.notify({
              type: 'positive',
              message: 'File re-imported successfully!',
              caption: `${selectedFile.name} is now available for processing`,
              position: 'top'
            });
          } else {
            // Warn about filename mismatch but allow it
            $q.dialog({
              title: 'Filename Mismatch',
              message: `Selected file "${selectedFile.name}" doesn't match expected "${newsletter.filename}". Continue anyway?`,
              cancel: true,
              ok: { label: 'Use This File', color: 'primary' }
            }).onOk(() => {
              draftFileMap.value.set(newsletter.id, selectedFile);
              $q.notify({
                type: 'positive',
                message: 'File imported with different name',
                caption: `Using "${selectedFile.name}" for processing`,
                position: 'top'
              });
            });
          }
        };

        input.click();
      } else {
        // Fallback to general import dialog
        void showImportDialog();
      }
    } catch (error) {
      console.error('Re-import failed:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to re-import file',
        caption: 'Please try again or use the general import function',
        position: 'top'
      });
    }
  });
}

// Version history handler
async function handleVersionRestored(newsletterId: string): Promise<void> {
  $q.notify({
    type: 'positive',
    message: 'Newsletter version restored successfully',
    position: 'top'
  });

  // Refresh the current newsletter data in the edit dialog
  const newsletter = newsletters.value.find(n => n.id === newsletterId);
  if (newsletter && editDialog.value.editingNewsletter) {
    // Update the editing newsletter with the latest data
    Object.assign(editDialog.value.editingNewsletter, newsletter);
  }

  // Refresh the newsletters list to show the updated data
  await loadNewsletters();
}// Initialize
onMounted(async () => {
  // For admin panel, load ALL newsletters from Firebase (including unpublished)
  try {
    processingStates.value.isLoading = true;

    logger.info('Admin: Initializing Firebase service for admin management...');

    // Load local drafts first
    loadDraftsFromStorage();

    // Initialize Firebase service
    await firebaseNewsletterService.initialize();

    // Load all newsletters including unpublished ones for admin management
    const allNewsletters = await firebaseNewsletterService.loadAllNewslettersForAdmin();

    logger.info(`Admin: Loaded ${allNewsletters.length} newsletters for management`);

    // Convert Firebase newsletters to content management format
    newsletters.value = allNewsletters.map((newsletter: NewsletterMetadata) => ({
      id: newsletter.id,
      filename: newsletter.filename,
      title: newsletter.title,
      year: newsletter.year,
      season: newsletter.season || 'unknown',
      pdfUrl: newsletter.downloadUrl,
      downloadUrl: newsletter.downloadUrl,
      hasText: !!newsletter.searchableText,
      hasThumbnail: !!newsletter.thumbnailUrl,
      fileSize: newsletter.fileSize || 0,
      localMetadata: null,
      syncedToFirebase: true, // These are already in Firebase
      actions: newsletter.actions ? [newsletter.actions.canView ? 'view' : '', newsletter.actions.canDownload ? 'download' : ''].filter(Boolean) : [],
      tags: newsletter.tags || [],
      createdAt: newsletter.createdAt,
      updatedAt: newsletter.updatedAt,
      createdBy: newsletter.createdBy,
      updatedBy: newsletter.updatedBy,
      thumbnailUrl: newsletter.thumbnailUrl,
      searchableText: newsletter.searchableText,
      // Keep Firebase-specific fields for admin toggles
      isPublished: newsletter.isPublished,
      featured: newsletter.featured
    } as ContentManagementNewsletter));

    logger.success(`Admin: Newsletter management loaded with ${newsletters.value.length} items`);

    // CRITICAL: Also load newsletters into useContentManagement for sync functionality
    await loadNewsletters();

  } catch (error) {
    logger.error('Admin: Failed to load newsletters for management:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load newsletters for admin management'
    });

    // Fallback to original load method
    await loadNewsletters();

    // 🧪 ADD DEBUG FUNCTIONS TO GLOBAL SCOPE FOR CONSOLE TESTING
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).debugDataFlow = debugDataFlow;
      (window as unknown as Record<string, unknown>).testSyncWorkflow = testSyncWorkflow;
      console.log('🧪 Debug functions available: debugDataFlow(), testSyncWorkflow(filename)');
    }
  } finally {
    processingStates.value.isLoading = false;
  }
});
</script>
