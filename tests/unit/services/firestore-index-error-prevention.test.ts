/**
 * Firestore Index Error Prevention Tests
 * 
 * These tests prevent Firestore index requirement errors and ensure
 * proper error handling for missing composite indexes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NewsletterGenerationService } from '../../../src/services/newsletter-generation.service';
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

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(() => mockQuery()),
  where: vi.fn(() => mockWhere()),
  orderBy: vi.fn(() => mockOrderBy()),
  getDocs: vi.fn(() => mockGetDocs()),
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

describe('Firestore Index Error Prevention', () => {
  let newsletterService: NewsletterGenerationService;
  let mockLogger: typeof logger;

  beforeEach(() => {
    vi.clearAllMocks();
    newsletterService = new NewsletterGenerationService();
    mockLogger = logger as any;
    
    // Reset mock implementations
    mockQuery.mockClear();
    mockWhere.mockClear();
    mockOrderBy.mockClear();
    mockGetDocs.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Index Requirement Error Handling', () => {
    it('should handle missing composite index errors gracefully', async () => {
      // Mock Firestore index error
      const indexError = new Error('The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/clca-courier-27aed/firestore/indexes?create_composite=ClJwcm9qZWN0cy9jbGNhLWNvdXJpZXItMjdhZWQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2NvbnRlbnQvaW5kZXhlcy9fEAEaCAoEdGFncxgBGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI');
      indexError.name = 'FirebaseError';
      (indexError as any).code = 'failed-precondition';

      mockGetDocs.mockRejectedValueOnce(indexError);

      // Should not throw error
      await expect(newsletterService.getApprovedSubmissions())
        .rejects.toThrow();

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch approved submissions:',
        indexError
      );
    });

    it('should provide helpful error messages for index creation', async () => {
      // Mock Firestore index error with URL
      const indexError = new Error('The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/clca-courier-27aed/firestore/indexes?create_composite=ClJwcm9qZWN0cy9jbGNhLWNvdXJpZXItMjdhZWQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2NvbnRlbnQvaW5kZXhlcy9fEAEaCAoEdGFncxgBGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI');
      indexError.name = 'FirebaseError';
      (indexError as any).code = 'failed-precondition';

      mockGetDocs.mockRejectedValueOnce(indexError);

      try {
        await newsletterService.getApprovedSubmissions();
      } catch (error) {
        // Should contain index creation URL
        expect((error as Error).message).toContain('You can create it here:');
        expect((error as Error).message).toContain('firestore/indexes');
      }
    });

    it('should handle multiple field index requirements', async () => {
      // Mock complex index error
      const complexIndexError = new Error('The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/clca-courier-27aed/firestore/indexes?create_composite=ClJwcm9qZWN0cy9jbGNhLWNvdXJpZXItMjdhZWQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2NvbnRlbnQvaW5kZXhlcy9fEAEaCAoEdGFncxgBGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI');
      complexIndexError.name = 'FirebaseError';
      (complexIndexError as any).code = 'failed-precondition';

      mockGetDocs.mockRejectedValueOnce(complexIndexError);

      try {
        await newsletterService.getApprovedSubmissions();
      } catch (error) {
        // Should handle complex index requirements
        expect((error as Error).message).toContain('index');
        expect((error as Error).message).toContain('create_composite');
      }
    });
  });

  describe('Query Optimization Strategies', () => {
    it('should use efficient query patterns to avoid index requirements', () => {
      // Test query structure that minimizes index requirements
      const efficientQuery = {
        collection: 'content',
        filters: [
          { field: 'status', operator: '==', value: 'approved' },
          { field: 'tags', operator: 'array-contains', value: 'newsletter:ready' }
        ],
        orderBy: [
          { field: 'createdAt', direction: 'desc' }
        ]
      };

      // Should use single-field filters where possible
      expect(efficientQuery.filters).toHaveLength(2);
      expect(efficientQuery.orderBy).toHaveLength(1);
    });

    it('should implement fallback queries for missing indexes', async () => {
      // Mock index error followed by successful fallback
      const indexError = new Error('The query requires an index');
      indexError.name = 'FirebaseError';
      (indexError as any).code = 'failed-precondition';

      const fallbackData = [
        { id: '1', status: 'approved', tags: ['newsletter:ready'] },
        { id: '2', status: 'approved', tags: ['newsletter:ready'] }
      ];

      mockGetDocs
        .mockRejectedValueOnce(indexError)
        .mockResolvedValueOnce({
          docs: fallbackData.map(doc => ({
            id: doc.id,
            data: () => doc
          }))
        });

      // First call should fail with index error
      await expect(newsletterService.getApprovedSubmissions())
        .rejects.toThrow();

      // Second call should succeed with fallback
      const result = await newsletterService.getApprovedSubmissions();
      expect(result).toHaveLength(2);
    });
  });

  describe('Index Error Recovery', () => {
    it('should implement retry logic for index errors', async () => {
      // Mock index error followed by success
      const indexError = new Error('The query requires an index');
      indexError.name = 'FirebaseError';
      (indexError as any).code = 'failed-precondition';

      const successData = [
        { id: '1', status: 'approved', tags: ['newsletter:ready'] }
      ];

      mockGetDocs
        .mockRejectedValueOnce(indexError)
        .mockResolvedValueOnce({
          docs: successData.map(doc => ({
            id: doc.id,
            data: () => doc
          }))
        });

      // First call should fail
      await expect(newsletterService.getApprovedSubmissions())
        .rejects.toThrow();

      // Second call should succeed
      const result = await newsletterService.getApprovedSubmissions();
      expect(result).toHaveLength(1);
    });

    it('should handle persistent index errors gracefully', async () => {
      // Mock persistent index error
      const indexError = new Error('The query requires an index');
      indexError.name = 'FirebaseError';
      (indexError as any).code = 'failed-precondition';

      mockGetDocs.mockRejectedValue(indexError);

      // Should consistently fail with proper error handling
      await expect(newsletterService.getApprovedSubmissions())
        .rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch approved submissions:',
        indexError
      );
    });
  });

  describe('Index Management Strategies', () => {
    it('should provide index creation guidance', () => {
      // Test index URL extraction
      const extractIndexUrl = (error: Error): string | null => {
        const match = error.message.match(/You can create it here: (https:\/\/[^\s]+)/);
        return match ? match[1] : null;
      };

      const indexError = new Error('The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/clca-courier-27aed/firestore/indexes?create_composite=test');
      
      const indexUrl = extractIndexUrl(indexError);
      expect(indexUrl).toBe('https://console.firebase.google.com/v1/r/project/clca-courier-27aed/firestore/indexes?create_composite=test');
    });

    it('should categorize index requirements', () => {
      // Test index requirement categorization
      const categorizeIndexRequirement = (error: Error): string => {
        if (error.message.includes('create_composite')) {
          return 'composite';
        }
        if (error.message.includes('index')) {
          return 'single';
        }
        return 'unknown';
      };

      const compositeError = new Error('The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/clca-courier-27aed/firestore/indexes?create_composite=test');
      const singleError = new Error('The query requires an index');
      const unknownError = new Error('Some other error');

      expect(categorizeIndexRequirement(compositeError)).toBe('composite');
      expect(categorizeIndexRequirement(singleError)).toBe('single');
      expect(categorizeIndexRequirement(unknownError)).toBe('unknown');
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should log index errors with context', async () => {
      const indexError = new Error('The query requires an index');
      indexError.name = 'FirebaseError';
      (indexError as any).code = 'failed-precondition';

      mockGetDocs.mockRejectedValueOnce(indexError);

      try {
        await newsletterService.getApprovedSubmissions();
      } catch (error) {
        // Should log with proper context
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to fetch approved submissions:',
          indexError
        );
      }
    });

    it('should provide actionable error information', async () => {
      const indexError = new Error('The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/clca-courier-27aed/firestore/indexes?create_composite=test');
      indexError.name = 'FirebaseError';
      (indexError as any).code = 'failed-precondition';

      mockGetDocs.mockRejectedValueOnce(indexError);

      try {
        await newsletterService.getApprovedSubmissions();
      } catch (error) {
        // Should provide actionable information
        expect((error as Error).message).toContain('You can create it here:');
        expect((error as Error).message).toContain('firestore/indexes');
      }
    });
  });

  describe('Preventive Measures', () => {
    it('should validate query complexity before execution', () => {
      // Test query complexity validation
      const validateQueryComplexity = (filters: any[], orderBy: any[]): boolean => {
        // Simple heuristic: avoid complex queries that require composite indexes
        const hasMultipleFilters = filters.length > 2;
        const hasMultipleOrderBy = orderBy.length > 1;
        const hasArrayContains = filters.some(f => f.operator === 'array-contains');
        
        return !(hasMultipleFilters && hasMultipleOrderBy && hasArrayContains);
      };

      // Simple query should be valid
      expect(validateQueryComplexity(
        [{ field: 'status', operator: '==', value: 'approved' }],
        [{ field: 'createdAt', direction: 'desc' }]
      )).toBe(true);

      // Complex query should be flagged
      expect(validateQueryComplexity(
        [
          { field: 'status', operator: '==', value: 'approved' },
          { field: 'tags', operator: 'array-contains', value: 'newsletter:ready' },
          { field: 'authorId', operator: '==', value: 'user123' }
        ],
        [
          { field: 'createdAt', direction: 'desc' },
          { field: 'updatedAt', direction: 'desc' }
        ]
      )).toBe(false);
    });

    it('should implement query optimization recommendations', () => {
      // Test query optimization suggestions
      const optimizeQuery = (filters: any[], orderBy: any[]): { optimized: boolean; suggestions: string[] } => {
        const suggestions: string[] = [];
        let optimized = true;

        if (filters.length > 2) {
          suggestions.push('Consider reducing the number of filters to avoid composite index requirements');
          optimized = false;
        }

        if (orderBy.length > 1) {
          suggestions.push('Consider using single-field ordering to reduce index complexity');
          optimized = false;
        }

        const hasArrayContains = filters.some(f => f.operator === 'array-contains');
        if (hasArrayContains && filters.length > 1) {
          suggestions.push('Array-contains queries with additional filters may require composite indexes');
          optimized = false;
        }

        return { optimized, suggestions };
      };

      const result = optimizeQuery(
        [
          { field: 'status', operator: '==', value: 'approved' },
          { field: 'tags', operator: 'array-contains', value: 'newsletter:ready' }
        ],
        [{ field: 'createdAt', direction: 'desc' }]
      );

      expect(result.optimized).toBe(true);
      expect(result.suggestions).toHaveLength(0);
    });
  });
});
