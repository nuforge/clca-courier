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
          class="rounded-borders newsletter-thumbnail" loading="lazy" fit="cover" :ratio="1 / 1.4"
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
          <div class="row items-center q-gutter-xs wrap">
            <div class="flex items-center no-wrap">
              <q-icon name="description" size="sm" class="q-mr-xs" />
              <span class="text-nowrap">{{ newsletter.pages }} pages</span>
            </div>

            <template v-if="newsletter.fileSize">
              <q-separator vertical inset />
              <div class="flex items-center no-wrap">
                <q-icon name="storage" size="sm" class="q-mr-xs" />
                <span class="text-nowrap">{{ newsletter.fileSize }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Source indicators and content type as chips -->
      <div class="row q-gutter-xs q-mt-sm wrap" v-if="Object.keys(sources).length > 0 || newsletter.contentType">
        <!-- Content Type Badge -->
        <q-chip :color="contentTypeColor" :label="newsletter.contentType || 'newsletter'" size="sm" text-color="white"
          dense outline class="q-my-none">
        </q-chip>

        <q-chip v-if="sources.local" icon="computer" size="sm" color="positive" text-color="white" dense outline
          class="q-my-none">
          Local
        </q-chip>

        <q-chip v-if="sources.drive" icon="cloud" size="sm" color="info" text-color="white" dense outline
          class="q-my-none">
          Drive
        </q-chip>

        <q-chip v-if="sources.hybrid" icon="sync" size="sm" color="secondary" text-color="white" dense outline
          class="q-my-none">
          Hybrid
        </q-chip>
      </div>
    </q-card-section>

    <!-- Spacer to push actions to bottom -->
    <q-space />

    <!-- Actions -->
    <q-card-actions class="q-pa-md">
      <div class="full-width">
        <div class="row q-gutter-xs">
          <!-- Web View Button -->
          <q-btn unelevated icon="visibility" color="primary" @click="openWebViewer" :loading="loading.webView"
            class="col">
            <q-tooltip>View in web browser</q-tooltip>
          </q-btn>

          <!-- Download Button -->
          <q-btn unelevated icon="download" color="secondary" @click="downloadNewsletter" :loading="loading.download"
            class="col">
            <q-tooltip>Download high-quality PDF</q-tooltip>
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
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="source" color="primary" text-color="white" />
          <span class="q-ml-sm text-h6">Available Sources</span>
        </q-card-section>

        <q-card-section>
          <q-list>
            <q-item v-for="source in availableSources" :key="source.type"
              :class="{ 'bg-green-1': source.available, 'bg-grey-1': !source.available }">
              <q-item-section avatar>
                <q-icon :name="getSourceIcon(source.type)" :color="source.available ? 'positive' : 'grey'" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ capitalizeFirst(source.type) }} Source</q-item-label>
                <q-item-label caption>
                  {{ source.available ? 'Available' : 'Unavailable' }}
                  {{ source.lastChecked ? `• Checked ${formatTime(source.lastChecked)}` : '' }}
                </q-item-label>
              </q-item-section>
              <q-item-section side v-if="source.available">
                <q-btn flat round icon="open_in_new" size="sm" @click="openSource(source)" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
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
            <div><strong>Date:</strong> {{ formatDate(newsletter.date) }}</div>
            <div><strong>Pages:</strong> {{ newsletter.pages }}</div>
            <div><strong>Filename:</strong> {{ newsletter.filename }}</div>
            <div v-if="newsletter.publishDate">
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

interface Props {
  newsletter: NewsletterMetadata;
}

const props = defineProps<Props>();
const $q = useQuasar();
const hybridNewsletters = useHybridNewsletters();
const pdfViewer = usePdfViewer();

// Local state
const showSourcesDialog = ref(false);
const showDetails = ref(false);
const availableSources = ref<NewsletterSource[]>([]);
const loading = reactive({
  webView: false,
  download: false,
  sources: false,
  drive: false
});

// Computed properties
const sources = reactive({
  local: false,
  drive: false,
  hybrid: false
});

const contentTypeColor = computed(() => {
  switch (props.newsletter.contentType) {
    case 'annual': return 'orange';
    case 'special': return 'purple';
    default: return 'primary';
  }
});

// Methods
const loadSources = async () => {
  try {
    loading.sources = true;
    availableSources.value = await hybridNewsletters.getNewsletterSources(props.newsletter);

    // Update source indicators
    sources.local = await hybridNewsletters.hasLocalSource(props.newsletter);
    sources.drive = await hybridNewsletters.hasDriveSource(props.newsletter);
    sources.hybrid = await hybridNewsletters.hasHybridSources(props.newsletter);
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
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getSourceIcon = (type: string) => {
  switch (type) {
    case 'local': return 'computer';
    case 'drive': return 'cloud';
    case 'hybrid': return 'sync';
    default: return 'source';
  }
};

const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Lifecycle
onMounted(() => {
  void loadSources();
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

/* Responsive adjustments */
@media (max-width: 600px) {
  .newsletter-card {
    min-height: 350px;
  }
}
</style>
