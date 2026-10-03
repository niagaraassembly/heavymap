"""Docs must match the code: links resolve, TABLES.md equals the schema, COMMANDS.md matches the CLI."""

import re
import subprocess
import sys
import unittest
from pathlib import Path

import hm_testlib as lib
from heavymap.cli import build_parser

REPO = lib.REPO
LINK = re.compile(r"\]\(([^)#\s]+)(#[^)]*)?\)")


def md_files():
    out = [REPO / "README.md", REPO / "AGENTS.md", REPO / "misc" / "README.md", REPO / ".github" / "PULL_REQUEST_TEMPLATE.md"]
    out += sorted((REPO / "docs").rglob("*.md"))
    return out


class DocsTest(unittest.TestCase):
    def test_relative_links_resolve(self):
        broken = []
        for path in md_files():
            for m in LINK.finditer(path.read_text(encoding="utf-8")):
                target = m.group(1)
                if target.startswith(("http://", "https://", "mailto:")):
                    continue
                if not (path.parent / target).resolve().exists():
                    broken.append(f"{path.relative_to(REPO)} -> {target}")
        self.assertEqual(broken, [])

    def test_tables_doc_is_generated_from_schema(self):
        proc = subprocess.run([sys.executable, "scripts/gen_table_docs.py", "--check"], cwd=REPO)
        self.assertEqual(proc.returncode, 0, "run: python3 scripts/gen_table_docs.py")

    def test_commands_doc_lists_exactly_the_real_subcommands(self):
        parser = build_parser()
        sub = next(a for a in parser._actions if a.dest == "command")
        real = set(sub.choices)
        text = (REPO / "docs" / "for-agents" / "COMMANDS.md").read_text(encoding="utf-8")
        existing, planned = text.split("## Planned", 1)
        documented = set(re.findall(r"^### `hm (\w+)", existing, re.M))
        self.assertEqual(documented, real)
        for name in ("scan", "add", "pull", "profile", "quirks", "jointest", "score", "build", "followups", "import-legacy"):
            self.assertIn(f"`hm {name}", planned)
            self.assertNotIn(name, real)

    def test_agent_entry_points_name_the_hard_rules(self):
        text = (REPO / "docs" / "for-agents" / "HARD-RULES.md").read_text(encoding="utf-8")
        for needle in ("local-data/", "owner", "G6", "MPAC", "NPCA", "NIA-", "human"):
            self.assertIn(needle, text)
        agents = (REPO / "AGENTS.md").read_text(encoding="utf-8")
        self.assertIn("docs/for-agents/", agents)

    def test_every_exit_code_and_flag_documented(self):
        text = (REPO / "docs" / "for-agents" / "COMMANDS.md").read_text(encoding="utf-8")
        for needle in ("`--json`", "`--write`", "`--no-git`", "`--root", "| 0 |", "| 1 |", "| 2 |"):
            self.assertIn(needle, text)


if __name__ == "__main__":
    unittest.main()
