/**
 * PDF Thumbnail Generation Utilities
 * Generate thumbnail images from PDF files using PDF.js and Canvas
 */

import { logger } from './logger';

interface PDFThumbnailPageProxy {
  getViewport: (params: { scale: number }) => PDFThumbnailViewport;
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PDFThumbnailViewport }) => {
    promise: Promise<void>;
  };
}

interface PDFThumbnailViewport {
  width: number;
  height: number;
}

export interface ThumbnailGenerationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ThumbnailResult {
  thumbnailUrl: string; // Data URL of the generated thumbnail
  width: number;
  height: number;
  format: string;
  size: number; // Size in bytes (estimated)
  processingTime: number;
}

/**
 * Initialize PDF.js for thumbnail generation
 */
async function ensurePdfJsReady(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js thumbnail generation requires browser environment');
  }

  // Wait for PDF.js to load if it's not available yet
  let attempts = 0;
  const maxAttempts = 10;

  while (!window.pdfjsLib && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.pdfjsLib) {
    throw new Error('PDF.js library not available for thumbnail generation');
  }
}

/**
 * Generate thumbnail from PDF file
 */
export async function generatePdfThumbnail(
  file: File,
  options: ThumbnailGenerationOptions = {},
): Promise<ThumbnailResult> {
  const startTime = Date.now();

  // Default options optimized for newsletter thumbnails
  const { maxWidth = 300, maxHeight = 400, quality = 0.8, format = 'jpeg' } = options;

  try {
    logger.debug(`Generating thumbnail for PDF: ${file.name}`);

    // Ensure PDF.js is ready
    await ensurePdfJsReady();

    // Convert file to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Load PDF document
    const loadingTask = window.pdfjsLib!.getDocument(uint8Array);
    const pdfDoc = await loadingTask.promise;

    // Get first page for thumbnail
    const page = (await pdfDoc.getPage(1)) as unknown as PDFThumbnailPageProxy;

    // Calculate optimal scale to fit within max dimensions
    const originalViewport = page.getViewport({ scale: 1.0 });
    const scaleX = maxWidth / originalViewport.width;
    const scaleY = maxHeight / originalViewport.height;
    const scale = Math.min(scaleX, scaleY);

    // Get scaled viewport
    const viewport = page.getViewport({ scale });

    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get canvas 2D context');
    }

    // Set canvas dimensions
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Set white background (for better contrast with PDF content)
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Render PDF page to canvas
    const renderTask = page.render({
      canvasContext: context,
      viewport: viewport,
    });

    await renderTask.promise;

    // Convert canvas to data URL
    const mimeType =
      format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';

    const thumbnailUrl = canvas.toDataURL(mimeType, quality);

    // Estimate size from data URL (base64 overhead ~33%)
    const estimatedSize = Math.round(thumbnailUrl.length * 0.75);

    const processingTime = Date.now() - startTime;

    logger.success(
      `Thumbnail generated in ${processingTime}ms: ${viewport.width}x${viewport.height} (${estimatedSize} bytes)`,
    );

    return {
      thumbnailUrl,
      width: viewport.width,
      height: viewport.height,
      format: mimeType,
      size: estimatedSize,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error(`Thumbnail generation failed after ${processingTime}ms:`, error);
    throw error;
  }
}

/**
 * Generate thumbnails for multiple PDF files
 */
export async function generateMultipleThumbnails(
  files: File[],
  options: ThumbnailGenerationOptions = {},
  onProgress?: (completed: number, total: number, filename: string) => void,
): Promise<Map<string, ThumbnailResult>> {
  const results = new Map<string, ThumbnailResult>();

  logger.debug(`Starting batch thumbnail generation for ${files.length} files`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (!file) continue; // Skip undefined files

    try {
      onProgress?.(i, files.length, file.name);

      const result = await generatePdfThumbnail(file, options);
      results.set(file.name, result);

      logger.debug(`Thumbnail ${i + 1}/${files.length} completed: ${file.name}`);
    } catch (error) {
      logger.error(`Thumbnail generation failed for ${file.name}:`, error);
      // Continue with other files
    }
  }

  onProgress?.(files.length, files.length, 'Completed');

  logger.success(
    `Batch thumbnail generation completed: ${results.size}/${files.length} successful`,
  );

  return results;
}

/**
 * Check if thumbnail generation is available
 */
export function isThumbnailGenerationAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.pdfjsLib &&
    !!document.createElement('canvas').getContext
  );
}
