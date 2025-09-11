/**
 * Composable Content Architecture - Tag-Driven Model
 * New standard: "A content object is a base entity that has features, not is a type."
 *
 * This architecture replaces all legacy content interfaces with a unified,
 * composable system based on features and tags.
 */

import { Timestamp, type GeoPoint } from 'firebase/firestore';

/**
 * The single, canonical interface for all content in the system.
 * Represents a base content entity that can have various features attached.
 *
 * @principle A content object is a base entity that has features, not is a type.
 */
export interface ContentDoc {
  /** Unique identifier for the content document */
  id: string;

  /** Human-readable title of the content */
  title: string;

  /** Detailed description or body text of the content */
  description: string;

  /** Firebase Auth UID of the content author */
  authorId: string;

  /** Display name of the content author */
  authorName: string;

  /** Array of filterable tags in [namespace:value] format */
  tags: string[];

  /** Structured feature blocks that define content capabilities */
  features: ContentFeatures;

  /** Publication status of the content */
  status: 'draft' | 'published' | 'archived';

  /** Timestamp tracking for content lifecycle */
  timestamps: {
    /** When the content was first created */
    created: Timestamp;
    /** When the content was last modified */
    updated: Timestamp;
    /** When the content was published (optional) */
    published?: Timestamp;
  };
}

/**
 * The heart of the composable content system: a map of possible features.
 * Each feature is optional and adds specific capabilities to the base content.
 */
export interface ContentFeatures {
  /**
   * Date/time feature for events and scheduled content.
   * Provides temporal context with start/end times and all-day flag.
   */
  'feat:date'?: {
    /** Start date/time of the event */
    start: Timestamp;
    /** Optional end date/time of the event */
    end?: Timestamp;
    /** Whether this is an all-day event */
    isAllDay: boolean;
  };

  /**
   * Task feature for actionable community items.
   * Enables task claiming, tracking, and completion workflow.
   */
  'feat:task'?: {
    /** Category of the task (e.g., 'printing', 'setup', 'cleanup') */
    category: string;
    /** Quantity needed for the task */
    qty: number;
    /** Unit of measurement for the quantity */
    unit: string;
    /** Current status of the task */
    status: 'unclaimed' | 'claimed' | 'completed';
    /** Firebase Auth UID of user who claimed the task (optional) */
    claimedBy?: string;
  };

  /**
   * Location feature for content with geographic context.
   * Supports both address and coordinate-based location data.
   */
  'feat:location'?: {
    /** Optional human-readable name of the location */
    name?: string;
    /** Street address or location description */
    address: string;
    /** Optional Firestore GeoPoint for map queries and distance calculations */
    geo?: GeoPoint;
  };

  /**
   * Canva integration feature for design-enabled content.
   * Links content to Canva designs for collaborative editing and export.
   */
  'integ:canva'?: {
    /** Canva design identifier */
    designId: string;
    /** URL for editing the design in Canva */
    editUrl: string;
    /** Optional URL for exporting the completed design */
    exportUrl?: string;
  };

  // [Intentional space for future features]
  // Future features can be added here following the same pattern:
  // 'feat:rsvp'?, 'feat:payment'?, 'integ:calendar'?, etc.
}

/**
 * Utility functions for working with ContentDoc objects and their features.
 * Provides type-safe access patterns and mechanical operations.
 */
export const contentUtils = {
  /**
   * Type-safe feature checker with proper type narrowing.
   * Returns true if the specified feature exists and narrows the type accordingly.
   *
   * @param doc - The content document to check
   * @param feature - The feature key to check for
   * @returns Type-narrowed boolean indicating feature presence
   *
   * @example
   * ```typescript
   * if (contentUtils.hasFeature(doc, 'feat:date')) {
   *   // TypeScript now knows doc.features['feat:date'] is defined
   *   console.log(doc.features['feat:date'].start);
   * }
   * ```
   */
  hasFeature: <K extends keyof ContentFeatures>(
    doc: ContentDoc,
    feature: K
  ): doc is ContentDoc & { features: { [P in K]: NonNullable<ContentFeatures[P]> } } => {
    return doc.features[feature] !== undefined;
  },

  /**
   * Safe feature getter that returns the feature data or undefined.
   * Provides null-safe access to feature data without type narrowing.
   *
   * @param doc - The content document to access
   * @param feature - The feature key to retrieve
   * @returns The feature data or undefined if not present
   *
   * @example
   * ```typescript
   * const dateFeature = contentUtils.getFeature(doc, 'feat:date');
   * if (dateFeature) {
   *   console.log(dateFeature.start);
   * }
   * ```
   */
  getFeature: <K extends keyof ContentFeatures>(doc: ContentDoc, feature: K): ContentFeatures[K] => {
    return doc.features[feature];
  },

  /**
   * Extract content type from the tags array.
   * Looks for tags in the format 'content-type:value' and returns the value.
   *
   * @param doc - The content document to analyze
   * @returns The content type string or undefined if not found
   *
   * @example
   * ```typescript
   * const type = contentUtils.getContentType(doc);
   * // Returns 'event' for tags: ['content-type:event', 'category:community']
   * ```
   */
  getContentType: (doc: ContentDoc): string | undefined => {
    const typeTag = doc.tags.find(tag => tag.startsWith('content-type:'));
    return typeTag?.split(':')[1];
  },

  /**
   * Get all tags with a specific namespace.
   * Useful for filtering and grouping content by tag categories.
   *
   * @param doc - The content document to analyze
   * @param namespace - The namespace to filter by (e.g., 'category', 'priority')
   * @returns Array of tag values for the specified namespace
   *
   * @example
   * ```typescript
   * const categories = contentUtils.getTagsByNamespace(doc, 'category');
   * // Returns ['community', 'urgent'] for tags: ['category:community', 'category:urgent']
   * ```
   */
  getTagsByNamespace: (doc: ContentDoc, namespace: string): string[] => {
    const prefix = `${namespace}:`;
    return doc.tags
      .filter(tag => tag.startsWith(prefix))
      .map(tag => tag.substring(prefix.length));
  },

  /**
   * Check if content has a specific tag.
   * Supports both full tag format (namespace:value) and value-only checking.
   *
   * @param doc - The content document to check
   * @param tag - The tag to look for
   * @returns Boolean indicating if the tag exists
   *
   * @example
   * ```typescript
   * const isUrgent = contentUtils.hasTag(doc, 'priority:urgent');
   * const hasCategory = contentUtils.hasTag(doc, 'category:community');
   * ```
   */
  hasTag: (doc: ContentDoc, tag: string): boolean => {
    return doc.tags.includes(tag);
  }
};

/**
 * Type guard to check if an object is a valid ContentDoc.
 * Useful for runtime validation and type narrowing from unknown objects.
 *
 * @param obj - The object to validate
 * @returns Type-narrowed boolean indicating if object is ContentDoc
 */
export function isContentDoc(obj: unknown): obj is ContentDoc {
  if (!obj || typeof obj !== 'object') return false;

  const doc = obj as Record<string, unknown>;

  return (
    typeof doc.id === 'string' &&
    typeof doc.title === 'string' &&
    typeof doc.description === 'string' &&
    typeof doc.authorId === 'string' &&
    typeof doc.authorName === 'string' &&
    Array.isArray(doc.tags) &&
    doc.tags.every((tag: unknown) => typeof tag === 'string') &&
    typeof doc.features === 'object' &&
    doc.features !== null &&
    ['draft', 'published', 'archived'].includes(doc.status as string) &&
    typeof doc.timestamps === 'object' &&
    doc.timestamps !== null
  );
}

/**
 * Create a new ContentDoc with default values and proper timestamp initialization.
 * Useful for creating new content objects with consistent structure.
 *
 * @param partial - Partial content data to merge with defaults
 * @returns Complete ContentDoc with defaults applied
 */
export function createContentDoc(partial: Partial<ContentDoc> & {
  title: string;
  description: string;
  authorId: string;
  authorName: string;
}): Omit<ContentDoc, 'id'> {
  const now = Timestamp.now();

  const timestamps: ContentDoc['timestamps'] = {
    created: partial.timestamps?.created || now,
    updated: partial.timestamps?.updated || now
  };

  // Only add published timestamp if it exists
  if (partial.timestamps?.published) {
    timestamps.published = partial.timestamps.published;
  }

  return {
    title: partial.title,
    description: partial.description,
    authorId: partial.authorId,
    authorName: partial.authorName,
    tags: partial.tags || [],
    features: partial.features || {},
    status: partial.status || 'draft',
    timestamps
  };
}
