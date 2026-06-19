import { motion } from "framer-motion";
import { Brain, Thermometer, Droplets, Wind, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import type { Zone } from "../../hooks/useHeatData";

const MESSAGES = [
  "Analyzing environmental conditions...",
  "Evaluating urban heat patterns...",
  "Calculating mitigation priorities...",
  "Generating climate resilience recommendations...",
  "Assessing vegetation impact...",
  "Preparing urban planning intelligence...",
];

export const AILoadingState = ({ metrics }: { metrics?: Zone }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full min-h-[500px] text-center px-4 py-8">
      {/* Pulsing AI Brain Icon */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="mb-8 relative"
      >
        <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl" />
        <Brain className="w-16 h-16 text-cyan-400 relative z-10" />
      </motion.div>

      {/* Title & Subtitle */}
      <h2 className="text-2xl font-bold text-white mb-2">Generating AI Heat Intelligence Report</h2>
      <p className="text-gray-400 mb-8 max-w-md">Analyzing real-time environmental and urban data</p>

      {/* Progress Bar */}
      <div className="w-64 h-1.5 bg-[#1f2937] rounded-full overflow-hidden mb-6 relative">
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 15, ease: "linear" }}
        />
      </div>

      {/* Rotating Intelligence Message */}
      <motion.p
        key={messageIndex}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className="text-cyan-300 font-mono text-sm h-6 mb-8"
      >
        {MESSAGES[messageIndex]}
      </motion.p>

      <p className="text-xs text-gray-500 mb-12">This may take a few seconds</p>

      {/* Live Metrics (Optional Enhancement) */}
      {metrics && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mt-auto"
        >
          <MetricCard icon={Thermometer} label="Temperature" value={`${metrics.temperature.toFixed(1)}°C`} color="text-orange-400" />
          <MetricCard icon={Droplets} label="Humidity" value={`${metrics.humidity.toFixed(0)}%`} color="text-blue-400" />
          <MetricCard icon={Wind} label="Wind Speed" value={`${metrics.wind.toFixed(1)} km/h`} color="text-gray-300" />
          <MetricCard 
            icon={Shield} 
            label="Risk Level" 
            value={metrics.cluster === 2 ? "Critical" : metrics.cluster === 1 ? "Moderate" : "Low"} 
            color={metrics.cluster === 2 ? "text-red-400" : metrics.cluster === 1 ? "text-yellow-400" : "text-green-400"} 
          />
        </motion.div>
      )}
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-[#0f172a] border border-[#1f2937] rounded-lg px-4 py-3 flex items-center gap-3 w-[160px] text-left">
    <Icon className={`w-5 h-5 ${color}`} />
    <div>
      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</div>
      <div className="text-sm font-bold text-gray-200">{value}</div>
    </div>
  </div>
);
