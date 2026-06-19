import type { PriorityLevel } from "../../types/analysis";

export const PRIORITY_STYLES: Record<
  PriorityLevel,
  { text: string; bg: string; border: string; bar: string }
> = {
  Critical: {
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    bar: "bg-red-500",
  },
  High: {
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    bar: "bg-orange-500",
  },
  Moderate: {
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    bar: "bg-yellow-400",
  },
  Low: {
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    bar: "bg-cyan-400",
  },
};

export const SEVERITY_STYLES: Record<string, string> = {
  Critical: "text-red-500 bg-red-500/10 border-red-500/30 font-bold",
  High: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  Moderate: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  Low: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  // Fallbacks for older reports
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  moderate: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
};

