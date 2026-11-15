"""Load detection thresholds from data/config/thresholds.yaml."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_THRESHOLDS_PATH = REPO_ROOT / "data" / "config" / "thresholds.yaml"

Thresholds = dict[str, Any]


def load_thresholds(path: Path | None = None) -> Thresholds:
    """Read and return the thresholds file as a plain dict."""
    with open(path or DEFAULT_THRESHOLDS_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f)


@lru_cache(maxsize=1)
def default_thresholds() -> Thresholds:
    """The repo's thresholds file, read once per process."""
    return load_thresholds()
