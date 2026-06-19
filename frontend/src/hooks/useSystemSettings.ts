import { useCallback, useEffect, useSyncExternalStore } from "react";
import { API_BASE_URL } from "../config";

export type SystemSettingsData = {
  analysis_mode: "rule_engine" | "ai_enhanced";
  pdf_report_type: "executive" | "full";
  include_executive_summary: boolean;
  include_rankings: boolean;
  include_area_details: boolean;
  include_recommendations: boolean;
  include_appendix: boolean;
  provider_status?: string;
  cooldown_until?: string | null;
  consecutive_failures?: number;
  health?: {
    active_areas: number;
    current_mode: string;
    llm_provider: string;
    analysis_mode: string;
    cached_reports: number;
    last_analysis: string | null;
    last_pdf: string | null;
    system_version: string;
  };
};

const API_BASE = `${API_BASE_URL}/api/settings/`;

type SystemSettingsState = {
  data: SystemSettingsData | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  lastFetchedAt: number;
};

let settingsState: SystemSettingsState = {
  data: null,
  loading: true,
  error: null,
  saving: false,
  lastFetchedAt: 0,
};

const listeners = new Set<() => void>();
let fetchPromise: Promise<SystemSettingsData | null> | null = null;

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const setSettingsState = (nextState: Partial<SystemSettingsState>) => {
  settingsState = {
    ...settingsState,
    ...nextState,
  };
  emitChange();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => settingsState;

const STALE_TIME = 10000; // 10 seconds

const fetchSettingsFromBackend = async (force = false): Promise<SystemSettingsData | null> => {
  const now = Date.now();
  if (!force && settingsState.data && (now - settingsState.lastFetchedAt < STALE_TIME)) {
    return settingsState.data;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    if (!settingsState.data) {
      setSettingsState({ loading: true });
    }
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to fetch system settings");
      const json = await res.json();
      setSettingsState({
        data: json,
        error: null,
        loading: false,
        lastFetchedAt: Date.now(),
      });
      return json;
    } catch (err: any) {
      const errMsg = err.message || "Unknown error";
      setSettingsState({
        error: errMsg,
        loading: false,
      });
      throw err;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
};

const updateSettingsInBackend = async (patch: Partial<SystemSettingsData>): Promise<boolean> => {
  setSettingsState({ saving: true });
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to save settings");
    const json = await res.json();
    
    const prev = settingsState.data;
    const nextData = prev ? { ...prev, ...json, health: prev.health } : json;
    
    setSettingsState({
      data: nextData,
      saving: false,
      lastFetchedAt: Date.now(),
    });
    return true;
  } catch (err: any) {
    console.error(err);
    setSettingsState({ saving: false });
    return false;
  }
};

export function useSystemSettings() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    fetchSettingsFromBackend();
  }, []);

  const refresh = useCallback(async () => {
    try {
      await fetchSettingsFromBackend(true);
    } catch (e) {
      // Ignored
    }
  }, []);

  const updateSettings = useCallback(async (patch: Partial<SystemSettingsData>) => {
    return updateSettingsInBackend(patch);
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    saving: state.saving,
    updateSettings,
    refresh,
  };
}
