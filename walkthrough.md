# Production Deployment Walkthrough

I have implemented and verified all backend and frontend changes required for the production deployment of the Urban Heat Intelligence Engine to Render and Vercel.

---

## 1. Exact Files Modified

### Backend

#### 📄 [requirements.txt](file:///c:/Users/ghong/OneDrive/Attachments/Desktop/urbanheat-intelligence-engine/backend/requirements.txt)
* **Change**: Appended deployment packages: `gunicorn`, `whitenoise`, `psycopg2-binary`, and `dj-database-url`.
* **Rationale**: Enables concurrent WSGI serving, Postgres connections, DATABASE_URL parsing, and static file serving on Render.

#### 📄 [settings.py](file:///c:/Users/ghong/OneDrive/Attachments/Desktop/urbanheat-intelligence-engine/backend/backend/settings.py)
* **Change**:
  * Configured dynamic environment loading for `SECRET_KEY`, `DEBUG`, and `ALLOWED_HOSTS`.
  * Integrated WhiteNoise middleware and storage configuration (`CompressedManifestStaticFilesStorage`).
  * Integrated PostgreSQL configuration via `dj_database_url` (with fallback to SQLite for local development).
  * Implemented environmental CORS configuration for Vercel clients via `CORS_ALLOWED_ORIGINS`.

---

### Frontend

#### 📄 [config.ts [NEW]](file:///c:/Users/ghong/OneDrive/Attachments/Desktop/urbanheat-intelligence-engine/frontend/src/config.ts)
* **Change**: Added centralized configuration for the API Base URL, fallback to local development server, and sanitization of trailing slashes.

#### 📄 [HistoricalClimateChart.tsx](file:///c:/Users/ghong/OneDrive/Attachments/Desktop/urbanheat-intelligence-engine/frontend/src/components/dashboard/HistoricalClimateChart.tsx)
* **Change**: Replaced hardcoded `http://127.0.0.1:8000` with the imported `API_BASE_URL` constant.

#### 📄 [useHeatData.ts](file:///c:/Users/ghong/OneDrive/Attachments/Desktop/urbanheat-intelligence-engine/frontend/src/hooks/useHeatData.ts)
* **Change**: Replaced hardcoded API host with imported `API_BASE_URL`.

#### 📄 [useSystemMode.ts](file:///c:/Users/ghong/OneDrive/Attachments/Desktop/urbanheat-intelligence-engine/frontend/src/hooks/useSystemMode.ts)
* **Change**: Replaced hardcoded API host with imported `API_BASE_URL`.

#### 📄 [useSystemSettings.ts](file:///c:/Users/ghong/OneDrive/Attachments/Desktop/urbanheat-intelligence-engine/frontend/src/hooks/useSystemSettings.ts)
* **Change**: Replaced hardcoded settings API host with imported `API_BASE_URL`.

#### 📄 [Settings.tsx](file:///c:/Users/ghong/OneDrive/Attachments/Desktop/urbanheat-intelligence-engine/frontend/src/pages/Settings.tsx)
* **Change**: Replaced area settings configuration URLs with dynamic `API_BASE_URL`.

#### 📄 [analysisApi.ts](file:///c:/Users/ghong/OneDrive/Attachments/Desktop/urbanheat-intelligence-engine/frontend/src/services/analysisApi.ts)
* **Change**: Replaced analysis API endpoints with dynamic `API_BASE_URL`.

---

## 2. Deployment Configurations

### Render (Backend & Database)
* **Root Directory**: `backend`
* **Build Command**:
  ```bash
  pip install -r requirements.txt && python manage.py migrate --noinput && python manage.py collectstatic --noinput
  ```
* **Start Command**:
  ```bash
  gunicorn backend.wsgi:application
  ```

### Vercel (Frontend)
* **Root Directory**: `frontend`
* **Build Command**:
  ```bash
  npm run build
  ```
* **Output Directory**: `dist`

---

## 3. Required Environment Variables

### Render Backend Variables
* `DJANGO_SECRET_KEY`: A secure random string.
* `DEBUG`: `False` (for production).
* `ALLOWED_HOSTS`: `your-backend-app.onrender.com`
* `DATABASE_URL`: Automatically provisioned by Render.
* `GEMINI_API_KEY`: The API key for Gemini.
* `CORS_ALLOWED_ORIGINS`: `https://your-frontend-app.vercel.app`

### Vercel Frontend Variables
* `VITE_API_BASE_URL`: `https://your-backend-app.onrender.com`

---

## 4. Verification Check Outcomes
* **Django Startup (PostgreSQL)**: Verified that database configuration parses and initializes.
* **SQLite Fallback**: Verified that running locally with absent `DATABASE_URL` uses SQLite.
* **collectstatic Compilation**: Successfully executed `collectstatic` locally producing `157 static files copied`.
* **WhiteNoise**: Confirmed static middleware serves compressed manifest file structure.
* **CORS Settings**: Verified env-defined allowed origins parse cleanly.
* **Gemini Cooldown Verification**: Regression tests verified rate limit cooldown scaling (300s -> 600s) and fallback rule engine work seamlessly.
