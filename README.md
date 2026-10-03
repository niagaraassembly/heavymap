# HeavyMap

Industrial intelligence for cross-border Niagara. This repository holds the **data registry and tooling** for deciding which public datasets HeavyMap may use: CSV tables are the source of truth, a small stdlib-only Python CLI (`hm`) validates and applies reviewed decisions, and a localhost review page lets a human make those decisions. Nothing here publishes a site or fetches data yet.

| If you are... | Start here |
|---|---|
| a human (Morgen, a reviewer, a contributor) | [`docs/for-humans/README.md`](docs/for-humans/README.md) |
| an AI agent | [`AGENTS.md`](AGENTS.md) then [`docs/for-agents/`](docs/for-agents/README.md) |
| after the product frame | [`docs/architecture/README.md`](docs/architecture/README.md): Parcel Identity Spine, Context Band Ladder, PCDP, Claim & Refusal Contract |
| looking for a folder | [`docs/FOLDER-MAP.md`](docs/FOLDER-MAP.md) |

Quick start (Python 3.9+, no installs):

```bash
./scripts/hm validate          # check every table
./scripts/hm status            # counts, decisions, gate G6
./scripts/hm demo /tmp/hm-demo # sandbox with SYNTHETIC rows to try the review UI
./scripts/hm --root /tmp/hm-demo review   # http://127.0.0.1:8765/
python3 -m unittest discover -s tests     # tests
```

Prior art (the first Niagara atlas prototype, planning sheets, old docs) is kept under [`misc/`](misc/) and is not the product root.
