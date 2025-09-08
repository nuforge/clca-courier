/**
 * Firebase Newsletter Archive Composable
 * Vue 3 composable for Firebase-based newsletter archive functionality
 * Following protocols: Firebase-first, API-agnostic, dynamic content discovery
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  firebaseNewsletterService,
  type NewsletterSearchFilters,
  type NewsletterSearchResult,
} from '../services/firebase-newsletter.service';
import { type NewsletterMetadata, firestoreService } from '../services/firebase-firestore.service';
import { logger } from '../utils/logger';

export interface ArchiveFilters extends NewsletterSearchFilters {
  query?: string;
  sortBy?:
    | 'relevance'
    | 'date-desc'
    | 'date-asc'
    | 'title-asc'
    | 'title-desc'
    | 'pages-desc'
    | 'pages-asc';
  groupByYear?: boolean;
  viewMode?: 'grid' | 'list' | 'compact';
  accessibility?: {
    highContrast?: boolean;
    reducedMotion?: boolean;
    screenReaderOptimized?: boolean;
  };
}

export interface ArchiveStats {
  totalNewsletters: number;
  publishedThisYear: number;
  availableYears: number[];
  availableTags: string[];
  sourceCounts: {
    firebase: number;
    local: number;
    drive: number;
    hybrid: number;
  };
  accessibility: {
    withDescriptions: number;
    withThumbnails: number;
    withSearchableText: number;
    averagePageCount: number;
  };
}

export interface YearGroup {
  year: number;
  newsletters: NewsletterMetadata[];
}

export function useFirebaseNewsletterArchive() {
  // State
  const newsletters = ref<NewsletterMetadata[]>([]);
  const filteredNewsletters = ref<NewsletterMetadata[]>([]);
  const searchResults = ref<NewsletterSearchResult | null>(null);
  const isLoading = ref(false);
  const isSearching = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);

  // Filters and search
  const currentFilters = ref<ArchiveFilters>({});
  const searchQuery = ref('');

  // Reactive subscription management
  const unsubscribe = ref<(() => void) | null>(null);
  const currentMode = ref<'public' | 'admin'>('public');

  // Setup reactive subscription based on admin/public mode
  const setupReactiveSubscription = (includeUnpublished = false) => {
    // Cleanup existing subscription
    if (unsubscribe.value) {
      unsubscribe.value();
      unsubscribe.value = null;
    }

    const mode = includeUnpublished ? 'admin' : 'public';
    currentMode.value = mode;

    logger.info(`Setting up ${mode} newsletter subscription for archive...`);

    if (includeUnpublished) {
      // Admin mode: subscribe to ALL newsletters (including unpublished)
      unsubscribe.value = firestoreService.subscribeToNewslettersForAdmin((updatedNewsletters) => {
        logger.info(
          `Archive received ${updatedNewsletters.length} newsletters via admin subscription`,
        );
        newsletters.value = updatedNewsletters;
        void applyFilters(); // Re-apply filters when data updates
      });
    } else {
      // Public mode: subscribe to published newsletters only
      unsubscribe.value = firestoreService.subscribeToNewsletters((updatedNewsletters) => {
        logger.info(
          `Archive received ${updatedNewsletters.length} published newsletters via public subscription`,
        );
        newsletters.value = updatedNewsletters;
        void applyFilters(); // Re-apply filters when data updates
      });
    }
  };

  // Cleanup subscription on unmount
  onUnmounted(() => {
    if (unsubscribe.value) {
      unsubscribe.value();
      logger.info('Archive newsletter subscription cleaned up');
    }
  });

  // Stats (computed to be reactive)
  const stats = computed<ArchiveStats | null>(() => {
    if (newsletters.value.length === 0) return null;

    try {
      const allYears = [
        ...new Set(
          newsletters.value
            .map((n) => n.year)
            .filter((year): year is number => year !== undefined && year !== null),
        ),
      ].sort((a, b) => b - a);
      const allTags = [...new Set(newsletters.value.flatMap((n) => n.tags || []))].sort();

      // Get available years and tags
      const availableYears = allYears;
      const availableTags = allTags;

      // Calculate accessibility stats
      const withDescriptions = newsletters.value.filter((n) => !!n.description).length;
      const withThumbnails = newsletters.value.filter((n) => !!n.thumbnailUrl).length;
      const withSearchableText = newsletters.value.filter((n) => !!n.searchableText).length;
      const totalPages = newsletters.value.reduce((sum, n) => sum + (n.pageCount || 0), 0);
      const averagePageCount =
        newsletters.value.length > 0 ? Math.round(totalPages / newsletters.value.length) : 0;

      return {
        totalNewsletters: newsletters.value.length,
        publishedThisYear: newsletters.value.filter((n) => n.year === new Date().getFullYear())
          .length,
        availableYears,
        availableTags,
        sourceCounts: {
          firebase: newsletters.value.length,
          local: 0,
          drive: 0,
          hybrid: 0,
        },
        accessibility: {
          withDescriptions,
          withThumbnails,
          withSearchableText,
          averagePageCount,
        },
      };
    } catch (err) {
      logger.error('Error generating stats:', err);
      return null;
    }
  });

  // Computed properties
  const hasResults = computed(() => filteredNewsletters.value.length > 0);
  const hasActiveFilters = computed(() => {
    const filters = currentFilters.value;
    return !!(
      filters.year ||
      filters.month ||
      filters.tags?.length ||
      filters.featured !== undefined ||
      filters.contentType ||
      filters.availability ||
      filters.pageCount ||
      filters.actions ||
      searchQuery.value.trim()
    );
  });

  const sortedNewsletters = computed(() => {
    const newsletters = [...filteredNewsletters.value];
    const sortBy = currentFilters.value.sortBy || 'date-desc';
    const [field, direction] = sortBy.split('-');

    return newsletters.sort((a, b) => {
      let comparison = 0;

      switch (field) {
        case 'date': {
          const dateA = new Date(a.publicationDate);
          const dateB = new Date(b.publicationDate);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        }
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'pages':
          comparison = (a.pageCount || 0) - (b.pageCount || 0);
          break;
      }

      return direction === 'desc' ? -comparison : comparison;
    });
  });

  const newslettersByYear = computed(() => {
    const grouped = new Map<number, NewsletterMetadata[]>();

    sortedNewsletters.value.forEach((newsletter) => {
      const year = newsletter.year;
      if (year !== undefined && year !== null && !grouped.has(year)) {
        grouped.set(year, []);
      }
      if (year !== undefined && year !== null) {
        grouped.get(year)!.push(newsletter);
      }
    });

    return Array.from(grouped.entries())
      .map(([year, newsletters]) => ({ year, newsletters }))
      .sort((a, b) => b.year - a.year);
  });

  // Available filter options
  const availableYears = computed(() => {
    if (!stats.value) return [];
    return stats.value.availableYears;
  });

  const availableTags = computed(() => {
    if (!stats.value) return [];
    return stats.value.availableTags;
  });

  const yearFilterOptions = computed(() => {
    return availableYears.value
      .filter((year): year is number => year !== undefined && year !== null)
      .map((year) => ({
        label: year.toString(),
        value: year,
      }));
  });

  // Methods
  const initialize = async () => {
    if (initialized.value) return;

    try {
      isLoading.value = true;
      error.value = null;

      logger.info('Initializing Firebase Newsletter Archive...');

      // Initialize the Firebase service
      await firebaseNewsletterService.initialize();

      // Create reactive connection to the service's newsletters
      // Watch for changes from the Firebase service's real-time subscription
      watch(
        () => firebaseNewsletterService.newsletters.value,
        (newNewsletters) => {
          newsletters.value = [...newNewsletters]; // Create new array to trigger reactivity
          void applyFilters(); // Reapply filters
          // Stats will be automatically recalculated due to computed property
        },
        { immediate: true },
      );

      initialized.value = true;
      logger.success('Firebase Newsletter Archive initialized successfully');
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize archive';
      logger.error('Error initializing Firebase Newsletter Archive:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const loadNewsletters = async (includeUnpublished = false) => {
    try {
      isLoading.value = true;
      error.value = null;

      logger.info(
        `Initializing reactive subscription for ${includeUnpublished ? 'admin' : 'public'} mode...`,
      );

      // Setup reactive subscription instead of one-time loading
      setupReactiveSubscription(includeUnpublished);

      // Initial loading is handled by the subscription callback
      // Just wait a moment for the first data to arrive
      await new Promise((resolve) => setTimeout(resolve, 200));

      logger.success(
        `Initialized reactive subscription for newsletters${includeUnpublished ? ' (including unpublished)' : ''}`,
      );
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to initialize newsletter subscription';
      logger.error('Error initializing newsletter subscription:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const searchNewsletters = async (query: string) => {
    try {
      isSearching.value = true;
      error.value = null;
      searchQuery.value = query;

      if (!query.trim()) {
        // Clear search, apply filters to all newsletters
        searchResults.value = null;
        await applyFilters();
        return;
      }

      logger.info(`Searching newsletters for: "${query}"`);

      const results = await firebaseNewsletterService.searchNewsletters(
        query,
        currentFilters.value,
      );

      searchResults.value = results;
      filteredNewsletters.value = results.newsletters;

      logger.success(`Search found ${results.newsletters.length} results`);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Search failed';
      logger.error('Error searching newsletters:', err);
      throw err;
    } finally {
      isSearching.value = false;
    }
  };

  const applyFilters = async () => {
    try {
      if (searchQuery.value.trim()) {
        // If there's a search query, use search with filters
        await searchNewsletters(searchQuery.value);
        return;
      }

      // Apply filters to all newsletters
      const results = await firebaseNewsletterService.searchNewsletters('', currentFilters.value);
      filteredNewsletters.value = results.newsletters;

      logger.debug(`Applied filters, ${results.newsletters.length} newsletters match`);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to apply filters';
      logger.error('Error applying filters:', err);
    }
  };

  const updateFilters = async (newFilters: Partial<ArchiveFilters>) => {
    currentFilters.value = { ...currentFilters.value, ...newFilters };
    await applyFilters();
  };

  const clearFilters = () => {
    currentFilters.value = {};
    searchQuery.value = '';
    searchResults.value = null;
    filteredNewsletters.value = newsletters.value;
    logger.info('Filters cleared');
  };

  const getNewsletterById = async (id: string): Promise<NewsletterMetadata | null> => {
    try {
      return await firebaseNewsletterService.getNewsletterById(id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get newsletter';
      logger.error('Error getting newsletter by ID:', err);
      throw err;
    }
  };

  const getFeaturedNewsletters = (limit = 5): NewsletterMetadata[] => {
    return firebaseNewsletterService.getFeaturedNewsletters(limit);
  };

  /**
   * Get quick filter options for better UX (reactive computed)
   */
  const quickFilterOptions = computed(() => {
    const currentYear = new Date().getFullYear();
    return {
      currentYear: newsletters.value.filter((n) => n.year === currentYear),
      lastYear: newsletters.value.filter((n) => n.year === currentYear - 1),
      featured: newsletters.value.filter((n) => n.featured),
      withDescriptions: newsletters.value.filter((n) => !!n.description),
      recentlyAdded: newsletters.value
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    };
  });

  /**
   * Get quick filter options for better UX (legacy function for compatibility)
   */
  const getQuickFilterOptions = () => quickFilterOptions.value;

  /**
   * Get search suggestions based on current newsletters
   */
  const getSearchSuggestions = (partialQuery: string): string[] => {
    if (!partialQuery || partialQuery.length < 2) return [];

    const suggestions = new Set<string>();
    const queryLower = partialQuery.toLowerCase();

    newsletters.value.forEach((newsletter) => {
      // Title suggestions
      if (newsletter.title.toLowerCase().includes(queryLower)) {
        const words = newsletter.title.split(' ');
        words.forEach((word) => {
          if (word.toLowerCase().startsWith(queryLower)) {
            suggestions.add(word);
          }
        });
      }

      // Tag suggestions
      newsletter.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(queryLower)) {
          suggestions.add(tag);
        }
      });

      // Month suggestions (from publication date or season mapping)
      if (newsletter.publicationDate) {
        const monthNames = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];
        const month = new Date(newsletter.publicationDate).getMonth();
        const monthName = monthNames[month];
        if (monthName && monthName.toLowerCase().includes(queryLower)) {
          suggestions.add(monthName);
        }
      }
    });

    return Array.from(suggestions).slice(0, 8);
  };

  /**
   * Validate accessibility compliance for newsletters
   */
  const validateAccessibility = () => {
    const issues: string[] = [];

    newsletters.value.forEach((newsletter) => {
      if (!newsletter.description) {
        issues.push(`Newsletter "${newsletter.title}" missing description for screen readers`);
      }
      if (!newsletter.thumbnailUrl) {
        issues.push(`Newsletter "${newsletter.title}" missing thumbnail for visual identification`);
      }
      if (!newsletter.searchableText) {
        issues.push(
          `Newsletter "${newsletter.title}" missing searchable text for content discovery`,
        );
      }
    });

    return {
      totalIssues: issues.length,
      issues: issues.slice(0, 20), // Limit to prevent overwhelming
      complianceRate:
        newsletters.value.length > 0
          ? Math.round(
              ((newsletters.value.length - issues.length / 3) / newsletters.value.length) * 100,
            )
          : 100,
    };
  };

  // Debounced search
  let searchTimeout: NodeJS.Timeout;
  const debouncedSearch = (query: string, delay = 300) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      void searchNewsletters(query);
    }, delay);
  };

  // Watch for newsletter updates from Firebase service
  watch(
    () => firebaseNewsletterService.newsletters.value,
    (newNewsletters) => {
      newsletters.value = newNewsletters;
      void applyFilters();
      // Stats will be automatically recalculated due to computed property
    },
    { deep: true },
  );

  // Lifecycle hooks
  onMounted(() => {
    void initialize();
  });

  onUnmounted(() => {
    clearTimeout(searchTimeout);
    firebaseNewsletterService.destroy();
  });

  return {
    // State
    newsletters: computed(() => newsletters.value),
    filteredNewsletters: computed(() => filteredNewsletters.value),
    sortedNewsletters,
    newslettersByYear,
    searchResults: computed(() => searchResults.value),
    isLoading: computed(() => isLoading.value),
    isSearching: computed(() => isSearching.value),
    error: computed(() => error.value),
    stats: computed(() => stats.value),
    initialized: computed(() => initialized.value),

    // Filters and search
    currentFilters: computed(() => currentFilters.value),
    searchQuery: computed(() => searchQuery.value),
    hasResults,
    hasActiveFilters,

    // Filter options
    availableYears,
    availableTags,
    yearFilterOptions,
    quickFilterOptions,

    // Methods
    initialize,
    loadNewsletters,
    searchNewsletters,
    debouncedSearch,
    applyFilters,
    updateFilters,
    clearFilters,
    getNewsletterById,
    getFeaturedNewsletters,
    getQuickFilterOptions,
    getSearchSuggestions,
    validateAccessibility,
  };
}
