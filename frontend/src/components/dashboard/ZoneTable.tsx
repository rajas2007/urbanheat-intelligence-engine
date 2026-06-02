import { useHeatData } from "../../hooks/useHeatData";

type Zone = {
  name: string;
  temperature: number;
  cluster: number;
};

// 🎯 Convert ML cluster → human-readable risk
const getRiskLevel = (cluster: number) => {
  if (cluster === 2) return "Critical";
  if (cluster === 1) return "Moderate";
  return "Safe";
};

export const ZoneTable = () => {
  const { zones, loading } = useHeatData();
  const formatted = zones.map((z) => ({
    name: z.name,
    temperature: Number(z.temperature),
    cluster: Number(z.cluster),
  }));

  return (
    <>
      <h2 className="dashboard-title mb-2 text-center">
          Zone Risk Assessment
      </h2>

       <p className="text-xs text-gray-400 mb-4 text-center">
            {loading ? "Loading..." : `${zones.length} zones analyzed`}
       </p>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
             <tr className="text-gray-400 border-b border-[#1f2937]">
             <th className="p-2 text-middle">Zone</th>
             <th className="p-2 text-middle">Temp</th>
             <th className="p-2 text-middle">Risk</th>
             </tr>
          </thead>

          <tbody>
            {zones.map((z) => {
              const risk = getRiskLevel(z.cluster);

              return (
                <tr
                  key={z.name}
                  className="border-b border-[#1f2937] hover:bg-[#1f2937]/40"
                >
                  <td className="p-2">{z.name}</td>

                  <td className="p-2 text-orange-400">
                    {z.temperature.toFixed(1)}°C
                  </td>

                  <td className="p-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        risk === "Critical"
                          ? "bg-red-500/20 text-red-400"
                          : risk === "Moderate"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-cyan-500/20 text-cyan-300"
                      }`}
                    >
                      {risk}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
};