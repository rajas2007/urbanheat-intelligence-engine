import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronRight, Activity, Server, Cpu, FileText, Settings2, Database, FileOutput, CheckCircle, XCircle, Clock } from "lucide-react";
import { SimulationModeButton } from "../components/layout/SimulationModeButton";
import { useSystemMode } from "../hooks/useSystemMode";
import { useHeatData } from "../hooks/useHeatData";
import { useSystemSettings } from "../hooks/useSystemSettings";
import { useSettings } from "../hooks/useSettings";
import { API_BASE_URL } from "../config";

type AppSettings = import("../hooks/useSettings").AppSettings;

// ─── Reusable UI ────────────────────────────────────────────────────

const SettingCard = ({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: any;
  children: React.ReactNode;
}) => (
  <div className="bg-[#111827] rounded-2xl border border-[#1f2937] overflow-hidden">
    <div className="px-6 py-4 border-b border-[#1f2937] flex items-center gap-3">
      {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      <div>
        <h2 className="text-sm font-semibold text-white tracking-wide">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
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

// ─── Main Component ─────────────────────────────────────────────────

const Settings = () => {
  const { data: sysData, loading: sysLoading, saving: sysSaving, updateSettings, refresh: sysRefresh } = useSystemSettings();
  const { mode, busy, enableSimulation, disableSimulation } = useSystemMode();
  const { refresh } = useHeatData();
  const { settings: localSettings, update: updateLocalSettings, save: saveLocalSettings, reset: resetLocal } = useSettings();

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
        const res = await fetch(`${API_BASE_URL}/api/settings/areas/`);
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
      setSaveState("idle");
      // Save areas
      const res = await fetch(`${API_BASE_URL}/api/settings/areas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_names: tempSelected }),
      });
      if (!res.ok) throw new Error("Failed to save areas selection");

      // Save Local user settings
      saveLocalSettings();

      await refresh();
      await sysRefresh();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
    }
  };

  const handleReset = () => {
    resetLocal();
    const allNames = regionsData.flatMap((r) => r.areas.map((a) => a.name));
    setTempSelected(allNames);
  };

  const handleToggleRegionAll = (_: string, regionAreas: string[]) => {
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

  if (sysLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading System Control Center...
      </div>
    );
  }

  // Fallback defaults if sysData is unavailable (e.g. backend failed)
  const fallbackSysData = {
    analysis_mode: "rule_engine" as const,
    pdf_report_type: "full" as const,
    include_executive_summary: true,
    include_rankings: true,
    include_area_details: true,
    include_recommendations: true,
    include_appendix: true,
    health: {
      active_areas: 0,
      current_mode: mode || "REAL",
      llm_provider: "Unknown",
      analysis_mode: "rule_engine",
      cached_reports: 0,
      last_analysis: null,
      last_pdf: null,
      system_version: "1.0.0",
    }
  };

  const sysDataEffective = sysData || fallbackSysData;
  const health = sysDataEffective.health || fallbackSysData.health;

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "Never";
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">

      {/* ── Page Header ── */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-3">
          <Settings2 className="w-6 h-6 text-orange-500" /> Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure monitoring, alerts, and display preferences
        </p>
      </div>

      <div className="space-y-6">
        
        {/* ── AI Configuration ── */}
        <SettingCard
          title="AI Configuration"
          description="Manage LLM integration and rule fallback behavior"
          icon={Cpu}
        >
          <FieldRow label="Analysis Mode" hint="Select the active processing engine">
            <SelectInput
              value={sysDataEffective.analysis_mode}
              onChange={(v) => updateSettings({ analysis_mode: v as any })}
              options={[
                { value: "rule_engine", label: "Rule Engine Only (Deterministic)" },
                { value: "ai_enhanced", label: "AI Enhanced (Gemini + Rules)" },
              ]}
            />
          </FieldRow>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-[#0b0f19] border border-[#1f2937] rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Active LLM Provider</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-sm text-gray-200 capitalize font-medium">{health.llm_provider || "Unknown"}</span>
              </div>
            </div>
            <div className="bg-[#0b0f19] border border-[#1f2937] rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Provider Status</p>
              <p className="text-sm text-gray-200 flex items-center gap-2 font-medium">
                {sysDataEffective.analysis_mode === "ai_enhanced" ? "Connected" : "Bypassed"}
              </p>
            </div>
          </div>
        </SettingCard>

        {/* ── PDF Report Settings ── */}
        <SettingCard
          title="PDF Report Configuration"
          description="Control sections included in the City Intelligence Report"
          icon={FileText}
        >
          <FieldRow label="Report Scope">
            <SelectInput
              value={sysDataEffective.pdf_report_type}
              onChange={(v) => updateSettings({ pdf_report_type: v as any })}
              options={[
                { value: "executive", label: "Executive Report (Summary Only)" },
                { value: "full", label: "Full Technical Report" },
              ]}
            />
          </FieldRow>

          <div className="space-y-1 mt-4 pt-4 border-t border-[#1f2937]">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Include Sections</p>
            <Toggle
              enabled={sysDataEffective.include_executive_summary}
              onChange={(v) => updateSettings({ include_executive_summary: v })}
              label="Executive Summary"
            />
            <Toggle
              enabled={sysDataEffective.include_rankings}
              onChange={(v) => updateSettings({ include_rankings: v })}
              label="City Risk Rankings"
            />
            <Toggle
              enabled={sysDataEffective.include_area_details}
              onChange={(v) => updateSettings({ include_area_details: v })}
              label="Individual Area Reports"
              description="Ignored if Scope is 'Executive Report'"
            />
            <Toggle
              enabled={sysDataEffective.include_recommendations}
              onChange={(v) => updateSettings({ include_recommendations: v })}
              label="Final Recommendations"
            />
            <Toggle
              enabled={sysDataEffective.include_appendix}
              onChange={(v) => updateSettings({ include_appendix: v })}
              label="Technical Appendix"
            />
          </div>
        </SettingCard>

        {/* ── User UI Preferences (Local) ── */}
        <SettingCard title="User Interface Preferences" description="Local display settings" icon={Settings2}>
           <FieldRow
              label="Temperature Threshold"
              hint="Alert fires above this value"
            >
              <NumberInput
                value={localSettings.tempThreshold}
                onChange={(v) => updateLocalSettings({ tempThreshold: v })}
                placeholder="35"
                unit="°C"
                min={0}
                max={100}
              />
            </FieldRow>
            <FieldRow label="Temperature Unit">
              <SelectInput
                value={localSettings.tempUnit}
                onChange={(v) => updateLocalSettings({ tempUnit: v as AppSettings["tempUnit"] })}
                options={[
                  { value: "celsius", label: "Celsius (°C)" },
                  { value: "fahrenheit", label: "Fahrenheit (°F)" },
                  { value: "kelvin", label: "Kelvin (K)" },
                ]}
              />
            </FieldRow>
        </SettingCard>

        {/* ── Area Management ── */}
        <SettingCard
          title="Area Management"
          description="Select regions active in the monitoring database"
          icon={Database}
        >
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

          <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#1f2937]">
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
                    <div className="bg-[#0b0f19] border-t border-[#1f2937] space-y-1 p-2">
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

        {/* ── Simulation Controls ── */}
        <SettingCard title="Simulation Engine" icon={Server}>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-gray-300">Force Data Simulation</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Replaces real sensor data with synthetic patterns to test clusters.
              </p>
            </div>
            <SimulationModeButton
              simulationActive={simulationActive}
              busy={busy}
              onRun={enableSimulation}
              onStop={disableSimulation}
            />
          </div>
        </SettingCard>

        {/* ── System Health ── */}
        <div className="bg-[#111827] rounded-2xl border border-[#1f2937] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1f2937] bg-orange-950/10 flex items-center gap-3">
            <Activity className="w-5 h-5 text-orange-400" />
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">System Health</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-xs text-gray-400">Version</span>
              <span className="font-medium text-white">{health.system_version || "1.0.0"}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-xs text-gray-400">Active Areas</span>
              <span className="font-medium text-white">{health.active_areas || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-xs text-gray-400">Current Mode</span>
              <span className={`font-bold ${health.current_mode === "SIMULATION" ? "text-orange-400" : "text-emerald-400"}`}>
                {health.current_mode || "REAL"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-xs text-gray-400">Cached Reports</span>
              <span className="font-medium text-white">{health.cached_reports || 0} items</span>
            </div>
            
            <div className="border-t border-[#1f2937] pt-4 space-y-3">
              <div>
                <span className="text-xs text-gray-500 flex items-center gap-1.5 mb-1"><Clock className="w-3 h-3"/> Last Analysis Generated</span>
                <p className="text-xs font-mono text-gray-300 bg-[#0b0f19] px-2 py-1.5 rounded">{formatDate(health.last_analysis)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 flex items-center gap-1.5 mb-1"><FileOutput className="w-3 h-3"/> Last PDF Generated</span>
                <p className="text-xs font-mono text-gray-300 bg-[#0b0f19] px-2 py-1.5 rounded">{formatDate(health.last_pdf)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex items-center justify-between pt-2 pb-6">
          <button
            onClick={handleReset}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
          >
            Reset to defaults
          </button>

          <button
            onClick={handleSave}
            disabled={sysSaving}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              saveState === "saved"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : saveState === "error"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-orange-500 hover:bg-orange-400 active:scale-95 text-white shadow-lg shadow-orange-500/20"
            }`}
          >
            {sysSaving ? (
              <span className="flex items-center gap-2">Saving...</span>
            ) : saveState === "saved" ? (
              <><CheckCircle className="w-4 h-4"/> Saved</>
            ) : saveState === "error" ? (
              <><XCircle className="w-4 h-4"/> Error</>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
