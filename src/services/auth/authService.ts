import { kickApi, KickApi } from '../api/kickApi';

class AuthService {
  private codeVerifier: string | null = null;
  private authStateListeners: ((isAuthenticated: boolean) => void)[] = [];
  private static readonly REDIRECT_URI = 'https://isolmaz.github.io/betterkickchat/callback';

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Load saved token if exists
      const { token } = await chrome.storage.sync.get(['token']);
      if (token) {
        kickApi.setAccessToken(token);
        // Verify token is valid
        await this.verifyToken();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await this.logout();
    }
  }

  private async verifyToken(): Promise<boolean> {
    try {
      const token = kickApi.getAccessToken();
      if (!token) return false;

      await KickApi.introspectToken(token);
      this.notifyListeners(true);
      return true;
    } catch {
      await this.logout();
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return this.verifyToken();
  }

  async login(): Promise<void> {
    // Generate code verifier
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.codeVerifier = btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Save code verifier for later
    await chrome.storage.local.set({ codeVerifier: this.codeVerifier });

    // Generate code challenge
    const encoder = new TextEncoder();
    const data = encoder.encode(this.codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Construct auth URL with GitHub Pages callback
    const params = new URLSearchParams({
      client_id: '01JMMTMR9N6Q1R9FBP8P20MZDZ',
      response_type: 'code',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      redirect_uri: AuthService.REDIRECT_URI,
      scope: 'read_user read_channel chat_write chat_read',
      state: this.generateState()
    });

    const authUrl = `${KickApi.AUTH_BASE_URL}/authorize?${params.toString()}`;
    
    // Open auth URL in a new tab
    const authTab = await chrome.tabs.create({ url: authUrl });

    // Wait for the callback message from GitHub Pages
    return new Promise((resolve, reject) => {
      const messageListener = async (message: any) => {
        if (message.type === 'OAUTH_CALLBACK' && message.source === 'github_pages') {
          try {
            // Remove the listener
            chrome.runtime.onMessage.removeListener(messageListener);

            // Validate state to prevent CSRF
            if (message.state !== await this.getStoredState()) {
              throw new Error('Invalid state parameter');
            }

            // Handle the callback
            const success = await this.handleCallback(message.code);
            if (!success) throw new Error('Failed to exchange code for token');

            // Close the auth tab
            await chrome.tabs.remove(authTab.id!);
            resolve();
          } catch (error) {
            reject(error);
          }
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);
    });
  }

  private generateState(): string {
    const state = crypto.randomUUID();
    chrome.storage.local.set({ oauth_state: state });
    return state;
  }

  private async getStoredState(): Promise<string> {
    const { oauth_state } = await chrome.storage.local.get(['oauth_state']);
    return oauth_state;
  }

  private async handleCallback(code: string): Promise<boolean> {
    try {
      // Get saved code verifier
      const { codeVerifier } = await chrome.storage.local.get(['codeVerifier']);
      if (!codeVerifier) {
        throw new Error('No code verifier found');
      }

      // Exchange code for token
      const token = await KickApi.exchangeCode(
        code,
        AuthService.REDIRECT_URI,
        codeVerifier,
        '01JMMTMR9N6Q1R9FBP8P20MZDZ',
        process.env.KICK_CLIENT_SECRET!
      );

      // Save token
      await chrome.storage.sync.set({ token: token.access_token });
      kickApi.setAccessToken(token.access_token);

      // Clear code verifier and state
      await chrome.storage.local.remove(['codeVerifier', 'oauth_state']);

      // Notify listeners
      this.notifyListeners(true);
      return true;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    // Clear token from storage and API
    await chrome.storage.sync.remove(['token']);
    kickApi.setAccessToken('');
    this.notifyListeners(false);
  }

  private notifyListeners(isAuthenticated: boolean) {
    this.authStateListeners.forEach(listener => listener(isAuthenticated));
  }

  addAuthStateListener(listener: (isAuthenticated: boolean) => void) {
    this.authStateListeners.push(listener);
  }

  removeAuthStateListener(listener: (isAuthenticated: boolean) => void) {
    const index = this.authStateListeners.indexOf(listener);
    if (index > -1) {
      this.authStateListeners.splice(index, 1);
    }
  }
}

export const authService = new AuthService(); 