from django.db import models


class HeatData(models.Model):
    name = models.CharField(max_length=100, unique=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    temperature = models.FloatField()
    riskLevel = models.CharField(max_length=20)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.temperature} C)"


class HeatDataHistory(models.Model):
    name = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    temperature = models.FloatField()
    riskLevel = models.CharField(max_length=20)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.temperature} C @ {self.timestamp}"


class SystemMode(models.Model):
    REAL = "REAL"
    SIMULATION = "SIMULATION"

    MODE_CHOICES = [
        (REAL, "Real Data"),
        (SIMULATION, "Simulation"),
    ]

    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default=REAL)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def current(cls):
        obj, _ = cls.objects.get_or_create(pk=1, defaults={"mode": cls.REAL})
        return obj

    @classmethod
    def get_mode(cls):
        return cls.current().mode

    @classmethod
    def set_mode(cls, mode):
        obj = cls.current()
        obj.mode = mode
        obj.save(update_fields=["mode", "updated_at"])
        return obj

    def __str__(self):
        return self.mode


class SelectedArea(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_selected = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({'Selected' if self.is_selected else 'Deselected'})"


class HistoricalMonthlyAverage(models.Model):
    """
    Cache for historical monthly climate data from Open-Meteo.
    Stores average temperature for each month across years for Pune.
    """
    year = models.IntegerField()
    month = models.IntegerField()  # 1-12
    avg_temperature = models.FloatField()
    avg_humidity = models.FloatField(null=True, blank=True)
    data_source = models.CharField(max_length=50, default="open_meteo")
    fetched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('year', 'month')
        ordering = ['year', 'month']

    def __str__(self):
        return f"{self.year}-{self.month:02d}: {self.avg_temperature}°C"

