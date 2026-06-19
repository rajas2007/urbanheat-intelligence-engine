from .types import AreaContext


def build_executive_summary(ctx: AreaContext, scores: dict, root_causes: list[dict]) -> str:
    primary_causes = [
        c["cause"].lower() for c in root_causes
        if c["severity"] in ("High", "Critical")
    ][:3]

    if scores["priority"] in ("High", "Critical"):
        severity_tone = f"experiencing severe heat stress, significantly impacting this {ctx.area_type.lower()}"
    elif scores["priority"] == "Moderate":
        severity_tone = f"facing moderate thermal challenges typical for a {ctx.area_type.lower()} area"
    else:
        severity_tone = f"maintaining relatively stable thermal conditions for a {ctx.area_type.lower()} sector"

    cause_text = f" driven by {', '.join(primary_causes)}" if primary_causes else ""

    growth_note = (
        f" The area's {ctx.urban_growth.lower()} urban growth and {ctx.development_stage.lower()} development stage "
        f"are key contributing factors to its thermal profile."
    )

    return (
        f"{ctx.name} is {severity_tone}{cause_text}. "
        f"Currently recording {ctx.temperature:.1f}°C, the location requires {scores['priority'].lower()}-priority attention. "
        f"{growth_note}"
    )


def build_future_outlook(ctx: AreaContext, scores: dict) -> dict[str, str]:
    if scores["priority"] in ("High", "Critical"):
        no_action = (
            f"Without intervention, {ctx.name}'s {ctx.urban_growth.lower()} growth rate as a {ctx.area_type.lower()} "
            "will likely trap additional heat, potentially raising peak temperatures by 1–2°C over the next 5 years. "
            "This could severely strain energy grids and local livability."
        )
        with_action = (
            f"Implementing targeted mitigation for this {ctx.area_type.lower()} zone could reduce local heat exposure "
            "by 2–4°C equivalent. This will stabilize the microclimate even as development continues."
        )
    elif scores["priority"] == "Moderate":
        no_action = (
            f"If current trends continue, {ctx.name} may gradually shift toward higher heat risk. "
            f"Its status as a {ctx.development_stage.lower()} {ctx.area_type.lower()} means thermal mass will increase."
        )
        with_action = (
            f"Strategic greening and cool-surface interventions suited for {ctx.area_type.lower()} areas could "
            "prevent escalation to critical heat stress levels within the decade."
        )
    else:
        no_action = (
            f"{ctx.name} is currently stable. However, unchecked future development in this {ctx.area_type.lower()} "
            "could erode its thermal resilience over time."
        )
        with_action = (
            f"Maintaining current {ctx.green_space.lower()} green space levels and enacting proactive cool-surface policies "
            f"will preserve the long-term livability of {ctx.name}."
        )

    return {"no_action": no_action, "with_action": with_action}
