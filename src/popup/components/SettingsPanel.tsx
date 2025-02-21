import { ChangeEvent } from 'react';
import {
  Box,
  FormControlLabel,
  Switch,
  Slider,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import type { Settings } from '../../types/settings';

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const handleSwitchChange = (key: keyof Settings) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    onSettingsChange({
      ...settings,
      [key]: event.target.checked,
    });
  };

  const handleSliderChange = (_: Event | null, value: number | number[]) => {
    onSettingsChange({
      ...settings,
      fontSize: Array.isArray(value) ? value[0] : value,
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Appearance
      </Typography>

      <FormControl fullWidth margin="normal">
        <InputLabel>Theme</InputLabel>
        <Select
          value={settings.theme}
          label="Theme"
          onChange={(event) => onSettingsChange({
            ...settings,
            theme: event.target.value as string,
          })}
        >
          <MenuItem value="dark">Dark</MenuItem>
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="system">System</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Font Size</Typography>
        <Slider
          value={settings.fontSize}
          onChange={handleSliderChange}
          min={10}
          max={24}
          step={1}
          marks
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Chat Settings
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={settings.compactMode}
              onChange={handleSwitchChange('compactMode')}
            />
          }
          label="Compact Mode"
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.notificationsEnabled}
              onChange={handleSwitchChange('notificationsEnabled')}
            />
          }
          label="Enable Notifications"
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.mentionHighlight}
              onChange={handleSwitchChange('mentionHighlight')}
            />
          }
          label="Highlight Mentions"
        />
      </Box>
    </Box>
  );
} 