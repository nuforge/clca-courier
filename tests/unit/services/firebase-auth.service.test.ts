import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from 'vitest';

// Use vi.hoisted to ensure Firebase Auth provider mocks are created before any imports
const {
  mockGoogleAuthProvider,
  mockFacebookAuthProvider,
  mockGithubAuthProvider,
  mockTwitterAuthProvider,
  mockSignInWithPopup,
  mockSignInWithRedirect,
  mockGetRedirectResult,
  mockSignOut,
  mockOnAuthStateChanged
} = vi.hoisted(() => {
  return {
    mockGoogleAuthProvider: vi.fn(() => ({
      addScope: vi.fn().mockReturnThis(),
      setCustomParameters: vi.fn().mockReturnThis(),
      providerId: 'google.com'
    })),
    mockFacebookAuthProvider: vi.fn(() => ({
      addScope: vi.fn().mockReturnThis(),
      setCustomParameters: vi.fn().mockReturnThis(),
      providerId: 'facebook.com'
    })),
    mockGithubAuthProvider: vi.fn(() => ({
      addScope: vi.fn().mockReturnThis(),
      setCustomParameters: vi.fn().mockReturnThis(),
      providerId: 'github.com'
    })),
    mockTwitterAuthProvider: vi.fn(() => ({
      setCustomParameters: vi.fn().mockReturnThis(),
      providerId: 'twitter.com'
    })),
    mockSignInWithPopup: vi.fn(),
    mockSignInWithRedirect: vi.fn(),
    mockGetRedirectResult: vi.fn(),
    mockSignOut: vi.fn(),
    mockOnAuthStateChanged: vi.fn()
  };
});

// Mock Firebase Auth using the hoisted providers
vi.mock('firebase/auth', () => ({
  signInWithPopup: mockSignInWithPopup,
  signInWithRedirect: mockSignInWithRedirect,
  getRedirectResult: mockGetRedirectResult,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  GoogleAuthProvider: mockGoogleAuthProvider,
  FacebookAuthProvider: mockFacebookAuthProvider,
  GithubAuthProvider: mockGithubAuthProvider,
  TwitterAuthProvider: mockTwitterAuthProvider
}));

// Import Firebase types after mock setup
import type { User, UserCredential, AuthProvider } from 'firebase/auth';

// Mock logger utility - essential for production-ready service
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn()
  }
}));

// Mock Firebase config
vi.mock('../../../src/config/firebase.config', () => ({
  firebaseAuth: {
    currentUser: null,
    app: {
      options: {
        authDomain: 'test-project.firebaseapp.com'
      }
    }
  }
}));

// Mock global fetch for avatar caching
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock FileReader for data URL conversion
const mockFileReader = {
  readAsDataURL: vi.fn().mockImplementation(function(this: any, blob: Blob) {
    // Simulate async FileReader behavior - call onloadend after readAsDataURL
    setTimeout(() => {
      if (this.onloadend) {
        this.onloadend.call(this, {} as ProgressEvent<FileReader>);
      }
    }, 0);
  }),
  onloadend: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
  result: 'data:image/jpeg;base64,mockImageData'
};

global.FileReader = vi.fn().mockImplementation(() => mockFileReader) as any;

// Mock window.open for popup blocker detection
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true
});

// Import service after mocks are set up - use the singleton again but ensure mocks work
import { firebaseAuthService, type FirebaseAuthUser, type AuthState } from '../../../src/services/firebase-auth.service';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { firebaseAuth } from '../../../src/config/firebase.config';

// Get mocked functions - use the hoisted mocks directly
const mockFirebaseAuth = vi.mocked(firebaseAuth);

describe('Firebase Authentication Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset auth state
    (mockFirebaseAuth as any).currentUser = null;

    // Reset FileReader mock
    mockFileReader.readAsDataURL.mockClear();
    mockFileReader.onloadend = null;

    // Reset window.open mock
    mockWindowOpen.mockClear();

    // Reset fetch mock
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Provider Management', () => {
    it('should create Google provider with correct scopes', () => {
      const service = firebaseAuthService as any;
      const provider = service.getProvider('google');

      expect(provider).toBeDefined();
      expect(provider.addScope).toHaveBeenCalledWith('email');
      expect(provider.addScope).toHaveBeenCalledWith('profile');
    });

    it('should create Facebook provider with email scope', () => {
      const service = firebaseAuthService as any;

      // Check if this test has the same issue as others
      console.log('About to call getProvider for facebook');
      const provider = service.getProvider('facebook');
      console.log('Facebook provider created:', provider);

      expect(provider).toBeDefined();
      expect(provider.addScope).toHaveBeenCalledWith('email');
    });

    it('should create GitHub provider with user:email scope', () => {
      const service = firebaseAuthService as any;
      const provider = service.getProvider('github');

      expect(provider).toBeDefined();
      expect(provider.addScope).toHaveBeenCalledWith('user:email');
    });

    it('should create Twitter provider without additional scopes', () => {
      const service = firebaseAuthService as any;
      const provider = service.getProvider('twitter');

      expect(provider).toBeDefined();
    });

    it('should throw error for unsupported provider', () => {
      const service = firebaseAuthService as any;

      expect(() => {
        service.getProvider('unsupported' as any);
      }).toThrow('Unsupported provider: unsupported');
    });
  });

  describe('Authentication Flow - Popup', () => {
    it('should successfully sign in with popup', async () => {
      const mockUser: Partial<User> = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        emailVerified: true,
        isAnonymous: false,
        metadata: {
          creationTime: '2024-01-01T00:00:00.000Z',
          lastSignInTime: '2024-01-01T00:00:00.000Z'
        },
        providerData: []
      };

      const mockCredential: UserCredential = {
        user: mockUser as User,
        providerId: 'google.com',
        operationType: 'signIn'
      };

      // Mock successful popup
      mockWindowOpen.mockReturnValue({ close: vi.fn() });
      mockSignInWithPopup.mockResolvedValue(mockCredential);

      const result = await firebaseAuthService.signInWithPopup('google');

      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(result).toEqual(mockCredential);
    });

    it('should detect popup blocker and show warning', async () => {
      const { logger } = await import('../../../src/utils/logger');

      // Mock popup blocked (window.open returns null)
      mockWindowOpen.mockReturnValue(null);
      mockSignInWithPopup.mockResolvedValue({} as UserCredential);

      await firebaseAuthService.signInWithPopup('google');

      expect(logger.warn).toHaveBeenCalledWith('⚠️ Popup blocked by browser - this will cause auth to fail');
    });

    it('should auto-fallback to redirect when popup blocked', async () => {
      const mockError = new Error('Popup blocked') as any;
      mockError.code = 'auth/popup-blocked';

      mockWindowOpen.mockReturnValue({ close: vi.fn() });
      mockSignInWithPopup.mockRejectedValue(mockError);
      (mockSignInWithRedirect as any).mockResolvedValue(undefined);

      // Start the popup sign-in which should fallback to redirect
      const promise = firebaseAuthService.signInWithPopup('google');

      // Wait a bit for the async fallback to trigger
      await new Promise(resolve => setTimeout(resolve, 10));

      // The redirect should have been called as fallback
      expect(mockSignInWithRedirect).toHaveBeenCalled();

      // The promise should be pending (never resolves due to redirect)
      // We don't await it since the service returns a never-resolving promise for redirect
    });

    it('should handle popup closed by user', async () => {
      const mockError = new Error('Popup closed') as any;
      mockError.code = 'auth/popup-closed-by-user';

      mockWindowOpen.mockReturnValue({ close: vi.fn() });
      mockSignInWithPopup.mockRejectedValue(mockError);

      await expect(firebaseAuthService.signInWithPopup('google')).rejects.toThrow('Popup closed');

      const authState = firebaseAuthService.getAuthState();
      expect(authState.error).toBe('Popup closed');
      expect(authState.isLoading).toBe(false);
    });

    it('should handle network errors during authentication', async () => {
      const networkError = new Error('Network error');

      mockWindowOpen.mockReturnValue({ close: vi.fn() });
      mockSignInWithPopup.mockRejectedValue(networkError);

      await expect(firebaseAuthService.signInWithPopup('google')).rejects.toThrow('Network error');

      const authState = firebaseAuthService.getAuthState();
      expect(authState.error).toBe('Network error');
      expect(authState.isLoading).toBe(false);
    });
  });

  describe('Authentication Flow - Redirect', () => {
    it('should initiate redirect sign in', async () => {
      (mockSignInWithRedirect as any).mockResolvedValue(undefined);

      await firebaseAuthService.signInWithRedirect('google');

      expect(mockSignInWithRedirect).toHaveBeenCalled();
    });

    it('should handle redirect sign in errors', async () => {
      const redirectError = new Error('Redirect failed');
      mockSignInWithRedirect.mockRejectedValue(redirectError);

      await expect(firebaseAuthService.signInWithRedirect('google')).rejects.toThrow('Redirect failed');
    });

    it('should get redirect result successfully', async () => {
      const mockCredential: UserCredential = {
        user: { uid: 'test-uid' } as User,
        providerId: 'google.com',
        operationType: 'signIn'
      };

      mockGetRedirectResult.mockResolvedValue(mockCredential);

      const result = await firebaseAuthService.getRedirectResult();

      expect(mockGetRedirectResult).toHaveBeenCalled();
      expect(result).toEqual(mockCredential);
    });

    it('should handle null redirect result', async () => {
      mockGetRedirectResult.mockResolvedValue(null);

      const result = await firebaseAuthService.getRedirectResult();

      expect(result).toBeNull();
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      mockSignOut.mockResolvedValue(undefined);

      await firebaseAuthService.signOut();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      const signOutError = new Error('Sign out failed');
      mockSignOut.mockRejectedValue(signOutError);

      await expect(firebaseAuthService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('Avatar Caching System', () => {
    beforeEach(() => {
      // Reset FileReader mock
      mockFileReader.onloadend = null;
      mockFileReader.result = 'data:image/jpeg;base64,mockImageData';
    });

    it('should cache avatar image as data URL', async () => {
      const mockBlob = new Blob(['mock image data'], { type: 'image/jpeg' });
      mockFetch.mockResolvedValue({
        blob: () => Promise.resolve(mockBlob)
      } as Response);

      const service = firebaseAuthService as any;

      // Start the caching process - the mock will automatically trigger onloadend
      await service.cacheAvatarImage('https://example.com/photo.jpg', 'user-123');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/photo.jpg');
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockBlob);
    });

    it('should handle avatar caching failure gracefully', async () => {
      const { logger } = await import('../../../src/utils/logger');

      mockFetch.mockRejectedValue(new Error('Network error'));

      const service = firebaseAuthService as any;
      await service.cacheAvatarImage('https://example.com/photo.jpg', 'user-123');

      expect(logger.warn).toHaveBeenCalledWith('Failed to cache avatar image:', expect.any(Error));
    });

    it('should return cached avatar URL when valid', () => {
      const service = firebaseAuthService as any;
      const now = Date.now();

      // Manually set cache
      service.avatarCache.set('user-123', 'data:image/jpeg;base64,cached');
      service.avatarCacheExpiry.set('user-123', now + 3600000); // 1 hour from now

      const cachedUrl = firebaseAuthService.getCachedAvatarUrl('user-123');

      expect(cachedUrl).toBe('data:image/jpeg;base64,cached');
    });

    it('should return null for expired cache', () => {
      const service = firebaseAuthService as any;
      const pastTime = Date.now() - 3600000; // 1 hour ago

      // Set expired cache
      service.avatarCache.set('user-123', 'data:image/jpeg;base64,expired');
      service.avatarCacheExpiry.set('user-123', pastTime);

      const cachedUrl = firebaseAuthService.getCachedAvatarUrl('user-123');

      expect(cachedUrl).toBeNull();
    });

    it('should clear avatar cache', () => {
      const service = firebaseAuthService as any;

      // Set some cache data
      service.avatarCache.set('user-123', 'data:image/jpeg;base64,cached');
      service.avatarCacheExpiry.set('user-123', Date.now() + 3600000);

      firebaseAuthService.clearAvatarCache();

      expect(service.avatarCache.size).toBe(0);
      expect(service.avatarCacheExpiry.size).toBe(0);
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      // Clear service state between tests
      const service = firebaseAuthService as any;
      service.authState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    });

    it('should get current auth state', () => {
      const authState = firebaseAuthService.getAuthState();

      expect(authState).toHaveProperty('user');
      expect(authState).toHaveProperty('isAuthenticated');
      expect(authState).toHaveProperty('isLoading');
      expect(authState).toHaveProperty('error');
    });

    it('should return current user', () => {
      const user = firebaseAuthService.getCurrentUser();
      expect(user).toBeNull(); // Initially null
    });

    it('should check authentication status', () => {
      const isAuth = firebaseAuthService.isAuthenticated();
      expect(isAuth).toBe(false); // Initially false
    });

    it('should register auth state change listener', () => {
      const mockCallback = vi.fn();

      const unsubscribe = firebaseAuthService.onAuthStateChange(mockCallback);

      // Should call immediately with current state
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
        user: null,
        isAuthenticated: false,
        isLoading: expect.any(Boolean),
        error: null
      }));

      // Should return unsubscribe function
      expect(typeof unsubscribe).toBe('function');

      // Test unsubscribe
      unsubscribe();
      mockCallback.mockClear();

      // Trigger state change notification
      const service = firebaseAuthService as any;
      service.notifyListeners();

      // Callback should not be called after unsubscribe
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Token Management', () => {
    it('should return null when no current user', async () => {
      (mockFirebaseAuth as any).currentUser = null;

      const token = await firebaseAuthService.getAccessToken();

      expect(token).toBeNull();
    });

    it('should get access token for authenticated user', async () => {
      const mockGetIdToken = vi.fn().mockResolvedValue('mock-token');
      (mockFirebaseAuth as any).currentUser = {
        getIdToken: mockGetIdToken
      } as any;

      const token = await firebaseAuthService.getAccessToken();

      expect(mockGetIdToken).toHaveBeenCalled();
      expect(token).toBe('mock-token');
    });

    it('should handle token retrieval errors', async () => {
      const { logger } = await import('../../../src/utils/logger');
      const mockGetIdToken = vi.fn().mockRejectedValue(new Error('Token error'));
      (mockFirebaseAuth as any).currentUser = {
        getIdToken: mockGetIdToken
      } as any;

      const token = await firebaseAuthService.getAccessToken();

      expect(logger.error).toHaveBeenCalledWith('Error getting access token:', expect.any(Error));
      expect(token).toBeNull();
    });
  });

  describe('Permissions System', () => {
    it('should return false for hasPermission when not authenticated', async () => {
      const hasPermission = await firebaseAuthService.hasPermission();
      expect(hasPermission).toBe(false);
    });

    it('should return true for hasPermission when authenticated', async () => {
      // Simulate authenticated state
      const service = firebaseAuthService as any;
      service.authState.user = { uid: 'test-uid' } as FirebaseAuthUser;
      service.authState.isAuthenticated = true;

      const hasPermission = await firebaseAuthService.hasPermission();
      expect(hasPermission).toBe(true);
    });

    it('should check editor role', async () => {
      const isEditor = await firebaseAuthService.isEditor();
      // Currently delegates to hasPermission
      expect(typeof isEditor).toBe('boolean');
    });
  });

  describe('User Transformation', () => {
    it('should transform Firebase user to FirebaseAuthUser interface', () => {
      const mockFirebaseUser: Partial<User> = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        emailVerified: true,
        isAnonymous: false,
        metadata: {
          creationTime: '2024-01-01T00:00:00.000Z',
          lastSignInTime: '2024-01-01T00:00:00.000Z'
        },
        providerData: [
          {
            providerId: 'google.com',
            uid: 'google-uid',
            displayName: 'Test User',
            email: 'test@example.com',
            photoURL: 'https://example.com/photo.jpg',
            phoneNumber: null
          }
        ]
      };

      const service = firebaseAuthService as any;
      const transformedUser = service.transformFirebaseUser(mockFirebaseUser as User);

      expect(transformedUser).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        emailVerified: true,
        isAnonymous: false,
        metadata: {
          creationTime: '2024-01-01T00:00:00.000Z',
          lastSignInTime: '2024-01-01T00:00:00.000Z'
        },
        providerData: [
          {
            providerId: 'google.com',
            uid: 'google-uid',
            displayName: 'Test User',
            email: 'test@example.com',
            photoURL: 'https://example.com/photo.jpg'
          }
        ]
      });
    });

    it('should handle user with no photo URL', () => {
      const mockFirebaseUser: Partial<User> = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        metadata: {
          creationTime: '2024-01-01T00:00:00.000Z',
          lastSignInTime: '2024-01-01T00:00:00.000Z'
        },
        providerData: []
      };

      const service = firebaseAuthService as any;
      const transformedUser = service.transformFirebaseUser(mockFirebaseUser as User);

      expect(transformedUser.photoURL).toBeNull();
    });
  });
});
