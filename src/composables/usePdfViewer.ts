import { ref } from 'vue';

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
    console.log('🔍 [usePdfViewer] Opening document:', document);
    console.log('🔍 [usePdfViewer] Document URL:', document.url);

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

  // Switch to a different document (simplified implementation)
  const switchDocument = (document: PdfDocument) => {
    try {
      isLoading.value = true;
      error.value = null;
      selectedDocument.value = document;

      console.log('🔄 [usePdfViewer] Switching to document:', document.title);

      // The PDF viewer component will automatically reload via reactive URL change
      // Loading state will be cleared when the new document loads
    } catch (err) {
      console.error('Error switching document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch document';
      error.value = errorMessage;
      isLoading.value = false;
    }
  };

  // Handle PDF viewer ready event (simple success/failure)
  const onViewerReady = (success: boolean) => {
    if (success) {
      console.log('✅ [usePdfViewer] PDF viewer ready');
    } else {
      console.error('❌ [usePdfViewer] PDF viewer failed to initialize');
      error.value = 'PDF viewer failed to initialize';
    }
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
