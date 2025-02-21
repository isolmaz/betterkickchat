import { initializeStorage } from './storage';

// Initialize when the service worker is installed
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Kick Chat Enhancer] Service worker installed');
  try {
    await initializeStorage();
    console.log('[Kick Chat Enhancer] Storage initialized');
  } catch (error) {
    console.error('[Kick Chat Enhancer] Failed to initialize:', error);
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Kick Chat Enhancer] Background received message:', message);

  try {
    switch (message.type) {
      case 'NEW_CHAT_MESSAGE':
        handleChatMessage(message.message, sendResponse);
        break;
      case 'SETTINGS_UPDATED':
        handleSettingsUpdate(message.settings, sender.tab?.id, sendResponse);
        break;
      default:
        console.warn('[Kick Chat Enhancer] Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('[Kick Chat Enhancer] Error handling message:', error);
    sendResponse({ success: false, error: 'Internal error' });
  }

  // Required for async response handling
  return true;
});

// Handle incoming chat messages
async function handleChatMessage(message: any, sendResponse: (response: any) => void) {
  try {
    // Get channel settings
    const { channels } = await chrome.storage.local.get(['channels']);
    const settings = channels?.[message.channelId] || {};
    console.log('[Kick Chat Enhancer] Channel settings:', settings);

    // Apply filters and return appropriate action
    sendResponse({ action: 'show' }); // Default action
  } catch (error) {
    console.error('[Kick Chat Enhancer] Error handling chat message:', error);
    sendResponse({ action: 'show' });
  }
}

// Handle settings updates
async function handleSettingsUpdate(settings: any, tabId: number | undefined, sendResponse: (response: any) => void) {
  try {
    if (tabId) {
      try {
        await chrome.tabs.sendMessage(tabId, { 
          type: 'SETTINGS_UPDATED', 
          settings 
        });
        sendResponse({ success: true });
      } catch (error) {
        console.error('[Kick Chat Enhancer] Failed to notify content script:', error);
        sendResponse({ success: false, error: 'Failed to notify content script' });
      }
    } else {
      sendResponse({ success: false, error: 'No tab ID provided' });
    }
  } catch (error) {
    console.error('[Kick Chat Enhancer] Error updating settings:', error);
    sendResponse({ success: false, error: 'Failed to update settings' });
  }
}

// Listen for navigation to kick.com
chrome.webNavigation.onCompleted.addListener(
  async (details) => {
    // Only handle main frame navigation
    if (details.frameId === 0) {
      try {
        // Wait a bit for the page to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if the tab still exists
        const tab = await chrome.tabs.get(details.tabId);
        if (tab.url?.includes('kick.com')) {
          await chrome.tabs.sendMessage(details.tabId, { type: 'PAGE_LOADED' });
          console.log('[Kick Chat Enhancer] Notified content script of page load');
        }
      } catch (error) {
        console.error('[Kick Chat Enhancer] Failed to notify content script:', error);
      }
    }
  },
  { 
    url: [{ hostContains: 'kick.com' }] 
  }
);

// Keep service worker alive
setInterval(() => {
  console.log('[Kick Chat Enhancer] Service worker heartbeat');
}, 20000);

console.log('[Kick Chat Enhancer] Service worker initialized'); 