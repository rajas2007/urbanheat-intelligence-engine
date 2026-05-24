import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  variant?: "hot" | "warning" | "cool";
  trend?: {
    value: number;
    label: string;
  };
};

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "hot",
  trend,
}: Props) => {

  const glow =
    variant === "hot"
      ? "shadow-[0_0_40px_rgba(239,68,68,0.15)] border-red-500/30"
      : variant === "warning"
      ? "shadow-[0_0_40px_rgba(249,115,22,0.15)] border-orange-500/30"
      : "shadow-[0_0_40px_rgba(34,197,94,0.15)] border-green-500/30";

  const isVegetation =
    title === "Vegetation Index";

  const trendColor =
    trend
      ? isVegetation
        ? (
            trend.value >= 0
              ? "text-green-400"
              : "text-red-400"
          )
        : (
            trend.value >= 0
              ? "text-red-400"
              : "text-green-400"
          )
      : "";

  const trendArrow =
    trend
      ? trend.value >= 0
        ? "↑"
        : "↓"
      : "";

  return (
    <div
      className={`bg-[#0f172a] border rounded-xl p-5 ${glow}`}
    >

      <div className="flex justify-between items-center mb-2">

        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Icon className="w-4 h-4" />
          {title}
        </div>

        {trend && (

          <span
            className={`text-xs ${trendColor}`}
          >
            {trendArrow}{" "}
            {Math.abs(
              trend.value
            ).toFixed(1)}
            %
          </span>

        )}

      </div>

      <div className="text-3xl font-bold text-white">
        {value}
      </div>

      <div className="text-xs text-gray-400 mt-1">
        {subtitle}
      </div>

    </div>
  );
};