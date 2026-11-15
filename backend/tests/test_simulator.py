"""Tests for the simulated crew data generator."""

from __future__ import annotations

import json

import pandas as pd
import pytest

from app.simulator.generate import (
    COLUMNS,
    CREW,
    EVENTS,
    MISSION_DAYS,
    PREFLIGHT_DAYS,
    event,
    generate_crew,
    write_crew,
)

CONTRACT_IDS = {"alex", "jordan", "sam", "riley"}
BODY_SYSTEMS = {"cardiovascular", "immune", "musculoskeletal", "behavioral", "environment"}


@pytest.fixture(scope="module")
def crew() -> dict[str, pd.DataFrame]:
    return generate_crew()


def _window(df: pd.DataFrame, start: int, end: int) -> pd.DataFrame:
    return df[(df["day"] >= start) & (df["day"] < end)]


def _preflight(df: pd.DataFrame) -> pd.DataFrame:
    return df[df["day"] < 0]


def test_crew_ids_match_api_contract(crew: dict[str, pd.DataFrame]) -> None:
    assert set(crew) == CONTRACT_IDS
    for astronaut_id, df in crew.items():
        assert (df["astronaut_id"] == astronaut_id).all()


def test_day_range_and_columns(crew: dict[str, pd.DataFrame]) -> None:
    for df in crew.values():
        assert list(df.columns) == list(COLUMNS)
        assert len(df) == PREFLIGHT_DAYS + MISSION_DAYS
        assert df["day"].min() == -PREFLIGHT_DAYS
        assert df["day"].max() == MISSION_DAYS - 1  # contract: mission days 0-179
        assert df["day"].is_unique


def test_no_missing_values(crew: dict[str, pd.DataFrame]) -> None:
    for df in crew.values():
        assert not df.isna().any().any()


def test_values_stay_in_physical_ranges(crew: dict[str, pd.DataFrame]) -> None:
    for df in crew.values():
        assert df["spo2"].between(85, 100).all()
        assert df["mood"].between(1, 10).all()
        assert df["fatigue"].between(0, 10).all()
        assert df["back_pain"].between(0, 10).all()
        assert (df["exercise_min"] >= 0).all()
        assert (df["social_h"] >= 0).all()
        assert set(df["headache"].unique()) <= {0, 1}


def test_same_seed_gives_same_data() -> None:
    a, b = generate_crew(seed=7), generate_crew(seed=7)
    for astronaut_id in a:
        pd.testing.assert_frame_equal(a[astronaut_id], b[astronaut_id])


def test_different_seed_gives_different_data() -> None:
    a, b = generate_crew(seed=1), generate_crew(seed=2)
    assert not a["alex"]["rest_hr"].equals(b["alex"]["rest_hr"])


def test_astronauts_differ_from_each_other(crew: dict[str, pd.DataFrame]) -> None:
    assert not crew["alex"]["rest_hr"].equals(crew["jordan"]["rest_hr"])


def test_cabin_co2_is_shared_by_the_crew(crew: dict[str, pd.DataFrame]) -> None:
    co2 = crew["alex"]["co2_ppm"]
    for df in crew.values():
        assert df["co2_ppm"].equals(co2)


def test_events_are_well_formed() -> None:
    assert len(EVENTS) == 5
    for ev in EVENTS:
        assert ev.system in BODY_SYSTEMS
        assert 0 <= ev.start_day < ev.end_day <= MISSION_DAYS
        assert set(ev.metrics) <= set(COLUMNS)
    assert {ev.system for ev in EVENTS} == BODY_SYSTEMS


def test_preflight_is_free_of_events(crew: dict[str, pd.DataFrame]) -> None:
    for df in crew.values():
        pre = _preflight(df)
        assert (pre["co2_ppm"] < 1500).all()
        assert (pre["exercise_min"] > 50).all()


@pytest.mark.parametrize("profile", CREW, ids=lambda p: p.id)
def test_cardio_drift_is_injected(crew: dict[str, pd.DataFrame], profile) -> None:
    df, ev = crew[profile.id], event("CARDIO_DRIFT")
    late = _window(df, ev.end_day - 5, ev.end_day)  # end of the ramp
    pre = _preflight(df)
    assert late["rest_hr"].mean() - pre["rest_hr"].mean() > 6
    # HRV noise (sd 5 ms) is close to the size of the drift, so allow a smaller gap.
    assert pre["hrv"].mean() - late["hrv"].mean() > 4
    assert pre["sleep_h"].mean() - late["sleep_h"].mean() > 0.8


@pytest.mark.parametrize("profile", CREW, ids=lambda p: p.id)
def test_infection_is_injected(crew: dict[str, pd.DataFrame], profile) -> None:
    df, ev = crew[profile.id], event("POSSIBLE_INFECTION")
    win, pre = _window(df, ev.start_day, ev.end_day), _preflight(df)
    assert win["temp_c"].mean() - pre["temp_c"].mean() > 0.7
    assert win["rest_hr"].mean() - pre["rest_hr"].mean() > 5
    assert win["fatigue"].mean() >= 5


@pytest.mark.parametrize("profile", CREW, ids=lambda p: p.id)
def test_behavioral_decline_is_injected(crew: dict[str, pd.DataFrame], profile) -> None:
    df, ev = crew[profile.id], event("BEHAVIORAL_DECLINE")
    late, pre = _window(df, ev.end_day - 5, ev.end_day), _preflight(df)
    assert pre["mood"].mean() - late["mood"].mean() > 2
    assert pre["social_h"].mean() - late["social_h"].mean() > 1
    assert pre["sleep_h"].mean() - late["sleep_h"].mean() > 0.5


@pytest.mark.parametrize("profile", CREW, ids=lambda p: p.id)
def test_co2_event_is_injected(crew: dict[str, pd.DataFrame], profile) -> None:
    df, ev = crew[profile.id], event("CO2_HEADACHE")
    win = _window(df, ev.start_day, ev.end_day)
    assert (win["co2_ppm"] > 2000).all()
    assert (win["headache"] == 1).all()


@pytest.mark.parametrize("profile", CREW, ids=lambda p: p.id)
def test_skipped_exercise_is_injected(crew: dict[str, pd.DataFrame], profile) -> None:
    df, ev = crew[profile.id], event("SKIPPED_EXERCISE")
    win, pre = _window(df, ev.start_day, ev.end_day), _preflight(df)
    assert (win["exercise_min"] == 10).all()
    assert win["back_pain"].mean() - pre["back_pain"].mean() > 3


def test_signals_return_to_normal_after_events(crew: dict[str, pd.DataFrame]) -> None:
    df = crew["alex"]
    after = _window(df, 165, 180)  # no events after day 157
    assert (after["co2_ppm"] < 1500).all()
    assert (after["exercise_min"] > 50).all()
    assert after["temp_c"].max() < 37.5


def test_write_crew_round_trips(tmp_path) -> None:
    paths = write_crew(tmp_path, seed=3)
    names = {p.name for p in paths}
    assert names == {f"{i}.csv" for i in CONTRACT_IDS} | {"events.json"}

    expected = generate_crew(seed=3)
    for astronaut_id in CONTRACT_IDS:
        loaded = pd.read_csv(tmp_path / f"{astronaut_id}.csv")
        pd.testing.assert_frame_equal(loaded, expected[astronaut_id], check_dtype=False)

    events = json.loads((tmp_path / "events.json").read_text(encoding="utf-8"))
    assert events["seed"] == 3
    assert [e["code"] for e in events["events"]] == [e.code for e in EVENTS]
