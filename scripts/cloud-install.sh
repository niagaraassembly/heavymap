#!/usr/bin/env bash
# Cursor cloud Build step for heavymap (environment E3). Idempotent: safe to rerun on a prepared disk.
# The repo is Python 3 standard library only (no requirements file, no package.json), so nothing is installed.
# It checks the runtime, byte-compiles the package and scripts, and runs the fast offline checks.
# It never pulls data: pulled data stays local in git-ignored local-data/ (docs/for-agents/HARD-RULES.md).
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'PY'
import sys
if sys.version_info < (3, 10):
    sys.exit("python3 >= 3.10 required, found %s" % sys.version.split()[0])
print("python3", sys.version.split()[0])
PY
PYTHONPYCACHEPREFIX="${TMPDIR:-/tmp}/heavymap-pycache" python3 -m compileall -q heavymap scripts tests >/dev/null
PYTHONPYCACHEPREFIX="${TMPDIR:-/tmp}/heavymap-pycache" python3 -m unittest discover -s tests -q
python3 scripts/check_index_paths.py
echo "cloud-install: ok"
