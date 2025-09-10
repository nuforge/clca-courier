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
  const realClassifieds = ref<ClassifiedAd[]>([]);
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

  // Real classifieds from Firebase
  const classifieds = computed(() => realClassifieds.value);  const upcomingEvents = computed(() => {
    // Just show recent newsItems as "events" - keep it simple
    return newsItems.value
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.content,
        date: item.date,
        time: 'TBD',
        organizer: item.author,
      }));
  });

  const recentClassifieds = computed(() => {
    // Use real classifieds sorted by date
    return realClassifieds.value
      .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
      .slice(0, 4);
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
      // Load events (still computed from newsItems)
      loadEvents();

      // Load async functions
      await Promise.all([
        loadArchivedIssues(),
        loadNewsItems(),
        loadClassifieds(), // Now async and loads real data
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

  async function loadClassifieds() {
    try {
      logger.debug('Loading real classifieds from Firebase...');
      const userContent = await firestoreService.getPublishedContent();

      // Convert classified content to ClassifiedAd objects
      const classifiedContent = userContent
        .filter(content => content.type === 'classified')
        .map(content => firestoreService.convertUserContentToClassifiedAd(content));

      realClassifieds.value = classifiedContent;
      logger.debug('Loaded classifieds:', { count: classifiedContent.length, categories: classifiedContent.map(c => c.category) });
    } catch (error) {
      logger.error('Error loading classifieds:', error);
      realClassifieds.value = [];
    }
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

  async function refreshClassifieds() {
    await loadClassifieds();
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
