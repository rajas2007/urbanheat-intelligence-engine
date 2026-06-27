# 🌍 Urban Heat Intelligence Engine

> **An AI- and Machine Learning-powered Smart City platform that detects Urban Heat Islands (UHIs), classifies heat-risk zones using the K-Means clustering algorithm, analyzes environmental and climate data, and generates intelligent mitigation strategies to support sustainable urban planning and climate resilience.**

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![Django](https://img.shields.io/badge/Django-Backend-green.svg)
![React](https://img.shields.io/badge/React-Frontend-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg)
![Machine Learning](https://img.shields.io/badge/Machine%20Learning-K--Means-orange.svg)
![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-red.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

# 📖 Overview

Urban Heat Islands (UHIs) are urban regions that experience significantly higher temperatures than surrounding rural areas due to dense infrastructure, reduced vegetation, human activities, and climate change.

The **Urban Heat Intelligence Engine** is an intelligent decision-support platform that combines **Machine Learning**, **Artificial Intelligence**, **Geospatial Analytics**, and **Environmental Data** to identify urban heat hotspots, classify heat-risk zones, and generate actionable mitigation strategies.

The system leverages the **K-Means Clustering algorithm** to automatically group urban regions into different heat-risk categories and integrates **Google Gemini AI** to produce comprehensive environmental analyses and recommendations. To ensure uninterrupted service, the platform also incorporates a rule-based fallback engine that automatically takes over whenever the AI service becomes unavailable.

Designed for **Urban Planners**, **Government Authorities**, **Researchers**, and **Smart City Initiatives**, the platform enables data-driven decision-making for sustainable and climate-resilient urban development.

---

# 🎯 Objectives

- Detect Urban Heat Island hotspots
- Classify urban regions using Machine Learning
- Analyze historical and real-time climate data
- Generate AI-powered mitigation recommendations
- Assist sustainable urban planning
- Produce professional analytical reports
- Provide an interactive dashboard for visualization

---

# ✨ Key Features

## 🤖 AI-Powered Environmental Analysis

Generate intelligent reports for every urban area including:

- Root Cause Analysis
- Heat Risk Assessment
- Urban Planning Recommendations
- Construction Recommendations
- Lifestyle Recommendations
- Heat Mitigation Strategies
- Priority Classification

Powered by **Google Gemini AI**.

---

## 🧠 Machine Learning-Based Heat Zone Classification

The platform utilizes the **K-Means Clustering Algorithm** (Scikit-Learn) to automatically classify urban regions into heat-risk clusters.

### Heat Risk Categories

- 🟢 Low Risk
- 🟡 Moderate Risk
- 🟠 High Risk
- 🔴 Critical Risk

The clustering process groups regions with similar environmental characteristics without requiring pre-labeled training data.

---

## 🌡 Urban Heat Analytics

- Historical Climate Analysis
- Temperature Trends
- Heat Distribution
- Environmental Metrics
- Heat Grid Visualization
- Cluster Comparison
- Area Ranking

---

## 📊 Interactive Dashboard

The dashboard provides:

- Live Heat Grid
- Heat Risk Indicators
- Cluster Charts
- Historical Climate Graphs
- Temperature Trends
- AI Analysis Panel
- Environmental Statistics

---

## 📄 Professional PDF Reports

Generate reports for:

### Area Reports

- Environmental Summary
- AI Analysis
- Heat Risk
- Root Causes
- Recommendations

### City Reports

- Overall Heat Analysis
- Area Rankings
- Cluster Statistics
- Comparative Analysis

Generated using **ReportLab**.

---

## ⚡ Intelligent AI Fallback System

The application includes a resilient hybrid architecture.

```
Area Selected
        │
        ▼
 Google Gemini AI
        │
   ┌────┴────┐
   │         │
Success   API Failure
   │         │
   ▼         ▼
 AI Report  Cooldown Activated
              │
              ▼
      Rule-Based Expert Engine
              │
              ▼
     Analysis Continues
```

This ensures uninterrupted analysis even during AI quota exhaustion or service failures.

---

# 🏗 System Architecture

```
                Open-Meteo API
                      │
                      ▼
            Environmental Data
                      │
                      ▼
            Django REST Backend
                      │
      ┌───────────────┴───────────────┐
      │                               │
      ▼                               ▼
 Machine Learning              AI Analysis Engine
 (K-Means Clustering)         (Google Gemini)
      │                               │
      └───────────────┬───────────────┘
                      ▼
             Rule-Based Expert Engine
                      │
                      ▼
               PostgreSQL Database
                      │
                      ▼
         React + TypeScript Dashboard
```

---

# 🧠 Machine Learning Workflow

```
Climate Data Collection
          │
          ▼
Data Cleaning & Normalization
          │
          ▼
Feature Selection
          │
          ▼
K-Means Clustering
          │
          ▼
Heat Zone Classification
          │
          ▼
Risk Assessment
          │
          ▼
AI Recommendation Generation
```

---

# 🤖 AI Workflow

```
User Selects Area
        │
        ▼
Collect Climate Data
        │
        ▼
Google Gemini AI
        │
   ┌────┴────┐
   │         │
Success   Quota Exceeded
   │         │
   ▼         ▼
 AI Report  Rule Engine
        │
        ▼
Generate Recommendations
        │
        ▼
PDF Report
```

---

# 🛠 Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Plotly

## Backend

- Django
- Django REST Framework
- Django CORS Headers

## Machine Learning

- Scikit-Learn
- K-Means Clustering
- NumPy

## Artificial Intelligence

- Google Gemini AI
- Anthropic SDK
- Rule-Based Expert System

## Database

- PostgreSQL
- SQLite (Development)

## APIs

- Open-Meteo API
- OpenStreetMap

## Reporting

- ReportLab

## Deployment

- Render
- GitHub

---

# 📂 Project Structure

```
urbanheat-intelligence-engine
│
├── backend
│   ├── backend
│   ├── heatmap
│   │   ├── analysis
│   │   ├── llm
│   │   ├── pdf
│   │   ├── migrations
│   │   ├── models.py
│   │   ├── services.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
│
├── frontend
│   ├── src
│   ├── components
│   ├── hooks
│   ├── services
│   ├── pages
│   └── types
│
├── README.md
└── requirements.txt
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/<your-username>/urbanheat-intelligence-engine.git
cd urbanheat-intelligence-engine
```

## Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver
```

Backend runs at:

```
http://127.0.0.1:8000
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

# 🔑 Environment Variables

Create a `.env` file inside the `backend` directory.

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
DJANGO_SECRET_KEY=YOUR_SECRET_KEY
DEBUG=True
```

---

# 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/data/` | Heat and climate data |
| `/api/analysis/<area_id>/` | AI analysis for an area |
| `/api/settings/` | System settings |
| `/api/report/` | PDF report generation |

---

# 🔮 Future Enhancements

- Satellite imagery integration
- IoT weather sensor integration
- Predictive heat forecasting
- Multi-city support
- Mobile application
- GIS overlays
- Authentication & role-based access
- Real-time notifications

---

# 👨‍💻 Contributors

### Rajas Ghongade

- Backend Development
- Machine Learning Integration
- AI Recommendation Engine
- System Architecture
- API Development
- Database Design

### Rutuja Ghongade

- Frontend Development
- UI/UX Design
- Dashboard Implementation
- Data Visualization
- User Experience

---

# 📄 License

This project was developed for academic, research, and educational purposes.

---

# 🙏 Acknowledgements

- Google Gemini AI
- Open-Meteo API
- OpenStreetMap
- Django Community
- React Community
- Scikit-Learn
- Plotly

---

## ⭐ If you like this project, consider giving it a Star!