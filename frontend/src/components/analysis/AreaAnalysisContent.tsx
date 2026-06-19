import type { ComponentType } from "react";
import {
  Thermometer, Droplets, Wind, TreePine, Building2,
  Shield, AlertTriangle, RefreshCw, Activity, ArrowUpRight, Zap, Target, LineChart, Award
} from "lucide-react";

import type { AreaAnalysisReport } from "../../types/analysis";
import { PRIORITY_STYLES, SEVERITY_STYLES } from "./priorityStyles";

import { motion, AnimatePresence } from "framer-motion";
import { AILoadingState } from "./AILoadingState";
import type { Zone } from "../../hooks/useHeatData";
import { useSystemMode } from "../../hooks/useSystemMode";

type Props = {
  report?: AreaAnalysisReport | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  liveMetrics?: Zone;
};

const getGaugeColor = (value: number) => {
  if (value < 40) return "bg-green-500";
  if (value < 60) return "bg-yellow-500";
  if (value < 80) return "bg-orange-500";
  return "bg-red-500";
};

const ScoreBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
    <div className="h-2 rounded-full bg-[#1e293b] overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${getGaugeColor(value)}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  </div>
);

const RecommendationList = ({
  title,
  icon: Icon,
  items,
  accent,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  items: string[];
  accent: string;
}) => (
  <div className="bg-[#0f172a] border border-[#1f2937] rounded-xl p-4">
    <div className="flex items-center gap-2 mb-3">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
          <span className="text-gray-500 mt-0.5">•</span>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export const AreaAnalysisContent = ({ report, loading, error, onRefresh, liveMetrics }: Props) => {
  const { mode } = useSystemMode();
  const renderState = () => {
    if (loading) {
      return (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full flex items-center justify-center min-h-[500px]"
        >
          <AILoadingState metrics={liveMetrics} />
        </motion.div>
      );
    }

    if (error || !report) {
      return (
        <motion.div 
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center flex flex-col items-center justify-center min-h-[400px]"
        >
          <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
          <p className="text-red-300 text-base mb-4">{error || "No analysis data available"}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 transition font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Analysis
            </button>
          )}
        </motion.div>
      );
    }

  const priority = PRIORITY_STYLES[report.priority] ?? PRIORITY_STYLES.Moderate;

  const metrics = [
    { label: "Temperature", value: `${report.temperature.toFixed(1)}°C`, icon: Thermometer, color: "text-orange-400" },
    { label: "Humidity", value: `${report.humidity.toFixed(0)}%`, icon: Droplets, color: "text-blue-400" },
    { label: "Wind Speed", value: `${report.wind_speed.toFixed(1)} km/h`, icon: Wind, color: "text-gray-300" },
    { label: "Vegetation Index", value: report.vegetation_index.toFixed(2), icon: TreePine, color: "text-green-400" },
    { label: "Building Density", value: report.building_density.toFixed(0), icon: Building2, color: "text-purple-400" },
    { label: "Cluster", value: report.cluster_classification, icon: Shield, color: priority.text },
  ];

  const renderBadges = () => {
    const badges = [];
    if (report.risk_rank <= Math.max(1, report.total_areas * 0.1)) {
      badges.push(<span key="risk" className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded text-xs font-bold uppercase">Top 10% Risk</span>);
    }
    if (report.building_density > 150) {
      badges.push(<span key="density" className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-1 rounded text-xs font-bold uppercase">High Density Zone</span>);
    }
    if (report.priority === "Critical") {
      badges.push(<span key="critical" className="bg-red-600/30 text-red-300 border border-red-500/40 px-2 py-1 rounded text-xs font-bold uppercase">Critical Heat Zone</span>);
    }
    if (report.vegetation_index > 0.6) {
      badges.push(<span key="green" className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded text-xs font-bold uppercase">Green Buffer Area</span>);
    }
    
    return badges.length > 0 ? (
      <div className="flex flex-wrap gap-2 mt-2">
        {badges}
      </div>
    ) : null;
  };

    return (
      <motion.div
        key="content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
      {/* Warning Box if in simulation mode */}
      {mode === "SIMULATION" && (
        <div className="bg-gradient-to-r from-red-950/40 to-amber-950/30 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-1">
              ⚠️ SIMULATION DATA
            </h4>
            <p className="text-xs text-gray-200 leading-relaxed">
              This report is generated from simulated environmental conditions.
            </p>
            <p className="text-xs text-gray-200 leading-relaxed font-semibold mt-1">
              AI analysis is currently paused.
            </p>
            <p className="text-xs text-gray-400 leading-relaxed mt-1">
              Results are derived from the ML simulation engine and rule-based analytics.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner - Executive Summary & Takeaways */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Key Takeaways */}
        <div className="bg-[#0f172a] border border-[#1f2937] rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Key Takeaways</h3>
          </div>
          <ul className="space-y-3">
            {report.key_takeaways.map((takeaway, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-gray-300 leading-relaxed bg-[#1e293b]/50 p-3 rounded-lg border border-[#1f2937]/50">
                <span className="text-blue-400 font-bold mt-0.5">•</span>
                {takeaway}
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Priority Actions */}
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-[#1f2937] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-yellow-400" />
              <h3 className="text-base font-bold text-white">Priority Actions</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg">
                <div className="text-xs font-bold text-orange-400 uppercase mb-1">Highest Impact Action</div>
                <div className="text-sm text-gray-200">{report.highest_impact_action}</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                <div className="text-xs font-bold text-green-400 uppercase mb-1">Quick Win</div>
                <div className="text-sm text-gray-200">{report.quick_win}</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left main column (Metrics & Benchmarks) */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Area Standing */}
          <div className="bg-[#0f172a] border border-[#1f2937] rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Area Standing</h3>
              </div>
              <div className="text-xs text-gray-500">Out of {report.total_areas}</div>
            </div>
            
            {renderBadges()}
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#1e293b]/50 p-3 rounded-lg border border-[#1f2937]">
                <div className="text-xs text-gray-400 mb-1">Temperature Rank</div>
                <div className="text-xl font-bold text-white">#{report.temperature_rank}</div>
              </div>
              <div className="bg-[#1e293b]/50 p-3 rounded-lg border border-[#1f2937]">
                <div className="text-xs text-gray-400 mb-1">Risk Rank</div>
                <div className="text-xl font-bold text-red-400">#{report.risk_rank}</div>
              </div>
              <div className="bg-[#1e293b]/50 p-3 rounded-lg border border-[#1f2937]">
                <div className="text-xs text-gray-400 mb-1">Density Rank</div>
                <div className="text-xl font-bold text-white">#{report.density_rank}</div>
              </div>
              <div className="bg-[#1e293b]/50 p-3 rounded-lg border border-[#1f2937]">
                <div className="text-xs text-gray-400 mb-1">Vegetation Rank</div>
                <div className="text-xl font-bold text-green-400">#{report.vegetation_rank}</div>
              </div>
            </div>
          </div>

          {/* Metrics 3-col grid inside the left column */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-3">
            {metrics.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-[#0f172a] border border-[#1f2937] rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  {label}
                </div>
                <div className={`text-xl font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Benchmark Comparison */}
          <div className="bg-[#0f172a] border border-[#1f2937] rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-3">Benchmark Comparison</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {report.benchmark_comparison.map((bench, idx) => (
                <li key={idx} className="flex gap-2">
                  <Activity className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  {bench}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Right main column (Scores, Root Causes, Impact, Trends) */}
        <div className="xl:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Climate Trend Analysis */}
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/10 border border-blue-500/20 rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <LineChart className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Climate Trend Analysis</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{report.climate_trend_analysis}</p>
            </div>

            {/* Expected Impact */}
            <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/10 border border-emerald-500/20 rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Expected Impact</h3>
              </div>
              <ul className="space-y-2">
                {report.expected_impact.map((impact, idx) => (
                  <li key={idx} className="text-sm text-gray-300 leading-relaxed flex gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    {impact}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scores */}
            <div className="bg-[#0f172a] border border-[#1f2937] rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-white">Risk Assessment</h3>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${priority.bg} ${priority.text} ${priority.border}`}>
                  {report.priority} Priority
                </span>
              </div>
              <ScoreBar label="Risk Score" value={report.risk_score} />
              <ScoreBar label="Heat Trap Score" value={report.heat_trap_score} />
              <ScoreBar label="Urbanization Impact" value={report.urbanization_impact_score} />
              <ScoreBar label="Vegetation Deficit" value={report.vegetation_deficit_score} />
              
              <div className="pt-3 mt-3 border-t border-[#1f2937] flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-400">Data Quality</div>
                  <div className="text-sm font-bold text-white">{report.data_quality_score ?? 85}/100</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Confidence</div>
                  <div className="text-sm font-bold text-blue-400">{report.analysis_confidence ?? "High"}</div>
                </div>
              </div>
            </div>

            {/* Root Causes */}
            <div className="bg-[#0f172a] border border-[#1f2937] rounded-xl p-5 shadow-lg flex flex-col">
              <h3 className="text-base font-bold text-white mb-4">Root Cause Analysis</h3>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#1f2937] scrollbar-track-transparent">
                {report.root_causes.map((cause) => (
                  <div
                    key={cause.cause}
                    className={`border rounded-lg p-3 ${SEVERITY_STYLES[cause.severity] ?? SEVERITY_STYLES.moderate}`}
                  >
                    <div className="font-bold text-sm mb-1">{cause.cause}</div>
                    <div className="text-xs opacity-90 leading-relaxed">{cause.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Detailed Recommendations (Bottom Full Width) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RecommendationList
          title="Lifestyle & Community"
          icon={Thermometer}
          items={report.lifestyle_recommendations}
          accent="bg-orange-500/10 text-orange-400"
        />
        <RecommendationList
          title="Construction & Infrastructure"
          icon={Building2}
          items={report.construction_recommendations}
          accent="bg-purple-500/10 text-purple-400"
        />
        <RecommendationList
          title="Urban Planning"
          icon={TreePine}
          items={report.urban_planning_recommendations}
          accent="bg-green-500/10 text-green-400"
        />
      </div>

      {/* Executive Summary & Outlook */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] border border-[#1f2937] rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Executive Summary</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{report.executive_summary}</p>
        </div>
        <div className="bg-[#0f172a] border border-[#1f2937] rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Future Outlook</h3>
          <div className="space-y-3">
            <p className="text-sm text-red-300/80 leading-relaxed"><span className="font-bold text-red-400">Without Action:</span> {report.future_outlook.no_action}</p>
            <p className="text-sm text-green-300/80 leading-relaxed"><span className="font-bold text-green-400">With Mitigation:</span> {report.future_outlook.with_action}</p>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center font-mono py-2 relative z-10">
        Generated {new Date(report.generated_at).toLocaleString()} • Model Provider: {mode === "SIMULATION" ? "RULE ENGINE (SIMULATION ACTIVE)" : report.provider.toUpperCase()}
      </div>
      </motion.div>
    );
  };

  return <AnimatePresence mode="wait">{renderState()}</AnimatePresence>;
};
