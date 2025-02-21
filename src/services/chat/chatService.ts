import { kickApi } from '../api/kickApi';
import { ChatWebSocketManager } from './websocketManager';
import { ChatMessage, ChatroomState, Channel } from '../api/types';

export class ChatService {
  private webSocket: ChatWebSocketManager;
  private currentChannel: Channel | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private stateHandlers: ((state: ChatroomState) => void)[] = [];

  constructor() {
    this.webSocket = new ChatWebSocketManager({
      onMessage: this.handleIncomingMessage.bind(this),
      onError: this.handleError.bind(this),
      onReconnect: this.handleReconnect.bind(this),
    });
  }

  async connectToChannel(channelName: string): Promise<void> {
    try {
      // Get channel information
      const channel = await kickApi.getChannel(channelName);
      this.currentChannel = channel;

      // Get initial chatroom state
      const chatroomState = await kickApi.getChatroomState(channel.id);
      this.notifyStateHandlers(chatroomState);

      // Connect to WebSocket
      this.webSocket.connect(channel.id);
    } catch (error) {
      console.error('Error connecting to channel:', error);
      throw error;
    }
  }

  async sendMessage(content: string): Promise<void> {
    if (!this.currentChannel) {
      throw new Error('Not connected to any channel');
    }

    try {
      // Send through REST API
      await kickApi.sendChatMessage(this.currentChannel.id, content);
      
      // Also send through WebSocket for immediate feedback
      this.webSocket.sendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  onMessage(handler: (message: ChatMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onStateChange(handler: (state: ChatroomState) => void): () => void {
    this.stateHandlers.push(handler);
    return () => {
      this.stateHandlers = this.stateHandlers.filter(h => h !== handler);
    };
  }

  private handleIncomingMessage(message: ChatMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private notifyStateHandlers(state: ChatroomState): void {
    this.stateHandlers.forEach(handler => {
      try {
        handler(state);
      } catch (error) {
        console.error('Error in state handler:', error);
      }
    });
  }

  private handleError(error: Error): void {
    console.error('Chat service error:', error);
    // Implement error handling strategy (e.g., show user notification)
  }

  private async handleReconnect(): Promise<void> {
    if (this.currentChannel) {
      try {
        const chatroomState = await kickApi.getChatroomState(this.currentChannel.id);
        this.notifyStateHandlers(chatroomState);
      } catch (error) {
        console.error('Error fetching chatroom state after reconnect:', error);
      }
    }
  }

  disconnect(): void {
    this.webSocket.disconnect();
    this.currentChannel = null;
  }
}

// Export a singleton instance
export const chatService = new ChatService(); 