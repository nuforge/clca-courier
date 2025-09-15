/**
 * Template Management Service
 *
 * Handles template operations including preview, testing, and management
 * for the CLCA Courier newsletter generation system.
 */

import { httpsCallable, getFunctions } from 'firebase/functions';
import { logger } from '../utils/logger';

export interface TemplateInfo {
  name: string;
  displayName: string;
  description: string;
  contentType: string;
  layout: string;
}

export interface TemplatePreviewData {
  title: string;
  content: string;
  author: string;
  createdAt: string;
  featuredImageUrl?: string;
  issue: {
    title: string;
    issueNumber: string;
    publicationDate: string;
  };
  // Event-specific data
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventContact?: string;
  // Editorial-specific data
  subtitle?: string;
  // Feature flags
  featured?: boolean;
  priority?: string;
}

export interface TemplateTestResult {
  success: boolean;
  downloadUrl?: string;
  templateName: string;
  error?: string;
}

export interface TemplatePreviewResult {
  success: boolean;
  html?: string;
  templateName: string;
  error?: string;
}

export interface AvailableTemplatesResult {
  success: boolean;
  templates: string[];
  templateMapping: Record<string, { template: string; layout: string }>;
  error?: string;
}

class TemplateManagementService {
  private readonly functions = getFunctions();
  private readonly previewTemplateCallable = httpsCallable(this.functions, 'previewTemplate');
  private readonly testTemplateCallable = httpsCallable(this.functions, 'testTemplate');
  private readonly getAvailableTemplatesCallable = httpsCallable(this.functions, 'getAvailableTemplatesList');

  /**
   * Get available templates
   */
  async getAvailableTemplates(): Promise<AvailableTemplatesResult> {
    try {
      const result = await this.getAvailableTemplatesCallable();
      if (result && !result.data) {
        throw new Error('Invalid response from template service');
      }
      return result?.data as AvailableTemplatesResult;
    } catch (error) {
      logger.error('Failed to get available templates:', error);
      return {
        success: false,
        templates: [],
        templateMapping: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Preview a template with sample data
   */
  async previewTemplate(templateName: string, contentData: TemplatePreviewData): Promise<TemplatePreviewResult> {
    try {
      const result = await this.previewTemplateCallable({
        templateName,
        contentData
      });
      if (result && !result.data) {
        throw new Error('Invalid response from template service');
      }
      return result?.data as TemplatePreviewResult;
    } catch (error) {
      logger.error('Failed to preview template:', error);
      return {
        success: false,
        templateName,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Test a template by generating a sample PDF
   */
  async testTemplate(templateName: string, testData: TemplatePreviewData): Promise<TemplateTestResult> {
    try {
      const result = await this.testTemplateCallable({
        templateName,
        testData
      });
      if (result && !result.data) {
        throw new Error('Invalid response from template service');
      }
      return result?.data as TemplateTestResult;
    } catch (error) {
      logger.error('Failed to test template:', error);
      return {
        success: false,
        templateName,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get template information for display
   */
  getTemplateInfo(templateName: string): TemplateInfo {
    const templateInfo: Record<string, TemplateInfo> = {
      'article': {
        name: 'article',
        displayName: 'News Article',
        description: 'Standard news article layout with clean typography',
        contentType: 'news',
        layout: 'standard'
      },
      'event': {
        name: 'event',
        displayName: 'Event Announcement',
        description: 'Event-focused layout with date, time, and location details',
        contentType: 'event',
        layout: 'compact'
      },
      'announcement': {
        name: 'announcement',
        displayName: 'Important Announcement',
        description: 'Highlighted layout for important community announcements',
        contentType: 'announcement',
        layout: 'highlight'
      },
      'editorial': {
        name: 'editorial',
        displayName: 'Editorial Opinion',
        description: 'Editorial-style layout with emphasis on opinion content',
        contentType: 'opinion',
        layout: 'standard'
      },
      'fullpage': {
        name: 'fullpage',
        displayName: 'Featured Story',
        description: 'Full-page featured story layout for special content',
        contentType: 'story',
        layout: 'featured'
      }
    };

    return templateInfo[templateName] || {
      name: templateName,
      displayName: templateName,
      description: 'Custom template',
      contentType: 'news',
      layout: 'standard'
    };
  }

  /**
   * Create sample data for template preview
   */
  createSampleData(contentType: string): TemplatePreviewData {
    const baseData = {
      title: 'Sample Article Title',
      content: '<p>This is a sample article content that demonstrates how the template will look with real content. It includes multiple paragraphs to show the typography and spacing.</p><p>This is a second paragraph to show how the template handles multiple content blocks.</p>',
      author: 'Community Member',
      createdAt: new Date().toISOString(),
      issue: {
        title: 'CLCA Courier Newsletter',
        issueNumber: '2025-01',
        publicationDate: new Date().toISOString()
      },
      featured: false,
      priority: 'normal'
    };

    switch (contentType) {
      case 'event':
        return {
          ...baseData,
          title: 'Community BBQ Event',
          content: '<p>Join us for our annual community BBQ at the Lake Pavilion. We\'ll have food, games, and activities for the whole family.</p><p>Bring your appetite and your friends!</p>',
          eventDate: new Date().toISOString(),
          eventTime: '5:00 PM - 8:00 PM',
          eventLocation: 'Lake Pavilion',
          eventContact: 'events@clca.com'
        };

      case 'announcement':
        return {
          ...baseData,
          title: 'Important Community Update',
          content: '<p>This is an important announcement for all community members. Please read carefully and take appropriate action.</p>',
          priority: 'high',
          featured: true
        };

      case 'opinion':
        return {
          ...baseData,
          title: 'Community Perspectives',
          content: '<p>In this editorial, we explore the current state of our community and share thoughts on future development.</p><p>We welcome your feedback and encourage community dialogue.</p>',
          subtitle: 'A Community Voice'
        };

      case 'story':
        return {
          ...baseData,
          title: 'Featured Community Story',
          content: '<p>This is a featured story that showcases the best of our community. It highlights the people, events, and experiences that make our community special.</p><p>We hope you enjoy reading about the wonderful things happening in our neighborhood.</p>',
          featured: true,
          priority: 'high'
        };

      default:
        return baseData;
    }
  }
}

export const templateManagementService = new TemplateManagementService();
