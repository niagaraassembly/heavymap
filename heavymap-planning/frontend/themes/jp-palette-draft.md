# Japan theme: palette (draft for Morgen's review)

Status: **draft**, 2026-11-10. Local issue HM-014. Token sheet: `web/src/site/themes/jp.css`, loaded only in preview builds (`npm run build:site:preview`).
Source: the generated study in the handoff (`review-images/optional-theme-study/`), which was made from screenshots, not code. Following spec D section 4.1, it's translated into **colour tokens only**: no motifs, ornament, layout or language changes, and no cultural imagery.

## What the study changes, and the token that carries it

| Study | Token | Value | Worst contrast on its surfaces |
| --- | --- | --- | --- |
| warm washi-white paper | `--surface` | `#f6f2ea` | n/a |
| raised cards | `--surface-raised` | `#fbf8f2` | n/a |
| tinted panels (kinari) | `--surface-tint` | `#ece7dc` | n/a |
| indigo-black ink | `--text` | `#1b2a3a` | 11.84:1 |
| body text | `--text-body` | `#33414f` | n/a |
| muted and minor text | `--text-muted`, `--text-faint` | `#59616c` | 5.08:1 |
| vermilion for the mark, rules and stage chips | `--accent` | `#c2412d` | 4.17:1 (mark and rules only, 3:1 needed) |
| vermilion small text (section numbers) | `--accent-strong` | `#a3321f` | 5.61:1 |
| moss green (italic headline line) | `--green` / `--green-strong` | `#4f6b45` / `#3e5a36` | 6.26:1 |
| completed stage | `--amount-done` | `#2f6b3a` | 5.18:1 |
| announced stage (kept amber, away from vermilion) | `--amount-announced` | `#775a00` | 5.25:1 |
| warning chips | `--flag-warn` | `#8a4700` | 5.71:1 |
| information chips (ai indigo) | `--flag-info` | `#2a4f80` | 6.74:1 |
| hairlines | `--rule-soft` / `--rule-strong` | `#d9d2c4` / `#b4ab98` | decorative |

Every pair passes the build's contrast check (`web/build/checks.mjs`).

## Things to review

1. **Vermilion versus the warning colour.** Both are warm. Warning chips carry text and the stage legend uses names, so meaning doesn't rest on the hue, but check that they look distinct.
2. **Typeface.** The study's headline serif looks like a transitional face rather than Georgia. This draft keeps Georgia and loads no web font. A display face could be a later token (`--font-display`) if you want it.
3. **Restraint.** The study's feel comes from paper, ink and vermilion alone. Please confirm you don't want any motif. Spec D asks for respectful, non-stereotyped use, and none is the safest reading of that.
