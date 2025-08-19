/**
 * Hybrid Newsletter Composable
 * Vue composable for accessing newsletters through hybrid hosting approach
 */

import { ref, computed } from 'vue';
import {
  lightweightNewsletterService,
  type LightweightNewsletter,
} from '../services/lightweight-newsletter-service';

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
  const newsletters = ref<LightweightNewsletter[]>([]);
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
      const data = await lightweightNewsletterService.getNewsletters();
      newsletters.value = data;

      // Load service statistics
      serviceStats.value = {
        totalNewsletters: data.length,
        sourceCounts: {
          local: data.length,
          drive: 0,
          hybrid: 0,
        },
        cacheSize: 0,
        lastUpdated: new Date().toISOString(),
      };

      console.log(`[useHybridNewsletters] Loaded ${data.length} newsletters`);
    } catch (err) {
      console.error('[useHybridNewsletters] Error loading newsletters:', err);
      error.value = 'Failed to load newsletters';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get sources for a specific newsletter (simplified for lightweight service)
   */
  const getNewsletterSources = (
    newsletter: LightweightNewsletter,
  ): Array<{ type: string; url: string; available: boolean }> => {
    // Simplified source detection for lightweight service
    const sources = [];

    if (newsletter.url.includes('/issues/')) {
      sources.push({ type: 'local', url: newsletter.url, available: true });
    }

    if (newsletter.url.includes('drive.google.com')) {
      sources.push({ type: 'drive', url: newsletter.url, available: true });
    }

    return sources;
  };

  /**
   * Get the best URL for web viewing
   */
  const getWebViewUrl = (newsletter: LightweightNewsletter): string | null => {
    return newsletter.url; // Direct URL access for lightweight approach
  };

  /**
   * Get the best URL for downloading
   */
  const getDownloadUrl = (newsletter: LightweightNewsletter): string | null => {
    return newsletter.url; // Direct URL access for lightweight approach
  };

  /**
   * Check if newsletter has local source available
   */
  const hasLocalSource = (newsletter: LightweightNewsletter): boolean => {
    return newsletter.url.includes('/issues/');
  };

  /**
   * Check if newsletter has Google Drive source available
   */
  const hasDriveSource = (newsletter: LightweightNewsletter): boolean => {
    return newsletter.url.includes('drive.google.com');
  };

  /**
   * Check if newsletter has hybrid sources (both local and drive)
   */
  const hasHybridSources = (newsletter: LightweightNewsletter): boolean => {
    return newsletter.isProcessed; // For lightweight service, this indicates enhanced metadata
  }; /**
   * Refresh newsletter data
   */
  const refresh = async () => {
    await loadNewsletters();
  };

  // Computed properties for filtered and sorted newsletters
  const newslettersByYear = computed(() => {
    const groupedByYear: Record<string, LightweightNewsletter[]> = {};

    newsletters.value.forEach((newsletter) => {
      const year = newsletter.date ? new Date(newsletter.date).getFullYear().toString() : 'Unknown';
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

    const result: Record<string, LightweightNewsletter[]> = {};
    sortedYears.forEach((year) => {
      // Sort newsletters within each year by date (newest first)
      const yearNewsletters = groupedByYear[year];
      if (yearNewsletters) {
        result[year] = yearNewsletters.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
      }
    });

    return result;
  });

  const recentNewsletters = computed(() => {
    return newsletters.value
      .slice()
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 5);
  });

  const newslettersByContentType = computed(() => {
    const grouped: Record<string, LightweightNewsletter[]> = {
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
