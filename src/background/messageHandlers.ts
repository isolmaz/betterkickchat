import type { ChatMessage } from '../types/chat';
import { getChannelSettings, updateChannelSettings } from './storage';

type MessageHandler = (
  message: any,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => void | Promise<void>;

const handlers: Record<string, MessageHandler> = {
  // Handle getting channel settings
  GET_CHANNEL_SETTINGS: async (message, _sender, sendResponse) => {
    const settings = await getChannelSettings(message.channelId);
    sendResponse(settings);
  },

  // Handle updating channel settings
  UPDATE_CHANNEL_SETTINGS: async (message, _sender, sendResponse) => {
    await updateChannelSettings(message.channelId, message.settings);
    sendResponse({ success: true });
  },

  // Handle new chat messages
  NEW_CHAT_MESSAGE: async (message: { message: ChatMessage }, _sender, sendResponse) => {
    const settings = await getChannelSettings(message.message.channelId);
    
    // Apply message filters
    const shouldHide = settings.filters.some(filter => {
      if (!filter.isEnabled) return false;
      
      switch (filter.type) {
        case 'user':
          return message.message.user.username === filter.pattern;
        case 'keyword':
          return message.message.content.toLowerCase().includes(filter.pattern.toLowerCase());
        case 'regex':
          try {
            return new RegExp(filter.pattern).test(message.message.content);
          } catch {
            return false;
          }
      }
    });

    if (shouldHide) {
      sendResponse({ action: 'hide' });
      return;
    }

    // Check for highlights
    const highlight = settings.filters.find(filter => 
      filter.isEnabled && 
      filter.action === 'highlight' &&
      (filter.type === 'keyword' && message.message.content.toLowerCase().includes(filter.pattern.toLowerCase()))
    );

    if (highlight) {
      sendResponse({ action: 'highlight', color: highlight.color });
      return;
    }

    sendResponse({ action: 'show' });
  },
};

export const setupMessageHandlers = (): void => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handler = handlers[message.type];
    if (!handler) {
      console.warn(`No handler found for message type: ${message.type}`);
      sendResponse({ error: 'Invalid message type' });
      return false;
    }

    // Handle both synchronous and asynchronous responses
    const response = handler(message, sender, sendResponse);
    if (response instanceof Promise) {
      response.catch(error => {
        console.error('Error handling message:', error);
        sendResponse({ error: error.message });
      });
      return true; // Will respond asynchronously
    }

    return false; // Responded synchronously
  });
}; 