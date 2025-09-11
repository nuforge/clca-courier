import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { contentSubmissionService } from '../../../src/services/content-submission.service';
import { firebaseContentService } from '../../../src/services/firebase-content.service';
import type { ContentFeatures } from '../../../src/types/core/content.types';

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => ({ toMillis: () => Date.now() })),
  Timestamp: {
    now: vi.fn(() => ({ toMillis: () => Date.now() })),
    fromDate: vi.fn((date: Date) => ({
      toMillis: () => date.getTime(),
      toDate: () => date
    }))
  }
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: {
      uid: 'test-user-123',
      displayName: 'Test User',
      email: 'test@example.com'
    }
  }))
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

// Mock Firebase content service
vi.mock('../../../src/services/firebase-content.service', () => ({
  firebaseContentService: {
    createContent: vi.fn(),
    getPublishedContent: vi.fn(),
    updateContentStatus: vi.fn()
  }
}));

describe('ContentSubmissionService - Enhanced Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Enhanced Error Handling', () => {
    it('should validate content before creation', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'content-123' });
      const mockCollection = vi.fn();

      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);

      // Test with empty title (should fail validation)
      await expect(
        contentSubmissionService.createContent('', 'Valid description', 'article')
      ).rejects.toThrow('Content validation failed');

      // Test with empty description (should fail validation)
      await expect(
        contentSubmissionService.createContent('Valid title', '', 'article')
      ).rejects.toThrow('Content validation failed');

      // Test with empty content type (should fail validation)
      await expect(
        contentSubmissionService.createContent('Valid title', 'Valid description', '')
      ).rejects.toThrow('Content type is required');
    });

    it('should trim whitespace from inputs', async () => {
      // Mock the Firebase service createContent method
      const mockCreateContent = firebaseContentService.createContent as MockedFunction<typeof firebaseContentService.createContent>;
      mockCreateContent.mockResolvedValue('content-123');

      await contentSubmissionService.createContent(
        '  Test Article  ',
        '  This is a test article  ',
        '  article  '
      );

      expect(mockCreateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Article',
          description: 'This is a test article',
          tags: ['content-type:article']
        })
      );
    });

    it('should handle unauthenticated users', async () => {
      // Mock unauthenticated state
      const { getAuth } = await import('firebase/auth');
      vi.mocked(getAuth).mockReturnValue({
        currentUser: null
      } as any);

      await expect(
        contentSubmissionService.createContent('Test', 'Description', 'article')
      ).rejects.toThrow('User must be authenticated');
    });
  });

  describe('Batch Content Creation', () => {
    beforeEach(async () => {
      // Ensure authenticated state for batch tests
      const { getAuth } = await import('firebase/auth');
      vi.mocked(getAuth).mockReturnValue({
        currentUser: {
          uid: 'test-user-123',
          displayName: 'Test User',
          email: 'test@example.com'
        }
      } as any);
    });

    it('should create multiple content items in batch', async () => {
      const mockContentRequests = [
        {
          title: 'Content 1',
          description: 'Description 1',
          contentType: 'news',
          additionalTags: ['tag1'],
          features: {} as ContentFeatures
        },
        {
          title: 'Content 2',
          description: 'Description 2',
          contentType: 'event',
          additionalTags: ['tag2'],
          features: {} as ContentFeatures
        },
        {
          title: 'Content 3',
          description: 'Description 3',
          contentType: 'announcement',
          additionalTags: ['tag3'],
          features: {} as ContentFeatures
        }
      ];

      // Mock the Firebase service createContent method to return IDs
      const mockCreateContent = firebaseContentService.createContent as MockedFunction<typeof firebaseContentService.createContent>;
      mockCreateContent
        .mockResolvedValueOnce('content-1')
        .mockResolvedValueOnce('content-2')
        .mockResolvedValueOnce('content-3');

      const result = await contentSubmissionService.batchCreateContent(mockContentRequests);

      expect(result).toEqual(['content-1', 'content-2', 'content-3']);
      expect(mockCreateContent).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in batch creation', async () => {
      const mockContentRequests = [
        {
          title: 'Content 1',
          description: 'Description 1',
          contentType: 'news',
          additionalTags: ['tag1'],
          features: {} as ContentFeatures
        },
        {
          title: '', // Invalid - should fail validation
          description: 'Description 2',
          contentType: 'event',
          additionalTags: ['tag2'],
          features: {} as ContentFeatures
        },
        {
          title: 'Content 3',
          description: 'Description 3',
          contentType: 'announcement',
          additionalTags: ['tag3'],
          features: {} as ContentFeatures
        }
      ];

      // Mock the Firebase service createContent method
      const mockCreateContent = firebaseContentService.createContent as MockedFunction<typeof firebaseContentService.createContent>;
      mockCreateContent
        .mockResolvedValueOnce('content-1')
        .mockResolvedValueOnce('content-3');

      const result = await contentSubmissionService.batchCreateContent(mockContentRequests);

      // Should return IDs for successful creations only
      expect(result).toEqual(['content-1', 'content-3']);
      expect(mockCreateContent).toHaveBeenCalledTimes(2); // Only valid items
    });
  });

  describe('Content Statistics', () => {
    it('should generate content statistics', async () => {
      const mockContent = [
        {
          id: 'content-1',
          title: 'Article 1',
          description: 'Description 1',
          authorId: 'user-a',
          authorName: 'User A',
          tags: ['content-type:article'],
          features: {},
          status: 'published' as const,
          timestamps: {
            created: Timestamp.fromDate(new Date()),
            updated: Timestamp.fromDate(new Date())
          }
        },
        {
          id: 'content-2',
          title: 'Event 1',
          description: 'Description 2',
          authorId: 'user-b',
          authorName: 'User B',
          tags: ['content-type:event'],
          features: {},
          status: 'published' as const,
          timestamps: {
            created: Timestamp.fromDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)), // 8 days ago
            updated: Timestamp.fromDate(new Date())
          }
        }
      ];

      // Mock the Firebase service
      const mockGetPublishedContent = firebaseContentService.getPublishedContent as MockedFunction<typeof firebaseContentService.getPublishedContent>;
      mockGetPublishedContent.mockResolvedValue(mockContent);

      const stats = await contentSubmissionService.getContentStats();

      expect(stats.totalPublished).toBe(2);
      expect(stats.byType.article).toBe(1);
      expect(stats.byType.event).toBe(1);
      expect(stats.recent).toBe(1); // Only 1 item from the last week
    });
  });

  describe('Legacy Compatibility', () => {
    it('should create metadata templates', () => {
      const eventTemplate = contentSubmissionService.createMetadataTemplate('event');
      expect(eventTemplate).toHaveProperty('eventDate');

      const genericTemplate = contentSubmissionService.createMetadataTemplate('unknown');
      expect(Object.keys(genericTemplate)).toHaveLength(0);
    });

    it('should provide predefined categories', () => {
      const categories = contentSubmissionService.getPredefinedCategories();
      expect(categories).toContain('Community News');
      expect(categories).toContain('Events');
    });
  });
});
