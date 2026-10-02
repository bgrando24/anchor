import type { ScoredLga } from './useScoring'

/**
 * This area against the one the household lives in now.
 *
 * The sentence carries the meaning and the arrow only repeats it, so the arrow is hidden from
 * screen readers. Where either side has no figure the row says so rather than implying a
 * direction from a missing number.
 */

export type ComparisonDirection = 'up' | 'down' | 'same' | 'unknown'

export interface ComparisonRow {
  key: string
  /** What the difference is, in words. */
  headline: string
  /** The two figures behind it. */
  detail: string
  direction: ComparisonDirection
}

const NO_DATA = 'No data for one of them'

function plural(n: number, singular: string, pluralForm = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

export function comparisonRows(area: ScoredLga, current: ScoredLga, bedrooms: number): ComparisonRow[] {
  const here = current.lga_name
  const rows: ComparisonRow[] = []

  // Rank: a smaller number is a better fit, so "higher" means nearer the top of the list.
  rows.push({
    key: 'rank',
    headline:
      area.rank === current.rank
        ? `Same as ${here}`
        : area.rank < current.rank
          ? 'Ranked higher for you'
          : 'Ranked lower for you',
    detail: `${ordinalOf(area.rank)} here, ${ordinalOf(current.rank)} for ${here}`,
    direction: area.rank === current.rank ? 'same' : area.rank < current.rank ? 'up' : 'down'
  })

  // Rent
  if (area.rentPerWeek == null || current.rentPerWeek == null) {
    rows.push({
      key: 'rent',
      headline: NO_DATA,
      detail: `No typical ${bedrooms}-bedroom rent for one of these areas`,
      direction: 'unknown'
    })
  } else {
    const diff = area.rentPerWeek - current.rentPerWeek
    rows.push({
      key: 'rent',
      headline: diff === 0 ? `Same as ${here}` : `$${Math.abs(diff)} a week ${diff < 0 ? 'cheaper' : 'dearer'}`,
      detail: `$${area.rentPerWeek} a week here, $${current.rentPerWeek} in ${here}`,
      direction: diff === 0 ? 'same' : diff < 0 ? 'down' : 'up'
    })
  }

  // Share of income
  if (area.rentSharePct == null || current.rentSharePct == null) {
    rows.push({
      key: 'share',
      headline: NO_DATA,
      detail: `We can't work out the share for one of these areas`,
      direction: 'unknown'
    })
  } else {
    const diff = area.rentSharePct - current.rentSharePct
    rows.push({
      key: 'share',
      headline:
        diff === 0
          ? `Same as ${here}`
          : `${plural(Math.abs(diff), 'point')} ${diff < 0 ? 'less' : 'more'} of your income`,
      detail: `${area.rentSharePct}% here, ${current.rentSharePct}% in ${here}`,
      direction: diff === 0 ? 'same' : diff < 0 ? 'down' : 'up'
    })
  }

  // Counts
  for (const [key, label, singular] of [
    ['schools', 'school_count', 'school'],
    ['stations', 'station_count', 'train station']
  ] as const) {
    const a = area[label] as number
    const b = current[label] as number
    const diff = a - b
    rows.push({
      key,
      headline:
        diff === 0 ? `Same as ${here}` : `${plural(Math.abs(diff), singular)} ${diff > 0 ? 'more' : 'fewer'}`,
      detail: `${a} here, ${b} in ${here}`,
      direction: diff === 0 ? 'same' : diff > 0 ? 'up' : 'down'
    })
  }

  // Rates: the points difference is small and noisy, so the words stay qualitative.
  const gpHere = Math.round(area.bulk_billing_rate * 100)
  const gpThere = Math.round(current.bulk_billing_rate * 100)
  rows.push({
    key: 'gp',
    headline:
      gpHere === gpThere ? `Same as ${here}` : `${gpHere > gpThere ? 'More' : 'Fewer'} GP visits bulk-billed`,
    detail: `${gpHere}% here, ${gpThere}% in ${here}`,
    direction: gpHere === gpThere ? 'same' : gpHere > gpThere ? 'up' : 'down'
  })

  return rows
}

/** Kept local so this module has no dependency on the scoring helpers. */
function ordinalOf(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  const rem10 = n % 10
  if (rem10 === 1) return `${n}st`
  if (rem10 === 2) return `${n}nd`
  if (rem10 === 3) return `${n}rd`
  return `${n}th`
}
