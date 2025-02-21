import { Settings } from '../types/settings';

class KickChatEnhancer {
  private container: HTMLElement | null = null;
  private settings: Settings | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load settings
    const result = await chrome.storage.sync.get(['settings']);
    this.settings = result.settings;

    // Start observing DOM changes
    this.observeDOM();

    // Listen for settings updates
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'SETTINGS_UPDATED') {
        this.settings = message.settings;
      }
    });
  }

  private observeDOM(): void {
    // Create an observer instance
    const appObserver = new MutationObserver(() => {
      const chatContainer = document.querySelector('.chat-container');
      if (chatContainer && !this.container) {
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
  }

  private applyStyles(): void {
    if (!this.container || !this.settings) return;

    const style = document.createElement('style');
    style.textContent = `
      .chat-container {
        font-size: ${this.settings.fontSize}px;
      }
      ${this.settings.compactMode ? `
        .chat-message {
          padding: 2px 8px;
        }
      ` : ''}
    `;

    document.head.appendChild(style);
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
  }

  private enhanceMessage(messageElement: HTMLElement): void {
    if (!this.settings) return;

    // Add hover effects
    messageElement.style.transition = 'background-color 0.2s';
    messageElement.addEventListener('mouseenter', () => {
      messageElement.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    });
    messageElement.addEventListener('mouseleave', () => {
      messageElement.style.backgroundColor = '';
    });

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
new KickChatEnhancer(); 