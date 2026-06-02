import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

import requests


OPEN_METEO_TIMEOUT_SECONDS = 10
OPEN_METEO_RETRY_ATTEMPTS = 3
OPEN_METEO_RETRY_BACKOFF_SECONDS = 0.5
OPEN_METEO_CACHE_TTL_SECONDS = 300
OPEN_METEO_BATCH_MAX_WORKERS = 8

weather_cache = {}
weather_cache_lock = Lock()


def empty_weather_data():
    return {
        "time": [],
        "temperature": [],
        "humidity": [],
        "wind_speed": [],
    }


def weather_cache_key(lat, lon):
    return (round(float(lat), 4), round(float(lon), 4))


def build_open_meteo_url(lat, lon):
    return (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m"
        f"&timezone=auto"
    )


def fetch_open_meteo_point(lat, lon):
    cache_key = weather_cache_key(lat, lon)
    now = time.time()

    with weather_cache_lock:
        cached = weather_cache.get(cache_key)
        if cached and now - cached["fetched_at"] < OPEN_METEO_CACHE_TTL_SECONDS:
            return cached["data"]

    url = build_open_meteo_url(lat, lon)

    for attempt in range(OPEN_METEO_RETRY_ATTEMPTS):
        try:
            response = requests.get(url, timeout=OPEN_METEO_TIMEOUT_SECONDS)
            response.raise_for_status()
            data = response.json()

            weather_data = {
                "time": data["hourly"]["time"],
                "temperature": data["hourly"]["temperature_2m"],
                "humidity": data["hourly"].get("relative_humidity_2m", []),
                "wind_speed": data["hourly"].get("wind_speed_10m", []),
            }

            with weather_cache_lock:
                weather_cache[cache_key] = {
                    "data": weather_data,
                    "fetched_at": time.time(),
                }

            return weather_data
        except (requests.RequestException, ValueError, KeyError) as e:
            if attempt < OPEN_METEO_RETRY_ATTEMPTS - 1:
                time.sleep(OPEN_METEO_RETRY_BACKOFF_SECONDS * (attempt + 1))
                continue

            print("Open-Meteo error:", e)

    with weather_cache_lock:
        cached = weather_cache.get(cache_key)

    if cached:
        return cached["data"]

    return empty_weather_data()


def fetch_open_meteo(lat, lon):
    return fetch_open_meteo_point(lat, lon)


def fetch_multiple_open_meteo(coords):
    if not coords:
        return {}

    results = {}
    max_workers = min(OPEN_METEO_BATCH_MAX_WORKERS, len(coords))

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_coord = {
            executor.submit(fetch_open_meteo_point, lat, lon): (lat, lon)
            for lat, lon in coords
        }

        for future in as_completed(future_to_coord):
            coord = future_to_coord[future]
            try:
                results[weather_cache_key(*coord)] = future.result()
            except Exception as e:
                print("Open-Meteo batch error for %s: %s" % (coord, e))
                results[weather_cache_key(*coord)] = empty_weather_data()

    return results


# Static density estimates keep dashboard requests stable.
# Real-time Overpass calls were removed because they caused rate limits,
# HTTP 406 responses, timeouts, and blocking request delays.
density_cache = {}


def fetch_building_density(lat, lon, name):
    key = name.strip().lower()

    if key not in density_cache:
        from .areas_config import MASTER_AREAS
        density = 0
        for area in MASTER_AREAS:
            if area["name"].strip().lower() == key:
                density = area.get("density", 0)
                break
        density_cache[key] = density

    return density_cache[key]


def fetch_historical_monthly_averages(lat, lon, year_range=10):
    """
    Fetch historical monthly average temperatures for Pune from Open-Meteo archive API.
    
    Args:
        lat: Latitude (18.5204 for Pune)
        lon: Longitude (73.8567 for Pune)
        year_range: Number of years to retrieve (default 10)
    
    Returns:
        List of dicts with keys: year, month, avg_temperature, avg_humidity
    """
    import datetime
    
    today = datetime.date.today()
    current_year = today.year
    start_year = current_year - year_range + 1
    
    results = []
    
    for year in range(start_year, current_year + 1):
        start_date = f"{year}-01-01"
        end_date = f"{year}-12-31"
        
        url = (
            f"https://archive-api.open-meteo.com/v1/archive"
            f"?latitude={lat}&longitude={lon}"
            f"&start_date={start_date}&end_date={end_date}"
            f"&monthly=temperature_2m_mean,relative_humidity_2m_mean"
            f"&timezone=auto"
        )
        
        for attempt in range(OPEN_METEO_RETRY_ATTEMPTS):
            try:
                response = requests.get(url, timeout=OPEN_METEO_TIMEOUT_SECONDS)
                response.raise_for_status()
                data = response.json()
                
                monthly_temps = data["monthly"]["temperature_2m_mean"]
                monthly_humidity = data["monthly"].get("relative_humidity_2m_mean", [])
                
                for month_idx, temp in enumerate(monthly_temps, start=1):
                    results.append({
                        "year": year,
                        "month": month_idx,
                        "avg_temperature": float(temp) if temp is not None else 25.0,
                        "avg_humidity": float(monthly_humidity[month_idx - 1]) if month_idx - 1 < len(monthly_humidity) and monthly_humidity[month_idx - 1] is not None else 60.0,
                    })
                break
                
            except (requests.RequestException, ValueError, KeyError) as e:
                if attempt < OPEN_METEO_RETRY_ATTEMPTS - 1:
                    time.sleep(OPEN_METEO_RETRY_BACKOFF_SECONDS * (attempt + 1))
                    continue
                print(f"Historical archive fetch error for {year}: {e}")
                break
    
    return results
