import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('Content Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Content Creation', () => {
    it('should create and retrieve basic article content', async () => {
      // Mock Firebase operations
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'content-123' });
      const mockCollection = vi.fn();

      const mockDoc1 = {
        id: 'content-123',
        data: () => ({
          title: 'Test Article',
          description: 'This is a test article',
          authorId: 'test-user-123',
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

      const mockQuerySnapshot = { docs: [mockDoc1] };
      const mockGetDocs = vi.fn().mockResolvedValue(mockQuerySnapshot);
      const mockQuery = vi.fn();
      const mockWhere = vi.fn();
      const mockOrderBy = vi.fn();

      const { addDoc, collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);
      vi.mocked(getDocs).mockImplementation(mockGetDocs);
      vi.mocked(query).mockImplementation(mockQuery);
      vi.mocked(where).mockImplementation(mockWhere);
      vi.mocked(orderBy).mockImplementation(mockOrderBy);

      // Create content via submission service
      const contentId = await contentSubmissionService.createContent(
        'Test Article',
        'This is a test article',
        'article'
      );

      expect(contentId).toBe('content-123');

      // Retrieve content via Firebase service
      const publishedContent = await firebaseContentService.getPublishedContent();

      expect(publishedContent).toHaveLength(1);
      expect(publishedContent[0]).toMatchObject({
        id: 'content-123',
        title: 'Test Article',
        status: 'published',
        tags: ['content-type:article']
      });
    });

    it('should create and retrieve event with date feature', async () => {
      // Mock Firebase operations
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'event-456' });
      const mockCollection = vi.fn();

      const startDate = Timestamp.fromDate(new Date('2025-09-20T17:00:00Z'));
      const endDate = Timestamp.fromDate(new Date('2025-09-20T20:00:00Z'));

      const mockDoc1 = {
        id: 'event-456',
        data: () => ({
          title: 'Community BBQ',
          description: 'Join us for a summer BBQ',
          authorId: 'test-user-123',
          authorName: 'Test User',
          tags: ['content-type:event'],
          features: {
            'feat:date': {
              start: startDate,
              end: endDate,
              isAllDay: false
            }
          },
          status: 'published',
          timestamps: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
            published: Timestamp.now()
          }
        })
      };

      const mockQuerySnapshot = { docs: [mockDoc1] };
      const mockGetDocs = vi.fn().mockResolvedValue(mockQuerySnapshot);
      const mockQuery = vi.fn();
      const mockWhere = vi.fn();
      const mockOrderBy = vi.fn();

      const { addDoc, collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);
      vi.mocked(getDocs).mockImplementation(mockGetDocs);
      vi.mocked(query).mockImplementation(mockQuery);
      vi.mocked(where).mockImplementation(mockWhere);
      vi.mocked(orderBy).mockImplementation(mockOrderBy);

      // Create event via submission service
      const eventId = await contentSubmissionService.createEvent(
        'Community BBQ',
        'Join us for a summer BBQ',
        startDate,
        endDate,
        false
      );

      expect(eventId).toBe('event-456');

      // Retrieve content via Firebase service
      const publishedContent = await firebaseContentService.getPublishedContent();
      const event = publishedContent[0];

      expect(event).toMatchObject({
        id: 'event-456',
        title: 'Community BBQ',
        tags: ['content-type:event']
      });

      expect(event.features['feat:date']).toBeDefined();
      expect(event.features['feat:date']?.isAllDay).toBe(false);
    });

    it('should create and retrieve task with task feature', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'task-789' });
      const mockCollection = vi.fn();

      const mockDoc1 = {
        id: 'task-789',
        data: () => ({
          title: 'Volunteer Setup Help',
          description: 'Need help setting up for the event',
          authorId: 'test-user-123',
          authorName: 'Test User',
          tags: ['content-type:task'],
          features: {
            'feat:task': {
              category: 'setup',
              qty: 3,
              unit: 'people',
              status: 'unclaimed'
            }
          },
          status: 'published',
          timestamps: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
            published: Timestamp.now()
          }
        })
      };

      const mockQuerySnapshot = { docs: [mockDoc1] };
      const mockGetDocs = vi.fn().mockResolvedValue(mockQuerySnapshot);
      const mockQuery = vi.fn();
      const mockWhere = vi.fn();
      const mockOrderBy = vi.fn();

      const { addDoc, collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);
      vi.mocked(getDocs).mockImplementation(mockGetDocs);
      vi.mocked(query).mockImplementation(mockQuery);
      vi.mocked(where).mockImplementation(mockWhere);
      vi.mocked(orderBy).mockImplementation(mockOrderBy);

      // Create task via submission service
      const taskId = await contentSubmissionService.createTask(
        'Volunteer Setup Help',
        'Need help setting up for the event',
        'setup',
        3,
        'people'
      );

      expect(taskId).toBe('task-789');

      // Retrieve content via Firebase service
      const publishedContent = await firebaseContentService.getPublishedContent();
      const task = publishedContent[0];

      expect(task).toMatchObject({
        id: 'task-789',
        title: 'Volunteer Setup Help',
        tags: ['content-type:task']
      });

      expect(task.features['feat:task']).toBeDefined();
      expect(task.features['feat:task']?.category).toBe('setup');
      expect(task.features['feat:task']?.qty).toBe(3);
      expect(task.features['feat:task']?.status).toBe('unclaimed');
    });

    it('should create content with multiple features', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'multi-123' });
      const mockCollection = vi.fn();

      const startDate = Timestamp.fromDate(new Date('2025-09-25T10:00:00Z'));

      const features: Partial<ContentFeatures> = {
        'feat:date': {
          start: startDate,
          isAllDay: false
        },
        'feat:location': {
          name: 'Community Center',
          address: '123 Main St, Community, TX 75001'
        },
        'feat:task': {
          category: 'cleanup',
          qty: 5,
          unit: 'volunteers',
          status: 'unclaimed'
        }
      };

      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);

      // Create content with multiple features
      const contentId = await contentSubmissionService.createContent(
        'Multi-Feature Event',
        'An event with date, location, and task features',
        'event',
        features,
        ['priority:high', 'category:volunteer']
      );

      expect(contentId).toBe('multi-123');

      // Verify the content was created with all features
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined, // mocked collection
        expect.objectContaining({
          title: 'Multi-Feature Event',
          tags: ['content-type:event', 'priority:high', 'category:volunteer'],
          features: expect.objectContaining({
            'feat:date': expect.objectContaining({
              start: startDate,
              isAllDay: false
            }),
            'feat:location': expect.objectContaining({
              name: 'Community Center',
              address: '123 Main St, Community, TX 75001'
            }),
            'feat:task': expect.objectContaining({
              category: 'cleanup',
              qty: 5,
              unit: 'volunteers',
              status: 'unclaimed'
            })
          })
        })
      );
    });
  });

  describe('Content Filtering and Querying', () => {
    it('should filter content by author', async () => {
      const mockDoc1 = {
        id: 'content-1',
        data: () => ({
          title: 'Author Article',
          authorId: 'test-user-123',
          tags: ['content-type:article'],
          features: {},
          status: 'published',
          timestamps: { created: Timestamp.now(), updated: Timestamp.now() }
        })
      };

      const mockQuerySnapshot = { docs: [mockDoc1] };
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

      const authorContent = await firebaseContentService.getContentByAuthor('test-user-123');

      expect(authorContent).toHaveLength(1);
      expect(authorContent[0].authorId).toBe('test-user-123');
    });

    it('should filter content by tag', async () => {
      const mockDoc1 = {
        id: 'content-1',
        data: () => ({
          title: 'Tagged Article',
          tags: ['content-type:article', 'category:news'],
          features: {},
          status: 'published',
          timestamps: { created: Timestamp.now(), updated: Timestamp.now() }
        })
      };

      const mockQuerySnapshot = { docs: [mockDoc1] };
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

      const taggedContent = await firebaseContentService.getContentByTag('category:news');

      expect(taggedContent).toHaveLength(1);
      expect(taggedContent[0].tags).toContain('category:news');
    });
  });

  describe('Content Validation', () => {
    it('should validate content before creation', () => {
      const features: Partial<ContentFeatures> = {
        'feat:date': {
          start: Timestamp.fromDate(new Date('2025-09-20T17:00:00Z')),
          end: Timestamp.fromDate(new Date('2025-09-20T20:00:00Z')),
          isAllDay: false
        }
      };

      const validation = contentSubmissionService.validateContentData(
        'Valid Title',
        'Valid description',
        features
      );

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid content', () => {
      const validation = contentSubmissionService.validateContentData(
        '', // empty title
        '', // empty description
        {}
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Title is required and cannot be empty');
      expect(validation.errors).toContain('Description is required and cannot be empty');
    });
  });
});
