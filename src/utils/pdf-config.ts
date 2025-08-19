/**
 * PDF.js Configuration Utilities
 * Centralized configuration to prevent 431 errors and optimize PDF processing
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with correct base path
const getWorkerPath = () => {
  if (typeof window !== 'undefined') {
    const isProduction = import.meta.env.PROD;
    const basePath = isProduction ? '/clca-courier' : '';
    return `${basePath}/pdf.worker.min.js`;
  }
  return '/pdf.worker.min.js';
};

// Global PDF.js configuration to prevent 431 errors
export const PDF_CONFIG = {
  // Basic configuration that minimizes request headers
  getBasicConfig: (url: string) => ({
    url,
    // Disable features that might add extra headers
    disableAutoFetch: true,
    disableStream: true,
    // Minimize request complexity
    httpHeaders: {},
    withCredentials: false,
    // Add timeout to prevent hanging requests
    password: undefined,
    length: undefined,
  }),

  // Initialize PDF.js worker (call once per session)
  initializeWorker: () => {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = getWorkerPath();
      console.log('[PDF Config] PDF.js worker initialized:', getWorkerPath());
    }
  },

  // Check if URL is too long for safe processing
  isUrlSafe: (url: string): boolean => {
    const maxLength = 2000; // Conservative limit for URL length
    return url.length <= maxLength;
  },

  // Create a safe PDF loading task with error handling
  createSafeLoadingTask: (url: string) => {
    if (!PDF_CONFIG.isUrlSafe(url)) {
      throw new Error(`PDF URL too long (${url.length} chars): ${url.substring(0, 100)}...`);
    }

    PDF_CONFIG.initializeWorker();
    return pdfjsLib.getDocument(PDF_CONFIG.getBasicConfig(url));
  },
};

// Export common configuration for consistent use
export default PDF_CONFIG;
