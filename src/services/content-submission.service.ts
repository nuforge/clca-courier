/**
 * Content Submission Service
 * Firebase-integrated implementation for contribution system
 */

import type { ContentType, ContentSubmissionData } from '../types/core/content.types';
import { firestoreService, type UserContent } from './firebase-firestore.service';
import { logger } from '../utils/logger';

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
   * Submit content to Firebase
   */
  async submitContent(data: ContentSubmissionData): Promise<string> {
    logger.debug('Submitting content to Firebase:', data);

    try {
      // Convert ContentSubmissionData to UserContent format
      const userContentData = {
        type: data.type,
        title: data.title,
        content: data.content,
        tags: [data.category], // Use category as a tag
        attachments: data.attachments || [],
        metadata: {
          submissionSource: 'web' as const,
          userAgent: navigator.userAgent,
          priority: data.priority,
          targetIssue: data.targetIssue,
          // Include any additional metadata from the form
          ...data.metadata,
        },
      };

      // Submit to Firebase using the existing firestore service
      // The service will automatically add authorId, authorName, authorEmail from current user
      const contentId = await firestoreService.submitUserContent(
        userContentData as unknown as Omit<UserContent, 'id' | 'submissionDate' | 'status'>,
      );

      logger.success('Content submitted successfully to Firebase with ID:', contentId);
      return contentId;
    } catch (error) {
      logger.error('Error submitting content to Firebase:', error);
      throw error;
    }
  }
}

export const contentSubmissionService = new ContentSubmissionService();
