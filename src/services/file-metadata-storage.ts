// src/services/file-metadata-storage.ts
// Client-side file metadata storage using IndexedDB
// Based on DeepSeek recommendations for offline-capable data management

export interface StoredFileMetadata {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded: string;
  tags: string[];
  thumbnail?: string;
  mimeType?: string;
  webViewLink?: string;
  webContentLink?: string;
  lastAccessed?: string;
  isCached?: boolean;
}

export interface SearchFilter {
  type?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchText?: string;
}

export class FileMetadataStorage {
  private static instance: FileMetadataStorage;
  private db: IDBDatabase | null = null;
  private readonly dbName = 'PublicationDatabase';
  private readonly version = 1;
  private readonly storeName = 'files';

  private constructor() {}

  static getInstance(): FileMetadataStorage {
    if (!FileMetadataStorage.instance) {
      FileMetadataStorage.instance = new FileMetadataStorage();
    }
    return FileMetadataStorage.instance;
  }

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });

          // Create indexes for efficient searching
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('uploaded', 'uploaded', { unique: false });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
      };
    });
  }

  /**
   * Store file metadata
   */
  async storeFile(fileMetadata: StoredFileMetadata): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Add timestamp
      const dataToStore = {
        ...fileMetadata,
        lastAccessed: new Date().toISOString(),
      };

      const request = store.put(dataToStore);

      request.onerror = () => {
        reject(new Error('Failed to store file metadata'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Retrieve all files
   */
  async getAllFiles(): Promise<StoredFileMetadata[]> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => {
        reject(new Error('Failed to retrieve files'));
      };

      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
  }

  /**
   * Get a single file by ID
   */
  async getFile(id: string): Promise<StoredFileMetadata | null> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onerror = () => {
        reject(new Error('Failed to retrieve file'));
      };

      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  /**
   * Update file metadata
   */
  async updateFile(id: string, updates: Partial<StoredFileMetadata>): Promise<void> {
    const existingFile = await this.getFile(id);

    if (!existingFile) {
      throw new Error('File not found');
    }

    const updatedFile: StoredFileMetadata = {
      ...existingFile,
      ...updates,
      id, // Ensure ID doesn't change
      lastAccessed: new Date().toISOString(),
    };

    await this.storeFile(updatedFile);
  }

  /**
   * Delete file metadata
   */
  async deleteFile(id: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onerror = () => {
        reject(new Error('Failed to delete file'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Search files with filters
   */
  async searchFiles(filter: SearchFilter): Promise<StoredFileMetadata[]> {
    const allFiles = await this.getAllFiles();

    return allFiles.filter((file) => {
      // Filter by type
      if (filter.type && file.type !== filter.type) {
        return false;
      }

      // Filter by tags
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some((tag) => file.tags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Filter by date range
      if (filter.dateRange) {
        const fileDate = new Date(file.uploaded);
        const startDate = new Date(filter.dateRange.start);
        const endDate = new Date(filter.dateRange.end);

        if (fileDate < startDate || fileDate > endDate) {
          return false;
        }
      }

      // Filter by search text
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const nameMatch = file.name.toLowerCase().includes(searchLower);
        const tagMatch = file.tags.some((tag) => tag.toLowerCase().includes(searchLower));

        if (!nameMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: string;
    filesByType: Record<string, number>;
  }> {
    const files = await this.getAllFiles();

    const stats: {
      totalFiles: number;
      totalSize: string;
      filesByType: Record<string, number>;
    } = {
      totalFiles: files.length,
      totalSize: '0 B',
      filesByType: {},
    };

    if (files.length === 0) {
      return stats;
    }

    // Calculate total size (approximate from size strings)
    let totalBytes = 0;
    files.forEach((file) => {
      // Extract numeric value from size string (e.g., "1.5 MB" -> 1.5)
      const sizeMatch = file.size.match(/^([\d.]+)/);
      if (sizeMatch && sizeMatch[1]) {
        const value = parseFloat(sizeMatch[1]);
        if (file.size.includes('GB')) {
          totalBytes += value * 1024 * 1024 * 1024;
        } else if (file.size.includes('MB')) {
          totalBytes += value * 1024 * 1024;
        } else if (file.size.includes('KB')) {
          totalBytes += value * 1024;
        } else {
          totalBytes += value;
        }
      }
    });

    // Format total size
    if (totalBytes >= 1024 * 1024 * 1024) {
      stats.totalSize = `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    } else if (totalBytes >= 1024 * 1024) {
      stats.totalSize = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (totalBytes >= 1024) {
      stats.totalSize = `${(totalBytes / 1024).toFixed(1)} KB`;
    } else {
      stats.totalSize = `${totalBytes} B`;
    }

    // Count file types
    files.forEach((file) => {
      stats.filesByType[file.type] = (stats.filesByType[file.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Bulk store multiple files
   */
  async bulkStoreFiles(files: StoredFileMetadata[]): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      let completed = 0;
      const total = files.length;

      if (total === 0) {
        resolve();
        return;
      }

      files.forEach((file) => {
        // Add timestamp and ensure proper serialization
        const dataToStore = {
          ...file,
          tags: Array.isArray(file.tags) ? [...file.tags] : [],
          lastAccessed: new Date().toISOString(),
        };

        const request = store.put(dataToStore);

        request.onerror = (event) => {
          console.error('IndexedDB bulk storage error:', event);
          reject(
            new Error(
              `Failed to store file metadata: ${(event.target as IDBRequest).error?.message}`,
            ),
          );
        };

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
      });
    });
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => {
        reject(new Error('Failed to clear storage'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }
}

export const fileMetadataStorage = FileMetadataStorage.getInstance();
