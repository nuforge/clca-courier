<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'
import { usePdfThumbnails } from '../composables/usePdfThumbnails'
import IssueCard from '../components/IssueCard.vue'
import type { PdfDocument } from '../composables/usePdfViewer'

const siteStore = useSiteStore()
const { getThumbnail, regenerateThumbnail } = usePdfThumbnails()

// Computed property for card theme classes
const cardClasses = computed(() => {
  // Use specific classes that ensure proper theming for all child components
  if (siteStore.isDarkMode) {
    return 'bg-dark text-white q-dark';
  } else {
    return 'bg-white text-dark';
  }
});

const greyTextClass = computed(() =>
  siteStore.isDarkMode ? 'text-grey-4' : 'text-grey-7'
)

// Get archived issues from the store
const archivedIssues = computed(() => siteStore.archivedIssues)

const thumbnails = ref<Record<string, string>>({}) // Changed to string keys
const loadingThumbnails = ref<Set<number>>(new Set())

onMounted(() => {
  // Initial load if data is already available
  if (archivedIssues.value.length > 0 && !siteStore.isLoading) {
    for (const issue of archivedIssues.value) {
      void loadThumbnail(issue)
    }
  }
})

// Watch for when data becomes available after async loading
watch(
  () => [archivedIssues.value.length, siteStore.isLoading] as const,
  async ([issuesLength, isLoading]) => {
    // When data is loaded and we have issues, generate thumbnails
    if (issuesLength > 0 && !isLoading) {
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      for (const issue of archivedIssues.value) {
        void loadThumbnail(issue)
      }
    }
  },
  { immediate: true }
)

async function loadThumbnail(issue: PdfDocument) {
  const issueKey = String(issue.id); // Convert to string for consistent key handling
  if (thumbnails.value[issueKey]) return

  loadingThumbnails.value.add(issue.id)

  try {
    const thumbnail = await getThumbnail(issue.url)
    if (thumbnail) {
      thumbnails.value[issueKey] = thumbnail
    }
  } catch (error) {
    console.error('Failed to load thumbnail for', issue.title, error)
  } finally {
    loadingThumbnails.value.delete(issue.id)
  }
}

async function regenerateIssueThumbnail(issue: PdfDocument, event?: Event) {
  if (event) {
    event.stopPropagation(); // Prevent card click
  }

  const issueKey = String(issue.id); // Convert to string for consistent key handling

  // Remove existing thumbnail
  delete thumbnails.value[issueKey];

  // Set loading state
  loadingThumbnails.value.add(issue.id);

  try {
    console.log('Regenerating thumbnail for:', issue.title);
    const thumbnail = await regenerateThumbnail(issue.url);
    if (thumbnail) {
      thumbnails.value[issueKey] = thumbnail;
      console.log('Thumbnail regenerated successfully for:', issue.title);
    } else {
      console.warn('Failed to regenerate thumbnail for:', issue.title);
    }
  } catch (error) {
    console.error('Error regenerating thumbnail for', issue.title, error);
  } finally {
    loadingThumbnails.value.delete(issue.id);
  }
}

</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-archive" class="q-mr-sm" />
                Issue Archive
              </div>
              <p class="text-body1">
                Browse through past issues of The Courier. Access previous newsletters, announcements,
                and community updates from our archive.
              </p>
            </q-card-section>
          </q-card>

          <q-card flat :class="cardClasses">
            <q-card-section>
              <div class="text-h6 q-mb-md">Available Issues</div>
              <q-separator class="q-mb-md" />

              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6 col-md-4" v-for="issue in archivedIssues" :key="issue.id">
                  <IssueCard :issue="issue" :thumbnail="thumbnails[String(issue.id)] || undefined"
                    :is-loading="loadingThumbnails.has(issue.id)" @regenerate-thumbnail="regenerateIssueThumbnail" />
                </div>
              </div>

              <div class="text-center q-mt-lg" v-if="archivedIssues.length === 0">
                <q-icon name="mdi-archive-outline" size="4em" color="grey-5" />
                <div :class="greyTextClass" class="q-mt-md">No archived issues available yet</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
/* Main page styles only - card styles moved to IssueCard component */
</style>
