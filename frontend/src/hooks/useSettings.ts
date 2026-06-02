import { useState } from "react";

export type AppSettings = {
  tempThreshold: number;
  updateInterval: number;
  alertCooldown: number;
  dataRetention: string;
  tempUnit: "celsius" | "fahrenheit" | "kelvin";
  timezone: string;
  notifications: boolean;
  emailAlerts: boolean;
  autoRefresh: boolean;
  soundAlerts: boolean;
  historicalYearRange: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  tempThreshold: 35,
  updateInterval: 5,
  alertCooldown: 30,
  dataRetention: "90",
  tempUnit: "celsius",
  timezone: "ist",
  notifications: true,
  emailAlerts: false,
  autoRefresh: true,
  soundAlerts: false,
  historicalYearRange: 10,
};

const STORAGE_KEY = "utte_settings";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const update = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSavedAt(new Date());
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    setSavedAt(null);
  };

  // Read-only helper used by other pages
  const load = (): AppSettings => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  };

  return { settings, update, save, reset, savedAt, load };
}

// Standalone loader — import this in Index.tsx / other pages
export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
