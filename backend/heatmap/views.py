import json
import random
import threading
import time
import logging

logger = logging.getLogger(__name__)

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
            "id": area["id"],
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
            "id": zone.get("id"),
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
        logger.info(f"Cache hit: {key}")
        return data

    logger.info(f"Cache miss: {key}")

    if active_mode == SystemMode.SIMULATION:
        # Build simulation data from the latest real dataset and cache it briefly.
        real_data = get_cached_heat_data(SystemMode.REAL)
        data = generate_simulation_dataset(real_data)
        cache.set(key, data, timeout=SIMULATION_CACHE_TTL_SECONDS)
        logger.info(f"Cache write: {key} (provider: simulation)")
        return data

    data = compute_clusters(active_mode)
    cache.set(key, data, timeout=DATA_CACHE_TTL_SECONDS)
    logger.info(f"Cache write: {key} (provider: real)")
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




def get_analysis_report_from_cache_or_engine(mode, area_id, expected_provider, is_cooldown_active, refresh, heat_data):
    from .analysis.facade import generate_analysis
    from .analysis.resolver import resolve_area_context
    from .areas_config import MASTER_AREAS
    from .serializers import AreaAnalysisSerializer

    backup_provider = "rule" if expected_provider == "gemini" else "gemini"
    primary_key = f"analysis:{mode}:{area_id}:{expected_provider}"
    backup_key = f"analysis:{mode}:{area_id}:{backup_provider}"

    bypass_cache = refresh and not is_cooldown_active

    if not bypass_cache:
        # Check primary key
        cached_data = cache.get(primary_key)
        if cached_data is not None:
            logger.info(f"Cache hit: {primary_key}")
            return cached_data

        # Check backup key
        cached_data = cache.get(backup_key)
        if cached_data is not None:
            logger.info(f"Cache hit: {backup_key}")
            return cached_data

        logger.info(f"Cache miss: {primary_key}")
    else:
        logger.info(f"Cache miss: {primary_key}")

    # Cache miss or bypass -> generate report
    context = resolve_area_context(area_id, heat_data, MASTER_AREAS)
    if not context:
        return None

    report = generate_analysis(context, area_id=area_id)
    report_dict = AreaAnalysisSerializer(report.to_dict()).data

    actual_provider = "gemini" if "gemini" in report.provider.lower() else "rule"
    actual_cache_key = f"analysis:{mode}:{area_id}:{actual_provider}"

    # Cache duration: 30 minutes for gemini, 10 minutes for rule
    ttl = 1800 if actual_provider == "gemini" else 600
    cache.set(actual_cache_key, report_dict, timeout=ttl)
    logger.info(f"Cache write: {actual_cache_key} (provider: {actual_provider})")

    return report_dict


@api_view(["GET"])
def get_area_analysis(request, area_id):
    from django.utils import timezone
    from .models import SystemSettings

    logger.info("Analysis requested", extra={"area_id": area_id})

    heat_data = get_cached_heat_data()
    if not heat_data:
        return Response({"error": "Heat data unavailable"}, status=503)

    mode = get_current_mode()
    settings_obj = SystemSettings.get_settings()
    refresh = request.query_params.get("refresh", "false").lower() == "true"

    # Cooldown check
    is_cooldown_active = False
    if settings_obj.provider_status == "quota_exceeded" and settings_obj.cooldown_until:
        if timezone.now() < settings_obj.cooldown_until:
            is_cooldown_active = True
        else:
            settings_obj.provider_status = "active"
            settings_obj.cooldown_until = None
            settings_obj.save(update_fields=['provider_status', 'cooldown_until'])

    # Determine expected provider before check
    if mode == SystemMode.SIMULATION:
        expected_provider = "rule"
    elif is_cooldown_active:
        expected_provider = "rule"
    elif settings_obj.analysis_mode == "rule_engine":
        expected_provider = "rule"
    else:
        expected_provider = "gemini"

    report_dict = get_analysis_report_from_cache_or_engine(
        mode=mode,
        area_id=area_id,
        expected_provider=expected_provider,
        is_cooldown_active=is_cooldown_active,
        refresh=refresh,
        heat_data=heat_data
    )

    if not report_dict:
        return Response(
            {"error": "Area not found or failed to generate report", "area_id": area_id},
            status=404,
        )

    return Response(report_dict)


@csrf_exempt
def chat(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    try:
        body = json.loads(request.body)
        messages = body.get("messages", [])
        
        # System prompt with project context
        system_prompt = """You are the AI assistant for the Urban Thermal Trapping Intelligence Engine.
You help users understand urban heat patterns in Pune, India. 
The system uses K-Means clustering to classify areas into Safe (0), Moderate (1), and Critical (2) zones.
The Risk Score (0-100) measures overall heat vulnerability.
The Heat Trap Score (0-100) measures how much heat is retained due to dense buildings, low wind, and poor vegetation.
Always provide project-specific answers. If users ask about a specific area like Hinjewadi, explain using urban planning concepts.
"""
        
        from .llm import get_llm_provider
        provider = get_llm_provider()
        
        reply = provider.generate_chat(messages, system_prompt)
        return JsonResponse({"reply": reply})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["GET"])
def download_area_analysis_pdf(request, area_id):
    from django.http import HttpResponse
    from .analysis.resolver import resolve_area_context
    from .areas_config import MASTER_AREAS
    from .pdf.generator import generate_intelligence_report
    from django.utils import timezone
    from .models import SystemSettings

    logger.info("Analysis requested", extra={"area_id": area_id, "pdf": True})

    heat_data = get_cached_heat_data()
    if not heat_data:
        return Response({"error": "Heat data unavailable"}, status=503)

    context = resolve_area_context(area_id, heat_data, MASTER_AREAS)
    if not context:
        return Response({"error": "Area not found"}, status=404)

    mode = get_current_mode()
    settings_obj = SystemSettings.get_settings()

    # Cooldown check
    is_cooldown_active = False
    if settings_obj.provider_status == "quota_exceeded" and settings_obj.cooldown_until:
        if timezone.now() < settings_obj.cooldown_until:
            is_cooldown_active = True
        else:
            settings_obj.provider_status = "active"
            settings_obj.cooldown_until = None
            settings_obj.save(update_fields=['provider_status', 'cooldown_until'])

    # Determine expected provider
    if mode == SystemMode.SIMULATION:
        expected_provider = "rule"
    elif is_cooldown_active:
        expected_provider = "rule"
    elif settings_obj.analysis_mode == "rule_engine":
        expected_provider = "rule"
    else:
        expected_provider = "gemini"

    report_dict = get_analysis_report_from_cache_or_engine(
        mode=mode,
        area_id=area_id,
        expected_provider=expected_provider,
        is_cooldown_active=is_cooldown_active,
        refresh=False,
        heat_data=heat_data
    )

    if not report_dict:
        return Response({"error": "Failed to generate report"}, status=500)

    try:
        metrics_data = context.to_dict()
        pdf_bytes = generate_intelligence_report(report_dict, metrics_data)
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"Intelligence_Report_{context.name.replace(' ', '_')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    except Exception as e:
        print("PDF generation error:", e)
        return Response({"error": "Failed to generate PDF", "details": str(e)}, status=500)

@api_view(["GET"])
def download_city_analysis_pdf(request):
    import time
    import uuid
    import hashlib
    from django.http import HttpResponse
    from .analysis.resolver import resolve_area_context
    from .areas_config import MASTER_AREAS
    from .pdf.generator import generate_city_intelligence_report
    from django.utils import timezone
    from .models import SystemSettings

    logger.info("Analysis requested", extra={"area_id": "city"})
    start_time = time.time()
    
    heat_data = get_cached_heat_data()
    if not heat_data:
        return Response({"error": "Heat data unavailable"}, status=503)

    active_areas = get_active_areas()
    if not active_areas:
        return Response({"error": "No active areas found"}, status=404)

    mode = get_current_mode()
    settings_obj = SystemSettings.get_settings()

    # MD5 settings hash to dynamically invalidate the cached city PDF when settings change
    settings_str = f"{settings_obj.analysis_mode}:{settings_obj.pdf_report_type}:{settings_obj.include_executive_summary}:{settings_obj.include_rankings}:{settings_obj.include_area_details}:{settings_obj.include_recommendations}:{settings_obj.include_appendix}"
    settings_hash = hashlib.md5(settings_str.encode('utf-8')).hexdigest()[:8]
    city_pdf_cache_key = f"city_pdf_report:{mode}:{settings_hash}"

    # Check cached city PDF report (cache for 1 hour)
    cached_pdf = cache.get(city_pdf_cache_key)
    if cached_pdf:
        logger.info(f"Cache hit: {city_pdf_cache_key}")
        response = HttpResponse(cached_pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="Pune_City_Intelligence_Report.pdf"'
        return response

    logger.info(f"Cache miss: {city_pdf_cache_key}")

    # Cooldown check
    is_cooldown_active = False
    if settings_obj.provider_status == "quota_exceeded" and settings_obj.cooldown_until:
        if timezone.now() < settings_obj.cooldown_until:
            is_cooldown_active = True
        else:
            settings_obj.provider_status = "active"
            settings_obj.cooldown_until = None
            settings_obj.save(update_fields=['provider_status', 'cooldown_until'])

    # Determine expected provider
    if mode == SystemMode.SIMULATION:
        expected_provider = "rule"
    elif is_cooldown_active:
        expected_provider = "rule"
    elif settings_obj.analysis_mode == "rule_engine":
        expected_provider = "rule"
    else:
        expected_provider = "gemini"

    area_reports = []
    cache_hits = 0
    cache_misses = 0

    for area_info in active_areas:
        area_id = area_info['id']
        context = resolve_area_context(area_id, heat_data, MASTER_AREAS)
        if not context:
            continue

        backup_provider = "rule" if expected_provider == "gemini" else "gemini"
        primary_key = f"analysis:{mode}:{area_id}:{expected_provider}"
        backup_key = f"analysis:{mode}:{area_id}:{backup_provider}"
        
        has_cache = cache.get(primary_key) is not None or cache.get(backup_key) is not None
        if has_cache:
            cache_hits += 1
        else:
            cache_misses += 1

        report_dict = get_analysis_report_from_cache_or_engine(
            mode=mode,
            area_id=area_id,
            expected_provider=expected_provider,
            is_cooldown_active=is_cooldown_active,
            refresh=False,
            heat_data=heat_data
        )
        if report_dict:
            area_reports.append(report_dict)

    # Sort by risk score descending
    area_reports.sort(key=lambda x: x.get('risk_score', 0), reverse=True)

    if not area_reports:
        return Response({"error": "Failed to generate any area reports"}, status=500)

    # Calculate city metrics
    total_areas = len(area_reports)
    avg_risk_score = sum(r.get('risk_score', 0) for r in area_reports) / total_areas
    avg_heat_trap_score = sum(r.get('heat_trap_score', 0) for r in area_reports) / total_areas
    highest_risk = area_reports[0].get('area', 'N/A')
    lowest_risk = area_reports[-1].get('area', 'N/A')
    
    cluster_counts = {'Safe': 0, 'Moderate': 0, 'High': 0, 'Critical': 0}
    for r in area_reports:
        cluster = r.get('cluster_classification', 'Safe')
        if cluster in cluster_counts:
            cluster_counts[cluster] += 1
        else:
            # map if names differ
            if 'Critical' in cluster: cluster_counts['Critical'] += 1
            elif 'Moderate' in cluster: cluster_counts['Moderate'] += 1
            elif 'Safe' in cluster: cluster_counts['Safe'] += 1
            else: cluster_counts['High'] += 1
            
    total_critical = cluster_counts['Critical']
    total_high = cluster_counts['High']

    city_metrics = {
        'total_areas': total_areas,
        'avg_risk_score': avg_risk_score,
        'avg_heat_trap_score': avg_heat_trap_score,
        'highest_risk_area': highest_risk,
        'lowest_risk_area': lowest_risk,
        'total_critical': total_critical,
        'total_high': total_high,
        'cluster_counts': cluster_counts,
        'report_id': str(uuid.uuid4())[:8].upper(),
        'cache_hits': cache_hits,
        'cache_misses': cache_misses,
        'generation_time': time.time() - start_time
    }

    try:
        pdf_bytes = generate_city_intelligence_report(city_metrics, area_reports)
        # Cache city PDF report for 1 hour (3600 seconds)
        cache.set(city_pdf_cache_key, pdf_bytes, timeout=3600)
        logger.info(f"Cache write: {city_pdf_cache_key} (provider: {expected_provider})")
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="Pune_City_Intelligence_Report.pdf"'
        
        # update settings if present
        settings_obj.last_pdf_generated = timezone.now()
        settings_obj.save(update_fields=['last_pdf_generated'])
        
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": "Failed to generate City PDF", "details": str(e)}, status=500)


@api_view(["GET", "POST"])
def get_or_update_system_settings(request):
    from .models import SystemSettings, SelectedArea
    from .serializers import SystemSettingsSerializer

    settings_obj = SystemSettings.get_settings()

    if request.method == "GET":
        from django.utils import timezone
        if settings_obj.provider_status == "quota_exceeded" and settings_obj.cooldown_until:
            if timezone.now() >= settings_obj.cooldown_until:
                settings_obj.provider_status = "active"
                settings_obj.cooldown_until = None
                settings_obj.save(update_fields=['provider_status', 'cooldown_until'])

        serializer = SystemSettingsSerializer(settings_obj)
        data = serializer.data

        # Compute health stats
        try:
            active_areas_count = SelectedArea.objects.filter(is_selected=True).count()
        except:
            active_areas_count = 0

        cached_reports = 0
        try:
            if hasattr(cache, '_cache'):
                cached_reports = len(cache._cache)
        except:
            pass

        data["health"] = {
            "active_areas": active_areas_count,
            "current_mode": get_current_mode(),
            "llm_provider": settings_obj.provider,
            "analysis_mode": settings_obj.analysis_mode,
            "cached_reports": cached_reports,
            "last_analysis": settings_obj.last_successful_analysis.isoformat() if settings_obj.last_successful_analysis else None,
            "last_pdf": settings_obj.last_pdf_generated.isoformat() if settings_obj.last_pdf_generated else None,
            "system_version": "1.0.0"
        }
        return Response(data)

    elif request.method == "POST":
        serializer = SystemSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
