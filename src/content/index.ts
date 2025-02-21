import { ChatWebSocket } from '../services/websocket';
import type { ChatMessage } from '../types/chat';

interface Settings {
  theme: string;
  fontSize: number;
  compactMode: boolean;
  notificationsEnabled: boolean;
  mentionHighlight: boolean;
}

class ChatEnhancer {
  private webSocket: ChatWebSocket | null = null;
  private chatContainer: HTMLElement | null = null;
  private observer: MutationObserver | null = null;
  private channelId: string | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private settings: Settings = {
    theme: 'dark',
    fontSize: 14,
    compactMode: false,
    notificationsEnabled: true,
    mentionHighlight: true,
  };

  constructor() {
    console.log('[Kick Chat Enhancer] Constructor called');
    // Initialize when we detect we're on a channel page
    this.initializeOnChannelPage();
  }

  private initializeOnChannelPage(): void {
    // Check if we're on a channel page
    const channelMatch = window.location.pathname.match(/\/([^\/]+)$/);
    if (!channelMatch) {
      console.log('[Kick Chat Enhancer] Not on a channel page');
      return;
    }

    this.channelId = channelMatch[1];
    console.log('[Kick Chat Enhancer] On channel:', this.channelId);

    // Set up a mutation observer to wait for the React app to mount
    const appObserver = new MutationObserver((mutations, obs) => {
      // Look for the main chat container div
      const chatApp = document.querySelector('[data-app="kick-chat-app"]');
      if (chatApp) {
        console.log('[Kick Chat Enhancer] Found chat app container');
        obs.disconnect();
        this.initialize();
      }
    });

    // Observe the entire document for the chat app mount
    appObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  private async initialize(): Promise<void> {
    try {
      console.log('[Kick Chat Enhancer] Initializing...');
      
      // Load settings first
      await this.loadSettings();

      // Connect to Kick's WebSocket
      await this.connectToChat();

      // Set up message observer
      this.setupMessageObserver();

      // Add our custom styles
      this.injectStyles();

      console.log('[Kick Chat Enhancer] Initialization complete');
    } catch (error) {
      console.error('[Kick Chat Enhancer] Initialization failed:', error);
    }
  }

  private async connectToChat(): Promise<void> {
    if (!this.channelId) return;

    try {
      // Initialize WebSocket connection to Kick's chat server
      this.webSocket = new ChatWebSocket(this.handleNewMessage.bind(this));
      await this.webSocket.connect(this.channelId);
      
      console.log('[Kick Chat Enhancer] Connected to chat WebSocket');
    } catch (error) {
      console.error('[Kick Chat Enhancer] Failed to connect to chat:', error);
    }
  }

  private setupMessageObserver(): void {
    // Find the messages container
    const messagesContainer = document.querySelector('#chatroom-messages');
    if (!messagesContainer) {
      console.warn('[Kick Chat Enhancer] Messages container not found');
      return;
    }

    this.chatContainer = messagesContainer as HTMLElement;
    console.log('[Kick Chat Enhancer] Found messages container');

    // Observe for new messages
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.classList.contains('chat-message')) {
              this.enhanceMessage(node);
            }
          });
        }
      });
    });

    this.observer.observe(this.chatContainer, {
      childList: true,
      subtree: true
    });
  }

  private injectStyles(): void {
    if (this.styleElement) {
      this.styleElement.remove();
    }

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'kick-chat-enhancer-styles';
    this.styleElement.textContent = `
      .chat-message {
        font-size: ${this.settings.fontSize}px !important;
        transition: background-color 0.2s ease;
      }
      
      .chat-message:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .chat-message.highlighted {
        background-color: var(--highlight-color, rgba(255, 214, 0, 0.2));
      }

      ${this.settings.compactMode ? `
        .chat-message {
          padding: 2px 4px !important;
          margin: 1px 0 !important;
        }
      ` : ''}
    `;
    
    document.head.appendChild(this.styleElement);
  }

  private async loadSettings(): Promise<void> {
    try {
      console.log('[Kick Chat Enhancer] Loading settings...');
      const result = await chrome.storage.sync.get(['settings']);
      if (result.settings) {
        console.log('[Kick Chat Enhancer] Settings loaded:', result.settings);
        this.settings = result.settings;
        this.applySettings();
      } else {
        console.log('[Kick Chat Enhancer] No settings found, using defaults');
      }
    } catch (error) {
      console.error('[Kick Chat Enhancer] Failed to load settings:', error);
    }
  }

  private async handleNewMessage(message: ChatMessage): Promise<void> {
    // Send message to background script for processing
    const response = await chrome.runtime.sendMessage({
      type: 'NEW_CHAT_MESSAGE',
      message,
    });

    // Handle the response
    switch (response?.action) {
      case 'hide':
        // Message should be hidden based on filters
        return;
      case 'highlight':
        // Message should be highlighted
        this.highlightMessage(message, response.color);
        break;
      case 'show':
      default:
        // Normal message display
        this.displayMessage(message);
    }
  }

  private enhanceMessage(messageElement: HTMLElement): void {
    // Add enhanced styling and functionality to existing messages
    messageElement.classList.add('enhanced-message');
    
    // Add data-index attribute for message tracking
    if (!messageElement.hasAttribute('data-index')) {
      messageElement.setAttribute('data-index', crypto.randomUUID());
    }

    // Add hover interactions for message actions
    messageElement.addEventListener('mouseenter', () => {
      const actionsElement = messageElement.querySelector('#chat-message-actions');
      if (actionsElement) {
        actionsElement.classList.remove('hidden');
        actionsElement.classList.add('flex');
      }
    });

    messageElement.addEventListener('mouseleave', () => {
      const actionsElement = messageElement.querySelector('#chat-message-actions');
      if (actionsElement) {
        actionsElement.classList.add('hidden');
        actionsElement.classList.remove('flex');
      }
    });
  }

  private displayMessage(message: ChatMessage): void {
    if (!this.chatContainer) return;

    const messageElement = document.createElement('div');
    messageElement.setAttribute('data-index', crypto.randomUUID());
    messageElement.classList.add('absolute', 'inset-x-0', 'top-0');
    messageElement.style.transform = `translateY(${this.getNextMessagePosition()}px)`;
    messageElement.innerHTML = this.formatMessage(message);
    
    this.chatContainer.appendChild(messageElement);
    this.enhanceMessage(messageElement);
  }

  private getNextMessagePosition(): number {
    if (!this.chatContainer) return 0;
    const messages = this.chatContainer.children;
    return messages.length * 40; // Approximate height of each message
  }

  private highlightMessage(message: ChatMessage, color: string): void {
    if (!this.chatContainer) return;

    const messageElement = document.createElement('div');
    messageElement.classList.add('enhanced-message', 'highlighted');
    messageElement.style.setProperty('--highlight-color', color);
    messageElement.innerHTML = this.formatMessage(message);
    
    this.chatContainer.appendChild(messageElement);
    this.enhanceMessage(messageElement);
  }

  private formatMessage(message: ChatMessage): string {
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    
    return `
      <div class="betterhover:group-hover:bg-shade-lower w-full min-w-0 shrink-0 break-words rounded-lg px-2 py-1">
        <div class="group relative px-2 lg:px-3">
          <div class="betterhover:group-hover:bg-shade-lower w-full min-w-0 shrink-0 break-words rounded-lg">
            <span class="text-neutral pr-1 font-semibold" style="display: var(--chatroom-timestamp-display)">
              ${timestamp}
            </span>
            <span class="inline-flex font-bold" aria-hidden="true">
              ${message.user.displayName}:
            </span>
            <span class="inline-flex min-w-0 flex-nowrap items-baseline rounded">
              ${message.content}
            </span>
          </div>
          <div id="chat-message-actions" class="betterhover:group-hover:flex bg-surface-higher first:of z-common border-grey-600 absolute -top-4 right-0 hidden items-center rounded-full border border-shadow-md">
            <!-- Action buttons would go here -->
          </div>
        </div>
      </div>
    `;
  }

  private formatMessageContent(message: ChatMessage): string {
    let content = message.content;
    
    // Process emotes
    message.emotes.forEach(emote => {
      const emoteImg = `<img src="${emote.url}" alt="${emote.code}" title="${emote.code}" class="emote inline-block align-middle" />`;
      content = content.replace(emote.code, emoteImg);
    });
    
    // Process URLs
    content = content.replace(
      /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$1</a>'
    );
    
    return `<span class="font-normal leading-[1.55]">${content}</span>`;
  }

  private applySettings(): void {
    if (!this.chatContainer) {
      console.warn('[Kick Chat Enhancer] Chat container not found, will retry when available');
      return;
    }

    console.log('[Kick Chat Enhancer] Applying settings:', this.settings);

    try {
      // Apply theme
      document.body.setAttribute('data-theme', this.settings.theme);

      // Apply compact mode
      this.chatContainer.classList.toggle('compact-mode', this.settings.compactMode);

      // Update all styles
      this.injectStyles();

      console.log('[Kick Chat Enhancer] Settings applied successfully');
    } catch (error) {
      console.error('[Kick Chat Enhancer] Error applying settings:', error);
    }
  }

  private async handleSettingsUpdate(newSettings: Settings): Promise<void> {
    console.log('[Kick Chat Enhancer] Updating settings from:', this.settings, 'to:', newSettings);
    this.settings = newSettings;
    this.applySettings();
  }
}

// Initialize the chat enhancer when the content script loads
try {
  console.log('[Kick Chat Enhancer] Content script starting...');
  const enhancer = new ChatEnhancer();
  
  // Make it available for debugging
  (window as any).__kickChatEnhancer = enhancer;
  
  console.log('[Kick Chat Enhancer] Content script initialized successfully');
} catch (error) {
  console.error('[Kick Chat Enhancer] Failed to initialize content script:', error);
} 