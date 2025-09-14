import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger utility
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn()
  }
}));

// Mock Firebase services with comprehensive error scenarios
const mockFirebaseErrors = vi.hoisted(() => ({
  mockDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockOrderBy: vi.fn(),
  mockGetDocs: vi.fn(),
  mockAddDoc: vi.fn(),
  mockOnSnapshot: vi.fn()
}));

// Use global Firebase/Firestore mock from tests/setup.ts
// Individual mocks are set up in beforeEach

// Mock Firebase config
vi.mock('../../../src/config/firebase.config', () => ({
  firestore: { app: { name: 'test-app' } }
}));

// Mock safe-firebase utilities
vi.mock('../../../src/utils/safe-firebase', () => ({
  safeSetDoc: vi.fn(),
  safeAddDoc: vi.fn()
}));

// Mock auth service
const mockAuthService = vi.hoisted(() => ({
  getCurrentUser: vi.fn(() => ({ uid: 'test-user-123', email: 'test@example.com' }))
}));

vi.mock('../../../src/services/firebase-auth.service', () => ({
  firebaseAuthService: mockAuthService
}));

import { firestoreService } from '../../../src/services/firebase-firestore.service';

describe('Firebase Error Handling - Critical Edge Cases', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up global Firebase mocks to use our specific mock functions
    const firestoreModule = await import('firebase/firestore');
    vi.mocked(firestoreModule.collection).mockImplementation(mockFirebaseErrors.mockCollection);
    vi.mocked(firestoreModule.doc).mockImplementation(mockFirebaseErrors.mockDoc);
    vi.mocked(firestoreModule.getDoc).mockImplementation(mockFirebaseErrors.mockGetDoc);
    vi.mocked(firestoreModule.updateDoc).mockImplementation(mockFirebaseErrors.mockUpdateDoc);
    vi.mocked(firestoreModule.deleteDoc).mockImplementation(mockFirebaseErrors.mockDeleteDoc);
    vi.mocked(firestoreModule.query).mockImplementation(mockFirebaseErrors.mockQuery);
    vi.mocked(firestoreModule.where).mockImplementation(mockFirebaseErrors.mockWhere);
    vi.mocked(firestoreModule.orderBy).mockImplementation(mockFirebaseErrors.mockOrderBy);
    vi.mocked(firestoreModule.getDocs).mockImplementation(mockFirebaseErrors.mockGetDocs);
    vi.mocked(firestoreModule.addDoc).mockImplementation(mockFirebaseErrors.mockAddDoc);
    vi.mocked(firestoreModule.onSnapshot).mockImplementation(mockFirebaseErrors.mockOnSnapshot);

    // Default successful mock setup
    mockFirebaseErrors.mockCollection.mockReturnValue({});
    mockFirebaseErrors.mockQuery.mockReturnValue({});
    mockFirebaseErrors.mockWhere.mockReturnValue({});
    mockFirebaseErrors.mockOrderBy.mockReturnValue({});
    mockFirebaseErrors.mockDoc.mockReturnValue({});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Network and Connection Failures', () => {
    it('should handle network timeout errors gracefully', async () => {
      const networkTimeoutError = new Error('Network request timed out');
      networkTimeoutError.name = 'FirebaseError';
      (networkTimeoutError as any).code = 'unavailable';

      mockFirebaseErrors.mockGetDocs.mockRejectedValue(networkTimeoutError);

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('Network request timed out');
    });

    it('should handle connection refused errors', async () => {
      const connectionError = new Error('Connection refused');
      connectionError.name = 'FirebaseError';
      (connectionError as any).code = 'unavailable';

      mockFirebaseErrors.mockGetDocs.mockRejectedValue(connectionError);

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('Connection refused');
    });

    it('should handle DNS resolution failures', async () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND firestore.googleapis.com');
      dnsError.name = 'FirebaseError';
      (dnsError as any).code = 'unavailable';

      mockFirebaseErrors.mockGetDocs.mockRejectedValue(dnsError);

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('getaddrinfo ENOTFOUND');
    });
  });

  describe('Firebase Permission Errors', () => {
    it('should handle permission denied errors with specific context', async () => {
      const permissionError = new Error('Missing or insufficient permissions');
      permissionError.name = 'FirebaseError';
      (permissionError as any).code = 'permission-denied';

      mockFirebaseErrors.mockGetDocs.mockRejectedValue(permissionError);

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('Missing or insufficient permissions');
    });

    it('should handle authentication required errors', async () => {
      const authError = new Error('The caller does not have permission');
      authError.name = 'FirebaseError';
      (authError as any).code = 'permission-denied';

      mockFirebaseErrors.mockGetDocs.mockRejectedValue(authError);

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('The caller does not have permission');
    });

    it('should handle quota exceeded errors', async () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'FirebaseError';
      (quotaError as any).code = 'resource-exhausted';

      mockFirebaseErrors.mockGetDocs.mockRejectedValue(quotaError);

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('Quota exceeded');
    });
  });

  describe('Data Corruption and Malformed Responses', () => {
    it('should handle malformed document data gracefully', async () => {
      const malformedSnapshot = {
        docs: [
          {
            id: 'malformed-doc',
            data: () => ({
              // Missing required fields
              title: null,
              publicationDate: 'invalid-date-format',
              fileSize: 'not-a-number',
              // Corrupted nested object
              actions: 'should-be-object'
            })
          }
        ]
      };

      mockFirebaseErrors.mockGetDocs.mockResolvedValue(malformedSnapshot);

      // Should not throw, but handle gracefully
      const result = await firestoreService.getAllNewsletterMetadata();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'malformed-doc');
    });

    it('should handle circular reference in document data', async () => {
      const circularData: any = { title: 'Test' };
      circularData.self = circularData; // Create circular reference

      const circularSnapshot = {
        docs: [
          {
            id: 'circular-doc',
            data: () => circularData
          }
        ]
      };

      mockFirebaseErrors.mockGetDocs.mockResolvedValue(circularSnapshot);

      // Should handle circular references without crashing
      const result = await firestoreService.getAllNewsletterMetadata();
      expect(result).toHaveLength(1);
    });

    it('should handle extremely large document data', async () => {
      const largeData = {
        id: 'large-doc',
        title: 'Large Document',
        publicationDate: '2024-01-01',
        fileSize: 1000,
        // Create a very large string
        content: 'A'.repeat(1000000) // 1MB string
      };

      const largeSnapshot = {
        docs: [
          {
            id: 'large-doc',
            data: () => largeData
          }
        ]
      };

      mockFirebaseErrors.mockGetDocs.mockResolvedValue(largeSnapshot);

      const result = await firestoreService.getAllNewsletterMetadata();
      expect(result).toHaveLength(1);
      expect(result[0]?.content).toHaveLength(1000000);
    });
  });

  describe('Authentication State Changes During Operations', () => {
    it('should handle user authentication expiring during operation', async () => {
      // Start with authenticated user
      mockAuthService.getCurrentUser.mockReturnValue({ uid: 'test-user-123' });

      // Simulate auth expiring during operation
      mockFirebaseErrors.mockGetDocs.mockImplementation(() => {
        // Simulate auth expiring by making subsequent calls fail
        mockAuthService.getCurrentUser.mockReturnValue(null);
        throw new Error('The user credential is no longer valid');
      });

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('The user credential is no longer valid');
    });

    it('should handle user being deleted during operation', async () => {
      mockAuthService.getCurrentUser.mockReturnValue({ uid: 'test-user-123' });

      mockFirebaseErrors.mockGetDocs.mockRejectedValue(
        new Error('User not found')
      );

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('User not found');
    });
  });

  describe('Concurrent Operation Conflicts', () => {
    it('should handle concurrent write conflicts', async () => {
      const conflictError = new Error('Document was modified by another user');
      conflictError.name = 'FirebaseError';
      (conflictError as any).code = 'aborted';

      // Mock safeSetDoc to reject with conflict error
      const { safeSetDoc } = await import('../../../src/utils/safe-firebase');
      vi.mocked(safeSetDoc).mockRejectedValue(conflictError);

      await expect(firestoreService.updateNewsletterMetadata('test-id', { title: 'Updated' }))
        .rejects.toThrow('Document was modified by another user');
    });

    it('should handle optimistic locking failures', async () => {
      const lockingError = new Error('Transaction failed due to concurrent modification');
      lockingError.name = 'FirebaseError';
      (lockingError as any).code = 'aborted';

      // Mock safeSetDoc to reject with locking error
      const { safeSetDoc } = await import('../../../src/utils/safe-firebase');
      vi.mocked(safeSetDoc).mockRejectedValue(lockingError);

      await expect(firestoreService.updateNewsletterMetadata('test-id', { title: 'Updated' }))
        .rejects.toThrow('Transaction failed due to concurrent modification');
    });
  });

  describe('Subscription Error Handling', () => {
    it('should handle subscription permission errors', () => {
      const permissionError = new Error('Missing or insufficient permissions');
      permissionError.name = 'FirebaseError';
      (permissionError as any).code = 'permission-denied';

      let subscriptionCallback: (error: Error) => void;
      mockFirebaseErrors.mockOnSnapshot.mockImplementation((query, onNext, onError) => {
        subscriptionCallback = onError;
        return vi.fn();
      });

      const callback = vi.fn();
      firestoreService.subscribeToNewsletters(callback);

      // Simulate subscription error
      subscriptionCallback!(permissionError);

      // Should call callback with empty array to prevent app crash
      expect(callback).toHaveBeenCalledWith([]);
    });

    it('should handle subscription network errors', () => {
      const networkError = new Error('Network error during subscription');
      networkError.name = 'FirebaseError';
      (networkError as any).code = 'unavailable';

      let subscriptionCallback: (error: Error) => void;
      mockFirebaseErrors.mockOnSnapshot.mockImplementation((query, onNext, onError) => {
        subscriptionCallback = onError;
        return vi.fn();
      });

      const callback = vi.fn();
      firestoreService.subscribeToNewsletters(callback);

      // Simulate subscription error
      subscriptionCallback!(networkError);

      // Should call callback with empty array to prevent app crash
      expect(callback).toHaveBeenCalledWith([]);
    });
  });

  describe('Rate Limiting and Throttling', () => {
    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.name = 'FirebaseError';
      (rateLimitError as any).code = 'resource-exhausted';

      mockFirebaseErrors.mockGetDocs.mockRejectedValue(rateLimitError);

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('Too many requests');
    });

    it('should handle throttling errors', async () => {
      const throttleError = new Error('Request throttled');
      throttleError.name = 'FirebaseError';
      (throttleError as any).code = 'resource-exhausted';

      mockFirebaseErrors.mockGetDocs.mockRejectedValue(throttleError);

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('Request throttled');
    });
  });

  describe('Service Unavailability', () => {
    it('should handle Firebase service being down', async () => {
      const serviceDownError = new Error('Service temporarily unavailable');
      serviceDownError.name = 'FirebaseError';
      (serviceDownError as any).code = 'unavailable';

      mockFirebaseErrors.mockGetDocs.mockRejectedValue(serviceDownError);

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('Service temporarily unavailable');
    });

    it('should handle maintenance mode errors', async () => {
      const maintenanceError = new Error('Service under maintenance');
      maintenanceError.name = 'FirebaseError';
      (maintenanceError as any).code = 'unavailable';

      mockFirebaseErrors.mockGetDocs.mockRejectedValue(maintenanceError);

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('Service under maintenance');
    });
  });

  describe('Memory and Resource Exhaustion', () => {
    it('should handle memory exhaustion during large queries', async () => {
      const memoryError = new Error('Out of memory');
      memoryError.name = 'FirebaseError';
      (memoryError as any).code = 'resource-exhausted';

      mockFirebaseErrors.mockGetDocs.mockRejectedValue(memoryError);

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('Out of memory');
    });

    it('should handle query timeout errors', async () => {
      const timeoutError = new Error('Query timeout');
      timeoutError.name = 'FirebaseError';
      (timeoutError as any).code = 'deadline-exceeded';

      mockFirebaseErrors.mockGetDocs.mockRejectedValue(timeoutError);

      await expect(firestoreService.getAllNewsletterMetadata())
        .rejects.toThrow('Query timeout');
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle documents with invalid field types', async () => {
      const invalidTypeSnapshot = {
        docs: [
          {
            id: 'invalid-types',
            data: () => ({
              title: 12345, // Should be string
              publicationDate: new Date(), // Should be string
              fileSize: 'large', // Should be number
              isPublished: 'yes', // Should be boolean
              tags: 'not-an-array' // Should be array
            })
          }
        ]
      };

      mockFirebaseErrors.mockGetDocs.mockResolvedValue(invalidTypeSnapshot);

      const result = await firestoreService.getAllNewsletterMetadata();
      expect(result).toHaveLength(1);
      // Should handle type mismatches gracefully
      expect(result[0]).toHaveProperty('id', 'invalid-types');
    });

    it('should handle documents with missing critical fields', async () => {
      const missingFieldsSnapshot = {
        docs: [
          {
            id: 'missing-fields',
            data: () => ({
              // Only has id, missing all other required fields
            })
          }
        ]
      };

      mockFirebaseErrors.mockGetDocs.mockResolvedValue(missingFieldsSnapshot);

      const result = await firestoreService.getAllNewsletterMetadata();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'missing-fields');
    });
  });
});
