import { useCallback, useEffect, useSyncExternalStore } from "react";
import { loadSettings } from "./useSettings";

const API_BASE = "http://127.0.0.1:8000/api";
const DATA_ENDPOINT = `${API_BASE}/data/`;
const MAX_HISTORY_POINTS = 12;

export type Zone = {
  id: number;
  name: string;
  temperature: number;
  humidity: number;
  wind: number;
  density: number;
  vegetation: number;
  cluster: number;
  latitude: number;
  longitude: number;
};

type HistoryPoint = {
  time: string;
  temp: number;
};

type HeatDataState = {
  zones: Zone[];
  historyPoints: HistoryPoint[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: string;
};

const initialState: HeatDataState = {
  zones: [],
  historyPoints: [],
  loading: true,
  error: null,
  lastFetchedAt: "",
};

let heatDataState: HeatDataState = initialState;
let fetchPromise: Promise<void> | null = null;
let pollTimer: number | null = null;
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

const getSnapshot = () => heatDataState;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const formatTime = () => new Date().toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit",
});

const appendHistoryPoint = (zones: Zone[]) => {
  const avgTemp = zones.length
    ? zones.reduce((sum, zone) => sum + (zone.temperature || 0), 0) / zones.length
    : 0;

  const previous = heatDataState.historyPoints ?? [];
  const now = formatTime();
  const lastPoint = previous[previous.length - 1];

  if (lastPoint?.time === now) {
    return previous;
  }

  const smoothed = lastPoint
    ? Number((lastPoint.temp * 0.8 + avgTemp * 0.2).toFixed(2))
    : Number(avgTemp.toFixed(2));

  const next = [...previous, { time: now, temp: smoothed }];

  return next.slice(-MAX_HISTORY_POINTS);
};

const updateState = (next: Partial<HeatDataState>) => {
  heatDataState = { ...heatDataState, ...next };
  notify();
};

export const fetchHeatData = async (force = false) => {
  if (!force && heatDataState.lastFetchedAt && !heatDataState.error) {
    return Promise.resolve();
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  const shouldShowLoading = heatDataState.zones.length === 0;
  if (shouldShowLoading) {
    updateState({ loading: true, error: null });
  }

  fetchPromise = (async () => {
    try {
      const response = await fetch(DATA_ENDPOINT, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Heat data fetch failed with ${response.status}`);
      }

      const zones = (await response.json()) as Zone[];
      if (!Array.isArray(zones)) {
        throw new Error("Heat data response is not an array");
      }

      updateState({
        zones,
        historyPoints: appendHistoryPoint(zones),
        lastFetchedAt: formatTime(),
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      updateState({ error: message });
      console.error("Heat data store error:", message);
    } finally {
      if (shouldShowLoading) {
        updateState({ loading: false });
      }
      fetchPromise = null;
    }
  })();

  return fetchPromise;
};

export const refreshHeatData = async () => {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }

  await fetchHeatData(true);
  startPolling();
};

const startPolling = () => {
  if (pollTimer !== null) return;

  const settings = loadSettings();
  if (!settings.autoRefresh) return;

  pollTimer = window.setInterval(() => {
    fetchHeatData(true).catch(() => {
      // swallow; state already reflects errors
    });
  }, Math.max(1000, settings.updateInterval * 1000));
};

export const useHeatData = () => {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const refresh = useCallback(() => refreshHeatData(), []);

  useEffect(() => {
    fetchHeatData().catch(() => {
      // state is updated inside fetchHeatData
    });
    startPolling();
  }, []);

  return {
    ...state,
    refresh,
  };
};
