import { useEffect, useState } from "react";

type Zone = {
  name: string;
  temperature: number;
  latitude: number;
  longitude: number;
  riskLevel: string;
  cluster?: number;
};

const Analytics = () => {
  const [data, setData] = useState<Zone[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/clusters/");
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // 🔥 1 min refresh
    return () => clearInterval(interval);
  }, []);

  // 🔥 Dynamic calculations
 const hottest =
  data.length > 0
    ? data.reduce((max, curr) =>
        curr.temperature > max.temperature ? curr : max
      )
    : { name: "-", temperature: 0 };

  const avgTemp =
    data.length > 0
      ? (data.reduce((sum, z) => sum + z.temperature, 0) / data.length).toFixed(1)
      : 0;

  const criticalCount = data.filter((z) => z.riskLevel === "Critical").length;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white p-6">

      <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>

      <p className="text-gray-400 mb-6">
        Live ML-based heat insights
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <div className="bg-[#111827] p-4 rounded-xl border border-[#1f2937]">
          <h3 className="text-sm text-gray-400">Hottest Zone</h3>
          <p className="text-xl font-bold text-red-400">
            {hottest?.name || "-"}
          </p>
        </div>

        <div className="bg-[#111827] p-4 rounded-xl border border-[#1f2937]">
          <h3 className="text-sm text-gray-400">Avg Temperature</h3>
          <p className="text-xl font-bold">{avgTemp}°C</p>
        </div>

        <div className="bg-[#111827] p-4 rounded-xl border border-[#1f2937]">
          <h3 className="text-sm text-gray-400">Critical Zones</h3>
          <p className="text-xl font-bold text-red-500">
            {criticalCount}
          </p>
        </div>

      </div>

      {/* Table */}
      <div className="bg-[#111827] rounded-xl border border-[#1f2937] overflow-hidden">
        <table className="w-full text-sm">

          <thead className="bg-[#0f172a] text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">Zone</th>
              <th className="text-center">Temp</th>
              <th className="text-center">Risk</th>
            </tr>
          </thead>

          <tbody>
            {data.map((zone, i) => (
              <tr key={i} className="border-t border-[#1f2937]">

                <td className="px-4 py-2 text-left">{zone.name}</td>

                <td className="text-center">
                  {zone.temperature}°
                </td>

                <td className="text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      zone.riskLevel === "Critical"
                        ? "bg-red-900 text-red-400"
                        : zone.riskLevel === "High"
                        ? "bg-orange-900 text-orange-400"
                        : zone.riskLevel === "Moderate"
                        ? "bg-yellow-900 text-yellow-400"
                        : "bg-green-900 text-green-400"
                    }`}
                  >
                    {zone.riskLevel}
                  </span>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
};

export default Analytics;