"""Multi-signal rules and hard red lines. Red lines always win over the AI.

Each rule has two layers:
  * a small pure predicate on plain numbers (easy to test and to review), and
  * a ``check_*`` function that reads the day's signals, applies the predicate
    and returns a contract-shaped ``Flag`` with a plain-language explanation.

All numbers come from data/config/thresholds.yaml.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field

import pandas as pd

from app.detection.baseline import Baseline
from app.detection.config import Thresholds


@dataclass(frozen=True)
class Flag:
    """A detected concern. ``to_dict`` returns the API contract's HealthFlag."""

    id: str
    system: str
    severity: str
    code: str
    explanation: str
    metrics: tuple[str, ...] = field(default=())
    escalate: bool = False

    def to_dict(self) -> dict[str, str]:
        return {
            "id": self.id,
            "system": self.system,
            "severity": self.severity,
            "code": self.code,
            "explanation": self.explanation,
        }


@dataclass(frozen=True)
class RedLine:
    """One triggered hard safety limit."""

    code: str
    system: str
    reason: str
    metric: str | None = None


def flag_id(code: str, day: int) -> str:
    """Stable flag id, e.g. ``possible-infection-75``."""
    return f"{code.lower().replace('_', '-')}-{day}"


def _num(value: object) -> float | None:
    """Float, or None for missing values (None or NaN)."""
    if value is None:
        return None
    f = float(value)  # type: ignore[arg-type]
    return None if f != f else f


# --------------------------------------------------------------------------
# Red lines
# --------------------------------------------------------------------------

def red_line_reasons(
    today: Mapping[str, object], symptoms: Iterable[str], cfg: Thresholds
) -> list[RedLine]:
    """Return every hard red line triggered by today's readings and symptoms.

    ``today`` needs ``spo2`` (percent) and ``temp_c`` (C); missing values are
    skipped. ``symptoms`` are check-in symptom codes such as ``chest_pain``.
    An empty list means no red line is triggered.
    """
    rl = cfg["red_lines"]
    reasons: list[RedLine] = []
    spo2 = _num(today.get("spo2"))
    if spo2 is not None and spo2 < rl["spo2_min"]["value"]:
        reasons.append(RedLine(
            "SPO2_CRITICAL", rl["spo2_min"]["system"],
            f"Oxygen saturation {spo2:.0f}% is below the safe limit of {rl['spo2_min']['value']:.0f}%.",
            "spo2",
        ))
    temp = _num(today.get("temp_c"))
    if temp is not None and temp >= rl["temp_max_c"]["value"]:
        reasons.append(RedLine(
            "HIGH_FEVER", rl["temp_max_c"]["system"],
            f"Body temperature {temp:.1f} C is at or above {rl['temp_max_c']['value']:.1f} C.",
            "temp_c",
        ))
    critical: dict[str, str] = rl["critical_symptoms"]
    for symptom in sorted(set(symptoms) & set(critical)):
        reasons.append(RedLine(
            "CRITICAL_SYMPTOM", critical[symptom],
            f"Critical symptom reported: {symptom.replace('_', ' ')}.",
        ))
    return reasons


def red_line_flags(reasons: list[RedLine], day: int) -> list[Flag]:
    """One RED, escalating flag per affected body system."""
    by_system: dict[str, list[RedLine]] = {}
    for r in reasons:
        by_system.setdefault(r.system, []).append(r)
    return [
        Flag(
            id=flag_id(f"RED_LINE_{system}", day),
            system=system,
            severity="RED",
            code="RED_LINE",
            explanation=" ".join(r.reason for r in rs) + " Escalate to the crew medical officer now.",
            metrics=tuple(r.metric for r in rs if r.metric),
            escalate=True,
        )
        for system, rs in by_system.items()
    ]


# --------------------------------------------------------------------------
# Pure predicates
# --------------------------------------------------------------------------

def cardio_drift_rule(
    rest_hr_ewma_c: float, rest_hr_cusum: float, hrv_ewma_c: float, sleep_ewma_c: float,
    cfg: Thresholds,
) -> bool:
    """Resting HR raised or drifting up, backed by lower HRV or shorter sleep."""
    r = cfg["rules"]["cardio_drift"]
    hr_up = rest_hr_ewma_c >= r["rest_hr_ewma_z"] or (
        rest_hr_cusum >= r["rest_hr_cusum"] and rest_hr_ewma_c >= r["cusum_min_ewma_z"]
    )
    support = hrv_ewma_c >= r["support_ewma_z"] or sleep_ewma_c >= r["support_ewma_z"]
    return hr_up and support


def infection_rule(rest_hr_c: float, temp_c_c: float, fatigue: float, cfg: Thresholds) -> bool:
    """Raised resting HR and temperature today, with high reported fatigue."""
    r = cfg["rules"]["infection"]
    return rest_hr_c >= r["rest_hr_z"] and temp_c_c >= r["temp_z"] and fatigue >= r["fatigue_min"]


def behavioral_rule(mood_ewma_c: float, sleep_ewma_c: float, social_ewma_c: float, cfg: Thresholds) -> bool:
    """Persistently lower mood, backed by shorter sleep or less social time."""
    r = cfg["rules"]["behavioral"]
    support = sleep_ewma_c >= r["support_ewma_z"] or social_ewma_c >= r["support_ewma_z"]
    return mood_ewma_c >= r["mood_ewma_z"] and support


def environment_rule(co2_ppm: float, crew_headaches: int, cfg: Thresholds) -> str | None:
    """``CO2_HEADACHE`` if CO2 is high and enough crew have headaches,
    ``CO2_ELEVATED`` if only CO2 is high, else None."""
    r = cfg["rules"]["environment"]
    if co2_ppm <= r["co2_ppm_max"]:
        return None
    return "CO2_HEADACHE" if crew_headaches >= r["min_crew_headaches"] else "CO2_ELEVATED"


def exercise_rule(low_exercise_days: int, cfg: Thresholds) -> bool:
    """Too many skipped workouts in the recent window."""
    return low_exercise_days >= cfg["rules"]["musculoskeletal"]["low_days"]


# --------------------------------------------------------------------------
# Checks on a day's signals
# --------------------------------------------------------------------------

def _get(row: pd.Series, column: str) -> float:
    """Signal value, with missing values treated as no deviation (0)."""
    v = _num(row.get(column))
    return 0.0 if v is None else v


def check_cardio_drift(row: pd.Series, base: dict[str, Baseline], cfg: Thresholds) -> Flag | None:
    if not cardio_drift_rule(
        _get(row, "rest_hr_ewma_c"), _get(row, "rest_hr_cusum"),
        _get(row, "hrv_ewma_c"), _get(row, "sleep_h_ewma_c"), cfg,
    ):
        return None
    hr, hrv, sleep = base["rest_hr"], base["hrv"], base["sleep_h"]
    text = (
        f"Over recent days your resting heart rate has averaged {_get(row, 'rest_hr_ewma'):.0f} bpm, "
        f"{_get(row, 'rest_hr_ewma') - hr.median:+.0f} from your normal of {hr.median:.0f} bpm"
    )
    extras = []
    if _get(row, "hrv_ewma_c") >= cfg["rules"]["cardio_drift"]["support_ewma_z"]:
        extras.append(f"HRV is about {hrv.median - _get(row, 'hrv_ewma'):.0f} ms below normal")
    if _get(row, "sleep_h_ewma_c") >= cfg["rules"]["cardio_drift"]["support_ewma_z"]:
        extras.append(f"sleep is averaging {_get(row, 'sleep_h_ewma'):.1f} h against your usual {sleep.median:.1f} h")
    text += (", and " + " and ".join(extras) if extras else "") + "."
    return Flag(flag_id("CARDIO_DRIFT", int(row["day"])), "cardiovascular", "YELLOW", "CARDIO_DRIFT",
                text, ("rest_hr", "hrv", "sleep_h"))


def check_infection(row: pd.Series, base: dict[str, Baseline], cfg: Thresholds) -> Flag | None:
    if not infection_rule(_get(row, "rest_hr_c"), _get(row, "temp_c_c"), _get(row, "fatigue"), cfg):
        return None
    hr, temp = base["rest_hr"], base["temp_c"]
    text = (
        f"Temperature is {_get(row, 'temp_c'):.1f} C ({_get(row, 'temp_c') - temp.median:+.1f} C from your normal), "
        f"resting heart rate is {_get(row, 'rest_hr'):.0f} bpm ({_get(row, 'rest_hr') - hr.median:+.0f} bpm), "
        f"and you reported fatigue of {_get(row, 'fatigue'):.0f}/10. Together these can point to an infection."
    )
    return Flag(flag_id("POSSIBLE_INFECTION", int(row["day"])), "immune", "YELLOW", "POSSIBLE_INFECTION",
                text, ("temp_c", "rest_hr", "fatigue"))


def check_behavioral(row: pd.Series, base: dict[str, Baseline], cfg: Thresholds) -> Flag | None:
    if not behavioral_rule(
        _get(row, "mood_ewma_c"), _get(row, "sleep_h_ewma_c"), _get(row, "social_h_ewma_c"), cfg,
    ):
        return None
    mood = base["mood"]
    support = cfg["rules"]["behavioral"]["support_ewma_z"]
    parts = [f"Your mood has averaged {_get(row, 'mood_ewma'):.1f}/10 recently, below your usual {mood.median:.1f}"]
    if _get(row, "sleep_h_ewma_c") >= support:
        parts.append(f"sleep is shorter ({_get(row, 'sleep_h_ewma'):.1f} h vs {base['sleep_h'].median:.1f} h)")
    if "social_h" in base and _get(row, "social_h_ewma_c") >= support:
        parts.append(
            f"time with crewmates is down ({_get(row, 'social_h_ewma'):.1f} h vs {base['social_h'].median:.1f} h)"
        )
    text = ", ".join(parts) + ". It may help to take a break, try a breathing exercise or talk to someone you trust."
    return Flag(flag_id("BEHAVIORAL_DECLINE", int(row["day"])), "behavioral", "YELLOW", "BEHAVIORAL_DECLINE",
                text, ("mood", "sleep_h", "social_h"))


def check_environment(row: pd.Series, crew_headaches: int, cfg: Thresholds) -> Flag | None:
    code = environment_rule(_get(row, "co2_ppm"), crew_headaches, cfg)
    if code is None:
        return None
    limit = cfg["rules"]["environment"]["co2_ppm_max"]
    text = f"Cabin CO2 is {_get(row, 'co2_ppm'):.0f} ppm, above the {limit:.0f} ppm limit."
    if code == "CO2_HEADACHE":
        text += f" {crew_headaches} crew members reported headaches today, so this affects the whole crew."
    return Flag(flag_id(code, int(row["day"])), "environment", "YELLOW", code, text, ("co2_ppm", "headache"))


def check_musculoskeletal(history: pd.DataFrame, base: dict[str, Baseline], cfg: Thresholds) -> Flag | None:
    """``history`` is the astronaut's signals up to and including today."""
    r = cfg["rules"]["musculoskeletal"]
    recent = history.tail(r["window_days"])
    low_days = int((recent["exercise_min"] < r["exercise_min_floor"]).sum())
    if not exercise_rule(low_days, cfg):
        return None
    today = recent.iloc[-1]
    text = (
        f"You logged less than {r['exercise_min_floor']} minutes of exercise on {low_days} of the last "
        f"{len(recent)} days (usual: {base['exercise_min'].median:.0f} min). In microgravity, skipped "
        f"workouts speed up bone and muscle loss."
    )
    if "back_pain" in base and _get(today, "back_pain_c") >= r["back_pain_z"]:
        text += f" Back pain is also up ({_get(today, 'back_pain'):.0f}/10)."
    return Flag(flag_id("SKIPPED_EXERCISE", int(today["day"])), "musculoskeletal", "YELLOW", "SKIPPED_EXERCISE",
                text, ("exercise_min", "back_pain"))
