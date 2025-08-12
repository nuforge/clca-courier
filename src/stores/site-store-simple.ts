import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { Classified, NewsItem, Event } from '../components/models';
import type { PdfDocument } from '../composables/usePdfViewer';

// Hard-coded data for now - easy to switch to API later
export const useSiteStore = defineStore('site', () => {
  // Site state
  const isDarkMode = ref(false);
  const isMenuOpen = ref(false);

  // Initialize Quasar instance
  const $q = useQuasar();

  // Watch for changes to isDarkMode and sync with Quasar
  watch(
    isDarkMode,
    (newValue) => {
      if ($q.dark) {
        $q.dark.set(newValue);
      }
    },
    { immediate: true },
  );

  // Hard-coded sample data
  const newsItems = ref<NewsItem[]>([
    {
      id: 'news-001',
      title: 'Community Board Meeting Scheduled for August 15th',
      summary:
        'Join us for our monthly community board meeting to discuss upcoming projects and community concerns.',
      content:
        "The Conashaugh Lakes Community Association will be holding its monthly board meeting on August 15th at 7:00 PM at the community center. This month's agenda includes discussions about the upcoming lake cleanup initiative, new safety protocols for the swimming areas, and updates on the road maintenance project.\n\nAll residents are encouraged to attend and voice their concerns or suggestions. Light refreshments will be provided.\n\nFor more information, please contact the community office at (570) 555-0123.",
      author: 'Community Board',
      date: '2025-08-10',
      category: 'announcement' as const,
      featured: true,
    },
    {
      id: 'news-002',
      title: 'Lake Cleanup Day - Volunteers Needed',
      summary:
        'Help keep our lakes beautiful! Volunteer for our annual lake cleanup day on August 20th.',
      content:
        "Our annual lake cleanup day is scheduled for Saturday, August 20th, starting at 9:00 AM. We're looking for volunteers to help remove debris, invasive plants, and litter from around all three lakes.\n\nVolunteers should meet at the main beach area and bring work gloves, water bottles, and sun protection. All cleanup supplies will be provided by the association.\n\nLunch will be provided for all volunteers, and community service hours will be documented for students who need them.\n\nTo sign up, please call the community office or email cleanup@conaslakes.org.",
      author: 'Environmental Committee',
      date: '2025-08-08',
      category: 'event' as const,
      featured: true,
    },
  ]);

  const classifieds = ref<Classified[]>([
    {
      id: 'classified-001',
      title: 'Kayak for Sale - Almost New',
      description:
        'Barely used single-person kayak in excellent condition. Includes paddle and life vest. Perfect for exploring our beautiful lakes.',
      price: '$350',
      category: 'for-sale' as const,
      contact: {
        name: 'Mike Johnson',
        email: 'mjohnson@email.com',
        phone: '(570) 555-0156',
      },
      datePosted: '2025-08-10',
      featured: true,
    },
    {
      id: 'classified-002',
      title: 'Professional Lawn Care Services',
      description:
        'Experienced lawn care professional offering mowing, trimming, leaf removal, and seasonal cleanup. Serving Conashaugh Lakes community for over 5 years.',
      category: 'services' as const,
      contact: {
        name: 'Green Thumb Landscaping',
        email: 'contact@greenthumbpa.com',
        phone: '(570) 555-0198',
      },
      datePosted: '2025-08-09',
      featured: true,
    },
  ]);

  const events = ref<Event[]>([
    {
      id: 'event-001',
      title: 'Community Board Meeting',
      description:
        'Monthly community board meeting to discuss ongoing projects, community concerns, and upcoming initiatives. All residents welcome.',
      date: '2025-08-15',
      time: '7:00 PM',
      location: 'Community Center',
      organizer: 'Community Board',
    },
    {
      id: 'event-002',
      title: 'Lake Cleanup Day',
      description:
        'Annual volunteer lake cleanup day. Help keep our lakes beautiful! All supplies provided, lunch included for volunteers.',
      date: '2025-08-20',
      time: '9:00 AM',
      location: 'Main Beach Area',
      organizer: 'Environmental Committee',
    },
  ]);

  const communityStats = ref({
    households: 450,
    lakes: 3,
    yearsPublished: 29,
    issuesPerYear: 12,
  });

  // Issue/Newsletter data
  const archivedIssues = ref<PdfDocument[]>([
    {
      id: 1,
      title: 'July 2025 Edition',
      date: 'July 2025',
      pages: 12,
      url: '/issues/7.2025.pdf',
      filename: '7.2025.pdf',
    },
    {
      id: 2,
      title: 'June 2025 Edition',
      date: 'June 2025',
      pages: 10,
      url: '/issues/Courier - 2025.06 - June.pdf',
      filename: 'Courier - 2025.06 - June.pdf',
    },
  ]);

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
    isDarkMode.value = !isDarkMode.value;
    // The watcher will handle syncing with Quasar
  }

  function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
  }

  function setDarkMode(value: boolean) {
    isDarkMode.value = value;
    // The watcher will handle syncing with Quasar
  }

  return {
    // State
    isDarkMode,
    isMenuOpen,
    newsItems,
    classifieds,
    events,
    communityStats,
    archivedIssues,

    // Computed
    featuredNews,
    recentClassifieds,
    upcomingEvents,
    latestIssue,

    // Actions
    toggleDarkMode,
    toggleMenu,
    setDarkMode,
  };
});
