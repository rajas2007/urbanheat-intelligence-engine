import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Thermometer, AlertTriangle, TreePine,
  Building2, Flame, Wind,
} from "lucide-react";

import { StatCard } from "../components/dashboard/StatCard";
import { HeatGrid } from "../components/dashboard/HeatGrid";
import { TemperatureChart } from "../components/dashboard/TemperatureChart";
import { RealTimeTrendChart } from "../components/dashboard/RealTimeTrendChart";
import { ZoneTable } from "../components/dashboard/ZoneTable";
import { ClusterChart } from "../components/dashboard/ClusterChart";
import { loadSettings } from "../hooks/useSettings";

type Stats = { peak: number; avg: number; critical: number; vegetation: number; };
const EMPTY: Stats = { peak: 0, avg: 0, critical: 0, vegetation: 0 };

const calcStats = (data: any[]): Stats => ({
  peak: Math.max(...data.map((z) => z.temperature || 0)),
  avg: data.reduce((s, z) => s + (z.temperature || 0), 0) / data.length,
  critical: data.filter((z) => z.cluster === 2).length,
  vegetation: data.reduce((s, z) => s + (z.vegetation || 0), 0) / data.length,
});

const Index = () => {
  const [zones, setZones] = useState<any[]>([]);
  const [current, setCurrent] = useState<Stats>(EMPTY);
  const [prev, setPrev] = useState<Stats>(EMPTY);
  const lastRef = useRef<Stats | null>(null);

  useEffect(() => {
    const { updateInterval, autoRefresh, tempThreshold } = loadSettings();

    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/clusters/");
        const data = await res.json();
        if (!Array.isArray(data) || !data.length) return;

        const jittered = data.map((z) => ({
          ...z,
          temperature: (z.temperature || 0) + (Math.random() - 0.5) * 2,
          vegetation: Math.min(
            1,
            Math.max(0, (z.vegetation || 0) + (Math.random() - 0.5) * 0.05)
          ),
        }));

        const withAlerts = jittered.map((z) => ({
          ...z,
          aboveThreshold: z.temperature > tempThreshold,
        }));

        const next = calcStats(withAlerts);

        if (lastRef.current !== null) setPrev(lastRef.current);
        lastRef.current = next;
        setCurrent(next);
        setZones(withAlerts);

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };

    fetchData();

    if (!autoRefresh) return;
    const interval = setInterval(fetchData, updateInterval * 1000);
    return () => clearInterval(interval);
  }, []);

  const hottestZone = zones.length
    ? zones.reduce((max, z) => (z.temperature || 0) > (max.temperature || 0) ? z : max)
    : null;

  const criticalZones = zones.filter((z) => z.aboveThreshold || z.cluster === 2).length;

  const pct = (curr: number, p: number) =>
    p ? Number((((curr - p) / p) * 100).toFixed(1)) : 0;

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0b0f19] text-gray-100">

      {/* Header */}
      <header className="border-b border-[#1f2937]">
        <div className="flex items-center justify-between py-4 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Urban Thermal Trapping Engine
              </h1>
              <p className="text-xs text-gray-400 font-mono">
                PUNE, MAHARASHTRA • LIVE ANALYSIS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-400">{criticalZones} CRITICAL</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-1">
              <Wind className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">
                Live • updates every {loadSettings().updateInterval}s
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Peak Temperature"
            value={`${current.peak.toFixed(2)}°C`}
            subtitle={hottestZone?.name || "Unknown Zone"}
            icon={Thermometer}
            variant="hot"
            trend={{ value: pct(current.peak, prev.peak), label: "" }}
          />
          <StatCard
            title="Avg Temperature"
            value={`${current.avg.toFixed(1)}°C`}
            subtitle="Across zones"
            icon={Flame}
            variant="warning"
            trend={{ value: pct(current.avg, prev.avg), label: "" }}
          />
          <StatCard
            title="Critical Zones"
            value={String(criticalZones)}
            subtitle="Immediate attention needed"
            icon={AlertTriangle}
            variant="hot"
            trend={{ value: pct(current.critical, prev.critical), label: "" }}
          />
          <StatCard
            title="Vegetation Index"
            value={current.vegetation.toFixed(2)}
            subtitle="NDVI average"
            icon={TreePine}
            variant="cool"
            trend={{ value: pct(current.vegetation, prev.vegetation), label: "" }}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0f172a] border border-[#1f2937] rounded-xl p-5 shadow-lg">
            <TemperatureChart />
          </div>
          <div className="bg-[#0f172a] border border-[#1f2937] rounded-xl p-5 shadow-lg">
            <RealTimeTrendChart />
          </div>
        </div>

        {/* HeatGrid + Cluster */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0f172a] border border-[#1f2937] rounded-xl p-5 shadow-lg">
            <HeatGrid />
          </div>
          <div className="bg-[#0f172a] border border-[#1f2937] rounded-xl p-5 shadow-lg">
            <ClusterChart />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#0f172a] border border-[#1f2937] rounded-xl p-5 shadow-lg">
          <ZoneTable />
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between border-t border-[#1f2937] pt-4"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-400">ASEP Project • Built by Rajas Ghongade</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-400 via-yellow-400 to-red-500" />
            <span className="text-xs text-gray-400 font-mono">
              Algorithms: K-Means • DBSCAN • Random Forest
            </span>
          </div>
        </motion.div>

      </main>
    </div>
  );
};

export default Index;