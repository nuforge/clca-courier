// src/composables/usePublicationHub.ts
// Integration composable for the publication hub solution
import { ref, computed, onMounted } from 'vue';
import {
  fileMetadataStorage,
  type StoredFileMetadata,
  type SearchFilter,
} from '../services/file-metadata-storage';
import { useSiteStore } from '../stores/site-store-simple';
import type { PdfDocument } from './usePdfViewer';

export interface PublicationHubConfig {
  autoGenerateThumbnails: boolean;
  cacheThumbails: boolean;
  maxThumbnailSize: number;
  supportedFileTypes: string[];
}

export function usePublicationHub(config: Partial<PublicationHubConfig> = {}) {
  // Configuration with defaults
  const defaultConfig: PublicationHubConfig = {
    autoGenerateThumbnails: true,
    cacheThumbails: true,
    maxThumbnailSize: 200,
    supportedFileTypes: ['pdf'],
  };

  const finalConfig = { ...defaultConfig, ...config };

  // Site store for data access
  const siteStore = useSiteStore();

  // State
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const publications = ref<PdfDocument[]>([]);
  const metadata = ref<Map<string, StoredFileMetadata>>(new Map());

  // Computed
  const totalPublications = computed(() => publications.value.length);
  const hasPublications = computed(() => totalPublications.value > 0);

  // Methods
  const loadPublications = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      // Use archived issues from site store
      publications.value = siteStore.archivedIssues || [];

      // Load metadata for each publication
      for (const pub of publications.value) {
        const storedMetadata = await fileMetadataStorage.getFile(pub.id.toString());
        if (storedMetadata) {
          metadata.value.set(pub.filename, storedMetadata);
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load publications';
    } finally {
      isLoading.value = false;
    }
  };

  const searchPublications = (filters: SearchFilter[]): PdfDocument[] => {
    try {
      // Simple search implementation using the publications array
      let results = [...publications.value];

      for (const filter of filters) {
        switch (filter.type) {
          case 'filename':
            results = results.filter((pub) =>
              pub.filename.toLowerCase().includes(filter.searchText?.toLowerCase() || ''),
            );
            break;
          case 'title':
            results = results.filter((pub) =>
              pub.title?.toLowerCase().includes(filter.searchText?.toLowerCase() || ''),
            );
            break;
          case 'date':
            results = results.filter((pub) => pub.date?.includes(filter.searchText || ''));
            break;
        }
      }

      return results;
    } catch (err) {
      console.error('Search failed:', err);
      return [];
    }
  };

  const generateThumbnail = async (publication: PdfDocument): Promise<string | null> => {
    try {
      if (!finalConfig.autoGenerateThumbnails) {
        return null;
      }

      // For now, return a placeholder or existing thumbnail
      // This can be enhanced with actual thumbnail generation later
      const thumbnailPath = `/thumbnails/${publication.filename.replace('.pdf', '.jpg')}`;

      // Check if thumbnail exists (simplified check)
      try {
        const response = await fetch(thumbnailPath);
        if (response.ok) {
          return thumbnailPath;
        }
      } catch {
        // Thumbnail doesn't exist
      }

      return null;
    } catch (err) {
      console.error('Thumbnail generation failed:', err);
      return null;
    }
  };

  const getMetadata = (filename: string): StoredFileMetadata | null => {
    return metadata.value.get(filename) || null;
  };

  const updateMetadata = async (filename: string, newMetadata: Partial<StoredFileMetadata>) => {
    try {
      const existing = metadata.value.get(filename);
      const updated = { ...existing, ...newMetadata } as StoredFileMetadata;

      await fileMetadataStorage.storeFile(updated);
      metadata.value.set(filename, updated);
    } catch (err) {
      console.error('Failed to update metadata:', err);
    }
  };

  const clearCache = async () => {
    metadata.value.clear();
    // Clear file metadata storage
    await fileMetadataStorage.clearAll();
  };

  // Lifecycle
  onMounted(() => {
    void loadPublications();
  });

  return {
    // State
    isLoading,
    error,
    publications,
    metadata,

    // Computed
    totalPublications,
    hasPublications,

    // Methods
    loadPublications,
    searchPublications,
    generateThumbnail,
    getMetadata,
    updateMetadata,
    clearCache,

    // Config
    config: finalConfig,
  };
}
