<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="text-center q-mb-xl">
      <h1 class="text-h3 text-primary q-mb-sm">
        <q-icon name="book" class="q-mr-md" />
        Publication Browser
      </h1>
      <p class="text-h6 text-grey-7">
        Browse your PDF publications
      </p>
    </div>

    <!-- Load Button -->
    <q-card v-if="!isInitialized" class="q-mb-lg" flat bordered>
      <q-card-section class="row items-center">
        <q-icon name="folder_open" color="primary" size="lg" class="q-mr-md" />
        <div class="col">
          <div class="text-h6">Load PDFs</div>
          <div class="text-body2 text-grey-7 q-mb-sm">Browse available PDF publications</div>
        </div>
        <q-btn color="primary" icon="download" label="Load PDFs" @click="loadPdfs" :loading="isLoading"
          unelevated />
      </q-card-section>
    </q-card>

    <!-- Success Status -->
    <q-card v-if="isInitialized && !error" class="q-mb-lg bg-green-1" flat bordered>
      <q-card-section class="row items-center">
        <q-icon name="check_circle" color="positive" size="lg" class="q-mr-md" />
        <div class="col">
          <div class="text-h6">✅ PDFs Loaded Successfully</div>
          <div class="text-body2 text-grey-7">Found {{ pdfs.length }} PDF files</div>
        </div>
        <q-btn flat color="primary" icon="refresh" label="Reload" @click="loadPdfs" size="sm" />
      </q-card-section>
    </q-card>

    <!-- Error Status -->
    <q-card v-if="error" class="q-mb-lg bg-red-1" flat bordered>
      <q-card-section>
        <div class="text-h6 text-red-8">Error</div>
        <div class="text-body2">{{ error }}</div>
        <q-btn flat label="Retry" @click="loadPdfs" class="q-mt-sm" />
      </q-card-section>
    </q-card>

    <!-- PDF Grid -->
    <div v-if="pdfs.length > 0" class="row q-gutter-md">
      <q-card v-for="issue in pdfs" :key="issue.id" class="col-12 col-md-6 col-lg-4 cursor-pointer" flat
        bordered @click="openPdf(issue)">
        <q-card-section>
          <div class="text-h6">{{ issue.title }}</div>
          <div class="text-caption text-grey-6">{{ issue.filename }}</div>
          <div class="text-caption text-grey-6">{{ formatDate(issue.date) }}</div>

          <div class="q-mt-sm">
            <q-btn flat color="primary" icon="visibility" label="Preview" @click.stop="openPdf(issue)" size="sm"
              class="q-mr-sm" />
            <q-btn flat color="secondary" icon="open_in_new" label="Drive" :href="issue.url" target="_blank" size="sm"
              @click.stop />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- PDF Viewer Dialog -->
    <q-dialog v-model="pdfDialogOpen" maximized>
      <q-card>
        <q-bar class="bg-primary text-white">
          <div class="col text-center">
            {{ selectedIssue?.title || 'PDF Viewer' }}
          </div>
          <q-btn dense flat icon="close" @click="closePdf" />
        </q-bar>

        <q-card-section class="q-pa-none" style="height: calc(100vh - 52px);">
          <iframe v-if="selectedIssue && pdfViewerSrc" :src="pdfViewerSrc" width="100%" height="100%"
            style="border: none;" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'
import type { PdfDocument } from '../composables/usePdfViewer'

// Use the site store for data
const siteStore = useSiteStore()

// Local state
const pdfDialogOpen = ref(false)
const selectedIssue = ref<PdfDocument | null>(null)
const isLoading = ref(false)
const isInitialized = ref(false)
const error = ref<string | null>(null)
const pdfs = ref<PdfDocument[]>([])

// Computed
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString()
}

const pdfViewerSrc = computed(() => {
  return selectedIssue.value?.url || ''
})

// Lifecycle
onMounted(() => {
  loadPdfs()
})

// Methods
const loadPdfs = () => {
  try {
    isLoading.value = true
    error.value = null
    console.log('🚀 Loading PDFs from site store...')

    // Use the archived issues from the site store directly
    pdfs.value = siteStore.archivedIssues || []

    isInitialized.value = true
    console.log('✅ SUCCESS! Loaded', pdfs.value.length, 'PDFs')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load PDFs'
    console.error('❌ Failed:', err)
  } finally {
    isLoading.value = false
  }
}

const openPdf = (issue: PdfDocument) => {
  selectedIssue.value = issue
  pdfDialogOpen.value = true
}

const closePdf = () => {
  pdfDialogOpen.value = false
  selectedIssue.value = null
}
</script>

<style scoped>
.q-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.q-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
