// Utility functions for working with external images and URLs
// TEMPORARILY DISABLED Google Drive functionality

export interface GoogleDriveInfo {
  fileId: string;
  directUrl: string;
  thumbnailUrl: string;
  previewUrl: string;
}

/**
 * Extract file ID from various Google Drive URL formats
 * @deprecated Use GoogleDriveBrowserService.extractFileId instead
 */
export function extractGoogleDriveFileId(url: string): string | null {
  console.warn('Google Drive functionality temporarily disabled');

  // Basic file ID extraction without service dependency
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/folders\/([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Convert Google Drive share URL to various formats
 */
export function parseGoogleDriveUrl(url: string): GoogleDriveInfo | null {
  const fileId = extractGoogleDriveFileId(url);

  if (!fileId) {
    return null;
  }

  return {
    fileId,
    directUrl: `https://drive.google.com/uc?export=view&id=${fileId}`,
    thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`,
    previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
  };
}

/**
 * Get direct download URL for Google Drive file
 */
export function getGoogleDriveDirectUrl(url: string): string {
  const info = parseGoogleDriveUrl(url);
  return info?.directUrl || url;
}

/**
 * Get thumbnail URL for Google Drive file
 */
export function getGoogleDriveThumbnailUrl(url: string, size = 400): string {
  const info = parseGoogleDriveUrl(url);
  return info ? `https://drive.google.com/thumbnail?id=${info.fileId}&sz=w${size}` : url;
}

/**
 * Check if URL is a Google Drive URL
 * @deprecated Use GoogleDriveBrowserService.isGoogleDriveUrl instead
 */
export function isGoogleDriveUrl(url: string): boolean {
  console.warn('Google Drive functionality temporarily disabled');
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}

/**
 * Validate image URL format
 */
export function isValidImageUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file extension from URL
 */
export function getFileExtensionFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
    return match && match[1] ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Check if URL points to an image based on extension
 */
export function isImageUrl(url: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const extension = getFileExtensionFromUrl(url);
  return extension ? imageExtensions.includes(extension) : false;
}

/**
 * Generate a placeholder data URL for images
 */
export function generatePlaceholderImage(
  width = 400,
  height = 300,
  text = 'Loading...',
  backgroundColor = '#f0f0f0',
  textColor = '#999',
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = width;
  canvas.height = height;

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Text
  ctx.fillStyle = textColor;
  ctx.font = `${Math.min(width, height) / 10}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  return canvas.toDataURL();
}

/**
 * Common image hosting patterns and their direct URL converters
 */
export const imageHostingConverters = {
  googleDrive: getGoogleDriveDirectUrl,

  // Enhanced Google Drive converter that uses the new service
  googleDriveEnhanced: (url: string): string => {
    const fileId = extractGoogleDriveFileId(url);
    if (fileId) {
      // Return public direct URL
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    return url;
  },

  // Dropbox
  dropbox: (url: string): string => {
    if (url.includes('dropbox.com') && url.includes('?dl=0')) {
      return url.replace('?dl=0', '?raw=1');
    }
    return url;
  },

  // OneDrive
  oneDrive: (url: string): string => {
    if (url.includes('1drv.ms') || url.includes('onedrive.live.com')) {
      // OneDrive direct links require specific formatting
      if (url.includes('?') && !url.includes('&download=1')) {
        return url + '&download=1';
      }
    }
    return url;
  },
};

/**
 * Convert various cloud storage URLs to direct URLs
 */
export function convertToDirectUrl(url: string): string {
  if (isGoogleDriveUrl(url)) {
    return imageHostingConverters.googleDriveEnhanced(url);
  }

  if (url.includes('dropbox.com')) {
    return imageHostingConverters.dropbox(url);
  }

  if (url.includes('1drv.ms') || url.includes('onedrive.live.com')) {
    return imageHostingConverters.oneDrive(url);
  }

  return url;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate image dimensions while maintaining aspect ratio
 */
export function calculateAspectRatioDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width: Math.round(width), height: Math.round(height) };
}
