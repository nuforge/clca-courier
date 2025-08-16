// src/composables/usePdfCache.ts
import { ref, computed } from 'vue';

export interface CachedPdf {
  id: string;
  originalUrl: string;
  cachedBlob: Blob;
  cachedUrl: string;
  fileName: string;
  fileSize: number;
  lastCached: Date;
  etag?: string;
}

export interface PdfCacheConfig {
  maxCacheSizeMB: number;
  maxAgeHours: number;
  enableCompression: boolean;
}

const defaultConfig: PdfCacheConfig = {
  maxCacheSizeMB: 100, // 100MB cache limit
  maxAgeHours: 24 * 7, // 1 week
  enableCompression: false,
};

export function usePdfCache(config: Partial<PdfCacheConfig> = {}) {
  const cacheConfig = { ...defaultConfig, ...config };
  const cachedPdfs = ref<Map<string, CachedPdf>>(new Map());
  const isDownloading = ref<Set<string>>(new Set());

  // Computed cache statistics
  const cacheStats = computed(() => {
    const entries = Array.from(cachedPdfs.value.values());
    const totalSize = entries.reduce((sum, pdf) => sum + pdf.fileSize, 0);
    const totalSizeMB = totalSize / (1024 * 1024);

    return {
      entryCount: entries.length,
      totalSizeMB: Math.round(totalSizeMB * 100) / 100,
      percentFull: Math.round((totalSizeMB / cacheConfig.maxCacheSizeMB) * 100),
    };
  });

  /**
   * Generate a cache key for a URL
   */
  function getCacheKey(url: string): string {
    // Extract Google Drive file ID or use full URL hash
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (driveMatch) {
      return `gd_${driveMatch[1]}`;
    }

    // For other URLs, create a simple hash
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `url_${Math.abs(hash)}`;
  }

  /**
   * Convert Google Drive URL to direct download URL
   */
  function convertToDownloadUrl(url: string): string[] {
    // Return multiple URL strategies to try
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (driveMatch) {
      const fileId = driveMatch[1];
      return [
        // Strategy 1: Direct download (works for public files)
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        // Strategy 2: Open download (sometimes works)
        `https://drive.google.com/u/0/uc?id=${fileId}&export=download`,
        // Strategy 3: Alternative format
        `https://docs.google.com/document/d/${fileId}/export?format=pdf`,
        // Strategy 4: Fallback to original (might work in some cases)
        url,
      ];
    }

    return [url];
  } /**
   * Check if a PDF is cached and not expired
   */
  function isCached(url: string): boolean {
    const key = getCacheKey(url);
    const cached = cachedPdfs.value.get(key);

    if (!cached) return false;

    // Check if expired
    const ageHours = (Date.now() - cached.lastCached.getTime()) / (1000 * 60 * 60);
    if (ageHours > cacheConfig.maxAgeHours) {
      // Remove expired entry
      removeCached(url);
      return false;
    }

    return true;
  }

  /**
   * Get cached PDF URL if available
   */
  function getCachedUrl(url: string): string | null {
    const key = getCacheKey(url);
    const cached = cachedPdfs.value.get(key);
    return cached?.cachedUrl || null;
  }

  /**
   * Download and cache a PDF from Google Drive or other source
   */
  async function downloadAndCache(url: string, fileName?: string): Promise<string> {
    const key = getCacheKey(url);

    // Return cached version if available
    if (isCached(url)) {
      const cached = cachedPdfs.value.get(key)!;
      return cached.cachedUrl;
    }

    // Prevent duplicate downloads
    if (isDownloading.value.has(key)) {
      // Wait for existing download to complete
      while (isDownloading.value.has(key)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      // Try to get the cached result
      const cached = cachedPdfs.value.get(key);
      if (cached) return cached.cachedUrl;
    }

    isDownloading.value.add(key);

    try {
      const downloadUrls = convertToDownloadUrl(url);
      const firstUrl = downloadUrls[0];
      if (!firstUrl) {
        throw new Error('No download URL available');
      }

      console.log(`📥 Downloading PDF: ${firstUrl}`);

      const response = await fetch(firstUrl, {
        method: 'GET',
        mode: 'cors', // Try CORS first
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Verify it's actually a PDF
      if (blob.type !== 'application/pdf') {
        console.warn(`Warning: Downloaded file is ${blob.type}, not application/pdf`);
      }

      const cachedUrl = URL.createObjectURL(blob);
      const detectedFileName = fileName || getFileNameFromUrl(url) || `pdf_${key}.pdf`;

      const cached: CachedPdf = {
        id: key,
        originalUrl: url,
        cachedBlob: blob,
        cachedUrl,
        fileName: detectedFileName,
        fileSize: blob.size,
        lastCached: new Date(),
      };

      // Check cache size limits before adding
      ensureCacheSpace(blob.size);

      cachedPdfs.value.set(key, cached);
      console.log(`✅ PDF cached: ${detectedFileName} (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);

      return cachedUrl;
    } catch (error) {
      console.error(`❌ Failed to download/cache PDF from ${url}:`, error);
      throw error;
    } finally {
      isDownloading.value.delete(key);
    }
  }

  /**
   * Extract filename from URL
   */
  function getFileNameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const fileName = path.split('/').pop();
      return fileName && fileName.includes('.') ? fileName : null;
    } catch {
      return null;
    }
  }

  /**
   * Ensure there's enough space in cache for new content
   */
  function ensureCacheSpace(newFileSize: number): void {
    const maxBytes = cacheConfig.maxCacheSizeMB * 1024 * 1024;
    const currentSize = Array.from(cachedPdfs.value.values()).reduce(
      (sum, pdf) => sum + pdf.fileSize,
      0,
    );

    if (currentSize + newFileSize <= maxBytes) {
      return; // Enough space
    }

    // Remove oldest entries until we have space
    const entries = Array.from(cachedPdfs.value.entries()).sort(
      ([, a], [, b]) => a.lastCached.getTime() - b.lastCached.getTime(),
    );

    let removedSize = 0;
    for (const [key, pdf] of entries) {
      URL.revokeObjectURL(pdf.cachedUrl);
      cachedPdfs.value.delete(key);
      removedSize += pdf.fileSize;

      console.log(`🗑️ Removed cached PDF: ${pdf.fileName} to free space`);

      if (currentSize + newFileSize - removedSize <= maxBytes) {
        break;
      }
    }
  }

  /**
   * Remove a specific cached PDF
   */
  function removeCached(url: string): void {
    const key = getCacheKey(url);
    const cached = cachedPdfs.value.get(key);
    if (cached) {
      URL.revokeObjectURL(cached.cachedUrl);
      cachedPdfs.value.delete(key);
      console.log(`🗑️ Removed cached PDF: ${cached.fileName}`);
    }
  }

  /**
   * Clear all cached PDFs
   */
  function clearCache(): void {
    for (const cached of cachedPdfs.value.values()) {
      URL.revokeObjectURL(cached.cachedUrl);
    }
    cachedPdfs.value.clear();
    console.log('🗑️ PDF cache cleared');
  }

  /**
   * Get a list of all cached PDFs
   */
  function getCachedList(): CachedPdf[] {
    return Array.from(cachedPdfs.value.values()).sort(
      (a, b) => b.lastCached.getTime() - a.lastCached.getTime(),
    );
  }

  return {
    // State
    cacheStats,
    isDownloading: computed(() => isDownloading.value.size > 0),

    // Methods
    isCached,
    getCachedUrl,
    downloadAndCache,
    removeCached,
    clearCache,
    getCachedList,

    // Utils
    getCacheKey,
    convertToDownloadUrl,
  };
}
