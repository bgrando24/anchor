import type { Lga, LgaRent } from './useLgaData'
import type { PriorityTier } from '~/data/options'

// The maths in this file is pure: no Vue, no data import. Pass the areas in.
// Ported from Claude outputs/claude-code-handoff/data/scoring-reference.py, which is the spec.

export type Bedrooms = 1 | 2 | 3
export type Band = 'within' | 'stretch' | 'hard' | 'out' | 'nodata'

export const BAND_ORDER: Band[] = ['within', 'stretch', 'hard', 'out', 'nodata']

const TIER_WEIGHT: Record<PriorityTier, number> = { not_much: 1, somewhat: 3, a_lot: 6 }
export const TIER_CODE: Record<PriorityTier, string> = { not_much: 'n', somewhat: 's', a_lot: 'a' }
export const TIER_FROM_CODE: Record<string, PriorityTier> = { n: 'not_much', s: 'somewhat', a: 'a_lot' }

// Dwelling types with at least N bedrooms, so someone needing 1 can take a cheaper 2-bed flat.
const DWELLINGS_FOR: Record<Bedrooms, (keyof LgaRent)[]> = {
  1: ['flat_1br', 'flat_2br', 'house_2br', 'house_3br'],
  2: ['flat_2br', 'house_2br', 'house_3br'],
  3: ['house_3br']
}

const BAND_LIMITS: { limit: number; band: Band }[] = [
  { limit: 30, band: 'within' },
  { limit: 40, band: 'stretch' },
  { limit: 50, band: 'hard' },
  { limit: Number.POSITIVE_INFINITY, band: 'out' }
]

export interface PriorityWeights {
  schools: PriorityTier
  transport: PriorityTier
  gp_access: PriorityTier
}

/** The lowest published median among dwelling types big enough for this household. */
export function typicalRent(rent: LgaRent, bedrooms: Bedrooms): number | null {
  const values = DWELLINGS_FOR[bedrooms].map((k) => rent[k]).filter((v): v is number => !!v)
  return values.length ? Math.min(...values) : null
}

/** 0..10, higher value ranks higher; tied values share the average of their positions. */
export function percentileRank(values: number[]): number[] {
  const n = values.length
  const out = new Array<number>(n).fill(0)
  if (n === 0) return out
  if (n === 1) return [0]

  const order = values.map((_, i) => i).sort((a, b) => values[a]! - values[b]!)
  let i = 0
  while (i < order.length) {
    let j = i
    while (j + 1 < order.length && values[order[j + 1]!] === values[order[i]!]) j++
    const rank = (((i + j) / 2) / (n - 1)) * 10
    for (let k = i; k <= j; k++) out[order[k]!] = rank
    i = j + 1
  }
  return out
}

export function weightsCode(w: PriorityWeights): string {
  return `${TIER_CODE[w.schools]}${TIER_CODE[w.transport]}${TIER_CODE[w.gp_access]}`
}

/** Splits 50 points between schools, transport and GP by tier, always summing to 50. */
export function prioritySplit(code: string): [number, number, number] {
  const tiers = code.split('').map((c) => TIER_WEIGHT[TIER_FROM_CODE[c]!]!)
  const total = tiers.reduce((a, b) => a + b, 0)
  const raw = tiers.map((t) => (t / total) * 50)
  const points = raw.map(Math.floor)
  const remainder = 50 - points.reduce((a, b) => a + b, 0)
  const byFraction = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac)
  for (let k = 0; k < remainder; k++) points[byFraction[k]!.i]!++
  return [points[0]!, points[1]!, points[2]!]
}

/** The full split shown to the user. Rent is fixed at 50. */
export function scoreSplit(w: PriorityWeights) {
  const [schools, transport, gp_access] = prioritySplit(weightsCode(w))
  return { rent: 50, schools, transport, gp_access }
}

export function bandFor(sharePct: number | null): Band {
  if (sharePct == null) return 'nodata'
  return BAND_LIMITS.find((b) => sharePct <= b.limit)!.band
}

export interface FactorRanks {
  rent: number | null
  schools: number
  transport: number
  gp_access: number
}

export interface ScoredLga extends Lga {
  rank: number
  band: Band
  rentPerWeek: number | null
  rentSharePct: number | null
  score: number
  ranks: FactorRanks
  split: { rent: number; schools: number; transport: number; gp_access: number }
}

export interface RankOptions {
  weeklyIncome: number
  bedrooms: Bedrooms
  weights: PriorityWeights
}

export function rankAreas(areas: Lga[], options: RankOptions): ScoredLga[] {
  const { weeklyIncome, bedrooms, weights } = options
  const code = weightsCode(weights)
  const [wSchools, wTransport, wGp] = prioritySplit(code)

  const rents = areas.map((a) => typicalRent(a.rent, bedrooms))
  const withRent = rents.map((r, i) => (r ? i : -1)).filter((i) => i >= 0)
  const rentRanks = percentileRank(withRent.map((i) => -rents[i]!))
  const rentRankByIndex = new Map<number, number>()
  withRent.forEach((areaIndex, k) => rentRankByIndex.set(areaIndex, rentRanks[k]!))

  // v2 has no population, so schools and stations are ranked on raw counts. When the data team
  // supplies population, this switches to per-10,000 residents and the test vectors need redoing.
  const hasPopulation = areas.every((a) => typeof a.population === 'number' && a.population > 0)
  const per10k = (value: number, a: Lga) => (hasPopulation ? (value / a.population!) * 10000 : value)

  const schoolRanks = percentileRank(areas.map((a) => per10k(a.school_count, a)))
  const stationRanks = percentileRank(areas.map((a) => per10k(a.station_count, a)))
  const gpRanks = percentileRank(areas.map((a) => a.bulk_billing_rate))

  const split = { rent: 50, schools: wSchools, transport: wTransport, gp_access: wGp }

  const scored: ScoredLga[] = areas.map((a, i) => {
    const ranks: FactorRanks = {
      rent: rentRankByIndex.get(i) ?? null,
      schools: schoolRanks[i]!,
      transport: stationRanks[i]!,
      gp_access: gpRanks[i]!
    }
    // 0..5: the half of the score the user controls.
    const priorities = (ranks.schools * wSchools + ranks.transport * wTransport + ranks.gp_access * wGp) / 100

    const rentPerWeek = rents[i]!
    let rentSharePct: number | null = null
    let score = priorities
    if (rentPerWeek && weeklyIncome > 0) {
      rentSharePct = Math.round((rentPerWeek / weeklyIncome) * 100)
      score = ranks.rent! * 0.5 + priorities
    }

    return {
      ...a,
      rank: 0,
      band: bandFor(rentPerWeek ? rentSharePct : null),
      rentPerWeek: rentPerWeek ?? null,
      rentSharePct,
      score: Math.round(score * 10000) / 10000,
      ranks,
      split
    }
  })

  scored.sort((a, b) => {
    const band = BAND_ORDER.indexOf(a.band) - BAND_ORDER.indexOf(b.band)
    if (band !== 0) return band
    if (b.score !== a.score) return b.score - a.score
    return a.lga_name.localeCompare(b.lga_name)
  })
  scored.forEach((s, i) => (s.rank = i + 1))
  return scored
}

// ---- Presentation helpers -------------------------------------------------

export function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  const mod10 = n % 10
  if (mod10 === 1) return `${n}st`
  if (mod10 === 2) return `${n}nd`
  if (mod10 === 3) return `${n}rd`
  return `${n}th`
}

export function bedroomWord(bedrooms: Bedrooms): string {
  return `${bedrooms}-bedroom`
}

/** 0 and 100 read as words; everything else as "About 1 in n". */
export function lettingsLabel(pct: number): string {
  if (pct <= 0) return 'None'
  if (pct >= 100) return 'All'
  return `About 1 in ${Math.max(1, Math.round(100 / pct))}`
}

const HIGH = 20 / 3 // top third of the ranked areas
const LOW = 10 / 3 // bottom third

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/**
 * At most one sentence, about a factor the user rated "A lot" (else "Somewhat"), picking the
 * factor where this area sits furthest from the middle. Nothing for the middle third.
 */
export function rowSentence(area: ScoredLga, weights: PriorityWeights): string | null {
  const tier: PriorityTier = (['schools', 'transport', 'gp_access'] as const).some((k) => weights[k] === 'a_lot')
    ? 'a_lot'
    : (['schools', 'transport', 'gp_access'] as const).some((k) => weights[k] === 'somewhat')
      ? 'somewhat'
      : 'not_much'
  if (tier === 'not_much') return null

  const gpPct = Math.round(area.bulk_billing_rate * 100)
  const candidates = (['schools', 'transport', 'gp_access'] as const)
    .filter((k) => weights[k] === tier)
    .map((key) => {
      const rank = area.ranks[key]
      const high = rank >= HIGH
      const low = rank <= LOW
      let text: string | null = null
      if (key === 'schools') {
        if (high) text = `More schools than most areas (${area.school_count}).`
        else if (low) text = `Fewer schools than most areas (${area.school_count}).`
      } else if (key === 'transport') {
        if (high) text = `More train stations than most areas (${area.station_count}).`
        else if (low) text = area.station_count === 0 ? 'No train stations.' : `Fewer train stations than most areas (${area.station_count}).`
      } else {
        if (high) text = `Most GP visits here are bulk-billed (${gpPct}%).`
        else if (low) text = `GP visits here are bulk-billed less often than most areas (${gpPct}%).`
      }
      return { text, distance: Math.abs(rank - 5) }
    })
    .filter((c) => c.text)

  if (!candidates.length) return null
  return candidates.reduce((a, b) => (b.distance > a.distance ? b : a)).text!
}

export function stationLabel(n: number): string {
  return n === 0 ? 'No train stations' : plural(n, 'train station')
}
