const ALARM_NAMES = {
  CLEAN_CACHE: 'cleanCache',
  UPDATE_EMOTES: 'updateEmotes',
  SYNC_SETTINGS: 'syncSettings',
} as const;

const CACHE_RETENTION_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface CachedUser {
  lastSeen: number;
  data: Record<string, unknown>;
}

interface CachedEmote {
  lastUsed: number;
  data: Record<string, unknown>;
}

interface StorageData {
  userCache: Record<string, CachedUser>;
  emoteCache: Record<string, CachedEmote>;
}

export const setupAlarms = (): void => {
  // Set up periodic cache cleaning
  chrome.alarms.create(ALARM_NAMES.CLEAN_CACHE, {
    periodInMinutes: 60 * 24, // Once per day
  });

  // Set up emote updates
  chrome.alarms.create(ALARM_NAMES.UPDATE_EMOTES, {
    periodInMinutes: 60 * 6, // Every 6 hours
  });

  // Set up settings sync
  chrome.alarms.create(ALARM_NAMES.SYNC_SETTINGS, {
    periodInMinutes: 30, // Every 30 minutes
  });

  // Listen for alarms
  chrome.alarms.onAlarm.addListener(handleAlarm);
};

const handleAlarm = async (alarm: chrome.alarms.Alarm): Promise<void> => {
  switch (alarm.name) {
    case ALARM_NAMES.CLEAN_CACHE:
      await cleanCache();
      break;
    case ALARM_NAMES.UPDATE_EMOTES:
      await updateEmotes();
      break;
    case ALARM_NAMES.SYNC_SETTINGS:
      await syncSettings();
      break;
  }
};

const cleanCache = async (): Promise<void> => {
  try {
    const data = await chrome.storage.local.get(['userCache', 'emoteCache']) as StorageData;
    const now = Date.now();

    // Clean user cache
    if (data.userCache) {
      const cleanedUserCache = Object.entries(data.userCache).reduce<Record<string, CachedUser>>((acc, [key, value]) => {
        if (now - value.lastSeen < CACHE_RETENTION_PERIOD) {
          acc[key] = value;
        }
        return acc;
      }, {});

      await chrome.storage.local.set({ userCache: cleanedUserCache });
    }

    // Clean emote cache
    if (data.emoteCache) {
      const cleanedEmoteCache = Object.entries(data.emoteCache).reduce<Record<string, CachedEmote>>((acc, [key, value]) => {
        if (now - value.lastUsed < CACHE_RETENTION_PERIOD) {
          acc[key] = value;
        }
        return acc;
      }, {});

      await chrome.storage.local.set({ emoteCache: cleanedEmoteCache });
    }

    console.log('Cache cleaned successfully');
  } catch (error) {
    console.error('Failed to clean cache:', error);
  }
};

const updateEmotes = async (): Promise<void> => {
  try {
    // TODO: Implement emote update logic when API is available
    console.log('Emote update completed');
  } catch (error) {
    console.error('Failed to update emotes:', error);
  }
};

const syncSettings = async (): Promise<void> => {
  try {
    const syncData = await chrome.storage.sync.get(['settings']);
    const localData = await chrome.storage.local.get(['channels']);

    // Merge sync settings with local channel settings
    if (localData.channels) {
      Object.values(localData.channels).forEach((channelSettings: any) => {
        channelSettings.theme = syncData.settings.theme;
      });

      await chrome.storage.local.set({ channels: localData.channels });
    }

    console.log('Settings synced successfully');
  } catch (error) {
    console.error('Failed to sync settings:', error);
  }
}; 