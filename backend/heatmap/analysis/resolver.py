import re
import unicodedata

from .types import CLUSTER_LABELS, AreaContext


def to_area_slug(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_name.lower()).strip("-")
    return slug


def resolve_area_name_by_id(area_id: int, master_areas: list[dict]) -> str | None:
    for area in master_areas:
        if area.get("id") == area_id:
            return area["name"]
    return None


def build_area_context(zone: dict, area_metadata: dict) -> AreaContext:
    cluster = int(zone.get("cluster", 0))
    cluster_label = CLUSTER_LABELS.get(cluster, "Safe")

    return AreaContext(
        name=zone["name"],
        region=area_metadata.get("region", "Unknown"),
        temperature=float(zone.get("temperature", 30)),
        humidity=float(zone.get("humidity", 50)),
        wind_speed=float(zone.get("wind", 5)),
        vegetation_index=float(zone.get("vegetation", 0.5)),
        building_density=float(zone.get("density", 100)),
        cluster=cluster,
        cluster_label=cluster_label,
        risk_level=cluster_label,
        area_type=area_metadata.get("area_type", "Unknown"),
        urban_growth=area_metadata.get("urban_growth", "Medium"),
        green_space=area_metadata.get("green_space", "Medium"),
        population_density=area_metadata.get("population_density", "Medium"),
        development_stage=area_metadata.get("development_stage", "Unknown"),
    )


def resolve_area_context(area_id: int, heat_data: list[dict], master_areas: list[dict]) -> AreaContext | None:
    from .scoring import compute_all_scores

    area_metadata = next((a for a in master_areas if a.get("id") == area_id), None)
    if not area_metadata:
        return None

    zone = next((z for z in heat_data if z["name"] == area_metadata["name"]), None)
    if not zone:
        return None

    ctx = build_area_context(zone, area_metadata)
    
    # Calculate ranks
    all_contexts = []
    for hd in heat_data:
        md = next((a for a in master_areas if a["name"] == hd["name"]), {})
        temp_ctx = build_area_context(hd, md)
        scores = compute_all_scores(temp_ctx)
        all_contexts.append({
            "name": hd["name"],
            "temperature": temp_ctx.temperature,
            "building_density": temp_ctx.building_density,
            "vegetation_index": temp_ctx.vegetation_index,
            "heat_trap_score": scores["heat_trap_score"],
            "risk_score": scores["risk_score"],
        })

    # Sort descending for everything except vegetation (ascending means lower veg is "higher" rank / worse)
    # Actually, rank 1 usually means the highest value. 
    # Temperature Rank 1 = Hottest
    # Density Rank 1 = Densest
    # Vegetation Rank 1 = Lowest Vegetation (worst) or Highest Vegetation? The prompt says "Vegetation Rank: 58 / 74". Let's assume Rank 1 = Highest Vegetation, so 74 = lowest. 
    # Let's sort Temp, Density, Heat Trap, Risk descending (Rank 1 = Highest).
    # Sort Veg descending (Rank 1 = Most vegetation).

    temp_sorted = sorted(all_contexts, key=lambda x: x["temperature"], reverse=True)
    risk_sorted = sorted(all_contexts, key=lambda x: x["risk_score"], reverse=True)
    density_sorted = sorted(all_contexts, key=lambda x: x["building_density"], reverse=True)
    veg_sorted = sorted(all_contexts, key=lambda x: x["vegetation_index"], reverse=True)
    heat_trap_sorted = sorted(all_contexts, key=lambda x: x["heat_trap_score"], reverse=True)

    ctx.temperature_rank = next((i + 1 for i, c in enumerate(temp_sorted) if c["name"] == ctx.name), 1)
    ctx.risk_rank = next((i + 1 for i, c in enumerate(risk_sorted) if c["name"] == ctx.name), 1)
    ctx.density_rank = next((i + 1 for i, c in enumerate(density_sorted) if c["name"] == ctx.name), 1)
    ctx.vegetation_rank = next((i + 1 for i, c in enumerate(veg_sorted) if c["name"] == ctx.name), 1)
    ctx.heat_trap_rank = next((i + 1 for i, c in enumerate(heat_trap_sorted) if c["name"] == ctx.name), 1)
    ctx.total_areas = len(all_contexts)

    return ctx
