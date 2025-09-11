/**
 * Content Store - ContentDoc-Based Replacement for Legacy site-store-simple
 *
 * This store implements the new ContentDoc architecture with tag-based filtering.
 * Replaces all legacy NewsItem/ClassifiedAd/Event interfaces with unified ContentDoc.
 *
 * Philosophy: "A content object is a base entity that has features, not is a type."
 */

import { defineStore } from 'pinia';
import { ref, computed, onUnmounted } from 'vue';
import { useUserSettings } from '../composables/useUserSettings';
import { logger } from '../utils/logger';
import { firebaseContentService } from '../services/firebase-content.service';
import type { ContentDoc } from '../types/core/content.types';
import { contentUtils } from '../types/core/content.types';
import type { Unsubscribe } from 'firebase/firestore';

// Import JSON data for stats
import communityStatsData from '../data/community-stats.json';

// Community stats interface (unchanged)
interface CommunityStats {
  households: number;
  lakes: number;
  yearsPublished: number;
  issuesPerYear: number;
}

export const useContentStore = defineStore('content', () => {
  // Initialize user settings
  const userSettings = useUserSettings();

  // Site state
  const isMenuOpen = ref(false);
  const isLoading = ref(true);

  // Data state - ALL using ContentDoc
  const archivedIssues = ref<Record<string, unknown>[]>([]);
  const contentItems = ref<ContentDoc[]>([]);
  const stats = ref<CommunityStats>({
    households: 0,
    lakes: 0,
    yearsPublished: 0,
    issuesPerYear: 0,
  });

  // Firebase subscription state
  let contentSubscription: Unsubscribe | null = null;

  // Computed values - ContentDoc-based filtering using tags
  const archivedIssuesComputed = computed(() => archivedIssues.value);
  const isDarkMode = computed(() => userSettings.isDarkMode.value);
  const communityStats = computed(() => stats.value);

  // NEWS: Filter by content-type:news tag
  const newsItems = computed(() =>
    contentItems.value.filter(content =>
      contentUtils.hasTag(content, 'content-type:news') ||
      contentUtils.hasTag(content, 'content-type:announcement')
    )
  );

  const featuredNews = computed(() =>
    newsItems.value
      .filter(content => contentUtils.hasTag(content, 'featured:true'))
      .slice(0, 3)
  );

  // EVENTS: Filter by content-type:event tag OR feat:date feature
  const events = computed(() =>
    contentItems.value.filter(content =>
      contentUtils.hasTag(content, 'content-type:event') ||
      contentUtils.hasFeature(content, 'feat:date')
    )
  );

  const upcomingEvents = computed(() => {
    return events.value
      .filter(content => {
        // Filter for future events if they have date features
        if (contentUtils.hasFeature(content, 'feat:date')) {
          const dateFeature = contentUtils.getFeature(content, 'feat:date');
          if (dateFeature) {
            const eventDate = dateFeature.start.toDate();
            return eventDate > new Date();
          }
        }
        return true; // Include events without dates
      })
      .slice(0, 10);
  });

  // CLASSIFIEDS: Filter by content-type:classified tag
  const classifieds = computed(() =>
    contentItems.value.filter(content =>
      contentUtils.hasTag(content, 'content-type:classified')
    )
  );

  const recentClassifieds = computed(() =>
    classifieds.value
      .sort((a, b) => b.timestamps.created.toMillis() - a.timestamps.created.toMillis())
      .slice(0, 5)
  );

  // TASKS: Filter by feat:task feature
  const tasks = computed(() =>
    contentItems.value.filter(content =>
      contentUtils.hasFeature(content, 'feat:task')
    )
  );

  // Actions
  const toggleDarkMode = () => {
    void userSettings.toggleDarkMode();
  };

  const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
  };

  const closeMenu = () => {
    isMenuOpen.value = false;
  };

  const refreshArchivedIssues = (): void => {
    try {
      logger.debug('Refreshing archived issues data');
      // This is local data, no async needed currently
      // Future: could sync with Firebase Storage metadata
    } catch (error) {
      logger.error('Failed to refresh archived issues:', error);
    }
  };

  const refreshContent = async (): Promise<void> => {
    try {
      logger.debug('Refreshing content from Firebase ContentDoc collection');

      // Fetch published content from the new ContentDoc collection
      const publishedContent = await firebaseContentService.getPublishedContent();
      contentItems.value = publishedContent;

      logger.success(`Loaded ${contentItems.value.length} published content items from ContentDoc collection`);
    } catch (error) {
      logger.error('Failed to refresh content:', error);
      contentItems.value = [];
    }
  };

  const subscribeToContent = (): void => {
    try {
      logger.debug('Setting up real-time ContentDoc subscription');

      // Use the new Firebase ContentDoc service for real-time updates
      contentSubscription = firebaseContentService.subscribeToPublishedContent((contentDocs) => {
        contentItems.value = contentDocs;
        logger.debug(`Real-time update: received ${contentDocs.length} ContentDoc items`);
      });

      logger.success('ContentDoc subscription established');
    } catch (error) {
      logger.error('Failed to setup content subscription:', error);
    }
  };

  const refreshAll = async (): Promise<void> => {
    try {
      logger.debug('Refreshing all site data');
      stats.value = communityStatsData as CommunityStats;

      // Run all refresh operations in parallel
      await Promise.all([
        refreshArchivedIssues(),
        refreshContent(),
      ]);

      logger.success('All site data refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh all data:', error);
    }
  };

  const loadInitialData = async (): Promise<void> => {
    try {
      isLoading.value = true;
      logger.debug('Loading initial site data');

      // Subscribe to real-time content updates
      subscribeToContent();

      // Load all data
      await refreshAll();
    } catch (error) {
      logger.error('Failed to load initial data:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const cleanup = (): void => {
    if (contentSubscription) {
      contentSubscription();
      contentSubscription = null;
      logger.debug('Content subscription cleaned up');
    }
  };

  // Cleanup on unmount
  onUnmounted(() => {
    cleanup();
  });

  return {
    // State
    isMenuOpen,
    isLoading,
    archivedIssues: archivedIssuesComputed,
    contentItems,
    newsItems,
    classifieds,
    events,
    tasks,
    stats,

    // Computed
    featuredNews,
    recentClassifieds,
    upcomingEvents,
    isDarkMode,
    communityStats,

    // Actions
    toggleDarkMode,
    toggleMenu,
    closeMenu,
    loadInitialData,
    refreshArchivedIssues,
    refreshContent,
    refreshAll,
    cleanup,

    // User settings
    userSettings
  };
});

/**
 * TEMPORARY CONVERSION FUNCTION
 * Converts legacy UserContent to ContentDoc format during migration.
 * TODO: Remove once we fully migrate to ContentDoc collection
 */
/**
 * Legacy compatibility alias - DEPRECATED
 * Provides temporary compatibility for existing components.
 * TODO: Update all components to use useContentStore and remove this alias
 */
export const useSiteStore = useContentStore;
