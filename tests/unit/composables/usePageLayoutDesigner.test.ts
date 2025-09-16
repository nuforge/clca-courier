import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { usePageLayoutDesigner } from '../../../src/composables/usePageLayoutDesigner';
import type { ContentDoc } from '../../../src/types/core/content.types';
import type { NewsletterIssue } from '../../../src/composables/usePageLayoutDesigner';

// Mock dependencies
vi.mock('quasar', () => ({
  useQuasar: () => ({
    notify: vi.fn(),
    dialog: vi.fn(() => ({
      onOk: vi.fn()
    }))
  })
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../../../src/composables/useSiteTheme', () => ({
  useSiteTheme: () => ({
    getContentIcon: vi.fn(() => ({ icon: 'mdi-file', color: 'blue', label: 'Article' })),
    getCategoryIcon: vi.fn(() => ({ icon: 'mdi-tag', color: 'green', label: 'Category' }))
  })
}));

vi.mock('../../../src/utils/date-formatter', () => ({
  formatDate: vi.fn((date) => date?.toISOString() || new Date().toISOString())
}));

vi.mock('../../../src/services/newsletter-generation.service', () => ({
  newsletterGenerationService: {
    addSubmissionsToIssue: vi.fn(),
    getApprovedSubmissions: vi.fn()
  }
}));

describe('usePageLayoutDesigner', () => {
  let mockContent: ContentDoc[];
  let mockIssue: NewsletterIssue;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock content with different statuses
    mockContent = [
      {
        id: 'content-1',
        title: 'Published Article',
        description: 'A published article',
        status: 'published',
        tags: ['article', 'news'],
        type: 'article',
        content: 'Article content',
        authorId: 'user1',
        authorName: 'Author 1',
        timestamps: {
          created: new Date(),
          updated: new Date()
        }
      },
      {
        id: 'content-2',
        title: 'Approved Event',
        description: 'An approved event',
        status: 'approved',
        tags: ['event', 'community'],
        type: 'event',
        content: 'Event content',
        authorId: 'user2',
        authorName: 'Author 2',
        timestamps: {
          created: new Date(),
          updated: new Date()
        }
      },
      {
        id: 'content-3',
        title: 'Draft Content',
        description: 'A draft content',
        status: 'draft',
        tags: ['article'],
        type: 'article',
        content: 'Draft content',
        authorId: 'user3',
        authorName: 'Author 3',
        timestamps: {
          created: new Date(),
          updated: new Date()
        }
      },
      {
        id: 'content-4',
        title: 'Already in Issue',
        description: 'Content already in the issue',
        status: 'published',
        tags: ['article'],
        type: 'article',
        content: 'Content in issue',
        authorId: 'user4',
        authorName: 'Author 4',
        timestamps: {
          created: new Date(),
          updated: new Date()
        }
      }
    ];

    // Mock issue with some submissions
    mockIssue = {
      id: 'issue-1',
      title: 'Test Issue',
      filename: 'test-issue.pdf',
      status: 'draft',
      submissions: ['content-4'], // content-4 is already in the issue
      publicationDate: new Date().toISOString(),
      year: 2025,
      downloadUrl: '',
      storageRef: '',
      fileSize: 0,
      pageCount: 0,
      tags: [],
      featured: false,
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user1',
      updatedBy: 'user1',
      type: 'issue'
    };
  });

  describe('availableContent computed', () => {
    it('should show all content when no issue is selected', () => {
      const { availableContent, initializeWithIssue } = usePageLayoutDesigner();

      // Initialize with no issue but with content
      initializeWithIssue(null, mockContent);

      expect(availableContent.value).toHaveLength(4);
      expect(availableContent.value.map(c => c.id)).toEqual([
        'content-1', 'content-2', 'content-3', 'content-4'
      ]);
    });

    it('should exclude content already in the issue', () => {
      const { availableContent, initializeWithIssue } = usePageLayoutDesigner();

      // Initialize with issue that has content-4
      initializeWithIssue(mockIssue, mockContent);

      expect(availableContent.value).toHaveLength(3);
      expect(availableContent.value.map(c => c.id)).toEqual([
        'content-1', 'content-2', 'content-3'
      ]);
      expect(availableContent.value.find(c => c.id === 'content-4')).toBeUndefined();
    });

    it('should filter by status when status filter is applied', () => {
      const { availableContent, initializeWithIssue, selectedContentStatus } = usePageLayoutDesigner();

      initializeWithIssue(mockIssue, mockContent);

      // Filter to only show published content
      selectedContentStatus.value = 'published';

      expect(availableContent.value).toHaveLength(1);
      expect(availableContent.value[0].id).toBe('content-1');
      expect(availableContent.value[0].status).toBe('published');
    });

    it('should filter by status when filtering for approved content', () => {
      const { availableContent, initializeWithIssue, selectedContentStatus } = usePageLayoutDesigner();

      initializeWithIssue(mockIssue, mockContent);

      // Filter to only show approved content
      selectedContentStatus.value = 'approved';

      expect(availableContent.value).toHaveLength(1);
      expect(availableContent.value[0].id).toBe('content-2');
      expect(availableContent.value[0].status).toBe('approved');
    });

    it('should filter by search query in title', () => {
      const { availableContent, initializeWithIssue, contentSearchQuery } = usePageLayoutDesigner();

      initializeWithIssue(mockIssue, mockContent);

      // Search for "Event"
      contentSearchQuery.value = 'Event';

      expect(availableContent.value).toHaveLength(1);
      expect(availableContent.value[0].id).toBe('content-2');
      expect(availableContent.value[0].title).toContain('Event');
    });

    it('should filter by search query in description', () => {
      const { availableContent, initializeWithIssue, contentSearchQuery } = usePageLayoutDesigner();

      initializeWithIssue(mockIssue, mockContent);

      // Search for "approved" (in description)
      contentSearchQuery.value = 'approved';

      expect(availableContent.value).toHaveLength(1);
      expect(availableContent.value[0].id).toBe('content-2');
      expect(availableContent.value[0].description).toContain('approved');
    });

    it('should combine multiple filters correctly', () => {
      const { availableContent, initializeWithIssue, selectedContentStatus, contentSearchQuery } = usePageLayoutDesigner();

      initializeWithIssue(mockIssue, mockContent);

      // Filter by published status AND search for "Published"
      selectedContentStatus.value = 'published';
      contentSearchQuery.value = 'Published';

      expect(availableContent.value).toHaveLength(1);
      expect(availableContent.value[0].id).toBe('content-1');
      expect(availableContent.value[0].status).toBe('published');
      expect(availableContent.value[0].title).toContain('Published');
    });

    it('should return empty array when filters match no content', () => {
      const { availableContent, initializeWithIssue, selectedContentStatus, contentSearchQuery } = usePageLayoutDesigner();

      initializeWithIssue(mockIssue, mockContent);

      // Search for something that doesn't exist
      contentSearchQuery.value = 'NonexistentContent';

      expect(availableContent.value).toHaveLength(0);
    });

    it('should handle empty submissions array gracefully', () => {
      const { availableContent, initializeWithIssue } = usePageLayoutDesigner();

      const issueWithNoSubmissions = { ...mockIssue, submissions: [] };
      initializeWithIssue(issueWithNoSubmissions, mockContent);

      expect(availableContent.value).toHaveLength(4);
      expect(availableContent.value.map(c => c.id)).toEqual([
        'content-1', 'content-2', 'content-3', 'content-4'
      ]);
    });
  });

  describe('issueContent computed', () => {
    it('should return content that is in the issue', () => {
      const { issueContent, initializeWithIssue } = usePageLayoutDesigner();

      initializeWithIssue(mockIssue, mockContent);

      expect(issueContent.value).toHaveLength(1);
      expect(issueContent.value[0].id).toBe('content-4');
    });

    it('should return empty array when no issue is selected', () => {
      const { issueContent, initializeWithIssue } = usePageLayoutDesigner();

      initializeWithIssue(null, mockContent);

      expect(issueContent.value).toHaveLength(0);
    });

    it('should handle missing content gracefully', () => {
      const { issueContent, initializeWithIssue } = usePageLayoutDesigner();

      const issueWithMissingContent = {
        ...mockIssue,
        submissions: ['content-4', 'non-existent-content']
      };
      initializeWithIssue(issueWithMissingContent, mockContent);

      expect(issueContent.value).toHaveLength(1);
      expect(issueContent.value[0].id).toBe('content-4');
    });
  });

  describe('content helper functions', () => {
    it('should get submission title correctly', () => {
      const { getSubmissionTitle, initializeWithIssue } = usePageLayoutDesigner();

      initializeWithIssue(mockIssue, mockContent);

      expect(getSubmissionTitle('content-1')).toBe('Published Article');
      expect(getSubmissionTitle('non-existent')).toBe('Unknown');
    });

    it('should get submission preview correctly', () => {
      const { getSubmissionPreview, initializeWithIssue } = usePageLayoutDesigner();

      initializeWithIssue(mockIssue, mockContent);

      expect(getSubmissionPreview('content-1')).toBe('A published article');
      expect(getSubmissionPreview('non-existent')).toBe('Content preview not available');
    });

    it('should truncate long previews', () => {
      const { getSubmissionPreview, initializeWithIssue } = usePageLayoutDesigner();

      const longContent = [{
        ...mockContent[0],
        description: 'A'.repeat(200) // 200 characters
      }];

      initializeWithIssue(mockIssue, longContent);

      const preview = getSubmissionPreview('content-1');
      expect(preview).toHaveLength(153); // 150 + '...'
      expect(preview.endsWith('...')).toBe(true);
    });
  });

  describe('layout management', () => {
    it('should check if content is in layout correctly', () => {
      const { isContentInLayout, initializeWithIssue, contentAreas } = usePageLayoutDesigner();

      initializeWithIssue(mockIssue, mockContent);

      // Place content in layout area
      contentAreas.value[0].contentId = 'content-1';

      expect(isContentInLayout('content-1')).toBe(true);
      expect(isContentInLayout('content-2')).toBe(false);
    });

    it('should get layout info correctly', () => {
      const { getContentLayoutInfo, initializeWithIssue, contentAreas } = usePageLayoutDesigner();

      initializeWithIssue(mockIssue, mockContent);

      // Place content in layout area
      contentAreas.value[1].contentId = 'content-1';

      const layoutInfo = getContentLayoutInfo('content-1');
      expect(layoutInfo).toEqual({
        areaIndex: 2, // 1-based indexing
        areaSize: 'medium'
      });

      expect(getContentLayoutInfo('content-2')).toBeNull();
    });
  });

  describe('debugging and error handling', () => {
    it('should log debug information when filtering content', async () => {
      const { availableContent, initializeWithIssue } = usePageLayoutDesigner();
      const { logger } = await import('../../../src/utils/logger');

      initializeWithIssue(mockIssue, mockContent);

      // Trigger computed property
      const _ = availableContent.value;

      expect(logger.debug).toHaveBeenCalledWith('Available content filtered', expect.objectContaining({
        totalSubmissions: 4,
        filteredCount: 3,
        selectedStatus: 'all',
        searchQuery: '',
        issueSubmissionsCount: 1
      }));
    });

    it('should provide sample data in debug logs', async () => {
      const { availableContent, initializeWithIssue } = usePageLayoutDesigner();
      const { logger } = await import('../../../src/utils/logger');

      initializeWithIssue(mockIssue, mockContent);

      // Trigger computed property
      const _ = availableContent.value;

      expect(logger.debug).toHaveBeenCalledWith('Available content filtered', expect.objectContaining({
        submissionSample: expect.arrayContaining([
          expect.objectContaining({
            id: 'content-1',
            title: 'Published Article',
            status: 'published'
          })
        ])
      }));
    });
  });
});
