/**
 * Content Mana// Quick hash function for comparing data
function simpleHash(obj: Record<string, unknown>): string {
  if (!obj) return '';
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

// Determine sync status between local and Firebase data
function getSyncStatus(
  localMeta: Record<string, unknown> | undefined,
  firebaseMeta: Record<string, unknown> | undefined,
): 'synced' | 'local' | 'firebase' | 'unknown' { * Handles newsletter content management operations
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

// Quick hash function for comparing data
function simpleHash(obj: Record<string, unknown>): string {
  if (!obj) return '';
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

// Determine sync status between local and Firebase data
function getSyncStatus(
  localMeta: Record<string, unknown> | undefined,
  firebaseMeta: Record<string, unknown> | undefined,
): 'synced' | 'local' | 'firebase' | 'unknown' {
  const hasLocal = !!localMeta;
  const hasFirebase = !!firebaseMeta;

  if (!hasLocal && !hasFirebase) return 'unknown';
  if (!hasLocal && hasFirebase) return 'firebase';
  if (hasLocal && !hasFirebase) return 'local';

  // Both exist - compare ALL changeable metadata fields
  const localData = localMeta as Record<string, unknown>;
  const firebaseData = firebaseMeta as Record<string, unknown>;

  // Include ALL metadata that could be enhanced/changed
  const createComparisonHash = (data: Record<string, unknown>) => {
    return simpleHash({
      // Date-related metadata (the main focus)
      displayDate: data?.displayDate,
      month: data?.month,
      season: data?.season,
      year: data?.year,

      // Text extraction metadata
      wordCount: data?.wordCount,
      readingTimeMinutes: data?.readingTimeMinutes,
      searchableText:
        typeof data?.searchableText === 'string' ? data.searchableText.substring(0, 100) : '',

      // Content metadata
      title: data?.title,
      description: data?.description,
      summary: data?.summary,
      pageCount: data?.pageCount,
      articleCount: data?.articleCount,

      // Tags and categorization
      tags: Array.isArray(data?.tags) ? data.tags.join(',') : '',
      categories: Array.isArray(data?.categories) ? data.categories.join(',') : '',
      keyTerms: Array.isArray(data?.keyTerms) ? data.keyTerms.join(',') : '',

      // Version info
      version: data?.version,
      textExtractionVersion: data?.textExtractionVersion,

      // Status flags
      featured: data?.featured,
      isPublished: data?.isPublished,
    });
  };

  const localHash = createComparisonHash(localData);
  const firebaseHash = createComparisonHash(firebaseData);

  return localHash === firebaseHash ? 'synced' : 'local';
}

export function useContentManagement() {
  const $q = useQuasar();

  // State
  const newsletters = ref<ContentManagementNewsletter[]>([]);
  const localStorageStats = ref<LocalStorageStats>({ total: 0, pending: 0, synced: 0, errors: 0 });

  // Metadata maps for sync status checking
  const localMetadataMap = ref(new Map<string, Record<string, unknown>>());
  const firebaseMetadataMap = ref(new Map<string, Record<string, unknown>>());

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
    filterMonth: null,
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

  // Helper function to get data source information
  function getDataSource(newsletter: ContentManagementNewsletter): {
    source: 'draft' | 'saved' | 'remote';
    color: string;
    icon: string;
  } {
    // Check if the newsletter has enhanced metadata (means it was processed)
    const hasEnhancedData = !!(
      newsletter.displayDate ||
      newsletter.month ||
      newsletter.wordCount ||
      newsletter.searchableText
    );

    // Check if it exists in Firebase
    const firebaseMeta = firebaseMetadataMap.value.get(newsletter.filename);
    const hasFirebaseData = !!firebaseMeta;

    if (!hasEnhancedData && !hasFirebaseData) {
      return { source: 'draft', color: 'orange', icon: 'draft' };
    }

    if (hasEnhancedData && !hasFirebaseData) {
      return { source: 'saved', color: 'text-primary', icon: 'save' };
    }

    if (hasFirebaseData) {
      return { source: 'remote', color: 'blue', icon: 'cloud_done' };
    }

    return { source: 'saved', color: 'text-primary', icon: 'save' };
  }

  // Helper function to get sync status based on actual newsletter data
  function getNewsletterSyncStatus(
    newsletter: ContentManagementNewsletter,
  ): 'synced' | 'local' | 'firebase' | 'unknown' {
    const firebaseMeta = firebaseMetadataMap.value.get(newsletter.filename);
    const hasFirebaseData = !!firebaseMeta;
    const hasEnhancedData = !!(newsletter.displayDate || newsletter.month || newsletter.wordCount);

    if (!hasEnhancedData && !hasFirebaseData) return 'unknown';
    if (!hasEnhancedData && hasFirebaseData) return 'firebase';
    if (hasEnhancedData && !hasFirebaseData) return 'local';

    // Both exist - compare key fields
    if (hasFirebaseData && hasEnhancedData && firebaseMeta) {
      // Compare key enhanced fields
      const fieldsMatch =
        newsletter.displayDate === firebaseMeta.displayDate &&
        newsletter.month === firebaseMeta.month &&
        newsletter.season === firebaseMeta.season &&
        newsletter.wordCount === firebaseMeta.wordCount;

      return fieldsMatch ? 'synced' : 'local';
    }

    return 'unknown';
  }

  // Computed
  const filteredNewsletters = computed(() => {
    let filtered = newsletters.value.map((newsletter) => {
      return {
        ...newsletter,
        syncStatus: getNewsletterSyncStatus(newsletter),
        dataSource: getDataSource(newsletter),
      };
    });

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

    if (filters.value.filterMonth && typeof filters.value.filterMonth === 'number') {
      filtered = filtered.filter((n) => n.month === filters.value.filterMonth);
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
      console.log('🔧 Loading newsletters from multiple sources...');
      console.trace('📍 loadNewsletters() called from:'); // Add stack trace to see what's calling this

      // 1. Load basic newsletter data from manifest
      const baseNewsletters = await lightweightNewsletterService.getNewsletters();

      // 2. Load local extracted metadata
      const localMetadata = await localMetadataStorageService.getAllExtractedMetadata();
      const localMetadataMapById = new Map(localMetadata.map((meta) => [meta.newsletterId, meta]));

      // 3. Try to load Firebase metadata (if authenticated)
      let firebaseMetadataMapById = new Map();
      let firebaseNewsletters: Array<unknown> = [];
      try {
        const { firestoreService } = await import('../services/firebase-firestore.service');
        const fbNewsletters = await firestoreService.getAllNewslettersForAdmin();
        firebaseNewsletters = fbNewsletters as Array<unknown>;
        firebaseMetadataMapById = new Map(fbNewsletters.map((fb) => [fb.id, fb]));
        console.log(`📄 Loaded ${fbNewsletters.length} newsletters from Firebase`);
      } catch {
        console.log('ℹ️ Firebase data not available (likely not authenticated)');
      }

      // 4. Create metadata maps by filename for sync status checking
      const localMetadataMapByFilename = new Map<string, Record<string, unknown>>();
      const firebaseMetadataMapByFilename = new Map<string, Record<string, unknown>>();

      // Populate metadata maps by filename for sync status checks
      localMetadata.forEach((meta) => {
        const newsletter = baseNewsletters.find((n) => String(n.id) === meta.newsletterId);
        if (newsletter) {
          localMetadataMapByFilename.set(
            newsletter.filename,
            meta as unknown as Record<string, unknown>,
          );
        }
      });

      firebaseNewsletters.forEach((meta: unknown) => {
        const fbMeta = meta as Record<string, unknown>;
        const newsletter = baseNewsletters.find((n) => String(n.id) === fbMeta.id);
        if (newsletter) {
          firebaseMetadataMapByFilename.set(newsletter.filename, fbMeta);
        }
      });

      // Update the reactive metadata maps
      localMetadataMap.value = localMetadataMapByFilename;
      firebaseMetadataMap.value = firebaseMetadataMapByFilename;

      await refreshLocalStorageStats();

      // 5. Merge all data sources
      newsletters.value = baseNewsletters.map((newsletter) => {
        const localMeta = localMetadataMapById.get(String(newsletter.id));
        const firebaseMeta = firebaseMetadataMapById.get(String(newsletter.id));

        const mergedNewsletter = {
          id: String(newsletter.id),
          filename: newsletter.filename,
          title: newsletter.title,
          description: firebaseMeta?.description || undefined,
          summary: firebaseMeta?.summary || undefined,
          year:
            firebaseMeta?.year ||
            parseInt((newsletter.date || '2024').split('.')[0] || '2024') ||
            2024,
          season:
            firebaseMeta?.season ||
            (newsletter.date?.includes('summer')
              ? 'summer'
              : newsletter.date?.includes('winter')
                ? 'winter'
                : newsletter.date?.includes('spring')
                  ? 'spring'
                  : newsletter.date?.includes('fall')
                    ? 'fall'
                    : 'general'),
          month: firebaseMeta?.month,
          displayDate: firebaseMeta?.displayDate,
          sortValue: firebaseMeta?.sortValue,
          syncStatus: getSyncStatus(
            localMeta as Record<string, unknown> | undefined,
            firebaseMeta as Record<string, unknown> | undefined,
          ),
          volume: firebaseMeta?.volume,
          issue: firebaseMeta?.issue,
          fileSize: firebaseMeta?.fileSize || 0,
          pageCount: firebaseMeta?.pageCount || newsletter.pages,
          wordCount: localMeta?.wordCount || firebaseMeta?.wordCount,
          downloadUrl: newsletter.url,
          thumbnailUrl: newsletter.thumbnailUrl || firebaseMeta?.thumbnailUrl || '',
          searchableText: localMeta?.searchableText || firebaseMeta?.searchableText,
          tags: firebaseMeta?.tags || [],
          categories: firebaseMeta?.categories || newsletter.topics || [],
          contributors: firebaseMeta?.contributors,
          featured: firebaseMeta?.featured || false,
          isPublished: firebaseMeta?.isPublished ?? true,
          createdAt: firebaseMeta?.createdAt || new Date().toISOString(),
          updatedAt: firebaseMeta?.updatedAt || new Date().toISOString(),
          createdBy: firebaseMeta?.createdBy || 'system',
          updatedBy: firebaseMeta?.updatedBy || 'system',

          // Extended metadata from local extraction
          keyTerms: localMeta ? Object.keys(localMeta.keywordCounts || {}) : undefined,
          keywordCounts: localMeta?.keywordCounts,
          readingTimeMinutes: localMeta?.readingTimeMinutes,
          textExtractionVersion: localMeta?.textExtractionVersion,
          textExtractedAt: localMeta?.textExtractedAt,

          // Version control
          version: firebaseMeta?.version || 1,
        } as ContentManagementNewsletter;

        return mergedNewsletter;
      });

      console.log(
        `✅ Loaded ${newsletters.value.length} newsletters (merged from manifest, local metadata, and Firebase)`,
      );
      console.log(
        `📊 With metadata: ${newsletters.value.filter((n) => n.wordCount).length} have word counts, ${newsletters.value.filter((n) => n.tags.length > 0).length} have tags`,
      );
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
