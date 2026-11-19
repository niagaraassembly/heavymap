---
type: system
status: built, partly in use
evidence_date: 2026-11-18
---
Dispatch, Digest and Packet: the review chain
systems, assembly, make, dispatch, review

> Status: built and partly in use. From an approved instruction to records decided one by one, with a person at every gate.

## Dispatch
A Dispatch is the frozen instruction and time window sent to whoever does the work. It is approved before anything is fetched. One Dispatch gets one return.

## Arrival and Digest
What comes back is a set of files and a manifest: counts, coverage and limitations. At receipt everything is checked against its hash. The Digest is the record of that return. It carries the counts, the budget and numbered limitations. A Digest is accepted or rejected as a whole batch, and accepting it approves nothing else: no record, no Join, no publication.

## Packet
The Packet is an isolated workspace built from the return, where each record gets its own decision: accept, edit, reject, defer, flag, hold, exclude or needs more. Decisions are only ever appended, so the history is kept. Some need a reason and a basis.

## Evidence
Cited originals sit in a hash-checked evidence cache. A packet keeps only the assessment of a page, never the page itself.

## Backpressure
The review backlog has caps per region: three digests in review, 150 undecided records, and seven days for the oldest review. Over the cap, the system first warns. In enforcing mode it refuses to freeze a new Dispatch until the backlog clears or someone overrides it. Research cannot outrun the people reviewing it.
