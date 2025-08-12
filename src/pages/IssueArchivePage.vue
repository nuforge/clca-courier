<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'
import { usePdfThumbnails } from '../composables/usePdfThumbnails'
import { usePdfViewer } from '../composables/usePdfViewer'
import type { PdfDocument } from '../composables/usePdfViewer'

const siteStore = useSiteStore()
const { getThumbnail, regenerateThumbnail } = usePdfThumbnails()
const { openDocument } = usePdfViewer()

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
  if (archivedIssues.value.length > 0) {
    // Generate thumbnails for all issues
    for (const issue of archivedIssues.value) {
      void loadThumbnail(issue)
    }
  }
})

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

function openIssue(issue: PdfDocument) {
  console.log('IssueArchivePage: openIssue called with:', issue); // Debug log
  openDocument(issue)
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
                  <q-card :class="cardClasses" class="cursor-pointer hover-card" @click="openIssue(issue)">
                    <q-card-section class="text-center">
                      <!-- Thumbnail or placeholder -->
                      <div class="thumbnail-container q-mb-sm">
                        <div v-if="thumbnails[String(issue.id)]" class="thumbnail-wrapper">
                          <q-img :src="thumbnails[String(issue.id)]" :alt="issue.title" class="thumbnail-image"
                            fit="contain" />
                          <q-btn flat dense size="xs" icon="mdi-refresh" color="primary"
                            @click="regenerateIssueThumbnail(issue, $event)" class="thumbnail-refresh-btn"
                            title="Regenerate thumbnail">
                            <q-tooltip>Regenerate thumbnail</q-tooltip>
                          </q-btn>
                        </div>
                        <div v-else-if="loadingThumbnails.has(issue.id)" class="thumbnail-placeholder">
                          <q-spinner color="primary" size="2em" />
                          <div class="text-caption q-mt-sm">Generating thumbnail...</div>
                        </div>
                        <div v-else class="thumbnail-placeholder">
                          <q-icon name="mdi-file-pdf-box" size="3em" color="red-6" />
                          <q-btn flat dense size="sm" icon="mdi-refresh" color="primary"
                            @click="regenerateIssueThumbnail(issue, $event)" class="q-mt-xs" title="Generate thumbnail">
                            <q-tooltip>Generate thumbnail</q-tooltip>
                          </q-btn>
                        </div>
                      </div>

                      <div class="text-weight-medium">{{ issue.title }}</div>
                      <div class="text-caption" :class="greyTextClass">{{ issue.date }}</div>
                      <div class="text-caption q-mt-sm">{{ issue.pages }} pages</div>
                      <q-btn color="primary" label="View PDF" icon="mdi-eye" size="sm" class="q-mt-md"
                        @click.stop="openIssue(issue)" />
                    </q-card-section>
                  </q-card>
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
.hover-card {
  transition: all 0.3s ease;
}

.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.thumbnail-container {
  height: 140px;
  width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin: 0 auto;
}

.thumbnail-wrapper {
  position: relative;
  display: inline-block;
}

.thumbnail-image {
  width: 80px;
  height: 120px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.thumbnail-refresh-btn {
  position: absolute;
  top: -4px;
  right: -4px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  min-height: 20px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.thumbnail-wrapper:hover .thumbnail-refresh-btn {
  opacity: 1;
}

.thumbnail-placeholder {
  height: 120px;
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
</style>
