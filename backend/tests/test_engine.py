"""Tests for the detection engine: contract shapes, the five events, red lines, errors."""

from __future__ import annotations

import pytest

from app.detection.engine import (
    BODY_SYSTEMS,
    AstronautNotFoundError,
    DayNotFoundError,
    DayOutOfRangeError,
    DetectionEngine,
    UnknownMetricError,
    load_crew,
)
from app.detection.evaluate import evaluate
from app.simulator.generate import EVENTS, generate_crew, write_crew

SEVERITIES = {"GREEN", "YELLOW", "RED"}


# ----------------------------------------------------------- contract shapes

def test_astronaut_list_matches_contract(engine) -> None:
    data = engine.astronauts()
    assert [a["id"] for a in data["astronauts"]] == ["alex", "jordan", "sam", "riley"]
    assert data["astronauts"][0] == {"id": "alex", "name": "Alex", "mission": "HALO Demo Mission"}


def test_baseline_matches_contract(engine) -> None:
    data = engine.baseline("alex")
    assert data["astronaut_id"] == "alex"
    assert data["metrics"]["rest_hr"]["unit"] == "bpm"
    assert set(data["metrics"]["rest_hr"]) == {"median", "scale", "unit"}


def test_status_matches_contract(engine) -> None:
    data = engine.status("alex", 75)
    assert set(data) == {
        "astronaut_id", "astronaut_name", "day", "overall_severity", "systems", "metrics", "flags",
    }
    assert data["astronaut_name"] == "Alex" and data["day"] == 75
    assert set(data["systems"]) == set(BODY_SYSTEMS)  # always all five
    for system in data["systems"].values():
        assert system["severity"] in SEVERITIES and system["message"]
    for metric in data["metrics"].values():
        assert set(metric) == {"value", "unit", "z_score", "severity"}
    for flag in data["flags"]:
        assert set(flag) == {"id", "system", "severity", "code", "explanation"}


def test_overall_severity_is_worst_system(engine) -> None:
    for day in (0, 45, 76, 132):
        data = engine.status("jordan", day)
        order = {"GREEN": 0, "YELLOW": 1, "RED": 2}
        worst = max((s["severity"] for s in data["systems"].values()), key=order.__getitem__)
        assert data["overall_severity"] == worst


def test_trends_match_contract(engine) -> None:
    data = engine.trends("alex", "rest_hr", 73, 75)
    assert data["unit"] == "bpm"
    assert data["baseline"]["lower"] < data["baseline"]["median"] < data["baseline"]["upper"]
    assert [p["day"] for p in data["points"]] == [73, 74, 75]
    for p in data["points"]:
        assert set(p) == {"day", "value", "ewma", "severity"}


# ---------------------------------------------------------------- the events

@pytest.mark.parametrize("ev", EVENTS, ids=lambda e: e.code)
def test_every_astronaut_is_flagged_during_each_event(engine, ev) -> None:
    for astronaut_id in engine.crew_ids():
        flagged = [
            d for d in range(ev.start_day, ev.end_day + 7)
            if any(f.system == ev.system for f in engine.assess(astronaut_id, d).flags)
        ]
        assert flagged, f"{ev.code} missed for {astronaut_id}"


def test_all_five_events_caught_with_few_false_alarms(engine) -> None:
    result = evaluate(engine)
    assert result.detection_rate == 1.0
    assert result.false_alarms_per_100 < 2.0


def test_quiet_day_is_all_green(engine) -> None:
    data = engine.status("alex", 5)
    assert data["overall_severity"] == "GREEN"
    assert data["flags"] == []


def test_flags_have_plain_language_explanations(engine) -> None:
    flags = engine.assess("alex", 76).flags
    infection = next(f for f in flags if f.code == "POSSIBLE_INFECTION")
    assert "Temperature" in infection.explanation and "fatigue" in infection.explanation


def test_co2_event_is_crew_wide(engine) -> None:
    for astronaut_id in engine.crew_ids():
        codes = [f.code for f in engine.assess(astronaut_id, 132).flags]
        assert "CO2_HEADACHE" in codes


# --------------------------------------------------------- red lines in status

def test_critical_symptom_makes_status_red_and_escalates(engine) -> None:
    a = engine.assess("sam", 5, symptoms=["chest_pain"])
    assert a.overall_severity == "RED"
    assert a.systems["cardiovascular"]["severity"] == "RED"
    assert a.escalate


def test_red_line_overrides_a_yellow_rule(engine) -> None:
    a = engine.assess("alex", 76, overrides={"temp_c": 39.4})
    assert a.systems["immune"]["severity"] == "RED"
    assert a.escalate


def test_low_spo2_override_escalates(engine) -> None:
    a = engine.assess("riley", 20, overrides={"spo2": 89.0})
    assert a.overall_severity == "RED" and a.escalate


def test_checkin_override_changes_only_that_assessment(engine) -> None:
    engine.assess("alex", 20, overrides={"fatigue": 9})
    assert engine.status("alex", 20)["metrics"]["fatigue"]["value"] != 9


def test_headache_alone_raises_no_flag(engine) -> None:
    # Outside the CO2 event nobody has high CO2, so headaches alone raise no flag.
    assert not engine.assess("alex", 20, symptoms=["headache"]).flags


# ------------------------------------------------------------------- errors

def test_unknown_astronaut(engine) -> None:
    with pytest.raises(AstronautNotFoundError):
        engine.status("bob", 10)


@pytest.mark.parametrize("day", [-1, 180, -21])
def test_day_out_of_range(engine, day) -> None:
    with pytest.raises(DayOutOfRangeError):
        engine.status("alex", day)


def test_missing_day(cfg) -> None:
    crew = generate_crew()
    crew["alex"] = crew["alex"][crew["alex"]["day"] != 50]
    with pytest.raises(DayNotFoundError):
        DetectionEngine(crew, cfg).status("alex", 50)


def test_unknown_metric(engine) -> None:
    with pytest.raises(UnknownMetricError):
        engine.trends("alex", "blood_type")


def test_bad_trend_range(engine) -> None:
    with pytest.raises(DayOutOfRangeError):
        engine.trends("alex", "rest_hr", 90, 10)


# -------------------------------------------------------------- loading files

def test_engine_loads_simulator_csvs(tmp_path) -> None:
    write_crew(tmp_path)
    engine = DetectionEngine.from_directory(tmp_path)
    assert engine.crew_ids() == ["alex", "jordan", "riley", "sam"]  # sorted by file name
    assert engine.status("alex", 76)["overall_severity"] == "YELLOW"


def test_missing_data_folder_explains_how_to_fix(tmp_path) -> None:
    with pytest.raises(FileNotFoundError, match="app.simulator.generate"):
        load_crew(tmp_path)
