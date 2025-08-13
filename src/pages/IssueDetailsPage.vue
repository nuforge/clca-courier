<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSiteStore } from '../stores/site-store-simple'
import { usePdfThumbnails } from '../composables/usePdfThumbnails'
import { usePdfViewer } from '../composables/usePdfViewer'
import { useIssueDetails } from '../composables/useIssueDetails'
import type { PdfDocument } from '../composables/usePdfViewer'

const route = useRoute()
const router = useRouter()
const siteStore = useSiteStore()
const { getThumbnail, regenerateThumbnail } = usePdfThumbnails()
const { openDocument } = usePdfViewer()
const { getIssueById, getNextIssue, getPreviousIssue, getRelatedIssues } = useIssueDetails()

const issueId = computed(() => Number(route.params.id))
const issue = ref<PdfDocument | null>(null)
const thumbnail = ref<string>('')
const loadingThumbnail = ref(false)

// Navigation
const nextIssue = computed(() => issue.value ? getNextIssue(issue.value.id) : undefined)
const previousIssue = computed(() => issue.value ? getPreviousIssue(issue.value.id) : undefined)
const relatedIssues = computed(() => issue.value ? getRelatedIssues(issue.value, 3) : [])

// Computed property for card theme classes
const cardClasses = computed(() => {
  if (siteStore.isDarkMode) {
    return 'bg-dark text-white q-dark';
  } else {
    return 'bg-white text-dark';
  }
});

const greyTextClass = computed(() =>
  siteStore.isDarkMode ? 'text-grey-4' : 'text-grey-7'
)

onMounted(() => {
  loadIssueDetails()
})

function loadIssueDetails() {
  // Find the issue in archived issues
  const foundIssue = getIssueById(issueId.value)

  if (foundIssue) {
    issue.value = foundIssue
    void loadThumbnail()
  } else {
    // Issue not found, redirect back to archive
    void router.push('/archive')
  }
}

async function loadThumbnail() {
  if (!issue.value) return

  loadingThumbnail.value = true
  try {
    const thumbnailData = await getThumbnail(issue.value.url)
    if (thumbnailData) {
      thumbnail.value = thumbnailData
    }
  } catch (error) {
    console.error('Failed to load thumbnail:', error)
  } finally {
    loadingThumbnail.value = false
  }
}

async function regenerateIssueThumbnail() {
  if (!issue.value) return

  thumbnail.value = ''
  loadingThumbnail.value = true

  try {
    console.log('Regenerating thumbnail for:', issue.value.title)
    const thumbnailData = await regenerateThumbnail(issue.value.url)
    if (thumbnailData) {
      thumbnail.value = thumbnailData
      console.log('Thumbnail regenerated successfully')
    }
  } catch (error) {
    console.error('Error regenerating thumbnail:', error)
  } finally {
    loadingThumbnail.value = false
  }
}

function openPdfViewer() {
  if (issue.value) {
    openDocument(issue.value)
  }
}

function goBackToArchive() {
  void router.push('/archive')
}

function navigateToIssue(targetIssue: PdfDocument) {
  void router.push(`/archive/${targetIssue.id}`)
}

function formatFileSize(pages: number): string {
  return `${pages} page${pages !== 1 ? 's' : ''}`
}
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <!-- Back Button -->
          <q-btn flat icon="mdi-arrow-left" label="Back to Archive" @click="goBackToArchive" class="q-mb-md"
            :color="siteStore.isDarkMode ? 'white' : 'primary'" />

          <div v-if="issue">
            <!-- Issue Header -->
            <q-card flat :class="cardClasses" class="q-mb-md">
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <!-- Thumbnail Column -->
                  <div class="col-12 col-sm-4 col-md-3">
                    <div class="thumbnail-container">
                      <div v-if="thumbnail" class="large-thumbnail-wrapper">
                        <q-img :src="thumbnail" :alt="issue.title" class="large-thumbnail-image" fit="contain" />
                        <q-btn flat dense size="sm" icon="mdi-refresh" color="primary" @click="regenerateIssueThumbnail"
                          class="thumbnail-refresh-btn" title="Regenerate thumbnail">
                          <q-tooltip>Regenerate thumbnail</q-tooltip>
                        </q-btn>
                      </div>
                      <div v-else-if="loadingThumbnail" class="large-thumbnail-placeholder">
                        <q-spinner color="primary" size="3em" />
                        <div class="text-caption q-mt-sm">Generating thumbnail...</div>
                      </div>
                      <div v-else class="large-thumbnail-placeholder">
                        <q-icon name="mdi-file-pdf-box" size="4em" color="red-6" />
                        <q-btn flat dense size="sm" icon="mdi-refresh" color="primary" @click="regenerateIssueThumbnail"
                          class="q-mt-xs" title="Generate thumbnail">
                          <q-tooltip>Generate thumbnail</q-tooltip>
                        </q-btn>
                      </div>
                    </div>
                  </div>

                  <!-- Details Column -->
                  <div class="col-12 col-sm-8 col-md-9">
                    <div class="text-h4 q-mb-sm">{{ issue.title }}</div>
                    <div class="text-h6 q-mb-md" :class="greyTextClass">{{ issue.date }}</div>

                    <div class="q-mb-lg">
                      <div class="text-body1 q-mb-sm">
                        <q-icon name="mdi-file-document" class="q-mr-xs" />
                        {{ formatFileSize(issue.pages) }}
                      </div>
                      <div class="text-body1 q-mb-sm">
                        <q-icon name="mdi-file" class="q-mr-xs" />
                        {{ issue.filename }}
                      </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="q-gutter-sm">
                      <q-btn color="primary" icon="mdi-eye" label="View PDF" @click="openPdfViewer" unelevated
                        size="lg" />
                      <q-btn color="secondary" icon="mdi-download" label="Download" :href="issue.url" target="_blank"
                        outline />
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- Additional Information -->
            <q-card flat :class="cardClasses" class="q-mb-md">
              <q-card-section>
                <div class="text-h6 q-mb-md">About This Issue</div>
                <q-separator class="q-mb-md" />

                <div class="text-body1">
                  <p>This issue of The Courier contains {{ issue.pages }} pages of community news, updates, and
                    announcements.</p>

                  <div class="q-mt-md">
                    <div class="text-weight-medium q-mb-sm">Quick Actions:</div>
                    <div class="q-gutter-sm">
                      <q-chip clickable @click="openPdfViewer" icon="mdi-eye" color="primary" text-color="white">
                        Open in Viewer
                      </q-chip>
                      <q-chip clickable @click="$router.push('/archive')" icon="mdi-archive" color="secondary"
                        text-color="white">
                        Browse Archive
                      </q-chip>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- Navigation -->
            <q-card flat :class="cardClasses" class="q-mb-md" v-if="nextIssue || previousIssue">
              <q-card-section>
                <div class="text-h6 q-mb-md">Navigation</div>
                <q-separator class="q-mb-md" />

                <div class="row q-col-gutter-md">
                  <div class="col-6" v-if="previousIssue">
                    <q-btn flat icon="mdi-chevron-left" :label="previousIssue.title"
                      @click="navigateToIssue(previousIssue)" class="full-width" align="left">
                      <q-tooltip>Previous Issue</q-tooltip>
                    </q-btn>
                  </div>
                  <div class="col-6" v-if="nextIssue">
                    <q-btn flat icon-right="mdi-chevron-right" :label="nextIssue.title"
                      @click="navigateToIssue(nextIssue)" class="full-width" align="right">
                      <q-tooltip>Next Issue</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- Related Issues -->
            <q-card flat :class="cardClasses" v-if="relatedIssues.length > 0">
              <q-card-section>
                <div class="text-h6 q-mb-md">Other Issues</div>
                <q-separator class="q-mb-md" />

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-4" v-for="relatedIssue in relatedIssues" :key="relatedIssue.id">
                    <q-card flat bordered class="cursor-pointer hover-card" @click="navigateToIssue(relatedIssue)">
                      <q-card-section class="text-center q-pa-sm">
                        <div class="text-weight-medium text-caption">{{ relatedIssue.title }}</div>
                        <div class="text-caption" :class="greyTextClass">{{ relatedIssue.date }}</div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Loading State -->
          <div v-else class="text-center q-pa-xl">
            <q-spinner color="primary" size="2em" />
            <div class="q-mt-md">Loading issue details...</div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.thumbnail-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  max-height: 400px;
  padding: 1rem;
}

.large-thumbnail-wrapper {
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: 100%;
}

.large-thumbnail-image {
  max-width: 200px;
  max-height: 200px;
  min-width: 120px;
  min-height: 160px;
  width: auto;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.large-thumbnail-placeholder {
  min-width: 150px;
  min-height: 200px;
  max-width: 200px;
  max-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border: 2px dashed #ccc;
  border-radius: 8px;
}

.thumbnail-refresh-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
}

.hover-card {
  transition: all 0.3s ease;
}

.hover-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 600px) {
  .large-thumbnail-image {
    max-width: 150px;
    max-height: 150px;
    min-width: 100px;
    min-height: 130px;
  }

  .large-thumbnail-placeholder {
    min-width: 120px;
    min-height: 160px;
    max-width: 150px;
    max-height: 150px;
  }

  .thumbnail-container {
    min-height: 160px;
    max-height: 200px;
  }
}
</style>
