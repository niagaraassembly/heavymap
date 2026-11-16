# Deploying heavymap.com

How the site gets from a commit to heavymap.com, who may trigger it, and how to
undo it. Read [BRANCHING.md](../BRANCHING.md) for the branch rules this sits on.
The publication rules in [for-agents/HARD-RULES.md](for-agents/HARD-RULES.md)
(rules 2 and 3) still apply: nothing identifying is shipped, and public
deployment is the owner's decision.

## Current mode: solo preview (since 2026-11-16, decision D-073)

There are no users yet and one maintainer is iterating quickly, so deployment
follows the push.

| Step | What happens |
|---|---|
| 1. Push to `main` | A push that touches `web/**` or `.github/workflows/deploy-site.yml` starts **Deploy heavymap.com**. Docs-only pushes do not deploy. |
| 2. Build | `npm ci`, `npm test`, then `node build/prerender.mjs --launch` (every build check plus the launch gates). The pinned Industrial Atlas release is checked out from `niagaraassembly/industrial-atlas-data` at the tag named in the workflow and copied into the artifact. |
| 3. Deploy | The `heavymap-public` environment publishes to GitHub Pages. It has no approval click in this mode and only accepts `main`. |
| 4. Record | The run summary lists the commit, trigger, actor, Atlas release and URL. **Actions run history is the deploy log.** |

A failed test, check or gate stops the run before step 3, so the previous site
stays up.

**Who may push `main`**
- The owner pushes directly, with no pull request.
- An agent may push `main` only with the owner's explicit approval for that
  push. There is no standing permission. Agents otherwise work on topic
  branches (see BRANCHING.md).
- `main` blocks force-pushes and deletion (ruleset "main: no force-push or
  deletion"). Nothing else is enforced; the safeguard is the approval above.

**Manual redeploy:** Actions > Deploy heavymap.com > Run workflow, on `main`.
Launch gates default to on.

**Changing the data release:** edit the `ref:` tag and `HM_ATLAS_RELEASE_DIR`
path in the workflow together. That edit is a push to `main` and deploys.

## Rolling back

Push a revert, which redeploys the previous state:

```
git revert <bad-commit>      # or a range
git push origin main
```

Do not force-push; the ruleset refuses it.

## Deploy log

Actions history is authoritative. Add a line here only for notable events
(first deploy, mode change, rollback, data release change).

| Date | Event | Commit |
|---|---|---|
| 2026-11-16 | Manual deploys from `codex/bl-104-adapter` (preview of the Hamilton map) | n/a |
| 2026-11-16 | Integration landed on `main`; push-triggered deploy and solo mode enabled | see Actions |

## Switching to team mode

Do this when a second maintainer joins or the first real user arrives. It is a
settings change plus one workflow edit; nothing else in this document changes.

- [ ] Branch ruleset on `main`: require a pull request, one approval from someone
      other than the author, and the build check; keep blocking force-push and deletion.
- [ ] Replace the placeholders in `CODEOWNERS` with real handles, split by
      `web/` and the Atlas pipeline.
- [ ] Restore a required reviewer on the `heavymap-public` environment (the
      publish approver).
- [ ] Change the workflow trigger from `push` to `release: published` (or a
      tag push) so merging no longer publishes; cut a tag to publish.
- [ ] Update the header comment of `deploy-site.yml` and this file, and record the
      change as a decision.
