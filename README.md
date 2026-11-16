# HALO — Health Assessment and Longitudinal Observer

**AI-Assisted Astronaut Health Monitoring for Long-Duration Space Missions**

HALO is a research prototype designed to support astronaut health monitoring during long-duration space missions, where access to Earth-based medical professionals may be delayed or limited.

Inspired by the approachable healthcare assistance concept of Baymax, HALO combines personalized health baselines, simulated mission data, rule-based anomaly detection, an AI-assisted health information interface, and medical escalation reporting.

HALO is designed to provide understandable, timely health information while keeping medical severity classifications under the control of a deterministic detection engine.

> **Disclaimer:** HALO is an educational research and decision-support prototype, not a certified medical device. It uses simulated astronaut data and does not replace professional medical care, emergency procedures, or established mission medical protocols.

## Key Features

### Astronaut Health Dashboard

- Monitor five health systems: cardiovascular, immune, musculoskeletal, behavioral, and environmental.
- View GREEN, YELLOW, and RED health classifications.
- Review system-specific explanations and detected concerns.
- Explore simulated astronaut health across a 180-day mission.

### Personalized Health Baselines

- Select among simulated astronaut profiles.
- Compare health measurements with individual baselines.
- Identify deviations from each astronaut's typical measurements.

### Vitals and Trends

- View simulated vital-sign measurements.
- Review historical heart-rate readings.
- Explore trends across monitored health systems.
- Select historical time ranges and metrics.
- Synchronize the selected mission day across application pages.

### Daily Health Check-In

HALO's three-step check-in workflow includes:

1. **Wellness Assessment:** Sleep duration, sleep quality, mood, stress, fatigue, pain, symptoms, and optional notes.
2. **Vital-Sign Entry:** Optional local entry of heart rate, blood oxygen, temperature, and blood pressure.
3. **Submission Results:** Backend confirmation and detected health flags.

Wellness check-ins are submitted to the FastAPI backend. Manually entered vital-sign measurements are not currently included in the backend check-in submission.

The interface also provides clearly labeled fictional GREEN, YELLOW, and RED assessment design previews. These previews do not modify backend medical classifications.

### HALO AI Assistant

- Provides conversational health-support information.
- Integrates with Google's Gemini API when configured and available.
- Supports a rule-based fallback when Gemini is unavailable.
- Displays health-support information and suggested actions.
- Does not independently override the detection engine's severity classifications.

### Medical Escalation

- Retrieves verified health flags from the backend.
- Allows the creation of simulated medical escalation reports.
- Records the intended Crew Medical Officer recipient.
- Displays report identifiers and backend queue status.

A report marked `QUEUED` is not confirmation that a medical officer or Mission Control has received it.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| UI Components | Lucide React |
| Backend | Python, FastAPI, Pydantic |
| Detection Engine | Python-based rules, baselines, anomaly detection |
| AI Integration | Google Gemini SDK |
| Data | Simulated astronaut mission data |
| Testing | Pytest, TypeScript, Vite |
| Version Control | Git and GitHub |
| Deployment | Vercel (frontend), Render (backend) |

## Project Structure

```text
HALO-Space-Health-Monitor/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   ├── detection/
│   │   ├── routers/
│   │   ├── simulator/
│   │   ├── config.py
│   │   ├── main.py
│   │   ├── mission_data.py
│   │   ├── storage.py
│   │   └── stores.py
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Local Installation

### Prerequisites

- Python 3.12
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/DCUniverse86/HALO-Space-Health-Monitor.git
cd HALO-Space-Health-Monitor
git checkout feat/frontend
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv
```

On Windows PowerShell, activate the virtual environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Start FastAPI:

```bash
python -m uvicorn app.main:app --reload
```

The backend runs at:

http://127.0.0.1:8000

Interactive API documentation:

http://127.0.0.1:8000/docs

### 3. Set up the frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local development URL shown by Vite, typically:

http://localhost:5173

## Environment Configuration

HALO uses environment variables to configure its backend and AI integration.

Example backend environment variables:

```dotenv
GEMINI_API_KEY=
HALO_API_HOST=127.0.0.1
HALO_API_PORT=8000
```

The Gemini key is optional for backend startup. Without a configured key, the assistant can use its offline fallback.

Never commit real API keys or `.env` files to GitHub.

For the deployed frontend, configure the API base URL using the environment variable supported by the frontend API client, such as:

```dotenv
VITE_API_BASE_URL=https://your-backend-domain
```

The backend must also allow the deployed frontend's origin through its CORS configuration.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Backend health check |
| GET | `/astronauts` | Available astronaut profiles |
| GET | `/astronauts/{astronaut_id}/baseline` | Personal health baseline |
| GET | `/astronauts/{astronaut_id}/status` | Health assessment for a mission day |
| GET | `/astronauts/{astronaut_id}/trends` | Historical metric data |
| POST | `/astronauts/{astronaut_id}/checkin` | Submit wellness check-in |
| POST | `/astronauts/{astronaut_id}/assistant` | Request assistant guidance |
| POST | `/astronauts/{astronaut_id}/escalate` | Create medical escalation report |

## Testing

Run backend tests:

```bash
cd backend
python -m pytest
```

Run the frontend production build:

```bash
cd frontend
npm run build
```

During development, HALO's detection-engine test suite successfully passed 95 tests. The full combined application should be retested after future changes.

## Deployment

HALO is designed for a two-service deployment.

**Backend — Render**

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Frontend — Vercel**

- Root directory: `frontend`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

The frontend must be configured to communicate with the deployed backend, and the backend's CORS settings must include the deployed frontend domain.

Simulated mission-data files must be accessible in the deployed backend environment.

The current prototype uses file-based storage for check-ins and escalation reports. Persistent production storage requires additional configuration.

## Project Team

Contributors

HALO was developed as a collaborative project, with each team member contributing to the design, development, and integration of the astronaut health-monitoring system.

Contributor

Role

Contributions

Donald Carpenter

Frontend Developer & Integration

React and TypeScript frontend, application navigation, astronaut profiles, Home Dashboard, Vitals, Trends, Daily Check-In interface, mission-day replay, and frontend/backend integration.

Roman Dumych

Health Monitoring & Detection Engine

Simulated astronaut health data, personalized baselines, anomaly detection, health-system assessments, severity classifications, and backend testing.

Donte Littlejohn

Backend & AI Developer

FastAPI endpoints, Google Gemini integration, offline assistant functionality, check-in processing, data storage, and medical escalation reporting.

Viktoriia Lavrenchuk

UI/UX Designer

HALO interface designs, visual identity, screen layouts, artwork, and design assets.

Team Collaboration

The HALO team combined frontend development, health-monitoring algorithms, backend services, artificial intelligence, and user-centered interface design to create an integrated research prototype for long-duration space missions.

## Project Limitations

HALO currently operates as a simulated research prototype.

- Health data is simulated rather than collected from actual astronauts.
- Medical severity classifications are generated by a research detection engine.
- AI responses are informational and may fall back to predefined rules.
- Optional manually entered vital measurements are not currently submitted through the check-in API.
- Escalation reports are simulated backend records, not confirmed transmissions.
- File-based persistence may not survive certain deployment restarts.
- HALO is not validated for clinical or operational spaceflight use.

## Future Development

Potential future improvements include real wearable sensor integration, durable database storage, secure authentication, enhanced offline capabilities, expanded medical knowledge retrieval, and integration with mission communication systems.

## License

License terms have not yet been specified. All rights remain with their respective owners unless a license is added to the repository.

---

**HALO — Supporting astronaut health beyond Earth.**