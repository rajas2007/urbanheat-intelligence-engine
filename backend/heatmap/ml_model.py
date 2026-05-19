import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


def get_heat_clusters(data_list):
    """
    data_list = [
        {
            "name": "...",
            "latitude": ...,
            "longitude": ...,
            "temperature": ...,
            "density": ...
        },
        ...
    ]
    """

    # ✅ No data case
    if len(data_list) == 0:
        return []

    # ✅ Features: latitude, longitude, temperature, density
    features = np.array([
        [
            float(d["latitude"]),
            float(d["longitude"]),
            float(d["temperature"]),
            float(d["density"])
        ]
        for d in data_list
    ])

    # ✅ Scale features
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(features)

    # 🔥 Weight adjustments (IMPORTANT)
    # temperature → strongest influence
    # density → second strongest
    scaled_features[:, 2] *= 2.5   # temperature weight
    scaled_features[:, 3] *= 1.8   # density weight

    # 🔥 Handle small dataset
    if len(scaled_features) < 3:
        return [0] * len(scaled_features)

    # ✅ KMeans clustering
    kmeans = KMeans(n_clusters=3, n_init=10, random_state=0)
    kmeans.fit(scaled_features)

    return kmeans.labels_.astype(int).tolist()