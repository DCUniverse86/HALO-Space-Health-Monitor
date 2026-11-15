"""Generate simulated HALO crew data with five injected health events.

Produces one CSV per astronaut with 21 pre-flight days (day -21 to -1, used for
the personal baseline) followed by 180 mission days (day 0 to 179, the range in
the API contract). Every astronaut receives the same five events on the same
days, so detection rate and time-to-detect can be measured per astronaut.

Cabin CO2 is a property of the habitat, not of a person, so it is generated
once and shared by the whole crew.

Run from ``backend/``:

    python -m app.simulator.generate            # writes to <repo>/data/simulated/
    python -m app.simulator.generate --out DIR --seed 100
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import pandas as pd

PREFLIGHT_DAYS = 21
MISSION_DAYS = 180
DEFAULT_SEED = 100

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OUT_DIR = REPO_ROOT / "data" / "simulated"

# Chance of an unrelated headache on any normal day, so that the false-alarm
# rate is measured against realistic noise rather than a perfectly clean signal.
BACKGROUND_HEADACHE_PROB = 0.02


@dataclass(frozen=True)
class Profile:
    """One astronaut's pre-flight normal values."""

    id: str
    name: str
    rest_hr: float  # bpm
    hrv: float  # ms
    sleep_h: float  # hours
    temp_c: float  # degrees Celsius
    spo2: float  # percent
    mood: float  # 1 (low) to 10 (high)
    social_h: float  # hours per day spent with crewmates


@dataclass(frozen=True)
class InjectedEvent:
    """Ground truth for one injected event. ``end_day`` is exclusive."""

    code: str
    system: str  # one of the five BodySystem values in the API contract
    start_day: int
    end_day: int
    metrics: tuple[str, ...]
    description: str


CREW: tuple[Profile, ...] = (
    Profile("alex", "Alex", 58, 62, 7.4, 36.6, 98, 7.5, 3.0),
    Profile("jordan", "Jordan", 64, 55, 7.0, 36.7, 97, 7.0, 3.5),
    Profile("sam", "Sam", 61, 70, 7.6, 36.5, 98, 8.0, 2.5),
    Profile("riley", "Riley", 66, 50, 6.8, 36.8, 97, 7.2, 3.2),
)

EVENTS: tuple[InjectedEvent, ...] = (
    InjectedEvent(
        "CARDIO_DRIFT", "cardiovascular", 40, 60,
        ("rest_hr", "hrv", "sleep_h"),
        "Slow resting heart rate rise, HRV drop and poorer sleep.",
    ),
    InjectedEvent(
        "POSSIBLE_INFECTION", "immune", 75, 80,
        ("temp_c", "rest_hr", "fatigue"),
        "Fever with raised resting heart rate and fatigue.",
    ),
    InjectedEvent(
        "BEHAVIORAL_DECLINE", "behavioral", 110, 125,
        ("mood", "sleep_h", "social_h"),
        "Gradual mood decline, shorter sleep and social withdrawal.",
    ),
    InjectedEvent(
        "CO2_HEADACHE", "environment", 130, 136,
        ("co2_ppm", "headache"),
        "Cabin CO2 buildup with headaches across the crew.",
    ),
    InjectedEvent(
        "SKIPPED_EXERCISE", "musculoskeletal", 150, 157,
        ("exercise_min", "back_pain"),
        "A week of skipped exercise with back pain.",
    ),
)

COLUMNS: tuple[str, ...] = (
    "day", "astronaut_id", "astronaut",
    "rest_hr", "hrv", "sleep_h", "temp_c", "spo2", "mood", "social_h",
    "co2_ppm", "exercise_min", "fatigue", "headache", "back_pain",
)

# Decimal places written to CSV for each numeric column.
ROUNDING: dict[str, int] = {
    "rest_hr": 1, "hrv": 1, "sleep_h": 2, "temp_c": 2, "spo2": 1,
    "mood": 1, "social_h": 2, "co2_ppm": 0, "exercise_min": 0,
    "fatigue": 1, "back_pain": 1,
}


def event(code: str) -> InjectedEvent:
    """Return the injected event with the given code."""
    return next(e for e in EVENTS if e.code == code)


def _days() -> np.ndarray:
    return np.arange(PREFLIGHT_DAYS + MISSION_DAYS) - PREFLIGHT_DAYS


def _mask(day: pd.Series, ev: InjectedEvent) -> pd.Series:
    return (day >= ev.start_day) & (day < ev.end_day)


def _ramp(mask: pd.Series) -> np.ndarray:
    """0 to 1 over the masked days, for slow drifts."""
    return np.linspace(0.0, 1.0, int(mask.sum()))


def generate_environment(seed: int = DEFAULT_SEED) -> pd.DataFrame:
    """Daily cabin conditions shared by the crew: day and co2_ppm (ppm)."""
    rng = np.random.default_rng(seed + 1000)
    env = pd.DataFrame({"day": _days()})
    env["co2_ppm"] = rng.normal(900, 60, len(env))
    env.loc[_mask(env["day"], event("CO2_HEADACHE")), "co2_ppm"] += 1800
    return env


def generate_astronaut(profile: Profile, seed: int, environment: pd.DataFrame) -> pd.DataFrame:
    """Return one row per day for one astronaut; negative days are pre-flight."""
    rng = np.random.default_rng(seed)
    df = pd.DataFrame({"day": _days()})
    n = len(df)
    df["astronaut_id"] = profile.id
    df["astronaut"] = profile.name
    df["rest_hr"] = rng.normal(profile.rest_hr, 2.0, n)
    df["hrv"] = rng.normal(profile.hrv, 5.0, n)
    df["sleep_h"] = rng.normal(profile.sleep_h, 0.4, n)
    df["temp_c"] = rng.normal(profile.temp_c, 0.15, n)
    df["spo2"] = rng.normal(profile.spo2, 0.6, n)
    df["mood"] = rng.normal(profile.mood, 0.6, n)
    df["social_h"] = rng.normal(profile.social_h, 0.5, n)
    df["co2_ppm"] = environment["co2_ppm"].to_numpy()
    df["exercise_min"] = rng.normal(120, 15, n)
    df["fatigue"] = rng.normal(2, 0.7, n)
    df["headache"] = (rng.random(n) < BACKGROUND_HEADACHE_PROB).astype(int)
    df["back_pain"] = rng.normal(1, 0.5, n)

    m = _mask(df["day"], event("CARDIO_DRIFT"))
    ramp = _ramp(m)
    df.loc[m, "rest_hr"] += ramp * 10
    df.loc[m, "hrv"] -= ramp * 12
    df.loc[m, "sleep_h"] -= ramp * 1.5

    m = _mask(df["day"], event("POSSIBLE_INFECTION"))
    df.loc[m, "temp_c"] += 1.0
    df.loc[m, "rest_hr"] += 8
    df.loc[m, "fatigue"] += 4

    m = _mask(df["day"], event("BEHAVIORAL_DECLINE"))
    ramp = _ramp(m)
    df.loc[m, "mood"] -= ramp * 3.5
    df.loc[m, "sleep_h"] -= ramp * 1.0
    df.loc[m, "social_h"] -= ramp * 2.0

    m = _mask(df["day"], event("CO2_HEADACHE"))
    df.loc[m, "headache"] = 1

    m = _mask(df["day"], event("SKIPPED_EXERCISE"))
    df.loc[m, "exercise_min"] = 10
    df.loc[m, "back_pain"] += 4

    # Clip to physical ranges after the events are injected.
    df["spo2"] = df["spo2"].clip(85, 100)
    df["mood"] = df["mood"].clip(1, 10)
    df["social_h"] = df["social_h"].clip(lower=0)
    df["exercise_min"] = df["exercise_min"].clip(lower=0)
    df["fatigue"] = df["fatigue"].clip(0, 10)
    df["back_pain"] = df["back_pain"].clip(0, 10)

    for column, places in ROUNDING.items():
        df[column] = df[column].round(places)
    return df[list(COLUMNS)]


def generate_crew(seed: int = DEFAULT_SEED) -> dict[str, pd.DataFrame]:
    """Return {astronaut_id: DataFrame} for the whole crew. Deterministic per seed."""
    environment = generate_environment(seed)
    return {
        profile.id: generate_astronaut(profile, seed + i, environment)
        for i, profile in enumerate(CREW)
    }


def write_crew(out_dir: Path = DEFAULT_OUT_DIR, seed: int = DEFAULT_SEED) -> list[Path]:
    """Write one CSV per astronaut plus events.json (ground truth); return the paths."""
    out_dir.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for astronaut_id, df in generate_crew(seed).items():
        path = out_dir / f"{astronaut_id}.csv"
        df.to_csv(path, index=False)
        paths.append(path)
    events_path = out_dir / "events.json"
    events_path.write_text(
        json.dumps({"seed": seed, "events": [asdict(e) for e in EVENTS]}, indent=2) + "\n",
        encoding="utf-8",
    )
    paths.append(events_path)
    return paths


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Generate simulated HALO crew data.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT_DIR, help="output directory")
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED, help="random seed")
    args = parser.parse_args(argv)
    for path in write_crew(args.out, args.seed):
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
