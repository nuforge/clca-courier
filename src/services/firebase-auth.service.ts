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

  constructor() {
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
   * Transform Firebase User to our FirebaseAuthUser interface
   */
  private transformFirebaseUser(user: User): FirebaseAuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
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
   * Sign in with popup
   */
  async signInWithPopup(providerType: SupportedProvider): Promise<UserCredential> {
    try {
      this.authState.isLoading = true;
      this.authState.error = null;
      this.notifyListeners();

      const provider = this.getProvider(providerType);
      const result = await signInWithPopup(firebaseAuth, provider);

      logger.success(`Sign in successful with ${providerType}:`, result.user.email);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      this.authState.error = errorMessage;
      this.authState.isLoading = false;
      this.notifyListeners();

      logger.error(`Sign in error with ${providerType}:`, error);
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

    // TODO: Implement permission checking against Firestore user profiles
    // For now, return basic authentication status
    return Promise.resolve(this.authState.isAuthenticated);
  }

  /**
   * Check if user is an admin or editor
   */
  async isEditor(): Promise<boolean> {
    // TODO: Implement role checking against Firestore
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
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
