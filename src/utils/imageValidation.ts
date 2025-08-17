// src/utils/imageValidation.ts
/**
 * Utility functions for image validation and fallback handling
 */

import { getPublicPath } from './path-utils';

/**
 * Check if an image URL is accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);

    // Set a timeout to avoid hanging
    const timeout = setTimeout(() => {
      resolve(false);
    }, 10000); // 10 second timeout

    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Get fallback image with validation
 */
export async function getFallbackImage(fallback?: string): Promise<string | null> {
  if (!fallback) return null;

  const isValid = await validateImageUrl(fallback);
  return isValid ? fallback : null;
}

/**
 * Default fallback images in order of preference
 */
export const DEFAULT_FALLBACKS = [
  getPublicPath('images/clca-lake-3.jpg'),
  getPublicPath('clca-moon-logo.png'),
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjZjVmNWY1Ii8+Cjx0ZXh0IHg9Ijk2MCIgeT0iNTQwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD4KPHN2Zz4K', // "Image Not Available" placeholder
];

/**
 * Get the best available fallback image
 */
export async function getBestFallback(preferredFallback?: string): Promise<string> {
  const fallbacksToTry = preferredFallback
    ? [preferredFallback, ...DEFAULT_FALLBACKS]
    : DEFAULT_FALLBACKS;

  for (const fallback of fallbacksToTry) {
    const isValid = await validateImageUrl(fallback);
    if (isValid) {
      return fallback;
    }
  }

  // Return the last fallback (SVG placeholder) which should always work
  const lastFallback = DEFAULT_FALLBACKS[DEFAULT_FALLBACKS.length - 1];
  return (
    lastFallback ||
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjZjVmNWY1Ii8+Cjx0ZXh0IHg9Ijk2MCIgeT0iNTQwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD4KPHN2Zz4K'
  );
}
