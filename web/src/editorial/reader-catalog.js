import issue from "./issue-one.json" with { type: "json" };
// Deliberate inclusion rather than importing Niagara Assembly's whole Reader
// index. Only Desk reporting and HeavyMap-authored material enter this catalogue.
export const catalogue = [
  ...issue.items.map((item) => ({
    id: item.id,
    scope: "desks",
    kind: "news",
    region: "western-new-york",
    publication: "Western New York",
    date: item.date,
    title: item.headline,
    summary: item.note,
    stage: item.stage,
    place: item.place,
    sources: item.sources,
    status: "published",
    edition: "Issue One · 10 October 2026",
  })),
  {
    id: "hm-reading-the-evidence",
    scope: "heavymap",
    kind: "documentation",
    region: "heavymap",
    publication: "HeavyMap",
    date: null,
    title: "Reading the evidence",
    summary:
      "A short guide to source labels, project stages and the questions that remain open.",
    status: "preview",
    sections: [
      {
        heading: "An announcement is a stage, not an outcome.",
        text: "A new investment announcement describes an intention. It does not by itself establish that construction is complete, jobs have arrived or production has begun. Desk stories keep the source’s stage visible.",
      },
      {
        heading: "Keep different kinds of money separate.",
        text: "An investment, acquisition, research grant and contract ceiling describe different things. A ceiling sets a limit; it does not establish the amount spent. Where a local share is unknown, it stays unknown.",
      },
      {
        heading: "Source notes are part of the story.",
        text: "Disagreement and missing information belong beside the headline. Open the source links, compare what is reported and use the original dates to understand what the edition could establish.",
      },
      {
        heading: "A record is a starting point.",
        text: "HeavyMap’s mapping workspace follows the same discipline. Source-quoted classifications, joins and evidence should stay distinguishable from investigative readings. A missing record does not establish a negative finding.",
      },
    ],
  },
  {
    id: "hm-regions-and-mapping",
    scope: "heavymap",
    kind: "documentation",
    region: "heavymap",
    publication: "HeavyMap",
    date: null,
    title: "One region, two ways to explore",
    summary: "How the regional Desks and mapping workspace fit together.",
    status: "preview",
    sections: [
      {
        heading: "Read the region.",
        text: "A Desk follows investment, facilities, jobs and new ventures across a connected region. Its reporting can be available before a live mapping workspace covers that geography.",
      },
      {
        heading: "Explore the land.",
        text: "The mapping workspace opens a different view: parcels, surrounding context and the evidence behind a reading. Hamilton, Ontario is the first planned geography. The current map interaction study contains invented records only.",
      },
      {
        heading: "An independent place for each.",
        text: "Western New York and Niagara–Brant are distinct Desks. A mapping launch does not determine newsletter availability. The site gives reporting and mapping their own entry points within one HeavyMap experience.",
      },
    ],
  },
].filter((item) => ["desks", "heavymap"].includes(item.scope));
export const kindLabels = {
  news: "News",
  findings: "Findings",
  editorials: "Editorials",
  documentation: "Documentation",
  all: "All material",
};
