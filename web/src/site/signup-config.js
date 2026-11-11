/* The HeavyMap signup Google Form (spec E section 4, decision 51).
 *
 * TO FILL IN after creating the form (web/apps-script/README.md, step 2):
 *   action:  the form's ".../formResponse" URL
 *   entries: each question's entry id, read from FB_PUBLIC_LOAD_DATA_ in the
 *            live form's page source (as niagaraassembly/site docs/SETUP.md does)
 *
 * While action is null the form renders disabled with "Sign-up opens at
 * launch", and the launch build check (build step 7) fails. These values are
 * public form ids, not secrets. */
export const SIGNUP = {
  action: null,
  entries: { name: null, email: null, desks: null },
  /* Decision 70: launch with the form shown disabled. Delete this line once
   * action and entries are filled in, so the launch gate checks them again. */
  closedAtLaunch: true,
};
