/**
 * Centralized Type Exports
 * Single entry point for all application types
 * Provides clean imports throughout the application
 */

// Core types
export * from './core/content.types';
export * from './core/newsletter.types';
export * from './core/user.types';
export * from './core/api.types';

// Service types
export * from './services/google-drive.types';
export * from './services/pdf.types';

// Component types
export * from './components/navigation.types';
export * from './components/map.types';
export * from './components/ui.types';

// Legacy exports for backward compatibility
// These re-export existing types to maintain compatibility during transition
export type { NavigationItem } from './navigation';
export type {
  GoogleDriveContentConfig,
  GoogleDriveFile as LegacyGoogleDriveFile,
  ContentPreview,
  SearchResult,
  GoogleDocsContent,
  GoogleSheetsData,
  IssueWithGoogleDrive,
  ContentSyncStatus,
} from './google-drive-content';

// Consolidated interface aliases for migration
export type {
  UnifiedNewsletter,
  NewsletterServiceStats,
  NewsletterServiceConfig,
} from './newsletter-interfaces';

/**
 * Application-wide type utilities
 */

/**
 * Make all properties optional
 */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Make all properties required
 */
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

/**
 * Pick specific properties from a type
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Omit specific properties from a type
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Create a type with nullable properties
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Create a type that excludes null and undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Extract the array element type
 */
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Create a deep readonly type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Create a deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Common utility types for the application
 */
export type ID = string | number;
export type Timestamp = number;
export type DateString = string;
export type URLString = string;
export type EmailString = string;

/**
 * Status types used throughout the application
 */
export type LoadingStatus = 'idle' | 'loading' | 'success' | 'error';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SyncStatus = 'synced' | 'syncing' | 'error' | 'outdated';

/**
 * Common event handler types
 */
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;
export type ValueChangeHandler<T = unknown> = (value: T) => void;
