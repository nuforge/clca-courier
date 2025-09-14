import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { contentSubmissionService } from '../../../src/services/content-submission.service';
import { ContentFeatures } from '../../../src/types/core/content.types';

// Mock Firebase modules
// Use global Firebase/Firestore mock from tests/setup.ts

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

describe('ContentSubmissionService - Refactored', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset auth mock to authenticated state
    const { getAuth } = await import('firebase/auth');
    vi.mocked(getAuth).mockReturnValue({
      currentUser: {
        uid: 'test-user-123',
        displayName: 'Test User',
        email: 'test@example.com'
      }
    } as any);
  });

  describe('createContent', () => {
    it('should create basic content with minimal data', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'content-123' });
      const mockCollection = vi.fn();

      // Mock firebase functions
      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);

      const contentId = await contentSubmissionService.createContent(
        'Test Article',
        'This is a test article',
        'article'
      );

      expect(contentId).toBe('content-123');
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined, // mocked collection
        expect.objectContaining({
          title: 'Test Article',
          description: 'This is a test article',
          authorId: 'test-user-123',
          authorName: 'Test User',
          tags: ['content-type:article'],
          features: {},
          status: 'published'
        })
      );
    });

    it('should create content with features and additional tags', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'event-456' });
      const mockCollection = vi.fn();

      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);

      const startDate = Timestamp.fromDate(new Date('2025-09-20T17:00:00Z'));
      const endDate = Timestamp.fromDate(new Date('2025-09-20T20:00:00Z'));

      const features: Partial<ContentFeatures> = {
        'feat:date': {
          start: startDate,
          end: endDate,
          isAllDay: false
        },
        'feat:location': {
          name: 'Community Center',
          address: '123 Main St'
        }
      };

      const contentId = await contentSubmissionService.createContent(
        'Community BBQ',
        'Annual summer BBQ event',
        'event',
        features,
        ['category:social', 'priority:high']
      );

      expect(contentId).toBe('event-456');
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          title: 'Community BBQ',
          description: 'Annual summer BBQ event',
          tags: ['content-type:event', 'category:social', 'priority:high'],
          features: features
        })
      );
    });

    it('should throw error when user is not authenticated', async () => {
      const { getAuth } = await import('firebase/auth');
      vi.mocked(getAuth).mockReturnValue({
        currentUser: null
      } as any);

      await expect(contentSubmissionService.createContent(
        'Test',
        'Test description',
        'article'
      )).rejects.toThrow('User must be authenticated to create content');
    });
  });

  describe('createEvent', () => {
    it('should create event with date feature', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'event-789' });
      const mockCollection = vi.fn();

      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);

      const startDate = Timestamp.fromDate(new Date('2025-09-25T14:00:00Z'));
      const endDate = Timestamp.fromDate(new Date('2025-09-25T16:00:00Z'));

      const eventId = await contentSubmissionService.createEvent(
        'Workshop',
        'Design workshop for residents',
        startDate,
        endDate,
        false
      );

      expect(eventId).toBe('event-789');
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          title: 'Workshop',
          description: 'Design workshop for residents',
          tags: ['content-type:event'],
          features: {
            'feat:date': {
              start: startDate,
              end: endDate,
              isAllDay: false
            }
          }
        })
      );
    });

    it('should create all-day event without end time', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'event-allday' });
      const mockCollection = vi.fn();

      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);

      const startDate = Timestamp.fromDate(new Date('2025-09-30T00:00:00Z'));

      const eventId = await contentSubmissionService.createEvent(
        'Community Day',
        'All-day community celebration',
        startDate,
        undefined,
        true
      );

      expect(eventId).toBe('event-allday');
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          features: {
            'feat:date': {
              start: startDate,
              isAllDay: true
            }
          }
        })
      );
    });
  });

  describe('createTask', () => {
    it('should create task with task feature', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'task-123' });
      const mockCollection = vi.fn();

      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);

      const taskId = await contentSubmissionService.createTask(
        'Print Flyers',
        'Need 50 flyers printed for event',
        'printing',
        50,
        'flyers'
      );

      expect(taskId).toBe('task-123');
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          title: 'Print Flyers',
          description: 'Need 50 flyers printed for event',
          tags: ['content-type:task'],
          features: {
            'feat:task': {
              category: 'printing',
              qty: 50,
              unit: 'flyers',
              status: 'unclaimed'
            }
          }
        })
      );
    });
  });

  describe('createLocationContent', () => {
    it('should create content with location feature', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'location-456' });
      const mockCollection = vi.fn();

      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);

      const contentId = await contentSubmissionService.createLocationContent(
        'New Restaurant',
        'Great new restaurant opened nearby',
        'announcement',
        '456 Lake Dr, Community, TX',
        'Lakeside Bistro'
      );

      expect(contentId).toBe('location-456');
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          features: {
            'feat:location': {
              name: 'Lakeside Bistro',
              address: '456 Lake Dr, Community, TX'
            }
          }
        })
      );
    });

    it('should create location content without name', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'location-789' });
      const mockCollection = vi.fn();

      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);

      const contentId = await contentSubmissionService.createLocationContent(
        'Street Closure',
        'Main Street will be closed for repairs',
        'announcement',
        'Main Street between 1st and 2nd Ave'
      );

      expect(contentId).toBe('location-789');
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          features: {
            'feat:location': {
              address: 'Main Street between 1st and 2nd Ave'
            }
          }
        })
      );
    });
  });

  describe('createCanvaContent', () => {
    it('should create content with Canva integration feature', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'canva-123' });
      const mockCollection = vi.fn();

      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);

      const contentId = await contentSubmissionService.createCanvaContent(
        'Newsletter Design',
        'Monthly newsletter design template',
        'newsletter',
        'canva-design-abc123',
        'https://canva.com/design/abc123/edit',
        'https://canva.com/design/abc123/export'
      );

      expect(contentId).toBe('canva-123');
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          features: {
            'integ:canva': {
              designId: 'canva-design-abc123',
              editUrl: 'https://canva.com/design/abc123/edit',
              exportUrl: 'https://canva.com/design/abc123/export'
            }
          }
        })
      );
    });

    it('should create Canva content without export URL', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'canva-456' });
      const mockCollection = vi.fn();

      const { addDoc, collection } = await import('firebase/firestore');
      vi.mocked(addDoc).mockImplementation(mockAddDoc);
      vi.mocked(collection).mockImplementation(mockCollection);

      const contentId = await contentSubmissionService.createCanvaContent(
        'Flyer Design',
        'Event flyer in progress',
        'flyer',
        'canva-design-def456',
        'https://canva.com/design/def456/edit'
      );

      expect(contentId).toBe('canva-456');
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          features: {
            'integ:canva': {
              designId: 'canva-design-def456',
              editUrl: 'https://canva.com/design/def456/edit'
            }
          }
        })
      );
    });
  });

  describe('validateContentData', () => {
    it('should validate valid content data', () => {
      const result = contentSubmissionService.validateContentData(
        'Valid Title',
        'Valid description content',
        {}
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject empty title', () => {
      const result = contentSubmissionService.validateContentData(
        '',
        'Valid description',
        {}
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required and cannot be empty');
    });

    it('should reject empty description', () => {
      const result = contentSubmissionService.validateContentData(
        'Valid Title',
        '',
        {}
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Description is required and cannot be empty');
    });

    it('should reject overly long title', () => {
      const longTitle = 'a'.repeat(201);
      const result = contentSubmissionService.validateContentData(
        longTitle,
        'Valid description',
        {}
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title cannot exceed 200 characters');
    });

    it('should validate date feature constraints', () => {
      const startDate = Timestamp.fromDate(new Date('2025-09-20T17:00:00Z'));
      const endDate = Timestamp.fromDate(new Date('2025-09-20T15:00:00Z')); // Before start

      const result = contentSubmissionService.validateContentData(
        'Valid Title',
        'Valid description',
        {
          'feat:date': {
            start: startDate,
            end: endDate,
            isAllDay: false
          }
        }
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event end time cannot be before start time');
    });

    it('should validate task feature constraints', () => {
      const result = contentSubmissionService.validateContentData(
        'Valid Title',
        'Valid description',
        {
          'feat:task': {
            category: '',
            qty: 0,
            unit: '',
            status: 'unclaimed'
          }
        }
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task feature requires a category');
      expect(result.errors).toContain('Task feature requires a positive quantity');
      expect(result.errors).toContain('Task feature requires a unit');
    });

    it('should validate location feature constraints', () => {
      const result = contentSubmissionService.validateContentData(
        'Valid Title',
        'Valid description',
        {
          'feat:location': {
            address: ''
          }
        }
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Location feature requires an address');
    });

    it('should validate Canva feature constraints', () => {
      const result = contentSubmissionService.validateContentData(
        'Valid Title',
        'Valid description',
        {
          'integ:canva': {
            designId: '',
            editUrl: ''
          }
        }
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Canva feature requires a design ID');
      expect(result.errors).toContain('Canva feature requires an edit URL');
    });
  });
});
