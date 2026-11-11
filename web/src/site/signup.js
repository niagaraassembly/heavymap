/* Per-Desk signup (spec E section 4): checks, the Google Form body, and the
 * form behaviour. The browser stores nothing about subscriptions. */

export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const MESSAGES = {
  name: "Add your name.",
  email: "Add an email address, like name@example.com.",
  desks: "Choose at least one Desk.",
  sending: "Subscribing…",
  done: "Subscribed. Check your inbox to confirm.",
  network: "That didn't go through. Check your connection and try again.",
  closed: "Sign-up opens at launch.",
};

/** Problems in field order: "name", "email", "desks". */
export function validateSignup({ name, email, desks }, knownDesks) {
  const errors = [];
  if (!String(name ?? "").trim()) errors.push("name");
  if (!EMAIL.test(String(email ?? "").trim())) errors.push("email");
  if (!(desks ?? []).some((d) => knownDesks.includes(d))) errors.push("desks");
  return errors;
}

/** The form body: one entry per Desk, so the Google checkbox question gets each slug. */
export function signupBody({ name, email, desks }, entries) {
  const body = new URLSearchParams();
  body.append(entries.name, String(name).trim());
  body.append(entries.email, String(email).trim());
  for (const d of desks) body.append(entries.desks, d);
  return body;
}

export function mountSignup(
  form,
  {
    action,
    entries,
    knownDesks,
    post = (url, body) => fetch(url, { method: "POST", mode: "no-cors", body }),
  },
) {
  const status = form.querySelector('[role="status"]');
  const field = (f) => form.querySelector(`[data-field="${f}"]`);
  const fieldFor = {
    name: field("name"),
    email: field("email"),
    desks: field("desk"),
  };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!action) {
      status.textContent = MESSAGES.closed;
      return;
    }
    const values = {
      name: field("name").value,
      email: field("email").value,
      desks: [...form.querySelectorAll('[data-field="desk"]:checked')].map(
        (i) => i.value,
      ),
    };
    const errors = validateSignup(values, knownDesks);
    form
      .querySelectorAll("[aria-invalid]")
      .forEach((el) => el.removeAttribute("aria-invalid"));
    if (errors.length) {
      status.dataset.state = "error";
      status.textContent = MESSAGES[errors[0]];
      const first = fieldFor[errors[0]];
      if (errors[0] !== "desks") first.setAttribute("aria-invalid", "true");
      first.focus();
      return;
    }
    status.dataset.state = "sending";
    status.textContent = MESSAGES.sending;
    try {
      // no-cors: "done" means the form received it; Kit failures are caught by the daily check (spec E section 6).
      await post(action, signupBody(values, entries));
      form.reset();
      for (const box of form.querySelectorAll(
        '[data-field="desk"][data-default]',
      ))
        box.checked = true;
      status.dataset.state = "done";
      status.textContent = MESSAGES.done;
    } catch {
      status.dataset.state = "error";
      status.textContent = MESSAGES.network;
    }
  });
}
