/**
 * Core Content Versioning Types
 * Generic interfaces for content versioning that can be extended by specific content types
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Generic base interface for any versionable content
 */
export interface BaseContentDocument {
  id: string;
  title: string;

  // Universal versioning fields
  versioning?: {
    currentVersion: number;
    currentHash: string;
    parentVersion?: number;
    branch: string; // 'main' | 'draft' | 'user-{uid}'
  };

  // Standard audit fields
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * Generic base interface for content history
 */
export interface BaseContentHistory<T = Record<string, unknown>> {
  id: string; // {contentId}_{version}
  contentId: string;
  version: number;
  timestamp: Timestamp;
  userId: string;
  changeType: 'create' | 'update' | 'publish' | 'archive';
  changes: Record<string, [unknown, unknown]>; // [oldValue, newValue]
  snapshot: T; // Generic snapshot type
  hash: string;
  comment: string;
  branch: string;
}

/**
 * Options for versioning operations
 */
export interface VersioningOptions {
  comment?: string;
  userId: string;
  branch?: string;
}

/**
 * Change type enumeration for better type safety
 */
export type ChangeType = 'create' | 'update' | 'publish' | 'archive';

/**
 * Branch type enumeration
 */
export type BranchType = 'main' | 'draft' | (string & Record<never, never>); // string allows for user-specific branches like 'user-{uid}'

/**
 * Versioning configuration
 */
export interface VersioningConfig {
  maxHistoryEntries?: number; // Default: 50
  enableAutoArchival?: boolean; // Default: true
  archiveAfterDays?: number; // Default: 90
  enableCompression?: boolean; // Default: false (for future)
}
