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

// Mock Firebase Firestore functions and app using vi.hoisted() for consistency
const {
  mockDoc,
  mockGetDoc,
  mockUpdateDoc,
  mockDeleteDoc,
  mockDeleteField,
  mockCollection,
  mockQuery,
  mockWhere,
  mockOrderBy,
  mockGetDocs,
  mockAddDoc,
  mockOnSnapshot,
  mockServerTimestamp,
  mockLimit,
  mockStartAfter,
  mockInitializeApp,
  mockGetApps,
  mockGetApp
} = vi.hoisted(() => {
  return {
    mockDoc: vi.fn(),
    mockGetDoc: vi.fn(),
    mockUpdateDoc: vi.fn(),
    mockDeleteDoc: vi.fn(),
    mockDeleteField: vi.fn(),
    mockCollection: vi.fn(),
    mockQuery: vi.fn(),
    mockWhere: vi.fn(),
    mockOrderBy: vi.fn(),
    mockGetDocs: vi.fn(),
    mockAddDoc: vi.fn(),
    mockOnSnapshot: vi.fn(),
    mockServerTimestamp: vi.fn(),
    mockLimit: vi.fn(),
    mockStartAfter: vi.fn(),
    mockInitializeApp: vi.fn(() => ({ name: 'test-app' })),
    mockGetApps: vi.fn(() => []),
    mockGetApp: vi.fn(() => ({ name: 'test-app' }))
  };
});

// Use global Firebase/Firestore mock from tests/setup.ts

// Mock Firebase app using hoisted functions
vi.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp,
  getApps: mockGetApps,
  getApp: mockGetApp
}));

// Mock Firebase config
const { mockFirestore } = vi.hoisted(() => ({
  mockFirestore: { app: { name: 'test-app' } }
}));

vi.mock('../../../src/config/firebase.config', () => ({
  firestore: mockFirestore
}));

// Mock auth service with comprehensive auth states
const { mockCurrentUser, mockFirebaseAuthService } = vi.hoisted(() => ({
  mockCurrentUser: { uid: 'test-user-123', email: 'test@example.com' },
  mockFirebaseAuthService: {
    getCurrentUser: vi.fn(() => ({ uid: 'test-user-123', email: 'test@example.com' })),
    onAuthStateChanged: vi.fn(),
    isAdmin: vi.fn(() => true)
  }
}));

vi.mock('../../../src/services/firebase-auth.service', () => ({
  firebaseAuthService: mockFirebaseAuthService
}));// Mock newsletter versioning service
const { mockNewsletterVersioningService } = vi.hoisted(() => ({
  mockNewsletterVersioningService: {
    getLatestVersion: vi.fn(),
    createVersion: vi.fn()
  }
}));

vi.mock('../../../src/services/newsletter-versioning.service', () => ({
  newsletterVersioningService: mockNewsletterVersioningService
}));

// Mock utils
const { mockSafeSetDoc, mockSafeAddDoc } = vi.hoisted(() => ({
  mockSafeSetDoc: vi.fn(),
  mockSafeAddDoc: vi.fn()
}));

vi.mock('../../../src/utils/safe-firebase', () => ({
  safeSetDoc: mockSafeSetDoc,
  safeAddDoc: mockSafeAddDoc
}));

// Mock date formatter utils
vi.mock('../../../src/utils/date-formatter', () => ({
  sortByDateDesc: vi.fn((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()),
  sortByDateAsc: vi.fn((a, b) => new Date(a.publicationDate).getTime() - new Date(b.publicationDate).getTime()),
  normalizeDate: vi.fn((date) => date)
}));

import {
  firestoreService,
  type NewsletterMetadata,
  type UserContent
} from '../../../src/services/firebase-firestore.service';
import { mockNewsletterData, mockUserContentData } from '../../mocks/test-data';

describe('Firebase Firestore Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up global Firebase mocks to use our specific mock functions
    const firestoreModule = await import('firebase/firestore');
    vi.mocked(firestoreModule.collection).mockImplementation(mockCollection);
    vi.mocked(firestoreModule.doc).mockImplementation(mockDoc);
    vi.mocked(firestoreModule.getDoc).mockImplementation(mockGetDoc);
    vi.mocked(firestoreModule.updateDoc).mockImplementation(mockUpdateDoc);
    vi.mocked(firestoreModule.deleteDoc).mockImplementation(mockDeleteDoc);
    vi.mocked(firestoreModule.deleteField).mockImplementation(mockDeleteField);
    vi.mocked(firestoreModule.query).mockImplementation(mockQuery);
    vi.mocked(firestoreModule.where).mockImplementation(mockWhere);
    vi.mocked(firestoreModule.orderBy).mockImplementation(mockOrderBy);
    vi.mocked(firestoreModule.getDocs).mockImplementation(mockGetDocs);
    vi.mocked(firestoreModule.addDoc).mockImplementation(mockAddDoc);
    vi.mocked(firestoreModule.onSnapshot).mockImplementation(mockOnSnapshot);
    vi.mocked(firestoreModule.serverTimestamp).mockImplementation(mockServerTimestamp);
    vi.mocked(firestoreModule.limit).mockImplementation(mockLimit);
    vi.mocked(firestoreModule.startAfter).mockImplementation(mockStartAfter);

    // Reset mocks to default successful behavior
    mockSafeAddDoc.mockResolvedValue({ id: 'test-doc-id' });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'test-id',
      data: () => mockNewsletterData.valid
    });
    mockCollection.mockReturnValue({});
    mockQuery.mockReturnValue({});
    mockWhere.mockReturnValue({});
    mockOrderBy.mockReturnValue({});
    mockDoc.mockReturnValue({});
    mockServerTimestamp.mockReturnValue(new Date().toISOString());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Newsletter CRUD Operations', () => {
    describe('saveNewsletterMetadata', () => {
      it('should successfully save newsletter metadata', async () => {
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

        const result = await firestoreService.saveNewsletterMetadata(testMetadata);

        expect(result).toBe('test-doc-id');
        expect(mockCollection).toHaveBeenCalledWith(mockFirestore, 'newsletters');
        expect(mockSafeAddDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            ...testMetadata,
            createdBy: 'test-user-123',
            updatedBy: 'test-user-123'
          })
        );
      });

      it('should throw error when user is not authenticated', async () => {
        mockFirebaseAuthService.getCurrentUser.mockReturnValue(null as any);

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

        await expect(firestoreService.saveNewsletterMetadata(testMetadata))
          .rejects.toThrow('User must be authenticated to save newsletter metadata');
      });

      it('should handle Firebase errors gracefully', async () => {
        const firebaseError = new Error('Firebase write failed');
        mockSafeAddDoc.mockRejectedValue(firebaseError);

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

        await expect(firestoreService.saveNewsletterMetadata(testMetadata))
          .rejects.toThrow('Firebase write failed');
      });
    });

    describe('getNewsletterMetadata', () => {
      it('should successfully retrieve newsletter metadata', async () => {
        const result = await firestoreService.getNewsletterMetadata('test-id');

        expect(result).toMatchObject({
          ...mockNewsletterData.valid
        });
        expect(result?.id).toBe('test-id');
        expect(mockDoc).toHaveBeenCalledWith(mockFirestore, 'newsletters', 'test-id');
        expect(mockGetDoc).toHaveBeenCalled();
      });

      it('should return null when document does not exist', async () => {
        mockGetDoc.mockResolvedValue({
          exists: () => false
        });

        const result = await firestoreService.getNewsletterMetadata('non-existent-id');

        expect(result).toBeNull();
      });

      it('should handle Firebase errors gracefully', async () => {
        const firebaseError = new Error('Firebase read failed');
        mockGetDoc.mockRejectedValue(firebaseError);

        await expect(firestoreService.getNewsletterMetadata('test-id'))
          .rejects.toThrow('Firebase read failed');
      });
    });

    describe('updateNewsletterMetadata', () => {
      it('should successfully update newsletter metadata', async () => {
        mockUpdateDoc.mockResolvedValue(undefined);

        const updates = { title: 'Updated Title', featured: true };

        await firestoreService.updateNewsletterMetadata('test-id', updates);

        expect(mockDoc).toHaveBeenCalledWith(mockFirestore, 'newsletters', 'test-id');
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            ...updates,
            updatedBy: 'test-user-123'
          })
        );
      });

      it('should throw error when user is not authenticated', async () => {
        mockFirebaseAuthService.getCurrentUser.mockReturnValue(null as any);

        await expect(firestoreService.updateNewsletterMetadata('test-id', { title: 'Updated' }))
          .rejects.toThrow('User must be authenticated to update newsletter metadata');
      });
    });

    describe('deleteNewsletterMetadata', () => {
      it('should successfully delete newsletter metadata', async () => {
        mockDeleteDoc.mockResolvedValue(undefined);

        await firestoreService.deleteNewsletterMetadata('test-id');

        expect(mockDoc).toHaveBeenCalledWith(mockFirestore, 'newsletters', 'test-id');
        expect(mockDeleteDoc).toHaveBeenCalled();
      });

      it('should handle Firebase errors gracefully', async () => {
        const firebaseError = new Error('Firebase delete failed');
        mockDeleteDoc.mockRejectedValue(firebaseError);

        await expect(firestoreService.deleteNewsletterMetadata('test-id'))
          .rejects.toThrow('Firebase delete failed');
      });
    });
  });

  describe('Content Management Operations', () => {
    describe('getApprovedContent', () => {
      it('should successfully retrieve approved content', async () => {
        const mockContentSnapshot = {
          docs: [
            {
              id: 'content-1',
              data: () => mockUserContentData.pendingArticle
            }
          ]
        };

        mockGetDocs.mockResolvedValue(mockContentSnapshot);

        const result = await firestoreService.getApprovedContent();

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe('content-1');
        expect(result[0]).toMatchObject({
          ...mockUserContentData.pendingArticle
        });
        expect(mockCollection).toHaveBeenCalledWith(mockFirestore, 'userContent');
        expect(mockQuery).toHaveBeenCalled();
        expect(mockWhere).toHaveBeenCalledWith('status', 'in', ['approved', 'published']);
      });

      it('should handle empty content list', async () => {
        mockGetDocs.mockResolvedValue({ docs: [] });

        const result = await firestoreService.getApprovedContent();

        expect(result).toEqual([]);
      });

      it('should handle Firebase errors gracefully', async () => {
        const firebaseError = new Error('Firestore connection failed');
        mockGetDocs.mockRejectedValue(firebaseError);

        await expect(firestoreService.getApprovedContent())
          .rejects.toThrow('Firestore connection failed');
      });
    });

    describe('updateContentStatus', () => {
      it('should successfully update content status', async () => {
        mockUpdateDoc.mockResolvedValue(undefined);

        await firestoreService.updateContentStatus('content-id', 'approved');

        expect(mockDoc).toHaveBeenCalledWith(mockFirestore, 'userContent', 'content-id');
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            status: 'approved'
          })
        );
      });

      it('should handle Firebase errors gracefully', async () => {
        const firebaseError = new Error('Update failed');
        mockUpdateDoc.mockRejectedValue(firebaseError);

        await expect(firestoreService.updateContentStatus('content-id', 'approved'))
          .rejects.toThrow('Update failed');
      });
    });

    describe('getPublishedContent', () => {
      it('should successfully retrieve published content', async () => {
        const mockPublishedSnapshot = {
          docs: [
            {
              id: 'published-1',
              data: () => ({ ...mockUserContentData.pendingArticle, status: 'published' })
            }
          ]
        };

        mockGetDocs.mockResolvedValue(mockPublishedSnapshot);

        const result = await firestoreService.getPublishedContent();

        expect(result).toHaveLength(1);
        expect(result[0]?.status).toBe('published');
        expect(mockWhere).toHaveBeenCalledWith('status', '==', 'published');
      });
    });
  });

  describe('Real-time Subscriptions', () => {
    describe('subscribeToNewsletters', () => {
      it('should successfully set up newsletter subscription', () => {
        const mockUnsubscribe = vi.fn();
        mockOnSnapshot.mockReturnValue(mockUnsubscribe);

        const callback = vi.fn();

        const unsubscribe = firestoreService.subscribeToNewsletters(callback);

        expect(mockCollection).toHaveBeenCalledWith(mockFirestore, 'newsletters');
        expect(mockQuery).toHaveBeenCalled();
        expect(mockOrderBy).toHaveBeenCalledWith('publicationDate', 'desc');
        expect(mockOnSnapshot).toHaveBeenCalled();
        expect(unsubscribe).toBe(mockUnsubscribe);
      });

      it('should handle subscription callback execution', () => {
        const mockSnapshot = {
          docs: [
            {
              id: 'newsletter-1',
              data: () => mockNewsletterData.valid
            }
          ]
        };

        let subscriptionCallback: (snapshot: any) => void;
        mockOnSnapshot.mockImplementation((query, callback) => {
          subscriptionCallback = callback;
          return vi.fn();
        });

        const userCallback = vi.fn();
        firestoreService.subscribeToNewsletters(userCallback);

        // Simulate Firebase calling the subscription callback
        subscriptionCallback!(mockSnapshot);

        expect(userCallback).toHaveBeenCalledWith([
          expect.objectContaining({
            id: 'newsletter-1'
          })
        ]);
      });
    });
  });

  describe('Query Operations', () => {
    describe('getAllNewsletterMetadata', () => {
      it('should successfully retrieve all newsletters', async () => {
        const mockQuerySnapshot = {
          docs: [
            {
              id: 'newsletter-1',
              data: () => mockNewsletterData.valid
            },
            {
              id: 'newsletter-2',
              data: () => ({ ...mockNewsletterData.valid, title: 'Newsletter 2' })
            }
          ]
        };

        mockGetDocs.mockResolvedValue(mockQuerySnapshot);

        const result = await firestoreService.getAllNewsletterMetadata();

        expect(result).toHaveLength(2);
        expect(result[0]?.id).toBe('newsletter-1');
        expect(result[1]?.title).toBe('Newsletter 2');
      });

      it('should handle empty newsletter collection', async () => {
        mockGetDocs.mockResolvedValue({ docs: [] });

        const result = await firestoreService.getAllNewsletterMetadata();

        expect(result).toEqual([]);
      });
    });

    describe('findNewsletterIdByFilename', () => {
      it('should find newsletter by filename', async () => {
        const mockQuerySnapshot = {
          docs: [
            {
              id: 'found-newsletter',
              data: () => ({ ...mockNewsletterData.valid, filename: 'specific-file.pdf' })
            }
          ]
        };

        mockGetDocs.mockResolvedValue(mockQuerySnapshot);

        const result = await firestoreService.findNewsletterIdByFilename('specific-file.pdf');

        expect(result).toBe('found-newsletter');
        expect(mockWhere).toHaveBeenCalledWith('filename', '==', 'specific-file.pdf');
      });

      it('should return null when newsletter not found', async () => {
        mockGetDocs.mockResolvedValue({ docs: [] });

        const result = await firestoreService.findNewsletterIdByFilename('non-existent.pdf');

        expect(result).toBeNull();
      });
    });
  });

  describe('Authentication Integration', () => {
    it('should handle authenticated user operations', async () => {
      // Reset to authenticated user
      mockFirebaseAuthService.getCurrentUser.mockReturnValue(mockCurrentUser);

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

      await firestoreService.saveNewsletterMetadata(testMetadata);

      expect(mockSafeAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          createdBy: 'test-user-123',
          updatedBy: 'test-user-123'
        })
      );
    });

    it('should reject operations for unauthenticated users', async () => {
      // Mock unauthenticated state
      mockFirebaseAuthService.getCurrentUser.mockReturnValue(null as any);

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

      await expect(firestoreService.saveNewsletterMetadata(testMetadata))
        .rejects.toThrow('User must be authenticated');
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
        'getNewsletterMetadata',
        'updateNewsletterMetadata',
        'deleteNewsletterMetadata',
        'getAllNewsletterMetadata',
        'findNewsletterIdByFilename',
        'getApprovedContent',
        'getPublishedContent',
        'updateContentStatus',
        'subscribeToNewsletters'
      ];

      expectedMethods.forEach(method => {
        expect(firestoreService).toHaveProperty(method);
        expect(typeof firestoreService[method as keyof typeof firestoreService]).toBe('function');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle various Firebase error types', async () => {
      const permissionError = new Error('Permission denied');
      const networkError = new Error('Network unavailable');
      const quotaError = new Error('Quota exceeded');

      // Test different error scenarios
      for (const error of [permissionError, networkError, quotaError]) {
        mockGetDocs.mockRejectedValue(error);

        await expect(firestoreService.getAllNewsletterMetadata())
          .rejects.toThrow(error.message);
      }
    });

    it('should handle malformed data gracefully', async () => {
      const mockMalformedSnapshot = {
        docs: [
          {
            id: 'malformed-id',
            data: () => ({
              // Missing required fields
              title: null,
              publicationDate: 'invalid-date',
              fileSize: 'not-a-number'
            })
          }
        ]
      };

      mockGetDocs.mockResolvedValue(mockMalformedSnapshot);

      // Should not throw, but handle gracefully
      const result = await firestoreService.getAllNewsletterMetadata();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'malformed-id');
    });
  });
});
