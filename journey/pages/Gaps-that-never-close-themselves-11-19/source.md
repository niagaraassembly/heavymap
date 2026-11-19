---
type: system
status: built
evidence_date: 2026-11-18
---
Gaps that never close themselves
systems, assembly, gaps, framework

> Status: built. Everything we could not find, could not reach or could not confirm is written down, and stays written down until a rule says otherwise.

## What a gap records
Each gap has a type, a priority, a cost estimate and a closing rule. Types include a source we could not fetch, an event that has gone stale, a field a source does not publish, and coverage that stops at a boundary.

## Nothing closes on its own
A gap closes only when its rule is met: a new source, a successful re-check, a confirmed answer. A gap that quietly disappeared would make the record look more complete than it is.

## No circumvention
Some sources refuse automated access: a 403 response, a captcha, a robots rule, a block by country. We record the refusal as a gap and move on. We never work around it.

## Watching for change
Sources being watched are checked when they fall due. An unchanged source records only the check. A changed one records a gap and keeps a new copy. A failed fetch records a gap of its own. The check never decides what a change means; that is left to review.

## Revisits
Events have a ladder of revisit dates. When a date passes without a stage update, a stale-event gap opens. Closing it moves the next date along the ladder.
