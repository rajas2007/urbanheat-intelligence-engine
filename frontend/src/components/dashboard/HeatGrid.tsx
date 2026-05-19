import { useEffect, useState } from "react";

type Zone = {
  name: string;
  temperature: number;
  cluster: number;
};

// 🎯 cluster-based color (ML output)
const getClusterColor = (cluster: number) => {
  if (cluster === 2) return "bg-red-600";     // 🔴 Critical
  if (cluster === 1) return "bg-yellow-400 text-black"; // 🟡 Moderate
  return "bg-cyan-500"; // 🔵 Safe
};

export const HeatGrid = () => {
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/clusters/");
        const data = await res.json();

        setZones(data);
      } catch (err) {
        console.error("Cluster error:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="dashboard-title mb-4">
            Thermal Trap Grid (ML Clusters)
          </h2>
          <p className="text-xs text-gray-400">
            Zones grouped by heat risk
          </p>
        </div>

        <div className="text-xs text-gray-400 flex items-center gap-2">
          <div className="w-24 h-2 rounded-full bg-gradient-to-r from-cyan-400 via-yellow-400 to-red-500" />
          Safe → Critical
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {zones.map((z, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl text-white font-semibold ${getClusterColor(
              z.cluster
            )}`}
          >
            <div className="text-xs truncate">{z.name}</div>
            <div className="text-xl">{z.temperature}°</div>
          </div>
        ))}
      </div>
    </div>
  );
};