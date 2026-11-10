#!/usr/bin/env node
/* One-off, reviewed conversion of Western New York Issue One into content/
 * (spec B section 7.1, decision 18). Reads pinned commits with `git show`, so
 * neither source repository's working tree is touched.
 *
 *   node build/snapshot-issue-one.mjs \
 *     --site ~/github/niagaraassembly/site --site-commit 9522b3e \
 *     --make ~/github/niagaraassembly/make --make-commit d226deb
 *
 * Writes content/items/<id>.json, content/editions/western-new-york/issue-one.json,
 * content/vocab/controlled-values.json and content/SNAPSHOT.json. Run
 * build/content-manifest.mjs afterwards. */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ISSUE_PATH = "data/wny/issue-one.json";
const VOCAB_PATH =
  "domains/regional_news/resources/research/news/schema/controlled-values.json";
const REGION_ID = "us-ny-western-new-york";
const EDITION_KEY = "western-new-york/issue-one";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const contentDir = path.join(root, "content");

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2)
    out[argv[i].replace(/^--/, "")] = argv[i + 1];
  for (const k of ["site", "site-commit", "make", "make-commit"]) {
    if (!out[k]) throw new Error(`missing --${k}`);
  }
  return out;
}

const gitShow = (repo, commit, file) =>
  execFileSync("git", ["-C", repo, "show", `${commit}:${file}`], {
    maxBuffer: 32 << 20,
  });
const gitFull = (repo, commit) =>
  execFileSync("git", ["-C", repo, "rev-parse", commit], {
    encoding: "utf8",
  }).trim();
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

function writeJson(rel, value) {
  const file = path.join(contentDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

/** One upstream event to a HeavyMap news item (spec B sections 2.2, 2.3). */
export function toNewsItem(ev, issue, provenance) {
  return {
    id: ev.id,
    type: "news",
    title: ev.headline,
    summary: ev.note,
    regions: [REGION_ID],
    publisher: `desk:${REGION_ID}`,
    status: "published",
    published_on: issue.published,
    editions: [EDITION_KEY],
    reported_on: ev.date,
    place: ev.place ?? null,
    stage: ev.stage,
    lane: ev.lane,
    event_type: ev.type,
    money: {
      amount: ev.amount ?? null,
      amount_type: ev.amount_type ?? null,
      ceiling_amount: ev.ceiling_amount ?? null,
      regional_amount: ev.regional_amount ?? null,
      currency: ev.currency ?? null,
    },
    jobs: { added: ev.jobs_added ?? null, lost: ev.jobs_lost ?? null },
    flags: ev.flags ?? [],
    conflicts: ev.conflicts ?? [],
    stage_history: ev.stage_history ?? [],
    incentive: ev.incentive ?? null,
    next_step: ev.next_step ?? null,
    county: ev.county ?? null,
    county_source: ev.county_source ?? null,
    districts: ev.districts ?? null,
    entity:
      ev.entity_id || ev.entity_name
        ? { id: ev.entity_id ?? null, name: ev.entity_name ?? null }
        : null,
    sources: (ev.sources ?? []).map((s) => ({
      article_id: s.article_id ?? null,
      title: s.title ?? null,
      publisher: s.publisher ?? null,
      url: s.url ?? null,
      kind: s.kind ?? null,
    })),
    corrections: [],
    provenance: {
      ...provenance,
      upstream_id: ev.id,
      candidate_id: ev.candidate_id ?? null,
      review_state: ev.review_state,
      publish_status: ev.publish_status,
    },
  };
}

/** The original's Mentions panel: one entry per name and organisation, for
 *  published items only, as the source site's mentionsFor() groups them. */
export function toMentions(people, publishedIds) {
  const byKey = new Map();
  for (const p of people ?? []) {
    if (!p.name || !publishedIds.has(p.event_id)) continue;
    const key = `${p.name}|${p.organization ?? ""}`;
    const entry = byKey.get(key) ?? {
      name: p.name,
      role: p.role ?? null,
      organization: p.organization ?? null,
      events: [],
      sources: [],
    };
    if (!entry.events.includes(p.event_id)) entry.events.push(p.event_id);
    if (p.url && !entry.sources.some((s) => s.url === p.url))
      entry.sources.push({ source: p.source ?? null, url: p.url });
    byKey.set(key, entry);
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function main() {
  const a = args(process.argv.slice(2));
  const siteCommit = gitFull(a.site, a["site-commit"]);
  const makeCommit = gitFull(a.make, a["make-commit"]);
  const issueBuf = gitShow(a.site, siteCommit, ISSUE_PATH);
  const vocabBuf = gitShow(a.make, makeCommit, VOCAB_PATH);
  const data = JSON.parse(issueBuf);
  const issue = data.issues.find((i) => i.id === "WNY-2026-001");
  if (!issue) throw new Error("WNY-2026-001 not in source");

  const provenance = {
    source: "niagaraassembly/site",
    commit: siteCommit,
    path: ISSUE_PATH,
    upstream: data.source ?? null,
  };
  const byId = new Map(data.items.map((ev) => [ev.id, ev]));
  const eligible = [];
  for (const id of issue.events) {
    const ev = byId.get(id);
    if (!ev)
      throw new Error(`${id} listed in the issue but missing from items`);
    // Eligibility (spec B section 8.1): approved review and approved or published status.
    if (
      ev.review_state !== "approved" ||
      !["approved", "published"].includes(ev.publish_status)
    ) {
      throw new Error(
        `${id} is not approved (${ev.review_state}/${ev.publish_status})`,
      );
    }
    if (ev.lane === "excluded") throw new Error(`${id} is in lane excluded`);
    eligible.push(ev);
  }

  for (const ev of eligible)
    writeJson(`items/${ev.id}.json`, toNewsItem(ev, issue, provenance));
  writeJson(`editions/${EDITION_KEY}.json`, {
    key: EDITION_KEY,
    desk: REGION_ID,
    slug: "issue-one",
    title: issue.title,
    upstream_id: issue.id,
    status: "published",
    complete: true,
    coverage: { start: issue.coverage_start, end: issue.coverage_end },
    published_on: issue.published,
    summary: issue.summary,
    items: eligible.map((ev) => ev.id),
    mentions: toMentions(data.people, new Set(eligible.map((ev) => ev.id))),
    provenance,
  });
  fs.mkdirSync(path.join(contentDir, "vocab"), { recursive: true });
  fs.writeFileSync(
    path.join(contentDir, "vocab/controlled-values.json"),
    vocabBuf,
  );
  writeJson("SNAPSHOT.json", {
    schema: 1,
    note: "v1 shortcut: reviewed snapshot behind an export-shaped loader (spec B section 7.1). Not the MAKE/Publish export.",
    inputs: [
      {
        repo: "niagaraassembly/site",
        commit: siteCommit,
        path: ISSUE_PATH,
        sha256: sha256(issueBuf),
        generated_at: data.generated_at ?? null,
      },
      {
        repo: "niagaraassembly/make",
        commit: makeCommit,
        path: VOCAB_PATH,
        sha256: sha256(vocabBuf),
      },
    ],
    produced: { items: eligible.length, editions: [EDITION_KEY] },
    tool: "web/build/snapshot-issue-one.mjs",
  });
  console.log(
    `snapshot: ${eligible.length} items, 1 edition, vocab ${makeCommit.slice(0, 7)}`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
