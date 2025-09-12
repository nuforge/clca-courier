<template>
  <!-- Global PDF Viewer Dialog -->
  <q-dialog v-model="showViewer" maximized>
    <q-card>
      <q-toolbar class="bg-primary">
        <q-toolbar-title>
          <q-icon name="mdi-file-pdf-box" class="q-mr-sm" />
          {{ selectedDocument?.title }}
        </q-toolbar-title>

        <!-- Document switcher -->
        <q-btn-dropdown color="white" text-color="primary" label="Switch Document" icon="mdi-swap-horizontal"
          class="q-mr-md" v-if="availableDocuments.length > 1">
          <q-list>
            <q-item v-for="document in availableDocuments" :key="(document as any)?.id || ''" clickable v-close-popup
              @click="switchDocument(document)" :class="{ [backgroundClasses.surface]: selectedDocument?.id === document.id }">
              <q-item-section>
                <q-item-label>{{ document.title }}</q-item-label>
                <q-item-label caption>{{ document.date }} • {{ document.pages }} pages</q-item-label>
              </q-item-section>
              <q-item-section side v-if="selectedDocument?.id === document.id">
                <q-icon name="mdi-check" color="positive" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <q-btn flat icon="mdi-close" @click="closeViewer" />
      </q-toolbar>

      <q-card-section class="q-pa-none" style="height: calc(100vh - 50px);">
        <!-- Error indicator - REMOVED DUPLICATE LOADING INDICATOR -->
        <div v-if="error" class="absolute-center text-center">
          <q-icon name="mdi-alert-circle" size="64px" color="negative" />
          <div class="q-mt-md text-h6 text-negative">Error Loading PDF</div>
          <div class="q-mt-sm text-body2">{{ error }}</div>
          <q-btn class="q-mt-md" color="primary" label="Try Again" @click="retryLoadDocument" outline />
        </div>

        <!-- PDF Viewer - Let PdfViewer handle its own loading state -->
        <PdfViewer v-if="selectedDocument && !error" :document-url="(selectedDocument as any)?.url || ''"
          :key="(selectedDocument as any)?.id || ''" @ready="onViewerReady" @error="onViewerError" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useContentStore } from '../stores/content-store'
import { useTheme } from '../composables/useTheme'
import PdfViewer from './PdfViewer.vue'

const $q = useQuasar()
const contentStore = useContentStore()
const { backgroundClasses } = useTheme()

// Basic PDF viewer state (simplified)
const showViewer = ref(false)
const selectedDocument = ref<Record<string, unknown> | null>(null)
const error = ref<string | null>(null)

const closeViewer = () => {
  showViewer.value = false
  selectedDocument.value = null
  error.value = null
}

const switchDocument = (document: Record<string, unknown>) => {
  selectedDocument.value = document
  error.value = null
}

const onViewerReady = () => {
  error.value = null
}

const onViewerError = (errorMessage: string) => {
  error.value = errorMessage
  $q.notify({
    message: 'Error loading PDF viewer',
    caption: errorMessage,
    type: 'negative',
    icon: 'mdi-alert'
  })
}

const retryLoadDocument = () => {
  if (selectedDocument.value) {
    // Reset error state and try switching to the same document (will trigger reload)
    switchDocument(selectedDocument.value)
  }
}

// Get available documents from the store
const availableDocuments = computed(() => contentStore.archivedIssues)
</script>

<style scoped>
/* Any additional styles specific to the global viewer can go here */
</style>
