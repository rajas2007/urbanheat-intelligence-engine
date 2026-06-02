import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useHeatData } from "../hooks/useHeatData";

const HeatGraph = () => {
  const { historyPoints } = useHeatData();
  const data = useMemo(
    () => historyPoints.map((point) => ({ time: point.time, temp: point.temp })),
    [historyPoints]
  );

  return (
    <div className="bg-[#0f172a] p-4 rounded-xl text-white shadow-lg">
      <h3 className="mb-3 text-sm text-gray-400">
        🌡 24-Hour Temperature Trend
      </h3>

       <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />

          <XAxis
            dataKey="time"
            stroke="#9ca3af"
            tick={{ fontSize: 10 }}
          />

          <YAxis
            stroke="#9ca3af"
            domain={["dataMin - 2", "dataMax + 2"]}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "none",
            }}
          />

          <Line
            type="monotone"
            dataKey="temp"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HeatGraph;