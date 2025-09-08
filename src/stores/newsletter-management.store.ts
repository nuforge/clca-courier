import { defineStore } from 'pinia';
import { ref, computed, onUnmounted } from 'vue';
import type {
  ContentManagementNewsletter,
  NewsletterFilters,
  ProcessingStates,
} from '../types/core/content-management.types';
import { firebaseNewsletterService } from '../services/firebase-newsletter.service';
import { firestoreService } from '../services/firebase-firestore.service';
import { logger } from '../utils/logger';

export const useNewsletterManagementStore = defineStore('newsletter-management', () => {
  // =============================================
  // STATE - ALL REACTIVE DATA CENTRALIZED
  // =============================================

  // Core newsletter data
  const newsletters = ref<ContentManagementNewsletter[]>([]);
  const selectedNewsletters = ref<ContentManagementNewsletter[]>([]);
  const currentNewsletter = ref<ContentManagementNewsletter | null>(null);

  // Filters and search
  const filters = ref<NewsletterFilters>({
    searchText: '',
    filterYear: null,
    filterSeason: null,
    filterMonth: null,
  });

  // Processing states
  const isLoading = ref(false);
  const isExtracting = ref(false);
  const isExtractingText = ref(false);
  const isExtractingPageCount = ref(false);
  const isExtractingFileSize = ref(false);
  const isExtractingDates = ref(false);
  const isGeneratingKeywords = ref(false);
  const isGeneratingDescriptions = ref(false);
  const isGeneratingTitles = ref(false);
  const isGeneratingThumbs = ref(false);

  // Reactive subscription for real-time updates
  const unsubscribe = ref<(() => void) | null>(null);

  // Setup reactive subscription for admin view (including unpublished)
  const setupReactiveSubscription = () => {
    logger.info('Setting up reactive admin subscription for newsletter management...');
    unsubscribe.value = firestoreService.subscribeToNewslettersForAdmin((updatedNewsletters) => {
      logger.info(`Received ${updatedNewsletters.length} newsletters via reactive subscription`);
      newsletters.value = updatedNewsletters as ContentManagementNewsletter[];
    });
  };

  // Cleanup subscription on unmount
  onUnmounted(() => {
    if (unsubscribe.value) {
      unsubscribe.value();
      logger.info('Newsletter management store subscription cleaned up');
    }
  });
  const isSyncing = ref(false);
  const isUploading = ref(false);
  const isToggling = ref(false);
  const isDeleting = ref(false);

  // Individual processing states
  const extractingText = ref<Record<string, boolean>>({});
  const syncingIndividual = ref<Record<string, boolean>>({});
  const publishingStates = ref<Record<string, boolean>>({});
  const featuredStates = ref<Record<string, boolean>>({});
  const thumbnailIndividualStates = ref<Record<string, boolean>>({});

  // Dialog states
  const showImportDialog = ref(false);
  const showEditDialog = ref(false);
  const showTextDialog = ref(false);
  const extractedText = ref('');

  // =============================================
  // COMPUTED - DERIVED STATE
  // =============================================

  const filteredNewsletters = computed(() => {
    let result = newsletters.value;

    if (filters.value.searchText) {
      const search = filters.value.searchText.toLowerCase();
      result = result.filter(
        (n) =>
          n.filename.toLowerCase().includes(search) ||
          n.title?.toLowerCase().includes(search) ||
          n.description?.toLowerCase().includes(search),
      );
    }

    if (filters.value.filterYear) {
      result = result.filter((n) => n.year === filters.value.filterYear);
    }

    if (filters.value.filterSeason) {
      result = result.filter((n) => n.season === filters.value.filterSeason);
    }

    if (filters.value.filterMonth) {
      result = result.filter((n) => n.month === filters.value.filterMonth);
    }

    return result;
  });

  const totalNewsletters = computed(() => newsletters.value.length);
  const newslettersWithText = computed(
    () => newsletters.value.filter((n) => n.searchableText).length,
  );
  const newslettersWithThumbnails = computed(
    () => newsletters.value.filter((n) => n.thumbnailUrl).length,
  );
  const totalFileSize = computed(() => {
    const totalBytes = newsletters.value.reduce((sum, n) => sum + (n.fileSize || 0), 0);
    // Format as human-readable string
    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    if (totalBytes < 1024 * 1024 * 1024) return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  });

  const totalFileSizeBytes = computed(() =>
    newsletters.value.reduce((sum, n) => sum + (n.fileSize || 0), 0),
  );

  const draftNewsletters = computed(() => newsletters.value.filter((n) => !n.id));
  const hasDrafts = computed(() => draftNewsletters.value.length > 0);

  const availableYears = computed(() => {
    const years = [...new Set(newsletters.value.map((n) => n.year).filter(Boolean))];
    return years.sort((a, b) => (b || 0) - (a || 0));
  });

  const availableSeasons = computed(() => {
    return [...new Set(newsletters.value.map((n) => n.season).filter(Boolean))];
  });

  const availableMonths = computed(() => [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 },
  ]);

  const processingStates = computed(
    (): ProcessingStates => ({
      isLoading: isLoading.value,
      isExtracting: isExtracting.value,
      isExtractingAllText: isExtractingText.value,
      isGeneratingThumbs: isGeneratingThumbs.value,
      isSaving: false,
      isProcessingText: false,
      isApplyingMetadata: false,
      isSyncing: isSyncing.value,
      extractingText: extractingText.value,
      generatingThumb: thumbnailIndividualStates.value,
    }),
  );

  // =============================================
  // ACTIONS - ALL BUSINESS LOGIC
  // =============================================

  async function loadNewsletters(): Promise<void> {
    isLoading.value = true;
    try {
      logger.info('🔄 Loading ALL newsletters for admin (including unpublished)...');

      // Setup reactive subscription for real-time updates
      setupReactiveSubscription();

      // Also do initial load for immediate data
      const data = await firebaseNewsletterService.loadAllNewslettersForAdmin();
      newsletters.value = data as ContentManagementNewsletter[];
      logger.success(
        `✅ Loaded ${data.length} newsletters (admin view) + reactive subscription active`,
      );
    } catch (error) {
      logger.error('❌ Failed to load newsletters:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function refreshNewsletters(): Promise<void> {
    await loadNewsletters();
  }

  function clearSelection(): void {
    selectedNewsletters.value = [];
  }

  function setSelectedNewsletters(newsletters: ContentManagementNewsletter[]): void {
    selectedNewsletters.value = newsletters;
  }

  function selectAll(): void {
    selectedNewsletters.value = [...filteredNewsletters.value];
  }

  function selectNewsletter(newsletter: ContentManagementNewsletter): void {
    const index = selectedNewsletters.value.findIndex((n) => n.filename === newsletter.filename);
    if (index === -1) {
      selectedNewsletters.value.push(newsletter);
    } else {
      selectedNewsletters.value.splice(index, 1);
    }
  }

  function setCurrentNewsletter(newsletter: ContentManagementNewsletter | null): void {
    currentNewsletter.value = newsletter;
  }

  function updateFilters(newFilters: Partial<NewsletterFilters>): void {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters(): void {
    filters.value = {
      searchText: '',
      filterYear: null,
      filterSeason: null,
      filterMonth: null,
    };
  }

  // =============================================
  // EXPORT EVERYTHING NEEDED
  // =============================================

  return {
    // State
    newsletters,
    selectedNewsletters,
    currentNewsletter,
    filters,
    isLoading,
    isExtracting,
    isExtractingText,
    isExtractingPageCount,
    isExtractingFileSize,
    isExtractingDates,
    isGeneratingKeywords,
    isGeneratingDescriptions,
    isGeneratingTitles,
    isGeneratingThumbs,
    isSyncing,
    isUploading,
    isToggling,
    isDeleting,
    extractingText,
    syncingIndividual,
    publishingStates,
    featuredStates,
    thumbnailIndividualStates,
    showImportDialog,
    showEditDialog,
    showTextDialog,
    extractedText,

    // Computed
    filteredNewsletters,
    totalNewsletters,
    newslettersWithText,
    newslettersWithThumbnails,
    totalFileSize,
    totalFileSizeBytes,
    draftNewsletters,
    hasDrafts,
    availableYears,
    availableSeasons,
    availableMonths,
    processingStates,

    // Actions
    loadNewsletters,
    refreshNewsletters,
    clearSelection,
    setSelectedNewsletters,
    selectAll,
    selectNewsletter,
    setCurrentNewsletter,
    updateFilters,
    resetFilters,
  };
});
