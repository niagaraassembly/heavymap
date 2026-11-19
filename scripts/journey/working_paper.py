#!/usr/bin/env python3
"""Turn a working document into Journey post files, nearly as written.

    working_paper.py SOURCE.md OUTDIR --tags a,b --written 2026-10-17 [--title T] [--meta k=v ...]

Cleaning (reported, never silent): local paths, private repository names, the owner's and
agents' names, links to private files, HTML comments, ticket lines. Everything else stays.
Documents too long for one Telegraph page are split at section boundaries into parts.
Writes OUTDIR/<slug>[-part-N].md and prints one line per file with what was cleaned.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import journey  # noqa: E402

RULES = [
    # Paths standing on their own only: never inside a web address (".../home/showdocument").
    ("local path", re.compile(r"`?(?<![\w.:/-])(?:/fast/code|/home/\w+|/Users/\w+|/tmp|deb:)[^\s`|),;]*`?"), "a local working copy"),
    ("local path", re.compile(r"`?(?<![\w.:/-])~/(?:na|making|github|work|machine-flows|\.config|\.local)[^\s`|),;]*`?"), "a local working copy"),
    ("local path", re.compile(r"`?local-data/[^\s`|),;]*`?"), "local data (not published)"),
    ("private repo", re.compile(r"heavymap-restricted"), "our private planning repository"),
    ("private repo", re.compile(r"heavymap-portraits"), "a private repository"),
    ("private repo", re.compile(r"\bservice-data\b"), "private service data"),
    ("deploy key", re.compile(r"PORTRAITS_DEPLOY_KEY"), "a deploy key"),
    ("owner name", re.compile(r"\bMorgen's\b"), "the owner's"),
    ("owner name", re.compile(r"\bMorgen\b"), "the owner"),
    ("agent name", re.compile(r"\b(?:Grok Bot|Grok|Claude Code|Claude|Codex|Cursor agent)\b"), "an agent"),
]
LINK = re.compile(r"\[([^\]]+)\]\((?!https?://)[^)]*\)")
COMMENT = re.compile(r"<!--.*?-->", re.S)
TICKET_LINE = re.compile(r"^\s*\*\*(?:Linear|Owner issue|By)[^\n]*\n", re.M)
BYLINE = re.compile(r"(?:\s*\*\*By:\*\*[^.\n]*\.)|(?:Built on deb by [^.\n]*\.)")


def clean(text: str) -> tuple[str, dict]:
    counts: dict = {}
    def bump(k, n):
        if n:
            counts[k] = counts.get(k, 0) + n
    text, n = COMMENT.subn("", text); bump("comment", n)
    text, n = TICKET_LINE.subn("", text); bump("ticket line", n)
    text, n = BYLINE.subn("", text); bump("byline", n)
    text, n = LINK.subn(r"\1", text); bump("private link", n)
    names = Path.home() / ".config/heavymap/journey-private-names.txt"
    if names.exists():
        distinct = [re.escape(w) for w in names.read_text().split() if "-" in w or w in ("workwarrior",)]
        if distinct:
            text, n = re.subn(r"`?(?<![\w-])(?:" + "|".join(distinct) + r")(?![\w-])`?", "a private repository", text)
            bump("private repo", n)
    for name, rx, rep in RULES:
        text, n = rx.subn(rep, text); bump(name, n)
    return text, counts


def split_sections(body: str) -> list[str]:
    parts, cur = [], []
    for line in body.split("\n"):
        if line.startswith("## ") and cur:
            parts.append("\n".join(cur)); cur = []
        cur.append(line)
    parts.append("\n".join(cur))
    return parts


def size_of(title, tags, intro, body) -> int:
    post = journey.parse_post(f"{title}\n{', '.join(tags)}\n\n> {intro}\n\n{body}")
    return len(json.dumps(journey.build_content(post, {"id": "JP-0000"}, "2026-01-01"), ensure_ascii=False).encode())


def main(argv=None) -> None:
    a = argparse.ArgumentParser()
    a.add_argument("source"); a.add_argument("outdir")
    a.add_argument("--tags", required=True); a.add_argument("--written", required=True)
    a.add_argument("--title"); a.add_argument("--intro")
    a.add_argument("--meta", nargs="*", default=[])
    a.add_argument("--slug")
    args = a.parse_args(argv)
    raw = Path(args.source).read_text()
    text, counts = clean(raw)
    lines = text.strip().split("\n")
    title = args.title
    if lines and lines[0].startswith("# "):
        title = title or lines[0][2:].strip()
        lines = lines[1:]
    title = re.sub(r"\*\*|`", "", title or Path(args.source).stem)
    body = "\n".join(lines).strip()
    tags = ["working-paper"] + [t.strip() for t in args.tags.split(",") if t.strip()]
    intro = args.intro or (f"A working paper written on {args.written}, published nearly as written. "
                           "Local file paths, private repository names and personal names have been removed.")
    meta = dict(m.split("=", 1) for m in args.meta)
    meta.setdefault("type", "working-paper")
    meta["evidence_date"] = args.written
    # Split at section boundaries until every part fits one Telegraph page.
    sections = split_sections(body)
    groups, cur = [], []
    for sec in sections:
        trial = "\n".join(cur + [sec])
        if cur and size_of(title, tags, intro, trial) > 55000:
            groups.append("\n".join(cur)); cur = [sec]
        else:
            cur.append(sec)
    groups.append("\n".join(cur))
    out = Path(args.outdir); out.mkdir(parents=True, exist_ok=True)
    slug = args.slug or re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:60]
    n = len(groups)
    for i, g in enumerate(groups, 1):
        t = title if n == 1 else f"{title} (part {i} of {n})"
        front = "\n".join(["---"] + [f"{k}: {v}" for k, v in meta.items()] + ([f"part: {i} of {n}"] if n > 1 else []) + ["---"])
        f = out / (f"{slug}.md" if n == 1 else f"{slug}-part-{i}.md")
        f.write_text(f"{front}\n{t}\n{', '.join(tags)}\n\n> {intro}\n\n{g.strip()}\n")
        size = size_of(t, tags, intro, g)
        print(f"{f.name}\t{size // 1024} kB\tcleaned: {', '.join(f'{k} {v}' for k, v in counts.items()) or 'nothing'}")


if __name__ == "__main__":
    main()
