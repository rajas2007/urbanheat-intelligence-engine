import { AlertTriangle } from "lucide-react";

export const SimulationBanner = () => {
  return (
    <div className="bg-gradient-to-r from-amber-600/20 via-amber-500/20 to-amber-600/20 border-b border-amber-500/30 px-6 py-3 flex items-center justify-between text-amber-200 text-sm">
      <div className="flex items-center gap-3">
        <div className="bg-amber-500/20 p-1.5 rounded-lg border border-amber-500/30 animate-pulse">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <span className="font-bold text-amber-400 mr-2">⚠️ SIMULATION MODE ACTIVE:</span>
          Environmental conditions are simulated and ML-projected. AI-generated analysis is bypassed.
        </div>
      </div>
      <div className="flex items-center gap-2 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 text-xs font-mono uppercase tracking-wider text-amber-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        Sim Engine
      </div>
    </div>
  );
};
