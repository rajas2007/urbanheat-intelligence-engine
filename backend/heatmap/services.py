import requests


def fetch_open_meteo(lat, lon):
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&hourly=temperature_2m"
        f"&timezone=auto"
    )

    try:
        response = requests.get(url, timeout=5)
        data = response.json()

        return {
            "time": data["hourly"]["time"],
            "temperature": data["hourly"]["temperature_2m"]
        }
    except Exception as e:
        print("Open-Meteo error:", e)
        return {
            "time": [],
            "temperature": []
        }


# Static density estimates keep dashboard requests stable.
# Real-time Overpass calls were removed because they caused rate limits,
# HTTP 406 responses, timeouts, and blocking request delays.
STATIC_DENSITY_MAP = {
    "Hinjewadi": 120,
    "Kharadi": 180,
    "Aundh": 150,
    "Kothrud": 160,
    "PCMC": 140,
}

DENSITY_BY_AREA = {
    area.lower(): density
    for area, density in STATIC_DENSITY_MAP.items()
}

density_cache = {}


def fetch_building_density(lat, lon, name):
    key = name.strip().lower()

    if key not in density_cache:
        density_cache[key] = DENSITY_BY_AREA.get(key, 0)

    return density_cache[key]
