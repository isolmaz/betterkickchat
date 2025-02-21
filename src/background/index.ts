// Import Chrome types
/// <reference types="chrome"/>

import { KickApi } from '../services/api/kickApi';

// Constants
const HEARTBEAT_INTERVAL = 20000;

// Service worker state
let isInitialized = false;

// Initialize APIs after service worker is ready
chrome.runtime.onStartup.addListener(initializeServiceWorker);
chrome.runtime.onInstalled.addListener(initializeServiceWorker);

// Service worker initialization
async function initializeServiceWorker() {
  if (isInitialized) return;
  
  console.log('[Better Kick Chat] Initializing service worker');

  try {
    // Initialize default settings
    await chrome.storage.sync.set({
      settings: {
        fontSize: 14,
        compactMode: false,
      }
    });
    console.log('[Better Kick Chat] Default settings saved');

    // Set up navigation monitoring if available
    if (chrome.webNavigation) {
      chrome.webNavigation.onCompleted.addListener(
        handleNavigation,
        { url: [{ hostContains: 'kick.com' }] }
      );
      console.log('[Better Kick Chat] Navigation listener set up');
    } else {
      console.warn('[Better Kick Chat] webNavigation API not available');
    }

    // Set up message listeners
    chrome.runtime.onMessage.addListener(handleMessage);
    console.log('[Better Kick Chat] Message listener set up');

    // Keep service worker alive
    setInterval(heartbeat, HEARTBEAT_INTERVAL);

    isInitialized = true;
    console.log('[Better Kick Chat] Service worker initialized');
  } catch (error) {
    console.error('[Better Kick Chat] Initialization error:', error);
  }
}

// Heartbeat function to keep service worker alive
function heartbeat() {
  console.log('[Better Kick Chat] Service worker heartbeat');
}

// Handle page navigation
async function handleNavigation(details: chrome.webNavigation.WebNavigationFramedCallbackDetails) {
  if (details.frameId === 0) {
    try {
      // Wait for page to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const tab = await chrome.tabs.get(details.tabId);
      if (tab.url?.includes('kick.com')) {
        await chrome.tabs.sendMessage(details.tabId, { type: 'PAGE_LOADED' });
        console.log('[Better Kick Chat] Notified content script of page load');
      }
    } catch (error) {
      console.error('[Better Kick Chat] Navigation handler error:', error);
    }
  }
}

// Handle extension messages
function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  console.log('[Better Kick Chat] Message received:', message);

  switch (message.type) {
    case 'GET_SETTINGS':
      chrome.storage.sync.get(['settings'], (result) => {
        sendResponse(result.settings);
      });
      return true;

    case 'SAVE_SETTINGS':
      handleSettingsUpdate(message.settings, sender.tab?.id, sendResponse);
      return true;

    case 'CHAT_MESSAGE':
      handleChatMessage(message, sendResponse);
      return true;

    default:
      console.log('[Better Kick Chat] Unknown message type:', message.type);
      return false;
  }
}

// Handle chat messages
async function handleChatMessage(message: any, sendResponse: (response: any) => void) {
  try {
    const { token } = await chrome.storage.sync.get(['token']);
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Send chat message using Kick API
    if (message.content) {
      const response = await fetch(`${KickApi.API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message.content,
          channel_id: message.channelId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send message');
      }
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Better Kick Chat] Chat message handler error:', error);
    sendResponse({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    });
  }
}

// Handle settings updates
async function handleSettingsUpdate(
  settings: any,
  tabId: number | undefined,
  sendResponse: (response: any) => void
) {
  try {
    await chrome.storage.sync.set({ settings });

    if (tabId) {
      // Notify the specific tab that sent the message
      await chrome.tabs.sendMessage(tabId, {
        type: 'SETTINGS_UPDATED',
        settings
      });

      // Notify other tabs on kick.com
      const tabs = await chrome.tabs.query({ url: 'https://kick.com/*' });
      await Promise.all(tabs.map(async tab => {
        if (tab.id && tab.id !== tabId) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'SETTINGS_UPDATED',
              settings
            });
          } catch (error) {
            console.warn(`[Better Kick Chat] Failed to notify tab ${tab.id}:`, error);
          }
        }
      }));

      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'No tab ID provided' });
    }
  } catch (error) {
    console.error('[Better Kick Chat] Settings update error:', error);
    sendResponse({ success: false, error: 'Failed to update settings' });
  }
} 