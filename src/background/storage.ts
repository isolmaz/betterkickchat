import type { ChannelSettings } from '../types/chat';
import type { Settings } from '../types/settings';

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  fontSize: 14,
  compactMode: false,
  notificationsEnabled: true,
  mentionHighlight: true,
};

const DEFAULT_CHANNEL_SETTINGS: ChannelSettings = {
  enabledFeatures: ['customEmotes', 'betterFormatting', 'userColors'],
  customEmotes: true,
  filters: [],
};

export async function initializeStorage(): Promise<void> {
  try {
    // Initialize sync storage with default settings if not exists
    const { settings } = await chrome.storage.sync.get(['settings']);
    if (!settings) {
      await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
      console.log('[Kick Chat Enhancer] Initialized default settings');
    }

    // Initialize local storage for channel-specific data
    const { channels } = await chrome.storage.local.get(['channels']);
    if (!channels) {
      await chrome.storage.local.set({ channels: {} });
      console.log('[Kick Chat Enhancer] Initialized channels storage');
    }

  } catch (error) {
    console.error('[Kick Chat Enhancer] Storage initialization failed:', error);
    throw error;
  }
}

export async function getSettings(): Promise<Settings> {
  try {
    const { settings } = await chrome.storage.sync.get(['settings']);
    return settings || DEFAULT_SETTINGS;
  } catch (error) {
    console.error('[Kick Chat Enhancer] Failed to get settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(newSettings: Settings): Promise<void> {
  try {
    await chrome.storage.sync.set({ settings: newSettings });
    console.log('[Kick Chat Enhancer] Settings updated:', newSettings);
  } catch (error) {
    console.error('[Kick Chat Enhancer] Failed to update settings:', error);
    throw error;
  }
}

export async function getChannelSettings(channelId: string): Promise<ChannelSettings> {
  try {
    const { channels } = await chrome.storage.local.get(['channels']);
    return channels?.[channelId] || DEFAULT_CHANNEL_SETTINGS;
  } catch (error) {
    console.error(`Failed to get settings for channel ${channelId}:`, error);
    return DEFAULT_CHANNEL_SETTINGS;
  }
}

export async function updateChannelSettings(
  channelId: string,
  settings: Partial<ChannelSettings>
): Promise<void> {
  try {
    const { channels } = await chrome.storage.local.get(['channels']);
    const currentSettings = channels?.[channelId] || DEFAULT_CHANNEL_SETTINGS;
    
    if (!channels) {
      await chrome.storage.local.set({
        channels: {
          [channelId]: { ...DEFAULT_CHANNEL_SETTINGS, ...settings }
        }
      });
    } else {
      channels[channelId] = { ...currentSettings, ...settings };
      await chrome.storage.local.set({ channels });
    }
    
    console.log(`[Kick Chat Enhancer] Updated settings for channel ${channelId}:`, settings);
  } catch (error) {
    console.error(`Failed to update settings for channel ${channelId}:`, error);
    throw error;
  }
} 