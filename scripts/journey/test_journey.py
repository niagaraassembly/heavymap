"""Run: python3 scripts/journey/test_journey.py  (plain asserts; no dependencies)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import journey as j  # noqa: E402
import working_paper as w  # noqa: E402

URLS = ["https://elsegundo.org/home/showdocument?id=1", "https://www.arcgis.com/home/item.html?id=6a3"]
PATHS = ["file:///home/mp/x", "host:/home/mp/x", "PATH=a:/home/mp/bin", "see `/home/mp/na/x`",
         "http://x.org/a and /home/mp/y", "deb:/fast/code/x", "~/na/local-data/a"]


def test_web_addresses_survive_cleaning_and_pass():
    for u in URLS:
        assert w.clean(u)[0] == u, u
        assert j.check(u)[0] == "pass", u


def test_local_paths_are_cleaned_and_blocked():
    for t in PATHS:
        cleaned = w.clean(t)[0]
        assert "/home/" not in cleaned and "/fast/" not in cleaned and "~/na" not in cleaned, (t, cleaned)
    for t in PATHS[:5]:
        assert j.check(t)[0] == "blocked", t


def test_public_repo_allowlist_is_whole_name():
    assert j.check("niagaraassembly/heavymap")[0] == "pass"
    assert j.check("niagaraassembly/heavymap-secret2")[0] == "blocked"


def test_tables_become_lists():
    post = j.parse_post("T\ntag\n\n| a | b |\n|---|---|\n| 1 | 2 |\n")
    assert post["body"][0]["tag"] == "ul"


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn(); print("ok", name)
