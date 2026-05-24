import random
import threading
import time
import anthropic

from rest_framework.decorators import api_view
from rest_framework.response import Response

from django.core.cache import cache

from .services import fetch_open_meteo, fetch_building_density
from .ml_model import get_heat_clusters


# 🔥 AREAS
AREAS = [
    ("Hinjewadi", 18.5912, 73.7389),
    ("Kharadi", 18.5515, 73.9475),
    ("Aundh", 18.5610, 73.8070),
    ("Kothrud", 18.5074, 73.8077),
    ("PCMC", 18.6298, 73.7997),
]


# =========================================
# 🔥 CORE: COMPUTE CLUSTERS (FINAL FIXED)
# =========================================
def compute_clusters():
    data_list = []

    # 🔥 global drift (slightly reduced)
    global_drift = random.uniform(-0.08,0.08)  # 🔧 reduced

    for name, lat, lon in AREAS:
        try:
            weather = fetch_open_meteo(lat, lon)
        except Exception:
            weather = {}

        # =========================
        # 🌡️ TEMPERATURE (STABLE)
        # =========================
        temps = weather.get("temperature", [])
        base_temp = temps[0] if temps else 30

        prev_temp = cache.get(f"temp_{name}", base_temp)

        # 🔧 reduced variation (key fix)
        delta = random.uniform(-0.25,0.25)

        temp = prev_temp + delta + global_drift

        # 🔧 stricter jump prevention
        if abs(temp - prev_temp) > 0.5:
            temp = prev_temp

        # 🔧 tighter clamp (avoid long-term drift)
        temp = max(28, min(temp, 38))

        cache.set(f"temp_{name}", temp, timeout=60)

        # =========================
        # 💧 HUMIDITY (unchanged)
        # =========================
        humidity_list = weather.get("humidity", [])
        humidity = humidity_list[0] if humidity_list else 50
        humidity += random.uniform(-3, 3)

        # =========================
        # 🌬️ WIND (unchanged)
        # =========================
        wind_list = weather.get("wind_speed", [])
        wind = wind_list[0] if wind_list else 5
        wind += random.uniform(-1, 1)

        # =========================
        # 🏢 DENSITY (unchanged)
        # =========================
        base_density = cache.get(f"density_{name}")
        if base_density is None:
            try:
                base_density = fetch_building_density(lat, lon, name)
            except Exception:
                base_density = 0.5

            cache.set(f"density_{name}", base_density, timeout=3600)

        prev_density = cache.get(f"density_dyn_{name}", base_density)
        density = prev_density + random.uniform(-0.02, 0.02)

        cache.set(f"density_dyn_{name}", density, timeout=60)

        # =========================
        # 🌿 VEGETATION (unchanged)
        # =========================
        vegetation = max( 0.1,min(0.9,1 - (density/250) + random.uniform(-0.08,0.08))
                         
)

        data_list.append({
            "name": name,
            "latitude": lat,
            "longitude": lon,
            "temperature": float(temp),
            "density": float(density),
            "humidity": float(humidity),
            "wind": float(wind),
            "vegetation": float(vegetation),
        })

    # =========================
    # 🤖 ML CLUSTERING (unchanged)
    # =========================
    try:
        clusters = get_heat_clusters(data_list)
    except Exception as e:
        print("ML error:", e)
        clusters = [0] * len(data_list)

    for i, item in enumerate(data_list):
        item["cluster"] = clusters[i] if i < len(clusters) else 0

    return data_list


# =========================================
# 🔄 BACKGROUND CACHE UPDATER
# =========================================
def update_cache():
    while True:
        try:
            data = compute_clusters()
            cache.set("clusters", data, timeout=10)  # 🔥 slightly longer cache
        except Exception as e:
            print("Cache error:", e)

        time.sleep(5)  # update interval


# ✅ Start thread once
if not cache.get("thread_started"):
    threading.Thread(target=update_cache, daemon=True).start()
    cache.set("thread_started", True, timeout=None)


# =========================================
# 🌐 API ENDPOINTS
# =========================================

@api_view(['GET'])
def get_clusters(request):
    data = cache.get("clusters")

    if not data:
        data = compute_clusters()
        cache.set("clusters", data, timeout=10)

    return Response(data)


@api_view(['GET'])
def get_history(request):
    data = cache.get("clusters") or []

    result = []

    for z in data:
        base = z["temperature"]

        # simulate 24h variation
        temps = [
            base + random.uniform(-1, 1)
            for _ in range(5)
        ]

        avg_temp = sum(temps) / len(temps)

        result.append({
            "name": z["name"],
            "temperature": round(avg_temp, 2)
        })

    return Response(result)

@api_view(['GET'])
def get_heat_data(request):
    return Response(cache.get("clusters") or [])


@api_view(['POST'])
def simulate_data(request):
    data = compute_clusters()
    cache.set("clusters", data, timeout=10)

    return Response({
        "message": "Simulation updated",
        "data": data
    })

# At the BOTTOM of views.py, add this new view:
client = anthropic.Anthropic(api_key="your-anthropic-api-key-here")  # ← paste key here

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json

@csrf_exempt
def chat(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    try:
        body    = json.loads(request.body)
        messages = body.get("messages", [])
        system  = body.get("system", "")

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=system,
            messages=messages,
        )

        return JsonResponse({"reply": response.content[0].text})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)