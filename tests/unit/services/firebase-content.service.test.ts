import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { firebaseContentService } from '../../../src/services/firebase-content.service';
import type { ContentDoc } from '../../../src/types/core/content.types';

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ toMillis: () => Date.now() })),
  Timestamp: {
    now: vi.fn(() => ({ toMillis: () => Date.now() })),
    fromDate: vi.fn((date: Date) => ({
      toMillis: () => date.getTime(),
      toDate: () => date
    }))
  }
}));

vi.mock('../../../src/config/firebase.config', () => ({
  firestore: {}
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('FirebaseContentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createContent', () => {
    it('should create content successfully', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'content-123' });
      const mockCollection = vi.fn();

      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);

      const contentData: Omit<ContentDoc, 'id'> = {
        title: 'Test Content',
        description: 'Test description',
        authorId: 'user-123',
        authorName: 'Test User',
        tags: ['content-type:article'],
        features: {},
        status: 'published',
        timestamps: {
          created: Timestamp.now(),
          updated: Timestamp.now()
        }
      };

      const contentId = await firebaseContentService.createContent(contentData);

      expect(contentId).toBe('content-123');
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined, // mocked collection
        expect.objectContaining({
          title: 'Test Content',
          description: 'Test description',
          authorId: 'user-123',
          authorName: 'Test User',
          tags: ['content-type:article'],
          features: {},
          status: 'published'
        })
      );
    });

    it('should handle creation errors', async () => {
      const mockAddDoc = vi.fn().mockRejectedValue(new Error('Firebase error'));
      const mockCollection = vi.fn();

      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);

      const contentData: Omit<ContentDoc, 'id'> = {
        title: 'Test Content',
        description: 'Test description',
        authorId: 'user-123',
        authorName: 'Test User',
        tags: ['content-type:article'],
        features: {},
        status: 'published',
        timestamps: {
          created: Timestamp.now(),
          updated: Timestamp.now()
        }
      };

      await expect(firebaseContentService.createContent(contentData)).rejects.toThrow('Firebase error');
    });
  });

  describe('getPublishedContent', () => {
    it('should fetch published content successfully', async () => {
      const mockDoc1 = {
        id: 'content-1',
        data: () => ({
          title: 'Published Article',
          description: 'Article description',
          authorId: 'user-123',
          authorName: 'Test User',
          tags: ['content-type:article'],
          features: {},
          status: 'published',
          timestamps: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
            published: Timestamp.now()
          }
        })
      };

      const mockQuerySnapshot = {
        docs: [mockDoc1]
      };

      const mockGetDocs = vi.fn().mockResolvedValue(mockQuerySnapshot);
      const mockCollection = vi.fn();
      const mockQuery = vi.fn();
      const mockWhere = vi.fn();
      const mockOrderBy = vi.fn();

      const { getDocs, collection, query, where, orderBy } = await import('firebase/firestore');
      vi.mocked(getDocs).mockImplementation(mockGetDocs);
      vi.mocked(collection).mockImplementation(mockCollection);
      vi.mocked(query).mockImplementation(mockQuery);
      vi.mocked(where).mockImplementation(mockWhere);
      vi.mocked(orderBy).mockImplementation(mockOrderBy);

      const content = await firebaseContentService.getPublishedContent();

      expect(content).toHaveLength(1);
      expect(content[0]).toMatchObject({
        id: 'content-1',
        title: 'Published Article',
        status: 'published'
      });
    });

    it('should handle fetch errors', async () => {
      const mockGetDocs = vi.fn().mockRejectedValue(new Error('Fetch error'));
      const mockCollection = vi.fn();
      const mockQuery = vi.fn();
      const mockWhere = vi.fn();
      const mockOrderBy = vi.fn();

      const { getDocs, collection, query, where, orderBy } = await import('firebase/firestore');
      vi.mocked(getDocs).mockImplementation(mockGetDocs);
      vi.mocked(collection).mockImplementation(mockCollection);
      vi.mocked(query).mockImplementation(mockQuery);
      vi.mocked(where).mockImplementation(mockWhere);
      vi.mocked(orderBy).mockImplementation(mockOrderBy);

      await expect(firebaseContentService.getPublishedContent()).rejects.toThrow('Fetch error');
    });
  });

  describe('getContentByAuthor', () => {
    it('should fetch content by author successfully', async () => {
      const mockDoc1 = {
        id: 'content-1',
        data: () => ({
          title: 'Author Article',
          description: 'Article description',
          authorId: 'user-123',
          authorName: 'Test User',
          tags: ['content-type:article'],
          features: {},
          status: 'published',
          timestamps: {
            created: Timestamp.now(),
            updated: Timestamp.now()
          }
        })
      };

      const mockQuerySnapshot = {
        docs: [mockDoc1]
      };

      const mockGetDocs = vi.fn().mockResolvedValue(mockQuerySnapshot);
      const mockCollection = vi.fn();
      const mockQuery = vi.fn();
      const mockWhere = vi.fn();
      const mockOrderBy = vi.fn();

      const { getDocs, collection, query, where, orderBy } = await import('firebase/firestore');
      vi.mocked(getDocs).mockImplementation(mockGetDocs);
      vi.mocked(collection).mockImplementation(mockCollection);
      vi.mocked(query).mockImplementation(mockQuery);
      vi.mocked(where).mockImplementation(mockWhere);
      vi.mocked(orderBy).mockImplementation(mockOrderBy);

      const content = await firebaseContentService.getContentByAuthor('user-123');

      expect(content).toHaveLength(1);
      expect(content[0]).toMatchObject({
        id: 'content-1',
        authorId: 'user-123'
      });
    });
  });

  describe('getContentByTag', () => {
    it('should fetch content by tag successfully', async () => {
      const mockDoc1 = {
        id: 'content-1',
        data: () => ({
          title: 'Tagged Article',
          description: 'Article description',
          authorId: 'user-123',
          authorName: 'Test User',
          tags: ['content-type:article', 'category:news'],
          features: {},
          status: 'published',
          timestamps: {
            created: Timestamp.now(),
            updated: Timestamp.now()
          }
        })
      };

      const mockQuerySnapshot = {
        docs: [mockDoc1]
      };

      const mockGetDocs = vi.fn().mockResolvedValue(mockQuerySnapshot);
      const mockCollection = vi.fn();
      const mockQuery = vi.fn();
      const mockWhere = vi.fn();
      const mockOrderBy = vi.fn();

      const { getDocs, collection, query, where, orderBy } = await import('firebase/firestore');
      vi.mocked(getDocs).mockImplementation(mockGetDocs);
      vi.mocked(collection).mockImplementation(mockCollection);
      vi.mocked(query).mockImplementation(mockQuery);
      vi.mocked(where).mockImplementation(mockWhere);
      vi.mocked(orderBy).mockImplementation(mockOrderBy);

      const content = await firebaseContentService.getContentByTag('category:news');

      expect(content).toHaveLength(1);
      expect(content[0].tags).toContain('category:news');
    });
  });

  describe('updateContentStatus', () => {
    it('should update content status successfully', async () => {
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn();

      const { updateDoc, doc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockImplementation(mockUpdateDoc);
      vi.mocked(doc).mockImplementation(mockDoc);

      await firebaseContentService.updateContentStatus('content-123', 'published');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        undefined, // mocked doc
        expect.objectContaining({
          status: 'published'
        })
      );
    });

    it('should add published timestamp when status changes to published', async () => {
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn();

      const { updateDoc, doc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockImplementation(mockUpdateDoc);
      vi.mocked(doc).mockImplementation(mockDoc);

      await firebaseContentService.updateContentStatus('content-123', 'published');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        undefined, // mocked doc
        expect.objectContaining({
          status: 'published',
          timestamps: expect.objectContaining({
            published: expect.any(Object)
          })
        })
      );
    });
  });

  describe('subscribeToPublishedContent', () => {
    it('should set up real-time subscription', async () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      const mockOnSnapshot = vi.fn().mockReturnValue(mockUnsubscribe);
      const mockCollection = vi.fn();
      const mockQuery = vi.fn();
      const mockWhere = vi.fn();
      const mockOrderBy = vi.fn();

      const { onSnapshot, collection, query, where, orderBy } = await import('firebase/firestore');
      vi.mocked(onSnapshot).mockImplementation(mockOnSnapshot);
      vi.mocked(collection).mockImplementation(mockCollection);
      vi.mocked(query).mockImplementation(mockQuery);
      vi.mocked(where).mockImplementation(mockWhere);
      vi.mocked(orderBy).mockImplementation(mockOrderBy);

      const unsubscribe = firebaseContentService.subscribeToPublishedContent(mockCallback);

      expect(unsubscribe).toBe(mockUnsubscribe);
      expect(mockOnSnapshot).toHaveBeenCalled();
    });
  });

  describe('deleteContent', () => {
    it('should delete content successfully', async () => {
      const mockDeleteDoc = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn();

      const { deleteDoc, doc } = await import('firebase/firestore');
      vi.mocked(deleteDoc).mockImplementation(mockDeleteDoc);
      vi.mocked(doc).mockImplementation(mockDoc);

      await firebaseContentService.deleteContent('content-123');

      expect(mockDeleteDoc).toHaveBeenCalledWith(undefined); // mocked doc
    });

    it('should handle deletion errors', async () => {
      const mockDeleteDoc = vi.fn().mockRejectedValue(new Error('Delete error'));
      const mockDoc = vi.fn();

      const { deleteDoc, doc } = await import('firebase/firestore');
      vi.mocked(deleteDoc).mockImplementation(mockDeleteDoc);
      vi.mocked(doc).mockImplementation(mockDoc);

      await expect(firebaseContentService.deleteContent('content-123')).rejects.toThrow('Delete error');
    });
  });
});
