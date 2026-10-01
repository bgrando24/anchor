/**
 * The quarterly affordable-lettings series, loaded on demand.
 *
 * The file is about 180 KB of numbers, so it is pulled in with a dynamic import rather than
 * bundled with the area list that every page needs. Importing it (rather than fetching the
 * JSON at runtime) matters: the service worker precaches scripts, not JSON, so this way the
 * chart still works offline.
 *
 * Shares are stored as tenths of a percent to keep the file small; everything this module
 * hands back is a plain percentage.
 */

export type BedroomKey = 'all' | 'br1' | 'br2' | 'br3' | 'br4'

/** The sizes offered in the UI. One-bedroom data is too thin per quarter to chart. */
export const BEDROOM_FILTERS: { key: BedroomKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'br2', label: '2 bed' },
  { key: 'br3', label: '3 bed' },
  { key: 'br4', label: '4 bed' }
]

interface RawSeries {
  /** Count of new lettings that were affordable. */
  n: number[]
  /** That share, in tenths of a percent. */
  pct: number[]
}

interface SeriesFile {
  quarters: string[]
  bedrooms: BedroomKey[]
  series: Record<string, Record<BedroomKey, RawSeries>>
}

export interface AreaSeries {
  /** Quarter labels, oldest first, e.g. "Mar 2000". */
  quarters: string[]
  /** The affordable share per quarter, as a percentage. */
  shares: number[]
  /** The affordable count per quarter. */
  counts: number[]
}

let loaded: SeriesFile | null = null
let loading: Promise<SeriesFile> | null = null

export async function loadAffordabilitySeries(): Promise<SeriesFile> {
  if (loaded) return loaded
  if (!loading) {
    loading = import('~/data/affordability-series.json')
      .then((module) => {
        loaded = module.default as unknown as SeriesFile
        return loaded
      })
      .catch((error) => {
        loading = null
        throw error
      })
  }
  return loading
}

export function areaSeries(file: SeriesFile, code: number, bedrooms: BedroomKey = 'all'): AreaSeries | null {
  const block = file.series[String(code)]?.[bedrooms]
  if (!block) return null
  return {
    quarters: file.quarters,
    shares: block.pct.map((tenths) => tenths / 10),
    counts: block.n
  }
}

/**
 * Pools four quarters at a time, so a small area's line follows its underlying rate instead of
 * the sampling noise of 20-odd lettings a quarter. Pooling the counts rather than averaging the
 * shares weights each quarter by how many lettings it actually had.
 *
 * A quarter with no affordable lettings gives no way to recover how many lettings there were, so
 * those quarters contribute nothing to the window and the raw share is kept where a window is
 * empty.
 */
export function pooledShares(series: AreaSeries, window = 4): number[] {
  const totals = series.shares.map((share, i) => (share > 0 ? series.counts[i]! / (share / 100) : null))
  return series.shares.map((share, i) => {
    const from = Math.max(0, i - window + 1)
    let affordable = 0
    let lettings = 0
    for (let j = from; j <= i; j++) {
      const total = totals[j]
      if (total == null) continue
      affordable += series.counts[j]!
      lettings += total
    }
    if (lettings <= 0) return share
    return Math.round((affordable / lettings) * 1000) / 10
  })
}

/**
 * "rose"/"fell"/"stayed about the same" between two points.
 *
 * The deadband is proportional by default, because a fixed one misreads both ends of this
 * data: half a point is nothing to an area that leases 74% affordably, and everything to one
 * sitting near zero. Ballarat moved 73.8% to 73.3% across 25 years and was being reported as
 * a fall.
 */
export function trendWord(from: number, to: number, deadband = Math.max(1, from * 0.05)) {
  const diff = to - from
  if (Math.abs(diff) < deadband) return 'stayed about the same' as const
  return diff < 0 ? ('fell' as const) : ('rose' as const)
}

export interface Trend {
  /** The share at the start of the window, averaged over a year. */
  from: number
  /** The share now, averaged over a year. */
  to: number
  fromLabel: string
  toLabel: string
  word: 'rose' | 'fell' | 'stayed about the same'
  /** The year the window opens in, for copy: "since 2020". */
  fromYear: string
}

const QUARTERS_PER_YEAR = 4

/**
 * The direction over a window, with both ends averaged across a year so a single quarter cannot
 * set it. Pass no year count for the whole series.
 *
 * Two windows are worth showing: the whole run says what has happened to affordability, and the
 * last five years say whether that is still happening. Five years rather than three, because the
 * series bottomed out in 2022 and measuring from a trough reports almost every area as rising.
 */
export function trendOver(series: AreaSeries, years?: number): Trend {
  const length = series.shares.length
  const span = Math.min(QUARTERS_PER_YEAR, Math.max(1, Math.floor(length / 2)))
  const start = years === undefined ? 0 : Math.max(0, Math.min(length - span, length - years * QUARTERS_PER_YEAR))
  const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length
  const from = Math.round(mean(series.shares.slice(start, start + span)) * 10) / 10
  const to = Math.round(mean(series.shares.slice(-span)) * 10) / 10
  const fromLabel = series.quarters[start]!
  return {
    from,
    to,
    fromLabel,
    toLabel: series.quarters[length - 1]!,
    word: trendWord(from, to),
    fromYear: fromLabel.split(' ')[1] ?? fromLabel
  }
}
