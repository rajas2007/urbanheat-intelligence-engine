from ..types import AreaContext


def generate_construction_recommendations(ctx: AreaContext, scores: dict) -> list[str]:
    recs: list[str] = []

    if ctx.area_type == "IT Hub":
        recs.append("Implement green office campus guidelines for new buildings.")
        recs.append("Install cool roofs with high solar reflectance (SRI > 82) on tech parks.")
    elif ctx.area_type == "Residential":
        recs.append("Promote rooftop gardens and reflective exterior paints for housing complexes.")
        recs.append("Reduce exposed concrete in residential driveways.")
    elif ctx.area_type == "Industrial":
        recs.append("Use heat-resistant building materials to minimize thermal mass.")
        recs.append("Install industrial-scale reflective roofing and shading.")
    elif ctx.area_type == "Commercial":
        recs.append("Retrofit commercial facades with reflective or green shading systems.")
        recs.append("Design shaded pedestrian corridors linking commercial blocks.")
    else:
        recs.append("Install cool roofs with high solar reflectance (SRI > 82).")
        recs.append("Apply reflective roofing materials on existing structures.")

    if ctx.building_density >= 120:
        recs.append("Incorporate green walls on south-facing facades.")
        recs.append("Adopt ventilated building design to improve internal airflow.")

    if ctx.vegetation_index < 0.55:
        recs.append("Use permeable paving materials to reduce surface heat retention.")

    return recs
