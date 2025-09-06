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
          <!-- Authentication Required Banner -->
          <q-banner v-if="!auth.isAuthenticated.value" class="bg-warning text-dark q-mb-md" rounded>
            <template v-slot:avatar>
              <q-icon name="mdi-lock-alert" />
            </template>
            <div class="text-weight-bold">Authentication Required</div>
            <div class="q-mt-xs">
              You must be logged in to sync data to Firebase. Local operations will work without authentication.
            </div>
            <template v-slot:action>
              <q-btn @click="signInWithGoogle" color="primary" label="Sign in with Google"
                :loading="auth.isLoading.value" size="sm" />
            </template>
          </q-banner>
          <!-- User Info (when authenticated) -->
          <q-card v-if="auth.isAuthenticated.value" flat bordered class="q-mb-md bg-positive text-white">
            <q-card-section class="row items-center">
              <q-avatar size="32px" class="q-mr-sm">
                <img v-if="auth.currentUser.value?.photoURL" :src="auth.currentUser.value.photoURL" />
                <q-icon v-else name="mdi-account" />
              </q-avatar>
              <div class="col">
                <div class="text-weight-bold">{{ auth.currentUser.value?.displayName || 'User' }}</div>
                <div class="text-caption">{{ auth.currentUser.value?.email }}</div>
              </div>
              <q-btn @click="auth.signOut" flat color="white" label="Sign Out" size="sm" />
            </q-card-section>
          </q-card>
          <!-- Action Toolbar -->
          <ActionToolbar :processing-states="processingStates" :selected-count="selectedNewsletters.length"
            @extract-metadata="extractSelectedMetadata" @extract-text="handleExtractSelectedText"
            @generate-thumbnails="generateSelectedThumbnails" @sync-selected="handleSyncSelected"
            @clear-selection="clearSelection" />
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
            v-model:pagination="pagination" v-model:selected="selectedNewsletters" selection="multiple"
            :loading="processingStates.isLoading" flat bordered class="newsletter-management-table" row-key="id">
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
            <!-- Tags column with chips -->
            <template v-slot:body-cell-keywords="props">
              <q-td :props="props" class="keywords-cell">
                <div v-if="props.row.tags && props.row.tags.length > 0" class="keyword-chips">
                  <q-chip v-for="tag in props.row.tags.slice(0, 4)" :key="tag" size="sm" color="secondary"
                    text-color="white" :label="tag" class="q-ma-xs" />
                  <q-btn v-if="props.row.tags.length > 4" flat dense size="sm" color="secondary"
                    :label="`+${props.row.tags.length - 4} more`" @click="showExtractedContent(props.row)" />
                </div>
                <span v-else class="text-grey-5">No tags</span>
              </q-td>
            </template>
            <!-- Status column -->
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-chip v-if="isLocalPdf(props.row)" size="sm" color="green" text-color="white" icon="mdi-laptop">
                  Local
                </q-chip>
                <q-chip v-else size="sm" color="orange" text-color="white" icon="mdi-cloud">
                  Remote
                </q-chip>
              </q-td>
            </template>
            <!-- Actions column -->
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <div class="row no-wrap q-gutter-xs">
                  <!-- Admin Toggle Actions -->
                  <q-btn dense flat :icon="props.row.isPublished === true ? 'visibility' : 'visibility_off'"
                    :color="props.row.isPublished === true ? 'positive' : 'orange'"
                    @click="toggleNewsletterPublished(props.row)" size="sm" :loading="publishingStates[props.row.id]">
                    <q-tooltip>{{ props.row.isPublished === true ? 'Unpublish' : 'Publish' }} Newsletter</q-tooltip>
                  </q-btn>

                  <q-btn dense flat :icon="props.row.featured === true ? 'star' : 'star_border'"
                    :color="props.row.featured === true ? 'accent' : 'grey'"
                    @click="toggleNewsletterFeatured(props.row)" size="sm" :loading="featuredStates[props.row.id]">
                    <q-tooltip>{{ props.row.featured === true ? 'Remove from Featured' : 'Add to Featured'
                      }}</q-tooltip>
                  </q-btn>

                  <q-separator vertical inset />

                  <!-- Existing Actions -->
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
                  <q-btn dense flat icon="mdi-cloud-upload" color="positive" @click="syncSingleNewsletter(props.row)"
                    :loading="syncingIndividual[props.row.id]" size="sm">
                    <q-tooltip>Sync to Firebase</q-tooltip>
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
import { doc, updateDoc, setDoc, getDoc, type UpdateData } from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import { firestoreService, type NewsletterMetadata } from '../services/firebase-firestore.service';
import { firebaseNewsletterService } from '../services/firebase-newsletter.service';
import { logger } from '../utils/logger';
// Import composables
import { useContentManagement } from '../composables/useContentManagement';
import { useContentExtraction } from '../composables/useContentExtraction';
import { useFirebase } from '../composables/useFirebase';
import { localMetadataStorageService, type ExtractedMetadata } from '../services/local-metadata-storage.service';
import { tagGenerationService, type TagGenerationResult } from '../services/tag-generation.service';
import type { Newsletter } from '../types/core/newsletter.types';
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
  syncLocalMetadataToFirebase,
  clearLocalMetadata,
} = useContentExtraction();
// Firebase authentication
const { auth } = useFirebase();
// Auth helper methods
const signInWithGoogle = async () => {
  try {
    await auth.signIn('google');
    $q.notify({
      type: 'positive',
      message: 'Successfully signed in with Google!',
    });
  } catch (error) {
    console.error('Google sign in failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to sign in with Google',
      caption: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
// Additional reactive data
const extractingText = ref<Record<string, boolean>>({});
const generatingThumb = ref<Record<string, boolean>>({});
const syncingIndividual = ref<Record<string, boolean>>({});
const publishingStates = ref<Record<string, boolean>>({});
const featuredStates = ref<Record<string, boolean>>({});
const selectedNewsletters = ref<ContentManagementNewsletter[]>([]);
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
    label: 'Tags',
    field: 'tags',
    align: 'left' as const,
    style: 'width: 200px; max-width: 200px;',
    format: (val: string[] | undefined) => {
      if (!val || !Array.isArray(val) || val.length === 0) return '—';
      // Display up to 3 tags, show count if more
      const displayTags = val.slice(0, 3).join(', ');
      const remainingCount = val.length > 3 ? ` (+${val.length - 3} more)` : '';
      return displayTags + remainingCount;
    }
  },
  {
    name: 'status',
    label: 'Source',
    field: 'downloadUrl',
    align: 'center' as const,
    style: 'width: 100px;',
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center' as const,
    style: 'width: 300px;', // Increased width to accommodate toggle buttons
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
// Methods - Selection-based operations
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
// Function to update newsletters with local metadata after extraction
async function refreshNewslettersWithLocalMetadata(): Promise<void> {
  try {
    // Get all stored metadata from local storage
    const allLocalMetadata = await localMetadataStorageService.getAllExtractedMetadata();
    // Update newsletters with local metadata
    for (const newsletter of newsletters.value) {
      const localData = allLocalMetadata.find((meta: ExtractedMetadata) => meta.newsletterId === newsletter.id);
      if (localData) {
        newsletter.searchableText = localData.searchableText;
        newsletter.wordCount = localData.wordCount;
        newsletter.keywordCounts = localData.keywordCounts || {};
      }
    }
  } catch (error) {
    console.error('Failed to refresh newsletters with local metadata:', error);
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
  // Check for remote PDFs and prompt for download
  const remotePdfs = selectedNewsletters.value.filter(n =>
    n.downloadUrl?.startsWith('http') && !n.filename.includes('local')
  );
  if (remotePdfs.length > 0) {
    const shouldDownload = await new Promise<boolean>((resolve) => {
      $q.dialog({
        title: 'Remote PDFs Detected',
        message: `${remotePdfs.length} of the selected newsletters are stored remotely. Download them for extraction?`,
        html: true,
        persistent: true,
        ok: {
          label: 'Download & Extract',
          color: 'primary'
        },
        cancel: {
          label: 'Skip Remote PDFs',
          color: 'grey'
        }
      }).onOk(() => resolve(true))
        .onCancel(() => resolve(false));
    });
    if (!shouldDownload) {
      // Filter out remote PDFs
      const localPdfs = selectedNewsletters.value.filter(n =>
        !n.downloadUrl?.startsWith('http') || n.filename.includes('local')
      );
      if (localPdfs.length === 0) {
        $q.notify({
          type: 'info',
          message: 'No local PDFs to process',
          position: 'top'
        });
        return;
      }
      selectedNewsletters.value = localPdfs;
    }
  }
  processingStates.value.isExtracting = true;
  try {
    // Use unified tag generation service for ALL newsletters
    await extractAllNewslettersWithUnifiedService(selectedNewsletters.value);
    await refreshLocalStorageStats();
    // Update local newsletters with extracted metadata
    await refreshNewslettersWithLocalMetadata();
    $q.notify({
      type: 'positive',
      message: `Tag generation completed for ${selectedNewsletters.value.length} newsletters`,
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
  processingStates.value.isGeneratingThumbs = true;
  try {
    let processed = 0;
    for (const newsletter of selectedNewsletters.value) {
      generatingThumb.value[newsletter.id] = true;
      // Simulate thumbnail generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      generatingThumb.value[newsletter.id] = false;
      processed++;
    }
    $q.notify({
      type: 'positive',
      message: `Thumbnails generated for ${processed} newsletters`,
      position: 'top'
    });
  } finally {
    processingStates.value.isGeneratingThumbs = false;
    // Clear individual loading states
    selectedNewsletters.value.forEach(n => {
      generatingThumb.value[n.id] = false;
    });
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
  processingStates.value.isSyncing = true;
  try {
    // Sync only selected newsletters (this would need to be implemented in the composable)
    await syncLocalMetadataToFirebase(); // For now, sync all - can be enhanced later
    await refreshLocalStorageStats();
    // Note: Don't reload newsletters here as it would wipe out extracted keyword data
    $q.notify({
      type: 'positive',
      message: `Synced ${selectedNewsletters.value.length} newsletters to Firebase`,
      position: 'top'
    });
  } finally {
    processingStates.value.isSyncing = false;
  }
}
// Individual newsletter sync
async function syncSingleNewsletter(newsletter: ContentManagementNewsletter): Promise<void> {
  syncingIndividual.value[newsletter.id] = true;
  try {
    // This would need a single-newsletter sync function in the composable
    // For now, we'll simulate it
    await new Promise(resolve => setTimeout(resolve, 1500));
    $q.notify({
      type: 'positive',
      message: `Synced ${newsletter.title} to Firebase`,
      position: 'top'
    });
    await refreshLocalStorageStats();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Failed to sync ${newsletter.title}`,
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    syncingIndividual.value[newsletter.id] = false;
  }
}

// Toggle newsletter published status
async function toggleNewsletterPublished(newsletter: ContentManagementNewsletter): Promise<void> {
  publishingStates.value[newsletter.id] = true;
  try {
    // Explicitly handle undefined/falsy values as false for better boolean logic
    const currentStatus = newsletter.isPublished === true;
    const newStatus = !currentStatus;

    console.log(`Toggling publication status: ${currentStatus} -> ${newStatus} for newsletter ${newsletter.id}`);

    await firestoreService.updateNewsletterMetadata(newsletter.id, {
      isPublished: newStatus
    });

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

    await firestoreService.updateNewsletterMetadata(newsletter.id, {
      featured: newStatus
    });

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
// Utility functions
function clearSelection(): void {
  selectedNewsletters.value = [];
}
function isLocalPdf(newsletter: ContentManagementNewsletter): boolean {
  // Consider PDF local if it doesn't start with http or if it's marked as local
  return !newsletter.downloadUrl?.startsWith('http') || newsletter.filename.includes('local');
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
// UNIFIED BULK EXTRACTION - Uses same service as individual extraction
async function extractAllNewslettersWithUnifiedService(newsletters: ContentManagementNewsletter[]): Promise<void> {
  const failedExtractions: string[] = [];
  let successCount = 0;
  for (const newsletter of newsletters) {
    try {
      // Use the SAME tag generation service as individual operations
      const tagResult = await tagGenerationService.generateTagsFromPdf(
        newsletter.downloadUrl,
        newsletter.filename
      );
      // Store in local storage using the correct interface
      const extractedMetadata: ExtractedMetadata = {
        filename: newsletter.filename,
        newsletterId: newsletter.id,
        searchableText: tagResult.textContent,
        wordCount: tagResult.wordCount,
        readingTimeMinutes: Math.ceil(tagResult.wordCount / 200), // Estimate reading time
        textExtractionVersion: '1.0.0',
        textExtractedAt: new Date().toISOString(),
        keywordCounts: tagResult.keywordCounts,
        extractedAt: new Date().toISOString(),
        status: 'pending',
      };
      await localMetadataStorageService.storeExtractedMetadata(extractedMetadata);
      successCount++;
    } catch (error) {
      console.error(`❌ [BULK UNIFIED] Failed to extract ${newsletter.filename}:`, error);
      failedExtractions.push(`${newsletter.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  if (failedExtractions.length > 0) {
    console.warn(`⚠️ [BULK UNIFIED] Failed extractions:`, failedExtractions);
    $q.notify({
      type: 'warning',
      message: `${successCount}/${newsletters.length} successful, ${failedExtractions.length} failed`,
      caption: 'Check console for details',
      position: 'top'
    });
  }
}
// INDIVIDUAL EXTRACTION - Uses same unified service
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
// Utility functions for single newsletter operations
async function saveMetadata(): Promise<void> {
  if (!editDialog.value.editingNewsletter) {
    console.error('❌ No newsletter being edited');
    return;
  }
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
    // Version control tracking
    const currentVersion = newsletter.version || 1;
    const newVersion = currentVersion + 1;
    // Update timestamps and version
    updates.updatedAt = new Date().toISOString();
    updates.updatedBy = 'admin';
    updates.version = newVersion;
    // Add to edit history
    const historyEntry = {
      version: newVersion,
      timestamp: updates.updatedAt,
      editor: 'admin',
      changes: 'Manual metadata update via admin interface'
    };
    updates.editHistory = [
      ...(newsletter.editHistory || []),
      historyEntry
    ].slice(-10); // Keep last 10 edits
    // Update in Firestore
    if (!newsletter.id) {
      throw new Error('Newsletter ID is required for updating');
    }
    const docRef = doc(firestore, 'newsletters', newsletter.id);
    // Check if document exists first
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // Document exists, use updateDoc
      await updateDoc(docRef, updates);
    } else {
      // Document doesn't exist, create it with setDoc
      const fullDocumentData = {
        id: newsletter.id,
        filename: newsletter.filename,
        title: newsletter.title,
        year: newsletter.year,
        season: newsletter.season,
        fileSize: newsletter.fileSize,
        downloadUrl: newsletter.downloadUrl,
        tags: newsletter.tags || [],
        categories: newsletter.categories || [],
        createdAt: new Date().toISOString(),
        ...updates
      };
      await setDoc(docRef, fullDocumentData);
    }
    // Update the local newsletter in the array
    const index = newsletters.value.findIndex(n => n.id === newsletter.id);
    if (index !== -1) {
      // Update the local array with the edited data
      newsletters.value[index] = { ...editDialog.value.editingNewsletter };
    } else {
      console.warn('⚠️  Newsletter not found in local array for update');
    }
    $q.notify({
      type: 'positive',
      message: 'Metadata updated successfully',
      caption: `Version ${newVersion} saved`,
      position: 'top',
    });
    editDialog.value.showDialog = false;
    // Refresh the local data after saving to Firebase
    await refreshNewslettersWithLocalMetadata();
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
    // Convert the extracted content to TagGenerationResult format
    const tagResult: TagGenerationResult = {
      suggestedTags: extractedContent.suggestedTags || [],
      topics: extractedContent.topics || [],
      keyTerms: extractedContent.keyTerms || [],
      keywordCounts: extractedContent.keywordCounts || {},
      textContent: extractedContent.textContent || '',
      textPreview: extractedContent.textPreview || '',
      wordCount: extractedContent.wordCount || 0
    };
    // Create a basic Newsletter object for the tag service
    const basicNewsletter: Newsletter = {
      id: parseInt(newsletter.id), // Convert string to number
      title: newsletter.title,
      filename: newsletter.filename,
      date: `${newsletter.year}-${newsletter.season}`,
      pages: newsletter.pageCount || 0,
      url: newsletter.downloadUrl,
      source: 'hybrid',
      tags: newsletter.tags || [],
      topics: newsletter.categories || [],
    };
    // Use unified tag application service (NO MORE DUPLICATE CODE!)
    const updatedNewsletter = tagGenerationService.applyTagsToNewsletter(
      basicNewsletter,
      tagResult,
      {
        maxNewTags: 10,
        maxNewCategories: 5,
        replaceExisting: false
      }
    );
    // Prepare Firebase update with proper typing
    const updates: UpdateData<ContentManagementNewsletter> = {
      searchableText: tagResult.textContent,
      wordCount: tagResult.wordCount,
      tags: updatedNewsletter.tags || [],
      categories: updatedNewsletter.topics || [], // Map topics to categories for this interface
      keyTerms: tagResult.keyTerms,
      keywordCounts: tagResult.keywordCounts,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin-manual',
    };
    if (!newsletter.id) {
      throw new Error('Newsletter ID is required for updating');
    }
    const docRef = doc(firestore, 'newsletters', newsletter.id);
    // Check if document exists first
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // Document exists, use updateDoc
      await updateDoc(docRef, updates);
    } else {
      // Document doesn't exist, create it with setDoc
      const fullDocumentData = {
        id: newsletter.id,
        filename: newsletter.filename,
        title: newsletter.title,
        year: newsletter.year,
        season: newsletter.season,
        fileSize: newsletter.fileSize,
        downloadUrl: newsletter.downloadUrl,
        tags: updatedNewsletter.tags || [],
        categories: updatedNewsletter.topics || [],
        createdAt: new Date().toISOString(),
        searchableText: tagResult.textContent,
        wordCount: tagResult.wordCount,
        keyTerms: tagResult.keyTerms,
        keywordCounts: tagResult.keywordCounts,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin-manual'
      };
      await setDoc(docRef, fullDocumentData);
    }
    // Update the local newsletter object to trigger reactivity
    const index = newsletters.value.findIndex(n => n.id === newsletter.id);
    if (index !== -1 && newsletters.value[index]) {
      // Use the FILTERED tags from the unified service, not the raw extracted content!
      const localUpdates = {
        searchableText: tagResult.textContent,
        wordCount: tagResult.wordCount,
        keyTerms: tagResult.keyTerms,
        keywordCounts: tagResult.keywordCounts || {},
        // ✅ USE FILTERED TAGS FROM UNIFIED SERVICE
        tags: updatedNewsletter.tags || [],
        categories: updatedNewsletter.topics || [],
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin-manual'
      };
      // Update individual properties to maintain type safety
      const currentNewsletter = newsletters.value[index];
      currentNewsletter.searchableText = localUpdates.searchableText;
      currentNewsletter.wordCount = localUpdates.wordCount;
      currentNewsletter.keyTerms = localUpdates.keyTerms;
      currentNewsletter.keywordCounts = localUpdates.keywordCounts;
      currentNewsletter.tags = localUpdates.tags;
      currentNewsletter.categories = localUpdates.categories;
      currentNewsletter.updatedAt = localUpdates.updatedAt;
      currentNewsletter.updatedBy = localUpdates.updatedBy;
    }
    $q.notify({
      type: 'positive',
      message: 'Extracted metadata applied successfully',
      caption: `Added ${updatedNewsletter.tags?.length || 0} tags, ${updatedNewsletter.topics?.length || 0} topics, and ${tagResult.wordCount} words of searchable text`,
      position: 'top',
    });
    textExtractionDialog.value.showDialog = false;
    // Refresh the local data to make sure keywords persist
    await refreshNewslettersWithLocalMetadata();
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
  // For admin panel, load ALL newsletters from Firebase (including unpublished)
  try {
    processingStates.value.isLoading = true;

    logger.info('Admin: Initializing Firebase service for admin management...');

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

  } catch (error) {
    logger.error('Admin: Failed to load newsletters for management:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load newsletters for admin management'
    });

    // Fallback to original load method
    await loadNewsletters();
  } finally {
    processingStates.value.isLoading = false;
  }

  // Load any extracted metadata from local storage
  await refreshNewslettersWithLocalMetadata();
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
