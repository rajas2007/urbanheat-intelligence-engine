import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type DataPoint = {
  timestamp: string;
  temperature: number;
  name: string;
};

const HeatGraph = () => {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/history/");
        const result = await res.json();

        // 🔥 Format time (clean for X-axis)
        const formatted = result.map((d: DataPoint) => ({
          ...d,
          time: new Date(d.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));

        setData(formatted);
      } catch (err) {
        console.error("Chart error:", err);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 60000); // refresh every 1 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0f172a] p-4 rounded-xl text-white shadow-lg">
      <h3 className="mb-3 text-sm text-gray-400">
        🌡 24-Hour Temperature Trend
      </h3>

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
            dataKey="temperature"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HeatGraph;