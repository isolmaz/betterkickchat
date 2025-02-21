interface ChatSettings {
  fontSize: number;
  compactMode: boolean;
}

interface ChatSettingsProps {
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
}

export default function ChatSettings({ settings, onSettingsChange }: ChatSettingsProps) {
  return (
    <div className="p-4 border-t border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Chat Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Font Size: {settings.fontSize}px
          </label>
          <input
            type="range"
            min="12"
            max="24"
            value={settings.fontSize}
            onChange={(e) => onSettingsChange({
              ...settings,
              fontSize: parseInt(e.target.value)
            })}
            className="w-full"
          />
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.compactMode}
              onChange={(e) => onSettingsChange({
                ...settings,
                compactMode: e.target.checked
              })}
              className="rounded"
            />
            <span className="text-sm font-medium">Compact Mode</span>
          </label>
        </div>
      </div>
    </div>
  );
} 