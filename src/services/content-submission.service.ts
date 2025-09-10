/**
 * Content Submission Service
 * Firebase-integrated implementation for contribution system
 * Includes XSS prevention and input sanitization
 */

import type { ContentType, ContentSubmissionData } from '../types/core/content.types';
import { firestoreService, type UserContent } from './firebase-firestore.service';
import { logger } from '../utils/logger';
import {
  sanitizeTitle,
  sanitizeContent,
  sanitizeLocation,
  sanitizeMetadata,
  containsMaliciousContent,
  logSecurityEvent,
  type ValidationResult
} from '../utils/content-sanitization';

class ContentSubmissionService {
  /**
   * Create metadata template for content type
   */
  createMetadataTemplate(contentType: ContentType): Record<string, unknown> {
    const baseTemplate = {
      priority: 'normal',
      tags: [],
      visibility: 'public',
    };

    switch (contentType) {
      case 'article':
        return {
          ...baseTemplate,
          category: 'community',
          author: '',
        };
      case 'event':
        return {
          ...baseTemplate,
          date: '',
          location: '',
          capacity: 0,
        };
      case 'classified':
        return {
          ...baseTemplate,
          category: 'for-sale',
          price: '',
          contact: '',
        };
      case 'announcement':
        return {
          ...baseTemplate,
          category: 'community',
          urgency: 'normal',
        };
      default:
        return baseTemplate;
    }
  }

  /**
   * Get predefined categories
   */
  getPredefinedCategories(): string[] {
    return [
      'community',
      'events',
      'announcements',
      'for-sale',
      'services',
      'housing',
      'recreation',
    ];
  }

  /**
   * Get user-defined categories (async)
   */
  getUserDefinedCategories(): string[] {
    // In a real implementation, this would fetch from storage
    return ['lake-activities', 'volunteer-opportunities', 'neighborhood-watch'];
  }

  /**
   * Validate and sanitize content submission data to prevent XSS attacks
   */
  private validateAndSanitizeContent(data: ContentSubmissionData): ContentSubmissionData {
    const errors: string[] = [];

    // Log any malicious content attempts
    if (containsMaliciousContent(data.title) || containsMaliciousContent(data.content)) {
      logSecurityEvent('xss_attempt', {
        type: data.type,
        titleSuspicious: containsMaliciousContent(data.title),
        contentSuspicious: containsMaliciousContent(data.content),
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize title (no HTML allowed)
    const titleResult: ValidationResult = sanitizeTitle(data.title);
    if (!titleResult.isValid) {
      errors.push(...titleResult.errors.map(err => `Title: ${err}`));
    }

    // Sanitize content (safe HTML allowed)
    const contentResult: ValidationResult = sanitizeContent(data.content);
    if (!contentResult.isValid) {
      errors.push(...contentResult.errors.map(err => `Content: ${err}`));
    }

    // Validate and sanitize event location if provided
    let sanitizedEventLocation = data.eventLocation;
    if (data.eventLocation) {
      const locationResult: ValidationResult = sanitizeLocation(data.eventLocation);
      if (!locationResult.isValid) {
        errors.push(...locationResult.errors.map(err => `Event Location: ${err}`));
      }
      sanitizedEventLocation = locationResult.sanitizedValue;
    }

    // Sanitize category
    const categoryResult: ValidationResult = sanitizeMetadata(data.category);
    if (!categoryResult.isValid) {
      errors.push(...categoryResult.errors.map(err => `Category: ${err}`));
    }

    // Validate required fields after sanitization
    if (!titleResult.sanitizedValue.trim()) {
      errors.push('Title is required and cannot be empty');
    }

    if (!contentResult.sanitizedValue.trim()) {
      errors.push('Content is required and cannot be empty');
    }

    // Validate event date logic
    if (data.type === 'event' && data.eventDate && data.eventEndDate) {
      const startDate = new Date(data.eventDate);
      const endDate = new Date(data.eventEndDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        errors.push('Invalid event date format');
      } else if (endDate < startDate) {
        errors.push('Event end date cannot be before start date');
      }
    }

    // Validate priority
    if (!['low', 'medium', 'high'].includes(data.priority)) {
      errors.push('Invalid priority value');
    }

    // Validate type
    if (!['article', 'event', 'classified', 'announcement'].includes(data.type)) {
      errors.push('Invalid content type');
    }

    // Throw validation error if any issues found
    if (errors.length > 0) {
      const errorMessage = `Content validation failed: ${errors.join('; ')}`;
      logger.error('Content validation failed:', { errors, data: { type: data.type, title: data.title.substring(0, 50) } });
      throw new Error(errorMessage);
    }

    // Return sanitized data
    const sanitizedData: ContentSubmissionData = {
      ...data,
      title: titleResult.sanitizedValue,
      content: contentResult.sanitizedValue,
      category: categoryResult.sanitizedValue,
      metadata: this.sanitizeMetadataObject(data.metadata)
    };

    // Only include eventLocation if it was provided and sanitized
    if (sanitizedEventLocation !== undefined) {
      sanitizedData.eventLocation = sanitizedEventLocation;
    }

    return sanitizedData;
  }

  /**
   * Sanitize metadata object to prevent XSS in metadata fields
   */
  private sanitizeMetadataObject(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitizedMetadata: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string') {
        const result = sanitizeMetadata(value);
        sanitizedMetadata[key] = result.sanitizedValue;

        if (!result.isValid) {
          logger.warn(`Metadata field '${key}' contained invalid content`, { errors: result.errors });
        }
      } else {
        // Keep non-string values as-is (numbers, booleans, etc.)
        sanitizedMetadata[key] = value;
      }
    }

    return sanitizedMetadata;
  }

  /**
   * Submit content to Firebase
   */
  async submitContent(data: ContentSubmissionData): Promise<string> {
    logger.debug('Submitting content to Firebase:', { type: data.type, title: data.title.substring(0, 50) });

    try {
      // SECURITY: Validate and sanitize all input data to prevent XSS attacks
      const sanitizedData = this.validateAndSanitizeContent(data);

      logger.debug('Content validation and sanitization completed successfully');

      // Special logging for calendar events
      if (sanitizedData.type === 'event') {
        logger.debug('Calendar event detected:', {
          onCalendar: sanitizedData.onCalendar,
          eventDate: sanitizedData.eventDate,
          eventTime: sanitizedData.eventTime,
          eventLocation: sanitizedData.eventLocation,
          allDay: sanitizedData.allDay,
        });
      }

      // Convert ContentSubmissionData to UserContent format using sanitized data
      const userContentData: Record<string, unknown> = {
        type: sanitizedData.type,
        title: sanitizedData.title,
        content: sanitizedData.content,
        tags: [sanitizedData.category], // Use category as a tag
        attachments: sanitizedData.attachments || [],

        // Calendar-specific fields (only include if they have values)
        onCalendar: sanitizedData.onCalendar || false,
        allDay: sanitizedData.allDay || false,
      };

      // Only add calendar fields if they have values (not undefined)
      if (sanitizedData.eventDate) {
        userContentData.eventDate = sanitizedData.eventDate;
      }
      if (sanitizedData.eventEndDate) {
        userContentData.eventEndDate = sanitizedData.eventEndDate;
      }
      if (sanitizedData.eventTime) {
        userContentData.eventTime = sanitizedData.eventTime;
      }
      if (sanitizedData.eventEndTime) {
        userContentData.eventEndTime = sanitizedData.eventEndTime;
      }
      if (sanitizedData.eventLocation) {
        userContentData.eventLocation = sanitizedData.eventLocation;
      }
      if (sanitizedData.eventRecurrence) {
        userContentData.eventRecurrence = sanitizedData.eventRecurrence;
      }

      // Add metadata (already sanitized)
      userContentData.metadata = {
        submissionSource: 'web' as const,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        priority: sanitizedData.priority,
        targetIssue: sanitizedData.targetIssue,
        // Include any additional metadata from the form (already sanitized)
        ...sanitizedData.metadata,
      };

      logger.debug('UserContent data prepared for submission');

      // Submit to Firebase using the existing firestore service
      // The service will automatically add authorId, authorName, authorEmail from current user
      const contentId = await firestoreService.submitUserContent(
        userContentData as unknown as Omit<UserContent, 'id' | 'submissionDate' | 'status'>,
      );

      logger.success('Content submitted successfully to Firebase with ID:', contentId);
      return contentId;
    } catch (error) {
      // Log the error but don't expose sensitive validation details to the client
      if (error instanceof Error && error.message.includes('Content validation failed')) {
        logger.error('Content validation failed during submission:', {
          type: data.type,
          titleLength: data.title?.length || 0,
          contentLength: data.content?.length || 0
        });
        throw new Error('Content validation failed. Please check your input and try again.');
      }

      logger.error('Error submitting content to Firebase:', error);
      throw error;
    }
  }
}

export const contentSubmissionService = new ContentSubmissionService();
