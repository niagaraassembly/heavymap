# Manual git and shell steps

Everything here runs from a terminal in the repo folder. Lines starting with `#` are comments.

## A. Get a clean working copy (without disturbing your own checkout)

```bash
git fetch origin
git worktree add ../heavymap-work -b hm/<topic> origin/main   # a second folder on its own branch
cd ../heavymap-work
```
*What it does:* `fetch` downloads the latest GitHub state without changing files. `worktree add` makes a new folder on a new branch cut from `origin/main`, so any uncommitted work in your other folder is untouched.

## B. Check the repo is healthy

```bash
./scripts/hm validate     # tables are well formed, ids/enums/links are right
./scripts/hm guard        # hard rules: no local-data in git, no owner values, G6, MPAC/NPCA
./scripts/hm status       # counts and decision states
python3 -m unittest discover -s tests            # the tests
python3 -m unittest discover -s misc/tests       # tests for parked code (Monroe crosswalk)
```
*What they do:* `validate` reads every CSV and compares it to `data/schema/`. `guard` additionally asks git what is tracked. `status` only prints. Exit code 0 means fine; 1 means something to fix (the message says what).

## C. Review and apply decisions

```bash
./scripts/hm review                 # starts http://127.0.0.1:8765/ ; press Ctrl+C when done
git diff data/reviewed/review_decisions.csv      # see exactly the lines you added
./scripts/hm apply                  # DRY RUN: lists pending/stale/refused, changes nothing
./scripts/hm apply --write          # applies; changes data/registry/*.csv and writes data/runs/apply-*.json
./scripts/hm validate && ./scripts/hm guard
git status                          # confirm: only data/ files changed, nothing in local-data/ or build/
```
*What they do:* `review` serves a page only your computer can reach and appends lines to `review_decisions.csv`. `apply` without `--write` is safe to run any time. `apply --write` is the only thing that edits the registry.

## D. Commit, push, open a draft PR

```bash
git add data/reviewed/review_decisions.csv data/registry data/runs
git commit -m "Review decisions for <slice> (NIA-xx)"
git push -u origin HEAD
# then on GitHub: New pull request -> choose "Create draft pull request"; fill in the template
```
*What they do:* `add` stages only the files you name (never `git add -A` blindly: it can pick up files you did not mean to share). `commit` records them. `push -u origin HEAD` uploads the current branch. A draft PR cannot be merged by mistake.

## E. Try it without real data

```bash
./scripts/hm demo /tmp/hm-demo                  # creates a sandbox with SYNTHETIC rows
./scripts/hm --root /tmp/hm-demo review         # review UI on the sandbox
./scripts/hm --root /tmp/hm-demo apply          # dry run on the sandbox
rm -rf /tmp/hm-demo                             # throw it away
```

## F. Useful extras

```bash
./scripts/hm ids check sbl20 "04799000010010000000"    # is this a valid 20-character SBL?
./scripts/hm ids print-key 04799000010010000000 --style padded   # 047.99-1-1
git log --oneline -- data/reviewed/review_decisions.csv          # who decided what, when
python3 scripts/gen_table_docs.py                      # regenerate docs/for-agents/TABLES.md after a schema change
```

## G. If something goes wrong

| Symptom | Meaning / fix |
|---|---|
| `hm guard`: `tracked_local_path` | A pulled file got staged. `git rm --cached <file>`; keep the file in `local-data/`. |
| `hm apply`: `stale` | The record changed after you reviewed it. Open the page and decide again; a new line supersedes the old one. |
| `hm apply`: `refused g6_closed` | `surfaced` is not allowed while gate G6 is closed. |
| The review page says "Not saved: ..." | The message is the rule that stopped the save; nothing was written. |
| You saved the wrong thing | Do not edit the CSV. Save a corrected decision for the same field (latest wins) before applying; after applying, save a new decision and apply again. |
