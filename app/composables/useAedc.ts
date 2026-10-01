import type { AedcPoint } from './useLgaData'

/**
 * The Australian Early Development Census: the share of children in their first year of school
 * assessed as developmentally vulnerable in at least one of five domains, collected every three
 * years from their teachers.
 *
 * It describes how children in an area are doing. It is not a measure of the schools, and it is
 * deliberately kept out of the ranking.
 */

/**
 * How far two rounds have to differ before the difference means anything.
 *
 * The smallest areas assess about forty children a round, where a handful of them changes the
 * share by ten points on its own. This is the ninety-five per cent band on the difference between
 * two proportions, so a rise is only called a rise when the cohorts were big enough to show one.
 */
export function noiseBandPp(a: AedcPoint, b: AedcPoint): number {
  const variance = (point: AedcPoint) => {
    if (!point.valid_n || point.valid_n <= 0) return null
    const share = point.vulnerable_pct / 100
    return (share * (1 - share)) / point.valid_n
  }
  const first = variance(a)
  const second = variance(b)
  // Without the cohort sizes there is no way to tell signal from noise; ask for a wide move.
  if (first === null || second === null) return 5
  return 1.96 * Math.sqrt(first + second) * 100
}

export type AedcDirection = 'rose' | 'fell' | 'about the same'

export function aedcDirection(previous: AedcPoint, latest: AedcPoint): AedcDirection {
  const change = latest.vulnerable_pct - previous.vulnerable_pct
  if (Math.abs(change) < noiseBandPp(previous, latest)) return 'about the same'
  return change > 0 ? 'rose' : 'fell'
}

export interface AedcSummary {
  latest: AedcPoint
  previous: AedcPoint | null
  /** Round years, oldest first, for the chart's labels. */
  years: string[]
  /** The vulnerable share per round, oldest first. */
  shares: number[]
  direction: AedcDirection | null
  sentence: string
  /** How many children the latest figure is based on, written out. */
  cohortNote: string
}

const pct = (value: number) => `${value.toFixed(1)}%`

export function summariseAedc(points: AedcPoint[] | null | undefined): AedcSummary | null {
  if (!points || points.length === 0) return null
  const ordered = [...points].sort((a, b) => a.year - b.year)
  const latest = ordered[ordered.length - 1]!
  const previous = ordered.length > 1 ? ordered[ordered.length - 2]! : null
  const direction = previous ? aedcDirection(previous, latest) : null

  const opening = `${pct(latest.vulnerable_pct)} of children starting school in ${latest.year} were assessed as needing extra support in at least one part of their development`
  let sentence = `${opening}.`
  if (previous && direction === 'about the same') {
    sentence = `${opening}, about the same as in ${previous.year}.`
  } else if (previous && direction) {
    // "up from" rather than "rose from", which does not read after the opening clause.
    const word = direction === 'rose' ? 'up' : 'down'
    sentence = `${opening}, ${word} from ${pct(previous.vulnerable_pct)} in ${previous.year}.`
  }

  const cohortNote = latest.valid_n
    ? `Based on ${latest.valid_n.toLocaleString('en-AU')} children in ${latest.year}.`
    : ''

  return {
    latest,
    previous,
    years: ordered.map((p) => String(p.year)),
    shares: ordered.map((p) => p.vulnerable_pct),
    direction,
    sentence,
    cohortNote
  }
}
