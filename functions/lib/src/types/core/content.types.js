"use strict";
/**
 * Composable Content Architecture - Tag-Driven Model
 * New standard: "A content object is a base entity that has features, not is a type."
 *
 * This architecture replaces all legacy content interfaces with a unified,
 * composable system based on features and tags.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContentDoc = exports.isContentDoc = exports.contentUtils = void 0;
const firestore_1 = require("firebase/firestore");
/**
 * Utility functions for working with ContentDoc objects and their features.
 * Provides type-safe access patterns and mechanical operations.
 */
exports.contentUtils = {
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
    hasFeature: (doc, feature) => {
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
    getFeature: (doc, feature) => {
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
    getContentType: (doc) => {
        const typeTag = doc.tags.find(tag => tag.startsWith('content-type:'));
        return typeTag === null || typeTag === void 0 ? void 0 : typeTag.split(':')[1];
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
    getTagsByNamespace: (doc, namespace) => {
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
    hasTag: (doc, tag) => {
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
function isContentDoc(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const doc = obj;
    return (typeof doc.id === 'string' &&
        typeof doc.title === 'string' &&
        typeof doc.description === 'string' &&
        typeof doc.authorId === 'string' &&
        typeof doc.authorName === 'string' &&
        Array.isArray(doc.tags) &&
        doc.tags.every((tag) => typeof tag === 'string') &&
        typeof doc.features === 'object' &&
        doc.features !== null &&
        ['draft', 'published', 'archived', 'rejected', 'deleted'].includes(doc.status) &&
        typeof doc.timestamps === 'object' &&
        doc.timestamps !== null);
}
exports.isContentDoc = isContentDoc;
/**
 * Create a new ContentDoc with default values and proper timestamp initialization.
 * Useful for creating new content objects with consistent structure.
 *
 * @param partial - Partial content data to merge with defaults
 * @returns Complete ContentDoc with defaults applied
 */
function createContentDoc(partial) {
    var _a, _b, _c;
    const now = firestore_1.Timestamp.now();
    const timestamps = {
        created: ((_a = partial.timestamps) === null || _a === void 0 ? void 0 : _a.created) || now,
        updated: ((_b = partial.timestamps) === null || _b === void 0 ? void 0 : _b.updated) || now
    };
    // Only add published timestamp if it exists
    if ((_c = partial.timestamps) === null || _c === void 0 ? void 0 : _c.published) {
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
exports.createContentDoc = createContentDoc;
//# sourceMappingURL=content.types.js.map