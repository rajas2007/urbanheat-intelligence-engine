import os
import logging
from django.utils import timezone
from . import rule_engine
from .types import AnalysisReport, AreaContext

logger = logging.getLogger(__name__)


def generate_analysis(area_context: AreaContext, area_id: int | None = None) -> AnalysisReport:
    from ..models import SystemSettings, SystemMode
    
    # Check if system is in Simulation Mode
    if SystemMode.get_mode() == SystemMode.SIMULATION:
        logger.info(
            "Gemini skipped - Simulation Mode Active",
            extra={"area_id": area_id}
        )
        logger.info("Rule engine used", extra={"area_id": area_id})
        return rule_engine.generate(area_context)

    settings_obj = SystemSettings.get_settings()

    # Check cooldown status
    is_cooldown_active = False
    if settings_obj.provider_status == "quota_exceeded" and settings_obj.cooldown_until:
        if timezone.now() < settings_obj.cooldown_until:
            is_cooldown_active = True
        else:
            settings_obj.provider_status = "active"
            settings_obj.cooldown_until = None
            settings_obj.save(update_fields=['provider_status', 'cooldown_until'])

    if is_cooldown_active:
        logger.info(
            "Gemini skipped - Cooldown active",
            extra={"area_id": area_id}
        )
        logger.info("Rule engine used", extra={"area_id": area_id})
        return rule_engine.generate(area_context)

    if settings_obj.analysis_mode == "rule_engine":
        logger.info(
            "Gemini skipped - Rule engine configured",
            extra={"area_id": area_id}
        )
        logger.info("Rule engine used", extra={"area_id": area_id})
        return rule_engine.generate(area_context)

    # Gemini call
    logger.info("Gemini call", extra={"area_id": area_id})
    from . import llm_engine
    report = llm_engine.generate(area_context)
    
    # Normalise provider
    provider_key = "gemini" if "gemini" in report.provider.lower() else "rule"
    if provider_key == "rule":
        logger.info("Rule engine used", extra={"area_id": area_id})
    else:
        # Update last successful analysis and reset consecutive failures
        settings_obj.last_successful_analysis = timezone.now()
        settings_obj.consecutive_failures = 0
        settings_obj.provider_status = "active"
        settings_obj.cooldown_until = None
        settings_obj.save(update_fields=['last_successful_analysis', 'consecutive_failures', 'provider_status', 'cooldown_until'])
    
    return report
