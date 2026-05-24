import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";

export const TemperatureChart = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/history/");
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Chart error:", err);
      }
    };

    // ✅ initial fetch
    fetchData();

    // ✅ fetch every 5 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    // ✅ cleanup (VERY IMPORTANT)
    return () => clearInterval(interval);
  }, []);

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

            <Tooltip />

            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#ef4444"
              strokeWidth={3}
              dot={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};