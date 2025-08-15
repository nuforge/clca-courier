// src/composables/useGoogleDrivePdfs.ts
import { ref, computed } from 'vue';
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

  const estimatePagesFromSize = (bytes: number): number => {
    if (bytes === 0) return 1;
    // Rough estimate: average PDF page is about 100-200KB
    const avgPageSize = 150 * 1024; // 150KB per page
    return Math.max(1, Math.round(bytes / avgPageSize));
  };

  const generateDescriptionFromFilename = (filename: string): string => {
    const name = filename.replace(/\.pdf$/i, '');

    // Generate smart descriptions based on filename patterns
    if (name.toLowerCase().includes('picnic')) {
      return 'Special picnic edition with community event details and activities';
    } else if (name.toLowerCase().includes('winter')) {
      return 'Winter edition featuring seasonal community updates and events';
    } else if (name.toLowerCase().includes('summer')) {
      return 'Summer edition with warm weather activities and community news';
    } else if (name.toLowerCase().includes('courier')) {
      return 'Regular monthly issue with community news and updates';
    } else {
      return 'Community newsletter with local news and announcements';
    }
  };

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

  // Load local issues from public folder - this is our primary reliable source
  const loadLocalIssues = (): void => {
    try {
      const localFiles = [
        'Courier - 2025.06 - June.pdf',
        'PICNIC 8.2025.pdf',
        '7.2025.pdf',
        'CL WINTER 2018 web.pdf',
        'CL WINTER 2019 WEB.pdf',
        'CONASHAUGH SUMMER 2022 Web.pdf',
        'CONASHAUGH WINTER 2021.pdf',
        'Conashaugh Winter 2022 Web.pdf',
      ];

      const issues: IssueWithGoogleDrive[] = localFiles.map((filename, index) => {
        const title = extractIssueTitle(filename);
        const extractedDate = extractDateFromFilename(filename);
        const date = extractedDate ?? '2025-01-01';
        const pages = estimatePagesFromSize(0); // Default pages estimation
        const fileSize = 'Unknown';

        return {
          id: index + 1,
          title,
          date,
          pages,
          filename,
          localUrl: `/issues/${filename}`,
          url: `/issues/${filename}`,
          status: 'local' as const,
          syncStatus: 'synced' as const,
          fileSize,
          description: generateDescriptionFromFilename(filename),
        };
      });

      // Sort by date (newest first)
      issues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      state.value.issues = issues;
      console.log(`📁 Loaded ${issues.length} local issues successfully`);
    } catch (error) {
      console.error('Failed to load local issues:', error);
      state.value.error = 'Failed to load issues';
    }
  };

  // Initialize - start with local files, optionally enhance with Google Drive
  const initialize = (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        state.value.isLoading = true;
        state.value.error = null;

        console.log('🔄 Initializing CLCA Courier issue archive...');

        // ALWAYS load local files first - this is our reliable source
        loadLocalIssues();

        // Mark as initialized since we have local files
        state.value.isInitialized = true;

        // Optionally try to enhance with Google Drive data
        const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
        const issuesFolderId = import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID;

        if (googleApiKey && issuesFolderId) {
          console.log('☁️ Google Drive configured - attempting to enhance with cloud data...');

          try {
            // Quick timeout for Google Drive - don't let it slow us down
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 3000);

            // TODO: Implement Google Drive enhancement here if needed
            console.log(
              'ℹ️ Google Drive enhancement skipped for now - local files working perfectly',
            );
          } catch {
            console.log('ℹ️ Google Drive enhancement not available, continuing with local files');
          }
        } else {
          console.log('ℹ️ Google Drive not configured - using local files only');
        }

        resolve(true);
      } catch (error) {
        console.error('Error initializing issue archive:', error);
        state.value.error = error instanceof Error ? error.message : 'Unknown error';
        resolve(false);
      } finally {
        state.value.isLoading = false;
      }
    });
  };

  // Load thumbnail for an issue
  const loadThumbnail = async (issue: IssueWithGoogleDrive): Promise<void> => {
    const cacheKey = issue.googleDriveFileId || issue.id.toString();

    if (state.value.thumbnails[cacheKey] || state.value.loadingThumbnails.has(cacheKey)) {
      return;
    }

    state.value.loadingThumbnails.add(cacheKey);

    try {
      // Use local URL for reliable thumbnail generation
      const pdfUrl = issue.localUrl || issue.url || '';

      if (!pdfUrl) {
        console.warn(`No valid URL found for thumbnail generation: ${issue.filename}`);
        return;
      }

      console.log(`🖼️ Generating thumbnail for ${issue.filename}`);
      const thumbnail = await getThumbnail(pdfUrl);
      if (thumbnail) {
        state.value.thumbnails[cacheKey] = thumbnail;
        console.log(`✅ Thumbnail generated for ${issue.filename}`);
      } else {
        console.warn(`❌ Failed to generate thumbnail for ${issue.filename}`);
      }
    } catch (error) {
      console.warn(`Failed to load thumbnail for ${issue.filename}:`, error);
    } finally {
      state.value.loadingThumbnails.delete(cacheKey);
    }
  };

  // Regenerate thumbnail for an issue
  const regenerateThumbnail = async (issue: IssueWithGoogleDrive): Promise<void> => {
    const cacheKey = issue.googleDriveFileId || issue.id.toString();

    // Remove existing thumbnail from cache
    delete state.value.thumbnails[cacheKey];

    // Force reload
    await loadThumbnail(issue);
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

  // Dummy implementations for compatibility
  // Get PDF metadata (stub - returns minimal metadata)
  const getPdfMetadata = (issue: IssueWithGoogleDrive) => {
    return Promise.resolve({
      pageCount: issue.pages || 1,
      fileSize: issue.fileSize || 'Unknown',
      lastModified: issue.lastModified || new Date().toISOString(),
      title: issue.title,
      filename: issue.filename,
    });
  };
  const getFileSize = () => Promise.resolve('Unknown');

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
