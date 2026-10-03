"""Load data/schema/*.json. The schema is the single source for validate, apply, guard and the UI."""

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

from . import csvio

SCHEMA_REL = Path("data/schema/table-schema.json")
CONTROLLED_REL = Path("data/schema/controlled-values.json")


class SchemaError(Exception):
    pass


@dataclass
class Table:
    name: str
    stage: str
    path: str
    key: str
    columns: list
    editable: list = field(default_factory=list)
    required: list = field(default_factory=list)
    patterns: dict = field(default_factory=dict)
    enums: dict = field(default_factory=dict)
    dates: list = field(default_factory=list)
    urls: list = field(default_factory=list)
    ints: list = field(default_factory=list)
    fk: dict = field(default_factory=dict)
    description: str = ""


def find_root(start=None):
    """Walk up from ``start`` (default cwd) to the directory holding data/schema/table-schema.json."""
    here = Path(start or Path.cwd()).resolve()
    for candidate in [here, *here.parents]:
        if (candidate / SCHEMA_REL).is_file():
            return candidate
    pkg_parent = Path(__file__).resolve().parents[1]
    if (pkg_parent / SCHEMA_REL).is_file():
        return pkg_parent
    raise SchemaError("cannot find data/schema/table-schema.json (use --root)")


class Schema:
    def __init__(self, root):
        self.root = Path(root).resolve()
        try:
            raw = json.loads((self.root / SCHEMA_REL).read_text(encoding="utf-8"))
            self.controlled = json.loads((self.root / CONTROLLED_REL).read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            raise SchemaError(f"cannot read schema under {self.root}: {exc}") from exc
        self.version = raw.get("schema_version", "")
        self.tables = {}
        for name, spec in raw["tables"].items():
            self.tables[name] = Table(
                name=name, stage=spec["stage"], path=spec["path"], key=spec["key"],
                columns=list(spec["columns"]), editable=list(spec.get("editable", [])),
                required=list(spec.get("required", [])), patterns=dict(spec.get("patterns", {})),
                enums=dict(spec.get("enums", {})), dates=list(spec.get("dates", [])),
                urls=list(spec.get("urls", [])), ints=list(spec.get("ints", [])),
                fk=dict(spec.get("fk", {})), description=spec.get("description", ""))

    # -- tables -----------------------------------------------------------------
    def registry_tables(self):
        return [t for t in self.tables.values() if t.stage == "registry"]

    def path(self, table):
        return self.root / self.tables[table].path

    def load(self, table):
        """Return (header, rows) for a table; rows keep __line__/__width__ bookkeeping keys."""
        return csvio.read_csv(self.path(table))

    def load_rows(self, table):
        try:
            return csvio.clean_rows(self.load(table)[1])
        except FileNotFoundError:
            return []

    # -- controlled values -------------------------------------------------------
    def values(self, key):
        v = self.controlled.get(key, [])
        return v if isinstance(v, list) else []

    def enum_for(self, table, column):
        key = self.tables[table].enums.get(column)
        return self.values(key) if key else None

    def pattern_for(self, table, column):
        pat = self.tables[table].patterns.get(column)
        return re.compile(pat) if pat else None

    def decision_codes(self):
        return self.controlled["decision_codes"]

    def is_agent_reviewer(self, reviewer):
        low = reviewer.strip().lower()
        return any(low.startswith(p) for p in self.controlled.get("agent_reviewer_prefixes", []))
