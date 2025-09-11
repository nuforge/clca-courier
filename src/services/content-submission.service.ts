/**
 * Content Submission Service
 * Firebase-integrated implementation for contribution system
 * Includes XSS prevention and input sanitization
 */

import type { ContentType, ContentSubmissionData } from '../types/core/content.types';
import type { CanvaDesign } from '../services/canva/types';
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

  /**
   * Attach a Canva design to existing content
   * @param contentId - The ID of the content to attach the design to
   * @param canvaDesign - The Canva design object to attach
   */
  async attachCanvaDesign(contentId: string, canvaDesign: CanvaDesign): Promise<void> {
    logger.info('Attaching Canva design to content', { contentId, designId: canvaDesign.id });

    try {
      // Validate Canva design object
      const validationResult = this.validateCanvaDesign(canvaDesign);
      if (!validationResult.isValid) {
        throw new Error(`Invalid Canva design: ${validationResult.errors.join(', ')}`);
      }

      // Sanitize the design data before storing
      const sanitizedDesign = this.sanitizeCanvaDesign(canvaDesign);

      // Update the content document with the Canva design
      await firestoreService.updateUserContent(contentId, { canvaDesign: sanitizedDesign });

      logger.success('Canva design attached successfully', {
        contentId,
        designId: sanitizedDesign.id,
        designStatus: sanitizedDesign.status
      });
    } catch (error) {
      logger.error('Error attaching Canva design to content:', {
        contentId,
        designId: canvaDesign.id,
        error
      });
      throw error;
    }
  }

  /**
   * Validate Canva design object for security and integrity
   * @private
   */
  private validateCanvaDesign(design: CanvaDesign): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!design.id || typeof design.id !== 'string') {
      errors.push('Design ID is required and must be a string');
    }

    if (!design.editUrl || typeof design.editUrl !== 'string') {
      errors.push('Edit URL is required and must be a string');
    }

    if (!design.status || !['draft', 'pending_export', 'exported', 'failed'].includes(design.status)) {
      errors.push('Valid design status is required');
    }

    // Validate URLs for security
    if (design.editUrl && !this.isValidCanvaUrl(design.editUrl)) {
      errors.push('Edit URL must be a valid Canva URL');
    }

    if (design.exportUrl && !this.isValidUrl(design.exportUrl)) {
      errors.push('Export URL must be a valid URL');
    }

    // Validate timestamps
    if (!design.createdAt || typeof design.createdAt !== 'object') {
      errors.push('Created timestamp is required');
    }

    if (!design.updatedAt || typeof design.updatedAt !== 'object') {
      errors.push('Updated timestamp is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize Canva design object to prevent XSS and ensure data integrity
   * @private
   */
  private sanitizeCanvaDesign(design: CanvaDesign): CanvaDesign {
    return {
      id: this.sanitizeString(design.id),
      editUrl: this.sanitizeUrl(design.editUrl),
      exportUrl: design.exportUrl ? this.sanitizeUrl(design.exportUrl) : null,
      status: design.status, // Already validated in validateCanvaDesign
      createdAt: design.createdAt, // Timestamp object, no sanitization needed
      updatedAt: design.updatedAt  // Timestamp object, no sanitization needed
    };
  }

  /**
   * Check if URL is a valid Canva URL
   * @private
   */
  private isValidCanvaUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'www.canva.com' || urlObj.hostname === 'canva.com';
    } catch {
      return false;
    }
  }

  /**
   * Check if URL is valid
   * @private
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize string values
   * @private
   */
  private sanitizeString(value: string): string {
    return value
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Sanitize URL values
   * @private
   */
  private sanitizeUrl(url: string): string {
    const sanitized = this.sanitizeString(url);

    // Additional URL-specific sanitization
    if (!this.isValidUrl(sanitized)) {
      logger.warn('Invalid URL detected during sanitization:', { original: url, sanitized });
      return '';
    }

    return sanitized;
  }

  /**
   * Validate and process Canva template configuration
   * @param templateConfig - Template configuration to validate
   * @returns Validated template configuration
   */
  validateCanvaTemplate(templateConfig: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    // Validate template ID
    if (templateConfig.id && typeof templateConfig.id === 'string') {
      sanitized.id = this.sanitizeString(templateConfig.id);
    }

    // Validate template name
    if (templateConfig.name && typeof templateConfig.name === 'string') {
      sanitized.name = this.sanitizeString(templateConfig.name);
    }

    // Validate description
    if (templateConfig.description && typeof templateConfig.description === 'string') {
      sanitized.description = this.sanitizeString(templateConfig.description);
    }

    // Validate thumbnail URL
    if (templateConfig.thumbnailUrl && typeof templateConfig.thumbnailUrl === 'string') {
      const thumbnailUrl = this.sanitizeUrl(templateConfig.thumbnailUrl);
      if (thumbnailUrl && this.isValidUrl(thumbnailUrl)) {
        sanitized.thumbnailUrl = thumbnailUrl;
      }
    }

    // Validate fields array
    if (Array.isArray(templateConfig.fields)) {
      sanitized.fields = templateConfig.fields
        .filter((field): field is Record<string, unknown> =>
          typeof field === 'object' && field !== null
        )
        .map(field => ({
          name: typeof field.name === 'string' ? this.sanitizeString(field.name) : '',
          type: typeof field.type === 'string' ? this.sanitizeString(field.type) : 'text',
          required: typeof field.required === 'boolean' ? field.required : false,
          placeholder: typeof field.placeholder === 'string' ? this.sanitizeString(field.placeholder) : ''
        }));
    }

    // Validate boolean flags
    if (typeof templateConfig.isActive === 'boolean') {
      sanitized.isActive = templateConfig.isActive;
    }

    logger.debug('Template configuration validated and sanitized:', {
      originalKeys: Object.keys(templateConfig),
      sanitizedKeys: Object.keys(sanitized)
    });

    return sanitized;
  }
}

export const contentSubmissionService = new ContentSubmissionService();
