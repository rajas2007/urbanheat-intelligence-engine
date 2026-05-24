import numpy as np
import random
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


def get_heat_clusters(data_list):

    if len(data_list) == 0:
        return []

    # 🔥 INCLUDE ALL FEATURES + RANDOM WEIGHT SHIFT
    features = np.array([
        [
            float(d["temperature"]) * random.uniform(0.85, 1.15),
            float(d["density"]) * random.uniform(0.85, 1.15),
            float(d["humidity"]) * random.uniform(0.85, 1.15),
            float(d["wind"]) * random.uniform(0.85, 1.15),
            float(d["vegetation"]) * random.uniform(0.85, 1.15),
        ]
        for d in data_list
    ])

    # ✅ Scale
    scaler = StandardScaler()
    scaled = scaler.fit_transform(features)

    # 🔥 Weight importance
    scaled[:, 0] *= 3.0   # temperature (most important)
    scaled[:, 1] *= 2.0   # density
    scaled[:, 2] *= 1.5   # humidity
    scaled[:, 3] *= 1.2   # wind
    scaled[:, 4] *= 1.0   # vegetation

    noise = np.random.normal(0, 0.3, scaled.shape)
    scaled = scaled + noise

    if len(scaled) < 3:
        return [0] * len(scaled)

    kmeans = KMeans(
    n_clusters=3,
    n_init=1,           # 🔥 reduce stability
    random_state=None   # 🔥 remove fixed pattern
)
    kmeans.fit(scaled)
    

    return kmeans.labels_.astype(int).tolist()

