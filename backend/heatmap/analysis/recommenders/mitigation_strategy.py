from ..types import AreaContext, MitigationActions


def generate_mitigation_strategy(ctx: AreaContext, scores: dict) -> MitigationActions:
    priority = scores["priority"]

    short_term: list[str] = []
    medium_term: list[str] = []
    long_term: list[str] = []

    if priority in ("High", "Critical"):
        short_term.extend([
            f"Issue localized heat advisory for the {ctx.area_type.lower()} community.",
            "Deploy temporary shading at transit stops and highly exposed areas.",
            "Increase watering schedules for existing green infrastructure.",
        ])
    else:
        short_term.extend([
            "Continue routine environmental monitoring.",
            "Ensure emergency cooling resources remain accessible.",
        ])

    if ctx.area_type == "IT Hub":
        medium_term.append("Pilot cool roof program on major commercial and tech campuses.")
        long_term.append("Integrate extensive green corridors into tech park master plans.")
    elif ctx.area_type == "Industrial":
        medium_term.append("Retrofit factory roofs with high-albedo reflective coatings.")
        long_term.append("Establish permanent dense tree buffers around industrial zones.")
    elif ctx.area_type == "Residential":
        medium_term.append("Launch community-driven rooftop gardening and cool-roof subsidies.")
        long_term.append("Mandate minimum vegetation coverage for all new residential developments.")
    else:
        medium_term.append("Pilot cool roof programs and expand street planting.")
        long_term.append("Establish permanent urban ventilation corridors.")

    if ctx.region:
        long_term.append(f"Align {ctx.region} {ctx.area_type.lower()} development plans with city-wide heat mitigation goals.")

    return MitigationActions(
        short_term=short_term,
        medium_term=medium_term,
        long_term=long_term,
    )
