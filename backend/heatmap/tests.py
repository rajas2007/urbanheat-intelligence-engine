from unittest.mock import Mock, patch, MagicMock

from django.test import SimpleTestCase, TestCase
from django.utils import timezone
from datetime import timedelta

from . import services
from .models import SystemSettings, SystemMode
from .analysis.types import AreaContext
from .analysis.facade import generate_analysis


class FetchOpenMeteoTests(SimpleTestCase):
    LAT = 12.3456
    LON = 65.4321

    def setUp(self):
        services.weather_cache.clear()

    def tearDown(self):
        services.weather_cache.clear()

    def make_response(self, temperature=31):
        response = Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {
            "hourly": {
                "time": ["2026-06-01T00:00"],
                "temperature_2m": [temperature],
                "relative_humidity_2m": [54],
                "wind_speed_10m": [6],
            }
        }
        return response

    @patch("heatmap.services.requests.get")
    def test_fetch_open_meteo_uses_timeout_and_cache(self, mock_get):
        mock_get.return_value = self.make_response()

        first = services.fetch_open_meteo(self.LAT, self.LON)
        second = services.fetch_open_meteo(self.LAT, self.LON)

        self.assertEqual(first, second)
        self.assertEqual(mock_get.call_count, 1)
        self.assertEqual(mock_get.call_args.kwargs["timeout"], 10)

    @patch("heatmap.services.time.sleep")
    @patch("heatmap.services.requests.get")
    def test_fetch_open_meteo_retries_transient_failures(self, mock_get, mock_sleep):
        mock_get.side_effect = [
            services.requests.exceptions.ReadTimeout("slow read"),
            self.make_response(),
        ]

        result = services.fetch_open_meteo(self.LAT, self.LON)

        self.assertEqual(result["temperature"], [31])
        self.assertEqual(mock_get.call_count, 2)
        mock_sleep.assert_called_once_with(0.5)

    @patch("heatmap.services.requests.get")
    def test_fetch_open_meteo_returns_stale_cache_after_failure(self, mock_get):
        cached_data = {
            "time": ["2026-06-01T00:00"],
            "temperature": [32],
            "humidity": [50],
            "wind_speed": [4],
        }
        services.weather_cache[(self.LAT, self.LON)] = {
            "data": cached_data,
            "fetched_at": 0,
        }
        mock_get.side_effect = services.requests.exceptions.ReadTimeout("slow read")

        result = services.fetch_open_meteo(self.LAT, self.LON)

        self.assertEqual(result, cached_data)


class GeminiQuotaProtectionTests(TestCase):
    def setUp(self):
        # Reset SystemSettings
        self.settings = SystemSettings.get_settings()
        self.settings.analysis_mode = "ai_enhanced"
        self.settings.provider_status = "active"
        self.settings.cooldown_until = None
        self.settings.consecutive_failures = 0
        self.settings.save()

        # Set Mode to REAL
        SystemMode.set_mode(SystemMode.REAL)

        self.ctx = AreaContext(
            name="Test Area",
            region="Test Region",
            temperature=32.5,
            humidity=60.0,
            wind_speed=12.0,
            vegetation_index=0.4,
            building_density=120.0,
            cluster=1,
            cluster_label="Moderate",
            risk_level="Moderate",
            area_type="Residential",
            urban_growth="High",
            green_space="Low",
            population_density="High",
            development_stage="Developed",
        )

    @patch("heatmap.llm.get_llm_provider")
    def test_gemini_quota_exceeded_cooldown_and_backoff(self, mock_get_provider):
        # Mock LLM provider to raise a 429 quota exception
        mock_provider = MagicMock()
        mock_provider.generate_analysis_json.side_effect = Exception("429 Resource Exhausted")
        mock_get_provider.return_value = mock_provider

        # First failure: should set provider_status, increment consecutive_failures, set cooldown_until
        report = generate_analysis(self.ctx, area_id=1)
        self.assertEqual(report.provider, "rule") # Fallback used
        
        self.settings.refresh_from_db()
        self.assertEqual(self.settings.provider_status, "quota_exceeded")
        self.assertEqual(self.settings.consecutive_failures, 1)
        self.assertIsNotNone(self.settings.cooldown_until)
        
        cooldown_diff = (self.settings.cooldown_until - timezone.now()).total_seconds()
        # Cooldown should be around 300 seconds (5 minutes)
        self.assertTrue(290 <= cooldown_diff <= 310)

        # Subsequent call under cooldown: should return rule engine report immediately without calling Gemini
        mock_provider.reset_mock()
        report2 = generate_analysis(self.ctx, area_id=1)
        self.assertEqual(report2.provider, "rule")
        mock_provider.generate_analysis_json.assert_not_called()

        # Second failure (simulated by clearing cooldown_until but keeping quota_exceeded/consecutive_failures)
        self.settings.cooldown_until = timezone.now() - timedelta(seconds=1)
        self.settings.save()
        
        report3 = generate_analysis(self.ctx, area_id=1)
        self.assertEqual(report3.provider, "rule")
        
        self.settings.refresh_from_db()
        self.assertEqual(self.settings.provider_status, "quota_exceeded")
        self.assertEqual(self.settings.consecutive_failures, 2)
        
        cooldown_diff_2 = (self.settings.cooldown_until - timezone.now()).total_seconds()
        # Cooldown should now be 300 * 2 = 600 seconds (10 minutes) because of exponential backoff
        self.assertTrue(590 <= cooldown_diff_2 <= 610)

        # Successful call (simulate by clearing cooldown but keeping failure count > 0)
        self.settings.provider_status = "active"
        self.settings.cooldown_until = None
        self.settings.save()

        mock_provider.generate_analysis_json.side_effect = None
        mock_provider.generate_analysis_json.return_value = {
            "executive_summary": "Lush and safe",
            "root_causes": [],
            "lifestyle_recommendations": [],
            "construction_recommendations": [],
            "urban_planning_recommendations": [],
            "mitigation_strategy": {"short_term": [], "medium_term": [], "long_term": []},
            "future_outlook": {"no_action": "Bad", "with_action": "Good"},
            "expected_impact": [],
            "climate_trend_analysis": "Stable",
            "highest_impact_action": "None",
            "quick_win": "None",
            "long_term_strategy": "None",
            "key_takeaways": []
        }

        report4 = generate_analysis(self.ctx, area_id=1)
        self.assertEqual(report4.provider, "gemini")
        
        self.settings.refresh_from_db()
        self.assertEqual(self.settings.provider_status, "active")
        self.assertEqual(self.settings.consecutive_failures, 0)
        self.assertIsNone(self.settings.cooldown_until)
