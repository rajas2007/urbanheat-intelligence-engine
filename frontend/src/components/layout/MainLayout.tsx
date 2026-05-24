import { useState } from "react";
import { Sidebar } from "./Sidebar";

type Props = {
  children: React.ReactNode;
};

export const MainLayout = ({ children }: Props) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="flex min-h-screen w-full bg-[#0b0f19] text-white">
      
      {/* 🔥 Sidebar (GLOBAL) */}
      <Sidebar isOpen={isOpen} toggle={toggleSidebar} />

      {/* 📊 Main Content */}
      <div className="flex-1 transition-all duration-300 overflow-hidden">
        {children}
      </div>

    </div>
  );
};