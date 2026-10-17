#!/usr/bin/env python3
"""Read and write simple .xlsx workbooks with the standard library.

Used so Spreadsheets/ CSVs stay authoritative and matching .xlsx files
can be regenerated without hand-editing or third-party packages.
Handles inline strings and (on read) shared-string workbooks.
Does not preserve styles, frozen panes, or formulas.
"""
from __future__ import annotations

import csv
import re
import zipfile
from io import BytesIO
from pathlib import Path
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"
NS_CT = "http://schemas.openxmlformats.org/package/2006/content-types"
COL_REF = re.compile(r"^([A-Z]+)(\d+)$")


def col_to_index(col: str) -> int:
    n = 0
    for ch in col:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def index_to_col(idx: int) -> str:
    idx += 1
    letters = []
    while idx:
        idx, rem = divmod(idx - 1, 26)
        letters.append(chr(65 + rem))
    return "".join(reversed(letters))


def cell_ref(col_idx: int, row_idx: int) -> str:
    return f"{index_to_col(col_idx)}{row_idx + 1}"


def _local(tag: str) -> str:
    return tag.split("}", 1)[-1]


def _cell_text(cell: ET.Element, shared: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        texts = [t.text or "" for t in cell.iter() if _local(t.tag) == "t"]
        return "".join(texts)
    value = None
    for child in cell:
        if _local(child.tag) == "v":
            value = child.text or ""
            break
    if value is None:
        return ""
    if cell_type == "s":
        return shared[int(value)]
    return value


def _load_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    out: list[str] = []
    for si in root:
        if _local(si.tag) != "si":
            continue
        texts = [t.text or "" for t in si.iter() if _local(t.tag) == "t"]
        out.append("".join(texts))
    return out


def read_workbook(path: Path) -> dict[str, list[list[str]]]:
    """Return {sheet_name: rows} with rows as lists of strings."""
    with zipfile.ZipFile(path) as zf:
        shared = _load_shared_strings(zf)
        wb = ET.fromstring(zf.read("xl/workbook.xml"))
        rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
        rel_map = {}
        for rel in rels:
            rel_map[rel.attrib["Id"]] = rel.attrib["Target"]
        sheets: dict[str, list[list[str]]] = {}
        for sheet in wb.iter():
            if _local(sheet.tag) != "sheet":
                continue
            name = sheet.attrib["name"]
            rid = sheet.attrib[f"{{{NS_REL}}}id"]
            target = rel_map[rid].lstrip("/")
            if not target.startswith("xl/"):
                target = "xl/" + target
            root = ET.fromstring(zf.read(target))
            grid: dict[int, dict[int, str]] = {}
            max_col = -1
            max_row = -1
            for row in root.iter():
                if _local(row.tag) != "row":
                    continue
                for cell in row:
                    if _local(cell.tag) != "c":
                        continue
                    ref = cell.attrib.get("r")
                    if not ref:
                        continue
                    match = COL_REF.match(ref)
                    if not match:
                        continue
                    col_idx = col_to_index(match.group(1))
                    row_idx = int(match.group(2)) - 1
                    grid.setdefault(row_idx, {})[col_idx] = _cell_text(cell, shared)
                    max_col = max(max_col, col_idx)
                    max_row = max(max_row, row_idx)
            rows: list[list[str]] = []
            for r in range(max_row + 1):
                row_map = grid.get(r, {})
                rows.append([row_map.get(c, "") for c in range(max_col + 1)])
            sheets[name] = rows
    return sheets


def write_workbook(path: Path, sheets: dict[str, list[list[str]]]) -> None:
    """Write a minimal xlsx. `sheets` insertion order becomes sheet order."""
    sheet_names = list(sheets.keys())
    buf = BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", _content_types(len(sheet_names)))
        zf.writestr("_rels/.rels", _root_rels())
        zf.writestr("xl/workbook.xml", _workbook_xml(sheet_names))
        zf.writestr("xl/_rels/workbook.xml.rels", _workbook_rels(len(sheet_names)))
        zf.writestr("xl/styles.xml", _styles_xml())
        for i, name in enumerate(sheet_names, start=1):
            zf.writestr(f"xl/worksheets/sheet{i}.xml", _sheet_xml(sheets[name]))
    path.write_bytes(buf.getvalue())


def write_csv(path: Path, rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        for row in rows:
            writer.writerow(row)


def read_csv(path: Path) -> list[list[str]]:
    with path.open(encoding="utf-8", newline="") as fh:
        return [list(row) for row in csv.reader(fh)]


def _content_types(n_sheets: int) -> str:
    overrides = [
        '  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
        '  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
    ]
    for i in range(1, n_sheets + 1):
        overrides.append(
            f'  <Override PartName="/xl/worksheets/sheet{i}.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        )
    body = "\n".join(overrides)
    return (
        f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        f'<Types xmlns="{NS_CT}">\n'
        '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n'
        '  <Default Extension="xml" ContentType="application/xml"/>\n'
        f"{body}\n"
        "</Types>\n"
    )


def _root_rels() -> str:
    return (
        f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        f'<Relationships xmlns="{NS_PKG_REL}">\n'
        f'  <Relationship Id="rId1" Type="{NS_REL}/officeDocument" Target="xl/workbook.xml"/>\n'
        "</Relationships>\n"
    )


def _workbook_xml(names: list[str]) -> str:
    sheets = []
    for i, name in enumerate(names, start=1):
        sheets.append(
            f'    <sheet name="{escape(name)}" sheetId="{i}" r:id="rId{i}"/>'
        )
    body = "\n".join(sheets)
    return (
        f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        f'<workbook xmlns="{NS_MAIN}" xmlns:r="{NS_REL}">\n'
        f"  <sheets>\n{body}\n  </sheets>\n"
        "</workbook>\n"
    )


def _workbook_rels(n_sheets: int) -> str:
    rels = [
        f'  <Relationship Id="rId{i}" Type="{NS_REL}/worksheet" Target="worksheets/sheet{i}.xml"/>'
        for i in range(1, n_sheets + 1)
    ]
    rels.append(
        f'  <Relationship Id="rId{n_sheets + 1}" Type="{NS_REL}/styles" Target="styles.xml"/>'
    )
    body = "\n".join(rels)
    return (
        f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        f'<Relationships xmlns="{NS_PKG_REL}">\n'
        f"{body}\n"
        "</Relationships>\n"
    )


def _styles_xml() -> str:
    return (
        f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        f'<styleSheet xmlns="{NS_MAIN}">\n'
        "  <fonts count=\"1\"><font><sz val=\"11\"/><name val=\"Calibri\"/></font></fonts>\n"
        "  <fills count=\"1\"><fill><patternFill patternType=\"none\"/></fill></fills>\n"
        "  <borders count=\"1\"><border/></borders>\n"
        "  <cellStyleXfs count=\"1\"><xf/></cellStyleXfs>\n"
        "  <cellXfs count=\"1\"><xf/></cellXfs>\n"
        "</styleSheet>\n"
    )


def _sheet_xml(rows: list[list[str]]) -> str:
    width = max((len(r) for r in rows), default=0)
    out_rows = []
    for r_idx, row in enumerate(rows):
        cells = []
        padded = list(row) + [""] * (width - len(row))
        for c_idx, value in enumerate(padded):
            text = "" if value is None else str(value)
            ref = cell_ref(c_idx, r_idx)
            cells.append(
                f'<c r="{ref}" t="inlineStr"><is><t>{escape(text)}</t></is></c>'
            )
        out_rows.append(f'<row r="{r_idx + 1}">{"".join(cells)}</row>')
    body = "".join(out_rows)
    return (
        f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        f'<worksheet xmlns="{NS_MAIN}">\n'
        f"<sheetData>{body}</sheetData>\n"
        "</worksheet>\n"
    )
