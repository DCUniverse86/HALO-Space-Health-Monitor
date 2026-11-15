"""Detection engine: the functions the API calls.

Wraps baselines, signals, rules and red lines, and returns dicts shaped exactly
like the HALO API Contract v1 (baseline, status, trends, astronaut list), so the
routers can return them directly.

Typical use from a router:

    engine = DetectionEngine.from_directory()          # once, at startup
    engine.status("alex", 75)                          # GET /astronauts/alex/status?day=75
    engine.trends("alex", "rest_hr", 60, 90)           # GET .../trends
    engine.baseline("alex")                            # GET .../baseline
    engine.assess("alex", 75, symptoms=["chest_pain"]) # check-in / assistant / guardrails
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

from app.detection.anomaly import compute_signals, severity, worst
from app.detection.baseline import METRICS, Baseline, build_baseline
from app.detection.config import REPO_ROOT, Thresholds, default_thresholds
from app.detection.rules import (
    Flag,
    RedLine,
    check_behavioral,
    check_cardio_drift,
    check_environment,
    check_infection,
    check_musculoskeletal,
    red_line_flags,
    red_line_reasons,
)

DEFAULT_DATA_DIR = REPO_ROOT / "data" / "simulated"
MISSION_NAME = "HALO Demo Mission"
FIRST_MISSION_DAY = 0
LAST_MISSION_DAY = 179

BODY_SYSTEMS: tuple[str, ...] = ("cardiovascular", "immune", "musculoskeletal", "behavioral", "environment")

GREEN_MESSAGES: dict[str, str] = {
    "cardiovascular": "Heart rate and HRV are within your normal range.",
    "immune": "No signs of infection detected.",
    "musculoskeletal": "Exercise and pain levels are on track.",
    "behavioral": "Mood and sleep remain within expected range.",
    "environment": "Cabin conditions are within expected range.",
}

# Short system-tile messages per flag code; the full explanation is on the flag.
SYSTEM_MESSAGES: dict[str, str] = {
    "CARDIO_DRIFT": "Resting heart rate is drifting above your personal baseline.",
    "POSSIBLE_INFECTION": "Temperature, resting heart rate and fatigue are elevated.",
    "BEHAVIORAL_DECLINE": "Mood has been lower than usual for several days.",
    "CO2_HEADACHE": "Cabin CO2 is high and crew are reporting headaches.",
    "CO2_ELEVATED": "Cabin CO2 is above the safe limit.",
    "SKIPPED_EXERCISE": "Several workouts have been skipped recently.",
}


class AstronautNotFoundError(KeyError):
    """API: 404 ASTRONAUT_NOT_FOUND."""


class DayOutOfRangeError(ValueError):
    """API: 400 INVALID_REQUEST (day outside 0-179)."""


class DayNotFoundError(KeyError):
    """API: 404 DAY_NOT_FOUND (day in range but no data)."""


class UnknownMetricError(ValueError):
    """API: 400 INVALID_REQUEST (metric not tracked)."""


def load_crew(data_dir: Path | None = None) -> dict[str, pd.DataFrame]:
    """Read every ``<astronaut_id>.csv`` in the simulated data folder."""
    folder = data_dir or DEFAULT_DATA_DIR
    crew = {path.stem: pd.read_csv(path) for path in sorted(folder.glob("*.csv"))}
    if not crew:
        raise FileNotFoundError(
            f"No crew CSVs in {folder}. Run `python -m app.simulator.generate` from backend/."
        )
    return crew


@dataclass
class DayAssessment:
    """Everything detection knows about one astronaut on one mission day."""

    astronaut_id: str
    astronaut_name: str
    day: int
    overall_severity: str
    systems: dict[str, dict[str, str]]
    metrics: dict[str, dict[str, object]]
    flags: list[Flag]
    red_lines: list[RedLine] = field(default_factory=list)

    @property
    def escalate(self) -> bool:
        """True when a hard red line requires escalation."""
        return bool(self.red_lines)

    def to_status_dict(self) -> dict[str, object]:
        """The API contract's AstronautStatus."""
        return {
            "astronaut_id": self.astronaut_id,
            "astronaut_name": self.astronaut_name,
            "day": self.day,
            "overall_severity": self.overall_severity,
            "systems": self.systems,
            "metrics": self.metrics,
            "flags": [f.to_dict() for f in self.flags],
        }


@dataclass
class _Astronaut:
    astronaut_id: str
    name: str
    data: pd.DataFrame
    baseline: dict[str, Baseline]
    signals: pd.DataFrame


class DetectionEngine:
    """Holds the crew's data, baselines and precomputed signals."""

    def __init__(self, crew: Mapping[str, pd.DataFrame], cfg: Thresholds | None = None) -> None:
        self.cfg = cfg or default_thresholds()
        self._crew: dict[str, _Astronaut] = {}
        for astronaut_id, df in crew.items():
            data = df.sort_values("day").reset_index(drop=True)
            base = build_baseline(data, self.cfg)
            name = str(data["astronaut"].iloc[0]) if "astronaut" in data else astronaut_id.title()
            self._crew[astronaut_id] = _Astronaut(
                astronaut_id, name, data, base, compute_signals(data, base, self.cfg)
            )

    @classmethod
    def from_directory(cls, data_dir: Path | None = None, cfg: Thresholds | None = None) -> "DetectionEngine":
        return cls(load_crew(data_dir), cfg)

    # ------------------------------------------------------------------ lookups

    def _get(self, astronaut_id: str) -> _Astronaut:
        try:
            return self._crew[astronaut_id]
        except KeyError:
            raise AstronautNotFoundError(f"Astronaut '{astronaut_id}' does not exist.") from None

    @staticmethod
    def _check_day(day: int) -> None:
        if not FIRST_MISSION_DAY <= day <= LAST_MISSION_DAY:
            raise DayOutOfRangeError(
                f"Day must be between {FIRST_MISSION_DAY} and {LAST_MISSION_DAY}, got {day}."
            )

    def crew_ids(self) -> list[str]:
        return list(self._crew)

    def crew_headaches(self, day: int) -> int:
        """Number of crew members reporting a headache on ``day``."""
        count = 0
        for a in self._crew.values():
            row = a.data[a.data["day"] == day]
            if not row.empty and "headache" in row and row["headache"].iloc[0] == 1:
                count += 1
        return count

    # ---------------------------------------------------------- contract views

    def astronauts(self) -> dict[str, object]:
        """GET /astronauts"""
        return {
            "astronauts": [
                {"id": a.astronaut_id, "name": a.name, "mission": MISSION_NAME} for a in self._crew.values()
            ]
        }

    def baseline(self, astronaut_id: str) -> dict[str, object]:
        """GET /astronauts/{id}/baseline"""
        a = self._get(astronaut_id)
        return {
            "astronaut_id": astronaut_id,
            "metrics": {
                m: {"median": round(b.median, 2), "scale": round(b.scale, 2), "unit": b.unit}
                for m, b in a.baseline.items()
            },
        }

    def status(self, astronaut_id: str, day: int, symptoms: Iterable[str] = ()) -> dict[str, object]:
        """GET /astronauts/{id}/status?day=N"""
        return self.assess(astronaut_id, day, symptoms).to_status_dict()

    def trends(
        self, astronaut_id: str, metric: str,
        start_day: int = FIRST_MISSION_DAY, end_day: int = LAST_MISSION_DAY,
    ) -> dict[str, object]:
        """GET /astronauts/{id}/trends?metric=M&start_day=A&end_day=B"""
        a = self._get(astronaut_id)
        if metric not in a.baseline:
            raise UnknownMetricError(f"Unknown metric '{metric}'. Use one of: {', '.join(a.baseline)}.")
        self._check_day(start_day)
        self._check_day(end_day)
        if start_day > end_day:
            raise DayOutOfRangeError("start_day must not be after end_day.")
        base = a.baseline[metric]
        lower, upper = base.band(self.cfg["metric_severity"]["yellow_z"])
        s = a.signals
        window = s[(s["day"] >= start_day) & (s["day"] <= end_day)]
        return {
            "astronaut_id": astronaut_id,
            "metric": metric,
            "unit": base.unit,
            "baseline": {"median": round(base.median, 2), "lower": round(lower, 2), "upper": round(upper, 2)},
            "points": [
                {
                    "day": int(row["day"]),
                    "value": _round(row[metric]),
                    "ewma": _round(row[f"{metric}_ewma"]),
                    "severity": severity(_float(row[f"{metric}_c"]), self.cfg),
                }
                for _, row in window.iterrows()
            ],
        }

    # --------------------------------------------------------------- assessment

    def assess(
        self, astronaut_id: str, day: int,
        symptoms: Iterable[str] = (), overrides: Mapping[str, float] | None = None,
    ) -> DayAssessment:
        """Assess one astronaut on one day.

        ``symptoms`` are check-in symptom codes (``chest_pain``, ``headache``...).
        ``overrides`` replaces that day's readings, for example values from a new
        check-in (``{"mood": 4, "fatigue": 7}``); signals are then recomputed.
        """
        self._check_day(day)
        a = self._get(astronaut_id)
        symptoms = set(symptoms)
        signals, crew_headaches = a.signals, self.crew_headaches(day)

        changes = dict(overrides or {})
        if "headache" in symptoms:
            changes["headache"] = 1
        if changes:
            data = a.data.copy()
            mask = data["day"] == day
            today_had_headache = bool(mask.any() and data.loc[mask, "headache"].iloc[0] == 1)
            for column, value in changes.items():
                data.loc[mask, column] = value
            signals = compute_signals(data, a.baseline, self.cfg)
            if changes.get("headache") == 1 and not today_had_headache:
                crew_headaches += 1

        rows = signals[signals["day"] == day]
        if rows.empty:
            raise DayNotFoundError(f"No data for astronaut '{astronaut_id}' on day {day}.")
        row = rows.iloc[0]
        history = signals[signals["day"] <= day]

        reds = red_line_reasons(row, symptoms, self.cfg)
        flags = red_line_flags(reds, day) + [
            f for f in (
                check_cardio_drift(row, a.baseline, self.cfg),
                check_infection(row, a.baseline, self.cfg),
                check_musculoskeletal(history, a.baseline, self.cfg),
                check_behavioral(row, a.baseline, self.cfg),
                check_environment(row, crew_headaches, self.cfg),
            ) if f is not None
        ]

        systems: dict[str, dict[str, str]] = {}
        for system in BODY_SYSTEMS:
            system_flags = [f for f in flags if f.system == system]
            if not system_flags:
                systems[system] = {"severity": "GREEN", "message": GREEN_MESSAGES[system]}
                continue
            top = max(system_flags, key=lambda f: f.severity == "RED")
            message = top.explanation if top.code == "RED_LINE" else SYSTEM_MESSAGES.get(top.code, top.explanation)
            systems[system] = {"severity": worst([f.severity for f in system_flags]), "message": message}

        metrics = {
            m: {
                "value": _round(row[m]),
                "unit": b.unit,
                "z_score": _round(row[f"{m}_z"]),
                "severity": severity(_float(row[f"{m}_c"]), self.cfg),
            }
            for m, b in a.baseline.items() if m in METRICS
        }

        return DayAssessment(
            astronaut_id=astronaut_id,
            astronaut_name=a.name,
            day=day,
            overall_severity=worst([s["severity"] for s in systems.values()]),
            systems=systems,
            metrics=metrics,
            flags=flags,
            red_lines=reds,
        )

    def assess_mission(self, astronaut_id: str) -> list[DayAssessment]:
        """Assess every mission day (for evaluation and the replay slider)."""
        return [self.assess(astronaut_id, d) for d in range(FIRST_MISSION_DAY, LAST_MISSION_DAY + 1)]


def _float(value: object) -> float | None:
    if value is None:
        return None
    f = float(value)  # type: ignore[arg-type]
    return None if f != f else f


def _round(value: object, places: int = 2) -> float | None:
    """Rounded float, or None for missing values (the contract uses null)."""
    f = _float(value)
    return None if f is None else round(f, places)
