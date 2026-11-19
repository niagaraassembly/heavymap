---
type: framework
status: designed
evidence_date: 2026-11-17
---
Transmission resilience: HeavyMap at 2G and at full resolution
systems, framework, performance, access

> Status: designed, starting at the low end. HeavyMap should work over the weakest connection and the oldest browser, and also offer everything at full fidelity to those who can take it.

## A permanent dimension
This is not a feature of one layer or one release. It is kept up as data and services change, at both ends of the range.

## The ladder
- **Signal.** One small text or JSON answer per question, at a stable address, for terminals, scripts, agents and very old devices. Target: one request under 5 kilobytes for one parcel or one story.
- **Lite web.** Plain HTML with system fonts and no required images, working with JavaScript off. Target: under 50 kilobytes a page, readable within 3 seconds on 2G.
- **Standard web.** The site most people see. Its size is tracked and regressions are flagged.
- **Rich.** The full map, every layer, motion and the 3D mark. No cap, and never required by the tiers below.

Every tier is a view of the same releases, never a separate truth.

## Where we start
The low end first. A parcel or a story should be reachable by someone on a weak phone connection, or by an agent that needs one fact quickly.

## The Journey itself
These pages follow the same rule. Without JavaScript, each section shows the posts saved with the site. With it, the latest posts load from where they are written.
