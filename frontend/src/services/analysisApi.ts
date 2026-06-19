import type { AreaAnalysisReport } from "../types/analysis";
const API_BASE = "http://127.0.0.1:8000/api";

export async function fetchAreaAnalysis(
  areaId: number,
  refresh = false,
): Promise<AreaAnalysisReport> {
  const params = refresh ? "?refresh=true" : "";
  const response = await fetch(`${API_BASE}/analysis/${areaId}/${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Analysis fetch failed (${response.status})`);
  }

  return response.json();
}

export async function downloadAnalysisPdf(areaId: number, areaName: string): Promise<void> {
  const response = await fetch(`${API_BASE}/analysis/${areaId}/pdf/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`PDF generation failed (${response.status})`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Intelligence_Report_${areaName.replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function downloadCityPdf(): Promise<void> {
  const response = await fetch(`${API_BASE}/analysis/city/pdf/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`City PDF generation failed (${response.status})`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Pune_City_Intelligence_Report.pdf`;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
