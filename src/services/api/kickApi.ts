import { KickUser, Channel, ChatMessage, ChatroomState } from './types';

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
  return response.json();
}

export class KickApi {
  private accessToken: string | null = null;

  constructor(private clientId: string, private clientSecret: string) {}

  async authenticate(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    const data = await handleResponse<{ access_token: string }>(response);
    this.accessToken = data.access_token;
  }

  private async fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
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

  // Channel endpoints
  async getChannel(channelName: string): Promise<Channel> {
    return this.fetchWithAuth<Channel>(`/channels/${channelName}`);
  }

  async getFollowedChannels(): Promise<Channel[]> {
    return this.fetchWithAuth<Channel[]>('/channels/followed');
  }

  // Chatroom endpoints
  async getChatroomState(channelId: number): Promise<ChatroomState> {
    return this.fetchWithAuth<ChatroomState>(`/channels/${channelId}/chatroom`);
  }

  async sendChatMessage(channelId: number, content: string): Promise<ChatMessage> {
    return this.fetchWithAuth<ChatMessage>(`/channels/${channelId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Websocket connection URL
  getChatWebsocketUrl(channelId: number): string {
    return `wss://ws-us2.pusher.com/app/${this.clientId}/channel-${channelId}`;
  }
}

// Create and export a singleton instance
export const kickApi = new KickApi(
  process.env.KICK_CLIENT_ID!,
  process.env.KICK_CLIENT_SECRET!
); 