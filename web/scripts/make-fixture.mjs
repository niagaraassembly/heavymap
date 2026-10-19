// Minimal deterministic PMTiles v3/MVT writer, solely for three invented parcels.
// No downloads, GIS extracts, geocoding or real parcel geometry.
import { writeFileSync } from "node:fs";
import { zxyToTileId } from "pmtiles";
import { parcels } from "../src/fixtures.js";
import { ID_FIELD } from "../src/contract.js";
const v = (n) => {
  const a = [];
  do {
    let b = n % 128;
    n = Math.floor(n / 128);
    if (n) b |= 128;
    a.push(b);
  } while (n);
  return Buffer.from(a);
};
const field = (n, data) => Buffer.concat([v(n * 8 + 2), v(data.length), data]);
const uint = (n, value) => Buffer.concat([v(n * 8), v(value)]);
const str = (n, value) => field(n, Buffer.from(value));
const z = 8,
  x = 71,
  y = 93,
  extent = 4096;
const point = ([lon, lat]) => [
  Math.round((((lon + 180) / 360) * 2 ** z - x) * extent),
  Math.round(
    (((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) *
      2 ** z -
      y) *
      extent,
  ),
];
const zig = (n) => (n < 0 ? -n * 2 - 1 : n * 2);
const keys = [ID_FIELD, "short", "name", "lens"];
const values = [];
const features = parcels.map((p, index) => {
  const tags = [];
  keys.forEach((k, i) => {
    tags.push(i, values.length);
    values.push(k === "lens" ? p.lenses[0] : k === ID_FIELD ? p.id : p[k]);
  });
  const ring = p.geometry.coordinates[0].slice(0, -1).reverse().map(point);
  let px = 0,
    py = 0;
  const geom = [9];
  ring.forEach(([nx, ny], i) => {
    if (i === 1) geom.push(26);
    geom.push(zig(nx - px), zig(ny - py));
    px = nx;
    py = ny;
  });
  geom.push(15);
  return field(
    2,
    Buffer.concat([
      uint(1, index + 1),
      field(2, Buffer.concat(tags.map(v))),
      uint(3, 3),
      field(4, Buffer.concat(geom.map(v))),
    ]),
  );
});
const layer = Buffer.concat([
  str(1, "parcels"),
  ...features,
  ...keys.map((k) => str(3, k)),
  ...values.map((value) => field(4, str(1, value))),
  uint(5, extent),
  uint(15, 2),
]);
const tile = field(3, layer);
const dir = Buffer.concat([
  v(1),
  v(zxyToTileId(z, x, y)),
  v(1),
  v(tile.length),
  v(1),
]);
const metadata = Buffer.from(
  JSON.stringify({
    name: "HeavyMap synthetic parcels",
    description: "Invented geometry only",
    attribution: "HeavyMap synthetic fixture",
    vector_layers: [
      {
        id: "parcels",
        fields: {
          [ID_FIELD]: "String",
          short: "String",
          name: "String",
          lens: "String",
        },
        minzoom: z,
        maxzoom: z,
      },
    ],
  }),
);
const header = Buffer.alloc(127);
header.write("PMTiles");
header[7] = 3;
for (const [offset, value] of [
  [8, 127],
  [16, dir.length],
  [24, 127 + dir.length],
  [32, metadata.length],
  [40, 127 + dir.length + metadata.length],
  [48, 0],
  [56, 127 + dir.length + metadata.length],
  [64, tile.length],
  [72, 1],
  [80, 1],
  [88, 1],
])
  header.writeBigUInt64LE(BigInt(value), offset);
header[96] = 1;
header[97] = 1;
header[98] = 1;
header[99] = 1;
header[100] = z;
header[101] = z;
for (const [offset, value] of [
  [102, -80.03],
  [106, 43.19],
  [110, -79.79],
  [114, 43.27],
  [119, -79.91],
  [123, 43.23],
])
  header.writeInt32LE(Math.round(value * 1e7), offset);
header[118] = 10;
const archive = Buffer.concat([header, dir, metadata, tile]);
writeFileSync(
  new URL("../public/synthetic-parcels.pmtiles", import.meta.url),
  archive,
);
console.log(
  `Synthetic PMTiles: ${archive.length} bytes, 3 invented polygons, one z8 tile (${x}/${y}).`,
);
