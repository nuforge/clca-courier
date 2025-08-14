// src/services/external-image-service.ts
export interface ImageCacheOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  forceRefresh?: boolean;
  maxAge?: number; // in milliseconds
}

export interface CachedImage {
  url: string;
  data: ArrayBuffer;
  mimeType: string;
  timestamp: number;
  size: number;
  objectUrl?: string;
  metadata?: {
    originalUrl: string;
    cacheKey: string;
    width?: number;
    height?: number;
    compressed?: boolean;
  };
}

export class ExternalImageService {
  private static instance: ExternalImageService;
  private db: IDBDatabase | null = null;
  private readonly dbName = 'external-image-cache';
  private readonly dbVersion = 1;
  private readonly storeName = 'images';
  private readonly maxCacheSize = 50 * 1024 * 1024; // 50MB
  private readonly defaultOptions: Required<ImageCacheOptions> = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.9,
    forceRefresh: false,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  private constructor() {}

  static getInstance(): ExternalImageService {
    if (!ExternalImageService.instance) {
      ExternalImageService.instance = new ExternalImageService();
    }
    return ExternalImageService.instance;
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  /**
   * Generate cache key from URL and options
   */
  private generateCacheKey(url: string, options: ImageCacheOptions): string {
    const optionString = JSON.stringify({
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
      quality: options.quality,
    });
    return `${url}:${btoa(optionString)}`;
  }

  /**
   * Check if URL is a local/relative path that should be allowed
   */
  private isLocalUrl(url: string): boolean {
    return (
      url.startsWith('/') ||
      url.startsWith('./') ||
      url.startsWith('../') ||
      url.startsWith('data:') ||
      !url.includes('://')
    );
  }

  /**
   * Process image blob with resize and compression
   */
  private async processImage(blob: Blob, options: ImageCacheOptions): Promise<Blob> {
    // If no processing needed, return original blob
    if (!options.maxWidth && !options.maxHeight && !options.quality) {
      return blob;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Calculate new dimensions
        let { width, height } = img;

        if (options.maxWidth && width > options.maxWidth) {
          height = (height * options.maxWidth) / width;
          width = options.maxWidth;
        }

        if (options.maxHeight && height > options.maxHeight) {
          width = (width * options.maxHeight) / height;
          height = options.maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (processedBlob) => {
            resolve(processedBlob || blob);
          },
          'image/jpeg',
          options.quality || 0.8,
        );
      };

      img.onerror = () => resolve(blob);
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Cache processed image blob
   */
  private async cacheImage(cacheKey: string, blob: Blob): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) return;

    const arrayBuffer = await blob.arrayBuffer();
    const objectUrl = URL.createObjectURL(blob);

    const cachedImage: CachedImage = {
      url: cacheKey,
      data: arrayBuffer,
      mimeType: blob.type || 'image/jpeg',
      timestamp: Date.now(),
      size: blob.size,
      objectUrl,
      metadata: {
        originalUrl: cacheKey,
        cacheKey,
        compressed: true,
      },
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(cachedImage);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(request.error?.message || 'Cache save error'));
    });
  }

  /**
   * Get cached image from IndexedDB
   */
  private async getCachedImage(cacheKey: string): Promise<CachedImage | null> {
    if (!this.db) await this.initDB();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(cacheKey);

      request.onsuccess = () => {
        const cachedImage = request.result as CachedImage | undefined;

        if (cachedImage && cachedImage.objectUrl) {
          // Check if cached object URL is still valid
          const img = new Image();
          img.onload = () => resolve(cachedImage);
          img.onerror = () => {
            // Object URL is invalid, create new one
            const blob = new Blob([cachedImage.data], { type: cachedImage.mimeType });
            cachedImage.objectUrl = URL.createObjectURL(blob);
            resolve(cachedImage);
          };
          img.src = cachedImage.objectUrl;
        } else if (cachedImage) {
          // Create object URL for cached data
          const blob = new Blob([cachedImage.data], { type: cachedImage.mimeType });
          cachedImage.objectUrl = URL.createObjectURL(blob);
          resolve(cachedImage);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(new Error(request.error?.message || 'Cache read error'));
    });
  }

  /**
   * Fetch and cache an external image
   */
  async getImage(url: string, options: ImageCacheOptions = {}): Promise<string | null> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };

      // Allow local URLs to pass through without processing
      if (this.isLocalUrl(url)) {
        return url;
      }

      const cacheKey = this.generateCacheKey(url, options);

      // Check cache first
      const cachedImage = await this.getCachedImage(cacheKey);

      if (cachedImage) {
        // Return cached object URL
        const isExpired = Date.now() - cachedImage.timestamp > mergedOptions.maxAge;
        if (!isExpired && !mergedOptions.forceRefresh) {
          return cachedImage.objectUrl || null;
        }
      }

      // Try to fetch the external image
      try {
        const response = await fetch(url, {
          mode: 'cors',
          headers: {
            Accept: 'image/*',
          },
        });

        if (!response.ok) {
          console.warn(`Failed to fetch image: ${response.status} ${response.statusText}`, url);
          return null;
        }

        const blob = await response.blob();
        const processedBlob = await this.processImage(blob, mergedOptions);

        // Cache the processed image
        await this.cacheImage(cacheKey, processedBlob);

        // Create and return object URL
        const objectUrl = URL.createObjectURL(processedBlob);
        return objectUrl;
      } catch (error) {
        console.warn('CORS or network error loading external image:', error, 'URL:', url);
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch external image:', error);
      return null;
    }
  }

  /**
   * Preload an image into cache
   */
  async preloadImage(url: string, options: ImageCacheOptions = {}): Promise<boolean> {
    try {
      const imageUrl = await this.getImage(url, options);
      return imageUrl !== null;
    } catch (error) {
      console.error('Failed to preload image:', error);
      return false;
    }
  }

  /**
   * Clear all cached images
   */
  async clearCache(): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(request.error?.message || 'Cache clear error'));
    });
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ count: number; totalSize: number; oldestEntry?: number }> {
    if (!this.db) await this.initDB();
    if (!this.db) return { count: 0, totalSize: 0 };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const images = request.result as CachedImage[];
        const count = images.length;
        const totalSize = images.reduce((sum, img) => sum + img.size, 0);
        const stats: { count: number; totalSize: number; oldestEntry?: number } = {
          count,
          totalSize,
        };

        if (images.length > 0) {
          stats.oldestEntry = Math.min(...images.map((img) => img.timestamp));
        }

        resolve(stats);
      };

      request.onerror = () => reject(new Error(request.error?.message || 'Cache stats error'));
    });
  }
}

// Export singleton instance
export const externalImageService = ExternalImageService.getInstance();
