// Storage service for managing user settings and data persistence
// Combines localStorage for simple settings and IndexedDB for complex data

import { logger } from '../utils/logger';

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    browser: boolean;
    email: boolean;
    issues: boolean;
    events: boolean;
  };
  display: {
    compactMode: boolean;
    animationsEnabled: boolean;
    autoplayVideos: boolean;
    sideMenuCollapsed: boolean;
  };
  pdf: {
    defaultZoom: number;
    pageLayout: 'single' | 'facing' | 'cover';
    thumbnailSize: 'small' | 'medium' | 'large';
  };
}

interface StoredSettings {
  id: string;
  userId: string;
  data: UserSettings;
  timestamp: number;
}

interface CacheItem {
  key: string;
  data: unknown;
  category: string;
  timestamp: number;
  ttl: number | null;
}

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  theme: 'auto',
  language: 'en-US',
  notifications: {
    browser: true,
    email: false,
    issues: true,
    events: true,
  },
  display: {
    compactMode: false,
    animationsEnabled: true,
    autoplayVideos: false,
    sideMenuCollapsed: false,
  },
  pdf: {
    defaultZoom: 1.0,
    pageLayout: 'cover',
    thumbnailSize: 'medium',
  },
};

// IndexedDB configuration
const DB_NAME = 'clca-courier-storage';
const DB_VERSION = 1;
const SETTINGS_STORE = 'user-settings';
const CACHE_STORE = 'app-cache';

class StorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initializeDB();
  }

  // Helper method to ensure data is serializable for IndexedDB
  private serializeForIndexedDB<T>(data: T): T {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      logger.warn('Failed to serialize data for IndexedDB:', error);
      throw new Error('Data contains non-serializable values');
    }
  }

  // Initialize IndexedDB
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('Failed to open IndexedDB:', request.error);
        reject(new Error(request.error?.message || 'Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create user settings store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          const settingsStore = db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
          settingsStore.createIndex('userId', 'userId', { unique: false });
        }

        // Create cache store for app data
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          const cacheStore = db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
          cacheStore.createIndex('category', 'category', { unique: false });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Ensure DB is initialized
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  // localStorage methods for simple settings
  private getFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      logger.warn(`Failed to parse localStorage item ${key}:`, error);
      return defaultValue;
    }
  }

  private setToLocalStorage(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error(`Failed to set localStorage item ${key}:`, error);
    }
  }

  // User Settings Management
  async getUserSettings(): Promise<UserSettings> {
    // First try localStorage for immediate access
    const localSettings = this.getFromLocalStorage<Partial<UserSettings> | null>(
      'clca-user-settings',
      null,
    );
    if (localSettings) {
      // Merge with defaults to ensure all properties exist
      return { ...DEFAULT_SETTINGS, ...localSettings } as UserSettings;
    }

    // Fallback to IndexedDB if available
    try {
      await this.ensureInitialized();
      if (this.db) {
        const settings = (await this.getFromIndexedDB(
          SETTINGS_STORE,
          'default',
        )) as StoredSettings | null;
        if (settings?.data) {
          const mergedSettings = { ...DEFAULT_SETTINGS, ...settings.data };
          // Sync back to localStorage for faster access
          this.setToLocalStorage('clca-user-settings', mergedSettings);
          return mergedSettings;
        }
      }
    } catch (error) {
      logger.warn('Failed to load settings from IndexedDB:', error);
    }

    // Return defaults if nothing found
    return DEFAULT_SETTINGS;
  }

  async saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
    // Get current settings and merge
    const currentSettings = await this.getUserSettings();
    const updatedSettings = { ...currentSettings, ...settings };

    // Save to localStorage immediately
    this.setToLocalStorage('clca-user-settings', updatedSettings);

    // Also save to IndexedDB for persistence
    try {
      await this.ensureInitialized();
      if (this.db) {
        // Ensure data is serializable by converting to plain object
        const serializedData = this.serializeForIndexedDB({
          id: 'default',
          userId: 'default',
          data: updatedSettings,
          timestamp: Date.now(),
        });

        await this.saveToIndexedDB(SETTINGS_STORE, serializedData);
      }
    } catch (error) {
      logger.error('Failed to save settings to IndexedDB:', error);
    }
  }

  // Specific setting getters/setters for convenience
  async getTheme(): Promise<'light' | 'dark' | 'auto'> {
    const settings = await this.getUserSettings();
    return settings.theme;
  }

  async setTheme(theme: 'light' | 'dark' | 'auto'): Promise<void> {
    await this.saveUserSettings({ theme });
  }

  async getNotificationSettings() {
    const settings = await this.getUserSettings();
    return settings.notifications;
  }

  async setNotificationSettings(
    notifications: Partial<UserSettings['notifications']>,
  ): Promise<void> {
    const current = await this.getUserSettings();
    await this.saveUserSettings({
      notifications: { ...current.notifications, ...notifications },
    });
  }

  async getDisplaySettings() {
    const settings = await this.getUserSettings();
    return settings.display;
  }

  async setDisplaySettings(display: Partial<UserSettings['display']>): Promise<void> {
    const current = await this.getUserSettings();
    await this.saveUserSettings({
      display: { ...current.display, ...display },
    });
  }

  async getPdfSettings() {
    const settings = await this.getUserSettings();
    return settings.pdf;
  }

  async setPdfSettings(pdf: Partial<UserSettings['pdf']>): Promise<void> {
    const current = await this.getUserSettings();
    await this.saveUserSettings({
      pdf: { ...current.pdf, ...pdf },
    });
  }

  // Generic IndexedDB operations
  private async getFromIndexedDB(storeName: string, key: string): Promise<unknown> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as unknown);
      request.onerror = () =>
        reject(new Error(request.error?.message || 'IndexedDB get operation failed'));
    });
  }

  private async saveToIndexedDB(storeName: string, data: unknown): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(request.error?.message || 'IndexedDB put operation failed'));
    });
  }

  // Cache management for app data
  async cacheData(
    key: string,
    data: unknown,
    category: string = 'general',
    ttl?: number,
  ): Promise<void> {
    const cacheItem = {
      key,
      data,
      category,
      timestamp: Date.now(),
      ttl: ttl ? Date.now() + ttl : null,
    };

    try {
      await this.ensureInitialized();
      if (this.db) {
        // Ensure cache data is serializable
        const serializedItem = this.serializeForIndexedDB(cacheItem);
        await this.saveToIndexedDB(CACHE_STORE, serializedItem);
      }
    } catch (error) {
      logger.error('Failed to cache data:', error);
    }
  }

  async getCachedData(key: string): Promise<unknown> {
    try {
      await this.ensureInitialized();
      if (!this.db) return null;

      const item = (await this.getFromIndexedDB(CACHE_STORE, key)) as CacheItem | null;
      if (!item) return null;

      // Check TTL
      if (item.ttl && Date.now() > item.ttl) {
        await this.removeCachedData(key);
        return null;
      }

      return item.data;
    } catch (error) {
      logger.error('Failed to get cached data:', error);
      return null;
    }
  }

  async removeCachedData(key: string): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([CACHE_STORE], 'readwrite');
        const store = transaction.objectStore(CACHE_STORE);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () =>
          reject(new Error(request.error?.message || 'IndexedDB delete operation failed'));
      });
    } catch (error) {
      logger.error('Failed to remove cached data:', error);
    }
  }

  // Clear all user data
  async clearUserData(): Promise<void> {
    // Clear localStorage
    localStorage.removeItem('clca-user-settings');

    // Clear IndexedDB
    try {
      await this.ensureInitialized();
      if (this.db) {
        const transaction = this.db.transaction([SETTINGS_STORE, CACHE_STORE], 'readwrite');
        transaction.objectStore(SETTINGS_STORE).clear();
        transaction.objectStore(CACHE_STORE).clear();
      }
    } catch (error) {
      logger.error('Failed to clear IndexedDB data:', error);
    }
  }

  // Export/Import settings for backup/restore
  async exportSettings(): Promise<string> {
    const settings = await this.getUserSettings();
    return JSON.stringify(settings, null, 2);
  }

  async importSettings(settingsJson: string): Promise<void> {
    try {
      const settings = JSON.parse(settingsJson) as Partial<UserSettings>;
      await this.saveUserSettings(settings);
    } catch {
      throw new Error('Invalid settings format');
    }
  }
}

// Create singleton instance
export const storageService = new StorageService();

// Export defaults for use in other modules
export { DEFAULT_SETTINGS };
