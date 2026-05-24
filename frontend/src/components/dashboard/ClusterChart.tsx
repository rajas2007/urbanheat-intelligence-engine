import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";

type Point = {
  name: string;
  temperature: number;
  density: number;
  cluster: number;
};

// 🎯 cluster color
const getColor = (cluster: number) => {
  if (cluster === 2) return "#ef4444"; // 🔴 Critical
  if (cluster === 1) return "#eab308"; // 🟡 Moderate
  return "#06b6d4"; // 🔵 Safe
};

export const ClusterChart = () => {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/clusters/");
        const result = await res.json();

        const formatted: Point[] = (result || []).map((z: any) => ({
          name: z.name,
          temperature: Number(z.temperature) || 0,
          density: Number(z.density) || 0,
          cluster: Number(z.cluster) || 0,
        }));

        setData(formatted);
        setLoading(false);
      } catch (err) {
        console.error("Cluster chart error:", err);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <h2 className="dashboard-title mb-4">
        K-Means Clustering
      </h2>

      <p className="text-xs text-gray-400 mb-2">
        Temperature vs Building Density
      </p>

      {/* Legend */}
      <div className="flex gap-3 text-xs mb-3 text-gray-400">
        <span className="text-red-400">● Critical</span>
        <span className="text-yellow-400">● Moderate</span>
        <span className="text-cyan-400">● Safe</span>
      </div>

      {/* 🔥 FIXED CONTAINER */}
      <div className="w-full h-[300px] min-h-[300px]">
        {loading ? (
          <div className="text-gray-400 text-sm">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid stroke="#1f2937" />

              <XAxis
                type="number"
                dataKey="density"
                name="Density"
                stroke="#9ca3af"
              />

              <YAxis
                type="number"
                dataKey="temperature"
                name="Temperature"
                stroke="#9ca3af"
              />

              <Tooltip
                formatter={(value: any, name: any) => [value, name]}
                labelFormatter={(label: any) => `Area`}
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #1f2937",
                }}
              />

              <Scatter
                data={data}
                animationDuration={500}
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill={getColor(payload.cluster)}
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
};