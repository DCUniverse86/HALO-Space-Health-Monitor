"""Shared fixtures."""

from __future__ import annotations

import pytest

from app.detection.config import Thresholds, load_thresholds
from app.detection.engine import DetectionEngine
from app.simulator.generate import generate_crew


@pytest.fixture
def cfg() -> Thresholds:
    """A fresh copy of the repo thresholds that a test may modify."""
    return load_thresholds()


@pytest.fixture(scope="session")
def engine() -> DetectionEngine:
    """Engine over the default simulated crew, built in memory (no CSV files)."""
    return DetectionEngine(generate_crew())
