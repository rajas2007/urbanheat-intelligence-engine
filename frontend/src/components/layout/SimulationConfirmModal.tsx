import { AnimatePresence, motion } from "framer-motion";
import { Activity, Play, Waves, X, Zap } from "lucide-react";

type Props = {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const SimulationConfirmModal = ({
  open,
  busy,
  onCancel,
  onConfirm,
}: Props) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/70 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-200">
                  <Play className="relative h-5 w-5" fill="currentColor" />
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-gray-500">
                    <Activity className="h-3 w-3" />
                    Predictive Engine
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-white">
                    Run Simulation
                  </h2>
                </div>
              </div>

              <button
                onClick={onCancel}
                className="rounded-md p-1.5 text-gray-500 transition hover:bg-white/5 hover:text-gray-200"
                disabled={busy}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-5 rounded-lg border border-white/8 bg-white/[0.025] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-400">
                <Waves className="h-3.5 w-3.5 text-amber-300/80" />
                Synthetic environmental variation
              </div>
              <p className="text-sm leading-6 text-gray-300">
                Simulation Mode generates synthetic environmental variations for
                testing and predictive analysis.
              </p>
            </div>

            <div className="relative mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={onCancel}
                disabled={busy}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className="group rounded-lg border border-amber-400/20 bg-amber-500/90 px-4 py-2 text-sm font-semibold text-[#111827] shadow-sm transition hover:bg-amber-400 disabled:opacity-60"
              >
                <span className="flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4" />
                  {busy ? "Starting..." : "Run Simulation"}
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
