# Branching

One long-lived branch, `main`, and short-lived topic branches. Publishing is a
separate step; see [docs/DEPLOY.md](docs/DEPLOY.md).

## Rules

1. **`main` is always releasable.** It builds and passes `npm test` and the Python
   tests.
2. **Topic branches are short-lived** (days, not weeks) and **named after the
   Linear ticket**: `na-<number>-<short-slug>`, lower case, for example
   `na-412-dossier-sidebar`. Do not put a tool or person in the name; that goes
   in the PR and the Linear issue. Open work with no ticket yet: get one first.
3. **One owner per branch or worktree.** Others may review; they do not write to
   it concurrently (see the
   [working agreement](heavymap-planning/WORKING-AGREEMENT.md)).
4. **Keep branches current.** Merge or rebase `main` in at least weekly. A branch
   more than a few days behind is a problem to fix before more work lands on it.
5. **Delete on merge.** The repository setting does it; delete local copies too.
6. **Long efforts:** prefer small steps behind a flag. If that is not possible, use
   a temporary `epic/<slug>` branch with a stated end date and merge `main` in
   weekly. Delete it when it lands. Never keep standing per-team branches.
7. **Commits and PRs:** `type(scope): message`; PR title `[NA-n] Short
   description`; body has What changed, Why, How to test; link the ticket.
8. **Worktrees:** the primary checkout stays on `main`; feature work happens in a
   worktree named `<repo>--na-<n>-<slug>`.

## Two modes

| | Solo preview (now) | Team mode |
|---|---|---|
| Landing on `main` | Direct push by the owner. An agent may push only with the owner's approval for that push. | Pull request, one approval from someone other than the author, build check passing |
| Deploy | Push to `main` deploys | Tag or release publishes; merging does not |
| Protection | No force-push, no deletion | Same, plus required PR and checks |

The switch checklist is in [docs/DEPLOY.md](docs/DEPLOY.md#switching-to-team-mode).

## Tracks and a future split

Frontend (`web/`) and Industrial Atlas (the pipeline, `Spreadsheets/`, data
contracts) share this repository for now. Label work `track:hm` or `track:ia`
and keep a change to one track where possible, so the planned repository split
is a clean cut and ownership can follow paths.
