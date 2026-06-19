from ..types import AreaContext


def generate_urban_planning_recommendations(ctx: AreaContext, scores: dict) -> list[str]:
    recs: list[str] = []

    if ctx.area_type == "IT Hub":
        recs.append("Establish extensive green buffer zones around tech parks.")
        recs.append("Integrate micro-mobility shaded pathways for last-mile connectivity.")
    elif ctx.area_type == "Industrial":
        recs.append("Mandate minimum open-space and dense tree buffers around factories.")
        recs.append("Redesign logistics yards with high-albedo paving surfaces.")
    elif ctx.area_type == "Commercial":
        recs.append("Develop pedestrian-friendly, tree-canopied commercial promenades.")
        recs.append("Install misting stations and shaded seating at major transit hubs.")
    elif ctx.area_type == "Educational":
        recs.append("Increase tree canopy coverage over playgrounds and sports facilities.")
    else:
        recs.append("Establish tree plantation zones along major corridors.")
        recs.append("Create green corridors connecting parks and open spaces.")

    if ctx.wind_speed < 8:
        recs.append("Design open ventilation corridors to improve wind flow.")

    if scores["priority"] in ("High", "Critical"):
        recs.append("Prioritize this zone in the city-level heat action plan.")

    return recs
