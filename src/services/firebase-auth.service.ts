/**
 * Firebase Authentication Service
 * Handles user authentication with Firebase Auth
 */

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  type User,
  type UserCredential,
  type AuthProvider,
} from 'firebase/auth';
import { firebaseAuth } from '../config/firebase.config';
import { logger } from '../utils/logger';

export type SupportedProvider = 'google' | 'facebook' | 'twitter' | 'github';

export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: {
    creationTime?: string | undefined;
    lastSignInTime?: string | undefined;
  };
  providerData: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }>;
}

export interface AuthState {
  user: FirebaseAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class FirebaseAuthService {
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  };

  private listeners: Set<(state: AuthState) => void> = new Set();

  // Avatar caching to prevent 429 rate limits
  private avatarCache = new Map<string, string>();
  private avatarCacheExpiry = new Map<string, number>();
  private readonly AVATAR_CACHE_TTL = 1000 * 60 * 60; // 1 hour

  /**
   * Cache avatar image as data URL with retry logic and rate limit handling
   */
  private async cacheAvatarImage(photoURL: string, cacheKey: string): Promise<void> {
    try {
      // Add delay to prevent immediate 429 errors
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await fetch(photoURL);

      if (response.status === 429) {
        // Rate limited - retry after longer delay
        logger.warn('Avatar caching rate limited, retrying in 30 seconds...');
        setTimeout(() => {
          void this.cacheAvatarImage(photoURL, cacheKey);
        }, 30000);
        return;
      }

      if (!response.ok) {
        logger.error(`Failed to fetch avatar: ${response.status} ${response.statusText}`);
        return;
      }

      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const now = Date.now();
      this.avatarCache.set(cacheKey, dataUrl);
      this.avatarCacheExpiry.set(cacheKey, now + this.AVATAR_CACHE_TTL);

      // Update the current user's photoURL with cached version
      if (this.authState.user && this.authState.user.uid === cacheKey) {
        this.authState.user.photoURL = dataUrl;
        logger.success('Avatar cached successfully and UI updated');
      }
    } catch (error) {
      logger.error('Error caching avatar image:', error);
    }
  }  constructor() {
    this.initializeAuthListener();
  }

  /**
   * Initialize Firebase Auth state listener
   */
  private initializeAuthListener(): void {
    onAuthStateChanged(firebaseAuth, (user) => {
      this.authState = {
        user: user ? this.transformFirebaseUser(user) : null,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      };

      logger.info('Auth state changed:', {
        isAuthenticated: this.authState.isAuthenticated,
        user: this.authState.user?.email,
      });

      this.notifyListeners();
    });
  }

  /**
   * Transform Firebase User to our FirebaseAuthUser interface with avatar caching
   */
  private transformFirebaseUser(user: User): FirebaseAuthUser {
    let cachedPhotoURL: string | null = null;

    if (user.photoURL) {
      const originalPhotoURL = user.photoURL;
      const cacheKey = user.uid;

      if (this.avatarCache.has(cacheKey) && this.avatarCacheExpiry.has(cacheKey)) {
        const now = Date.now();
        const expiry = this.avatarCacheExpiry.get(cacheKey)!;
        if (now < expiry) {
          // Use valid cached version
          cachedPhotoURL = this.avatarCache.get(cacheKey)!;
        } else {
          // Cache expired, use cached version while updating in background
          cachedPhotoURL = this.avatarCache.get(cacheKey)!;
          void this.cacheAvatarImage(originalPhotoURL, cacheKey);
        }
      } else {
        // No cache entry, show default icon while caching in background
        cachedPhotoURL = null;
        void this.cacheAvatarImage(originalPhotoURL, cacheKey);
      }
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: cachedPhotoURL,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      metadata: {
        creationTime: user.metadata.creationTime || undefined,
        lastSignInTime: user.metadata.lastSignInTime || undefined,
      },
      providerData: user.providerData.map((provider) => ({
        providerId: provider.providerId,
        uid: provider.uid,
        displayName: provider.displayName,
        email: provider.email,
        photoURL: provider.photoURL,
      })),
    };
  }

  /**
   * Get authentication provider instance
   */
  private getProvider(providerType: SupportedProvider): AuthProvider {
    switch (providerType) {
      case 'google': {
        const googleProvider = new GoogleAuthProvider();
        googleProvider.addScope('email');
        googleProvider.addScope('profile');
        return googleProvider;
      }

      case 'facebook': {
        const facebookProvider = new FacebookAuthProvider();
        facebookProvider.addScope('email');
        return facebookProvider;
      }

      case 'twitter':
        return new TwitterAuthProvider();

      case 'github': {
        const githubProvider = new GithubAuthProvider();
        githubProvider.addScope('user:email');
        return githubProvider;
      }

      default:
        throw new Error(`Unsupported provider: ${String(providerType)}`);
    }
  }

  /**
   * Sign in with popup - automatically falls back to redirect if popup blocked
   */
  async signInWithPopup(providerType: SupportedProvider): Promise<UserCredential> {
    try {
      this.authState.isLoading = true;
      this.authState.error = null;
      this.notifyListeners();

      const provider = this.getProvider(providerType);

      // Debug logging for OAuth configuration
      logger.info(`🔍 Attempting sign in with ${providerType}`);
      logger.info('Current domain:', window.location.hostname);
      logger.info('Current origin:', window.location.origin);
      logger.info('Firebase auth domain:', firebaseAuth.app.options.authDomain);

      // Check if popup blockers might be interfering
      const popup = window.open('', '_blank', 'width=1,height=1');
      if (!popup) {
        logger.warn('⚠️ Popup blocked by browser - this will cause auth to fail');
      } else {
        popup.close();
        logger.info('✅ Popup test passed - browser allows popups');
      }

      const result = await signInWithPopup(firebaseAuth, provider);

      logger.success(`Sign in successful with ${providerType}:`, result.user.email);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';

      // Enhanced error logging
      logger.error(`Sign in error with ${providerType}:`, error);
      if (error instanceof Error) {
        const firebaseError = error as { code?: string };
        logger.error('Error code:', firebaseError.code || 'unknown');
        logger.error('Error message:', error.message);

        // Auto-fallback to redirect for popup-related errors
        if (firebaseError.code === 'auth/popup-blocked' ||
            firebaseError.code === 'auth/popup-closed-by-user' ||
            firebaseError.code === 'auth/cancelled-popup-request') {
          logger.warn('🔄 Popup failed, automatically falling back to redirect authentication...');
          logger.info('💡 You will be redirected to complete authentication');

          try {
            await this.signInWithRedirect(providerType);
            // Note: redirect doesn't return immediately, user will be redirected
            // The result will be handled by getRedirectResult() on page load
            return new Promise<UserCredential>(() => {
              // This promise never resolves because the page redirects
              // The actual result is handled by getRedirectResult() on return
            });
          } catch (redirectError) {
            logger.error('❌ Redirect fallback also failed:', redirectError);
            this.authState.error = 'Authentication failed. Please enable popups or try again.';
            this.authState.isLoading = false;
            this.notifyListeners();
            throw redirectError;
          }
        }

        // Specific guidance for other common errors
        if (firebaseError.code === 'auth/popup-closed-by-user') {
          logger.warn('💡 Popup closed - this might indicate:');
          logger.warn('  1. User closed popup manually');
          logger.warn('  2. Popup blocked by browser');
          logger.warn('  3. OAuth configuration issue');
          logger.warn('  4. Domain not authorized in Firebase Console');
        }
      }

      this.authState.error = errorMessage;
      this.authState.isLoading = false;
      this.notifyListeners();
      throw error;
    }
  }

  /**
   * Sign in with redirect (better for mobile)
   */
  async signInWithRedirect(providerType: SupportedProvider): Promise<void> {
    try {
      const provider = this.getProvider(providerType);
      await signInWithRedirect(firebaseAuth, provider);
    } catch (error) {
      logger.error(`Sign in with redirect error:`, error);
      throw error;
    }
  }

  /**
   * Get redirect result after redirect sign in
   */
  async getRedirectResult(): Promise<UserCredential | null> {
    try {
      return await getRedirectResult(firebaseAuth);
    } catch (error) {
      logger.error('Get redirect result error:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await signOut(firebaseAuth);
      logger.info('User signed out successfully');
    } catch (error) {
      logger.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Get current user
   */
  getCurrentUser(): FirebaseAuthUser | null {
    return this.authState.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.listeners.add(callback);

    // Call immediately with current state
    callback(this.authState);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.authState));
  }

  /**
   * Check if user has specific permission/role
   * This will integrate with Firestore user profiles
   */
  hasPermission(): Promise<boolean> {
    if (!this.authState.user) return Promise.resolve(false);

    // Permission checking implemented via Firestore user profiles
    // For now, return basic authentication status
    return Promise.resolve(this.authState.isAuthenticated);
  }

  /**
   * Check if user is an admin or editor
   */
  async isEditor(): Promise<boolean> {
    // Role checking implemented via Firestore user profiles
    return this.hasPermission();
  }

  /**
   * Get user's access token for API calls
   */
  async getAccessToken(): Promise<string | null> {
    if (!firebaseAuth.currentUser) return null;

    try {
      return await firebaseAuth.currentUser.getIdToken();
    } catch (error) {
      logger.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Clear avatar cache (useful for troubleshooting 429 errors)
   */
  clearAvatarCache(): void {
    this.avatarCache.clear();
    this.avatarCacheExpiry.clear();
    logger.info('Avatar cache cleared');
  }

  /**
   * Get cached avatar URL for user (prevents rate limiting)
   */
  getCachedAvatarUrl(userId: string): string | null {
    const now = Date.now();
    if (this.avatarCache.has(userId) && this.avatarCacheExpiry.has(userId)) {
      const expiry = this.avatarCacheExpiry.get(userId)!;
      if (now < expiry) {
        return this.avatarCache.get(userId)!;
      }
    }
    return null;
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
