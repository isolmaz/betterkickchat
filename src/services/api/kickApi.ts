import {
  KickResponse,
  KickUser,
  KickChannel,
  KickChatMessage,
  KickOAuthToken,
  KickTokenIntrospection,
  KickCategory,
  ChatroomState
} from './types';

// Updated API endpoints according to Kick documentation
const AUTH_BASE_URL = 'https://kick.com/oauth';
const API_BASE_URL = 'https://kick.com/api/v2';

class KickApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'KickApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new KickApiError(response.status, await response.text());
  }
  const result: KickResponse<T> = await response.json();
  return result.data;
}

export class KickApi {
  private accessToken: string = '';

  // Make base URLs accessible
  static readonly AUTH_BASE_URL = AUTH_BASE_URL;
  static readonly API_BASE_URL = API_BASE_URL;

  constructor() {}

  // Getter for access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<T>(response);
  }

  // User endpoints
  async getCurrentUser(): Promise<KickUser> {
    return this.fetchWithAuth<KickUser>('/user');
  }

  async getUser(username: string): Promise<KickUser> {
    return this.fetchWithAuth<KickUser>(`/users/${username}`);
  }

  // Public endpoints that don't require authentication
  async checkChannelExists(channelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/channels/${channelName}`);
      if (response.ok) {
        const data = await response.json();
        return !!data;
      }
      return false;
    } catch (error) {
      console.error('Error checking channel:', error);
      return false;
    }
  }

  // Channel endpoints that require auth
  async getChannel(channelName: string): Promise<KickChannel> {
    return this.fetchWithAuth<KickChannel>(`/channels/${channelName}`);
  }

  async getFollowedChannels(): Promise<KickChannel[]> {
    return this.fetchWithAuth<KickChannel[]>('/channels/followed');
  }

  // Chatroom endpoints
  async getChatroomState(channelId: number): Promise<ChatroomState> {
    return this.fetchWithAuth<ChatroomState>(`/channels/${channelId}/chatroom`);
  }

  // Category endpoints
  async getCategories(): Promise<KickCategory[]> {
    return this.fetchWithAuth<KickCategory[]>('/categories');
  }

  async getCategory(id: number): Promise<KickCategory> {
    return this.fetchWithAuth<KickCategory>(`/categories/${id}`);
  }

  // Chat endpoints
  async sendChatMessage(channelId: number, content: string): Promise<KickChatMessage> {
    return this.fetchWithAuth<KickChatMessage>('/chat', {
      method: 'POST',
      body: JSON.stringify({ channel_id: channelId, content }),
    });
  }

  // OAuth helpers
  static async exchangeCode(
    code: string,
    redirectUri: string,
    codeVerifier: string,
    clientId: string,
    clientSecret: string
  ): Promise<KickOAuthToken> {
    const response = await fetch(`${AUTH_BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }).toString()
    });

    return handleResponse<KickOAuthToken>(response);
  }

  static async introspectToken(token: string): Promise<KickTokenIntrospection> {
    const response = await fetch(`${AUTH_BASE_URL}/token/introspect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    return handleResponse<KickTokenIntrospection>(response);
  }

  // WebSocket connection URL
  static getChatWebsocketUrl(channelId: number): string {
    return `wss://ws-us2.pusher.com/app/${channelId}`;
  }
}

// Create and export a singleton instance
export const kickApi = new KickApi(); 