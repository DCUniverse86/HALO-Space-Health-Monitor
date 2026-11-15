from datetime import datetime, timezone
from enum import StrEnum
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, NonNegativeInt, PositiveInt

from app.ai.assistant import DISCLAIMER, RECHECK_HOURS, get_ai_content, offline_content
from app.mission_data import engine
from app.storage import AlreadyExistsError
from app.stores import checkins, reports

router = APIRouter(prefix="/astronauts", responses={404: {"description": "Not found"}})

RECIPIENT = "crew_medical_officer"


# Data Models
class SeverityLevel(StrEnum):
    Green = "GREEN"
    Yellow = "YELLOW"
    Red = "RED"


class PainDetail(BaseModel):
    level: NonNegativeInt  # 0 means no pain
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
    DayNotFound = "DAY_NOT_FOUND"
    FlagNotFound = "FLAG_NOT_FOUND"
    ValidationError = "VALIDATION_ERROR"
    AlreadyExists = "ALREADY_EXISTS"
    InternalError = "INTERNAL_ERROR"


class HaloError(BaseModel):
    code: HaloErrorCode
    message: str


class Source(BaseModel):
    title: str
    source_id: str
    passage: str


# Request and Response Models
class CheckInRequest(BaseModel):
    day: int
    sleep_quality: PositiveInt
    mood: PositiveInt
    stress: NonNegativeInt
    fatigue: NonNegativeInt  # detection treats fatigue as 0-10
    pain: PainDetail
    symptoms: list[str]
    notes: str


class CheckInResponse(BaseModel):
    success: bool
    checkin_id: str
    day: int
    new_flags: list[CheckInFlag]


class MedicalEscalationRequest(BaseModel):
    day: int
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
    day: int
    flag_id: str | None = None
    message: str


class HaloChatResponse(BaseModel):
    mode: Literal["ai", "offline_rules"]
    summary: str
    severity: SeverityLevel
    likely_causes: list[str]
    questions: list[str]
    actions: list[str]
    escalate: bool
    recheck_in_hours: int
    sources: list[Source]
    disclaimer: str


class FlagNotFoundError(KeyError):
    pass


def find_flag(assessment, flag_id: str):
    flag = next((f for f in assessment.flags if f.id == flag_id), None)
    if flag is None:
        raise FlagNotFoundError(
            f"Flag '{flag_id}' does not exist on day {assessment.day}."
        )
    return flag


# Routes
@router.get("")
async def get_astronauts():
    return engine.astronauts()


@router.get("/{astronaut_id}/baseline")
async def get_astronaut_baseline(astronaut_id: str):
    return engine.baseline(astronaut_id)


@router.get("/{astronaut_id}/status")
async def get_astronaut_status(astronaut_id: str, day: int):
    return engine.status(astronaut_id, day)


@router.get("/{astronaut_id}/trends")
async def get_astronaut_trend(
    astronaut_id: str, metric: str, start_day: int = 0, end_day: int = 179
):
    return engine.trends(astronaut_id, metric, start_day, end_day)


@router.post("/{astronaut_id}/checkin", status_code=201, response_model=CheckInResponse)
async def astronaut_checkin(astronaut_id: str, checkin: CheckInRequest):
    checkin_id = f"checkin-{astronaut_id}-{checkin.day}"
    if checkins.exists(checkin_id):
        raise AlreadyExistsError(f"Check-in '{checkin_id}' already exists.")

    overrides = {"mood": checkin.mood, "fatigue": checkin.fatigue}
    if checkin.pain.location.lower() == "back":
        overrides["back_pain"] = checkin.pain.level

    assessment = engine.assess(
        astronaut_id, checkin.day, symptoms=checkin.symptoms, overrides=overrides
    )
    flags = [f.to_dict() for f in assessment.flags]

    checkins.save(
        checkin_id,
        {"astronaut_id": astronaut_id, **checkin.model_dump(), "new_flags": flags},
    )
    return {
        "success": True,
        "checkin_id": checkin_id,
        "day": checkin.day,
        "new_flags": flags,
    }


@router.post(
    "/{astronaut_id}/escalate",
    status_code=201,
    response_model=MedicalEscalationResponse,
)
async def escalate_medical_incident(astronaut_id: str, req: MedicalEscalationRequest):
    report_id = f"report-{astronaut_id}-{req.day}"
    if reports.exists(report_id):
        raise AlreadyExistsError(f"Report '{report_id}' already exists.")

    assessment = engine.assess(astronaut_id, req.day)
    flag = find_flag(assessment, req.flag_id)
    severity = "RED" if assessment.escalate else flag.severity

    reports.save(
        report_id,
        {
            "astronaut_id": astronaut_id,
            "day": req.day,
            "flag": flag.to_dict(),
            "reason": req.reason,
            "severity": severity,
            "recipient": RECIPIENT,
            "mission_control_status": "QUEUED",
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    return {
        "success": True,
        "report_id": report_id,
        "severity": severity,
        "recipient": RECIPIENT,
        "mission_control_status": "QUEUED",
        "message": "Escalation report created.",
    }


@router.post("/{astronaut_id}/assistant", response_model=HaloChatResponse)
async def chat_with_halo(astronaut_id: str, req: HaloChatRequest):
    assessment = engine.assess(astronaut_id, req.day)

    flag = find_flag(assessment, req.flag_id) if req.flag_id else None

    try:
        content = await get_ai_content(assessment, flag, req.message)
        mode = "ai"
    except Exception as e:
        print("Assistant falling back to offline rules:", repr(e))
        content = offline_content(flag)
        mode = "offline_rules"

    if assessment.escalate:
        severity = "RED"
        content.actions.insert(0, "Contact the crew medical officer now.")
    elif flag:
        severity = flag.severity
    else:
        severity = assessment.overall_severity

    return {
        "mode": mode,
        **content.model_dump(),
        "severity": severity,
        "escalate": assessment.escalate,
        "recheck_in_hours": RECHECK_HOURS[severity],
        "sources": [],
        "disclaimer": DISCLAIMER,
    }
