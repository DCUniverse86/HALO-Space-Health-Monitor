import asyncio
import json

from app.ai.index import ChatOutput, ask_gemini

DISCLAIMER = "HALO is a decision-support prototype, not a certified medical device."
RECHECK_HOURS = {
    "RED": 1,
    "YELLOW": 2,
    "GREEN": 24,
}


def build_prompt(assessment, flag, message: str) -> str:
    unusual = {m: v for m, v in assessment.metrics.items() if v["severity"] != "GREEN"}
    context = json.dumps(
        {
            "flag": flag.to_dict() if flag else None,
            "overall_severity": assessment.overall_severity,
            "unusual_metrics": unusual,
        },
        indent=2,
    )
    return f"""You are HALO, a calm, caring health assistant for an astronaut on a long-duration mission.
Explain what changed in plain language, ask follow-up questions like a triage nurse, and suggest safe next steps.
Do not diagnose, do not name medications, and do not state a severity level.
Keep the summary to one or two sentences and each list to at most 3 items.

Health data for mission day {assessment.day}:
{context}

Astronaut's question: {message}"""


async def get_ai_content(assessment, flag, message: str) -> ChatOutput:
    return await asyncio.wait_for(
        ask_gemini(build_prompt(assessment, flag, message)), timeout=30
    )


def offline_content(flag) -> ChatOutput:
    return ChatOutput(
        summary=flag.explanation
        if flag
        else "Your measurements are being monitored against your personal baseline.",
        likely_causes=[],
        questions=[],
        actions=[
            "Repeat your measurements and check in again.",
            "Follow the approved onboard medical procedure if symptoms continue.",
        ],
    )
