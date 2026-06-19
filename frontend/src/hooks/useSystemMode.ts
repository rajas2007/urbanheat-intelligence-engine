import { useCallback, useEffect, useSyncExternalStore } from "react";
import { API_BASE_URL } from "../config";

export type SystemMode = "REAL" | "SIMULATION";

const API_BASE = `${API_BASE_URL}/api`;

type SystemModeState = {
  mode: SystemMode;
  loading: boolean;
  busy: boolean;
};

let systemModeState: SystemModeState = {
  mode: "REAL",
  loading: true,
  busy: false,
};

const listeners = new Set<() => void>();
let modeLoadPromise: Promise<void> | null = null;
let modeUpdatePromise: Promise<SystemMode> | null = null;

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const setSystemModeState = (nextState: Partial<SystemModeState>) => {
  systemModeState = {
    ...systemModeState,
    ...nextState,
  };
  emitChange();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => systemModeState;

const normalizeMode = (mode: unknown): SystemMode =>
  mode === "SIMULATION" ? "SIMULATION" : "REAL";

const loadBackendMode = async () => {
  try {
    const res = await fetch(`${API_BASE}/mode/`);
    const data = await res.json();
    setSystemModeState({
      mode: normalizeMode(data.mode),
      loading: false,
    });
  } catch (err) {
    console.error("Mode fetch error:", err);
    setSystemModeState({ loading: false });
  }
};

const setBackendMode = async (nextMode: SystemMode) => {
  if (modeUpdatePromise) {
    return modeUpdatePromise;
  }

  modeUpdatePromise = (async () => {
    setSystemModeState({ busy: true });
    try {
      const endpoint =
        nextMode === "SIMULATION"
          ? "enable-simulation"
          : "disable-simulation";

      const res = await fetch(`${API_BASE}/mode/${endpoint}/`, {
        method: "POST",
      });
      const data = await res.json();
      const updatedMode = normalizeMode(data.mode);
      setSystemModeState({ mode: updatedMode });
      return updatedMode;
    } finally {
      modeUpdatePromise = null;
      setSystemModeState({ busy: false });
    }
  })();

  return modeUpdatePromise;
};

export const useSystemMode = () => {
  const { mode, loading, busy } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const loadMode = useCallback(async () => {
    if (!modeLoadPromise) {
      modeLoadPromise = loadBackendMode().finally(() => {
        modeLoadPromise = null;
      });
    }

    return modeLoadPromise;
  }, []);

  useEffect(() => {
    loadMode();
  }, [loadMode]);

  return {
    mode,
    loading,
    busy,
    refreshMode: loadMode,
    enableSimulation: () => setBackendMode("SIMULATION"),
    disableSimulation: () => setBackendMode("REAL"),
  };
};
