"""Tests for multi-signal rules and hard red lines."""

from __future__ import annotations

import pytest

from app.detection.rules import (
    behavioral_rule,
    cardio_drift_rule,
    environment_rule,
    exercise_rule,
    flag_id,
    infection_rule,
    red_line_flags,
    red_line_reasons,
)

NORMAL = {"spo2": 98.0, "temp_c": 36.6}


# ------------------------------------------------------------------ red lines

def test_no_red_line_on_normal_day(cfg) -> None:
    assert red_line_reasons(NORMAL, [], cfg) == []


def test_low_spo2_is_red_line(cfg) -> None:
    [r] = red_line_reasons({**NORMAL, "spo2": 91.0}, [], cfg)
    assert r.code == "SPO2_CRITICAL" and r.system == "cardiovascular"


def test_spo2_at_limit_is_not_red_line(cfg) -> None:
    assert red_line_reasons({**NORMAL, "spo2": 92.0}, [], cfg) == []


def test_high_fever_is_red_line(cfg) -> None:
    [r] = red_line_reasons({**NORMAL, "temp_c": 39.0}, [], cfg)
    assert r.code == "HIGH_FEVER" and r.system == "immune"


@pytest.mark.parametrize("symptom", ["chest_pain", "loss_of_consciousness", "severe_bleeding"])
def test_critical_symptoms_are_red_lines(cfg, symptom) -> None:
    [r] = red_line_reasons(NORMAL, [symptom], cfg)
    assert r.code == "CRITICAL_SYMPTOM"


def test_ordinary_symptoms_are_not_red_lines(cfg) -> None:
    assert red_line_reasons(NORMAL, ["headache", "fatigue"], cfg) == []


def test_missing_readings_do_not_crash(cfg) -> None:
    assert red_line_reasons({"spo2": None, "temp_c": float("nan")}, [], cfg) == []


def test_every_red_line_flag_forces_escalation(cfg) -> None:
    reasons = red_line_reasons({"spo2": 85.0, "temp_c": 39.5}, ["chest_pain"], cfg)
    flags = red_line_flags(reasons, day=12)
    assert {f.system for f in flags} == {"cardiovascular", "immune"}
    assert all(f.severity == "RED" and f.escalate for f in flags)
    cardio = next(f for f in flags if f.system == "cardiovascular")
    assert "Oxygen" in cardio.explanation and "chest pain" in cardio.explanation


def test_red_lines_come_from_config(cfg) -> None:
    cfg["red_lines"]["spo2_min"]["value"] = 95.0
    assert red_line_reasons({**NORMAL, "spo2": 94.0}, [], cfg)


# ---------------------------------------------------------------------- rules

def test_infection_needs_all_three_signals(cfg) -> None:
    assert infection_rule(rest_hr_c=3, temp_c_c=5, fatigue=6, cfg=cfg)
    assert not infection_rule(rest_hr_c=1, temp_c_c=5, fatigue=6, cfg=cfg)
    assert not infection_rule(rest_hr_c=3, temp_c_c=2, fatigue=6, cfg=cfg)
    assert not infection_rule(rest_hr_c=3, temp_c_c=5, fatigue=3, cfg=cfg)


def test_cardio_drift_needs_supporting_signal(cfg) -> None:
    assert cardio_drift_rule(2.0, 0.0, 1.5, 0.0, cfg)  # HR up + HRV down
    assert cardio_drift_rule(2.0, 0.0, 0.0, 1.5, cfg)  # HR up + sleep down
    assert not cardio_drift_rule(2.0, 0.0, 0.0, 0.0, cfg)  # HR alone


def test_cardio_drift_cusum_path_needs_hr_still_raised(cfg) -> None:
    assert cardio_drift_rule(1.2, 8.0, 1.5, 0.0, cfg)
    assert not cardio_drift_rule(0.5, 8.0, 1.5, 0.0, cfg)  # drift already over


def test_behavioral_rule(cfg) -> None:
    assert behavioral_rule(2.0, 1.2, 0.0, cfg)
    assert behavioral_rule(2.0, 0.0, 1.2, cfg)
    assert not behavioral_rule(2.0, 0.0, 0.0, cfg)
    assert not behavioral_rule(1.0, 2.0, 2.0, cfg)


def test_environment_rule(cfg) -> None:
    assert environment_rule(1500, 4, cfg) is None
    assert environment_rule(2500, 0, cfg) == "CO2_ELEVATED"
    assert environment_rule(2500, 1, cfg) == "CO2_ELEVATED"
    assert environment_rule(2500, 2, cfg) == "CO2_HEADACHE"


def test_exercise_rule(cfg) -> None:
    assert exercise_rule(3, cfg)
    assert not exercise_rule(2, cfg)


def test_flag_id() -> None:
    assert flag_id("POSSIBLE_INFECTION", 75) == "possible-infection-75"
