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
          <!-- Statistics Cards -->
          <StatisticsCards :total-newsletters="totalNewsletters" :newsletters-with-text="newslettersWithText"
            :newsletters-with-thumbnails="newslettersWithThumbnails" :total-file-size="totalFileSize" />

          <!-- Local Storage Management -->
          <LocalStorageManager :stats="localStorageStats" :is-syncing="processingStates.isSyncing"
            @sync-to-firebase="handleSyncToFirebase" @clear-local="handleClearLocal"
            @refresh-stats="refreshLocalStorageStats" />

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
                  <q-btn v-if="selectedNewsletters.length === 0" color="primary" icon="mdi-refresh" label="Bulk Actions"
                    @click="showBulkActionsMenu = !showBulkActionsMenu" class="full-width" />
                </div>
              </div>

              <!-- Bulk Actions Menu (when no selection) -->
              <q-slide-transition>
                <div v-if="showBulkActionsMenu && selectedNewsletters.length === 0" class="q-mt-md">
                  <q-separator class="q-mb-md" />
                  <div class="row q-gutter-sm">
                    <q-btn color="primary" icon="mdi-refresh" label="Generate All Tags" @click="extractAllMetadata"
                      :loading="processingStates.isExtracting" />
                    <q-btn color="secondary" icon="mdi-text-search" label="Extract All Text" @click="extractAllMetadata"
                      :loading="processingStates.isExtractingAllText" />
                    <q-btn color="accent" icon="mdi-image-multiple" label="Generate All Thumbnails"
                      @click="generateAllThumbnails" :loading="processingStates.isGeneratingThumbs" />
                    <q-btn color="warning" icon="mdi-calendar-clock" label="Enhance Dates"
                      @click="enhanceAllNewsletterDates" :loading="processingStates.isEnhancingDates" />
                    <q-btn color="orange" icon="mdi-database-plus" label="Create Missing Records"
                      @click="createMissingDatabaseRecords" :loading="processingStates.isCreatingRecords" />
                    <q-btn color="positive" icon="mdi-cloud-upload" label="Sync All to Firebase"
                      @click="handleSyncToFirebase" :loading="processingStates.isSyncing" />
                  </div>
                </div>
              </q-slide-transition>
            </q-card-section>
          </q-card>

          <!-- Gmail-inspired Newsletter Management Table -->
          <NewsletterManagementTable :newsletters="filteredNewsletters"
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
            @bulk-delete="handleBulkDelete" />
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
import { useThumbnailManagement } from '../composables/useThumbnailManagement';
import { localMetadataStorageService, type ExtractedMetadata } from '../services/local-metadata-storage.service';
import { tagGenerationService, type TagGenerationResult } from '../services/tag-generation.service';
import type { Newsletter } from '../types/core/newsletter.types';
// Import components
import LocalStorageManager from '../components/content-management/LocalStorageManager.vue';
import StatisticsCards from '../components/content-management/StatisticsCards.vue';
import NewsletterManagementTable from '../components/content-management/NewsletterManagementTable.vue';
// Import types
import type { ContentManagementNewsletter } from '../types';
const $q = useQuasar();
// Use composables
const {
  newsletters,
  localStorageStats,
  processingStates: baseProcessingStates,
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
} = useContentManagement();

const {
  syncLocalMetadataToFirebase,
  clearLocalMetadata,
} = useContentExtraction();

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

const processingStates = computed(() => ({
  ...baseProcessingStates.value,
  isGeneratingThumbs: isGeneratingThumbnails.value,
  isEnhancingDates: isEnhancingDates.value,
  isCreatingRecords: isCreatingRecords.value
}));
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
const syncingIndividual = ref<Record<string, boolean>>({});
const publishingStates = ref<Record<string, boolean>>({});
const featuredStates = ref<Record<string, boolean>>({});

// Helper function to update newsletter thumbnail reactively
const updateNewsletterThumbnail = (newsletterId: string, thumbnailUrl: string): void => {
  console.log('🔄 [DEBUG] Attempting to update thumbnail for newsletter ID:', newsletterId);
  console.log('🔄 [DEBUG] Thumbnail URL length:', thumbnailUrl.length);
  console.log('🔄 [DEBUG] Total newsletters in array:', newsletters.value.length);

  const newsletterIndex = newsletters.value.findIndex(n => n.id === newsletterId);
  console.log('🔄 [DEBUG] Found newsletter at index:', newsletterIndex);

  if (newsletterIndex !== -1) {
    const newsletter = newsletters.value[newsletterIndex];
    if (newsletter) {
      console.log('🔄 [DEBUG] Before update - old thumbnail URL:', newsletter.thumbnailUrl);
      // Vue 3 reactivity: update the thumbnail URL
      newsletter.thumbnailUrl = thumbnailUrl;
      console.log('🔄 [DEBUG] After update - new thumbnail URL:', newsletter.thumbnailUrl?.substring(0, 50) + '...');
      console.log('🔄 [DEBUG] Reactively updated thumbnail for:', newsletter.title);
    } else {
      console.error('🔄 [DEBUG] Newsletter at index is null/undefined');
    }
  } else {
    console.error('🔄 [DEBUG] Newsletter not found with ID:', newsletterId);
    console.log('🔄 [DEBUG] Available newsletter IDs:', newsletters.value.map(n => n.id));
  }
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
  await generateBatchThumbnails(
    selectedNewsletters.value,
    // Callback: immediately update the UI for each newsletter as thumbnails are generated
    (newsletter: ContentManagementNewsletter, thumbnailUrl: string) => {
      updateNewsletterThumbnail(newsletter.id, thumbnailUrl);
    }
  );
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
async function generateThumbnail(newsletter: ContentManagementNewsletter): Promise<void> {
  console.log('🖼️ [DEBUG] Starting thumbnail generation for:', newsletter.title);
  console.log('🖼️ [DEBUG] Newsletter ID:', newsletter.id);
  console.log('🖼️ [DEBUG] Newsletter download URL:', newsletter.downloadUrl);

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
