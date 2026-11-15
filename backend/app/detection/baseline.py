"""Personal baselines: each astronaut's own normal, from pre-flight days."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from app.detection.config import Thresholds


@dataclass(frozen=True)
class MetricSpec:
    """Display unit and which direction is concerning (+1 up, -1 down)."""

    unit: str
    direction: int


# Units match the API contract. Direction says which way a change is a concern:
# a rising resting HR is concerning, a rising HRV is not.
METRIC_SPECS: dict[str, MetricSpec] = {
    "rest_hr": MetricSpec("bpm", +1),
    "hrv": MetricSpec("ms", -1),
    "sleep_h": MetricSpec("hours", -1),
    "temp_c": MetricSpec("C", +1),
    "spo2": MetricSpec("percent", -1),
    "mood": MetricSpec("1-10", -1),
    "co2_ppm": MetricSpec("ppm", +1),
    "exercise_min": MetricSpec("minutes", -1),
    "social_h": MetricSpec("hours", -1),
    "fatigue": MetricSpec("0-10", +1),
    "back_pain": MetricSpec("0-10", +1),
}
METRICS: tuple[str, ...] = tuple(METRIC_SPECS)


@dataclass(frozen=True)
class Baseline:
    """Robust personal normal for one metric: median and MAD-based spread."""

    median: float
    scale: float
    unit: str

    def band(self, z: float = 2.0) -> tuple[float, float]:
        """(lower, upper) of the normal band at +/- z spreads."""
        return self.median - z * self.scale, self.median + z * self.scale


class InsufficientBaselineError(ValueError):
    """Raised when there are too few pre-flight days to build a baseline."""


def build_baseline(df: pd.DataFrame, cfg: Thresholds) -> dict[str, Baseline]:
    """Return {metric: Baseline} from pre-flight rows (day < 0) of one astronaut.

    Uses median and scaled MAD rather than mean and SD so a single odd pre-flight
    day does not distort the normal range. Missing metrics are skipped.
    """
    bcfg = cfg["baseline"]
    pre = df[df["day"] < 0]
    if len(pre) < bcfg["min_preflight_days"]:
        raise InsufficientBaselineError(
            f"Need {bcfg['min_preflight_days']} pre-flight days, found {len(pre)}."
        )
    out: dict[str, Baseline] = {}
    for metric, spec in METRIC_SPECS.items():
        if metric not in pre:
            continue
        values = pre[metric].dropna().to_numpy(dtype=float)
        if len(values) == 0:
            continue
        median = float(np.median(values))
        mad = float(np.median(np.abs(values - median)))
        floor = float(bcfg["min_scale"].get(metric, 1e-6))
        out[metric] = Baseline(median, max(bcfg["mad_to_sd"] * mad, floor), spec.unit)
    return out
