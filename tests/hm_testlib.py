"""Shared helpers for the hm tests: a throw-away synthetic repo root (no network, no real data)."""

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))

from heavymap import csvio, demo  # noqa: E402
from heavymap.schema import Schema  # noqa: E402


def sandbox():
    """Return (Schema, tmpdir Path) for a fresh synthetic registry. Caller removes tmpdir."""
    tmp = Path(tempfile.mkdtemp(prefix="hm-test-"))
    return demo.build(REPO, tmp / "root"), tmp


def add_decision(schema, **kw):
    """Append a raw decision row (bypassing UI checks) so apply/validate can be tested on bad input."""
    from heavymap import ids
    from heavymap.apply import utc_now

    cols = schema.tables["review_decisions"].columns
    row = {"decision_id": ids.decision_id(), "note": "", "old_value": "", "new_value": "", "reviewer": "Tester",
           "timestamp": utc_now(), "linear_id": "NIA-999", "decision_code": "E"}
    row.update(kw)
    csvio.append_row(schema.path("review_decisions"), cols, row)
    return row


def set_cell(schema, table, key, column, value):
    t = schema.tables[table]
    header, rows = schema.load(table)
    rows = csvio.clean_rows(rows)
    for r in rows:
        if r[t.key] == key:
            r[column] = value
    csvio.write_csv(schema.path(table), t.columns, rows)


def get_cell(schema, table, key, column):
    t = schema.tables[table]
    return next(r[column] for r in schema.load_rows(table) if r[t.key] == key)


def run_cli(*args, root=None):
    """Run `python -m heavymap` as a subprocess; return (exit_code, stdout)."""
    cmd = [sys.executable, "-m", "heavymap", *args]
    if root is not None:
        cmd += ["--root", str(root)]
    proc = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True)
    return proc.returncode, proc.stdout


def cleanup(tmp):
    shutil.rmtree(tmp, ignore_errors=True)
