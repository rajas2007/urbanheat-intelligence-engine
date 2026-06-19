import { BrowserRouter, Routes, Route } from "react-router-dom";

import { MainLayout } from "./components/layout/MainLayout";

import Index from "./pages/Index";
import MapView from "./pages/MapView";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";


function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/analytics" element={<Analytics />} />

          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;