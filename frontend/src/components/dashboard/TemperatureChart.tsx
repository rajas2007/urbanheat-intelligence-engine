import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useHeatData } from "../../hooks/useHeatData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const temp = Number(payload[0].value).toFixed(1);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        borderRadius: "12px",
        padding: "12px 16px",
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        minWidth: "140px",
      }}
    >
      <p
        style={{
          color: "#9ca3af",
          fontSize: "11px",
          fontWeight: 500,
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
          margin: "0 0 6px 0",
        }}
      >
        Area
      </p>
      <p
        style={{
          color: "#f9fafb",
          fontSize: "14px",
          fontWeight: 600,
          margin: "0 0 10px 0",
        }}
      >
        {label}
      </p>
      <div
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          paddingTop: "8px",
        }}
      >
        <p
          style={{
            color: "#9ca3af",
            fontSize: "11px",
            fontWeight: 500,
            margin: "0 0 4px 0",
          }}
        >
          Temperature
        </p>
        <p
          style={{
            color: "#ef4444",
            fontSize: "20px",
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {temp}
          <span style={{ fontSize: "13px", color: "#f87171", marginLeft: "2px" }}>
            °C
          </span>
        </p>
      </div>
    </div>
  );
};

export const TemperatureChart = () => {
  const { zones } = useHeatData();
  const data = zones.map((zone) => ({
    name: zone.name,
    temperature: zone.temperature,
  }));

  return (
    <>
      <h2 className="dashboard-title mb-4">
        24h Average Temperature by Area
      </h2>

      <p className="text-xs text-gray-400 mb-3">
        Comparison of zones (24hr average)
      </p>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />

            <XAxis dataKey="name" stroke="#9ca3af" />

            <YAxis
              stroke="#9ca3af"
              domain={["dataMin - 2", "dataMax + 2"]}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "rgba(239, 68, 68, 0.3)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{
                fill: "#0f172a",
                stroke: "#ef4444",
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 6,
                fill: "#ef4444",
                stroke: "#0f172a",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};