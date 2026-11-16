
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Backend root directory
BASE_DIR = Path(__file__).resolve().parent.parent

# API configuration
API_HOST = os.getenv("HALO_API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("HALO_API_PORT", "8000"))

# Gemini AI configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Vercel environment detection
IS_VERCEL = bool(os.getenv("VERCEL"))

# PostgreSQL database configuration
DATABASE_URL = os.getenv("DATABASE_URL")

# Simulated astronaut mission data
PACKAGED_DATA_DIR = BASE_DIR / "data" / "simulated"
REPOSITORY_DATA_DIR = BASE_DIR.parent / "data" / "simulated"

DEFAULT_DATA_DIR = (
    PACKAGED_DATA_DIR
    if PACKAGED_DATA_DIR.exists()
    else REPOSITORY_DATA_DIR
)

DATA_DIR = Path(
    os.getenv("HALO_DATA_DIR", str(DEFAULT_DATA_DIR))
)

# Check-in storage
CHECKINS_PATH = Path(
    os.getenv(
        "HALO_CHECKINS_PATH",
        str(BASE_DIR / "data" / "checkins.json"),
    )
)

# Medical escalation storage
REPORTS_PATH = Path(
    os.getenv(
        "HALO_REPORTS_PATH",
        str(BASE_DIR / "data" / "escalations.json"),
    )
)
