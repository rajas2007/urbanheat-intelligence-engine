import { LoaderCircle, Play, SquareDot } from "lucide-react";

type Props = {
  simulationActive: boolean;
  busy: boolean;
  onRun: () => void;
  onStop: () => void;
  fullWidth?: boolean;
  iconOnly?: boolean;
};

export const SimulationModeButton = ({
  simulationActive,
  busy,
  onRun,
  onStop,
  fullWidth,
  iconOnly,
}: Props) => {
  const Icon = busy ? LoaderCircle : simulationActive ? SquareDot : Play;
  const label = busy
    ? simulationActive
      ? "Stopping..."
      : "Running..."
    : simulationActive
    ? "Stop simulation"
    : "Run simulation";

  return (
    <button
      onClick={simulationActive ? onStop : onRun}
      disabled={busy}
      aria-label={label}
      title={iconOnly ? label : undefined}
      className={`
        inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2
        text-xs font-semibold transition-all duration-200
        disabled:cursor-not-allowed
        ${fullWidth ? "w-full" : ""}
        ${iconOnly ? "h-10 w-10 px-0" : ""}
        ${
          busy
            ? "border-gray-700 text-gray-600 cursor-not-allowed"
            : simulationActive
            ? "border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20"
            : "border-orange-500/40 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20"
        }
      `}
    >
      <Icon className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
};
