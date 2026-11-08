"""CLI for increment-1 pre-publish checks.

Does not publish. Writes a JSON report to stdout or --report.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from heavymap.prepublish.checks import run_checks


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="python3 -m heavymap.prepublish",
        description=(
            "Run leak, allowlist, size and reproducibility checks over every "
            "file in a jurisdiction build output directory. Fail closed. "
            "Does not publish or deploy."
        ),
    )
    p.add_argument("output", help="Build output directory to scan")
    p.add_argument(
        "--reference",
        default=None,
        help="Second output tree from the same pinned inputs (reproducibility)",
    )
    p.add_argument(
        "--report",
        default=None,
        help="Write the JSON report to this path as well as stdout",
    )
    p.add_argument(
        "--withheld-values",
        default=None,
        help="Text file of withheld values, one per line (field names only if empty)",
    )
    p.add_argument(
        "--explained",
        default=None,
        help="Text file of relative paths allowed to differ (embedded timestamps)",
    )
    p.add_argument(
        "--require-reference",
        action="store_true",
        help="Fail reproducibility when --reference is omitted",
    )
    return p


def _lines(path: str | None) -> list[str]:
    if not path:
        return []
    return [
        line.strip()
        for line in Path(path).read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    ]


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    report = run_checks(
        Path(args.output),
        reference=Path(args.reference) if args.reference else None,
        withheld_values=_lines(args.withheld_values),
        explained=_lines(args.explained),
        require_reference=args.require_reference,
    )
    text = json.dumps(report, indent=1, ensure_ascii=False)
    print(text)
    if args.report:
        Path(args.report).write_text(text + "\n", encoding="utf-8")
    return 0 if report["ok"] else 1
