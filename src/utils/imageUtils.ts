// Utility functions for working with external images and URLs
// Firebase Storage and generic image handling

/**
 * Validate image URL format
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if URL points to an image file based on extension
 */
export function isImageFile(url: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i;
  return imageExtensions.test(url);
}

/**
 * Extract filename from URL
 */
export function extractFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split('/').pop() || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Check if URL is a Firebase Storage URL
 */
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com') || url.includes('storage.firebase.com');
}

/**
 * Generate thumbnail URL for Firebase Storage image
 */
export function getFirebaseImageThumbnail(url: string): string {
  if (!isFirebaseStorageUrl(url)) {
    return url;
  }

  // Firebase Storage supports resize transformations
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('alt', 'media');
    // Add custom resize parameter if supported by your Firebase setup
    // This may require Firebase Extensions or custom Cloud Functions
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Check if URL is likely a cloud storage URL
 */
export function isCloudStorageUrl(url: string): boolean {
  return (
    isFirebaseStorageUrl(url) ||
    url.includes('storage.googleapis.com') ||
    url.includes('s3.amazonaws.com') ||
    url.includes('blob.core.windows.net')
  );
}

/**
 * Image hosting converter functions
 */
export const imageHostingConverters = {
  firebase: (url: string): string => {
    if (isFirebaseStorageUrl(url)) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('alt', 'media');
      return urlObj.toString();
    }
    return url;
  },

  direct: (url: string): string => url, // Pass through for direct URLs
};

/**
 * Main image URL optimization function
 */
export function optimizeImageUrl(url: string): string {
  if (!isValidImageUrl(url)) {
    return url;
  }

  // Apply Firebase Storage optimization
  if (isFirebaseStorageUrl(url)) {
    return imageHostingConverters.firebase(url);
  }

  // Return as-is for other URLs
  return url;
}

/**
 * Create a loading placeholder image URL
 */
export function createPlaceholderImageUrl(width = 400, height = 300, text = 'Loading...'): string {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="16" fill="#888">
        ${text}
      </text>
    </svg>
  `)}`;
}

/**
 * Check if image URL is accessible (basic check)
 */
export async function checkImageAccessibility(url: string): Promise<boolean> {
  if (!isValidImageUrl(url)) {
    return false;
  }

  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get image dimensions from URL (if possible)
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Convert image to data URL (for small images)
 */
export function imageToDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const dataUrl = canvas.toDataURL();
        resolve(dataUrl);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Canvas conversion failed'));
      }
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}
