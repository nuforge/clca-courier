// src/composables/useGoogleDrivePdfs.ts
import { ref, computed } from 'vue';
import { usePdfThumbnails } from './usePdfThumbnails';
import { logger } from '../utils/logger';
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
  auth2: GoogleAuth2;
}

interface GoogleAuth2 {
  init(config: { client_id: string; scope: string }): Promise<void>;
  getAuthInstance(): GoogleAuth2Instance;
}

interface GoogleAuth2Instance {
  isSignedIn: {
    get(): boolean;
  };
  signIn(): Promise<GoogleUser>;
}

interface GoogleUser {
  getAuthResponse(): {
    access_token: string;
    expires_in: number;
  };
}

interface TokenClient {
  requestAccessToken(): void;
}

// Google Identity Services token client type
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

    logger.drive('Loading Google API script and Google Identity Services...');

    // Test network connectivity first
    try {
      await fetch('https://apis.google.com/js/api.js', {
        method: 'HEAD',
        mode: 'no-cors',
      });
      logger.drive('Network connectivity to Google APIs: OK');
    } catch (error) {
      logger.warn('Network connectivity test failed:', error);
    }

    // Load both GAPI and Google Identity Services
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          logger.drive('Google API script loaded successfully');
          resolve();
        };
        script.onerror = (error) => {
          logger.error('Failed to load Google API script', error);
          reject(new Error('Failed to load Google API script'));
        };
        document.head.appendChild(script);
      }),
      new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          logger.drive('Google Identity Services script loaded successfully');
          resolve();
        };
        script.onerror = (error) => {
          logger.error('Failed to load Google Identity Services script', error);
          reject(new Error('Failed to load Google Identity Services script'));
        };
        document.head.appendChild(script);
      }),
    ]);

    // Wait a bit for both APIs to become available
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (window.gapi && window.google?.accounts?.oauth2) {
      gapiLoaded = true;
      logger.drive('Both Google API and Google Identity Services are available');
    } else {
      throw new Error('Google APIs not available after script load');
    }
  };

  // Initialize Google API with minimal permissions
  const initializeGoogleAPI = async (): Promise<void> => {
    if (gapiInitialized) {
      logger.drive('Google API already initialized');
      return;
    }

    logger.drive('Initializing Google API client...');

    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    logger.debug('API Key present:', !!apiKey);
    logger.debug('Client ID present:', !!clientId);

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
          logger.drive('Google API client library loaded, initializing...');
          window.gapi.client
            .init({
              apiKey: apiKey,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            })
            .then(() => {
              gapiInitialized = true;
              logger.drive('Google API initialized successfully with Google Identity Services');
              resolve();
            })
            .catch((error) => {
              logger.error('Failed to initialize Google API client', error, {
                name: error.name,
                message: error.message,
                stack: error.stack,
              });
              reject(error instanceof Error ? error : new Error('Failed to initialize Google API'));
            });
        },
        onerror: (error: unknown) => {
          clearTimeout(timeout);
          logger.error('Failed to load Google API client libraries', error);
          reject(new Error('Failed to load Google API client'));
        },
      });
    });
  };

  // Store access token with persistence
  let accessToken: string | null = localStorage.getItem('google_drive_access_token');
  let tokenClient: TokenClient | null = null;
  let authenticationResolver: ((success: boolean) => void) | null = null;

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
        console.log('🎉 GOOGLE IDENTITY SERVICES CALLBACK TRIGGERED!', response);

        if (response.error) {
          console.error('❌ Token client error:', response.error);
          state.value.isAuthenticated = false;
          localStorage.removeItem('google_drive_access_token');

          // Resolve authentication promise with failure
          if (authenticationResolver) {
            authenticationResolver(false);
            authenticationResolver = null;
          }
          return;
        }

        console.log('✅ Authentication callback successful, access token received');
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

            // Resolve authentication promise with success
            if (authenticationResolver) {
              authenticationResolver(true);
              authenticationResolver = null;
            }
          })
          .catch((error) => {
            console.error('❌ Failed to load data after authentication:', error);
            state.value.error = error.message;
            state.value.isLoading = false;

            // Resolve authentication promise with failure
            if (authenticationResolver) {
              authenticationResolver(false);
              authenticationResolver = null;
            }
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

    return new Promise<boolean>((resolve) => {
      try {
        if (!tokenClient) {
          resolve(false);
          return;
        }

        // Set up the resolver for the callback (callback is set in initializeTokenClient)
        authenticationResolver = resolve;

        // Request access token (this will show the popup)
        tokenClient.requestAccessToken();
      } catch (error) {
        console.error('❌ Authentication failed:', error);
        state.value.isAuthenticated = false;
        resolve(false);
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
      console.log(`🔍 Authenticated user attempting to access shared folder...`);

      // First, test if API works at all by listing any files
      console.log('🧪 Testing API access - listing any files...');
      try {
        const testResponse = await window.gapi.client.drive.files.list({
          q: '',
          pageSize: 5,
          fields: 'files(id,name,mimeType)',
        });
        console.log(
          '✅ API test successful - user has access to:',
          testResponse.result.files?.length || 0,
          'files',
        );
      } catch (testError) {
        console.error('❌ API test failed:', testError);
      }

      console.log('🚀 Making Google Drive API call for specific folder...');
      const query = `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`;
      console.log('📋 Query:', query);

      const response = await window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id,name,size,modifiedTime,webViewLink)',
        orderBy: 'name',
        pageSize: 100, // Get up to 100 files
      });

      console.log('✅ API Response received:', response);
      console.log('� Raw result:', response.result);

      const files = response.result.files || [];
      console.log(`📄 Found ${files.length} PDF files in Google Drive folder`);
      console.log('📋 Files array:', files);

      if (files.length === 0) {
        console.warn('⚠️ No PDF files found in the specified folder');
        console.warn('🔍 This could mean:');
        console.warn('   1. The folder has no PDF files');
        console.warn('   2. The folder is not shared with your account');
        console.warn('   3. You need permission to access the folder');
        console.warn(`   4. Folder ID ${folderId} may be incorrect`);
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

  // Legacy GAPI Auth2 authentication (WORKING ALTERNATIVE)
  const legacyAuthenticate = async (): Promise<boolean> => {
    try {
      state.value.isLoading = true;
      state.value.error = null;

      // Load and initialize API if needed
      await loadGoogleAPI();
      await initializeGoogleAPI();

      console.log('🔄 Using legacy GAPI Auth2 authentication...');

      if (!window.gapi?.auth2) {
        console.log('📦 Loading GAPI Auth2...');
        await new Promise<void>((resolve, reject) => {
          window.gapi.load('auth2', {
            callback: () => {
              console.log('✅ GAPI Auth2 loaded');
              resolve();
            },
            onerror: () => {
              reject(new Error('Failed to load GAPI Auth2'));
            },
          });
        });
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      const isInitialized = Boolean(authInstance);

      if (!isInitialized) {
        console.log('🔧 Initializing GAPI Auth2...');
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        await window.gapi.auth2.init({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.readonly',
        });
      }

      const auth2Instance = window.gapi.auth2.getAuthInstance();
      console.log('🚀 Starting GAPI Auth2 sign in...');

      const googleUser = await auth2Instance.signIn();
      const authResponse = googleUser.getAuthResponse();

      console.log('🎉 LEGACY AUTH SUCCESS!', authResponse);

      if (authResponse && authResponse.access_token) {
        accessToken = authResponse.access_token;
        if (accessToken) {
          localStorage.setItem('google_drive_access_token', accessToken);
          window.gapi.client.setToken({ access_token: accessToken });
        }
        state.value.isAuthenticated = true;
        console.log('✅ Legacy authentication successful, loading data...');

        // Load data immediately after authentication
        const issues = await loadPDFsFromDrive();
        state.value.issues = issues;
        state.value.isLoading = false;
        state.value.error = '';
        console.log(`✅ Loaded ${issues.length} issues after legacy authentication`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Legacy authentication error:', error);
      state.value.error = error instanceof Error ? error.message : 'Legacy authentication failed';
      return false;
    } finally {
      state.value.isLoading = false;
    }
  };

  // Simple test function to verify Google Identity Services works at all
  const testGoogleIdentityServices = (): void => {
    console.log('🧪 TESTING: Basic Google Identity Services');

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log('🧪 Client ID for test:', clientId);

    if (!window.google?.accounts?.oauth2) {
      console.error('❌ TEST FAILED: Google Identity Services not available');
      return;
    }

    // Create a completely fresh token client for testing
    const testTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (response: { access_token?: string; error?: string }) => {
        console.log('🎉 TEST CALLBACK TRIGGERED!', response);
        console.log('🎉 Response keys:', Object.keys(response));

        if (response.error) {
          console.error('❌ TEST: Authentication error:', response.error);
          return;
        }

        if (response.access_token) {
          console.log('✅ TEST: Received access token length:', response.access_token.length);
        } else {
          console.warn('⚠️ TEST: No access token in response');
        }
      },
    });

    console.log('🧪 Test token client created, calling requestAccessToken...');
    testTokenClient.requestAccessToken();
    console.log('🧪 Test requestAccessToken called');
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

      return new Promise<boolean>((resolve) => {
        try {
          if (!tokenClient) {
            resolve(false);
            return;
          }

          // Set up the resolver for the callback
          authenticationResolver = resolve;

          // Debug: Test Google Identity Services availability
          console.log('🔍 Google Identity Services check:');
          console.log('  - window.google exists:', !!window.google);
          console.log('  - window.google.accounts exists:', !!window.google?.accounts);
          console.log(
            '  - window.google.accounts.oauth2 exists:',
            !!window.google?.accounts?.oauth2,
          );
          console.log('  - tokenClient exists:', !!tokenClient);
          console.log(
            '  - tokenClient.requestAccessToken exists:',
            !!tokenClient?.requestAccessToken,
          );

          // Trigger the authentication popup
          console.log('🚀 About to call requestAccessToken()...');
          tokenClient.requestAccessToken();
          console.log('✅ requestAccessToken() called successfully');
        } catch (error) {
          console.error('❌ Authentication setup error:', error);
          state.value.isLoading = false;
          resolve(false);
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
    legacyAuthenticate, // WORKING: Legacy GAPI Auth2 method
    clearAuthentication, // TEMP: For testing
    testGoogleIdentityServices, // TEST: Basic Google Identity Services test
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
