# Anchor: copy deck

Use this text **exactly**. Where it says `{something}`, fill it in from data. If you need a string that isn't here, write it in the same style and list it in your summary so Brandon can check it.

## House style

The team found the current copy sounded machine-written. The fix is to be plain and specific.

**Do**
- Say what the tool does or what a number means. Facts beat reassurance.
- Use short sentences and everyday words. Say "rent", "income", "Centrelink payment", "area".
- Use one idea per sentence. Put numbers in digits: "3 train stations", "$360 a week".
- Use Australian spelling.

**Don't**
- "It's not X, it's Y", or any contrast-for-effect construction.
- Lists of three for rhythm ("no account, no sign-up, no tracking").
- Stacked reassurance ("Don't worry", "Nothing was lost", "Safe to…").
- "Just", "simply", "we'd rather", "the point of this tool".
- Colons used for drama, em-dashes, exclamation marks, emoji.
- Jargon: LGA, SEIFA, decile, percentile, normalised, median. Say "typical rent" and explain "typical" once, in the FAQ.
- Repeating the same caveat on every screen. Say it once, where it matters.

---

## Global header (every page)

| Element | Text |
|---|---|
| Wordmark | Logo mark + "ANCHOR" (links to `/`) |
| Help link | "How it works" (with help-circle icon) |
| Theme button, aria-label | "Dark mode" when light is on / "Light mode" when dark is on |

## Intro `/`

| Element | Text |
|---|---|
| H1 | Where in Victoria could you afford to stay? |
| Body 1 | Tell us your Centrelink payment, any other income and how many bedrooms you need. We'll rank all 79 council areas in Victoria by how much of your income the rent would take. |
| Body 2 | It takes about two minutes. |
| Privacy box, title | Your answers stay on this device |
| Privacy box, body | Anchor works out your results in your browser. We don't have accounts and we never see what you enter. |
| Button | Start |
| Footer line | Results are based on public rent, school, transport and health data. |

Install card (only when the browser offers install):

| Element | Text |
|---|---|
| Title | Add Anchor to your home screen |
| Body | Open it like an app, even without internet. |
| Buttons | Add to home screen · Not now |
| iPhone variant body | On iPhone, tap Share, then Add to Home Screen. |

## Step 1 of 4: payment and income `/income`

| Element | Text |
|---|---|
| H1 | Which Centrelink payment do you get? |
| Sub | We use this to estimate your income. |
| Options | JobSeeker Payment · Parenting Payment (single) · Parenting Payment (partnered) · Youth Allowance · Age Pension |
| Link under options | Why only these payments? |
| Label | Do you have any other income? |
| Hint | Include wages, child support and Family Tax Benefit. Choose the closest amount. |
| Select placeholder | Choose an amount |
| Select options | No other income · Under $200 a fortnight · $200 to $500 a fortnight · $500 to $1,000 a fortnight · More than $1,000 a fortnight |
| Privacy line | Your answers aren't sent anywhere. They're only used on this device. |
| Button | Continue |

## Step 2 of 4: bedrooms `/bedrooms` (new)

| Element | Text |
|---|---|
| H1 | How many bedrooms do you need? |
| Sub | We'll compare rents for homes with at least this many bedrooms. |
| Options | 1 bedroom · 2 bedrooms · 3 or more bedrooms |
| Button | Continue |

## Step 3 of 4: current area `/location` and `/location/area`

| Element | Text |
|---|---|
| H1 | Where do you live now? |
| Sub | We'll compare other areas with this one. It doesn't change the ranking. |
| Search label | Search for your area |
| Search placeholder | Type an area name |
| Clear button, aria-label | Clear search |
| Match count | 1 area matches · {n} areas match |
| No match | No area matches "{query}". Check the spelling, or choose a region below. |
| Region section label | Or choose a region |
| Group labels | Melbourne · Regional Victoria |
| Region tile sub | {n} areas |
| Area page chip | {Region} · Change |
| Area page H1 | Which area do you live in? |
| Unknown region | We couldn't find that region. · link: Choose a region |
| Button | Continue |

## Step 4 of 4: priorities `/priorities`

| Element | Text |
|---|---|
| H1 | What matters most to you? |
| Sub | Your answers change the order of the areas. |
| Rent card, title | Rent |
| Rent card, value | Always 50% |
| Rent card, body | How much of your income the rent takes is always half of each area's score. |
| Question 1 | How much do schools matter to you? |
| Q1 hint | Based on the number of schools in each area. |
| Question 2 | How much does being near a train station matter to you? |
| Q2 hint | Based on the number of train stations in each area. |
| Question 3 | How much do bulk-billing doctors matter to you? |
| Q3 hint | Based on how often GP visits in each area are bulk-billed (free). |
| Tier options | Not much · Somewhat · A lot |
| Split box title | How each area is scored |
| Split rows | Rent · Schools · Train stations · Bulk-billing doctors |
| Button | Show my results |

Read each question aloud with an answer: "How much do schools matter to you? A lot." It should sound natural.

## Results `/results`

| Element | Text |
|---|---|
| H1 | 79 areas, ranked for you |
| Sub | Sorted by how much of your income the rent would take, then by what you said matters. |
| Mobile answers summary (plain text, not pills) | {Payment} · {n} bedroom(s) · Lives in {Area} |
| Button | Change answers |
| Header button | Save or share |
| Desktop sidebar headings | Your answers · How each area is scored |
| Sidebar labels | Payment · Other income · Bedrooms · Lives in |
| Sidebar value when unanswered | Not answered |
| Caveat (once, above the list) | Rankings are based on public data. Only you know which areas suit your family. |

**Band headings** (shown as section headings inside the list, in this order; hide empty bands):

| Band | Heading | Line under heading |
|---|---|---|
| within | Rent under 30% of your income | 30% or less is the usual measure of affordable rent. |
| stretch | Rent 31% to 40% of your income | |
| hard | Rent 41% to 50% of your income | |
| out | Rent more than half your income | |
| nodata | No rent data for this home size | Homes Victoria didn't publish a typical rent for these areas. |

**When no area is under 30%** (show above the first band):

> No area has a typical {n}-bedroom rent under 30% of your income. The areas closest to it are listed first.

**Each row**

| Element | Text |
|---|---|
| Headline | {share}% of your income |
| Sub | Typical {n}-bedroom rent: ${rent} a week |
| No-data headline | No rent data |
| Current-area badge | Where you live now |
| Detail link (mobile) | See details for {Area} |
| Show more | Show all 79 areas |
| Table toggle | Show as a table · Show as a list |

**Row sentence**: at most one sentence, about a factor the user rated "A lot" (else "Somewhat"; if all are "Not much", show none). Pick the one where the area is furthest from average. Plural-safe:

| Case | Sentence |
|---|---|
| Schools high | More schools than most areas ({n}). |
| Schools low | Fewer schools than most areas ({n}). |
| Stations high | More train stations than most areas ({n}). |
| Stations low, n ≥ 1 | Fewer train stations than most areas ({n}). |
| Stations = 0 | No train stations. |
| GP high | Most GP visits here are bulk-billed ({p}%). |
| GP low | GP visits here are bulk-billed less often than most areas ({p}%). |

"High" means top third of the 79 areas; "low" means bottom third. The middle third gets no sentence for that factor.

**Results with no answers** (direct visit, no link):

| Element | Text |
|---|---|
| H1 | Answer a few questions first |
| Body | We need your payment, bedrooms and area to rank the areas for you. |
| Button | Start |

## Area detail `/results/{code}`

| Element | Text |
|---|---|
| Rank line | Ranked {ordinal} of 79 |
| Location line | {Melbourne or Regional Victoria} · {Region} region |
| Hero number | {share}% |
| Hero label | of your income for a typical {n}-bedroom rent (${rent} a week) |
| Hero, within band | That's within the 30% usually counted as affordable. |
| Hero, above 30% | That's more than the 30% usually counted as affordable. |
| Hero, no data | We don't have a typical rent for {n}-bedroom homes here. |
| Leases fact, label | New leases affordable on a Centrelink income, last quarter |
| Leases fact, value | About 1 in {n} · None · All (for 0 and 100) |
| Chart title | Share of new leases that were affordable, last 5 years |
| Chart sub | Each point is one quarter. |
| Chart, no series | *(hide the whole section)* |
| Breakdown title | How this area scored |
| Breakdown rows | Rent · Schools · Train stations · Bulk-billing doctors |
| Row sub, rent | ${rent} a week for {n} bedrooms |
| Row sub, schools | {n} schools |
| Row sub, stations | {n} train stations · No train stations |
| Row sub, GP | {p}% of GP visits bulk-billed |
| Comparison title | Compared with {Current area}, where you live now |
| Comparison columns | *(blank)* · {This area} · {Current area} |
| Comparison rows | Rank · Typical {n}-bedroom rent · Share of your income · Schools · Train stations · GP visits bulk-billed |
| Comparison rank cells | {ordinal} (e.g. 9th, 35th) |
| Not found, H1 | We can't find that area |
| Not found, body | The link may be out of date. |
| Not found, button | Back to results |

## Share `/share`

| Element | Text |
|---|---|
| H1 | Save or share your results |
| Body | This link opens your results again on any device. |
| Link label | Your link |
| Buttons | Copy link · Share · Download PDF |
| Copied state | Copied |
| Info box, title | What's in the link |
| Info box, body | The link holds your answers as short codes: your payment, income range, bedrooms, area and priorities. It doesn't include your name or contact details. Only share it with people you're happy to tell those things. |
| PDF note | Download PDF opens a one-page summary you can print or save. It leaves out your payment and income. |
| No answers, H1 | Nothing to save yet |
| No answers, body | Answer the questions first, then you can save your results. |
| No answers, button | Start |

## Print sheet `/results/print`

| Element | Text |
|---|---|
| Title | Your Anchor results |
| Sub | Ranked by how much of your income the rent would take, then by what you said matters. Based on public data. |
| Meta | {date} · Top 5 of 79 areas · {n}-bedroom homes |
| Table headings | Rank · Area · Share of income · Typical rent |
| Footer label | Open these results again |
| Print button (screen only) | Print or save as PDF |

## Invalid link `/invalid-link`

| Element | Text |
|---|---|
| H1 | This link doesn't work |
| Body | It may be incomplete, or made with an older version of Anchor. |
| Button | Start again |
| Note | Results aren't saved anywhere, so you'll need to answer the questions again. It takes about two minutes. |

## Offline band

> You're offline. Pages you've already opened still work.

## FAQ `/faq` ("How it works")

| Element | Text |
|---|---|
| H1 | How it works |
| Sub | How the rankings work, where the data comes from, and what Anchor can't tell you. |
| Back link | Back |

Items, in order (anchor ids in brackets):

1. **How are areas ranked?** (`ranking`)
   Each area gets a score. Half of it comes from how much of your income a typical rent there would take. The other half comes from schools, train stations and bulk-billing doctors, weighted by your answers. Areas are grouped by rent first, then ordered by score within each group.

2. **What counts as affordable?** (`affordable`)
   Rent is usually called affordable when it's 30% of your income or less. We compare the typical weekly rent in each area, for the number of bedrooms you need, with your estimated income. "Typical" means the median: half of new leases cost more and half cost less.

3. **How do you work out my income?** (`income`)
   We add the current maximum rate of your Centrelink payment to the middle of the other-income amount you chose. Your real income may be different, so use the percentages as a guide.

4. **Why only these payments?** (`payments`)
   These are the payments we can estimate. We left out Disability Support Pension and Carer Payment because choosing one would reveal information about your health.

5. **Why is there no rent data for some areas?** (`missing`)
   Homes Victoria doesn't publish a typical rent when too few homes of that size were leased in the quarter. Those areas are listed at the end of your results.

6. **Where does the data come from?** (`sources`)
   Rents: Homes Victoria quarterly rental report ({quarter}). Schools: Victorian Department of Education, school locations 2025. Train stations: Department of Transport and Planning. Bulk-billing: Australian Institute of Health and Welfare analysis of Medicare data. Council areas: Australian Bureau of Statistics.

7. **Is this like Domain or realestate.com.au?** (`listings`)
   No. Anchor doesn't list homes. It compares areas to help you decide where to look. You'd still use a listing site to find a place.

8. **What happens to my answers?** (`privacy`)
   They stay in your browser. There are no accounts and nothing is sent to us. If you save a link, your answers are stored in that link.

9. **What can't Anchor tell you?** (`limits`)
   It doesn't know about your job, your children's schools, family nearby or your health needs. Use the rankings as a starting point.

Remove the separate closing "This is a suggestion, not an answer" box. Item 9 covers it.
