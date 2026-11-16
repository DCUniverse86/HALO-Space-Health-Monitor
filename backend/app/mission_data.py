from app.config import DATA_DIR
from app.detection.engine import DetectionEngine

engine = DetectionEngine.from_directory(DATA_DIR)
