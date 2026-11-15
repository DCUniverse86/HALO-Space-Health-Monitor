"""Tests for personal baselines."""

from __future__ import annotations

import pandas as pd
import pytest

from app.detection.baseline import METRIC_SPECS, InsufficientBaselineError, build_baseline


def _frame(values: list[float], metric: str = "rest_hr", mission: list[float] | None = None) -> pd.DataFrame:
    pre = [{"day": -len(values) + i, metric: v} for i, v in enumerate(values)]
    post = [{"day": i, metric: v} for i, v in enumerate(mission or [])]
    return pd.DataFrame(pre + post)


def test_median_and_mad_scale(cfg) -> None:
    df = _frame([58, 60, 62, 59, 61, 60, 58, 62, 60, 59, 61, 60, 59, 61])
    base = build_baseline(df, cfg)["rest_hr"]
    assert base.median == 60
    assert base.scale == pytest.approx(1.4826 * 1.0)
    assert base.unit == "bpm"


def test_uses_only_preflight_days(cfg) -> None:
    df = _frame([60.0] * 14, mission=[200.0] * 50)
    assert build_baseline(df, cfg)["rest_hr"].median == 60


def test_robust_to_one_outlier(cfg) -> None:
    steady = [60, 61, 59, 60, 61, 59, 60, 61, 59, 60, 61, 59, 60, 61]
    base = build_baseline(_frame(steady[:-1] + [140]), cfg)["rest_hr"]
    assert base.median == pytest.approx(60, abs=1)
    assert base.scale < 3


def test_scale_floor_prevents_tiny_spread(cfg) -> None:
    base = build_baseline(_frame([60.0] * 14), cfg)["rest_hr"]
    assert base.scale == cfg["baseline"]["min_scale"]["rest_hr"]


def test_too_few_preflight_days(cfg) -> None:
    with pytest.raises(InsufficientBaselineError):
        build_baseline(_frame([60.0] * 5), cfg)


def test_missing_metric_is_skipped(cfg) -> None:
    base = build_baseline(_frame([60.0] * 14), cfg)
    assert set(base) == {"rest_hr"}


def test_band(cfg) -> None:
    base = build_baseline(_frame([58, 60, 62, 59, 61, 60, 58, 62, 60, 59, 61, 60, 59, 61]), cfg)["rest_hr"]
    lower, upper = base.band(2.0)
    assert lower == pytest.approx(60 - 2 * base.scale)
    assert upper == pytest.approx(60 + 2 * base.scale)


def test_simulated_crew_has_baseline_for_every_metric(engine) -> None:
    for astronaut_id in engine.crew_ids():
        assert set(engine.baseline(astronaut_id)["metrics"]) == set(METRIC_SPECS)
