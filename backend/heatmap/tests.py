from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from . import services


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
