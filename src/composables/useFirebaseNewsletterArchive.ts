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
import { type NewsletterMetadata } from '../services/firebase-firestore.service';
import { logger } from '../utils/logger';

export interface ArchiveFilters extends NewsletterSearchFilters {
  query?: string;
  sortBy?: 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'pages-desc' | 'pages-asc';
  groupByYear?: boolean;
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

  // Stats
  const stats = ref<ArchiveStats | null>(null);

  // Computed properties
  const hasResults = computed(() => filteredNewsletters.value.length > 0);
  const hasActiveFilters = computed(() => {
    const filters = currentFilters.value;
    return !!(
      filters.year ||
      filters.season ||
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
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)!.push(newsletter);
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
    return availableYears.value.map((year) => ({
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

      // Set up reactive connections
      newsletters.value = firebaseNewsletterService.newsletters.value;
      filteredNewsletters.value = newsletters.value;

      // Generate stats
      generateStats();

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

  const loadNewsletters = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const loadedNewsletters = await firebaseNewsletterService.loadNewsletters();
      newsletters.value = loadedNewsletters;

      // Apply current filters
      await applyFilters();
      generateStats();

      logger.success(`Loaded ${loadedNewsletters.length} newsletters`);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load newsletters';
      logger.error('Error loading newsletters:', err);
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

  const generateStats = () => {
    try {
      const availableYears = firebaseNewsletterService.getAvailableYears();
      const availableTags = firebaseNewsletterService.getAvailableTags();
      const serviceStats = firebaseNewsletterService.stats.value;

      stats.value = {
        totalNewsletters: newsletters.value.length,
        publishedThisYear: newsletters.value.filter((n) => n.year === new Date().getFullYear())
          .length,
        availableYears,
        availableTags,
        sourceCounts: serviceStats?.sourceCounts || {
          firebase: newsletters.value.length,
          local: 0,
          drive: 0,
          hybrid: 0,
        },
      };
    } catch (err) {
      logger.error('Error generating stats:', err);
    }
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
      generateStats();
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
    generateStats,
  };
}
