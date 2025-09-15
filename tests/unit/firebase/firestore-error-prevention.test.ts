/**
 * Firestore Error Prevention Tests
 *
 * These tests follow Firebase's official unit testing patterns
 * to prevent Firestore-specific errors and ensure proper error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../../src/utils/logger';

// Mock Firebase Firestore with official testing patterns
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

// Mock logger
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('Firestore Error Prevention Tests', () => {
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

  describe('Index Requirement Error Prevention', () => {
    it('should handle missing composite index errors with helpful messages', async () => {
      // Mock Firestore index error following Firebase patterns
      const indexError = new Error('The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/clca-courier-27aed/firestore/indexes?create_composite=ClJwcm9qZWN0cy9jbGNhLWNvdXJpZXItMjdhZWQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2NvbnRlbnQvaW5kZXhlcy9fEAEaCAoEdGFncxgBGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI');
      indexError.name = 'FirebaseError';
      (indexError as any).code = 'failed-precondition';

      mockGetDocs.mockRejectedValueOnce(indexError);

      // Test error handling function
      const handleFirestoreError = async (operation: () => Promise<any>) => {
        try {
          return await operation();
        } catch (error: any) {
          if (error.code === 'failed-precondition' && error.message.includes('index')) {
            // Extract index creation URL
            const urlMatch = error.message.match(/You can create it here: (https:\/\/[^\s]+)/);
            const indexUrl = urlMatch ? urlMatch[1] : null;

            mockLogger.error('Firestore index required:', {
              error: error.message,
              indexUrl,
              suggestion: 'Create the required index using the provided URL'
            });

            throw new Error(`Index required: ${indexUrl || 'Check Firebase console'}`);
          }
          throw error;
        }
      };

      // Test the error handling
      await expect(handleFirestoreError(() => mockGetDocs()))
        .rejects.toThrow('Index required:');

      // Verify error was logged with helpful information
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Firestore index required:',
        expect.objectContaining({
          error: expect.stringContaining('The query requires an index'),
          indexUrl: expect.stringContaining('firestore/indexes'),
          suggestion: 'Create the required index using the provided URL'
        })
      );
    });

    it('should implement query optimization to prevent index requirements', () => {
      // Test query optimization following Firebase best practices
      const optimizeQuery = (filters: any[], orderBy: any[]) => {
        // Firebase recommendation: avoid complex queries that require composite indexes
        const hasMultipleFilters = filters.length > 2;
        const hasMultipleOrderBy = orderBy.length > 1;
        const hasArrayContains = filters.some(f => f.operator === 'array-contains');

        if (hasMultipleFilters && hasMultipleOrderBy && hasArrayContains) {
          return {
            optimized: false,
            suggestion: 'Consider splitting into multiple queries or using single-field indexes'
          };
        }

        return { optimized: true };
      };

      // Test complex query that would require composite index
      const complexQuery = {
        filters: [
          { field: 'status', operator: '==', value: 'approved' },
          { field: 'tags', operator: 'array-contains', value: 'newsletter:ready' },
          { field: 'authorId', operator: '==', value: 'user123' }
        ],
        orderBy: [
          { field: 'createdAt', direction: 'desc' },
          { field: 'updatedAt', direction: 'desc' }
        ]
      };

      const result = optimizeQuery(complexQuery.filters, complexQuery.orderBy);
      expect(result.optimized).toBe(false);
      expect(result.suggestion).toContain('splitting into multiple queries');
    });

    it('should provide fallback queries for missing indexes', async () => {
      // Test fallback query strategy
      const executeWithFallback = async (primaryQuery: () => Promise<any>, fallbackQuery: () => Promise<any>) => {
        try {
          return await primaryQuery();
        } catch (error: any) {
          if (error.code === 'failed-precondition' && error.message.includes('index')) {
            mockLogger.warn('Primary query failed due to missing index, using fallback');
            return await fallbackQuery();
          }
          throw error;
        }
      };

      // Mock primary query failure
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

      const result = await executeWithFallback(
        () => mockGetDocs(),
        () => mockGetDocs()
      );

      expect(result.docs).toHaveLength(2);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Primary query failed due to missing index, using fallback'
      );
    });
  });

  describe('Permission Error Prevention', () => {
    it('should handle permission denied errors gracefully', async () => {
      // Mock permission error
      const permissionError = new Error('Missing or insufficient permissions');
      permissionError.name = 'FirebaseError';
      (permissionError as any).code = 'permission-denied';

      mockGetDocs.mockRejectedValueOnce(permissionError);

      const handlePermissionError = async (operation: () => Promise<any>) => {
        try {
          return await operation();
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            mockLogger.error('Permission denied:', {
              error: error.message,
              suggestion: 'Check Firestore security rules and user authentication'
            });
            throw new Error('Access denied: Check permissions');
          }
          throw error;
        }
      };

      await expect(handlePermissionError(() => mockGetDocs()))
        .rejects.toThrow('Access denied: Check permissions');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Permission denied:',
        expect.objectContaining({
          error: 'Missing or insufficient permissions',
          suggestion: 'Check Firestore security rules and user authentication'
        })
      );
    });

    it('should validate user authentication before operations', () => {
      // Test authentication validation
      const validateAuth = (user: any) => {
        if (!user) {
          return {
            valid: false,
            error: 'User not authenticated',
            suggestion: 'User must be signed in to perform this operation'
          };
        }

        if (!user.uid) {
          return {
            valid: false,
            error: 'Invalid user data',
            suggestion: 'User must have a valid UID'
          };
        }

        return { valid: true };
      };

      // Test unauthenticated user
      expect(validateAuth(null)).toEqual({
        valid: false,
        error: 'User not authenticated',
        suggestion: 'User must be signed in to perform this operation'
      });

      // Test invalid user
      expect(validateAuth({})).toEqual({
        valid: false,
        error: 'Invalid user data',
        suggestion: 'User must have a valid UID'
      });

      // Test valid user
      expect(validateAuth({ uid: 'user123', email: 'user@example.com' })).toEqual({
        valid: true
      });
    });
  });

  describe('Network Error Prevention', () => {
    it('should handle network connectivity issues with retry logic', async () => {
      // Test network error handling with exponential backoff
      const executeWithRetry = async (operation: () => Promise<any>, maxRetries: number = 3) => {
        let lastError: any;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await operation();
          } catch (error: any) {
            lastError = error;

            // Only retry on network errors
            if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
              if (attempt === maxRetries) {
                break;
              }

              const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
              mockLogger.warn(`Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              // Don't retry on non-network errors
              throw error;
            }
          }
        }

        throw lastError;
      };

      // Mock network error followed by success
      const networkError = new Error('Network error');
      networkError.name = 'FirebaseError';
      (networkError as any).code = 'unavailable';

      const successData = { docs: [{ id: '1', data: () => ({ test: 'data' }) }] };

      mockGetDocs
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successData);

      const result = await executeWithRetry(() => mockGetDocs(), 3);

      expect(result.docs).toHaveLength(1);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2); // Two retry warnings
    });

    it('should implement circuit breaker pattern for persistent failures', () => {
      // Test circuit breaker implementation
      class FirestoreCircuitBreaker {
        private failureCount = 0;
        private lastFailureTime = 0;
        private state: 'closed' | 'open' | 'half-open' = 'closed';

        constructor(
          private threshold: number = 5,
          private timeout: number = 60000
        ) {}

        async execute<T>(operation: () => Promise<T>): Promise<T> {
          if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
              this.state = 'half-open';
              mockLogger.info('Circuit breaker transitioning to half-open state');
            } else {
              throw new Error('Circuit breaker is open - Firestore operations temporarily disabled');
            }
          }

          try {
            const result = await operation();
            this.onSuccess();
            return result;
          } catch (error) {
            this.onFailure();
            throw error;
          }
        }

        private onSuccess() {
          this.failureCount = 0;
          this.state = 'closed';
          mockLogger.info('Circuit breaker reset to closed state');
        }

        private onFailure() {
          this.failureCount++;
          this.lastFailureTime = Date.now();

          if (this.failureCount >= this.threshold) {
            this.state = 'open';
            mockLogger.error('Circuit breaker opened due to repeated failures', {
              failureCount: this.failureCount,
              threshold: this.threshold
            });
          }
        }

        getState() {
          return this.state;
        }
      }

      const circuitBreaker = new FirestoreCircuitBreaker(2, 1000);

      // Test circuit breaker behavior
      return circuitBreaker.execute(() => Promise.reject(new Error('Service down')))
        .catch(() => {
          expect(circuitBreaker.getState()).toBe('closed');

          // Second failure should open circuit
          return circuitBreaker.execute(() => Promise.reject(new Error('Service down')));
        })
        .catch(() => {
          expect(circuitBreaker.getState()).toBe('open');

          // Third call should be rejected immediately
          return circuitBreaker.execute(() => Promise.resolve('success'));
        })
        .catch(error => {
          expect(error.message).toBe('Circuit breaker is open - Firestore operations temporarily disabled');
        });
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should validate Firestore document structure', () => {
      // Test document validation following Firebase best practices
      const validateDocument = (doc: any, requiredFields: string[]): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!doc || typeof doc !== 'object') {
          errors.push('Document must be an object');
          return { valid: false, errors };
        }

        // Check required fields
        for (const field of requiredFields) {
          if (!(field in doc)) {
            errors.push(`Missing required field: ${field}`);
          }
        }

        // Check for invalid field names (Firestore restrictions)
        const invalidFieldNames = Object.keys(doc).filter(key =>
          key.startsWith('__') || key.includes('.') || key.includes('$')
        );

        if (invalidFieldNames.length > 0) {
          errors.push(`Invalid field names: ${invalidFieldNames.join(', ')}`);
        }

        return { valid: errors.length === 0, errors };
      };

      // Test valid document
      const validDoc = {
        id: 'doc1',
        title: 'Test Document',
        content: 'Test content',
        createdAt: new Date()
      };

      const validResult = validateDocument(validDoc, ['id', 'title']);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Test invalid document
      const invalidDoc = {
        id: 'doc1',
        '__invalid': 'value',
        'field.with.dots': 'value'
      };

      const invalidResult = validateDocument(invalidDoc, ['id', 'title']);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Missing required field: title');
      expect(invalidResult.errors).toContain('Invalid field names: __invalid, field.with.dots');
    });

    it('should sanitize data before Firestore operations', () => {
      // Test data sanitization
      const sanitizeForFirestore = (data: any): any => {
        if (data === null || data === undefined) {
          return null;
        }

        if (typeof data === 'string') {
          // Remove control characters and limit length
          return data.replace(/[\x00-\x1F\x7F]/g, '').substring(0, 1000000);
        }

        if (Array.isArray(data)) {
          return data.map(item => sanitizeForFirestore(item));
        }

        if (typeof data === 'object') {
          const sanitized: any = {};
          for (const [key, value] of Object.entries(data)) {
            // Skip invalid field names
            if (key.startsWith('__') || key.includes('.') || key.includes('$')) {
              continue;
            }
            sanitized[key] = sanitizeForFirestore(value);
          }
          return sanitized;
        }

        return data;
      };

      // Test sanitization
      const testData = {
        title: 'Test Title',
        content: 'Test content with \x00 control characters',
        '__invalid': 'should be removed',
        'field.with.dots': 'should be removed',
        nested: {
          value: 'nested value',
          '__invalid': 'should be removed'
        }
      };

      const sanitized = sanitizeForFirestore(testData);

      expect(sanitized.title).toBe('Test Title');
      expect(sanitized.content).toBe('Test content with  control characters');
      expect(sanitized.__invalid).toBeUndefined();
      expect(sanitized['field.with.dots']).toBeUndefined();
      expect(sanitized.nested.value).toBe('nested value');
      expect(sanitized.nested.__invalid).toBeUndefined();
    });
  });

  describe('Error Monitoring and Analytics', () => {
    it('should track Firestore error patterns for monitoring', () => {
      // Test error pattern tracking
      class FirestoreErrorTracker {
        private errorCounts = new Map<string, number>();
        private errorTimestamps = new Map<string, number[]>();

        recordError(operation: string, error: any) {
          const key = `${operation}:${error?.code || 'unknown'}`;
          const now = Date.now();

          // Increment error count
          this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);

          // Record timestamp
          if (!this.errorTimestamps.has(key)) {
            this.errorTimestamps.set(key, []);
          }
          this.errorTimestamps.get(key)!.push(now);

          // Clean old timestamps (older than 1 hour)
          const oneHourAgo = now - 3600000;
          const timestamps = this.errorTimestamps.get(key)!.filter(t => t > oneHourAgo);
          this.errorTimestamps.set(key, timestamps);
        }

        getErrorRate(operation: string, errorCode: string): number {
          const key = `${operation}:${errorCode}`;
          const timestamps = this.errorTimestamps.get(key) || [];
          return timestamps.length; // Errors per hour
        }

        getTotalErrors(operation: string, errorCode: string): number {
          const key = `${operation}:${errorCode}`;
          return this.errorCounts.get(key) || 0;
        }

        getErrorSummary(): Record<string, any> {
          const summary: Record<string, any> = {};

          for (const [key, count] of this.errorCounts.entries()) {
            const [operation, errorCode] = key.split(':');
            if (!summary[operation]) {
              summary[operation] = {};
            }
            summary[operation][errorCode] = {
              total: count,
              rate: this.getErrorRate(operation, errorCode)
            };
          }

          return summary;
        }
      }

      const tracker = new FirestoreErrorTracker();

      // Record some errors
      tracker.recordError('getDocs', { code: 'failed-precondition' });
      tracker.recordError('getDocs', { code: 'failed-precondition' });
      tracker.recordError('addDoc', { code: 'permission-denied' });

      const summary = tracker.getErrorSummary();

      expect(summary.getDocs['failed-precondition'].total).toBe(2);
      expect(summary.getDocs['failed-precondition'].rate).toBe(2);
      expect(summary.addDoc['permission-denied'].total).toBe(1);
      expect(summary.addDoc['permission-denied'].rate).toBe(1);
    });
  });
});
