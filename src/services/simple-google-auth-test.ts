/**
 * Simple Google Drive Authentication Test
 * This is a minimal test to check if we can authenticate without relying on the full GAPI client
 */

export class SimpleGoogleDriveAuth {
  private clientId: string;
  private apiKey: string;
  private scope: string;
  private accessToken: string = '';
  private isAuthenticated: boolean = false;

  constructor(clientId: string, apiKey: string) {
    this.clientId = clientId;
    this.apiKey = apiKey;
    this.scope = 'https://www.googleapis.com/auth/drive.readonly';
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
                    }) => { requestAccessToken: (options: { prompt: string }) => void };
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
                reject(new Error(`OAuth2 error: ${response.error}`));
                return;
              }

              this.accessToken = response.access_token || '';
              this.isAuthenticated = true;

              console.log('Authentication successful!');
              resolve(true);
            },
          });

          console.log('Requesting access token...');
          // Request access token
          tokenClient.requestAccessToken({ prompt: 'consent' });
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
}
