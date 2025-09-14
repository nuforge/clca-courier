import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock logger utility
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    drive: vi.fn()
  }
}));

// Mock content sanitization utility
vi.mock('../../../src/utils/content-sanitization', () => ({
  sanitizeAndValidate: vi.fn((input: string, options: any) => {
    // Mock implementation that removes script tags and returns sanitized content
    if (typeof input !== 'string') {
      return {
        isValid: true,
        sanitizedValue: '',
        errors: []
      };
    }

    let sanitized = input;

    // Remove script tags and other dangerous content
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    // For non-HTML fields, strip all HTML tags
    if (!options?.allowHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    return {
      isValid: true,
      sanitizedValue: sanitized,
      errors: []
    };
  }),
  SANITIZATION_CONFIGS: {
    TITLE: { allowHtml: false, maxLength: 200 },
    CONTENT: { allowHtml: true, maxLength: 50000 },
    METADATA: { allowHtml: false, maxLength: 1000 },
    LOCATION: { allowHtml: false, maxLength: 500 }
  },
  sanitizeTitle: vi.fn((input) => ({
    isValid: true,
    sanitizedValue: input?.replace(/<script[^>]*>.*?<\/script>/gi, '') || '',
    errors: []
  })),
  sanitizeContent: vi.fn((input) => ({
    isValid: true,
    sanitizedValue: input?.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/onerror="[^"]*"/gi, '') || '',
    errors: []
  })),
  sanitizeLocation: vi.fn((input) => ({
    isValid: true,
    sanitizedValue: input?.replace(/<script[^>]*>.*?<\/script>/gi, '') || '',
    errors: []
  })),
  sanitizeMetadata: vi.fn((input) => ({
    isValid: true,
    sanitizedValue: input?.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<img[^>]*onerror[^>]*>/gi, '') || '',
    errors: []
  })),
  containsMaliciousContent: vi.fn((input) => /<script|onerror|javascript:/i.test(input)),
  logSecurityEvent: vi.fn()
}));

// Mock Firebase Firestore service
vi.mock('../../../src/services/firebase-firestore.service', () => ({
  firestoreService: {
    submitUserContent: vi.fn(),
    getUserContent: vi.fn(),
    updateUserContent: vi.fn(),
    deleteUserContent: vi.fn()
  }
}));

// Mock Firebase Content service
vi.mock('../../../src/services/firebase-content.service', () => ({
  firebaseContentService: {
    createContent: vi.fn().mockResolvedValue('test-content-id'),
    getContent: vi.fn(),
    updateContent: vi.fn(),
    deleteContent: vi.fn()
  }
}));

// Import the service after mocking dependencies
import { contentSubmissionService } from '../../../src/services/content-submission.service';
import { firestoreService } from '../../../src/services/firebase-firestore.service';
import { firebaseContentService } from '../../../src/services/firebase-content.service';

describe('Content Submission Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Metadata Template Creation - Business Logic Validation', () => {
    it('should create comprehensive article template with all required fields', () => {
      const template = contentSubmissionService.createMetadataTemplate('article');

      expect(template).toEqual({
        priority: 'normal',
        tags: [],
        visibility: 'public',
        category: 'community',
        author: ''
      });

      // Verify template has proper structure for content management workflow
      expect(template).toHaveProperty('priority');
      expect(template).toHaveProperty('tags');
      expect(template).toHaveProperty('visibility');
      expect(template.priority).toBe('normal'); // Default priority should be normal
      expect(Array.isArray(template.tags)).toBe(true); // Tags should be array for multiple categorization
    });

    it('should create event-specific template with calendar integration fields', () => {
      const template = contentSubmissionService.createMetadataTemplate('event');

      expect(template).toEqual({
        priority: 'normal',
        tags: [],
        visibility: 'public',
        date: '',
        location: '',
        capacity: 0
      });

      // Critical for calendar integration - must have date and location fields
      expect(template).toHaveProperty('date');
      expect(template).toHaveProperty('location');
      expect(template).toHaveProperty('capacity');
      expect(typeof template.capacity).toBe('number'); // Capacity must be numeric for validation
    });

    it('should create classified template optimized for marketplace functionality', () => {
      const template = contentSubmissionService.createMetadataTemplate('classified');

      expect(template).toEqual({
        priority: 'normal',
        tags: [],
        visibility: 'public',
        category: 'for-sale',
        price: '',
        contact: ''
      });

      // Essential for classified functionality
      expect(template.category).toBe('for-sale'); // Default category should be logical
      expect(template).toHaveProperty('price'); // Price field required for marketplace
      expect(template).toHaveProperty('contact'); // Contact required for buyer-seller communication
    });

    it('should create announcement template with urgency handling', () => {
      const template = contentSubmissionService.createMetadataTemplate('announcement');

      expect(template).toEqual({
        priority: 'normal',
        tags: [],
        visibility: 'public',
        category: 'community',
        urgency: 'normal'
      });

      // Urgency field critical for announcement prioritization
      expect(template).toHaveProperty('urgency');
      expect(template.urgency).toBe('normal'); // Safe default
    });

    it('should provide safe fallback for unknown content types', () => {
      const unknownType = 'newsletter' as any; // Simulating unknown type
      const template = contentSubmissionService.createMetadataTemplate(unknownType);

      // Should return base template without crashing
      expect(template).toEqual({
        priority: 'normal',
        tags: [],
        visibility: 'public'
      });

      // Must be safe and predictable for extensibility
      expect(template.priority).toBe('normal');
      expect(template.visibility).toBe('public');
      expect(Array.isArray(template.tags)).toBe(true);
    });
  });

  describe('Content Submission - Data Integrity & Security', () => {
    const mockSubmissionData = {
      title: 'Community Summer Picnic',
      content: 'Join us for our annual summer picnic with games, food, and fun for the whole family.',
      type: 'event' as const,
      category: 'community-events',
      priority: 'medium' as const,
      attachments: [],
      onCalendar: true,
      eventDate: '2024-08-15',
      eventTime: '14:00',
      eventLocation: 'Lakefront Pavilion',
      allDay: false,
      metadata: {
        specialInstructions: 'Bring a dish to pass'
      }
    };

    it('should successfully submit valid content with proper data transformation', async () => {
      const mockContentId = 'content-12345';
      (firestoreService.submitUserContent as any).mockResolvedValue(mockContentId);

      const result = await contentSubmissionService.submitContent(mockSubmissionData);

      expect(result).toBe(mockContentId);

      // Verify service was called with properly transformed data
      expect(firestoreService.submitUserContent).toHaveBeenCalledTimes(1);

      const submittedData = (firestoreService.submitUserContent as any).mock.calls[0][0];

      // Validate data structure transformation
      expect(submittedData.type).toBe('event');
      expect(submittedData.title).toBe(mockSubmissionData.title);
      expect(submittedData.content).toBe(mockSubmissionData.content);
      expect(submittedData.onCalendar).toBe(true);
      expect(submittedData.eventDate).toBe('2024-08-15');
      expect(submittedData.eventTime).toBe('14:00');
      expect(submittedData.eventLocation).toBe('Lakefront Pavilion');
      expect(submittedData.allDay).toBe(false);
    });

    it('should properly handle calendar-specific fields for events', async () => {
      const calendarEventData = {
        title: 'Board Meeting',
        content: 'Monthly community board meeting',
        type: 'event' as const,
        category: 'governance',
        priority: 'high' as const,
        attachments: [],
        onCalendar: true,
        eventDate: '2024-09-15',
        eventTime: '19:00',
        eventEndTime: '20:30',
        eventLocation: 'Community Center',
        eventRecurrence: { type: 'monthly' as const },
        allDay: false,
        metadata: {}
      };

      (firestoreService.submitUserContent as any).mockResolvedValue('calendar-event-123');

      await contentSubmissionService.submitContent(calendarEventData);

      const submittedData = (firestoreService.submitUserContent as any).mock.calls[0][0];

      // Verify all calendar fields are preserved
      expect(submittedData.onCalendar).toBe(true);
      expect(submittedData.eventDate).toBe('2024-09-15');
      expect(submittedData.eventTime).toBe('19:00');
      expect(submittedData.eventEndTime).toBe('20:30');
      expect(submittedData.eventLocation).toBe('Community Center');
      expect(submittedData.eventRecurrence).toEqual({ type: 'monthly' });
      expect(submittedData.allDay).toBe(false);
    });

    it('should only include defined calendar fields to prevent null pollution', async () => {
      const minimalEventData = {
        title: 'Simple Event',
        content: 'Basic event without full calendar data',
        type: 'event' as const,
        category: 'community',
        priority: 'low' as const,
        attachments: [],
        onCalendar: false, // Event exists but not on calendar
        metadata: {}
        // Note: eventDate, eventTime, etc. are undefined
      };

      (firestoreService.submitUserContent as any).mockResolvedValue('minimal-event-123');

      await contentSubmissionService.submitContent(minimalEventData);

      const submittedData = (firestoreService.submitUserContent as any).mock.calls[0][0];

      // Verify undefined fields are not included (clean data)
      expect(submittedData).not.toHaveProperty('eventDate');
      expect(submittedData).not.toHaveProperty('eventTime');
      expect(submittedData).not.toHaveProperty('eventLocation');
      expect(submittedData).not.toHaveProperty('eventEndDate');
      expect(submittedData).not.toHaveProperty('eventEndTime');
      expect(submittedData).not.toHaveProperty('eventRecurrence');

      // But should have boolean fields with proper defaults
      expect(submittedData.onCalendar).toBe(false);
      expect(submittedData.allDay).toBe(false);
    });
  });

  describe('Error Handling - Production Reliability', () => {
    it('should handle Firebase service failures gracefully', async () => {
      const submissionData = {
        title: 'Test Content',
        content: 'Testing error handling',
        type: 'article' as const,
        category: 'test',
        priority: 'low' as const,
        attachments: [],
        metadata: {}
      };

      const firebaseError = new Error('Firebase: Permission denied');
      (firestoreService.submitUserContent as any).mockRejectedValue(firebaseError);

      // Should propagate error for proper handling by calling code
      await expect(contentSubmissionService.submitContent(submissionData))
        .rejects.toThrow('Firebase: Permission denied');
    });

    it('should handle network failures and timeouts', async () => {
      const submissionData = {
        title: 'Network Test Content',
        content: 'Testing network error handling',
        type: 'announcement' as const,
        category: 'system',
        priority: 'high' as const,
        attachments: [],
        metadata: {}
      };

      const networkError = new Error('Network request timed out');
      (firestoreService.submitUserContent as any).mockRejectedValue(networkError);

      await expect(contentSubmissionService.submitContent(submissionData))
        .rejects.toThrow('Network request timed out');
    });
  });

  describe('Performance and Efficiency', () => {
    it('should handle large content efficiently without timeout', async () => {
      const largeContent = {
        title: 'Performance Test Content',
        content: 'A'.repeat(5000), // 5KB content
        type: 'article' as const,
        category: 'performance-testing',
        priority: 'low' as const,
        attachments: [],
        metadata: {
          size: 'large',
          testType: 'performance'
        }
      };

      (firestoreService.submitUserContent as any).mockResolvedValue('performance-test-123');

      const startTime = Date.now();
      const result = await contentSubmissionService.submitContent(largeContent);
      const endTime = Date.now();

      expect(result).toBe('performance-test-123');
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast

      const submittedData = (firestoreService.submitUserContent as any).mock.calls[0][0];
      expect(submittedData.content).toHaveLength(5000);
    });

    it('should handle concurrent submissions without data mixing', async () => {
      const submissions = [
        {
          title: 'Concurrent Test 1',
          content: 'First concurrent submission',
          type: 'article' as const,
          category: 'test-1',
          priority: 'low' as const,
          attachments: [],
          metadata: {}
        },
        {
          title: 'Concurrent Test 2',
          content: 'Second concurrent submission',
          type: 'event' as const,
          category: 'test-2',
          priority: 'medium' as const,
          attachments: [],
          eventDate: '2024-08-20',
          metadata: {}
        },
        {
          title: 'Concurrent Test 3',
          content: 'Third concurrent submission',
          type: 'classified' as const,
          category: 'test-3',
          priority: 'high' as const,
          attachments: [],
          metadata: {}
        }
      ];

      (firestoreService.submitUserContent as any).mockImplementation(
        (data: any) => Promise.resolve(`concurrent-${data.category}`)
      );

      const results = await Promise.all(
        submissions.map(data => contentSubmissionService.submitContent(data))
      );

      expect(results).toEqual(['concurrent-test-1', 'concurrent-test-2', 'concurrent-test-3']);
      expect(firestoreService.submitUserContent).toHaveBeenCalledTimes(3);

      // Verify data integrity - each call should have correct data
      const calls = (firestoreService.submitUserContent as any).mock.calls;
      expect(calls[0][0].title).toBe('Concurrent Test 1');
      expect(calls[1][0].title).toBe('Concurrent Test 2');
      expect(calls[2][0].title).toBe('Concurrent Test 3');
    });
  });

  describe('XSS Prevention and Security Validation', () => {
    it('should sanitize malicious scripts in title and content', async () => {
      const maliciousData = {
        type: 'article' as const,
        title: '<script>alert("XSS")</script>Malicious Title',
        content: '<script>document.cookie</script><p>Safe content</p><img src="x" onerror="alert(1)">',
        category: 'community',
        priority: 'medium' as const,
        metadata: {},
        attachments: []
      };

      (firestoreService.submitUserContent as any).mockResolvedValue('safe-content-id');

      const contentId = await contentSubmissionService.submitContent(maliciousData);

      expect(contentId).toBe('safe-content-id');
      expect(firestoreService.submitUserContent).toHaveBeenCalledTimes(1);

      const submittedData = (firestoreService.submitUserContent as any).mock.calls[0][0];

      // Verify scripts are removed from title
      expect(submittedData.title).toBe('Malicious Title');
      expect(submittedData.title).not.toContain('<script>');

      // Verify scripts and dangerous attributes are removed from content
      expect(submittedData.content).toContain('<p>Safe content</p>');
      expect(submittedData.content).not.toContain('<script>');
      expect(submittedData.content).not.toContain('onerror');
    });

    it('should prevent XSS in event location field', async () => {
      const eventData = {
        type: 'event' as const,
        title: 'Community Meeting',
        content: 'Monthly community gathering',
        category: 'events',
        priority: 'medium' as const,
        metadata: {},
        attachments: [],
        eventLocation: '<script>alert("location XSS")</script>Community Center',
        eventDate: '2025-09-15',
        onCalendar: true
      };

      (firestoreService.submitUserContent as any).mockResolvedValue('safe-event-id');

      await contentSubmissionService.submitContent(eventData);

      const submittedData = (firestoreService.submitUserContent as any).mock.calls[0][0];

      // Verify scripts are removed from location
      expect(submittedData.eventLocation).toBe('Community Center');
      expect(submittedData.eventLocation).not.toContain('<script>');
    });

    it('should validate and reject content with invalid date ranges', async () => {
      const invalidEventData = {
        type: 'event' as const,
        title: 'Invalid Event',
        content: 'Event with invalid dates',
        category: 'events',
        priority: 'medium' as const,
        metadata: {},
        attachments: [],
        eventDate: '2025-09-15',
        eventEndDate: '2025-09-10', // End date before start date
        onCalendar: true
      };

      await expect(contentSubmissionService.submitContent(invalidEventData))
        .rejects.toThrow('Content validation failed');

      expect(firestoreService.submitUserContent).not.toHaveBeenCalled();
    });

    it('should sanitize metadata fields to prevent XSS', async () => {
      const dataWithMaliciousMetadata = {
        type: 'article' as const,
        title: 'Test Article',
        content: 'Safe content',
        category: 'community',
        priority: 'medium' as const,
        metadata: {
          author: '<script>alert("metadata XSS")</script>John Doe',
          description: 'Safe description',
          tags: '<img src="x" onerror="alert(1)">malicious-tag'
        },
        attachments: []
      };

      (firestoreService.submitUserContent as any).mockResolvedValue('sanitized-metadata-id');

      await contentSubmissionService.submitContent(dataWithMaliciousMetadata);

      const submittedData = (firestoreService.submitUserContent as any).mock.calls[0][0];

      // Check that metadata was included and sanitized
      expect(submittedData.metadata).toBeDefined();
      expect(submittedData.metadata.author).toBe('John Doe');
      expect(submittedData.metadata.author).not.toContain('<script>');
      expect(submittedData.metadata.tags).toBe('malicious-tag');
      expect(submittedData.metadata.tags).not.toContain('<img');
    });

    it('should reject submissions with empty required fields after sanitization', async () => {
      const emptyContentData = {
        type: 'article' as const,
        title: '<script></script>   ', // Only scripts and whitespace
        content: '<script>document.cookie</script>', // Only malicious scripts
        category: 'community',
        priority: 'medium' as const,
        metadata: {},
        attachments: []
      };

      await expect(contentSubmissionService.submitContent(emptyContentData))
        .rejects.toThrow('Content validation failed');

      expect(firestoreService.submitUserContent).not.toHaveBeenCalled();
    });

    it('should validate content type and priority values', async () => {
      const invalidTypeData = {
        type: 'invalid-type' as any,
        title: 'Test Article',
        content: 'Test content',
        category: 'community',
        priority: 'invalid-priority' as any,
        metadata: {},
        attachments: []
      };

      await expect(contentSubmissionService.submitContent(invalidTypeData))
        .rejects.toThrow('Content validation failed');

      expect(firestoreService.submitUserContent).not.toHaveBeenCalled();
    });

    it('should preserve safe HTML tags in content while removing dangerous ones', async () => {
      const mixedContentData = {
        type: 'article' as const,
        title: 'Article with Mixed Content',
        content: '<p>Safe paragraph</p><strong>Bold text</strong><script>alert("danger")</script><a href="https://example.com">Safe link</a><iframe src="malicious"></iframe>',
        category: 'community',
        priority: 'medium' as const,
        metadata: {},
        attachments: []
      };

      (firestoreService.submitUserContent as any).mockResolvedValue('mixed-content-id');

      await contentSubmissionService.submitContent(mixedContentData);

      const submittedData = (firestoreService.submitUserContent as any).mock.calls[0][0];

      // Verify safe HTML is preserved
      expect(submittedData.content).toContain('<p>Safe paragraph</p>');
      expect(submittedData.content).toContain('<strong>Bold text</strong>');
      expect(submittedData.content).toContain('<a href="https://example.com">Safe link</a>');

      // Verify dangerous HTML is removed
      expect(submittedData.content).not.toContain('<script>');
      expect(submittedData.content).not.toContain('<iframe>');
    });
  });

  describe('Canva Integration - attachCanvaDesign', () => {
    it('should successfully attach Canva design to existing content', async () => {
      const contentId = 'test-content-123';
      const mockCanvaDesign = {
        id: 'canva-design-456',
        editUrl: 'https://canva.com/design/canva-design-456/edit',
        exportUrl: null,
        status: 'draft' as const,
        createdAt: { seconds: 1726000000, nanoseconds: 0 } as any,
        updatedAt: { seconds: 1726000000, nanoseconds: 0 } as any
      };

      (firestoreService.updateUserContent as any).mockResolvedValue(undefined);

      await contentSubmissionService.attachCanvaDesign(contentId, mockCanvaDesign);

      // Verify the update was called with correct parameters
      expect(firestoreService.updateUserContent).toHaveBeenCalledWith(contentId, {
        canvaDesign: mockCanvaDesign
      });

      // Verify it was called exactly once
      expect(firestoreService.updateUserContent).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when attaching Canva design', async () => {
      const contentId = 'test-content-123';
      const mockCanvaDesign = {
        id: 'canva-design-456',
        editUrl: 'https://canva.com/design/canva-design-456/edit',
        exportUrl: null,
        status: 'draft' as const,
        createdAt: { seconds: 1726000000, nanoseconds: 0 } as any,
        updatedAt: { seconds: 1726000000, nanoseconds: 0 } as any
      };

      const mockError = new Error('Firestore update failed');
      (firestoreService.updateUserContent as any).mockRejectedValue(mockError);

      await expect(
        contentSubmissionService.attachCanvaDesign(contentId, mockCanvaDesign)
      ).rejects.toThrow('Firestore update failed');

      // Verify the update was attempted
      expect(firestoreService.updateUserContent).toHaveBeenCalledWith(contentId, {
        canvaDesign: mockCanvaDesign
      });
    });

    it('should handle Canva design with export URL and exported status', async () => {
      const contentId = 'test-content-123';
      const mockCanvaDesign = {
        id: 'canva-design-789',
        editUrl: 'https://canva.com/design/canva-design-789/edit',
        exportUrl: 'https://canva-export.s3.amazonaws.com/design-789.pdf',
        status: 'exported' as const,
        createdAt: { seconds: 1726000000, nanoseconds: 0 } as any,
        updatedAt: { seconds: 1726001000, nanoseconds: 0 } as any
      };

      (firestoreService.updateUserContent as any).mockResolvedValue(undefined);

      await contentSubmissionService.attachCanvaDesign(contentId, mockCanvaDesign);

      // Verify the exported design is properly attached
      expect(firestoreService.updateUserContent).toHaveBeenCalledWith(contentId, {
        canvaDesign: mockCanvaDesign
      });

      // Verify all fields including export URL are preserved
      const callArgs = (firestoreService.updateUserContent as any).mock.calls[0][1];
      expect(callArgs.canvaDesign.exportUrl).toBe('https://canva-export.s3.amazonaws.com/design-789.pdf');
      expect(callArgs.canvaDesign.status).toBe('exported');
    });
  });
});
