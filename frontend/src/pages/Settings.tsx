import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { SimulationModeButton } from "../components/layout/SimulationModeButton";
import { useSettings } from "../hooks/useSettings";
import { useSystemMode } from "../hooks/useSystemMode";
import { useHeatData } from "../hooks/useHeatData";

type AppSettings = import("../hooks/useSettings").AppSettings;

// ─── Reusable UI ────────────────────────────────────────────────────

const SettingCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="bg-[#111827] rounded-2xl border border-[#1f2937] overflow-hidden">
    <div className="px-6 py-4 border-b border-[#1f2937] text-center">
      <h2 className="text-sm font-semibold text-white tracking-wide">{title}</h2>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <div className="px-6 py-5 space-y-5">{children}</div>
  </div>
);

const FieldRow = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
      <label className="text-sm text-gray-300 font-medium">{label}</label>
      {hint && <span className="text-xs text-gray-600 sm:text-right">{hint}</span>}
    </div>
    {children}
  </div>
);

const Toggle = ({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) => (
  <div className="flex items-center justify-between py-1">
    <div className="flex-1 pr-4">
      <p className="text-sm text-gray-300">{label}</p>
      {description && <p className="text-xs text-gray-600 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40 ${
        enabled ? "bg-orange-500" : "bg-[#1f2937]"
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

const NumberInput = ({
  value,
  onChange,
  placeholder,
  unit,
  min,
  max,
}: {
  value: number | string;
  onChange: (v: number) => void;
  placeholder?: string;
  unit?: string;
  min?: number;
  max?: number;
}) => (
  <div className="relative">
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-full bg-[#0b0f19] border border-[#1f2937] text-white text-sm rounded-lg px-3 py-2.5 pr-14 placeholder-gray-600
        focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20
        hover:border-[#374151] transition-colors
        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
    {unit && (
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
        {unit}
      </span>
    )}
  </div>
);

const SelectInput = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full bg-[#0b0f19] border border-[#1f2937] text-white text-sm rounded-lg px-3 py-2.5
      focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20
      hover:border-[#374151] transition-colors appearance-none cursor-pointer"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 12px center",
    }}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value} className="bg-[#111827]">
        {o.label}
      </option>
    ))}
  </select>
);

const StatusDot = ({ active }: { active: boolean }) => (
  <span
    className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
      active ? "bg-emerald-400" : "bg-gray-600"
    }`}
  />
);

// ─── Main Component ─────────────────────────────────────────────────

const Settings = () => {
  const { settings, update, save, reset, savedAt } = useSettings();
  const { mode, busy, enableSimulation, disableSimulation } = useSystemMode();
  const { refresh } = useHeatData();

  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const simulationActive = mode === "SIMULATION";

  // Area Selection States
  const [regionsData, setRegionsData] = useState<{ region: string; areas: { name: string; is_selected: boolean }[] }[]>([]);
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/settings/areas/");
        const data = await res.json();
        setRegionsData(data);
        
        const selected: string[] = [];
        data.forEach((r: any) => {
          r.areas.forEach((a: any) => {
            if (a.is_selected) {
              selected.push(a.name);
            }
          });
        });
        setTempSelected(selected);
      } catch (err) {
        console.error("Failed to load areas:", err);
      }
    };
    fetchAreas();
  }, []);

  const handleSave = async () => {
    try {
      save();

      const res = await fetch("http://127.0.0.1:8000/api/settings/areas/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_names: tempSelected }),
      });

      if (!res.ok) throw new Error("Failed to save areas selection");

      await refresh();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
    }
  };

  const handleReset = () => {
    reset();
    const allNames = regionsData.flatMap((r) => r.areas.map((a) => a.name));
    setTempSelected(allNames);
  };

  const handleToggleRegionAll = (regionName: string, regionAreas: string[]) => {
    const allSelectedInRegion = regionAreas.every(name => tempSelected.includes(name));
    if (allSelectedInRegion) {
      const remainingSelected = tempSelected.filter(name => !regionAreas.includes(name));
      if (remainingSelected.length === 0) {
        setTempSelected([regionAreas[0]]);
      } else {
        setTempSelected(remainingSelected);
      }
    } else {
      setTempSelected(prev => {
        const next = [...prev];
        regionAreas.forEach(name => {
          if (!next.includes(name)) {
            next.push(name);
          }
        });
        return next;
      });
    }
  };

  const isSearching = searchQuery.trim().length > 0;
  const isRegionExpanded = (regionName: string) => {
    if (isSearching) return true;
    return !!expandedRegions[regionName];
  };

  const toggleRegion = (regionName: string) => {
    setExpandedRegions(prev => ({
      ...prev,
      [regionName]: !prev[regionName]
    }));
  };

  const filteredRegions = regionsData.map(r => {
    const matchingAreas = r.areas.filter(a =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...r,
      areas: matchingAreas
    };
  }).filter(r => r.areas.length > 0);

  return (
    <div className="max-w-xl mx-auto px-4 py-10">

      {/* ── Page Header ── */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure monitoring, alerts, and display preferences
        </p>
        {savedAt && (
          <p className="text-xs text-gray-600 mt-2">
            Last saved at {savedAt.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="space-y-4">

        {/* ── Monitoring ── */}
        <SettingCard
          title="Monitoring"
          description="Sensor thresholds and polling configuration"
        >
          <FieldRow
            label="Temperature Threshold"
            hint="Alert fires above this value"
          >
            <NumberInput
              value={settings.tempThreshold}
              onChange={(v) => update({ tempThreshold: v })}
              placeholder="35"
              unit="°C"
              min={0}
              max={100}
            />
          </FieldRow>

          <FieldRow
            label="Update Interval"
            hint="Polling rate for /api/clusters/"
          >
            <NumberInput
              value={settings.updateInterval}
              onChange={(v) => update({ updateInterval: v })}
              placeholder="2"
              unit="secs"
              min={1}
              max={60}
            />
          </FieldRow>

          <FieldRow
            label="Alert Cooldown"
            hint="Min time between repeated alerts"
          >
            <NumberInput
              value={settings.alertCooldown}
              onChange={(v) => update({ alertCooldown: v })}
              placeholder="30"
              unit="mins"
              min={1}
            />
          </FieldRow>
        </SettingCard>

        {/* ── Display ── */}
        <SettingCard title="Display" description="Units and regional preferences">
          <FieldRow label="Temperature Unit">
            <SelectInput
              value={settings.tempUnit}
              onChange={(v) => update({ tempUnit: v as AppSettings["tempUnit"] })}
              options={[
                { value: "celsius", label: "Celsius (°C)" },
                { value: "fahrenheit", label: "Fahrenheit (°F)" },
                { value: "kelvin", label: "Kelvin (K)" },
              ]}
            />
          </FieldRow>

          <FieldRow label="Timezone">
            <SelectInput
              value={settings.timezone}
              onChange={(v) => update({ timezone: v })}
              options={[
                { value: "ist", label: "IST — Asia/Kolkata" },
                { value: "utc", label: "UTC" },
                { value: "est", label: "EST — America/New_York" },
                { value: "pst", label: "PST — America/Los_Angeles" },
                { value: "cet", label: "CET — Europe/Berlin" },
              ]}
            />
          </FieldRow>

          <FieldRow label="Data Retention">
            <SelectInput
              value={settings.dataRetention}
              onChange={(v) => update({ dataRetention: v })}
              options={[
                { value: "7", label: "7 days" },
                { value: "30", label: "30 days" },
                { value: "90", label: "90 days" },
                { value: "365", label: "1 year" },
                { value: "0", label: "Forever" },
              ]}
            />
          </FieldRow>
        </SettingCard>

        {/* ── Notifications ── */}
        <SettingCard title="Notifications" description="Alert channels and behaviour">
          <Toggle
            enabled={settings.notifications}
            onChange={(v) => update({ notifications: v })}
            label="In-app notifications"
            description="Show alerts in the dashboard header"
          />
          <div className="border-t border-[#1f2937]" />
          <Toggle
            enabled={settings.emailAlerts}
            onChange={(v) => update({ emailAlerts: v })}
            label="Email alerts"
            description="Send critical alerts to your registered email"
          />
          <div className="border-t border-[#1f2937]" />
          <Toggle
            enabled={settings.soundAlerts}
            onChange={(v) => update({ soundAlerts: v })}
            label="Sound alerts"
            description="Play audio when threshold is exceeded"
          />
        </SettingCard>

        {/* ── System ── */}
        <SettingCard title="System" description="Behaviour and appearance">
          <Toggle
            enabled={settings.autoRefresh}
            onChange={(v) => update({ autoRefresh: v })}
            label="Auto refresh"
            description="Dashboard polls /api/clusters/ on the interval above"
          />
        </SettingCard>

        {/* ── Customize Areas ── */}
        <SettingCard title="Customize Areas" description="Select which regions to monitor">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0b0f19] border border-[#1f2937] text-white text-sm rounded-lg px-3 py-2.5 pl-10
                  focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20
                  hover:border-[#374151] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredRegions.map((region) => {
              const allAreasInRegion = region.areas.map(a => a.name);
              const allSelectedInRegion = allAreasInRegion.every(name => tempSelected.includes(name));
              const someSelectedInRegion = allAreasInRegion.some(name => tempSelected.includes(name));
              const isExpanded = isRegionExpanded(region.region);

              return (
                <div key={region.region} className="border border-[#1f2937] rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleRegion(region.region)}
                    className="w-full flex items-center justify-between p-3 bg-[#0b0f19] hover:bg-[#111827] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <input
                        type="checkbox"
                        checked={allSelectedInRegion || someSelectedInRegion}
                        onChange={() => handleToggleRegionAll(region.region, allAreasInRegion)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-300">{region.region}</span>
                      <span className="text-xs text-gray-500">
                        ({allAreasInRegion.filter(name => tempSelected.includes(name)).length}/{allAreasInRegion.length})
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-[#0b0f19] border-t border-[#1f2937] space-y-2 p-3">
                      {region.areas.map((area) => (
                        <label
                          key={area.name}
                          className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[#111827] rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={tempSelected.includes(area.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTempSelected([...tempSelected, area.name]);
                              } else {
                                const remaining = tempSelected.filter(n => n !== area.name);
                                if (remaining.length > 0) {
                                  setTempSelected(remaining);
                                }
                              }
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-sm text-gray-300">{area.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SettingCard>

        {/* ── Backend ── */}
        <SettingCard title="Backend" description="Direct controls for the Django API">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-gray-300">Force data simulation</p>
              <p className="text-xs text-gray-600 mt-0.5 truncate">
                {simulationActive ? "Simulation mode is active" : "Live data mode is active"}
              </p>
            </div>
            <SimulationModeButton
              simulationActive={simulationActive}
              busy={busy}
              onRun={enableSimulation}
              onStop={disableSimulation}
            />
          </div>

          <div className="border-t border-[#1f2937]" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">API base URL</p>
              <p className="text-xs text-gray-600 mt-0.5">Read-only — edit in source</p>
            </div>
            <code className="text-xs text-gray-500 bg-[#0b0f19] px-3 py-1.5 rounded-lg border border-[#1f2937]">
              127.0.0.1:8000
            </code>
          </div>
        </SettingCard>

        {/* ── System Status ── */}
        <div className="bg-[#111827] rounded-2xl border border-[#1f2937] px-6 py-5">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-4 text-center">
            System Status
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Data stream", active: settings.autoRefresh },
              { label: "Alert engine", active: settings.notifications },
              { label: "Email service", active: settings.emailAlerts },
              { label: "Sound engine", active: settings.soundAlerts },
            ].map(({ label, active }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-[#0b0f19] rounded-lg px-3 py-2 border border-[#1f2937]"
              >
                <StatusDot active={active} />
                <span className="text-xs text-gray-400 flex-1">{label}</span>
                <span className={`text-xs font-medium ${active ? "text-emerald-400" : "text-gray-600"}`}>
                  {active ? "On" : "Off"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex items-center justify-between pt-1 pb-6">
          <button
            onClick={handleReset}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
          >
            Reset to defaults
          </button>

          <button
            onClick={handleSave}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              saveState === "saved"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : saveState === "error"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-orange-500 hover:bg-orange-400 active:scale-95 text-white shadow-lg shadow-orange-500/20"
            }`}
          >
            {saveState === "saved" ? "✓ Saved"
              : saveState === "error" ? "✗ Error"
              : "Save changes"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
