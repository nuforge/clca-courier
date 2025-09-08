<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'
import { usePdfViewer } from '../composables/usePdfViewer'
import { usePdfThumbnails } from '../composables/usePdfThumbnails'

interface Props {
  mini?: boolean;
}

const { mini = false } = defineProps<Props>();

const siteStore = useSiteStore()
const { openDocument } = usePdfViewer()
const { getThumbnail, regenerateThumbnail } = usePdfThumbnails()

// Get the latest issue from the store
const latestIssue = computed(() => siteStore.latestIssue)

// Thumbnail management
const thumbnail = ref<string | null>(null)
const loadingThumbnail = ref(false)

// Computed styles
const cardClasses = computed(() => {
  if (siteStore.isDarkMode) {
    return 'bg-dark text-white q-dark'
  } else {
    return 'bg-white text-dark'
  }
})

// Load thumbnail for the latest issue
const loadThumbnail = async () => {
  if (!latestIssue.value) {
    console.log('LatestIssueCard: No latest issue available');
    return;
  }

  console.log('LatestIssueCard: Loading thumbnail for:', latestIssue.value.title, 'URL:', latestIssue.value.url);
  loadingThumbnail.value = true
  try {
    const thumbnailData = await getThumbnail(latestIssue.value.url)
    if (thumbnailData) {
      thumbnail.value = thumbnailData
      console.log('LatestIssueCard: Thumbnail loaded successfully for:', latestIssue.value.title);
    } else {
      console.warn('LatestIssueCard: No thumbnail data returned for:', latestIssue.value.title);
    }
  } catch (error) {
    console.error('LatestIssueCard: Failed to load thumbnail for latest issue:', error)
  } finally {
    loadingThumbnail.value = false
  }
}

// Open the latest issue in the PDF viewer
const openLatestIssue = () => {
  if (latestIssue.value) {
    void openDocument(latestIssue.value)
  }
}

// Manual thumbnail refresh for debugging
const refreshThumbnail = async (event?: Event) => {
  if (event) {
    event.stopPropagation(); // Prevent card click
  }

  if (!latestIssue.value) return;

  console.log('LatestIssueCard: Manual thumbnail refresh triggered');
  thumbnail.value = null; // Clear current thumbnail
  loadingThumbnail.value = true;

  try {
    const thumbnailData = await regenerateThumbnail(latestIssue.value.url);
    if (thumbnailData) {
      thumbnail.value = thumbnailData;
      console.log('LatestIssueCard: Manual refresh successful');
    }
  } catch (error) {
    console.error('LatestIssueCard: Manual refresh failed:', error);
  } finally {
    loadingThumbnail.value = false;
  }
}

// Load thumbnail when component mounts or when latest issue becomes available
onMounted(() => {
  // Initial load if data is already available
  if (latestIssue.value && !siteStore.isLoading) {
    void loadThumbnail()
  }
})

// Watch for when the latest issue becomes available after async loading
watch(
  () => [latestIssue.value, siteStore.isLoading] as const,
  async ([issue, isLoading]) => {
    console.log('LatestIssueCard watcher triggered:', {
      hasIssue: !!issue,
      isLoading,
      issueTitle: issue?.title
    });

    // When we have an issue and data is loaded, generate thumbnail
    if (issue && !isLoading) {
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('LatestIssueCard: Triggering thumbnail load from watcher');
      void loadThumbnail()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div v-if="latestIssue">
    <!-- Mini version - just an icon -->
    <div v-if="mini" class="mini-latest-issue cursor-pointer text-center q-pa-sm" @click="openLatestIssue">
      <q-tooltip class="bg-primary text-white" anchor="center right" self="center left" :offset="[10, 0]">
        <div class="text-body2">{{ latestIssue.title }}</div>
        <div class="text-caption">Latest Issue</div>
      </q-tooltip>
      <q-icon name="mdi-newspaper-variant" size="1.8em" color="primary" />
    </div>

    <!-- Full version -->
    <q-card v-else flat :class="cardClasses" class="cursor-pointer q-mb-md latest-issue-card" dark
      @click="openLatestIssue">
      <q-card-section class="text-center q-pa-md bg-primary text-white ">
        <div class="header-container q-mb-md">
          <span class="text-h5">Latest Issue</span>
          <q-space />
          <span class="q-ml-sm">{{ latestIssue.title }}</span>
        </div>

        <!-- Thumbnail -->
        <div class="text-center thumbnail-container">
          <div v-if="thumbnail" class="thumbnail-wrapper">
            <img :src="thumbnail" :alt="latestIssue.title" class="rounded shadow-2"
              style="max-height: 160px; max-width: 200px; object-fit: contain;" />
            <q-btn flat dense size="xs" icon="mdi-refresh" color="white" @click="refreshThumbnail($event)"
              class="thumbnail-refresh-btn" title="Regenerate thumbnail">
              <q-tooltip>Regenerate thumbnail</q-tooltip>
            </q-btn>
          </div>
          <div v-else-if="loadingThumbnail" class="thumbnail-placeholder">
            <q-spinner color="white" size="2em" />
            <div class="text-caption q-mt-sm">Loading...</div>
          </div>
          <div v-else class="thumbnail-placeholder">
            <q-icon name="mdi-file-pdf-box" size="3em" color="red-6" />
            <q-btn flat dense size="sm" icon="mdi-refresh" color="white" @click="refreshThumbnail($event)"
              class="q-mt-xs" title="Generate thumbnail">
              <q-tooltip>Generate thumbnail</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>


<style lang="scss" scoped>
.latest-issue-card {
  transition: all 0.3s ease;
  border-radius: 10px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  display: inline-block;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.mini-latest-issue {
  transition: all 0.3s ease;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;

  &:hover {
    background-color: rgba(var(--q-primary-rgb), 0.1);
    transform: scale(1.1);
  }
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.thumbnail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 100px;
}

.thumbnail-container {
  position: relative;
  display: inline-block;
}

.thumbnail-wrapper {
  position: relative;
  display: inline-block;
}

.thumbnail-refresh-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  min-height: 24px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.thumbnail-wrapper:hover .thumbnail-refresh-btn {
  opacity: 1;
}
</style>
