import json
import random
import threading
import time

import anthropic
from django.core.cache import cache
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .ml_model import get_heat_clusters
from .models import SystemMode
from .services import (
    fetch_building_density,
    fetch_open_meteo,
    fetch_multiple_open_meteo,
    weather_cache_key,
)

DATA_CACHE_TTL_SECONDS = 300
SIMULATION_CACHE_TTL_SECONDS = 8
SIMULATION_STATE_CACHE_KEY = "simulation_state"


def sync_selected_areas():
    from .areas_config import MASTER_AREAS
    from .models import SelectedArea
    try:
        db_names = set(SelectedArea.objects.values_list('name', flat=True))
        master_names = {area['name'] for area in MASTER_AREAS}

        # Add new areas
        new_areas = [
            SelectedArea(name=name, is_selected=True)
            for name in master_names if name not in db_names
        ]
        if new_areas:
            SelectedArea.objects.bulk_create(new_areas)

        # Remove deleted areas
        to_delete = db_names - master_names
        if to_delete:
            SelectedArea.objects.filter(name__in=to_delete).delete()
    except Exception as e:
        print("Error syncing selected areas:", e)


def get_active_areas():
    from .areas_config import MASTER_AREAS
    from .models import SelectedArea

    # Sync first
    sync_selected_areas()

    try:
        selected_names = set(SelectedArea.objects.filter(is_selected=True).values_list('name', flat=True))
    except Exception as e:
        print("Error querying selected areas, falling back to all:", e)
        selected_names = {area['name'] for area in MASTER_AREAS}

    # Ensure at least one area is active if all are deselected in DB
    if not selected_names and MASTER_AREAS:
        selected_names = {MASTER_AREAS[0]['name']}

    return [area for area in MASTER_AREAS if area['name'] in selected_names]


def get_current_mode():
    try:
        return SystemMode.get_mode()
    except Exception as e:
        print("Mode lookup error:", e)
        return SystemMode.REAL


def cache_key_for_mode(mode):
    return f"clusters_{mode.lower()}"


def get_simulation_state():
    return cache.get(SIMULATION_STATE_CACHE_KEY, {})


def set_simulation_state(state):
    cache.set(SIMULATION_STATE_CACHE_KEY, state, timeout=DATA_CACHE_TTL_SECONDS)


def clear_simulation_state():
    cache.delete(SIMULATION_STATE_CACHE_KEY)


def clamp(value, min_value, max_value):
    return max(min_value, min(value, max_value))


def apply_clusters(data_list, use_randomness):
    try:
        clusters = get_heat_clusters(data_list, use_randomness=use_randomness)
    except Exception as e:
        print("ML error:", e)
        clusters = [0] * len(data_list)

    for i, item in enumerate(data_list):
        item["cluster"] = clusters[i] if i < len(clusters) else 0

    return data_list


def fetch_area_weather(lat, lon):
    try:
        return fetch_open_meteo(lat, lon)
    except Exception:
        return {}


def get_first_value(values, fallback):
    return values[0] if values else fallback


def compute_real_clusters():
    active_areas = get_active_areas()
    coords = [(area["latitude"], area["longitude"]) for area in active_areas]
    weather_map = fetch_multiple_open_meteo(coords)
    data_list = []

    for area in active_areas:
        name = area["name"]
        lat = area["latitude"]
        lon = area["longitude"]

        weather = weather_map.get(weather_cache_key(lat, lon), {})

        temperature = get_first_value(weather.get("temperature", []), 30)
        humidity = get_first_value(weather.get("humidity", []), 50)
        wind = get_first_value(weather.get("wind_speed", []), 5)

        try:
            density = fetch_building_density(lat, lon, name)
        except Exception:
            density = 0.5

        vegetation = clamp(1 - (density / 250), 0.1, 0.9)

        data_list.append({
            "name": name,
            "latitude": lat,
            "longitude": lon,
            "temperature": float(temperature),
            "density": float(density),
            "humidity": float(humidity),
            "wind": float(wind),
            "vegetation": float(vegetation),
        })

    return apply_clusters(data_list, use_randomness=False)


def generate_simulation_dataset(real_data):
    state = get_simulation_state()
    next_state = {}
    data_list = []

    for zone in real_data:
        name = zone["name"]
        base_temp = zone["temperature"]
        prev_temp = state.get(name, {}).get("temperature", base_temp)
        prev_humidity = state.get(name, {}).get("humidity", zone["humidity"])
        prev_wind = state.get(name, {}).get("wind", zone["wind"])

        temp = prev_temp + random.uniform(-0.6, 0.6)
        temp = max(base_temp - 2, min(base_temp + 2, temp))
        temp = round(temp, 2)

        humidity = prev_humidity + random.uniform(-1.5, 1.5)
        humidity = max(10, min(95, humidity))
        humidity = round(humidity, 1)

        wind = prev_wind + random.uniform(-0.4, 0.4)
        wind = max(0, min(20, wind))
        wind = round(wind, 1)

        vegetation = max(0.1, min(0.9, zone.get("vegetation", 0.5) + random.uniform(-0.03, 0.03)))
        vegetation = round(vegetation, 3)

        next_state[name] = {
            "temperature": temp,
            "humidity": humidity,
            "wind": wind,
        }

        data_list.append({
            "name": name,
            "latitude": zone["latitude"],
            "longitude": zone["longitude"],
            "temperature": float(temp),
            "density": float(zone.get("density", 0)),
            "humidity": float(humidity),
            "wind": float(wind),
            "vegetation": float(vegetation),
        })

    set_simulation_state(next_state)
    return apply_clusters(data_list, use_randomness=True)


def compute_simulation_clusters():
    real_data = get_cached_heat_data(SystemMode.REAL)
    return generate_simulation_dataset(real_data)


def compute_clusters(mode=None):
    active_mode = mode or get_current_mode()
    if active_mode == SystemMode.SIMULATION:
        return compute_simulation_clusters()
    return compute_real_clusters()


def get_cached_heat_data(mode=None):
    active_mode = mode or get_current_mode()
    key = cache_key_for_mode(active_mode)
    data = cache.get(key)

    if data is not None:
        return data

    if active_mode == SystemMode.SIMULATION:
        # Build simulation data from the latest real dataset and cache it briefly.
        real_data = get_cached_heat_data(SystemMode.REAL)
        data = generate_simulation_dataset(real_data)
        cache.set(key, data, timeout=SIMULATION_CACHE_TTL_SECONDS)
        return data

    data = compute_clusters(active_mode)
    cache.set(key, data, timeout=DATA_CACHE_TTL_SECONDS)
    return data


@api_view(["GET"])
def get_clusters(request):
    data = get_cached_heat_data()
    return Response(data)


@api_view(["GET"])
def get_history(request):
    mode = get_current_mode()
    data = get_cached_heat_data(mode)

    result = []

    for zone in data:
        base = zone["temperature"]

        if mode == SystemMode.SIMULATION:
            temps = [base + random.uniform(-1, 1) for _ in range(5)]
            temperature = sum(temps) / len(temps)
        else:
            temperature = base

        result.append({
            "name": zone["name"],
            "temperature": round(temperature, 2),
        })

    return Response(result)


@api_view(["GET"])
def get_heat_data(request):
    data = get_cached_heat_data()
    return Response(data)


@api_view(["POST"])
def simulate_data(request):
    SystemMode.set_mode(SystemMode.SIMULATION)
    clear_simulation_state()
    data = compute_clusters(SystemMode.SIMULATION)
    cache.set(cache_key_for_mode(SystemMode.SIMULATION), data, timeout=SIMULATION_CACHE_TTL_SECONDS)

    return Response({
        "message": "Simulation updated",
        "mode": SystemMode.SIMULATION,
        "data": data,
    })


@api_view(["GET"])
def get_mode(request):
    return Response({"mode": get_current_mode()})


@api_view(["POST"])
def enable_simulation(request):
    SystemMode.set_mode(SystemMode.SIMULATION)
    clear_simulation_state()
    data = compute_clusters(SystemMode.SIMULATION)
    cache.set(cache_key_for_mode(SystemMode.SIMULATION), data, timeout=SIMULATION_CACHE_TTL_SECONDS)

    return Response({
        "mode": SystemMode.SIMULATION,
        "data": data,
    })


@api_view(["POST"])
def disable_simulation(request):
    SystemMode.set_mode(SystemMode.REAL)
    cache.delete(cache_key_for_mode(SystemMode.SIMULATION))
    clear_simulation_state()
    data = compute_clusters(SystemMode.REAL)
    cache.set(cache_key_for_mode(SystemMode.REAL), data, timeout=DATA_CACHE_TTL_SECONDS)

    return Response({
        "mode": SystemMode.REAL,
        "data": data,
    })


@api_view(["GET", "POST"])
def get_or_update_areas(request):
    from .areas_config import MASTER_AREAS
    from .models import SelectedArea

    # Ensure database is synced
    sync_selected_areas()

    if request.method == "GET":
        regions_map = {}
        for area in MASTER_AREAS:
            reg = area["region"]
            if reg not in regions_map:
                regions_map[reg] = []
            
            try:
                db_area = SelectedArea.objects.get(name=area["name"])
                is_selected = db_area.is_selected
            except SelectedArea.DoesNotExist:
                is_selected = True

            regions_map[reg].append({
                "name": area["name"],
                "latitude": area["latitude"],
                "longitude": area["longitude"],
                "is_selected": is_selected
            })
        
        result = [
            {"region": reg, "areas": areas}
            for reg, areas in regions_map.items()
        ]
        return Response(result)

    elif request.method == "POST":
        selected_names = request.data.get("selected_names", [])
        if not selected_names:
            return Response({"error": "At least one area must be selected"}, status=400)

        # Update database
        SelectedArea.objects.all().update(is_selected=False)
        SelectedArea.objects.filter(name__in=selected_names).update(is_selected=True)

        # Invalidate and immediately recalculate cache
        cache.delete(cache_key_for_mode(SystemMode.REAL))
        cache.delete(cache_key_for_mode(SystemMode.SIMULATION))
        clear_simulation_state()

        # Recalculate for current mode and put in cache
        mode = get_current_mode()
        data = compute_clusters(mode)
        ttl = SIMULATION_CACHE_TTL_SECONDS if mode == SystemMode.SIMULATION else DATA_CACHE_TTL_SECONDS
        cache.set(cache_key_for_mode(mode), data, timeout=ttl)

        return Response({
            "message": "Selected areas updated successfully",
            "active_count": len(selected_names)
        })


@api_view(["GET"])
def get_historical_climate(request):
    """
    Fetch historical monthly average temperatures for Pune.
    
    Query params:
        - year_range: Number of years to retrieve (5-30, default 10)
        - month: Current month (optional, auto-detected if not provided)
    """
    from datetime import datetime
    from .services import fetch_historical_monthly_averages
    from .models import HistoricalMonthlyAverage
    
    # Pune coordinates
    PUNE_LAT = 18.5204
    PUNE_LON = 73.8567
    
    year_range = int(request.query_params.get("year_range", 10))
    year_range = max(5, min(30, year_range))  # Clamp to 5-30
    current_month = int(request.query_params.get("month", datetime.now().month))
    
    try:
        # Check if we have cached data for all requested years and current month
        current_year = datetime.now().year
        start_year = current_year - year_range + 1
        
        cached_records = HistoricalMonthlyAverage.objects.filter(
            month=current_month,
            year__gte=start_year
        ).values('year', 'month', 'avg_temperature', 'avg_humidity')
        
        # If we have all records for this month across requested years, return cached
        if cached_records.count() >= year_range:
            data = list(cached_records.order_by('year'))
            return Response({
                "current_month": current_month,
                "year_range": year_range,
                "data": data,
                "source": "cache"
            })
        
        # Otherwise, fetch from API
        historical_data = fetch_historical_monthly_averages(PUNE_LAT, PUNE_LON, year_range)
        
        # Filter to current month and save to DB
        current_month_data = []
        for record in historical_data:
            if record["month"] == current_month:
                current_month_data.append(record)
                
                # Upsert into database
                HistoricalMonthlyAverage.objects.update_or_create(
                    year=record["year"],
                    month=record["month"],
                    defaults={
                        "avg_temperature": record["avg_temperature"],
                        "avg_humidity": record["avg_humidity"],
                    }
                )
        
        return Response({
            "current_month": current_month,
            "year_range": year_range,
            "data": sorted(current_month_data, key=lambda x: x["year"]),
            "source": "api"
        })
        
    except Exception as e:
        print("Historical climate fetch error:", e)
        return Response({
            "error": "Failed to fetch historical data",
            "details": str(e)
        }, status=500)


client = anthropic.Anthropic(api_key="your-anthropic-api-key-here")



@csrf_exempt
def chat(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    try:
        body = json.loads(request.body)
        messages = body.get("messages", [])
        system = body.get("system", "")

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=system,
            messages=messages,
        )

        return JsonResponse({"reply": response.content[0].text})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
