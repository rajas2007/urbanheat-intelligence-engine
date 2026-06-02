import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { useHeatData } from "../hooks/useHeatData";
import "leaflet.heat";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

type Zone = {
  name: string;
  temperature: number;
  latitude: number;
  longitude: number;
  cluster: number;
  vegetation?: number;
};

const CLUSTER = {
  2: { color: "#ef4444", fill: "#ef444499", label: "Critical" },
  1: { color: "#f59e0b", fill: "#f59e0b99", label: "Moderate" },
  0: { color: "#22d3ee", fill: "#22d3ee99", label: "Safe"     },
};
const getCluster = (c: number) =>
  CLUSTER[c as keyof typeof CLUSTER] ?? CLUSTER[0];

// ── Full-area gradient HeatLayer ──────────────────────────────
const HeatLayer = ({ zones }: { zones: Zone[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!zones.length) return;

    const layers: L.Layer[] = [];

    zones.forEach((z) => {
      const cfg = getCluster(z.cluster);

      // Three concentric filled circles → area fill effect
      const outer = L.circle([z.latitude, z.longitude], {
        radius: 2000,
        color: "transparent",
        fillColor: cfg.color,
        fillOpacity: 0.06,
        interactive: false,
      }).addTo(map);

      const mid = L.circle([z.latitude, z.longitude], {
        radius: 1200,
        color: "transparent",
        fillColor: cfg.color,
        fillOpacity: 0.13,
        interactive: false,
      }).addTo(map);

      const core = L.circle([z.latitude, z.longitude], {
        radius: 600,
        color: cfg.color,
        weight: 1,
        fillColor: cfg.color,
        fillOpacity: 0.30,
        interactive: false,
      }).addTo(map);

      layers.push(outer, mid, core);
    });

    // Spread heat points around each zone for smooth gradient blending
    const heatPoints = zones.flatMap((z) => {
      const intensity = Math.min(z.temperature / 45, 1);
      const offsets = [
        [0,      0,      1.0 ],
        [0.005,  0,      0.7 ],
        [-0.005, 0,      0.7 ],
        [0,      0.005,  0.7 ],
        [0,     -0.005,  0.7 ],
        [0.004,  0.004,  0.5 ],
        [-0.004,-0.004,  0.5 ],
        [0.004, -0.004,  0.5 ],
        [-0.004, 0.004,  0.5 ],
        [0.008,  0,      0.3 ],
        [-0.008, 0,      0.3 ],
        [0,      0.008,  0.3 ],
        [0,     -0.008,  0.3 ],
      ];
      return offsets.map(([dlat, dlng, w]) => [
        z.latitude  + dlat,
        z.longitude + dlng,
        intensity * w,
      ]);
    });

    const heat = (L as any).heatLayer(heatPoints, {
      radius: 80,
      blur:   70,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: "#0ea5e9",
        0.3: "#22d3ee",
        0.5: "#facc15",
        0.7: "#f97316",
        1.0: "#ef4444",
      },
    }).addTo(map);

    layers.push(heat);

    return () => { layers.forEach((l) => map.removeLayer(l)); };
  }, [zones, map]);

  return null;
};

// ── Main Component ────────────────────────────────────────────
const MapView = () => {
  const { zones, lastFetchedAt } = useHeatData();
  const [showHeat, setShowHeat] = useState(true);
  const [filter, setFilter] = useState<"all" | 0 | 1 | 2>("all");
  const [selected, setSelected] = useState<Zone | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    if (!zones.length) return;
    setLastUpdated(lastFetchedAt || new Date().toLocaleTimeString());
  }, [zones, lastFetchedAt]);

  const filtered = filter === "all"
    ? zones
    : zones.filter((z) => z.cluster === filter);

  const counts = {
    critical: zones.filter((z) => z.cluster === 2).length,
    moderate: zones.filter((z) => z.cluster === 1).length,
    safe:     zones.filter((z) => z.cluster === 0).length,
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#0b0f19]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#0f172a] border-b border-[#1f2937]">

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-lg">
            🔥
          </div>
          <div>
            <h1 className="text-white font-bold text-base">Pune Heat Analysis</h1>
            <p className="text-gray-400 text-xs font-mono">
              {lastUpdated ? `Updated ${lastUpdated}` : "Connecting..."} • {zones.length} zones
            </p>
          </div>
        </div>

        {/* Heatmap toggle */}
        <button
          onClick={() => setShowHeat((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
            showHeat
              ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
              : "bg-[#1e293b] border-[#1f2937] text-gray-400 hover:text-white"
          }`}
        >
          🔥 {showHeat ? "Hide Heatmap" : "Show Heatmap"}
        </button>

        {/* Zone counts */}
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full font-semibold border border-red-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
            {counts.critical} Critical
          </span>
          <span className="bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-full font-semibold border border-yellow-500/20">
            ● {counts.moderate} Moderate
          </span>
          <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-full font-semibold border border-cyan-500/20">
            ● {counts.safe} Safe
          </span>
        </div>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        <style>{`
          .leaflet-tile-pane {
            filter: brightness(0.45) saturate(0.4);
          }
          .leaflet-popup-content-wrapper {
            background: #0f172a;
            border: 1px solid #1f2937;
            color: white;
            border-radius: 12px;
            box-shadow: 0 0 30px rgba(0,0,0,0.6);
          }
          .leaflet-popup-tip { background: #0f172a; }
          .leaflet-popup-content { margin: 12px 14px; }
          .leaflet-heatmap-layer { transition: opacity 0.4s ease; }
        `}</style>

        <MapContainer
          center={[18.52, 73.86]}
          zoom={12}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Full-area gradient heatmap */}
          {showHeat && <HeatLayer zones={filtered} />}

          {/* Colored pin points — always on top */}
          {filtered.map((zone) => {
            const cfg = getCluster(zone.cluster);
            return (
              <CircleMarker
                key={zone.name}
                center={[zone.latitude, zone.longitude]}
                radius={9}
                pathOptions={{
                  color:       cfg.color,
                  fillColor:   cfg.fill,
                  fillOpacity: 0.95,
                  weight:      2,
                }}
                eventHandlers={{ click: () => setSelected(zone) }}
              >
                <Popup>
                  <div className="text-white min-w-[160px]">
                    <div className="font-bold text-base mb-2">{zone.name}</div>
                    <div className="text-sm text-gray-300 mb-1">
                      🌡️ {zone.temperature.toFixed(1)}°C
                    </div>
                    {zone.vegetation !== undefined && (
                      <div className="text-sm text-gray-300 mb-2">
                        🌿 NDVI: {zone.vegetation.toFixed(2)}
                      </div>
                    )}
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: cfg.fill, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* ── Filter pills (bottom center) ── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-[1000]">
          {([
            { key: "all", label: "All Zones",  cls: "bg-gray-800 text-white border-gray-600" },
            { key: 2,     label: "🔴 Critical", cls: "bg-red-500/20 text-red-400 border-red-500/40" },
            { key: 1,     label: "🟡 Moderate", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" },
            { key: 0,     label: "🔵 Safe",     cls: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40" },
          ] as const).map(({ key, label, cls }) => (
            <button
              key={String(key)}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm transition-all ${cls} ${
                filter === key
                  ? "scale-105 shadow-lg opacity-100"
                  : "opacity-60 hover:opacity-90"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Selected zone panel (top right) ── */}
        {selected && (
          <div className="absolute top-4 right-4 bg-[#0f172a]/95 backdrop-blur border border-[#1f2937] rounded-xl p-4 z-[1000] w-60 shadow-2xl">
            <div className="flex justify-between items-start mb-3">
              <div className="font-bold text-white text-base">{selected.name}</div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-white text-xl leading-none"
              >×</button>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <div>
                🌡️ Temperature:{" "}
                <span className="text-white font-semibold">
                  {selected.temperature.toFixed(1)}°C
                </span>
              </div>
              {selected.vegetation !== undefined && (
                <div>
                  🌿 NDVI:{" "}
                  <span className="text-white font-semibold">
                    {selected.vegetation.toFixed(2)}
                  </span>
                </div>
              )}
              <div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: getCluster(selected.cluster).fill,
                    color:      getCluster(selected.cluster).color,
                  }}
                >
                  {getCluster(selected.cluster).label}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;