# HeavyMap signup: what Morgen sets up (spec E section 7)

Everything here is done by hand, by Morgen, in Kit, Google and GitHub. Agents don't touch these accounts or their keys.

## 1. Kit (the existing Niagara Assembly account, decision 44)

1. Create the tags `hm-desk-western-new-york` and `hm-desk-niagara-brant`.
2. For each Desk, set up a link that removes only that Desk's tag (decision 43), for use as "Stop <Desk> emails" in that Desk's emails. Confirm the mechanism in Kit's documentation first; spec E section 3 flags it as unverified.
3. On launch day, bulk-add both Desk tags to everyone tagged `na-list` (decision 45).
4. Set the sender name for HeavyMap broadcasts to "HeavyMap" (decision 50).

## 2. Google Form and Sheet (decision 51)

1. Create a Google Form, "HeavyMap signup", with exactly these questions:
   - **Name** (short answer)
   - **Email** (short answer)
   - **Desks** (checkboxes) with the options `western-new-york` and `niagara-brant`, typed exactly like that
2. Link it to a new response Sheet.
3. Open the live form, read each question's `entry.<number>` from `FB_PUBLIC_LOAD_DATA_` in the page source, then put the `.../formResponse` URL and the three entry ids in `web/src/site/signup-config.js`. Those are public form ids, not secrets.

## 3. Apps Script

1. In the response Sheet: Extensions > Apps Script. Paste `heavymap-join.gs` as the only script file and save.
2. Project Settings > Script Properties: set `GITHUB_TOKEN`, `KIT_API_KEY` and `KIT_FORM_ID`.
3. Run `runSelfTest` once. It fails if a property or a Desk tag is missing.
4. Triggers:
   - `onFormSubmit`: From spreadsheet > On form submit.
   - `dailyKitCheck`: Time-driven > Day timer > 8am to 9am (decision 53). Record this job in `~/machine-flows/inventory/schedules/jobs.csv`.
5. The GitHub issue label `heavymap-signup` must exist in `niagaraassembly/crm`.

## 4. Check (spec E section 7 step 5)

Send one test signup per Desk from the site and confirm:
- the private issue;
- the Kit tag;
- the confirmation email.

Then test one Desk's stop link, and check that the other Desk's tag stays.
