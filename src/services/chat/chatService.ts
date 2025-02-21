import { kickApi } from '../api/kickApi';
import { KickChannel, ChatroomState } from '../api/types';
import { ChatWebSocketManager, ChatEventHandlers } from './websocketManager';

export class ChatService {
  public readonly wsManager: ChatWebSocketManager;
  private currentChannel: KickChannel | null = null;
  private chatroomState: ChatroomState | null = null;

  constructor(handlers: ChatEventHandlers = {}) {
    this.wsManager = new ChatWebSocketManager(handlers);
  }

  async connectToChannel(channel: KickChannel): Promise<void> {
    try {
      this.currentChannel = {
        ...channel,
        followers_count: channel.followers_count || 0
      };

      // Get initial chatroom state
      const chatroomState = await kickApi.getChatroomState(channel.id);
      this.chatroomState = chatroomState;

      // Connect WebSocket
      this.wsManager.connect(channel.id);
    } catch (error) {
      console.error('Failed to connect to channel:', error);
      throw error instanceof Error ? error : new Error('Failed to connect to channel');
    }
  }

  disconnect(): void {
    this.wsManager.disconnect();
    this.currentChannel = null;
    this.chatroomState = null;
  }

  async sendMessage(content: string): Promise<void> {
    if (!this.currentChannel) {
      throw new Error('Not connected to a channel');
    }

    try {
      await kickApi.sendChatMessage(this.currentChannel.id, content);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error instanceof Error ? error : new Error('Failed to send message');
    }
  }

  getCurrentChannel(): KickChannel | null {
    return this.currentChannel;
  }

  getChatroomState(): ChatroomState | null {
    return this.chatroomState;
  }

  async refreshChatroomState(): Promise<void> {
    if (!this.currentChannel) {
      throw new Error('Not connected to a channel');
    }

    try {
      const chatroomState = await kickApi.getChatroomState(this.currentChannel.id);
      this.chatroomState = chatroomState;
    } catch (error) {
      console.error('Failed to refresh chatroom state:', error);
      throw error instanceof Error ? error : new Error('Failed to refresh chatroom state');
    }
  }
}

// Export a singleton instance
export const chatService = new ChatService(); 