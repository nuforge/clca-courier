// src/composables/useGoogleDrivePdfs.ts
import { ref, computed } from 'vue';
import { GoogleDrivePublicAccess } from '../services/google-drive-public-access';
import { usePdfThumbnails } from './usePdfThumbnails';
import type { IssueWithGoogleDrive } from '../types/google-drive-content';

interface GoogleDrivePdfState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  issues: IssueWithGoogleDrive[];
  thumbnails: Record<string, string>;
  loadingThumbnails: Set<string>;
}

interface MetadataCacheEntry {
  pageCount: number;
  fileSize: string;
  lastModified: string;
  timestamp: number;
}

export function useGoogleDrivePdfs() {
  // State management
  const state = ref<GoogleDrivePdfState>({
    isLoading: false,
    isInitialized: false,
    error: null,
    issues: [],
    thumbnails: {},
    loadingThumbnails: new Set(),
  });

  // Thumbnail management
  const { getThumbnail } = usePdfThumbnails();

  // Cache for PDF metadata
  const metadataCache = ref<Record<string, MetadataCacheEntry>>({});

  // Computed properties
  const archivedIssues = computed(() =>
    state.value.issues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  );

  const latestIssue = computed(() => archivedIssues.value[0] || null);

  const issuesByYear = computed(() => {
    const grouped: Record<string, IssueWithGoogleDrive[]> = {};
    archivedIssues.value.forEach((issue) => {
      const year = new Date(issue.date).getFullYear().toString();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(issue);
    });
    return grouped;
  });

  // Load sample data for development/fallback
  const loadSampleData = (): void => {
    try {
      // Create some sample issues that represent what would come from Google Drive
      const sampleIssues: IssueWithGoogleDrive[] = [
        {
          id: 1,
          title: 'Summer 2025 Issue',
          date: '2025-06-01',
          pages: 24,
          filename: 'Courier - 2025.06 - June.pdf',
          googleDriveFileId: 'sample_file_1',
          localUrl: '/issues/Courier - 2025.06 - June.pdf',
          syncStatus: 'synced' as const,
          status: 'local' as const,
        },
        {
          id: 2,
          title: 'Picnic Special 2025',
          date: '2025-08-01',
          pages: 16,
          filename: 'PICNIC 8.2025.pdf',
          googleDriveFileId: 'sample_file_2',
          localUrl: '/issues/PICNIC 8.2025.pdf',
          syncStatus: 'synced' as const,
          status: 'local' as const,
        },
        {
          id: 3,
          title: 'Winter 2022 Issue',
          date: '2022-12-01',
          pages: 20,
          filename: 'Conashaugh Winter 2022 Web.pdf',
          googleDriveFileId: 'sample_file_3',
          localUrl: '/issues/Conashaugh Winter 2022 Web.pdf',
          syncStatus: 'synced' as const,
          status: 'local' as const,
        },
      ];

      state.value.issues = sampleIssues;
      console.log('📋 Sample issues loaded:', sampleIssues.length);
    } catch (error) {
      console.error('Error loading sample data:', error);
    }
  };

  // Load issues from Google Drive using public access
  const loadIssuesFromGoogleDrive = async (
    publicAccess: GoogleDrivePublicAccess,
  ): Promise<void> => {
    try {
      state.value.isLoading = true;

      // Get the issues folder ID from environment
      const issuesFolderId = import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID;
      if (!issuesFolderId) {
        console.warn('⚠️ No issues folder ID configured - using sample data');
        loadSampleData();
        return;
      }

      console.info(`📁 Scanning Google Drive folder: ${issuesFolderId}`);

      // Test folder access first
      const hasAccess = await publicAccess.testFolderAccess(issuesFolderId);
      if (!hasAccess) {
        console.warn('⚠️ Cannot access issues folder - using sample data');
        loadSampleData();
        return;
      }

      // List PDF files in the folder
      const files = await publicAccess.listFolderFiles(issuesFolderId);
      const pdfFiles = files.filter((file) => file.mimeType === 'application/pdf');

      if (pdfFiles.length === 0) {
        console.warn('⚠️ No PDF files found in issues folder - using sample data');
        loadSampleData();
        return;
      }

      // Convert Google Drive files to IssueWithGoogleDrive format
      const issues: IssueWithGoogleDrive[] = pdfFiles.map((file, index) => {
        const title = extractIssueTitle(file.name);
        const extractedDate = extractDateFromFilename(file.name);
        const createdDate = file.createdTime
          ? file.createdTime.split('T')[0]
          : new Date().toISOString().split('T')[0];
        const date = extractedDate ?? createdDate; // Use ?? to ensure never undefined

        const issueData: IssueWithGoogleDrive = {
          id: index + 1,
          title,
          date,
          pages: 1, // Default - will be updated when PDF is loaded
          filename: file.name,
          googleDriveFileId: file.id,
          url: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
          googleDriveUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
          lastModified: file.modifiedTime ?? createdDate,
          etag: '', // Not available in public access
          status: 'google-drive' as const,
          syncStatus: 'synced' as const,
        };

        // Only set thumbnailUrl if it exists
        if (file.thumbnailLink) {
          issueData.thumbnailUrl = file.thumbnailLink;
        }

        return issueData;
      });

      // Sort by date (newest first)
      issues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      state.value.issues = issues;
      console.log(`✅ Loaded ${issues.length} issues from Google Drive`);
    } catch (error) {
      console.error('Failed to load issues from Google Drive:', error);
      state.value.error = error instanceof Error ? error.message : 'Failed to load issues';
      console.info('📋 Falling back to sample data');
      loadSampleData();
    } finally {
      state.value.isLoading = false;
    }
  };

  // Initialize Google Drive public access
  const initialize = async (): Promise<boolean> => {
    try {
      state.value.isLoading = true;
      state.value.error = null;

      // Load cached metadata
      loadCachedMetadata();

      // Check if Google Drive API key is configured
      const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      if (!googleApiKey) {
        console.warn('⚠️ Google Drive credentials not found - using local fallback mode');
        console.info(
          '💡 To enable Google Drive integration, set VITE_GOOGLE_API_KEY environment variable',
        );
        state.value.isInitialized = false;
        state.value.error = 'Google Drive credentials not configured';

        // Load sample data for development
        loadSampleData();
        return false;
      }

      try {
        const publicAccess = new GoogleDrivePublicAccess(googleApiKey);
        console.log('✅ Google Drive service configured successfully');

        // Skip the general API test - go directly to folder access
        // The API key test endpoint doesn't support API-key-only access
        console.info('🔍 Testing folder access directly...');

        state.value.isInitialized = true;

        // Load issues from Google Drive
        await loadIssuesFromGoogleDrive(publicAccess);
        return true;
      } catch (accessError) {
        console.warn('Google Drive access failed, using sample data:', accessError);
        state.value.isInitialized = false;
        state.value.error =
          accessError instanceof Error ? accessError.message : 'API access failed';

        // Load sample data as fallback
        loadSampleData();
        return false;
      }
    } catch (error) {
      console.error('Google Drive initialization failed:', error);
      state.value.error = error instanceof Error ? error.message : 'Unknown error';
      state.value.isInitialized = false;

      // Load sample data as fallback
      loadSampleData();
      return false;
    } finally {
      state.value.isLoading = false;
    }
  };

  // Extract meaningful title from filename
  const extractIssueTitle = (filename: string): string => {
    // Remove .pdf extension
    const title = filename.replace(/\.pdf$/i, '');

    // Handle common patterns
    const patterns = [
      // Match: "Courier - 2025.06 - June" -> "June 2025"
      /^Courier\s*-\s*(\d{4})\.(\d{1,2})\s*-\s*(.+)$/i,
      // Match: "PICNIC 8.2025" -> "Picnic August 2025"
      /^PICNIC\s+(\d{1,2})\.(\d{4})$/i,
      // Match: "Conashaugh Winter 2022 Web" -> "Winter 2022"
      /^Conashaugh\s+(.+?)\s+(\d{4})(?:\s+Web)?$/i,
      // Match: "CL WINTER 2018 web" -> "Winter 2018"
      /^CL\s+(.+?)\s+(\d{4})(?:\s+web)?$/i,
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        if (pattern === patterns[0]) {
          // Courier format
          const [, year, , monthName] = match;
          return `${monthName} ${year}`;
        } else if (pattern === patterns[1]) {
          // Picnic format
          const [, month, year] = match;
          const monthNames = [
            '',
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ];
          const monthName = monthNames[parseInt(month!)] || month;
          return `Picnic ${monthName} ${year}`;
        } else if (pattern === patterns[2] || pattern === patterns[3]) {
          // Conashaugh or CL format
          const [, season, year] = match;
          return `${season} ${year}`;
        }
      }
    }

    // Default: return cleaned filename
    return title.replace(/[_-]/g, ' ').trim();
  };

  // Extract date from filename
  const extractDateFromFilename = (filename: string): string => {
    // Remove .pdf extension
    const name = filename.replace(/\.pdf$/i, '');

    // Try to extract date patterns
    const patterns = [
      // Match: "Courier - 2025.06 - June" -> "2025-06-01"
      /(\d{4})\.(\d{1,2})/,
      // Match: "PICNIC 8.2025" -> "2025-08-01"
      /(\d{1,2})\.(\d{4})/,
      // Match: "Winter 2022" -> "2022-12-01"
      /(Winter|WINTER).*(\d{4})/,
      // Match: "Summer 2022" -> "2022-06-01"
      /(Summer|SUMMER).*(\d{4})/,
      // Match just year "2022" -> "2022-01-01"
      /(\d{4})/,
    ];

    for (const pattern of patterns) {
      const match = name.match(pattern);
      if (match) {
        if (pattern === patterns[0]) {
          // Courier format: year.month
          const year = match[1];
          const month = match[2]?.padStart(2, '0') || '01';
          return `${year}-${month}-01`;
        } else if (pattern === patterns[1]) {
          // Picnic format: month.year
          const month = match[1]?.padStart(2, '0') || '01';
          const year = match[2];
          return `${year}-${month}-01`;
        } else if (pattern === patterns[2]) {
          // Winter
          const year = match[2];
          return `${year}-12-01`;
        } else if (pattern === patterns[3]) {
          // Summer
          const year = match[2];
          return `${year}-06-01`;
        } else if (pattern === patterns[4]) {
          // Just year
          const year = match[1];
          return `${year}-01-01`;
        }
      }
    }

    // Default: return current date if no pattern matches
    return new Date().toISOString().split('T')[0]!;
  };

  // Load thumbnail for an issue
  const loadThumbnail = async (issue: IssueWithGoogleDrive): Promise<void> => {
    if (
      state.value.thumbnails[issue.googleDriveFileId!] ||
      state.value.loadingThumbnails.has(issue.googleDriveFileId!)
    ) {
      return;
    }

    state.value.loadingThumbnails.add(issue.googleDriveFileId!);

    try {
      const pdfUrl = issue.url || issue.localUrl!;
      const thumbnail = await getThumbnail(pdfUrl);
      if (thumbnail) {
        state.value.thumbnails[issue.googleDriveFileId!] = thumbnail;
      }
    } catch (error) {
      console.warn(`Failed to load thumbnail for ${issue.filename}:`, error);
    } finally {
      state.value.loadingThumbnails.delete(issue.googleDriveFileId!);
    }
  };

  // Regenerate thumbnail for an issue
  const regenerateThumbnail = async (issue: IssueWithGoogleDrive): Promise<void> => {
    if (!issue.googleDriveFileId) return;

    // Remove existing thumbnail
    delete state.value.thumbnails[issue.googleDriveFileId];
    localStorage.removeItem(`pdf-thumbnail-${issue.googleDriveFileId}`);

    // Force reload
    state.value.loadingThumbnails.add(issue.googleDriveFileId);

    try {
      const pdfUrl = issue.url || issue.localUrl!;
      const thumbnail = await getThumbnail(pdfUrl);
      if (thumbnail) {
        state.value.thumbnails[issue.googleDriveFileId] = thumbnail;
      }
    } catch (error) {
      console.warn(`Failed to regenerate thumbnail for ${issue.filename}:`, error);
    } finally {
      state.value.loadingThumbnails.delete(issue.googleDriveFileId);
    }
  };

  // Get PDF metadata (page count, size, etc.)
  const getPdfMetadata = (issue: IssueWithGoogleDrive): unknown => {
    if (!issue.googleDriveFileId) return null;

    // Check cache first
    const cached = metadataCache.value[issue.googleDriveFileId];
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached;
    }

    try {
      // For sample data, return mock metadata
      const metadata = {
        pageCount: issue.pages,
        fileSize: 'Unknown', // Not available in IssueWithGoogleDrive type
        lastModified: issue.lastModified || issue.date,
        timestamp: Date.now(),
      };

      // Cache the metadata
      metadataCache.value[issue.googleDriveFileId] = metadata;
      saveCachedMetadata();

      return metadata;
    } catch (error) {
      console.warn(`Failed to get metadata for ${issue.filename}:`, error);
      return null;
    }
  };

  // Get file size from Google Drive
  const getFileSize = (): Promise<string> => {
    try {
      // This would need to be implemented in the Google Drive service
      // For now, return placeholder
      return Promise.resolve('Unknown');
    } catch (error) {
      console.warn('Failed to get file size:', error);
      return Promise.resolve('Unknown');
    }
  };

  // Cache management
  const loadCachedMetadata = (): void => {
    try {
      const cached = localStorage.getItem('pdf-metadata-cache');
      if (cached) {
        metadataCache.value = JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to load PDF metadata cache:', error);
    }
  };

  const saveCachedMetadata = (): void => {
    try {
      localStorage.setItem('pdf-metadata-cache', JSON.stringify(metadataCache.value));
    } catch (error) {
      console.warn('Failed to save PDF metadata cache:', error);
    }
  };

  // Get issue by ID
  const getIssueById = (id: number): IssueWithGoogleDrive | null => {
    return state.value.issues.find((issue) => issue.id === id) || null;
  };

  // Navigation helpers
  const getNextIssue = (currentId: number): IssueWithGoogleDrive | null => {
    const currentIndex = state.value.issues.findIndex((issue) => issue.id === currentId);
    if (currentIndex === -1 || currentIndex === 0) return null;
    return state.value.issues[currentIndex - 1] || null;
  };

  const getPreviousIssue = (currentId: number): IssueWithGoogleDrive | null => {
    const currentIndex = state.value.issues.findIndex((issue) => issue.id === currentId);
    if (currentIndex === -1 || currentIndex === state.value.issues.length - 1) return null;
    return state.value.issues[currentIndex + 1] || null;
  };

  const getRelatedIssues = (
    issue: IssueWithGoogleDrive,
    count: number = 3,
  ): IssueWithGoogleDrive[] => {
    const issueYear = new Date(issue.date).getFullYear();
    const related = state.value.issues
      .filter((i) => i.id !== issue.id)
      .filter((i) => Math.abs(new Date(i.date).getFullYear() - issueYear) <= 1)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count);

    return related;
  };

  // Load all thumbnails for visible issues
  const loadAllThumbnails = async (): Promise<void> => {
    const promises = state.value.issues.map((issue) => loadThumbnail(issue));
    await Promise.allSettled(promises);
  };

  return {
    // State
    state: computed(() => state.value),
    archivedIssues,
    latestIssue,
    issuesByYear,

    // Methods
    initialize,
    loadThumbnail,
    regenerateThumbnail,
    getPdfMetadata,
    getFileSize,
    getIssueById,
    getNextIssue,
    getPreviousIssue,
    getRelatedIssues,
    loadAllThumbnails,
  };
}
