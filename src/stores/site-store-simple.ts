import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Classified, NewsItem, Event } from '../components/models';
import type { PdfDocument } from '../composables/usePdfViewer';
import { dataService, type CommunityStats } from '../services/data-service';
import { useUserSettings } from '../composables/useUserSettings';

export const useSiteStore = defineStore('site', () => {
  // Initialize user settings
  const userSettings = useUserSettings();

  // Site state
  const isMenuOpen = ref(false);
  const isLoading = ref(true);

  // Data loaded from JSON files (simulating API)
  const newsItems = ref<NewsItem[]>([]);
  const classifieds = ref<Classified[]>([]);
  const events = ref<Event[]>([]);
  const archivedIssues = ref<PdfDocument[]>([]);
  const communityStats = ref<CommunityStats>({
    households: 0,
    lakes: 0,
    yearsPublished: 0,
    issuesPerYear: 0,
  });

  // Computed values
  const featuredNews = computed(() => newsItems.value.filter((item) => item.featured).slice(0, 3));

  const recentClassifieds = computed(() =>
    classifieds.value
      .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
      .slice(0, 4),
  );

  const upcomingEvents = computed(() =>
    events.value
      .filter((event) => new Date(event.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5),
  );

  // Get the latest issue (most recent)
  const latestIssue = computed(() => {
    if (archivedIssues.value.length === 0) return null;
    return archivedIssues.value[0]; // Assuming they're sorted by date, newest first
  });

  // Actions
  function toggleDarkMode() {
    void userSettings.toggleDarkMode();
  }

  function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
  }

  function setDarkMode(value: boolean) {
    const theme = value ? 'dark' : 'light';
    void userSettings.setTheme(theme);
  }

  // Data loading functions (simulating API calls)
  async function loadAllData() {
    try {
      isLoading.value = true;

      // Load all data in parallel
      const [news, classified, event, issues, stats] = await Promise.all([
        dataService.getNewsItems(),
        dataService.getClassifieds(),
        dataService.getEvents(),
        dataService.getArchivedIssues(),
        dataService.getCommunityStats(),
      ]);

      newsItems.value = news;
      classifieds.value = classified;
      events.value = event;
      archivedIssues.value = issues;
      communityStats.value = stats;
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadNewsItems() {
    try {
      newsItems.value = await dataService.getNewsItems();
    } catch (error) {
      console.error('Error loading news items:', error);
    }
  }

  async function loadClassifieds() {
    try {
      classifieds.value = await dataService.getClassifieds();
    } catch (error) {
      console.error('Error loading classifieds:', error);
    }
  }

  async function loadEvents() {
    try {
      events.value = await dataService.getEvents();
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }

  async function loadArchivedIssues() {
    try {
      archivedIssues.value = await dataService.getArchivedIssues();
    } catch (error) {
      console.error('Error loading archived issues:', error);
    }
  }

  // Initialize data on store creation
  void loadAllData();

  return {
    // State
    isDarkMode: userSettings.isDarkMode,
    isMenuOpen,
    isLoading,
    newsItems,
    classifieds,
    events,
    communityStats,
    archivedIssues,

    // User Settings
    userSettings: userSettings.userSettings,
    currentTheme: userSettings.currentTheme,
    notificationSettings: userSettings.notificationSettings,
    displaySettings: userSettings.displaySettings,
    pdfSettings: userSettings.pdfSettings,

    // Computed
    featuredNews,
    recentClassifieds,
    upcomingEvents,
    latestIssue,

    // Actions
    toggleDarkMode,
    toggleMenu,
    setDarkMode,
    loadAllData,
    loadNewsItems,
    loadClassifieds,
    loadEvents,
    loadArchivedIssues,

    // Settings actions
    updateUserSettings: userSettings.updateSettings,
    resetUserSettings: userSettings.resetSettings,
    exportUserSettings: userSettings.exportSettings,
    importUserSettings: userSettings.importSettings,
  };
});
