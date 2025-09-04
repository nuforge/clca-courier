/**
 * Unified Google Drive Authentication Service
 * Consolidates authentication logic from multiple Google Drive services
 */

import type { GoogleDriveAuthState, GoogleDriveError } from '../../types';

export class GoogleDriveAuthService {
  private clientId: string;
  private apiKey: string;
  private scope: string;
  private tokenClient: { requestAccessToken(): void } | null = null;
  private authState: GoogleDriveAuthState = {
    isSignedIn: false,
    isLoading: false,
  };

  constructor(clientId: string, apiKey: string) {
    this.clientId = clientId;
    this.apiKey = apiKey;
    this.scope =
      'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly';
  }

  /**
   * Get current authentication state
   */
  getAuthState(): GoogleDriveAuthState {
    return { ...this.authState };
  }

  /**
   * Load Google Identity Services
   */
  private async loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize authentication
   */
  async initialize(): Promise<void> {
    this.authState.isLoading = true;

    try {
      await this.loadGoogleIdentityServices();

      if (!window.google?.accounts) {
        throw new Error('Google Identity Services not available');
      }

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: this.scope,
        callback: (response: { access_token: string; error?: string }) =>
          this.handleTokenResponse(response),
      });
    } catch (error) {
      this.handleAuthError(error as GoogleDriveError);
    } finally {
      this.authState.isLoading = false;
    }
  }

  /**
   * Request authentication
   */
  async authenticate(): Promise<boolean> {
    if (!this.tokenClient) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      if (!this.tokenClient) {
        resolve(false);
        return;
      }

      this.authState.isLoading = true;

      // Set up timeout for authentication
      const timeoutId = setTimeout(() => {
        this.authState.isLoading = false;
        resolve(false);
      }, 30000); // 30 second timeout

      this.tokenClient.requestAccessToken();

      // Check authentication status periodically
      const checkAuth = setInterval(() => {
        if (!this.authState.isLoading) {
          clearTimeout(timeoutId);
          clearInterval(checkAuth);
          resolve(this.authState.isSignedIn);
        }
      }, 100);
    });
  }

  /**
   * Sign out
   */
  signOut(): void {
    this.authState = {
      isSignedIn: false,
      isLoading: false,
    };
  }

  /**
   * Get access token
   */
  getAccessToken(): string | undefined {
    return this.authState.accessToken;
  }

  /**
   * Check if token is valid
   */
  isTokenValid(): boolean {
    if (!this.authState.accessToken || !this.authState.expiresAt) {
      return false;
    }
    return Date.now() < this.authState.expiresAt;
  }

  /**
   * Handle successful token response
   */
  private handleTokenResponse(response: { access_token: string; error?: string }): void {
    if (response.error) {
      this.handleAuthError({
        code: 401,
        message: response.error,
        status: 'AUTH_ERROR',
      });
      return;
    }

    this.authState = {
      isSignedIn: true,
      isLoading: false,
      accessToken: response.access_token,
      expiresAt: Date.now() + 3600 * 1000, // Default 1 hour expiry
    };
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: GoogleDriveError): void {
    console.warn('[GoogleDriveAuth] Authentication error:', error);
    this.authState = {
      isSignedIn: false,
      isLoading: false,
    };
  }
}
