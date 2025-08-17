import { ref } from 'vue';
import { validatePdfFile, isPdfUrl } from '../utils/pdfValidator';
import type { WebViewerInstance } from '@pdftron/webviewer';

export interface PdfDocument {
  id: number;
  title: string;
  date: string;
  pages: number;
  url: string;
  filename: string;
}

export interface PdfViewerState {
  isLoading: boolean;
  error: string | null;
  isValidating: boolean;
  validationError: string | null;
}

// Enhanced PDF viewer composable with validation
export function usePdfViewerEnhanced() {
  const state = ref<PdfViewerState>({
    isLoading: false,
    error: null,
    isValidating: false,
    validationError: null,
  });

  const currentDocument = ref<PdfDocument | null>(null);
  let webViewerInstance: WebViewerInstance | null = null;

  // Validate a PDF document before loading
  const validateDocument = async (document: PdfDocument): Promise<boolean> => {
    state.value.isValidating = true;
    state.value.validationError = null;

    try {
      // Basic URL check
      if (!isPdfUrl(document.url)) {
        state.value.validationError = 'Invalid PDF URL format';
        return false;
      }

      // Network validation
      const validation = await validatePdfFile(document.url);
      if (!validation.isValid) {
        state.value.validationError = validation.error || 'PDF validation failed';
        return false;
      }

      return true;
    } catch (error) {
      state.value.validationError = error instanceof Error ? error.message : 'Validation error';
      return false;
    } finally {
      state.value.isValidating = false;
    }
  };

  // Load a document with validation
  const loadDocument = async (document: PdfDocument): Promise<void> => {
    try {
      state.value.isLoading = true;
      state.value.error = null;
      currentDocument.value = document;

      // Validate the document first
      const isValid = await validateDocument(document);
      if (!isValid) {
        state.value.error = state.value.validationError;
        return;
      }

      // If we have a WebViewer instance, load the document
      if (webViewerInstance) {
        const { documentViewer } = webViewerInstance.Core;
        await documentViewer.loadDocument(document.url);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load document';
      state.value.error = errorMessage;
      console.error('PDF loading error:', error);
    } finally {
      state.value.isLoading = false;
    }
  };

  // Set WebViewer instance
  const setWebViewerInstance = (instance: WebViewerInstance) => {
    webViewerInstance = instance;
    state.value.isLoading = false;

    // Add global error handling
    const { documentViewer } = instance.Core;

    documentViewer.addEventListener('documentLoaded', () => {
      state.value.isLoading = false;
      state.value.error = null;
    });

    documentViewer.addEventListener('documentLoadError', (err) => {
      console.error('WebViewer document load error:', err);
      state.value.error = 'Failed to load PDF document. The file may be corrupted or invalid.';
      state.value.isLoading = false;
    });
  };

  // Handle errors
  const setError = (error: string) => {
    state.value.error = error;
    state.value.isLoading = false;
  };

  // Clear errors
  const clearError = () => {
    state.value.error = null;
    state.value.validationError = null;
  };

  // Retry loading current document
  const retry = async () => {
    if (currentDocument.value) {
      await loadDocument(currentDocument.value);
    }
  };

  return {
    state,
    currentDocument,
    validateDocument,
    loadDocument,
    setWebViewerInstance,
    setError,
    clearError,
    retry,
  };
}
