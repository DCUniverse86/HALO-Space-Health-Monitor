"""Measure detection quality on the simulated crew.

Reports, per the project plan:
  * detection rate: injected events caught (a flag on the event's body system
    between its start day and ``RECOVERY_DAYS`` after it ends);
  * time to detect: days from event start to the first such flag;
  * false alarm rate: astronaut-days with any flag on a normal day, per 100
    normal astronaut-days. Normal days are mission days outside every event
    window and its recovery period.

Run from ``backend/``:

    python -m app.detection.evaluate             # uses a fresh simulated crew
    python -m app.detection.evaluate --markdown  # results table for the README
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass

from app.detection.config import Thresholds
from app.detection.engine import FIRST_MISSION_DAY, LAST_MISSION_DAY, DayAssessment, DetectionEngine
from app.simulator.generate import DEFAULT_SEED, EVENTS, InjectedEvent, generate_crew

# Signals are smoothed, so flags may outlast the injected change for a few days.
RECOVERY_DAYS = 7


@dataclass(frozen=True)
class EventResult:
    astronaut_id: str
    event: InjectedEvent
    first_flag_day: int | None

    @property
    def detected(self) -> bool:
        return self.first_flag_day is not None

    @property
    def days_to_detect(self) -> int | None:
        return None if self.first_flag_day is None else self.first_flag_day - self.event.start_day


@dataclass(frozen=True)
class Evaluation:
    events: list[EventResult]
    normal_days: int
    false_alarm_days: int
    false_alarm_codes: dict[str, int]

    @property
    def detection_rate(self) -> float:
        return sum(e.detected for e in self.events) / len(self.events)

    @property
    def false_alarms_per_100(self) -> float:
        return 100 * self.false_alarm_days / self.normal_days if self.normal_days else 0.0


def _in_event_or_recovery(day: int) -> bool:
    return any(e.start_day <= day < e.end_day + RECOVERY_DAYS for e in EVENTS)


def evaluate(engine: DetectionEngine) -> Evaluation:
    """Run detection over every astronaut and mission day and score it."""
    results: list[EventResult] = []
    normal_days = false_alarm_days = 0
    codes: dict[str, int] = {}
    for astronaut_id in engine.crew_ids():
        days: list[DayAssessment] = engine.assess_mission(astronaut_id)
        for ev in EVENTS:
            first = next(
                (
                    d.day for d in days
                    if ev.start_day <= d.day < ev.end_day + RECOVERY_DAYS
                    and any(f.system == ev.system for f in d.flags)
                ),
                None,
            )
            results.append(EventResult(astronaut_id, ev, first))
        for d in days:
            if _in_event_or_recovery(d.day):
                continue
            normal_days += 1
            if d.flags:
                false_alarm_days += 1
                for f in d.flags:
                    codes[f.code] = codes.get(f.code, 0) + 1
    return Evaluation(results, normal_days, false_alarm_days, codes)


def evaluate_simulated(seed: int = DEFAULT_SEED, cfg: Thresholds | None = None) -> Evaluation:
    """Evaluate on a freshly generated crew (no files needed)."""
    return evaluate(DetectionEngine(generate_crew(seed), cfg))


def format_table(result: Evaluation, markdown: bool = False) -> str:
    """Per-event table plus the summary numbers."""
    lines: list[str] = []
    header = ["Event", "System", "Start day", "Caught", "Days to detect (per astronaut)"]
    rows: list[list[str]] = []
    for ev in EVENTS:
        per = [r for r in result.events if r.event.code == ev.code]
        caught = sum(r.detected for r in per)
        delays = ", ".join(
            f"{r.astronaut_id}: {r.days_to_detect}" if r.detected else f"{r.astronaut_id}: missed" for r in per
        )
        rows.append([ev.code, ev.system, str(ev.start_day), f"{caught}/{len(per)}", delays])
    if markdown:
        lines.append("| " + " | ".join(header) + " |")
        lines.append("|" + "---|" * len(header))
        lines += ["| " + " | ".join(r) + " |" for r in rows]
    else:
        widths = [max(len(x) for x in col) for col in zip(header, *rows)]
        for r in [header, *rows]:
            lines.append("  ".join(x.ljust(w) for x, w in zip(r, widths)))
    detected = sum(e.detected for e in result.events)
    delays = [e.days_to_detect for e in result.events if e.days_to_detect is not None]
    lines.append("")
    lines.append(f"Detection rate: {detected}/{len(result.events)} ({100 * result.detection_rate:.0f}%)")
    if delays:
        lines.append(f"Mean time to detect: {sum(delays) / len(delays):.1f} days (max {max(delays)})")
    lines.append(
        f"False alarms: {result.false_alarm_days} flagged days out of {result.normal_days} normal "
        f"astronaut-days ({result.false_alarms_per_100:.1f} per 100)"
        + (f" - by code: {result.false_alarm_codes}" if result.false_alarm_codes else "")
    )
    lines.append(
        f"Mission days {FIRST_MISSION_DAY}-{LAST_MISSION_DAY}; flags up to {RECOVERY_DAYS} days after an "
        f"event ends count toward that event."
    )
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Measure HALO detection on simulated data.")
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--markdown", action="store_true", help="print a Markdown table")
    args = parser.parse_args(argv)
    print(format_table(evaluate_simulated(args.seed), markdown=args.markdown))


if __name__ == "__main__":
    main()
