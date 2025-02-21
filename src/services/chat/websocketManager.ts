import { ChatMessage } from '../api/types';
import { KickApi } from '../api/kickApi';

export interface ChatEventHandlers {
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
  private handlers: ChatEventHandlers;

  constructor(handlers: ChatEventHandlers = {}) {
    this.handlers = handlers;
  }

  setHandlers(handlers: ChatEventHandlers): void {
    this.handlers = handlers;
  }

  connect(channelId: number): void {
    this.channelId = channelId;
    const url = KickApi.getChatWebsocketUrl(channelId);
    
    try {
      this.ws = new WebSocket(url);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleError(new Error(error instanceof Error ? error.message : 'Failed to connect'));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.channelId = null;
    this.reconnectAttempts = 0;
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
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
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleError(new Error('WebSocket connection error'));
    };
  }

  private handleMessage(data: any): void {
    switch (data.event) {
      case 'message':
        this.handlers.onMessage?.(data.data);
        break;
      case 'subscription':
        this.handlers.onSubscription?.(data.data);
        break;
      case 'follow':
        this.handlers.onFollow?.(data.data);
        break;
      default:
        console.log('Unhandled event type:', data.event);
    }
  }

  private handleError(error: Error): void {
    this.handlers.onError?.(error);
    this.handleReconnect();
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const timeout = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${timeout}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => {
      if (this.channelId) {
        this.connect(this.channelId);
        this.handlers.onReconnect?.();
      }
    }, timeout);
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
} 