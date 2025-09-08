/**
 * Core Content Versioning Service
 * Generic service for handling versioning of any content type
 * Content-agnostic implementation that can be used by domain-specific services
 */

import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { firestore } from '../../config/firebase.config';
import { logger } from '../../utils/logger';
import { validateVersioningData, cleanForFirebase } from '../../utils/data-type-validator';
import type {
  BaseContentDocument,
  BaseContentHistory,
  VersioningOptions,
  ChangeType,
  VersioningConfig,
} from '../../types/core/versioning.types';

/**
 * Generic content versioning service
 * Handles versioning operations for any content type
 */
export class ContentVersioningService {
  private config: VersioningConfig;

  constructor(config: VersioningConfig = {}) {
    this.config = {
      maxHistoryEntries: 50,
      enableAutoArchival: true,
      archiveAfterDays: 90,
      enableCompression: false,
      ...config,
    };
  }

  /**
   * Update content with versioning
   * Creates a new version entry and updates the main document
   */
  async updateWithVersioning<T extends BaseContentDocument>(
    collectionName: string,
    id: string,
    updates: Partial<T>,
    options: VersioningOptions,
  ): Promise<void> {
    try {
      // 1. Get current version of the document
      const docRef = doc(firestore, collectionName, id);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error(`Document not found: ${id}`);
      }

      const currentData = currentDoc.data() as T;
      const currentVersion = currentData.versioning?.currentVersion || 0;
      const newVersion = currentVersion + 1;

      // 2. Calculate changes
      const changes = this.calculateChanges(currentData, updates);

      // 3. Clean updates to remove undefined values (Firebase doesn't accept undefined)
      const cleanUpdates = this.cleanUndefinedValues(updates);

      // 4. Create merged document
      const mergedDocument: T = {
        ...currentData,
        ...cleanUpdates,
        versioning: {
          currentVersion: newVersion,
          currentHash: this.calculateHash({ ...currentData, ...cleanUpdates }),
          parentVersion: currentVersion,
          branch: options.branch || 'main',
        },
        updatedAt: new Date().toISOString(),
        updatedBy: options.userId,
      } as T;

      // 5. Create history entry
      const historyEntry: BaseContentHistory<T> = {
        id: `${id}_${newVersion}`,
        contentId: id,
        version: newVersion,
        timestamp: serverTimestamp() as Timestamp,
        userId: options.userId,
        changeType: this.determineChangeType(changes),
        changes,
        snapshot: this.cleanUndefinedValues(mergedDocument) as T,
        hash: mergedDocument.versioning!.currentHash,
        comment: options.comment || '',
        branch: options.branch || 'main',
      };

      // 6. Save history entry - VALIDATE AND CLEAN DATA
      const validation = validateVersioningData(historyEntry);
      if (!validation.isValid) {
        logger.error('Versioning data validation failed:', validation.errors);
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const historyRef = doc(firestore, collectionName, id, 'history', newVersion.toString());
      await setDoc(historyRef, validation.cleanedData);

      // 7. Update main document - CLEAN THIS TOO
      const cleanedDocument = cleanForFirebase(mergedDocument);
      await setDoc(docRef, cleanedDocument, { merge: true });

      logger.info(`Content versioning: Updated ${collectionName}/${id} to version ${newVersion}`);
    } catch (error) {
      logger.error('Content versioning update failed:', error);
      throw error;
    }
  }

  /**
   * Get content history
   * Retrieves version history for a document
   */
  async getHistory<T extends BaseContentDocument>(
    collectionName: string,
    contentId: string,
    historyLimit: number = this.config.maxHistoryEntries || 50,
  ): Promise<BaseContentHistory<T>[]> {
    try {
      const historyRef = collection(firestore, collectionName, contentId, 'history');
      const historyQuery = query(historyRef, orderBy('version', 'desc'), limit(historyLimit));

      const historySnapshot = await getDocs(historyQuery);
      const history: BaseContentHistory<T>[] = [];

      historySnapshot.forEach((doc) => {
        const data = doc.data() as BaseContentHistory<T>;
        history.push(data);
      });

      return history;
    } catch (error) {
      logger.error('Failed to get content history:', error);
      throw error;
    }
  }

  /**
   * Restore content to a specific version
   * Updates the main document to match a historical version
   */
  async restoreVersion<T extends BaseContentDocument>(
    collectionName: string,
    contentId: string,
    targetVersion: number,
    userId: string,
    comment: string = '',
  ): Promise<T> {
    try {
      // 1. Get the target version from history
      const historyRef = doc(
        firestore,
        collectionName,
        contentId,
        'history',
        targetVersion.toString(),
      );
      const historyDoc = await getDoc(historyRef);

      if (!historyDoc.exists()) {
        throw new Error(`Version ${targetVersion} not found for ${contentId}`);
      }

      const historicalData = historyDoc.data() as BaseContentHistory<T>;
      const restoredContent = historicalData.snapshot;

      // 2. Update with versioning (this will create a new version)
      await this.updateWithVersioning(collectionName, contentId, restoredContent, {
        userId,
        comment: comment || `Restored to version ${targetVersion}`,
      });

      logger.info(
        `Content versioning: Restored ${collectionName}/${contentId} to version ${targetVersion}`,
      );
      return restoredContent;
    } catch (error) {
      logger.error('Content version restoration failed:', error);
      throw error;
    }
  }

  /**
   * Calculate changes between two versions
   * Returns a record of field changes
   */
  private calculateChanges<T extends BaseContentDocument>(
    current: T,
    updates: Partial<T>,
  ): Record<string, [unknown, unknown]> {
    const changes: Record<string, [unknown, unknown]> = {};

    for (const [key, newValue] of Object.entries(updates)) {
      const oldValue = current[key as keyof T];
      if (this.hasChanged(oldValue, newValue)) {
        changes[key] = [oldValue, newValue];
      }
    }

    return changes;
  }

  /**
   * Check if a value has changed
   * Handles deep comparison for objects and arrays
   */
  private hasChanged(oldValue: unknown, newValue: unknown): boolean {
    // Simple comparison for primitives
    if (oldValue === newValue) return false;

    // Handle null/undefined cases
    if (oldValue == null || newValue == null) return oldValue !== newValue;

    // Deep comparison for objects and arrays
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    }

    return true;
  }

  /**
   * Clean undefined values from an object (Firebase doesn't accept undefined)
   * Recursively removes all undefined values from the object
   */
  private cleanUndefinedValues<T>(obj: Partial<T>): Partial<T> {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      const cleaned = obj
        .filter((item) => item !== undefined)
        .map((item) =>
          typeof item === 'object' && item !== null ? this.cleanUndefinedValues(item) : item,
        );
      return cleaned as unknown as Partial<T>;
    }

    if (typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          if (typeof value === 'object' && value !== null) {
            cleaned[key] = this.cleanUndefinedValues(value);
          } else {
            cleaned[key] = value;
          }
        }
      }
      return cleaned as Partial<T>;
    }

    return obj;
  }

  /**
   * Calculate hash of content for change detection
   * Simple implementation using JSON stringify
   */
  private calculateHash(content: Record<string, unknown>): string {
    // Create a copy without versioning info for hash calculation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { versioning, updatedAt, updatedBy, ...hashableContent } = content;

    const contentString = JSON.stringify(hashableContent, Object.keys(hashableContent).sort());

    // Simple hash implementation (could be replaced with crypto hash)
    let hash = 0;
    for (let i = 0; i < contentString.length; i++) {
      const char = contentString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Determine change type based on the changes made
   */
  private determineChangeType(changes: Record<string, [unknown, unknown]>): ChangeType {
    // Check for publication status changes
    if ('isPublished' in changes) {
      const [, newValue] = changes.isPublished;
      return newValue ? 'publish' : 'archive';
    }

    // For now, default to 'update' - could be enhanced with more logic
    return 'update';
  }
}

/**
 * Singleton instance for reuse
 */
export const contentVersioningService = new ContentVersioningService();
