
"""Load HALO detection thresholds."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_ROOT.parent

PACKAGED_THRESHOLDS_PATH = (
    BACKEND_ROOT / "data" / "config" / "thresholds.yaml"
)

REPOSITORY_THRESHOLDS_PATH = (
    REPO_ROOT / "data" / "config" / "thresholds.yaml"
)

DEFAULT_THRESHOLDS_PATH = (
    PACKAGED_THRESHOLDS_PATH
    if PACKAGED_THRESHOLDS_PATH.is_file()
    else REPOSITORY_THRESHOLDS_PATH
)

Thresholds = dict[str, Any]


def load_thresholds(path: Path | None = None) -> Thresholds:
    """Read and return the configured thresholds."""
    selected_path = (
        path if path is not None else DEFAULT_THRESHOLDS_PATH
    )

    with open(selected_path, encoding="utf-8") as file:
        return yaml.safe_load(file)


@lru_cache(maxsize=1)
def default_thresholds() -> Thresholds:
    """Load default thresholds once per process."""
    return load_thresholds()
