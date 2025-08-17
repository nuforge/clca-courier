/**
 * Utility functions for handling Google Drive URLs and file operations
 */

/**
 * Check if a URL is a Google Drive URL
 */
export function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com');
}

/**
 * Extract file ID from a Google Drive URL
 */
export function extractGoogleDriveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/, // Standard file URL
    /\/uc\?.*[?&]id=([a-zA-Z0-9_-]+)/, // Export URL
    /\/open\?id=([a-zA-Z0-9_-]+)/, // Open URL
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
 * Convert Google Drive URL to direct download format
 */
export function convertToDirectDownloadUrl(url: string): string {
  // If it's already a uc?export URL, return as is
  if (url.includes('uc?export=download')) {
    return url;
  }

  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return url;
}

/**
 * Convert Google Drive URL to view format (for PDF viewing)
 */
export function convertToViewUrl(url: string): string {
  // If it's already a uc?export=view URL, return as is
  if (url.includes('uc?export=view')) {
    return url;
  }

  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  return url;
}

/**
 * Convert Google Drive URL to preview format
 */
export function convertToPreviewUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  return url;
}

/**
 * Convert Google Drive URL to viewer format
 */
export function convertToViewerUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  return url;
}

/**
 * Check if a Google Drive URL might be subject to CORS restrictions
 */
export function isSubjectToCors(url: string): boolean {
  if (!isGoogleDriveUrl(url)) {
    return false;
  }

  // viewer URLs (/file/d/.../view) are subject to CORS
  // export URLs (uc?export=...) might work better but still can be restricted
  return url.includes('/file/d/') && url.includes('/view');
}
