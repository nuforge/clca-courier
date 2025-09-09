/**
 * Latest Newsletter Composable
 * Fetches and manages the most recently published newsletter for navigation display
 */

import { ref, computed, onMounted, readonly } from 'vue';
import { firestoreService, type NewsletterMetadata } from '../services/firebase-firestore.service';
import { logger } from '../utils/logger';

export function useLatestNewsletter() {
  // State
  const latestNewsletter = ref<NewsletterMetadata | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const hasLatestIssue = computed(() => !!latestNewsletter.value);

  const formattedDate = computed(() => {
    if (!latestNewsletter.value) return '';

    const newsletter = latestNewsletter.value;

    // Handle both monthly and seasonal formats
    if (newsletter.month && newsletter.year) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[newsletter.month - 1]} ${newsletter.year}`;
    } else if (newsletter.season && newsletter.year) {
      return `${newsletter.season.charAt(0).toUpperCase() + newsletter.season.slice(1)} ${newsletter.year}`;
    } else if (newsletter.year) {
      return newsletter.year.toString();
    }

    // Fallback to publication date
    if (newsletter.publicationDate) {
      const date = new Date(newsletter.publicationDate);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    }

    return 'Unknown Date';
  });

  const thumbnailUrl = computed(() => {
    if (!latestNewsletter.value) return null;

    const newsletter = latestNewsletter.value;

    // Check for Firebase Storage thumbnail
    if (newsletter.storage?.thumbnail?.downloadUrl) {
      return newsletter.storage.thumbnail.downloadUrl;
    }

    // Check for legacy thumbnailUrl
    if (newsletter.thumbnailUrl) {
      return newsletter.thumbnailUrl;
    }

    // Fallback to generated thumbnail path
    if (newsletter.filename) {
      const baseName = newsletter.filename.replace('.pdf', '');
      return `/thumbnails/${baseName}-page-1.jpg`;
    }

    return null;
  });

  // Methods
  const fetchLatestNewsletter = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      logger.debug('🔄 [LATEST] Fetching latest published newsletter...');

      // Get all published newsletters sorted by date (newest first)
      const newsletters = await firestoreService.getAllNewsletterMetadata();

      if (newsletters.length > 0) {
        const latest = newsletters[0];
        if (latest) {
          latestNewsletter.value = latest; // Already sorted by newest first
          logger.info(`📰 [LATEST] Found latest issue: ${latest.title}`);
        }
      } else {
        logger.warn('📰 [LATEST] No published newsletters found');
        latestNewsletter.value = null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error.value = `Failed to fetch latest newsletter: ${errorMessage}`;
      logger.error('❌ [LATEST] Error fetching latest newsletter:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const refreshLatest = () => {
    void fetchLatestNewsletter();
  };

  // Auto-fetch on mount
  onMounted(() => {
    void fetchLatestNewsletter();
  });

  return {
    // State
    latestNewsletter: readonly(latestNewsletter),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    hasLatestIssue,
    formattedDate,
    thumbnailUrl,

    // Methods
    refreshLatest
  };
}
