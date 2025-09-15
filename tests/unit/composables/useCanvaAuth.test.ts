/**
 * Canva OAuth Authentication Composable Tests
 *
 * Following established CLCA Courier testing methodology patterns
 * Based on proven testing patterns from existing composable tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock logger using established patterns
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

// Mock Quasar notify using established patterns
const mockQuasar = vi.hoisted(() => ({
  notify: vi.fn(),
  dialog: vi.fn()
}));

// Mock Vue Router using established patterns
const mockRouter = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn()
}));

// Mock useI18n using established patterns
const mockI18n = vi.hoisted(() => ({
  t: vi.fn((key: string) => `translated_${key}`)
}));

// Mock Firebase auth state
const mockFirebaseAuth = vi.hoisted(() => ({
  currentUser: {
    value: {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User'
    } as {
      uid: string;
      email: string;
      displayName: string;
    } | null
  }
}));

// Mock global crypto
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: mockCrypto.getRandomValues,
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
});

// Mock Canva API Service
const mockCanvaApiService = vi.hoisted(() => ({
  getConfig: vi.fn(() => ({
    apiBaseUrl: 'https://api.canva.com/rest/v1',
    appId: 'test-app-id',
    redirectUri: 'https://test.com/canva/callback'
  }))
}));

// Mock localStorage
const mockLocalStorage = vi.hoisted(() => {
  const storage: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    })
  };
});

// Mock crypto.getRandomValues
const mockCrypto = vi.hoisted(() => ({
  getRandomValues: vi.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  })
}));

// Mock fetch API
const mockFetch = vi.hoisted(() => vi.fn());

// Apply mocks using proven methodology
vi.mock('../../../src/utils/logger', () => ({ logger: mockLogger }));
vi.mock('quasar', () => ({ useQuasar: () => mockQuasar }));
vi.mock('vue-router', () => ({ useRouter: () => mockRouter }));
vi.mock('vue-i18n', () => ({ useI18n: () => mockI18n }));
vi.mock('../../../src/composables/useFirebase', () => ({
  useFirebase: () => ({ auth: mockFirebaseAuth })
}));
vi.mock('../../../src/services/canva-api.service', () => ({
  canvaApiService: mockCanvaApiService
}));

// Global mocks
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(global, 'crypto', { value: mockCrypto });
Object.defineProperty(global, 'fetch', { value: mockFetch });

describe('useCanvaAuth', () => {
  let useCanvaAuth: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockLocalStorage.clear();

    // Reset mocks using established patterns
    mockQuasar.notify.mockReset();
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    mockLogger.info.mockReset();
    mockLogger.error.mockReset();
    mockLogger.success.mockReset();

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        search: '',
        pathname: '/canva/callback'
      },
      writable: true
    });

    // Import composable
    const module = await import('../../../src/composables/useCanvaAuth');
    useCanvaAuth = module.useCanvaAuth;
  });

  describe('Composable Initialization', () => {
    it('should initialize with correct default state', () => {
      const { isAuthenticated, isLoading, hasValidTokens } = useCanvaAuth();

      expect(isAuthenticated.value).toBe(false);
      expect(isLoading.value).toBe(false);
      expect(hasValidTokens.value).toBe(false);
    });

    it('should restore tokens from localStorage if user is authenticated', () => {
      const mockTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000, // 1 hour from now
        scope: 'design:write design:read'
      };

      mockLocalStorage.setItem(
        'clca_canva_tokens_test-user-123',
        JSON.stringify({
          ...mockTokens,
          storedAt: Date.now(),
          userId: 'test-user-123'
        })
      );

      const { isAuthenticated, hasValidTokens } = useCanvaAuth();

      expect(isAuthenticated.value).toBe(true);
      expect(hasValidTokens.value).toBe(true);
    });

    it('should not restore expired tokens', () => {
      const expiredTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() - 3600000, // 1 hour ago (expired)
        scope: 'design:write design:read',
        storedAt: Date.now() - 7200000,
        userId: 'test-user-123'
      };

      mockLocalStorage.setItem(
        'clca_canva_tokens_test-user-123',
        JSON.stringify(expiredTokens)
      );

      const { isAuthenticated, hasValidTokens } = useCanvaAuth();

      expect(isAuthenticated.value).toBe(false);
      expect(hasValidTokens.value).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('clca_canva_tokens_test-user-123');
    });
  });

  describe('OAuth Initiation', () => {
    it('should initiate OAuth flow successfully', async () => {
      const { initiateOAuth } = useCanvaAuth();

      await initiateOAuth();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Initiating Canva OAuth flow',
        expect.objectContaining({
          redirectUri: 'https://test.com/canva/callback'
        })
      );

      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'info',
        message: 'translated_canva.connectingToCanva',
        position: 'top',
        timeout: 3000
      });

      // Check that state was stored
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'clca_canva_auth_state_test-user-123',
        expect.any(String)
      );

      // Check that window.location.href was set to Canva auth URL
      expect(window.location.href).toContain('https://www.canva.com/api/oauth/authorize');
      expect(window.location.href).toContain('client_id=test-app-id');
      expect(window.location.href).toContain('redirect_uri=https%3A%2F%2Ftest.com%2Fcanva%2Fcallback');
    });

    it('should fail if user is not authenticated', async () => {
      mockFirebaseAuth.currentUser.value = null;

      const { initiateOAuth } = useCanvaAuth();

      await initiateOAuth();

      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'negative',
        message: 'translated_canva.authRequired',
        position: 'top',
        timeout: 5000
      });

      expect(window.location.href).toBe('');
    });

    it('should handle OAuth initiation errors', async () => {
      mockCanvaApiService.getConfig.mockImplementation(() => {
        throw new Error('Configuration error');
      });

      const { initiateOAuth } = useCanvaAuth();

      await initiateOAuth();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initiate Canva OAuth:',
        expect.any(Error)
      );

      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'negative',
        message: 'translated_canva.authFailed',
        position: 'top',
        timeout: 5000
      });
    });
  });

  describe('OAuth Callback Handling', () => {
    beforeEach(() => {
      // Set up successful token exchange response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          scope: 'design:write design:read'
        })
      });

      // Set up valid OAuth state
      mockLocalStorage.setItem('clca_canva_auth_state_test-user-123', 'valid-state');

      // Mock URL parameters
      Object.defineProperty(window, 'location', {
        value: {
          search: '?code=auth-code-123&state=valid-state',
          pathname: '/canva/callback'
        },
        writable: true
      });
    });

    it('should handle OAuth callback successfully', async () => {
      const { handleOAuthRedirect, isAuthenticated } = useCanvaAuth();

      await handleOAuthRedirect();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.canva.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        })
      );

      expect(isAuthenticated.value).toBe(true);

      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'positive',
        message: 'translated_canva.connectedToCanva',
        position: 'top',
        timeout: 3000
      });

      expect(mockLogger.success).toHaveBeenCalledWith(
        'Canva OAuth authentication completed successfully'
      );
    });

    it('should handle OAuth error responses', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '?error=access_denied&error_description=User%20denied%20access',
          pathname: '/canva/callback'
        },
        writable: true
      });

      const { handleOAuthRedirect } = useCanvaAuth();

      await handleOAuthRedirect();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'OAuth error received:',
        'access_denied'
      );

      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'negative',
        message: 'translated_canva.authFailed',
        position: 'top',
        timeout: 5000
      });
    });

    it('should validate state parameter to prevent CSRF', async () => {
      mockLocalStorage.setItem('clca_canva_auth_state_test-user-123', 'different-state');

      const { handleOAuthRedirect } = useCanvaAuth();

      await handleOAuthRedirect();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'OAuth state mismatch - possible CSRF attack'
      );

      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'negative',
        message: 'translated_canva.authFailed',
        position: 'top',
        timeout: 5000
      });
    });

    it('should handle token exchange failures', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Invalid authorization code')
      });

      const { handleOAuthRedirect } = useCanvaAuth();

      await handleOAuthRedirect();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Token exchange failed:',
        expect.objectContaining({
          status: 400,
          error: 'Invalid authorization code'
        })
      );
    });
  });

  describe('Token Management', () => {
    it('should store tokens securely with user scope', () => {
      const { initialize } = useCanvaAuth();
      const mockTokens = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: Date.now() + 3600000,
        scope: 'design:write'
      };

      // Simulate successful token storage
      mockLocalStorage.setItem(
        'clca_canva_tokens_test-user-123',
        JSON.stringify({
          ...mockTokens,
          storedAt: Date.now(),
          userId: 'test-user-123'
        })
      );

      initialize();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'clca_canva_tokens_test-user-123',
        expect.stringContaining('test-token')
      );
    });

    it('should provide access token for API calls', () => {
      const mockTokens = {
        accessToken: 'api-access-token',
        refreshToken: 'api-refresh-token',
        expiresAt: Date.now() + 3600000,
        scope: 'design:write'
      };

      mockLocalStorage.setItem(
        'clca_canva_tokens_test-user-123',
        JSON.stringify({
          ...mockTokens,
          storedAt: Date.now(),
          userId: 'test-user-123'
        })
      );

      const { getAccessToken } = useCanvaAuth();

      expect(getAccessToken()).toBe('api-access-token');
    });

    it('should return null access token when not authenticated', () => {
      const { getAccessToken } = useCanvaAuth();

      expect(getAccessToken()).toBeNull();
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully and clear tokens', () => {
      // Set up authenticated state
      mockLocalStorage.setItem('clca_canva_tokens_test-user-123', JSON.stringify({
        accessToken: 'token-to-clear',
        userId: 'test-user-123'
      }));

      const { signOut, isAuthenticated } = useCanvaAuth();

      signOut();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('clca_canva_tokens_test-user-123');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('clca_canva_auth_state_test-user-123');

      expect(isAuthenticated.value).toBe(false);

      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'positive',
        message: 'translated_canva.signOutSuccess',
        position: 'top',
        timeout: 2000
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Signed out from Canva successfully');
    });

    it('should handle sign out errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { signOut } = useCanvaAuth();

      signOut();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to sign out from Canva:',
        expect.any(Error)
      );

      expect(mockQuasar.notify).toHaveBeenCalledWith({
        type: 'negative',
        message: 'translated_common.error',
        position: 'top',
        timeout: 3000
      });
    });
  });

  describe('Security Features', () => {
    it('should generate secure random state for CSRF protection', () => {
      const { initiateOAuth } = useCanvaAuth();

      void initiateOAuth();

      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'clca_canva_auth_state_test-user-123',
        expect.stringMatching(/^[a-f0-9]{64}$/) // 32 bytes as hex = 64 chars
      );
    });

    it('should prevent token access without authentication', () => {
      mockFirebaseAuth.currentUser.value = null;

      const { getAccessToken } = useCanvaAuth();

      expect(getAccessToken()).toBeNull();
    });

    it('should clear tokens for different user', () => {
      // Store tokens for different user
      mockLocalStorage.setItem(
        'clca_canva_tokens_test-user-123',
        JSON.stringify({
          accessToken: 'other-user-token',
          userId: 'other-user-456'
        })
      );

      const { initialize, isAuthenticated } = useCanvaAuth();

      initialize();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('clca_canva_tokens_test-user-123');
      expect(isAuthenticated.value).toBe(false);
    });
  });
});
