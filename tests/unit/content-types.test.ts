import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Timestamp, GeoPoint } from 'firebase/firestore';
import {
  contentUtils,
  isContentDoc,
  createContentDoc,
  type ContentDoc,
  type ContentFeatures
} from '../../src/types/core/content.types';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000
    })),
    now: vi.fn(() => ({
      toDate: () => new Date(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0
    }))
  },
  GeoPoint: vi.fn((lat: number, lng: number) => ({
    latitude: lat,
    longitude: lng
  }))
}));

describe('contentUtils', () => {
  let mockContentDoc: ContentDoc;

  beforeEach(() => {
    // Create a comprehensive mock ContentDoc for testing
    mockContentDoc = {
      id: 'test-content-123',
      title: 'Test Community Event',
      description: 'A test event for the community with multiple features',
      authorId: 'user-456',
      authorName: 'John Doe',
      tags: [
        'content-type:event',
        'category:community',
        'category:urgent',
        'priority:high',
        'location:clubhouse'
      ],
      features: {
        'feat:date': {
          start: Timestamp.fromDate(new Date('2025-09-15T14:00:00Z')),
          end: Timestamp.fromDate(new Date('2025-09-15T16:00:00Z')),
          isAllDay: false
        },
        'feat:location': {
          name: 'Community Clubhouse',
          address: '123 Lake Circle Dr, Lake Community, TX 75001',
          geo: new GeoPoint(32.7767, -96.7970)
        },
        'feat:task': {
          category: 'setup',
          qty: 5,
          unit: 'volunteers',
          status: 'unclaimed'
        }
      },
      status: 'published',
      timestamps: {
        created: Timestamp.fromDate(new Date('2025-09-10T10:00:00Z')),
        updated: Timestamp.fromDate(new Date('2025-09-11T12:00:00Z')),
        published: Timestamp.fromDate(new Date('2025-09-11T12:30:00Z'))
      }
    };
  });

  describe('hasFeature', () => {
    it('should return true and narrow type for existing features', () => {
      // Test date feature
      if (contentUtils.hasFeature(mockContentDoc, 'feat:date')) {
        // TypeScript should know that feat:date is defined
        expect(mockContentDoc.features['feat:date'].start).toBeDefined();
        expect(mockContentDoc.features['feat:date'].isAllDay).toBe(false);
      } else {
        throw new Error('Expected feat:date to exist');
      }

      // Test location feature
      if (contentUtils.hasFeature(mockContentDoc, 'feat:location')) {
        expect(mockContentDoc.features['feat:location'].address).toBe('123 Lake Circle Dr, Lake Community, TX 75001');
        expect(mockContentDoc.features['feat:location'].name).toBe('Community Clubhouse');
      } else {
        throw new Error('Expected feat:location to exist');
      }

      // Test task feature
      if (contentUtils.hasFeature(mockContentDoc, 'feat:task')) {
        expect(mockContentDoc.features['feat:task'].status).toBe('unclaimed');
        expect(mockContentDoc.features['feat:task'].qty).toBe(5);
      } else {
        throw new Error('Expected feat:task to exist');
      }
    });

    it('should return false for non-existing features', () => {
      expect(contentUtils.hasFeature(mockContentDoc, 'integ:canva')).toBe(false);
    });

    it('should work with empty features object', () => {
      const emptyDoc: ContentDoc = {
        ...mockContentDoc,
        features: {}
      };

      expect(contentUtils.hasFeature(emptyDoc, 'feat:date')).toBe(false);
      expect(contentUtils.hasFeature(emptyDoc, 'feat:location')).toBe(false);
      expect(contentUtils.hasFeature(emptyDoc, 'feat:task')).toBe(false);
      expect(contentUtils.hasFeature(emptyDoc, 'integ:canva')).toBe(false);
    });
  });

  describe('getFeature', () => {
    it('should return feature data for existing features', () => {
      const dateFeature = contentUtils.getFeature(mockContentDoc, 'feat:date');
      expect(dateFeature).toBeDefined();
      expect(dateFeature?.isAllDay).toBe(false);

      const locationFeature = contentUtils.getFeature(mockContentDoc, 'feat:location');
      expect(locationFeature).toBeDefined();
      expect(locationFeature?.name).toBe('Community Clubhouse');

      const taskFeature = contentUtils.getFeature(mockContentDoc, 'feat:task');
      expect(taskFeature).toBeDefined();
      expect(taskFeature?.category).toBe('setup');
    });

    it('should return undefined for non-existing features', () => {
      const canvaFeature = contentUtils.getFeature(mockContentDoc, 'integ:canva');
      expect(canvaFeature).toBeUndefined();
    });
  });

  describe('getContentType', () => {
    it('should extract content type from tags', () => {
      const contentType = contentUtils.getContentType(mockContentDoc);
      expect(contentType).toBe('event');
    });

    it('should return undefined when no content-type tag exists', () => {
      const docWithoutType: ContentDoc = {
        ...mockContentDoc,
        tags: ['category:community', 'priority:high']
      };

      const contentType = contentUtils.getContentType(docWithoutType);
      expect(contentType).toBeUndefined();
    });

    it('should handle multiple content-type tags and return the first one', () => {
      const docWithMultipleTypes: ContentDoc = {
        ...mockContentDoc,
        tags: ['content-type:event', 'content-type:announcement', 'category:community']
      };

      const contentType = contentUtils.getContentType(docWithMultipleTypes);
      expect(contentType).toBe('event');
    });
  });

  describe('getTagsByNamespace', () => {
    it('should return all tags for a specific namespace', () => {
      const categories = contentUtils.getTagsByNamespace(mockContentDoc, 'category');
      expect(categories).toEqual(['community', 'urgent']);

      const priorities = contentUtils.getTagsByNamespace(mockContentDoc, 'priority');
      expect(priorities).toEqual(['high']);

      const locations = contentUtils.getTagsByNamespace(mockContentDoc, 'location');
      expect(locations).toEqual(['clubhouse']);
    });

    it('should return empty array for non-existing namespace', () => {
      const nonExistent = contentUtils.getTagsByNamespace(mockContentDoc, 'nonexistent');
      expect(nonExistent).toEqual([]);
    });

    it('should handle empty tags array', () => {
      const emptyDoc: ContentDoc = {
        ...mockContentDoc,
        tags: []
      };

      const categories = contentUtils.getTagsByNamespace(emptyDoc, 'category');
      expect(categories).toEqual([]);
    });
  });

  describe('hasTag', () => {
    it('should return true for existing tags', () => {
      expect(contentUtils.hasTag(mockContentDoc, 'content-type:event')).toBe(true);
      expect(contentUtils.hasTag(mockContentDoc, 'category:community')).toBe(true);
      expect(contentUtils.hasTag(mockContentDoc, 'priority:high')).toBe(true);
    });

    it('should return false for non-existing tags', () => {
      expect(contentUtils.hasTag(mockContentDoc, 'content-type:article')).toBe(false);
      expect(contentUtils.hasTag(mockContentDoc, 'category:private')).toBe(false);
      expect(contentUtils.hasTag(mockContentDoc, 'priority:low')).toBe(false);
    });

    it('should handle empty tags array', () => {
      const emptyDoc: ContentDoc = {
        ...mockContentDoc,
        tags: []
      };

      expect(contentUtils.hasTag(emptyDoc, 'content-type:event')).toBe(false);
    });
  });
});

describe('isContentDoc', () => {
  it('should return true for valid ContentDoc objects', () => {
    const validDoc: ContentDoc = {
      id: 'test-123',
      title: 'Test Title',
      description: 'Test Description',
      authorId: 'author-456',
      authorName: 'Test Author',
      tags: ['content-type:test'],
      features: {},
      status: 'draft',
      timestamps: {
        created: Timestamp.now(),
        updated: Timestamp.now()
      }
    };

    expect(isContentDoc(validDoc)).toBe(true);
  });

  it('should return false for invalid objects', () => {
    expect(isContentDoc(null)).toBe(false);
    expect(isContentDoc(undefined)).toBe(false);
    expect(isContentDoc('string')).toBe(false);
    expect(isContentDoc(123)).toBe(false);
    expect(isContentDoc([])).toBe(false);
  });

  it('should return false for objects missing required properties', () => {
    const missingId = {
      title: 'Test',
      description: 'Test',
      authorId: 'author',
      authorName: 'Author',
      tags: [],
      features: {},
      status: 'draft',
      timestamps: {}
    };

    expect(isContentDoc(missingId)).toBe(false);

    const invalidTags = {
      id: 'test',
      title: 'Test',
      description: 'Test',
      authorId: 'author',
      authorName: 'Author',
      tags: [123], // Invalid: should be strings
      features: {},
      status: 'draft',
      timestamps: {}
    };

    expect(isContentDoc(invalidTags)).toBe(false);

    const invalidStatus = {
      id: 'test',
      title: 'Test',
      description: 'Test',
      authorId: 'author',
      authorName: 'Author',
      tags: [],
      features: {},
      status: 'invalid-status',
      timestamps: {}
    };

    expect(isContentDoc(invalidStatus)).toBe(false);
  });
});

describe('createContentDoc', () => {
  it('should create a valid ContentDoc with required fields', () => {
    const partialData = {
      title: 'New Content',
      description: 'This is new content',
      authorId: 'user-789',
      authorName: 'Jane Smith'
    };

    const result = createContentDoc(partialData);

    expect(result.title).toBe('New Content');
    expect(result.description).toBe('This is new content');
    expect(result.authorId).toBe('user-789');
    expect(result.authorName).toBe('Jane Smith');
    expect(result.tags).toEqual([]);
    expect(result.features).toEqual({});
    expect(result.status).toBe('draft');
    expect(result.timestamps.created).toHaveProperty('seconds');
    expect(result.timestamps.created).toHaveProperty('nanoseconds');
    expect(result.timestamps.updated).toHaveProperty('seconds');
    expect(result.timestamps.updated).toHaveProperty('nanoseconds');
    expect(result.timestamps.published).toBeUndefined();
  });

  it('should merge provided optional fields', () => {
    const partialData = {
      title: 'Event Content',
      description: 'Community event description',
      authorId: 'user-123',
      authorName: 'Event Organizer',
      tags: ['content-type:event', 'category:community'],
      features: {
        'feat:date': {
          start: Timestamp.now(),
          isAllDay: true
        }
      } as ContentFeatures,
      status: 'published' as const
    };

    const result = createContentDoc(partialData);

    expect(result.tags).toEqual(['content-type:event', 'category:community']);
    expect(result.features['feat:date']).toBeDefined();
    expect(result.status).toBe('published');
  });

  it('should handle published timestamp correctly', () => {
    const publishedTime = Timestamp.now();
    const createdTime = Timestamp.fromDate(new Date('2025-09-10T10:00:00Z'));
    const updatedTime = Timestamp.fromDate(new Date('2025-09-11T11:00:00Z'));

    const partialData = {
      title: 'Published Content',
      description: 'This content is published',
      authorId: 'user-456',
      authorName: 'Publisher',
      timestamps: {
        created: createdTime,
        updated: updatedTime,
        published: publishedTime
      }
    };

    const result = createContentDoc(partialData);

    expect(result.timestamps.published).toBe(publishedTime);
    // Should use provided timestamps, not generate new ones
    expect(result.timestamps.created).toBe(createdTime);
    expect(result.timestamps.updated).toBe(updatedTime);
  });

  it('should not include undefined published timestamp', () => {
    const partialData = {
      title: 'Draft Content',
      description: 'This is draft content',
      authorId: 'user-789',
      authorName: 'Author'
    };

    const result = createContentDoc(partialData);

    expect('published' in result.timestamps).toBe(false);
  });
});

describe('Feature Integration Tests', () => {
  it('should handle content with all feature types', () => {
    const fullFeaturedDoc: ContentDoc = {
      id: 'full-featured-123',
      title: 'Community Design Workshop',
      description: 'A workshop where we design flyers together',
      authorId: 'organizer-456',
      authorName: 'Workshop Organizer',
      tags: ['content-type:workshop', 'category:design', 'priority:high'],
      features: {
        'feat:date': {
          start: Timestamp.fromDate(new Date('2025-09-20T10:00:00Z')),
          end: Timestamp.fromDate(new Date('2025-09-20T15:00:00Z')),
          isAllDay: false
        },
        'feat:location': {
          name: 'Design Lab',
          address: '456 Creative Blvd, Art District, TX 75002'
        },
        'feat:task': {
          category: 'preparation',
          qty: 10,
          unit: 'design templates',
          status: 'claimed',
          claimedBy: 'volunteer-789'
        },
        'integ:canva': {
          designId: 'canva-design-abc123',
          editUrl: 'https://canva.com/design/abc123/edit',
          exportUrl: 'https://canva.com/design/abc123/export'
        }
      },
      status: 'published',
      timestamps: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
        published: Timestamp.now()
      }
    };

    // Test all feature detection
    expect(contentUtils.hasFeature(fullFeaturedDoc, 'feat:date')).toBe(true);
    expect(contentUtils.hasFeature(fullFeaturedDoc, 'feat:location')).toBe(true);
    expect(contentUtils.hasFeature(fullFeaturedDoc, 'feat:task')).toBe(true);
    expect(contentUtils.hasFeature(fullFeaturedDoc, 'integ:canva')).toBe(true);

    // Test feature data access
    const canvaFeature = contentUtils.getFeature(fullFeaturedDoc, 'integ:canva');
    expect(canvaFeature?.designId).toBe('canva-design-abc123');

    const taskFeature = contentUtils.getFeature(fullFeaturedDoc, 'feat:task');
    expect(taskFeature?.status).toBe('claimed');
    expect(taskFeature?.claimedBy).toBe('volunteer-789');

    // Test content type extraction
    expect(contentUtils.getContentType(fullFeaturedDoc)).toBe('workshop');

    // Test tag namespace filtering
    expect(contentUtils.getTagsByNamespace(fullFeaturedDoc, 'category')).toEqual(['design']);
    expect(contentUtils.getTagsByNamespace(fullFeaturedDoc, 'priority')).toEqual(['high']);
  });
});
