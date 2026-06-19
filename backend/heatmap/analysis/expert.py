from .types import AreaContext

def generate_benchmark_comparison(ctx: AreaContext) -> list[str]:
    comparisons = []
    
    if ctx.temperature_rank <= max(1, ctx.total_areas // 10):
        comparisons.append(f"Temperature Rank: Top 10% hottest monitored zones.")
    else:
        comparisons.append(f"Temperature Rank: {ctx.temperature_rank} / {ctx.total_areas}")

    if ctx.vegetation_rank >= ctx.total_areas - max(1, ctx.total_areas // 10):
        comparisons.append(f"Vegetation Rank: Bottom 10% of city (severe deficit).")
    else:
        comparisons.append(f"Vegetation Rank: {ctx.vegetation_rank} / {ctx.total_areas}")

    if ctx.density_rank <= max(1, ctx.total_areas // 10):
        comparisons.append(f"Density Rank: Top 10% densest zones.")
    else:
        comparisons.append(f"Density Rank: {ctx.density_rank} / {ctx.total_areas}")

    comparisons.append(f"Heat Trap Score Rank: {ctx.heat_trap_rank} / {ctx.total_areas}")

    return comparisons

def generate_expected_impact(ctx: AreaContext) -> list[str]:
    impacts = []
    if ctx.vegetation_index < 0.5:
        impacts.append("Increasing tree coverage by 15-20% could reduce local heat exposure by approximately 1-2°C.")
    if ctx.building_density > 120:
        impacts.append("Cool roofs and high-albedo materials may reduce roof surface temperatures by up to 10-15°C.")
    if ctx.wind_speed < 8:
        impacts.append("Establishing green ventilation corridors could improve airflow and lower localized heat accumulation by 1.5°C.")
    if not impacts:
        impacts.append("Maintaining existing green infrastructure will stabilize the microclimate.")
    return impacts

def generate_climate_trend(ctx: AreaContext) -> str:
    base_trend = "a gradual warming trend over the last decade"
    if ctx.urban_growth == "High":
        if ctx.vegetation_index < 0.5:
            return f"Historical climate data and rapid {ctx.area_type.lower()} urbanization indicate a steep warming trend. The loss of vegetation has accelerated the microclimate's deterioration."
        else:
            return f"Despite high urban growth, maintaining current vegetation levels has moderated the warming trend typical for a {ctx.area_type.lower()}."
    else:
        if ctx.building_density > 140:
            return f"Historical data indicates {base_trend}. The dense {ctx.area_type.lower()} infrastructure is locking in heat, preventing nighttime cooling."
        else:
            return f"Historical climate data indicates a relatively stable thermal profile for this {ctx.area_type.lower()}, though regional warming trends remain a factor."

def generate_priority_actions(ctx: AreaContext) -> dict[str, str]:
    highest_impact = ""
    quick_win = ""
    long_term = ""

    if ctx.area_type == "IT Hub":
        highest_impact = "Mandate cool-roof retrofits across all major commercial campuses."
        quick_win = "Deploy temporary shading and misting systems at corporate transit hubs."
        long_term = "Integrate extensive green corridors into future tech park master plans."
    elif ctx.area_type == "Industrial":
        highest_impact = "Apply high-albedo reflective coatings to all factory roofs."
        quick_win = "Mandate shaded rest zones and hydration stations for workers."
        long_term = "Establish dense permanent tree buffers around the industrial perimeter."
    elif ctx.area_type == "Residential":
        highest_impact = "Launch community-wide rooftop gardening and reflective paint subsidies."
        quick_win = "Increase watering frequency for existing neighborhood parks."
        long_term = "Mandate minimum vegetation coverage for all new residential blocks."
    else:
        highest_impact = "Expand urban tree canopy aggressively."
        quick_win = "Deploy targeted shading in high foot-traffic areas."
        long_term = "Redesign major thoroughfares to act as ventilation corridors."

    return {
        "highest_impact_action": highest_impact,
        "quick_win": quick_win,
        "long_term_strategy": long_term
    }

def generate_key_takeaways(ctx: AreaContext, scores: dict) -> list[str]:
    takeaways = []
    
    if scores["priority"] in ("High", "Critical"):
        takeaways.append(f"Critical heat zone driven by intense {ctx.area_type.lower()} activity and rapid development.")
    else:
        takeaways.append(f"Stable {ctx.area_type.lower()} area with manageable baseline heat conditions.")
        
    if ctx.vegetation_index < 0.45:
        takeaways.append("Severe vegetation deficit is the primary barrier to natural cooling.")
    elif ctx.building_density > 140:
        takeaways.append("Extreme building density prevents nighttime thermal dissipation.")
        
    if ctx.urban_growth == "High":
        takeaways.append("Unchecked future growth will likely push the area into a higher risk category.")
        
    takeaways.append("Immediate focus should be on surface temperature reduction via cool roofs and shading.")
    
    return takeaways[:4]
