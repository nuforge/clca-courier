/**
 * PDF Processing Utilities
 * PDF.js-based processing for page count and text extraction
 */

import { logger } from './logger';

// PDF.js global interface
declare global {
  interface Window {
    pdfjsLib?: {
      getDocument: (src: Uint8Array) => {
        promise: Promise<PDFDocumentProxy>;
      };
      GlobalWorkerOptions: {
        workerSrc: string;
      };
    };
  }
}

interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getTextContent: () => Promise<{
    items: Array<{
      str: string;
    }>;
  }>;
}

export interface PDFProcessingResult {
  pageCount: number;
  textContent?: string;
  wordCount?: number;
  processingTime: number;
}

/**
 * Initialize PDF.js worker
 */
async function initializePdfJs(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Wait for PDF.js to load if it's not available yet
  let attempts = 0;
  const maxAttempts = 10;

  while (!window.pdfjsLib && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  if (window.pdfjsLib) {
    try {
      // Set worker source only if not already set
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        // Use the same CDN version for the worker to avoid version mismatches
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
        logger.debug('PDF.js worker initialized');
      }
    } catch (workerError) {
      logger.warn('Failed to initialize PDF.js worker:', workerError);
    }
  } else {
    logger.warn('PDF.js library not available after waiting');
  }
}

/**
 * Extract metadata from PDF file using PDF.js
 */
export async function processPdfFile(file: File): Promise<PDFProcessingResult> {
  const startTime = Date.now();

  try {
    logger.debug(`Starting PDF.js processing for: ${file.name}`);

    // Initialize PDF.js if needed
    await initializePdfJs();

    if (!window.pdfjsLib) {
      throw new Error('PDF.js library not loaded');
    }

    // Convert file to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Load PDF document
    const loadingTask = window.pdfjsLib.getDocument(uint8Array);
    const pdfDoc = await loadingTask.promise;

    const pageCount = pdfDoc.numPages;
    logger.debug(`PDF has ${pageCount} pages`);

    // Extract text from first 3 pages for search indexing
    const maxPagesToProcess = Math.min(pageCount, 3);
    const textParts: string[] = [];

    for (let pageNum = 1; pageNum <= maxPagesToProcess; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: { str: string }) => item.str).join(' ');
        if (pageText.trim()) {
          textParts.push(pageText);
        }
      } catch (pageError) {
        logger.warn(`Failed to extract text from page ${pageNum}:`, pageError);
      }
    }

    const fullText = textParts.join('\n').trim();
    const wordCount = fullText ? fullText.split(/\s+/).filter((word) => word.length > 0).length : 0;

    const processingTime = Date.now() - startTime;

    logger.success(
      `PDF processing completed in ${processingTime}ms: ${pageCount} pages, ${wordCount} words`,
    );

    return {
      pageCount,
      textContent: fullText,
      wordCount,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error(`PDF processing failed after ${processingTime}ms:`, error);
    throw error;
  }
}

/**
 * Extract just page count from PDF (lighter processing)
 */
export async function extractPageCount(file: File): Promise<number> {
  try {
    await initializePdfJs();

    if (!window.pdfjsLib) {
      throw new Error('PDF.js library not loaded');
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const loadingTask = window.pdfjsLib.getDocument(uint8Array);
    const pdfDoc = await loadingTask.promise;

    return pdfDoc.numPages;
  } catch (error) {
    logger.error('Page count extraction failed:', error);
    throw error;
  }
}

/**
 * Check if PDF.js is available and ready
 */
export function isPdfProcessingAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.pdfjsLib;
}
