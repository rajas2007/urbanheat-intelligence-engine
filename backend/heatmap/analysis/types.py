from dataclasses import asdict, dataclass, field
from typing import Any


CLUSTER_LABELS = {0: "Safe", 1: "Moderate", 2: "Critical"}


@dataclass
class AreaContext:
    name: str
    region: str
    temperature: float
    humidity: float
    wind_speed: float
    vegetation_index: float
    building_density: float
    cluster: int
    cluster_label: str
    risk_level: str
    area_type: str
    urban_growth: str
    green_space: str
    population_density: str
    development_stage: str
    temperature_rank: int = 1
    risk_rank: int = 1
    density_rank: int = 1
    vegetation_rank: int = 1
    heat_trap_rank: int = 1
    total_areas: int = 1

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class MitigationActions:
    short_term: list[str]
    medium_term: list[str]
    long_term: list[str]


@dataclass
class AnalysisReport:
    area: str
    region: str
    temperature: float
    humidity: float
    wind_speed: float
    vegetation_index: float
    building_density: float
    cluster_classification: str
    risk_level: str
    risk_score: int
    heat_trap_score: int
    urbanization_impact_score: int
    vegetation_deficit_score: int
    data_quality_score: int
    analysis_confidence: str
    priority: str
    executive_summary: str
    root_causes: list[dict[str, str]]
    lifestyle_recommendations: list[str]
    construction_recommendations: list[str]
    urban_planning_recommendations: list[str]
    mitigation_strategy: MitigationActions
    future_outlook: dict[str, str]
    benchmark_comparison: list[str]
    expected_impact: list[str]
    climate_trend_analysis: str
    highest_impact_action: str
    quick_win: str
    long_term_strategy: str
    key_takeaways: list[str]
    temperature_rank: int
    risk_rank: int
    density_rank: int
    vegetation_rank: int
    heat_trap_rank: int
    total_areas: int
    generated_at: str
    provider: str = "rule"

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["mitigation_strategy"] = asdict(self.mitigation_strategy)
        return data
