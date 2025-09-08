import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ClassifiedAd, NewsItem, Event, CommunityStats } from '../types';
import type { PdfDocument } from '../composables/usePdfViewer';
import { useUserSettings } from '../composables/useUserSettings';
import { lightweightNewsletterService } from '../services/lightweight-newsletter-service';

// Import JSON data directly
import newsData from '../data/news.json';
import classifiedsData from '../data/classifieds.json';
import eventsData from '../data/events.json';
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
  const archivedIssues = ref<PdfDocument[]>([]);
  const newsItems = ref<NewsItem[]>([]);
  const classifieds = ref<ClassifiedAd[]>([]);
  const events = ref<Event[]>([]);
  const stats = ref<CommunityStats>({
    households: 0,
    lakes: 0,
    yearsPublished: 0,
    issuesPerYear: 0,
  });

  // Computed values
  const archivedIssuesComputed = computed(() => archivedIssues.value);

  // Add isDarkMode computed from userSettings
  const isDarkMode = computed(() => userSettings.isDarkMode.value);

  // Add communityStats computed alias for backward compatibility
  const communityStats = computed(() => stats.value);

  const featuredNews = computed(() => newsItems.value.filter((item) => item.featured).slice(0, 3));

  const recentClassifieds = computed(() =>
    classifieds.value
      .sort(
        (a: ClassifiedAd, b: ClassifiedAd) =>
          new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime(),
      )
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
      await Promise.all([
        loadArchivedIssues(),
        loadNewsItems(),
        loadClassifieds(),
        loadEvents(),
        loadStats(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadArchivedIssues() {
    try {
      const newsletters = await lightweightNewsletterService.getNewsletters();
      // Transform UnifiedNewsletter to PdfDocument format
      archivedIssues.value = newsletters.map((newsletter) => ({
        id: parseInt(newsletter.id, 10),
        title: newsletter.title,
        date: newsletter.publicationDate,
        pages: newsletter.pageCount,
        url: newsletter.downloadUrl,
        filename: newsletter.filename,
        status: 'local' as const,
        syncStatus: 'synced' as const,
        description: newsletter.description || '',
        fileSize: String(newsletter.fileSize),
        thumbnailUrl: newsletter.thumbnailUrl || '',
        tags: newsletter.tags,
        category: newsletter.categories?.[0] || '',
      }));
    } catch (error) {
      console.error('Error loading archived issues:', error);
      archivedIssues.value = [];
    }
  }

  async function loadNewsItems() {
    try {
      await delay(100); // Simulate network delay
      newsItems.value = newsData as NewsItem[];
    } catch (error) {
      console.error('Error loading news items:', error);
      newsItems.value = [];
    }
  }

  async function loadClassifieds() {
    try {
      await delay(100);
      classifieds.value = classifiedsData as ClassifiedAd[];
    } catch (error) {
      console.error('Error loading classifieds:', error);
      classifieds.value = [];
    }
  }

  async function loadEvents() {
    try {
      await delay(100);
      events.value = eventsData as Event[];
    } catch (error) {
      console.error('Error loading events:', error);
      events.value = [];
    }
  }

  async function loadStats() {
    try {
      await delay(100);
      stats.value = communityStatsData as CommunityStats;
    } catch (error) {
      console.error('Error loading stats:', error);
      stats.value = {
        households: 0,
        lakes: 0,
        yearsPublished: 0,
        issuesPerYear: 0,
      };
    }
  }

  // Refresh functions
  async function refreshArchivedIssues() {
    await loadArchivedIssues();
  }

  async function refreshNewsItems() {
    await loadNewsItems();
  }

  async function refreshClassifieds() {
    await loadClassifieds();
  }

  async function refreshEvents() {
    await loadEvents();
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

    // User settings
    userSettings,
  };
});
