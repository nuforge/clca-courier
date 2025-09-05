<!-- Enhanced issue details page with local/Firebase support -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSiteStore } from '../stores/site-store-simple'
import { usePdfViewer } from '../composables/usePdfViewer'
import type { PdfDocument } from '../composables/usePdfViewer'

const route = useRoute()
const router = useRouter()
const siteStore = useSiteStore()
const { openDocument } = usePdfViewer()

// State
const issue = ref<PdfDocument | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Get issue ID from route
const issueId = computed(() => parseInt(route.params.id as string))

// Computed properties
const nextIssue = computed(() => {
  if (!issue.value) return null
  const issues = siteStore.archivedIssues
  const currentIndex = issues.findIndex((i: PdfDocument) => i.id === issue.value!.id)
  return currentIndex < issues.length - 1 ? issues[currentIndex + 1] : null
})

const previousIssue = computed(() => {
  if (!issue.value) return null
  const issues = siteStore.archivedIssues
  const currentIndex = issues.findIndex((i: PdfDocument) => i.id === issue.value!.id)
  return currentIndex > 0 ? issues[currentIndex - 1] : null
})

const relatedIssues = computed(() => {
  if (!issue.value) return []
  return siteStore.archivedIssues
    .filter((i: PdfDocument) => i.id !== issue.value!.id)
    .slice(0, 3)
})

// Navigation helpers
const canNavigateNext = computed(() => nextIssue.value !== null)
const canNavigatePrevious = computed(() => previousIssue.value !== null)

// Methods
const loadIssueData = () => {
  try {
    isLoading.value = true
    error.value = null

    // Find the issue in the archived issues
    const foundIssue = siteStore.archivedIssues.find((i: PdfDocument) => i.id === issueId.value)

    if (foundIssue) {
      issue.value = foundIssue
    } else {
      error.value = 'Issue not found'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load issue'
  } finally {
    isLoading.value = false
  }
}

const openPdf = () => {
  if (issue.value) {
    openDocument(issue.value)
  }
}

function navigateToIssue(targetIssue: PdfDocument) {
  void router.push(`/issues/${targetIssue.id}`)
}

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

// Lifecycle
onMounted(() => {
  void loadIssueData()
})

// Watch for route changes
watch(() => route.params.id, () => {
  void loadIssueData()
}, { immediate: false }) // Changed to false since onMounted will call it initially
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <!-- Loading State -->
        <q-card v-if="isLoading" flat class="text-center q-pa-xl">
          <q-spinner-dots color="primary" size="3em" />
          <div class="text-h6 q-mt-md text-grey-6">Loading issue details...</div>
        </q-card>

        <!-- Error State -->
        <q-card v-else-if="error" flat class="text-center q-pa-xl bg-red-1">
          <q-icon name="error" color="red" size="3em" />
          <div class="text-h6 q-mt-md text-red-8">{{ error }}</div>
          <q-btn
            flat
            color="primary"
            label="Back to Archive"
            @click="router.push('/archive')"
            class="q-mt-md"
          />
        </q-card>

        <!-- Issue Details -->
        <q-card v-else-if="issue" flat class="q-mb-lg">
          <q-card-section>
            <!-- Header -->
            <div class="row items-center q-mb-lg">
              <div class="col">
                <h1 class="text-h4 q-my-none">{{ issue.title || issue.filename }}</h1>
                <div class="text-subtitle1 text-grey-6 q-mt-sm">
                  <q-icon name="event" class="q-mr-xs" />
                  {{ formatDate(issue.date) }}
                </div>
              </div>
              <div class="col-auto">
                <q-btn
                  color="primary"
                  icon="picture_as_pdf"
                  label="Open PDF"
                  @click="openPdf"
                  unelevated
                  class="q-ml-md"
                />
              </div>
            </div>

            <!-- Navigation -->
            <div class="row q-gutter-sm q-mb-lg">
              <q-btn
                v-if="canNavigatePrevious"
                flat
                color="primary"
                icon="chevron_left"
                label="Previous"
                @click="navigateToIssue(previousIssue!)"
              />
              <q-space />
              <q-btn
                flat
                color="primary"
                label="Back to Archive"
                icon="arrow_back"
                @click="router.push('/archive')"
              />
              <q-space />
              <q-btn
                v-if="canNavigateNext"
                flat
                color="primary"
                icon-right="chevron_right"
                label="Next"
                @click="navigateToIssue(nextIssue!)"
              />
            </div>

            <!-- Issue Information -->
            <div class="row q-gutter-md">
              <div class="col-12 col-md-6">
                <q-list bordered separator>
                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="description" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Filename</q-item-label>
                      <q-item-label caption>{{ issue.filename }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="event" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Date</q-item-label>
                      <q-item-label caption>{{ formatDate(issue.date) }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="issue.pages">
                    <q-item-section avatar>
                      <q-icon name="pages" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Pages</q-item-label>
                      <q-item-label caption>{{ issue.pages }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <div class="col-12 col-md-6">
                <q-card flat bordered class="bg-grey-1">
                  <q-card-section>
                    <div class="text-h6 q-mb-md">Quick Actions</div>
                    <div class="q-gutter-sm">
                      <q-btn
                        color="primary"
                        icon="picture_as_pdf"
                        label="View PDF"
                        @click="openPdf"
                        outline
                        block
                      />
                      <q-btn
                        color="secondary"
                        icon="download"
                        label="Download"
                        :href="issue.url"
                        target="_blank"
                        outline
                        block
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Related Issues -->
        <q-card v-if="relatedIssues.length > 0" flat>
          <q-card-section>
            <div class="text-h6 q-mb-md">Related Issues</div>
            <div class="row q-gutter-md">
              <div
                v-for="relatedIssue in relatedIssues"
                :key="relatedIssue.id"
                class="col-12 col-md-4"
              >
                <q-card
                  flat
                  bordered
                  class="cursor-pointer transition-all"
                  @click="navigateToIssue(relatedIssue)"
                >
                  <q-card-section>
                    <div class="text-subtitle1">{{ relatedIssue.title || relatedIssue.filename }}</div>
                    <div class="text-caption text-grey-6">{{ formatDate(relatedIssue.date) }}</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.transition-all {
  transition: all 0.3s ease;
}

.transition-all:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
