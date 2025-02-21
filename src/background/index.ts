// Import Chrome types
/// <reference types="chrome"/>

// Constants
const KICK_API_BASE = 'https://kick.com/api/v2';
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

    case 'OAUTH_CALLBACK':
      handleOAuthCallback(message.code, sendResponse);
      return true;

    case 'CHAT_MESSAGE':
      handleChatMessage(message, sendResponse);
      return true;

    default:
      console.log('[Better Kick Chat] Unknown message type:', message.type);
      return false;
  }
}

// Handle OAuth callback
async function handleOAuthCallback(code: string, sendResponse: (response: any) => void) {
  try {
    console.log('[Better Kick Chat] Processing OAuth callback');

    // Exchange code for access token using Kick's OAuth 2.1 endpoint
    const response = await fetch(`${KICK_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.KICK_CLIENT_ID,
        client_secret: process.env.KICK_CLIENT_SECRET,
        code,
        redirect_uri: 'https://isolmaz.github.io/betterkickchat/oauth-callback.html',
      }),
    });

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Verify token using Kick's introspection endpoint
    const introspectResponse = await fetch(`${KICK_API_BASE}/token/introspect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!introspectResponse.ok) {
      throw new Error('Token validation failed');
    }

    // Save the validated token
    await chrome.storage.local.set({
      auth: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
        scopes: data.scope.split(' '),
      },
    });

    console.log('[Better Kick Chat] Auth data saved');
    sendResponse({ success: true });
  } catch (error: unknown) {
    console.error('[Better Kick Chat] OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    sendResponse({ success: false, error: errorMessage });
  }
}

// Handle chat messages
async function handleChatMessage(message: any, sendResponse: (response: any) => void) {
  try {
    const { channels } = await chrome.storage.local.get(['channels']);
    const settings = channels?.[message.channelId] || {};
    console.log('[Better Kick Chat] Channel settings:', settings);

    sendResponse({ action: 'show' });
  } catch (error) {
    console.error('[Better Kick Chat] Chat message handler error:', error);
    sendResponse({ action: 'show' });
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