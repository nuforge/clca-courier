/**
 * Simple Google Drive Authentication Test
 * This is a minimal test to check if we can authenticate without relying on the full GAPI client
 */

export class SimpleGoogleDriveAuth {
  protected clientId: string;
  protected apiKey: string;
  protected scope: string;
  protected accessToken: string = '';
  protected isAuthenticated: boolean = false;

  constructor(clientId: string, apiKey: string) {
    this.clientId = clientId;
    this.apiKey = apiKey;
    // Use more specific, read-only scope to avoid broad file access requests
    this.scope =
      'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly';
  }

  /**
   * Load Google Identity Services
   */
  private async loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as unknown as { google?: { accounts?: unknown } }).google?.accounts) {
        resolve();
        return;
      }

      // Load Google Identity Services
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
   * Simple authentication using only Google Identity Services
   */
  async authenticate(): Promise<boolean> {
    try {
      await this.loadGoogleIdentityServices();

      return new Promise((resolve, reject) => {
        try {
          console.log('Initializing token client...');

          // Configure the OAuth2 token client
          const tokenClient = (
            window as unknown as {
              google: {
                accounts: {
                  oauth2: {
                    initTokenClient: (config: {
                      client_id: string;
                      scope: string;
                      callback: (response: { error?: string; access_token?: string }) => void;
                      error_callback?: (error: { type: string; details: string }) => void;
                    }) => { requestAccessToken: (options?: { prompt?: string }) => void };
                  };
                };
              };
            }
          ).google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: this.scope,
            callback: (response: { error?: string; access_token?: string }) => {
              console.log('OAuth callback received:', response);

              if (response.error) {
                console.error('OAuth2 error:', response);
                this.isAuthenticated = false;

                // Provide helpful error messages for common issues
                if (response.error === 'popup_blocked_by_browser') {
                  reject(
                    new Error(
                      'Popup blocked by browser. Please allow popups for this site and try again.',
                    ),
                  );
                } else if (response.error === 'popup_closed_by_user') {
                  reject(new Error('Authentication cancelled by user.'));
                } else {
                  reject(new Error(`OAuth2 error: ${response.error}`));
                }
                return;
              }

              if (response.access_token) {
                this.accessToken = response.access_token;
                this.isAuthenticated = true;
                console.log('Authentication successful! Token received.');
                resolve(true);
              } else {
                console.error('No access token received in response');
                this.isAuthenticated = false;
                reject(new Error('Authentication failed: No access token received'));
              }
            },
            error_callback: (error: { type: string; details: string }) => {
              console.error('OAuth2 error callback:', error);
              this.isAuthenticated = false;

              // Provide more specific error messages for different popup issues
              if (error.type === 'popup_failed_to_open') {
                reject(
                  new Error(
                    'POPUP_BLOCKED: Browser blocked the authentication popup. Please allow popups for this site and try again.',
                  ),
                );
              } else if (error.type === 'popup_closed') {
                reject(
                  new Error(
                    'POPUP_CLOSED: Authentication popup was closed. Please complete the authentication process and try again.',
                  ),
                );
              } else if (error.type === 'access_denied') {
                reject(
                  new Error(
                    'ACCESS_DENIED: Permission was denied. Please grant access to Google Drive to continue.',
                  ),
                );
              } else if (error.type === 'popup_blocked_by_browser') {
                reject(
                  new Error(
                    'POPUP_BLOCKED: Browser security settings are blocking popups. Please check your browser settings.',
                  ),
                );
              } else {
                reject(
                  new Error(
                    `Authentication error (${error.type}): ${error.details || 'Please check your browser settings and try again'}`,
                  ),
                );
              }
            },
          });

          console.log('Requesting access token...');

          // Add timeout for authentication popup
          const authTimeout = setTimeout(() => {
            console.warn('Authentication timeout - popup may be blocked');
            reject(
              new Error(
                'Authentication timeout. The popup may be blocked by your browser. Please check your popup settings.',
              ),
            );
          }, 30000); // 30 second timeout

          // Request access token immediately without artificial delays
          try {
            // Clear timeout if authentication succeeds or fails
            const originalCallback = tokenClient as unknown as {
              callback?: (response: { error?: string; access_token?: string }) => void;
            };

            if (originalCallback.callback) {
              const originalCb = originalCallback.callback;
              originalCallback.callback = (response) => {
                clearTimeout(authTimeout);
                originalCb(response);
              };
            }

            // Use 'consent' prompt to ensure user gets a chance to see and approve permissions
            tokenClient.requestAccessToken({ prompt: 'consent' });
          } catch (error) {
            clearTimeout(authTimeout);
            console.error('Failed to request access token:', error);
            reject(
              new Error(
                'Failed to open authentication popup. Please check your browser settings and allow popups.',
              ),
            );
          }
        } catch (error) {
          console.error('Token client initialization failed:', error);
          this.isAuthenticated = false;
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    } catch (error) {
      console.error('Authentication failed:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Test API call using direct REST API
   */
  async testApiCall(): Promise<Record<string, unknown>> {
    if (!this.isAuthenticated || !this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?pageSize=10&key=${this.apiKey}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API call successful:', data);
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  /**
   * Get authentication status
   */
  getStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      hasToken: this.accessToken !== '',
      accessToken: this.accessToken ? `${this.accessToken.substring(0, 10)}...` : 'none',
    };
  }

  /**
   * Check if we have a valid token by making a simple API call
   */
  async checkTokenValidity(): Promise<boolean> {
    if (!this.accessToken) {
      this.isAuthenticated = false;
      return false;
    }

    try {
      // Make a simple API call to verify the token
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/about?fields=user&key=${this.apiKey}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      if (response.ok) {
        this.isAuthenticated = true;
        console.log('Token is still valid');
        return true;
      } else {
        console.log('Token is invalid or expired');
        this.isAuthenticated = false;
        this.accessToken = '';
        return false;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      this.isAuthenticated = false;
      this.accessToken = '';
      return false;
    }
  }

  /**
   * Sign out and clear tokens
   */
  signOut(): void {
    this.accessToken = '';
    this.isAuthenticated = false;
    console.log('Signed out successfully');
  }
}
