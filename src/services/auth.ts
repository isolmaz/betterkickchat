import { Buffer } from 'buffer';

// Constants that are not sensitive
const REDIRECT_URL = 'https://isolmaz.github.io/betterkickchat/oauth-callback.html';
const TOKEN_STORAGE_KEY = 'kick_auth_token';
const CREDENTIALS_STORAGE_KEY = 'kick_credentials';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface Credentials {
  clientId: string;
  clientSecret: string;
}

export class AuthService {
  private static instance: AuthService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;
  private credentials: Credentials | null = null;

  private constructor() {
    this.loadTokenFromStorage();
    this.loadCredentials();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async loadCredentials() {
    const stored = await chrome.storage.local.get(CREDENTIALS_STORAGE_KEY);
    this.credentials = stored[CREDENTIALS_STORAGE_KEY];
  }

  async setCredentials(clientId: string, clientSecret: string) {
    this.credentials = { clientId, clientSecret };
    await chrome.storage.local.set({
      [CREDENTIALS_STORAGE_KEY]: this.credentials
    });
  }

  private async loadTokenFromStorage() {
    const stored = await chrome.storage.local.get(TOKEN_STORAGE_KEY);
    const tokenData = stored[TOKEN_STORAGE_KEY];
    if (tokenData) {
      this.accessToken = tokenData.accessToken;
      this.refreshToken = tokenData.refreshToken;
      this.expiresAt = tokenData.expiresAt;
    }
  }

  private async saveTokenToStorage() {
    await chrome.storage.local.set({
      [TOKEN_STORAGE_KEY]: {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiresAt: this.expiresAt,
      },
    });
  }

  async initiateLogin(): Promise<void> {
    if (!this.credentials) {
      throw new Error('Credentials not set');
    }

    const authUrl = new URL('https://kick.com/oauth/authorize');
    authUrl.searchParams.append('client_id', this.credentials.clientId);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URL);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'read_user read_channel chat_write chat_read');

    try {
      const responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl.toString(),
        interactive: true
      });

      if (responseUrl) {
        const code = new URL(responseUrl).searchParams.get('code');
        if (code) {
          await this.exchangeCodeForToken(code);
        }
      }
    } catch (error) {
      console.error('Auth flow failed:', error);
      throw error;
    }
  }

  private async exchangeCodeForToken(code: string): Promise<void> {
    if (!this.credentials) {
      throw new Error('Credentials not set');
    }

    const tokenUrl = 'https://kick.com/oauth/token';
    const basicAuth = Buffer.from(`${this.credentials.clientId}:${this.credentials.clientSecret}`).toString('base64');

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URL,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data: TokenResponse = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.expiresAt = Date.now() + (data.expires_in * 1000);
      await this.saveTokenToStorage();
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }

  async getAccessToken(): Promise<string> {
    if (!this.accessToken || !this.expiresAt) {
      throw new Error('Not authenticated');
    }

    if (Date.now() >= this.expiresAt - 300000) { // Refresh if within 5 minutes of expiry
      await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.credentials || !this.refreshToken) {
      throw new Error('No refresh token or credentials available');
    }

    const tokenUrl = 'https://kick.com/oauth/token';
    const basicAuth = Buffer.from(`${this.credentials.clientId}:${this.credentials.clientSecret}`).toString('base64');

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data: TokenResponse = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.expiresAt = Date.now() + (data.expires_in * 1000);
      await this.saveTokenToStorage();
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    await chrome.storage.local.remove(TOKEN_STORAGE_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.expiresAt && Date.now() < this.expiresAt;
  }
} 