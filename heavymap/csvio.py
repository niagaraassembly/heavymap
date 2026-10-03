"""CSV reading and writing with the repo's hygiene rules (UTF-8, LF, RFC-4180, atomic writes)."""

import csv
import os
import tempfile
from pathlib import Path


def read_csv(path):
    """Return (header, rows). Rows are dicts keyed by header. Raises FileNotFoundError."""
    with open(path, "r", encoding="utf-8", newline="") as handle:
        reader = csv.reader(handle)
        try:
            header = next(reader)
        except StopIteration:
            return [], []
        rows = []
        for values in reader:
            if not values:
                continue
            row = dict(zip(header, values))
            row["__width__"] = len(values)
            row["__line__"] = reader.line_num
            rows.append(row)
    return header, rows


def clean_rows(rows):
    return [{k: v for k, v in r.items() if not k.startswith("__")} for r in rows]


def write_csv(path, header, rows):
    """Atomically write header + rows (dicts). Unknown keys are dropped; missing ones are blank."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=path.name + ".", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as handle:
            writer = csv.writer(handle, lineterminator="\n")
            writer.writerow(header)
            for row in rows:
                writer.writerow([row.get(col, "") for col in header])
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def append_row(path, header, row):
    """Append one row (dict) to an existing CSV, taking an advisory lock where available."""
    path = Path(path)
    line = _format_row([row.get(col, "") for col in header])
    with open(path, "a+", encoding="utf-8", newline="") as handle:
        try:
            import fcntl

            fcntl.flock(handle, fcntl.LOCK_EX)
        except ImportError:  # pragma: no cover - non-POSIX
            pass
        handle.seek(0, os.SEEK_END)
        if handle.tell() > 0:
            handle.seek(handle.tell() - 1)
            if handle.read(1) != "\n":
                handle.seek(0, os.SEEK_END)
                handle.write("\n")
        handle.seek(0, os.SEEK_END)
        handle.write(line)
        handle.flush()
        os.fsync(handle.fileno())


def _format_row(values):
    import io

    buf = io.StringIO()
    csv.writer(buf, lineterminator="\n").writerow(values)
    return buf.getvalue()
