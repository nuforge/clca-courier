import { ref } from 'vue';
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
  };

  // Switch to a different document
  const switchDocument = (document: PdfDocument) => {
    selectedDocument.value = document;
    isLoading.value = true;
    error.value = null;
  };

  // Handle PDF viewer ready event
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onViewerReady = (instance: WebViewerInstance) => {
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
