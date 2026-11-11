#!/usr/bin/env node
/* Draws HeavyMap's own flag icons for the theme picker (spec D section 4:
 * HeavyMap's SVGs, sources recorded in the credits). Each follows its
 * official specification; all three flags are public-domain national symbols.
 *   node build/flags/make-flags.mjs  ->  web/public/flags/{us,ca,jp}.svg */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const out = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../public/flags",
);
fs.mkdirSync(out, { recursive: true });
const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><title>${title}</title>${body}</svg>\n`;

/* United States: Executive Order 10834 proportions (A=1, B=1.9, C=7/13,
 * D=0.76, E=F=0.054, G=H=0.063, K=0.0616), colours Old Glory Red and Blue. */
function us() {
  const A = 1000,
    B = 1900,
    C = (A * 7) / 13,
    D = 760,
    E = 54,
    H = 63,
    K = 61.6;
  const stripes = Array.from(
    { length: 7 },
    (_, i) =>
      `<rect y="${((2 * i * A) / 13).toFixed(2)}" width="${B}" height="${(A / 13).toFixed(2)}"/>`,
  ).join("");
  const star = (cx, cy, r) => {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const rad = i % 2 ? r * 0.382 : r;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
    });
    return `<polygon points="${pts.join(" ")}"/>`;
  };
  const stars = [];
  for (let row = 0; row < 9; row++) {
    const n = row % 2 ? 5 : 6;
    for (let j = 0; j < n; j++)
      stars.push(
        star(H * (row % 2 ? 2 + 2 * j : 1 + 2 * j), E * (row + 1), K / 2),
      );
  }
  return svg(
    B,
    A,
    `<rect width="${B}" height="${A}" fill="#fff"/><g fill="#B31942">${stripes}</g><rect width="${D}" height="${C.toFixed(2)}" fill="#0A3161"/><g fill="#fff">${stars.join("")}</g>`,
    "United States",
  );
}

/* Canada: 1:2:1 bands, 11-point maple leaf (geometry as in the public-domain
 * Wikimedia Commons file "Flag of Canada.svg"), red #D52B1E. */
function ca() {
  const leaf =
    "m4890 4430-45-863a95 95 0 0 1 111-98l859 151-116-320a65 65 0 0 1 20-73l941-762-212-99a65 65 0 0 1-34-79l186-572-542 115a65 65 0 0 1-73-38l-105-247-423 454a65 65 0 0 1-111-57l204-1052-327 189a65 65 0 0 1-91-27l-332-652-332 652a65 65 0 0 1-91 27l-327-189 204 1052a65 65 0 0 1-111 57l-423-454-105 247a65 65 0 0 1-73 38l-542-115 186 572a65 65 0 0 1-34 79l-212 99 941 762a65 65 0 0 1 20 73l-116 320 859-151a95 95 0 0 1 111 98l-45 863z";
  return svg(
    9600,
    4800,
    `<rect width="9600" height="4800" fill="#D52B1E"/><rect x="2400" width="4800" height="4800" fill="#fff"/><path fill="#D52B1E" d="${leaf}"/>`,
    "Canada",
  );
}

/* Japan: Act on National Flag and Anthem (1999): 2:3, disc diameter 3/5 of the height, centred. */
function jp() {
  return svg(
    900,
    600,
    `<rect width="900" height="600" fill="#fff"/><circle cx="450" cy="300" r="180" fill="#BC002D"/>`,
    "Japan",
  );
}

for (const [id, make] of Object.entries({ us, ca, jp }))
  fs.writeFileSync(path.join(out, `${id}.svg`), make());
console.log(
  fs
    .readdirSync(out)
    .map((f) => `${f} ${fs.statSync(path.join(out, f)).size} B`)
    .join("\n"),
);
