from .types import AreaContext

MAX_DENSITY = 200
TEMP_BASELINE = 28.0
TEMP_RANGE = 15.0
OPTIMAL_WIND = 12.0


def _clamp(value: float, lo: float = 0, hi: float = 100) -> int:
    return int(max(lo, min(hi, round(value))))


def compute_heat_trap_score(ctx: AreaContext) -> int:
    temp_factor = _clamp(((ctx.temperature - TEMP_BASELINE) / TEMP_RANGE) * 100)
    density_factor = _clamp((ctx.building_density / MAX_DENSITY) * 100)
    wind_factor = _clamp((1 - min(ctx.wind_speed / OPTIMAL_WIND, 1)) * 100)
    veg_factor = _clamp((1 - ctx.vegetation_index) * 100)

    score = (
        0.35 * temp_factor
        + 0.30 * density_factor
        + 0.20 * wind_factor
        + 0.15 * veg_factor
    )
    return _clamp(score)


def compute_urbanization_impact_score(ctx: AreaContext) -> int:
    return _clamp((ctx.building_density / MAX_DENSITY) * 100)


def compute_vegetation_deficit_score(ctx: AreaContext) -> int:
    return _clamp((1 - ctx.vegetation_index) * 100)


def compute_risk_score(
    ctx: AreaContext,
    heat_trap: int,
    urbanization: int,
    veg_deficit: int,
) -> int:
    temp_factor = _clamp(((ctx.temperature - TEMP_BASELINE) / TEMP_RANGE) * 100)
    cluster_boost = {0: 0, 1: 8, 2: 15}.get(ctx.cluster, 0)

    score = (
        0.30 * heat_trap
        + 0.25 * urbanization
        + 0.25 * veg_deficit
        + 0.20 * temp_factor
        + cluster_boost
    )
    return _clamp(score)


def compute_priority(risk_score: int, cluster: int) -> str:
    if risk_score >= 80 or (risk_score >= 60 and cluster == 2):
        return "Critical"
    if risk_score >= 60:
        return "High"
    if risk_score >= 40:
        return "Moderate"
    return "Low"


def compute_all_scores(ctx: AreaContext) -> dict[str, int | str]:
    heat_trap = compute_heat_trap_score(ctx)
    urbanization = compute_urbanization_impact_score(ctx)
    veg_deficit = compute_vegetation_deficit_score(ctx)
    risk = compute_risk_score(ctx, heat_trap, urbanization, veg_deficit)
    priority = compute_priority(risk, ctx.cluster)

    return {
        "heat_trap_score": heat_trap,
        "urbanization_impact_score": urbanization,
        "vegetation_deficit_score": veg_deficit,
        "risk_score": risk,
        "priority": priority,
    }
