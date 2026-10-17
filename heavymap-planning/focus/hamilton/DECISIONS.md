# Hamilton decisions log

This log records decisions as they are made. Each one is tagged **firm** or **provisional**.

- A **provisional** entry is a soft default. It can be revisited without ceremony.
- Promote a provisional entry to **firm** when work depends on it.
- Firm decisions that outlive Hamilton graduate into `docs/` or an ADR.

Format: `date | firm/provisional | topic | decision | source (chat/issue) | revisit trigger`

2026-10-17 | firm | geography | Hamilton is the first illuminated geography | chat (Morgen) | Hamilton graduates
2026-10-17 | firm | hosting | GitHub Pages, public, no password | chat (Morgen) | Pages size/bandwidth limits hit; data needing protection
2026-10-17 | firm | sequencing | Front end comes later | chat (Morgen) | data layers and registry ready
2026-10-17 | provisional | tax class | Tax class cross-confirms land nature; may surface as "Tax class confirmed" (wording provisional) | chat; NA-270 | wording review before any UI
2026-10-17 | firm | identity | HeavyMap ID registry with permanent IDs; geometry fingerprint and roll number are matching aids only | chat; NA-270 | registry design review
2026-10-17 | firm | parcel join | Centre-point join now; offset fix deferred to NA-276 | chat; NA-270, NA-276 | joins needing area accuracy
2026-10-17 | provisional | roll numbers | Kept as registry aliases; utility unclear | chat; NA-270 | a use case appears, or a licence/public-display decision
2026-10-17 | firm | conservation | Halton (Conservation Halton) is a named gap; use the Waterloo-hosted GRCA copy | chat; NA-270 | CH endpoint found or provided
2026-10-17 | firm (rule) / provisional (wording) | vacant wording | Quoted source classes allowed, e.g. "City class: Vacant Lands" | chat; NA-270 | wording review before any UI
2026-10-17 | firm | catalog | All found datasets are added to the catalog | chat; NA-270 (cloud agent PR underway) | —
2026-10-17 | firm | plan overlays | Greenbelt Plan designation, NEP designation and Development Control Area joined to every parcel by overlay, each with its area share (per-parcel data, not display-only) | chat; NA-270 | —
2026-10-17 | provisional | multi-zone parcels | Store every intersecting zone with its area share; colour the map by the dominant zone; the dossier explains the rest | chat | front-end design
2026-10-17 | provisional | roll-number display | Open: build-side vs public. Leaning toward surfacing tax class, not the roll number | chat | before any public data build (note PR 61's password-protected condition)
2026-10-17 | firm | roll-number display | Roll numbers and tax class public in Ontario; owner/personal info excluded (dropped at pull time). Supersedes the provisional entry above | chat (Morgen); PR 61; NA-270 | —
2026-10-17 | firm | data handling | Pull all fields incl. owner/identifying info; screen identifying info from public view at publish boundary; roll numbers and tax class public in Ontario. Supersedes the earlier "dropped at pull time" wording | chat (Morgen); PR 61; NA-270 | access_tier values decided
2026-10-17 | firm | civic addresses | Parcel civic (street) addresses are public, alongside roll numbers and tax class; Owner, legal description (Legal_Txt) and other personal info stay screened. Morgen: "Yes, show addresses" | chat (Morgen); PR 61; NA-270 | —
2026-10-17 | provisional | OP designation source | Use Secondary Plan Land Use (PolicyPlanning/MapServer/6, retired plans filtered, dissolved by designation) and Employment Lands (FeatureServer/2) now | OP-DESIGNATION-SOURCES.md; PR 62 | confirm with Morgen
2026-10-17 | provisional | citywide OP designation | Named gap: no public UHOP E-1 / RHOP D layer. Options: request the internal layer from the City; vector-extract the schedule PDFs (~6–7 person-days; Teranet notice recorded, not a gate) | OP-DESIGNATION-SOURCES.md | choose option
