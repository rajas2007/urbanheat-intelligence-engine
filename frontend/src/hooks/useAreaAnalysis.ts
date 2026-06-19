import { useCallback, useEffect, useRef, useState } from "react";

import { fetchAreaAnalysis } from "../services/analysisApi";
import type { AreaAnalysisReport } from "../types/analysis";

type CacheEntry = {
  data: AreaAnalysisReport;
  fetchedAt: number;
};

const cache = new Map<number, CacheEntry>();

export function useAreaAnalysis(areaId: number | null) {
  const [report, setReport] = useState<AreaAnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async (idToLoad: number, refresh = false) => {
    const reqId = ++requestId.current;
    setLoading(true);
    setError(null);

    const now = Date.now();
    if (!refresh && cache.has(idToLoad)) {
      const entry = cache.get(idToLoad)!;
      const isGemini = entry.data.provider === "gemini";
      const staleTime = isGemini ? 1800000 : 600000; // 30 mins for Gemini, 10 mins for rule-engine
      if (now - entry.fetchedAt < staleTime) {
        setReport(entry.data);
        setLoading(false);
        return;
      }
    }

    try {
      const data = await fetchAreaAnalysis(idToLoad, refresh);
      if (reqId !== requestId.current) return;
      cache.set(idToLoad, { data, fetchedAt: Date.now() });
      setReport(data);
    } catch (err) {
      if (reqId !== requestId.current) return;
      const message = err instanceof Error ? err.message : "Failed to load analysis";
      setError(message);
      setReport(null);
    } finally {
      if (reqId === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!areaId) {
      setReport(null);
      setError(null);
      setLoading(false);
      return;
    }
    load(areaId);
  }, [areaId, load]);

  const refresh = useCallback(() => {
    if (areaId) load(areaId, true);
  }, [areaId, load]);

  return { report, loading, error, refresh };
}
