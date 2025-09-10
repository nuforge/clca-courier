import { defineStore } from 'pinia';
import { ref, computed, onUnmounted } from 'vue';
import type { NewsItem, CommunityStats, ClassifiedAd } from '../types';
import { useUserSettings } from '../composables/useUserSettings';
import { logger } from '../utils/logger';
import { firestoreService } from '../services/firebase-firestore.service';
import type { Unsubscribe } from 'firebase/firestore';

// Import JSON data directly (keeping for stats only)
import communityStatsData from '../data/community-stats.json';

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useSiteStore = defineStore('site', () => {
  // Initialize user settings
  const userSettings = useUserSettings();

  // Site state
  const isMenuOpen = ref(false);
  const isLoading = ref(true);

  // Data state
  const archivedIssues = ref<Record<string, unknown>[]>([]);
  const newsItems = ref<NewsItem[]>([]);
  const stats = ref<CommunityStats>({
    households: 0,
    lakes: 0,
    yearsPublished: 0,
    issuesPerYear: 0,
  });

  // Firebase subscription state
  let newsSubscription: Unsubscribe | null = null;

  // Computed values
  const archivedIssuesComputed = computed(() => archivedIssues.value);

  // Add isDarkMode computed from userSettings
  const isDarkMode = computed(() => userSettings.isDarkMode.value);

  // Add communityStats computed alias for backward compatibility
  const communityStats = computed(() => stats.value);

  const featuredNews = computed(() => newsItems.value.filter((item) => item.featured).slice(0, 3));

  // Filter newsItems to get events (where category is 'event')
  const events = computed(() =>
    newsItems.value
      .filter((item) => item.category === 'event')
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.content,
        date: item.date,
        time: 'TBD',
        organizer: item.author,
      }))
  );

  // Filter newsItems to get classifieds (announcements that look like classifieds)
  const classifieds = computed(() =>
    newsItems.value
      .filter((item) =>
        item.category === 'announcement' &&
        (item.summary.toLowerCase().includes('sale') ||
         item.summary.toLowerCase().includes('wanted') ||
         item.summary.toLowerCase().includes('free') ||
         item.title.toLowerCase().includes('for sale'))
      )
      .map((item) => {
        const classified: Record<string, unknown> = {
          id: item.id,
          title: item.title,
          description: item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content,
          datePosted: item.date,
          category: 'for-sale' as const,
          contact: {
            name: item.author,
          },
        };

        if (item.featured) {
          classified.featured = item.featured;
        }

        // Don't add price property at all if we don't have one
        // classified.price could be added later when we extract from content

        return classified as unknown as ClassifiedAd;
      })
  );  const upcomingEvents = computed(() => {
    // Filter newsItems for events and convert to Event format
    return newsItems.value
      .filter((item) => item.category === 'event')
      .filter((item) => new Date(item.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.content,
        date: item.date,
        time: 'TBD', // Could extract from content if needed
        organizer: item.author,
      }));
  });

  const recentClassifieds = computed(() => {
    // Filter newsItems for classifieds/announcements that look like classifieds
    return newsItems.value
      .filter((item) => item.category === 'announcement' || item.summary.toLowerCase().includes('sale') || item.summary.toLowerCase().includes('wanted'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)
      .map((item) => {
        const classified: Record<string, unknown> = {
          id: item.id,
          title: item.title,
          description: item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content,
          datePosted: item.date,
          category: 'for-sale' as const,
          contact: {
            name: item.author,
          },
        };

        if (item.featured) {
          classified.featured = item.featured;
        }

        // Don't add price property at all if we don't have one

        return classified as unknown as ClassifiedAd;
      });
  });  // Get the latest issue (most recent)
  const latestIssue = computed(() => {
    const issues = archivedIssuesComputed.value;
    if (issues.length === 0) return null;
    return issues[0]; // Assuming they're sorted by date, newest first
  });

  // Actions
  function toggleDarkMode() {
    void userSettings.toggleDarkMode();
  }

  function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
  }

  function closeMenu() {
    isMenuOpen.value = false;
  }

  async function loadInitialData() {
    isLoading.value = true;
    try {
      // Load synchronous functions first
      loadClassifieds();
      loadEvents();

      // Load async functions
      await Promise.all([
        loadArchivedIssues(),
        loadNewsItems(),
        loadStats(),
      ]);
    } catch (error) {
      logger.error('Error loading initial data:', error);
    } finally {
      isLoading.value = false;
    }
  }

  function loadArchivedIssues() {
    // Archived issues loading removed - no PDF processing
    // This function remains for future implementation if needed
    archivedIssues.value = [];
    logger.debug('Archived issues loading skipped - PDF processing removed');
  }

  async function loadNewsItems() {
    try {
      await delay(100); // Simulate network delay
      logger.debug('Loading news items from Firebase...');
      // Load published content from Firebase for public news page
      newsItems.value = await firestoreService.getPublishedContentAsNewsItems();
      logger.success(`Loaded ${newsItems.value.length} published news items from Firebase`);

      // Set up real-time subscription for future updates
      setupNewsSubscription();
    } catch (error) {
      logger.error('Error loading published news items from Firebase:', error);
      // Fallback to empty array if Firebase fails
      newsItems.value = [];
    }
  }

  function setupNewsSubscription() {
    // Clean up existing subscription
    if (newsSubscription) {
      newsSubscription();
    }

    // Set up new subscription for real-time updates - use published content only for public access
    newsSubscription = firestoreService.subscribeToPublishedContent((newItems) => {
      newsItems.value = newItems;
      logger.debug(`News items updated via subscription: ${newItems.length} items`);
    });
  }

  function cleanup() {
    if (newsSubscription) {
      newsSubscription();
      newsSubscription = null;
    }
  }

  // Cleanup when store is unmounted
  onUnmounted(() => {
    cleanup();
  });

  function loadClassifieds() {
    // Classifieds are now computed from newsItems - no separate loading needed
    logger.debug('Classifieds are computed from newsItems - no loading required');
  }

  function loadEvents() {
    // Events are now computed from newsItems - no separate loading needed
    logger.debug('Events are computed from newsItems - no loading required');
  }

  async function loadStats() {
    try {
      await delay(100);
      stats.value = communityStatsData as CommunityStats;
    } catch (error) {
      logger.error('Error loading stats:', error);
      stats.value = {
        households: 0,
        lakes: 0,
        yearsPublished: 0,
        issuesPerYear: 0,
      };
    }
  }

  // Refresh functions
  function refreshArchivedIssues() {
    loadArchivedIssues();
  }

  async function refreshNewsItems() {
    await loadNewsItems();
  }

  function refreshClassifieds() {
    loadClassifieds();
  }

  function refreshEvents() {
    loadEvents();
  }

  async function refreshAll() {
    await loadInitialData();
  }

  // Return reactive state and actions
  return {
    // State
    isMenuOpen,
    isLoading,
    archivedIssues: archivedIssuesComputed,
    newsItems,
    classifieds,
    events,
    stats,

    // Computed
    featuredNews,
    recentClassifieds,
    upcomingEvents,
    latestIssue,
    isDarkMode,
    communityStats,

    // Actions
    toggleDarkMode,
    toggleMenu,
    closeMenu,
    loadInitialData,
    refreshArchivedIssues,
    refreshNewsItems,
    refreshClassifieds,
    refreshEvents,
    refreshAll,
    cleanup,

    // User settings
    userSettings,
  };
});
