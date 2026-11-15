"""Daily deviation signals: z-scores, EWMA and CUSUM against the personal baseline.

All signals are causal: the value for day N only uses days up to N, so the
replay slider shows exactly what HALO would have known on that day.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from app.detection.baseline import METRIC_SPECS, Baseline
from app.detection.config import Thresholds

Severity = str  # "GREEN" | "YELLOW" | "RED"
SEVERITY_ORDER: dict[Severity, int] = {"GREEN": 0, "YELLOW": 1, "RED": 2}


def robust_z(value: float, base: Baseline) -> float:
    """Signed distance from the baseline median, in baseline spreads."""
    return (value - base.median) / base.scale


def ewma(series: pd.Series, alpha: float) -> pd.Series:
    """Exponentially weighted moving average; smooths daily noise, keeps slow drifts."""
    return series.ewm(alpha=alpha, adjust=False, ignore_na=True).mean()


def cusum_upper(z_values: np.ndarray, k: float) -> float:
    """Upward CUSUM of z-scores: accumulates small, consistent shifts."""
    s = 0.0
    for z in z_values:
        if not np.isnan(z):
            s = max(0.0, s + z - k)
    return s


def trailing_cusum(z: pd.Series, k: float, window: int) -> pd.Series:
    """Upward CUSUM over the last ``window`` days for every day.

    A windowed CUSUM catches slow drifts like the full one, but forgets an event
    within ``window`` days after it ends instead of staying high for months.
    """
    values = z.to_numpy(dtype=float)
    out = [cusum_upper(values[max(0, i - window + 1): i + 1], k) for i in range(len(values))]
    return pd.Series(out, index=z.index)


def severity(concern_z: float | None, cfg: Thresholds) -> Severity:
    """Metric severity from a z-score measured in the concerning direction."""
    if concern_z is None or np.isnan(concern_z):
        return "GREEN"
    ms = cfg["metric_severity"]
    if concern_z >= ms["red_z"]:
        return "RED"
    if concern_z >= ms["yellow_z"]:
        return "YELLOW"
    return "GREEN"


def worst(severities: list[Severity]) -> Severity:
    """Highest severity in the list (GREEN if empty)."""
    return max(severities, key=SEVERITY_ORDER.__getitem__, default="GREEN")


def compute_signals(df: pd.DataFrame, baseline: dict[str, Baseline], cfg: Thresholds) -> pd.DataFrame:
    """Return a per-day frame of detection signals for one astronaut.

    For each metric ``m`` with a baseline it adds:
      ``m_z``       signed robust z-score
      ``m_c``       concern z (z flipped so positive is always the worrying direction)
      ``m_ewma``    EWMA of the raw value (for trend charts)
      ``m_ewma_c``  EWMA of the concern z (persistent deviation)
      ``m_cusum``   upward trailing CUSUM of the concern z (slow drift)
    The original columns are kept.
    """
    sm = cfg["smoothing"]
    out = df.sort_values("day").reset_index(drop=True).copy()
    for metric, base in baseline.items():
        z = (out[metric] - base.median) / base.scale
        concern = z * METRIC_SPECS[metric].direction
        out[f"{metric}_z"] = z
        out[f"{metric}_c"] = concern
        out[f"{metric}_ewma"] = ewma(out[metric], sm["ewma_alpha"])
        out[f"{metric}_ewma_c"] = ewma(concern, sm["ewma_alpha"])
        out[f"{metric}_cusum"] = trailing_cusum(concern, sm["cusum_k"], sm["cusum_window_days"])
    return out
