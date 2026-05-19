import random

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .services import fetch_open_meteo, fetch_building_density
from .models import HeatData, HeatDataHistory
from .serializers import HeatDataSerializer
from .ml_model import get_heat_clusters


# 🔹 GET LIVE DATA (REAL API)
@api_view(['GET'])
def get_heat_data(request):
    areas = [
        ("Hinjewadi", 18.5912, 73.7389),
        ("Kharadi", 18.5515, 73.9475),
        ("Aundh", 18.5610, 73.8070),
        ("Kothrud", 18.5074, 73.8077),
        ("PCMC", 18.6298, 73.7997),
    ]

    result = []

    for name, lat, lon in areas:
        weather = fetch_open_meteo(lat, lon)
        density = fetch_building_density(lat, lon, name)

        temp = weather["temperature"][0] if weather["temperature"] else 30

        result.append({
            "name": name,
            "latitude": lat,
            "longitude": lon,
            "temperature": float(temp),
            "density": density,
        })

    return Response(result)


# 🔹 GET HISTORY → 24hr AVG PER AREA
@api_view(['GET'])
def get_history(request):
    areas = [
        ("Hinjewadi", 18.5912, 73.7389),
        ("Kharadi", 18.5515, 73.9475),
        ("Aundh", 18.5610, 73.8070),
        ("Kothrud", 18.5074, 73.8077),
        ("PCMC", 18.6298, 73.7997),
    ]

    result = []

    for name, lat, lon in areas:
        data = fetch_open_meteo(lat, lon)
        temps = data["temperature"]

        avg_temp = sum(temps) / len(temps) if temps else 0

        result.append({
            "name": name,
            "temperature": round(avg_temp, 2)
        })

    return Response(result)


# 🔹 GET CLUSTERS (REAL ML)
@api_view(['GET'])
def get_clusters(request):
    areas = [
        ("Hinjewadi", 18.5912, 73.7389),
        ("Kharadi", 18.5515, 73.9475),
        ("Aundh", 18.5610, 73.8070),
        ("Kothrud", 18.5074, 73.8077),
        ("PCMC", 18.6298, 73.7997),
    ]

    data_list = []

    for name, lat, lon in areas:
        weather = fetch_open_meteo(lat, lon)
        density = fetch_building_density(lat, lon, name)

        temp = weather["temperature"][0] if weather["temperature"] else 30

        data_list.append({
            "name": name,
            "latitude": lat,
            "longitude": lon,
            "temperature": float(temp),
            "density": density
        })

    clusters = get_heat_clusters(data_list)

    result = []

    for i, item in enumerate(data_list):
        item["cluster"] = clusters[i] if i < len(clusters) else 0
        result.append(item)

    return Response(result)


# 🔹 ADD DATA (UNCHANGED)
@api_view(['POST'])
def add_heat_data(request):
    serializer = HeatDataSerializer(data=request.data)

    if serializer.is_valid():
        obj = serializer.save()

        HeatDataHistory.objects.create(
            name=obj.name,
            latitude=obj.latitude,
            longitude=obj.longitude,
            temperature=obj.temperature,
            riskLevel=obj.riskLevel
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 🔹 SIMULATE (UNCHANGED)
@api_view(['POST'])
def simulate_data(request):
    areas = [
        ("Hinjewadi", 18.5912, 73.7389),
        ("Kharadi", 18.5515, 73.9475),
        ("Aundh", 18.5610, 73.8070),
        ("Kothrud", 18.5074, 73.8077),
        ("PCMC", 18.6298, 73.7997),
    ]

    updated_data = []

    for name, lat, lon in areas:
        temp = random.randint(30, 45)

        if temp >= 40:
            risk = "Critical"
        elif temp >= 37:
            risk = "High"
        elif temp >= 34:
            risk = "Moderate"
        else:
            risk = "Low"

        obj, created = HeatData.objects.update_or_create(
            name=name,
            defaults={
                "latitude": lat,
                "longitude": lon,
                "temperature": temp,
                "riskLevel": risk
            }
        )

        HeatDataHistory.objects.create(
            name=name,
            latitude=lat,
            longitude=lon,
            temperature=temp,
            riskLevel=risk
        )

        updated_data.append({
            "name": name,
            "temperature": temp,
            "riskLevel": risk,
            "updated": not created
        })

    return Response({
        "message": "Live + History updated",
        "data": updated_data
    })
