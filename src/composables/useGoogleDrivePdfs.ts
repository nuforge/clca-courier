// src/composables/useGoogleDrivePdfs.ts
import { ref, computed } from 'vue';
import { usePdfThumbnails } from './usePdfThumbnails';
import type { IssueWithGoogleDrive } from '../types/google-drive-content';

// Google API type definitions
interface GapiClient {
  init(config: { apiKey: string; discoveryDocs: string[] }): Promise<void>;
  drive: {
    files: {
      list(params: { q: string; fields: string; orderBy?: string; pageSize?: number }): Promise<{
        result: {
          files: GoogleDriveFile[];
        };
      }>;
    };
  };
  setToken(token: { access_token: string }): void;
}

interface Gapi {
  load(libraries: string, config: { callback: () => void; onerror: () => void }): void;
  client: GapiClient;
}

// Google Identity Services token client type
interface TokenClient {
  requestAccessToken(): void;
  callback?: (response: { access_token: string; error?: string }) => void;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  size?: number;
  modifiedTime?: string;
  webViewLink?: string;
}

declare global {
  interface Window {
    gapi: Gapi;
    google: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string; error?: string }) => void;
          }): {
            requestAccessToken(): void;
          };
        };
      };
    };
  }
}

interface GoogleDrivePdfState {
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  error: string | null;
  issues: IssueWithGoogleDrive[];
  thumbnails: Record<string, string>;
  loadingThumbnails: Set<string>;
}

// Google API globals
let gapiLoaded = false;
let gapiInitialized = false;

export function useGoogleDrivePdfs() {
  // State management
  const state = ref<GoogleDrivePdfState>({
    isLoading: false,
    isInitialized: false,
    isAuthenticated: false,
    error: null,
    issues: [],
    thumbnails: {},
    loadingThumbnails: new Set(),
  });

  // Thumbnail management
  const { getThumbnail } = usePdfThumbnails();

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

  // Load Google API script and Google Identity Services
  const loadGoogleAPI = async (): Promise<void> => {
    if (gapiLoaded) return;

    console.log('📡 Loading Google API script and Google Identity Services...');

    // Test network connectivity first
    try {
      await fetch('https://apis.google.com/js/api.js', {
        method: 'HEAD',
        mode: 'no-cors',
      });
      console.log('🌐 Network connectivity to Google APIs: OK');
    } catch (error) {
      console.warn('⚠️ Network connectivity test failed:', error);
    }

    // Load both GAPI and Google Identity Services
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          console.log('✅ Google API script loaded successfully');
          resolve();
        };
        script.onerror = (error) => {
          console.error('❌ Failed to load Google API script:', error);
          reject(new Error('Failed to load Google API script'));
        };
        document.head.appendChild(script);
      }),
      new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          console.log('✅ Google Identity Services script loaded successfully');
          resolve();
        };
        script.onerror = (error) => {
          console.error('❌ Failed to load Google Identity Services script:', error);
          reject(new Error('Failed to load Google Identity Services script'));
        };
        document.head.appendChild(script);
      }),
    ]);

    // Wait a bit for both APIs to become available
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (window.gapi && window.google?.accounts?.oauth2) {
      gapiLoaded = true;
      console.log('✅ Both Google API and Google Identity Services are available');
    } else {
      throw new Error('Google APIs not available after script load');
    }
  };

  // Initialize Google API with minimal permissions
  const initializeGoogleAPI = async (): Promise<void> => {
    if (gapiInitialized) {
      console.log('✅ Google API already initialized');
      return;
    }

    console.log('🔧 Initializing Google API client...');

    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    console.log('🔑 API Key present:', !!apiKey);
    console.log('🆔 Client ID present:', !!clientId);

    if (!apiKey || !clientId) {
      throw new Error('Google API credentials not configured');
    }

    // Ensure gapi is available
    if (!window.gapi) {
      throw new Error('Google API script not loaded');
    }

    console.log('📚 Loading Google API client libraries...');

    await new Promise<void>((resolve, reject) => {
      // Set a timeout for the gapi.load operation
      const timeout = setTimeout(() => {
        reject(new Error('Timeout: Google API client libraries failed to load within 10 seconds'));
      }, 10000);

      window.gapi.load('client', {
        callback: () => {
          clearTimeout(timeout);
          console.log('📦 Google API client library loaded, initializing...');
          window.gapi.client
            .init({
              apiKey: apiKey,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            })
            .then(() => {
              gapiInitialized = true;
              console.log('✅ Google API initialized successfully with Google Identity Services');
              resolve();
            })
            .catch((error) => {
              console.error('❌ Failed to initialize Google API client:', error);
              console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
              });
              reject(error instanceof Error ? error : new Error('Failed to initialize Google API'));
            });
        },
        onerror: (error: unknown) => {
          clearTimeout(timeout);
          console.error('❌ Failed to load Google API client libraries:', error);
          reject(new Error('Failed to load Google API client'));
        },
      });
    });
  };

  // Store access token with persistence
  let accessToken: string | null = localStorage.getItem('google_drive_access_token');
  let tokenClient: TokenClient | null = null;

  // Initialize token client for Google Identity Services
  const initializeTokenClient = (): void => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!window.google?.accounts?.oauth2) {
      throw new Error('Google Identity Services not loaded');
    }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (response: { access_token: string; error?: string }) => {
        if (response.error) {
          console.error('❌ Token client error:', response.error);
          state.value.isAuthenticated = false;
          localStorage.removeItem('google_drive_access_token');
          return;
        }

        accessToken = response.access_token;
        localStorage.setItem('google_drive_access_token', accessToken);
        window.gapi.client.setToken({ access_token: accessToken });
        state.value.isAuthenticated = true;
        console.log('✅ Successfully authenticated with Google Identity Services');

        // Automatically load data after successful authentication
        console.log('🔄 Loading data after authentication...');
        loadPDFsFromDrive()
          .then((issues) => {
            state.value.issues = issues;
            state.value.isLoading = false;
            state.value.error = '';
            console.log('✅ Data loaded successfully after authentication');
          })
          .catch((error) => {
            console.error('❌ Failed to load data after authentication:', error);
            state.value.error = error.message;
            state.value.isLoading = false;
          });
      },
    });
  };

  // Check if already authenticated (NO POPUP)
  const checkAuthentication = (): boolean => {
    console.log('🔍 Checking authentication...');
    console.log('🔍 Access token from storage:', accessToken ? '***exists***' : 'null');
    console.log('🔍 GAPI client available:', !!window.gapi?.client);

    if (accessToken) {
      // Set the token on the gapi client if we have one
      try {
        if (!window.gapi?.client) {
          console.warn('⚠️ GAPI client not available yet, cannot set token');
          return false;
        }

        window.gapi.client.setToken({ access_token: accessToken });
        console.log('✅ Already authenticated with valid token');
        state.value.isAuthenticated = true;
        return true;
      } catch (error) {
        console.warn('⚠️ Failed to set token on gapi client:', error);
        // Clear invalid token
        accessToken = null;
        localStorage.removeItem('google_drive_access_token');
      }
    }

    console.log('ℹ️ Not authenticated');
    state.value.isAuthenticated = false;
    return false;
  };

  // Authenticate ONLY when needed (with popup)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const authenticateIfNeeded = async (): Promise<boolean> => {
    // First check if we're already authenticated
    const alreadyAuthenticated = checkAuthentication();
    if (alreadyAuthenticated) {
      return true;
    }

    // Initialize token client if not done yet
    if (!tokenClient) {
      initializeTokenClient();
    }

    // Only show popup if we're not authenticated
    console.log('🔐 Authentication required - showing popup...');

    return new Promise<boolean>((resolve, reject) => {
      try {
        if (!tokenClient) {
          reject(new Error('Token client not initialized'));
          return;
        }

        // Update the callback to resolve the promise
        const originalCallback = tokenClient.callback;
        tokenClient.callback = (response: { access_token: string; error?: string }) => {
          // Call the original callback first if it exists
          if (originalCallback) {
            originalCallback(response);
          }

          if (response.error) {
            reject(new Error(`Authentication failed: ${response.error}`));
          } else {
            resolve(true);
          }
        };

        // Request access token (this will show the popup)
        tokenClient.requestAccessToken();
      } catch (error) {
        console.error('❌ Authentication failed:', error);
        state.value.isAuthenticated = false;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reject(new Error(`Authentication failed: ${errorMessage}`));
      }
    });
  };

  // Parse issue metadata from filename
  const parseIssueFromFile = (file: GoogleDriveFile, index: number): IssueWithGoogleDrive => {
    const name = file.name;

    // Extract year and issue number from various filename patterns
    let year = new Date().getFullYear();
    let month = 1;
    let title = name.replace('.pdf', '').replace(/[_-]/g, ' ');

    // Try various patterns
    const patterns = [
      // "Courier - 2025.06 - June.pdf"
      /Courier.*?(\d{4})\.(\d{1,2}).*?([A-Za-z]+)/i,
      // "PICNIC 8.2025.pdf"
      /PICNIC\s+(\d{1,2})\.(\d{4})/i,
      // "CL WINTER 2018 web.pdf"
      /CL\s+(\w+)\s+(\d{4})/i,
      // "Conashaugh Winter 2022 Web.pdf"
      /Conashaugh\s+(\w+)\s+(\d{4})/i,
      // Basic year pattern
      /(\d{4})/,
    ];

    for (const pattern of patterns) {
      const match = name.match(pattern);
      if (match) {
        if (pattern.source.includes('Courier')) {
          year = match[1] ? parseInt(match[1]) : year;
          month = match[2] ? parseInt(match[2]) : month;
          title = `${match[3]} ${year}`;
        } else if (pattern.source.includes('PICNIC')) {
          month = match[1] ? parseInt(match[1]) : month;
          year = match[2] ? parseInt(match[2]) : year;
          title = `Picnic ${getMonthName(month)} ${year}`;
        } else if (pattern.source.includes('CL|Conashaugh')) {
          const season = match[1];
          year = match[2] ? parseInt(match[2]) : year;
          title = `${season} ${year}`;
        } else {
          year = match[1] ? parseInt(match[1]) : year;
        }
        break;
      }
    }

    // Generate a consistent ID
    const id = year * 1000 + month * 10 + (index % 10);

    return {
      id,
      title,
      filename: name,
      date:
        new Date(year, month - 1, 1).toISOString().split('T')[0] ||
        `${year}-${String(month).padStart(2, '0')}-01`,
      googleDriveFileId: file.id,
      googleDriveUrl: `https://drive.google.com/file/d/${file.id}/view`,
      url: `https://drive.google.com/uc?export=view&id=${file.id}`,
      fileSize: file.size ? `${Math.round((file.size / 1024 / 1024) * 100) / 100} MB` : 'Unknown',
      lastModified: file.modifiedTime || new Date().toISOString(),
      pages: Math.max(1, Math.floor((file.size || 500000) / 150000)), // Rough estimate
      status: 'google-drive',
      syncStatus: 'synced',
    };
  };

  // Helper function to get month name
  const getMonthName = (month: number): string => {
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
    return monthNames[month] || `Month ${month}`;
  };

  // Load PDFs from Google Drive folder
  const loadPDFsFromDrive = async (): Promise<IssueWithGoogleDrive[]> => {
    const folderId = import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID;

    if (!folderId) {
      throw new Error('Google Drive folder ID not configured (VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID)');
    }

    try {
      console.log(`📁 Loading PDFs from folder: ${folderId}`);

      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
        fields: 'files(id,name,size,modifiedTime,webViewLink)',
        orderBy: 'name',
        pageSize: 100, // Get up to 100 files
      });

      const files = response.result.files || [];
      console.log(`📄 Found ${files.length} PDF files in Google Drive folder`);

      if (files.length === 0) {
        console.warn('⚠️ No PDF files found in the specified folder');
        return [];
      }

      const issues: IssueWithGoogleDrive[] = files.map((file: GoogleDriveFile, index: number) =>
        parseIssueFromFile(file, index),
      );

      // Sort by date (newest first)
      return issues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('❌ Failed to load PDFs from Google Drive:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load PDFs: ${errorMessage}`);
    }
  };

  // Main initialization function - NO POPUP, just checks auth
  const initialize = async (): Promise<boolean> => {
    try {
      state.value.isLoading = true;
      state.value.error = null;

      console.log('🔄 Initializing Google Drive PDF loader...');

      // 1. Load Google API (if not already loaded)
      await loadGoogleAPI();

      // 2. Initialize Google API (if not already initialized)
      await initializeGoogleAPI();

      // 3. Initialize Google Identity Services token client
      if (!tokenClient) {
        initializeTokenClient();
        console.log('✅ Google Identity Services token client initialized');
      }

      // 4. Check authentication (NO POPUP YET)
      const isAuthenticated = checkAuthentication();

      if (!isAuthenticated) {
        // Set a specific error that the UI can handle
        state.value.error = 'AUTHENTICATION_REQUIRED';
        state.value.isInitialized = true;
        return false;
      }

      // 5. Load PDFs from Google Drive
      const issues = await loadPDFsFromDrive();
      state.value.issues = issues;
      state.value.isInitialized = true;

      console.log(`✅ Successfully loaded ${issues.length} issues from Google Drive`);

      if (issues.length === 0) {
        state.value.error = 'No PDF issues found in Google Drive folder';
      }

      return true;
    } catch (error) {
      console.error('❌ Error initializing Google Drive PDF loader:', error);
      state.value.error = error instanceof Error ? error.message : 'Unknown error';
      state.value.isInitialized = true;
      return false;
    } finally {
      state.value.isLoading = false;
    }
  };

  // Separate authentication function (called by user action)
  const authenticate = async (): Promise<boolean> => {
    try {
      state.value.isLoading = true;
      state.value.error = null;

      // Load and initialize API if needed
      await loadGoogleAPI();
      await initializeGoogleAPI();

      // Initialize token client if needed
      if (!tokenClient) {
        initializeTokenClient();
      }

      // Force authentication popup (don't check if already authenticated)
      console.log('🔐 Forcing authentication popup...');

      return new Promise<boolean>((resolve, reject) => {
        try {
          if (!tokenClient) {
            reject(new Error('Token client not initialized'));
            return;
          }

          // Set up callback to resolve promise
          tokenClient.callback = (response: { access_token: string; error?: string }) => {
            if (response.error) {
              console.error('❌ Authentication error:', response.error);
              state.value.isAuthenticated = false;
              state.value.isLoading = false;
              localStorage.removeItem('google_drive_access_token');
              reject(new Error(`Authentication failed: ${response.error}`));
              return;
            }

            // Success - save token and update state
            accessToken = response.access_token;
            localStorage.setItem('google_drive_access_token', accessToken);
            window.gapi.client.setToken({ access_token: accessToken });
            state.value.isAuthenticated = true;
            console.log('✅ Authentication successful, loading data...');

            // Load data immediately after authentication
            loadPDFsFromDrive()
              .then((issues) => {
                state.value.issues = issues;
                state.value.isLoading = false;
                state.value.error = '';
                console.log(`✅ Loaded ${issues.length} issues after authentication`);
                resolve(true);
              })
              .catch((error) => {
                console.error('❌ Failed to load data after authentication:', error);
                state.value.error = error.message;
                state.value.isLoading = false;
                resolve(false);
              });
          };

          // Trigger the authentication popup
          tokenClient.requestAccessToken();
        } catch (error) {
          console.error('❌ Authentication setup error:', error);
          state.value.isLoading = false;
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    } catch (error) {
      console.error('❌ Authentication error:', error);
      state.value.error = error instanceof Error ? error.message : 'Authentication failed';
      return false;
    } finally {
      state.value.isLoading = false;
    }
  };

  // Load thumbnail for an issue
  const loadThumbnail = async (issue: IssueWithGoogleDrive): Promise<void> => {
    const cacheKey = issue.googleDriveFileId || issue.id.toString();

    if (state.value.thumbnails[cacheKey] || state.value.loadingThumbnails.has(cacheKey)) {
      return;
    }

    state.value.loadingThumbnails.add(cacheKey);

    try {
      const pdfUrl = issue.url || issue.googleDriveUrl;
      if (!pdfUrl) {
        console.warn(`No valid URL found for thumbnail: ${issue.filename}`);
        return;
      }

      console.log(`🖼️ Generating thumbnail for ${issue.filename}`);
      const thumbnail = await getThumbnail(pdfUrl);
      if (thumbnail) {
        state.value.thumbnails[cacheKey] = thumbnail;
        console.log(`✅ Thumbnail generated for ${issue.filename}`);
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
    delete state.value.thumbnails[cacheKey];
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

  // Metadata helper
  const getPdfMetadata = (
    issue: IssueWithGoogleDrive,
  ): Promise<{
    pageCount: number;
    fileSize: string;
    lastModified: string;
    title: string;
    filename: string;
  }> => {
    return Promise.resolve({
      pageCount: issue.pages || 1,
      fileSize: issue.fileSize || 'Unknown',
      lastModified: issue.lastModified || new Date().toISOString(),
      title: issue.title,
      filename: issue.filename,
    });
  };

  // Clear stored authentication (for testing)
  const clearAuthentication = (): void => {
    accessToken = null;
    localStorage.removeItem('google_drive_access_token');
    state.value.isAuthenticated = false;
    console.log('🧹 Authentication cleared');
  };

  const getFileSize = (): Promise<string> => Promise.resolve('Unknown');

  return {
    // State
    state: computed(() => state.value),
    archivedIssues,
    latestIssue,
    issuesByYear,

    // Methods
    initialize,
    authenticate, // NEW: Separate authentication method
    clearAuthentication, // TEMP: For testing
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
