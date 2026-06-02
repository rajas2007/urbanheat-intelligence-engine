import random

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


def get_heat_clusters(data_list, use_randomness=True):
    if len(data_list) == 0:
        return []

    features = np.array([
        [
            float(d["temperature"]) * (random.uniform(0.85, 1.15) if use_randomness else 1),
            float(d["density"]) * (random.uniform(0.85, 1.15) if use_randomness else 1),
            float(d["humidity"]) * (random.uniform(0.85, 1.15) if use_randomness else 1),
            float(d["wind"]) * (random.uniform(0.85, 1.15) if use_randomness else 1),
            float(d["vegetation"]) * (random.uniform(0.85, 1.15) if use_randomness else 1),
        ]
        for d in data_list
    ])

    scaler = StandardScaler()
    scaled = scaler.fit_transform(features)

    scaled[:, 0] *= 3.0
    scaled[:, 1] *= 2.0
    scaled[:, 2] *= 1.5
    scaled[:, 3] *= 1.2
    scaled[:, 4] *= 1.0

    if use_randomness:
        scaled = scaled + np.random.normal(0, 0.3, scaled.shape)

    if len(scaled) < 3:
        return [0] * len(scaled)

    kmeans = KMeans(
        n_clusters=3,
        n_init=1 if use_randomness else 10,
        random_state=None if use_randomness else 42,
    )
    kmeans.fit(scaled)

    return kmeans.labels_.astype(int).tolist()
