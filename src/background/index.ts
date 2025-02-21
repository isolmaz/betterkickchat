// Import Chrome types
/// <reference types="chrome"/>

// Listen for installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Better Kick Chat] Extension installed');

  // Set default settings
  const defaultSettings = {
    fontSize: 14,
    compactMode: false,
  };

  try {
    await chrome.storage.sync.set({ settings: defaultSettings });
    console.log('[Better Kick Chat] Default settings saved');
  } catch (error) {
    console.error('[Better Kick Chat] Error saving default settings:', error);
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Better Kick Chat] Message received:', message);

  // Handle different message types
  switch (message.type) {
    case 'GET_SETTINGS':
      chrome.storage.sync.get(['settings'], (result) => {
        sendResponse(result.settings);
      });
      return true; // Will respond asynchronously

    case 'SAVE_SETTINGS':
      chrome.storage.sync.set({ settings: message.settings }, () => {
        // Notify all tabs about the settings change
        chrome.tabs.query({ url: 'https://kick.com/*' }, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'SETTINGS_UPDATED',
                settings: message.settings
              });
            }
          });
        });
        sendResponse({ success: true });
      });
      return true; // Will respond asynchronously

    case 'OAUTH_CALLBACK':
      handleOAuthCallback(message.code, sendResponse);
      return true; // Will respond asynchronously

    default:
      console.log('[Better Kick Chat] Unknown message type:', message.type);
  }
});

// Handle OAuth callback
async function handleOAuthCallback(code: string, sendResponse: (response: any) => void) {
  try {
    console.log('[Better Kick Chat] Received OAuth code:', code);

    // Exchange code for access token
    const response = await fetch('https://kick.com/api/v2/oauth/token', {
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
    console.log('[Better Kick Chat] OAuth token received');

    // Save the access token
    await chrome.storage.local.set({
      auth: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
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

// Refresh token before it expires
async function refreshAccessToken() {
  try {
    const { auth } = await chrome.storage.local.get(['auth']);
    if (!auth?.refreshToken) return;

    // Check if token needs refresh (5 minutes before expiry)
    if (auth.expiresAt - Date.now() > 5 * 60 * 1000) return;

    console.log('[Better Kick Chat] Refreshing access token');

    const response = await fetch('https://kick.com/api/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: process.env.KICK_CLIENT_ID,
        client_secret: process.env.KICK_CLIENT_SECRET,
        refresh_token: auth.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Better Kick Chat] Token refreshed');

    // Save the new tokens
    await chrome.storage.local.set({
      auth: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
      },
    });
  } catch (error: unknown) {
    console.error('[Better Kick Chat] Token refresh error:', error);
  }
}

// Check token every minute
setInterval(refreshAccessToken, 60 * 1000);

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
if (chrome.webNavigation) {
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
} else {
  console.error('[Kick Chat Enhancer] webNavigation API not available');
}

// Keep service worker alive
setInterval(() => {
  console.log('[Kick Chat Enhancer] Service worker heartbeat');
}, 20000);

console.log('[Kick Chat Enhancer] Service worker initialized'); 