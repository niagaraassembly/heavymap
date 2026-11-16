/* Canonical JSON for record hashes (RFC 8785 subset). Twin of
 * industrial_atlas/dossier/canonical.py; tests/canonical-vectors.json pins both.
 * Keys sort by Unicode code point, not by JavaScript's default UTF-16 order. */

export class CanonicalError extends Error {}

const byCodePoint = (a, b) => {
  const x = Array.from(a, (c) => c.codePointAt(0));
  const y = Array.from(b, (c) => c.codePointAt(0));
  const n = Math.min(x.length, y.length);
  for (let i = 0; i < n; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return x.length - y.length;
};

function encode(v) {
  if (v === null) return "null";
  if (v === true) return "true";
  if (v === false) return "false";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new CanonicalError("NaN and infinity are not JSON");
    return Object.is(v, -0) ? "0" : String(v);
  }
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(encode).join(",") + "]";
  if (typeof v === "object") {
    const keys = Object.keys(v).sort(byCodePoint);
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + encode(v[k])).join(",") + "}";
  }
  throw new CanonicalError(`unsupported type ${typeof v}`);
}

export const canonicalString = (value) => encode(value);
export const canonicalBytes = (value) => new TextEncoder().encode(encode(value));

/** "sha256:<hex>" of the canonical bytes (Web Crypto, works in browsers and Node 20). */
export async function recordHash(value) {
  const digest = await crypto.subtle.digest("SHA-256", canonicalBytes(value));
  return (
    "sha256:" +
    [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
  );
}
