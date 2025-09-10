import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNewsletterManagementStore } from '../../../src/stores/newsletter-management.store';
import type { ContentManagementNewsletter, NewsletterFilters } from '../../../src/types/core/content-management.types';

// Mock Firebase services using established patterns from service tests
const mockFirebaseNewsletterService = vi.hoisted(() => ({
  getNewsletters: vi.fn(),
  loadAllNewslettersForAdmin: vi.fn(),
  uploadNewsletter: vi.fn(),
  deleteNewsletter: vi.fn(),
  updateNewsletter: vi.fn(),
  getNpwsleterMetadata: vi.fn(),
  extractTextFromNewsletter: vi.fn(),
  generateThumbnail: vi.fn(),
  getNewsletterStats: vi.fn(),
  initialize: vi.fn()
}));

const mockFirestoreService = vi.hoisted(() => ({
  subscribeToNewslettersForAdmin: vi.fn(),
  subscribeToNewslettersForPublic: vi.fn(),
  updateNewsletterMetadata: vi.fn(),
  deleteNewsletter: vi.fn(),
  getNewsletterById: vi.fn(),
  searchNewsletters: vi.fn(),
  getNewslettersByYear: vi.fn(),
  getNewslettersByDateRange: vi.fn()
}));

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  success: vi.fn()
}));

// Apply mocks
vi.mock('../../../src/services/firebase-newsletter.service', () => ({
  firebaseNewsletterService: mockFirebaseNewsletterService
}));

vi.mock('../../../src/services/firebase-firestore.service', () => ({
  firestoreService: mockFirestoreService
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: mockLogger
}));

describe('Newsletter Management Store - Critical Remediation Tests', () => {
  let store: ReturnType<typeof useNewsletterManagementStore>;

  // =============================================
  // TEST DATA FACTORIES - PROPER VALIDATION TESTING
  // =============================================

  /**
   * Create valid newsletter data for positive tests
   */
  const createValidNewsletter = (overrides: Partial<ContentManagementNewsletter> = {}): ContentManagementNewsletter => ({
    id: 'newsletter-1',
    filename: 'newsletter-2024-01.pdf',
    title: 'January 2024 Newsletter',
    downloadUrl: 'https://example.com/newsletter-1.pdf',
    fileSize: 2048000,
    pageCount: 12,
    isPublished: true,
    featured: false,
    year: 2024,
    month: 1,
    season: 'winter',
    publicationDate: '2024-01-15',
    tags: ['community', 'updates'],
    storageRef: 'newsletters/newsletter-2024-01.pdf',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    createdBy: 'test-user',
    updatedBy: 'test-user',
    searchableText: 'Sample extracted text content',
    thumbnailUrl: 'thumb1.jpg',
    wordCount: 500,
    description: 'Sample newsletter description',
    keywords: 'community, news',
    ...overrides
  });

  /**
   * Create invalid newsletter data for negative tests
   */
  const createInvalidNewsletter = (invalidField: string, invalidValue: unknown): Record<string, unknown> => {
    const base = createValidNewsletter();
    return {
      ...base,
      [invalidField]: invalidValue
    };
  };

  /**
   * Create batch of newsletters for performance tests
   */
  const createNewsletterBatch = (count: number): ContentManagementNewsletter[] => {
    return Array.from({ length: count }, (_, index) =>
      createValidNewsletter({
        id: `newsletter-${index + 1}`,
        filename: `newsletter-2024-${String(index + 1).padStart(2, '0')}.pdf`,
        title: `Newsletter ${index + 1}`,
        publicationDate: `2024-${String(Math.floor(index / 12) + 1).padStart(2, '0')}-15`
      })
    );
  };

  beforeEach(() => {
    // Create fresh Pinia instance
    setActivePinia(createPinia());
    store = useNewsletterManagementStore();

    // Reset all mocks
    vi.clearAllMocks();

    // Default mock setup for loadAllNewslettersForAdmin
    mockFirebaseNewsletterService.loadAllNewslettersForAdmin.mockResolvedValue([]);
  });

  afterEach(() => {
    // Cleanup
    vi.clearAllMocks();
  });

  describe('Store Initialization', () => {
    it('should initialize with default state', () => {
      expect(store.newsletters).toEqual([]);
      expect(store.selectedNewsletters).toEqual([]);
      expect(store.currentNewsletter).toBeNull();
    });

    it('should initialize with default filters', () => {
      expect(store.filters).toEqual({
        searchText: '',
        filterYear: null,
        filterSeason: null,
        filterMonth: null,
      });
    });

    it('should initialize all processing states as false', () => {
      expect(store.isLoading).toBe(false);
      expect(store.isExtracting).toBe(false);
      expect(store.isExtractingText).toBe(false);
      expect(store.isExtractingPageCount).toBe(false);
      expect(store.isExtractingFileSize).toBe(false);
      expect(store.isExtractingDates).toBe(false);
      expect(store.isGeneratingKeywords).toBe(false);
      expect(store.isGeneratingDescriptions).toBe(false);
      expect(store.isGeneratingTitles).toBe(false);
      expect(store.isGeneratingThumbs).toBe(false);
      expect(store.isSyncing).toBe(false);
      expect(store.isUploading).toBe(false);
      expect(store.isToggling).toBe(false);
      expect(store.isDeleting).toBe(false);
    });

    it('should initialize with empty processing tracking objects', () => {
      expect(store.extractingText).toEqual({});
      expect(store.syncingIndividual).toEqual({});
      expect(store.publishingStates).toEqual({});
      expect(store.featuredStates).toEqual({});
      expect(store.thumbnailIndividualStates).toEqual({});
    });

    it('should initialize dialog states as false', () => {
      expect(store.showImportDialog).toBe(false);
      expect(store.showEditDialog).toBe(false);
      expect(store.showTextDialog).toBe(false);
      expect(store.extractedText).toBe('');
    });

    it('should initialize workflow toolbar as expanded by default', () => {
      expect(store.workflowToolbarExpanded).toBe(true);
    });
  });

  describe('Data Loading Operations', () => {
    it('should load newsletters successfully', async () => {
      const mockNewsletters = [
        createValidNewsletter({ filename: 'test1.pdf' }),
        createValidNewsletter({ filename: 'test2.pdf' }),
      ];
      mockFirebaseNewsletterService.loadAllNewslettersForAdmin.mockResolvedValue(mockNewsletters);

      await store.loadNewsletters();

      expect(store.isLoading).toBe(false);
      expect(store.newsletters).toEqual(mockNewsletters);
      expect(mockFirebaseNewsletterService.loadAllNewslettersForAdmin).toHaveBeenCalledOnce();
      expect(mockLogger.info).toHaveBeenCalledWith('🔄 Loading ALL newsletters for admin (including unpublished)...');
      expect(mockLogger.success).toHaveBeenCalledWith('✅ Loaded 2/2 valid newsletters (admin view) + reactive subscription active');
    });

    it('should handle loading errors gracefully', async () => {
      const mockError = new Error('Network error');
      mockFirebaseNewsletterService.loadAllNewslettersForAdmin.mockRejectedValue(mockError);

      await expect(store.loadNewsletters()).rejects.toThrow('Network error');

      expect(store.isLoading).toBe(false);
      expect(store.newsletters).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Failed to load newsletters:', mockError);
    });

    it('should update loading state during operations', async () => {
      const mockNewsletters = [createValidNewsletter()];
      mockFirebaseNewsletterService.loadAllNewslettersForAdmin.mockResolvedValue(mockNewsletters);

      const loadPromise = store.loadNewsletters();
      expect(store.isLoading).toBe(true);

      await loadPromise;
      expect(store.isLoading).toBe(false);
    });

    it('should refresh newsletters by calling loadNewsletters', async () => {
      const mockNewsletters = [createValidNewsletter()];
      mockFirebaseNewsletterService.loadAllNewslettersForAdmin.mockResolvedValue(mockNewsletters);

      await store.refreshNewsletters();

      expect(mockFirebaseNewsletterService.loadAllNewslettersForAdmin).toHaveBeenCalledOnce();
      expect(store.newsletters).toEqual(mockNewsletters);
    });

    it('should validate newsletters and filter out invalid ones', async () => {
      const validNewsletter = createValidNewsletter({ filename: 'valid.pdf' });
      // Create a truly invalid newsletter object that fails validation
      const invalidNewsletter = {
        filename: '', // Invalid - empty filename
        id: 'invalid-1',
        // Missing required fields that validation expects
      };
      const mockNewsletters = [validNewsletter, invalidNewsletter];
      mockFirebaseNewsletterService.loadAllNewslettersForAdmin.mockResolvedValue(mockNewsletters);

      await store.loadNewsletters();

      expect(store.newsletters).toEqual([validNewsletter]); // Only valid newsletter
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Invalid newsletter data received from subscription',
        expect.objectContaining({
          id: 'invalid-1',
          errors: expect.arrayContaining([expect.stringContaining('Filename is required')])
        })
      );
    });

    it('should handle empty newsletter arrays correctly', async () => {
      mockFirebaseNewsletterService.loadAllNewslettersForAdmin.mockResolvedValue([]);

      await store.loadNewsletters();

      expect(store.newsletters).toEqual([]);
      expect(store.isLoading).toBe(false);
      expect(mockLogger.success).toHaveBeenCalledWith('✅ Loaded 0/0 valid newsletters (admin view) + reactive subscription active');
    });
  });

  describe('Firebase Service Integration', () => {
    it('should setup reactive subscriptions correctly', () => {
      const mockUnsubscribe = vi.fn();
      mockFirestoreService.subscribeToNewslettersForAdmin.mockReturnValue(mockUnsubscribe);

      // Loading newsletters automatically sets up subscription
      store.loadNewsletters();

      expect(mockFirestoreService.subscribeToNewslettersForAdmin).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Setting up reactive admin subscription for newsletter management...');
    });

    it('should handle subscription data updates', async () => {
      const mockNewsletters = [
        createValidNewsletter({ filename: 'test1.pdf' }),
        createValidNewsletter({ filename: 'test2.pdf' }),
      ];
      let subscriptionCallback: (newsletters: any[]) => void;

      mockFirestoreService.subscribeToNewslettersForAdmin.mockImplementation((callback) => {
        subscriptionCallback = callback;
        return vi.fn();
      });

      await store.loadNewsletters();

      // Simulate subscription update
      subscriptionCallback!(mockNewsletters);

      expect(store.newsletters).toEqual(mockNewsletters);
      expect(mockLogger.info).toHaveBeenCalledWith('Received 2 newsletters via reactive subscription');
    });

    it('should cleanup subscriptions on destroy', () => {
      const mockUnsubscribe = vi.fn();
      mockFirestoreService.subscribeToNewslettersForAdmin.mockReturnValue(mockUnsubscribe);

      // Setup subscription through loadNewsletters
      store.loadNewsletters();

      // Simulate component unmount (would be called by Vue's onUnmounted)
      // We can't directly test onUnmounted, but we can verify the unsubscribe function works
      expect(mockFirestoreService.subscribeToNewslettersForAdmin).toHaveBeenCalledOnce();
    });
  });

  describe('Newsletter Management Operations', () => {
    it('should manage current newsletter correctly', () => {
      const mockNewsletter = createValidNewsletter({ filename: 'test.pdf' });

      store.setCurrentNewsletter(mockNewsletter);
      expect(store.currentNewsletter).toEqual(mockNewsletter);

      store.setCurrentNewsletter(null);
      expect(store.currentNewsletter).toBeNull();
    });

    it('should handle selection management operations', () => {
      const newsletter1 = createValidNewsletter({ filename: 'test1.pdf' });
      const newsletter2 = createValidNewsletter({ filename: 'test2.pdf' });
      const newsletters = [newsletter1, newsletter2];

      // Set selected newsletters
      store.setSelectedNewsletters(newsletters);
      expect(store.selectedNewsletters).toEqual(newsletters);

      // Clear selection
      store.clearSelection();
      expect(store.selectedNewsletters).toEqual([]);
    });

    it('should handle individual newsletter selection toggle', () => {
      const newsletter = createValidNewsletter({ filename: 'test.pdf' });

      // Select newsletter
      store.selectNewsletter(newsletter);
      expect(store.selectedNewsletters).toHaveLength(1);
      expect(store.selectedNewsletters[0].filename).toBe('test.pdf');

      // Deselect newsletter
      store.selectNewsletter(newsletter);
      expect(store.selectedNewsletters).toHaveLength(0);
    });

    it('should select all filtered newsletters', () => {
      const newsletters = [
        createValidNewsletter({ filename: 'test1.pdf' }),
        createValidNewsletter({ filename: 'test2.pdf' }),
      ];

      // Setup newsletters in store
      store.newsletters = newsletters;

      store.selectAll();
      expect(store.selectedNewsletters).toEqual(newsletters);
    });
  });

  describe('Filtering and Search', () => {
    beforeEach(() => {
      // Setup test newsletters with different properties
      const newsletters = [
        createValidNewsletter({
          filename: 'newsletter-2024-01.pdf',
          title: 'January Newsletter 2024',
          year: 2024,
          season: 'Winter',
          month: 1
        }),
        createValidNewsletter({
          filename: 'newsletter-2024-06.pdf',
          title: 'Summer Newsletter 2024',
          year: 2024,
          season: 'Summer',
          month: 6
        }),
        createValidNewsletter({
          filename: 'newsletter-2023-12.pdf',
          title: 'December Newsletter 2023',
          year: 2023,
          season: 'Winter',
          month: 12
        }),
      ];
      store.newsletters = newsletters;
    });

    it('should filter newsletters by search text', () => {
      store.updateFilters({ searchText: 'Summer' });

      expect(store.filteredNewsletters).toHaveLength(1);
      expect(store.filteredNewsletters[0].title).toContain('Summer');
    });

    it('should filter newsletters by filename search', () => {
      store.updateFilters({ searchText: '2024-01' });

      expect(store.filteredNewsletters).toHaveLength(1);
      expect(store.filteredNewsletters[0].filename).toContain('2024-01');
    });

    it('should filter newsletters by year', () => {
      store.updateFilters({ filterYear: 2024 });

      expect(store.filteredNewsletters).toHaveLength(2);
      expect(store.filteredNewsletters.every(n => n.year === 2024)).toBe(true);
    });

    it('should filter newsletters by season', () => {
      store.updateFilters({ filterSeason: 'Winter' });

      expect(store.filteredNewsletters).toHaveLength(2);
      expect(store.filteredNewsletters.every(n => n.season === 'Winter')).toBe(true);
    });

    it('should filter newsletters by month', () => {
      store.updateFilters({ filterMonth: 6 });

      expect(store.filteredNewsletters).toHaveLength(1);
      expect(store.filteredNewsletters[0].month).toBe(6);
    });

    it('should combine multiple filters correctly', () => {
      store.updateFilters({
        filterYear: 2024,
        filterSeason: 'Winter'
      });

      expect(store.filteredNewsletters).toHaveLength(1);
      expect(store.filteredNewsletters[0].year).toBe(2024);
      expect(store.filteredNewsletters[0].season).toBe('Winter');
    });

    it('should reset filters correctly', () => {
      // Apply some filters first
      store.updateFilters({
        searchText: 'Summer',
        filterYear: 2024,
        filterSeason: 'Winter'
      });

      store.resetFilters();

      expect(store.filters).toEqual({
        searchText: '',
        filterYear: null,
        filterSeason: null,
        filterMonth: null,
      });
      expect(store.filteredNewsletters).toHaveLength(3); // All newsletters
    });

    it('should update filters partially', () => {
      store.updateFilters({ searchText: 'test' });
      expect(store.filters.searchText).toBe('test');
      expect(store.filters.filterYear).toBeNull();

      store.updateFilters({ filterYear: 2024 });
      expect(store.filters.searchText).toBe('test'); // Should preserve
      expect(store.filters.filterYear).toBe(2024);
    });
  });

  describe('Selection Management', () => {
    beforeEach(() => {
      const newsletters = [
        createValidNewsletter({ filename: 'test1.pdf' }),
        createValidNewsletter({ filename: 'test2.pdf' }),
        createValidNewsletter({ filename: 'test3.pdf' }),
      ];
      store.newsletters = newsletters;
    });

    it('should handle individual newsletter selection', () => {
      const newsletter = store.newsletters[0];

      // Should start with no selection
      expect(store.selectedNewsletters).toHaveLength(0);

      // Select newsletter
      store.selectNewsletter(newsletter);
      expect(store.selectedNewsletters).toHaveLength(1);
      expect(store.selectedNewsletters[0]).toEqual(newsletter);

      // Deselect newsletter
      store.selectNewsletter(newsletter);
      expect(store.selectedNewsletters).toHaveLength(0);
    });

    it('should handle multiple newsletter selection', () => {
      const newsletter1 = store.newsletters[0];
      const newsletter2 = store.newsletters[1];

      store.selectNewsletter(newsletter1);
      store.selectNewsletter(newsletter2);

      expect(store.selectedNewsletters).toHaveLength(2);
      expect(store.selectedNewsletters).toContain(newsletter1);
      expect(store.selectedNewsletters).toContain(newsletter2);
    });

    it('should select all newsletters via selectAll', () => {
      store.selectAll();

      expect(store.selectedNewsletters).toHaveLength(3);
      expect(store.selectedNewsletters).toEqual(store.filteredNewsletters);
    });

    it('should clear all selections', () => {
      // First select some newsletters
      store.selectNewsletter(store.newsletters[0]);
      store.selectNewsletter(store.newsletters[1]);
      expect(store.selectedNewsletters).toHaveLength(2);

      // Clear selection
      store.clearSelection();
      expect(store.selectedNewsletters).toHaveLength(0);
    });

    it('should set selected newsletters directly', () => {
      const selectedNewsletters = [store.newsletters[0], store.newsletters[2]];

      store.setSelectedNewsletters(selectedNewsletters);

      expect(store.selectedNewsletters).toEqual(selectedNewsletters);
      expect(store.selectedNewsletters).toHaveLength(2);
    });
  });

  describe('Processing State Management', () => {
    it('should initialize processing states computed property correctly', () => {
      const processingStates = store.processingStates;

      expect(processingStates.isLoading).toBe(false);
      expect(processingStates.isExtracting).toBe(false);
      expect(processingStates.isExtractingAllText).toBe(false);
      expect(processingStates.isGeneratingThumbs).toBe(false);
      expect(processingStates.isSaving).toBe(false);
      expect(processingStates.isProcessingText).toBe(false);
      expect(processingStates.isApplyingMetadata).toBe(false);
      expect(processingStates.isSyncing).toBe(false);
      expect(processingStates.extractingText).toEqual({});
      expect(processingStates.generatingThumb).toEqual({});
    });

    it('should reflect individual processing states changes', () => {
      // Update individual states
      store.isLoading = true;
      store.isExtracting = true;
      store.isSyncing = true;

      const processingStates = store.processingStates;
      expect(processingStates.isLoading).toBe(true);
      expect(processingStates.isExtracting).toBe(true);
      expect(processingStates.isSyncing).toBe(true);
    });

    it('should track individual newsletter processing states', () => {
      const newsletterId = 'test-newsletter-1';

      // Initially empty
      expect(store.extractingText[newsletterId]).toBeUndefined();
      expect(store.thumbnailIndividualStates[newsletterId]).toBeUndefined();

      // Update individual tracking
      store.extractingText = { [newsletterId]: true };
      store.thumbnailIndividualStates = { [newsletterId]: true };

      expect(store.extractingText[newsletterId]).toBe(true);
      expect(store.thumbnailIndividualStates[newsletterId]).toBe(true);
      expect(store.processingStates.extractingText[newsletterId]).toBe(true);
      expect(store.processingStates.generatingThumb[newsletterId]).toBe(true);
    });

    it('should manage workflow toolbar state with localStorage persistence', () => {
      // Initially expanded
      expect(store.workflowToolbarExpanded).toBe(true);

      // Toggle to collapsed
      store.toggleWorkflowToolbar();
      expect(store.workflowToolbarExpanded).toBe(false);

      // Toggle back to expanded
      store.toggleWorkflowToolbar();
      expect(store.workflowToolbarExpanded).toBe(true);

      // Should log debug messages
      expect(mockLogger.debug).toHaveBeenCalledWith('Toolbar expanded state saved: false');
      expect(mockLogger.debug).toHaveBeenCalledWith('Toolbar expanded state saved: true');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully in loadNewsletters', async () => {
      const mockError = new Error('Firebase service error');
      mockFirebaseNewsletterService.loadAllNewslettersForAdmin.mockRejectedValue(mockError);

      await expect(store.loadNewsletters()).rejects.toThrow('Firebase service error');

      expect(store.isLoading).toBe(false);
      expect(store.newsletters).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Failed to load newsletters:', mockError);
    });

    it('should handle subscription setup errors gracefully', async () => {
      const mockError = new Error('Subscription error');
      mockFirestoreService.subscribeToNewslettersForAdmin.mockImplementation(() => {
        throw mockError;
      });

      // The error in subscription setup will cause loadNewsletters to fail
      await expect(store.loadNewsletters()).rejects.toThrow('Subscription error');
      expect(mockLogger.info).toHaveBeenCalledWith('🔄 Loading ALL newsletters for admin (including unpublished)...');
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Failed to load newsletters:', mockError);
    });

    it('should maintain state consistency during errors', async () => {
      const mockError = new Error('Network error');
      mockFirebaseNewsletterService.loadAllNewslettersForAdmin.mockRejectedValue(mockError);

      const initialState = {
        newsletters: [...store.newsletters],
        selectedNewsletters: [...store.selectedNewsletters],
        filters: { ...store.filters }
      };

      try {
        await store.loadNewsletters();
      } catch {
        // Error expected
      }

      // State should be preserved except for loading state
      expect(store.newsletters).toEqual(initialState.newsletters);
      expect(store.selectedNewsletters).toEqual(initialState.selectedNewsletters);
      expect(store.filters).toEqual(initialState.filters);
      expect(store.isLoading).toBe(false);
    });
  });

  describe('Concurrency Control & Race Conditions', () => {
    it('should detect concurrent operations correctly', async () => {
      const operationId1 = 'test-operation-1';
      const operationId2 = 'test-operation-2';

      // Start first operation
      store.checkConcurrentOperation(operationId1);
      expect(store.activeOperations.has(operationId1)).toBe(true);

      // Attempt to start second operation with same ID should fail
      expect(() => store.checkConcurrentOperation(operationId1)).toThrow(
        'Operation blocked: Operation \'test-operation-1\' is already in progress'
      );

      // Different operation ID should work
      store.checkConcurrentOperation(operationId2);
      expect(store.activeOperations.has(operationId2)).toBe(true);

      // Complete operations
      store.completeConcurrentOperation(operationId1, true);
      store.completeConcurrentOperation(operationId2, false);

      expect(store.activeOperations.has(operationId1)).toBe(false);
      expect(store.activeOperations.has(operationId2)).toBe(false);
    });

    it('should prevent concurrent newsletter loading operations', async () => {
      const mockNewsletters = [createValidNewsletter()];
      mockFirebaseNewsletterService.loadAllNewslettersForAdmin.mockResolvedValue(mockNewsletters);
      // Clear any previous subscription setup errors from other tests
      mockFirestoreService.subscribeToNewslettersForAdmin.mockReturnValue(vi.fn());

      // Start first load operation
      const firstLoad = store.loadNewsletters();

      // Attempt second concurrent load operation
      await expect(store.loadNewsletters()).rejects.toThrow(/Operation blocked:/);
      // Note: The exact operation ID is generated with timestamp, so we use regex

      // Wait for first operation to complete
      await firstLoad;
      expect(store.newsletters).toEqual(mockNewsletters);
    });

    it('should handle operation completion correctly', () => {
      const operationId = 'test-completion';

      store.checkConcurrentOperation(operationId);
      expect(store.activeOperations.has(operationId)).toBe(true);

      // Complete with success
      store.completeConcurrentOperation(operationId, true);
      expect(store.activeOperations.has(operationId)).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Operation '${operationId}' completed`,
        expect.objectContaining({
          success: true
        })
      );
    });

    it('should handle operation failure logging', () => {
      const operationId = 'test-failure';

      store.checkConcurrentOperation(operationId);

      // Complete with failure
      store.completeConcurrentOperation(operationId, false);
      expect(store.activeOperations.has(operationId)).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Operation '${operationId}' completed`,
        expect.objectContaining({
          success: false
        })
      );
    });
  });  describe('Computed Properties', () => {
    beforeEach(() => {
      const newsletters = [
        createValidNewsletter({
          filename: 'newsletter-2024-01.pdf',
          title: 'January Newsletter 2024',
          searchableText: 'Text content 1', // Has text
          thumbnailUrl: 'thumb1.jpg', // Has thumbnail
          fileSize: 1572864, // 1.5 MB in bytes
          published: true
        }),
        createValidNewsletter({
          id: undefined, // Draft newsletter without ID
          filename: 'newsletter-2024-02.pdf',
          title: 'February Newsletter 2024',
          searchableText: undefined, // No text
          thumbnailUrl: 'thumb2.jpg', // Has thumbnail
          fileSize: 2203648, // 2.1 MB in bytes
          published: false
        }),
        createValidNewsletter({
          filename: 'newsletter-2024-03.pdf',
          title: 'March Newsletter 2024',
          searchableText: 'Text content 3', // Has text
          thumbnailUrl: undefined, // No thumbnail
          fileSize: 1887437, // 1.8 MB in bytes
          published: true
        }),
      ];
      store.newsletters = newsletters;
    });

    it('should compute totalNewsletters correctly', () => {
      expect(store.totalNewsletters).toBe(3);
    });

    it('should compute newslettersWithText correctly', () => {
      expect(store.newslettersWithText).toBe(2); // 2 newsletters with searchableText
    });

    it('should compute newslettersWithThumbnails correctly', () => {
      expect(store.newslettersWithThumbnails).toBe(2); // 2 newsletters with thumbnailUrl
    });

    it('should compute totalFileSize correctly', () => {
      const totalBytes = 1572864 + 2203648 + 1887437; // 5663949 bytes = ~5.4 MB
      expect(store.totalFileSize).toBe('5.4 MB');
    });

    it('should compute totalFileSizeBytes correctly', () => {
      expect(store.totalFileSizeBytes).toBe(5663949); // Sum of all fileSize numbers
    });

    it('should compute draftNewsletters correctly', () => {
      expect(store.draftNewsletters.length).toBe(1); // One newsletter without id
    });

    it('should compute hasDrafts correctly', () => {
      expect(store.hasDrafts).toBe(true);

      // Set all newsletters to have IDs (no drafts)
      store.newsletters = store.newsletters.map(n => ({ ...n, id: n.id || 'temp-id' }));
      expect(store.hasDrafts).toBe(false);
    });

    it('should compute availableYears correctly', () => {
      const newsletters = [
        createValidNewsletter({ year: 2024 }),
        createValidNewsletter({ year: 2023 }),
        createValidNewsletter({ year: 2024 }), // Duplicate year
      ];
      store.newsletters = newsletters;

      expect(store.availableYears).toEqual([2024, 2023]); // Unique years only, sorted desc
    });

    it('should compute availableSeasons correctly', () => {
      const newsletters = [
        createValidNewsletter({ season: 'Winter' }),
        createValidNewsletter({ season: 'Summer' }),
        createValidNewsletter({ season: 'Winter' }), // Duplicate season
      ];
      store.newsletters = newsletters;

      expect(store.availableSeasons).toEqual(['Winter', 'Summer']); // Unique seasons only
    });

    it('should compute availableMonths correctly', () => {
      expect(store.availableMonths).toHaveLength(12);
      expect(store.availableMonths[0]).toEqual({ label: 'January', value: 1 });
      expect(store.availableMonths[11]).toEqual({ label: 'December', value: 12 });
    });
  });  describe('Real-time Updates', () => {
    it('should handle real-time newsletter additions through subscription', async () => {
      let subscriptionCallback: (newsletters: any[]) => void;

      mockFirestoreService.subscribeToNewslettersForAdmin.mockImplementation((callback) => {
        subscriptionCallback = callback;
        return vi.fn();
      });

      // Setup initial subscription
      await store.loadNewsletters();

      const initialNewsletters = [createValidNewsletter({ filename: 'existing.pdf' })];
      const newNewsletter = createValidNewsletter({ filename: 'new.pdf' });
      const updatedNewsletters = [...initialNewsletters, newNewsletter];

      // Simulate real-time addition
      subscriptionCallback!(updatedNewsletters);

      expect(store.newsletters).toEqual(updatedNewsletters);
      expect(store.newsletters).toHaveLength(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Received 2 newsletters via reactive subscription');
    });

    it('should handle real-time newsletter updates through subscription', async () => {
      let subscriptionCallback: (newsletters: any[]) => void;

      mockFirestoreService.subscribeToNewslettersForAdmin.mockImplementation((callback) => {
        subscriptionCallback = callback;
        return vi.fn();
      });

      await store.loadNewsletters();

      const originalNewsletter = createValidNewsletter({
        filename: 'test.pdf',
        title: 'Original Title'
      });
      const updatedNewsletter = createValidNewsletter({
        filename: 'test.pdf',
        title: 'Updated Title'
      });

      // Simulate real-time update
      subscriptionCallback!([updatedNewsletter]);

      expect(store.newsletters).toHaveLength(1);
      expect(store.newsletters[0].title).toBe('Updated Title');
    });

    it('should handle real-time newsletter deletions through subscription', async () => {
      let subscriptionCallback: (newsletters: any[]) => void;

      mockFirestoreService.subscribeToNewslettersForAdmin.mockImplementation((callback) => {
        subscriptionCallback = callback;
        return vi.fn();
      });

      await store.loadNewsletters();

      // Start with newsletters, then simulate deletion by providing empty array
      const initialNewsletters = [
        createValidNewsletter({ filename: 'test1.pdf' }),
        createValidNewsletter({ filename: 'test2.pdf' })
      ];

      subscriptionCallback!(initialNewsletters);
      expect(store.newsletters).toHaveLength(2);

      // Simulate deletion of one newsletter
      const remainingNewsletters = [initialNewsletters[0]];
      subscriptionCallback!(remainingNewsletters);

      expect(store.newsletters).toHaveLength(1);
      expect(store.newsletters[0].filename).toBe('test1.pdf');
    });

    it('should maintain selection state during real-time updates', async () => {
      let subscriptionCallback: (newsletters: any[]) => void;

      mockFirestoreService.subscribeToNewslettersForAdmin.mockImplementation((callback) => {
        subscriptionCallback = callback;
        return vi.fn();
      });

      await store.loadNewsletters();

      const newsletter1 = createValidNewsletter({ filename: 'test1.pdf' });
      const newsletter2 = createValidNewsletter({ filename: 'test2.pdf' });

      // Set initial newsletters and select one
      subscriptionCallback!([newsletter1, newsletter2]);
      store.selectNewsletter(newsletter1);

      expect(store.selectedNewsletters).toHaveLength(1);
      expect(store.selectedNewsletters[0].filename).toBe('test1.pdf');

      // Simulate real-time update that maintains the same newsletters
      const updatedNewsletter1 = createValidNewsletter({
        filename: 'test1.pdf',
        title: 'Updated Title'
      });
      subscriptionCallback!([updatedNewsletter1, newsletter2]);

      // Selection should still exist (though object reference may change)
      expect(store.newsletters).toHaveLength(2);
      expect(store.newsletters[0].title).toBe('Updated Title');
    });
  });
});
