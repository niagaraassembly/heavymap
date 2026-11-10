# Spec D: shared visual system and country themes

Status: **draft; open questions answered** (decisions 32–37), 2026-11-10. New proposals from those answers are in section 7.1 and D-Q7 to D-Q9. Local issue HM-006 (theme designs: HM-014). Written against branch `heavymap-mainsite-v1`.
Depends on: [Spec A](A-product-structure.md) (shell, navigation); [Spec B](B-content-model.md) section 10 (news card and panels); [Spec C](C-reader-continuity.md) section 6.1 (storage separation); the frontend v1 decisions of 2026-11-10 (D5 to D8).
Visual references:
- the selected second design (`web/alternate.html`, `src/editorial/`);
- review screenshots and the Japan study (`review-images/optional-theme-study/` in the handoff zip);
- the original Issue One card (`niagaraassembly/site` `assets/js/wny.js`, `assets/css/desk-publication.css` at `9522b3e`).

Labels used in this document:
- **Decided**: Morgen chose it.
- **Proposed**: this draft recommends it and it needs acceptance.
- **Open**: deliberately left unresolved.

## 1. Decisions this spec builds on

| # | Decided (2026-11-10) |
| --- | --- |
| Base | The selected second design is retained: warm off-white, slate ink, restrained green and rust, serif headlines, precise small labels, geographic context. |
| D5 | "Two recent" themes are the two most recent **distinct explicit** picks; inferred themes don't count. |
| D6 | First visit: use the region in the browser language as a hint, otherwise USA. No geolocation, IP lookup or prompt. USA and Canada are the shortcuts when there is no history. |
| D7 | v1 themes: **USA (base), Canada, Japan**. |
| D8 | The rotated rust half-dot ◒ is the interim mark. |
| 32 | Dark mode: v1 ships a dark variant of the **USA base theme only** (section 7.1). |
| 35 | Canada: northern palette (section 4.1). |
| 36 | **All three themes at launch.** Launch waits on approved Canada and Japan designs. |
| 37 | A theme may retint ◒; shape and rotation are fixed. |
| Earlier | A flag dropdown with readable country names. The explicit choice beats any inference. Theme country is separate from Desk, map geography and language. Theme storage is separate from reading history. |

## 2. Tokens

### 2.1 What exists

`site.css` defines seven custom properties:

| Token | Value | Contrast on `--paper` |
| --- | --- | --- |
| `--paper` | `#f5f4ee` | n/a |
| `--ink` | `#253f49` | 10.11:1 |
| `--muted` | `#596c71` | 5.00:1 |
| `--green` | `#4d6e5b` | 5.15:1 |
| `--rust` | `#ae573b` | **4.51:1**: exactly at AA for normal text, with no margin |
| `--line` | `#d5dbd4` | 1.28:1 (decorative rules only) |
| `--serif` | `Georgia, "Times New Roman", serif` | n/a |

The editorial stylesheets also carry about **49 hard-coded hex values (about 41 distinct)**, mostly pale greens and greys for map and landscape illustration: `alternate.css` 20, `round-two.css` 11, `page-studies.css` 18. A theme can't reach those, so they must become tokens before any theme works (D-T1 in section 9).

### 2.2 Token layers (proposed)

```
primitives      --hm-c-slate-800, --hm-c-paper-50, --hm-c-green-600, --hm-c-rust-600, ...
   ↓ referenced by
semantic        --surface, --surface-raised, --text, --text-muted, --rule, --accent, --accent-strong,
                --stage-completed, --stage-announced, --stage-developing, --flag-warn, --flag-info,
                --focus-ring, --link, --illustration-1..6, --font-display, --font-text, --font-label
   ↓ referenced by
component       --card-*, --dock-*, --chip-*, --masthead-*
```

- **Themes override primitives and semantic tokens only.** Component tokens and layout stay the same across themes.
- **Mode is a second axis** (decision 32). A dark variant overrides the same primitive and semantic tokens under `[data-theme="us"][data-mode="dark"]`. A theme without a dark variant ignores `data-mode`.
- The existing seven names stay as aliases of the matching semantic tokens during the transition. For example, `--ink` aliases `--text`.

### 2.3 Typography, spacing and widths

| Group | Tokens | Base value |
| --- | --- | --- |
| Display (headlines) | `--font-display` | `--serif` |
| Text (body) | `--font-text` | current body stack, kept |
| Label (small caps and metadata) | `--font-label`, `--label-size`, `--label-tracking` | current eyebrow style |
| Spacing | `--space-1..8` | a 4 px based scale, mapped from current values |
| Reading width | `--measure` | current article measure, about 65 to 70 characters |
| Rules | `--rule-weight` | current hairlines |

**Minimum sizes, whatever the theme:**
- body text: 16 px;
- small labels: 12 px;
- metadata that carries meaning, such as stage, flags and source kind: never below 12 px, and never conveyed by colour alone.

## 3. Invariants: what a theme can never change

1. **Content and facts:** headlines, numbers, dates, stage, flags, conflicts, sources, coverage and availability.
2. **Structure:** page sections, block order (spec B section 10.1), navigation, URLs, Reader behaviour, focus order.
3. **Meaning carried by colour.** Stage and flag semantics keep the same distinct roles: completed, announced and in development; warning and information.
4. **Language.** A Japan theme does **not** translate or change the language attribute.
5. **Map data styling.** Lens and parcel cartography is evidence presentation and is the same in every theme in v1. Themes may restyle only the dock and chrome around the map.
6. **The mark's shape.** ◒ stays the same glyph and rotation; a theme may retint it (decision 37).

**Consequence for the stage key.** The original Issue One legend says "Green: completed. Yellow: announced. Hollow: in development." Colour words break under a theme that retunes hues. **Proposed:** draw the legend with **swatches plus stage names** ("● Completed ● Announced ○ In development"), with the swatches taken from the stage tokens. Keep the original's filled versus hollow distinction, so the meaning survives without colour.

## 4. Theme registry

`content/themes.json` (proposed). Adding a theme adds one entry and one token sheet; nothing in the routes or content changes.

```json
{
  "default": "us",
  "themes": [
    { "id": "us", "country": "US", "name": "United States", "flag": "flags/us.svg", "tokens": null,            "modes": ["light", "dark"], "status": "published" },
    { "id": "ca", "country": "CA", "name": "Canada",        "flag": "flags/ca.svg", "tokens": "themes/ca.css", "modes": ["light"],         "status": "design" },
    { "id": "jp", "country": "JP", "name": "Japan",         "flag": "flags/jp.svg", "tokens": "themes/jp.css", "modes": ["light"],         "status": "design" }
  ]
}
```

- **`us` is the base.** It is the selected design with no override sheet. The "American look" fallback is the base look, not a new design.
- **`status`** controls exposure: `design` themes appear only in preview builds, and `published` ones appear publicly.
- **Launch gate (decision 36).** The public launch build fails unless all three themes are `published`. Canada and Japan move from `design` to `published` only on Morgen's design approval (HM-014), so HM-014 blocks launch.
- **`modes`** lists the variants a theme has; `dark` exists only for `us` in v1.
- **Flags are HeavyMap's own SVG files** with their sources recorded in the asset credits (spec B section 6). The source site's PNG flags (`assets/img/flags/us.png`) are not hot-linked.

### 4.1 Theme briefs (design subjects, not designs)

| Theme | Brief | State |
| --- | --- | --- |
| United States | the base design as selected | done |
| Canada | **Northern palette** (decision 35): the base layout and type, with a cooler palette (spruce green, lake blue, birch white) and a red accent used sparingly. The red must not take over the stage or flag colours; it's an accent for the mark, rules and display moments. Avoid maple-leaf ornament as decoration. Draft values: [`../themes/ca-northern-palette-draft.md`](../themes/ca-northern-palette-draft.md). | draft palette |
| Japan | Reference: the generated study (homepage and brief side by side), which was made from screenshots, not code. Translate it into tokens (palette, display typeface, rules and ornament), not new layouts. Review it for respectful, non-stereotyped use of cultural motifs. | to design |

## 5. Theme selector

**Placement:** a header control (spec A section 6), also reachable from the map dock.

```
 ┌──────────────────────────────┐
 │ 🇨🇦 Canada            ▾      │   button: flag (decorative) + name; aria-label "Site theme: Canada"
 └──────────────────────────────┘
   Recent
   ● 🇨🇦 Canada                      ← two most recent distinct explicit picks (D5)
     🇺🇸 United States                  seeded with USA + Canada when there is no history (D6)
   All themes
     🇨🇦 Canada
     🇯🇵 Japan
     🇺🇸 United States                ← alphabetical by name
   ─────────────
   Themes change the look only.  Reset to automatic
```

- The pattern is a **listbox button**: arrow keys move, Enter selects, Escape closes and returns focus, and typing a letter jumps to that name.
- The **name is always visible**. The flag is decorative (`alt=""`), so the control works for people who can't distinguish flags.
- The **recent group** never shows the same theme twice, and hides when it would only repeat the current theme alone.
- **"Reset to automatic"** clears the explicit choice, going back to section 6 step 2. It keeps the recent list.
- The line "Themes change the look only" makes invariant 1 explicit to readers.

## 6. Precedence and the regional hint

| Step | Source | Saved? | Counts as recent? |
| --- | --- | --- | --- |
| 1 | Explicit saved choice | yes | yes |
| 2 | Browser-language hint: the first entry in `navigator.languages` that has a region subtag (e.g. `en-CA` → `ca`, `fr-CA` → `ca`, `ja-JP` → `jp`, `en-US` → `us`) mapped to a `published` theme | **no**; recomputed every visit | no |
| 3 | Default `us` | no | no |

- A region that has no theme, such as `en-GB`, falls to step 3.
- Bare language tags such as `ja` don't count as a region hint. **Proposed:** language is not country.
- A hinted theme in `design` status is ignored in public builds.
- No notice or banner announces the hint. The selector simply shows the active theme. *Proposed (D-Q3).*

## 7. Storage and first paint

```json
// heavymap-theme-v1
{ "version": 1, "choice": "ca", "recent": ["ca", "us"], "mode": "auto" }
```

- **`recent`** holds at most 2 distinct IDs from explicit choices only. A new pick goes first, and the oldest drops off.
- **Storage failures** (unavailable, malformed, or an ID no longer published) mean steps 2 and 3 apply. Nothing throws.
- **Independence.** "Forget reading history" never touches this key (spec C section 6.4), and resetting the theme never touches reading history.
- **No flash on first paint.** Following the source site's pattern (its `theme.js` comment explains why), a **small inline `<head>` script** resolves the theme and sets `<html data-theme="…">` before first paint. Theme token sheets are small attribute-scoped blocks (`[data-theme="ca"] { … }`) bundled with the main CSS, so switching theme needs no network request. Large ornaments, such as illustration art, load lazily.

### 7.1 Light and dark (USA base theme only)

Decided (32): the USA theme gets a dark variant in v1. The rest is **proposed**.

- **Mode control:** a small segmented control in the theme selector, below the theme list: Light · Dark · Automatic. It appears only when the active theme lists `dark` in `modes`. Otherwise the selector shows "This theme has a light look only".
- **Default (decided, 38):** Automatic, which follows `prefers-color-scheme`. Unlike the theme hint, the system setting is a direct preference and doesn't need guessing.
- **Storage:** `heavymap-theme-v1` gains `"mode": "auto" | "light" | "dark"`, default `auto`. The mode is kept when the reader switches to a light-only theme and comes back into effect when they return to USA (decided, 39).
- **First paint:** the same inline head script also sets `data-mode`, so dark readers see no light flash.
- **What dark changes:** surface, text, rule, accent and illustration tokens. Stage and flag tokens get dark-specific values that keep the same roles and pass the same contrast checks.
- **Map (decided, 40):** invariant 5 still applies, so map data styling doesn't change. The static Hamilton basemap in v1 stays as it is and sits in a frame styled with the dark chrome.
- **Never reads `na-theme`.** Niagara Assembly's light/dark choice isn't imported.

## 8. Accessibility across themes

Every theme must pass, on its own surfaces:
- **text contrast:** 4.5:1 for body and labels, 3:1 for large text and UI boundaries, including focus rings;
- **targets:** at least 24 × 24 CSS px; the dock and selector items at least 44 px tall on touch layouts;
- **reduced motion:** a theme can't add motion; under `prefers-reduced-motion`, theme switches are instant;
- **non-colour cues:** filled versus hollow stage marks, chip text for flags, and underlined links in body text.

**Rust needs care.** Rust on paper is 4.51:1, and dark mode needs its own lighter rust value checked against the dark surface. Any theme that lightens the paper or warms rust will fail AA for rust text. **Proposed:** rust stays an accent for marks, rules and large display text. Small rust text uses `--accent-strong`, which must reach at least 4.5:1 with margin; the target is at least 5:1.

**Build check (proposed).** A script computes the contrast of every semantic text and background pair per theme **and per mode** and fails the build below threshold. This turns invariant 3 and section 8 into a check rather than a review.

## 9. Work this implies (for implementation planning, not yet assigned)

| ID | Work |
| --- | --- |
| D-T1 | Tokenise the hard-coded hex values; introduce the primitive, semantic and component layers; alias the old seven names |
| D-T2 | Swatch-based stage legend (section 3) |
| D-T3 | Theme registry, selector, inline head script, `heavymap-theme-v1` |
| D-T4 | Contrast check script |
| D-T5 | Canada and Japan token sheets (after HM-014 design approval); **launch-blocking** (decision 36) |
| D-T6 | Consolidate the map header and dock chrome into the shared shell (with spec F) |
| D-T7 | Dark variant of the USA theme: tokens, mode control, head script, contrast check (section 7.1) |

## 10. Answers (Morgen, 2026-11-10)

| ID | Question | Decision |
| --- | --- | --- |
| D-Q1 | Light/dark mode | **Dark variant for the USA base theme only** in v1 (32; section 7.1) |
| D-Q2 | Canada direction | **Northern palette** (35; section 4.1) |
| D-Q3 | Announce a hinted theme? | No notice (33) |
| D-Q4 | Bare language tags as hints? | Region subtags only (34) |
| D-Q5 | Ship themes when approved? | **No: all three at launch**; launch waits on HM-014 (36) |
| D-Q6 | Retint ◒? | May retint; shape and rotation fixed (37) |

## 11. New open questions (from the answers)

| ID | Question | Proposed answer |
| --- | --- | --- |
| D-Q7 | Default mode for the USA theme | **Decided (38):** Automatic, following the device setting |
| D-Q8 | Keep the mode setting while a light-only theme is active? | **Decided (39):** yes |
| D-Q9 | Map basemap in dark mode | **Decided (40):** unchanged; only the surrounding chrome goes dark |
