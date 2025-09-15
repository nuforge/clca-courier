/**
 * Content Submission Service - Refactored for Composable Architecture
 * New standard: "A content object is a base entity that has features, not is a type."
 * Uses the unified ContentDoc model with tag-driven classification.
 */

import {
  createContentDoc
} from '../types/core/content.types';
import type { ContentFeatures } from '../types/core/content.types';
import { logger } from '../utils/logger';
import { firebaseContentService } from './firebase-content.service';
import { firestoreService, type UserContent } from './firebase-firestore.service';
import type { CanvaDesign } from './canva/types';
import {
  serverTimestamp,
  type Timestamp
} from 'firebase/firestore';
import { getAuth, type User } from 'firebase/auth';
import {
  sanitizeAndValidate,
  SANITIZATION_CONFIGS
} from '../utils/content-sanitization';

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
      // Validate input data before processing
      const validation = this.validateContentData(title, description, features);
      if (!validation.isValid) {
        const errorMessage = `Content validation failed: ${validation.errors.join(', ')}`;
        logger.error(errorMessage, { validation });
        throw new Error(errorMessage);
      }

      // Get current user from Firebase Auth
      const auth = getAuth();
      const currentUser: User | null = auth.currentUser;

      if (!currentUser) {
        const errorMessage = 'User must be authenticated to create content';
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Validate content type
      if (!contentType || contentType.trim().length === 0) {
        const errorMessage = 'Content type is required and cannot be empty';
        logger.error(errorMessage, { contentType });
        throw new Error(errorMessage);
      }

      // Build tags array - always starts with content-type tag
      const tags = [`content-type:${contentType.trim()}`, ...additionalTags];

      logger.debug('Content tags prepared', { tags });

      // Create ContentDoc using the factory function
      const contentDoc = createContentDoc({
        title: title.trim(),
        description: description.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Unknown User',
        tags,
        features,
        status: 'published', // New content starts as published for immediate visibility
        timestamps: {
          created: serverTimestamp() as Timestamp,
          updated: serverTimestamp() as Timestamp,
          published: serverTimestamp() as Timestamp
        }
      });

      logger.debug('ContentDoc prepared for submission', {
        authorId: contentDoc.authorId,
        authorName: contentDoc.authorName,
        status: contentDoc.status,
        featuresKeys: Object.keys(contentDoc.features)
      });

      // Use the new Firebase ContentDoc service
      const contentId = await firebaseContentService.createContent(contentDoc);

      logger.info('Content successfully created in ContentDoc collection', {
        contentId,
        contentType,
        title: title.substring(0, 50),
        authorId: currentUser.uid,
        featuresCount: Object.keys(features).length
      });

      return contentId;

    } catch (error) {
      logger.error('Failed to create content', {
        title: title.substring(0, 50),
        contentType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Re-throw with enhanced error context if needed
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unexpected error occurred while creating content');
      }
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

  /**
   * Batch create multiple content items.
   * Useful for importing content or creating multiple items at once.
   *
   * @param contentItems - Array of content creation data
   * @returns Array of created content IDs
   */
  async batchCreateContent(
    contentItems: Array<{
      title: string;
      description: string;
      contentType: string;
      features?: Partial<ContentFeatures>;
      additionalTags?: string[];
    }>
  ): Promise<string[]> {
    logger.info('Starting batch content creation', {
      count: contentItems.length
    });

    const results: string[] = [];
    const errors: Array<{ index: number; error: string; title: string }> = [];

    for (let i = 0; i < contentItems.length; i++) {
      const item = contentItems[i];

      // Add null check for TypeScript strict mode
      if (!item) {
        const errorMessage = 'Content item is null or undefined';
        errors.push({
          index: i,
          error: errorMessage,
          title: 'Unknown'
        });
        logger.error('Batch item is null', { index: i });
        continue;
      }

      try {
        const contentId = await this.createContent(
          item.title,
          item.description,
          item.contentType,
          item.features || {},
          item.additionalTags || []
        );
        results.push(contentId);

        logger.debug('Batch item created successfully', {
          index: i,
          contentId,
          title: item.title.substring(0, 30)
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          index: i,
          error: errorMessage,
          title: item.title.substring(0, 30)
        });

        logger.error('Batch item creation failed', {
          index: i,
          title: item.title.substring(0, 30),
          error: errorMessage
        });
      }
    }

    if (errors.length > 0) {
      logger.warn('Batch creation completed with errors', {
        successful: results.length,
        failed: errors.length,
        errors
      });
    } else {
      logger.info('Batch creation completed successfully', {
        count: results.length
      });
    }

    return results;
  }

  /**
   * Update existing content with new features or data.
   *
   * @param contentId - ID of the content to update
   * @param updates - Partial content updates
   * @returns Promise that resolves when update is complete
   */
  async updateContent(
    contentId: string,
    updates: {
      title?: string;
      description?: string;
      features?: Partial<ContentFeatures>;
      additionalTags?: string[];
      status?: 'draft' | 'published' | 'archived';
    }
  ): Promise<void> {
    logger.debug('Updating content', {
      contentId,
      updateKeys: Object.keys(updates)
    });

    try {
      // Get current user for authorization
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be authenticated to update content');
      }

      // Validate updated data if provided
      if (updates.title || updates.description || updates.features) {
        const validation = this.validateContentData(
          updates.title || 'Valid Title', // Use current title if not updating
          updates.description || 'Valid Description', // Use current description if not updating
          updates.features || {}
        );

        if (!validation.isValid) {
          throw new Error(`Content validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // TODO: Implementation depends on FirebaseContentService having an update method
      // For now, we'll use the status update method if only status is being changed
      if (updates.status && Object.keys(updates).length === 1) {
        await firebaseContentService.updateContentStatus(contentId, updates.status);
      } else {
        logger.warn('Full content updates not yet implemented', {
          contentId,
          updates: Object.keys(updates)
        });
        throw new Error('Full content updates not yet implemented - only status updates are supported');
      }

      logger.info('Content updated successfully', {
        contentId,
        updateKeys: Object.keys(updates)
      });

    } catch (error) {
      logger.error('Failed to update content', {
        contentId,
        updateKeys: Object.keys(updates),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get content creation statistics for analytics.
   *
   * @returns Statistics about content creation
   */
  async getContentStats(): Promise<{
    totalPublished: number;
    byType: Record<string, number>;
    byAuthor: Record<string, number>;
    recent: number;
  }> {
    logger.debug('Fetching content statistics');

    try {
      const publishedContent = await firebaseContentService.getPublishedContent();

      const stats = {
        totalPublished: publishedContent.length,
        byType: {} as Record<string, number>,
        byAuthor: {} as Record<string, number>,
        recent: 0
      };

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      for (const content of publishedContent) {
        // Count by type
        const contentType = content.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'unknown';
        stats.byType[contentType] = (stats.byType[contentType] || 0) + 1;

        // Count by author
        const authorName = content.authorName || 'Unknown';
        stats.byAuthor[authorName] = (stats.byAuthor[authorName] || 0) + 1;

        // Count recent content
        if (content.timestamps.created.toDate() > oneWeekAgo) {
          stats.recent++;
        }
      }

      logger.info('Content statistics generated', stats);
      return stats;

    } catch (error) {
      logger.error('Failed to fetch content statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Legacy compatibility methods for existing ContentSubmissionForm
  createMetadataTemplate(contentType: string): Record<string, unknown> {
    logger.debug('Creating metadata template for content type', { contentType });

    // Base template with common fields
    const baseTemplate = {
      priority: 'normal',
      tags: [],
      visibility: 'public'
    };

    switch (contentType) {
      case 'event':
        return {
          ...baseTemplate,
          date: '',
          location: '',
          capacity: 0
        };
      case 'classified':
        return {
          ...baseTemplate,
          category: 'for-sale',
          price: '',
          contact: ''
        };
      case 'article':
        return {
          ...baseTemplate,
          category: 'community',
          author: ''
        };
      case 'announcement':
        return {
          ...baseTemplate,
          category: 'community',
          urgency: 'normal'
        };
      default:
        // Generic template with base fields
        return baseTemplate;
    }
  }

  getPredefinedCategories(): string[] {
    return [
      'Community News',
      'Events',
      'Announcements',
      'For Sale',
      'Services',
      'Lost & Found',
      'Free Items',
      'General',
    ];
  }

  getUserDefinedCategories(): string[] {
    // TODO: Implement user-defined categories from Firebase
    return [];
  }

  /**
   * Validate and sanitize content data to prevent XSS and ensure data integrity
   */
  private validateAndSanitizeContent(formData: Record<string, unknown>): Record<string, unknown> {
    logger.debug('Validating and sanitizing content', { formData });

    // Start with a copy of all original data
    const sanitizedData: Record<string, unknown> = { ...formData };
    const errors: string[] = [];

    // Sanitize title
    const titleResult = sanitizeAndValidate(
      formData.title as string,
      SANITIZATION_CONFIGS.TITLE
    );
    if (!titleResult.isValid) {
      errors.push(...titleResult.errors);
    }
    sanitizedData.title = titleResult.sanitizedValue;

    // Sanitize content
    const contentResult = sanitizeAndValidate(
      formData.content as string,
      SANITIZATION_CONFIGS.CONTENT
    );
    if (!contentResult.isValid) {
      errors.push(...contentResult.errors);
    }
    sanitizedData.content = contentResult.sanitizedValue;

    // Sanitize content type (handle both 'type' and 'contentType' fields)
    const contentType = (formData.contentType || formData.type) as string;
    const validContentTypes = ['event', 'classified', 'article', 'announcement'];
    if (!validContentTypes.includes(contentType)) {
      errors.push(`Invalid content type: ${contentType}`);
    }

    // Preserve the original field name
    if (formData.type) {
      sanitizedData.type = contentType;
    } else {
      sanitizedData.contentType = contentType;
    }

    // Sanitize priority (handle both 'medium' and standard priorities)
    const priority = formData.priority as string;
    const validPriorities = ['low', 'normal', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      errors.push(`Invalid priority: ${priority}`);
    }
    sanitizedData.priority = priority || 'normal';

    // Sanitize event-specific fields
    if (contentType === 'event') {
      // Sanitize event location only if it exists
      if (formData.eventLocation) {
        const locationResult = sanitizeAndValidate(
          formData.eventLocation as string,
          SANITIZATION_CONFIGS.LOCATION
        );
        if (!locationResult.isValid) {
          errors.push(...locationResult.errors);
        }
        sanitizedData.eventLocation = locationResult.sanitizedValue;
      }

      // Validate event dates (handle both eventDate and eventStartDate)
      const startDate = (formData.eventStartDate || formData.eventDate) as string;
      const endDate = formData.eventEndDate as string;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
          errors.push('Event start date must be before end date');
        }

        if (start < new Date()) {
          errors.push('Event start date cannot be in the past');
        }
      }

      // Set default boolean values for calendar fields
      sanitizedData.onCalendar = Boolean(formData.onCalendar) || false;
      sanitizedData.allDay = Boolean(formData.allDay) || false;
    } else {
      // Remove event-specific fields for non-event content
      delete sanitizedData.eventLocation;
      delete sanitizedData.eventStartDate;
      delete sanitizedData.eventEndDate;
      delete sanitizedData.eventTime;
      delete sanitizedData.eventDate;
      delete sanitizedData.onCalendar;
      delete sanitizedData.allDay;
    }

    // Sanitize metadata fields
    if (formData.metadata && typeof formData.metadata === 'object') {
      const metadata = formData.metadata as Record<string, unknown>;
      const sanitizedMetadata: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === 'string') {
          const result = sanitizeAndValidate(value, SANITIZATION_CONFIGS.METADATA);
          if (!result.isValid) {
            errors.push(...result.errors);
          }
          sanitizedMetadata[key] = result.sanitizedValue;
        } else {
          sanitizedMetadata[key] = value;
        }
      }
      sanitizedData.metadata = sanitizedMetadata;
    }

    // Check for required fields after sanitization
    if (!sanitizedData.title || (sanitizedData.title as string).trim() === '') {
      errors.push('Title is required and cannot be empty after sanitization');
    }

    if (!sanitizedData.content || (sanitizedData.content as string).trim() === '') {
      errors.push('Content is required and cannot be empty after sanitization');
    }

    // If there are validation errors, throw an error
    if (errors.length > 0) {
      logger.warn('Content validation failed', { errors, formData, sanitizedData });
      throw new Error('Content validation failed');
    }

    logger.debug('Content validation and sanitization completed successfully');
    return sanitizedData;
  }

  // Legacy submitContent method removed - use createContent instead
  // This ensures all code uses the modern ContentDoc architecture

  async attachCanvaDesign(contentId: string, canvaDesign: unknown): Promise<void> {
    logger.debug('Attaching Canva design to content', { contentId, canvaDesign });

    try {
      // Type assertion for canvaDesign to match expected CanvaDesign interface
      const typedCanvaDesign = canvaDesign as CanvaDesign;

      // Update the content document with Canva design information
      await firestoreService.updateUserContent(contentId, {
        canvaDesign: typedCanvaDesign
      });

      logger.info('Canva design attached successfully', { contentId });
    } catch (error) {
      logger.error('Failed to attach Canva design', { contentId, error });
      throw new Error('Firestore update failed');
    }
  }
}

export const contentSubmissionService = new ContentSubmissionService();
