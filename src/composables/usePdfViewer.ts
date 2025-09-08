import { ref } from 'vue';
import type { WebViewerInstance } from '@pdftron/webviewer';
import { logger } from '../utils/logger';

export interface PdfDocument {
  id: number;
  title: string;
  date: string;
  pages: number;
  url: string;
  filename: string;

  // Optional extended properties for compatibility
  status?: string;
  syncStatus?: string;
  description?: string;
  fileSize?: string;
  thumbnailUrl?: string;
  tags?: string[];
  googleDriveFileId?: string;
  category?: string;
  localUrl?: string;
  googleDriveUrl?: string;
  cacheThumbnailUrl?: string;
  etag?: string;
}

export interface PdfViewerState {
  isLoading: boolean;
  error: string | null;
  isValidating: boolean;
  validationError: string | null;
}

// Basic PDF validation utilities
const isPdfUrl = (url: string): boolean => {
  return url.toLowerCase().includes('.pdf') || url.includes('application/pdf');
};

const validatePdfFile = async (url: string): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      return { isValid: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('pdf')) {
      return { isValid: false, error: 'File is not a PDF' };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
};

// Create global reactive state (singleton pattern)
const showViewer = ref(false);
const selectedDocument = ref<PdfDocument | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isValidating = ref(false);
const validationError = ref<string | null>(null);

// WebViewer instance for enhanced functionality
let webViewerInstance: WebViewerInstance | null = null;

export function usePdfViewer() {
  // Validate a PDF document before loading
  const validateDocument = async (document: PdfDocument): Promise<boolean> => {
    isValidating.value = true;
    validationError.value = null;

    try {
      // Basic URL check
      if (!isPdfUrl(document.url)) {
        validationError.value = 'Invalid PDF URL format';
        return false;
      }

      // Network validation
      const validation = await validatePdfFile(document.url);
      if (!validation.isValid) {
        validationError.value = validation.error || 'PDF validation failed';
        return false;
      }

      return true;
    } catch (err) {
      validationError.value = err instanceof Error ? err.message : 'Validation error';
      return false;
    } finally {
      isValidating.value = false;
    }
  };

  // Open a PDF document in the viewer with validation
  const openDocument = async (document: PdfDocument) => {
    logger.debug('Opening document:', document);
    logger.debug('Document URL:', document.url);

    selectedDocument.value = document;
    showViewer.value = true;
    isLoading.value = true;
    error.value = null;

    // Validate the document
    const isValid = await validateDocument(document);
    if (!isValid) {
      error.value = validationError.value;
      isLoading.value = false;
      return;
    }

    // If we have a WebViewer instance, load the document
    if (webViewerInstance) {
      try {
        const { documentViewer } = webViewerInstance.Core;
        await documentViewer.loadDocument(document.url);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
        error.value = errorMessage;
        isLoading.value = false;
      }
    }
  };

  // Close the PDF viewer
  const closeViewer = () => {
    showViewer.value = false;
    selectedDocument.value = null;
    isLoading.value = false;
    error.value = null;
    validationError.value = null;
  };

  // Switch to a different document with validation
  const switchDocument = async (document: PdfDocument) => {
    try {
      isLoading.value = true;
      error.value = null;
      validationError.value = null;

      logger.debug('Switching to document:', document.title);

      // Validate first
      const isValid = await validateDocument(document);
      if (!isValid) {
        error.value = validationError.value;
        isLoading.value = false;
        return;
      }

      selectedDocument.value = document;

      // Load in WebViewer if available
      if (webViewerInstance) {
        const { documentViewer } = webViewerInstance.Core;
        await documentViewer.loadDocument(document.url);
      }
    } catch (err) {
      logger.error('Error switching document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch document';
      error.value = errorMessage;
      isLoading.value = false;
    }
  };

  // Set WebViewer instance for enhanced functionality
  const setWebViewerInstance = (instance: WebViewerInstance) => {
    webViewerInstance = instance;
    isLoading.value = false;

    // Add global error handling
    const { documentViewer } = instance.Core;

    documentViewer.addEventListener('documentLoaded', () => {
      isLoading.value = false;
      error.value = null;
      logger.success('PDF viewer ready');
    });

    documentViewer.addEventListener('documentLoadError', (err) => {
      logger.error('WebViewer document load error:', err);
      error.value = 'Failed to load PDF document. The file may be corrupted or invalid.';
      isLoading.value = false;
    });
  };

  // Handle PDF viewer ready event (legacy support)
  const onViewerReady = (success: boolean) => {
    if (success) {
      logger.success('PDF viewer ready');
    } else {
      logger.error('PDF viewer failed to initialize');
      error.value = 'PDF viewer failed to initialize';
    }
    isLoading.value = false;
  };

  // Handle PDF viewer error
  const onViewerError = (errorMessage: string) => {
    logger.error('PDF Viewer error:', errorMessage);
    error.value = errorMessage;
    isLoading.value = false;
  };

  // Clear errors
  const clearError = () => {
    error.value = null;
    validationError.value = null;
  };

  // Retry loading current document
  const retry = async () => {
    if (selectedDocument.value) {
      await openDocument(selectedDocument.value);
    }
  };

  return {
    // State
    showViewer,
    selectedDocument,
    isLoading,
    error,
    isValidating,
    validationError,

    // Enhanced state object for compatibility
    state: {
      get isLoading() {
        return isLoading.value;
      },
      get error() {
        return error.value;
      },
      get isValidating() {
        return isValidating.value;
      },
      get validationError() {
        return validationError.value;
      },
    },
    currentDocument: selectedDocument,

    // Actions
    openDocument,
    closeViewer,
    switchDocument,
    validateDocument,
    setWebViewerInstance,
    onViewerReady,
    onViewerError,
    clearError,
    retry,
  };
}
