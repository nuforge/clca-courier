/**
 * Mock Data for Testing
 * Provides consistent, realistic test data that prevents static code patterns
 */

import type { NewsletterMetadata } from '../../src/services/firebase-firestore.service';
import type { ContentDoc, ContentFeatures } from '../../src/types/core/content.types';
import type { UserContent } from '../../src/services/firebase-firestore.service';

// Newsletter Test Data - Based on Real Patterns
export const mockNewsletterData = {
  valid: {
    id: 'newsletter-2024-08-001',
    filename: '2024-08-newsletter.pdf',
    title: 'August 2024 Community Newsletter',
    description: 'Monthly community updates, upcoming events, and important announcements for Conashaugh Lakes residents.',
    publicationDate: '2024-08-01',
    issueNumber: '08-2024',
    season: 'summer' as const,
    year: 2024,
    month: 8,
    fileSize: 2048576, // 2MB
    pageCount: 12,
    displayDate: 'August 2024',
    sortValue: 202408,
    downloadUrl: 'https://firebasestorage.googleapis.com/v0/b/test-project/o/newsletters%2F2024-08-newsletter.pdf?alt=media',
    storageRef: 'newsletters/2024-08-newsletter.pdf',
    thumbnailUrl: 'https://firebasestorage.googleapis.com/v0/b/test-project/o/thumbnails%2F2024-08-newsletter.jpg?alt=media',
    tags: ['community', 'events', 'announcements', 'summer'],
    featured: true,
    isPublished: true,
    createdAt: '2024-08-01T10:00:00.000Z',
    updatedAt: '2024-08-01T15:30:00.000Z',
    createdBy: 'admin-user-123',
    updatedBy: 'admin-user-123',
    searchableText: 'Community events this month include the annual summer picnic on August 15th at the lakefront pavilion. The community board meeting will be held on August 22nd at 7 PM in the clubhouse. Maintenance updates: The dock repairs have been completed and swimming areas are now fully operational.',
    actions: {
      canView: true,
      canDownload: true,
      canSearch: true,
      hasThumbnail: true
    }
  } as NewsletterMetadata,

  // Newsletter with different patterns for testing edge cases
  minimal: {
    id: 'newsletter-2024-07-001',
    filename: '2024-07-newsletter.pdf',
    title: 'July 2024 Update',
    publicationDate: '2024-07-15',
    year: 2024,
    month: 7,
    fileSize: 1024000,
    downloadUrl: 'https://firebasestorage.googleapis.com/test.pdf',
    storageRef: 'newsletters/2024-07-newsletter.pdf',
    tags: [],
    featured: false,
    isPublished: true,
    createdAt: '2024-07-15T12:00:00.000Z',
    updatedAt: '2024-07-15T12:00:00.000Z',
    createdBy: 'user-456',
    updatedBy: 'user-456',
    actions: {
      canView: true,
      canDownload: true,
      canSearch: false,
      hasThumbnail: false
    }
  } as NewsletterMetadata,

  // Unpublished newsletter for testing access control
  unpublished: {
    id: 'newsletter-2024-09-draft',
    filename: '2024-09-newsletter-draft.pdf',
    title: 'September 2024 Newsletter (DRAFT)',
    publicationDate: '2024-09-01',
    year: 2024,
    month: 9,
    fileSize: 1536000,
    downloadUrl: 'https://firebasestorage.googleapis.com/draft.pdf',
    storageRef: 'drafts/2024-09-newsletter-draft.pdf',
    tags: ['draft'],
    featured: false,
    isPublished: false, // Key difference
    createdAt: '2024-08-25T09:00:00.000Z',
    updatedAt: '2024-08-25T14:20:00.000Z',
    createdBy: 'editor-789',
    updatedBy: 'editor-789',
    actions: {
      canView: false,
      canDownload: false,
      canSearch: false,
      hasThumbnail: false
    }
  } as NewsletterMetadata
};

// User Content Test Data
export const mockUserContentData = {
  pendingArticle: {
    id: 'content-001',
    type: 'article' as const,
    title: 'New Playground Equipment Installation',
    content: 'The community board is pleased to announce the installation of new playground equipment at the lakefront park. The project will begin on September 15th and is expected to be completed by October 1st. During this time, the playground area will be temporarily closed for safety reasons.',
    authorId: 'user-123',
    authorName: 'Jane Smith',
    authorEmail: 'jane.smith@example.com',
    submissionDate: '2024-08-20T14:30:00.000Z',
    status: 'pending' as const,
    tags: ['playground', 'community', 'safety'],
    attachments: [],
    metadata: {
      submissionSource: 'web' as const
    }
  } as UserContent,

  approvedEvent: {
    id: 'content-002',
    type: 'event' as const,
    title: 'Annual Community Picnic',
    content: 'Join us for our annual community picnic on August 15th from 12:00 PM to 6:00 PM at the lakefront pavilion. Bring your favorite dish to share! Grilling stations and beverages will be provided.',
    authorId: 'user-456',
    authorName: 'Bob Johnson',
    authorEmail: 'bob.johnson@example.com',
    submissionDate: '2024-07-20T10:00:00.000Z',
    status: 'approved' as const,
    eventDate: '2024-08-15',
    eventTime: '12:00',
    eventEndTime: '18:00',
    eventLocation: 'Lakefront Pavilion',
    allDay: false,
    onCalendar: true,
    tags: ['picnic', 'community', 'event'],
    attachments: [],
    metadata: {
      submissionSource: 'web' as const
    }
  } as UserContent,

  publishedClassified: {
    id: 'content-003',
    type: 'classified' as const,
    title: 'Pontoon Boat for Sale',
    content: 'Beautiful 2020 Bennington pontoon boat for sale. 22 feet, seats 12, perfect for lake days. Well maintained, low hours. Asking $35,000. Contact for more details and to schedule a viewing.',
    authorId: 'user-789',
    authorName: 'Mike Wilson',
    authorEmail: 'mike.wilson@example.com',
    submissionDate: '2024-08-10T16:45:00.000Z',
    status: 'published' as const,
    featured: true,
    tags: ['for-sale', 'boat', 'pontoon'],
    attachments: [
      {
        filename: 'boat-photo-1.jpg',
        storageRef: 'attachments/boat-photo-1.jpg',
        downloadUrl: 'https://firebasestorage.googleapis.com/boat-photo-1.jpg',
        fileSize: 524288,
        mimeType: 'image/jpeg'
      }
    ],
    metadata: {
      submissionSource: 'mobile' as const
    }
  } as UserContent
};

// Converted Display Data for UI Components
export const mockDisplayData = {
  newsItems: [
    {
      id: 'news-001',
      title: 'Community Board Meeting Minutes',
      summary: 'Summary of the July 22nd community board meeting including budget discussions, maintenance updates...',
      content: 'Full content of the community board meeting minutes from July 22nd, 2024.',
      author: 'Community Board Secretary',
      date: '2024-07-23T09:00:00.000Z',
      category: 'announcement' as const,
      featured: false
    },
    {
      id: 'news-002',
      title: 'Summer Activities Program',
      summary: 'Exciting summer activities for all ages starting this weekend at the community center...',
      content: 'Join us for a variety of summer activities including swimming lessons, yoga classes, and outdoor movie nights.',
      author: 'Activities Committee',
      date: '2024-08-01T12:00:00.000Z',
      category: 'event' as const,
      featured: true
    }
  ],

  // Legacy data structures removed - use ContentDoc format instead
  // All content should now use the unified ContentDoc architecture
};

// Error Scenarios for Testing Edge Cases
export const mockErrorData = {
  invalidNewsletter: {
    // Missing required fields to test validation
    title: 'Invalid Newsletter',
    // Missing: id, filename, publicationDate, etc.
  },

  malformedDate: {
    id: 'bad-date-newsletter',
    filename: 'bad-date.pdf',
    title: 'Newsletter with Bad Date',
    publicationDate: 'not-a-valid-date',
    year: 2024,
    fileSize: 1000,
    downloadUrl: 'https://example.com/test.pdf',
    storageRef: 'test.pdf',
    tags: [],
    featured: false,
    isPublished: true,
    createdAt: 'also-not-a-date',
    updatedAt: '2024-08-01T10:00:00.000Z',
    createdBy: 'user',
    updatedBy: 'user',
    actions: {
      canView: false,
      canDownload: false,
      canSearch: false,
      hasThumbnail: false
    }
  },

  emptyContent: {
    id: 'empty-content',
    type: 'article' as const,
    title: '',
    content: '',
    authorId: '',
    authorName: '',
    authorEmail: '',
    submissionDate: '',
    status: 'pending' as const,
    tags: [],
    attachments: [],
    metadata: {
      submissionSource: 'web' as const
    }
  }
};

// Firebase Emulator Mock Responses
export const mockFirebaseResponses = {
  emptyQuerySnapshot: {
    empty: true,
    size: 0,
    docs: []
  },

  singleDocSnapshot: (data: Record<string, unknown>, id = 'test-doc-id') => ({
    exists: () => true,
    id: id,
    data: () => data
  }),

  nonExistentDocSnapshot: {
    exists: () => false,
    id: '',
    data: () => null
  },

  querySnapshotWithDocs: (docs: Array<{ id: string; data: Record<string, unknown> }>) => ({
    empty: docs.length === 0,
    size: docs.length,
    docs: docs.map(doc => ({
      id: doc.id,
      data: () => doc.data
    }))
  })
};

// Test Utilities
export const testUtils = {
  // Generate a mock newsletter with specific overrides
  createMockNewsletter: (overrides: Partial<NewsletterMetadata> = {}): NewsletterMetadata => ({
    ...mockNewsletterData.valid,
    ...overrides,
    id: overrides.id || `test-newsletter-${Date.now()}`
  }),

  // Generate a series of newsletters for testing sorting and filtering
  createNewsletterSeries: (count: number = 5): NewsletterMetadata[] => {
    return Array.from({ length: count }, (_, index) => ({
      ...mockNewsletterData.valid,
      id: `newsletter-${index + 1}`,
      title: `Newsletter ${index + 1}`,
      publicationDate: `2024-${String(index + 1).padStart(2, '0')}-01`,
      month: index + 1,
      sortValue: 202400 + (index + 1),
      featured: index % 2 === 0, // Alternate featured status
      isPublished: index < count - 1 // Last one is unpublished
    }));
  },

  // Generate user content with specific status
  createUserContent: (status: UserContent['status'], overrides: Partial<UserContent> = {}): UserContent => ({
    ...mockUserContentData.pendingArticle,
    ...overrides,
    id: overrides.id || `content-${status}-${Date.now()}`,
    status,
    submissionDate: overrides.submissionDate || new Date().toISOString()
  })
};

export default {
  newsletters: mockNewsletterData,
  userContent: mockUserContentData,
  display: mockDisplayData,
  errors: mockErrorData,
  firebase: mockFirebaseResponses,
  utils: testUtils
};
