from rest_framework import serializers

from .models import HeatData


class HeatDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeatData
        fields = '__all__'


class MitigationStrategySerializer(serializers.Serializer):
    short_term = serializers.ListField(child=serializers.CharField())
    medium_term = serializers.ListField(child=serializers.CharField())
    long_term = serializers.ListField(child=serializers.CharField())


class RootCauseSerializer(serializers.Serializer):
    cause = serializers.CharField()
    severity = serializers.CharField()
    detail = serializers.CharField()


class FutureOutlookSerializer(serializers.Serializer):
    no_action = serializers.CharField()
    with_action = serializers.CharField()


class AreaAnalysisSerializer(serializers.Serializer):
    area = serializers.CharField()
    region = serializers.CharField()
    temperature = serializers.FloatField()
    humidity = serializers.FloatField()
    wind_speed = serializers.FloatField()
    vegetation_index = serializers.FloatField()
    building_density = serializers.FloatField()
    cluster_classification = serializers.CharField()
    risk_level = serializers.CharField()
    risk_score = serializers.IntegerField()
    heat_trap_score = serializers.IntegerField()
    urbanization_impact_score = serializers.IntegerField()
    vegetation_deficit_score = serializers.IntegerField()
    priority = serializers.CharField()
    executive_summary = serializers.CharField()
    root_causes = RootCauseSerializer(many=True)
    lifestyle_recommendations = serializers.ListField(child=serializers.CharField())
    construction_recommendations = serializers.ListField(child=serializers.CharField())
    urban_planning_recommendations = serializers.ListField(child=serializers.CharField())
    mitigation_strategy = MitigationStrategySerializer()
    future_outlook = FutureOutlookSerializer()
    benchmark_comparison = serializers.ListField(child=serializers.CharField())
    expected_impact = serializers.ListField(child=serializers.CharField())
    climate_trend_analysis = serializers.CharField()
    highest_impact_action = serializers.CharField()
    quick_win = serializers.CharField()
    long_term_strategy = serializers.CharField()
    key_takeaways = serializers.ListField(child=serializers.CharField())
    temperature_rank = serializers.IntegerField()
    risk_rank = serializers.IntegerField()
    density_rank = serializers.IntegerField()
    vegetation_rank = serializers.IntegerField()
    heat_trap_rank = serializers.IntegerField()
    total_areas = serializers.IntegerField()
    data_quality_score = serializers.IntegerField()
    analysis_confidence = serializers.CharField()
    generated_at = serializers.CharField()
    provider = serializers.CharField()


from .models import SystemSettings

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = [
            'analysis_mode',
            'pdf_report_type',
            'include_executive_summary',
            'include_rankings',
            'include_area_details',
            'include_recommendations',
            'include_appendix',
            'provider_status',
            'cooldown_until',
            'consecutive_failures',
        ]