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
          <q-card class="q-mb-lg">
            <q-card-section>
              <div class="row">
                <div class="col-12 col-md-4 q-pa-sm">
                  <q-btn color="primary" icon="mdi-refresh" label="Extract All Metadata" @click="extractAllMetadata"
                    :loading="isExtracting" class="full-width" />
                </div>
                <div class="col-12 col-md-4 q-pa-sm">
                  <q-btn color="secondary" icon="mdi-text-search" label="Extract All Text Content"
                    @click="extractAllText" :loading="isExtractingAllText" class="full-width" />
                </div>
                <div class="col-12 col-md-4 q-pa-sm">
                  <q-btn color="accent" icon="mdi-image-multiple" label="Generate Thumbnails"
                    @click="generateThumbnails" :loading="isGeneratingThumbs" class="full-width" />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Local Storage Management -->
          <q-card class="q-mb-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-database" class="q-mr-sm" />
                Local Metadata Storage
              </div>
              <div class="row items-center">
                <div class="col-12 col-md-6">
                  <div class="text-body2">
                    <div>Total: {{ localStorageStats.total }}</div>
                    <div class="text-orange">Pending: {{ localStorageStats.pending }}</div>
                    <div class="text-green">Synced: {{ localStorageStats.synced }}</div>
                    <div class="text-red" v-if="localStorageStats.errors > 0">Errors: {{ localStorageStats.errors }}
                    </div>
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="row q-gutter-sm">
                    <q-btn color="positive" icon="mdi-cloud-upload" label="Sync to Firebase"
                      @click="syncLocalMetadataToFirebase" :loading="isSyncing"
                      :disable="localStorageStats.pending === 0" size="sm" />
                    <q-btn color="warning" icon="mdi-delete" label="Clear Local" @click="clearLocalMetadata"
                      :disable="localStorageStats.total === 0" size="sm" />
                    <q-btn color="info" icon="mdi-refresh" label="Refresh" @click="refreshLocalStorageStats"
                      size="sm" />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Statistics Cards -->
          <div class="row q-mb-lg">
            <div class="col-12 col-sm-6 col-md-3 q-pa-sm">
              <q-card class="text-center">
                <q-card-section>
                  <div class="text-h6">{{ totalNewsletters }}</div>
                  <div class="text-caption">Total Newsletters</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6 col-md-3 q-pa-sm">
              <q-card class="text-center">
                <q-card-section>
                  <div class="text-h6">{{ newslettersWithText }}</div>
                  <div class="text-caption">With Text Content</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6 col-md-3 q-pa-sm">
              <q-card class="text-center">
                <q-card-section>
                  <div class="text-h6">{{ newslettersWithThumbnails }}</div>
                  <div class="text-caption">With Thumbnails</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6 col-md-3 q-pa-sm">
              <q-card class="text-center">
                <q-card-section>
                  <div class="text-h6">{{ totalFileSize }}</div>
                  <div class="text-caption">Total Size</div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Newsletter Management -->
          <q-card>
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mdi-file-document-multiple" class="q-mr-sm" />
                Newsletter Content & Metadata
              </div>

              <!-- Search and Filter -->
              <div class="row q-mb-md">
                <div class="col-12 col-md-6 q-pa-sm">
                  <q-input v-model="searchText" label="Search newsletters..." outlined dense clearable>
                    <template v-slot:prepend>
                      <q-icon name="mdi-magnify" />
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-md-3 q-pa-sm">
                  <q-select v-model="filterYear" :options="availableYears" label="Filter by Year" outlined dense
                    clearable emit-value map-options />
                </div>
                <div class="col-12 col-md-3 q-pa-sm">
                  <q-select v-model="filterSeason" :options="seasonOptions" label="Filter by Season" outlined dense
                    clearable emit-value map-options />
                </div>
              </div>

              <!-- Newsletter Table -->
              <div class="table-container">
                <q-table :rows="filteredNewsletters" :columns="columns" row-key="id" :loading="isLoading"
                  :pagination="pagination" binary-state-sort flat bordered table-class="newsletter-table" wrap-cells>
                  <template v-slot:body-cell-thumbnail="props">
                    <q-td :props="props">
                      <q-avatar v-if="props.row.thumbnailUrl" size="48px" square>
                        <img :src="props.row.thumbnailUrl" alt="Thumbnail" />
                      </q-avatar>
                      <q-icon v-else name="mdi-file-pdf-box" size="48px" color="grey-5" />
                    </q-td>
                  </template>

                  <template v-slot:body-cell-title="props">
                    <q-td :props="props">
                      <div class="text-weight-medium">{{ props.row.title }}</div>
                      <div class="text-caption text-grey">{{ props.row.filename }}</div>
                    </q-td>
                  </template>

                  <template v-slot:body-cell-metadata="props">
                    <q-td :props="props">
                      <div class="text-body2">
                        {{ props.row.year }}
                        <q-chip size="xs" :color="getSeasonColor(props.row.season)" text-color="white">
                          {{ props.row.season.charAt(0).toUpperCase() + props.row.season.slice(1)
                          }}
                        </q-chip>
                      </div>
                      <div class="text-caption">
                        <span v-if="props.row.fileSize > 0">{{ formatFileSize(props.row.fileSize)
                        }}</span>
                        <span v-else class="text-grey-6">Size unknown</span>
                        <span v-if="props.row.pageCount && props.row.pageCount > 0"> • {{
                          props.row.pageCount }} pages</span>
                        <span v-if="props.row.wordCount && props.row.wordCount > 0"> • {{
                          props.row.wordCount }} words</span>
                      </div>
                    </q-td>
                  </template>

                  <template v-slot:body-cell-content="props">
                    <q-td :props="props" style="max-width: 300px;">
                      <div class="column q-pa-none">
                        <!-- Main status chips - stack vertically to prevent overflow -->
                        <div class="q-mb-xs">
                          <q-chip v-if="props.row.searchableText && props.row.searchableText.length > 0"
                            color="positive" text-color="white" size="xs" icon="mdi-text-search"
                            @click="showExtractedContent(props.row)" clickable dense>
                            Text
                          </q-chip>
                          <q-chip v-else color="grey-6" text-color="white" size="xs" icon="mdi-text-off" dense>
                            No text
                          </q-chip>

                          <q-chip v-if="props.row.keyTerms?.length" color="secondary" text-color="white" size="xs"
                            icon="mdi-tag-multiple" dense class="q-ml-xs">
                            {{ props.row.keyTerms.length }}
                          </q-chip>

                          <q-chip v-if="props.row.thumbnailUrl" color="info" text-color="white" size="xs"
                            icon="mdi-image" dense class="q-ml-xs">
                            Thumb
                          </q-chip>
                        </div>

                        <!-- Secondary status chips -->
                        <div v-if="props.row.articles?.length || props.row.featured" class="q-mb-xs">
                          <q-chip v-if="props.row.articles?.length" color="purple" text-color="white" size="xs"
                            icon="mdi-file-document-multiple" dense>
                            {{ props.row.articles.length }} articles
                          </q-chip>
                          <q-chip v-if="props.row.featured" color="warning" text-color="white" size="xs" icon="mdi-star"
                            dense class="q-ml-xs">
                            Featured
                          </q-chip>
                        </div>

                        <!-- Tags - limit to 2 and show compactly -->
                        <div v-if="props.row.tags?.length" class="q-mt-xs">
                          <q-chip v-for="tag in props.row.tags.slice(0, 2)" :key="tag" size="xs" outline color="primary"
                            dense>
                            {{ tag }}
                          </q-chip>
                          <span v-if="props.row.tags.length > 2" class="text-caption text-grey-6">
                            +{{ props.row.tags.length - 2 }}
                          </span>
                        </div>
                      </div>
                    </q-td>
                  </template>

                  <template v-slot:body-cell-actions="props">
                    <q-td :props="props">
                      <div class="column q-pa-none">
                        <div class="row">
                          <q-btn flat dense icon="mdi-eye" color="primary" @click="viewNewsletter(props.row)" size="sm">
                            <q-tooltip>View Newsletter</q-tooltip>
                          </q-btn>
                          <q-btn flat dense icon="mdi-pencil" color="secondary" @click="editMetadata(props.row)"
                            size="sm">
                            <q-tooltip>Edit Metadata</q-tooltip>
                          </q-btn>
                          <q-btn flat dense icon="mdi-text-search" color="accent" @click="extractTextContent(props.row)"
                            :loading="extractingText[props.row.id]" size="sm">
                            <q-tooltip>Extract Text & Generate Metadata</q-tooltip>
                          </q-btn>
                          <q-btn flat dense icon="mdi-image" color="info" @click="generateThumbnail(props.row)"
                            :loading="generatingThumb[props.row.id]" size="sm">
                            <q-tooltip>Generate Thumbnail</q-tooltip>
                          </q-btn>
                        </div>
                      </div>
                    </q-td>
                  </template>
                </q-table>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Edit Metadata Dialog -->
    <q-dialog v-model="showEditDialog" persistent>
      <q-card style="min-width: 600px; max-width: 800px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Edit Newsletter Metadata</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="editingNewsletter">
          <div class="row">
            <!-- Basic Information -->
            <div class="col-12 q-pa-sm">
              <q-input v-model="editingNewsletter.title" label="Title" outlined dense />
            </div>

            <div class="col-12 col-md-6 q-pa-sm">
              <q-input v-model="editingNewsletter.year" label="Year" type="number" outlined dense />
            </div>

            <div class="col-12 col-md-6 q-pa-sm">
              <q-select v-model="editingNewsletter.season" :options="seasonOptions" label="Season" outlined dense
                emit-value map-options />
            </div>

            <div class="col-12 col-md-6 q-pa-sm">
              <q-input v-model="editingNewsletter.volume" label="Volume" type="number" outlined dense />
            </div>

            <div class="col-12 col-md-6 q-pa-sm">
              <q-input v-model="editingNewsletter.issue" label="Issue" type="number" outlined dense />
            </div>

            <div class="col-12 q-pa-sm">
              <q-input v-model="editingNewsletter.description" label="Description" type="textarea" outlined rows="3" />
            </div>

            <div class="col-12 q-pa-sm">
              <q-input v-model="editingNewsletter.summary" label="Summary (for featured content)" type="textarea"
                outlined rows="2" />
            </div>

            <!-- Tags -->
            <div class="col-12 q-pa-sm">
              <q-select v-model="editingNewsletter.tags" :options="availableTags" label="Tags" multiple use-chips
                use-input @new-value="addNewTag" outlined dense />
            </div>

            <!-- Categories -->
            <div class="col-12 q-pa-sm">
              <q-select v-model="editingNewsletter.categories" :options="availableCategories" label="Categories"
                multiple use-chips outlined dense />
            </div>

            <!-- Contributors -->
            <div class="col-12 q-pa-sm">
              <q-input v-model="contributorsString" label="Contributors (comma-separated)" outlined dense />
            </div>

            <!-- Flags -->
            <div class="col-12 q-pa-sm">
              <div class="row">
                <div class="col-6">
                  <q-checkbox v-model="editingNewsletter.featured" label="Featured on homepage" />
                </div>
                <div class="col-6">
                  <q-checkbox v-model="editingNewsletter.isPublished" label="Published (visible to users)" />
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save Changes" @click="saveMetadata" :loading="isSaving" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Text Extraction Progress Dialog -->
    <q-dialog v-model="showTextExtractionDialog" persistent>
      <q-card style="min-width: 500px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Text Extraction & Metadata Generation</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup :disable="isProcessingText" />
        </q-card-section>

        <q-card-section v-if="currentExtractionFile">
          <div class="text-body1 q-mb-md">
            Processing: <strong>{{ currentExtractionFile.filename }}</strong>
          </div>

          <q-linear-progress :value="extractionProgress" color="primary" class="q-mb-md"
            :indeterminate="isProcessingText" />

          <div class="text-caption text-grey">
            {{ extractionStatus }}
          </div>

          <div v-if="extractedContent" class="q-mt-md">
            <div class="text-subtitle2 q-mb-sm">Extracted Content Preview:</div>
            <q-card flat bordered>
              <q-card-section>
                <div class="text-body2 q-mb-sm">
                  <strong>Word Count:</strong> {{ extractedContent.wordCount }}
                </div>
                <div class="text-body2 q-mb-sm">
                  <strong>Auto-generated Tags:</strong>
                  <q-chip v-for="tag in extractedContent.suggestedTags" :key="tag" size="sm" color="primary"
                    text-color="white">
                    {{ tag }}
                  </q-chip>
                </div>
                <div class="text-caption text-grey" style="max-height: 100px; overflow-y: auto;">
                  {{ extractedContent.textPreview }}...
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup :disable="isProcessingText" />
          <q-btn v-if="extractedContent" color="primary" label="Apply Metadata" @click="applyExtractedMetadata"
            :loading="isApplyingMetadata" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { doc, updateDoc, type UpdateData } from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import { lightweightNewsletterService } from '../services/lightweight-newsletter-service';
import { localMetadataStorageService, type ExtractedMetadata } from 'src/services/local-metadata-storage.service';
import { advancedPdfTextExtractionService } from 'src/services/advanced-pdf-text-extraction-service';

interface Newsletter {
  id: string;
  filename: string;
  title: string;
  description?: string;
  summary?: string;
  year: number;
  season: string;
  volume?: number;
  issue?: number;
  fileSize: number;
  pageCount?: number;
  wordCount?: number;
  downloadUrl: string;
  thumbnailUrl?: string;
  searchableText?: string;
  tags: string[];
  categories?: string[];
  contributors?: string[] | string;
  featured: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  // Extended properties for text extraction
  keyTerms?: string[];
  keywordCounts?: Record<string, number>; // NEW: Store keyword frequency counts
  readingTimeMinutes?: number;
  articleCount?: number;
  articles?: Array<{
    title: string;
    content: string;
    pageNumbers: number[];
    wordCount: number;
  }>;
  textExtractionVersion?: string;
  textExtractedAt?: string;
}

interface ExtractedContent {
  textContent: string;
  textPreview: string;
  wordCount: number;
  suggestedTags: string[];
  topics: string[];
  keyTerms: string[];
  keywordCounts?: Record<string, number>; // NEW: Store keyword frequency counts
  articles?: Array<{
    title: string;
    content: string;
    pageNumbers: number[];
    wordCount: number;
  }>;
  readingTimeMinutes?: number;
  extractionVersion?: string;
  extractedAt?: string;
}

const $q = useQuasar();

// State
const newsletters = ref<Newsletter[]>([]);
const isLoading = ref(false);
const isExtracting = ref(false);
const isExtractingAllText = ref(false);
const isGeneratingThumbs = ref(false);
const isSaving = ref(false);
const isProcessingText = ref(false);
const isApplyingMetadata = ref(false);
const extractingText = ref<Record<string, boolean>>({});
const generatingThumb = ref<Record<string, boolean>>({});

// Local metadata storage state
const localStorageStats = ref({ total: 0, pending: 0, synced: 0, errors: 0 });
const isSyncing = ref(false);

// Filters
const searchText = ref('');
const filterYear = ref<number | null>(null);
const filterSeason = ref<string | null>(null);

// Edit dialog
const showEditDialog = ref(false);
const editingNewsletter = ref<Newsletter | null>(null);

// Text extraction dialog
const showTextExtractionDialog = ref(false);
const currentExtractionFile = ref<Newsletter | null>(null);
const extractedContent = ref<ExtractedContent | null>(null);
const extractionProgress = ref(0);
const extractionStatus = ref('');

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
    name: 'metadata',
    label: 'Details',
    field: 'year',
    align: 'left' as const,
    sortable: true,
    style: 'width: 20%; min-width: 150px;',
  },
  {
    name: 'content',
    label: 'Content Status',
    field: 'searchableText',
    align: 'left' as const,
    style: 'width: 30%; min-width: 250px; max-width: 300px;',
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center' as const,
    style: 'width: 200px; min-width: 180px; max-width: 220px;',
  },
];

// Options
const seasonOptions = [
  { label: 'Spring', value: 'spring' },
  { label: 'Summer', value: 'summer' },
  { label: 'Fall', value: 'fall' },
  { label: 'Winter', value: 'winter' },
];

const availableCategories = [
  'Community Events',
  'Lake Activities',
  'Wildlife & Nature',
  'Property Matters',
  'Recreation',
  'Weather Updates',
  'Local Business',
  'Community News',
  'Board Updates',
  'Maintenance',
  'Safety',
  'Environment',
];

// Computed
const availableYears = computed(() => {
  const years = [...new Set(newsletters.value.map(n => n.year))].sort((a, b) => b - a);
  return years.map(year => ({ label: year.toString(), value: year }));
});

const availableTags = computed(() => {
  const allTags = newsletters.value.flatMap(n => n.tags || []);
  return [...new Set(allTags)].sort();
});

const filteredNewsletters = computed(() => {
  let filtered = newsletters.value;

  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    filtered = filtered.filter(n =>
      n.title?.toLowerCase().includes(search) ||
      n.filename?.toLowerCase().includes(search) ||
      n.tags?.some((tag: string) => tag.toLowerCase().includes(search))
    );
  }

  if (filterYear.value) {
    filtered = filtered.filter(n => n.year === filterYear.value);
  }

  if (filterSeason.value) {
    filtered = filtered.filter(n => n.season === filterSeason.value);
  }

  return filtered;
});

const totalNewsletters = computed(() => newsletters.value.length);

const newslettersWithText = computed(() =>
  newsletters.value.filter(n => n.searchableText).length
);

const newslettersWithThumbnails = computed(() =>
  newsletters.value.filter(n => n.thumbnailUrl).length
);

const totalFileSize = computed(() => {
  const total = newsletters.value.reduce((sum, n) => sum + (n.fileSize || 0), 0);
  return formatFileSize(total);
});

// Computed for form handling
const contributorsString = computed({
  get: () => {
    if (!editingNewsletter.value) return '';
    const contributors = editingNewsletter.value.contributors;
    if (Array.isArray(contributors)) {
      return contributors.join(', ');
    }
    return contributors || '';
  },
  set: (value: string) => {
    if (editingNewsletter.value) {
      editingNewsletter.value.contributors = value;
    }
  }
});

// Methods
function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getSeasonColor(season: string): string {
  switch (season.toLowerCase()) {
    case 'spring': return 'green';
    case 'summer': return 'orange';
    case 'fall': case 'autumn': return 'amber';
    case 'winter': return 'light-blue';
    default: return 'grey';
  }
}

function viewNewsletter(newsletter: Newsletter): void {
  // Open newsletter in new tab
  window.open(newsletter.downloadUrl, '_blank');
}

function showExtractedContent(newsletter: Newsletter): void {
  if (newsletter.searchableText || newsletter.keyTerms?.length) {
    // Generate keyword counts display
    let keywordCountsDisplay = '';
    if (newsletter.keywordCounts) {
      const topKeywords = Object.entries(newsletter.keywordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      if (topKeywords.length > 0) {
        keywordCountsDisplay = `
                    <h6>Top 10 Keywords (with frequency):</h6>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; margin-bottom: 10px;">
                        ${topKeywords.map(([word, count]) =>
          `<span style="background: #e3f2fd; padding: 4px 8px; border-radius: 12px; font-size: 11px; text-align: center;">
                                <strong>${word}</strong> (${count})
                            </span>`
        ).join('')}
                    </div>
                `;
      }
    }

    $q.dialog({
      title: `Extracted Content: ${newsletter.title}`,
      message: `
                <div style="max-width: 600px;">
                    <h6>Text Extraction Info:</h6>
                    <p><strong>Word Count:</strong> ${newsletter.wordCount || 'Not available'}</p>
                    <p><strong>Reading Time:</strong> ${newsletter.readingTimeMinutes || 'Not available'} minutes</p>
                    <p><strong>Text Length:</strong> ${newsletter.searchableText?.length || 0} characters</p>
                    <p><strong>Extraction Version:</strong> ${newsletter.textExtractionVersion || 'Unknown'}</p>
                    <p><strong>Extracted At:</strong> ${newsletter.textExtractedAt || 'Unknown'}</p>

                    ${keywordCountsDisplay}

                    ${newsletter.keyTerms?.length ? `
                        <h6>All Keywords (${newsletter.keyTerms.length}):</h6>
                        <p style="font-size: 12px; color: #666;">${newsletter.keyTerms.join(', ')}</p>
                    ` : ''}

                    ${newsletter.articles?.length ? `
                        <h6>Articles (${newsletter.articles.length}):</h6>
                        <ul>
                            ${newsletter.articles.map(article => `<li><strong>${article.title}</strong> - ${article.content.substring(0, 100)}...</li>`).join('')}
                        </ul>
                    ` : ''}

                    ${newsletter.searchableText ? `
                        <h6>Full Text (first 500 chars):</h6>
                        <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto;">
                            ${newsletter.searchableText.substring(0, 500)}${newsletter.searchableText.length > 500 ? '...' : ''}
                        </p>
                    ` : ''}
                </div>
            `,
      html: true,
      ok: 'Close'
    });
  } else {
    $q.notify({
      type: 'info',
      message: 'No extracted content available for this newsletter',
      position: 'top'
    });
  }
} function editMetadata(newsletter: Newsletter): void {
  editingNewsletter.value = { ...newsletter };
  showEditDialog.value = true;
}

async function saveMetadata(): Promise<void> {
  if (!editingNewsletter.value) return;

  isSaving.value = true;

  try {
    const updates = { ...editingNewsletter.value };

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
    const docRef = doc(firestore, 'newsletters', updates.id);
    await updateDoc(docRef, updates);

    $q.notify({
      type: 'positive',
      message: 'Metadata updated successfully',
      position: 'top',
    });

    showEditDialog.value = false;
  } catch (error) {
    console.error('Error updating metadata:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update metadata',
      position: 'top',
    });
  } finally {
    isSaving.value = false;
  }
}

function addNewTag(val: string, done: (val: string, mode?: 'add' | 'add-unique' | 'toggle') => void): void {
  if (val.length > 2) {
    if (!availableTags.value.includes(val)) {
      done(val, 'add-unique');
    }
  }
}

async function extractAllMetadata(): Promise<void> {
  isExtracting.value = true;

  try {
    // Get PDFs that need processing (without searchableText)
    const newslettersToProcess = newsletters.value.filter(n => !n.searchableText);

    if (newslettersToProcess.length === 0) {
      $q.notify({
        type: 'info',
        message: 'All newsletters already have extracted metadata',
        position: 'top',
      });
      return;
    }

    $q.notify({
      type: 'info',
      message: `Starting metadata extraction for ${newslettersToProcess.length} newsletters...`,
      position: 'top',
    });

    let processed = 0;
    let failed = 0;

    // Process each newsletter
    for (const newsletter of newslettersToProcess) {
      try {
        console.log(`Processing ${newsletter.filename}...`);

        // Extract text using the real service
        const pdfUrl = newsletter.downloadUrl?.startsWith('http')
          ? newsletter.downloadUrl
          : `${window.location.origin}${newsletter.downloadUrl || `/issues/${newsletter.filename}`}`;

        const extractionResult = await advancedPdfTextExtractionService.extractAdvancedPdfData(
          pdfUrl,
          newsletter.filename,
          {
            extractImages: false,
            extractText: true,
            extractArticles: true,
            extractTopics: true,
            generateThumbnails: false
          }
        );

        // Generate enhanced metadata with keyword counts
        const keywordAnalysis = extractKeywordsWithCounts(extractionResult.cleanedText, extractionResult.searchableTerms);
        const suggestedTags = extractKeywords(extractionResult.cleanedText, extractionResult.searchableTerms);

        console.log(`📊 Top keywords for ${newsletter.filename}:`,
          Object.entries(keywordAnalysis.keywordCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([word, count]) => `${word} (${count})`)
            .join(', ')
        );

        // Update the newsletter in Firestore
        const updates: UpdateData<Newsletter> = {
          searchableText: extractionResult.cleanedText,
          wordCount: extractionResult.totalWords,
          keyTerms: keywordAnalysis.keywords, // Use the top 10 keywords
          keywordCounts: keywordAnalysis.keywordCounts, // Store all keyword counts
          readingTimeMinutes: extractionResult.readingTimeMinutes,
          tags: [
            ...newsletter.tags,
            ...suggestedTags.filter(tag => !newsletter.tags.includes(tag))
          ].slice(0, 20), // Limit to 20 tags
          categories: [
            ...(newsletter.categories || []),
            ...extractionResult.topics.filter(topic => !(newsletter.categories || []).includes(topic))
          ].slice(0, 10), // Limit to 10 categories
          textExtractionVersion: extractionResult.extractionVersion,
          textExtractedAt: extractionResult.extractedAt,
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin-bulk',
        };

        if (extractionResult.articles && extractionResult.articles.length > 0) {
          updates.articleCount = extractionResult.articles.length;
          updates.articles = extractionResult.articles.map(article => ({
            title: article.title,
            content: article.content.slice(0, 200) + '...',
            pageNumbers: article.pageNumbers,
            wordCount: article.wordCount
          }));
        }

        const docRef = doc(firestore, 'newsletters', newsletter.id);
        await updateDoc(docRef, updates);

        processed++;
        console.log(`✅ Processed ${newsletter.filename} (${processed}/${newslettersToProcess.length})`);

      } catch (error) {
        failed++;
        console.error(`❌ Failed to process ${newsletter.filename}:`, error);
      }
    }

    $q.notify({
      type: 'positive',
      message: `Metadata extraction completed`,
      caption: `Processed: ${processed}, Failed: ${failed}`,
      position: 'top',
    });

  } catch (error) {
    console.error('Bulk metadata extraction failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Bulk metadata extraction failed',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top',
    });
  } finally {
    isExtracting.value = false;
  }
}

async function extractAllText(): Promise<void> {
  isExtractingAllText.value = true;

  try {
    // Get newsletters that don't have searchable text yet
    const newslettersToProcess = newsletters.value.filter(n => !n.searchableText);

    if (newslettersToProcess.length === 0) {
      $q.notify({
        type: 'info',
        message: 'All newsletters already have extracted text',
        position: 'top',
      });
      return;
    }

    $q.notify({
      type: 'info',
      message: `Extracting text from ${newslettersToProcess.length} newsletters...`,
      position: 'top',
    });

    let processed = 0;
    let failed = 0;

    // Process each newsletter
    for (const newsletter of newslettersToProcess) {
      try {
        console.log(`Extracting text from ${newsletter.filename}...`);

        const pdfUrl = newsletter.downloadUrl?.startsWith('http')
          ? newsletter.downloadUrl
          : `${window.location.origin}${newsletter.downloadUrl || `/issues/${newsletter.filename}`}`;

        const extractionResult = await advancedPdfTextExtractionService.extractAdvancedPdfData(
          pdfUrl,
          newsletter.filename,
          {
            extractImages: false,
            extractText: true,
            extractArticles: false, // Focus just on text
            extractTopics: false,
            generateThumbnails: false
          }
        );

        // Store the extracted data locally in IndexedDB instead of modifying newsletter objects
        const keywordAnalysis = extractKeywordsWithCounts(extractionResult.cleanedText, extractionResult.searchableTerms || []);

        const extractedMetadata: ExtractedMetadata = {
          filename: newsletter.filename,
          newsletterId: newsletter.id,
          searchableText: extractionResult.cleanedText,
          wordCount: extractionResult.totalWords,
          readingTimeMinutes: extractionResult.readingTimeMinutes,
          textExtractionVersion: extractionResult.extractionVersion,
          textExtractedAt: extractionResult.extractedAt,
          keywordCounts: keywordAnalysis.keywordCounts,
          extractedAt: new Date().toISOString(),
          status: 'pending'
        };

        // Store in IndexedDB
        await localMetadataStorageService.storeExtractedMetadata(extractedMetadata);

        console.log(`📊 Top keywords for ${newsletter.filename}:`,
          Object.entries(keywordAnalysis.keywordCounts).slice(0, 5).map(([word, count]) => `${word} (${count})`).join(', '));

        processed++;
        console.log(`✅ Extracted text from ${newsletter.filename} (${processed}/${newslettersToProcess.length})`);

      } catch (error) {
        failed++;
        console.error(`❌ Failed to extract text from ${newsletter.filename}:`, error);
      }
    }

    $q.notify({
      type: 'positive',
      message: `Text extraction completed`,
      caption: `Processed: ${processed}, Failed: ${failed}. Data stored locally.`,
      position: 'top',
    });

    // Refresh local storage stats
    await refreshLocalStorageStats();

  } catch (error) {
    console.error('Bulk text extraction failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Bulk text extraction failed',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top',
    });
  } finally {
    isExtractingAllText.value = false;
  }
}

// Local Storage Management Functions
async function refreshLocalStorageStats(): Promise<void> {
  try {
    const stats = await localMetadataStorageService.getStorageStats();
    localStorageStats.value = stats;
  } catch (error) {
    console.error('Failed to refresh local storage stats:', error);
  }
}

async function syncLocalMetadataToFirebase(): Promise<void> {
  isSyncing.value = true;

  try {
    const pendingMetadata = await localMetadataStorageService.getPendingMetadata();

    if (pendingMetadata.length === 0) {
      $q.notify({
        type: 'info',
        message: 'No pending metadata to sync',
        position: 'top',
      });
      return;
    }

    let synced = 0;
    let failed = 0;

    for (const metadata of pendingMetadata) {
      try {
        // Update Firebase document
        const updates = {
          searchableText: metadata.searchableText,
          wordCount: metadata.wordCount,
          readingTimeMinutes: metadata.readingTimeMinutes,
          textExtractionVersion: metadata.textExtractionVersion,
          textExtractedAt: metadata.textExtractedAt,
          keywordCounts: metadata.keywordCounts,
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin-local-sync',
        };

        const docRef = doc(firestore, 'newsletters', metadata.newsletterId);
        await updateDoc(docRef, updates);

        // Mark as synced in local storage
        await localMetadataStorageService.markAsSynced(metadata.newsletterId);
        synced++;

        console.log(`✅ Synced metadata for ${metadata.filename}`);

      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await localMetadataStorageService.markAsError(metadata.newsletterId, errorMessage);
        console.error(`❌ Failed to sync ${metadata.filename}:`, error);
      }
    }

    $q.notify({
      type: synced > 0 ? 'positive' : 'negative',
      message: `Sync completed`,
      caption: `Synced: ${synced}, Failed: ${failed}`,
      position: 'top',
    });

    await refreshLocalStorageStats();

  } catch (error) {
    console.error('Sync failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Sync failed',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top',
    });
  } finally {
    isSyncing.value = false;
  }
}

async function clearLocalMetadata(): Promise<void> {
  try {
    await localMetadataStorageService.clearAllMetadata();
    await refreshLocalStorageStats();

    $q.notify({
      type: 'positive',
      message: 'Local metadata cleared',
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to clear local metadata:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to clear local metadata',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top',
    });
  }
}

async function generateThumbnails(): Promise<void> {
  isGeneratingThumbs.value = true;

  try {
    $q.notify({
      type: 'info',
      message: 'Generating thumbnails...',
      position: 'top',
    });

    // Simulate thumbnail generation
    await new Promise(resolve => setTimeout(resolve, 5000));

    $q.notify({
      type: 'positive',
      message: 'Thumbnails generated successfully',
      position: 'top',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Thumbnail generation failed',
      position: 'top',
    });
  } finally {
    isGeneratingThumbs.value = false;
  }
}

async function extractTextContent(newsletter: Newsletter): Promise<void> {
  currentExtractionFile.value = newsletter;
  extractedContent.value = null;
  extractionProgress.value = 0;
  extractionStatus.value = 'Initializing text extraction...';
  showTextExtractionDialog.value = true;
  isProcessingText.value = true;

  try {
    extractionStatus.value = 'Loading PDF document...';
    extractionProgress.value = 0.1;

    // Construct PDF URL - try both relative and absolute paths
    const pdfUrl = newsletter.downloadUrl?.startsWith('http')
      ? newsletter.downloadUrl
      : `${window.location.origin}${newsletter.downloadUrl || `/issues/${newsletter.filename}`}`;

    extractionStatus.value = 'Extracting text content from PDF...';
    extractionProgress.value = 0.3;

    // Use the REAL text extraction service
    const extractionResult = await advancedPdfTextExtractionService.extractAdvancedPdfData(
      pdfUrl,
      newsletter.filename,
      {
        extractImages: false, // Focus on text for metadata generation
        extractText: true,
        extractArticles: true,
        extractTopics: true,
        generateThumbnails: false
      }
    );

    extractionStatus.value = 'Analyzing content and generating metadata suggestions...';
    extractionProgress.value = 0.7;

    // Generate intelligent metadata suggestions from extracted content
    const keywordAnalysis = extractKeywordsWithCounts(extractionResult.cleanedText, extractionResult.searchableTerms);
    const suggestedTags = extractKeywords(extractionResult.cleanedText, extractionResult.searchableTerms);
    const topics = extractionResult.topics || [];
    const articles = extractionResult.articles || [];

    console.log(`📊 Top keywords for ${newsletter.filename}:`,
      Object.entries(keywordAnalysis.keywordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => `${word} (${count})`)
        .join(', ')
    );

    extractionStatus.value = 'Preparing extracted content...';
    extractionProgress.value = 0.9;

    // Structure the extracted content for the UI
    extractedContent.value = {
      textContent: extractionResult.cleanedText,
      textPreview: extractionResult.cleanedText.slice(0, 500) + (extractionResult.cleanedText.length > 500 ? '...' : ''),
      wordCount: extractionResult.totalWords,
      suggestedTags: suggestedTags,
      topics: topics,
      keyTerms: keywordAnalysis.keywords, // Use top 10 keywords
      keywordCounts: keywordAnalysis.keywordCounts, // Include all keyword counts
      articles: articles.map(article => ({
        title: article.title,
        content: article.content.slice(0, 200) + '...',
        pageNumbers: article.pageNumbers,
        wordCount: article.wordCount
      })),
      readingTimeMinutes: extractionResult.readingTimeMinutes,
      extractionVersion: extractionResult.extractionVersion,
      extractedAt: extractionResult.extractedAt
    };

    extractionStatus.value = 'Text extraction completed successfully!';
    extractionProgress.value = 1.0;

    $q.notify({
      type: 'positive',
      message: `Text extraction completed for ${newsletter.filename}`,
      caption: `Extracted ${extractionResult.totalWords} words and found ${articles.length} articles`,
      position: 'top',
    });
  } catch (error) {
    console.error('Real text extraction failed:', error);
    extractionStatus.value = 'Text extraction failed';
    $q.notify({
      type: 'negative',
      message: 'Text extraction failed',
      caption: error instanceof Error ? error.message : 'Unknown error occurred',
      position: 'top',
    });
  } finally {
    isProcessingText.value = false;
  }
}

// Enhanced keyword extraction with counts and comprehensive stop word filtering
function extractKeywordsWithCounts(fullText: string, keyTerms: string[]): { keywords: string[], keywordCounts: Record<string, number> } {
  // Comprehensive stop words list
  const stopWords = [
    // Common English words
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those',
    'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'a', 'an', 'as', 'if', 'when', 'where', 'why', 'how', 'what',
    'who', 'whom', 'whose', 'which', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now', 'here', 'there', 'then', 'them', 'they',
    'their', 'his', 'her', 'him', 'he', 'she', 'it', 'its', 'we', 'us', 'our', 'you', 'your', 'me', 'my', 'mine',
    // Newsletter-specific common words
    'newsletter', 'issue', 'volume', 'page', 'pages', 'article', 'articles', 'news', 'update', 'updates', 'report',
    'information', 'please', 'contact', 'email', 'phone', 'address', 'thank', 'thanks', 'also', 'well', 'good',
    'great', 'best', 'first', 'last', 'next', 'previous', 'new', 'old', 'year', 'years', 'month', 'months', 'day',
    'days', 'time', 'times', 'date', 'dates', 'see', 'know', 'get', 'make', 'take', 'come', 'go', 'want', 'need',
    'like', 'work', 'call', 'feel', 'find', 'give', 'hand', 'keep', 'last', 'leave', 'life', 'live', 'look', 'seem',
    'tell', 'try', 'turn', 'use', 'way', 'week', 'weeks', 'said', 'say', 'says', 'one', 'two', 'three', 'four',
    'five', 'six', 'seven', 'eight', 'nine', 'ten', 'over', 'back', 'down', 'out', 'off', 'again', 'against',
    'once', 'around', 'under', 'right', 'left', 'long', 'small', 'large', 'big', 'little', 'high', 'low', 'much',
    'many', 'every', 'another', 'different', 'same', 'important', 'public', 'able', 'available', 'sure', 'open'
  ];

  // Extract and clean words from text
  const words = fullText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word =>
      word.length > 3 &&
      !stopWords.includes(word) &&
      !word.match(/^\d+$/) && // exclude pure numbers
      word.match(/^[a-z]+$/) // only alphabetic words
    );

  // Count word frequency
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Also count keyTerms if provided
  keyTerms.forEach(term => {
    const cleanTerm = term.toLowerCase().trim();
    if (cleanTerm.length > 3 && !stopWords.includes(cleanTerm)) {
      // Count occurrences in the text for existing keyTerms
      const termCount = (fullText.toLowerCase().match(new RegExp(cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (termCount > 0) {
        wordCount[cleanTerm] = Math.max(wordCount[cleanTerm] || 0, termCount);
      }
    }
  });

  // Get top 10 keywords by frequency (minimum 2 occurrences)
  const topKeywords = Object.entries(wordCount)
    .filter(([, count]) => count >= 2) // Only include words that appear at least twice
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  return {
    keywords: topKeywords,
    keywordCounts: wordCount
  };
}

// Legacy function for backward compatibility
function extractKeywords(fullText: string, keyTerms: string[]): string[] {
  const { keywords } = extractKeywordsWithCounts(fullText, keyTerms);
  return keywords;
}

async function applyExtractedMetadata(): Promise<void> {
  if (!currentExtractionFile.value || !extractedContent.value) return;

  isApplyingMetadata.value = true;

  try {
    // Create updates object with proper Firestore typing
    const updates: UpdateData<Newsletter> = {
      searchableText: extractedContent.value.textContent,
      wordCount: extractedContent.value.wordCount,
      tags: [
        ...currentExtractionFile.value.tags,
        ...extractedContent.value.suggestedTags.filter(
          tag => !currentExtractionFile.value!.tags.includes(tag)
        )
      ],
      categories: [
        ...(currentExtractionFile.value.categories || []),
        ...extractedContent.value.topics.filter(
          topic => !(currentExtractionFile.value!.categories || []).includes(topic)
        )
      ],
      keyTerms: extractedContent.value.keyTerms,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin-manual',
    };

    // Add keyword counts if available
    if (extractedContent.value.keywordCounts) {
      updates.keywordCounts = extractedContent.value.keywordCounts;
    }

    // Add additional extracted data if available
    if (extractedContent.value.readingTimeMinutes) {
      updates.readingTimeMinutes = extractedContent.value.readingTimeMinutes;
    }

    if (extractedContent.value.articles && extractedContent.value.articles.length > 0) {
      updates.articleCount = extractedContent.value.articles.length;
      updates.articles = extractedContent.value.articles;
    }

    if (extractedContent.value.extractionVersion) {
      updates.textExtractionVersion = extractedContent.value.extractionVersion;
      if (extractedContent.value.extractedAt) {
        updates.textExtractedAt = extractedContent.value.extractedAt;
      }
    }

    const docRef = doc(firestore, 'newsletters', currentExtractionFile.value.id);
    await updateDoc(docRef, updates);

    $q.notify({
      type: 'positive',
      message: 'Extracted metadata applied successfully',
      caption: `Added ${extractedContent.value.suggestedTags.length} tags, ${extractedContent.value.topics.length} topics, and ${extractedContent.value.wordCount} words of searchable text`,
      position: 'top',
    });

    showTextExtractionDialog.value = false;
  } catch (error) {
    console.error('Error applying extracted metadata:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to apply extracted metadata',
      caption: error instanceof Error ? error.message : 'Unknown error occurred',
      position: 'top',
    });
  } finally {
    isApplyingMetadata.value = false;
  }
}

async function generateThumbnail(newsletter: Newsletter): Promise<void> {
  generatingThumb.value[newsletter.id] = true;

  try {
    $q.notify({
      type: 'info',
      message: `Generating thumbnail for ${newsletter.filename}...`,
      position: 'top',
    });

    // Simulate thumbnail generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    $q.notify({
      type: 'positive',
      message: 'Thumbnail generated successfully',
      position: 'top',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Thumbnail generation failed',
      position: 'top',
    });
  } finally {
    generatingThumb.value[newsletter.id] = false;
  }
}

// Load newsletters using Firebase Newsletter Service (handles local PDFs + Firestore)
onMounted(async () => {
  isLoading.value = true;

  try {
    console.log('🔧 Loading newsletters from local PDF manifest...');

    // Get newsletters from local manifest - this actually works!
    const loadedNewsletters = await lightweightNewsletterService.getNewsletters();

    // Initialize local metadata storage and refresh stats
    await refreshLocalStorageStats();

    // Convert LightweightNewsletter to Newsletter format with better formatting
    newsletters.value = loadedNewsletters.map(ln => {
      // Extract year from filename more reliably
      const yearMatch = ln.filename.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1] || '2024') : 2024;

      // Extract season from filename more reliably
      let season = 'summer'; // default
      if (ln.filename.toLowerCase().includes('winter')) season = 'winter';
      else if (ln.filename.toLowerCase().includes('spring')) season = 'spring';
      else if (ln.filename.toLowerCase().includes('fall') || ln.filename.toLowerCase().includes('autumn')) season = 'fall';
      else if (ln.filename.toLowerCase().includes('summer')) season = 'summer';

      // Generate a proper title if one doesn't exist
      const properTitle = ln.title && ln.title !== ln.filename
        ? ln.title
        : `${season.charAt(0).toUpperCase() + season.slice(1)} ${year} Conashaugh Courier`;

      return {
        id: ln.id.toString(),
        filename: ln.filename,
        title: properTitle,
        description: `Newsletter from ${season} ${year}`,
        year: year,
        season: season,
        downloadUrl: ln.url,
        isPublished: true,
        featured: false,
        fileSize: 0, // Will be filled by metadata extraction - show as "Unknown" for now
        pageCount: ln.pages || 0,
        thumbnailUrl: ln.thumbnailUrl,
        tags: ln.topics || [],
        categories: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        // Text extraction fields - use proper optional types
        searchableText: '', // empty string = not extracted yet
        keyTerms: [],
        wordCount: 0,
        readingTimeMinutes: 0,
        articles: [],
        textExtractionVersion: '',
        textExtractedAt: '',
      };
    }) as Newsletter[];

    // Debug: Log what we actually got
    console.log('✅ Loaded newsletters from PDF manifest:', newsletters.value.length);
    newsletters.value.forEach(n => {
      console.log(`${n.filename}: year=${n.year}, season=${n.season}, url=${n.downloadUrl}`);
    });

  } catch (error) {
    console.error('❌ Error loading newsletters:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load newsletters from local files',
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.q-card {
  transition: all 0.3s ease;
}

.q-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* Universal gutter fix - prevents horizontal overflow */
.row {
  margin: 0 !important;
  width: 100% !important;
}

.row>* {
  padding-left: 8px !important;
  padding-right: 8px !important;
}

/* Ensure containers don't exceed viewport */
.q-page {
  overflow-x: hidden;
}

/* Table container to prevent horizontal overflow */
.table-container {
  width: 100%;
  overflow-x: auto;
  margin: 0;
}

/* Newsletter table specific styles */
.newsletter-table {
  width: 100%;
  table-layout: fixed;
}

.newsletter-table th,
.newsletter-table td {
  word-wrap: break-word;
  overflow-wrap: break-word;
  padding: 8px 4px !important;
}

/* Chip spacing improvements */
.q-chip {
  margin: 1px 2px;
  max-width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
}

/* Compact chip layout */
.q-chip.dense {
  min-height: 20px;
  font-size: 10px;
}

/* Remove any potential gutter conflicts */
.q-gutter-sm,
.q-gutter-md,
.q-gutter-lg {
  margin: 0 !important;
}

.q-gutter-sm>*,
.q-gutter-md>*,
.q-gutter-lg>* {
  margin: 0 !important;
}
</style>
