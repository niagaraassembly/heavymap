"""Hamilton parcel dossier: one screened lookup record per HeavyMap parcel ID.

The dossier is what the v0 front end reads when a parcel is clicked. Every
field carries its source layer, join method, confidence word and a short
source-quoted label. Output keys come from an explicit allowlist
(``heavymap.dossier.schema``); owner names, mailing addresses and legal
descriptions are never read past the loader and never written. Each record
cites ledger ``gap_id`` strings; copy lives in the manifest
(``docs/architecture/data-gaps-ledger.md``).
"""

from heavymap.dossier.schema import SCHEMA_VERSION, ScreeningError, screen_record

__all__ = ["SCHEMA_VERSION", "ScreeningError", "screen_record"]
