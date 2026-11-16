/* Translate schema 2 Industrial Atlas records into the HeavyMap dossier view model.
 * Data records contain tokens and provenance only; all display wording comes
 * through the verified label lookup supplied by the caller. */

const BAND_ORDER = [
  "identity",
  "land_use",
  "constraints",
  "activity_registers",
  "derived_readings",
  "share_export",
];

const label = (labels, key, params = {}, fallback = key) => {
  const result = labels?.lookup?.(key, params);
  return result && !result.missing ? result.text : fallback;
};

const sourceLabel = (labels, source) =>
  label(labels, `dossier.source.${source}`, {}, source);

const gradeLabel = (labels, grade) =>
  grade ? label(labels, `dossier.grade.${grade}`, {}, grade) : "";

function stampFor(labels, provenance, extra = {}) {
  const source = provenance?.src ?? "";
  const join = provenance?.join ?? "";
  const confidence = provenance?.conf ?? "";
  const stamp = {
    source_id: source,
    source: sourceLabel(labels, source),
    join_method: join ? label(labels, `states.join.${join}`, {}, join) : "",
    confidence: label(labels, `states.conf.${confidence}`, {}, confidence),
    retrieved_on: label(labels, "dossier.provenance.not_yet_captured", {}, "Not yet captured"),
    licence: label(labels, "dossier.provenance.not_yet_captured", {}, "Not yet captured"),
    archive_reference: label(labels, "dossier.provenance.not_yet_captured", {}, "Not yet captured"),
    ...extra,
  };
  const stampLabels = Object.fromEntries(
    Object.keys(stamp).map((key) => [
      key,
      label(labels, `dossier.stamp.${key}`, {}, key.replaceAll("_", " ")),
    ]),
  );
  return { stamp, stampLabels };
}

function claim(labels, { id, labelKey, labelFallback, value, grade, provenance, extraStamp = {}, share, areaM2 }) {
  return {
    id,
    label: label(labels, labelKey, {}, labelFallback),
    value: String(value),
    grade: gradeLabel(labels, grade),
    confidence: provenance?.conf
      ? label(labels, `states.conf.${provenance.conf}`, {}, provenance.conf)
      : "",
    comment: "",
    ...stampFor(labels, provenance, extraStamp),
    ...(share === undefined ? {} : { share, m2: areaM2 }),
  };
}

function stateRow(labels, labelFallback) {
  const text = label(labels, "dossier.provenance.not_yet_captured", {}, "Not yet captured");
  return {
    id: "not-yet-captured",
    label: labelFallback,
    value: text,
    kind: "state",
  };
}

function refusal(labels, object, reason) {
  const fallback = {
    not_joined: "Not joined — no accepted match for this parcel.",
    not_in_coverage: "Outside held coverage — this object is not held for this unit.",
    not_licensed: "Not licensed — this source is not permitted for this use.",
  }[reason] ?? reason;
  return { object, reason, text: label(labels, `states.refusal.${reason}`, {}, fallback) };
}

/**
 * Adapt one schema 2 core record and its optional detail record.
 * `labels` is the result of `createLabels`/`loadLabels`.
 */
export function adaptDossierRecord(core, detail, labels) {
  if (!core || typeof core.key !== "string" || !core.key.startsWith("ia:")) {
    throw new TypeError("A schema 2 Industrial Atlas core record is required");
  }
  const fullAddresses = detail?.addresses_full ?? core.addresses.items;
  const bands = Object.fromEntries(BAND_ORDER.map((name) => [name, { claims: [], refusals: [] }]));
  const identity = bands.identity.claims;

  identity.push(
    claim(labels, {
      id: `${core.key}#/key`,
      labelKey: "dossier.field.spine_key",
      labelFallback: "Spine key",
      value: core.key,
      grade: "observed",
      provenance: core.area,
      extraStamp: { record_path: "/key" },
    }),
    claim(labels, {
      id: `${core.key}#/area`,
      labelKey: "dossier.field.area",
      labelFallback: "Parcel area",
      value: `${core.area.value} ${core.area.unit}`,
      grade: "observed",
      provenance: core.area,
      extraStamp: { record_path: "/area/value", crs: core.area.crs },
    }),
    claim(labels, {
      id: `${core.key}#/coverage`,
      labelKey: "dossier.field.roll_coverage",
      labelFallback: "Assessment roll coverage",
      value: label(
        labels,
        `states.coverage.${core.coverage.status}`,
        { n: core.roll.filter((item) => item.arn && item.flag !== "placeholder").length },
        core.coverage.status,
      ),
      grade: core.coverage.grade,
      provenance: core.coverage,
      extraStamp: { record_path: "/coverage/status", provisional: core.coverage.provisional },
    }),
  );

  for (const [index, item] of fullAddresses.entries()) {
    identity.push(
      claim(labels, {
        id: item.id,
        labelKey: "dossier.field.civic_address",
        labelFallback: "Civic address",
        value: item.unit ? `${item.text}, ${item.unit}` : item.text,
        grade: "joined",
        provenance: { src: core.addresses.src, join: item.join, conf: item.conf },
        extraStamp: { record_path: `/addresses/items/${index}`, address_id: item.id },
      }),
    );
  }
  identity.push(
    claim(labels, {
      id: `${core.key}#/addresses/count`,
      labelKey: "dossier.field.address_count",
      labelFallback: "Address record count",
      value: label(labels, "dossier.addresses", { n: core.addresses.count }, `${core.addresses.count} address records`),
      grade: "observed",
      provenance: { src: core.addresses.src, join: core.addresses.join, conf: "" },
      extraStamp: { record_path: "/addresses/count" },
    }),
  );
  if (!core.addresses.complete && !detail?.addresses_full) {
    identity.push(stateRow(labels, label(labels, "dossier.field.addresses", {}, "Addresses")));
  }

  for (const [index, item] of core.roll.entries()) {
    if (item.arn && item.flag !== "placeholder") {
      identity.push(
        claim(labels, {
          id: `${core.key}#/roll/${index}/arn`,
          labelKey: "dossier.field.assessment_roll",
          labelFallback: "Assessment roll",
          value: item.arn,
          grade: item.grade,
          provenance: item,
          extraStamp: { record_path: `/roll/${index}/arn`, method: item.method, iou: item.iou, other_parcels: item.other_parcels },
        }),
      );
    }
    if (item.roll_address) {
      identity.push(
        claim(labels, {
          id: `${core.key}#/roll/${index}/roll_address`,
          labelKey: "dossier.field.roll_address",
          labelFallback: "Assessment roll address",
          value: item.roll_address,
          grade: item.grade,
          provenance: item,
          extraStamp: { record_path: `/roll/${index}/roll_address`, method: item.method },
        }),
      );
    }
    if (item.property_code?.code) {
      const family = item.property_code.family;
      const familyPart = family
        ? label(labels, "dossier.property_code_family_part", { family: label(labels, `dossier.property_code.family.${family}`, {}, family) }, ` (${family})`)
        : "";
      const value = label(labels, "dossier.property_code", { code: item.property_code.code, family_part: familyPart });
      bands.land_use.claims.push(
        claim(labels, {
          id: `${core.key}#/roll/${index}/property_code`,
          labelKey: "dossier.field.property_code",
          labelFallback: "Source property code",
          value,
          grade: item.grade,
          provenance: item.property_code,
          extraStamp: { record_path: `/roll/${index}/property_code`, method: item.method },
        }),
      );
    }
  }
  if (!bands.land_use.claims.length) {
    bands.land_use.claims.push(stateRow(labels, label(labels, "dossier.field.property_code", {}, "Source property code")));
  }

  for (const [index, row] of core.overlays.rows.entries()) {
    const layerName = label(labels, `layers.${row.layer}.name`, {}, row.layer);
    const value = label(labels, `layers.${row.layer}.row`, { name: layerName, class: row.class }, `${layerName}: ${row.class}`);
    const pointer = `/overlays/rows/${index}`;
    bands.constraints.claims.push(
      claim(labels, {
        id: `${core.key}#${pointer}`,
        labelKey: "dossier.field.overlay",
        labelFallback: "Overlay",
        value,
        grade: "joined",
        provenance: { src: core.overlays.src, join: core.overlays.join, conf: "" },
        extraStamp: {
          record_path: pointer,
          source_feature_id: detail?.feature_ids?.[pointer] ?? label(labels, "dossier.provenance.not_yet_captured", {}, "Not yet captured"),
          area_m2: row.area_m2,
          sliver: row.sliver,
        },
        share: row.share,
        areaM2: row.area_m2,
      }),
    );
  }
  if (!bands.constraints.claims.length) {
    bands.constraints.claims.push(
      claim(labels, {
        id: `${core.key}#/overlays/row_count`,
        labelKey: "dossier.field.overlay_count",
        labelFallback: "Overlay rows",
        value: label(labels, "dossier.overlays", { n: core.overlays.row_count }, `${core.overlays.row_count} overlay rows`),
        grade: "observed",
        provenance: core.overlays,
        extraStamp: { record_path: "/overlays/row_count" },
      }),
      stateRow(labels, label(labels, "dossier.field.refusal_state", {}, "Refusal state")),
    );
  }

  const status = core.coverage.status;
  if (status === "not_covered") {
    bands.identity.refusals.push(refusal(labels, "Assessment roll", "not_in_coverage"));
  } else if (status === "in_coverage_unmatched" || status === "arn_invalid") {
    bands.identity.refusals.push(refusal(labels, "Assessment roll", "not_joined"));
  }

  if (core.gaps.length) {
    identity.push(
      claim(labels, {
        id: `${core.key}#/gaps`,
        labelKey: "dossier.field.gap_codes",
        labelFallback: "Data gap codes",
        value: core.gaps.join(" · "),
        grade: "observed",
        provenance: core.area,
        extraStamp: { record_path: "/gaps" },
      }),
    );
  }

  bands.activity_registers.claims.push(stateRow(labels, label(labels, "dossier.field.activity_registers", {}, "Activity registers")));
  bands.derived_readings.claims.push(stateRow(labels, label(labels, "dossier.field.derived_readings", {}, "Derived readings")));
  bands.share_export.claims.push(stateRow(labels, label(labels, "dossier.field.share_export", {}, "Share and export")));

  return {
    id: core.key,
    short: core.key.slice(-2),
    name: label(labels, "dossier.field.parcel", {}, "Parcel"),
    address: fullAddresses[0]?.text ?? label(labels, "dossier.provenance.not_yet_captured", {}, "Not yet captured"),
    grain: label(labels, "dossier.field.geometry_grain", {}, "parcel"),
    jurisdiction: label(labels, "dossier.jurisdiction.hamilton", {}, "City of Hamilton, Ontario"),
    synthetic: false,
    bands,
    bandOrder: BAND_ORDER,
    bandLabels: Object.fromEntries(BAND_ORDER.map((name) => [name, label(labels, `dossier.band.${name}`, {}, name)])),
    next: null,
    dataGaps: [...core.gaps],
  };
}
