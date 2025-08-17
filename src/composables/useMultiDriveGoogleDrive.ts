/**
 * Multi-Drive Google Drive PDF Manager
 * Loads PDFs from multiple Google Drive folders using API key only (no auth needed)
 * Based on the working usePublicGoogleDrive approach
 */

import { computed, reactive } from 'vue';
import type { IssueWithGoogleDrive } from '../types/google-drive-content';

interface GoogleDriveFile {
  id: string;
  name: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

interface GoogleDriveResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  envKey: string;
}

const state = reactive({
  isLoading: false,
  isInitialized: false,
  error: null as string | null,
  pdfs: [] as IssueWithGoogleDrive[],
  thumbnails: {} as Record<string, string>,
  loadingThumbnails: new Set<string>(),
  folderStatuses: {} as Record<string, { loaded: boolean; error?: string; count: number }>,
});

export function useMultiDriveGoogleDrive() {
  // Get configured drive folders from environment
  const getDriveFolders = (): DriveFolder[] => {
    const folders: DriveFolder[] = [];

    // Add all configured PDF drive folders
    const pdfsFolder = import.meta.env.VITE_GOOGLE_DRIVE_PDFS_FOLDER_ID;
    const issuesFolder = import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID;
    const contentFolder = import.meta.env.VITE_GOOGLE_DRIVE_CONTENT_FOLDER_ID;

    if (pdfsFolder) {
      folders.push({
        id: pdfsFolder,
        name: 'PDFs Drive',
        envKey: 'VITE_GOOGLE_DRIVE_PDFS_FOLDER_ID',
      });
    }

    if (issuesFolder) {
      folders.push({
        id: issuesFolder,
        name: 'Issues Drive',
        envKey: 'VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID',
      });
    }

    if (contentFolder) {
      folders.push({
        id: contentFolder,
        name: 'Content Drive',
        envKey: 'VITE_GOOGLE_DRIVE_CONTENT_FOLDER_ID',
      });
    }

    return folders;
  };

  // Load PDFs from a specific Google Drive folder
  const loadFolderContents = async (
    folderId: string,
    folderName: string,
  ): Promise<GoogleDriveFile[]> => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    const query = `'${folderId}' in parents and trashed=false`;
    const fields = 'files(id,name,size,modifiedTime,webViewLink,thumbnailLink)';

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&key=${apiKey}`;

    console.log(`🌐 Loading ${folderName} (${folderId})...`);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error for ${folderName}:`, errorText);
        throw new Error(
          `Google Drive API error for ${folderName}: ${response.status} ${errorText}`,
        );
      }

      const data: GoogleDriveResponse = await response.json();
      console.log(`📁 ${folderName} response:`, data.files?.length || 0, 'files');

      return data.files || [];
    } catch (error) {
      console.error(`❌ Fetch error for ${folderName}:`, error);
      throw error;
    }
  };

  // Convert Google Drive files to PDF issues
  const convertFilesToPdfs = (
    files: GoogleDriveFile[],
    folderName: string,
  ): IssueWithGoogleDrive[] => {
    return files
      .filter((file) => file.name.toLowerCase().endsWith('.pdf'))
      .map((file, index) => {
        const issue: IssueWithGoogleDrive = {
          id: Date.now() + index, // Unique ID across folders
          title: file.name.replace('.pdf', ''),
          date: file.modifiedTime || new Date().toISOString(),
          pages: 0,
          filename: file.name,
          url: `https://drive.google.com/file/d/${file.id}/view`,
          googleDriveUrl: `https://drive.google.com/file/d/${file.id}/preview`,
          googleDriveFileId: file.id,
          category: folderName,
          description: `PDF from ${folderName}: ${file.name}`,
          status: 'google-drive',
          syncStatus: 'synced',
        };

        // Add optional properties only if they exist
        if (file.thumbnailLink) {
          issue.thumbnailUrl = file.thumbnailLink;
        }
        if (file.size) {
          issue.fileSize = file.size;
        }

        return issue;
      });
  };

  // Load thumbnail for a PDF (if available)
  const loadThumbnail = async (fileId: string): Promise<string | null> => {
    if (state.loadingThumbnails.has(fileId) || state.thumbnails[fileId]) {
      return state.thumbnails[fileId] || null;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) return null;

    try {
      state.loadingThumbnails.add(fileId);

      // Try to get thumbnail directly from Google Drive
      const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300`;

      // Test if thumbnail is accessible
      const response = await fetch(thumbnailUrl);
      if (response.ok) {
        state.thumbnails[fileId] = thumbnailUrl;
        return thumbnailUrl;
      }

      return null;
    } catch (error) {
      console.warn(`⚠️ Could not load thumbnail for ${fileId}:`, error);
      return null;
    } finally {
      state.loadingThumbnails.delete(fileId);
    }
  };

  // Initialize and load all PDFs from configured drives
  const initialize = async (): Promise<void> => {
    if (state.isInitialized) {
      console.log('✅ Already initialized');
      return;
    }

    try {
      state.isLoading = true;
      state.error = null;
      state.pdfs = [];
      state.folderStatuses = {};

      console.log('🚀 MULTI-DRIVE APPROACH: Loading PDFs from all configured drives...');

      const folders = getDriveFolders();
      console.log(
        '📁 Target folders:',
        folders.map((f) => f.name),
      );

      if (folders.length === 0) {
        throw new Error('No Google Drive folders configured for PDFs');
      }

      const allPdfs: IssueWithGoogleDrive[] = [];

      // Load each folder's contents
      for (const folder of folders) {
        try {
          console.log(`📂 Processing ${folder.name}...`);

          const files = await loadFolderContents(folder.id, folder.name);
          const pdfs = convertFilesToPdfs(files, folder.name);

          allPdfs.push(...pdfs);

          state.folderStatuses[folder.name] = {
            loaded: true,
            count: pdfs.length,
          };

          console.log(`✅ ${folder.name}: ${pdfs.length} PDFs loaded`);

          // Try to load thumbnails for PDFs (non-blocking)
          for (const pdf of pdfs) {
            if (pdf.googleDriveFileId && pdf.thumbnailUrl) {
              loadThumbnail(pdf.googleDriveFileId)
                .then((thumbnail) => {
                  if (thumbnail && thumbnail !== pdf.thumbnailUrl) {
                    pdf.cacheThumbnailUrl = thumbnail;
                  }
                })
                .catch((error) => {
                  console.warn(`⚠️ Failed to load thumbnail for ${pdf.title}:`, error);
                });
            }
          }
        } catch (error) {
          console.error(`❌ Failed to load ${folder.name}:`, error);
          state.folderStatuses[folder.name] = {
            loaded: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            count: 0,
          };
        }
      }

      state.pdfs = allPdfs;
      state.isInitialized = true;

      console.log('✅ MULTI-DRIVE SUCCESS!');
      console.log('📊 Final results:', {
        totalPdfs: allPdfs.length,
        foldersProcessed: Object.keys(state.folderStatuses).length,
        folderStatuses: state.folderStatuses,
      });

      // If no PDFs found anywhere, show a warning but don't error
      if (allPdfs.length === 0) {
        console.warn('⚠️ No PDFs found in any configured drive folder');
        state.error = 'No PDFs found in any configured Google Drive folder';
      }
    } catch (error) {
      console.error('❌ Multi-drive approach failed:', error);
      state.error =
        error instanceof Error ? error.message : 'Failed to load PDFs from Google Drive';
      throw error;
    } finally {
      state.isLoading = false;
    }
  };

  // Computed values
  const allPdfs = computed(() =>
    state.pdfs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  );

  const pdfsByFolder = computed(() => {
    const grouped = {} as Record<string, IssueWithGoogleDrive[]>;
    state.pdfs.forEach((pdf) => {
      const folder = pdf.category || 'Unknown';
      if (!grouped[folder]) grouped[folder] = [];
      grouped[folder].push(pdf);
    });
    return grouped;
  });

  const latestPdf = computed(() => allPdfs.value[0] || null);

  const folderSummary = computed(() => {
    return Object.entries(state.folderStatuses).map(([name, status]) => ({
      name,
      ...status,
    }));
  });

  return {
    // State
    state: computed(() => state),
    allPdfs,
    pdfsByFolder,
    latestPdf,
    folderSummary,

    // Methods
    initialize,
    loadThumbnail,
  };
}
