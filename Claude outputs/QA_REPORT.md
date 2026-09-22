# Anchor: QA report

**Build tested:** `master` @ `fef2ed6` (local clone matches `origin/master` and the Cloudflare deploy)
**Date:** 21 September 2026
**How:** Production build (`npm run build` → `node .output/server/index.mjs`) in headless Chromium: 13 routes × 6 viewports (320, 390, 859, 860, 1280, 200% zoom) × light/dark = 156 full-page captures, plus scripted functional, keyboard and tampering suites. Live deploy checked in Chromium on the Mac for the service worker, real fonts and glyph rendering. Real IBM Plex was served locally in the sandbox so layout measurements match production.
**Evidence:** `qa-evidence/` next to this file.

---

## 1. Summary

The flow is calm, readable and mostly well-built. The copy is on-tone (no exclamation marks, no jargon, no em-dashes, Australian spelling throughout), dark mode is clearly designed rather than inverted, every text colour pair passes WCAG AA, and fragment tampering is handled well: 16 of 16 malformed links land on `/invalid-link`. The URL-state design holds up: search text never touches the URL, and the only third-party requests are Google Fonts.

The serious problems are in three places. The **PWA layer doesn't work as deployed** (not installable, no offline reload). The **results screen breaks between 860 and ~1150px**. And several sentences **promise things the app doesn't do**: that results depend on "your income", that the share link has "nothing personal" in it, and that parks data is "left out of the score".

**Do this first, before any link circulates:** swap the fixture's area codes for the real ones and version the fragment. Six fixture codes belong to *other* real councils, so today's links will silently restore the wrong area after the data swap. (§5, my error)

### Top 5 to fix first

1. **Not installable.** No `<link rel="manifest">` is rendered, so `beforeinstallprompt` never fires, and the install card and header Install link can never appear. (#3)
2. **Offline reload fails on every route.** No HTML is precached, so reloading or reopening while offline shows the browser's own error page. (#2)
3. **Results layout collapses at 860–~1150px.** Text overlaps, one word per line, up to 149px of horizontal scroll. This covers iPad landscape (1024) and 1366×768 laptops at 125% scaling. (#1)
4. **Income and payment type have no effect on the results**, but the UI repeatedly says rentals are "affordable on your income". (#4)
5. **Back arrow on Priorities lands on an error.** It goes to `/location/area` without the region and shows "That region wasn't recognised". (#5)

---

## 2. Findings

Severity follows the brief: **Blocker** / **Major** / **Minor** / **Copy**.

| # | Sev | Area | Route | Viewport / theme | Steps to reproduce | Expected | Actual | Evidence |
|---|---|---|---|---|---|---|---|---|
| 1 | **Blocker** | Visual | `/results` | 860–~1150px, both themes | Open `/results#pps.10-20.24970.-.asa` at 1024px wide | Two-column desktop layout, readable rows, no horizontal scroll | The area column collapses to 33–48px. "Kingston" overlaps "1 in 3", the sentence wraps one word per line, and there's horizontal overflow of 149px at 860, 109 at 900, 49 at 960, 9 at 1000. Readable only from ~1150px. Cause: `dt:grid-cols-[44px_1fr_150px_190px_120px]` plus gaps, padding and the ~312px sidebar leaves the `1fr` column near zero. | `01-results-1024px-collapse.png` |
| 2 | **Blocker** | PWA | all | Chrome | Load a few pages → go offline → reload any route | App loads from cache; quiet offline band shows | `net::ERR_INTERNET_DISCONNECTED` on `/`, `/results#…`, `/results/22110` and `/income`. The precache has 40 entries: icons, manifest, favicon and 34 `_nuxt` chunks, but **no HTML**. The SW registers `NavigationRoute(createHandlerBoundToURL("/"))`, but `/` isn't precached. This is an SSR build, so `globPatterns: **/*.html` matches nothing. The offline band does appear if you stay on the open tab, but reopening the installed app offline would fail. | sandbox run; SW precache listing from the live deploy |
| 3 | **Blocker** | PWA | all | Chrome | View source or check `document.querySelector('link[rel=manifest]')` | Manifest linked; install card on intro; header Install link | **No manifest link in the HTML** (count 0, locally and on the live deploy). `/manifest.webmanifest` exists (200) but isn't referenced; `app.vue` has no `<NuxtPwaManifest />`. Without it Chrome never fires `beforeinstallprompt`, so `InstallPrompt` and the header Install link (both gated on that event) never render. No `theme-color` meta either. | page HTML; `useInstallPrompt.ts` |
| 4 | **Major** | Functional / Copy | `/income`, `/results`, detail | all | Compare `/results#js.-.24970.-.sss`, `#ap.35+.24970.-.sss`, `#pps.0.24970.-.sss` | Payment type and income band change the affordability figures, as the copy says | Identical top 10 and identical percentages for every payment type and income band. `useScoring` never reads `paymentType` or `incomeBand`. Yet: "This sets the income your rent gets measured against", "affordable on your income" (every row), "clear that bar on your income" (FAQ). The DFFH figure is measured against a fixed Centrelink benchmark, not her income. | functional run |
| 5 | **Major** | Functional | `/priorities` | all | Complete steps 1–2 → Priorities → tap ← | Back to the area list for your region | Goes to `/location/area` with no `?region=` and shows "That region wasn't recognised. Go back and pick a region." plus an empty "change" chip. | `06-back-from-priorities.png` |
| 6 | **Major** | Functional | `/share` | all | Load `/share` (or `/results` → Save or share) with no answers, e.g. after **Start over** | Either a working link or no link offered | Shows `/results#-.-.-.-.sss`, which the decoder rejects, so the recipient lands on "This link doesn't look right." The results header offers "Save or share" in this state too. | functional run |
| 7 | **Major** | Copy / Privacy | `/share` | all | Read the reassurance box | Accurate privacy claim | "There's nothing personal in the link." is followed by "It holds your payment type, income band, areas and priorities". Benefit type plus income band plus home and work area is personal, and is the combination your own Privacy Act reasoning treats as potentially identifying. The print sheet deliberately leaves payment and income out, which concedes the point. | copy |
| 8 | **Major** | Copy | detail (regional), `/faq#missing` | all | Open `/results/22910` | Missing-data copy accurately describes the score | Cards say parks/sports were "left out of the score rather than counted as zero", and the FAQ says the same. But **parks and sports are not in anyone's score**: the score is affordability plus schools, transport and GP for all 79 areas, and metro areas don't display parks data at all. The honest-missing-data treatment describes a factor that doesn't exist in the scoring. | copy vs `useScoring.ts` |
| 9 | **Major** | Visual / A11y | detail, print | all | Open any detail page at 320 and 1280 | Chart labels a consistent readable size | The SVG has a fixed `viewBox="0 0 320 132"` and scales with width. "5 years ago" / "Last quarter" render about 53px tall and the endpoint label about 63px at 1280; at 320 they're about 13px tall (roughly 10px text). | `02-chart-text-scaling-1280px.png` |
| 10 | **Major** | Visual | `/results/print` | dark theme, print | Dark mode → Share → Download as PDF → print | Sheet stays white and navy | The weighting box renders dark navy, the chart uses the pale dark-mode line and dark gridlines, and the "36.2%" endpoint label is almost invisible. With background graphics on, the page margins print near-black. | `03-print-a4-light-vs-dark-2-pages.png` |
| 11 | **Major** | Visual | `/results/print` | print, A4 | Print or save as PDF (default margins) | One A4 page | Two pages in Chromium A4: the #5 row splits across the break and the chart plus footer sit on page 2. Worth confirming in the real dialog on your Mac, since I couldn't open it. | same |
| 12 | **Major** | A11y | `/location` | both | Tab to the search field | Visible focus change | Focused and unfocused states are pixel-identical: the input has `outline: none` and always shows the same 2px border. | `04-search-no-focus-state.png` |
| 13 | **Major** | A11y | results, detail, share headers | light | Tab to "Save or share" or the theme toggle on the navy band | Visible 3px ring | The ring is `#2F5675` on band `#1B2A3A`, which is **1.88:1** and barely visible. Dark mode is fine (7.28:1). | `05-header-band-focus-light-vs-dark.png` |
| 14 | **Major** | A11y | `/results/<code>` | all | Screen reader heading navigation | Section headings | **Only one heading on the page** (the h1). "Affordable rentals, last five years", "What makes up the score" and "Compared with…" are `<div>`s, so screen reader users can't jump between sections. | a11y tree |
| 15 | Minor | Visual | detail | 320 | Open `/results/22110` at 320px | Header fits | "All areas" wraps to 2 lines and "Save or share" to 3; 13px horizontal overflow and the theme toggle is clipped. | `07-detail-header-320px.png` |
| 16 | Minor | Visual | `/results/print` | 320 | Open print sheet on a phone | Fits or scrolls inside a container | The table overflows the page by 37px. | sweep |
| 17 | Minor | Functional | flow | all | Walk the happy path | "Step N of 4" matches the steps | Labels run 1 → 2 → 2 (area) → 3, and the 4th progress segment never fills. The intro promises "four short questions". | sweep |
| 18 | Minor | A11y | several | all | Measure hit areas | ≥44px | Results area-name links are 26px tall, the "Change answers" header chip 36px, "View all 79 as a table" 22px, "Why not others?" 19px on desktop, and the "North & West · change" chip 31px. | sweep |
| 19 | Minor | A11y | `/priorities` | all | Tab through tiers; press arrow keys | One tab stop per group; arrows move selection (ARIA radio pattern) | 9 separate tab stops (every chip is `tabindex=0`) and arrows do nothing. Space and Enter do select, and `role=radio`/`aria-checked` are correct. | keyboard run |
| 20 | Minor | A11y / Visual | detail comparison | ≥860 | Look at the Table/Bars toggle | Selected state announced; "Bars" shows bars | No `aria-pressed` or `aria-selected`; state is fill colour only, and in dark mode the two look near-identical. The default "Bars" view has no bars (it's a text list). | `08-comparison-rank-row.png` |
| 21 | Minor | Visual / Copy | detail comparison | all | Casey vs Wyndham | Values labelled | "Rank of 79" shows a bare "9" over "35" with no "here / in Wyndham" suffix, unlike every other row. | same |
| 22 | Minor | Copy | results | all | Look at rows 1–8 | Headline tells areas apart | Eight rows in a row read "1 in 3" (30.0%–37.9%). The rounding throws away the difference. | sweep |
| 23 | Minor | A11y | `/results` | all | Screen reader | Jump area to area | Rows are `<article>`s with no heading and no list semantics, so screen reader users can't skip between areas. | a11y tree |
| 24 | Minor | Functional | `/results` | all | On `/results#…`, change the hash in the same tab (for example, follow another share link) | Results update, or invalid-link for garbage | The hash is only read `onMounted`: the old answers stay on screen, and `#garbage` stays on `/results#garbage`. | functional run |
| 25 | Minor | Functional | decoder | all | Open `#pps.10-20.024970.-.asa`, `…2497e1…`, or current = work | Reject non-canonical links | All accepted, because `Number()` takes leading zeros and exponents. Harmless (it restores valid state) but loose. `0x6112` happens to be rejected only because it decodes to a non-existent code. | tamper run |
| 26 | Minor | Functional | `/results` | all | Load `/results` with no fragment | Clearly empty state | "79 areas, ranked for you" with "No strong priorities" and a full ranking, when nothing was answered (expected per the brief, but it reads as personalised). | sweep |
| 27 | Minor | UX | `/location` | all | A Kingston or Mornington Peninsula resident browses by region | Their area is under "South" | Both are under **East**; Bayside is under **Inner**. Search mitigates this. "Hume" is also both a regional tile and a metro area. | groupings |
| 28 | Minor | A11y | `/invalid-link` | all | Screen reader | Decorative "!" hidden | Read aloud as "!" (not `aria-hidden`). Colour is `#2F5675`, not red. | a11y tree |
| 29 | Minor | A11y | contrast (non-text) | both | Token audit | 3:1 for UI boundaries | Input/secondary-button border `#98A4B2` 2.19:1 on bg (dark `#47545F` 2.25:1); missing-card dashed border 1.53:1 (dark 1.67); lightest data colour `#7FA8C9` 2.37–2.52:1 (dark `#3F6685` 2.39); header-band chip outline 2.16:1. **All text pairs pass AA.** | `contrast.py` |
| 30 | Minor | UX / PWA | all | iOS Safari | — | Install guidance on iPhone | iOS never fires `beforeinstallprompt`, so iPhone users (likely much of the audience) get no install path even after #3 is fixed. Consider a short "Add to Home Screen" hint for iOS. | code |
| 31 | Minor | Visual | detail | 390 vs 1280 | Compare | Same facts on both | "Total score" is shown on desktop but hidden on mobile. On desktop the rank and residents line sit in the left column, split from the area name in the right. | sweep |
| 32 | Minor | A11y | detail chart | all | Screen reader vs visual | Same comparison | The aria-label compares with the first point ("fell from 23.1% five years ago") while the caption compares with the average ("Down from around 19.1% on average"). | a11y tree |
| 33 | Minor | Functional | 7 of 11 screens | all | Look for the ◑/☀ button | Toggle on every screen (brief §4.12) | Present only on intro, results, area detail and invalid-link. **Missing on** `/income`, `/location`, `/location/area`, `/priorities`, `/share`, `/faq`, `/results/print`. The chosen theme does carry across those pages. | f3 run |
| 34 | Minor | Visual | all | dark | Choose dark, then reload any page | No flash | The served HTML has no `data-theme` and no inline theme script, so the page paints in the light cream (`#F2EEE8`) until hydration, then switches to dark. At night that's a bright flash on every load. | theme run |
| 35 | Minor | UX | all | OS dark mode | First visit on a phone set to dark mode | Follows the system setting until the user chooses | Always starts light; `prefers-color-scheme` is ignored. The "at night on a phone" user is the one most likely to have system dark mode on. | theme run |

---

## 3. Copy edits

| Where | Current | Suggested |
|---|---|---|
| Income, step 1 | "This sets the income your rent gets measured against." | *(if income stays unused)* "This tells us which rentals to count as affordable." Or wire it in (#4). |
| Rows, detail hero, FAQ | "affordable on your income" | "affordable on a Centrelink income" (until income affects the figure) |
| FAQ `#affordable` | "We look at the rentals **advertised** in each area…" | "We look at new leases signed in each area last quarter…" (DFFH counts bond lodgements, and the detail page already says "new lettings") |
| Share box | "There's nothing personal in the link. It holds your payment type, income band, areas and priorities as short codes. No name, no account, nothing that identifies you." | "Your link holds your payment type, income range, areas and priorities, as short codes. It has no name or contact details. Only send it to people you'd tell those things to." |
| Missing-data card | "We don't have parks data for this area, the source only covers metro Melbourne. This factor was left out of the score rather than counted as zero." | "There's no parks data for this area. The source only covers metro Melbourne." *(drop the score claim; see #8)* |
| Missing-data card | "Same source, same gap. Not counted in the score." | "This comes from the same metro-only source, so there's no data here either." |
| FAQ `#missing` | "…leave those factors out of the score." | "…say there's no data. Parks and sports aren't part of anyone's score yet." |
| Detail hero (Melbourne) | "That's the 79th highest share of the 79 areas." | "That's the lowest share of any area in Victoria." |
| Detail hero (general) | "That's the 50th highest share of the 79 areas." | "That ranks 50th of 79 areas for affordable rentals." |
| Chart caption | "Down from around 19.1% on average to 17.4% now." | "Now 17.4%, below its five-year average of 19.1%." |
| Score breakdown | "17.4% of new rentals · half of the total score" | "17.4% of new rentals. This counts for half the score." |
| Steadiness on near-zero areas | "and that has held steady for five years" / "Very steady" (Melbourne, 1.2%) | "and that has barely changed in five years" / "Hardly changes". "Steady" reads as good news when it's steadily unaffordable. |
| Row sentences | "Schools are thin on the ground, with 27 schools." | "Fewer schools than most areas (27)." |
| Intro | "Answer four short questions…" | Match the step labels (see #17). |
| Print sheet | *(no suggestion line)* | Add "This is a suggestion, not an answer." under the title. The printout is the version most likely to be read out of context, by a support worker. |
| Print sheet | "ranked 1 of 79" | "Ranked 1st of 79" |
| Comparison | Rank row "9 / 35" | "9th here / 35th in Wyndham" |
| Comparison toggle | "Bars" | "List" (it has no bars) |
| Results sidebar (no answers) | "—" | "Not answered" |
| FAQ `#sources` | Lists offence rates and "disadvantage" (neither is shown in the UI); omits the parks/sports source that the missing-data cards reference | List only what's displayed, and name the parks and sports source (VPA / Data Vic). |

---

## 4. What passed / what I couldn't test

**Passed**

- **Intro:** content, Start button legible in both themes (white on terracotta 5.76:1; dark text on orange 6.20:1), routing.
- **Income:** 5 radios, Continue disabled until chosen and doesn't navigate while disabled, optional dropdown works empty, "Why not others?" opens `/faq#payments` expanded and in view.
- **Location:** tile counts (10/9/8/4/9/11/10/12/6 = 79); search "wynd" → "1 of 79 areas matches", "zzz" → no-match message with Continue disabled, clear (×) works, case- and whitespace-insensitive; the URL never changes.
- **Area:** `?region=Nonsense` and a missing param show a friendly message, no crash.
- **Priorities:** all three expected splits exact (50/17/17/16, 50/19/12/19, 50/7/22/21), live, always 100%; selected state isn't colour-only.
- **Results:** 10 rows then "Show the remaining 69 areas" → 79; ranks 1–79 unique and in order; scores never increase; one "Where you live now" badge; a real `<table>` with `scope`d headers; "Change answers" keeps answers; changing priorities reorders.
- **Detail:** ordinals correct on all 79 pages; 2 missing-data cards on every regional area and none on metro; comparison only when the current area differs; invalid codes (`999999`, `abc`, `0`, `-1`, `22110.5`) show "We can't find that area".
- **Share:** correct fragment; Copy link writes the clipboard and shows "Copied"; a pasted link restores answers; PDF opens `/results/print#…` in a new tab; the skipped-income link loads results.
- **Print:** no payment type or income anywhere; print button hidden in the printout.
- **Invalid links:** all 7 brief cases, plus 9 of my own (`<img>` payload, 5,000 chars, double `#`, spaces, trailing and leading dots, uppercase weights), land on `/invalid-link`; Start over clears state and goes to `/`.
- **Injection:** `<script>`, `onerror` and template payloads in search: nothing executes, nothing stored, the URL is unchanged, and 5,000 characters don't break layout.
- **FAQ:** 8 items, first open, real buttons with `aria-expanded`, Enter and Space work, all 8 anchors open and scroll. It's an accordion (one open at a time).
- **Theme:** the toggle works where it exists, the choice persists across reloads and pages, and dark mode is designed (but see #33–35).
- **Robustness:** rapid double-clicking Continue, back/forward mid-flow, and direct-loading every route: no blank screens, no console output.
- **Privacy:** the only third-party hosts are `fonts.googleapis.com` and `fonts.gstatic.com`; localStorage holds only the theme.
- **Everywhere:** zero console errors, warnings or hydration mismatches across all 156 captures and every scripted run. One `<h1>` per page; `Page | Anchor` titles; brand casing correct; no em-dashes, exclamation marks, jargon or US spellings; no motion (so reduced motion is trivially respected); no spinners. Real IBM Plex and all glyphs (◑ ☀ ← × + −) render correctly on the Mac.

**Not tested**

- **Safari/WebKit and Firefox visual pass.** macOS only lets me view browsers, not drive them, and the sandbox only has Chromium. This matters most because iPhone Safari is probably Lisa's browser. Worth 5 minutes on a real iPhone.
- **Chrome's real print dialog and the DevTools Application panel.** Same restriction. I verified the manifest and service worker by fetching them and querying the SW registration and caches instead, and simulated print with Chromium's A4 PDF output.
- **VoiceOver/NVDA.** Not available; I used the Chromium accessibility tree instead (findings #14, #19, #23, #28, #32).
- **The native share sheet and the installed standalone app** (blocked by #3).

---

## 5. Anything surprising

- **Old share links will restore the wrong area once real data lands. That's my error: the codes came from the placeholder JSON I wrote on 16 Sep.** 71 of 79 fixture areas use invented `900xx` codes (these will fail cleanly to `/invalid-link`). The other 8 look like real ABS codes, and **6 of them are wrong in a way that collides with a different real council**:

  | Fixture | Fixture code | Real code (v2) | Fixture code actually belongs to |
  |---|---|---|---|
  | Wyndham | 24970 | 27260 | **Monash** |
  | Casey | 22110 | 21610 | **East Gippsland** |
  | Greater Bendigo | 22910 | 22620 | **Hepburn** |
  | Hume | 23430 | 23270 | **Kingston** |
  | Melton | 24330 | 24650 | **Maribyrnong** |
  | Cardinia | 20830 | 21450 | **Baw Baw** |

  Latrobe (23810) and Melbourne (24600) are correct. So a link made today with Wyndham as the current area (`#pps.10-20.24970.-.asa`, the QA brief's own example) will, after the data swap, **silently load Monash as "where you live now"**, with no error. The QA brief's test codes will point at different places too. Fixes: add a version marker to the fragment (e.g. `#v1.…`) and reject other versions with the "older version of Anchor" message the invalid-link copy already anticipates, and replace the fixture codes with the real ones from v2 now, before any links circulate.
- **Scoring uses raw counts, not per-capita.** Schools and stations are normalised as raw counts, so big councils win: Casey (365k residents) gets "plenty of schools (99)", while small shires get "thin on the ground". The team agreed schools would be per-capita (Khalid, 10 Sep).
- **The "why" sentence ignores the user's weights.** It picks the factor with the highest or lowest raw score. Someone who set Schools to "Not much" still reads "It has plenty of schools".

---

## 6. Real data check: `master_data_v2.json` vs the app

Read-only look at `~/Downloads/OneDrive_1_21-09-2026/`. 79 rows, unique codes 20110–27630, no NaNs; the four new median-rent columns have many nulls.

| App expects (`anchor-lgas.json`) | v2 has | Action |
|---|---|---|
| `affordability_pct_latest` (0–100) | `affordability_pct` (**0–1**) | Rename **and ×100**, or 0.385 renders as "0.4%" and "Under 1 in 100" |
| `affordability_pct_5yr_avg`, `_5yr_stddev`, `affordability_series_5yr[20]` | — | **Missing.** Steadiness words, the stability sentence, the chart and the 5-year average all have no source. |
| — | `affordability_trend` (−0.446 to +0.321) | Meaning undocumented; not a stddev or series |
| `train_station_count` | `station_count` | Rename |
| `gp_bulk_billing_rate` | `bulk_billing_rate` | Rename |
| `irsd_score` / `irsd_decile` | `seifa_irsd` (score only) | Rename (not shown in the UI anyway) |
| `region`, `subregion` | — | **Missing.** The step 2 picker depends on them. It's a static lookup the app could own. |
| `population` | — | Missing; shown on the detail page |
| `open_space_*`, `sports_facility_count` | — | Missing |
| — | `flat_1br/2br_median`, `house_2br/3br_median` | New and unused. Nulls: 37 / 24 / 26 / 7 of 79. |

Data-quality flags to raise with the team:

- **"Merri-bek" becomes "Moreland".** `join.py`'s `name_fixes` maps `"Merri-Bek": "Moreland"`, reverting the council's 2022 rename. Anyone searching "merri" would find nothing.
- **Exactly 0% (Bayside, Queenscliffe) and exactly 100% (West Wimmera, Yarriambiack) affordability.** These look like tiny-sample artefacts. The app would rank West Wimmera near the top. 16 areas are ≥50%, so the "Over half" copy branch, which the fixture never exercised, becomes common, and 100% would read "Over half".
- **Wyndham 48.9% vs Casey 2.7%.** Two comparable outer-growth councils, 18× apart. Worth sanity-checking the source or join before the demo. I'm not claiming it's wrong, only that it'll be the first thing a panel member asks about.
- **`join.py` merges on name only**, though the affordability and SEIFA files both carry `lga_code`. Khalid's own data-sources note recommends joining on codes.
- **`join.py` writes `master_data.json`, not v2.** The script that added median rent isn't in the folder, so v2 can't be reproduced from these files.
