import { useEffect, useState, useRef } from "react";
import { Thermometer, AlertTriangle, Leaf } from "lucide-react";
import { StatCard } from "./StatCard";

const safeDivide = (num: number, den: number) =>
  den === 0 ? 0 : num / den;

const calcStats = (data: any[]) => ({
  avgTemp: safeDivide(
    data.reduce((s, z) => s + (z.temperature || 0), 0),
    data.length
  ),
  critical: data.filter((z) => z.cluster === 2).length,
  vegetation: safeDivide(
    data.reduce((s, z) => s + (z.vegetation || 0), 0),
    data.length
  ),
  peak: Math.max(...data.map((z) => z.temperature || 0)),
  peakZoneName: data.reduce((max, z) =>
    (z.temperature || 0) > (max.temperature || 0) ? z : max
  ).name ?? "Unknown",
});

type Stats = ReturnType<typeof calcStats>;

const EMPTY: Stats = {
  avgTemp: 0, critical: 0, vegetation: 0, peak: 0, peakZoneName: "—",
};

export const StatsSection = () => {
  const [current, setCurrent] = useState<Stats>(EMPTY);
  const [prev, setPrev] = useState<Stats>(EMPTY);
  const lastRef = useRef<Stats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/clusters/");
        const data = await res.json();
        if (!Array.isArray(data) || !data.length) return;

        // Jitter raw data for demo
        const jittered = data.map((z) => ({
          ...z,
          temperature: (z.temperature || 0) + (Math.random() - 0.5) * 2,
          vegetation: Math.min(1, Math.max(0,
            (z.vegetation || 0) + (Math.random() - 0.5) * 0.05
          )),
        }));

        const next = calcStats(jittered);

        // prev = what we had LAST cycle
        if (lastRef.current !== null) {
          setPrev(lastRef.current);
        }

        lastRef.current = next;
        setCurrent(next);         // ← render from stored stats, not zones

      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (current.peak === 0) return <div className="text-gray-400">Loading...</div>;

  const trend = (curr: number, p: number) =>
    p ? Number((((curr - p) / p) * 100).toFixed(1)) : 0;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Peak Temperature"
        value={`${current.peak.toFixed(2)}°C`}
        subtitle={current.peakZoneName}
        icon={Thermometer}
        variant="hot"
        trend={{ value: trend(current.peak, prev.peak), label: "" }}
      />
      <StatCard
        title="Avg Temperature"
        value={`${current.avgTemp.toFixed(1)}°C`}
        subtitle="Across zones"
        icon={Thermometer}
        variant="warning"
        trend={{ value: trend(current.avgTemp, prev.avgTemp), label: "" }}
      />
      <StatCard
        title="Critical Zones"
        value={`${current.critical}`}
        subtitle="Immediate attention needed"
        icon={AlertTriangle}
        variant="hot"
        trend={{ value: trend(current.critical, prev.critical), label: "" }}
      />
      <StatCard
        title="Vegetation Index"
        value={current.vegetation.toFixed(2)}
        subtitle="NDVI average"
        icon={Leaf}
        variant="cool"
        trend={{ value: trend(current.vegetation, prev.vegetation), label: "" }}
      />
    </div>
  );
};