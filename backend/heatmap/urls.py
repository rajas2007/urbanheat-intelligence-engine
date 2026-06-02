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
    path("settings/areas/", views.get_or_update_areas),
    path("historical-climate/", views.get_historical_climate),
    path("chat/", views.chat),
]
