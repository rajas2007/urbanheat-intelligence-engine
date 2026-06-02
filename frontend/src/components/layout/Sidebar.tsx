import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Flame,
  LayoutDashboard,
  Map,
  Menu,
  Settings,
} from "lucide-react";
import { SimulationModeButton } from "./SimulationModeButton";

type Props = {
  isOpen: boolean;
  toggle: () => void;
  mode: "REAL" | "SIMULATION";
  busy: boolean;
  onRunSimulation: () => void;
  onStopSimulation: () => void;
};

export const Sidebar = ({
  isOpen,
  toggle,
  mode,
  busy,
  onRunSimulation,
  onStopSimulation,
}: Props) => {
  const location = useLocation();
  const simulationActive = mode === "SIMULATION";

  return (
    <div
      className={`
        ${isOpen ? "w-64" : "w-20"}
        min-h-screen bg-[#0f172a] border-r border-[#1f2937]
        p-4 transition-all duration-300
      `}
    >
      <div className="flex items-center justify-between mb-8">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-500">
              <Flame className="text-white w-5 h-5" />
            </div>
            <span className="text-white font-semibold">Dashboard</span>
          </div>
        )}

        <button onClick={toggle}>
          <Menu className="text-gray-400 hover:text-white" />
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <SidebarItem
          to="/"
          icon={LayoutDashboard}
          label="Overview"
          isOpen={isOpen}
          active={location.pathname === "/"}
        />

        <SidebarItem
          to="/map"
          icon={Map}
          label="Heat Map"
          isOpen={isOpen}
          active={location.pathname === "/map"}
        />

        <SidebarItem
          to="/analytics"
          icon={BarChart3}
          label="Analytics"
          isOpen={isOpen}
          active={location.pathname === "/analytics"}
        />

        <SidebarItem
          to="/settings"
          icon={Settings}
          label="Settings"
          isOpen={isOpen}
          active={location.pathname === "/settings"}
        />
      </div>

      <div className="mt-8 border-t border-[#1f2937] pt-4">
        <div
          className={`mb-3 inline-flex max-w-full items-center gap-2 rounded-md border px-2 py-1 ${
            simulationActive
              ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          <span className="flex h-2 w-2 items-center justify-center">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                simulationActive
                  ? "bg-amber-400"
                  : "bg-emerald-400"
              }`}
            />
          </span>
          {isOpen && (
            <span className="truncate text-[11px] font-medium">
              {simulationActive ? "Simulation Active" : "Live Data"}
            </span>
          )}
        </div>

        <SimulationModeButton
          simulationActive={simulationActive}
          busy={busy}
          onRun={onRunSimulation}
          onStop={onStopSimulation}
          fullWidth={isOpen}
          iconOnly={!isOpen}
        />
      </div>
    </div>
  );
};

type ItemProps = {
  to: string;
  icon: any;
  label: string;
  isOpen: boolean;
  active?: boolean;
};

const SidebarItem = ({ to, icon: Icon, label, isOpen, active }: ItemProps) => {
  return (
    <Link to={to}>
      <div
        className={`
          flex items-center gap-3 p-2 rounded-lg cursor-pointer transition
          ${
            active
              ? "bg-[#1f2937] text-white"
              : "text-gray-400 hover:text-white hover:bg-[#1f2937]"
          }
        `}
      >
        <Icon size={18} />
        {isOpen && <span>{label}</span>}
      </div>
    </Link>
  );
};
