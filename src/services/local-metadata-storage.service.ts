/**
 * Local Metadata Storage Service
 *
 * Stores extracted PDF metadata locally in IndexedDB before syncing to Firebase.
 * This allows for local extraction and later batch commits.
 */

export interface ExtractedMetadata {
  filename: string;
  newsletterId: string;
  searchableText: string;
  wordCount: number;
  readingTimeMinutes: number;
  textExtractionVersion: string;
  textExtractedAt: string;
  keywordCounts: Record<string, number>;
  extractedAt: string;
  status: 'pending' | 'synced' | 'error';
  errorMessage?: string;
}

class LocalMetadataStorageService {
  private dbName = 'newsletter-metadata';
  private storeName = 'extracted-metadata';
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () =>
        reject(new Error(request.error?.message || 'Database initialization failed'));
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'newsletterId' });
          store.createIndex('filename', 'filename', { unique: true });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('extractedAt', 'extractedAt', { unique: false });
        }
      };
    });
  }

  async storeExtractedMetadata(metadata: ExtractedMetadata): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(metadata);

      request.onerror = () =>
        reject(new Error(request.error?.message || 'Failed to store metadata'));
      request.onsuccess = () => resolve();
    });
  }

  async getExtractedMetadata(newsletterId: string): Promise<ExtractedMetadata | null> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(newsletterId);

      request.onerror = () => reject(new Error(request.error?.message || 'Failed to get metadata'));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllExtractedMetadata(): Promise<ExtractedMetadata[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () =>
        reject(new Error(request.error?.message || 'Failed to get all metadata'));
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async getPendingMetadata(): Promise<ExtractedMetadata[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onerror = () =>
        reject(new Error(request.error?.message || 'Failed to get pending metadata'));
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async markAsSynced(newsletterId: string): Promise<void> {
    const metadata = await this.getExtractedMetadata(newsletterId);
    if (metadata) {
      metadata.status = 'synced';
      await this.storeExtractedMetadata(metadata);
    }
  }

  async markAsError(newsletterId: string, errorMessage: string): Promise<void> {
    const metadata = await this.getExtractedMetadata(newsletterId);
    if (metadata) {
      metadata.status = 'error';
      metadata.errorMessage = errorMessage;
      await this.storeExtractedMetadata(metadata);
    }
  }

  async deleteExtractedMetadata(newsletterId: string): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(newsletterId);

      request.onerror = () =>
        reject(new Error(request.error?.message || 'Failed to delete metadata'));
      request.onsuccess = () => resolve();
    });
  }

  async clearAllMetadata(): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () =>
        reject(new Error(request.error?.message || 'Failed to clear metadata'));
      request.onsuccess = () => resolve();
    });
  }

  async getStorageStats(): Promise<{
    total: number;
    pending: number;
    synced: number;
    errors: number;
  }> {
    const all = await this.getAllExtractedMetadata();

    return {
      total: all.length,
      pending: all.filter((m) => m.status === 'pending').length,
      synced: all.filter((m) => m.status === 'synced').length,
      errors: all.filter((m) => m.status === 'error').length,
    };
  }
}

export const localMetadataStorageService = new LocalMetadataStorageService();
