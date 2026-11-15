import json
from pathlib import Path


class AlreadyExistsError(KeyError):
    pass


class JsonStore:
    """Records kept in memory and saved to one JSON file, keyed by id."""

    def __init__(self, path: Path):
        self.path = path
        self._records: dict[str, dict] = (
            json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
        )

    def exists(self, record_id: str) -> bool:
        return record_id in self._records

    def save(self, record_id: str, record: dict) -> None:
        if record_id in self._records:
            raise AlreadyExistsError(f"'{record_id}' already exists.")
        self._records[record_id] = record
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self._records, indent=2), encoding="utf-8")
        tmp.replace(self.path)
