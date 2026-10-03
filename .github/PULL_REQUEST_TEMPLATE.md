<!-- Draft PRs until a human has reviewed. Agents never merge. -->
Linear: NIA-
Pulled data committed: none
MCS cells changed: none <!-- or name each dataset_id and the cells -->

## What a human must review

## Checks (all must exit 0)
- [ ] `./scripts/hm validate`
- [ ] `./scripts/hm guard`
- [ ] `python3 -m unittest discover -s tests`
- [ ] No owner values anywhere; nothing under `local-data/` or `build/`; nothing surfaced (G6 closed)
