
import json
from pathlib import Path
from typing import Any

from app.config import DATABASE_URL, IS_VERCEL


class AlreadyExistsError(KeyError):
    pass


class StorageUnavailableError(RuntimeError):
    pass


class JsonStore:
    """
    HALO record storage.

    Local development:
        Uses JSON files.

    Vercel:
        Uses PostgreSQL when DATABASE_URL is set.

    Vercel without PostgreSQL:
        Prevents writes rather than falsely
        reporting that records were saved.
    """

    def __init__(self, path: Path):
        self.path = path
        self.store_name = path.stem
        self._records: dict[str, dict] = {}

        if DATABASE_URL:
            return

        if path.exists():
            self._records = json.loads(
                path.read_text(encoding="utf-8")
            )

    def _connection(self):
        if not DATABASE_URL:
            raise StorageUnavailableError(
                "DATABASE_URL is not configured."
            )

        import psycopg

        return psycopg.connect(DATABASE_URL)

    def exists(self, record_id: str) -> bool:
        if DATABASE_URL:
            with self._connection() as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT 1
                        FROM halo_records
                        WHERE store_name = %s
                          AND record_id = %s
                        """,
                        (
                            self.store_name,
                            record_id,
                        ),
                    )

                    return cursor.fetchone() is not None

        return record_id in self._records

    def save(
        self,
        record_id: str,
        record: dict[str, Any],
    ) -> None:
        if DATABASE_URL:
            import psycopg
            from psycopg.errors import UniqueViolation

            try:
                with self._connection() as connection:
                    with connection.cursor() as cursor:
                        cursor.execute(
                            """
                            INSERT INTO halo_records (
                                store_name,
                                record_id,
                                payload
                            )
                            VALUES (
                                %s,
                                %s,
                                %s::jsonb
                            )
                            """,
                            (
                                self.store_name,
                                record_id,
                                json.dumps(record),
                            ),
                        )

            except UniqueViolation as error:
                raise AlreadyExistsError(
                    f"'{record_id}' already exists."
                ) from error

            return

        if IS_VERCEL:
            raise StorageUnavailableError(
                "Persistent storage is not configured. "
                "Set DATABASE_URL in Vercel."
            )

        if record_id in self._records:
            raise AlreadyExistsError(
                f"'{record_id}' already exists."
            )

        self._records[record_id] = record

        self.path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        temporary_path = self.path.with_suffix(
            ".tmp"
        )

        temporary_path.write_text(
            json.dumps(
                self._records,
                indent=2,
            ),
            encoding="utf-8",
        )

        temporary_path.replace(self.path)
