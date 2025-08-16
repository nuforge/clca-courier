/**
 * Hybrid Newsletter Composable
 * Vue composable for accessing newsletters through hybrid hosting approach
 */

import { ref, computed } from 'vue';
import {
  newsletterService,
  type NewsletterMetadata,
  type NewsletterSource,
} from '../services/newsletter-service';

interface ServiceStats {
  totalNewsletters: number;
  sourceCounts: {
    local: number;
    drive: number;
    hybrid: number;
  };
  cacheSize: number;
  lastUpdated: string;
}

export function useHybridNewsletters() {
  const newsletters = ref<NewsletterMetadata[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const serviceStats = ref<ServiceStats | null>(null);

  /**
   * Load all newsletters with hybrid metadata
   */
  const loadNewsletters = async () => {
    try {
      loading.value = true;
      error.value = null;

      console.log('[useHybridNewsletters] Loading newsletters...');
      const data = await newsletterService.getNewsletters();
      newsletters.value = data;

      // Load service statistics
      serviceStats.value = await newsletterService.getServiceStats();

      console.log(`[useHybridNewsletters] Loaded ${data.length} newsletters`);
    } catch (err) {
      console.error('[useHybridNewsletters] Error loading newsletters:', err);
      error.value = 'Failed to load newsletters';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get sources for a specific newsletter
   */
  const getNewsletterSources = async (
    newsletter: NewsletterMetadata,
  ): Promise<NewsletterSource[]> => {
    try {
      return await newsletterService.getNewsletterSources(newsletter);
    } catch (err) {
      console.error('[useHybridNewsletters] Error getting newsletter sources:', err);
      return [];
    }
  };

  /**
   * Get the best URL for web viewing
   */
  const getWebViewUrl = async (newsletter: NewsletterMetadata): Promise<string | null> => {
    try {
      return await newsletterService.getWebViewUrl(newsletter);
    } catch (err) {
      console.error('[useHybridNewsletters] Error getting web view URL:', err);
      return newsletter.url; // Fallback to original URL
    }
  };

  /**
   * Get the best URL for downloading
   */
  const getDownloadUrl = async (newsletter: NewsletterMetadata): Promise<string | null> => {
    try {
      return await newsletterService.getDownloadUrl(newsletter);
    } catch (err) {
      console.error('[useHybridNewsletters] Error getting download URL:', err);
      return newsletter.url; // Fallback to original URL
    }
  };

  /**
   * Check if newsletter has local source available
   */
  const hasLocalSource = async (newsletter: NewsletterMetadata): Promise<boolean> => {
    const sources = await getNewsletterSources(newsletter);
    return sources.some((s) => s.type === 'local' && s.available);
  };

  /**
   * Check if newsletter has Google Drive source available
   */
  const hasDriveSource = async (newsletter: NewsletterMetadata): Promise<boolean> => {
    const sources = await getNewsletterSources(newsletter);
    return sources.some((s) => s.type === 'drive' && s.available);
  };

  /**
   * Check if newsletter has hybrid sources (both local and drive)
   */
  const hasHybridSources = async (newsletter: NewsletterMetadata): Promise<boolean> => {
    const sources = await getNewsletterSources(newsletter);
    return sources.some((s) => s.type === 'hybrid' && s.available);
  };

  /**
   * Refresh newsletter data
   */
  const refresh = async () => {
    newsletterService.clearCache();
    await loadNewsletters();
  };

  // Computed properties for filtered and sorted newsletters
  const newslettersByYear = computed(() => {
    const groupedByYear: Record<string, NewsletterMetadata[]> = {};

    newsletters.value.forEach((newsletter) => {
      const year = newsletter.publishDate
        ? new Date(newsletter.publishDate).getFullYear().toString()
        : 'Unknown';
      if (!groupedByYear[year]) {
        groupedByYear[year] = [];
      }
      groupedByYear[year].push(newsletter);
    });

    // Sort years in descending order
    const sortedYears = Object.keys(groupedByYear).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return parseInt(b) - parseInt(a);
    });

    const result: Record<string, NewsletterMetadata[]> = {};
    sortedYears.forEach((year) => {
      // Sort newsletters within each year by publish date (newest first)
      const yearNewsletters = groupedByYear[year];
      if (yearNewsletters) {
        result[year] = yearNewsletters.sort((a, b) => {
          if (!a.publishDate) return 1;
          if (!b.publishDate) return -1;
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        });
      }
    });

    return result;
  });

  const recentNewsletters = computed(() => {
    return newsletters.value
      .slice()
      .sort((a, b) => {
        if (!a.publishDate) return 1;
        if (!b.publishDate) return -1;
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      })
      .slice(0, 5);
  });

  const newslettersByContentType = computed(() => {
    const grouped: Record<string, NewsletterMetadata[]> = {
      newsletter: [],
      special: [],
      annual: [],
    };

    newsletters.value.forEach((newsletter) => {
      const type = newsletter.contentType || 'newsletter';
      if (grouped[type]) {
        grouped[type].push(newsletter);
      }
    });

    return grouped;
  });

  return {
    // State
    newsletters,
    loading,
    error,
    serviceStats,

    // Actions
    loadNewsletters,
    getNewsletterSources,
    getWebViewUrl,
    getDownloadUrl,
    hasLocalSource,
    hasDriveSource,
    hasHybridSources,
    refresh,

    // Computed
    newslettersByYear,
    recentNewsletters,
    newslettersByContentType,
  };
}
