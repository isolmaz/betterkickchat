import { useState, useEffect } from 'react';

interface Settings {
  fontSize: number;
  compactMode: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  fontSize: 14,
  compactMode: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // Load settings from storage
    chrome.storage.sync.get(['settings'], (result) => {
      if (result.settings) {
        setSettings(result.settings);
      }
    });
  }, []);

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    // Save settings to storage
    chrome.storage.sync.set({ settings: newSettings });
  };

  return { settings, updateSettings };
} 