<template>
  <div class="pdf-viewer-container">
    <div v-if="loading" class="loading-container">
      <q-spinner-dots size="xl" color="primary" />
      <div class="text-h6 q-mt-md">Loading PDF...</div>
    </div>

    <div v-if="error" class="error-container">
      <q-icon name="mdi-alert-circle" size="3em" color="negative" />
      <div class="text-h6 q-mt-md text-negative">Error Loading PDF</div>
      <div class="text-body2 q-mt-sm">{{ error }}</div>
      <q-btn color="primary" label="Retry" icon="mdi-refresh" @click="initializeViewer" class="q-mt-md" />
    </div>

    <div ref="viewerElement" v-show="!loading && !error" class="viewer-element"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import WebViewer from '@pdftron/webviewer'
import type { WebViewerInstance } from '@pdftron/webviewer'

interface Props {
  documentUrl: string
  licenseKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  licenseKey: 'qfUY16w5a406CX1SOSKl'
})

const emit = defineEmits<{
  ready: [instance: WebViewerInstance]
  error: [error: string]
}>()

const viewerElement = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
let webviewerInstance: WebViewerInstance | null = null

// Get Quasar instance and store for theme management
const $q = useQuasar()

async function initializeViewer() {
  if (!viewerElement.value) return

  loading.value = true
  error.value = null

  try {
    webviewerInstance = await WebViewer({
      path: '/webviewer',
      initialDoc: props.documentUrl,
      licenseKey: props.licenseKey
    }, viewerElement.value)

    if (webviewerInstance) {
      // Set theme based on Quasar's dark mode state
      const theme = $q.dark.isActive ? 'dark' : 'light'
      webviewerInstance.UI.setTheme(theme)

      // Simplify toolbar - just keep basic viewing tools
      webviewerInstance.UI.disableElements([
        'toolsButton',
        'searchButton',
        'menuButton',
        'rubberStampToolGroupButton',
        'stampToolGroupButton',
        'fileAttachmentToolGroupButton',
        'calloutToolGroupButton',
        'undo',
        'redo'
      ])

      loading.value = false
      emit('ready', webviewerInstance)
    }

  } catch (err) {
    console.error('Error initializing WebViewer:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    error.value = errorMessage
    loading.value = false
    emit('error', errorMessage)
  }
}

function loadDocument(url: string) {
  if (webviewerInstance) {
    loading.value = true
    error.value = null

    try {
      void webviewerInstance.Core.documentViewer.loadDocument(url)
      loading.value = false
    } catch (err) {
      console.error('Error loading document:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error loading document'
      error.value = errorMessage
      loading.value = false
      emit('error', errorMessage)
    }
  }
}

// Watch for document URL changes
watch(() => props.documentUrl, (newUrl) => {
  if (webviewerInstance && newUrl) {
    loadDocument(newUrl)
  }
})

// Watch for dark mode changes and update WebViewer theme
watch(() => $q.dark.isActive, (isDark) => {
  if (webviewerInstance) {
    const theme = isDark ? 'dark' : 'light'
    webviewerInstance.UI.setTheme(theme)
  }
})

onMounted(async () => {
  await nextTick()
  void initializeViewer()
})

// Expose methods for parent component
defineExpose({
  loadDocument,
  getInstance: () => webviewerInstance
})
</script>

<style scoped>
.pdf-viewer-container {
  height: 100%;
  width: 100%;
  position: relative;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.viewer-element {
  height: 100%;
  width: 100%;
}
</style>
