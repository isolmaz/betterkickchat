import type { ChatMessage } from '../types/chat';

interface KickChatOptions {
  key: string;
  cluster: string;
  channelId: string;
}

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private channelId: string | null = null;
  private messageHandler: (message: ChatMessage) => void;
  private options: KickChatOptions = {
    key: 'eb1d5f283081a78b932c',
    cluster: 'us2',
    channelId: ''
  };

  constructor(messageHandler: (message: ChatMessage) => void) {
    this.messageHandler = messageHandler;
  }

  public async connect(channelId: string): Promise<void> {
    this.channelId = channelId;
    this.options.channelId = channelId;

    return new Promise((resolve, reject) => {
      try {
        // Connect to Kick's WebSocket server using their Pusher implementation
        const wsUrl = `wss://ws-${this.options.cluster}.pusher.com/app/${this.options.key}`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('[Kick Chat Enhancer] WebSocket connected');
          this.subscribe();
          resolve();
        };

        this.ws.onmessage = this.handleMessage.bind(this);
        this.ws.onerror = (error) => {
          console.error('[Kick Chat Enhancer] WebSocket error:', error);
          reject(error);
        };
        this.ws.onclose = () => {
          console.log('[Kick Chat Enhancer] WebSocket closed');
          this.reconnect();
        };
      } catch (error) {
        console.error('[Kick Chat Enhancer] Failed to connect:', error);
        reject(error);
      }
    });
  }

  private subscribe(): void {
    if (!this.ws || !this.channelId) return;

    // Subscribe to the channel's chat events
    const subscribeMessage = {
      event: 'pusher:subscribe',
      data: {
        auth: '',
        channel: `channel.${this.channelId}`
      }
    };

    this.ws.send(JSON.stringify(subscribeMessage));
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.event) {
        case 'App\\Events\\ChatMessageEvent':
          const chatMessage = this.parseChatMessage(data.data);
          this.messageHandler(chatMessage);
          break;
        case 'pusher:connection_established':
          console.log('[Kick Chat Enhancer] Pusher connection established');
          break;
        case 'pusher:subscribe':
          console.log('[Kick Chat Enhancer] Successfully subscribed to channel');
          break;
        default:
          // Handle other event types if needed
          break;
      }
    } catch (error) {
      console.error('[Kick Chat Enhancer] Error handling message:', error);
    }
  }

  private parseChatMessage(data: any): ChatMessage {
    return {
      id: data.id,
      channelId: this.channelId || '',
      content: data.content,
      timestamp: new Date(data.created_at).getTime(),
      user: {
        id: data.sender.id,
        username: data.sender.username,
        displayName: data.sender.displayname,
        color: data.sender.identity.color,
        badges: this.parseBadges(data.sender.identity.badges)
      },
      emotes: this.parseEmotes(data.content, data.emotes),
      isAction: false,
      isHighlighted: false,
      isDeleted: false
    };
  }

  private parseBadges(badges: any[]): any[] {
    return badges.map(badge => ({
      type: badge.type,
      label: badge.text
    }));
  }

  private parseEmotes(content: string, emotes: any[]): any[] {
    return emotes.map(emote => ({
      code: emote.name,
      url: emote.src,
      start: emote.start,
      end: emote.end
    }));
  }

  private reconnect(): void {
    if (this.channelId) {
      setTimeout(() => {
        console.log('[Kick Chat Enhancer] Attempting to reconnect...');
        this.connect(this.channelId!);
      }, 5000);
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.channelId = null;
  }
} 