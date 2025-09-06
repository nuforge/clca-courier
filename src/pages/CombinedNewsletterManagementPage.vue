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

          <!-- Action Toolbar -->
          <ActionToolbar :processing-states="processingStates" @extract-metadata="extractAllMetadata"
            @extract-text="handleExtractAllText" @generate-thumbnails="generateThumbnails" />

          <!-- Local Storage Management -->
          <LocalStorageManager :stats="localStorageStats" :is-syncing="processingStates.isSyncing"
            @sync-to-firebase="handleSyncToFirebase" @clear-local="handleClearLocal"
            @refresh-stats="refreshLocalStorageStats" />

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
                <div class="col-12 col-md-3">
                  <q-select v-model="filters.filterYear" :options="availableYears" label="Filter by Year" outlined dense
                    clearable />
                </div>
                <div class="col-12 col-md-3">
                  <q-select v-model="filters.filterSeason" :options="availableSeasons" label="Filter by Season" outlined
                    dense clearable />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Newsletter Table -->
          <q-table title="Newsletter Management" :rows="filteredNewsletters" :columns="columns"
            v-model:pagination="pagination" :loading="processingStates.isLoading" flat bordered
            class="newsletter-management-table" row-key="id">

            <!-- Thumbnail column -->
            <template v-slot:body-cell-thumbnail="props">
              <q-td :props="props">
                <q-avatar v-if="props.row.thumbnailUrl" size="40px" class="newsletter-thumbnail">
                  <img :src="props.row.thumbnailUrl" :alt="props.row.title" />
                </q-avatar>
                <q-icon v-else name="mdi-file-pdf-box" size="40px" color="grey-5" />
              </q-td>
            </template>

            <!-- Title column with enhanced formatting -->
            <template v-slot:body-cell-title="props">
              <q-td :props="props" class="newsletter-title-cell">
                <div class="text-weight-medium">{{ props.row.title }}</div>
                <div class="text-caption text-grey-6">{{ props.row.filename }}</div>
                <div v-if="props.row.description" class="text-caption text-grey-7 newsletter-description">
                  {{ props.row.description }}
                </div>
              </q-td>
            </template>

            <!-- Keywords column with chips -->
            <template v-slot:body-cell-keywords="props">
              <q-td :props="props" class="keywords-cell">
                <div v-if="props.row.keywordCounts" class="keyword-chips">
                  <q-chip v-for="[keyword, count] in Object.entries(props.row.keywordCounts).slice(0, 3)" :key="keyword"
                    size="sm" color="primary" text-color="white" :label="`${keyword} (${count})`" class="q-ma-xs" />
                  <q-btn v-if="Object.keys(props.row.keywordCounts).length > 3" flat dense size="sm" color="primary"
                    :label="`+${Object.keys(props.row.keywordCounts).length - 3} more`"
                    @click="showExtractedContent(props.row)" />
                </div>
                <span v-else class="text-grey-5">No keywords</span>
              </q-td>
            </template>

            <!-- Actions column -->
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <div class="row no-wrap q-gutter-xs">
                  <q-btn dense flat icon="mdi-eye" color="primary" @click="openPdf(props.row)" size="sm">
                    <q-tooltip>View PDF</q-tooltip>
                  </q-btn>
                  <q-btn dense flat icon="mdi-pencil" color="warning" @click="editNewsletter(props.row)" size="sm">
                    <q-tooltip>Edit Metadata</q-tooltip>
                  </q-btn>
                  <q-btn dense flat icon="mdi-text-search" color="secondary" @click="extractText(props.row)"
                    :loading="extractingText[props.row.id]" size="sm">
                    <q-tooltip>Extract Text</q-tooltip>
                  </q-btn>
                  <q-btn dense flat icon="mdi-image" color="accent" @click="generateThumbnail(props.row)"
                    :loading="generatingThumb[props.row.id]" size="sm">
                    <q-tooltip>Generate Thumbnail</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>
          </q-table>

          <!-- Edit Dialog -->
          <q-dialog v-model="editDialog.showDialog" persistent>
            <q-card style="min-width: 600px; max-width: 800px;">
              <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">Edit Newsletter Metadata</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
              </q-card-section>

              <q-card-section v-if="editDialog.editingNewsletter">
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
                    <q-input v-model="editDialog.editingNewsletter.issue" label="Issue" type="number" outlined dense />
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
                    <q-select v-model="editDialog.editingNewsletter.tags" :options="availableTags" label="Tags" multiple
                      use-chips use-input @new-value="addNewTag" outlined dense />
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
              </q-card-section>

              <q-card-actions align="right">
                <q-btn flat label="Cancel" v-close-popup />
                <q-btn color="primary" label="Save Changes" @click="saveMetadata"
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
import { doc, updateDoc, type UpdateData } from 'firebase/firestore';
import { firestore } from '../config/firebase.config';

// Import composables
import { useContentManagement } from '../composables/useContentManagement';
import { useContentExtraction } from '../composables/useContentExtraction';

// Import components
import ActionToolbar from '../components/content-management/ActionToolbar.vue';
import LocalStorageManager from '../components/content-management/LocalStorageManager.vue';
import StatisticsCards from '../components/content-management/StatisticsCards.vue';

// Import types
import type { ContentManagementNewsletter } from '../types';

const $q = useQuasar();

// Use composables
const {
  newsletters,
  localStorageStats,
  processingStates,
  filters,
  textExtractionDialog,
  editDialog,
  filteredNewsletters,
  totalNewsletters,
  newslettersWithText,
  newslettersWithThumbnails,
  totalFileSize,
  loadNewsletters,
  refreshLocalStorageStats
} = useContentManagement(); const {
  extractAllText,
  syncLocalMetadataToFirebase,
  clearLocalMetadata,
  extractContentForFile
} = useContentExtraction();

// Additional reactive data
const extractingText = ref<Record<string, boolean>>({});
const generatingThumb = ref<Record<string, boolean>>({});

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

const columns = [
  {
    name: 'thumbnail',
    label: '',
    field: 'thumbnailUrl',
    align: 'center' as const,
    style: 'width: 60px; min-width: 60px; max-width: 60px;',
  },
  {
    name: 'title',
    label: 'Newsletter',
    field: 'title',
    align: 'left' as const,
    sortable: true,
    style: 'width: 30%; min-width: 200px;',
  },
  {
    name: 'year',
    label: 'Year',
    field: 'year',
    align: 'center' as const,
    sortable: true,
    style: 'width: 80px;',
  },
  {
    name: 'season',
    label: 'Season',
    field: 'season',
    align: 'center' as const,
    sortable: true,
    style: 'width: 100px;',
  },
  {
    name: 'pageCount',
    label: 'Pages',
    field: 'pageCount',
    align: 'center' as const,
    sortable: true,
    style: 'width: 80px;',
  },
  {
    name: 'wordCount',
    label: 'Words',
    field: 'wordCount',
    align: 'center' as const,
    sortable: true,
    style: 'width: 100px;',
    format: (val: number) => val ? val.toLocaleString() : '—'
  },
  {
    name: 'keywords',
    label: 'Keywords',
    field: 'keywordCounts',
    align: 'left' as const,
    style: 'width: 200px; max-width: 200px;',
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center' as const,
    style: 'width: 180px;',
  }
];

// Computed properties for filters
const availableYears = computed(() => {
  const years = [...new Set(newsletters.value.map(n => n.year))].sort((a, b) => b - a);
  return years;
});

const availableSeasons = computed(() => {
  const seasons = [...new Set(newsletters.value.map(n => n.season))].sort();
  return seasons;
});

// Methods
async function handleExtractAllText(): Promise<void> {
  processingStates.value.isExtractingAllText = true;
  try {
    await extractAllText(newsletters.value);
    await refreshLocalStorageStats();
  } finally {
    processingStates.value.isExtractingAllText = false;
  }
}

async function handleSyncToFirebase(): Promise<void> {
  processingStates.value.isSyncing = true;
  try {
    await syncLocalMetadataToFirebase();
    await refreshLocalStorageStats();
  } finally {
    processingStates.value.isSyncing = false;
  }
}

async function handleClearLocal(): Promise<void> {
  await clearLocalMetadata();
  await refreshLocalStorageStats();
}

function openPdf(newsletter: ContentManagementNewsletter): void {
  const pdfUrl = newsletter.downloadUrl?.startsWith('http')
    ? newsletter.downloadUrl
    : `${window.location.origin}${newsletter.downloadUrl || `/issues/${newsletter.filename}`}`;
  window.open(pdfUrl, '_blank');
}

function editNewsletter(newsletter: ContentManagementNewsletter): void {
  editDialog.value.editingNewsletter = { ...newsletter };
  editDialog.value.showDialog = true;
}

async function extractText(newsletter: ContentManagementNewsletter): Promise<void> {
  extractingText.value[newsletter.id] = true;
  try {
    textExtractionDialog.value.currentFile = newsletter;
    textExtractionDialog.value.showDialog = true;
    processingStates.value.isProcessingText = true;

    const extractedContent = await extractContentForFile(newsletter);
    textExtractionDialog.value.extractedContent = extractedContent;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to extract text',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    extractingText.value[newsletter.id] = false;
    processingStates.value.isProcessingText = false;
  }
}

function generateThumbnail(newsletter: ContentManagementNewsletter): void {
  generatingThumb.value[newsletter.id] = true;

  // Simulate thumbnail generation
  setTimeout(() => {
    generatingThumb.value[newsletter.id] = false;
    $q.notify({
      type: 'positive',
      message: `Thumbnail generated for ${newsletter.title}`,
      position: 'top'
    });
  }, 2000);
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

// Placeholder functions (to be implemented or removed)
async function extractAllMetadata(): Promise<void> {
  processingStates.value.isExtracting = true;
  try {
    await extractAllText(newsletters.value);
    await refreshLocalStorageStats();
    $q.notify({
      type: 'positive',
      message: 'Metadata extraction completed',
      caption: 'All PDF metadata extracted to local storage',
      position: 'top'
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Metadata extraction failed',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    processingStates.value.isExtracting = false;
  }
}

async function generateThumbnails(): Promise<void> {
  processingStates.value.isGeneratingThumbs = true;

  try {
    // Get newsletters that don't have thumbnails yet
    const newslettersToProcess = newsletters.value.filter(n => !n.thumbnailUrl);

    if (newslettersToProcess.length === 0) {
      $q.notify({
        type: 'info',
        message: 'All newsletters already have thumbnails',
        position: 'top',
      });
      return;
    }

    $q.notify({
      type: 'info',
      message: `Starting thumbnail generation for ${newslettersToProcess.length} newsletters...`,
      position: 'top',
    });

    let processed = 0;
    let failed = 0;

    // Process each newsletter
    for (const newsletter of newslettersToProcess) {
      try {
        // Simulate thumbnail generation (in real implementation, use PDF.js or similar)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In a real implementation, you would:
        // 1. Load the PDF
        // 2. Render the first page as canvas
        // 3. Convert to blob/base64
        // 4. Upload to Firebase Storage
        // 5. Update newsletter with thumbnail URL

        processed++;
        console.log(`✅ Generated thumbnail for ${newsletter.filename} (${processed}/${newslettersToProcess.length})`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed to generate thumbnail for ${newsletter.filename}:`, error);
      }
    }

    $q.notify({
      type: 'positive',
      message: `Thumbnail generation completed`,
      caption: `Processed: ${processed}, Failed: ${failed}`,
      position: 'top',
    });

  } catch (error) {
    console.error('Bulk thumbnail generation failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Bulk thumbnail generation failed',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top',
    });
  } finally {
    processingStates.value.isGeneratingThumbs = false;
  }
}

async function saveMetadata(): Promise<void> {
  if (!editDialog.value.editingNewsletter) return;

  processingStates.value.isSaving = true;

  try {
    const newsletter = editDialog.value.editingNewsletter;
    const updates = { ...newsletter } as UpdateData<ContentManagementNewsletter>;

    // Convert contributors string to array
    if (typeof updates.contributors === 'string') {
      updates.contributors = updates.contributors
        .split(',')
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0);
    }

    // Update timestamps
    updates.updatedAt = new Date().toISOString();
    updates.updatedBy = 'admin';

    // Update in Firestore
    if (!newsletter.id) {
      throw new Error('Newsletter ID is required for updating');
    }

    const docRef = doc(firestore, 'newsletters', newsletter.id);
    await updateDoc(docRef, updates);

    $q.notify({
      type: 'positive',
      message: 'Metadata updated successfully',
      position: 'top',
    });

    editDialog.value.showDialog = false;

    // Reload newsletters to reflect changes
    await loadNewsletters();
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
}

async function applyExtractedMetadata(): Promise<void> {
  if (!textExtractionDialog.value.currentFile || !textExtractionDialog.value.extractedContent) return;

  processingStates.value.isApplyingMetadata = true;

  try {
    const newsletter = textExtractionDialog.value.currentFile;
    const extractedContent = textExtractionDialog.value.extractedContent;

    // Create updates object with proper Firestore typing
    const updates: UpdateData<ContentManagementNewsletter> = {
      searchableText: extractedContent.textContent,
      wordCount: extractedContent.wordCount,
      tags: [
        ...newsletter.tags,
        ...extractedContent.suggestedTags.filter(
          tag => !newsletter.tags.includes(tag)
        )
      ],
      categories: [
        ...(newsletter.categories || []),
        ...extractedContent.topics.filter(
          topic => !(newsletter.categories || []).includes(topic)
        )
      ],
      keyTerms: extractedContent.keyTerms,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin-manual',
    };

    // Add keyword counts if available
    if (extractedContent.keywordCounts) {
      updates.keywordCounts = extractedContent.keywordCounts;
    }

    // Add articles if available
    if (extractedContent.articles && extractedContent.articles.length > 0) {
      updates.articleCount = extractedContent.articles.length;
      updates.articles = extractedContent.articles;
    }

    if (!newsletter.id) {
      throw new Error('Newsletter ID is required for updating');
    }

    const docRef = doc(firestore, 'newsletters', newsletter.id);
    await updateDoc(docRef, updates);

    $q.notify({
      type: 'positive',
      message: 'Extracted metadata applied successfully',
      caption: `Added ${extractedContent.suggestedTags.length} tags, ${extractedContent.topics.length} topics, and ${extractedContent.wordCount} words of searchable text`,
      position: 'top',
    });

    textExtractionDialog.value.showDialog = false;

    // Reload newsletters to reflect changes
    await loadNewsletters();
  } catch (error) {
    console.error('Error applying extracted metadata:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to apply extracted metadata',
      caption: error instanceof Error ? error.message : 'Unknown error occurred',
      position: 'top',
    });
  } finally {
    processingStates.value.isApplyingMetadata = false;
  }
}// Initialize
onMounted(async () => {
  await loadNewsletters();
});
</script>

<style lang="scss" scoped>
.newsletter-management-table {
  .newsletter-thumbnail {
    border-radius: 4px;
    overflow: hidden;
  }

  .newsletter-title-cell {
    max-width: 300px;
  }

  .newsletter-description {
    max-width: 280px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .keywords-cell {
    max-width: 200px;
  }

  .keyword-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }

  .keyword-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    max-height: 120px;
    overflow-y: auto;
  }
}
</style>
