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
   * Get file by ID
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
        const hasMatchingTag = filter.tags.some((tag) =>
          file.tags.some((fileTag) => fileTag.toLowerCase().includes(tag.toLowerCase())),
        );
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
   * Update file metadata (e.g., add tags, update thumbnail)
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
   * Get files by type (e.g., all PDFs)
   */
  async getFilesByType(type: string): Promise<StoredFileMetadata[]> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('type');
      const request = index.getAll(type);

      request.onerror = () => {
        reject(new Error('Failed to retrieve files by type'));
      };

      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
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
        const dataToStore = {
          ...file,
          lastAccessed: new Date().toISOString(),
        };

        const request = store.put(dataToStore);

        request.onerror = () => {
          reject(new Error('Failed to store file metadata'));
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

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: string;
    filesByType: Record<string, number>;
  }> {
    const files = await this.getAllFiles();

    const stats = {
      totalFiles: files.length,
      totalSize: this.calculateTotalSize(files),
      filesByType: {} as Record<string, number>,
    };

    files.forEach((file) => {
      stats.filesByType[file.type] = (stats.filesByType[file.type] || 0) + 1;
    });

    return stats;
  }

  private calculateTotalSize(files: StoredFileMetadata[]): string {
    let totalBytes = 0;

    files.forEach((file) => {
      // Parse size string (e.g., "2.5 MB" -> bytes)
      const sizeMatch = file.size.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
      if (sizeMatch && sizeMatch[1] && sizeMatch[2]) {
        const value = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2].toUpperCase();

        const multipliers = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
        totalBytes += value * (multipliers[unit as keyof typeof multipliers] || 1);
      }
    });

    // Convert back to human readable
    if (totalBytes >= 1024 * 1024 * 1024) {
      return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    } else if (totalBytes >= 1024 * 1024) {
      return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (totalBytes >= 1024) {
      return `${(totalBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${totalBytes} B`;
    }
  }
}

export const fileMetadataStorage = FileMetadataStorage.getInstance();
