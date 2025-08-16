// src/composables/usePublicationHub.ts
// Integration composable for the DeepSeek publication hub solution
import { ref, computed, onMounted } from 'vue';
import { googleDriveThumbnailService } from '../services/google-drive-thumbnail-service';
import {
  fileMetadataStorage,
  type StoredFileMetadata,
  type SearchFilter,
} from '../services/file-metadata-storage';
import { useDynamicGoogleDriveIssues } from './useDynamicGoogleDriveIssues';

export interface PublicationHubConfig {
  autoGenerateThumbnails: boolean;
  cacheThumbails: boolean;
  maxThumbnailSize: number;
  supportedFileTypes: string[];
  googleDriveFolderId?: string;
}

export function usePublicationHub(config: Partial<PublicationHubConfig> = {}) {
  // Configuration with defaults
  const hubConfig = ref<PublicationHubConfig>({
    autoGenerateThumbnails: true,
    cacheThumbails: true,
    maxThumbnailSize: 300,
    supportedFileTypes: [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'jpg',
      'jpeg',
      'png',
      'gif',
    ],
    ...config,
  });

  // State management
  const files = ref<StoredFileMetadata[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const syncStatus = ref<'idle' | 'syncing' | 'error' | 'success'>('idle');

  // Integration with existing Google Drive issues
  const {
    issues: driveIssues,
    loading: driveLoading,
    error: driveError,
  } = useDynamicGoogleDriveIssues();

  // Computed properties
  const pdfFiles = computed(() => files.value.filter((file) => file.type === 'pdf'));
  const imageFiles = computed(() =>
    files.value.filter((file) => ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.type)),
  );
  const documentFiles = computed(() =>
    files.value.filter((file) => ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(file.type)),
  );

  const totalFiles = computed(() => files.value.length);
  const totalSize = computed(() => {
    const totalBytes = files.value.reduce((acc, file) => {
      const sizeMatch = file.size.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
      if (sizeMatch && sizeMatch[1] && sizeMatch[2]) {
        const value = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2].toUpperCase();
        const multipliers = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
        return acc + value * (multipliers[unit as keyof typeof multipliers] || 1);
      }
      return acc;
    }, 0);

    return formatBytes(totalBytes);
  });

  // Initialize the hub
  async function initialize() {
    isLoading.value = true;
    error.value = null;

    try {
      // Initialize storage
      await fileMetadataStorage.initialize();

      // Load existing files
      await loadFiles();

      // Sync with Google Drive issues if available
      await syncWithGoogleDrive();

      // Generate thumbnails if enabled
      if (hubConfig.value.autoGenerateThumbnails) {
        await generateAllThumbnails();
      }

      syncStatus.value = 'success';
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize publication hub';
      syncStatus.value = 'error';
      console.error('Publication hub initialization error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  // Load files from storage
  async function loadFiles() {
    try {
      files.value = await fileMetadataStorage.getAllFiles();
    } catch (err) {
      throw new Error('Failed to load files from storage');
    }
  }

  // Sync with existing Google Drive integration
  async function syncWithGoogleDrive() {
    if (driveIssues.value.length === 0) {
      return; // No drive issues to sync
    }

    syncStatus.value = 'syncing';

    try {
      const filesToSync: StoredFileMetadata[] = [];

      for (const issue of driveIssues.value) {
        // Check if file already exists in storage
        const existingFile = files.value.find((f) => f.id === issue.googleDriveFileId);

        if (!existingFile && issue.googleDriveFileId) {
          // Convert Google Drive issue to stored file metadata
          const fileMetadata: StoredFileMetadata = {
            id: issue.googleDriveFileId,
            name: issue.title,
            type: 'pdf', // Assuming issues are PDFs
            size: issue.fileSize || 'Unknown',
            uploaded: issue.lastModified || new Date().toISOString(),
            tags: [issue.category || 'issue', ...(issue.tags || [])],
            mimeType: 'application/pdf',
            ...(issue.googleDriveUrl && { webViewLink: issue.googleDriveUrl }),
            ...(issue.url && { webContentLink: issue.url }),
          };

          filesToSync.push(fileMetadata);
        }
      }

      // Bulk store new files
      if (filesToSync.length > 0) {
        await fileMetadataStorage.bulkStoreFiles(filesToSync);
        files.value = [...files.value, ...filesToSync];
      }
    } catch (err) {
      console.error('Failed to sync with Google Drive:', err);
      // Don't throw, as this is not critical
    }
  }

  // Upload new files
  async function uploadFiles(fileList: File[]): Promise<StoredFileMetadata[]> {
    const uploadedFiles: StoredFileMetadata[] = [];

    for (const file of fileList) {
      if (!hubConfig.value.supportedFileTypes.includes(getFileExtension(file.name))) {
        console.warn(`Skipping unsupported file type: ${file.name}`);
        continue;
      }

      try {
        // In a real implementation, this would upload to Google Drive
        // For now, we'll simulate the upload and create metadata
        const fileMetadata = await simulateUpload(file);

        // Store in IndexedDB
        await fileMetadataStorage.storeFile(fileMetadata);

        // Add to local state
        files.value.unshift(fileMetadata);
        uploadedFiles.push(fileMetadata);

        // Generate thumbnail if it's a PDF and auto-generation is enabled
        if (file.type === 'application/pdf' && hubConfig.value.autoGenerateThumbnails) {
          await generateThumbnail(fileMetadata);
        }
      } catch (err) {
        console.error(`Failed to upload file ${file.name}:`, err);
      }
    }

    return uploadedFiles;
  }

  // Generate thumbnails for all PDF files
  async function generateAllThumbnails() {
    const pdfsWithoutThumbnails = pdfFiles.value.filter((file) => !file.thumbnail);

    for (const file of pdfsWithoutThumbnails) {
      try {
        await generateThumbnail(file);
      } catch (err) {
        console.error(`Failed to generate thumbnail for ${file.name}:`, err);
      }
    }
  }

  // Generate thumbnail for a specific file
  async function generateThumbnail(file: StoredFileMetadata) {
    try {
      const thumbnail = await googleDriveThumbnailService.getThumbnail(file, {
        width: hubConfig.value.maxThumbnailSize,
      });

      // Update file metadata
      await fileMetadataStorage.updateFile(file.id, { thumbnail });

      // Update local state
      const fileIndex = files.value.findIndex((f) => f.id === file.id);
      if (fileIndex !== -1 && files.value[fileIndex]) {
        files.value[fileIndex].thumbnail = thumbnail;
      }
    } catch (err) {
      console.error(`Thumbnail generation failed for ${file.name}:`, err);
      throw err;
    }
  }

  // Search files
  async function searchFiles(filter: SearchFilter): Promise<StoredFileMetadata[]> {
    try {
      return await fileMetadataStorage.searchFiles(filter);
    } catch (err) {
      console.error('File search failed:', err);
      return [];
    }
  }

  // Update file tags
  async function updateFileTags(fileId: string, tags: string[]) {
    try {
      await fileMetadataStorage.updateFile(fileId, { tags });

      // Update local state
      const fileIndex = files.value.findIndex((f) => f.id === fileId);
      if (fileIndex !== -1 && files.value[fileIndex]) {
        files.value[fileIndex].tags = tags;
      }
    } catch (err) {
      console.error('Failed to update file tags:', err);
      throw err;
    }
  }

  // Delete file
  async function deleteFile(fileId: string) {
    try {
      await fileMetadataStorage.deleteFile(fileId);

      // Remove from local state
      files.value = files.value.filter((f) => f.id !== fileId);
    } catch (err) {
      console.error('Failed to delete file:', err);
      throw err;
    }
  }

  // Get storage statistics
  async function getStorageStats() {
    try {
      return await fileMetadataStorage.getStorageStats();
    } catch (err) {
      console.error('Failed to get storage stats:', err);
      return {
        totalFiles: 0,
        totalSize: '0 B',
        filesByType: {},
      };
    }
  }

  // Clear all cached thumbnails
  function clearThumbnailCache() {
    googleDriveThumbnailService.clearCache();
  }

  // Refresh all data
  async function refresh() {
    await initialize();
  }

  // Helper functions
  function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  async function simulateUpload(file: File): Promise<StoredFileMetadata> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));

    // Generate file metadata
    return {
      id: generateFileId(),
      name: file.name,
      type: getFileExtension(file.name),
      size: formatBytes(file.size),
      uploaded: new Date().toISOString(),
      tags: ['uploaded'],
      mimeType: file.type,
      webViewLink: `https://drive.google.com/file/d/${generateFileId()}/view`,
      webContentLink: `https://drive.google.com/uc?id=${generateFileId()}`,
    };
  }

  function generateFileId(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }

  function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${bytes} B`;
    }
  }

  // Initialize on mount
  onMounted(() => {
    initialize();
  });

  return {
    // State
    files: files.value,
    isLoading,
    error,
    syncStatus,
    hubConfig,

    // Computed
    pdfFiles,
    imageFiles,
    documentFiles,
    totalFiles,
    totalSize,

    // Methods
    initialize,
    loadFiles,
    uploadFiles,
    generateAllThumbnails,
    generateThumbnail,
    searchFiles,
    updateFileTags,
    deleteFile,
    getStorageStats,
    clearThumbnailCache,
    refresh,

    // Integration with existing services
    driveIssues,
    driveLoading,
    driveError,
    syncWithGoogleDrive,
  };
}
