from app.config import CHECKINS_PATH, REPORTS_PATH
from app.storage import JsonStore

checkins = JsonStore(CHECKINS_PATH)
reports = JsonStore(REPORTS_PATH)
