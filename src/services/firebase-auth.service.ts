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
  private avatarRetryCount = new Map<string, number>();
  private readonly AVATAR_CACHE_TTL = 1000 * 60 * 60; // 1 hour
  private readonly MAX_AVATAR_RETRIES = 2; // Maximum retries before giving up

  /**
   * Cache avatar image as data URL with retry logic and rate limit handling
   */
  private async cacheAvatarImage(photoURL: string, cacheKey: string, retryCount = 0): Promise<void> {
    try {
      // Check if we've exceeded retry limit
      if (retryCount >= this.MAX_AVATAR_RETRIES) {
        logger.warn(`Avatar caching failed after ${this.MAX_AVATAR_RETRIES} retries, giving up for user ${cacheKey}`);
        return;
      }

      // Add delay to prevent immediate 429 errors (progressive delay)
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Progressive delay: 1s, 2s, 4s, max 30s
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const response = await fetch(photoURL);

      if (response.status === 429) {
        // Rate limited - retry with exponential backoff
        const nextRetry = retryCount + 1;
        const backoffDelay = Math.min(30000 * Math.pow(2, retryCount), 300000); // 30s, 60s, 120s, max 5min
        logger.warn(`Avatar caching rate limited (attempt ${nextRetry}), retrying in ${backoffDelay/1000}s...`);

        setTimeout(() => {
          void this.cacheAvatarImage(photoURL, cacheKey, nextRetry);
        }, backoffDelay);
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

      // Update the entire auth state to ensure Vue reactivity works
      if (this.authState.user && this.authState.user.uid === cacheKey) {
        // Create completely new state objects for Vue reactivity
        const updatedUser = {
          ...this.authState.user,
          photoURL: dataUrl
        };

        this.authState = {
          ...this.authState,
          user: updatedUser
        };

        this.notifyListeners(); // Trigger UI update
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

      logger.debug('Processing avatar for user:', { uid: user.uid, originalPhotoURL });

      if (this.avatarCache.has(cacheKey) && this.avatarCacheExpiry.has(cacheKey)) {
        const now = Date.now();
        const expiry = this.avatarCacheExpiry.get(cacheKey)!;
        if (now < expiry) {
          // Use valid cached version
          cachedPhotoURL = this.avatarCache.get(cacheKey)!;
          logger.debug('Using valid cached avatar');
        } else {
          // Cache expired, use cached version while updating in background
          cachedPhotoURL = this.avatarCache.get(cacheKey)!;
          logger.debug('Cache expired, refreshing avatar');
          void this.cacheAvatarImage(originalPhotoURL, cacheKey, 0);
        }
      } else {
        // No cache entry, show original URL while caching in background
        cachedPhotoURL = originalPhotoURL;
        logger.debug('No cached avatar found, using original URL while starting background caching');
        void this.cacheAvatarImage(originalPhotoURL, cacheKey, 0);
      }
    }

    const transformedUser = {
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

    logger.debug('Transformed user:', { uid: transformedUser.uid, hasPhotoURL: !!transformedUser.photoURL });
    return transformedUser;
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

      // Force popup to work by opening it with proper parameters
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

        // Don't auto-fallback to redirect - let the user handle it
        if (firebaseError.code === 'auth/popup-blocked') {
          logger.error('❌ Popup blocked by browser. Please allow popups for this site and try again.');
        } else if (firebaseError.code === 'auth/popup-closed-by-user') {
          logger.error('❌ Popup was closed by user. Please try again.');
        } else if (firebaseError.code === 'auth/cancelled-popup-request') {
          logger.error('❌ Popup request was cancelled. Please try again.');
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
