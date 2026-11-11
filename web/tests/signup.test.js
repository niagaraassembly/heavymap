import test from "node:test";
import assert from "node:assert/strict";
import { MESSAGES, signupBody, validateSignup } from "../src/site/signup.js";
import { signupForm } from "../src/site/pages.js";

const desks = ["western-new-york", "niagara-brant"];
const c = {
  regions: [
    {
      slug: "western-new-york",
      name: "Western New York",
      desk: { status: "published" },
    },
    {
      slug: "niagara-brant",
      name: "Niagara–Brant",
      desk: { status: "published" },
    },
  ],
};
const configured = {
  action: "https://docs.google.com/forms/d/e/X/formResponse",
  entries: { name: "entry.1", email: "entry.2", desks: "entry.3" },
};

test("checks run in field order and need at least one known Desk (spec E 4.1)", () => {
  assert.deepEqual(validateSignup({ name: "", email: "x", desks: [] }, desks), [
    "name",
    "email",
    "desks",
  ]);
  assert.deepEqual(
    validateSignup(
      { name: "Ana", email: "ana@example.com", desks: ["elsewhere"] },
      desks,
    ),
    ["desks"],
  );
  assert.deepEqual(
    validateSignup(
      { name: "Ana", email: "ana@example.com", desks: ["niagara-brant"] },
      desks,
    ),
    [],
  );
  assert.equal(MESSAGES.desks, "Choose at least one Desk.");
});

test("the body sends one entry per Desk so the checkbox question receives each slug", () => {
  const body = signupBody(
    { name: " Ana ", email: "ana@example.com", desks: desks },
    configured.entries,
  );
  assert.equal(
    body.toString(),
    "entry.1=Ana&entry.2=ana%40example.com&entry.3=western-new-york&entry.3=niagara-brant",
  );
});

test("the form is disabled and says so until the Google Form is configured", () => {
  const html = signupForm(c, { config: { action: null, entries: {} } });
  assert.match(html, /Sign-up opens at launch/);
  assert.match(html, /<button type="submit" class="button" disabled>/);
  assert.doesNotMatch(html, /action=/);
});

test("a configured form posts without JavaScript, with the page's Desk ticked", () => {
  const html = signupForm(c, { desk: "niagara-brant", config: configured });
  assert.match(
    html,
    /action="https:\/\/docs\.google\.com\/forms\/d\/e\/X\/formResponse" method="post"/,
  );
  assert.match(
    html,
    /name="entry\.3" value="niagara-brant" data-field="desk" checked data-default/,
  );
  assert.match(
    html,
    /name="entry\.3" value="western-new-york" data-field="desk">/,
  );
  assert.doesNotMatch(html, /disabled/);
});
