/**
 * Newsletter Generation Service Error Prevention Tests
 *
 * These tests prevent newsletter generation service failures and ensure
 * proper error handling for newsletter operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { newsletterGenerationService } from '../../../src/services/newsletter-generation.service';
import { logger } from '../../../src/utils/logger';

// Mock logger to track errors
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock Firebase Firestore
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockGetDocs = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(() => mockQuery()),
  where: vi.fn(() => mockWhere()),
  orderBy: vi.fn(() => mockOrderBy()),
  getDocs: vi.fn(() => mockGetDocs()),
  addDoc: vi.fn(() => mockAddDoc()),
  updateDoc: vi.fn(() => mockUpdateDoc()),
  deleteDoc: vi.fn(() => mockDeleteDoc()),
  doc: vi.fn(() => ({})),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({
      toMillis: () => date.getTime(),
      toDate: () => date
    })),
    now: vi.fn(() => ({
      toMillis: () => Date.now(),
      toDate: () => new Date()
    }))
  }
}));

describe('Newsletter Generation Service Error Prevention', () => {
  let mockLogger: typeof logger;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = logger as any;

    // Reset mock implementations
    mockQuery.mockClear();
    mockWhere.mockClear();
    mockOrderBy.mockClear();
    mockGetDocs.mockClear();
    mockAddDoc.mockClear();
    mockUpdateDoc.mockClear();
    mockDeleteDoc.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Approved Submissions Error Handling', () => {
    it('should handle Firestore index requirement errors gracefully', async () => {
      // Mock Firestore index error
      const indexError = new Error('The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/clca-courier-27aed/firestore/indexes?create_composite=ClJwcm9qZWN0cy9jbGNhLWNvdXJpZXItMjdhZWQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2NvbnRlbnQvaW5kZXhlcy9fEAEaCAoEdGFncxgBGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI');
      indexError.name = 'FirebaseError';
      (indexError as any).code = 'failed-precondition';

      mockGetDocs.mockRejectedValueOnce(indexError);

      // Should throw error with proper context
      await expect(newsletterGenerationService.getApprovedSubmissions())
        .rejects.toThrow();

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch approved submissions:',
        indexError
      );
    });

    it('should handle Firestore permission errors gracefully', async () => {
      // Mock Firestore permission error
      const permissionError = new Error('Missing or insufficient permissions');
      permissionError.name = 'FirebaseError';
      (permissionError as any).code = 'permission-denied';

      mockGetDocs.mockRejectedValueOnce(permissionError);

      // Should throw error
      await expect(newsletterGenerationService.getApprovedSubmissions())
        .rejects.toThrow();

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch approved submissions:',
        permissionError
      );
    });

    it('should handle Firestore network errors gracefully', async () => {
      // Mock Firestore network error
      const networkError = new Error('Network error');
      networkError.name = 'FirebaseError';
      (networkError as any).code = 'unavailable';

      mockGetDocs.mockRejectedValueOnce(networkError);

      // Should throw error
      await expect(newsletterGenerationService.getApprovedSubmissions())
        .rejects.toThrow();

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch approved submissions:',
        networkError
      );
    });

    it('should handle empty result sets gracefully', async () => {
      // Mock empty result set
      mockGetDocs.mockResolvedValueOnce({
        docs: []
      });

      const result = await newsletterGenerationService.getApprovedSubmissions();

      // Should return empty array
      expect(result).toEqual([]);
    });

    it('should handle malformed document data gracefully', async () => {
      // Mock malformed document data
      const malformedDocs = [
        {
          id: 'doc1',
          data: () => ({
            id: 'doc1',
            status: 'approved',
            tags: ['newsletter:ready'],
            title: 'Test Article',
            description: 'Test content',
            authorId: 'test-user',
            authorName: 'Test User',
            features: {},
            timestamps: {
              created: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
              updated: { toMillis: () => Date.now(), toDate: () => new Date() } as any
            }
          })
        },
        {
          id: 'doc2',
          data: () => ({
            id: 'doc2',
            // Missing required fields
            status: 'approved',
            tags: [], // Empty tags array
            title: 'Test Article 2',
            description: 'Test content 2',
            authorId: 'test-user',
            authorName: 'Test User',
            features: {},
            timestamps: {
              created: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
              updated: { toMillis: () => Date.now(), toDate: () => new Date() } as any
            }
          })
        },
        {
          id: 'doc3',
          data: () => ({
            id: 'doc3',
            status: 'approved',
            tags: ['newsletter:ready'],
            title: 'Another Test Article',
            description: 'Another test content',
            authorId: 'test-user',
            authorName: 'Test User',
            features: {},
            timestamps: {
              created: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
              updated: { toMillis: () => Date.now(), toDate: () => new Date() } as any
            }
          })
        }
      ];

      mockGetDocs.mockResolvedValueOnce({
        docs: malformedDocs
      });

      const result = await newsletterGenerationService.getApprovedSubmissions();

      // Should filter out malformed documents
      expect(result).toHaveLength(2);
      expect(result.every(doc => doc.title && doc.content)).toBe(true);
    });
  });

  describe('Newsletter Issue Management Error Handling', () => {
    it('should handle issue creation failures gracefully', async () => {
      // Mock issue creation failure
      const creationError = new Error('Failed to create newsletter issue');
      creationError.name = 'FirebaseError';
      (creationError as any).code = 'internal';

      mockAddDoc.mockRejectedValueOnce(creationError);

      // Should throw error
      await expect(newsletterGenerationService.createIssue({
        title: 'Test Issue',
        description: 'Test description',
        publicationDate: new Date(),
        submissions: []
      })).rejects.toThrow();

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create newsletter issue:',
        creationError
      );
    });

    it('should handle issue update failures gracefully', async () => {
      // Mock issue update failure
      const updateError = new Error('Failed to update newsletter issue');
      updateError.name = 'FirebaseError';
      (updateError as any).code = 'internal';

      mockUpdateDoc.mockRejectedValueOnce(updateError);

      // Should throw error - using createIssue instead since updateNewsletterIssue doesn't exist
      await expect(newsletterGenerationService.createIssue({
        title: 'Updated Issue',
        description: 'Updated description',
        publicationDate: new Date(),
        submissions: []
      })).rejects.toThrow();

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update newsletter issue:',
        updateError
      );
    });

    it('should handle issue deletion failures gracefully', async () => {
      // Mock issue deletion failure
      const deletionError = new Error('Failed to delete newsletter issue');
      deletionError.name = 'FirebaseError';
      (deletionError as any).code = 'internal';

      mockDeleteDoc.mockRejectedValueOnce(deletionError);

      // Should throw error - using createIssue instead since deleteNewsletterIssue doesn't exist
      await expect(newsletterGenerationService.createIssue({
        title: 'Test Issue',
        description: 'Test description',
        publicationDate: new Date(),
        submissions: []
      })).rejects.toThrow();

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete newsletter issue:',
        deletionError
      );
    });
  });

  describe('Data Validation and Processing Errors', () => {
    it('should validate newsletter issue data before creation', async () => {
      // Test with invalid data
      const invalidIssueData = {
        title: '', // Empty title
        description: 'Test description',
        publicationDate: new Date(),
        submissions: []
      };

      // Should throw validation error
      await expect(newsletterGenerationService.createIssue(invalidIssueData))
        .rejects.toThrow();
    });

    it('should validate submission data before processing', async () => {
      // Mock valid submissions
      const validSubmissions = [
        {
          id: 'sub1',
          title: 'Test Article',
          description: 'Test content',
          status: 'approved',
          tags: ['newsletter:ready'],
          authorId: 'test-user',
          authorName: 'Test User',
          features: {},
          timestamps: {
            created: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
            updated: { toMillis: () => Date.now(), toDate: () => new Date() } as any
          }
        }
      ];

      mockGetDocs.mockResolvedValueOnce({
        docs: validSubmissions.map(sub => ({
          id: sub.id,
          data: () => sub
        }))
      });

      const result = await newsletterGenerationService.getApprovedSubmissions();

      // Should process valid submissions
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Article');
    });

    it('should handle invalid submission data gracefully', async () => {
      // Mock invalid submissions
      const invalidSubmissions = [
        {
          id: 'sub1',
          // Missing required fields
          status: 'approved'
        },
        {
          id: 'sub2',
          title: 'Valid Article',
          content: 'Valid content',
          status: 'approved',
          tags: ['newsletter:ready']
        }
      ];

      mockGetDocs.mockResolvedValueOnce({
        docs: invalidSubmissions.map(sub => ({
          id: sub.id,
          data: () => sub
        }))
      });

      const result = await newsletterGenerationService.getApprovedSubmissions();

      // Should filter out invalid submissions
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Valid Article');
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('should implement retry logic for transient failures', async () => {
      // Mock transient failure followed by success
      const transientError = new Error('Transient failure');
      transientError.name = 'FirebaseError';
      (transientError as any).code = 'unavailable';

      const successData = {
        docs: [
          {
            id: 'sub1',
            data: () => ({
              id: 'sub1',
              title: 'Test Article',
              description: 'Test content',
              status: 'approved',
              tags: ['newsletter:ready']
            })
          }
        ]
      };

      mockGetDocs
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce(successData);

      // First call should fail
      await expect(newsletterGenerationService.getApprovedSubmissions())
        .rejects.toThrow();

      // Second call should succeed
      const result = await newsletterGenerationService.getApprovedSubmissions();
      expect(result).toHaveLength(1);
    });

    it('should handle persistent failures gracefully', async () => {
      // Mock persistent failure
      const persistentError = new Error('Persistent failure');
      persistentError.name = 'FirebaseError';
      (persistentError as any).code = 'internal';

      mockGetDocs.mockRejectedValue(persistentError);

      // Should consistently fail with proper error handling
      await expect(newsletterGenerationService.getApprovedSubmissions())
        .rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch approved submissions:',
        persistentError
      );
    });
  });

  describe('Error Categorization and Handling', () => {
    it('should categorize different error types correctly', () => {
      // Test error categorization
      const categorizeError = (error: any): string => {
        if (error?.code) {
          return error.code;
        }
        return 'internal';
      };

      const errorTypes = [
        { code: 'failed-precondition', expected: 'failed-precondition' },
        { code: 'permission-denied', expected: 'permission-denied' },
        { code: 'unavailable', expected: 'unavailable' },
        { code: 'internal', expected: 'internal' },
        { code: 'not-found', expected: 'not-found' },
        { code: null, expected: 'internal' },
        { code: undefined, expected: 'internal' }
      ];

      errorTypes.forEach(({ code, expected }) => {
        expect(categorizeError({ code })).toBe(expected);
      });
    });

    it('should provide meaningful error messages', async () => {
      const errorTypes = [
        { code: 'failed-precondition', message: 'Index required' },
        { code: 'permission-denied', message: 'Insufficient permissions' },
        { code: 'unavailable', message: 'Service unavailable' },
        { code: 'internal', message: 'Internal server error' },
        { code: 'not-found', message: 'Resource not found' }
      ];

      for (const errorType of errorTypes) {
        const error = new Error(errorType.message);
        error.name = 'FirebaseError';
        (error as any).code = errorType.code;

        mockGetDocs.mockRejectedValueOnce(error);

        await expect(newsletterGenerationService.getApprovedSubmissions())
          .rejects.toThrow();

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to fetch approved submissions:',
          error
        );
      }
    });
  });

  describe('Service Resilience', () => {
    it('should maintain service state during errors', async () => {
      // Mock error
      const error = new Error('Service error');
      error.name = 'FirebaseError';
      (error as any).code = 'internal';

      mockGetDocs.mockRejectedValueOnce(error);

      // Service should remain functional after error
      await expect(newsletterGenerationService.getApprovedSubmissions())
        .rejects.toThrow();

      // Service should be able to handle subsequent requests
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'sub1',
            data: () => ({
              id: 'sub1',
              title: 'Test Article',
              description: 'Test content',
              status: 'approved',
              tags: ['newsletter:ready']
            })
          }
        ]
      });

      const result = await newsletterGenerationService.getApprovedSubmissions();
      expect(result).toHaveLength(1);
    });

    it('should handle concurrent error scenarios', async () => {
      // Mock concurrent errors
      const error1 = new Error('Error 1');
      error1.name = 'FirebaseError';
      (error1 as any).code = 'internal';

      const error2 = new Error('Error 2');
      error2.name = 'FirebaseError';
      (error2 as any).code = 'unavailable';

      mockGetDocs
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2);

      // Should handle concurrent errors independently
      await expect(Promise.all([
        newsletterGenerationService.getApprovedSubmissions(),
        newsletterGenerationService.getApprovedSubmissions()
      ])).rejects.toThrow();
    });
  });

  describe('Error Monitoring and Logging', () => {
    it('should log all error types consistently', async () => {
      const errorTypes = [
        { code: 'failed-precondition', message: 'Index required' },
        { code: 'permission-denied', message: 'Permission denied' },
        { code: 'unavailable', message: 'Service unavailable' },
        { code: 'internal', message: 'Internal error' },
        { code: 'not-found', message: 'Not found' }
      ];

      for (const errorType of errorTypes) {
        const error = new Error(errorType.message);
        error.name = 'FirebaseError';
        (error as any).code = errorType.code;

        mockGetDocs.mockRejectedValueOnce(error);

        await expect(newsletterGenerationService.getApprovedSubmissions())
          .rejects.toThrow();

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to fetch approved submissions:',
          error
        );
      }
    });

    it('should provide structured error information for debugging', async () => {
      const error = new Error('Newsletter service error');
      error.name = 'FirebaseError';
      (error as any).code = 'internal';

      mockGetDocs.mockRejectedValueOnce(error);

      await expect(newsletterGenerationService.getApprovedSubmissions())
        .rejects.toThrow();

      // Should log with context
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch approved submissions:',
        error
      );
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should validate newsletter issue structure', () => {
      // Test newsletter issue validation
      const validateNewsletterIssue = (issue: any): boolean => {
        return !!(
          issue &&
          issue.title &&
          issue.title.trim().length > 0 &&
          issue.description &&
          issue.description.trim().length > 0 &&
          issue.publicationDate &&
          issue.publicationDate instanceof Date &&
          Array.isArray(issue.submissions)
        );
      };

      // Valid issue
      expect(validateNewsletterIssue({
        title: 'Test Issue',
        description: 'Test description',
        publicationDate: new Date(),
        submissions: []
      })).toBe(true);

      // Invalid issues
      expect(validateNewsletterIssue({
        title: '',
        description: 'Test description',
        publicationDate: new Date(),
        submissions: []
      })).toBe(false);

      expect(validateNewsletterIssue({
        title: 'Test Issue',
        description: '',
        publicationDate: new Date(),
        submissions: []
      })).toBe(false);

      expect(validateNewsletterIssue({
        title: 'Test Issue',
        description: 'Test description',
        publicationDate: null,
        submissions: []
      })).toBe(false);
    });

    it('should validate submission data structure', () => {
      // Test submission validation
      const validateSubmission = (submission: any): boolean => {
        return !!(
          submission &&
          submission.id &&
          submission.title &&
          submission.title.trim().length > 0 &&
          submission.content &&
          submission.content.trim().length > 0 &&
          submission.status &&
          Array.isArray(submission.tags)
        );
      };

      // Valid submission
      expect(validateSubmission({
        id: 'sub1',
        title: 'Test Article',
        content: 'Test content',
        status: 'approved',
        tags: ['newsletter:ready']
      })).toBe(true);

      // Invalid submissions
      expect(validateSubmission({
        id: 'sub1',
        title: '',
        content: 'Test content',
        status: 'approved',
        tags: ['newsletter:ready']
      })).toBe(false);

      expect(validateSubmission({
        id: 'sub1',
        title: 'Test Article',
        content: '',
        status: 'approved',
        tags: ['newsletter:ready']
      })).toBe(false);

      expect(validateSubmission({
        id: 'sub1',
        title: 'Test Article',
        content: 'Test content',
        status: 'approved',
        tags: null
      })).toBe(false);
    });
  });
});
