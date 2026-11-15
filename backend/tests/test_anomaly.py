"""Tests for z-scores, EWMA, CUSUM and metric severity."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from app.detection.anomaly import (
    compute_signals,
    cusum_upper,
    ewma,
    robust_z,
    severity,
    trailing_cusum,
    worst,
)
from app.detection.baseline import Baseline


def test_robust_z() -> None:
    base = Baseline(median=60, scale=2, unit="bpm")
    assert robust_z(66, base) == 3
    assert robust_z(56, base) == -2


def test_ewma_smooths_a_spike() -> None:
    s = ewma(pd.Series([0, 0, 0, 10, 0, 0]), alpha=0.3)
    assert s[3] == pytest.approx(3.0)
    assert s[4] < s[3]


def test_cusum_catches_small_steady_shift() -> None:
    assert cusum_upper(np.array([1.0] * 10), k=0.5) == pytest.approx(5.0)


def test_cusum_ignores_noise_around_zero() -> None:
    rng = np.random.default_rng(0)
    assert cusum_upper(rng.normal(0, 1, 14), k=0.5) < 5


def test_trailing_cusum_forgets_old_shift() -> None:
    z = pd.Series([2.0] * 10 + [0.0] * 20)
    out = trailing_cusum(z, k=0.5, window=14)
    assert out[9] == pytest.approx(15.0)
    assert out[29] == 0.0


def test_severity_uses_concern_direction(cfg) -> None:
    assert severity(3.5, cfg) == "RED"
    assert severity(2.5, cfg) == "YELLOW"
    assert severity(1.0, cfg) == "GREEN"
    assert severity(-5.0, cfg) == "GREEN"  # far in the harmless direction
    assert severity(None, cfg) == "GREEN"


def test_worst() -> None:
    assert worst(["GREEN", "RED", "YELLOW"]) == "RED"
    assert worst([]) == "GREEN"


def test_compute_signals_flips_direction_for_hrv(cfg) -> None:
    df = pd.DataFrame({"day": [-1, 0], "hrv": [60.0, 50.0], "rest_hr": [60.0, 70.0]})
    base = {"hrv": Baseline(60, 5, "ms"), "rest_hr": Baseline(60, 2, "bpm")}
    s = compute_signals(df, base, cfg)
    assert s.loc[1, "hrv_z"] == -2 and s.loc[1, "hrv_c"] == 2  # HRV down is concerning
    assert s.loc[1, "rest_hr_z"] == 5 and s.loc[1, "rest_hr_c"] == 5


def test_signals_are_causal(cfg) -> None:
    """Changing a future day must not change today's signals."""
    df = pd.DataFrame({"day": list(range(-14, 30)), "rest_hr": [60.0] * 44})
    base = {"rest_hr": Baseline(60, 2, "bpm")}
    before = compute_signals(df, base, cfg)
    df.loc[df["day"] == 20, "rest_hr"] = 120.0
    after = compute_signals(df, base, cfg)
    cols = ["rest_hr_z", "rest_hr_ewma", "rest_hr_ewma_c", "rest_hr_cusum"]
    pd.testing.assert_frame_equal(before[before["day"] < 20][cols], after[after["day"] < 20][cols])
