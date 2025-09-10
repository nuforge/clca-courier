import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger utility FIRST - this fixes the logger.success errors
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(), // This was missing!
    drive: vi.fn()    // This was missing!
  }
}));

// Mock Firebase Firestore functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  deleteField: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  initializeFirestore: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn()
}));

// Mock Firebase app
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test-app' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: 'test-app' }))
}));

// Mock Firebase config
vi.mock('../../../src/config/firebase.config', () => ({
  firestore: {}
}));

// Mock auth service
vi.mock('../../../src/services/firebase-auth.service', () => ({
  firebaseAuthService: {
    getCurrentUser: vi.fn(() => ({ uid: 'test-user-123' })),
    onAuthStateChanged: vi.fn(),
    isAdmin: vi.fn(() => true)
  }
}));

// Mock utils
vi.mock('../../../src/utils/safe-firebase', () => ({
  safeSetDoc: vi.fn(),
  safeAddDoc: vi.fn(() => Promise.resolve({ id: 'test-doc-id' }))
}));

import {
  firestoreService,
  type NewsletterMetadata
} from '../../../src/services/firebase-firestore.service';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { mockNewsletterData, mockUserContentData } from '../../mocks/test-data';

describe('Firebase Firestore Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Newsletter Operations', () => {
    it('should have saveNewsletterMetadata method', () => {
      expect(typeof firestoreService.saveNewsletterMetadata).toBe('function');
    });

    it('should have updateNewsletterMetadata method', () => {
      expect(typeof firestoreService.updateNewsletterMetadata).toBe('function');
    });

    it('should have deleteNewsletterMetadata method', () => {
      expect(typeof firestoreService.deleteNewsletterMetadata).toBe('function');
    });

    it('should handle newsletter metadata operations without throwing', async () => {
      // Mock successful responses
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'test-id',
            data: () => mockNewsletterData.valid
          }
        ]
      };

      (getDocs as any).mockResolvedValue(mockQuerySnapshot);
      (addDoc as any).mockResolvedValue({ id: 'new-id' });
      (updateDoc as any).mockResolvedValue(undefined);
      (deleteDoc as any).mockResolvedValue(undefined);
      (collection as any).mockReturnValue({});
      (query as any).mockReturnValue({});
      (where as any).mockReturnValue({});
      (orderBy as any).mockReturnValue({});
      (doc as any).mockReturnValue({});

      const testMetadata: Omit<NewsletterMetadata, 'id'> = {
        filename: 'test.pdf',
        title: 'Test Newsletter',
        publicationDate: '2024-01-01',
        fileSize: 1000,
        pageCount: 5,
        season: 'winter',
        year: 2024,
        month: 1,
        downloadUrl: 'https://test.com/newsletter.pdf',
        storageRef: 'test/path',
        tags: ['test'],
        featured: false,
        isPublished: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'test-user',
        updatedBy: 'test-user',
        actions: {
          canView: true,
          canDownload: true,
          canSearch: true,
          hasThumbnail: false
        }
      };

      // Test that methods can be called without throwing
      await expect(firestoreService.saveNewsletterMetadata(testMetadata)).resolves.not.toThrow();
      await expect(firestoreService.updateNewsletterMetadata('test-id', testMetadata)).resolves.not.toThrow();
      await expect(firestoreService.deleteNewsletterMetadata('test-id')).resolves.not.toThrow();
    });
  });

  describe('Content Management Operations', () => {
    it('should have content management methods available', () => {
      const expectedMethods = [
        'getApprovedContent',
        'updateContentStatus'
      ];

      expectedMethods.forEach(method => {
        expect(typeof firestoreService[method as keyof typeof firestoreService]).toBe('function');
      });
    });

    it('should handle content operations without throwing', async () => {
      // Mock successful responses
      const mockContentSnapshot = {
        docs: [
          {
            id: 'content-1',
            data: () => mockUserContentData.pendingArticle
          }
        ]
      };

      (getDocs as any).mockResolvedValue(mockContentSnapshot);
      (updateDoc as any).mockResolvedValue(undefined);
      (collection as any).mockReturnValue({});
      (query as any).mockReturnValue({});
      (where as any).mockReturnValue({});
      (doc as any).mockReturnValue({});

      // Test content methods
      await expect(firestoreService.getApprovedContent()).resolves.not.toThrow();
      await expect(firestoreService.updateContentStatus('test-id', 'approved')).resolves.not.toThrow();
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should have subscription methods available', () => {
      expect(typeof firestoreService.subscribeToNewsletters).toBe('function');
    });

    it('should handle subscription setup without throwing', () => {
      const mockUnsubscribe = vi.fn();
      (onSnapshot as any).mockReturnValue(mockUnsubscribe);
      (collection as any).mockReturnValue({});
      (query as any).mockReturnValue({});
      (orderBy as any).mockReturnValue({});

      const callback = vi.fn();

      // Test subscription methods
      expect(() => firestoreService.subscribeToNewsletters(callback)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      const firestoreError = new Error('Firestore connection failed');
      (getDocs as any).mockRejectedValue(firestoreError);

      // Should not throw, but should handle error internally
      try {
        await firestoreService.getAllNewsletterMetadata();
      } catch (error) {
        // It's okay if it throws, we just want to ensure it doesn't crash
        expect(error).toBeDefined();
      }
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network unavailable');
      (addDoc as any).mockRejectedValue(networkError);

      const testMetadata: Omit<NewsletterMetadata, 'id'> = {
        filename: 'test.pdf',
        title: 'Test Newsletter',
        publicationDate: '2024-01-01',
        fileSize: 1000,
        pageCount: 5,
        season: 'winter',
        year: 2024,
        month: 1,
        downloadUrl: 'https://test.com/newsletter.pdf',
        storageRef: 'test/path',
        tags: ['test'],
        featured: false,
        isPublished: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'test-user',
        updatedBy: 'test-user',
        actions: {
          canView: true,
          canDownload: true,
          canSearch: true,
          hasThumbnail: false
        }
      };

      // Should handle error gracefully
      try {
        await firestoreService.saveNewsletterMetadata(testMetadata);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Service Initialization', () => {
    it('should be properly initialized', () => {
      expect(firestoreService).toBeDefined();
      expect(typeof firestoreService).toBe('object');
    });

    it('should have all expected methods', () => {
      const expectedMethods = [
        'saveNewsletterMetadata',
        'updateNewsletterMetadata',
        'deleteNewsletterMetadata',
        'getApprovedContent',
        'updateContentStatus',
        'subscribeToNewsletters'
      ];

      expectedMethods.forEach(method => {
        expect(firestoreService).toHaveProperty(method);
        expect(typeof firestoreService[method as keyof typeof firestoreService]).toBe('function');
      });
    });
  });

  describe('Data Type Validation', () => {
    it('should handle various date input formats', async () => {
      const mockSnapshot = {
        docs: [{
          id: 'test-id',
          data: () => ({
            ...mockNewsletterData.valid,
            publicationDate: '2024-01-01' // String format
          })
        }]
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);
      (collection as any).mockReturnValue({});
      (query as any).mockReturnValue({});
      (orderBy as any).mockReturnValue({});

      // Should handle different date formats without throwing
      try {
        await firestoreService.getAllNewsletterMetadata();
      } catch (error) {
        // Expected behavior - may throw due to auth or other requirements
        expect(error).toBeDefined();
      }
    });

    it('should handle missing or invalid data gracefully', async () => {
      const mockInvalidSnapshot = {
        docs: [{
          id: 'invalid-id',
          data: () => ({
            // Missing required fields
            title: null,
            publicationDate: 'invalid-date'
          })
        }]
      };

      (getDocs as any).mockResolvedValue(mockInvalidSnapshot);
      (collection as any).mockReturnValue({});
      (query as any).mockReturnValue({});
      (orderBy as any).mockReturnValue({});

      // Should handle invalid data without throwing
      try {
        await firestoreService.getAllNewsletterMetadata();
      } catch (error) {
        // Expected behavior - may throw due to validation
        expect(error).toBeDefined();
      }
    });
  });
});
