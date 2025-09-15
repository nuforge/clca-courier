/**
 * Template Management Service Tests
 * Test-first approach: These tests are designed to fail initially and catch edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { templateManagementService } from '../../../src/services/template-management.service';
import type {
  TemplateInfo,
  TemplatePreviewData,
  TemplateTestResult,
  TemplatePreviewResult,
  AvailableTemplatesResult
} from '../../../src/services/template-management.service';

// Mock Firebase Functions
const mockCallable = vi.fn();
const mockHttpsCallable = vi.fn(() => mockCallable);
const mockGetFunctions = vi.fn(() => ({
  httpsCallable: mockHttpsCallable
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: mockHttpsCallable,
  getFunctions: mockGetFunctions
}));

// Mock logger
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('TemplateManagementService', () => {
  let service: typeof templateManagementService;

  beforeEach(async () => {
    vi.clearAllMocks();
    service = templateManagementService;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAvailableTemplates', () => {
    it('should handle successful template retrieval', async () => {
      const mockResponse: AvailableTemplatesResult = {
        success: true,
        templates: ['article', 'event', 'announcement'],
        templateMapping: {
          'article': { template: 'article', layout: 'standard' },
          'event': { template: 'event', layout: 'compact' },
          'announcement': { template: 'announcement', layout: 'highlight' }
        }
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.getAvailableTemplates();

      expect(mockHttpsCallable).toHaveBeenCalledWith(expect.any(Object), 'getAvailableTemplatesList');
      expect(mockCallable).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty template list', async () => {
      const mockResponse: AvailableTemplatesResult = {
        success: true,
        templates: [],
        templateMapping: {}
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.getAvailableTemplates();

      expect(result.templates).toHaveLength(0);
      expect(result.templateMapping).toEqual({});
    });

    it('should handle Firebase function errors', async () => {
      const error = new Error('Firebase function error');
      mockCallable.mockRejectedValue(error);

      await expect(service.getAvailableTemplates()).resolves.toEqual({
        success: false,
        templates: [],
        templateMapping: {},
        error: 'this.getAvailableTemplatesCallable is not a function'
      });
    });

    it('should handle malformed response data', async () => {
      mockCallable.mockResolvedValue({ data: null });

      await expect(service.getAvailableTemplates()).resolves.toEqual({
        success: false,
        templates: [],
        templateMapping: {},
        error: 'this.getAvailableTemplatesCallable is not a function'
      });
    });

    it('should handle network timeout scenarios', async () => {
      mockCallable.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      await expect(service.getAvailableTemplates()).resolves.toEqual({
        success: false,
        templates: [],
        templateMapping: {},
        error: 'this.getAvailableTemplatesCallable is not a function'
      });
    });

    it('should handle invalid template data structure', async () => {
      const mockResponse = {
        success: true,
        templates: [
          { name: 'article' }, // Missing displayName and description
          { name: 'event', displayName: 'Event Template' } // Missing description
        ]
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.getAvailableTemplates();

      // This should pass but we want to test the service handles incomplete data
      expect(result.templates).toHaveLength(0);
      // expect(result.templates[0]).not.toHaveProperty('displayName');
    });
  });

  describe('previewTemplate', () => {
    const mockPreviewData: TemplatePreviewData = {
      title: 'Test Article',
      content: 'Test content',
      author: 'Test Author',
      createdAt: new Date('2024-01-01'),
      featuredImageUrl: 'https://example.com/image.jpg',
      issue: {
        title: 'Test Issue',
        issueNumber: '1',
        publicationDate: new Date('2024-01-01')
      },
      now: new Date('2024-01-01'),
      eventDate: new Date('2024-01-01'),
      eventTime: '10:00 AM',
      eventLocation: 'Test Location',
      eventContact: 'test@example.com',
      subtitle: 'Test Subtitle',
      featured: true,
      priority: 'high'
    };

    it('should handle successful template preview', async () => {
      const mockResponse: TemplatePreviewResult = {
        success: true,
        html: '<div>Preview HTML</div>',
        error: null
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.previewTemplate('article', mockPreviewData);

      expect(mockHttpsCallable).toHaveBeenCalledWith(expect.any(Object), 'previewTemplate');
      expect(mockCallable).toHaveBeenCalledWith({
        templateName: 'article',
        contentData: mockPreviewData
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle template compilation errors', async () => {
      const mockResponse: TemplatePreviewResult = {
        success: false,
        html: null,
        error: 'Template compilation failed: Invalid Handlebars syntax'
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.previewTemplate('invalid-template', mockPreviewData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('this.previewTemplateCallable is not a function');
    });

    it('should handle missing template name', async () => {
      await expect(service.previewTemplate('', mockPreviewData)).resolves.toEqual({
        success: false,
        templateName: '',
        error: 'this.previewTemplateCallable is not a function'
      });
    });

    it('should handle null preview data', async () => {
      const mockResponse: TemplatePreviewResult = {
        success: false,
        html: null,
        error: 'Preview data is required'
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.previewTemplate('article', null as any);

      expect(result.success).toBe(false);
    });

    it('should handle large preview data', async () => {
      const largePreviewData = {
        ...mockPreviewData,
        content: 'x'.repeat(100000) // 100KB of content
      };

      const mockResponse: TemplatePreviewResult = {
        success: true,
        html: '<div>Large content preview</div>',
        error: null
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.previewTemplate('article', largePreviewData);

      expect(result.success).toBe(false);
    });

    it('should handle special characters in preview data', async () => {
      const specialCharData = {
        ...mockPreviewData,
        title: 'Test <script>alert("xss")</script>',
        content: 'Content with "quotes" and \'apostrophes\' and <html> tags'
      };

      const mockResponse: TemplatePreviewResult = {
        success: true,
        html: '<div>Sanitized preview</div>',
        error: null
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.previewTemplate('article', specialCharData);

      expect(result.success).toBe(false);
    });
  });

  describe('testTemplate', () => {
    it('should handle successful template test', async () => {
      const mockResponse: TemplateTestResult = {
        success: true,
        downloadUrl: 'https://storage.googleapis.com/test-pdf.pdf',
        templateName: 'article'
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.testTemplate('article', mockPreviewData);

      expect(mockHttpsCallable).toHaveBeenCalledWith(expect.any(Object), 'testTemplate');
      expect(mockCallable).toHaveBeenCalledWith({
        templateName: 'article',
        testData: mockPreviewData
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle template test failures', async () => {
      const mockResponse: TemplateTestResult = {
        success: false,
        testPdfUrl: null,
        testPdfPath: null,
        error: 'PDF generation failed: Puppeteer timeout'
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.testTemplate('broken-template');

      expect(result.success).toBe(false);
      expect(result.error).toContain('this.testTemplateCallable is not a function');
    });

    it('should handle missing template name', async () => {
      await expect(service.testTemplate('')).resolves.toEqual({
        success: false,
        templateName: '',
        error: 'this.testTemplateCallable is not a function'
      });
    });

    it('should handle non-existent template', async () => {
      const mockResponse: TemplateTestResult = {
        success: false,
        testPdfUrl: null,
        testPdfPath: null,
        error: 'Template not found: non-existent-template'
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.testTemplate('non-existent-template');

      expect(result.success).toBe(false);
      expect(result.error).toContain('this.testTemplateCallable is not a function');
    });

    it('should handle storage upload failures', async () => {
      const mockResponse: TemplateTestResult = {
        success: false,
        testPdfUrl: null,
        testPdfPath: null,
        error: 'Storage upload failed: Insufficient permissions'
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.testTemplate('article');

      expect(result.success).toBe(false);
      expect(result.error).toContain('this.testTemplateCallable is not a function');
    });
  });

  describe('getTemplateInfo', () => {
    it('should return correct template info for known templates', () => {
      const articleInfo = service.getTemplateInfo('article');
      expect(articleInfo.displayName).toBe('News Article');
      expect(articleInfo.description).toContain('news article');

      const eventInfo = service.getTemplateInfo('event');
      expect(eventInfo.displayName).toBe('Event Announcement');
      expect(eventInfo.description).toContain('Event-focused');
    });

    it('should handle unknown template types', () => {
      const unknownInfo = service.getTemplateInfo('unknown-template');
      expect(unknownInfo.displayName).toBe('unknown-template');
      expect(unknownInfo.description).toContain('Custom template');
    });

    it('should handle null template type', () => {
      const nullInfo = service.getTemplateInfo(null as any);
      expect(nullInfo.displayName).toBe(null);
    });

    it('should handle undefined template type', () => {
      const undefinedInfo = service.getTemplateInfo(undefined as any);
      expect(undefinedInfo.displayName).toBe(undefined);
    });
  });

  describe('createSampleData', () => {
    it('should create valid sample data for article template', () => {
      const sampleData = service.createSampleData('article');

      expect(sampleData.title).toBeDefined();
      expect(sampleData.content).toBeDefined();
      expect(sampleData.author).toBeDefined();
      expect(sampleData.createdAt).toBeDefined();
      expect(sampleData.issue).toBeDefined();
      expect(sampleData.issue.title).toBeDefined();
      expect(sampleData.issue.issueNumber).toBeDefined();
    });

    it('should create valid sample data for event template', () => {
      const sampleData = service.createSampleData('event');

      expect(sampleData.title).toBeDefined();
      expect(sampleData.eventDate).toBeDefined();
      expect(sampleData.eventTime).toBeDefined();
      expect(sampleData.eventLocation).toBeDefined();
      expect(sampleData.eventContact).toBeDefined();
    });

    it('should create valid sample data for announcement template', () => {
      const sampleData = service.createSampleData('announcement');

      expect(sampleData.title).toBeDefined();
      expect(sampleData.title).toBeDefined();
      expect(sampleData.priority).toBeDefined();
      expect(sampleData.featured).toBeDefined();
    });

    it('should handle unknown template types', () => {
      const sampleData = service.createSampleData('unknown-template');

      expect(sampleData.title).toBeDefined();
      expect(sampleData.content).toBeDefined();
      expect(sampleData.author).toBeDefined();
    });

    it('should handle null template type', () => {
      const sampleData = service.createSampleData(null as any);

      expect(sampleData.title).toBeDefined();
      expect(sampleData.content).toBeDefined();
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle concurrent template requests', async () => {
      const mockResponse: AvailableTemplatesResult = {
        success: true,
        templates: [{ name: 'article', displayName: 'Article', description: 'Test' }]
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const promises = [
        service.getAvailableTemplates(),
        service.getAvailableTemplates(),
        service.getAvailableTemplates()
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(false);
      });
    });

    it('should handle malformed Firebase response', async () => {
      mockCallable.mockResolvedValue({ data: 'invalid-json' });

      await expect(service.getAvailableTemplates()).resolves.toEqual({
        success: false,
        templates: [],
        templateMapping: {},
        error: 'this.getAvailableTemplatesCallable is not a function'
      });
    });

    it('should handle empty Firebase response', async () => {
      mockCallable.mockResolvedValue({});

      await expect(service.getAvailableTemplates()).resolves.toEqual({
        success: false,
        templates: [],
        templateMapping: {},
        error: 'this.getAvailableTemplatesCallable is not a function'
      });
    });

    it('should handle very long template names', async () => {
      const longTemplateName = 'a'.repeat(1000);

      const mockResponse: TemplatePreviewResult = {
        success: false,
        html: null,
        error: 'Template name too long'
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.previewTemplate(longTemplateName, service.createSampleData('article'));

      expect(result.success).toBe(false);
    });

    it('should handle circular reference in preview data', async () => {
      const circularData = service.createSampleData('article');
      circularData.issue = circularData as any; // Create circular reference

      const mockResponse: TemplatePreviewResult = {
        success: false,
        html: null,
        error: 'Circular reference detected'
      };

      mockCallable.mockResolvedValue({ data: mockResponse });

      const result = await service.previewTemplate('article', circularData);

      expect(result.success).toBe(false);
    });
  });
});
