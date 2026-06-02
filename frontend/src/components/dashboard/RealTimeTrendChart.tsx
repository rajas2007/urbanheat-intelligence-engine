import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useEffect } from "react";
import { useHeatData } from "../../hooks/useHeatData";

type DataPoint = {
  time: string;
  temp: number;
};

export const RealTimeTrendChart = () => {
  const { historyPoints } = useHeatData();

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
          <LineChart data={historyPoints}>
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