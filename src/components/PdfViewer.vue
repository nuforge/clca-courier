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
      <q-btn color="primary" label="Retry" icon="mdi-refresh" @click="loadPdf" class="q-mt-md" />
    </div>

    <!-- Simple iframe PDF viewer using browser's built-in PDF viewer -->
    <div v-show="!loading && !error" class="viewer-element">
      <iframe ref="pdfFrame" :src="pdfViewerUrl" width="100%" height="100%" frameborder="0" @load="onPdfLoaded"
        @error="onPdfError"></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'

interface Props {
  documentUrl: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  ready: [success: boolean]
  error: [error: string]
}>()

const pdfFrame = ref<HTMLIFrameElement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Compute the PDF viewer URL (browser's built-in PDF viewer)
const pdfViewerUrl = computed(() => {
  if (!props.documentUrl) return ''

  // Use the browser's built-in PDF viewer directly
  return props.documentUrl
})

// Load the PDF document
function loadPdf() {
  if (!props.documentUrl) {
    error.value = 'No document URL provided'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  console.log('🔍 [PdfViewer] Loading PDF:', props.documentUrl)

  // The iframe will handle loading automatically via src attribute
  // Loading state will be cleared by onPdfLoaded
}

// Handle PDF loaded successfully
function onPdfLoaded() {
  console.log('✅ [PdfViewer] PDF loaded successfully')
  loading.value = false
  error.value = null
  emit('ready', true)
}

// Handle PDF load error
function onPdfError() {
  console.error('❌ [PdfViewer] PDF load error')
  error.value = 'Failed to load PDF document'
  loading.value = false
  emit('error', 'Failed to load PDF document')
}

// Watch for document URL changes
watch(() => props.documentUrl, (newUrl) => {
  if (newUrl) {
    console.log('🔄 [PdfViewer] Document URL changed to:', newUrl)
    loadPdf()
  }
})

// Initialize on mount
onMounted(() => {
  if (props.documentUrl) {
    loadPdf()
  }
})

// Expose methods for parent components
defineExpose({
  loadPdf
})
</script>

<style scoped>
.pdf-viewer-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #f5f5f5;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
}

.viewer-element {
  width: 100%;
  height: 100%;
}

.viewer-element iframe {
  border: none;
  background: white;
}
</style>
