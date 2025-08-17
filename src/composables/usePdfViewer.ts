import { ref, nextTick } from 'vue';
import type { WebViewerInstance } from '@pdftron/webviewer';

export interface PdfDocument {
  id: number;
  title: string;
  date: string;
  pages: number;
  url: string;
  filename: string;
}

// Create global reactive state (singleton pattern)
const showViewer = ref(false);
const selectedDocument = ref<PdfDocument | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
let webViewerInstance: WebViewerInstance | null = null;

export function usePdfViewer() {
  // Open a PDF document in the viewer
  const openDocument = (document: PdfDocument) => {
    selectedDocument.value = document;
    showViewer.value = true;
    isLoading.value = true;
    error.value = null;
  };

  // Close the PDF viewer
  const closeViewer = () => {
    showViewer.value = false;
    selectedDocument.value = null;
    isLoading.value = false;
    error.value = null;
    webViewerInstance = null;
  };

  // Switch to a different document (improved implementation)
  const switchDocument = async (document: PdfDocument) => {
    try {
      isLoading.value = true;
      error.value = null;
      selectedDocument.value = document;

      // If we have a WebViewer instance, load the new document directly
      if (webViewerInstance) {
        await nextTick(); // Ensure Vue reactivity has updated
        const { documentViewer } = webViewerInstance.Core;

        // Load the new document
        await documentViewer.loadDocument(document.url);
        isLoading.value = false;
      } else {
        // If no instance, the PdfViewer component will handle the new document
        // Loading state will be cleared when the viewer is ready
      }
    } catch (err) {
      console.error('Error switching document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch document';
      error.value = errorMessage;
      isLoading.value = false;
    }
  };

  // Handle PDF viewer ready event (store instance reference)
  const onViewerReady = (instance: WebViewerInstance) => {
    webViewerInstance = instance;
    isLoading.value = false;
  };

  // Handle PDF viewer error
  const onViewerError = (errorMessage: string) => {
    console.error('PDF Viewer error:', errorMessage);
    error.value = errorMessage;
    isLoading.value = false;
  };

  return {
    // State
    showViewer,
    selectedDocument,
    isLoading,
    error,

    // Actions
    openDocument,
    closeViewer,
    switchDocument,
    onViewerReady,
    onViewerError,
  };
}
