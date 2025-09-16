import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { newsletterGenerationService } from '../../../src/services/newsletter-generation.service';
import type { ContentDoc } from '../../../src/types/core/content.types';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn()
}));

// Mock Firebase config
vi.mock('../../../src/config/firebase.config', () => ({
  firestore: {}
}));

// Mock Firebase auth service
vi.mock('../../../src/services/firebase-auth.service', () => ({
  firebaseAuthService: {
    getCurrentUser: vi.fn(() => ({ uid: 'test-user' }))
  }
}));

// Mock logger
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('NewsletterGenerationService - getApprovedSubmissions', () => {
  const mockGetDocs = getDocs as MockedFunction<typeof getDocs>;
  const mockQuery = query as MockedFunction<typeof query>;
  const mockCollection = collection as MockedFunction<typeof collection>;
  const mockWhere = where as MockedFunction<typeof where>;
  const mockOrderBy = orderBy as MockedFunction<typeof orderBy>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockQuerySnapshot = (docs: Array<{ id: string; data: () => any }>) => ({
    docs: docs.map(doc => ({
      id: doc.id,
      data: doc.data
    }))
  });

  const createMockContent = (id: string, status: string, title: string, tags: string[] = []): { id: string; data: () => ContentDoc } => ({
    id,
    data: () => ({
      id,
      title,
      description: `Description for ${title}`,
      status,
      tags,
      type: 'article',
      content: `Content for ${title}`,
      authorId: 'author1',
      authorName: 'Test Author',
      timestamps: {
        created: new Date(),
        updated: new Date()
      }
    } as ContentDoc)
  });

  it('should load published content from content collection', async () => {
    const mockPublishedContent = [
      createMockContent('pub-1', 'published', 'Published Article 1'),
      createMockContent('pub-2', 'published', 'Published Article 2')
    ];

    const mockApprovedContent: Array<{ id: string; data: () => any }> = [];

    // Mock the queries to return different results
    mockGetDocs
      .mockResolvedValueOnce(createMockQuerySnapshot(mockPublishedContent)) // First call for 'content' collection
      .mockResolvedValueOnce(createMockQuerySnapshot(mockApprovedContent)); // Second call for 'content_submissions' collection

    const result = await newsletterGenerationService.getApprovedSubmissions();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('pub-1');
    expect(result[0].title).toBe('Published Article 1');
    expect(result[0].status).toBe('published');
    expect(result[1].id).toBe('pub-2');
    expect(result[1].title).toBe('Published Article 2');
  });

  it('should load approved content from content_submissions collection', async () => {
    const mockPublishedContent: Array<{ id: string; data: () => any }> = [];

    const mockApprovedContent = [
      createMockContent('app-1', 'approved', 'Approved Submission 1'),
      createMockContent('app-2', 'published', 'Published Submission 2')
    ];

    mockGetDocs
      .mockResolvedValueOnce(createMockQuerySnapshot(mockPublishedContent))
      .mockResolvedValueOnce(createMockQuerySnapshot(mockApprovedContent));

    const result = await newsletterGenerationService.getApprovedSubmissions();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('app-1');
    expect(result[0].status).toBe('approved');
    expect(result[1].id).toBe('app-2');
    expect(result[1].status).toBe('published');
  });

  it('should combine and deduplicate content from both collections', async () => {
    const duplicateContent = createMockContent('dup-1', 'published', 'Duplicate Content');

    const mockPublishedContent = [
      duplicateContent,
      createMockContent('pub-1', 'published', 'Published Only')
    ];

    const mockApprovedContent = [
      duplicateContent, // Same ID as in published content
      createMockContent('app-1', 'approved', 'Approved Only')
    ];

    mockGetDocs
      .mockResolvedValueOnce(createMockQuerySnapshot(mockPublishedContent))
      .mockResolvedValueOnce(createMockQuerySnapshot(mockApprovedContent));

    const result = await newsletterGenerationService.getApprovedSubmissions();

    expect(result).toHaveLength(3);
    expect(result.map(c => c.id).sort()).toEqual(['app-1', 'dup-1', 'pub-1']);
  });

  it('should handle empty results gracefully', async () => {
    mockGetDocs
      .mockResolvedValueOnce(createMockQuerySnapshot([]))
      .mockResolvedValueOnce(createMockQuerySnapshot([]));

    const result = await newsletterGenerationService.getApprovedSubmissions();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle collection access errors gracefully', async () => {
    // Simulate one collection failing (e.g., doesn't exist)
    mockGetDocs
      .mockRejectedValueOnce(new Error('Collection not found'))
      .mockResolvedValueOnce(createMockQuerySnapshot([
        createMockContent('app-1', 'approved', 'From Second Collection')
      ]));

    const result = await newsletterGenerationService.getApprovedSubmissions();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('app-1');
  });

  it('should handle both collections failing gracefully', async () => {
    mockGetDocs
      .mockRejectedValueOnce(new Error('First collection error'))
      .mockRejectedValueOnce(new Error('Second collection error'));

    const result = await newsletterGenerationService.getApprovedSubmissions();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should log detailed debugging information', async () => {
    const { logger } = await import('../../../src/utils/logger');

    const mockPublishedContent = [
      createMockContent('pub-1', 'published', 'Published Article', ['tag1'])
    ];

    const mockApprovedContent = [
      createMockContent('app-1', 'approved', 'Approved Article', ['tag2'])
    ];

    mockGetDocs
      .mockResolvedValueOnce(createMockQuerySnapshot(mockPublishedContent))
      .mockResolvedValueOnce(createMockQuerySnapshot(mockApprovedContent));

    await newsletterGenerationService.getApprovedSubmissions();

    expect(logger.info).toHaveBeenCalledWith('Loading approved submissions for newsletter inclusion');
    expect(logger.info).toHaveBeenCalledWith('Content loading results', expect.objectContaining({
      publishedCount: 1,
      approvedCount: 1,
      totalUniqueCount: 2,
      contentSample: expect.arrayContaining([
        expect.objectContaining({
          id: 'pub-1',
          title: 'Published Article',
          status: 'published',
          tags: ['tag1']
        })
      ])
    }));
  });

  it('should log warning when no content is found', async () => {
    const { logger } = await import('../../../src/utils/logger');

    mockGetDocs
      .mockResolvedValueOnce(createMockQuerySnapshot([]))
      .mockResolvedValueOnce(createMockQuerySnapshot([]));

    await newsletterGenerationService.getApprovedSubmissions();

    expect(logger.warn).toHaveBeenCalledWith('No approved content found - this might indicate:', expect.objectContaining({
      possibleIssues: expect.arrayContaining([
        'No content has been published/approved yet',
        'Content might be in a different collection',
        'Firestore security rules might be blocking access',
        'Content status values might be different than expected'
      ])
    }));
  });

  it('should preserve content structure and metadata', async () => {
    const mockContent = createMockContent('test-1', 'published', 'Test Article', ['tag1', 'tag2']);

    mockGetDocs
      .mockResolvedValueOnce(createMockQuerySnapshot([mockContent]))
      .mockResolvedValueOnce(createMockQuerySnapshot([]));

    const result = await newsletterGenerationService.getApprovedSubmissions();

    expect(result[0]).toEqual({
      id: 'test-1',
      title: 'Test Article',
      description: 'Description for Test Article',
      status: 'published',
      tags: ['tag1', 'tag2'],
      type: 'article',
      content: 'Content for Test Article',
      authorId: 'author1',
      authorName: 'Test Author',
      timestamps: expect.objectContaining({
        created: expect.any(Date),
        updated: expect.any(Date)
      })
    });
  });

  it('should query the correct collections with proper filters', async () => {
    mockGetDocs
      .mockResolvedValue(createMockQuerySnapshot([]));

    await newsletterGenerationService.getApprovedSubmissions();

    // Verify the first query (content collection)
    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'content');
    expect(mockWhere).toHaveBeenCalledWith('status', '==', 'published');
    expect(mockOrderBy).toHaveBeenCalledWith('timestamps.created', 'desc');

    // Verify the second query (content_submissions collection)
    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'content_submissions');
    expect(mockWhere).toHaveBeenCalledWith('status', 'in', ['approved', 'published']);
    expect(mockOrderBy).toHaveBeenCalledWith('submissionDate', 'desc');
  });

  it('should handle malformed content data gracefully', async () => {
    const malformedContent = {
      id: 'malformed-1',
      data: () => ({
        // Missing required fields
        id: 'malformed-1',
        title: undefined,
        status: 'published'
      })
    };

    mockGetDocs
      .mockResolvedValueOnce(createMockQuerySnapshot([malformedContent]))
      .mockResolvedValueOnce(createMockQuerySnapshot([]));

    const result = await newsletterGenerationService.getApprovedSubmissions();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('malformed-1');
    expect(result[0].title).toBeUndefined();
    expect(result[0].status).toBe('published');
  });
});
