import { useHeatData } from "../../hooks/useHeatData";


// 🎯 cluster color
const getClusterColor = (cluster: number) => {
  if (cluster === 2) return "bg-red-600";
  if (cluster === 1) return "bg-yellow-400 text-black";
  return "bg-cyan-500";
};

// 🎯 cluster label
const getClusterLabel = (cluster: number) => {
  if (cluster === 2) return "Critical";
  if (cluster === 1) return "Moderate";
  return "Safe";
};

export const HeatGrid = ({ onAreaClick }: { onAreaClick?: (id: number, name: string) => void }) => {
  const { zones, loading } = useHeatData();



  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="dashboard-title mb-2">
            Thermal Trap Grid (ML Output)
          </h2>
          <p className="text-xs text-gray-400">
            Zones classified by heat risk using clustering
            {onAreaClick && " • Click a zone for mitigation analysis"}
          </p>
        </div>

        {/* Legend */}
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <div className="w-24 h-2 rounded-full bg-gradient-to-r from-cyan-400 via-yellow-400 to-red-500" />
          Safe → Critical
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {zones.map((z) => (
            <div
              key={z.name}
              role={onAreaClick ? "button" : undefined}
              tabIndex={onAreaClick ? 0 : undefined}
              onClick={() => onAreaClick?.(z.id!, z.name)}
              onKeyDown={(e) => e.key === "Enter" && onAreaClick?.(z.id!, z.name)}
              className={`p-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${getClusterColor(
                z.cluster
              )} ${onAreaClick ? "cursor-pointer" : ""}`}
            >
              <div className="text-xs truncate">{z.name}</div>

              <div className="text-lg">
                {(z.temperature ?? 0).toFixed(1)}°C
              </div>

              <div className="text-xs mt-1 opacity-80">
                {getClusterLabel(z.cluster)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};