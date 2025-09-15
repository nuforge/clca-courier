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
    updateContentStatus: vi.fn(),
    deleteUserContent: vi.fn(),
    getPendingContent: vi.fn(),
    getApprovedContent: vi.fn(),
    getPublishedContent: vi.fn()
  }
}));

// Mock Firebase auth service
vi.mock('../../../src/services/firebase-auth.service', () => ({
  firebaseAuthService: {
    getCurrentUser: vi.fn(),
    onAuthStateChanged: vi.fn(),
    isAdmin: vi.fn(),
    refreshToken: vi.fn()
  }
}));

// Mock Firebase Auth directly
const mockCurrentUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true
};

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: mockCurrentUser,
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    signInWithRedirect: vi.fn(),
    signOut: vi.fn()
  })),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  User: class MockUser {
    uid = 'test-uid';
    email = 'test@example.com';
    displayName = 'Test User';
    emailVerified = true;
  }
}));

// Mock Firebase Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({
    id: 'test-doc-id',
    path: 'test/path'
  })),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {
    fromDate: vi.fn(),
    now: vi.fn()
  }
}));

// Mock Firebase Content Service
vi.mock('../../../src/services/firebase-content.service', () => ({
  firebaseContentService: {
    createContent: vi.fn(),
    getContent: vi.fn(),
    updateContent: vi.fn(),
    deleteContent: vi.fn(),
    getContentList: vi.fn()
  }
}));

// Import services
import { contentSubmissionService } from '../../../src/services/content-submission.service';
import { firestoreService } from '../../../src/services/firebase-firestore.service';
import { firebaseAuthService } from '../../../src/services/firebase-auth.service';
import { firebaseContentService } from '../../../src/services/firebase-content.service';
import type { ContentDoc, ContentFeatures } from '../../../src/types/core/content.types';

describe('Firebase Integration Resilience Tests', () => {
  // Helper function to create ContentDoc test data
  const createTestContentDoc = (overrides: Partial<ContentDoc> = {}): ContentDoc => ({
    id: 'test-content-123',
    title: 'Test Content',
    description: 'Test content description',
    authorId: 'test-user-123',
    authorName: 'Test User',
    tags: ['content-type:article', 'category:test'],
    features: {},
    status: 'draft',
    timestamps: {
      created: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
      updated: { toMillis: () => Date.now(), toDate: () => new Date() } as any
    },
    ...overrides
  });

  const createEventContentDoc = (overrides: Partial<ContentDoc> = {}): ContentDoc => {
    const baseDoc = createTestContentDoc(overrides);
    return {
      ...baseDoc,
      tags: ['content-type:event', 'category:community'],
      features: {
        'feat:date': {
          start: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
          end: { toMillis: () => Date.now() + 3600000, toDate: () => new Date(Date.now() + 3600000) } as any,
          isAllDay: false
        },
        'feat:location': {
          name: 'Test Location',
          address: '123 Test St, Test City, TC 12345'
        }
      }
    };
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Clear firebase content service mocks
    (firebaseContentService.createContent as any).mockClear();
    (firebaseContentService.getContent as any).mockClear();
    (firebaseContentService.updateContent as any).mockClear();
    (firebaseContentService.deleteContent as any).mockClear();
    (firebaseContentService.getContentList as any).mockClear();

    // Set up global Firebase mocks to use our specific mock functions
    const firestoreModule = await import('firebase/firestore');
    vi.mocked(firestoreModule.collection).mockImplementation(vi.fn());
    vi.mocked(firestoreModule.doc).mockImplementation(vi.fn());
    vi.mocked(firestoreModule.getDoc).mockImplementation(vi.fn());
    vi.mocked(firestoreModule.updateDoc).mockImplementation(vi.fn());
    vi.mocked(firestoreModule.deleteDoc).mockImplementation(vi.fn());
    vi.mocked(firestoreModule.query).mockImplementation(vi.fn());
    vi.mocked(firestoreModule.where).mockImplementation(vi.fn());
    vi.mocked(firestoreModule.orderBy).mockImplementation(vi.fn());
    vi.mocked(firestoreModule.getDocs).mockImplementation(vi.fn());
    vi.mocked(firestoreModule.addDoc).mockImplementation(vi.fn());
    vi.mocked(firestoreModule.setDoc).mockImplementation(vi.fn());
    vi.mocked(firestoreModule.onSnapshot).mockImplementation(vi.fn());
    vi.mocked(firestoreModule.limit).mockImplementation(vi.fn());

    // Set up default successful auth state
    (firebaseAuthService.getCurrentUser as any).mockReturnValue({
      uid: 'test-user-123',
      displayName: 'Test User',
      email: 'test@example.com'
    });
  });  describe('Firebase Resilience & Error Recovery - CRITICAL RELIABILITY', () => {
    it('should retry transient Firebase failures', async () => {
      const submissionData = createTestContentDoc({
        title: 'Test Resilience',
        description: 'Testing Firebase retry logic',
        tags: ['content-type:article', 'category:test', 'priority:low']
      });

      // Mock transient failures followed by success
      (firebaseContentService.createContent as any)
        .mockRejectedValueOnce(new Error('UNAVAILABLE: The service is currently unavailable'))
        .mockRejectedValueOnce(new Error('DEADLINE_EXCEEDED: Deadline exceeded'))
        .mockResolvedValueOnce('retry-success-123');

      // Should retry and eventually succeed
      const result = await contentSubmissionService.createContent(
        submissionData.title,
        submissionData.description,
        'article',
        submissionData.features,
        submissionData.tags
      );
      expect(result).toBe('retry-success-123');
      expect(firebaseContentService.createContent).toHaveBeenCalledTimes(3);
    });

    it('should handle Firestore quota limit errors', async () => {
      const submissionData = createTestContentDoc({
        title: 'Quota Test',
        description: 'Testing quota limit handling',
        tags: ['content-type:article', 'category:test', 'priority:low']
      });

      // Mock quota exceeded error
      const quotaError = new Error('RESOURCE_EXHAUSTED: Quota exceeded');
      (firebaseContentService.createContent as any).mockRejectedValue(quotaError);

      // Should handle gracefully with appropriate error message
      await expect(
        contentSubmissionService.createContent(
          submissionData.title,
          submissionData.description,
          'article',
          submissionData.features,
          submissionData.tags
        )
      ).rejects.toThrow(/quota.*exceeded|rate.*limit|resource.*exhausted/i);
    });

    it('should handle network connectivity issues', async () => {
      const submissionData = createTestContentDoc({
        title: 'Network Test Event',
        description: 'Testing network failure handling',
        tags: ['content-type:event', 'category:test', 'priority:medium']
      });

      // Mock network failures
      const networkErrors = [
        new Error('UNAVAILABLE: Network error'),
        new Error('Failed to fetch'),
        new Error('ERR_NETWORK'),
        new Error('Connection timeout')
      ];

      for (const error of networkErrors) {
        vi.clearAllMocks();
        (firebaseContentService.createContent as any).mockRejectedValue(error);

        await expect(
          contentSubmissionService.createContent(
            submissionData.title,
            submissionData.description,
            submissionData.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
            submissionData.features,
            submissionData.tags
          )
        ).rejects.toThrow();

        // Should attempt offline storage or queue for later
        // This test documents that we need offline capabilities
      }
    });

    it('should handle Firebase permission changes mid-operation', async () => {
      const submissionData = createTestContentDoc({
        title: 'Permission Change Test',
        description: 'Testing permission change during operation',
        tags: ['content-type:article', 'category:test', 'priority:low']
      });

      // Mock permission denied error after initial success
      const permissionError = new Error('PERMISSION_DENIED: Missing or insufficient permissions');
      (firebaseContentService.createContent as any).mockRejectedValue(permissionError);

      // Should handle permission changes gracefully
      await expect(
        contentSubmissionService.createContent(
        submissionData.title,
        submissionData.description,
        submissionData.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        submissionData.features,
        submissionData.tags
      )
      ).rejects.toThrow(/permission.*denied|insufficient.*permissions|unauthorized/i);
    });

    it('should validate Firestore collection existence', async () => {
      const submissionData = createTestContentDoc({
        title: 'Collection Test',
        description: 'Testing collection validation',
        tags: ['content-type:article', 'category:test', 'priority:low']
      };

      // Mock collection not found error
      const collectionError = new Error('NOT_FOUND: Collection "userContent" not found');
      (firebaseContentService.createContent as any).mockRejectedValue(collectionError);

      // Should handle missing collections gracefully
      await expect(
        contentSubmissionService.createContent(
        submissionData.title,
        submissionData.description,
        submissionData.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        submissionData.features,
        submissionData.tags
      )
      ).rejects.toThrow(/collection.*not.*found|not.*found/i);
    });
  });

  describe('Calendar Integration Robustness - EVENT HANDLING CRITICAL', () => {
    it('should validate event date ranges', async () => {
      const invalidDateRangeData = createTestContentDoc({
        type: 'event',
        title: 'Invalid Date Range Event',
        content: 'Testing date range validation',
        category: 'test',
        priority: 'medium',
        attachments: [],
        onCalendar: true,
        eventDate: '2024-08-20',
        eventEndDate: '2024-08-19', // End before start!
        eventTime: '14:00',
        eventEndTime: '13:00', // End time before start time!
        metadata: {}
      };

      // Should validate that end dates/times are after start dates/times
      await expect(
        contentSubmissionService.createContent(
        invalidDateRangeData.title,
        invalidDateRangeData.description,
        invalidDateRangeData.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        invalidDateRangeData.features,
        invalidDateRangeData.tags
      )
      ).rejects.toThrow(/invalid.*date.*range|end.*before.*start|invalid.*time.*range/i);
    });

    it('should handle timezone conversion correctly', async () => {
      const timezoneEventData = createTestContentDoc({
        type: 'event',
        title: 'Timezone Test Event',
        content: 'Testing timezone handling',
        category: 'test',
        priority: 'medium',
        attachments: [],
        onCalendar: true,
        eventDate: '2024-08-20',
        eventTime: '14:00',
        eventLocation: 'Community Center',
        metadata: {
          timezone: 'America/New_York',
          originalSubmissionTimezone: 'UTC'
        }
      };

      (firebaseContentService.createContent as any).mockResolvedValue('timezone-event-123');

      const result = await contentSubmissionService.createContent(
        timezoneEventData.title,
        timezoneEventData.description,
        timezoneEventData.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        timezoneEventData.features,
        timezoneEventData.tags
      );
      expect(result).toBe('timezone-event-123');

      // Verify timezone information is preserved for calendar integration
      const submittedData = (firebaseContentService.createContent as any).mock.calls[0][0];
      expect(submittedData.metadata.timezone).toBe('America/New_York');
      expect(submittedData.metadata.originalSubmissionTimezone).toBe('UTC');
    });

    it('should validate recurring event configurations', async () => {
      const invalidRecurrenceData = createTestContentDoc({
        type: 'event',
        title: 'Invalid Recurrence Event',
        content: 'Testing recurrence validation',
        category: 'test',
        priority: 'medium',
        attachments: [],
        onCalendar: true,
        eventDate: '2024-08-20',
        eventTime: '14:00',
        eventRecurrence: {
          type: 'weekly',
          interval: 0, // Invalid: interval must be >= 1
          endDate: '2024-08-19', // Invalid: end date before start date
          daysOfWeek: [8, 9] // Invalid: days 8-9 don't exist
        },
        metadata: {}
      };

      // Should validate recurrence configuration
      await expect(
        contentSubmissionService.createContent(
        invalidRecurrenceData.title,
        invalidRecurrenceData.description,
        invalidRecurrenceData.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        invalidRecurrenceData.features,
        invalidRecurrenceData.tags
      )
      ).rejects.toThrow(/invalid.*recurrence|invalid.*interval|invalid.*days|invalid.*end.*date/i);
    });

    it('should prevent calendar event conflicts', async () => {
      const conflictingEventData = createTestContentDoc({
        type: 'event',
        title: 'Conflicting Event',
        content: 'Event that conflicts with existing event',
        category: 'test',
        priority: 'high',
        attachments: [],
        onCalendar: true,
        eventDate: '2024-08-20',
        eventTime: '14:00',
        eventEndTime: '16:00',
        eventLocation: 'Community Center - Main Hall',
        metadata: {}
      };

      // Mock existing event conflict
      const conflictError = new Error('CONFLICT: Event conflicts with existing booking');
      (firebaseContentService.createContent as any).mockRejectedValue(conflictError);

      // Should handle calendar conflicts appropriately
      await expect(
        contentSubmissionService.createContent(
        conflictingEventData.title,
        conflictingEventData.description,
        conflictingEventData.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        conflictingEventData.features,
        conflictingEventData.tags
      )
      ).rejects.toThrow(/conflict|already.*booked|time.*unavailable/i);
    });

    it('should handle all-day event edge cases', async () => {
      const allDayEventData = createTestContentDoc({
        type: 'event',
        title: 'All Day Event',
        content: 'Testing all-day event handling',
        category: 'community',
        priority: 'medium',
        attachments: [],
        onCalendar: true,
        eventDate: '2024-08-20',
        allDay: true,
        // These should be ignored for all-day events
        eventTime: '14:00',
        eventEndTime: '16:00',
        metadata: {}
      };

      (firebaseContentService.createContent as any).mockResolvedValue('allday-event-123');

      const result = await contentSubmissionService.createContent(
        allDayEventData.title,
        allDayEventData.description,
        allDayEventData.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        allDayEventData.features,
        allDayEventData.tags
      );
      expect(result).toBe('allday-event-123');

      const submittedData = (firebaseContentService.createContent as any).mock.calls[0][0];

      // For all-day events, specific times should be cleared or ignored
      expect(submittedData.allDay).toBe(true);
      // Time fields should either be undefined or set to default all-day values
      expect(
        submittedData.eventTime === undefined ||
        submittedData.eventTime === '00:00' ||
        submittedData.eventTime === null
      ).toBe(true);
    });
  });

  describe('Data Consistency & Transaction Handling - CRITICAL DATA INTEGRITY', () => {
    it('should handle concurrent submissions without data corruption', async () => {
      const concurrentSubmissions = Array.from({ length: 5 }, (_, i) => ({
        type: 'article' as const,
        title: `Concurrent Article ${i + 1}`,
        content: `Content for article ${i + 1}`,
        category: 'test',
        priority: 'low' as const,
        attachments: [],
        metadata: { submissionIndex: i + 1 }
      }));

      // Mock successful submissions with unique IDs
      (firebaseContentService.createContent as any).mockImplementation(
        (data: any) => Promise.resolve(`concurrent-${data.metadata.submissionIndex}`)
      );

      // Submit all concurrently
      const results = await Promise.all(
        concurrentSubmissions.map(data => contentSubmissionService.createContent(
        data.title,
        data.description,
        data.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        data.features,
        data.tags
      ))
      );

      // All should succeed with unique IDs
      expect(results).toEqual(['concurrent-1', 'concurrent-2', 'concurrent-3', 'concurrent-4', 'concurrent-5']);
      expect(firebaseContentService.createContent).toHaveBeenCalledTimes(5);

      // Verify data integrity - each submission should maintain its unique metadata
      const submissions = (firebaseContentService.createContent as any).mock.calls;
      submissions.forEach((call: any[], index: number) => {
        const submittedData = call[0];
        expect(submittedData.metadata.submissionIndex).toBe(index + 1);
        expect(submittedData.title).toBe(`Concurrent Article ${index + 1}`);
      });
    });

    it('should handle partial submission failures gracefully', async () => {
      const submissionData = createTestContentDoc({
        type: 'event',
        title: 'Partial Failure Test',
        content: 'Testing partial failure handling',
        category: 'test',
        priority: 'medium',
        attachments: [
          {
            id: 'attachment-1',
            type: 'firebase_image',
            filename: 'test-image.jpg',
            firebaseUrl: 'https://firebase.com/test-image.jpg',
            isUserHosted: false
          }
        ],
        onCalendar: true,
        eventDate: '2024-08-20',
        metadata: {}
      };

      // Mock partial failure - content saves but attachment upload fails
      const partialError = new Error('ATTACHMENT_UPLOAD_FAILED: Could not upload attachment-1');
      (firebaseContentService.createContent as any).mockRejectedValue(partialError);

      // Should handle partial failures and provide recovery options
      await expect(
        contentSubmissionService.createContent(
        submissionData.title,
        submissionData.description,
        submissionData.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        submissionData.features,
        submissionData.tags
      )
      ).rejects.toThrow(/attachment.*upload.*failed|partial.*failure/i);

      // Should provide information about what succeeded and what failed
      // This test documents need for better error handling with recovery options
    });

    it('should maintain referential integrity between related data', async () => {
      const eventWithReferencesData = createTestContentDoc({
        type: 'event',
        title: 'Event with References',
        content: 'Event that references other content',
        category: 'community',
        priority: 'high',
        attachments: [],
        onCalendar: true,
        eventDate: '2024-08-20',
        metadata: {
          relatedNewsletterIssue: 'newsletter-2024-08',
          relatedAnnouncements: ['announcement-1', 'announcement-2'],
          parentEvent: 'annual-picnic-2024'
        }
      };

      (firebaseContentService.createContent as any).mockResolvedValue('referenced-event-123');

      const result = await contentSubmissionService.createContent(
        eventWithReferencesData.title,
        eventWithReferencesData.description,
        eventWithReferencesData.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        eventWithReferencesData.features,
        eventWithReferencesData.tags
      );
      expect(result).toBe('referenced-event-123');

      const submittedData = (firebaseContentService.createContent as any).mock.calls[0][0];

      // Verify all references are preserved
      expect(submittedData.metadata.relatedNewsletterIssue).toBe('newsletter-2024-08');
      expect(submittedData.metadata.relatedAnnouncements).toEqual(['announcement-1', 'announcement-2']);
      expect(submittedData.metadata.parentEvent).toBe('annual-picnic-2024');
    });

    it('should handle database transaction rollbacks', async () => {
      const submissionData = createTestContentDoc({
        title: 'Transaction Test',
        description: 'Testing transaction rollback handling',
        tags: ['content-type:article', 'category:test', 'priority:low']
      };

      // Mock transaction failure
      const transactionError = new Error('ABORTED: Transaction was aborted');
      (firebaseContentService.createContent as any).mockRejectedValue(transactionError);

      // Should handle transaction failures gracefully
      await expect(
        contentSubmissionService.createContent(
        submissionData.title,
        submissionData.description,
        submissionData.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        submissionData.features,
        submissionData.tags
      )
      ).rejects.toThrow(/transaction.*aborted|aborted|rollback/i);
    });
  });

  describe('Performance & Resource Management - SCALABILITY CRITICAL', () => {
    it('should handle large batch operations efficiently', async () => {
      const largeSubmissionData = createTestContentDoc({
        type: 'article',
        title: 'Large Batch Test',
        content: 'A'.repeat(50000), // 50KB content
        category: 'test',
        priority: 'low',
        attachments: Array.from({ length: 10 }, (_, i) => ({
          id: `attachment-${i}`,
          type: 'firebase_image' as const,
          filename: `image-${i}.jpg`,
          firebaseUrl: `https://firebase.com/image-${i}.jpg`,
          isUserHosted: false
        })),
        metadata: {
          tags: Array.from({ length: 50 }, (_, i) => `tag-${i}`),
          categories: Array.from({ length: 20 }, (_, i) => `category-${i}`)
        }
      };

      (firebaseContentService.createContent as any).mockResolvedValue('large-batch-123');

      const startTime = Date.now();
      const result = await contentSubmissionService.createContent(
        largeSubmissionData.title,
        largeSubmissionData.description,
        largeSubmissionData.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        largeSubmissionData.features,
        largeSubmissionData.tags
      );
      const endTime = Date.now();

      expect(result).toBe('large-batch-123');

      // Should complete within reasonable time (5 seconds for large content)
      expect(endTime - startTime).toBeLessThan(5000);

      const submittedData = (firebaseContentService.createContent as any).mock.calls[0][0];
      expect(submittedData.content).toHaveLength(50000);
      expect(submittedData.attachments).toHaveLength(10);
      expect(submittedData.metadata.tags).toHaveLength(50);
    });

    it('should handle memory pressure during large submissions', async () => {
      const memoryIntensiveData = createTestContentDoc({
        type: 'article',
        title: 'Memory Pressure Test',
        content: 'Testing memory management',
        category: 'performance',
        priority: 'low',
        attachments: [],
        metadata: {
          // Simulate large nested object that could cause memory pressure
          largeDataStructure: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            data: Array.from({ length: 100 }, (_, j) => `data-${i}-${j}`),
            nestedObject: {
              level1: Array.from({ length: 50 }, (_, k) => ({ key: k, value: `value-${k}` }))
            }
          }))
        }
      };

      (firebaseContentService.createContent as any).mockResolvedValue('memory-test-123');

      // Should handle large data structures without memory errors
      const result = await contentSubmissionService.createContent(
        memoryIntensiveData.title,
        memoryIntensiveData.description,
        memoryIntensiveData.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        memoryIntensiveData.features,
        memoryIntensiveData.tags
      );
      expect(result).toBe('memory-test-123');

      // Verify data structure integrity is maintained
      const submittedData = (firebaseContentService.createContent as any).mock.calls[0][0];
      expect(submittedData.metadata.largeDataStructure).toHaveLength(1000);
      expect(submittedData.metadata.largeDataStructure[0].data).toHaveLength(100);
    });

    it('should implement proper connection pooling and cleanup', async () => {
      // This test documents the need for proper connection management
      const multipleSubmissions = Array.from({ length: 20 }, (_, i) => ({
        type: 'article' as const,
        title: `Connection Pool Test ${i}`,
        content: `Testing connection management ${i}`,
        category: 'performance',
        priority: 'low' as const,
        attachments: [],
        metadata: { testIndex: i }
      }));

      (firebaseContentService.createContent as any).mockImplementation(
        (data: any) => Promise.resolve(`pool-test-${data.metadata.testIndex}`)
      );

      // Submit multiple requests that should reuse connections
      const results = await Promise.all(
        multipleSubmissions.map(data => contentSubmissionService.createContent(
        data.title,
        data.description,
        data.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1] || 'article',
        data.features,
        data.tags
      ))
      );

      expect(results).toHaveLength(20);
      expect(firebaseContentService.createContent).toHaveBeenCalledTimes(20);

      // This test documents that we need to verify proper connection cleanup
      // In a real implementation, we'd check connection pool metrics
    });
  });
});
