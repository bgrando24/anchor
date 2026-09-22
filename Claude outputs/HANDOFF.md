# Anchor: team feedback and QA fixes, implementation brief

**For:** Claude Code, working in this repo
**From:** Brandon (dev lead), prepared with Claude Cowork, 22 Sep 2026
**Repo state:** `master` @ `fef2ed6`, clean

This folder contains everything you need:

| File | What it is |
|---|---|
| `HANDOFF.md` | This brief. Read it all before starting. |
| `COPY.md` | Every user-facing string. Use it verbatim. |
| `data/master_data_v2.json` | The team's real dataset (79 areas). Replaces the fake fixture. |
| `data/regions.json` | App-owned area → region lookup for all 79 real LGA codes. |
| `data/scoring-reference.py` | Reference ranking model. Port it to TypeScript. |
| `data/scoring-test-vectors.json` | Expected top-10 results. Your port must reproduce them. |
| `assets/` | Logo, favicon and PWA icons, ready to drop in. |
| `../QA_REPORT.md` | Full QA from 21 Sep. Findings are referenced below as **QA#n**. |

## Ground rules

- Work on a new branch `feat/team-feedback-v2`. Commit per phase with clear messages. Open a PR, and don't merge it.
- The architecture stays as it is: static Nuxt, client-side scoring, answers only in the URL fragment. **No backend, no analytics, no storage of answers, no new third-party requests.**
- Don't touch `data_pipeline/`. That belongs to the data team.
- Before each commit, run `npm run typecheck`, `npm run build`, and the tests you add.
- **No emoji or Unicode glyphs as icons anywhere** (☀ ◑ ← × + − ! and HTML entities like `&#8592;`). Use SVG icons (see Phase D).
- Mobile-first. Everything must work at 320px wide and at 200% zoom. Desktop layout starts at 860px.
- If something in this brief turns out to be wrong or impossible, stop and say so rather than guessing.

---

## Decisions already made

These came from Brandon, the team review on 21 Sep, and the QA report. Don't reopen them.

1. **Remove "Where do you work?"** completely: UI, state, fragment and copy.
2. **Swap the fake fixture for the real data** (`master_data_v2.json`) now. Hide features whose data doesn't exist yet rather than faking them.
3. **Payment and income must affect the results.** Currently they do nothing, which is the main reason the team saw the same top 5 every time (see "Why the results never changed" below). New model: compare each area's typical rent with her estimated income.
4. **Add a bedrooms question.** The typical rent depends on home size.
5. **Use the team's "affordability cut-off, then priorities" idea as bands**, not a hard filter. A hard 30% cut-off returns **zero areas** for almost every Centrelink household in the real data (details below), so areas are grouped into rent-share bands and ordered by priorities inside each band.
6. **Strengthen the priority weights.** Use percentile ranks instead of min-max scaling, and tiers of Not much 1, Somewhat 3, A lot 6. Rent stays at a fixed 50%.
7. **"Where do you live now" is for comparison only.** It doesn't change the ranking. The comparison must include typical rent (team request).
8. **Copy gets rewritten** in plain language (COPY.md).

### Why the results never changed

Measured on the fixture the team saw: across all 27 priority combinations, **Kingston was in the top 5 every time** and only 2 different areas ever ranked first. Payment type and income band are never read by `useScoring.ts`, and the current area only affects the comparison block. So the only live inputs were three priority tiers, worth 7–30% of the score, against affordability values that min-max scaling stretched so that one or two outliers dominated. The same code on the real data shows the same pattern (Yarriambiack and West Wimmera, both at "100% affordable", top 5 in all 27 combinations).

### Why bands instead of a cut-off

Share of the 79 areas where a typical 2-bedroom rent is at or below 30% of weekly income, in `master_data_v2`:

| Weekly income | ≤30% | ≤40% | ≤50% |
|---|---|---|---|
| $650 | 0 | 0 | 1 |
| $850 | 0 | 4 | 27 |
| $1,000 | 0 | 24 | 40 |
| $1,200 | 11 | 36 | 55 |

A pure cut-off would show Lisa an empty page. Bands keep the idea, affordability first and then priorities, and always show something honest: "No area is under 30% of your income. The closest are listed first." That message is also the tool's strongest finding for the report.

---

## Phase A: data and scoring (do this first)

### A1. Real data in, app-owned shape out

1. Copy `data/master_data_v2.json` to `app/data/source/master_data_v2.json`.
2. Write `scripts/build-data.mjs` (run manually, output committed). It reads the source plus `data/regions.json` and writes `app/data/lgas.json`:

```ts
interface LgaFile {
  meta: { source: string; generated: string; rentQuarter: string }   // rentQuarter: "September quarter 2025"
  lgas: Lga[]
}
interface Lga {
  lga_code: number                  // ABS 2021 code, e.g. 21610
  lga_name: string                  // "Moreland" renamed to "Merri-bek"
  area: 'Melbourne' | 'Regional Victoria'
  region: string                    // from regions.json
  school_count: number
  station_count: number
  bulk_billing_rate: number         // 0..1
  affordable_lettings_pct: number   // source affordability_pct × 100, 0..100
  rent: { flat_1br: number | null; flat_2br: number | null; house_2br: number | null; house_3br: number | null }
  population: number | null         // not in v2 yet
  lettings_series_5yr: number[] | null   // not in v2 yet; enables the chart
}
```

3. The script must **fail loudly** if the row count isn't 79, codes aren't unique, any code is missing from `regions.json`, or a required number is missing.
4. Replace `useLgaData.ts` to read `lgas.json`. Delete `anchor-lgas.json` from the app. If you want it for developing the chart, move it to a test fixture that is never imported by app code.
5. Remove everything tied to fields that no longer exist: parks, sports, offence rate, SEIFA, population display, the 5-year average and the steadiness wording. Delete `MissingDataCard` usage for parks and sports.

**Accept when:** `node scripts/build-data.mjs` produces 79 rows. Merri-bek appears in search. Casey is `21610` and Wyndham is `27260`. No fixture data is reachable from the app.

### A2. Payments and income

Create `app/data/payments.ts`:

- Each payment: `value`, `label`, `code`, `maxFortnightly` (number), plus shared `sourceUrl` and `effectiveDate`.
- **Get the current maximum fortnightly rates from servicesaustralia.gov.au** (rates are indexed on 20 Sep 2026). Third-party sites disagree with each other, so use only the official pages. Put the URLs in the file. **List the rates you used in your PR summary so Brandon can confirm them.** For payments with several rates (e.g. JobSeeker single vs single with children), use the rate for a single person with dependent children where one exists, since that's the persona. Say which you picked.
- Other-income bands, per fortnight, with the midpoint used for income:

| code | label (COPY.md) | fortnightly midpoint |
|---|---|---|
| `0` | No other income | 0 |
| `u200` | Under $200 a fortnight | 100 |
| `200-500` | $200 to $500 a fortnight | 350 |
| `500-1000` | $500 to $1,000 a fortnight | 750 |
| `1000+` | More than $1,000 a fortnight | 1250 |

- `weeklyIncome = (maxFortnightly + bandMidpoint) / 2`. An unanswered band counts as 0.

### A3. Scoring model

Port `data/scoring-reference.py` to `app/composables/useScoring.ts` as **pure functions** (no Vue inside the maths). The docstring in the Python file is the spec. Summary:

- Typical rent = the lowest non-null median among dwelling types with at least the needed bedrooms.
- Rent share = rent ÷ weekly income, **rounded half up** (`Math.round`) to a whole percent. The band comes from the rounded number.
- Bands, in order: `within` ≤30, `stretch` 31–40, `hard` 41–50, `out` >50, `nodata`.
- Each factor becomes a 0–10 percentile rank across the 79 areas, with ties averaged. Rent is ranked only among areas with rent data, lower being better.
- Score = 0.5 × rent rank + priorities (50 points split 1:3:6 by tier, largest remainder).
- Sort by band, then score descending, then name.

Add **Vitest** with:

- tests that reproduce every case in `scoring-test-vectors.json` exactly (compare `top10_codes`);
- `prioritySplit` always summing to 50, including sss→17/17/16, ann→38/6/6, asa→20/10/20;
- the band boundaries 30/31, 40/41, 50/51, and 30.5 rounding to 31.

Also update the live split on `/priorities` to the new tier weights.

**Population:** v2 has none, so rank raw school and station counts for now. Leave a clearly marked branch that switches to per-10,000 residents when `population` is present, and note it in the PR.

### A4. URL fragment v2

New format with a version prefix, so old links fail clearly instead of restoring the wrong area. The old fixture codes collide with real councils: fixture Wyndham `24970` is really Monash (QA §5).

```
#2.<payment>.<income>.<bedrooms>.<currentLga>.<weights>
e.g. #2.pps.200-500.2.27260.asa
```

- Six segments exactly. Version must be `2`.
- `bedrooms` ∈ `1|2|3`. `income` ∈ the band codes above or `-`.
- `currentLga` must match `/^\d{5}$/` and exist in the data. This rejects leading zeros, exponents, hex and spaces (QA#25).
- `weights` must match `/^[nsa]{3}$/`.
- Anything else goes to `/invalid-link`.
- Decode on mount **and on `hashchange`** (QA#24).
- Add codec tests: round-trip every option, and all the tampered cases in QA §4.11 plus the ones above.

---

## Phase B: flow and navigation

### B1. New step order

| Step | Route | Back arrow goes to |
|---|---|---|
| 1 of 4 | `/income` | `/` |
| 2 of 4 | `/bedrooms` (new, radio rows like payments) | `/income` |
| 3 of 4 | `/location` → `/location/area?region=…` | `/bedrooms` / `/location` |
| 4 of 4 | `/priorities` | `/location/area?region=<region of current area>` |

- **Fix the Priorities back bug** (team item 2, QA#5). Derive the region from `answers.currentLga` via the regions lookup, instead of linking to `/location/area` with no query.
- Replace region tiles with the 11 regions in `regions.json`: 6 Melbourne regions (Plan Melbourne) and 5 regional. "Hume region" is spelled out to avoid clashing with the City of Hume.
- If someone lands on a later step with earlier answers missing, send them to the first unanswered step.

**Accept when:** Walk the flow, press every in-app back arrow, and each one returns to the previous screen with its answer still selected and no error message. "Step N of 4" matches the four progress segments.

### B2. One header everywhere, with FAQ access

Team item 6 and QA#33. Put a single `AppHeader` in the default layout on **every** page, including the flow steps, share, FAQ and print (print hides it in `@media print`). It contains:

- the logo mark and wordmark, linking home;
- **"How it works"** (help-circle icon plus text), linking `/faq`;
- the theme toggle.

On flow pages the step counter and progress bar sit **below** the header. Keep it to these two items: there's no need for a hamburger menu. At 320px the header must fit on one line (QA#15); the icon-only help link with an aria-label is acceptable below 360px.

Opening the FAQ mid-flow must not lose answers. The FAQ back link returns to the previous in-app page (`router.back()` when history came from the app, otherwise `/`).

### B3. Empty states

- `/results` with no answers: the "Answer a few questions first" screen (COPY.md), not a fake personalised ranking (QA#26).
- `/share` with no answers: the "Nothing to save yet" screen, never a broken link (QA#6). Hide "Save or share" in headers when there are no answers.

---

## Phase C: results and area detail

### C1. Results list

- Group rows under **band headings** (COPY.md), hiding empty bands. Show the "No area is under 30%" notice when the `within` band is empty.
- Each row: rank, area name, region, headline "{share}% of your income", "Typical {n}-bedroom rent: ${rent} a week", at most one factor sentence (rules in COPY.md), and the "Where you live now" badge.
- **Remove the total-score bar from rows.** Rows are ordered by band first, so a row lower down can have a higher score than one above it, which would look like a bug. Scores stay on the detail page.
- **Remove the pills** from the header band (team item 10). Desktop already shows answers in the sidebar. On mobile, show one plain-text summary line and a real secondary button "Change answers" with a pencil icon.
- The caveat appears once, above the list.
- **Fix the 860–1150px collapse** (QA#1). The row grid is now simpler (rank | area + sentence | share + rent), so the area column must never drop below about 240px, and there must be no horizontal scroll at any width from 320 to 1920.
- Semantics: one `<h2>` per band, rows in `<ol>` / `<li>`, and the area name as each row's heading (QA#23). The table view keeps real `<th scope>`.
- Touch targets ≥44px for area-name links, "Change answers" and the table toggle (QA#18).

### C2. Area detail

- Hero: rent share of income for her bedroom count, with the band sentence (COPY.md). Below it, "new leases affordable on a Centrelink income" from `affordable_lettings_pct`. Show 0 and 100 as "None" and "All".
- "How this area scored": four rows (rent, schools, stations, GP), each with a 0–10 bar and the raw value.
- Section titles become real `<h2>`s (QA#14).
- **Comparison with the current area** (team items 7 and 8): one table with no Table/Bars toggle. Columns are blank, this area and the current area. Rows are Rank (ordinal), Typical rent, Share of your income, Schools, Train stations and GP bulk-billed. It must fit 320px. Use `<th scope="col">` and `<th scope="row">`. It's shown only when a current area is set and differs from this one.

### C3. Affordability chart (team item 7, QA#9, QA#32)

**Hide the section when `lettings_series_5yr` is null**, which it is for all v2 data. Build the improved component anyway, so it works the moment Khalid supplies the series; develop it against the old fixture series in a test or story.

- Keep a single series with no legend; the title names it.
- Add a **y-axis with 3 gridlines** at rounded "nice" values labelled in %. Label the **first and last points** with their values. X labels are the first and last quarter (e.g. "Sep 2020" and "Sep 2025") if dates exist, otherwise "5 years ago" and "Last quarter".
- **Text must not scale with width.** Render the SVG at its real pixel width (a ResizeObserver sets the `viewBox` width) so labels stay 13–14px at every size. Thin 2px line, recessive gridlines.
- Add a hover or tap crosshair with a tooltip showing the quarter and value. On mobile, tapping shows the nearest point.
- The aria-label compares the same two numbers the caption does. Include a visually hidden table of the values.

---

## Phase D: icons, logo, PWA, theme

### D1. Icons

Install **`lucide-vue-next`** (ISC licence; bundled, so it works offline). Replace every glyph:

| Where | Icon |
|---|---|
| Theme toggle | `Moon` when light is on, `Sun` when dark is on |
| Back arrows | `ArrowLeft` |
| Search clear | `X` |
| FAQ expand | `ChevronDown` (rotate when open) |
| Invalid link | `CircleAlert` (`aria-hidden`, not red) |
| Help link | `CircleHelp` |
| Share / Copy / Copied / Download | `Share2` / `Copy` / `Check` / `Download` |
| Offline band | `WifiOff` |
| Change answers | `Pencil` |

Icons are decorative (`aria-hidden="true"`) whenever a text label is present; icon-only buttons need an `aria-label`. Afterwards, grep the templates for non-ASCII symbols and `&#` entities and remove any that remain.

### D2. Logo and favicon (team item 9)

From `assets/`:

| File | Goes to |
|---|---|
| `favicon.ico` | `public/favicon.ico` (replaces the Nuxt logo) |
| `logo-mark.svg` | `public/favicon.svg`, plus `<link rel="icon" type="image/svg+xml">` |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | `public/icons/` |
| `logo-mark-mono.svg` | Inline it as a component in the header wordmark (uses `currentColor`) |

The mark is a roof on a solid base line, for "somewhere to stay". Don't add a nautical anchor.

### D3. PWA (QA#2, QA#3, blockers)

- Add `<NuxtPwaManifest />` in `app.vue` so the manifest is actually linked. Add `theme-color` meta for light `#1B2A3A` and dark `#141A21`.
- **Offline reload must work on every route.** No HTML is precached today. Prerender all routes, including the 79 `/results/{code}` pages, and make sure the HTML is in the Workbox precache, **or** add a navigation fallback to a precached app shell. Pick whichever works cleanly with the Cloudflare Workers deployment, and explain the choice in the PR.
- iOS never fires `beforeinstallprompt`. On iOS Safari, show the iPhone install hint from COPY.md instead of the install card (QA#30).

**Accept when:** In `npm run build && npm run preview`:
- DevTools shows a valid manifest with the new icons.
- Chrome offers install and the intro card appears.
- After one visit, setting DevTools to offline and reloading `/`, `/income`, `/results#…` and `/results/21610` all load, showing the offline band.

### D4. Theme (QA#34, QA#35)

- Default to the system `prefers-color-scheme` until the user picks a theme; after that, remember their choice.
- Set `data-theme` **before first paint** with a small inline script in `<head>`, so dark-mode users don't get a cream flash. Add `<meta name="color-scheme" content="light dark">`.

---

## Phase E: copy

Apply `COPY.md` to every screen, the FAQ, print, the invalid-link page, the offline band and the install card. Page `<title>`s keep the "{Page} | Anchor" pattern, using the new H1s shortened.

**Accept when:** A search of the templates finds none of these old strings: "This is a suggestion, not an answer", "you can't change it", "There's no right answer", "Close the tab and they're gone", "No account, no sign-up", "nothing personal in the link", "left out of the score", "Where do you work", "Bars".

---

## Phase F: remaining QA fixes

| QA# | Fix |
|---|---|
| 10, 11 | Print sheet always uses light tokens, even in dark mode (scope `data-theme="light"` or override tokens in `@media print`). It must fit one A4 page with default margins. The print header and button are hidden when printing. |
| 12 | Search input needs a visible focus state (3px ring, same as other controls). |
| 13 | Focus ring on the navy header band is 1.88:1 in light mode. Use a light ring colour on dark surfaces (≥3:1). |
| 16 | Print table fits 320px or scrolls inside its own container. |
| 19 | Tier chips and radio rows follow the ARIA radio-group pattern: one tab stop per group, arrow keys move the selection. |
| 28 | Decorative icons are `aria-hidden`. |
| 29 | Raise non-text contrast to ≥3:1: input and secondary-button borders (`--border-focus`), the lightest data colour, and the header chip outline if chips remain anywhere. |
| 31 | Mobile and desktop detail pages show the same facts. |

---

## Needs from Brandon (not blocking you)

1. **Confirm the Centrelink rates** you list in the PR.
2. **Deploy the branch** when it's ready, so Cowork can re-run the full QA against it.

Things to ask Khalid for, which the app is ready to use when they arrive: population per LGA, the 20-quarter affordable-lettings series, the median-rent series per dwelling type, what `affordability_trend` means, and a check of the 0% and 100% affordability areas. When they land, re-run `scripts/build-data.mjs`.

## Out of scope: don't build

- **Any collection of user data.** The team's notes suggest collecting data to show governments which areas are pushing people out. That conflicts with the app's core promise and the ethics canvas. It's on hold pending a team decision. If it goes ahead, it will use public rent data only, as a later feature.
- Choropleth map, vetoing areas, per-area external links (Iteration 2).
- Any change to the fixed 50% rent weight.

## When you're done

Reply with:

- what changed per phase;
- the rates you used and their sources;
- anything in this brief you couldn't do or disagreed with;
- any strings you had to write that aren't in COPY.md;
- the test results.

Cowork will then run the full QA sweep again against the deployed branch.
