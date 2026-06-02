import { useState } from "react";

import { useHeatData } from "../../hooks/useHeatData";
import { useSystemMode } from "../../hooks/useSystemMode";
import { Sidebar } from "./Sidebar";
import { SimulationConfirmModal } from "./SimulationConfirmModal";

type Props = {
  children: React.ReactNode;
};

export const MainLayout = ({ children }: Props) => {
  const [isOpen, setIsOpen] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mode, busy, enableSimulation, disableSimulation } = useSystemMode();
  const { refresh } = useHeatData();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const startSimulation = async () => {
    await enableSimulation();
    await refresh();
    setConfirmOpen(false);
  };

  const stopSimulation = async () => {
    await disableSimulation();
    await refresh();
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0b0f19] text-white">
      <Sidebar
        isOpen={isOpen}
        toggle={toggleSidebar}
        mode={mode}
        busy={busy}
        onRunSimulation={() => setConfirmOpen(true)}
        onStopSimulation={stopSimulation}
      />

      <div className="flex-1 transition-all duration-300 overflow-hidden">
        {children}
      </div>

      <SimulationConfirmModal
        open={confirmOpen}
        busy={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={startSimulation}
      />
    </div>
  );
};
