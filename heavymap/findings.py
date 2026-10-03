from dataclasses import asdict, dataclass


@dataclass
class Finding:
    severity: str  # "error" | "warning"
    code: str
    message: str
    table: str = ""
    line: int = 0
    record: str = ""

    def as_dict(self):
        return asdict(self)

    def __str__(self):
        where = f"{self.table}:{self.line} " if self.table else ""
        rec = f"[{self.record}] " if self.record else ""
        return f"{self.severity.upper():7} {self.code}: {where}{rec}{self.message}"


def errors(findings):
    return [f for f in findings if f.severity == "error"]
