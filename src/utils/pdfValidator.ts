/**
 * PDF validation utilities
 */

export interface PdfValidationResult {
  isValid: boolean;
  error?: string;
  size?: number;
}

/**
 * Validate if a PDF file exists and is accessible
 */
export async function validatePdfFile(url: string): Promise<PdfValidationResult> {
  try {
    const response = await fetch(url, {
      method: 'HEAD', // Only get headers, not content
      cache: 'no-cache',
    });

    if (!response.ok) {
      return {
        isValid: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/pdf')) {
      return {
        isValid: false,
        error: `Invalid content type: ${contentType}`,
      };
    }

    // Get file size
    const contentLength = response.headers.get('content-length');
    const size = contentLength ? parseInt(contentLength, 10) : undefined;

    // Check if file is too small (likely corrupted)
    if (size && size < 1024) {
      // Less than 1KB
      return {
        isValid: false,
        error: 'File is too small to be a valid PDF',
      };
    }

    return {
      isValid: true,
      ...(size !== undefined && { size }),
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Quick check if a URL looks like a valid PDF path
 */
export function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf');
}

/**
 * Sanitize PDF filename for URL use
 */
export function sanitizePdfFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '-') // Replace non-alphanumeric chars with dash
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}
