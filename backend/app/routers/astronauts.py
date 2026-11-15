from enum import StrEnum
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, PositiveInt
from app.ai.index import ask_gemini

router = APIRouter(prefix="/astronauts", responses={404: {"description": "Not found"}})

astronauts = {
    "astronauts": [
        {"id": "alex", "name": "Alex", "mission": "HALO Demo Mission"},
        {"id": "jordan", "name": "Jordan", "mission": "HALO Demo Mission"},
        {"id": "sam", "name": "Sam", "mission": "HALO Demo Mission"},
        {"id": "riley", "name": "Riley", "mission": "HALO Demo Mission"},
    ]
}


# Data Models
class SeverityLevel(StrEnum):
    Green = "GREEN"
    Yellow = "YELLOW"
    Red = "RED"


class PainDetail(BaseModel):
    level: PositiveInt
    location: str


class CheckInFlag(BaseModel):
    id: str
    system: str
    severity: SeverityLevel
    code: str
    explanation: str


class HaloErrorCode(StrEnum):
    InvalidRequest = "INVALID_REQUEST"
    AstronautNotFound = "ASTRONAUT_NOT_FOUND"
    ValidationError = "VALIDATION_ERROR"
    AlreadyExists = "ALREADY_EXISTS"
    InternalError = "INTERNAL_ERROR"


class HaloError(BaseModel):
    code: HaloErrorCode
    message: str


# Request Models
class CheckInRequest(BaseModel):
    day: PositiveInt
    sleep_quality: PositiveInt
    mood: PositiveInt
    stress: PositiveInt
    fatigue: PositiveInt
    pain: PainDetail
    symptoms: list[str]
    notes: str


class CheckInResponse(BaseModel):
    success: bool
    checkin_id: str
    day: PositiveInt
    new_flags: list[CheckInFlag]


class MedicalEscalationRequest(BaseModel):
    day: PositiveInt
    flag_id: str
    reason: str


class MedicalEscalationResponse(BaseModel):
    success: bool
    report_id: str
    severity: SeverityLevel
    recipient: str
    mission_control_status: str
    message: str


class HaloChatRequest(BaseModel):
    day: PositiveInt
    flag_id: str
    message: str


class HaloChatResponse(BaseModel):
    mode: str
    summary: str
    severity: SeverityLevel
    likely_causes: list[str]
    questions: list[str]
    actions: list[str]


@router.get("/")
async def get_astronauts():
    return astronauts


@router.get("/{astronaut_id}/baseline")
async def get_astronaut_baseline(astronaut_id: str):
    print("Return Astronaut Baseline")


@router.get("/{astronaut_id}/status")
async def get_astronaut_status(astronaut_id: str, day: PositiveInt):
    print("Return astronaut status filtered by given day")


@router.get("/{astronaut_id}/trends")
async def get_astronaut_trend(
    astronaut_id: str, metric: str, start_day: PositiveInt, end_day: PositiveInt
):
    print("Return astronaut trend over the course of a given time period")


@router.post("/{astronaut_id}/checkin")
async def astronaut_checkin(checkin: CheckInRequest):
    print("Return successful astronaut checkin")


@router.post("/{astronaut_id}/escalate")
async def escalate_medical_incident(astronaut_id: str):
    print("Return ")


@router.post("/{astronaut_id}/assistant")
async def ask_halo(astronaut_id: str, req: HaloChatRequest):
    try:
        response = await ask_gemini(req.message)
        return {"reply": response}
    except Exception as e:
        print("Gemini call failed:", repr(e))
        raise HTTPException(
            status_code=503, detail="HALO is busy right now. Try again in a moment."
        )
    print(response)
