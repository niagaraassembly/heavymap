---
name: heavymap-pcdp
description: Use when working on how a HeavyMap parcel is identified, banded, displayed or claimed (Parcel Identity Spine, Context Band Ladder, PCDP surfaces, Claim & Refusal Contract), or on identifier normalisers and parcel fixtures.
---

# HeavyMap parcel frame

Thin pointer; the docs are the authority.

1. Read `docs/architecture/README.md`, then the concept doc for the task: `parcel-identity-spine.md`, `context-band-ladder.md`, `PCDP.md`, `claim-refusal-contract.md` (vocabulary in `docs/architecture/vocab/`, ADRs in `docs/architecture/adr/`).
2. Identifier work: `docs/normalization/ny-sbl*.md`, `heavymap/ny_identifiers.py`, `docs/data/README-monroe-swis-crosswalk.md`.
3. Hard rules: `docs/for-agents/HARD-RULES.md`. A claim the data cannot support is refused, not guessed; unknown stays unknown.
4. Test: `python3 -m unittest discover -s tests`. Fixtures stay synthetic and identifier-only.
5. Open product questions (`heavymap-planning/OPEN-DECISIONS.md`) are Morgen's: list them in the PR, don't settle them.
