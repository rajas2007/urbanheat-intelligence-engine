from django.urls import path
from . import views

urlpatterns = [
    path('data/', views.get_heat_data),
    path('get_heat_data/', views.get_heat_data),
    path('clusters/', views.get_clusters),
    path('get_clusters/', views.get_clusters),
    path('simulate/', views.simulate_data),
    path('history/', views.get_history),
    path('add/', views.add_heat_data),
]
