import { useState, useEffect, useCallback } from 'react';
import { Settings } from '../types';

const defaultSettings: Settings = {
  theme: 'light',
  fontSize: 16,
  fontFamily: "'Inter', sans-serif",
  lineHeight: 1.6,
  stickyTitle: true
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('writing-app-settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('writing-app-settings', JSON.stringify(newSettings));
  }, []);

  const updateSetting = useCallback(<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  return {
    settings,
    updateSetting
  };
}