"""
Reference implementation of Anchor's ranking model (v2).
Port this to TypeScript (app/composables/useScoring.ts). It is the source of truth for
behaviour; scoring-test-vectors.json was produced by running it on master_data_v2.json.

Run:  python3 scoring-reference.py master_data_v2.json

Model, in one paragraph:
  1. Weekly income = Centrelink payment (max rate, per week) + midpoint of the other-income band.
  2. For each area, "typical rent" = the lowest non-null median among dwelling types with AT LEAST
     the bedrooms the user needs (so a 1-bed user can take a 2-bed flat if it's cheaper).
  3. Rent share = typical rent / weekly income, rounded HALF UP to a whole percent (Math.round). The band comes from
     the ROUNDED percent so the number on screen never contradicts its heading.
  4. Bands, in display order: <=30 "within", 31-40 "stretch", 41-50 "hard", >50 "out", no rent "nodata".
  5. Each factor becomes a 0-10 percentile rank across all 79 areas (ties share the average rank).
     Percentile ranks stop a few extreme values (e.g. 0% or 100% affordable) dominating.
     Rent: lower rent is better, ranked only among areas that have rent data.
  6. Score = 0.5 * rent rank + 0.5 * priorities, where priorities split 50 points by tier
     weights Not much=1, Somewhat=3, A lot=6 (largest-remainder rounding, always sums to 50).
     Areas with no rent data are scored on priorities only and always listed last.
  7. Sort by band, then score (desc), then area name (asc) as the final tie-break.

Schools and stations use raw counts here because master_data_v2 has no population column.
When population is added, switch to per-10,000-residents BEFORE percentile ranking and
regenerate the test vectors.
"""
import json, math, sys

TIER_WEIGHT = {"n": 1, "s": 3, "a": 6}
DWELLINGS_FOR = {  # dwelling types that have at least N bedrooms
    1: ["flat_1br_median", "flat_2br_median", "house_2br_median", "house_3br_median"],
    2: ["flat_2br_median", "house_2br_median", "house_3br_median"],
    3: ["house_3br_median"],
}
BANDS = [(30, "within"), (40, "stretch"), (50, "hard"), (10**9, "out")]
BAND_ORDER = ["within", "stretch", "hard", "out", "nodata"]


def typical_rent(area, bedrooms):
    values = [area[k] for k in DWELLINGS_FOR[bedrooms] if area.get(k)]
    return min(values) if values else None


def percentile_rank(values):
    """0..10, higher value = higher rank; ties get the average of their positions."""
    order = sorted(range(len(values)), key=lambda i: values[i])
    out = [0.0] * len(values)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
            j += 1
        rank = ((i + j) / 2) / (len(values) - 1) * 10
        for k in range(i, j + 1):
            out[order[k]] = rank
        i = j + 1
    return out


def priority_split(weights_code):
    """'asa' -> [schools, transport, gp] points summing to 50."""
    tiers = [TIER_WEIGHT[c] for c in weights_code]
    raw = [t / sum(tiers) * 50 for t in tiers]
    floors = [int(r) for r in raw]
    by_fraction = sorted(range(3), key=lambda i: -(raw[i] - floors[i]))
    for k in by_fraction[: 50 - sum(floors)]:
        floors[k] += 1
    return floors


def rank_areas(data, weekly_income, bedrooms, weights_code):
    rents = [typical_rent(a, bedrooms) for a in data]
    with_rent = [i for i, r in enumerate(rents) if r]
    rent_rank = dict(zip(with_rent, percentile_rank([-rents[i] for i in with_rent])))
    schools = percentile_rank([a["school_count"] for a in data])
    stations = percentile_rank([a["station_count"] for a in data])
    gp = percentile_rank([a["bulk_billing_rate"] for a in data])
    w_s, w_t, w_g = priority_split(weights_code)

    results = []
    for i, a in enumerate(data):
        priorities = (schools[i] * w_s + stations[i] * w_t + gp[i] * w_g) / 100  # 0..5
        if rents[i]:
            # round half UP, to match JavaScript Math.round (Python round() is half-to-even)
            share_pct = math.floor(rents[i] / weekly_income * 100 + 0.5)
            band = next(name for limit, name in BANDS if share_pct <= limit)
            score = rent_rank[i] * 0.5 + priorities
        else:
            share_pct, band, score = None, "nodata", priorities
        results.append({
            "lga_code": a["lga_code"], "lga_name": a["lga_name"], "band": band,
            "rent_per_week": rents[i], "rent_share_pct": share_pct, "score": round(score, 4),
        })
    results.sort(key=lambda r: (BAND_ORDER.index(r["band"]), -r["score"], r["lga_name"]))
    for n, r in enumerate(results, 1):
        r["rank"] = n
    return results


if __name__ == "__main__":
    data = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "master_data_v2.json"))
    for inc, beds, w in [(650, 2, "sss"), (650, 2, "ann"), (1000, 2, "nan"), (1200, 3, "asa"), (850, 1, "nsn")]:
        top = rank_areas(data, inc, beds, w)[:10]
        print(f"${inc}/wk, {beds} bed, weights {w}:")
        for r in top:
            print(f"  {r['rank']:2d}. {r['lga_name']:20s} {r['band']:8s} {r['rent_share_pct']}%  ${r['rent_per_week']}  score {r['score']:.2f}")
