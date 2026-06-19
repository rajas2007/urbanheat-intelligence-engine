import os
from .base_provider import BasePDFProvider

def get_pdf_provider() -> BasePDFProvider:
    provider_name = os.getenv("PDF_PROVIDER", "reportlab").lower()
    
    if provider_name == "reportlab":
        from .providers.reportlab_provider import ReportLabProvider
        return ReportLabProvider()
    else:
        raise ValueError(f"Unknown PDF_PROVIDER: {provider_name}")

def generate_intelligence_report(report_data: dict, metrics_data: dict) -> bytes:
    provider = get_pdf_provider()
    return provider.generate_report(report_data, metrics_data)

def generate_city_intelligence_report(city_metrics: dict, area_reports: list) -> bytes:
    provider = get_pdf_provider()
    return provider.generate_city_report(city_metrics, area_reports)
