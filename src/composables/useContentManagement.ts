/**
 * Content Management Composable
 * Handles newsletter content management operations
 */

import { ref, computed, type Ref } from 'vue';
import { useQuasar } from 'quasar';
import {
  lightweightNewsletterService,
  setPDFProcessing,
} from '../services/lightweight-newsletter-service';
import { localMetadataStorageService } from '../services/local-metadata-storage.service';
import type { NewsletterMetadata } from '../services/firebase-firestore.service';

import type { UnifiedNewsletter } from '../types/core/newsletter.types';
import type {
  LocalStorageStats,
  ProcessingStates,
  NewsletterFilters,
  TextExtractionDialogState,
  EditDialogState,
} from '../types/core/content-management.types';

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

// File location tracking - where does this file actually exist?
interface FileLocationStatus {
  localFile: boolean; // Exists in public/issues/
  firebaseStorage: boolean; // Exists in Firebase Storage
  firebaseMetadata: boolean; // Has metadata in Firestore
  draftData: boolean; // Has draft in localStorage
  processedMetadata: boolean; // Has extracted metadata locally
}

// Get comprehensive file location status
function getFileLocationStatus(
  filename: string,
  localMeta: Record<string, unknown> | undefined,
  firebaseMeta: Record<string, unknown> | undefined,
  draftMeta: Record<string, unknown> | undefined,
): FileLocationStatus {
  return {
    localFile: true, // Assume true if in manifest (from public/issues)
    firebaseStorage: !!(
      firebaseMeta?.downloadUrl &&
      typeof firebaseMeta.downloadUrl === 'string' &&
      !firebaseMeta.downloadUrl.includes('localhost')
    ),
    firebaseMetadata: !!firebaseMeta,
    draftData: !!draftMeta,
    processedMetadata: !!(localMeta?.wordCount || localMeta?.searchableText),
  };
}

// Determine what sync actions are needed
function getSyncActions(locationStatus: FileLocationStatus): {
  canUpload: boolean;
  canDownload: boolean;
  canSyncMetadata: boolean;
  needsUpload: boolean;
  needsDownload: boolean;
  status:
    | 'synced'
    | 'needs-upload'
    | 'needs-download'
    | 'needs-sync'
    | 'local-only'
    | 'remote-only'
    | 'unknown';
} {
  const { localFile, firebaseStorage, firebaseMetadata, draftData, processedMetadata } =
    locationStatus;

  // Determine what actions are possible
  const canUpload = localFile || draftData;
  const canDownload = firebaseStorage;
  const canSyncMetadata = (processedMetadata || draftData) && firebaseMetadata;

  // Determine what's needed
  let status:
    | 'synced'
    | 'needs-upload'
    | 'needs-download'
    | 'needs-sync'
    | 'local-only'
    | 'remote-only'
    | 'unknown';
  let needsUpload = false;
  let needsDownload = false;

  if (localFile && firebaseStorage && firebaseMetadata) {
    // Both exist - check if metadata needs sync
    status = canSyncMetadata ? 'needs-sync' : 'synced';
  } else if (localFile && !firebaseStorage) {
    // Local only - needs upload
    status = 'needs-upload';
    needsUpload = true;
  } else if (!localFile && firebaseStorage) {
    // Remote only - could download
    status = 'needs-download';
    needsDownload = true;
  } else if (localFile && firebaseStorage && !firebaseMetadata) {
    // File exists both places but no metadata
    status = 'needs-sync';
  } else if (draftData && !firebaseStorage) {
    // Draft exists but not uploaded
    status = 'needs-upload';
    needsUpload = true;
  } else {
    status = 'unknown';
  }

  return {
    canUpload,
    canDownload,
    canSyncMetadata,
    needsUpload,
    needsDownload,
    status,
  };
}

// Legacy sync status for backward compatibility
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

// Filename normalization utility for consistent matching
function normalizeFilename(filename: string): string {
  if (!filename) return '';
  return filename
    .toLowerCase()
    .trim()
    .replace(/\.pdf$/i, '');
}

export function useContentManagement() {
  const $q = useQuasar();

  // State
  const newsletters = ref<UnifiedNewsletter[]>([]);
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

  // Helper function to get data source information with comprehensive file location tracking
  function getDataSource(
    newsletter: UnifiedNewsletter,
    hasFileObject = false,
  ): {
    source: 'draft' | 'saved' | 'remote' | 'local' | 'metadata-only';
    color: string;
    icon: string;
    status: 'complete' | 'metadata-only' | 'file-only' | 'synced';
    description: string;
    locationStatus: FileLocationStatus;
    syncActions: {
      canUpload: boolean;
      canDownload: boolean;
      canSyncMetadata: boolean;
      needsUpload: boolean;
      needsDownload: boolean;
      status:
        | 'synced'
        | 'needs-upload'
        | 'needs-download'
        | 'needs-sync'
        | 'local-only'
        | 'remote-only'
        | 'unknown';
    };
    locations: string[]; // Human-readable list of where file exists
  } {
    // Get metadata for this newsletter
    const firebaseMeta = firebaseMetadataMap.value.get(newsletter.filename);
    const localMeta = Array.from(localMetadataMap.value.values()).find(
      (meta) => meta.newsletterId === newsletter.id,
    );

    // Check for draft data
    let draftMeta: Record<string, unknown> | undefined;
    try {
      const draftsData = localStorage.getItem('newsletter-drafts');
      if (draftsData) {
        const drafts = JSON.parse(draftsData);
        draftMeta = drafts.find(
          (draft: Record<string, unknown>) => draft.filename === newsletter.filename,
        );
      }
    } catch {
      // Ignore errors
    }

    // Get comprehensive file location status
    const locationStatus = getFileLocationStatus(
      newsletter.filename,
      localMeta,
      firebaseMeta,
      draftMeta,
    );

    // Get sync actions needed
    const syncActions = getSyncActions(locationStatus);

    // Build human-readable locations list
    const locations: string[] = [];
    if (locationStatus.localFile) locations.push('Local File');
    if (locationStatus.firebaseStorage) locations.push('Firebase Storage');
    if (locationStatus.firebaseMetadata) locations.push('Firebase Metadata');
    if (locationStatus.draftData) locations.push('Draft Data');
    if (locationStatus.processedMetadata) locations.push('Processed Metadata');

    // Legacy behavior for UI compatibility
    const isDraft = newsletter.id.startsWith('draft-');
    const isLocalFile =
      newsletter.downloadUrl?.startsWith('blob:') ||
      newsletter.downloadUrl?.startsWith('file:') ||
      newsletter.downloadUrl?.includes('localhost');
    const hasEnhancedData = !!(
      newsletter.displayDate ||
      newsletter.month ||
      newsletter.wordCount ||
      newsletter.searchableText
    );

    // Determine source based on sync status and locations
    let source: 'draft' | 'saved' | 'remote' | 'local' | 'metadata-only';
    let color: string;
    let icon: string;
    let status: 'complete' | 'metadata-only' | 'file-only' | 'synced';
    let description: string;

    switch (syncActions.status) {
      case 'synced':
        source = 'remote';
        color = 'green';
        icon = 'cloud-check';
        status = 'synced';
        description = `Synced (${locations.join(', ')})`;
        break;

      case 'needs-upload':
        source = 'local';
        color = 'orange';
        icon = 'cloud-upload';
        status = 'complete';
        description = `Needs Upload (${locations.join(', ')})`;
        break;

      case 'needs-download':
        source = 'remote';
        color = 'blue';
        icon = 'cloud-download';
        status = 'file-only';
        description = `Available for Download (${locations.join(', ')})`;
        break;

      case 'needs-sync':
        source = 'saved';
        color = 'amber';
        icon = 'sync';
        status = 'complete';
        description = `Needs Metadata Sync (${locations.join(', ')})`;
        break;

      case 'local-only':
        source = 'local';
        color = 'purple';
        icon = 'folder';
        status = locationStatus.processedMetadata ? 'complete' : 'file-only';
        description = `Local Only (${locations.join(', ')})`;
        break;

      case 'remote-only':
        source = 'remote';
        color = 'blue';
        icon = 'cloud';
        status = 'file-only';
        description = `Remote Only (${locations.join(', ')})`;
        break;

      default:
        // Fallback to legacy logic for edge cases
        if (isDraft && isLocalFile && hasFileObject && !hasEnhancedData) {
          source = 'local';
          color = 'purple';
          icon = 'folder';
          status = 'complete';
          description = `Local file imported (${locations.join(', ')})`;
        } else if (isDraft && !hasEnhancedData) {
          source = 'draft';
          color = 'grey';
          icon = 'file-document-outline';
          status = hasFileObject ? 'complete' : 'metadata-only';
          description = `Draft (${locations.join(', ')})`;
        } else {
          source = 'metadata-only';
          color = 'red';
          icon = 'alert';
          status = 'metadata-only';
          description = `Unknown Status (${locations.join(', ')})`;
        }
    }

    return {
      source,
      color,
      icon,
      status,
      description,
      locationStatus,
      syncActions,
      locations,
    };
  }

  // Helper function to get sync status based on actual newsletter data
  function getNewsletterSyncStatus(
    newsletter: UnifiedNewsletter,
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
  // Test function for debugging sync workflow with actual actions
  function testSyncWorkflow(draftFilename: string): void {
    console.log('🧪 Testing sync workflow for:', draftFilename);

    console.log('📊 BEFORE SYNC:');
    debugDataFlow();

    const newsletter = newsletters.value.find((n) => n.filename === draftFilename);
    if (!newsletter) {
      console.error('❌ Newsletter not found:', draftFilename);
      return;
    }

    const dataSource = getDataSource(newsletter);
    console.log('📍 File locations:', dataSource.locations);
    console.log('🔄 Sync status:', dataSource.syncActions.status);
    console.log('⚡ Available actions:', {
      canUpload: dataSource.syncActions.canUpload,
      canDownload: dataSource.syncActions.canDownload,
      canSyncMetadata: dataSource.syncActions.canSyncMetadata,
      needsUpload: dataSource.syncActions.needsUpload,
      needsDownload: dataSource.syncActions.needsDownload,
    });

    // Show what would happen
    if (dataSource.syncActions.needsUpload) {
      console.log('🚀 Would upload file to Firebase Storage');
    }
    if (dataSource.syncActions.needsDownload) {
      console.log('📥 Would download file from Firebase Storage');
    }
    if (dataSource.syncActions.canSyncMetadata) {
      console.log('🔄 Would sync metadata bidirectionally');
    }

    console.log('⏸️ Sync simulation complete - ready for real implementation');
  }

  // Upload a newsletter to Firebase Storage
  async function uploadNewsletterToFirebase(filename: string): Promise<void> {
    console.log('🚀 Uploading newsletter to Firebase:', filename);

    const newsletter = newsletters.value.find((n) => n.filename === filename);
    if (!newsletter) {
      throw new Error(`Newsletter not found: ${filename}`);
    }

    processingStates.value.isSyncing = true;

    try {
      // Check if we have a local file or draft data
      let draftData: Record<string, unknown> | undefined;
      try {
        const draftsData = localStorage.getItem('newsletter-drafts');
        if (draftsData) {
          const drafts = JSON.parse(draftsData);
          draftData = drafts.find((draft: Record<string, unknown>) => draft.filename === filename);
        }
      } catch {
        // Ignore errors
      }

      if (!draftData) {
        throw new Error('No draft data found for upload');
      }

      // Import Firebase services
      const { firebaseStorageService } = await import('../services/firebase-storage.service');
      const { firestoreService } = await import('../services/firebase-firestore.service');

      // Upload file to Firebase Storage if we have file data
      let downloadUrl = newsletter.downloadUrl;
      if (draftData.fileData) {
        console.log('📁 Uploading file to Firebase Storage...');
        // Upload file to Firebase Storage if we have file data
        const uploadMetadata: {
          title: string;
          publicationDate: string;
          year: number;
          season?: string;
          tags: string[];
        } = {
          title: newsletter.title,
          publicationDate:
            newsletter.displayDate || `${newsletter.year}.${newsletter.season || 'unknown'}`,
          year: newsletter.year,
          tags: newsletter.tags,
        };

        if (newsletter.season) {
          uploadMetadata.season = newsletter.season;
        }

        const uploadResult = await firebaseStorageService.uploadNewsletterPdf(
          draftData.fileData as File,
          uploadMetadata,
        );
        downloadUrl = uploadResult.downloadUrl;
      }

      // Create metadata object for Firestore following the exact interface pattern
      const newsletterMetadata: Omit<NewsletterMetadata, 'id'> = {
        filename,
        title: newsletter.title,
        publicationDate: newsletter.displayDate || `${newsletter.year}.${newsletter.season}`,
        year: newsletter.year,
        fileSize: newsletter.fileSize || 0,
        pageCount: newsletter.pageCount || 0,
        downloadUrl,
        storageRef: `newsletters/${filename}`,
        tags: newsletter.tags || [],
        featured: newsletter.featured || false,
        isPublished: newsletter.isPublished ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'user',
        actions: {
          canView: true,
          canDownload: true,
          canSearch: !!newsletter.searchableText,
          hasThumbnail: !!newsletter.thumbnailUrl,
        },
      };

      // Add optional fields only if they exist
      if (newsletter.description) newsletterMetadata.description = newsletter.description;
      if (newsletter.issue) newsletterMetadata.issueNumber = newsletter.issue.toString();
      if (newsletter.season) newsletterMetadata.season = newsletter.season;
      if (newsletter.month) newsletterMetadata.month = newsletter.month;
      if (newsletter.pageCount) newsletterMetadata.pageCount = newsletter.pageCount;
      if (newsletter.displayDate) newsletterMetadata.displayDate = newsletter.displayDate;
      if (newsletter.sortValue) newsletterMetadata.sortValue = newsletter.sortValue;
      if (newsletter.thumbnailUrl) newsletterMetadata.thumbnailUrl = newsletter.thumbnailUrl;
      if (newsletter.searchableText) newsletterMetadata.searchableText = newsletter.searchableText;

      // Save metadata to Firestore
      console.log('💾 Saving metadata to Firestore...');
      await firestoreService.saveNewsletterMetadata(newsletterMetadata);

      // Refresh data to show updated sync status
      await refreshFirebaseDataOnly();

      console.log('✅ Upload completed successfully');

      $q.notify({
        type: 'positive',
        message: `Newsletter uploaded successfully`,
        caption: filename,
        position: 'top',
      });
    } catch (error) {
      console.error('❌ Upload failed:', error);
      $q.notify({
        type: 'negative',
        message: 'Upload failed',
        caption: error instanceof Error ? error.message : 'Unknown error',
        position: 'top',
      });
      throw error;
    } finally {
      processingStates.value.isSyncing = false;
    }
  }

  // Download a newsletter from Firebase Storage
  async function downloadNewsletterFromFirebase(filename: string): Promise<void> {
    console.log('📥 Downloading newsletter from Firebase:', filename);

    const newsletter = newsletters.value.find((n) => n.filename === filename);
    if (!newsletter) {
      throw new Error(`Newsletter not found: ${filename}`);
    }

    const firebaseMeta = firebaseMetadataMap.value.get(filename);
    if (!firebaseMeta?.downloadUrl) {
      throw new Error('No Firebase download URL available');
    }

    processingStates.value.isSyncing = true;

    try {
      // Download the file
      console.log('� Downloading file from Firebase Storage...');
      const response = await fetch(firebaseMeta.downloadUrl as string);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'application/pdf' });

      // Save as draft
      const draftData = {
        id: `draft-${Date.now()}`,
        filename,
        title: firebaseMeta.title || newsletter.title,
        description: firebaseMeta.description || '',
        year: firebaseMeta.year || newsletter.year,
        season: firebaseMeta.season || newsletter.season,
        month: firebaseMeta.month,
        fileData: file,
        downloadUrl: URL.createObjectURL(blob),
        createdAt: new Date().toISOString(),
        source: 'firebase-download',
      };

      // Save to localStorage drafts
      let drafts: Array<unknown> = [];
      try {
        const draftsData = localStorage.getItem('newsletter-drafts');
        if (draftsData) {
          drafts = JSON.parse(draftsData);
        }
      } catch {
        // Ignore errors
      }

      // Remove existing draft with same filename
      drafts = drafts.filter((d: unknown) => (d as Record<string, unknown>).filename !== filename);
      drafts.push(draftData);

      localStorage.setItem('newsletter-drafts', JSON.stringify(drafts));

      // Reload newsletters to show the downloaded file
      await loadNewsletters();

      console.log('✅ Download completed successfully');

      $q.notify({
        type: 'positive',
        message: `Newsletter downloaded successfully`,
        caption: filename,
        position: 'top',
      });
    } catch (error) {
      console.error('❌ Download failed:', error);
      $q.notify({
        type: 'negative',
        message: 'Download failed',
        caption: error instanceof Error ? error.message : 'Unknown error',
        position: 'top',
      });
      throw error;
    } finally {
      processingStates.value.isSyncing = false;
    }
  }

  // Sync metadata bidirectionally
  async function syncNewsletterMetadata(
    filename: string,
    direction: 'upload' | 'download' | 'auto' = 'auto',
  ): Promise<void> {
    console.log('🔄 Syncing metadata for:', filename, 'direction:', direction);

    const newsletter = newsletters.value.find((n) => n.filename === filename);
    if (!newsletter) {
      throw new Error(`Newsletter not found: ${filename}`);
    }

    processingStates.value.isSyncing = true;

    try {
      const firebaseMeta = firebaseMetadataMap.value.get(filename);

      let draftMeta: Record<string, unknown> | undefined;
      try {
        const draftsData = localStorage.getItem('newsletter-drafts');
        if (draftsData) {
          const drafts = JSON.parse(draftsData);
          draftMeta = drafts.find((draft: Record<string, unknown>) => draft.filename === filename);
        }
      } catch {
        // Ignore errors
      }

      if (direction === 'auto') {
        // Determine direction based on timestamps or data richness
        const localUpdated = new Date(newsletter.updatedAt).getTime();
        const firebaseUpdated = firebaseMeta?.updatedAt
          ? new Date(firebaseMeta.updatedAt as string).getTime()
          : 0;

        direction = localUpdated > firebaseUpdated ? 'upload' : 'download';
        console.log('🤖 Auto-determined direction:', direction);
      }

      if (direction === 'upload') {
        // Upload local/draft metadata to Firebase
        console.log('⬆️ Uploading metadata to Firebase...');

        const { firestoreService } = await import('../services/firebase-firestore.service');

        const newsletterMetadata: Omit<NewsletterMetadata, 'id'> = {
          filename,
          title: newsletter.title,
          publicationDate: newsletter.displayDate || `${newsletter.year}.${newsletter.season}`,
          year: newsletter.year,
          fileSize: newsletter.fileSize || 0,
          pageCount: newsletter.pageCount || 0,
          downloadUrl: (firebaseMeta?.downloadUrl as string | undefined) || newsletter.downloadUrl,
          storageRef: `newsletters/${filename}`,
          tags: newsletter.tags || [],
          featured: newsletter.featured || false,
          isPublished: newsletter.isPublished ?? true,
          createdAt: newsletter.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: newsletter.createdBy || 'system',
          updatedBy: 'user',
          actions: {
            canView: true,
            canDownload: true,
            canSearch: !!newsletter.searchableText,
            hasThumbnail: !!newsletter.thumbnailUrl,
          },
        };

        // Add optional fields only if they exist
        if (newsletter.description) newsletterMetadata.description = newsletter.description;
        if (newsletter.issue) newsletterMetadata.issueNumber = newsletter.issue.toString();
        if (newsletter.season) newsletterMetadata.season = newsletter.season;
        if (newsletter.month) newsletterMetadata.month = newsletter.month;
        if (newsletter.pageCount) newsletterMetadata.pageCount = newsletter.pageCount;
        if (newsletter.displayDate) newsletterMetadata.displayDate = newsletter.displayDate;
        if (newsletter.sortValue) newsletterMetadata.sortValue = newsletter.sortValue;
        if (newsletter.thumbnailUrl) newsletterMetadata.thumbnailUrl = newsletter.thumbnailUrl;
        if (newsletter.searchableText)
          newsletterMetadata.searchableText = newsletter.searchableText;

        await firestoreService.saveNewsletterMetadata(newsletterMetadata);
      } else {
        // Download Firebase metadata to local/draft
        console.log('⬇️ Downloading metadata from Firebase...');

        if (!firebaseMeta) {
          throw new Error('No Firebase metadata to download');
        }

        // Update draft if it exists
        if (draftMeta) {
          const drafts = JSON.parse(localStorage.getItem('newsletter-drafts') || '[]');
          const draftIndex = drafts.findIndex(
            (d: Record<string, unknown>) => d.filename === filename,
          );

          if (draftIndex >= 0) {
            // Merge Firebase metadata into draft
            drafts[draftIndex] = {
              ...drafts[draftIndex],
              ...firebaseMeta,
              updatedAt: new Date().toISOString(),
            };

            localStorage.setItem('newsletter-drafts', JSON.stringify(drafts));
          }
        }

        // Could also update local metadata storage here if needed
      }

      // Refresh data to show updated sync status
      await refreshFirebaseDataOnly();

      console.log('✅ Metadata sync completed successfully');

      $q.notify({
        type: 'positive',
        message: `Metadata synced successfully`,
        caption: `${filename} (${direction})`,
        position: 'top',
      });
    } catch (error) {
      console.error('❌ Metadata sync failed:', error);
      $q.notify({
        type: 'negative',
        message: 'Metadata sync failed',
        caption: error instanceof Error ? error.message : 'Unknown error',
        position: 'top',
      });
      throw error;
    } finally {
      processingStates.value.isSyncing = false;
    }
  }

  function debugDataFlow(): void {
    console.log('=== DATA SOURCES DEBUG ===');
    console.log('Total newsletters in UI:', newsletters.value.length);
    console.log('Local metadata entries:', localMetadataMap.value.size);
    console.log('Firebase metadata entries:', firebaseMetadataMap.value.size);

    // Check draft data
    let draftCount = 0;
    try {
      const draftsData = localStorage.getItem('newsletter-drafts');
      if (draftsData) {
        const drafts = JSON.parse(draftsData);
        draftCount = drafts.length;
      }
    } catch {
      // Ignore errors
    }
    console.log('Draft entries in localStorage:', draftCount);

    // Check filename consistency
    newsletters.value.forEach((n) => {
      const firebaseMatch = firebaseMetadataMap.value.has(n.filename);
      const localMatch = Array.from(localMetadataMap.value.values()).some(
        (meta) => meta.newsletterId === n.id,
      );

      // Check if this filename has a draft
      let draftMatch = false;
      try {
        const draftsData = localStorage.getItem('newsletter-drafts');
        if (draftsData) {
          const drafts = JSON.parse(draftsData);
          draftMatch = drafts.some(
            (draft: Record<string, unknown>) => draft.filename === n.filename,
          );
        }
      } catch {
        // Ignore errors
      }

      console.log(`File ${n.filename}:`, {
        inFirebase: firebaseMatch,
        inLocal: localMatch,
        inDrafts: draftMatch,
        hasFirebaseMetadata: !!firebaseMetadataMap.value.get(n.filename),
      });
    });
  }

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

      // 2. Load newsletter drafts from localStorage
      let draftNewsletters: Array<unknown> = [];
      try {
        const draftsData = localStorage.getItem('newsletter-drafts');
        if (draftsData) {
          draftNewsletters = JSON.parse(draftsData) as Array<unknown>;
          console.log(`📝 Loaded ${draftNewsletters.length} drafts from localStorage`);
        }
      } catch (error) {
        console.warn('Failed to load drafts from localStorage:', error);
      }

      // 3. Load local extracted metadata
      const localMetadata = await localMetadataStorageService.getAllExtractedMetadata();
      const localMetadataMapById = new Map(localMetadata.map((meta) => [meta.newsletterId, meta]));

      // 4. Try to load Firebase metadata (if authenticated)
      let firebaseNewsletters: Array<unknown> = [];
      try {
        const { firestoreService } = await import('../services/firebase-firestore.service');
        const fbNewsletters = await firestoreService.getAllNewslettersForAdmin();
        firebaseNewsletters = fbNewsletters as Array<unknown>;
        console.log(`📄 Loaded ${fbNewsletters.length} newsletters from Firebase`);
      } catch {
        console.log('ℹ️ Firebase data not available (likely not authenticated)');
      }

      // 5. Create metadata maps by filename for sync status checking
      const localMetadataMapByFilename = new Map<string, Record<string, unknown>>();
      const firebaseMetadataMapByFilename = new Map<string, Record<string, unknown>>();
      const draftsMapByFilename = new Map<string, Record<string, unknown>>();

      // Populate local metadata maps by filename
      localMetadata.forEach((meta) => {
        const newsletter = baseNewsletters.find((n) => String(n.id) === meta.newsletterId);
        if (newsletter) {
          localMetadataMapByFilename.set(
            newsletter.filename,
            meta as unknown as Record<string, unknown>,
          );
        }
      });

      // Populate draft maps by filename
      draftNewsletters.forEach((draft: unknown) => {
        const draftData = draft as Record<string, unknown>;
        if (draftData.filename) {
          draftsMapByFilename.set(draftData.filename as string, draftData);
        }
      });

      // Populate Firebase metadata maps by filename
      firebaseNewsletters.forEach((meta: unknown) => {
        const fbMeta = meta as Record<string, unknown>;
        // CRITICAL FIX: Match by normalized filename for consistency
        const normalizedFbFilename = normalizeFilename(fbMeta.filename as string);
        const newsletter = baseNewsletters.find(
          (n) => normalizeFilename(n.filename) === normalizedFbFilename,
        );
        if (newsletter) {
          firebaseMetadataMapByFilename.set(newsletter.filename, fbMeta);
        }
      });

      // Update the reactive metadata maps
      localMetadataMap.value = localMetadataMapByFilename;
      firebaseMetadataMap.value = firebaseMetadataMapByFilename;

      await refreshLocalStorageStats();

      // 6. Merge all data sources including drafts
      newsletters.value = baseNewsletters.map((newsletter) => {
        const localMeta = localMetadataMapById.get(String(newsletter.id));
        // CRITICAL FIX: Use filename-based lookup for Firebase data, not ID
        // This ensures synced drafts appear correctly in the main list
        const firebaseMeta = firebaseMetadataMapByFilename.get(newsletter.filename);
        const draftMeta = draftsMapByFilename.get(newsletter.filename);

        const mergedNewsletter = {
          id: String(newsletter.id),
          filename: newsletter.filename,
          title: newsletter.title,
          description:
            (firebaseMeta?.description as string) ||
            (draftMeta?.description as string) ||
            undefined,
          summary: (firebaseMeta?.summary as string) || (draftMeta?.summary as string) || undefined,
          year:
            (firebaseMeta?.year as number) ||
            (draftMeta?.year as number) ||
            parseInt((newsletter.date || '2024').split('.')[0] || '2024') ||
            2024,
          season:
            (firebaseMeta?.season as string) ||
            (draftMeta?.season as string) ||
            (newsletter.date?.includes('summer')
              ? 'summer'
              : newsletter.date?.includes('winter')
                ? 'winter'
                : newsletter.date?.includes('spring')
                  ? 'spring'
                  : newsletter.date?.includes('fall')
                    ? 'fall'
                    : 'general'),
          month: (firebaseMeta?.month as number) || (draftMeta?.month as number) || undefined,
          displayDate:
            (firebaseMeta?.displayDate as string) ||
            (draftMeta?.displayDate as string) ||
            undefined,
          sortValue:
            (firebaseMeta?.sortValue as number) || (draftMeta?.sortValue as number) || undefined,
          syncStatus: getSyncStatus(
            (localMeta as Record<string, unknown> | undefined) || draftMeta,
            firebaseMeta,
          ),
          volume: (firebaseMeta?.volume as number) || (draftMeta?.volume as number) || undefined,
          issue: (firebaseMeta?.issue as number) || (draftMeta?.issue as number) || undefined,
          fileSize: (firebaseMeta?.fileSize as number) || (draftMeta?.fileSize as number) || 0,
          pageCount:
            (firebaseMeta?.pageCount as number) ||
            (draftMeta?.pageCount as number) ||
            newsletter.pages,
          wordCount:
            (localMeta?.wordCount as number) ||
            (firebaseMeta?.wordCount as number) ||
            (draftMeta?.wordCount as number),
          downloadUrl: newsletter.url,
          thumbnailUrl:
            newsletter.thumbnailUrl ||
            (firebaseMeta?.thumbnailUrl as string) ||
            (draftMeta?.thumbnailUrl as string) ||
            '',
          searchableText:
            (localMeta?.searchableText as string) ||
            (firebaseMeta?.searchableText as string) ||
            (draftMeta?.searchableText as string),
          tags: (firebaseMeta?.tags as string[]) || (draftMeta?.tags as string[]) || [],
          categories:
            (firebaseMeta?.categories as string[]) ||
            (draftMeta?.categories as string[]) ||
            newsletter.topics ||
            [],
          contributors:
            (firebaseMeta?.contributors as string[]) ||
            (draftMeta?.contributors as string[]) ||
            undefined,
          featured:
            (firebaseMeta?.featured as boolean) || (draftMeta?.featured as boolean) || false,
          isPublished: (firebaseMeta?.isPublished as boolean) ?? true,
          createdAt:
            (firebaseMeta?.createdAt as string) ||
            (draftMeta?.createdAt as string) ||
            new Date().toISOString(),
          updatedAt:
            (firebaseMeta?.updatedAt as string) ||
            (draftMeta?.updatedAt as string) ||
            new Date().toISOString(),
          createdBy:
            (firebaseMeta?.createdBy as string) || (draftMeta?.createdBy as string) || 'system',
          updatedBy:
            (firebaseMeta?.updatedBy as string) || (draftMeta?.updatedBy as string) || 'system',

          // Required date field
          publicationDate:
            (firebaseMeta?.publicationDate as string) ||
            (draftMeta?.publicationDate as string) ||
            new Date().toISOString(),

          // Extended metadata from local extraction
          keyTerms: localMeta ? Object.keys(localMeta.keywordCounts || {}) : undefined,
          keywordCounts: localMeta?.keywordCounts || undefined,
          readingTimeMinutes:
            (localMeta?.readingTimeMinutes as number) ||
            (draftMeta?.readingTimeMinutes as number) ||
            undefined,
          textExtractionVersion:
            (localMeta?.textExtractionVersion as string) ||
            (draftMeta?.textExtractionVersion as string) ||
            undefined,
          textExtractedAt:
            (localMeta?.textExtractedAt as string) ||
            (draftMeta?.textExtractedAt as string) ||
            undefined,

          // Version control
          version: (firebaseMeta?.version as number) || (draftMeta?.version as number) || 1,
        } as UnifiedNewsletter;

        return mergedNewsletter;
      });

      console.log(
        `✅ Loaded ${newsletters.value.length} newsletters (merged from manifest, local metadata, drafts, and Firebase)`,
      );
      console.log(
        `📊 With metadata: ${newsletters.value.filter((n) => n.wordCount).length} have word counts, ${newsletters.value.filter((n) => n.tags.length > 0).length} have tags`,
      );
      console.log(
        `📝 Draft integration: ${draftNewsletters.length} drafts found, ${newsletters.value.filter((n) => draftsMapByFilename.has(n.filename)).length} matched to newsletters`,
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

  /**
   * Refresh only Firebase metadata without triggering PDF processing
   * Used after sync operations to update the UI without mass PDF processing
   */
  async function refreshFirebaseDataOnly(): Promise<void> {
    console.log('🔄 Refreshing Firebase metadata only...');

    try {
      // Temporarily disable PDF processing to avoid cascade
      const originalPDFProcessing = true; // Store current state
      setPDFProcessing(false);

      // Load only Firebase metadata without touching local PDFs
      let firebaseNewsletters: Array<unknown> = [];
      try {
        const { firestoreService } = await import('../services/firebase-firestore.service');
        const fbNewsletters = await firestoreService.getAllNewslettersForAdmin();
        firebaseNewsletters = fbNewsletters as Array<unknown>;
        console.log(`📄 Refreshed ${fbNewsletters.length} newsletters from Firebase`);
      } catch {
        console.log('ℹ️ Firebase data not available (likely not authenticated)');
        return;
      } finally {
        // Restore PDF processing state
        setPDFProcessing(originalPDFProcessing);
      }

      // Get current base newsletters (without reloading from PDF service)
      const currentBaseNewsletters = newsletters.value.map((n) => ({
        id: n.id,
        filename: n.filename,
        title: n.title,
        url: n.downloadUrl,
        thumbnailUrl: n.thumbnailUrl,
        date: `${n.year}.${n.season}`,
        pages: n.pageCount || 0,
        topics: n.categories || [],
        isProcessed: true,
        isProcessing: false,
      }));

      // Update Firebase metadata maps by filename
      const firebaseMetadataMapByFilename = new Map<string, Record<string, unknown>>();

      firebaseNewsletters.forEach((meta: unknown) => {
        const fbMeta = meta as Record<string, unknown>;
        // CRITICAL: Match by normalized filename for consistency
        const normalizedFbFilename = normalizeFilename(fbMeta.filename as string);
        const newsletter = currentBaseNewsletters.find(
          (n) => normalizeFilename(n.filename) === normalizedFbFilename,
        );
        if (newsletter) {
          firebaseMetadataMapByFilename.set(newsletter.filename, fbMeta);
        }
      });

      // Update the reactive Firebase metadata map
      firebaseMetadataMap.value = firebaseMetadataMapByFilename;

      // Re-merge the data using current base newsletters + updated Firebase data
      const localMetadata = await localMetadataStorageService.getAllExtractedMetadata();
      const localMetadataMapById = new Map(localMetadata.map((meta) => [meta.newsletterId, meta]));

      newsletters.value = currentBaseNewsletters.map((newsletter) => {
        const localMeta = localMetadataMapById.get(String(newsletter.id));
        const firebaseMeta = firebaseMetadataMapByFilename.get(newsletter.filename);

        const mergedNewsletter = {
          id: String(newsletter.id),
          filename: newsletter.filename,
          title: newsletter.title,
          description: (firebaseMeta?.description as string) || undefined,
          summary: (firebaseMeta?.summary as string) || undefined,
          year:
            (firebaseMeta?.year as number) ||
            parseInt((newsletter.date || '2024').split('.')[0] || '2024') ||
            2024,
          season:
            (firebaseMeta?.season as string) ||
            (newsletter.date?.includes('summer')
              ? 'summer'
              : newsletter.date?.includes('winter')
                ? 'winter'
                : newsletter.date?.includes('spring')
                  ? 'spring'
                  : newsletter.date?.includes('fall')
                    ? 'fall'
                    : 'general'),
          month: (firebaseMeta?.month as number) || undefined,
          displayDate: (firebaseMeta?.displayDate as string) || undefined,
          sortValue: (firebaseMeta?.sortValue as number) || undefined,
          syncStatus: getSyncStatus(localMeta as Record<string, unknown> | undefined, firebaseMeta),
          volume: (firebaseMeta?.volume as number) || undefined,
          issue: (firebaseMeta?.issue as number) || undefined,
          fileSize: (firebaseMeta?.fileSize as number) || 0,
          pageCount: (firebaseMeta?.pageCount as number) || newsletter.pages,
          wordCount: (localMeta?.wordCount as number) || (firebaseMeta?.wordCount as number),
          downloadUrl: newsletter.url,
          thumbnailUrl: newsletter.thumbnailUrl || (firebaseMeta?.thumbnailUrl as string) || '',
          searchableText:
            (localMeta?.searchableText as string) || (firebaseMeta?.searchableText as string),
          tags: (firebaseMeta?.tags as string[]) || [],
          categories: (firebaseMeta?.categories as string[]) || newsletter.topics || [],
          contributors: (firebaseMeta?.contributors as string[]) || undefined,
          featured: (firebaseMeta?.featured as boolean) || false,
          isPublished: (firebaseMeta?.isPublished as boolean) ?? true,
          createdAt: (firebaseMeta?.createdAt as string) || new Date().toISOString(),
          updatedAt: (firebaseMeta?.updatedAt as string) || new Date().toISOString(),
          createdBy: (firebaseMeta?.createdBy as string) || 'system',
          updatedBy: (firebaseMeta?.updatedBy as string) || 'system',

          // Required date field
          publicationDate: (firebaseMeta?.publicationDate as string) || new Date().toISOString(),

          // Extended metadata from local extraction
          keyTerms: localMeta ? Object.keys(localMeta.keywordCounts || {}) : undefined,
          keywordCounts: localMeta?.keywordCounts || undefined,
          readingTimeMinutes: (localMeta?.readingTimeMinutes as number) || undefined,
          textExtractionVersion: (localMeta?.textExtractionVersion as string) || undefined,
          textExtractedAt: (localMeta?.textExtractedAt as string) || undefined,

          // Version control
          version: (firebaseMeta?.version as number) || 1,
        } as UnifiedNewsletter;

        return mergedNewsletter;
      });

      console.log('✅ Firebase metadata refreshed without PDF processing');
    } catch (error) {
      console.error('Failed to refresh Firebase metadata:', error);
      throw error;
    }
  }

  return {
    // State
    newsletters: newsletters as Ref<UnifiedNewsletter[]>,
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
    refreshFirebaseDataOnly,
    getDataSource,
    debugDataFlow,
    testSyncWorkflow,

    // New sync methods
    uploadNewsletterToFirebase,
    downloadNewsletterFromFirebase,
    syncNewsletterMetadata,
  };
}
