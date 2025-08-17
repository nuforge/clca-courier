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
import { useUserSettings } from '../composables/useUserSettings'
import WebViewer from '@pdftron/webviewer'
import type { WebViewerInstance } from '@pdftron/webviewer'

interface Props {
  documentUrl: string
  licenseKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  licenseKey: import.meta.env.VITE_PDFTRON_LICENSE_KEY || ''
})

const emit = defineEmits<{
  ready: [instance: WebViewerInstance]
  error: [error: string]
}>()

const viewerElement = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
let webviewerInstance: WebViewerInstance | null = null

// Get Quasar instance and user settings
const $q = useQuasar()
const { pdfSettings } = useUserSettings()

// Helper function to apply PDF settings to the viewer
function applyPdfSettings(instance: WebViewerInstance) {
  if (!instance) return;

  const settings = pdfSettings.value;

  // Apply zoom level
  if (settings.defaultZoom && settings.defaultZoom !== 1.0) {
    const { documentViewer } = instance.Core;
    // Set zoom after document is loaded
    documentViewer.addEventListener('documentLoaded', () => {
      documentViewer.zoomTo(settings.defaultZoom);
    });
  }

  // Apply page layout
  const LayoutMode = instance.UI.LayoutMode;
  switch (settings.pageLayout) {
    case 'single':
      instance.UI.setLayoutMode(LayoutMode.Single);
      break;
    case 'facing':
      instance.UI.setLayoutMode(LayoutMode.Facing);
      break;
    case 'cover':
      instance.UI.setLayoutMode(LayoutMode.FacingCover);
      break;
    default:
      instance.UI.setLayoutMode(LayoutMode.FacingCover);
  }
}

async function initializeViewer() {
  if (!viewerElement.value) return

  loading.value = true
  error.value = null

  // Suppress WebViewer console warnings/messages
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  const suppressMessages = (...args: unknown[]) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('WebAssembly threads') ||
      message.includes('Content-Encoding') ||
      message.includes('linearized') ||
      message.includes('demo mode') ||
      message.includes('PDFNet is running') ||
      message.includes('Permission:') ||
      message.includes('Thank you for downloading WebViewer') ||
      message.includes('trial') ||
      message.includes('license') ||
      message.includes('Byte ranges are not supported')
    ) {
      return; // Suppress these messages
    }
    // Allow other warnings to pass through
    originalConsoleWarn.apply(console, args);
  };

  const suppressLogs = (...args: unknown[]) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('WebAssembly threads') ||
      message.includes('Content-Encoding') ||
      message.includes('linearized') ||
      message.includes('demo mode') ||
      message.includes('PDFNet is running') ||
      message.includes('Permission:') ||
      message.includes('Thank you for downloading WebViewer') ||
      message.includes('trial') ||
      message.includes('license')
    ) {
      return; // Suppress these messages
    }
    // Allow other logs to pass through
    originalConsoleLog.apply(console, args);
  };

  console.warn = suppressMessages;
  console.log = suppressLogs;
  console.error = (...args: unknown[]) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('demo mode') ||
      message.includes('PDFNet is running') ||
      message.includes('linearized')
    ) {
      return; // Suppress these error messages too
    }
    originalConsoleError.apply(console, args);
  };

  try {
    webviewerInstance = await WebViewer({
      path: '/webviewer',
      initialDoc: props.documentUrl,
      licenseKey: props.licenseKey,
      // Optimize for non-linearized PDFs
      streaming: false,
      useDownloader: false,
      // Better error handling
      enableRedaction: false,
      enableMeasurement: false,
      enableFilePicker: false
    }, viewerElement.value)

    if (webviewerInstance) {
      // Set theme based on Quasar's dark mode state
      const theme = $q.dark.isActive ? 'dark' : 'light'
      webviewerInstance.UI.setTheme(theme)

      // Apply user's PDF settings
      applyPdfSettings(webviewerInstance)

      // Add error handling for document loading
      const { documentViewer } = webviewerInstance.Core;

      documentViewer.addEventListener('documentLoadError', (err) => {
        console.error('Document load error:', err);
        const errorMessage = 'Failed to load PDF document. The file may be corrupted or invalid.';
        error.value = errorMessage;
        loading.value = false;
        emit('error', errorMessage);
      });

      documentViewer.addEventListener('documentLoaded', () => {
        // Document loaded successfully
        loading.value = false;
      });

      // Simplify toolbar - just keep basic viewing tools
      webviewerInstance.UI.disableElements([
        'toolsButton',
        'searchButton',
        'menuButton',
        'rubberStampToolGroupButton',
        'stampToolGroupButton',
        'fileAttachmentToolGroupButton',
        'calloutToolGroupButton',
        'toolbarGroup-Annotate',
        'toolbarGroup-Shapes',
        'toolbarGroup-Forms',
        'toolbarGroup-Edit',
        'toolbarGroup-FillAndSign',
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
  } finally {
    // Restore original console methods
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  }
}

function loadDocument(url: string) {
  if (webviewerInstance) {
    loading.value = true
    error.value = null

    try {
      const { documentViewer } = webviewerInstance.Core;

      // Add event listeners for this specific document load
      const onDocumentLoaded = () => {
        loading.value = false;
        documentViewer.removeEventListener('documentLoaded', onDocumentLoaded);
        documentViewer.removeEventListener('documentLoadError', onDocumentLoadError);
      };

      const onDocumentLoadError = (err: unknown) => {
        console.error('Error loading document:', err);
        const errorMessage = 'Failed to load PDF document. The file may be corrupted or not accessible.';
        error.value = errorMessage;
        loading.value = false;
        emit('error', errorMessage);
        documentViewer.removeEventListener('documentLoaded', onDocumentLoaded);
        documentViewer.removeEventListener('documentLoadError', onDocumentLoadError);
      };

      documentViewer.addEventListener('documentLoaded', onDocumentLoaded);
      documentViewer.addEventListener('documentLoadError', onDocumentLoadError);

      // Load the document
      void documentViewer.loadDocument(url);
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

// Watch for PDF settings changes and apply them to the viewer
watch(() => pdfSettings.value, () => {
  if (webviewerInstance) {
    applyPdfSettings(webviewerInstance)
  }
}, { deep: true })

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
