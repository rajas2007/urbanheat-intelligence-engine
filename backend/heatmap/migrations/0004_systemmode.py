from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("heatmap", "0003_heatdatahistory_remove_heatdata_humidity_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="SystemMode",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("mode", models.CharField(choices=[("REAL", "Real Data"), ("SIMULATION", "Simulation")], default="REAL", max_length=20)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
