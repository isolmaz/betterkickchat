import '../styles/global.css';
import '../styles/chat.css';

interface Settings {
  fontSize: number;
  compactMode: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  fontSize: 14,
  compactMode: false,
};

class KickChatEnhancer {
  private container: HTMLElement | null = null;
  private settings: Settings = DEFAULT_SETTINGS;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load settings
      const result = await chrome.storage.sync.get(['settings']);
      this.settings = result.settings || DEFAULT_SETTINGS;

      // Start observing DOM changes
      this.observeDOM();

      // Listen for settings updates
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'SETTINGS_UPDATED') {
          this.settings = message.settings;
          this.applyStyles(); // Reapply styles when settings change
        }
      });

      console.log('[Better Kick Chat] Content script initialized');
    } catch (error) {
      console.error('[Better Kick Chat] Initialization error:', error);
    }
  }

  private observeDOM(): void {
    // Create an observer instance
    const appObserver = new MutationObserver(() => {
      const chatContainer = document.querySelector('.chatroom-messages');
      if (chatContainer && !this.container) {
        console.log('[Better Kick Chat] Chat container found');
        this.setupChatEnhancements(chatContainer as HTMLElement);
      }
    });

    // Start observing
    appObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private setupChatEnhancements(chatContainer: HTMLElement): void {
    this.container = chatContainer;
    
    // Apply initial styles
    this.applyStyles();

    // Add message observer
    this.observeMessages();

    console.log('[Better Kick Chat] Chat enhancements setup complete');
  }

  private applyStyles(): void {
    if (!this.container) return;

    const styleId = 'better-kick-chat-styles';
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      .chatroom-messages {
        font-size: ${this.settings.fontSize}px !important;
      }
      ${this.settings.compactMode ? `
        .chat-message {
          padding: 2px 8px !important;
          margin: 1px 0 !important;
        }
      ` : ''}
      .chat-message {
        transition: background-color 0.2s ease;
      }
      .chat-message:hover {
        background-color: rgba(255, 255, 255, 0.05) !important;
      }
      .message-time {
        color: #666;
        font-size: 0.8em;
        margin-right: 8px;
      }
    `;

    console.log('[Better Kick Chat] Styles applied');
  }

  private observeMessages(): void {
    if (!this.container) return;

    const messageObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.classList.contains('chat-message')) {
            this.enhanceMessage(node);
          }
        });
      });
    });

    messageObserver.observe(this.container, {
      childList: true,
      subtree: true,
    });

    console.log('[Better Kick Chat] Message observer started');
  }

  private enhanceMessage(messageElement: HTMLElement): void {
    // Add timestamp if not present
    if (!messageElement.querySelector('.message-time')) {
      const timestamp = document.createElement('span');
      timestamp.className = 'message-time';
      timestamp.textContent = new Date().toLocaleTimeString();
      messageElement.insertBefore(timestamp, messageElement.firstChild);
    }
  }
}

// Initialize the enhancer
console.log('[Better Kick Chat] Starting content script');
new KickChatEnhancer(); 