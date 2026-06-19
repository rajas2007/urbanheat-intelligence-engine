from abc import ABC, abstractmethod
from typing import Dict, Any

class BasePDFProvider(ABC):
    """
    Abstract base class for PDF generation providers.
    """

    @abstractmethod
    def generate_report(self, report_data: Dict[str, Any], metrics_data: Dict[str, Any]) -> bytes:
        """
        Generates a PDF report from the analysis report data and live metrics.
        Returns the PDF file contents as bytes.
        """
        pass

    @abstractmethod
    def generate_city_report(self, city_metrics: Dict[str, Any], area_reports: list[Dict[str, Any]]) -> bytes:
        """
        Generates a consolidated city-wide PDF report.
        Returns the PDF file contents as bytes.
        """
        pass
