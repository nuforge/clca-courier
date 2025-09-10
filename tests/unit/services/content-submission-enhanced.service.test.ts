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

// Import services and types
import { contentSubmissionService } from '../../../src/services/content-submission.service';
import { firestoreService } from '../../../src/services/firebase-firestore.service';
import type { ContentSubmissionData } from '../../../src/types/core/content.types';

describe('Content Submission Service - Enhanced Security & Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Validation & Sanitization - CRITICAL SECURITY', () => {
    it('should validate required fields before submission', async () => {
      const invalidSubmissionData = {
        type: 'article' as const,
        // Missing required title
        content: 'Test content',
        category: 'test',
        priority: 'low' as const,
        attachments: [],
        metadata: {}
      } as Partial<ContentSubmissionData>;

      // Should reject submission with missing required fields
      await expect(
        contentSubmissionService.submitContent(invalidSubmissionData as ContentSubmissionData)
      ).rejects.toThrow();

      // Firebase should not be called with invalid data
      expect(firestoreService.submitUserContent).not.toHaveBeenCalled();
    });

    it('should sanitize user input to prevent injection attacks', async () => {
      const maliciousSubmissionData: ContentSubmissionData = {
        type: 'article',
        title: '<script>alert("XSS")</script>Malicious Title',
        content: '"><script>alert("XSS")</script><p>Malicious content</p>',
        category: 'test',
        priority: 'low',
        attachments: [],
        metadata: {
          maliciousScript: '<script>document.cookie</script>',
          sqlInjection: "'; DROP TABLE users; --",
          htmlInjection: '<iframe src="javascript:alert(1)"></iframe>'
        }
      };

      const mockContentId = 'sanitized-content-123';
      (firestoreService.submitUserContent as any).mockResolvedValue(mockContentId);

      await contentSubmissionService.submitContent(maliciousSubmissionData);

      // Verify data was sanitized before submission
      const submittedData = (firestoreService.submitUserContent as any).mock.calls[0][0];

      // Title should be sanitized (no script tags)
      expect(submittedData.title).not.toContain('<script>');
      expect(submittedData.title).not.toContain('alert(');

      // Content should be sanitized
      expect(submittedData.content).not.toContain('<script>');
      expect(submittedData.content).not.toContain('javascript:');

      // Metadata should be sanitized
      expect(JSON.stringify(submittedData.metadata)).not.toContain('<script>');
      expect(JSON.stringify(submittedData.metadata)).not.toContain('DROP TABLE');
      expect(JSON.stringify(submittedData.metadata)).not.toContain('<iframe');
    });

    it('should validate date formats for calendar events', async () => {
      const invalidEventData: ContentSubmissionData = {
        type: 'event',
        title: 'Invalid Event',
        content: 'Event with invalid dates',
        category: 'test',
        priority: 'medium',
        attachments: [],
        onCalendar: true,
        eventDate: 'invalid-date-format',
        eventTime: '25:99', // Invalid time
        eventEndTime: 'not-a-time',
        metadata: {}
      };

      // Should reject submission with invalid dates
      await expect(
        contentSubmissionService.submitContent(invalidEventData)
      ).rejects.toThrow(/invalid.*date|invalid.*time/i);

      // Firebase should not be called with invalid data
      expect(firestoreService.submitUserContent).not.toHaveBeenCalled();
    });

    it('should validate file attachment sizes and types', async () => {
      const oversizedAttachmentData: ContentSubmissionData = {
        type: 'article',
        title: 'Article with Oversized Attachment',
        content: 'Testing file size validation',
        category: 'test',
        priority: 'low',
        attachments: [
          {
            id: 'oversized-file',
            type: 'firebase_image',
            filename: 'huge-image.jpg',
            firebaseUrl: 'test-url',
            isUserHosted: false,
            // Simulating a 50MB file (should be rejected)
            caption: 'Test image'
          }
        ],
        metadata: {
          fileSize: 52428800 // 50MB
        }
      };

      // Mock file size validation failure
      await expect(
        contentSubmissionService.submitContent(oversizedAttachmentData)
      ).rejects.toThrow(/file.*size|too.*large/i);

      // Test invalid file types
      const maliciousFileData: ContentSubmissionData = {
        ...oversizedAttachmentData,
        attachments: [
          {
            id: 'malicious-file',
            type: 'firebase_pdf',
            filename: 'malicious.exe',
            firebaseUrl: 'test-url',
            isUserHosted: false
          }
        ],
        metadata: {}
      };

      await expect(
        contentSubmissionService.submitContent(maliciousFileData)
      ).rejects.toThrow(/invalid.*file.*type|unsupported.*format/i);
    });

    it('should prevent submission of content exceeding length limits', async () => {
      const oversizedContentData: ContentSubmissionData = {
        type: 'article',
        title: 'A'.repeat(1000), // 1000 characters - should be rejected
        content: 'B'.repeat(100000), // 100KB content - should be rejected
        category: 'test',
        priority: 'low',
        attachments: [],
        metadata: {}
      };

      // Should reject oversized content
      await expect(
        contentSubmissionService.submitContent(oversizedContentData)
      ).rejects.toThrow(/content.*too.*long|exceeds.*limit/i);

      expect(firestoreService.submitUserContent).not.toHaveBeenCalled();
    });

    it('should validate email formats in contact information', async () => {
      const invalidEmailData: ContentSubmissionData = {
        type: 'classified',
        title: 'For Sale: Car',
        content: 'Selling my car',
        category: 'for-sale',
        priority: 'medium',
        attachments: [],
        metadata: {
          contact: {
            email: 'not-a-valid-email',
            phone: '555-1234'
          }
        }
      };

      // Should reject invalid email formats
      await expect(
        contentSubmissionService.submitContent(invalidEmailData)
      ).rejects.toThrow(/invalid.*email|email.*format/i);

      expect(firestoreService.submitUserContent).not.toHaveBeenCalled();
    });
  });

  describe('Type Safety & Data Consistency - CRITICAL TYPE SAFETY', () => {
    it('should maintain consistent data structure across all content types', async () => {
      const testCases: ContentSubmissionData[] = [
        {
          type: 'article' as const,
          title: 'Test Article',
          content: 'Article content',
          category: 'community',
          priority: 'low' as const,
          attachments: [],
          metadata: {}
        },
        {
          type: 'event' as const,
          title: 'Test Event',
          content: 'Event description',
          category: 'events',
          priority: 'high' as const,
          attachments: [],
          onCalendar: true,
          eventDate: '2024-08-15',
          eventTime: '14:00',
          metadata: {}
        },
        {
          type: 'classified' as const,
          title: 'For Sale',
          content: 'Item description',
          category: 'for-sale',
          priority: 'low' as const,
          attachments: [],
          metadata: {
            price: '$100',
            contact: 'test@example.com'
          }
        }
      ];

      (firestoreService.submitUserContent as any).mockResolvedValue('test-id');

      for (const testCase of testCases) {
        await contentSubmissionService.submitContent(testCase);
      }

      // Verify all submissions have consistent structure
      const submissions = (firestoreService.submitUserContent as any).mock.calls;

      submissions.forEach((call: any[], index: number) => {
        const submittedData = call[0];
        const originalData = testCases[index];

        if (originalData) {
          // Core fields must be present and correct type
          expect(submittedData.type).toBe(originalData.type);
          expect(submittedData.title).toBe(originalData.title);
          expect(submittedData.content).toBe(originalData.content);
          expect(Array.isArray(submittedData.tags)).toBe(true);
          expect(submittedData.attachments).toEqual(originalData.attachments);
        }

        // Metadata should be properly structured
        expect(typeof submittedData.metadata).toBe('object');
        expect(submittedData.metadata).not.toBeNull();
        expect(submittedData.metadata.submissionSource).toBe('web');
      });
    });

    it('should properly convert ContentSubmissionData to UserContent format without type violations', async () => {
      const submissionData: ContentSubmissionData = {
        type: 'event',
        title: 'Community Meeting',
        content: 'Monthly community board meeting',
        category: 'governance',
        priority: 'high',
        attachments: [],
        onCalendar: true,
        eventDate: '2024-08-20',
        eventTime: '19:00',
        eventEndTime: '21:00',
        eventLocation: 'Community Center',
        allDay: false,
        metadata: {
          capacity: 50,
          requiresRSVP: true
        }
      };

      const mockContentId = 'converted-content-123';
      (firestoreService.submitUserContent as any).mockResolvedValue(mockContentId);

      await contentSubmissionService.submitContent(submissionData);

      const submittedData = (firestoreService.submitUserContent as any).mock.calls[0][0];

      // Verify proper type conversion without any casting violations
      expect(submittedData.type).toBe('event');
      expect(submittedData.title).toBe('Community Meeting');
      expect(submittedData.content).toBe('Monthly community board meeting');

      // Category should be converted to tags array properly
      expect(Array.isArray(submittedData.tags)).toBe(true);
      expect(submittedData.tags).toContain('governance');

      // Calendar fields should be preserved with correct types
      expect(submittedData.onCalendar).toBe(true);
      expect(submittedData.eventDate).toBe('2024-08-20');
      expect(submittedData.eventTime).toBe('19:00');
      expect(submittedData.eventEndTime).toBe('21:00');
      expect(submittedData.eventLocation).toBe('Community Center');
      expect(submittedData.allDay).toBe(false);

      // Metadata should include original data plus system metadata
      expect(submittedData.metadata.capacity).toBe(50);
      expect(submittedData.metadata.requiresRSVP).toBe(true);
      expect(submittedData.metadata.submissionSource).toBe('web');
      expect(typeof submittedData.metadata.userAgent).toBe('string');
    });

    it('should preserve all calendar fields without data loss', async () => {
      const complexCalendarEvent: ContentSubmissionData = {
        type: 'event',
        title: 'Recurring Community Cleanup',
        content: 'Weekly community cleanup event',
        category: 'volunteer',
        priority: 'medium',
        attachments: [],
        onCalendar: true,
        eventDate: '2024-08-15',
        eventEndDate: '2024-12-15',
        eventTime: '09:00',
        eventEndTime: '11:00',
        eventLocation: 'Community Park',
        allDay: false,
        eventRecurrence: {
          type: 'weekly',
          interval: 1,
          endDate: '2024-12-15',
          daysOfWeek: [6] // Saturday
        },
        metadata: {}
      };

      (firestoreService.submitUserContent as any).mockResolvedValue('recurring-event-123');

      await contentSubmissionService.submitContent(complexCalendarEvent);

      const submittedData = (firestoreService.submitUserContent as any).mock.calls[0][0];

      // Verify NO calendar data is lost
      expect(submittedData.onCalendar).toBe(true);
      expect(submittedData.eventDate).toBe('2024-08-15');
      expect(submittedData.eventEndDate).toBe('2024-12-15');
      expect(submittedData.eventTime).toBe('09:00');
      expect(submittedData.eventEndTime).toBe('11:00');
      expect(submittedData.eventLocation).toBe('Community Park');
      expect(submittedData.allDay).toBe(false);

      // Verify complex recurrence object is preserved
      expect(submittedData.eventRecurrence).toEqual({
        type: 'weekly',
        interval: 1,
        endDate: '2024-12-15',
        daysOfWeek: [6]
      });
    });

    it('should handle metadata without using any types', async () => {
      const submissionWithComplexMetadata: ContentSubmissionData = {
        type: 'article',
        title: 'Complex Metadata Test',
        content: 'Testing complex metadata handling',
        category: 'technical',
        priority: 'low',
        attachments: [],
        metadata: {
          // Complex nested object that should not require any types
          author: {
            name: 'John Doe',
            credentials: ['PhD', 'MS'],
            affiliations: {
              primary: 'Community Board',
              secondary: 'Volunteer Committee'
            }
          },
          reviewers: [
            { name: 'Jane Smith', role: 'Editor' },
            { name: 'Bob Johnson', role: 'Technical Review' }
          ],
          publicationData: {
            targetAudience: 'residents',
            estimatedReadTime: 5,
            tags: ['technical', 'informative'],
            seoMetadata: {
              description: 'Technical article for residents',
              keywords: ['community', 'technical', 'information']
            }
          }
        }
      };

      (firestoreService.submitUserContent as any).mockResolvedValue('complex-metadata-123');

      // Should handle complex metadata without type casting errors
      const result = await contentSubmissionService.submitContent(submissionWithComplexMetadata);
      expect(result).toBe('complex-metadata-123');

      const submittedData = (firestoreService.submitUserContent as any).mock.calls[0][0];

      // Verify complex metadata structure is preserved
      expect(submittedData.metadata.author.name).toBe('John Doe');
      expect(submittedData.metadata.author.credentials).toEqual(['PhD', 'MS']);
      expect(submittedData.metadata.reviewers).toHaveLength(2);
      expect(submittedData.metadata.publicationData.estimatedReadTime).toBe(5);
      expect(submittedData.metadata.publicationData.seoMetadata.keywords).toEqual(['community', 'technical', 'information']);
    });

    it('should validate category-to-tags conversion logic', async () => {
      const testSubmissions = [
        { category: 'community-events', expectedTags: ['community-events'] },
        { category: 'governance', expectedTags: ['governance'] },
        { category: 'for-sale', expectedTags: ['for-sale'] },
        { category: 'volunteer-opportunities', expectedTags: ['volunteer-opportunities'] }
      ];

      (firestoreService.submitUserContent as any).mockResolvedValue('category-test');

      for (const testCase of testSubmissions) {
        const submissionData: ContentSubmissionData = {
          type: 'article',
          title: `Test ${testCase.category}`,
          content: 'Testing category conversion',
          category: testCase.category,
          priority: 'low',
          attachments: [],
          metadata: {}
        };

        await contentSubmissionService.submitContent(submissionData);
      }

      // Verify category-to-tags conversion is consistent and lossless
      const submissions = (firestoreService.submitUserContent as any).mock.calls;

      submissions.forEach((call: any[], index: number) => {
        const submittedData = call[0];
        const expectedCase = testSubmissions[index];

        if (expectedCase) {
          expect(Array.isArray(submittedData.tags)).toBe(true);
          expect(submittedData.tags).toEqual(expectedCase.expectedTags);

          // Original category should be preserved somewhere for reversibility
          expect(submittedData.metadata.originalCategory || submittedData.tags[0]).toBe(expectedCase.category);
        }
      });
    });
  });

  describe('Authentication & Authorization Integration - SECURITY CRITICAL', () => {
    it('should handle user logout during submission gracefully', async () => {
      // Mock Firebase auth service to simulate user logout mid-submission
      const mockAuthService = {
        getCurrentUser: vi.fn()
          .mockReturnValueOnce({ uid: 'user-123', displayName: 'Test User', email: 'test@example.com' })
          .mockReturnValueOnce(null) // User logged out during submission
      };

      // Replace the mock
      vi.doMock('../../../src/services/firebase-auth.service', () => ({
        firebaseAuthService: mockAuthService
      }));

      const submissionData: ContentSubmissionData = {
        type: 'article',
        title: 'Test During Logout',
        content: 'Testing auth state change during submission',
        category: 'test',
        priority: 'low',
        attachments: [],
        metadata: {}
      };

      // Should handle auth state change gracefully
      await expect(
        contentSubmissionService.submitContent(submissionData)
      ).rejects.toThrow(/authentication|user.*logged.*out|unauthorized/i);

      // Firebase should not be called with invalid auth state
      expect(firestoreService.submitUserContent).not.toHaveBeenCalled();
    });

    it('should validate user permissions before allowing submission', async () => {
      // Mock user with restricted permissions
      const restrictedUser = {
        uid: 'restricted-user-123',
        displayName: 'Restricted User',
        email: 'restricted@example.com',
        permissions: ['read'] // No write permissions
      };

      const mockAuthService = {
        getCurrentUser: vi.fn().mockReturnValue(restrictedUser),
        hasPermission: vi.fn().mockReturnValue(false)
      };

      vi.doMock('../../../src/services/firebase-auth.service', () => ({
        firebaseAuthService: mockAuthService
      }));

      const submissionData: ContentSubmissionData = {
        type: 'article',
        title: 'Unauthorized Submission',
        content: 'Testing permission validation',
        category: 'test',
        priority: 'low',
        attachments: [],
        metadata: {}
      };

      // Should reject submission from user without permissions
      await expect(
        contentSubmissionService.submitContent(submissionData)
      ).rejects.toThrow(/permission|unauthorized|access.*denied/i);
    });

    it('should refresh authentication tokens when expired', async () => {
      // Mock token refresh scenario
      const mockAuthService = {
        getCurrentUser: vi.fn().mockReturnValue({
          uid: 'user-with-expired-token',
          displayName: 'User',
          email: 'user@example.com'
        }),
        refreshToken: vi.fn().mockResolvedValue(true)
      };

      // Mock Firebase error for expired token
      (firestoreService.submitUserContent as any)
        .mockRejectedValueOnce(new Error('Token expired'))
        .mockResolvedValueOnce('refreshed-submission-123');

      vi.doMock('../../../src/services/firebase-auth.service', () => ({
        firebaseAuthService: mockAuthService
      }));

      const submissionData: ContentSubmissionData = {
        type: 'article',
        title: 'Token Refresh Test',
        content: 'Testing token refresh functionality',
        category: 'test',
        priority: 'low',
        attachments: [],
        metadata: {}
      };

      // Should successfully refresh token and retry submission
      const result = await contentSubmissionService.submitContent(submissionData);
      expect(result).toBe('refreshed-submission-123');
      expect(mockAuthService.refreshToken).toHaveBeenCalled();
    });

    it('should handle anonymous user attempts appropriately', async () => {
      // Mock anonymous user (null user)
      const mockAuthService = {
        getCurrentUser: vi.fn().mockReturnValue(null),
        isAnonymous: vi.fn().mockReturnValue(true)
      };

      vi.doMock('../../../src/services/firebase-auth.service', () => ({
        firebaseAuthService: mockAuthService
      }));

      const submissionData: ContentSubmissionData = {
        type: 'article',
        title: 'Anonymous Submission',
        content: 'Testing anonymous user handling',
        category: 'test',
        priority: 'low',
        attachments: [],
        metadata: {}
      };

      // Should reject anonymous submissions
      await expect(
        contentSubmissionService.submitContent(submissionData)
      ).rejects.toThrow(/authentication.*required|anonymous.*not.*allowed|login.*required/i);
    });
  });
});
