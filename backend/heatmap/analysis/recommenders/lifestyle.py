from ..types import AreaContext


def generate_lifestyle_recommendations(ctx: AreaContext, scores: dict) -> list[str]:
    recs: list[str] = []

    if ctx.area_type == "Residential":
        recs.append("Encourage community-level tree planting and balcony greening.")
        recs.append("Use natural ventilation during cooler evening hours for homes.")
    elif ctx.area_type == "IT Hub":
        recs.append("Shift non-essential outdoor campus activities to early morning or late evening.")
        recs.append("Ensure corporate shuttles and transit waiting areas have adequate shade.")
    elif ctx.area_type == "Industrial":
        recs.append("Implement mandatory hydration breaks and shaded rest zones for workers.")
    elif ctx.area_type == "Educational":
        recs.append("Limit outdoor sports and assemblies during peak heat hours (11:00–16:00).")
        recs.append("Promote heat awareness campaigns among students and staff.")
    else:
        recs.append("Avoid outdoor activity during peak hours (11:00–16:00).")
        recs.append("Stay hydrated and use cooling centers during heat events.")

    if ctx.humidity < 40:
        recs.append("Promote water conservation to reduce heat from utility loads.")

    if scores["priority"] in ("High", "Critical"):
        recs.append("Monitor vulnerable demographics for heat-related illness.")

    return recs
