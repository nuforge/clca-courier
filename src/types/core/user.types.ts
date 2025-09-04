/**
 * User Settings and Storage Types
 * Consolidated from storage-service.ts and related files
 */

/**
 * User preferences and settings
 */
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

/**
 * Stored settings with metadata
 */
export interface StoredSettings {
  id: string;
  userId: string;
  data: UserSettings;
  timestamp: number;
}

/**
 * Cache item structure for temporary data storage
 */
export interface CacheItem {
  key: string;
  data: unknown;
  category: string;
  timestamp: number;
  ttl: number | null;
}

/**
 * Storage operation result
 */
export interface StorageResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalItems: number;
  totalSizeBytes: number;
  categories: Record<
    string,
    {
      count: number;
      sizeBytes: number;
    }
  >;
  lastClearance: number;
}

/**
 * Export/Import data structure
 */
export interface ExportData {
  version: string;
  timestamp: number;
  settings: UserSettings;
  cache?: Record<string, unknown>;
  metadata: {
    userAgent: string;
    exportedBy: string;
  };
}

/**
 * Storage configuration options
 */
export interface StorageConfig {
  enableIndexedDB: boolean;
  enableLocalStorage: boolean;
  maxCacheSize: number;
  defaultTTL: number;
  autoCleanup: boolean;
}

/**
 * User preference categories
 */
export type UserPreferenceCategory = 'theme' | 'language' | 'notifications' | 'display' | 'pdf';

/**
 * Theme preference options
 */
export type ThemePreference = 'light' | 'dark' | 'auto';

/**
 * Language preference (ISO codes)
 */
export type LanguagePreference = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE';

/**
 * PDF layout preferences
 */
export type PdfLayoutPreference = 'single' | 'facing' | 'cover';

/**
 * Thumbnail size preferences
 */
export type ThumbnailSizePreference = 'small' | 'medium' | 'large';
