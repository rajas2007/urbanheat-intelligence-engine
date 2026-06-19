import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useAreaAnalysis } from "../../hooks/useAreaAnalysis";
import { useHeatData } from "../../hooks/useHeatData";
import { AreaAnalysisContent } from "./AreaAnalysisContent";
import { downloadAnalysisPdf } from "../../services/analysisApi";

type AreaAnalysisModalProps = {
  isOpen: boolean;
  onClose: () => void;
  areaId: number | null;
  areaName: string | null;
};

export const AreaAnalysisModal = ({
  isOpen,
  onClose,
  areaId,
  areaName,
}: AreaAnalysisModalProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { report, loading, error, refresh } = useAreaAnalysis(
    isOpen ? areaId : null
  );
  
  const { zones } = useHeatData();
  const liveMetrics = areaId ? zones.find((z) => z.id === areaId) : undefined;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="relative w-[95vw] max-w-[1600px] h-[95vh] max-h-[1600px] flex flex-col bg-[#0b0f19] border border-[#1f2937] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2937] bg-[#0f172a]">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {areaName || "Area Analysis"}
                </h2>
                {report && (
                  <p className="text-sm text-gray-400 mt-0.5">
                    {report.region}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                {report && areaId && (
                  <button
                    onClick={async () => {
                      setIsDownloading(true);
                      try {
                        await downloadAnalysisPdf(areaId, areaName || "Area");
                      } catch (err) {
                        console.error(err);
                        alert("Failed to download PDF.");
                      } finally {
                        setIsDownloading(false);
                      }
                    }}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-semibold"
                  >
                    {isDownloading ? "Generating Area Report..." : "📄 Export Area Report"}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f2937] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#1f2937] scrollbar-track-transparent">
              <AreaAnalysisContent
                report={report}
                loading={loading}
                error={error}
                onRefresh={refresh}
                liveMetrics={liveMetrics}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
