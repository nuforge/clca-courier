/**
 * Canva OAuth Authentication Composable
 *
 * Handles Canva Connect OAuth flow integration with existing Firebase auth system.
 * Provides secure token management and user notifications following project patterns.
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useFirebase } from './useFirebase';
import { canvaApiService } from '../services/canva-api.service';
import { logger } from '../utils/logger';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';
import type { CanvaAuthTokens } from '../services/canva/types';

// Secure storage key for Canva tokens (scoped to user)
const CANVA_TOKENS_STORAGE_KEY = 'clca_canva_tokens';
const CANVA_AUTH_STATE_KEY = 'clca_canva_auth_state';

interface CanvaOAuthState {
  tokens: CanvaAuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useCanvaAuth() {
  const $q = useQuasar();
  const { t } = useI18n();
  const router = useRouter();
  const { auth } = useFirebase();

  // Reactive state
  const state = ref<CanvaOAuthState>({
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  // Computed properties
  const isAuthenticated = computed(() => state.value.isAuthenticated);
  const isLoading = computed(() => state.value.isLoading);
  const hasValidTokens = computed(() => {
    if (!state.value.tokens) return false;

    // Check if access token exists and is not expired
    const now = Date.now();
    return state.value.tokens.accessToken &&
           state.value.tokens.expiresAt &&
           state.value.tokens.expiresAt > now;
  });

  /**
   * Generate a secure random state parameter for OAuth CSRF protection
   */
  function generateAuthState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * PKCE helpers
   */
  function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function base64UrlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      const byte = bytes[i];
      if (byte !== undefined) {
        binary += String.fromCharCode(byte);
      }
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  async function generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(digest);
  }

  /**
   * Get user-scoped storage key to ensure tokens are user-specific
   */
  function getUserScopedStorageKey(baseKey: string): string {
    const userId = auth.currentUser.value?.uid;
    if (!userId) {
      throw new Error('User must be authenticated to access Canva tokens');
    }
    return `${baseKey}_${userId}`;
  }

  /**
   * Store tokens securely in localStorage with user scope
   */
  function storeTokensSecurely(tokens: CanvaAuthTokens): void {
    try {
      if (!auth.currentUser.value) {
        throw new Error('User must be authenticated to store Canva tokens');
      }

      const storageKey = getUserScopedStorageKey(CANVA_TOKENS_STORAGE_KEY);
      const tokenData = {
        ...tokens,
        storedAt: Date.now(),
        userId: auth.currentUser.value.uid
      };

      localStorage.setItem(storageKey, JSON.stringify(tokenData));
      logger.info('Canva tokens stored securely');
    } catch (error) {
      logger.error('Failed to store Canva tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Retrieve tokens securely from localStorage with user scope
   */
  function retrieveTokensSecurely(): CanvaAuthTokens | null {
    try {
      if (!auth.currentUser.value) {
        logger.debug('No authenticated user - cannot retrieve Canva tokens');
        return null;
      }

      const storageKey = getUserScopedStorageKey(CANVA_TOKENS_STORAGE_KEY);
      const tokenData = localStorage.getItem(storageKey);

      if (!tokenData) {
        logger.debug('No stored Canva tokens found');
        return null;
      }

      const parsed = JSON.parse(tokenData);

      // Verify the tokens belong to the current user
      if (parsed.userId !== auth.currentUser.value.uid) {
        logger.warn('Stored tokens belong to different user - clearing');
        localStorage.removeItem(storageKey);
        return null;
      }

      // Check if tokens are expired
      if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
        logger.debug('Stored Canva tokens are expired');
        localStorage.removeItem(storageKey);
        return null;
      }

      logger.info('Retrieved valid Canva tokens from storage');
      return {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        expiresAt: parsed.expiresAt,
        scope: parsed.scope
      };
    } catch (error) {
      logger.error('Failed to retrieve Canva tokens:', error);
      return null;
    }
  }

  /**
   * Clear stored tokens from localStorage
   */
  function clearStoredTokens(): void {
    try {
      if (!auth.currentUser.value) return;

      const storageKey = getUserScopedStorageKey(CANVA_TOKENS_STORAGE_KEY);
      localStorage.removeItem(storageKey);

      // Also clear auth state
      const stateKey = getUserScopedStorageKey(CANVA_AUTH_STATE_KEY);
      localStorage.removeItem(stateKey);

      logger.info('Canva tokens cleared from storage');
    } catch (error) {
      logger.error('Failed to clear Canva tokens:', error);
    }
  }

  /**
   * Initialize Canva OAuth flow
   * Redirects user to Canva authorization page
   */
  function initiateOAuth(): void {
    try {
      // Check if user is authenticated with Firebase (with retry for OAuth redirect timing)
      if (!auth.currentUser.value) {
        // If we just returned from OAuth, wait a moment for Firebase auth to restore
        setTimeout(() => {
          if (!auth.currentUser.value) {
            $q.notify({
              type: 'negative',
              message: t(TRANSLATION_KEYS.CANVA.AUTH_REQUIRED),
              position: 'top',
              timeout: 5000,
            });
            return;
          }
          // Retry the OAuth initiation
          initiateOAuth();
        }, 1000);
        return;
      }

      state.value.isLoading = true;
      state.value.error = null;

      // Generate secure state parameter for CSRF protection
      const authState = generateAuthState();
      const stateKey = getUserScopedStorageKey(CANVA_AUTH_STATE_KEY);
      localStorage.setItem(stateKey, authState);

      // Generate PKCE code verifier & challenge
      const codeVerifier = generateCodeVerifier();
      const verifierKey = getUserScopedStorageKey(`${CANVA_AUTH_STATE_KEY}_verifier`);
      localStorage.setItem(verifierKey, codeVerifier);

      // Get Canva API configuration
      const config = canvaApiService.getConfig();

      // Construct OAuth authorization URL
      const authUrl = new URL('https://www.canva.com/api/oauth/authorize');
      authUrl.searchParams.set('client_id', config.clientId);
      authUrl.searchParams.set('redirect_uri', config.redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('state', authState);
      authUrl.searchParams.set('scope', 'design:content:write asset:write design:content:read app:read design:permission:write asset:read brandtemplate:meta:read brandtemplate:content:read design:permission:read design:meta:read');
      // Add PKCE
      // Note: generateCodeChallenge is async; create URL then compute and redirect when ready
      void (async () => {
        try {
          const challenge = await generateCodeChallenge(codeVerifier);
          authUrl.searchParams.set('code_challenge', challenge);
          authUrl.searchParams.set('code_challenge_method', 'S256');

          logger.info('Initiating Canva OAuth flow', {
            redirectUri: config.redirectUri,
            state: authState.substring(0, 8) + '...'
          });

          $q.notify({
            type: 'info',
            message: t(TRANSLATION_KEYS.CANVA.CONNECTING_TO_CANVA),
            position: 'top',
            timeout: 3000,
          });

          window.location.href = authUrl.toString();
        } catch (err) {
          logger.error('Failed to generate PKCE challenge:', err);
          state.value.isLoading = false;
          $q.notify({ type: 'negative', message: t(TRANSLATION_KEYS.CANVA.AUTH_FAILED), position: 'top' });
        }
      })();

    } catch (error) {
      logger.error('Failed to initiate Canva OAuth:', error);
      state.value.error = error instanceof Error ? error.message : 'Unknown error';
      state.value.isLoading = false;

      $q.notify({
        type: 'negative',
        message: t(TRANSLATION_KEYS.CANVA.AUTH_FAILED),
        position: 'top',
        timeout: 5000,
      });
    }
  }

  /**
   * Handle OAuth redirect callback from Canva
   * Exchanges authorization code for access tokens
   */
  async function handleOAuthRedirect(): Promise<void> {
    try {
      // Check if user is authenticated with Firebase (with retry for OAuth redirect timing)
      if (!auth.currentUser.value) {
        logger.warn('User not authenticated during OAuth callback, waiting for Firebase auth to restore...');

        // Wait up to 5 seconds for Firebase auth to restore
        let attempts = 0;
        const maxAttempts = 10;
        const delay = 500; // 500ms between attempts

        while (!auth.currentUser.value && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
          attempts++;
          logger.debug(`Waiting for Firebase auth... attempt ${attempts}/${maxAttempts}`);
        }

        if (!auth.currentUser.value) {
          logger.error('User still not authenticated after waiting for Firebase auth to restore');
          $q.notify({
            type: 'negative',
            message: t(TRANSLATION_KEYS.CANVA.AUTH_REQUIRED),
            position: 'top',
            timeout: 5000,
          });
          return;
        }

        logger.info('Firebase auth restored, proceeding with OAuth callback');
      }

      state.value.isLoading = true;
      state.value.error = null;

      // Get URL parameters from current location
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get('code');
      const returnedState = urlParams.get('state');
      const error = urlParams.get('error');

      // Handle OAuth error responses
      if (error) {
        logger.error('OAuth error received:', error);
        throw new Error(`OAuth authorization failed: ${error}`);
      }

      // Validate required parameters
      if (!authCode || !returnedState) {
        throw new Error('Missing required OAuth parameters');
      }

      // Verify state parameter to prevent CSRF attacks
      const stateKey = getUserScopedStorageKey(CANVA_AUTH_STATE_KEY);
      const storedState = localStorage.getItem(stateKey);

      if (!storedState || storedState !== returnedState) {
        logger.error('OAuth state mismatch - possible CSRF attack');
        throw new Error('Invalid OAuth state parameter');
      }

      // Clear stored state
      localStorage.removeItem(stateKey);

      logger.info('OAuth callback received, exchanging code for tokens');

      // Exchange authorization code for access tokens via backend proxy (PKCE)
      const config = canvaApiService.getConfig();
      const verifierKey = getUserScopedStorageKey(`${CANVA_AUTH_STATE_KEY}_verifier`);
      const codeVerifier = localStorage.getItem(verifierKey) || '';

      logger.info('Sending token exchange request to backend proxy', {
        hasCode: !!authCode,
        hasCodeVerifier: !!codeVerifier,
        redirectUri: config.redirectUri
      });

      // Use local proxy server to avoid CORS issues with Canva API
      const tokenResponse = await fetch('http://localhost:3001/api/canva/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          code: authCode,
          code_verifier: codeVerifier,
          redirect_uri: config.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        logger.error('Token exchange failed:', {
          status: tokenResponse.status,
          error: errorData
        });
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();

      // Create tokens object with expiry time
      const tokens: CanvaAuthTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000), // Convert seconds to milliseconds
        scope: tokenData.scope || 'design:write design:read asset:read folder:read'
      };

      // Store tokens securely
      storeTokensSecurely(tokens);

      // Update state
      state.value.tokens = tokens;
      state.value.isAuthenticated = true;
      state.value.isLoading = false;

      logger.success('Canva OAuth authentication completed successfully');

      $q.notify({
        type: 'positive',
        message: t(TRANSLATION_KEYS.CANVA.CONNECTED_TO_CANVA),
        position: 'top',
        timeout: 3000,
      });

      // Clean up URL parameters and redirect to appropriate page
      const cleanUrl = window.location.pathname;
      await router.replace(cleanUrl);

    } catch (error) {
      logger.error('OAuth callback handling failed:', error);
      state.value.error = error instanceof Error ? error.message : 'Unknown error';
      state.value.isLoading = false;

      $q.notify({
        type: 'negative',
        message: t(TRANSLATION_KEYS.CANVA.AUTH_FAILED),
        position: 'top',
        timeout: 5000,
      });

      // Redirect to safe page on error
      await router.replace('/contribute/submit');
    }
  }

  /**
   * Sign out from Canva (clear stored tokens)
   */
  function signOut(): void {
    try {
      clearStoredTokens();

      state.value.tokens = null;
      state.value.isAuthenticated = false;
      state.value.error = null;

      logger.info('Signed out from Canva successfully');

      $q.notify({
        type: 'positive',
        message: t(TRANSLATION_KEYS.CANVA.SIGN_OUT_SUCCESS),
        position: 'top',
        timeout: 2000,
      });
    } catch (error) {
      logger.error('Failed to sign out from Canva:', error);
      $q.notify({
        type: 'negative',
        message: t(TRANSLATION_KEYS.COMMON.ERROR),
        position: 'top',
        timeout: 3000,
      });
    }
  }

  /**
   * Get current access token for API calls
   */
  function getAccessToken(): string | null {
    return state.value.tokens?.accessToken || null;
  }

  /**
   * Initialize the composable by loading stored tokens
   */
  function initialize(): void {
    try {
      if (auth.currentUser.value) {
        const tokens = retrieveTokensSecurely();
        if (tokens) {
          state.value.tokens = tokens;
          state.value.isAuthenticated = true;
          logger.info('Canva authentication restored from storage');
        }
      }
    } catch (error) {
      logger.error('Failed to initialize Canva auth:', error);
    }
  }

  // Initialize on composable creation
  initialize();

  return {
    // State
    isAuthenticated,
    isLoading,
    hasValidTokens,
    error: computed(() => state.value.error),

    // Methods
    initiateOAuth,
    handleOAuthRedirect,
    signOut,
    getAccessToken,
    initialize,
  };
}
