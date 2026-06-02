import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { loadSettings } from "../../hooks/useSettings";

type HistoricalDataPoint = {
  year: number;
  month: number;
  avg_temperature: number;
  avg_humidity?: number;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const HistoricalClimateChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        setError(null);

        const settings = loadSettings();
        const yearRange = Math.max(5, Math.min(30, settings.historicalYearRange || 10));

        const response = await fetch(
          `http://127.0.0.1:8000/api/historical-climate/?year_range=${yearRange}&month=${currentMonth}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch historical climate data");
        }

        const result = await response.json();
        const chartData = result.data.map((point: HistoricalDataPoint) => ({
          year: point.year,
          temperature: Number(point.avg_temperature.toFixed(1)),
        }));

        setData(chartData);
      } catch (err) {
        console.error("Historical climate fetch error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [currentMonth]);

  const monthName = MONTH_NAMES[currentMonth - 1];
  const settings = loadSettings();
  const yearRange = Math.max(5, Math.min(30, settings.historicalYearRange || 10));

  if (error) {
    return (
      <>
        <h2 className="dashboard-title mb-4">
          Historical Climate Trend
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          Average temperature trends for {monthName} across years
        </p>
        <div className="w-full h-[300px] flex items-center justify-center bg-[#111827] rounded-lg border border-[#1f2937]">
          <p className="text-sm text-red-400">Failed to load historical data: {error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 className="dashboard-title mb-4">
        Historical Climate Trend
      </h2>

      <p className="text-xs text-gray-400 mb-3">
        Average {monthName} temperatures from {Math.max(new Date().getFullYear() - yearRange + 1, 1990)} to {new Date().getFullYear()}
      </p>

      <div className="w-full h-[300px] min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-[#111827] rounded-lg border border-[#1f2937]">
            <p className="text-sm text-gray-400">Loading historical data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-[#111827] rounded-lg border border-[#1f2937]">
            <p className="text-sm text-gray-400">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />
              <XAxis
                dataKey="year"
                stroke="#9ca3af"
                label={{ value: "Year", position: "insideBottomRight", offset: -5 }}
              />
              <YAxis
                stroke="#9ca3af"
                label={{ value: "Temperature (°C)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #1f2937",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f3f4f6" }}
                formatter={(value: any) => `${value.toFixed(1)}°C`}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#facc15"
                strokeWidth={3}
                dot={{ fill: "#facc15", r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
};
