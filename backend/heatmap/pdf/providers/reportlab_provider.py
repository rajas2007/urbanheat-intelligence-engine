import io
import datetime
from typing import Dict, Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.platypus.flowables import KeepTogether, HRFlowable

from ..base_provider import BasePDFProvider

class ReportLabProvider(BasePDFProvider):
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.primary_color = colors.HexColor("#0f172a") # Navy
        self.accent_color = colors.HexColor("#06b6d4") # Cyan
        
        # Risk colors
        self.color_low = colors.HexColor("#22c55e")
        self.color_moderate = colors.HexColor("#eab308")
        self.color_high = colors.HexColor("#f97316")
        self.color_critical = colors.HexColor("#ef4444")
        
        self._setup_styles()

    def _setup_styles(self):
        self.styles.add(ParagraphStyle(
            name='CoverTitle',
            parent=self.styles['Heading1'],
            fontSize=28,
            leading=34,
            spaceAfter=30,
            textColor=self.primary_color,
            alignment=1 # Center
        ))
        
        self.styles.add(ParagraphStyle(
            name='CoverSubtitle',
            parent=self.styles['Heading2'],
            fontSize=18,
            leading=24,
            spaceAfter=20,
            textColor=self.accent_color,
            alignment=1
        ))

        self.styles.add(ParagraphStyle(
            name='CoverText',
            parent=self.styles['Normal'],
            fontSize=12,
            leading=18,
            spaceAfter=10,
            alignment=1
        ))
        
        self.styles.add(ParagraphStyle(
            name='ReportHeading1',
            parent=self.styles['Heading1'],
            fontSize=20,
            leading=24,
            spaceAfter=15,
            textColor=self.primary_color,
            borderPadding=10,
        ))

        self.styles.add(ParagraphStyle(
            name='ReportHeading2',
            parent=self.styles['Heading2'],
            fontSize=16,
            leading=20,
            spaceAfter=10,
            textColor=self.primary_color
        ))

        self.styles.add(ParagraphStyle(
            name='ReportBody',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=14,
            spaceAfter=8,
            textColor=colors.HexColor("#333333")
        ))
        
        self.styles.add(ParagraphStyle(
            name='InsightCard',
            parent=self.styles['Normal'],
            fontSize=11,
            leading=16,
            spaceAfter=12,
            textColor=self.primary_color,
            leftIndent=15,
            rightIndent=15,
            borderPadding=10,
            borderColor=self.accent_color,
            borderWidth=1,
            backColor=colors.HexColor("#f0fdfa")
        ))

    def _get_risk_color(self, priority: str):
        p = priority.lower()
        if "low" in p or "safe" in p: return self.color_low
        if "moderate" in p: return self.color_moderate
        if "high" in p: return self.color_high
        return self.color_critical

    def _header_footer(self, canvas, doc):
        canvas.saveState()
        
        # Header
        canvas.setFont('Helvetica-Bold', 10)
        canvas.setFillColor(self.primary_color)
        canvas.drawString(doc.leftMargin, doc.pagesize[1] - 0.5 * inch, "Urban Thermal Trapping Intelligence Engine")
        canvas.setStrokeColor(self.accent_color)
        canvas.line(doc.leftMargin, doc.pagesize[1] - 0.55 * inch, doc.pagesize[0] - doc.rightMargin, doc.pagesize[1] - 0.55 * inch)
        
        # Footer
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.gray)
        canvas.drawString(doc.leftMargin, 0.5 * inch, f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, 0.5 * inch, f"Page {doc.page}")
        canvas.line(doc.leftMargin, 0.6 * inch, doc.pagesize[0] - doc.rightMargin, 0.6 * inch)
        
        # Watermark if in simulation mode
        from ...models import SystemMode
        if SystemMode.get_mode() == SystemMode.SIMULATION:
            canvas.saveState()
            canvas.setFont('Helvetica-Bold', 40)
            canvas.setFillColor(colors.HexColor("#ef4444"))
            canvas.setFillAlpha(0.12)
            
            # Diagonal text across page center
            canvas.translate(doc.pagesize[0] / 2.0, doc.pagesize[1] / 2.0)
            canvas.rotate(45)
            canvas.drawCentredString(0, 40, "⚠️ SIMULATION DATA")
            canvas.setFont('Helvetica-Bold', 10)
            canvas.drawCentredString(0, 10, "This analysis is based on simulated environmental conditions and machine-learning projections.")
            canvas.drawCentredString(0, -10, "AI-generated intelligence is disabled during simulation mode.")
            canvas.restoreState()
            
        canvas.restoreState()

    def generate_report(self, report_data: Dict[str, Any], metrics_data: Dict[str, Any]) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=inch,
            leftMargin=inch,
            topMargin=inch,
            bottomMargin=inch
        )
        
        story = []
        
        # Add Pages
        self._page_1_cover(story, report_data, metrics_data)
        self._page_2_dashboard(story, report_data, metrics_data)
        self._page_3_summary(story, report_data)
        self._page_4_root_causes(story, report_data)
        self._page_5_benchmarking(story, report_data)
        self._page_6_recommendations(story, report_data)
        self._page_7_mitigation(story, report_data)
        self._page_8_outlook(story, report_data)
        self._page_9_appendix(story, report_data, metrics_data)
        
        doc.build(story, onFirstPage=self._header_footer, onLaterPages=self._header_footer)
        buffer.seek(0)
        return buffer.getvalue()

    def _page_1_cover(self, story, report, metrics):
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("Urban Thermal Trapping", self.styles['CoverTitle']))
        story.append(Paragraph("Intelligence Report", self.styles['CoverTitle']))
        story.append(Spacer(1, 0.5*inch))
        
        area_name = metrics.get('name', 'Unknown Area')
        story.append(Paragraph(area_name, self.styles['CoverSubtitle']))
        story.append(Paragraph(report.get('region', 'Pune Region'), self.styles['CoverSubtitle']))
        
        story.append(Spacer(1, 1*inch))
        story.append(Paragraph(f"<b>Risk Level:</b> {report.get('priority', 'Unknown')}", self.styles['CoverText']))
        story.append(Paragraph(f"<b>Heat Trap Score:</b> {report.get('heat_trap_score', 'N/A')}", self.styles['CoverText']))
        story.append(Paragraph(f"<b>Generated Date:</b> {datetime.datetime.now().strftime('%B %d, %Y')}", self.styles['CoverText']))
        
        # Powered by / provider text
        from ...models import SystemMode
        is_sim = SystemMode.get_mode() == SystemMode.SIMULATION
        powered_by_text = "<b>Powered By:</b> K-Means Clustering • Real-Time Analytics • Rule Engine (Simulation)" if is_sim else "<b>Powered By:</b> K-Means Clustering • Real-Time Analytics • Gemini AI"
        
        story.append(Spacer(1, 1.5*inch))
        story.append(Paragraph("<b>Generated By:</b> Urban Thermal Trapping Intelligence Engine", self.styles['CoverText']))
        story.append(Paragraph(powered_by_text, self.styles['CoverText']))
        
        if is_sim:
            warning_style = ParagraphStyle(
                name='CoverWarning',
                parent=self.styles['Normal'],
                fontSize=10,
                leading=14,
                textColor=colors.HexColor("#b91c1c"), # red-700
                backColor=colors.HexColor("#fef2f2"), # red-50
                borderColor=colors.HexColor("#fca5a5"), # red-300
                borderWidth=1,
                borderPadding=8,
                spaceBefore=15,
                alignment=1 # Center
            )
            warning_html = (
                "<b>⚠️ SIMULATION DATA</b><br/>"
                "This analysis is based on simulated environmental conditions and machine-learning projections.<br/>"
                "AI-generated intelligence is disabled during simulation mode."
            )
            story.append(Paragraph(warning_html, warning_style))
            
        story.append(PageBreak())

    def _page_2_dashboard(self, story, report, metrics):
        story.append(Paragraph("Executive Dashboard", self.styles['ReportHeading1']))
        story.append(Spacer(1, 0.2*inch))
        
        data = [
            ["Metric", "Value", "Metric", "Value"],
            ["Risk Score", str(report.get('risk_score')), "Heat Trap Score", str(report.get('heat_trap_score'))],
            ["Urbanization Impact", str(report.get('urbanization_impact_score')), "Vegetation Deficit", str(report.get('vegetation_deficit_score'))],
            ["Area Ranking", f"{report.get('risk_rank')} / {report.get('total_areas')}", "Cluster Class", str(report.get('cluster_classification'))],
            ["Priority Level", str(report.get('priority')), "Data Quality", f"{report.get('data_quality_score')}/100"]
        ]
        
        t = Table(data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), self.primary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 12),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0"))
        ]))
        story.append(t)
        story.append(Spacer(1, 0.5*inch))
        
        story.append(Paragraph("Live Environmental Metrics", self.styles['ReportHeading2']))
        metrics_data = [
            ["Temperature", f"{metrics.get('temperature', 0):.1f}°C"],
            ["Humidity", f"{metrics.get('humidity', 0):.1f}%"],
            ["Wind Speed", f"{metrics.get('wind', 0):.1f} km/h"],
            ["Density", str(metrics.get('density'))],
            ["Vegetation", str(metrics.get('vegetation'))]
        ]
        t2 = Table(metrics_data, colWidths=[2.5*inch, 2.5*inch])
        t2.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#f1f5f9")),
            ('PADDING', (0,0), (-1,-1), 8)
        ]))
        story.append(t2)
        story.append(PageBreak())

    def _page_3_summary(self, story, report):
        story.append(Paragraph("Executive Summary", self.styles['ReportHeading1']))
        story.append(Paragraph(report.get('executive_summary', ''), self.styles['ReportBody']))
        story.append(Spacer(1, 0.3*inch))
        
        story.append(Paragraph("Climate Trend Analysis", self.styles['ReportHeading2']))
        story.append(Paragraph(report.get('climate_trend_analysis', ''), self.styles['ReportBody']))
        story.append(Spacer(1, 0.3*inch))
        
        story.append(Paragraph("Key Takeaways", self.styles['ReportHeading2']))
        for tk in report.get('key_takeaways', []):
            story.append(Paragraph(f"• {tk}", self.styles['InsightCard']))
        
        story.append(PageBreak())

    def _page_4_root_causes(self, story, report):
        story.append(Paragraph("Root Cause Analysis", self.styles['ReportHeading1']))
        
        causes = report.get('root_causes', [])
        for cause in causes:
            story.append(Paragraph(f"<b>{cause.get('cause', 'Cause')}</b> - <i>Severity: {cause.get('severity', 'Moderate').upper()}</i>", self.styles['ReportHeading2']))
            story.append(Paragraph(cause.get('detail', ''), self.styles['ReportBody']))
            story.append(Spacer(1, 0.2*inch))
            
        story.append(PageBreak())

    def _page_5_benchmarking(self, story, report):
        story.append(Paragraph("Benchmarking", self.styles['ReportHeading1']))
        
        story.append(Paragraph("Area vs City Average", self.styles['ReportHeading2']))
        for comp in report.get('benchmark_comparison', []):
            story.append(Paragraph(f"• {comp}", self.styles['ReportBody']))
            
        story.append(Spacer(1, 0.3*inch))
        
        data = [
            ["Metric", "Area Rank", "Total Zones"],
            ["Temperature", str(report.get('temperature_rank')), str(report.get('total_areas'))],
            ["Vegetation", str(report.get('vegetation_rank')), str(report.get('total_areas'))],
            ["Density", str(report.get('density_rank')), str(report.get('total_areas'))],
            ["Overall Risk", str(report.get('risk_rank')), str(report.get('total_areas'))]
        ]
        
        t = Table(data, colWidths=[2*inch, 2*inch, 2*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), self.primary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('PADDING', (0,0), (-1,-1), 8)
        ]))
        story.append(t)
        
        story.append(PageBreak())

    def _page_6_recommendations(self, story, report):
        story.append(Paragraph("Recommendations", self.styles['ReportHeading1']))
        
        story.append(Paragraph("Lifestyle Recommendations", self.styles['ReportHeading2']))
        for rec in report.get('lifestyle_recommendations', []):
            story.append(Paragraph(f"• {rec}", self.styles['ReportBody']))
        story.append(Spacer(1, 0.3*inch))
        
        story.append(Paragraph("Construction Recommendations", self.styles['ReportHeading2']))
        for rec in report.get('construction_recommendations', []):
            story.append(Paragraph(f"• {rec}", self.styles['ReportBody']))
        story.append(Spacer(1, 0.3*inch))
            
        story.append(Paragraph("Urban Planning Recommendations", self.styles['ReportHeading2']))
        for rec in report.get('urban_planning_recommendations', []):
            story.append(Paragraph(f"• {rec}", self.styles['ReportBody']))
            
        story.append(PageBreak())

    def _page_7_mitigation(self, story, report):
        story.append(Paragraph("Mitigation Strategy", self.styles['ReportHeading1']))
        
        strategy = report.get('mitigation_strategy', {})
        
        story.append(Paragraph("Short Term (0-12 months)", self.styles['ReportHeading2']))
        for st in strategy.get('short_term', []):
            story.append(Paragraph(f"• {st}", self.styles['ReportBody']))
        story.append(Spacer(1, 0.2*inch))
            
        story.append(Paragraph("Medium Term (1-3 years)", self.styles['ReportHeading2']))
        for mt in strategy.get('medium_term', []):
            story.append(Paragraph(f"• {mt}", self.styles['ReportBody']))
        story.append(Spacer(1, 0.2*inch))
            
        story.append(Paragraph("Long Term (3+ years)", self.styles['ReportHeading2']))
        for lt in strategy.get('long_term', []):
            story.append(Paragraph(f"• {lt}", self.styles['ReportBody']))
            
        story.append(PageBreak())

    def _page_8_outlook(self, story, report):
        story.append(Paragraph("Future Outlook", self.styles['ReportHeading1']))
        
        outlook = report.get('future_outlook', {})
        story.append(Paragraph("Without Intervention", self.styles['ReportHeading2']))
        story.append(Paragraph(outlook.get('no_action', ''), self.styles['ReportBody']))
        story.append(Spacer(1, 0.2*inch))
        
        story.append(Paragraph("With Intervention", self.styles['ReportHeading2']))
        story.append(Paragraph(outlook.get('with_action', ''), self.styles['ReportBody']))
        story.append(Spacer(1, 0.4*inch))
        
        story.append(Paragraph("Expected Impact", self.styles['ReportHeading2']))
        for imp in report.get('expected_impact', []):
            story.append(Paragraph(f"• {imp}", self.styles['ReportBody']))
        story.append(Spacer(1, 0.4*inch))
        
        story.append(Paragraph("Strategic Priorities", self.styles['ReportHeading2']))
        story.append(Paragraph(f"<b>Highest Impact Action:</b> {report.get('highest_impact_action', '')}", self.styles['ReportBody']))
        story.append(Paragraph(f"<b>Quick Win:</b> {report.get('quick_win', '')}", self.styles['ReportBody']))
        story.append(Paragraph(f"<b>Long-Term Strategy:</b> {report.get('long_term_strategy', '')}", self.styles['ReportBody']))
        
        story.append(PageBreak())

    def _page_9_appendix(self, story, report, metrics):
        story.append(Paragraph("Appendix: Analysis Metadata", self.styles['ReportHeading1']))
        
        from ...models import SystemMode
        is_sim = SystemMode.get_mode() == SystemMode.SIMULATION
        provider_name = "Rule Engine (AI Paused)" if is_sim else str(report.get('provider', 'N/A'))
        
        data = [
            ["Property", "Value"],
            ["Area ID", str(metrics.get('id', 'N/A'))],
            ["Generated Timestamp", str(report.get('generated_at', 'N/A'))],
            ["AI Provider", provider_name],
            ["Analysis Confidence", str(report.get('analysis_confidence', 'N/A'))],
            ["Data Quality Score", f"{report.get('data_quality_score', 'N/A')}/100"],
            ["Total Analyzed Areas", str(report.get('total_areas', 'N/A'))]
        ]
        
        t = Table(data, colWidths=[2.5*inch, 3.5*inch])
        t.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#f1f5f9")),
            ('PADDING', (0,0), (-1,-1), 8)
        ]))
        story.append(t)

    def generate_city_report(self, city_metrics: Dict[str, Any], area_reports: list[Dict[str, Any]]) -> bytes:
        from ...models import SystemSettings
        settings_obj = SystemSettings.get_settings()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=inch,
            leftMargin=inch,
            topMargin=inch,
            bottomMargin=inch
        )
        
        story = []
        
        self._city_page_1_cover(story, city_metrics)
        
        if settings_obj.include_executive_summary:
            self._city_page_2_summary(story, city_metrics)
            
        if settings_obj.include_rankings:
            self._city_page_3_rankings(story, area_reports)
            self._city_page_4_top_priorities(story, area_reports)
            
        self._city_page_5_insights(story, city_metrics)
        
        if settings_obj.pdf_report_type == "full":
            if settings_obj.include_area_details:
                # Individual Area Reports
                for report in area_reports:
                    self._city_area_page(story, report)
                    
            if settings_obj.include_recommendations:
                self._city_final_recommendations(story, area_reports)
                
            if settings_obj.include_appendix:
                self._city_appendix(story, city_metrics, area_reports)
        
        doc.build(story, onFirstPage=self._header_footer, onLaterPages=self._header_footer)
        buffer.seek(0)
        return buffer.getvalue()

    def _city_page_1_cover(self, story, city_metrics):
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("Urban Thermal Trapping", self.styles['CoverTitle']))
        story.append(Paragraph("Intelligence Report", self.styles['CoverTitle']))
        story.append(Spacer(1, 0.5*inch))
        
        story.append(Paragraph("Pune Smart City Heat Intelligence Assessment", self.styles['CoverSubtitle']))
        
        story.append(Spacer(1, 1*inch))
        story.append(Paragraph(f"<b>Generated Date:</b> {datetime.datetime.now().strftime('%B %d, %Y')}", self.styles['CoverText']))
        story.append(Paragraph(f"<b>Number of Areas Analysed:</b> {city_metrics.get('total_areas', 0)}", self.styles['CoverText']))
        story.append(Paragraph(f"<b>Report ID:</b> {city_metrics.get('report_id', 'N/A')}", self.styles['CoverText']))
        
        from ...models import SystemMode
        is_sim = SystemMode.get_mode() == SystemMode.SIMULATION
        provider_name = "Rule Engine + Machine Learning (Simulation)" if is_sim else "Gemini AI + Machine Learning"
        
        story.append(Spacer(1, 1.5*inch))
        story.append(Paragraph("<b>Generated By:</b> Urban Thermal Trapping Intelligence Engine", self.styles['CoverText']))
        story.append(Paragraph(f"<b>Provider:</b> {provider_name}", self.styles['CoverText']))
        
        if is_sim:
            warning_style = ParagraphStyle(
                name='CityCoverWarning',
                parent=self.styles['Normal'],
                fontSize=10,
                leading=14,
                textColor=colors.HexColor("#b91c1c"), # red-700
                backColor=colors.HexColor("#fef2f2"), # red-50
                borderColor=colors.HexColor("#fca5a5"), # red-300
                borderWidth=1,
                borderPadding=8,
                spaceBefore=15,
                alignment=1 # Center
            )
            warning_html = (
                "<b>⚠️ SIMULATION DATA</b><br/>"
                "This analysis is based on simulated environmental conditions and machine-learning projections.<br/>"
                "AI-generated intelligence is disabled during simulation mode."
            )
            story.append(Paragraph(warning_html, warning_style))
            
        story.append(PageBreak())

    def _city_page_2_summary(self, story, city_metrics):
        story.append(Paragraph("City Executive Summary", self.styles['ReportHeading1']))
        story.append(Spacer(1, 0.2*inch))
        
        story.append(Paragraph("Overall Observations", self.styles['ReportHeading2']))
        story.append(Paragraph("The following data aggregates the current thermal and environmental conditions across all active monitoring zones in Pune.", self.styles['ReportBody']))
        story.append(Spacer(1, 0.3*inch))
        
        data = [
            ["Metric", "Value", "Metric", "Value"],
            ["Average Risk Score", f"{city_metrics.get('avg_risk_score', 0):.1f}", "Average Heat Trap", f"{city_metrics.get('avg_heat_trap_score', 0):.1f}"],
            ["Highest Risk Area", str(city_metrics.get('highest_risk_area', 'N/A')), "Lowest Risk Area", str(city_metrics.get('lowest_risk_area', 'N/A'))],
            ["Total Critical Areas", str(city_metrics.get('total_critical', 0)), "Total High Risk", str(city_metrics.get('total_high', 0))]
        ]
        
        t = Table(data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), self.primary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 12),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0"))
        ]))
        story.append(t)
        story.append(PageBreak())

    def _city_page_3_rankings(self, story, area_reports):
        story.append(Paragraph("City Risk Rankings", self.styles['ReportHeading1']))
        story.append(Paragraph("All monitored areas sorted by Risk Score (Descending).", self.styles['ReportBody']))
        story.append(Spacer(1, 0.2*inch))
        
        data = [["Rank", "Area Name", "Risk Score", "Heat Trap", "Priority", "Cluster"]]
        
        for idx, report in enumerate(area_reports):
            # Highlight top 10 critical
            bg_color = colors.HexColor("#fee2e2") if idx < 10 else colors.HexColor("#ffffff")
            data.append([
                str(idx + 1),
                report.get('area', 'Unknown'),
                str(report.get('risk_score', 0)),
                str(report.get('heat_trap_score', 0)),
                report.get('priority', 'N/A'),
                report.get('cluster_classification', 'N/A')
            ])
            
        t = Table(data, colWidths=[0.6*inch, 1.8*inch, 0.9*inch, 0.9*inch, 0.9*inch, 0.9*inch])
        
        style = [
            ('BACKGROUND', (0,0), (-1,0), self.primary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6)
        ]
        
        for idx in range(min(10, len(area_reports))):
            style.append(('BACKGROUND', (0, idx+1), (-1, idx+1), colors.HexColor("#fee2e2")))
            
        t.setStyle(TableStyle(style))
        story.append(t)
        story.append(PageBreak())

    def _city_page_4_top_priorities(self, story, area_reports):
        story.append(Paragraph("Top Priority Intervention Zones", self.styles['ReportHeading1']))
        story.append(Paragraph("Where should Pune invest first? The following zones require immediate intervention based on critical risk scores.", self.styles['ReportBody']))
        story.append(Spacer(1, 0.3*inch))
        
        data = [["Rank", "Area", "Risk", "Priority Action"]]
        
        for idx, report in enumerate(area_reports[:15]): # Top 15
            data.append([
                str(idx + 1),
                report.get('area', 'Unknown'),
                str(report.get('risk_score', 0)),
                report.get('highest_impact_action', 'N/A')[:60] + '...' # Truncate if too long
            ])
            
        t = Table(data, colWidths=[0.5*inch, 1.5*inch, 0.6*inch, 3.4*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), self.primary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (2,-1), 'CENTER'),
            ('ALIGN', (3,0), (3,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(t)
        story.append(PageBreak())

    def _city_page_5_insights(self, story, city_metrics):
        story.append(Paragraph("City Heat Map Insights", self.styles['ReportHeading1']))
        story.append(Spacer(1, 0.2*inch))
        
        story.append(Paragraph("Cluster Summary", self.styles['ReportHeading2']))
        
        data = [
            ["Cluster Classification", "Count"],
            ["Critical (Severe Heat Trap)", str(city_metrics.get('cluster_counts', {}).get('Critical', 0))],
            ["High Risk", str(city_metrics.get('cluster_counts', {}).get('High', 0))],
            ["Moderate Risk", str(city_metrics.get('cluster_counts', {}).get('Moderate', 0))],
            ["Low / Safe", str(city_metrics.get('cluster_counts', {}).get('Safe', 0))]
        ]
        
        t = Table(data, colWidths=[3*inch, 2*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), self.primary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('PADDING', (0,0), (-1,-1), 8),
            ('BACKGROUND', (0,1), (-1,1), colors.HexColor("#fee2e2")), # Critical
            ('BACKGROUND', (0,3), (-1,3), colors.HexColor("#fef08a")), # Moderate
            ('BACKGROUND', (0,4), (-1,4), colors.HexColor("#dcfce3")), # Safe
        ]))
        story.append(t)
        story.append(PageBreak())

    def _city_area_page(self, story, report):
        story.append(Paragraph(f"Area Report: {report.get('area', 'Unknown')}", self.styles['ReportHeading1']))
        
        story.append(Paragraph(f"<b>Risk Score:</b> {report.get('risk_score')} | <b>Heat Trap Score:</b> {report.get('heat_trap_score')}", self.styles['ReportHeading2']))
        story.append(Spacer(1, 0.1*inch))
        
        story.append(Paragraph("Executive Summary", self.styles['ReportHeading2']))
        story.append(Paragraph(report.get('executive_summary', ''), self.styles['ReportBody']))
        story.append(Spacer(1, 0.2*inch))
        
        story.append(Paragraph("Climate Trend Analysis", self.styles['ReportHeading2']))
        story.append(Paragraph(report.get('climate_trend_analysis', ''), self.styles['ReportBody']))
        story.append(Spacer(1, 0.2*inch))
        
        story.append(Paragraph("Root Causes", self.styles['ReportHeading2']))
        for cause in report.get('root_causes', [])[:2]: # Show top 2 causes to fit page
            story.append(Paragraph(f"• <b>{cause.get('cause')}</b>: {cause.get('detail')}", self.styles['ReportBody']))
        story.append(Spacer(1, 0.2*inch))
            
        story.append(Paragraph("Key Takeaways", self.styles['ReportHeading2']))
        for tk in report.get('key_takeaways', []):
            story.append(Paragraph(f"• {tk}", self.styles['ReportBody']))
        story.append(Spacer(1, 0.2*inch))
        
        story.append(Paragraph("Priority Actions & Outlook", self.styles['ReportHeading2']))
        story.append(Paragraph(f"<b>Highest Impact:</b> {report.get('highest_impact_action', '')}", self.styles['ReportBody']))
        story.append(Paragraph(f"<b>Expected Impact:</b> {report.get('expected_impact', [''])[0] if report.get('expected_impact') else ''}", self.styles['ReportBody']))
        
        story.append(PageBreak())

    def _city_final_recommendations(self, story, area_reports):
        story.append(Paragraph("City-Wide Recommendations", self.styles['ReportHeading1']))
        story.append(Spacer(1, 0.2*inch))
        
        story.append(Paragraph("Top Intervention Priorities", self.styles['ReportHeading2']))
        story.append(Paragraph("Based on the aggregated data across all zones, these are the most critical interventions required at the city level:", self.styles['ReportBody']))
        story.append(Spacer(1, 0.2*inch))
        
        # Collect some top actions
        actions = list({r.get('highest_impact_action') for r in area_reports if r.get('highest_impact_action')})
        for act in actions[:6]:
            story.append(Paragraph(f"• {act}", self.styles['InsightCard']))
            
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph("Most Vulnerable Zones", self.styles['ReportHeading2']))
        vuln_zones = [r.get('area') for r in area_reports[:5]]
        story.append(Paragraph(f"The municipal corporation must prioritize resource allocation to: {', '.join(vuln_zones)}.", self.styles['ReportBody']))
        
        story.append(PageBreak())

    def _city_appendix(self, story, city_metrics, area_reports):
        story.append(Paragraph("Appendix: Report Metadata", self.styles['ReportHeading1']))
        
        from ...models import SystemMode
        is_sim = SystemMode.get_mode() == SystemMode.SIMULATION
        provider_name = "Rule Engine" if is_sim else "Gemini AI"
        model_name = "N/A (AI Paused)" if is_sim else "gemini-2.5-flash"

        data = [
            ["Property", "Value"],
            ["Report ID", str(city_metrics.get('report_id', 'N/A'))],
            ["Generation Timestamp", str(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))],
            ["Provider", provider_name],
            ["Model Used", model_name],
            ["Number of Areas", str(city_metrics.get('total_areas', 0))],
            ["Cache Hits", str(city_metrics.get('cache_hits', 0))],
            ["Cache Misses", str(city_metrics.get('cache_misses', 0))],
            ["Generation Time (s)", f"{city_metrics.get('generation_time', 0):.2f}"]
        ]
        
        t = Table(data, colWidths=[2.5*inch, 3.5*inch])
        t.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#f1f5f9")),
            ('PADDING', (0,0), (-1,-1), 8)
        ]))
        story.append(t)
