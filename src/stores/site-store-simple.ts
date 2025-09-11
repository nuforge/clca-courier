/**
 * LEGACY STORE - TEMPORARILY DISABLED FOR MIGRATION
 * This store uses removed NewsItem/ClassifiedAd interfaces.
 * Will be replaced with ContentDoc-based store system.
 * Currently not functional - TypeScript compilation will fail.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useUserSettings } from '../composables/useUserSettings';
import { logger } from '../utils/logger';

export const useSiteStore = defineStore('site', () => {
  // Initialize user settings
  const userSettings = useUserSettings();

  // Site state
  const isMenuOpen = ref(false);
  const isLoading = ref(false);

  // Data state
  const archivedIssues = ref<Record<string, unknown>[]>([]);

  // Computed values
  const archivedIssuesComputed = computed(() => archivedIssues.value);
  const isDarkMode = computed(() => userSettings.isDarkMode.value);

  // TEMPORARILY DISABLED: Legacy computed properties that depend on removed interfaces
  const newsItems = ref<unknown[]>([]);
  const classifieds = ref<unknown[]>([]);
  const events = ref<unknown[]>([]);
  const stats = ref({
    households: 0,
    lakes: 0,
    yearsPublished: 0,
    issuesPerYear: 0,
  });

  const featuredNews = computed(() => []);
  const recentClassifieds = computed(() => []);
  const upcomingEvents = computed(() => []);
  const latestIssue = computed(() => null);
  const communityStats = computed(() => stats.value);

  // Actions
  const toggleDarkMode = () => {
    userSettings.toggleDarkMode();
  };

  const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
  };

  const closeMenu = () => {
    isMenuOpen.value = false;
  };

  const loadInitialData = async (): Promise<void> => {
    try {
      isLoading.value = true;
      logger.debug('Site store disabled - loadInitialData is a no-op');
    } catch (error) {
      logger.error('Failed to load initial data:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const refreshArchivedIssues = async (): Promise<void> => {
    logger.debug('Site store disabled - refreshArchivedIssues is a no-op');
  };

  const refreshNewsItems = async (): Promise<void> => {
    logger.debug('Site store disabled - refreshNewsItems is a no-op');
  };

  const refreshClassifieds = async (): Promise<void> => {
    logger.debug('Site store disabled - refreshClassifieds is a no-op');
  };

  const refreshEvents = async (): Promise<void> => {
    logger.debug('Site store disabled - refreshEvents is a no-op');
  };

  const refreshAll = async (): Promise<void> => {
    logger.debug('Site store disabled - refreshAll is a no-op');
  };

  const cleanup = (): void => {
    logger.debug('Site store cleanup - no-op');
  };

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
    userSettings
  };
});
