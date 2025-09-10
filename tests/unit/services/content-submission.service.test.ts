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

// Mock Firebase Firestore service
vi.mock('../../../src/services/firebase-firestore.service', () => ({
  firestoreService: {
    submitUserContent: vi.fn(),
    getUserContent: vi.fn(),
    updateUserContent: vi.fn(),
    deleteUserContent: vi.fn()
  }
}));

// Import the service after mocking dependencies
import { contentSubmissionService } from '../../../src/services/content-submission.service';
import { firestoreService } from '../../../src/services/firebase-firestore.service';

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
        (data: any) => Promise.resolve(`concurrent-${data.tags[0]}`)
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
});
