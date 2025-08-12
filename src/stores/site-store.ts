import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';

// Types for our data structures
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  date: string;
  category: 'news' | 'announcement' | 'event';
  featured?: boolean;
}

export interface ClassifiedAd {
  id: string;
  title: string;
  description: string;
  price?: string;
  category: 'for-sale' | 'services' | 'wanted' | 'free';
  contact: {
    name: string;
    email?: string;
    phone?: string;
  };
  datePosted: string;
  featured?: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  organizer?: string;
}

export interface CommunityStats {
  households: number;
  lakes: number;
  yearsPublished: number;
  issuesPerYear: number;
}

export const useSiteStore = defineStore('site', () => {
  // Site state
  const isDarkMode = ref(false);
  const isMenuOpen = ref(false);

  // Data refs
  const newsItems = ref<NewsItem[]>([]);
  const classifieds = ref<ClassifiedAd[]>([]);
  const events = ref<Event[]>([]);
  const communityStats = ref<CommunityStats>({
    households: 450,
    lakes: 3,
    yearsPublished: 29,
    issuesPerYear: 12,
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

  // Actions
  function toggleDarkMode() {
    const $q = useQuasar();
    isDarkMode.value = !isDarkMode.value;
    if ($q.dark) {
      $q.dark.set(isDarkMode.value);
    }
  }

  function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
  }

  function setDarkMode(value: boolean) {
    isDarkMode.value = value;
    const $q = useQuasar();
    if ($q.dark) {
      $q.dark.set(value);
    }
  }

  // Data loading functions
  async function loadNewsItems() {
    try {
      const response = await import('../data/news.json');
      newsItems.value = response.default as NewsItem[];
    } catch (error) {
      console.error('Failed to load news items:', error);
    }
  }

  async function loadClassifieds() {
    try {
      const response = await import('../data/classifieds.json');
      classifieds.value = response.default as ClassifiedAd[];
    } catch (error) {
      console.error('Failed to load classifieds:', error);
    }
  }

  async function loadEvents() {
    try {
      const response = await import('../data/events.json');
      events.value = response.default as Event[];
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }

  async function loadAllData() {
    await Promise.all([loadNewsItems(), loadClassifieds(), loadEvents()]);
  }

  // Initialize data on store creation
  void loadAllData();

  return {
    // State
    isDarkMode,
    isMenuOpen,
    newsItems,
    classifieds,
    events,
    communityStats,

    // Computed
    featuredNews,
    recentClassifieds,
    upcomingEvents,

    // Actions
    toggleDarkMode,
    toggleMenu,
    setDarkMode,
    loadNewsItems,
    loadClassifieds,
    loadEvents,
    loadAllData,
  };
});
