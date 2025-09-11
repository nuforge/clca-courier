/**
 * Content Submission Service - Refactored for Composable Architecture
 * New standard: "A content object is a base entity that has features, not is a type."
 * Uses the unified ContentDoc model with tag-driven classification.
 */

import {
  ContentDoc,
  ContentFeatures,
  createContentDoc
} from '../types/core/content.types';
import { logger } from '../utils/logger';
import {
  collection,
  addDoc,
  serverTimestamp,
  type Timestamp
} from 'firebase/firestore';
import { getAuth, type User } from 'firebase/auth';
import { firestore as db } from '../config/firebase.config';

class ContentSubmissionService {
  /**
   * Create new content using the composable ContentDoc model.
   * This is the primary method for all content creation.
   *
   * @param title - The content title
   * @param description - The content description/body
   * @param contentType - The type of content (becomes content-type:value tag)
   * @param features - Optional features to attach (date, task, location, canva)
   * @param additionalTags - Additional tags beyond the content-type tag
   * @returns The ID of the created content document
   *
   * @example
   * ```typescript
   * // Create an event with date and location features
   * const eventId = await contentSubmissionService.createContent(
   *   'Community BBQ',
   *   'Join us for a summer BBQ at the lake',
   *   'event',
   *   {
   *     'feat:date': {
   *       start: Timestamp.fromDate(new Date('2025-09-20T17:00:00Z')),
   *       end: Timestamp.fromDate(new Date('2025-09-20T20:00:00Z')),
   *       isAllDay: false
   *     },
   *     'feat:location': {
   *       name: 'Lake Pavilion',
   *       address: '123 Lake Dr, Community, TX 75001'
   *     }
   *   },
   *   ['category:social', 'priority:high']
   * );
   * ```
   */
  async createContent(
    title: string,
    description: string,
    contentType: string,
    features: Partial<ContentFeatures> = {},
    additionalTags: string[] = []
  ): Promise<string> {
    logger.debug('Creating new content with composable architecture', {
      title: title.substring(0, 50),
      contentType,
      featuresCount: Object.keys(features).length,
      additionalTagsCount: additionalTags.length
    });

    try {
      // Get current user from Firebase Auth
      const auth = getAuth();
      const currentUser: User | null = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be authenticated to create content');
      }

      // Build tags array - always starts with content-type tag
      const tags = [`content-type:${contentType}`, ...additionalTags];

      logger.debug('Content tags prepared', { tags });

      // Create ContentDoc using the factory function
      const contentDoc = createContentDoc({
        title,
        description,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Unknown User',
        tags,
        features,
        status: 'draft', // New content starts as draft
        timestamps: {
          created: serverTimestamp() as Timestamp,
          updated: serverTimestamp() as Timestamp
        }
      });

      logger.debug('ContentDoc prepared for submission', {
        authorId: contentDoc.authorId,
        authorName: contentDoc.authorName,
        status: contentDoc.status,
        featuresKeys: Object.keys(contentDoc.features)
      });

      // Write to main 'content' collection in Firestore
      const contentCollection = collection(db, 'content');
      const docRef = await addDoc(contentCollection, contentDoc);

      logger.info('Content successfully created in Firestore', {
        contentId: docRef.id,
        contentType,
        title: title.substring(0, 50),
        authorId: currentUser.uid,
        featuresCount: Object.keys(features).length
      });

      return docRef.id;

    } catch (error) {
      logger.error('Failed to create content', {
        title: title.substring(0, 50),
        contentType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Create content with date feature (events, scheduled content).
   * Convenience method for common event creation pattern.
   *
   * @param title - Event title
   * @param description - Event description
   * @param startDate - Event start date/time
   * @param endDate - Optional event end date/time
   * @param isAllDay - Whether this is an all-day event
   * @param additionalFeatures - Additional features to include
   * @param additionalTags - Additional tags beyond content-type:event
   * @returns The ID of the created content document
   */
  async createEvent(
    title: string,
    description: string,
    startDate: Timestamp,
    endDate?: Timestamp,
    isAllDay = false,
    additionalFeatures: Partial<ContentFeatures> = {},
    additionalTags: string[] = []
  ): Promise<string> {
    const dateFeature: ContentFeatures['feat:date'] = {
      start: startDate,
      isAllDay
    };

    // Only add end date if provided
    if (endDate) {
      dateFeature.end = endDate;
    }

    const features: Partial<ContentFeatures> = {
      'feat:date': dateFeature,
      ...additionalFeatures
    };

    return this.createContent(
      title,
      description,
      'event',
      features,
      additionalTags
    );
  }

  /**
   * Create content with task feature (volunteer tasks, community needs).
   * Convenience method for common task creation pattern.
   *
   * @param title - Task title
   * @param description - Task description
   * @param category - Task category (e.g., 'printing', 'setup', 'cleanup')
   * @param qty - Quantity needed
   * @param unit - Unit of measurement
   * @param additionalFeatures - Additional features to include
   * @param additionalTags - Additional tags beyond content-type:task
   * @returns The ID of the created content document
   */
  async createTask(
    title: string,
    description: string,
    category: string,
    qty: number,
    unit: string,
    additionalFeatures: Partial<ContentFeatures> = {},
    additionalTags: string[] = []
  ): Promise<string> {
    const features: Partial<ContentFeatures> = {
      'feat:task': {
        category,
        qty,
        unit,
        status: 'unclaimed'
      },
      ...additionalFeatures
    };

    return this.createContent(
      title,
      description,
      'task',
      features,
      additionalTags
    );
  }

  /**
   * Create content with location feature (location-based content).
   * Convenience method for content that requires location context.
   *
   * @param title - Content title
   * @param description - Content description
   * @param contentType - Type of content
   * @param address - Location address
   * @param locationName - Optional location name
   * @param additionalFeatures - Additional features to include
   * @param additionalTags - Additional tags
   * @returns The ID of the created content document
   */
  async createLocationContent(
    title: string,
    description: string,
    contentType: string,
    address: string,
    locationName?: string,
    additionalFeatures: Partial<ContentFeatures> = {},
    additionalTags: string[] = []
  ): Promise<string> {
    const locationFeature: ContentFeatures['feat:location'] = {
      address
    };

    // Only add name if provided
    if (locationName) {
      locationFeature.name = locationName;
    }

    const features: Partial<ContentFeatures> = {
      'feat:location': locationFeature,
      ...additionalFeatures
    };

    return this.createContent(
      title,
      description,
      contentType,
      features,
      additionalTags
    );
  }

  /**
   * Create content with Canva integration feature.
   * Convenience method for design-enabled content.
   *
   * @param title - Content title
   * @param description - Content description
   * @param contentType - Type of content
   * @param designId - Canva design ID
   * @param editUrl - Canva edit URL
   * @param exportUrl - Optional export URL
   * @param additionalFeatures - Additional features to include
   * @param additionalTags - Additional tags
   * @returns The ID of the created content document
   */
  async createCanvaContent(
    title: string,
    description: string,
    contentType: string,
    designId: string,
    editUrl: string,
    exportUrl?: string,
    additionalFeatures: Partial<ContentFeatures> = {},
    additionalTags: string[] = []
  ): Promise<string> {
    const canvaFeature: ContentFeatures['integ:canva'] = {
      designId,
      editUrl
    };

    // Only add export URL if provided
    if (exportUrl) {
      canvaFeature.exportUrl = exportUrl;
    }

    const features: Partial<ContentFeatures> = {
      'integ:canva': canvaFeature,
      ...additionalFeatures
    };

    return this.createContent(
      title,
      description,
      contentType,
      features,
      additionalTags
    );
  }

  /**
   * Validate content data before submission.
   * Performs basic validation on title, description, and features.
   *
   * @param title - Content title to validate
   * @param description - Content description to validate
   * @param features - Features to validate
   * @returns Validation result
   */
  validateContentData(
    title: string,
    description: string,
    features: Partial<ContentFeatures> = {}
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!title || title.trim().length === 0) {
      errors.push('Title is required and cannot be empty');
    }

    if (!description || description.trim().length === 0) {
      errors.push('Description is required and cannot be empty');
    }

    // Validate title length
    if (title && title.length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }

    // Validate description length
    if (description && description.length > 10000) {
      errors.push('Description cannot exceed 10,000 characters');
    }

    // Validate features
    if (features['feat:date']) {
      const dateFeature = features['feat:date'];
      if (!dateFeature.start) {
        errors.push('Date feature requires a start time');
      }
      if (dateFeature.end && dateFeature.start && dateFeature.end.toMillis() < dateFeature.start.toMillis()) {
        errors.push('Event end time cannot be before start time');
      }
    }

    if (features['feat:task']) {
      const taskFeature = features['feat:task'];
      if (!taskFeature.category || taskFeature.category.trim().length === 0) {
        errors.push('Task feature requires a category');
      }
      if (!taskFeature.qty || taskFeature.qty <= 0) {
        errors.push('Task feature requires a positive quantity');
      }
      if (!taskFeature.unit || taskFeature.unit.trim().length === 0) {
        errors.push('Task feature requires a unit');
      }
    }

    if (features['feat:location']) {
      const locationFeature = features['feat:location'];
      if (!locationFeature.address || locationFeature.address.trim().length === 0) {
        errors.push('Location feature requires an address');
      }
    }

    if (features['integ:canva']) {
      const canvaFeature = features['integ:canva'];
      if (!canvaFeature.designId || canvaFeature.designId.trim().length === 0) {
        errors.push('Canva feature requires a design ID');
      }
      if (!canvaFeature.editUrl || canvaFeature.editUrl.trim().length === 0) {
        errors.push('Canva feature requires an edit URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const contentSubmissionService = new ContentSubmissionService();
