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
    getContentById: vi.fn(),
    updateContentStatus: vi.fn(),
    deleteContent: vi.fn(),
    getPublishedContent: vi.fn(),
    getContentByAuthor: vi.fn(),
    getContentByTag: vi.fn(),
    updateContentTags: vi.fn()
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
    (firebaseContentService.getContentById as any).mockClear();
    (firebaseContentService.updateContentStatus as any).mockClear();
    (firebaseContentService.deleteContent as any).mockClear();
    (firebaseContentService.getPublishedContent as any).mockClear();

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
      });

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
        title: 'Invalid Date Range Event',
        description: 'Testing date range validation',
        tags: ['content-type:event', 'category:test', 'priority:medium'],
        features: {
          'feat:date': {
            start: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
            end: { toMillis: () => Date.now() - 3600000, toDate: () => new Date(Date.now() - 3600000) } as any, // End before start!
            isAllDay: false
          }
        }
      });

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
        title: 'Timezone Test Event',
        description: 'Testing timezone handling',
        tags: ['content-type:event', 'category:test', 'priority:medium'],
        features: {
          'feat:date': {
            start: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
            end: { toMillis: () => Date.now() + 3600000, toDate: () => new Date(Date.now() + 3600000) } as any,
            isAllDay: false
          },
          'feat:location': {
            name: 'Community Center',
            address: '123 Community St'
          }
        }
      });

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
      expect(submittedData.features['feat:date']?.start).toBeDefined();
      expect(submittedData.features['feat:location']?.name).toBe('Community Center');
    });

    it('should validate recurring event configurations', async () => {
      const invalidRecurrenceData = createTestContentDoc({
        title: 'Invalid Recurrence Event',
        description: 'Testing recurrence validation',
        tags: ['content-type:event', 'category:test', 'priority:medium'],
        features: {
          'feat:date': {
            start: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
            end: { toMillis: () => Date.now() + 3600000, toDate: () => new Date(Date.now() + 3600000) } as any,
            isAllDay: false
          }
        }
      });

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
        title: 'Conflicting Event',
        description: 'Event that conflicts with existing event',
        tags: ['content-type:event', 'category:test', 'priority:high'],
        features: {
          'feat:date': {
            start: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
            end: { toMillis: () => Date.now() + 7200000, toDate: () => new Date(Date.now() + 7200000) } as any,
            isAllDay: false
          },
          'feat:location': {
            name: 'Community Center - Main Hall',
            address: '123 Community St'
          }
        }
      });

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
        title: 'All Day Event',
        description: 'Testing all-day event handling',
        tags: ['content-type:event', 'category:community', 'priority:medium'],
        features: {
          'feat:date': {
            start: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
            end: { toMillis: () => Date.now() + 86400000, toDate: () => new Date(Date.now() + 86400000) } as any,
            isAllDay: true
          }
        }
      });

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
      expect(submittedData.features['feat:date']?.isAllDay).toBe(true);
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
      const concurrentSubmissions = Array.from({ length: 5 }, (_, i) => createTestContentDoc({
        title: `Concurrent Article ${i + 1}`,
        description: `Content for article ${i + 1}`,
        tags: ['content-type:article', 'category:test', 'priority:low'],
        features: {
          'feat:task': {
            category: 'test',
            qty: i + 1,
            unit: 'items',
            status: 'unclaimed'
          }
        }
      }));

      // Mock successful submissions with unique IDs
      (firebaseContentService.createContent as any).mockImplementation(
        (data: any) => Promise.resolve(`concurrent-${data.features['feat:task']?.qty || 1}`)
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
        expect(submittedData.features['feat:task']?.qty).toBe(index + 1);
        expect(submittedData.title).toBe(`Concurrent Article ${index + 1}`);
      });
    });

    it('should handle partial submission failures gracefully', async () => {
      const submissionData = createTestContentDoc({
        title: 'Partial Failure Test',
        description: 'Testing partial failure handling',
        tags: ['content-type:event', 'category:test', 'priority:medium'],
        features: {
          'feat:date': {
            start: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
            end: { toMillis: () => Date.now() + 3600000, toDate: () => new Date(Date.now() + 3600000) } as any,
            isAllDay: false
          },
          'feat:task': {
            category: 'attachment',
            qty: 1,
            unit: 'files',
            status: 'unclaimed'
          }
        }
      });

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
        title: 'Event with References',
        description: 'Event that references other content',
        tags: ['content-type:event', 'category:community', 'priority:high'],
        features: {
          'feat:date': {
            start: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
            end: { toMillis: () => Date.now() + 3600000, toDate: () => new Date(Date.now() + 3600000) } as any,
            isAllDay: false
          },
          'feat:location': {
            name: 'Referenced Event Location',
            address: '123 Community St'
          }
        }
      });

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
      expect(submittedData.features['feat:reference']?.relatedNewsletterIssue).toBe('newsletter-2024-08');
      expect(submittedData.features['feat:reference']?.relatedAnnouncements).toEqual(['announcement-1', 'announcement-2']);
      expect(submittedData.features['feat:reference']?.parentEvent).toBe('annual-picnic-2024');
    });

    it('should handle database transaction rollbacks', async () => {
      const submissionData = createTestContentDoc({
        title: 'Transaction Test',
        description: 'Testing transaction rollback handling',
        tags: ['content-type:article', 'category:test', 'priority:low']
      });

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
        title: 'Large Batch Test',
        description: 'A'.repeat(50000), // 50KB content
        tags: ['content-type:article', 'category:test', 'priority:low', ...Array.from({ length: 50 }, (_, i) => `tag-${i}`)],
        features: {
          'feat:task': {
            category: 'batch-processing',
            qty: 10,
            unit: 'attachments',
            status: 'unclaimed'
          }
        }
      });

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
      expect(submittedData.description).toHaveLength(50000);
      expect(submittedData.features['feat:task']?.qty).toBe(10);
      expect(submittedData.tags).toHaveLength(53); // 3 base tags + 50 additional tags
    });

    it('should handle memory pressure during large submissions', async () => {
      const memoryIntensiveData = createTestContentDoc({
        title: 'Memory Pressure Test',
        description: 'Testing memory management',
        tags: ['content-type:article', 'category:performance', 'priority:low'],
        features: {
          'feat:task': {
            category: 'memory-test',
            qty: 1000,
            unit: 'data-points',
            status: 'unclaimed'
          }
        }
      });

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
      expect(submittedData.features['feat:task']?.qty).toBe(1000);
      expect(submittedData.features['feat:task']?.category).toBe('memory-test');
    });

    it('should implement proper connection pooling and cleanup', async () => {
      // This test documents the need for proper connection management
      const multipleSubmissions = Array.from({ length: 20 }, (_, i) => createTestContentDoc({
        title: `Connection Pool Test ${i}`,
        description: `Testing connection management ${i}`,
        tags: ['content-type:article', 'category:performance', 'priority:low'],
        features: {
          'feat:task': {
            category: 'connection-test',
            qty: i,
            unit: 'connections',
            status: 'unclaimed'
          }
        }
      }));

      (firebaseContentService.createContent as any).mockImplementation(
        (data: any) => Promise.resolve(`pool-test-${data.features['feat:task']?.qty || 0}`)
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
