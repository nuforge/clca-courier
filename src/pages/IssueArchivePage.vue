<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useSiteStore } from '../stores/site-store-simple'
import { usePdfThumbnails } from '../composables/usePdfThumbnails'
import PdfViewer from '../components/PdfViewer.vue'
import type { WebViewerInstance } from '@pdftron/webviewer'

const $q = useQuasar()
const siteStore = useSiteStore()
const { getThumbnail } = usePdfThumbnails()

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

interface ArchivedIssue {
  id: number
  title: string
  date: string
  pages: number
  url: string
  filename: string
}

const archivedIssues = ref<ArchivedIssue[]>([
  {
    id: 1,
    title: 'July 2025 Edition',
    date: 'July 2025',
    pages: 12,
    url: '/issues/7.2025.pdf',
    filename: '7.2025.pdf'
  },
  {
    id: 2,
    title: 'June 2025 Edition',
    date: 'June 2025',
    pages: 10,
    url: '/issues/Courier - 2025.06 - June.pdf',
    filename: 'Courier - 2025.06 - June.pdf'
  }
])

const selectedIssue = ref<ArchivedIssue | null>(null)
const showViewer = ref(false)
const pdfViewerRef = ref<InstanceType<typeof PdfViewer> | null>(null)
const thumbnails = ref<Record<number, string>>({})
const loadingThumbnails = ref<Set<number>>(new Set())

onMounted(() => {
  if (archivedIssues.value.length > 0) {
    selectedIssue.value = archivedIssues.value[0] || null

    // Generate thumbnails for all issues
    for (const issue of archivedIssues.value) {
      void loadThumbnail(issue)
    }
  }
})

async function loadThumbnail(issue: ArchivedIssue) {
  if (thumbnails.value[issue.id]) return

  loadingThumbnails.value.add(issue.id)

  try {
    const thumbnail = await getThumbnail(issue.url)
    if (thumbnail) {
      thumbnails.value[issue.id] = thumbnail
    }
  } catch (error) {
    console.error('Failed to load thumbnail for', issue.title, error)
  } finally {
    loadingThumbnails.value.delete(issue.id)
  }
}

function openIssue(issue: ArchivedIssue) {
  selectedIssue.value = issue
  showViewer.value = true
}

function switchDocument(issue: ArchivedIssue) {
  if (selectedIssue.value?.id !== issue.id) {
    selectedIssue.value = issue
    if (pdfViewerRef.value) {
      pdfViewerRef.value.loadDocument(issue.url)
    }
  }
}

function closeViewer() {
  showViewer.value = false
}

function onPdfViewerReady(instance: WebViewerInstance) {
  console.log('PDF Viewer ready:', instance)
}

function onPdfViewerError(error: string) {
  $q.notify({
    message: 'Error loading PDF viewer',
    caption: error,
    type: 'negative',
    icon: 'mdi-alert'
  })
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

          <!-- PDF Viewer Dialog -->
          <q-dialog v-model="showViewer" maximized>
            <q-card>
              <q-toolbar class="bg-primary">
                <q-toolbar-title>
                  <q-icon name="mdi-file-pdf-box" class="q-mr-sm" />
                  {{ selectedIssue?.title }}
                </q-toolbar-title>

                <!-- Document switcher -->
                <q-btn-dropdown color="white" text-color="primary" label="Switch Document" icon="mdi-swap-horizontal"
                  class="q-mr-md">
                  <q-list>
                    <q-item v-for="issue in archivedIssues" :key="issue.id" clickable v-close-popup
                      @click="switchDocument(issue)" :class="{ 'bg-grey-2': selectedIssue?.id === issue.id }">
                      <q-item-section>
                        <q-item-label>{{ issue.title }}</q-item-label>
                        <q-item-label caption>{{ issue.date }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>

                <q-btn flat icon="mdi-close" @click="closeViewer" />
              </q-toolbar>

              <q-card-section class="q-pa-none" style="height: calc(100vh - 50px);">
                <PdfViewer v-if="selectedIssue" ref="pdfViewerRef" :document-url="selectedIssue.url"
                  @ready="onPdfViewerReady" @error="onPdfViewerError" />
              </q-card-section>
            </q-card>
          </q-dialog>

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
                        <q-img v-if="thumbnails[issue.id]" :src="thumbnails[issue.id]" :alt="issue.title"
                          class="thumbnail-image" fit="contain" />
                        <div v-else-if="loadingThumbnails.has(issue.id)" class="thumbnail-placeholder">
                          <q-spinner color="primary" size="2em" />
                          <div class="text-caption q-mt-sm">Generating thumbnail...</div>
                        </div>
                        <div v-else class="thumbnail-placeholder">
                          <q-icon name="mdi-file-pdf-box" size="3em" color="red-6" />
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
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.thumbnail-image {
  max-width: 80px;
  max-height: 120px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.thumbnail-placeholder {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
</style>
