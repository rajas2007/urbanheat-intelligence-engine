from django.urls import path

from . import views


urlpatterns = [
    path("clusters/", views.get_clusters),
    path("history/", views.get_history),
    path("mode/", views.get_mode),
    path("mode/enable-simulation/", views.enable_simulation),
    path("mode/disable-simulation/", views.disable_simulation),
    path("data/", views.get_heat_data),
    path("simulate/", views.simulate_data),
    path("settings/", views.get_or_update_system_settings),
    path("settings/areas/", views.get_or_update_areas),
    path("historical-climate/", views.get_historical_climate),
    path("analysis/city/pdf/", views.download_city_analysis_pdf),
    path("analysis/<int:area_id>/", views.get_area_analysis),
    path("analysis/<int:area_id>/pdf/", views.download_area_analysis_pdf),
    path("chat/", views.chat),
]
