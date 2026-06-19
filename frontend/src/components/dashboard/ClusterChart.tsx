import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import { useHeatData } from "../../hooks/useHeatData";

type Point = {
  name: string;
  temperature: number;
  density: number;
  humidity: number;
  vegetation: number;
  cluster: number;
};

// 🎯 cluster color
const getColor = (cluster: number) => {
  if (cluster === 2) return "#ef4444"; // 🔴 Critical
  if (cluster === 1) return "#eab308"; // 🟡 Moderate
  return "#06b6d4"; // 🔵 Safe
};

const getClusterLabel = (cluster: number) => {
  if (cluster === 2) return "Critical";
  if (cluster === 1) return "Moderate";
  return "Safe";
};

const tooltipRow = (
  label: string,
  value: string,
  color: string = "#f9fafb"
) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px",
      padding: "3px 0",
    }}
  >
    <span
      style={{
        color: "#9ca3af",
        fontSize: "11px",
        fontWeight: 500,
      }}
    >
      {label}
    </span>
    <span
      style={{
        color,
        fontSize: "12px",
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </span>
  </div>
);

const ClusterTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const point: Point = payload[0]?.payload;
  if (!point) return null;

  const clusterColor = getColor(point.cluster);
  const clusterLabel = getClusterLabel(point.cluster);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        padding: "14px 16px",
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        minWidth: "180px",
        maxWidth: "240px",
      }}
    >
      {/* Area Name */}
      <p
        style={{
          color: "#f9fafb",
          fontSize: "14px",
          fontWeight: 600,
          margin: "0 0 8px 0",
        }}
      >
        {point.name}
      </p>

      {/* Cluster Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 10px",
          borderRadius: "9999px",
          backgroundColor: `${clusterColor}15`,
          border: `1px solid ${clusterColor}40`,
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: clusterColor,
            display: "inline-block",
          }}
        />
        <span
          style={{
            color: clusterColor,
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          Cluster {point.cluster} — {clusterLabel}
        </span>
      </div>

      {/* Data Rows */}
      <div
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          paddingTop: "8px",
        }}
      >
        {tooltipRow("Temperature", `${point.temperature.toFixed(1)}°C`, "#ef4444")}
        {tooltipRow("Density", point.density.toFixed(1))}
        {tooltipRow("Humidity", `${point.humidity.toFixed(1)}%`)}
        {tooltipRow("Vegetation", point.vegetation.toFixed(3), "#22c55e")}
      </div>
    </div>
  );
};

export const ClusterChart = () => {
  const { zones, loading } = useHeatData();

  const data = useMemo(
    () => zones.map((z) => ({
      name: z.name,
      temperature: Number(z.temperature) || 0,
      density: Number(z.density) || 0,
      humidity: Number(z.humidity) || 0,
      vegetation: Number(z.vegetation) || 0,
      cluster: Number(z.cluster) || 0,
    })),
    [zones]
  );

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
                content={<ClusterTooltip />}
                cursor={{
                  stroke: "rgba(255, 255, 255, 0.1)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
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
