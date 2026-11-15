import os
from dotenv import load_dotenv

load_dotenv(override=True)

API_HOST = os.getenv("HALO_API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("HALO_API_PORT", 8000))
GEMINI_API_KEY=os.getenv("GEMINI_API_KEY")