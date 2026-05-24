from django.urls import path
from . import views

urlpatterns = [
    # 🔥 Core APIs
    path('clusters/', views.get_clusters),
    path('history/', views.get_history),

    # 🔥 Optional
    path('data/', views.get_heat_data),

    # 🔥 Action
    path('simulate/', views.simulate_data),

    path('chat/',      views.chat),
]