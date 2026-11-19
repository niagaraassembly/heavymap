---
type: system
status: built for research records; map data planned
evidence_date: 2026-11-18
---
Join, Bay and Promote: how facts enter the store
systems, assembly, make, join

> Status: built for reviewed research records. Map data still joins outside it, and bringing it in is planned. Facts enter our store through exactly one door.

## Join
A Join is a proposal of exact changes to the store, built from records already decided. It lists whole tables: the store's existing rows and the new ones, bound to hashes. It is reviewed on its own, separately from the records and the digest. If any reviewed input, output or hash changes, the affected approval no longer holds.

## Bay
An accepted Join can be staged into a Bay: an isolated copy of the store with the changes applied. A Bay is not a merge into anything. It is a place to look before committing.

## Promote
Promote applies a Join's writes. It shows a plan first. The owner checks the plan's hash, then applies. It runs against a rehearsal copy of the store, and switching the live store needs a separate owner step.

## Edition and Publication
Editions are drafts built from a verified Bay, as Markdown, web pages or email. Publication prepares drafts from a Bay and an Edition. Publishing is always a human push, never automatic.

## Map data is not there yet
The parcel spine, overlay areas and road and rail distances in this Journey are joined by the Industrial Atlas's own code, with its own checks and immutable releases. They do not yet pass through Join. The plan is to bring them in as a typed extension of Join, so a map change gets the same exact change-set and the same separate review as a research record.
