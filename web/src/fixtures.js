// Entirely invented records and geometry. No municipal/OSM rows are copied.
export const bands = [
  "identity",
  "land_use",
  "constraints",
  "activity_registers",
  "derived_readings",
  "share_export",
];
export const labels = {
  identity: "Identity",
  land_use: "Land & use",
  constraints: "Nature & constraints",
  activity_registers: "Registers & public claims",
  derived_readings: "Opportunity signals",
  share_export: "Take the evidence",
};
const stamp = (id, source, grade, extra = {}) => ({
  source_name: `Synthetic ${source}`,
  publisher: "HeavyMap fixture author (illustrative source role only)",
  licence: "Synthetic demonstration fixture — no source data copied",
  original_id: id,
  retrieved_on: "2026-10-17",
  observation_on: "2024-04-01",
  ...(grade === "joined" ? { join_method: "overlap" } : {}),
  ...extra,
});
const claim = (id, label, value, grade = "joined", extra = {}) => ({
  id,
  label,
  value,
  grade,
  state: "supported",
  confidence: "Illustrative confidence: review required",
  comment: "Invented example; no conclusion about real land.",
  stamp: stamp(id, label, grade),
  ...extra,
});
const refusal = (object, reason = "not_joined") => ({
  object,
  grade: "refused",
  reason,
});
const poly = (west, south, width, height) => ({
  type: "Polygon",
  coordinates: [
    [
      [west, south],
      [west + width, south],
      [west + width, south + height],
      [west, south + height],
      [west, south],
    ],
  ],
});
const sharedRefusals = () => [
  refusal("Citywide Official Plan designation", "not_in_coverage"),
];
const overlap = (id, label, value, share, extra = {}) =>
  claim(id, label, value, "joined", {
    share,
    comment:
      "Illustrative intersection / full parcel area; shares are constructed, not GIS measurements.",
    stamp: stamp(id, label, "joined", {
      method: "Synthetic intersection area / synthetic full parcel area × 100",
      inputs: { intersection_m2: (10000 * share) / 100, parcel_m2: 10000 },
      note: "Independent overlay families may overlap. Do not sum them.",
    }),
    ...extra,
  });
const areaSignal = claim(
  "SYN-COVERAGE-02",
  "Building coverage",
  "18% building footprint coverage",
  "derived",
  {
    comment:
      "82% non-building area could be a working yard, parking, access or protected land. It is not measured unused space.",
    stamp: stamp("SYN-COVERAGE-02", "footprints and parcel", "derived", {
      inputs: { clipped_footprint_union_m2: 1800, parcel_area_m2: 10000 },
      method: "1800 / 10000 × 100",
      original_units: "m²",
      observation_on: "2026-10-01",
    }),
  },
);
export const parcels = [
  {
    id: "hm:ca:on:hamilton:parcel:SYN-001",
    short: "01",
    name: "The source-class question",
    address: "SYN-001 Demonstration Way",
    center: [-79.91, 43.255],
    geometry: poly(-79.925, 43.247, 0.03, 0.016),
    lenses: ["source"],
    bands: {
      identity: {
        claims: [
          claim(
            "SYN-ID-01",
            "Parcel identity",
            "Hamilton, Ontario · parcel",
            "observed",
          ),
          claim("SYN-ROLL-01", "Roll alias", "SYN-ROLL-001", "joined", {
            stamp: stamp("SYN-ROLL-01", "roll alias", "joined", {
              join_method: "identifier",
            }),
          }),
        ],
        refusals: [],
      },
      land_use: {
        claims: [
          claim("SYN-CITY-01", "City class", "Vacant Lands", "joined", {
            state: "contested",
            comment:
              "Source-quoted classification example; competing community record retained below. HeavyMap makes no vacancy finding.",
          }),
          claim("SYN-TAX-01", "Tax class confirmed", "industrial", "joined", {
            comment:
              "Assessment class only; does not confirm current activity.",
          }),
          overlap("SYN-ZONE-01A", "Zoning", "Industrial example A", 72),
          overlap("SYN-ZONE-01B", "Zoning", "Business example B", 28),
        ],
        refusals: sharedRefusals(),
      },
      constraints: {
        claims: [
          overlap(
            "SYN-GB-01",
            "Greenbelt designation",
            "Protected countryside (example)",
            32,
          ),
          overlap(
            "SYN-NEP-01",
            "NEP designation",
            "Escarpment protection (example)",
            18,
          ),
          overlap(
            "SYN-DCA-01",
            "Development Control Area",
            "Illustrative boundary",
            22,
          ),
          overlap(
            "SYN-HCA-01",
            "Conservation regulation",
            "Illustrative HCA overlap",
            12,
          ),
        ],
        refusals: [
          refusal("Conservation Halton regulation detail", "not_in_coverage"),
        ],
      },
      activity_registers: {
        claims: [
          claim("SYN-OSM-01", "Community tag", "landuse=industrial", "joined", {
            community: true,
            state: "contested",
            comment:
              "Competing source interpretations: illustrative community tag and City class are both retained. Dates and meanings differ.",
            stamp: stamp("SYN-OSM-01", "OSM-style public input", "joined", {
              join_method: "overlap",
              observation_on: "2026-09-15",
            }),
          }),
        ],
        refusals: [refusal("Vacant Building Registry accepted match")],
      },
      derived_readings: {
        claims: [],
        refusals: [refusal("Building coverage reading")],
      },
    },
    next: "Verify the classification date and register coverage. Compare the competing community claim before drawing a conclusion.",
  },
  {
    id: "hm:ca:on:hamilton:parcel:SYN-002",
    short: "02",
    name: "Room around the footprint",
    address: "SYN-002 Demonstration Way",
    center: [-79.81, 43.225],
    geometry: poly(-79.825, 43.217, 0.03, 0.016),
    lenses: ["outdoor"],
    bands: {
      identity: {
        claims: [
          claim(
            "SYN-ID-02",
            "Parcel identity",
            "Hamilton, Ontario · parcel",
            "observed",
          ),
        ],
        refusals: [refusal("Roll alias", "not_in_coverage")],
      },
      land_use: {
        claims: [
          claim("SYN-CITY-02", "City class", "Industrial"),
          overlap("SYN-ZONE-02", "Zoning", "Industrial example A", 100),
          overlap(
            "SYN-SP-02",
            "Secondary Plan designation",
            "Employment (example)",
            65,
          ),
        ],
        refusals: [...sharedRefusals(), refusal("Tax class")],
      },
      constraints: {
        claims: [
          overlap(
            "SYN-NPCA-02",
            "Conservation regulation",
            "Illustrative NPCA overlap",
            9,
          ),
        ],
        refusals: [
          refusal("Greenbelt accepted overlay"),
          refusal("NEP accepted overlay"),
          refusal("Development Control Area accepted overlay"),
        ],
      },
      activity_registers: {
        claims: [],
        refusals: [refusal("Permit register match")],
      },
      derived_readings: {
        claims: [areaSignal],
        refusals: [refusal("Severance feasibility", "not_in_coverage")],
      },
    },
    next: "Check yard use, frontage, access and servicing with planning staff. Footprint coverage alone cannot establish severance potential.",
  },
  {
    id: "hm:ca:on:hamilton:parcel:SYN-003",
    short: "03",
    name: "At the industrial edge",
    address: "SYN-003 Demonstration Way",
    center: [-80.01, 43.2],
    geometry: poly(-80.025, 43.192, 0.03, 0.016),
    lenses: ["edge"],
    bands: {
      identity: {
        claims: [
          claim(
            "SYN-ID-03",
            "Parcel identity",
            "Hamilton, Ontario · parcel",
            "observed",
          ),
          claim("SYN-ROLL-03", "Roll alias", "SYN-ROLL-003", "joined", {
            stamp: stamp("SYN-ROLL-03", "roll alias", "joined", {
              join_method: "identifier",
            }),
          }),
        ],
        refusals: [],
      },
      land_use: {
        claims: [
          claim("SYN-CITY-03", "City class", "Rural"),
          claim("SYN-TAX-03", "Tax class (assessment)", "farm"),
          overlap("SYN-ZONE-03", "Zoning", "Rural example R", 100),
        ],
        refusals: sharedRefusals(),
      },
      constraints: {
        claims: [
          overlap(
            "SYN-GB-03",
            "Greenbelt designation",
            "Protected countryside (example)",
            100,
          ),
          overlap(
            "SYN-NEP-03",
            "NEP designation",
            "Escarpment rural area (example)",
            35,
          ),
          overlap(
            "SYN-DCA-03",
            "Development Control Area",
            "Illustrative boundary",
            35,
          ),
        ],
        refusals: [refusal("Conservation regulation accepted match")],
      },
      activity_registers: {
        claims: [],
        refusals: [refusal("Activity registers")],
      },
      derived_readings: {
        claims: [
          claim(
            "SYN-ADJ-03",
            "Industrial adjacency",
            "120 m shared boundary (illustrative)",
            "derived",
            {
              comment:
                "A geometric relationship, not a prediction of rezoning approval.",
              stamp: stamp("SYN-ADJ-03", "adjacency", "derived", {
                inputs: {
                  rural_parcel: "SYN-003",
                  industrial_neighbour: "SYN-NEIGHBOUR-003",
                  shared_boundary_m: 120,
                },
                method:
                  "Illustrative shared-boundary length between classified polygons",
                original_units: "m",
              }),
            },
          ),
        ],
        refusals: [refusal("Rezoning feasibility", "not_in_coverage")],
      },
    },
    next: "Review Greenbelt and NEP policy first, then ask planning staff about the actual permitted uses. Adjacency grants no development rights.",
  },
];
for (const parcel of parcels) {
  parcel.synthetic = true;
  parcel.grain = "parcel";
  parcel.jurisdiction = "City of Hamilton, Ontario";
  parcel.bands.identity.claims.push(
    claim(`SYN-KEY-${parcel.short}`, "Spine key", parcel.id, "observed"),
    claim(
      `SYN-ADDRESS-${parcel.short}`,
      "Civic address",
      parcel.address,
      "observed",
    ),
  );
  parcel.bands.share_export = {
    claims: [
      claim(
        `SYN-PACKET-${parcel.short}`,
        "Local evidence packet",
        "Same claims and refusals as this dossier",
        "observed",
      ),
    ],
    refusals: [],
  };
}
export const lenses = [
  {
    id: "all",
    label: "All signals",
    subtitle: "Three different reasons to look closer.",
  },
  {
    id: "source",
    label: "Source-recorded vacancy",
    subtitle: "Quoted source classes, never a HeavyMap vacancy finding.",
  },
  {
    id: "outdoor",
    label: "Outdoor-space investigation",
    subtitle: "Low footprint coverage, with yard use still unknown.",
  },
  {
    id: "edge",
    label: "Rural / industrial edge",
    subtitle: "A planning question at a shared boundary.",
  },
];
export const layerRegistry = [
  {
    id: "nature",
    label: "Nature frame",
    subtitle: "Synthetic Greenbelt, woodland & escarpment study",
    on: true,
  },
  {
    id: "regulation",
    label: "Conservation context",
    subtitle: "Illustrative regulation, distinct from natural cover",
    on: true,
  },
  {
    id: "community",
    label: "Public claims",
    subtitle: "Synthetic OSM-style input · not a live feed",
    on: false,
  },
];
export function matchesLens(parcel, lens) {
  return lens === "all" || parcel.lenses.includes(lens);
}
export function packet(parcel) {
  return {
    synthetic: true,
    notice: "Invented demonstration — no claims about real land",
    key: parcel.id,
    grain: parcel.grain,
    jurisdiction: parcel.jurisdiction,
    civic_address: parcel.address,
    geometry: parcel.geometry,
    bands: structuredClone(parcel.bands),
    next_check: parcel.next,
  };
}
export const refusalText = {
  not_joined: "Not joined — no accepted match for this parcel.",
  not_in_coverage:
    "Outside held coverage — this object is not held for this unit.",
  not_licensed: "Not licensed — this source is not permitted for this use.",
};
export function featureCollection(items) {
  return {
    type: "FeatureCollection",
    features: items.map((p) => ({
      type: "Feature",
      geometry: p.geometry,
      properties: { id: p.id, short: p.short, name: p.name, lens: p.lenses[0] },
    })),
  };
}
