import { ref, computed, onMounted } from 'vue';
import { googleDriveContentService } from '../services/google-drive-content-service';
import type {
  GoogleDriveContentConfig,
  GoogleDocsContent,
  GoogleSheetsData,
  IssueWithGoogleDrive,
  ContentSyncStatus,
  GoogleDriveFile,
  SearchResult,
} from '../types/google-drive-content';

export function useGoogleDriveContent() {
  // Reactive state
  const isInitialized = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const syncStatus = ref<ContentSyncStatus | null>(null);

  // Content state
  const docsContent = ref<GoogleDocsContent[]>([]);
  const sheetsData = ref<GoogleSheetsData[]>([]);
  const issues = ref<IssueWithGoogleDrive[]>([]);
  const images = ref<GoogleDriveFile[]>([]);

  // Computed properties
  const articles = computed(() =>
    docsContent.value.filter((doc) => doc.type === 'article' && doc.status === 'published'),
  );

  const events = computed(() =>
    docsContent.value.filter((doc) => doc.type === 'event' && doc.status === 'published'),
  );

  const news = computed(() =>
    docsContent.value.filter((doc) => doc.type === 'news' && doc.status === 'published'),
  );

  const classifieds = computed(
    () => sheetsData.value.find((sheet) => sheet.type === 'classifieds')?.data || [],
  );

  const communityStats = computed(
    () => sheetsData.value.find((sheet) => sheet.type === 'community-stats')?.data || [],
  );

  const latestIssue = computed(() => {
    if (!issues.value.length) return null;
    return issues.value.reduce((latest, current) => {
      const latestDate = new Date(latest.lastModified || latest.date);
      const currentDate = new Date(current.lastModified || current.date);
      return currentDate > latestDate ? current : latest;
    });
  });

  const isContentStale = computed(
    () => googleDriveContentService.isContentStale(30), // 30 minutes
  );

  // Initialize the service
  const initialize = async (config: GoogleDriveContentConfig): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      googleDriveContentService.configure(config);

      // Load cached content first for immediate display
      loadCachedContent();

      isInitialized.value = true;

      // Then sync in the background if content is stale
      if (isContentStale.value) {
        await syncContent();
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to initialize Google Drive content';
      console.error('Google Drive content initialization error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // Load cached content from localStorage
  const loadCachedContent = (): void => {
    try {
      // Load cached Google Docs content
      const cachedDocs = localStorage.getItem('google-docs-content');
      if (cachedDocs) {
        docsContent.value = JSON.parse(cachedDocs);
      }

      // Load cached Google Sheets data
      const cachedSheets = localStorage.getItem('google-sheets-data');
      if (cachedSheets) {
        sheetsData.value = JSON.parse(cachedSheets);
      }

      // Load cached issues
      const cachedIssues = localStorage.getItem('google-drive-issues');
      if (cachedIssues) {
        issues.value = JSON.parse(cachedIssues);
      }

      // Load cached images
      const cachedImages = localStorage.getItem('google-drive-images');
      if (cachedImages) {
        images.value = JSON.parse(cachedImages);
      }

      // Load sync status
      const cachedSyncStatus = localStorage.getItem('google-drive-sync-status');
      if (cachedSyncStatus) {
        syncStatus.value = JSON.parse(cachedSyncStatus);
      }
    } catch (err) {
      console.warn('Error loading cached content:', err);
    }
  };

  // Sync all content from Google Drive
  const syncContent = async (): Promise<void> => {
    if (!isInitialized.value) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      isLoading.value = true;
      error.value = null;

      const status = await googleDriveContentService.syncAllContent();
      syncStatus.value = status;

      // Reload the content after sync
      loadCachedContent();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to sync content';
      console.error('Content sync error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // Force refresh content
  const refreshContent = async (): Promise<void> => {
    googleDriveContentService.clearCache();
    await syncContent();
  };

  // Get content by type
  const getContentByType = <T>(type: string): T[] => {
    switch (type) {
      case 'articles':
        return articles.value as T[];
      case 'events':
        return events.value as T[];
      case 'news':
        return news.value as T[];
      case 'classifieds':
        return classifieds.value as T[];
      case 'community-stats':
        return communityStats.value as T[];
      case 'issues':
        return issues.value as T[];
      case 'images':
        return images.value as T[];
      default:
        return [];
    }
  };

  // Get specific content by ID
  const getContentById = (
    id: string,
    type: 'docs' | 'sheets' | 'issues',
  ): GoogleDocsContent | GoogleSheetsData | IssueWithGoogleDrive | null => {
    switch (type) {
      case 'docs':
        return docsContent.value.find((doc) => doc.id === id) || null;
      case 'sheets':
        return sheetsData.value.find((sheet) => sheet.id === id) || null;
      case 'issues':
        return issues.value.find((issue) => issue.googleDriveFileId === id) || null;
      default:
        return null;
    }
  };

  // Search content
  const searchContent = (query: string): SearchResult[] => {
    const results: SearchResult[] = [];

    // Search in docs
    docsContent.value.forEach((doc) => {
      if (
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase())
      ) {
        results.push({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          contentType: 'article',
        });
      }
    });

    // Search in issues
    issues.value.forEach((issue) => {
      if (
        issue.title.toLowerCase().includes(query.toLowerCase()) ||
        issue.filename.toLowerCase().includes(query.toLowerCase())
      ) {
        results.push({
          id: issue.id.toString(),
          title: issue.title,
          filename: issue.filename,
          contentType: 'issue',
        });
      }
    });

    return results;
  };

  // Background sync with minimal UI disruption
  const backgroundSync = async (): Promise<void> => {
    if (isLoading.value || !isInitialized.value) return;

    try {
      // Check if content needs updating without showing loading state
      const status = await googleDriveContentService.syncAllContent();
      syncStatus.value = status;

      // Silently reload content
      loadCachedContent();
    } catch (err) {
      console.warn('Background sync failed:', err);
      // Don't update error state for background sync failures
    }
  };

  // Auto-sync on mount if content is stale
  onMounted(() => {
    if (isInitialized.value && isContentStale.value) {
      // Use background sync to avoid showing loading state on mount
      setTimeout(() => {
        backgroundSync().catch(console.warn);
      }, 1000);
    }
  });

  return {
    // State
    isInitialized,
    isLoading,
    error,
    syncStatus,

    // Content
    docsContent,
    sheetsData,
    issues,
    images,

    // Computed content
    articles,
    events,
    news,
    classifieds,
    communityStats,
    latestIssue,
    isContentStale,

    // Methods
    initialize,
    syncContent,
    refreshContent,
    getContentByType,
    getContentById,
    searchContent,
    backgroundSync,
  };
}
