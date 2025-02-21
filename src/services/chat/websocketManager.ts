import { ChatMessage } from '../api/types';
import { kickApi } from '../api/kickApi';

interface ChatEventHandlers {
  onMessage?: (message: ChatMessage) => void;
  onSubscription?: (data: any) => void;
  onFollow?: (data: any) => void;
  onError?: (error: Error) => void;
  onReconnect?: () => void;
}

export class ChatWebSocketManager {
  private ws: WebSocket | null = null;
  private channelId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number = 1000; // Start with 1 second

  constructor(private handlers: ChatEventHandlers = {}) {}

  connect(channelId: number): void {
    this.channelId = channelId;
    const url = kickApi.getChatWebsocketUrl(channelId);
    
    try {
      this.ws = new WebSocket(url);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleError(new Error(error instanceof Error ? error.message : 'Failed to connect'));
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectTimeout = 1000;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.attemptReconnect();
    };

    this.ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.handleError(new Error('WebSocket connection error'));
    };
  }

  private handleMessage(data: any): void {
    switch (data.event) {
      case 'chat_message':
        this.handlers.onMessage?.(data.message);
        break;
      case 'subscription':
        this.handlers.onSubscription?.(data);
        break;
      case 'follow':
        this.handlers.onFollow?.(data);
        break;
      default:
        console.log('Unhandled message type:', data.event);
    }
  }

  private handleError(error: Error): void {
    this.handlers.onError?.(error);
    this.attemptReconnect();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.reconnectAttempts++;
      this.handlers.onReconnect?.();
      
      if (this.channelId) {
        this.connect(this.channelId);
      }
      
      // Exponential backoff
      this.reconnectTimeout *= 2;
    }, this.reconnectTimeout);
  }

  sendMessage(content: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify({
      event: 'chat_message',
      data: { content }
    }));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
} 