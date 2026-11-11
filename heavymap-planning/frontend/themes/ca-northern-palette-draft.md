# Canada theme: northern palette (draft for Morgen's review)

Status: **draft**, 2026-11-10. Local issue HM-014. Direction: decision 35 (spec D section 4.1).
This is a proposal for colour values only. The layout, type and every invariant in spec D section 3 are unchanged.

## Palette

| Semantic token | Role | Value | On paper | On raised |
| --- | --- | --- | --- | --- |
| `--surface` | paper (birch white, slightly cool) | `#f3f5f2` | n/a | n/a |
| `--surface-raised` | cards, dock | `#fbfcfa` | n/a | n/a |
| `--text` | ink (deep spruce) | `#1d3a34` | 11.22:1 | 11.95:1 |
| `--text-muted` | metadata | `#4f625d` | 5.92:1 | 6.30:1 |
| `--text-faint` | disabled and minor text; same value as `--text-muted`, because any lighter grey fails 4.5:1 (found by the build's contrast check) | `#4f625d` | 5.92:1 | 6.30:1 |
| `--accent` / `--link` | lake blue; links stay underlined | `#2c5a75` | 6.78:1 | 7.22:1 |
| `--accent-strong` | small accent text | `#234b63` | 8.48:1 | 9.04:1 |
| `--accent-red` | the ◒ mark, rules, display moments only (sparingly) | `#b3261e` | 5.96:1 | 6.35:1 |
| `--stage-completed` | spruce green | `#2a6543` | 6.30:1 | 6.71:1 |
| `--stage-announced` | amber, kept away from the red | `#735a00` | 6.00:1 | 6.39:1 |
| `--flag-warn` | warning chips | `#8a4f00` | 5.99:1 | 6.38:1 |
| `--flag-info` | information chips | `#1f5486` | 7.17:1 | 7.64:1 |
| `--rule` | hairlines (decorative) | `#cfd9d5` | 1.32:1 | n/a |
| `--focus-ring` | lake blue, 3:1 minimum | `#2c5a75` | 6.78:1 | n/a |
| `--illustration-1..6` | pale spruce and lake tints | `#e2ebe6` `#dbe6ec` `#c9d8d0` `#bdd0dc` `#9fb8ab` `#86a5b8` | decorative | n/a |

Every text pair beats the 5:1 target in spec D section 8. That gives more margin than the base theme's rust (4.51:1).

## Rules for the red

- The red is an accent and never carries meaning: it is not a stage, flag or "warning" colour.
- It is used for the ◒ mark (decision 37 allows retinting), section rules and at most one display element per screen.
- There is no maple-leaf ornament as decoration. The flag appears only in the theme selector.

## Things to check in review

1. **Stage swatches** completed (green) and announced (amber) differ by hue, not by lightness (1.05:1 between them). That is acceptable because the legend uses swatches plus names and keeps filled versus hollow marks (spec D section 3), but the difference may look weak in greyscale.
2. **Info chips versus links:** `--flag-info` (`#1f5486`) and the lake-blue accent are close in hue. Chips have text labels and links are underlined, so they stay distinct. If they look too alike, move the info flag toward teal.
3. **Overall look:** is the palette cool enough to read as "northern" next to the base theme?

## Token sheet (to apply after approval; D-T5)

```css
[data-theme="ca"] {
  --surface: #f3f5f2;  --surface-raised: #fbfcfa;
  --text: #1d3a34;     --text-muted: #4f625d;   --rule: #cfd9d5;
  --accent: #2c5a75;   --accent-strong: #234b63; --link: #2c5a75; --focus-ring: #2c5a75;
  --accent-red: #b3261e;
  --stage-completed: #2a6543; --stage-announced: #735a00;
  --flag-warn: #8a4f00;       --flag-info: #1f5486;
  --illustration-1: #e2ebe6; --illustration-2: #dbe6ec; --illustration-3: #c9d8d0;
  --illustration-4: #bdd0dc; --illustration-5: #9fb8ab; --illustration-6: #86a5b8;
}
```

Contrast figures come from WCAG 2.x relative luminance, computed for this draft. Spec D's D-T4 check will recompute them in the build.
