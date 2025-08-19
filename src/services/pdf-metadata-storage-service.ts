/**
 * PDF Metadata Storage Service
 * Handles one-time PDF processing with intelligent caching and persistence
 */

export interface PDFMetadataIndex {
  filename: string;
  title: string;
  pages: number;
  fileSize: string;
  hash: string; // File hash for cache invalidation
  lastProcessed: number; // Timestamp
  extractedText?: string; // Full text content (IndexedDB only)
  searchableTerms: string[]; // Optimized search terms
  topics: string[]; // Extracted topics
  contentType: 'newsletter' | 'special' | 'annual';
  thumbnailDataUrl?: string; // Base64 thumbnail
}

export interface PDFProcessingQueue {
  filename: string;
  url: string;
  priority: number; // 1-10, higher = more important
  retryCount: number;
  lastAttempt?: number;
}

class PDFMetadataStorageService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'clca-pdf-metadata';
  private readonly DB_VERSION = 1;
  private readonly CACHE_EXPIRY_DAYS = 30;

  // Quick access cache (localStorage)
  private quickCache = new Map<string, Omit<PDFMetadataIndex, 'extractedText'>>();

  // Processing queue
  private processingQueue: PDFProcessingQueue[] = [];
  private isProcessing = false;

  constructor() {
    void this.initializeStorage();
    this.loadQuickCache();
  }

  /**
   * Initialize IndexedDB for rich metadata storage
   */
  private async initializeStorage(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () =>
        reject(new Error(request.error?.message || 'IndexedDB initialization failed'));
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Metadata store for full PDF data
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'filename' });
          metadataStore.createIndex('hash', 'hash', { unique: false });
          metadataStore.createIndex('lastProcessed', 'lastProcessed', { unique: false });
          metadataStore.createIndex('contentType', 'contentType', { unique: false });
        }

        // Processing queue store
        if (!db.objectStoreNames.contains('queue')) {
          const queueStore = db.createObjectStore('queue', { keyPath: 'filename' });
          queueStore.createIndex('priority', 'priority', { unique: false });
        }
      };
    });
  }

  /**
   * Load quick cache from localStorage
   */
  private loadQuickCache(): void {
    try {
      const cached = localStorage.getItem('pdf-quick-cache');
      if (cached) {
        const data = JSON.parse(cached);
        Object.entries(data).forEach(([filename, metadata]) => {
          this.quickCache.set(filename, metadata as Omit<PDFMetadataIndex, 'extractedText'>);
        });
        console.log(`[PDFMetadataStorage] Loaded ${this.quickCache.size} items from quick cache`);
      }
    } catch (error) {
      console.warn('[PDFMetadataStorage] Failed to load quick cache:', error);
    }
  }

  /**
   * Save quick cache to localStorage
   */
  private saveQuickCache(): void {
    try {
      const data = Object.fromEntries(this.quickCache);
      localStorage.setItem('pdf-quick-cache', JSON.stringify(data));
    } catch (error) {
      console.warn('[PDFMetadataStorage] Failed to save quick cache:', error);
    }
  }

  /**
   * Get metadata from cache (quick check)
   */
  getQuickMetadata(filename: string): Omit<PDFMetadataIndex, 'extractedText'> | null {
    return this.quickCache.get(filename) || null;
  }

  /**
   * Get full metadata including extracted text (from IndexedDB)
   */
  async getFullMetadata(filename: string): Promise<PDFMetadataIndex | null> {
    if (!this.db) await this.initializeStorage();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(filename);

      request.onsuccess = () => {
        const result = request.result;
        if (result && this.isMetadataValid(result)) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () =>
        reject(new Error(request.error?.message || 'Failed to get metadata from IndexedDB'));
    });
  }

  /**
   * Check if metadata is still valid (not expired)
   */
  private isMetadataValid(metadata: PDFMetadataIndex): boolean {
    const expiryTime = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - metadata.lastProcessed < expiryTime;
  }

  /**
   * Store metadata (both quick cache and IndexedDB)
   */
  async storeMetadata(metadata: PDFMetadataIndex): Promise<void> {
    // Store in quick cache (without extracted text for size optimization)
    const quickData: Omit<PDFMetadataIndex, 'extractedText'> = {
      filename: metadata.filename,
      title: metadata.title,
      pages: metadata.pages,
      fileSize: metadata.fileSize,
      hash: metadata.hash,
      lastProcessed: metadata.lastProcessed,
      searchableTerms: metadata.searchableTerms,
      topics: metadata.topics,
      contentType: metadata.contentType,
      ...(metadata.thumbnailDataUrl && { thumbnailDataUrl: metadata.thumbnailDataUrl }),
    };

    this.quickCache.set(metadata.filename, quickData);
    this.saveQuickCache();

    // Store full data in IndexedDB
    if (!this.db) await this.initializeStorage();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put(metadata);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(request.error?.message || 'Failed to store metadata in IndexedDB'));
    });
  }

  /**
   * Add PDF to processing queue
   */
  addToQueue(filename: string, url: string, priority: number = 5): void {
    // Check if already processed or in queue
    if (this.quickCache.has(filename)) return;

    const existingIndex = this.processingQueue.findIndex((item) => item.filename === filename);
    if (existingIndex >= 0) return;

    const queueItem: PDFProcessingQueue = {
      filename,
      url,
      priority,
      retryCount: 0,
    };

    this.processingQueue.push(queueItem);

    // Sort by priority (higher first)
    this.processingQueue.sort((a, b) => b.priority - a.priority);

    // Start processing if not already running
    if (!this.isProcessing) {
      void this.processQueue();
    }
  }

  /**
   * Process queue items one by one (background processing)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;

    this.isProcessing = true;
    console.log(
      `[PDFMetadataStorage] Starting queue processing: ${this.processingQueue.length} items`,
    );

    while (this.processingQueue.length > 0) {
      const item = this.processingQueue.shift()!;

      try {
        await this.processSinglePDF(item);
        console.log(`[PDFMetadataStorage] ✓ Processed: ${item.filename}`);
      } catch (error) {
        console.warn(`[PDFMetadataStorage] ✗ Failed: ${item.filename}`, error);

        // Retry logic
        item.retryCount++;
        item.lastAttempt = Date.now();

        if (item.retryCount < 3) {
          // Re-queue with lower priority
          item.priority = Math.max(1, item.priority - 1);
          this.processingQueue.push(item);
          this.processingQueue.sort((a, b) => b.priority - a.priority);
        }
      }

      // Small delay to prevent overwhelming the browser
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    this.isProcessing = false;
    console.log('[PDFMetadataStorage] Queue processing completed');
  }

  /**
   * Process a single PDF file
   */
  private async processSinglePDF(item: PDFProcessingQueue): Promise<void> {
    const { filename, url } = item;

    // Use existing PDF metadata service for processing
    const { pdfMetadataService } = await import('../services/pdf-metadata-service');
    const pdfMetadata = await pdfMetadataService.extractPDFMetadata(url, filename);

    if (!pdfMetadata) {
      throw new Error(`Failed to extract metadata for ${filename}`);
    }

    // Generate file hash for cache invalidation
    const hash = await this.generateFileHash(url);

    // Extract searchable terms from content
    const searchableTerms = this.extractSearchTerms(
      pdfMetadata.textContent || '',
      pdfMetadata.title,
      filename,
    );

    // Create metadata index
    const metadataIndex: PDFMetadataIndex = {
      filename,
      title: pdfMetadata.title,
      pages: pdfMetadata.pages,
      fileSize: pdfMetadata.fileSize,
      hash,
      lastProcessed: Date.now(),
      ...(pdfMetadata.textContent && { extractedText: pdfMetadata.textContent }),
      searchableTerms,
      topics: pdfMetadata.extractedTopics || [],
      contentType: pdfMetadata.contentType || 'newsletter',
      ...(pdfMetadata.thumbnailDataUrl && { thumbnailDataUrl: pdfMetadata.thumbnailDataUrl }),
    };

    await this.storeMetadata(metadataIndex);
  }

  /**
   * Generate simple hash for file change detection
   */
  private async generateFileHash(url: string): Promise<string> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const lastModified = response.headers.get('last-modified');
      const contentLength = response.headers.get('content-length');
      return btoa(`${url}:${lastModified}:${contentLength}`).substring(0, 16);
    } catch {
      return btoa(url).substring(0, 16);
    }
  }

  /**
   * Extract searchable terms from content
   */
  private extractSearchTerms(text: string, title: string, filename: string): string[] {
    const terms = new Set<string>();

    // Add title words
    title
      .toLowerCase()
      .split(/\s+/)
      .forEach((word) => {
        if (word.length > 2) terms.add(word);
      });

    // Add filename words
    filename
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .forEach((word) => {
        if (word.length > 2) terms.add(word);
      });

    // Add significant words from content
    if (text) {
      const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 3)
        .filter((word) => !this.isStopWord(word));

      // Take most frequent words
      const wordCount = new Map<string, number>();
      words.forEach((word) => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      });

      Array.from(wordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .forEach(([word]) => terms.add(word));
    }

    return Array.from(terms);
  }

  /**
   * Check if word is a common stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the',
      'and',
      'for',
      'are',
      'but',
      'not',
      'you',
      'all',
      'can',
      'had',
      'her',
      'was',
      'one',
      'our',
      'out',
      'day',
      'get',
      'has',
      'him',
      'his',
      'how',
      'its',
      'new',
      'now',
      'old',
      'see',
      'two',
      'who',
      'boy',
      'did',
      'has',
      'let',
      'put',
      'say',
      'she',
      'too',
      'use',
    ]);
    return stopWords.has(word);
  }

  /**
   * Search in cached metadata
   */
  searchCachedContent(query: string): Array<{ filename: string; score: number; snippet?: string }> {
    const queryLower = query.toLowerCase();
    const results: Array<{ filename: string; score: number; snippet?: string }> = [];

    this.quickCache.forEach((metadata, filename) => {
      let score = 0;

      // Search in title
      if (metadata.title.toLowerCase().includes(queryLower)) {
        score += 100;
      }

      // Search in searchable terms
      const matchingTerms = metadata.searchableTerms.filter((term) => term.includes(queryLower));
      score += matchingTerms.length * 10;

      // Search in topics
      const matchingTopics = metadata.topics.filter((topic) =>
        topic.toLowerCase().includes(queryLower),
      );
      score += matchingTopics.length * 20;

      if (score > 0) {
        results.push({
          filename,
          score,
          snippet: `${metadata.title} - ${matchingTopics.join(', ')}`,
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    quickCacheSize: number;
    queueLength: number;
    isProcessing: boolean;
    cacheHitRate?: number;
  } {
    return {
      quickCacheSize: this.quickCache.size,
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear all caches and restart
   */
  async clearAllCaches(): Promise<void> {
    // Clear quick cache
    this.quickCache.clear();
    localStorage.removeItem('pdf-quick-cache');

    // Clear IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['metadata', 'queue'], 'readwrite');
      await Promise.all([
        new Promise((resolve) => {
          const request = transaction.objectStore('metadata').clear();
          request.onsuccess = () => resolve(void 0);
        }),
        new Promise((resolve) => {
          const request = transaction.objectStore('queue').clear();
          request.onsuccess = () => resolve(void 0);
        }),
      ]);
    }

    // Clear processing queue
    this.processingQueue = [];
    this.isProcessing = false;

    console.log('[PDFMetadataStorage] All caches cleared');
  }

  /**
   * Bulk add multiple PDFs to processing queue
   */
  bulkAddToQueue(items: Array<{ filename: string; url: string; priority?: number }>): void {
    for (const item of items) {
      this.addToQueue(item.filename, item.url, item.priority || 5);
    }
    console.log(`[PDFMetadataStorage] Added ${items.length} items to processing queue`);
  }
}

// Export singleton instance
export const pdfMetadataStorageService = new PDFMetadataStorageService();
