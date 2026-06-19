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
import { loadSettings } from "../../hooks/useSettings";
import { API_BASE_URL } from "../../config";

type HistoricalDataPoint = {
  year: number;
  month: number;
  avg_temperature: number;
  avg_humidity?: number;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const temp = Number(payload[0].value).toFixed(1);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid rgba(250, 204, 21, 0.2)",
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
        Year
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
          Avg Temperature
        </p>
        <p
          style={{
            color: "#facc15",
            fontSize: "20px",
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {temp}
          <span style={{ fontSize: "13px", color: "#fde047", marginLeft: "2px" }}>
            °C
          </span>
        </p>
      </div>
    </div>
  );
};

export const HistoricalClimateChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1;

  const settings = loadSettings();
  const yearRange = Math.max(
    5,
    Math.min(30, settings.historicalYearRange || 10)
  );

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/api/historical-climate/?year_range=${yearRange}&month=${currentMonth}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch historical climate data");
        }

        const result = await response.json();

        const chartData = (result.data || [])
          .map((point: HistoricalDataPoint) => ({
            year: point.year,
            temperature: parseFloat(
              Number(point.avg_temperature).toFixed(1)
            ),
          }))
          .filter(
            (point: any) =>
              point.year != null && !isNaN(point.temperature)
          )
          .sort((a: any, b: any) => a.year - b.year);

        setData(chartData);
      } catch (err) {
        console.error("Historical climate fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load climate data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [currentMonth, yearRange]);

  const monthName = MONTH_NAMES[currentMonth - 1];
  const startYear = Math.max(
    new Date().getFullYear() - yearRange + 1,
    1990
  );

  if (error) {
    return (
      <>
        <h2 className="dashboard-title mb-4">
          Historical Climate Trend
        </h2>

        <p className="text-xs text-gray-400 mb-3">
          Average {monthName} temperature across previous years
        </p>

        <div className="w-full h-[300px] flex items-center justify-center bg-[#111827] rounded-lg border border-[#1f2937]">
          <p className="text-sm text-red-400">
            Failed to load historical data: {error}
          </p>
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
        Average {monthName} temperatures from {startYear} to{" "}
        {new Date().getFullYear()} ({yearRange} years)
      </p>

      <div style={{ width: "100%", height: 300 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full bg-[#111827] rounded-lg border border-[#1f2937]">
            <p className="text-sm text-gray-400">
              Loading historical climate data...
            </p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-[#111827] rounded-lg border border-[#1f2937]">
            <p className="text-sm text-gray-400">
              No historical data available
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid
                stroke="#1f2937"
                strokeDasharray="4 4"
              />

              <XAxis
                dataKey="year"
                stroke="#9ca3af"
              />

              <YAxis
                stroke="#9ca3af"
                domain={["dataMin - 1", "dataMax + 1"]}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "rgba(250, 204, 21, 0.3)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />

              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#facc15"
                strokeWidth={3}
                dot={{
                  fill: "#0f172a",
                  stroke: "#facc15",
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  fill: "#facc15",
                  stroke: "#0f172a",
                  strokeWidth: 2,
                }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
};