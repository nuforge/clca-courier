/**
 * Content Management Composable
 * Handles newsletter content management operations
 */

import { ref, computed, type Ref } from 'vue';
import { useQuasar } from 'quasar';
import { lightweightNewsletterService } from '../services/lightweight-newsletter-service';
import { localMetadataStorageService } from '../services/local-metadata-storage.service';

import type {
  ContentManagementNewsletter,
  LocalStorageStats,
  ProcessingStates,
  NewsletterFilters,
  TextExtractionDialogState,
  EditDialogState,
} from '../types';

export function useContentManagement() {
  const $q = useQuasar();

  // State
  const newsletters = ref<ContentManagementNewsletter[]>([]);
  const localStorageStats = ref<LocalStorageStats>({ total: 0, pending: 0, synced: 0, errors: 0 });

  // Processing states
  const processingStates = ref<ProcessingStates>({
    isLoading: false,
    isExtracting: false,
    isExtractingAllText: false,
    isGeneratingThumbs: false,
    isSaving: false,
    isProcessingText: false,
    isApplyingMetadata: false,
    isSyncing: false,
    extractingText: {},
    generatingThumb: {},
  });

  // Filters
  const filters = ref<NewsletterFilters>({
    searchText: '',
    filterYear: null,
    filterSeason: null,
  });

  // Dialog states
  const textExtractionDialog = ref<TextExtractionDialogState>({
    showDialog: false,
    currentFile: null,
    extractedContent: null,
    extractionProgress: 0,
    extractionStatus: '',
  });

  const editDialog = ref<EditDialogState>({
    showDialog: false,
    editingNewsletter: null,
  });

  // Computed
  const filteredNewsletters = computed(() => {
    let filtered = newsletters.value;

    if (filters.value.searchText) {
      const search = filters.value.searchText.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.filename.toLowerCase().includes(search) ||
          (n.description && n.description.toLowerCase().includes(search)),
      );
    }

    if (filters.value.filterYear) {
      filtered = filtered.filter((n) => n.year === filters.value.filterYear);
    }

    if (filters.value.filterSeason) {
      filtered = filtered.filter((n) => n.season === filters.value.filterSeason);
    }

    return filtered;
  });

  const totalNewsletters = computed(() => newsletters.value.length);
  const newslettersWithText = computed(
    () => newsletters.value.filter((n) => n.searchableText).length,
  );
  const newslettersWithThumbnails = computed(
    () => newsletters.value.filter((n) => n.thumbnailUrl).length,
  );
  const totalFileSize = computed(() => {
    const total = newsletters.value.reduce((sum, n) => sum + (n.fileSize || 0), 0);
    return formatFileSize(total);
  });

  // Available tags and categories
  const availableTags = computed(() => {
    const allTags = newsletters.value.flatMap((n) => n.tags || []);
    return [...new Set(allTags)].sort();
  });

  const availableCategories = computed(() => {
    const allCategories = newsletters.value.flatMap((n) => n.categories || []);
    return [...new Set(allCategories)].sort();
  });

  // Methods
  function formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async function loadNewsletters(): Promise<void> {
    processingStates.value.isLoading = true;

    try {
      console.log('🔧 Loading newsletters from local PDF manifest...');

      const loadedNewsletters = await lightweightNewsletterService.getNewsletters();
      await refreshLocalStorageStats();

      // Convert to ContentManagementNewsletter format
      newsletters.value = loadedNewsletters.map(
        (newsletter) =>
          ({
            id: String(newsletter.id),
            filename: newsletter.filename,
            title: newsletter.title,
            year: parseInt((newsletter.date || '2024').split('.')[0] || '2024') || 2024,
            season: newsletter.date?.includes('summer')
              ? 'summer'
              : newsletter.date?.includes('winter')
                ? 'winter'
                : newsletter.date?.includes('spring')
                  ? 'spring'
                  : newsletter.date?.includes('fall')
                    ? 'fall'
                    : 'general',
            fileSize: 0, // Will be populated from actual file
            pageCount: newsletter.pages,
            downloadUrl: newsletter.url,
            thumbnailUrl: newsletter.thumbnailUrl || '',
            tags: [],
            categories: newsletter.topics || [],
            featured: false,
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            updatedBy: 'system',
          }) as ContentManagementNewsletter,
      );

      console.log(`✅ Loaded ${newsletters.value.length} newsletters from local manifest`);
    } catch (error) {
      console.error('Failed to load newsletters:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to load newsletters',
        caption: error instanceof Error ? error.message : 'Unknown error',
        position: 'top',
      });
    } finally {
      processingStates.value.isLoading = false;
    }
  }

  async function refreshLocalStorageStats(): Promise<void> {
    try {
      const stats = await localMetadataStorageService.getStorageStats();
      localStorageStats.value = stats;
    } catch (error) {
      console.error('Failed to refresh local storage stats:', error);
    }
  }

  return {
    // State
    newsletters: newsletters as Ref<ContentManagementNewsletter[]>,
    localStorageStats,
    processingStates,
    filters,
    textExtractionDialog,
    editDialog,

    // Computed
    filteredNewsletters,
    totalNewsletters,
    newslettersWithText,
    newslettersWithThumbnails,
    totalFileSize,
    availableTags,
    availableCategories,

    // Methods
    formatFileSize,
    loadNewsletters,
    refreshLocalStorageStats,
  };
}
