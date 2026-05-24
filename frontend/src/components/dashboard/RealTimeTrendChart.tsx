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

type DataPoint = {
  time: string;
  temp: number;
};

export const RealTimeTrendChart = () => {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/history/");
        const result = await res.json();

        // ✅ safe avg (no NaN)
        const avgTemp =
          result && result.length > 0
            ? result.reduce(
                (sum: number, item: any) =>
                  sum + (item.temperature || 0),
                0
              ) / result.length
            : 0;

        const now = new Date().toLocaleTimeString();

        setData((prev) => {
          // ✅ smoothing (key fix)
          const smoothTemp =
            prev.length > 0
              ? prev[prev.length - 1].temp * 0.8 + avgTemp * 0.2
              : avgTemp;

          const newPoint: DataPoint = {
            time: now,
            temp: Number(smoothTemp.toFixed(2)),
          };

          const updated = [...prev, newPoint];

          // keep last 10 points
          if (updated.length > 10) updated.shift();

          return updated;
        });

      } catch (err) {
        console.error("Time-series error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <h2 className="dashboard-title mb-4">
        Real-Time Temperature Trend
      </h2>

      <p className="text-xs text-gray-400 mb-3">
        Live average temperature over time
      </p>

      <div className="w-full h-[300px] min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />

            <XAxis dataKey="time" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="temp"
              stroke="#facc15"
              strokeWidth={3}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};