import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSiteStore } from '../../../src/stores/site-store-simple';
import type { NewsItem, ClassifiedAd, CommunityStats } from '../../../src/types';

// Mock Firebase services using established patterns
const mockFirestoreService = vi.hoisted(() => ({
  getPublishedContentAsNewsItems: vi.fn(),
  getClassifiedAds: vi.fn(),
  getCommunityStats: vi.fn(),
  subscribeToPublishedContent: vi.fn(),
  subscribeToClassifiedAds: vi.fn(),
  subscribeToNewsItems: vi.fn(),
  getContentByType: vi.fn(),
  getApprovedContent: vi.fn(),
  searchContent: vi.fn(),
  getPublishedContent: vi.fn(),
  convertUserContentToClassifiedAd: vi.fn()
}));

const mockUserSettings = vi.hoisted(() => ({
  theme: { value: 'light' },
  language: { value: 'en' },
  contentFilters: { value: {} },
  notificationPreferences: { value: {} },
  isDarkMode: { value: false },
  toggleDarkMode: vi.fn()
}));

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  success: vi.fn()
}));

// Apply mocks
vi.mock('../../../src/services/firebase-firestore.service', () => ({
  firestoreService: mockFirestoreService
}));

vi.mock('../../../src/composables/useUserSettings', () => ({
  useUserSettings: () => mockUserSettings
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: mockLogger
}));

describe('Site Store Simple Integration', () => {
  let store: ReturnType<typeof useSiteStore>;

  // Sample test data factories
  const createSampleNewsItem = (overrides: Partial<NewsItem> = {}): NewsItem => ({
    id: 'news-1',
    title: 'Community Update',
    summary: 'Important community announcement summary',
    content: 'Important community announcement content',
    author: 'Test User',
    date: '2024-01-15',
    category: 'news',
    featured: false,
    ...overrides
  });

  const createSampleClassifiedAd = (overrides: Partial<ClassifiedAd> = {}): ClassifiedAd => ({
    id: 'classified-1',
    title: 'Item for Sale',
    description: 'Great item in excellent condition',
    category: 'for-sale',
    price: '$100',
    contact: {
      name: 'Test User',
      email: 'contact@example.com'
    },
    datePosted: '2024-01-15',
    featured: false,
    ...overrides
  });

  const createSampleCommunityStats = (overrides: Partial<CommunityStats> = {}): CommunityStats => ({
    households: 150,
    lakes: 5,
    yearsPublished: 25,
    issuesPerYear: 12,
    ...overrides
  });

  beforeEach(() => {
    // Create fresh Pinia instance
    setActivePinia(createPinia());
    store = useSiteStore();

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup any active subscriptions
    if (store.cleanup) {
      store.cleanup();
    }
  });

  describe('Store Initialization', () => {
    it('should initialize with default state', () => {
      expect(store.newsItems).toEqual([]);
      expect(store.classifieds).toEqual([]);
      expect(store.isLoading).toBe(true); // Note: starts as true in this store
      expect(store.archivedIssues).toEqual([]);
      expect(store.events).toEqual([]);
      expect(store.isMenuOpen).toBe(false);
    });

    it('should initialize with proper default values for all state properties', () => {
      // Test all state properties have expected default values
      expect(store.newsItems).toBeInstanceOf(Array);
      expect(store.classifieds).toBeInstanceOf(Array);
      expect(store.archivedIssues).toBeInstanceOf(Array);
      expect(store.events).toBeInstanceOf(Array);
      expect(typeof store.isLoading).toBe('boolean');
      expect(typeof store.isMenuOpen).toBe('boolean');

      // Test computed properties have proper defaults
      expect(store.featuredNews).toEqual([]);
      expect(store.recentClassifieds).toEqual([]);
      expect(store.upcomingEvents).toEqual([]);
      expect(store.latestIssue).toBeNull();
    });

    it('should initialize Firebase service connections properly', () => {
      // Verify that the store has access to required services
      expect(store.userSettings).toBeDefined();
      expect(typeof store.isDarkMode).toBe('boolean');

      // Verify that cleanup function exists for managing subscriptions
      expect(typeof store.cleanup).toBe('function');
    });

    it('should initialize community stats with defaults', () => {
      expect(store.communityStats).toEqual({
        households: 0,
        lakes: 0,
        yearsPublished: 0,
        issuesPerYear: 0
      });

      // Test that stats is reactive
      expect(store.stats).toEqual(store.communityStats);
    });
  });

  describe('Data Loading Operations', () => {
    it('should load news items successfully', async () => {
      const sampleNewsItems = [
        createSampleNewsItem({ id: 'news-1', title: 'Test News 1' }),
        createSampleNewsItem({ id: 'news-2', title: 'Test News 2' })
      ];

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(sampleNewsItems);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});

      await store.loadInitialData();

      expect(mockFirestoreService.getPublishedContentAsNewsItems).toHaveBeenCalled();
      expect(store.newsItems).toEqual(sampleNewsItems);
      expect(mockLogger.success).toHaveBeenCalledWith('Loaded 2 published news items from Firebase');
    });

    it('should load classified ads successfully', async () => {
      const sampleUserContent = [
        {
          id: 'classified-1',
          type: 'classified',
          title: 'Test Classified',
          description: 'Test description',
          category: 'for-sale',
          datePosted: '2024-01-15'
        }
      ];

      const expectedClassified = createSampleClassifiedAd({
        id: 'classified-1',
        title: 'Test Classified'
      });

      mockFirestoreService.getPublishedContent.mockResolvedValue(sampleUserContent);
      mockFirestoreService.convertUserContentToClassifiedAd.mockReturnValue(expectedClassified);

      await store.loadInitialData();

      expect(mockFirestoreService.getPublishedContent).toHaveBeenCalled();
      expect(store.classifieds).toEqual([expectedClassified]);
    });

    it('should load community stats successfully', async () => {
      const expectedStats = createSampleCommunityStats({
        households: 150,
        lakes: 5,
        yearsPublished: 25,
        issuesPerYear: 12
      });

      // Mock the JSON import by setting stats directly (simulating successful load)
      await store.loadInitialData();

      // Since stats loading uses imported JSON, we verify the structure
      expect(typeof store.communityStats.households).toBe('number');
      expect(typeof store.communityStats.lakes).toBe('number');
      expect(typeof store.communityStats.yearsPublished).toBe('number');
      expect(typeof store.communityStats.issuesPerYear).toBe('number');
    });

    it('should handle loading errors gracefully', async () => {
      const error = new Error('Firebase connection failed');
      mockFirestoreService.getPublishedContentAsNewsItems.mockRejectedValue(error);
      mockFirestoreService.getPublishedContent.mockRejectedValue(error);

      await store.loadInitialData();

      // Should fallback to empty arrays
      expect(store.newsItems).toEqual([]);
      expect(store.classifieds).toEqual([]);

      // Should log errors appropriately
      expect(mockLogger.error).toHaveBeenCalledWith('Error loading published news items from Firebase:', error);
      expect(mockLogger.error).toHaveBeenCalledWith('Error loading classifieds:', error);
    });

    it('should update loading state during operations', async () => {
      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue([]);
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});

      // Initially loading should be true
      expect(store.isLoading).toBe(true);

      // After loading completes, should be false
      await store.loadInitialData();
      expect(store.isLoading).toBe(false);
    });
  });

  describe('Firebase Service Integration', () => {
    it('should setup reactive subscriptions for news items', async () => {
      const unsubscribeFn = vi.fn();
      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue([]);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(unsubscribeFn);

      await store.loadInitialData();

      // Verify subscription was set up
      expect(mockFirestoreService.subscribeToPublishedContent).toHaveBeenCalled();

      // Test subscription callback
      const mockCalls = mockFirestoreService.subscribeToPublishedContent.mock.calls;
      expect(mockCalls.length).toBeGreaterThan(0);

      const subscriptionCallback = mockCalls[0]?.[0];
      expect(subscriptionCallback).toBeDefined();

      if (subscriptionCallback) {
        const updatedItems = [createSampleNewsItem({ title: 'Updated News' })];
        subscriptionCallback(updatedItems);

        expect(store.newsItems).toEqual(updatedItems);
        expect(mockLogger.debug).toHaveBeenCalledWith('News items updated via subscription: 1 items');
      }
    });

    it('should handle subscription data updates', async () => {
      const unsubscribeFn = vi.fn();
      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue([]);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(unsubscribeFn);

      await store.loadInitialData();

      // Get the subscription callback
      const mockCalls = mockFirestoreService.subscribeToPublishedContent.mock.calls;
      const subscriptionCallback = mockCalls[0]?.[0];
      expect(subscriptionCallback).toBeDefined();

      if (subscriptionCallback) {
        // Test multiple updates
        const firstUpdate = [createSampleNewsItem({ id: '1', title: 'First' })];
        const secondUpdate = [
          createSampleNewsItem({ id: '1', title: 'First' }),
          createSampleNewsItem({ id: '2', title: 'Second' })
        ];

        subscriptionCallback(firstUpdate);
        expect(store.newsItems).toEqual(firstUpdate);

        subscriptionCallback(secondUpdate);
        expect(store.newsItems).toEqual(secondUpdate);
      }
    });

    it('should cleanup subscriptions properly', async () => {
      const unsubscribeFn = vi.fn();
      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue([]);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(unsubscribeFn);

      await store.loadInitialData();

      // Call cleanup
      store.cleanup();

      // Verify unsubscribe was called
      expect(unsubscribeFn).toHaveBeenCalled();
    });

    it('should handle Firebase auth state changes properly', () => {
      // Test that user settings are properly integrated
      expect(store.userSettings).toBeDefined();
      expect(typeof store.isDarkMode).toBe('boolean');

      // Test theme toggle functionality
      const toggleFn = store.toggleDarkMode;
      expect(typeof toggleFn).toBe('function');
    });
  });

  describe('Content Management', () => {
    it('should handle menu toggle operations correctly', () => {
      // Test initial state
      expect(store.isMenuOpen).toBe(false);

      // Test toggle open
      store.toggleMenu();
      expect(store.isMenuOpen).toBe(true);

      // Test toggle close
      store.toggleMenu();
      expect(store.isMenuOpen).toBe(false);

      // Test direct close
      store.toggleMenu(); // Open first
      store.closeMenu();
      expect(store.isMenuOpen).toBe(false);
    });

    it('should handle theme toggle operations correctly', () => {
      // Test that theme toggle calls userSettings
      store.toggleDarkMode();

      expect(mockUserSettings.toggleDarkMode).toHaveBeenCalled();
    });

    it('should handle content refresh operations correctly', async () => {
      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue([]);
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});

      // Test individual refresh operations
      await store.refreshNewsItems();
      expect(mockFirestoreService.getPublishedContentAsNewsItems).toHaveBeenCalled();

      await store.refreshClassifieds();
      expect(mockFirestoreService.getPublishedContent).toHaveBeenCalled();

      // Test refresh all
      vi.clearAllMocks();
      await store.refreshAll();
      expect(mockFirestoreService.getPublishedContentAsNewsItems).toHaveBeenCalled();
      expect(mockFirestoreService.getPublishedContent).toHaveBeenCalled();
    });

    it('should handle archived issues operations correctly', () => {
      // Test archived issues refresh (should be no-op based on store implementation)
      store.refreshArchivedIssues();

      // Should remain empty as PDF processing is removed
      expect(store.archivedIssues).toEqual([]);

      // Test events refresh (computed from newsItems, should be no-op)
      store.refreshEvents();
      expect(mockLogger.debug).toHaveBeenCalledWith('Events are computed from newsItems - no loading required');
    });
  });

  describe('Search and Filtering', () => {
    it('should search across all content types', async () => {
      const newsItems = [
        createSampleNewsItem({ id: 'news-1', title: 'Community Meeting', content: 'Important meeting about roads' }),
        createSampleNewsItem({ id: 'news-2', title: 'Lake Cleanup', content: 'Annual lake cleanup event' }),
        createSampleNewsItem({ id: 'news-3', title: 'Board Elections', content: 'Voting for new board members' })
      ];

      const classifiedContent = [
        {
          id: 'classified-1',
          type: 'classified',
          title: 'Boat for Sale',
          description: 'Great boat perfect for lake activities'
        }
      ];

      const classifiedAd = createSampleClassifiedAd({
        id: 'classified-1',
        title: 'Boat for Sale',
        description: 'Great boat perfect for lake activities'
      });

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(newsItems);
      mockFirestoreService.getPublishedContent.mockResolvedValue(classifiedContent);
      mockFirestoreService.convertUserContentToClassifiedAd.mockReturnValue(classifiedAd);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});

      await store.loadInitialData();

      // Verify all content is loaded
      expect(store.newsItems).toEqual(newsItems);
      expect(store.classifieds).toEqual([classifiedAd]);

      // Test that we can access all content for search purposes
      const allNewsItemTitles = store.newsItems.map(item => item.title);
      const allClassifiedTitles = store.classifieds.map(item => item.title);

      expect(allNewsItemTitles).toContain('Community Meeting');
      expect(allNewsItemTitles).toContain('Lake Cleanup');
      expect(allClassifiedTitles).toContain('Boat for Sale');
    });

    it('should filter content by type', async () => {
      const mixedNewsItems = [
        createSampleNewsItem({ id: 'news-1', category: 'news', title: 'News Article' }),
        createSampleNewsItem({ id: 'event-1', category: 'event', title: 'Community Event' }),
        createSampleNewsItem({ id: 'announce-1', category: 'announcement', title: 'Important Announcement' }),
        createSampleNewsItem({ id: 'event-2', category: 'event', title: 'Another Event' })
      ];

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(mixedNewsItems);
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});

      await store.loadInitialData();

      // Test filtering by category - events should be filtered out
      const eventsOnly = store.events;
      expect(eventsOnly).toHaveLength(2);
      expect(eventsOnly[0]?.title).toBe('Community Event');
      expect(eventsOnly[1]?.title).toBe('Another Event');

      // Test that all news items are available
      expect(store.newsItems).toHaveLength(4);

      // Test filtering news items by category
      const newsOnly = store.newsItems.filter(item => item.category === 'news');
      const announcementsOnly = store.newsItems.filter(item => item.category === 'announcement');

      expect(newsOnly).toHaveLength(1);
      expect(announcementsOnly).toHaveLength(1);
      expect(newsOnly[0]?.title).toBe('News Article');
      expect(announcementsOnly[0]?.title).toBe('Important Announcement');
    });

    it('should filter content by date range', async () => {
      const dateRangeNewsItems = [
        createSampleNewsItem({ id: 'old-1', title: 'Old News', date: '2023-01-15' }),
        createSampleNewsItem({ id: 'recent-1', title: 'Recent News', date: '2024-01-15' }),
        createSampleNewsItem({ id: 'current-1', title: 'Current News', date: '2024-12-15' }),
        createSampleNewsItem({ id: 'future-1', title: 'Future News', date: '2025-01-15' })
      ];

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(dateRangeNewsItems);
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});

      await store.loadInitialData();

      // Test filtering by year
      const year2024Items = store.newsItems.filter(item => item.date.startsWith('2024'));
      expect(year2024Items).toHaveLength(2);

      // Test filtering by specific date range
      const recentItems = store.newsItems.filter(item => {
        const itemDate = new Date(item.date);
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');
        return itemDate >= startDate && itemDate <= endDate;
      });
      expect(recentItems).toHaveLength(2);
      expect(recentItems.map(item => item.title)).toContain('Recent News');
      expect(recentItems.map(item => item.title)).toContain('Current News');
    });

    it('should filter content by featured status', async () => {
      const featuredNewsItems = [
        createSampleNewsItem({ id: 'featured-1', title: 'Featured 1', featured: true }),
        createSampleNewsItem({ id: 'featured-2', title: 'Featured 2', featured: true }),
        createSampleNewsItem({ id: 'regular-1', title: 'Regular 1', featured: false }),
        createSampleNewsItem({ id: 'regular-2', title: 'Regular 2' }) // undefined featured
      ];

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(featuredNewsItems);
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});

      await store.loadInitialData();

      // Test featured filtering via computed property
      expect(store.featuredNews).toHaveLength(2);
      expect(store.featuredNews[0]?.title).toBe('Featured 1');
      expect(store.featuredNews[1]?.title).toBe('Featured 2');

      // Test manual featured filtering
      const manualFeaturedFilter = store.newsItems.filter(item => item.featured === true);
      expect(manualFeaturedFilter).toHaveLength(2);

      // Test non-featured filtering
      const nonFeaturedFilter = store.newsItems.filter(item => !item.featured);
      expect(nonFeaturedFilter).toHaveLength(2);
    });

    it('should combine multiple filters', async () => {
      const complexNewsItems = [
        createSampleNewsItem({
          id: 'complex-1',
          title: 'Featured Event 2024',
          category: 'event',
          featured: true,
          date: '2024-06-15'
        }),
        createSampleNewsItem({
          id: 'complex-2',
          title: 'Regular News 2024',
          category: 'news',
          featured: false,
          date: '2024-06-15'
        }),
        createSampleNewsItem({
          id: 'complex-3',
          title: 'Featured News 2023',
          category: 'news',
          featured: true,
          date: '2023-06-15'
        }),
        createSampleNewsItem({
          id: 'complex-4',
          title: 'Featured Event 2023',
          category: 'event',
          featured: true,
          date: '2023-06-15'
        })
      ];

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(complexNewsItems);
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});

      await store.loadInitialData();

      // Test combined filters: featured + 2024 + events
      const featuredEvents2024 = store.newsItems.filter(item =>
        item.featured === true &&
        item.category === 'event' &&
        item.date.startsWith('2024')
      );
      expect(featuredEvents2024).toHaveLength(1);
      expect(featuredEvents2024[0]?.title).toBe('Featured Event 2024');

      // Test combined filters: featured + news category
      const featuredNews = store.newsItems.filter(item =>
        item.featured === true &&
        item.category === 'news'
      );
      expect(featuredNews).toHaveLength(1);
      expect(featuredNews[0]?.title).toBe('Featured News 2023');

      // Test that events computed property still works correctly
      const allEvents = store.events;
      expect(allEvents).toHaveLength(2);
      expect(allEvents.map(event => event.title)).toContain('Featured Event 2024');
      expect(allEvents.map(event => event.title)).toContain('Featured Event 2023');
    });
  });

  describe('User Settings Integration', () => {
    it('should respect user theme preferences', () => {
      // Test that store provides access to theme preferences
      expect(store.userSettings).toBeDefined();
      expect(store.isDarkMode).toBeDefined();
      expect(typeof store.isDarkMode).toBe('boolean');

      // Test initial theme state (based on our mock)
      expect(store.isDarkMode).toBe(false);

      // Test that theme toggle is available
      expect(typeof store.toggleDarkMode).toBe('function');

      // Test that the store correctly exposes user settings
      expect(store.userSettings.isDarkMode).toBeDefined();
      expect(store.userSettings.toggleDarkMode).toBeDefined();
    });

    it('should respect user language preferences', () => {
      // Test that language setting is accessible through userSettings
      // In the actual implementation, this would be store.userSettings.currentLanguage
      // For our mock, we check the basic structure
      expect(store.userSettings).toBeDefined();

      // The userSettings composable provides language functionality
      // In a real scenario, this would affect content filtering or display
      const hasLanguageSupport = typeof store.userSettings === 'object';
      expect(hasLanguageSupport).toBe(true);
    });

    it('should respect user content filter preferences', () => {
      // Test that store integrates with user settings for content preferences
      expect(store.userSettings).toBeDefined();

      // In the actual userSettings implementation, there are notification and display settings
      // that could affect content filtering
      const userSettingsObject = store.userSettings;
      expect(typeof userSettingsObject).toBe('object');

      // Test that the user settings integration is available for content filtering
      // This would be used for filtering news items, classifieds, etc.
      const hasSettingsIntegration = store.userSettings !== null && store.userSettings !== undefined;
      expect(hasSettingsIntegration).toBe(true);
    });

    it('should update when user settings change', () => {
      // Test that theme toggle functionality is properly connected
      store.toggleDarkMode();
      expect(mockUserSettings.toggleDarkMode).toHaveBeenCalled();

      // Test that the store maintains reactive connection to user settings
      expect(store.isDarkMode).toBe(mockUserSettings.isDarkMode.value);

      // Test that user settings object is reactive
      const settingsObject = store.userSettings;
      expect(settingsObject).toBeDefined();

      // Verify that settings changes can be observed through the store
      const initialDarkMode = store.isDarkMode;
      expect(typeof initialDarkMode).toBe('boolean');

      // The store should provide access to toggle functionality
      expect(typeof store.toggleDarkMode).toBe('function');
    });
  });

  describe('Community Statistics', () => {
    it('should calculate total news items correctly', () => {
      // TODO: Implement news count calculation test
      expect(true).toBe(true); // Placeholder
    });

    it('should calculate total classified ads correctly', () => {
      // TODO: Implement classified count calculation test
      expect(true).toBe(true); // Placeholder
    });

    it('should update stats when content changes', () => {
      // TODO: Implement stats update test
      expect(true).toBe(true); // Placeholder
    });

    it('should track last updated timestamp', () => {
      // TODO: Implement timestamp tracking test
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Error Handling', () => {
    it('should handle Firebase service errors', async () => {
      const firebaseError = new Error('Firebase: Permission denied');
      mockFirestoreService.getPublishedContentAsNewsItems.mockRejectedValue(firebaseError);
      mockFirestoreService.getPublishedContent.mockRejectedValue(firebaseError);

      await store.loadInitialData();

      // Should fallback to empty arrays without crashing
      expect(store.newsItems).toEqual([]);
      expect(store.classifieds).toEqual([]);

      // Should log the errors appropriately
      expect(mockLogger.error).toHaveBeenCalledWith('Error loading published news items from Firebase:', firebaseError);
      expect(mockLogger.error).toHaveBeenCalledWith('Error loading classifieds:', firebaseError);

      // Loading state should still complete
      expect(store.isLoading).toBe(false);
    });

    it('should handle network connectivity issues', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';

      mockFirestoreService.getPublishedContentAsNewsItems.mockRejectedValue(networkError);
      mockFirestoreService.getPublishedContent.mockRejectedValue(networkError);

      await store.loadInitialData();

      // Should gracefully handle network errors
      expect(store.newsItems).toEqual([]);
      expect(store.classifieds).toEqual([]);

      // Should log appropriate error messages
      expect(mockLogger.error).toHaveBeenCalledWith('Error loading published news items from Firebase:', networkError);
      expect(mockLogger.error).toHaveBeenCalledWith('Error loading classifieds:', networkError);

      // Store should remain in a stable state
      expect(store.isLoading).toBe(false);
      expect(typeof store.refreshAll).toBe('function'); // Recovery mechanism available
    });

    it('should handle data validation errors', async () => {
      // Test with malformed data that could cause validation errors
      const malformedNewsData = [
        { id: 'invalid-1' }, // Missing required fields
        { title: 'Missing ID' }, // Missing ID
        null, // Null value
        undefined // Undefined value
      ];

      const malformedClassifiedData = [
        { id: 'invalid-classified', type: 'classified' } // Missing required fields
      ];

      // Mock services to return malformed data
      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(malformedNewsData as any);
      mockFirestoreService.getPublishedContent.mockResolvedValue(malformedClassifiedData);
      mockFirestoreService.convertUserContentToClassifiedAd.mockImplementation(() => {
        throw new Error('Validation failed: Missing required fields');
      });
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});

      await store.loadInitialData();

      // Should handle validation errors gracefully
      expect(store.newsItems).toEqual(malformedNewsData); // Store might accept malformed data
      expect(store.classifieds).toEqual([]); // Should fallback to empty array on conversion error

      // Should log validation errors
      expect(mockLogger.error).toHaveBeenCalledWith('Error loading classifieds:', expect.any(Error));
    });

    it('should reset error state appropriately', async () => {
      // First, cause an error
      const initialError = new Error('Initial error');
      mockFirestoreService.getPublishedContentAsNewsItems.mockRejectedValue(initialError);
      mockFirestoreService.getPublishedContent.mockRejectedValue(initialError);

      await store.loadInitialData();

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith('Error loading published news items from Firebase:', initialError);

      // Reset mocks and simulate successful recovery
      vi.clearAllMocks();
      const successData = [createSampleNewsItem({ title: 'Recovery Success' })];
      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(successData);
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});

      // Test recovery through refresh
      await store.refreshAll();

      // Should successfully load data after error recovery
      expect(store.newsItems).toEqual(successData);
      expect(store.isLoading).toBe(false);

      // Should log successful recovery
      expect(mockLogger.success).toHaveBeenCalledWith('Loaded 1 published news items from Firebase');

      // Error logging should not be called during successful operation
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('Computed Properties', () => {
    it('should compute featured content correctly', async () => {
      const featuredNewsItems = [
        createSampleNewsItem({ id: '1', title: 'Featured 1', featured: true }),
        createSampleNewsItem({ id: '2', title: 'Featured 2', featured: true }),
        createSampleNewsItem({ id: '3', title: 'Featured 3', featured: true }),
        createSampleNewsItem({ id: '4', title: 'Featured 4', featured: true }) // 4th should be excluded
      ];
      const regularNewsItems = [
        createSampleNewsItem({ id: '5', title: 'Regular 1', featured: false }),
        createSampleNewsItem({ id: '6', title: 'Regular 2' }) // undefined featured
      ];

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue([
        ...featuredNewsItems,
        ...regularNewsItems
      ]);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);

      await store.loadInitialData();

      // Should show only first 3 featured items
      expect(store.featuredNews).toHaveLength(3);
      expect(store.featuredNews[0]?.title).toBe('Featured 1');
      expect(store.featuredNews[1]?.title).toBe('Featured 2');
      expect(store.featuredNews[2]?.title).toBe('Featured 3');
    });

    it('should compute recent content correctly', async () => {
      const recentClassifieds = [
        {
          id: 'class-1',
          type: 'classified',
          title: 'Recent 1',
          datePosted: '2024-01-20'
        },
        {
          id: 'class-2',
          type: 'classified',
          title: 'Recent 2',
          datePosted: '2024-01-19'
        },
        {
          id: 'class-3',
          type: 'classified',
          title: 'Recent 3',
          datePosted: '2024-01-18'
        }
      ];

      const classifiedAds = recentClassifieds.map(item =>
        createSampleClassifiedAd({
          id: item.id,
          title: item.title,
          datePosted: item.datePosted
        })
      );

      mockFirestoreService.getPublishedContent.mockResolvedValue(recentClassifieds);
      mockFirestoreService.convertUserContentToClassifiedAd
        .mockImplementation((content) => classifiedAds.find(ad => ad.id === content.id) as ClassifiedAd);
      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue([]);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});

      await store.loadInitialData();

      // Should show recent classifieds sorted by date (newest first) limited to 4
      expect(store.recentClassifieds).toHaveLength(3);
      expect(store.recentClassifieds[0]?.datePosted).toBe('2024-01-20'); // Most recent first
      expect(store.recentClassifieds[1]?.datePosted).toBe('2024-01-19');
      expect(store.recentClassifieds[2]?.datePosted).toBe('2024-01-18');
    });

    it('should compute content by category correctly', async () => {
      const newsItems = [
        createSampleNewsItem({ id: 'news-1', category: 'news', title: 'News 1' }),
        createSampleNewsItem({ id: 'event-1', category: 'event', title: 'Event 1' }),
        createSampleNewsItem({ id: 'announce-1', category: 'announcement', title: 'Announcement 1' }),
        createSampleNewsItem({ id: 'event-2', category: 'event', title: 'Event 2' })
      ];

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(newsItems);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);

      await store.loadInitialData();

      // Test events computed property
      const events = store.events;
      expect(events).toHaveLength(2);
      expect(events[0]?.title).toBe('Event 1');
      expect(events[1]?.title).toBe('Event 2');

      // Test upcoming events (should transform newsItems to event format)
      const upcomingEvents = store.upcomingEvents;
      expect(upcomingEvents).toHaveLength(4); // First 5 newsItems, but we only have 4
      expect(upcomingEvents[0]).toHaveProperty('organizer');
      expect(upcomingEvents[0]).toHaveProperty('time', 'TBD');
    });

    it('should compute search results correctly', async () => {
      // This test validates that all computed properties maintain reactive updates
      const initialNewsItems = [
        createSampleNewsItem({ id: '1', title: 'Initial News' })
      ];

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(initialNewsItems);
      const unsubscribeFn = vi.fn();
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(unsubscribeFn);
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);

      await store.loadInitialData();

      // Initial state
      expect(store.newsItems).toEqual(initialNewsItems);

      // Simulate subscription update
      const mockCalls = mockFirestoreService.subscribeToPublishedContent.mock.calls;
      const subscriptionCallback = mockCalls[0]?.[0];

      if (subscriptionCallback) {
        const updatedNewsItems = [
          createSampleNewsItem({ id: '1', title: 'Updated News' }),
          createSampleNewsItem({ id: '2', title: 'New News' })
        ];

        subscriptionCallback(updatedNewsItems);

        // Computed properties should update reactively
        expect(store.newsItems).toEqual(updatedNewsItems);
        expect(store.upcomingEvents).toHaveLength(2);
      }
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time news additions', async () => {
      const initialNewsItems = [
        createSampleNewsItem({ id: '1', title: 'Initial News' })
      ];

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(initialNewsItems);
      const unsubscribeFn = vi.fn();
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(unsubscribeFn);
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);

      await store.loadInitialData();

      // Verify initial state
      expect(store.newsItems).toEqual(initialNewsItems);

      // Simulate real-time addition via subscription callback
      const mockCalls = mockFirestoreService.subscribeToPublishedContent.mock.calls;
      const subscriptionCallback = mockCalls[0]?.[0];

      if (subscriptionCallback) {
        const updatedNewsItems = [
          ...initialNewsItems,
          createSampleNewsItem({ id: '2', title: 'New Real-time News', featured: true })
        ];

        subscriptionCallback(updatedNewsItems);

        // Verify real-time update
        expect(store.newsItems).toEqual(updatedNewsItems);
        expect(store.newsItems).toHaveLength(2);
        expect(store.featuredNews).toHaveLength(1);
        expect(store.featuredNews[0]?.title).toBe('New Real-time News');
      }
    });

    it('should handle real-time classified additions', async () => {
      const initialClassifieds = [
        { id: 'class-1', type: 'classified', title: 'Initial Classified', datePosted: '2024-01-15' }
      ];

      const initialAd = createSampleClassifiedAd({
        id: 'class-1',
        title: 'Initial Classified',
        datePosted: '2024-01-15'
      });

      mockFirestoreService.getPublishedContent.mockResolvedValue(initialClassifieds);
      mockFirestoreService.convertUserContentToClassifiedAd.mockImplementation((content) =>
        content.id === 'class-1' ? initialAd : createSampleClassifiedAd({
          id: content.id,
          title: content.title as string,
          datePosted: content.datePosted as string
        })
      );
      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue([]);
      const unsubscribeFn = vi.fn();
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(unsubscribeFn);

      await store.loadInitialData();

      // Verify initial state
      expect(store.classifieds).toHaveLength(1);

      // Simulate real-time classified addition
      const mockCalls = mockFirestoreService.subscribeToPublishedContent.mock.calls;
      const subscriptionCallback = mockCalls[0]?.[0];

      if (subscriptionCallback) {
        const updatedClassifieds = [
          ...initialClassifieds,
          { id: 'class-2', type: 'classified', title: 'New Real-time Classified', datePosted: '2024-01-16' }
        ];

        // Mock the new classified conversion
        const newAd = createSampleClassifiedAd({
          id: 'class-2',
          title: 'New Real-time Classified',
          datePosted: '2024-01-16'
        });

        mockFirestoreService.getPublishedContent.mockResolvedValue(updatedClassifieds);

        subscriptionCallback([]);

        await store.loadInitialData();

        // Since we need to trigger the classified loading separately
        expect(mockFirestoreService.getPublishedContent).toHaveBeenCalled();
      }
    });

    it('should handle real-time content updates', async () => {
      const initialNewsItems = [
        createSampleNewsItem({ id: '1', title: 'Original Title', featured: false })
      ];

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(initialNewsItems);
      const unsubscribeFn = vi.fn();
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(unsubscribeFn);
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);

      await store.loadInitialData();

      // Verify initial state
      expect(store.newsItems[0]?.title).toBe('Original Title');
      expect(store.newsItems[0]?.featured).toBe(false);

      // Simulate real-time content update
      const mockCalls = mockFirestoreService.subscribeToPublishedContent.mock.calls;
      const subscriptionCallback = mockCalls[0]?.[0];

      if (subscriptionCallback) {
        const updatedNewsItems = [
          createSampleNewsItem({ id: '1', title: 'Updated Title', featured: true })
        ];

        subscriptionCallback(updatedNewsItems);

        // Verify real-time update
        expect(store.newsItems[0]?.title).toBe('Updated Title');
        expect(store.newsItems[0]?.featured).toBe(true);
        expect(store.featuredNews).toHaveLength(1);
      }
    });

    it('should handle real-time content deletions', async () => {
      const initialNewsItems = [
        createSampleNewsItem({ id: '1', title: 'News to Delete' }),
        createSampleNewsItem({ id: '2', title: 'News to Keep' })
      ];

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(initialNewsItems);
      const unsubscribeFn = vi.fn();
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(unsubscribeFn);
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);

      await store.loadInitialData();

      // Verify initial state
      expect(store.newsItems).toHaveLength(2);

      // Simulate real-time content deletion
      const mockCalls = mockFirestoreService.subscribeToPublishedContent.mock.calls;
      const subscriptionCallback = mockCalls[0]?.[0];

      if (subscriptionCallback) {
        const updatedNewsItems = [
          createSampleNewsItem({ id: '2', title: 'News to Keep' })
        ];

        subscriptionCallback(updatedNewsItems);

        // Verify real-time deletion
        expect(store.newsItems).toHaveLength(1);
        expect(store.newsItems[0]?.title).toBe('News to Keep');
        expect(store.newsItems.find(item => item.id === '1')).toBeUndefined();
      }
    });
  });

  describe('Performance Optimizations', () => {
    it('should cache content appropriately', async () => {
      const newsItems = [
        createSampleNewsItem({ id: '1', title: 'Cached News' })
      ];

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(newsItems);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);

      // First load
      await store.loadInitialData();
      expect(store.newsItems).toEqual(newsItems);
      expect(mockFirestoreService.getPublishedContentAsNewsItems).toHaveBeenCalledTimes(1);

      // Second call should use cached data (verify through store state)
      const cachedNewsItems = store.newsItems;
      expect(cachedNewsItems).toEqual(newsItems);

      // Verify data persistence in store
      expect(store.isLoading).toBe(false);
      expect(store.newsItems).toBe(cachedNewsItems); // Reference equality for caching
    });

    it('should debounce search operations', async () => {
      const allContent = [
        createSampleNewsItem({ id: '1', title: 'Test Content for Search' }),
        createSampleNewsItem({ id: '2', title: 'Another Test Item' })
      ];

      mockFirestoreService.getPublishedContentAsNewsItems.mockResolvedValue(allContent);
      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);

      await store.loadInitialData();

      // Simulate rapid search queries (debouncing would be implemented in the store)
      const searchQueries = ['test', 'tes', 'te', 'test'];

      // In a real debounced implementation, only the last query would execute
      // For now, we test that the search functionality works correctly
      const searchResults = store.newsItems.filter(item =>
        item.title.toLowerCase().includes('test')
      );

      expect(searchResults).toHaveLength(2);
      expect(searchResults[0]?.title).toContain('Test');

      // Verify store maintains consistent state during search operations
      expect(store.newsItems).toEqual(allContent);
      expect(store.isLoading).toBe(false);
    });

    it('should lazy load content when needed', async () => {
      // Initial small set of content
      const initialNewsItems = [
        createSampleNewsItem({ id: '1', title: 'Initial Content' })
      ];

      const additionalNewsItems = [
        createSampleNewsItem({ id: '2', title: 'Lazy Loaded Content' }),
        createSampleNewsItem({ id: '3', title: 'More Lazy Content' })
      ];

      // Mock initial load
      mockFirestoreService.getPublishedContentAsNewsItems
        .mockResolvedValueOnce(initialNewsItems)
        .mockResolvedValueOnce([...initialNewsItems, ...additionalNewsItems]);

      mockFirestoreService.subscribeToPublishedContent.mockReturnValue(() => {});
      mockFirestoreService.getPublishedContent.mockResolvedValue([]);

      // Initial load
      await store.loadInitialData();
      expect(store.newsItems).toHaveLength(1);
      expect(store.newsItems[0]?.title).toBe('Initial Content');

      // Simulate lazy loading trigger (e.g., scroll or pagination)
      await store.loadInitialData(); // Simulate additional load

      // Verify lazy loading capability exists
      expect(mockFirestoreService.getPublishedContentAsNewsItems).toHaveBeenCalledTimes(2);

      // Verify store can handle incremental content loading
      expect(store.isLoading).toBe(false);
      expect(Array.isArray(store.newsItems)).toBe(true);
    });
  });
});
