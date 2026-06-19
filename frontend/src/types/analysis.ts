export type PriorityLevel = "Low" | "Moderate" | "High" | "Critical";

export type RootCause = {
  cause: string;
  severity: string;
  detail: string;
};

export type MitigationStrategy = {
  short_term: string[];
  medium_term: string[];
  long_term: string[];
};

export type FutureOutlook = {
  no_action: string;
  with_action: string;
};

export type AreaAnalysisReport = {
  area: string;
  region: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  vegetation_index: number;
  building_density: number;
  cluster_classification: string;
  risk_level: string;
  risk_score: number;
  heat_trap_score: number;
  urbanization_impact_score: number;
  vegetation_deficit_score: number;
  data_quality_score: number;
  analysis_confidence: string;
  priority: PriorityLevel;
  executive_summary: string;
  root_causes: RootCause[];
  lifestyle_recommendations: string[];
  construction_recommendations: string[];
  urban_planning_recommendations: string[];
  mitigation_strategy: MitigationStrategy;
  future_outlook: FutureOutlook;
  benchmark_comparison: string[];
  expected_impact: string[];
  climate_trend_analysis: string;
  highest_impact_action: string;
  quick_win: string;
  long_term_strategy: string;
  key_takeaways: string[];
  temperature_rank: number;
  risk_rank: number;
  density_rank: number;
  vegetation_rank: number;
  heat_trap_rank: number;
  total_areas: number;
  generated_at: string;
  provider: string;
};
