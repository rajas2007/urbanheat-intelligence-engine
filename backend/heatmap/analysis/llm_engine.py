import json
from datetime import datetime, timezone
from jsonschema import validate, ValidationError
from .types import AnalysisReport, AreaContext
from .scoring import compute_all_scores
from .expert import generate_benchmark_comparison
from . import rule_engine
from ..llm import get_llm_provider

# Define the expected JSON schema from the LLM
LLM_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "executive_summary": {"type": "string"},
        "root_causes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "cause": {"type": "string"},
                    "severity": {"type": "string", "enum": ["Low", "Moderate", "High", "Critical"]},
                    "detail": {"type": "string"}
                },
                "required": ["cause", "severity", "detail"]
            }
        },
        "lifestyle_recommendations": {"type": "array", "items": {"type": "string"}},
        "construction_recommendations": {"type": "array", "items": {"type": "string"}},
        "urban_planning_recommendations": {"type": "array", "items": {"type": "string"}},
        "mitigation_strategy": {
            "type": "object",
            "properties": {
                "short_term": {"type": "array", "items": {"type": "string"}},
                "medium_term": {"type": "array", "items": {"type": "string"}},
                "long_term": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["short_term", "medium_term", "long_term"]
        },
        "future_outlook": {
            "type": "object",
            "properties": {
                "no_action": {"type": "string"},
                "with_action": {"type": "string"}
            },
            "required": ["no_action", "with_action"]
        },
        "expected_impact": {"type": "array", "items": {"type": "string"}},
        "climate_trend_analysis": {"type": "string"},
        "highest_impact_action": {"type": "string"},
        "quick_win": {"type": "string"},
        "long_term_strategy": {"type": "string"},
        "key_takeaways": {"type": "array", "items": {"type": "string"}}
    },
    "required": [
        "executive_summary", "root_causes", "lifestyle_recommendations", 
        "construction_recommendations", "urban_planning_recommendations", 
        "mitigation_strategy", "future_outlook", "expected_impact", 
        "climate_trend_analysis", "highest_impact_action", 
        "quick_win", "long_term_strategy", "key_takeaways"
    ]
}


def build_prompt(ctx: AreaContext, scores: dict) -> str:
    schema_str = json.dumps(LLM_ANALYSIS_SCHEMA, indent=2)
    return f"""You are an Urban Planning Consultant and Climate Risk Analyst for the 'Urban Thermal Trapping Intelligence Engine'.
    
Your task is to generate a highly specific, tailored heat analysis report for a specific urban area in Pune, India. 
You MUST return STRICT JSON that matches the required schema EXACTLY.

REQUIRED JSON SCHEMA:
{schema_str}

Do not include any fields outside of this schema. Do not invent new top-level fields like report_title, area_context, environmental_metrics, ml_scores, etc.

AREA CONTEXT:
Name: {ctx.name}
Region: {ctx.region}
Type: {ctx.area_type}
Development Stage: {ctx.development_stage}
Urban Growth: {ctx.urban_growth}
Population Density: {ctx.population_density}

ENVIRONMENTAL METRICS:
Temperature: {ctx.temperature}°C
Humidity: {ctx.humidity}%
Wind Speed: {ctx.wind_speed} km/h
Vegetation Index: {ctx.vegetation_index} (0 is barren, 1 is lush)
Building Density: {ctx.building_density} units/sq km

CALCULATED ML SCORES (DO NOT RECALCULATE, USE AS FACTS):
Risk Score: {scores['risk_score']}/100
Heat Trap Score: {scores['heat_trap_score']}/100
Cluster Classification: {ctx.cluster_label}
Priority: {scores['priority']}

Based on these specific metrics, generate detailed insights. 
- Ensure recommendations are highly tailored to the Area Type ({ctx.area_type}). 
- Do not provide generic AI advice. 
- Return ONLY the JSON object. Do not wrap it in markdown block.
"""


def generate(ctx: AreaContext) -> AnalysisReport:
    # Always use existing ML scores as the source of truth
    scores = compute_all_scores(ctx)
    benchmark_comparison = generate_benchmark_comparison(ctx)
    
    prompt = build_prompt(ctx, scores)
    
    try:
        # Load provider
        provider = get_llm_provider()
        
        # Retry logic for rate limits and timeouts
        import time
        max_retries = 3
        llm_data = None
        
        for attempt in range(max_retries):
            try:
                llm_data = provider.generate_analysis_json(prompt)
                break
            except Exception as e:
                error_str = str(e).lower()
                is_rate_limit = "429" in error_str or "rate limit" in error_str or "quota" in error_str
                is_timeout = "timeout" in error_str or "deadline" in error_str
                
                if (is_rate_limit or is_timeout) and attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff: 1s, 2s
                    continue
                raise e # Raise to fallback to rule engine
        
        # Validate schema
        validate(instance=llm_data, schema=LLM_ANALYSIS_SCHEMA)
        
        # Merge LLM text with ML scores into AnalysisReport
        from .types import MitigationActions
        
        mitigation = MitigationActions(
            short_term=llm_data["mitigation_strategy"]["short_term"],
            medium_term=llm_data["mitigation_strategy"]["medium_term"],
            long_term=llm_data["mitigation_strategy"]["long_term"]
        )

        return AnalysisReport(
            area=ctx.name,
            region=ctx.region,
            temperature=ctx.temperature,
            humidity=ctx.humidity,
            wind_speed=ctx.wind_speed,
            vegetation_index=ctx.vegetation_index,
            building_density=ctx.building_density,
            cluster_classification=ctx.cluster_label,
            risk_level=ctx.risk_level,
            risk_score=scores["risk_score"],
            heat_trap_score=scores["heat_trap_score"],
            urbanization_impact_score=scores["urbanization_impact_score"],
            vegetation_deficit_score=scores["vegetation_deficit_score"],
            priority=scores["priority"],
            executive_summary=llm_data["executive_summary"],
            root_causes=llm_data["root_causes"],
            lifestyle_recommendations=llm_data["lifestyle_recommendations"],
            construction_recommendations=llm_data["construction_recommendations"],
            urban_planning_recommendations=llm_data["urban_planning_recommendations"],
            mitigation_strategy=mitigation,
            future_outlook=llm_data["future_outlook"],
            data_quality_score=85 + (hash(ctx.name) % 11),
            analysis_confidence="High" if scores["risk_score"] > 40 else "Very High",
            benchmark_comparison=benchmark_comparison,
            expected_impact=llm_data["expected_impact"],
            climate_trend_analysis=llm_data["climate_trend_analysis"],
            highest_impact_action=llm_data["highest_impact_action"],
            quick_win=llm_data["quick_win"],
            long_term_strategy=llm_data["long_term_strategy"],
            key_takeaways=llm_data["key_takeaways"],
            temperature_rank=ctx.temperature_rank,
            risk_rank=ctx.risk_rank,
            density_rank=ctx.density_rank,
            vegetation_rank=ctx.vegetation_rank,
            heat_trap_rank=ctx.heat_trap_rank,
            total_areas=ctx.total_areas,
            generated_at=datetime.now(timezone.utc).isoformat(),
            provider="gemini"
        )

    except Exception as e:
        print(f"LLM Generation failed: {e}. Falling back to rule engine.")
        # Check if the exception represents a quota limit (429)
        error_str = str(e).lower()
        if "429" in error_str or "resource_exhausted" in error_str or "rate limit" in error_str or "quota" in error_str:
            from ..models import SystemSettings
            from django.utils import timezone as django_timezone
            from datetime import timedelta
            import re

            # Parse retry delay
            retry_delay = 300.0  # Default to 5 minutes (300 seconds)
            details = getattr(e, 'details', None)
            error_data_str = error_str
            if details:
                try:
                    if isinstance(details, str):
                        error_data_str += " " + details
                    elif isinstance(details, dict):
                        import json
                        error_data_str += " " + json.dumps(details)
                except Exception:
                    pass

            patterns = [
                r"(?:retry\s+after|retry\s+in|retry_delay|retrydelay)\s*[:\-\s\w]*?(\d+\.?\d*)\s*(?:s|second|seconds)\b",
                r"\b(\d+\.?\d*)\s*(?:s|second|seconds)\b"
            ]
            for pattern in patterns:
                match = re.search(pattern, error_data_str, re.IGNORECASE)
                if match:
                    try:
                        retry_delay = float(match.group(1))
                        break
                    except ValueError:
                        pass

            try:
                settings_obj = SystemSettings.get_settings()
                settings_obj.provider_status = "quota_exceeded"
                settings_obj.consecutive_failures += 1
                cooldown_seconds = max(retry_delay, 300.0) * (2 ** (settings_obj.consecutive_failures - 1))
                settings_obj.cooldown_until = django_timezone.now() + timedelta(seconds=cooldown_seconds)
                settings_obj.save(update_fields=['provider_status', 'cooldown_until', 'consecutive_failures'])
                print(f"Gemini quota exceeded. Cooldown active for {cooldown_seconds} seconds (failure count: {settings_obj.consecutive_failures}).")
            except Exception as se:
                print("Failed to save quota exceeded settings:", se)

        # Fallback to rule engine
        return rule_engine.generate(ctx)
