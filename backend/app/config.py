import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(override=True)

BASE_DIR = Path(__file__).resolve().parent.parent

API_HOST = os.getenv("HALO_API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("HALO_API_PORT", 8000))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DATA_DIR = Path(os.getenv("HALO_DATA_DIR", BASE_DIR.parent / "data" / "simulated"))
CHECKINS_PATH = Path(
    os.getenv("HALO_CHECKINS_PATH", BASE_DIR / "data" / "checkins.json")
)
REPORTS_PATH = Path(
    os.getenv("HALO_REPORTS_PATH", BASE_DIR / "data" / "escalations.json")
)
