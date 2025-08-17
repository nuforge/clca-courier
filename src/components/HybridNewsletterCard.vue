<template>
  <q-card class="newsletter-card full-height" flat>
    <!-- Header with title and date -->
    <q-card-section class="q-pb-sm">
      <div class="row items-start justify-between">
        <div class="col-12">
          <div class="text-h6 q-mb-xs line-clamp-2 text-break">{{ newsletter.title }}</div>
          <div class="text-subtitle2 text-grey-6">
            {{ formatDate(newsletter.date) }}
          </div>
        </div>
      </div>
    </q-card-section>

    <!-- Thumbnail preview with tall aspect ratio -->
    <q-card-section v-if="newsletter.thumbnailPath" class="q-pa-sm">
      <div class="thumbnail-container">
        <q-img :src="newsletter.thumbnailPath" :alt="`${newsletter.title} cover`"
          class="rounded-borders newsletter-thumbnail" loading="lazy" fit="cover" :ratio="1 / 1.3"
          @error="onThumbnailError" @click="openWebViewer">
          <template v-slot:error>
            <div class="absolute-full flex flex-center bg-grey-3 text-grey-7 column">
              <q-icon name="description" size="2rem" />
              <div class="text-caption q-mt-sm">PDF Cover</div>
            </div>
          </template>

          <!-- Hover overlay -->
          <div class="absolute-full newsletter-overlay flex flex-center">
            <q-btn round color="primary" icon="visibility" size="lg" class="overlay-btn">
              <q-tooltip>View Newsletter</q-tooltip>
            </q-btn>
          </div>
        </q-img>
      </div>
    </q-card-section>

    <!-- Newsletter metadata -->
    <q-card-section class="q-py-sm">
      <div class="row items-center justify-between text-body2 text-grey-7">
        <div class="col-12">
          <div class="row items-center q-gutter-md">
            <div v-if="validPageCount" class="flex items-center no-wrap">
              <q-icon name="description" size="sm" class="q-mr-xs" />
              <span class="text-nowrap">{{ validPageCount }} pages</span>
            </div>

            <div v-if="displayFileSize" class="flex items-center no-wrap">
              <q-icon name="storage" size="sm" class="q-mr-xs" />
              <span class="text-nowrap">{{ displayFileSize }}</span>
            </div>

            <!-- Loading indicator for metadata -->
            <div v-if="loading.metadata" class="flex items-center no-wrap">
              <q-spinner-dots size="sm" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Loading info...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Source indicators -->
      <div class="row q-gutter-xs q-mt-sm items-center" v-if="Object.keys(sources).length > 0">
        <!-- Source Indicators -->
        <div class="q-gutter-xs">
          <!-- Local Source Available -->
          <q-chip v-if="sources.local" icon="computer" size="sm" color="primary" text-color="white" dense outline
            class="q-my-none">
            <q-tooltip>Available locally for fast web viewing</q-tooltip>
            Local
          </q-chip>

          <!-- Google Drive Source Available -->
          <q-chip v-if="sources.drive" icon="cloud" size="sm" color="secondary" text-color="white" dense outline
            class="q-my-none">
            <q-tooltip>Available from Google Drive archive</q-tooltip>
            Drive
          </q-chip>
        </div>
      </div>
    </q-card-section>

    <!-- Spacer to push actions to bottom -->
    <q-space />

    <!-- Actions -->
    <q-card-actions class="q-pa-md">
      <div class="full-width">
        <div class="row q-gutter-xs">
          <!-- Web View Button - Only show if local source is available -->
          <q-btn v-if="sources.local" unelevated icon="visibility" color="primary" @click="openWebViewer"
            :loading="loading.webView" class="col">
            <q-tooltip>View in web browser (Local)</q-tooltip>
          </q-btn>

          <!-- Download Button - Only show if drive source is available -->
          <q-btn v-if="sources.drive" unelevated icon="download" color="secondary" @click="downloadNewsletter"
            :loading="loading.download" class="col">
            <q-tooltip>Download high-quality PDF (Google Drive)</q-tooltip>
          </q-btn>

          <!-- More Options Menu -->
          <q-btn-dropdown unelevated icon="more_vert" color="grey-7" dropdown-icon="" auto-close class="col-auto">
            <q-list>
              <!-- View in Drive (if available) -->
              <q-item v-if="sources.drive" clickable @click="openInDrive" :disable="loading.drive">
                <q-item-section avatar>
                  <q-icon name="open_in_new" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>View in Drive</q-item-label>
                  <q-item-label caption>Open original in Google Drive</q-item-label>
                </q-item-section>
              </q-item>

              <!-- View Sources -->
              <q-item clickable @click="showSourcesDialog = true">
                <q-item-section avatar>
                  <q-icon name="source" :color="$q.dark.isActive ? 'grey-4' : 'grey-7'" />
                </q-item-section>
                <q-item-section>
                  <q-item-label :class="$q.dark.isActive ? 'text-grey-3' : 'text-grey-8'">View
                    Sources</q-item-label>
                  <q-item-label caption :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-6'">Show
                    all
                    available sources</q-item-label>
                </q-item-section>
              </q-item>

              <!-- Copy Link -->
              <q-item clickable @click="copyLink">
                <q-item-section avatar>
                  <q-icon name="link" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Copy Link</q-item-label>
                  <q-item-label caption>Copy shareable URL</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <!-- Newsletter Details -->
              <q-item clickable @click="showDetails = true">
                <q-item-section avatar>
                  <q-icon name="info" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Details</q-item-label>
                  <q-item-label caption>View metadata and info</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>
    </q-card-actions>

    <!-- Sources Dialog -->
    <q-dialog v-model="showSourcesDialog">
      <q-card :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark'" class="q-pa-md"
        style="min-width: 350px; max-width: 500px;">
        <q-card-section class="q-pb-md">
          <div class="text-h6 text-primary q-mb-md">Available Sources</div>
          <div class="column q-gutter-md">
            <div v-for="source in availableSources" :key="source.type" v-show="source.available"
              :class="$q.dark.isActive ? 'bg-grey-8 shadow-2' : 'bg-grey-2 shadow-1'"
              class="flex items-center justify-between q-pa-md rounded-borders">
              <div class="flex items-center">
                <q-icon :name="getSourceIcon(source.type)" :color="source.type === 'local' ? 'primary' : 'secondary'"
                  size="md" class="q-mr-md" />
                <div class="column">
                  <span class="text-subtitle1 text-weight-medium">
                    {{ source.type === 'local' ? 'Local File' : 'Google Drive' }}
                  </span>
                  <span :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'" class="text-caption">
                    {{ getSourceDescription(source.type) }}
                  </span>
                </div>
              </div>
              <q-btn unelevated :color="source.type === 'local' ? 'primary' : 'secondary'"
                :icon="source.type === 'local' ? 'visibility' : 'download'"
                :label="source.type === 'local' ? 'View' : 'Download'" @click="openSource(source)" />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pt-none">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Details Dialog -->
    <q-dialog v-model="showDetails">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="info" color="primary" text-color="white" />
          <span class="q-ml-sm text-h6">Newsletter Details</span>
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-sm">
            <div><strong>Title:</strong> {{ newsletter.title }}</div>
            <div v-if="validDate"><strong>Date:</strong> {{ formatDate(newsletter.date) }}</div>
            <div v-if="validPageCount"><strong>Pages:</strong> {{ validPageCount }}</div>
            <div><strong>Filename:</strong> {{ newsletter.filename }}</div>
            <div v-if="displayFileSize"><strong>File Size:</strong> {{ displayFileSize }}</div>
            <div v-if="newsletter.publishDate && formatDate(newsletter.publishDate)">
              <strong>Published:</strong> {{ formatDate(newsletter.publishDate) }}
            </div>
            <div v-if="newsletter.topics?.length">
              <strong>Topics:</strong> {{ newsletter.topics.join(', ') }}
            </div>
            <div v-if="newsletter.tags?.length">
              <strong>Tags:</strong> {{ newsletter.tags.join(', ') }}
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import type { NewsletterMetadata, NewsletterSource } from '../services/newsletter-service';
import { useHybridNewsletters } from '../composables/useHybridNewsletters';
import { usePdfViewer } from '../composables/usePdfViewer';
import { usePdfMetadata } from '../composables/usePdfMetadata';

interface Props {
  newsletter: NewsletterMetadata;
}

const props = defineProps<Props>();
const $q = useQuasar();
const hybridNewsletters = useHybridNewsletters();
const pdfViewer = usePdfViewer();
const { getPageCount, getFileSize } = usePdfMetadata();

// Local state
const showSourcesDialog = ref(false);
const showDetails = ref(false);
const availableSources = ref<NewsletterSource[]>([]);
const livePageCount = ref<number | null>(null);
const liveFileSize = ref<string | null>(null);
const loading = reactive({
  webView: false,
  download: false,
  sources: false,
  drive: false,
  metadata: false
});

// Computed properties
const sources = reactive({
  local: false,
  drive: false
});

const validPageCount = computed(() => {
  // Use live page count if available, otherwise fall back to static data
  const pageCount = livePageCount.value || props.newsletter.pages;
  return pageCount && pageCount > 0 ? pageCount : null;
});

const displayFileSize = computed(() => {
  // Use live file size if available, otherwise fall back to static data
  return liveFileSize.value || props.newsletter.fileSize;
});

const validDate = computed(() => {
  if (!props.newsletter.date) return false;
  const date = new Date(props.newsletter.date);
  return !isNaN(date.getTime());
});

const getSourceDescription = computed(() => (sourceType: string) => {
  return sourceType === 'local'
    ? 'Fast web viewing with interactive features'
    : 'High-quality archive download';
});

// Methods
const loadLiveMetadata = async () => {
  // Try to get a URL for metadata extraction
  let pdfUrl: string | null = null;

  // Get web view URL from the hybrid newsletters service
  try {
    pdfUrl = await hybridNewsletters.getWebViewUrl(props.newsletter);
  } catch (error) {
    console.log('Could not get web view URL for metadata extraction:', error);
  }

  // Fallback to constructing URL from local file
  if (!pdfUrl && props.newsletter.localFile) {
    pdfUrl = `/issues/${props.newsletter.localFile}`;
  }

  // Only proceed if we have a URL and don't already have live data
  if (pdfUrl && (!livePageCount.value || !liveFileSize.value)) {
    try {
      loading.metadata = true;

      // Load page count and file size concurrently
      const [pageCount, fileSize] = await Promise.all([
        livePageCount.value ? Promise.resolve(livePageCount.value) : getPageCount(pdfUrl),
        liveFileSize.value ? Promise.resolve(liveFileSize.value) : getFileSize(pdfUrl)
      ]);

      if (pageCount !== null && !livePageCount.value) {
        livePageCount.value = pageCount;
      }

      if (fileSize !== null && !liveFileSize.value) {
        liveFileSize.value = fileSize;
      }
    } catch (error) {
      console.log('Could not load live metadata for', props.newsletter.title, ':', error);

      // For Google Drive files that fail metadata extraction, this is expected behavior
      // due to CORS restrictions. Don't treat this as a critical error.
      if (pdfUrl && pdfUrl.includes('drive.google.com')) {
        console.log('Metadata loading failed for Google Drive file - this is expected due to CORS restrictions when not authenticated');
      }
    } finally {
      loading.metadata = false;
    }
  }
};

const loadSources = async () => {
  try {
    loading.sources = true;
    availableSources.value = await hybridNewsletters.getNewsletterSources(props.newsletter);

    // Update source indicators
    sources.local = await hybridNewsletters.hasLocalSource(props.newsletter);
    sources.drive = await hybridNewsletters.hasDriveSource(props.newsletter);
  } catch (error) {
    console.error('Error loading sources:', error);
  } finally {
    loading.sources = false;
  }
};

const openWebViewer = async () => {
  try {
    loading.webView = true;
    const webUrl = await hybridNewsletters.getWebViewUrl(props.newsletter);

    if (webUrl) {
      // Use the existing PDF viewer
      pdfViewer.openDocument({
        ...props.newsletter,
        url: webUrl
      });
    } else {
      $q.notify({
        type: 'negative',
        message: 'Newsletter not available for viewing'
      });
    }
  } catch (error) {
    console.error('Error opening web viewer:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to open newsletter'
    });
  } finally {
    loading.webView = false;
  }
};

const downloadNewsletter = async () => {
  try {
    loading.download = true;
    const downloadUrl = await hybridNewsletters.getDownloadUrl(props.newsletter);

    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      $q.notify({
        type: 'positive',
        message: 'Download started'
      });
    } else {
      $q.notify({
        type: 'negative',
        message: 'Download not available'
      });
    }
  } catch (error) {
    console.error('Error downloading newsletter:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to download newsletter'
    });
  } finally {
    loading.download = false;
  }
};

const openInDrive = () => {
  try {
    loading.drive = true;
    // Find the Google Drive URL from available sources
    const driveSource = availableSources.value.find(s => s.type === 'drive' && s.available);

    if (driveSource) {
      window.open(driveSource.url, '_blank');
      $q.notify({
        type: 'positive',
        message: 'Opening in Google Drive'
      });
    } else if (props.newsletter.driveUrl) {
      // Fallback to newsletter's drive URL
      window.open(props.newsletter.driveUrl, '_blank');
      $q.notify({
        type: 'positive',
        message: 'Opening in Google Drive'
      });
    } else {
      $q.notify({
        type: 'negative',
        message: 'Google Drive link not available'
      });
    }
  } catch (error) {
    console.error('Error opening in Drive:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to open in Google Drive'
    });
  } finally {
    loading.drive = false;
  }
};

const copyLink = async () => {
  try {
    const webUrl = await hybridNewsletters.getWebViewUrl(props.newsletter);
    if (webUrl) {
      await navigator.clipboard.writeText(window.location.origin + webUrl);
      $q.notify({
        type: 'positive',
        message: 'Link copied to clipboard'
      });
    }
  } catch (error) {
    console.error('Error copying link:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to copy link'
    });
  }
};

const openSource = (source: NewsletterSource) => {
  window.open(source.url, '_blank');
  showSourcesDialog.value = false;
};

const onThumbnailError = () => {
  console.warn(`Thumbnail not found: ${props.newsletter.thumbnailPath}`);
};

// Utility functions
const formatDate = (dateStr: string) => {
  if (!dateStr) return null;

  try {
    // First try to parse filename format: YYYY.MM-conashaugh-courier.pdf
    const filenameMatch = dateStr.match(/(\d{4})\.(\d{2})-/);
    if (filenameMatch && filenameMatch[1] && filenameMatch[2]) {
      const year = parseInt(filenameMatch[1]);
      const month = parseInt(filenameMatch[2]);
      const date = new Date(year, month - 1, 1);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });
      }
    }

    // Fallback to standard date parsing
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return null;
  }
};

const getSourceIcon = (type: string) => {
  switch (type) {
    case 'local': return 'computer';
    case 'drive': return 'cloud';
    case 'hybrid': return 'sync';
    default: return 'source';
  }
};

// Lifecycle
onMounted(async () => {
  await loadSources();
  // Load live metadata after sources are loaded
  await loadLiveMetadata();
});
</script>

<style scoped>
.newsletter-card {
  transition: all 0.3s ease;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}

.newsletter-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.9);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
  max-height: calc(1.3em * 2);
  word-break: break-word;
  hyphens: auto;
}

.text-break {
  word-break: break-word;
  overflow-wrap: break-word;
}

.text-nowrap {
  white-space: nowrap;
}

.no-wrap {
  flex-wrap: nowrap;
}

.wrap {
  flex-wrap: wrap;
}

.thumbnail-container {
  position: relative;
  width: 100%;
}

.newsletter-thumbnail {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
}

.newsletter-thumbnail:hover {
  transform: scale(1.02);
}

.newsletter-overlay {
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: all 0.3s ease;
  backdrop-filter: blur(2px);
}

.newsletter-thumbnail:hover .newsletter-overlay {
  opacity: 1;
}

.overlay-btn {
  transform: scale(0.9);
  transition: all 0.3s ease;
}

.newsletter-thumbnail:hover .overlay-btn {
  transform: scale(1);
}

/* Dark mode adjustments */
body.body--dark .newsletter-card {
  background: rgba(0, 0, 0, 0.6);
}

body.body--dark .newsletter-card:hover {
  background: rgba(0, 0, 0, 0.8);
}

body.body--dark .newsletter-overlay {
  background: rgba(255, 255, 255, 0.1);
}

/* Gradient banner styles */
.bg-gradient-to-r {
  background: linear-gradient(to right, var(--q-secondary), var(--q-primary));
}

.from-secondary {
  --gradient-from-color: var(--q-secondary);
}

.to-primary {
  --gradient-to-color: var(--q-primary);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .newsletter-card {
    min-height: 350px;
  }
}
</style>
