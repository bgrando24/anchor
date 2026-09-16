import { useLgaData, type Lga } from './useLgaData'
import type { AnchorWeights } from './useAnchorState'
import type { PriorityTier } from '~/data/options'

export interface ScoredLga extends Lga {
  rank: number
  scoreWeights: { affordability: number; schools: number; transport: number; gp_access: number }
  scores: { affordability: number; schools: number; transport: number; gp_access: number; total: number }
}

const TIER_WEIGHT: Record<PriorityTier, number> = { not_much: 1, somewhat: 2, a_lot: 3 }

/**
 * Rent affordability is always half the score (§3 of the flow, non-negotiable).
 * The other half splits across schools/transport/GP access proportional to how much
 * the user said each mattered (not much=1, somewhat=2, a lot=3 relative weight),
 * rounded to whole percent points that still sum to exactly 50.
 */
export function computeFactorWeights(weights: AnchorWeights) {
  const keys = ['schools', 'transport', 'gp_access'] as const
  const tierVals = keys.map((k) => TIER_WEIGHT[weights[k]])
  const sum = tierVals.reduce((a, b) => a + b, 0)
  const raw = tierVals.map((v) => (v / sum) * 50)
  const floors = raw.map(Math.floor)
  let remainder = 50 - floors.reduce((a, b) => a + b, 0)
  const order = raw
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac)
  const result = [...floors]
  for (let k = 0; k < remainder; k++) result[order[k]!.i]!++

  return {
    affordability: 50,
    schools: result[0]!,
    transport: result[1]!,
    gp_access: result[2]!
  }
}

function minMax(values: number[]) {
  return { min: Math.min(...values), max: Math.max(...values) }
}

function normalize(range: { min: number; max: number }, v: number) {
  if (range.max === range.min) return 10
  return ((v - range.min) / (range.max - range.min)) * 10
}

/** Ranks all 79 LGAs against the given priority weights. Pure function of the fixture + weights. */
export function useScoring() {
  const { all } = useLgaData()

  const ranges = {
    affordability: minMax(all.map((l) => l.affordability_pct_latest)),
    schools: minMax(all.map((l) => l.school_count)),
    transport: minMax(all.map((l) => l.train_station_count)),
    gp_access: minMax(all.map((l) => l.gp_bulk_billing_rate))
  }

  function rankAll(weights: AnchorWeights): ScoredLga[] {
    const w = computeFactorWeights(weights)
    const scored = all.map((l) => {
      const affordability = normalize(ranges.affordability, l.affordability_pct_latest)
      const schools = normalize(ranges.schools, l.school_count)
      const transport = normalize(ranges.transport, l.train_station_count)
      const gp_access = normalize(ranges.gp_access, l.gp_bulk_billing_rate)
      const total =
        affordability * (w.affordability / 100) +
        schools * (w.schools / 100) +
        transport * (w.transport / 100) +
        gp_access * (w.gp_access / 100)
      return {
        ...l,
        rank: 0,
        scoreWeights: w,
        scores: { affordability, schools, transport, gp_access, total }
      } satisfies ScoredLga
    })
    scored.sort((a, b) => b.scores.total - a.scores.total)
    scored.forEach((l, i) => (l.rank = i + 1))
    return scored
  }

  function scoreOne(lga: Lga, weights: AnchorWeights): ScoredLga {
    return rankAll(weights).find((l) => l.lga_code === lga.lga_code)!
  }

  return { rankAll, scoreOne, ranges }
}

export function oneIn(pct: number): string {
  if (pct <= 0.5) return 'Almost none'
  const n = Math.max(1, Math.round(100 / pct))
  return n === 1 ? 'Almost all' : `1 in ${n}`
}

export function pctLabel(pct: number): string {
  return `${pct.toFixed(1)}%`
}

export function stabilityLabel(stddev: number): string {
  if (stddev < 2.5) return 'held steady for five years'
  if (stddev < 4.3) return 'fairly steady'
  if (stddev < 6.5) return 'moves a fair bit'
  return 'moves a lot'
}

export function stabilityWord(stddev: number): string {
  if (stddev < 2.5) return 'Very steady'
  if (stddev < 4.3) return 'Fairly steady'
  if (stddev < 6.5) return 'Moves a fair bit'
  return 'Moves a lot'
}

/** A short, plain-English explanation of why an area ranked where it did. */
export function explainRanking(l: ScoredLga, isCurrent: boolean): string {
  const factors = [
    { key: 'schools', label: `${l.school_count} schools`, score: l.scores.schools },
    { key: 'transport', label: `${l.train_station_count} train stations`, score: l.scores.transport },
    {
      key: 'gp_access',
      label: `${Math.round(l.gp_bulk_billing_rate * 100)}% of GP visits bulk-billed`,
      score: l.scores.gp_access
    }
  ]
  const best = factors.reduce((a, b) => (b.score > a.score ? b : a))
  const worst = factors.reduce((a, b) => (b.score < a.score ? b : a))

  const affordSentence = `About ${oneIn(l.affordability_pct_latest)} rentals here were affordable on your income last quarter, and that has ${stabilityLabel(l.affordability_pct_5yr_stddev)}.`

  if (isCurrent) {
    return `This is where you live now. ${affordSentence}`
  }
  if (best.score - worst.score > 3) {
    return `${affordSentence} It has ${best.label}, among the strongest on your list.`
  }
  return affordSentence
}

export interface ComparisonRow {
  label: string
  target: string
  current: string
}

export function compareToCurrent(target: ScoredLga, current: ScoredLga): ComparisonRow[] {
  return [
    { label: 'Rank of 79', target: String(target.rank), current: String(current.rank) },
    {
      label: 'Affordable rentals',
      target: oneIn(target.affordability_pct_latest) + ' here',
      current: oneIn(current.affordability_pct_latest) + ` in ${current.lga_name}`
    },
    { label: 'Schools', target: `${target.school_count} here`, current: `${current.school_count} in ${current.lga_name}` },
    {
      label: 'Train stations',
      target: `${target.train_station_count} here`,
      current: `${current.train_station_count} in ${current.lga_name}`
    },
    {
      label: 'Bulk-billed GP visits',
      target: `${Math.round(target.gp_bulk_billing_rate * 100)}% here`,
      current: `${Math.round(current.gp_bulk_billing_rate * 100)}% in ${current.lga_name}`
    }
  ]
}
